import { load, logout, getLikedSet, saveLikedSet } from "../utils/storage.js";
import { setStatus, renderSkeletons } from "../utils/ui.js";
import { classifyPostImages, attachMediaGuards } from "../utils/media.js";
import { wireLikes, wireComments } from "../utils/interactions.js";
import { postCard } from "../render/post-card.js";
import { getPost, createComment, reactToPost } from "../api/posts.js";
import { getProfile, getProfilePosts, followProfile, unfollowProfile, updateProfile } from "../api/profiles.js";
import { mount as mountModal, close as closeModal } from "../utils/modal.js";

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
            <h3 id="editProfileTitle">Edit Profile</h3>
            <button class="modal-close" data-close><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form class="modal-content" data-edit-profile>
            <label class="field">
                <span>Bio</span>
                <textarea name="bio" rows="3" maxlength="160">${profile.bio || ""}</textarea>
            </label>

            <label class="field">
                <span>Avatar URL</span>
                <input type="url" name="avatar" value="${profile.avatar?.url || ""}" />
            </label>

            <label class="field">
                <span>Banner URL</span>
                <input type="url" name="banner" value="${profile.banner?.url || ""}" />
            </label>

            <button class="btn btn--sm" type="submit" data-save>Save</button>
        </form>
    </div>
    `;

    modalRoot.removeAttribute("hidden");
    document.body.classList.add("no-scroll");

    modalRoot.addEventListener(
        "click",
        (e) => {
            if (e.target === modalRoot || e.target.closest("[data-close]")) closeModal();
        },
        { once: true }
    );

    const form = modalRoot.querySelector("[data-edit-profile]");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const bio = form.bio.value.trim();
        const avatar = form.avatar.value.trim();
        const banner = form.banner.value.trim();

        const payload = { bio };
        if (avatar) payload.avatar = { url: avatar };
        if (banner) payload.banner = { url: banner };

        try {
            setStatus(statusEl, "Saving profile...", 0);
            await updateProfile(profileName, payload);
            closeModal();
            await loadProfilePage();
            setStatus(statusEl, "Profile updated!", 1500);
        } catch (error) {
            console.error(error);
            setStatus(statusEl, error.message || "Failed to save profile", 2000);
        }
    });
}

loadProfilePage();
