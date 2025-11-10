import { load } from "../utils/storage.js";
const BASE = "https://v2.api.noroff.dev";

// Remember JSDoc for later

export async function apiRequest( path, { method = "GET", body = null, auth = false } = {}) {

    const headers = { Accept: "application/json" }; 
    if (body)  headers["Content-Type"] = "application/json";

    if (auth) {
        const user = load();
        if (user?.accessToken) headers.Authorization = `Bearer ${user.accessToken}`;
        if (user?.apiKey) headers["X-Noroff-API-Key"] = user.apiKey; 
    }

    console.log("Requesting:", `${BASE}${path}`);
    if (auth) {
        console.log("Attached headers:", headers);
    }

    const response = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
        data = await response.json(); } catch {}

    if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        if (data) {
            const list = Array.isArray(data?.errors)
                ? data.errors.map((e) => e.message).join(", ")
                : null
                msg = list || data?.message || msg;
        }
        console.error("API Error:", response.status, data); 
        const error = new Error(msg);
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;

   
}

