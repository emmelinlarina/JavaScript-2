import { escapeHtml, timeAgo, formatDateTime } from "../utils/format.js";
import * as media from "../utils/media.js";
import { getStarCount } from "../utils/interactions.js";

export function postCard(p, { currentUserName, likedSet, isSingleView }) {

  const author = p?.author?.name || "Unknown";
  const profileUrl = `profile.html?name=${encodeURIComponent(author)}`;
  const avatarUrl = p?.author?.avatar?.url || "";
  const isOwner = currentUserName && p?.author?.name && currentUserName === p.author.name;

  const mediaUrl = media.normalizeMediaUrl(p?.media?.url || p?.image?.url || p?.imageUrl || "");
  const mediaAlt = p?.media?.alt || "";

  const body = escapeHtml(p?.body || "");

  const likeCount = getStarCount(p);
  const isLiked = likedSet.has(String(p.id));
  const postUrl = `single-post.html?id=${encodeURIComponent(p.id)}`;
  const tags = Array.isArray(p?.tags) ? p.tags : [];

  const fullDate = formatDateTime(p.created);
  const relative = timeAgo(p.created);

  return `
<article class="post h-full flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
  data-post="${p.id}"
>
  <header class="flex items-center justify-between gap-3 p-4">
    <div class="flex items-center gap-3 min-w-0">
      <span
        class="h-10 w-10 shrink-0 rounded-xl bg-zinc-800 bg-cover bg-center ring-1 ring-white/10"
        ${avatarUrl ? `style="background-image:url('${avatarUrl}')"` : ""}
      ></span>

      <a href="${profileUrl}" class="truncate text-sm font-semibold text-zinc-900 hover:underline">
        ${escapeHtml(author)}
      </a>
    </div>

    ${isOwner ? `
      <div class="flex items-center gap-2 shrink-0">
        <button class="h-10 w-10 rounded-xl border border-zinc-700 bg-white/5 text-zinc-900 hover:bg-white/10 transition" data-edit="${p.id}" aria-label="Edit post">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="h-10 w-10 rounded-xl border border-black-500/30 bg-black-500/5 text-black-200 hover:bg-black-500/10 transition" data-delete="${p.id}" aria-label="Delete post">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    ` : ""}
  </header>

  ${mediaUrl ? `
    <figure class="px-5 post-media">
      <div
        class="overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 aspect-square flex items-center justify-center relative ${isSingleView ? 'mx-auto max-w-2xl' : 'w-full'}"
        style="aspect-ratio: 1 / 1"
      >
        <div class="absolute inset-0 bg-linear-to-r from-zinc-200 via-zinc-100 to-zinc-200 animate-pulse"></div>
        <img
          class="h-full w-full object-cover relative z-10 opacity-0 transition-opacity duration-300"
          src="${mediaUrl}"
          alt="${escapeHtml(mediaAlt || "")}"   
          loading="lazy"
          decoding="async"
          width="1200"  
          height="1200"
          onload="this.classList.remove('opacity-0')"
          onerror="this.closest('figure').remove()"
        >
      </div>
    </figure>
  ` : ""}

  <time class="px-5 ${mediaUrl ? 'pt-3' : 'pt-4'} text-xs text-zinc-500" title="${fullDate}">${relative}</time>

  ${p.title ? `
    <h2 class="px-5 ${mediaUrl ? 'pt-2' : 'pt-3'} text-lg font-bold text-zinc-900">
      <a class="hover:underline" href="${postUrl}" data-post-link>${escapeHtml(p.title)}</a>
    </h2>
  ` : ""}

  ${body ? ` <p class="mb-3 px-5 ${mediaUrl ? 'pt-2' : 'pt-1'} text-sm text-zinc-700 leading-relaxed">  ${body} </p> ` : ""}

  

    <footer class="mt-auto px-5 py-3 border-t border-zinc-200 flex items-center gap-3 bg-white">

    <button class="h-10 w-10 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 transition ${isLiked ? "text-yellow-600 border-yellow-200 bg-yellow-50" : "text-zinc-700"}" data-like="${p.id}" aria-label="Like">
      <i class="${isLiked ? "fa-solid" : "fa-regular"} fa-star"></i>
    </button>

    <span class="text-sm font-medium text-zinc-700 min-w-6" data-like-count>${likeCount}</span>

    <button class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white hover:bg-zinc-50 transition text-zinc-700" data-comment="${p.id}" aria-label="Comment">
      <i class="fa-regular fa-comment"></i>
    </button>

    <span class="text-sm font-medium text-zinc-700 min-w-6">${Array.isArray(p?.comments) ? p.comments.length : 0}</span>
  </footer>

  <div class="px-5 pb-4" id="c-${p.id}" hidden>
    <form class="mt-3 flex gap-2" data-post="${p.id}">
      <input class="input" type="text" name="comment" placeholder="Write a comment..." autocomplete="off" required>
      <button type="submit" class="btn btn--sm">Post</button>
    </form>
  </div>
</article>
`;

} 
