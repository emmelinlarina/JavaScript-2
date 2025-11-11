import { load, logout, save, getLikedSet, saveLikedSet } from "../utils/storage.js";
import { createApiKey } from "../api/auth.js";  
import { getPost, listPosts, createPost, reactToPost, createComment, updatePost, deletePost } from "../api/posts.js";  

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


function normalizeMediaUrl(u) {
    if (!u) return "";
    let url = String(u).trim();
    if (url.startsWith("//")) url = "https:" + url;
    if (url.startsWith("http://")) url = url.replace(/^http:\/\//, "https://");
    url = encodeURI(url);
    return url;
}

if (titleEl) titleEl.textContent = user?.name ? `${user.name}` : "Friend";

const timeAgo = (iso) => {
    const d = new Date(iso); const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s`; const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`; const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`; const d2 = Math.floor(h / 24);
    return `${d2}d`;
};

const escapeHtml = (str = "") => 
    str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function getStarCount(p) {
  if (!Array.isArray(p?.reactions)) return 0;
  const r = p.reactions.find(x => x.symbol === "★");
  return Number(r?.count || 0);
}


function renderEmpty() {
    if (!feedEl) return;
    feedEl.innerHTML = `
    <div class="feed-empty">
        <p>No posts yet. Be the first to post!</p>
        <button class="btn" id="focusCreate">Create Post</button>
    </div>`;
    document.getElementById("focusCreate").addEventListener("click", () => input?.focus());
} 

function postCard(p) {
    
    const author = p?.author?.name || "Unknown";
    const avatarUrl = p?.author?.avatar?.url || "";
    const isOwner = user?.name && p?.author?.name && user.name === p.author.name;

    const media = normalizeMediaUrl(p?.media?.url || "");
    const mediaAlt = p?.media?.alt || "";

    const title = escapeHtml(p?.title || "");
    const body = escapeHtml(p?.body || "");
    
    const likeCount = getStarCount(p);
    const isLiked = likedSet.has(String(p.id));
    const commentCount = Array.isArray(p?.comments) ? p.comments.length : 0;
    
    return `

    <article class="post" data-post="${p.id}">
        <header class="post-header">
            <div class="post-user">
                <span class="post-avatar" ${avatarUrl ? `style="background-image:url('${avatarUrl}')"` : ""}></span>
                <strong>${escapeHtml(author)}</strong>
            </div>
            <time class="post-time" datetime="${p.created}">${timeAgo(p.created)}</time>
            ${isOwner ? `
                <div class="owner-tools">
                <button class="link-btn" data-edit="${p.id}" aria-label="Edit post"><i class="fa-solid fa-pen"></i></button>
                <button class="link-btn danger" data-delete="${p.id}" aria-label="Delete post"><i class="fa-solid fa-trash"></i></button>
                </div>` : ""}

        </header>

        ${media ? `
            <figure class="post-media">
                <div class="ratio r-1x1">
                <img src="${media}" alt="${escapeHtml(mediaAlt || "")}" loading="lazy" decoding="async">
                </div>
            </figure>` : ""}

        ${p.title ? `<h2 class="post-title">${escapeHtml(title)}</h2>` : ""}
        ${body ? `<p class="post-body">${body}</p>` : ""}

        <footer class="post-actions">
            <button class="icon-btn ${isLiked ? "liked" : ""}" data-like="${p.id}" aria-label="Like">
            <i class="${isLiked ? "fa-solid" : "fa-regular"} fa-star"></i>
            </button>
            <span class="meta" data-like-count>${likeCount}</span>
            
            <button class="icon-btn" data-comment="${p.id}" aria-label="Comment">
                <i class="fa-regular fa-comment"></i>
            </button>
            <span class="meta">${Array.isArray(p?.comments) ? p.comments.length : 0}</span>
        </footer>

        <div class="comments" id="c-${p.id}" hidden>
            <form class="comment-form" data-post="${p.id}">
                <input type="text" name="comment" placeholder="Write a comment..." autocomplete="off" required>
                <button type="submit" class="btn btn--sm">Post</button>
            </form>
        </div>
    </article>`;
}

// likes and comments

feedEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-like]");
  if (!btn) return;
  if (btn.dataset.busy === "1") return;
  btn.dataset.busy = "1";

  const id = String(btn.dataset.like);
  const icon = btn.querySelector("i");
  const countEl = btn.parentElement.querySelector("[data-like-count]");
  const preCount = Number(countEl?.textContent || 0);

  try {
    await reactToPost(id);
    let fresh = await getPost(id);
    let after = getStarCount(fresh?.data ?? fresh);

    if (after < preCount) {
      await reactToPost(id);
      fresh = await getPost(id);
      after = getStarCount(fresh?.data ?? fresh);
    }

    btn.classList.add("liked");
    if (icon) icon.className = "fa-solid fa-star";
    if (countEl) countEl.textContent = String(after);
    likedSet.add(id);
    saveLikedSet(likedSet, username);

  } catch (err) {

    btn.classList.remove("liked");
    if (icon) icon.className = "fa-regular fa-star";
    statusEl && (statusEl.textContent = err.message || "Failed to like");
    setTimeout(() => (statusEl.textContent = ""), 1500);
  } finally {
    delete btn.dataset.busy;
  }
});


function renderPosts(posts=[]) {
    if (!feedEl) return;
    if (!posts.length) return renderEmpty();
    feedEl.innerHTML = posts.map(postCard).join("");
    classifyPostImages(feedEl);
    attachMediaGuards(feedEl);
}

async function loadFeed() {
    if (statusEl) statusEl.textContent = "Loading feed";
    renderSkeletons(3);

    try {
        const data = await listPosts({ limit: 20, sort: "created", sortOrder: "desc" });
        const posts = data?.data ?? data ?? []; 
        renderPosts(posts);
        if (statusEl) statusEl.textContent = "";
    } catch (error) {
        console.error("Failed to load feed:", error.status, error.data || error.message);
        if (statusEl) statusEl.textContent = error.message || "Failed to load feed";
        if (feedEl) feedEl.innerHTML = "";
    } 
} 

//Create post 

const form = document.getElementById("createPost");
const bodyInput = form?.querySelector('[name="body"]');
const titleInput = form?.querySelector('[name="title"]');

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    let title = titleInput?.value.trim() || "";
    let body = bodyInput?.value.trim() || "";

    if (!title) {
        title = body.split("").slice(0, 4).join("");
    }
    if (!title) return;

    if (title.length > 80) title = title.slice(0, 80); + "...";

    const btn = form.querySelector("button") || form.querySelector('input[type="submit"]');

    if (btn) btn.disabled = true;
    if (statusEl) statusEl.textContent = "Creating post...";

    try {
        await createPost({ title, body });
        if (titleInput) titleInput.value = "";
        if (bodyInput) bodyInput.value = "";
        await loadFeed();
        if (statusEl) statusEl.textContent = "Post created";
    } catch (error) {
        if (statusEl) statusEl.textContent = error.message || "Failed to create post";
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

function renderSkeletons(n = 3) {
    const el = document.querySelector("[data-feed]");
    if (!el) return;
    el.innerHTML = Array.from({ length: n }).map(() => `
    <article class="skel">
        <div class="row">
            <div class="avatar"></div>
            <div class="bar" style="width:50%"></div>
        </div>
        <div class="img"></div>
        <div class="bar" style="width:90%; margin: 6px 0"></div>
        <div class="bar" style="width:60%; margin: 6px 0"></div>
    </article>
    `).join("");
}

function pickBoxClass(ratio){
    if (ratio >= 1.6) return "r-16x9";
    if (ratio <= 0.9) return "r-4x5";
    return "r-1x1";
} 

function classifyPostImages(scope = document) {
    scope.querySelectorAll(".post-media img").forEach(img => {
        const apply = () => {
            const r = img.naturalWidth / img.naturalHeight || 1;
            const box = pickBoxClass(r);
            const wrapper = img.closest(".ratio");
            if (wrapper) {
                wrapper.classList.remove("r-16x9", "r-1x1", "r-4x5");
                wrapper.classList.add(box);
            }
        };
        if (img.complete) apply();
        else img.addEventListener("load", apply, {once:true});
    });
}

function attachMediaGuards(scope = document) {
    scope.querySelectorAll(".post-media img").forEach((img) => {
        const fig = img.closest("figure");
        if (!fig) return;

        let done = false;
        const nuke = () => {
            if (done) return;
            done = true;
            fig.remove();
        };

        img.addEventListener("error", nuke, {once:true});

        const t = setTimeout(() => {
            if (!img.complete || img.naturalWidth === 0) nuke(); 
        }, 6000);

        img.addEventListener("load", () => clearTimeout(t), {once:true});
    });
}

feedEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-comment]");
    if (!btn) return;
    showComments(btn.dataset.comment);

});

feedEl.addEventListener("submit", async (e) => {
    const form = e.target.closest(".comment-form");
    if (!form) return;
    e.preventDefault();

    const id = form.dataset.post;
    const input = form.querySelector('input[name="comment"]');
    const text = input.value.trim();
    if (!text) return;

    try {
        await createComment(id, text);
        input.value = "";
        await loadFeed();
    } catch (error) {
        statusEl && (statusEl.textContent = error.message || "Failed to comment");
        setTimeout(() => (statusEl.textContent = ""), 1500);
    }
});

const modalRoot = document.getElementById("modal-root");

function closeModal() {
    modalRoot.setAttribute("hidden", "");
    modalRoot.innerHTML = "";
    document.body.classList.remove("no-scroll");
    document.removeEventListener("keydown", escClose);
}
function escClose(e) {
    if (e.key === "Escape") closeModal();
}

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

    document.addEventListener("keydown", escClose);

    // new comment 
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
            statusEl && (statusEl.textContent = error.message || "Failed to comment");
            setTimeout(() => statusEl && (statusEl.textContent = ""), 1500);
        }
    });
}

async function showComments(postId) {
    try {
        const res = await getPost(postId);
        const post = res?.data ?? res;
        openCommentModal(post);
    } catch (error) {
        statusEl && (statusEl.textContent = error.message || "Failed to load comments");
        setTimeout(() => {
            statusEl && (statusEl.textContent = "");
        }, 1500);
    }
}

// delete post

feedEl.addEventListener("click", async (e) => {
    const del = e.target.closest("[data-delete]");
    if (!del) return;

    const id = del.dataset.delete;
    if (!confirm("Delete?")) return;

    try {
        await deletePost(id);
        await loadFeed();
        if (statusEl) statusEl.textContent = "Post deleted";
    } catch (error) {
        if (statusEl) statusEl.textContent = error.message || "Failed to delete post";
        setTimeout(() => {
            if (statusEl) statusEl.textContent = "";
        }, 1500);
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
        if (statusEl) statusEl.textContent = error.message || "Failed to load post";
        setTimeout(() => {
            if (statusEl) statusEl.textContent = "";
        }, 1500);
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
  document.addEventListener("keydown", escClose);

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
      statusEl && (statusEl.textContent = "Post updated");
      setTimeout(() => (statusEl.textContent = ""), 1200);
    } catch (err) {
      statusEl && (statusEl.textContent = err.message || "Failed to update");
      setTimeout(() => (statusEl.textContent = ""), 1500);
    }
  });
}


const toast = localStorage.getItem("toast");
if (toast && statusEl) {
    statusEl.textContent = toast;
    localStorage.removeItem("toast");
    setTimeout(() => {
        statusEl.textContent = "";
    }, 1500);
}

await ensureApiKey();
loadFeed();