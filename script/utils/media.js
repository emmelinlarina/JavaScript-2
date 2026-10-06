export function normalizeMediaUrl(u) {
    if (!u) return "";
    let url = String(u).trim();

    // Skip if it's not a valid URL-like string
    if (!url || url.length < 5) return "";

    // Handle protocol-relative URLs
    if (url.startsWith("//")) url = "https:" + url;

    // Upgrade http to https
    if (url.startsWith("http://")) url = url.replace(/^http:\/\//, "https://");

    // Only encode if it's already a valid http(s) URL
    if (!url.startsWith("https://")) return "";

    try {
        url = encodeURI(url);
    } catch (e) {
        console.warn("Failed to encode URL:", u);
        return "";
    }

    return url;
}

export function pickBoxClass(ratio) {
    if (ratio >= 1.6) return "r-16x9";
    if (ratio <= 0.9) return "r-4x5";
    return "r-1x1";
}

export function classifyPostImages(scope = document) {
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
        else img.addEventListener("load", apply, { once: true });
    });
}

/* media guards */
export function attachMediaGuards(scope = document) {
    scope.querySelectorAll(".post-media img").forEach((img) => {
        const fig = img.closest("figure");
        if (!fig) return;

        let done = false;
        const nuke = () => {
            if (done) return;
            done = true;
            fig.remove();
        };

        img.addEventListener("error", nuke, { once: true });

        const t = setTimeout(() => {
            if (!img.complete || img.naturalWidth === 0) nuke();
        }, 6000);

        img.addEventListener("load", () => clearTimeout(t), { once: true });
    });
}
