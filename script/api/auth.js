import { apiRequest } from "./api-fetch.js";

/**
 * Register a new user.
 * @param {object} user - The user registration data.
 * @returns {Promise<object>} The registered user data.
 */

export function register(user) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: user,
    });
}

/**
 * Log in a user.
 * @param {object} credentials - The user login credentials.
 * @returns {Promise<object>} The logged-in user data.
 */

export function login(credentials) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: credentials,
    });
}

/**
 * Create a new API key.
 * @returns {Promise<object>} The created API key data.
 */
export function createApiKey() {
    return apiRequest("/auth/create-api-key", {
        method: "POST",
        auth: true,
    });
}