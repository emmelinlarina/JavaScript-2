import { login } from "../api/auth.js";
import * as store from "../utils/storage.js";

console.log("login.js loaded");
const form = document.getElementById("loginForm");
console.log("form found?", !!form);
const statusElement = document.getElementById("status");

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const credentials = {
        email: form.email.value.trim(),
        password: form.password.value.trim(),
    };
    console.log("Submitting login for:", credentials);

    statusElement.textContent = "Logging in...";
    const btn = form.querySelector("button");
    btn.disabled = true;

    try {
        const data = await login(credentials);
        console.log("Login response:", data);

        store.save(data.data ?? data);
        
        location.href = "index.html";
    } catch (error) {
        statusElement.textContent = error.message || "Login failed";
    } finally {
        btn.disabled = false;
    }
});