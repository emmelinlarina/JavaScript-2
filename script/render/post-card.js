import { escapeHtml, timeAgo } from "../utils/format.js";
import * as media from "../utils/media.js";
import { getStarCount } from "../utils/interactions.js";

export function postCard(p, { currentUserName, likedSet }) {

    const author = p?.author?.name || "Unknown";
    const profileUrl = `profile.html?name=${encodeURIComponent(author)}`;
    const avatarUrl = p?.author?.avatar?.url || "";
    const isOwner = currentUserName && p?.author?.name && currentUserName === p.author.name;

    const mediaUrl = media.normalizeMediaUrl(p?.media?.url || "");
    const mediaAlt = p?.media?.alt || "";

    const title = escapeHtml(p?.title || "");
    const body = escapeHtml(p?.body || "");
    
    const likeCount = getStarCount(p);
    const isLiked = likedSet.has(String(p.id));
    const postUrl = `single-post.html?id=${encodeURIComponent(p.id)}`;
    const tags = Array.isArray(p?.tags) ? p.tags : [];
    
    return `

    <article class="post" data-post="${p.id}">

        <header class="post-header">
            <div class="post-user">
                <span class="post-avatar" ${avatarUrl ? `style="background-image:url('${avatarUrl}')"` : ""}></span>
                <strong>
                    <a href="${profileUrl}" class="post-author-link">
                    ${escapeHtml(author)}
                    </a>
                </strong>
            </div>

            
            
            ${isOwner ? `
                <div class="owner-tools">
                    <button class="link-btn" data-edit="${p.id}" aria-label="Edit post"><i class="fa-solid fa-pen"></i></button>
                    <button class="link-btn danger" data-delete="${p.id}" aria-label="Delete post"><i class="fa-solid fa-trash"></i></button>
                </div>` : ""}
        </header>

        ${mediaUrl ? `
            <figure class="post-media">
                <div class="ratio r-1x1">
                <img src="${mediaUrl}" alt="${escapeHtml(mediaAlt || "")}" loading="lazy" decoding="async">
                </div>
            </figure>` : ""}

        <time class="post-time" datetime="${p.created}">${timeAgo(p.created)}</time>
        
        ${p.title ? `<h2 class="post-title"><a class="post-link" href="${postUrl}" data-post-link>${escapeHtml(p.title)}</a></h2>` : ""}
        ${body ? `<p class="post-body">${body}</p>` : ""}

        ${tags.length ? ` 
            <ul class="post-tags">
                ${tags.map(tag => `<li class="post-tag">#${escapeHtml(tag)}</li>`).join("")}
            </ul>` : ""}

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
