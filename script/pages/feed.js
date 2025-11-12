import { wireLikes, wireComments } from "../utils/interactions.js";
import { setStatus, renderSkeletons} from "../utils/ui.js";
import { classifyPostImages, attachMediaGuards } from "../utils/media.js";
import { mount as mountModal, close as closeModal } from "../utils/modal.js";
import { openSearchModal } from "../utils/search.js";
import { escapeHtml, timeAgo } from "../utils/format.js";
import { searchPosts } from "../api/posts.js";

import { load, logout, save, getLikedSet, saveLikedSet } from "../utils/storage.js";
import { createApiKey } from "../api/auth.js";  
import { getPost, listPosts, createPost, reactToPost, createComment, updatePost, deletePost } from "../api/posts.js";
import { postCard } from "../render/post-card.js";

const user = load();
if (!user?.accessToken) { location.href = "login.html"; }

const username = user?.email || user?.id || user?.name || "anon";
let likedSet = getLikedSet(username) || new Set();

document.getElementById("logoutBtn").addEventListener("click", logout);

async function ensureApiKey() {
    let u = load();
    if (!u?.apiKey) {
        const keyResult =  await createApiKey();
        const apiKey = 
            keyResult?.data?.key ?? 
            keyResult?.data?.apiKey ??
            keyResult?.key ??
            keyResult?.apiKey;
            if (apiKey) {
                save({ ...u, apiKey });
                u = load();
            }
        }
    return u;
}

const titleEl = document.querySelector("[data-greeting]");
const feedEl = document.querySelector("[data-feed]");
const statusEl = document.querySelector("[data-status]");

const modalRoot = document.getElementById("modal-root");
const discoverBtn = document.getElementById("discoverBtn");
const searchBtn = document.querySelector(".bottom-nav [data-tab='search']");

// Modal

if (modalRoot) mountModal(modalRoot);
if (titleEl) titleEl.textContent = user?.name ? `${user.name}` : "Friend";

// Discover

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function loadDiscover() {
    try {
        setStatus(statusEl, "Loading discover", 900);
        renderSkeletons(feedEl, 3);
        const data = await listPosts({ limit: 100, sort: "reactions", sortOrder: "desc" });
        const posts = (data?.data ?? data ?? []);
        renderPosts(shuffle(posts).slice(0, 20));
    } catch (error) {
        setStatus(statusEl, error.message || "Failed to load discover", 1500);
    }
}

discoverBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    loadDiscover();
});


// Search modal

searchBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openSearchModal({
        searchPosts, 
        statusEl,
        likedSet,
        currentUserName: user?.name || "",
    });
});

// render

function renderEmpty() {
    if (!feedEl) return;
    feedEl.innerHTML = `
    <div class="feed-empty">
        <p>No posts yet. Be the first to post!</p>
        <button class="btn" id="focusCreate">Create Post</button>
    </div>`;

    document.getElementById("focusCreate").addEventListener("click", () => {
        document.querySelector("#createPost [name='body']")?.focus();
    });
}

function renderPosts(posts=[]) {
    if (!feedEl) return;
    if (!posts.length) return renderEmpty();
    feedEl.innerHTML = posts
    .map((p) => postCard(p, { currentUserName: user?.name || "", likedSet }))
    .join("");
    classifyPostImages(feedEl);
    attachMediaGuards(feedEl);
}

// load feed

async function loadFeed() {
    setStatus(statusEl, "Loading feed", 0);
    renderSkeletons(feedEl, 3);
    try {
        const data = await listPosts({ limit: 40, sort: "created", sortOrder: "desc" });
        const posts = data?.data ?? data ?? [];
        renderPosts(posts);
        setStatus(statusEl, "");
    } catch (error) {
        console.error("Failed to load feed:", error.status, error.data || error.message);
        setStatus(statusEl, error.message || "Failed to load feed");
        if (feedEl) feedEl.innerHTML = "";
    }
}

  // likes and comments

wireLikes(feedEl, {
    reactToPost,
    getPost,
    statusEl,
    saveLikedSet,
    likedSet,
    username
});

wireComments(feedEl, {
    createComment,
    getPost,
    statusEl,
    onAfter: () => loadFeed()
});

feedEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-comment]");
    if (!btn) return;
    const id = btn.dataset.comment;
    try {
        const res = await getPost(id);
        const post = res?.data ?? res;
        openCommentModal(post);
    } catch (error) {
        setStatus(statusEl, error.message || "Failed to load comments", 1500);
    }

});

