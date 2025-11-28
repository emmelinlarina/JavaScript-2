import { load } from "../utils/storage.js";
import { createPost } from "../api/posts.js";
import { uploadImage } from "../utils/uploads.js";

const user = load();
if (!user?.accessToken) location.href = "login.html"; 

const form = document.querySelector("#createFull");
const statusEl = document.querySelector("#status");
const previewWrap = document.querySelector("#mediaPreview");
const previewImg = document.querySelector("#previewImg");
const fileInput = document.querySelector("#imageFile");

const bodyInput =form?.querySelector('[name="body"]');
const altInput = form?.querySelector('[name="imageAlt"]');
const urlInput = form?.querySelector('[name="imageUrl"]');

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

fileInput.addEventListener("change", async (e) => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    updatePreview(blobUrl);

    const revoke = () => { URL.revokeObjectURL(blobUrl); }
    previewImg.addEventListener("load", revoke);
    previewImg.addEventListener("error", revoke);

});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = form.title.value.trim();
    const body = bodyInput?.value.trim() ?? "";
    const file = fileInput?.files?.[0] || null;
    const imageAlt = altInput?.value.trim() ?? "";
    const imageUrlRaw = urlInput?.value.trim() ?? "";

    if (!title) {
        statusEl.textContent = "Post title is required.";
        return;
    }

    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;

    try {
        let imageUrl = "";

    if (file) {
        statusEl.textContent = "Uploading image...";
        imageUrl = await uploadImage(file);
    } else if (imageUrlRaw) {
        imageUrl = normalize(imageUrlRaw);
    }

    statusEl.textContent = "Creating post...";
    
    const payload =  imageUrl 
    ? { title, body, media: {url: imageUrl, alt: imageAlt || title || "Image"} } 
    : { title, body };

    await createPost(payload);
    localStorage.setItem("toast", "Post created");
    location.href = "index.html";
    } catch (error) { 
        statusEl.textContent = error.message || "Failed to post.";
    } finally {
        btn.disabled = false;
    }
});


