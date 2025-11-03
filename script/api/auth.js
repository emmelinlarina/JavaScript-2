import { apiRequest } from "./api-fetch";

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