function openCommentModal(post) {
    modalRoot.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">

        <div class="modal-bar">
            <h3 id="modalTitle">Comments ${post?.author?.name ?? "Post"}</h3>
            <button class="modal-close" data-close aria-label="Close modal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-content" data-list>
            ${Array.isArray(post?.comments) && post.comments.length ? post.comments.map(c => `
                <div class="modal-comment">
                    <strong>${escapeHtml(c.author?.name || "Unknown")}</strong>
                    <span>${timeAgo(c.created)}</span>
                    <div>${escapeHtml(c?.body || "")}</div>
                </div>
            `).join("") : 

            `<div class="modal-comment">
                <p>No comments yet.</p>
            </div>`}
    </div>

    <form class="modal-form" data-post="${post.id}">
        <input type="text" name="comment" placeholder="Write a comment..." autocomplete="off" required>
        <button class="btn btn--sm">Post Comment</button>
    </form>
    </div>
`;

modalRoot.removeAttribute("hidden");
document.body.classList.add("no-scroll");

modalRoot.addEventListener("click", (e) => {
    if (e.target === modalRoot || e.target.closest("[data-close]")) closeModal();
    }, {once:false});

    const formEl = modalRoot.querySelector("form.modal-form");
    const listEl = modalRoot.querySelector("[data-list]");

    formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = formEl.querySelector('input[name="comment"]');
        const text = input.value.trim();
        if (!text) return;

        try {
            await createComment(post.id, text);
            input.value = "";

            const fresh = await getPost(post.id);
            const data = fresh?.data ?? fresh;
            listEl.innerHTML = Array.isArray(data?.comments) && data.comments.length ? data.comments.map(c => `
                <div class="modal-comment">
                    <strong>${escapeHtml(c.author?.name || "Unknown")}</strong>
                    <span> - ${timeAgo(c.created)}</span>
                    <div>${escapeHtml(c?.body || "")}</div>
                </div>
            `).join("") : `<div class="modal-comment"><p>No comments yet.</p></div>`;

          await loadFeed();
        } catch (error) {
            setStatus(statusEl,error.message || "Failed to comment", 1500);
        }
    });
}

// Edit / delete post

feedEl.addEventListener("click", async (e) => {
    const del = e.target.closest("[data-delete]");
    if (!del) return;

    const id = del.dataset.delete;
    if (!confirm("Delete?")) return;

    try {
        await deletePost(id);
        await loadFeed();
        setStatus(statusEl, "Post deleted", 1200);
    } catch (error) {
        setStatus(statusEl, error.message || "Failed to delete post", 1500);
    }
});

// edit post

feedEl.addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit]");
    if (!edit) return;

    const id = edit.dataset.edit;
    try {
        const res = await getPost(id);
        const post = res?.data ?? res;
        openEditModal(post);
    } catch (error) {
        setStatus(statusEl, error.message || "Failed to load post", 1500);
    }
});

function openEditModal(post) {
  modalRoot.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="editTitle">
      <div class="modal-bar">
        <h3 id="editTitle">Edit Post</h3>
        <button class="modal-close" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <form class="modal-content" data-edit-form data-post="${post.id}">
        <label class="field">
          <span>Title</span>
          <input type="text" name="title" value="${escapeHtml(post.title || "")}" maxlength="80">
        </label>
        <label class="field" style="margin-top:8px">
          <span>Body</span>
          <textarea name="body" rows="4">${escapeHtml(post.body || "")}</textarea>
        </label>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <button class="btn btn--sm" type="submit">Save</button>
          <button class="btn btn--sm btn--ghost" type="button" data-close>Cancel</button>
        </div>
      </form>
    </div>
  `;

  modalRoot.removeAttribute("hidden");
  document.body.classList.add("no-scroll");

  modalRoot.addEventListener("click", (e) => {
    if (e.target === modalRoot || e.target.closest("[data-close]")) closeModal();
  }, { once:false });

  const form = modalRoot.querySelector("[data-edit-form]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = form.dataset.post;
    const title = form.title.value.trim();
    const body  = form.body.value.trim();
    try {
      await updatePost(id, { title, body });
      closeModal();
      await loadFeed();
      setStatus(statusEl, "Post updated", 1200);
    } catch (err) {
      setStatus(statusEl, err.message || "Failed to update", 1500);
    }
  });
}

// create post

const form = document.getElementById("createPost");
const bodyInput = form?.querySelector('[name="body"]');
const titleInput = form?.querySelector('[name="title"]');

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    let title = titleInput?.value.trim() || "";
    let body = bodyInput?.value.trim() || "";

    if (!title) { title = body.split("").slice(0, 4).join(""); }
    if (!title) return;
    if (title.length > 80) title = title.slice(0, 80);

    const btn = form.querySelector("button") || form.querySelector('input[type="submit"]');

    if (btn) btn.disabled = true;
    setStatus(statusEl, "Creating post...", 0);

    try {
        await createPost({ title, body });
        if (titleInput) titleInput.value = "";
        if (bodyInput) bodyInput.value = "";
        await loadFeed();
        setStatus(statusEl, "Post created", 1200);
    } catch (error) {
        setStatus(statusEl, error.message || "Failed to create post", 1500);
    } finally {
        if (btn) btn.disabled = false;
    }
});

const fab = document.getElementById("openCreate");
fab?.addEventListener("click", () => { bodyInput?.focus(); });

if (bodyInput && bodyInput.tagName === "TEXTAREA") {
    const auto = () => { 
        bodyInput.style.height = "auto"; 
        bodyInput.style.height = bodyInput.scrollHeight + "px"
    };
    bodyInput.addEventListener("input", auto);
    auto();
}

document.querySelectorAll(".feed-tabs .chip").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".feed-tabs .chip").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
    });
});

const toast = localStorage.getItem("toast");
if (toast && statusEl) {
    setStatus(statusEl, toast, 1500);
    localStorage.removeItem("toast");
}

await ensureApiKey();
loadFeed();