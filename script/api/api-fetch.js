import { load } from "../utils/storage.js";

const BASE = "https://v2.api.noroff.dev";

// Remember JSDoc for later

export async function apiRequest(path, { method = "GET", body = null, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };

    if (auth) {
        const token = load()?.accessToken;
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${BASE}${path}`, options);

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        // Ignore JSON parse errors
    }

    if (!response.ok) {
        const error = new Error(data?.message || "API request failed");
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
}