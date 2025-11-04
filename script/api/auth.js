import { apiRequest } from "./api-fetch.js";

//JS Doc for later

export function register(user) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: user,
    });
}

//js Doc for later

export function login(credentials) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: credentials,
    });
}

export function createApiKey() {
    return apiRequest("/auth/create-api-key", {
        method: "POST",
        auth: true,
    });
}