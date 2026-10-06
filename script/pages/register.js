import { register } from "../api/auth.js";

const form = document.getElementById("registerForm");
const statusElement = document.getElementById("status");

// Toggle password visibility
document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        const input = btn.closest("label").querySelector('input[type="password"], input[type="text"]');
        const icon = btn.querySelector("i");
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    });
});

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
