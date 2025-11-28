export function escapeHtml(str = "") {
    return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function timeAgo(iso) {
    const d = new Date(iso); const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s`; const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`; const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`; const d2 = Math.floor(h / 24);
    return `${d2}d`;
};

export const debounce = (fn, ms=250) => {
    let timeout; return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), ms);
    };
};