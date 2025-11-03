import { login } from "../api/auth.js";
import * as store from "../utils/storage.js";

const form = document.getElementById("loginForm");
const statusElement = document.getElementById("status");

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const credentials = {
        email: form.email.value.trim(),
        password: form.password.value.trim(),
    };

    statusElement.textContent = "Logging in...";
    const btn = form.querySelector("button");
    btn.disabled = true;

    try {
        const data = await login(credentials);
        store.save(data);
        location.href = "index.html";
    } catch (error) {
        statusElement.textContent = error.message || "Login failed";
    } finally {
        btn.disabled = false;
    }
});