import { login, createApiKey } from "../api/auth.js";
import * as store from "../utils/storage.js";

const form = document.getElementById("loginForm");
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
        const authResult = await login(credentials);
        const user = authResult.data ?? authResult;

        let apiKey = user.apiKey;
        if (!apiKey) {
            const keyResult =  await createApiKey();
            apiKey = 
            keyResult?.data?.key ?? 
            keyResult?.data?.apiKey ??
            keyResult?.key ??
            keyResult?.apiKey;
        }

        store.save({...user, apiKey });

        location.href = "index.html";
    } catch (error) {
        statusElement.textContent = error.message || "Login failed";
    } finally {
        btn.disabled = false;
    }
});