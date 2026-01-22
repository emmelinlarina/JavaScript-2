import { load, getLikedSet, saveLikedSet, logout } from "../utils/storage.js";
import { setStatus, renderSkeletons } from "../utils/ui.js";
import { classifyPostImages, attachMediaGuards } from "../utils/media.js";
import { mount as mountModal, close as closeModal } from "../utils/modal.js";
import { postCard } from "../render/post-card.js";
import { wireLikes } from "../utils/interactions.js";
import { escapeHtml, timeAgo, formatDateTime } from "../utils/format.js";
import { getPost, reactToPost, createComment, updatePost, deletePost } from "../api/posts.js";

const user = load();
if (!user?.accessToken) location.href = "login.html";

const statusEl = document.querySelector("[data-status]");
const titleEl = document.querySelector("[data-greeting]");
const root = document.querySelector("[data-post]");
const modalRoot = document.getElementById("modal-root");
const logoutBtn = document.getElementById("logoutBtn");


if (logoutBtn) logoutBtn.addEventListener("click", logout);
if (titleEl) titleEl.textContent = user?.name || "Friend";
if (modalRoot) mountModal(modalRoot);

const params = new URLSearchParams(location.search);
const postId = params.get("id");
if (!postId) {
    statusEl.textContent = "Missing post ID.", 2000;
    throw new Error("single-post: Missing post ID");
}

// likes
const username = user?.email || user?.id || user?.name || "anon";
const likedSet = getLikedSet(username) || new Set();

//render

function renderCommentsList(post) {
    const comments = Array.isArray(post?.comments) ? post.comments : [];
    if (!comments.length) {
        return `<p class="text-center py-8 text-sm text-zinc-500 italic">No comments yet. Be the first to comment!</p>`;
    }
    return comments.map(c => `
        <div class="py-4 border-b border-zinc-100 last:border-0">
            <div class="flex items-center gap-2 mb-2">
                <strong class="text-sm font-semibold text-zinc-900">${escapeHtml(c.author?.name || "Unknown")}</strong>
                <span class="text-xs text-zinc-400">•</span>
                <span class="text-xs text-zinc-500">${timeAgo(c.created)}</span>
            </div>
            <p class="text-sm text-zinc-700 leading-relaxed">${escapeHtml(c.body || "")}</p>
        </div>
        `).join("");
}

function renderSingle(post) {
    root.innerHTML = `
        ${postCard(post, { currentUserName: user?.name || "", likedSet, isSingleView: true })}

        
        <p class="post-meta mx-auto text-right text-sm text-zinc-500 mt-2 mb-6 mr-2">
            Posted ${formatDateTime(post.created)}
        </p>

        <section class="mt-6 rounded-2xl border border-zinc-200 bg-white shadow-sm" data-comments>
            <div class="border-b border-zinc-200 px-6 py-4">
                <h3 class="text-lg font-bold text-zinc-900">Comments</h3>
            </div>
            <div class="px-6" data-list>
                ${renderCommentsList(post)}
            </div>
            <div class="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
                <form class="flex gap-3" data-post="${post.id}">
                    <input 
                        class="input flex-1"
                        type="text" 
                        name="comment" 
                        placeholder="Write a comment..." 
                        aria-label="Write a comment"
                        required
                    >
                    <button class="btn btn--sm" type="submit">Post</button>
                </form>
            </div>
        </section>
    `;

    root.querySelector(".post .comments")?.remove();

    classifyPostImages(root);
    attachMediaGuards(root);

    wireLikes(root, {
        reactToPost,
        getPost,
        likedSet,
        saveLikedSet,
        username,
        statusEl,
    });

    const form = root.querySelector(".comment-form");
    const listEl = root.querySelector("[data-list]");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const input = form.querySelector('[name="comment"]');
            const text = input.value.trim();
            if (!text) return;

            try {
                setStatus(statusEl, "Posting comment...", 0);
                await createComment(post.id, text);
                input.value = "";

                const fresh = await getPost(post.id);
                const data = fresh?.data ?? fresh;

                listEl.innerHTML = renderCommentsList(data);
                setStatus(statusEl, "Comment posted", 1500);
            } catch (err) {
                console.error(err);
                setStatus(statusEl, err.message || "Failed to post comment", 2000);
            }
        });
    }
}

async function loadSingle() {
    setStatus(statusEl, "Loading post...", 0);
    renderSkeletons(root, 1);
    try {
        const res = await getPost(postId);
        const post = res?.data ?? res;
        renderSingle(post);
        setStatus(statusEl, "", 0);
    } catch (err) {
        console.error(err);
        root.innerHTML = `<p class="error">Failed to load post: ${err.message || err}</p>`;
        setStatus(statusEl, "Failed to load post.", 2000);
    }

}

// edit / delete

root.addEventListener("click", async (e) => {
    const del = e.target.closest("[data-delete]");
    if (del) {
        if (!confirm("Delete post?")) return;

        try {
            await deletePost(postId);
            setStatus(statusEl, "Post deleted.", 2000);
            history.back();
        } catch (err) {
            console.error(err);
            setStatus(statusEl, "Failed to delete post.", 2000);
        }
        return;
    }

    const edit = e.target.closest("[data-edit]");
    if (edit) {
        try {
            const res = await getPost(postId);
            const post = res?.data ?? res;

            modalRoot.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="editPostTitle">
                <div class="modal-bar">
                    <h3 id="editPostTitle">Edit Post</h3>
                    <button class="modal-close" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form class="modal-content" data-edit-form>
                    <label class ="field">
                        <span>Title</span>
                        <input type="text" name="title" value="${escapeHtml(post.title || "")}" required>
                    </label>
                    <label class ="field">
                        <span>Body</span>
                        <textarea name="body" rows="4">${escapeHtml(post.body || "")}</textarea>
                    </label>
                    <button class="btn" type="submit">Update Post</button>
                </form>
            </div>
            `;

            modalRoot.removeAttribute("hidden");
            document.body.classList.add("no-scroll");

            modalRoot.addEventListener("click", (evt) => {
                if (evt.target === modalRoot || evt.target.closest("[data-close]")) closeModal();
            }, { once: true });

            const form = modalRoot.querySelector("[data-edit-form]");
            form.addEventListener("submit", async (evt) => {
                evt.preventDefault();
                const title = form.title.value.trim();
                const body = form.body.value.trim();
                try {
                    await updatePost(postId, { title, body });
                    closeModal();
                    await loadSingle();
                    setStatus(statusEl, "Post updated.", 2000);
                } catch (err) {
                    console.error(err);
                    setStatus(statusEl, "Failed to update post.", 2000);
                }
            });
        } catch (err) {
            setStatus(statusEl, "Failed to open editor", 2000);
        }
    }
});

loadSingle();

