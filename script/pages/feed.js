import { load, logout, save } from "../utils/storage.js";
import { createApiKey } from "../api/auth.js";  
import { listPosts, createPost, reactToPost, createComment } from "../api/posts.js";  

const user = load();
if (!user?.accessToken) { location.href = "login.html"; }



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
const form = document.getElementById("createPost");
const input = form?.querySelector('[name="body"]');

function normalizeMediaUrl(u) {
    if (!u) return "";
    let url = String(u).trim();
    if (url.startsWith("//")) url = "https:" + url;
    if (url.startsWith("https://")) url = url.replace(/^http:\/\//, "https://");
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
    const avatarAlt = p?.author?.avatar?.alt || author;

    const media = normalizeMediaUrl(p?.media?.url || "");
    const mediaAlt = p?.media?.alt || "";

    const body = escapeHtml(p?.body || "");
    const likeCount = Array.isArray(p?.reactions) ? p.reactions.reduce((a,r)=>a+(r.count||0),0) : 0;
    const commentCount = Array.isArray(p?.comments) ? p.comments.length : 0;

    return `
    <article class="post" data-post="${p.id}">
        <header class="post-header">
            <div class="post-user">
                <span class="post-avatar" ${avatarUrl ? `style="background-image:url('${avatarUrl}')"` : ""}></span>
                <strong>${escapeHtml(author)}</strong>
            </div>
            <time class="post-time" datetime="${p.created}">${timeAgo(p.created)}</time>
        </header>

        ${media ? `
            <figure class="post-media">
                <div class="ratio r-1x1">
                <img src="${media}" alt="${escapeHtml(mediaAlt || "")}" loading="lazy" decoding="async">
                </div>
            </figure>` : ""}

        ${body ? `<p class="post-body">${body}</p>` : ""}

        <footer class="post-actions">
            <button class="icon-btn" data-like="${p.id}" aria-label="Like"><i class="fa-solid fa-star"></i></button>
            <span class="meta">${likeCount}</span>
            <button class="icon-btn" data-comment="${p.id}" aria-label="Comment"><i class="fa-regular fa-comment"></i></button>
            <span class="meta">${commentCount}</span>
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
    const id = btn.dataset.like;

    try {
        await reactToPost(id);
        await loadFeed();
    } catch (error) {
        statusEl && (statusEl.textContent = error.message || "Failed to like");
        setTimeout(() => (statusEl.textContent = ""), 1500);
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

form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = input?.value.trim();
    if (!body) return;

    const btn = form.querySelector("button") || form.querySelector('input[type="submit"]');
    if (btn) btn.disabled = true;

    if (statusEl) statusEl.textContent = "Creating post...";
    try {
        await createPost({ body });
        if (input) input.value = "";
        await loadFeed();
        if (statusEl) statusEl.textContent = "Post created";
    } catch (error) {
        if (statusEl) statusEl.textContent = error.message || "Failed to create post";
    } finally { 
        if (btn) btn.disabled = false;
    }
});

const fab = document.getElementById("openCreate");
fab?.addEventListener("click", () => { input?.focus(); });

if (input && input.tagName === "TEXTAREA") {
    const auto = () => { 
        input.style.height = "auto"; 
        input.style.height = input.scrollHeight + "px"
    };
    input.addEventListener("input", auto);
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
    const id = btn.dataset.comment;
    const panel = document.getElementById(`c-${id}`);
    if (!panel) return;

    const isHidden = panel.hasAttribute("hidden");
    btn.setAttribute("aria-expanded", isHidden ? "true" : "false");
    if (isHidden) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");

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


await ensureApiKey();
loadFeed();