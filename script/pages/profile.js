import { load, logout, getLikedSet, saveLikedSet } from "../utils/storage.js";
import { setStatus, renderSkeletons } from "../utils/ui.js";
import { classifyPostImages, attachMediaGuards } from "../utils/media.js";
import { wireLikes, wireComments } from "../utils/interactions.js";
import { postCard } from "../render/post-card.js";
import { getPost, createComment, reactToPost } from "../api/posts.js";
import { getProfile, getProfilePosts, followProfile, unfollowProfile, updateProfile } from "../api/profiles.js";
import { mount as mountModal, close as closeModal } from "../utils/modal.js";
import { uploadImage } from "../utils/uploads.js";  

const user = load();
if (!user?.accessToken) location.href = "login.html";

const root = document.querySelector("[data-profile-root]");
const statusEl = document.querySelector("[data-status]");
const avatarEl = document.querySelector("[data-avatar]");
const bannerEl = document.querySelector("[data-banner]");
const nameEl = document.querySelector("[data-profile-name]");
const emailEl = document.querySelector("[data-profile-email]");
const bioEl = document.querySelector("[data-profile-bio]");
const postsCountEl = document.querySelector("[data-count-posts]");     
const followersCountEl = document.querySelector("[data-count-followers]");
const followingCountEl = document.querySelector("[data-count-following]");
const followBtn = document.getElementById("followBtn");
const feedEl = document.querySelector("[data-feed]");
const logoutBtn = document.getElementById("logoutBtn");
const editProfileBtn = document.getElementById("editProfileBtn");
const modalRoot = document.getElementById("modal-root");

if (modalRoot) mountModal(modalRoot);
logoutBtn?.addEventListener("click", logout);

const params = new URLSearchParams(location.search);
const nameParam = params.get("name");
const profileName = nameParam || user.name;
const viewingOwnProfile = !nameParam || nameParam === user.name;

const username = user?.email || user?.id || user?.name || "anon";
const likedSet = getLikedSet(username) || new Set();

function renderProfileInfo(profile) {
    if (!profile) return;

    if (nameEl) nameEl.textContent = profile.name || "Unknown";
    if (emailEl) emailEl.textContent = profile.email || "";
    if (bioEl) bioEl.textContent = profile.bio || "No bio yet";

    if (bannerEl) {
        if (profile.banner?.url) {
            bannerEl.style.backgroundImage = `url('${profile.banner.url}')`;
            bannerEl.classList.add("has-banner");
        } else {
            bannerEl.style.backgroundImage = "";
            bannerEl.classList.remove("has-banner");
        }
    }

    if (avatarEl) {
        if (profile.avatar?.url) {
            avatarEl.style.backgroundImage = `url('${profile.avatar.url}')`;
        } else {
            avatarEl.style.backgroundImage = "";
        }
    }

    if (postsCountEl) postsCountEl.textContent = profile._count?.posts ?? 0;
    if (followersCountEl) followersCountEl.textContent = profile._count?.followers ?? 0;
    if (followingCountEl) followingCountEl.textContent = profile._count?.following ?? 0;

    if (viewingOwnProfile) {
        if (followBtn) followBtn.hidden = true;
        if (editProfileBtn) {
            editProfileBtn.hidden = false;
            editProfileBtn.onclick = () => openEditProfileModal(profile);
        }
    } else {
        if (editProfileBtn) {
            editProfileBtn.hidden = true;
            editProfileBtn.onclick = null;
        }

        const isFollowing = Array.isArray(profile.followers)
            ? profile.followers.some((f) => f.name === user.name)
            : false;

        if (followBtn) {
            followBtn.hidden = false;
            followBtn.dataset.following = isFollowing ? "true" : "false";
            followBtn.textContent = isFollowing ? "Unfollow" : "Follow";
        }
    }
}

async function loadProfilePosts() {
    setStatus(statusEl, "Loading posts...", 0);
    renderSkeletons(feedEl, 3);

    try {
        const data = await getProfilePosts(profileName);
        const posts = data?.data || data || [];

        if (!posts.length) {
            feedEl.innerHTML = `<p>No posts yet</p>`;
            setStatus(statusEl, "", 0);
            return;
        }

        feedEl.innerHTML = posts
            .map((p) => postCard(p, { currentUserName: user?.name || "", likedSet }))
            .join("");

        classifyPostImages(feedEl);
        attachMediaGuards(feedEl);

        wireLikes(feedEl, {
            reactToPost,
            getPost,
            likedSet,
            saveLikedSet,
            username,
            statusEl,
        });

        wireComments(feedEl, {
            createComment,
            getPost,
            statusEl,
            onAfter: loadProfilePosts,
        });

        setStatus(statusEl, "", 0);
    } catch (error) {
        console.error(error);
        feedEl.innerHTML = `<p>Failed to load posts.</p>`;
        setStatus(statusEl, error.message || "Failed to load posts", 3000);
    }
}

async function loadProfilePage() {
    try {
        setStatus(statusEl, "Loading profile...", 0);
        const data = await getProfile(profileName);
        const profile = data?.data || data;

        renderProfileInfo(profile);
        await loadProfilePosts();
    } catch (error) {
        console.error(error);
        setStatus(statusEl, error.message || "Failed to load profile", 3000);

        if (root) {
            root.insertAdjacentHTML(
                "beforeend",
                `<p class="error">Failed to load profile.</p>`
            );
        }
    }
}


