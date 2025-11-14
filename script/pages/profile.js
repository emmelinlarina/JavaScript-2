import {load, logout, getLikedSet, saveLikedSet} from "../utils/storage.js";
import {setStatus, renderSkeletons} from "../utils/ui.js";
import {classifyPostImages, attachMediaGuards} from "../utils/media.js";
import { wireLikes, wireComments } from "../utils/interactions.js";
import { postCard } from "../render/post-card.js";
import { getPost, createComment, reactToPost } from "../api/posts.js";
import { getProfile, getProfilePosts, followProfile, unfollowProfile } from "../api/profiles.js";

const user = load();
if (!user?.accessToken) location.href = "login.html";

const root = document.querySelector("[data-profile-root]");
const statusEl = document.querySelector("[data-status]");
const avatarEl = document.querySelector("[data-avatar]");
const nameEl = document.querySelector("[data-profile-name]");
const emailEl = document.querySelector("[data-profile-email]");
const bioEl = document.querySelector("[data-profile-bio]");
const postsCountEl = document.querySelector("[data-posts-count]");
const followersCountEl = document.querySelector("[data-count-followers]");
const followingCountEl = document.querySelector("[data-count-following]");
const followBtn = document.getElementById("followBtn");
const feedEl = document.querySelector("[data-feed]");
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn?.addEventListener("click", logout);

const params = new URLSearchParams(location.search);
const nameParam = params.get("name");
const profileName = nameParam || user.name;
const viewingOwnProfile = !nameParam || nameParam === user.name;

const username = user?.email || user?.id || user?.name || "anon";
const likedSet = getLikedSet(username) || new Set();

function renderProfileInfo(profile) {
    if(!profile) return;

    if(nameEl) nameEl.textContent = profile.name || "Unknown";
    if(emailEl) emailEl.textContent = profile.email || "";
    if(bioEl) bioEl.textContent = profile.bio || "No bio yet";

    if(avatarEl) {
        if (profile.avatar) {
            avatarEl.style.backgroundImage = `url('${profile.avatar.url}')`;
        } else {
            avatarEl.style.backgroundImage = "";
        }
    }

    if(postsCountEl) postsCountEl.textContent = profile._count?.posts ?? 0;
    if(followersCountEl) followersCountEl.textContent = profile._count?.followers ?? 0;
    if(followingCountEl) followingCountEl.textContent = profile._count?.following ?? 0;

    if (viewingOwnProfile) {
        followBtn.hidden = true;
    } else {
        const isFollowing = Array.isArray(profile.followers)
        ? profile.followers.some(f => f.name === user.name)
        : false;

        followBtn.hidden = false;
        followBtn.dataset.following = isFollowing ? "true" : "false";
        followBtn.textContent = isFollowing ? "Unfollow" : "Follow";
    }
}

async function loadProfilePosts() {
    setStatus(statusEl, "Loading posts...", 0);
    renderSkeletons(feedEl, 3);

    try {
        const data = await getProfilePosts(profileName);
        const posts = data?.data || data || [];

        if(!posts.length) {
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

        if(root) { root.insertAdjacentHTML(
            "beforeend",
            `<p class="error">Failed to load profile.</p>`);
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
    if (!id) location.href = `single-post.html?id=${encodeURIComponent(id)}`;
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

loadProfilePage();