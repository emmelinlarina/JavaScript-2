import { apiRequest } from "./api-fetch.js";  

export function listPosts({ limit = 20, offset = 0, sort = "created", sortOrder = "desc"} = {}) {
    const qs = new URLSearchParams({
        limit,
        offset,
        sort,
        sortOrder,
        _author: "true",
        _comments: "true",
        _reactions: "true",
    });
    return apiRequest(`/social/posts?${qs.toString()}`, { auth: true });
}

export function createPost({ title, body, media }) {
    const payLoad = media ? { title, body, media } : { title, body };
    return apiRequest("/social/posts", {
        method: "POST",
        body: payLoad,
        auth: true,
    });
}

export function getPost(id) {
    return apiRequest(`/social/posts/${encodeURIComponent(id)}?_author=true&_comments=true&_reactions=true`, { auth: true });
}
export function updatePost(id, payLoad) {
    return apiRequest(`/social/posts/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: payLoad,
        auth: true,
    });
}

export function deletePost(id) {
    return apiRequest(`/social/posts/${encodeURIComponent(id)}`, {
        method: "DELETE",
        auth: true,
    });
}

export function reactToPost(id) {
    return apiRequest(`/social/posts/${encodeURIComponent(id)}/react/%E2%98%85`, {
        method: "PUT",
        auth: true,
    });
} 

export function createComment(id, body) {
    return apiRequest(`/social/posts/${encodeURIComponent(id)}/comment`, {
        method: "POST",
        body: { body },
        auth: true,
    });
}

export async function searchPosts(query, { limit = 50 } = {}) {
    const params = new URLSearchParams({
        q: query,
        limit,
        _author: "true",
        _comments: "true",
        _reactions: "true",
    });

    try {
        return await apiRequest(`/social/posts/search?${params.toString()}`, { auth: true });
    } catch (error) {
        if (error.status === 404) throw error;

        const list = await apiRequest(`/social/posts?limit=${limit}&_author=true&_comments=true&_reactions=true`, { auth: true });
        const items = list?.data ?? [];
        const qlc = String(q || "").toLowerCase();
        const filtered = items.filter((p) => {
            const title = (p?.title || "").toLowerCase();
            const body = (p?.body || "").toLowerCase();
            const author = (p?._author?.name || "").toLowerCase();
            return title.includes(qlc) || body.includes(qlc) || author.includes(qlc);
        });
        return { data: filtered };
    }
}