let root;

function onBackDrop(e) {
    if (e.target === root || e.target.closest("[data-close]")) close();
}

function escClose(e) {
    if (e.key === "Escape") close();
}

export function mount(el) { root = el; }

export function open(content) {
    if (!root) throw new Error("Modal root not mounted");
    root.innerHTML = content;
    root.removeAttribute("hidden");
    document.body.classList.add("no-scroll");
    root.addEventListener("click", onBackDrop, { once: true });
    document.addEventListener("keydown", escClose);
    return root;
}

export function close() {
    if (!root) return;
    root.setAttribute("hidden", "");
    root.innerHTML = "";
    document.body.classList.remove("no-scroll");
    document.removeEventListener("click", onBackDrop);
    document.removeEventListener("keydown", escClose);
}

