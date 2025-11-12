/* Likes */

export function getStarCount(p) {
  if (!Array.isArray(p?.reactions)) return 0;
  const r = p.reactions.find(x => x.symbol === "★");
  return Number(r?.count || 0);
}

export function wireLikes( 
    container, 
    { reactToPost, getPost, likedSet, saveLikedSet, username, statusEl }
) { 
    container.addEventListener("click", async (e) => {
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
}

/* Comments */

export function wireComments(
    container,
    { createComment, getPost, statusEl, onAfter }
) {
    container.addEventListener("submit", async (e) => {
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

        const wrap = container.querySelector("[data-comments]");
        if (wrap) {
        const fresh = await getPost(id);
        const post = fresh?.data ?? fresh;

        wrap.innerHTML = (post.comments || [])
            .map(c => `
        <div class="modal-comment">
            <strong>${escapeHtml(c.author?.name || "Unknown")}</strong> 
                <span>${timeAgo(c.created)}</span>
                <div>${escapeHtml(c.body || "")}</div>
            </div>
        `).join("");
    }

    if (typeof onAfter === "function") onAfter();
    } catch (error) {
        statusEl && (statusEl.textContent = error.message || "Failed to comment");
        setTimeout(() => (statusEl.textContent = ""), 1500);
    }
});
}