import { open as openModal } from "./modal.js";
import { debounce } from "./format.js";
import { postCard } from "../render/post-card.js";
import { classifyPostImages, attachMediaGuards } from "./media.js";
import { setStatus } from "./ui.js";

export function openSearchModal({ searchPosts, statusEl, likedSet, currentUserName }) {
    const html = (`
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="searchTitle">
        <div class="modal-bar">
            <h3 id="searchTitle">Search Posts</h3>
            <button class="modal-close" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form class="modal-search" id="searchModalForm">
            <input type="search" id="searchModalInput" name="search" aria-label="Search posts" placeholder="Search posts..." autocomplete="off" required>
            <button class="btn btn--sm" aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>
        </form>

        <div class="modal-content" data-searchResults>

        </div>
    </div>
    `);

    const root = openModal( html );

    const form = root.querySelector("#searchModalForm");
    const input = root.querySelector("#searchModalInput");
    const resultsEl = root.querySelector("[data-searchResults]");

    const renderSearchResults = (posts=[]) => {
            if (!resultsEl) return;
            if (!posts.length) {
                resultsEl.innerHTML = `<p>No results found.</p>`;
                return;
            }
            resultsEl.innerHTML = posts
            .map((p) => postCard(p, { currentUserName, likedSet }))
            .join("");
            classifyPostImages(resultsEl);
            attachMediaGuards(resultsEl);
        };

    const runSearch = async (q) => {
        const query = (q || "").trim();
        if (!query) {
        resultsEl.innerHTML = `<p style="opacity:.7;padding:.5rem 1rem;">Type to search.</p>`; return;}
        try {
        setStatus(statusEl, `Searching for "${query}"...`, 0);
        resultsEl.innerHTML = `<div style="padding: .75rem 1rem; opacity:.8;">Searching…</div>`;
        const result = await searchPosts(query, { limit: 100 });
        const posts  = result?.data ?? result ?? [];
        renderSearchResults(posts);
        } catch (err) {
        resultsEl.innerHTML = `<p style="color:var(--danger, #c00); padding:.5rem 1rem;">${err.message || "Search failed"}</p>`;
        } finally {
        setTimeout(() => statusEl && (statusEl.textContent = ""), 900);
        }
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); runSearch(input.value);});
  input.addEventListener("input", debounce(() => runSearch(input.value), 250));
  input.focus();
}