feedEl.addEventListener("click", (e) => {
    if (e.target.closest("button, a, [data-like], [data-edit], [data-delete], input, textarea, form")) {
        return;
    }

    const card = e.target.closest("article.post");
    if (!card) return;
    const id = card.dataset.post;
    if (id) {                                   
        location.href = `single-post.html?id=${encodeURIComponent(id)}`;
    }
});

followBtn?.addEventListener("click", async () => {
    const isFollowing = followBtn.dataset.following === "true";

    try {
        followBtn.disabled = true;
        setStatus(statusEl, isFollowing ? "Unfollowing..." : "Following...", 0);

        if (isFollowing) {
            await unfollowProfile(profileName);
        } else {
            await followProfile(profileName);
        }

        await loadProfilePage();
    } catch (error) {
        console.error(error);
        setStatus(statusEl, error.message || "Failed to update follow status", 3000);
    } finally {
        followBtn.disabled = false;
    }
});

function openEditProfileModal(profile) {
    if (!modalRoot) return;

    modalRoot.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="editProfileTitle">
        <div class="modal-bar">
            <h3 id="editProfileTitle">Edit profile</h3>
            <button class="modal-close" data-close aria-label="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <form class="modal-content profile-edit" data-edit-profile>
            <section class="profile-edit-section">
                <h4 class="profile-edit-heading">Profile info</h4>
                <label class="field">
                    <span>Bio</span>
                    <textarea name="bio" rows="3" maxlength="160"
                        placeholder="Write a short bio...">${profile.bio || ""}</textarea>
                </label>
            </section>

            <section class="profile-edit-section">
                <h4 class="profile-edit-heading">Images</h4>

                <div class="profile-edit-grid">
                    <!-- AVATAR -->
                    <div class="profile-edit-card">
                        <h5>Avatar</h5>
                        <div class="profile-edit-preview profile-edit-preview--avatar"
                             data-preview="avatar"
                             style="${profile.avatar?.url ? `background-image:url('${profile.avatar.url}')` : ""}">
                        </div>

                        <label class="field field--sm">
                            <span>Upload image</span>
                            <input type="file" name="avatarFile" accept="image/*">
                        </label>

                        <label class="field field--sm">
                            <span>Or use image URL</span>
                            <input type="url" name="avatar"
                                   placeholder="https://..."
                                   value="${profile.avatar?.url || ""}">
                        </label>
                    </div>

                    <!-- BANNER -->
                    <div class="profile-edit-card">
                        <h5>Banner</h5>
                        <div class="profile-edit-preview profile-edit-preview--banner"
                             data-preview="banner"
                             style="${profile.banner?.url ? `background-image:url('${profile.banner.url}')` : ""}">
                        </div>

                        <label class="field field--sm">
                            <span>Upload image</span>
                            <input type="file" name="bannerFile" accept="image/*">
                        </label>

                        <label class="field field--sm">
                            <span>Or use image URL</span>
                            <input type="url" name="banner"
                                   placeholder="https://..."
                                   value="${profile.banner?.url || ""}">
                        </label>
                    </div>
                </div>
            </section>

            <div class="profile-edit-actions">
                <button type="button" class="btn btn--sm btn--ghost" data-close>Cancel</button>
                <button class="btn btn--sm" type="submit" data-save>Save changes</button>
            </div>
        </form>
    </div>
    `;

    modalRoot.removeAttribute("hidden");
    document.body.classList.add("no-scroll");

    
    modalRoot.onclick = (e) => {
        if (e.target === modalRoot || e.target.closest("[data-close]")) {
            closeModal();
            modalRoot.onclick = null;
        }
    };

    const form = modalRoot.querySelector("[data-edit-profile]");
    const avatarPreview = form.querySelector("[data-preview='avatar']");
    const bannerPreview = form.querySelector("[data-preview='banner']");

    
    const wirePreview = (input, previewEl, shape = "square") => {
        if (!input || !previewEl) return;
        input.addEventListener("change", () => {
            const file = input.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            previewEl.style.backgroundImage = `url('${url}')`;
            
            previewEl.onload = () => URL.revokeObjectURL(url);
        });
    };

    wirePreview(form.avatarFile, avatarPreview);
    wirePreview(form.bannerFile, bannerPreview);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const bio = form.bio.value.trim();

        const avatarFile   = form.avatarFile?.files?.[0] || null;
        const bannerFile   = form.bannerFile?.files?.[0] || null;
        const avatarUrlRaw = form.avatar?.value.trim() || "";
        const bannerUrlRaw = form.banner?.value.trim() || "";

        const payload = { bio };

        try {
            setStatus(statusEl, "Saving profile...", 0);

            if (avatarFile) {
                const url = await uploadImage(avatarFile);
                payload.avatar = { url };
            } else if (avatarUrlRaw) {
                payload.avatar = { url: avatarUrlRaw };
            }

            if (bannerFile) {
                const url = await uploadImage(bannerFile);
                payload.banner = { url };
            } else if (bannerUrlRaw) {
                payload.banner = { url: bannerUrlRaw };
            }

            await updateProfile(profileName, payload);

            closeModal();
            modalRoot.onclick = null;

            await loadProfilePage();
            setStatus(statusEl, "Profile updated!", 1500);
        } catch (error) {
            console.error(error);
            setStatus(statusEl, error.message || "Failed to save profile", 2000);
        }
    });
}

loadProfilePage();
