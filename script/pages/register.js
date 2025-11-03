import { register } from "../api/auth";

const form = document.getElementById("registerForm");
const statusElement = document.getElementById("status");

form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value.trim(),
    };

    statusElement.textContent = "Creating account...";
    const btn = form.querySelector("button");
    btn.disabled = true;

    try {
        await register(user);
        location.href = "login.html";
    } catch (error) {
        statusElement.textContent = error.message || "Registration failed";
    } finally {
        btn.disabled = false;
    }   
});
