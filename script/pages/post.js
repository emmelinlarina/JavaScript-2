import { load } from "../utils/storage.js";
import { createPost } from "../api/posts.js";

const user = load();
if (!user?.accessToken) location.href = "login.html"; 

const form = document.querySelector("#createFull");
const statusEl = document.querySelector("#status");
const previewWrap = document.querySelector("#mediaPreview");
const previewImg = document.querySelector("#previewImg");

const bodyInput =form?.querySelector('[name="body"]');
const urlInput = form?.querySelector('[name="imageUrl"]');
const altInput = form?.querySelector('[name="imageAlt"]');

const normalize = (u) => {
    if (!u) return "";
    let url = String(u).trim();
    if (url.startsWith("//")) url = "https:" + url;
    if (url.startsWith("http://")) url = url.replace(/^http:\/\//, "https://");
    return encodeURI(url);
};

const pickBox = (r) => r >= 1.6 ? "r-16x9" : r <= 0.9 ? "r-4x5" : "r-1x1";

function updatePreview(url) {
    if (!url) {
        previewWrap.setAttribute("hidden", "true");
        previewImg.src = "";
        return;
    }

previewWrap.removeAttribute("hidden");
previewImg.removeAttribute("class");
previewImg.src = url;
previewImg.onload = () => {
    const r = (previewImg.naturalWidth || 1) / (previewImg.naturalHeight || 1);
    const box = pickBox(r);
    const ratio = previewWrap.querySelector(".ratio");
    ratio.classList.remove("r-16x9", "r-4x5", "r-1x1");
    ratio.classList.add(box);
};
previewImg.onerror = () => {
    statusEl.textContent = "Failed to load preview image.";
    previewWrap.setAttribute("hidden", ""); 
};
}

urlInput.addEventListener("input", (e) => {
    const val = normalize(e.target.value);
    if (!val || !/^https:\/\//i.test(val)) {
        previewWrap.setAttribute("hidden", "");
        return;
    }
    updatePreview(val);
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = form.title.value.trim();
    const body = bodyInput?.value.trim() ?? "";
    const imageUrlRaw = urlInput?.value.trim() ?? "";
    const imageAlt = altInput?.value.trim() ?? "";

    if (!title) {
        statusEl.textContent = "Post title is required.";
        return;
    }

    const imageUrl = normalize(imageUrlRaw);
    const payload =  imageUrl 
    ? { title, body, media: {url: imageUrl, alt: imageAlt || ""} } 
    : { title, body };

    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;
    statusEl.textContent = "Creating post...";

    try {
        await createPost(payload);
        localStorage.setItem("toast", "Post created");
        location.href = "index.html";
    } catch (error) { 
        statusEl.textContent = error.message || "Failed to post.";
    } finally {
        btn.disabled = false;
    }
});
