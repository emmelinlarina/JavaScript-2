export function setStatus(el, msg="", timeout=1200) {
    if (!el) return;
    el.textContent = msg || "";
    if (msg && timeout) setTimeout(() => (el.textContent = ""), timeout);
}

export function renderSkeletons(container, n = 3) {
    if (!container) return;
    container.innerHTML = Array.from({ length: n }).map(() => `
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

export function html(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
}