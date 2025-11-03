const BASE = "https://v2.api.noroff.dev";

// Remember JSDoc for later

export async function apiRequest(path, { method = "GET", body = null, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };

    if (auth) {
        const token = localStorage.getItem("token");
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

const options = { method, headers };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE}${path}`, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "API request failed");
        }
        return data;
    } catch (error) {
        console.error("API request error:", error);
        throw error;
    }

}