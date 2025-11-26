import { setStatus } from "../utils/ui.js";
import { apiRequest } from "./api-fetch.js";
// import 

export function getProfile(name) {
    const qs = new URLSearchParams({
        _followers: "true",
        _following: "true",
        _count: "true",
    });

    return apiRequest
        (`/social/profiles/${encodeURIComponent(name)}?${qs.toString()}`,
        { auth: true }
    );
}

export function getProfilePosts(
    name, { limit = 20, offset = 0, sort = "created", sortOrder = "desc" } = {}
) {
    const qs = new URLSearchParams({
        limit,
        sort, 
        sortOrder,
        _author: "true",
        _comments: "true",
        _reactions: "true",
        offset,
    });

    return apiRequest(
        `/social/profiles/${encodeURIComponent(name)}/posts?${qs.toString()}`,
        { auth: true }
    );
}

export function followProfile(name) {
    return apiRequest(
        `/social/profiles/${encodeURIComponent(name)}/follow`,
        { method: "PUT", auth: true }
    );
}

export function unfollowProfile(name) {
    return apiRequest(
        `/social/profiles/${encodeURIComponent(name)}/unfollow`,
        { method: "PUT", auth: true }
    );
}

// edit profile

export function updateProfile(name, payload) {
    return apiRequest(
        `/social/profiles/${encodeURIComponent(name)}`,
        {
            method: "PUT",
            body: payload,
            auth: true,
        }
    );
}

