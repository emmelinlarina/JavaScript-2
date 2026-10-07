import { open as openModal } from "./modal.js";
import { debounce } from "./format.js";
import { postCard } from "../render/post-card.js";
import { classifyPostImages, attachMediaGuards } from "./media.js";
import { setStatus } from "./ui.js";

export function openSearchModal({
  searchPosts,
  statusEl,
  likedSet,
  currentUserName,
}) {
  const html = `

    <div 
        class="modal fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="searchTitle">

        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        >
        <div class="modal-bar flex items-center justify-between px-5 p-4 border-b border-zinc-200">
            <div>
                <h3 id="searchTitle" class="text-lg font-semibold text-zinc-900">
                    Search Posts
                </h3>
                <p class="text-sm text-zinc-500">
                    Find posts by title or content
                </p>
            </div>

            <button 
                type="button"
                class="h-10 w-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 transition-colors" 
                data-close 
                aria-label="Close search"
            > 
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
        </div>

        <form 
            class="p-5 border-b border-zinc-200" 
            id="searchModalForm"
            role="search"
        >
            <div class="flex gap-2">
                <input 
                    type="search" 
                    class="input flex-1"
                    id="searchModalInput" 
                    name="search" 
                    aria-label="Search posts" 
                    placeholder="Search posts..." 
                    autocomplete="off" 
                    required />

                    <button 
                        class="btn btn--sm" 
                        type="submit"
                        aria-label="Search"
                    >
                    <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                    </button>
                </div>
        </form>

        <div 
            class="modal-content overflow-y-auto p-4" 
            data-searchResults>

        </div>
    </div>
    </div>
    `;

  const root = openModal(html);
  const form = root.querySelector("#searchModalForm");
  const input = root.querySelector("#searchModalInput");
  const resultsEl = root.querySelector("[data-searchResults]");

  const renderSearchResults = (posts = []) => {
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
      resultsEl.innerHTML = `<p style="opacity:.7;padding:.5rem 1rem;">Type to search.</p>`;
      return;
    }
    try {
      setStatus(statusEl, `Searching for "${query}"...`, 0);
      resultsEl.innerHTML = `<div style="padding: .75rem 1rem; opacity:.8;">Searching…</div>`;
      const result = await searchPosts(query, { limit: 100 });
      const posts = result?.data ?? result ?? [];
      renderSearchResults(posts);
    } catch (err) {
      resultsEl.innerHTML = `<p style="color:var(--danger, #c00); padding:.5rem 1rem;">${err.message || "Search failed"}</p>`;
    } finally {
      setTimeout(() => statusEl && (statusEl.textContent = ""), 900);
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runSearch(input.value);
  });
  input.addEventListener(
    "input",
    debounce(() => runSearch(input.value), 250),
  );
  input.focus();
}
