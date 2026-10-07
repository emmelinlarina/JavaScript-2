import { login, createApiKey } from "../api/auth.js";
import * as store from "../utils/storage.js";

const form = document.getElementById("loginForm");
const statusElement = document.getElementById("status");

document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const input = btn
      .closest("label")
      .querySelector('input[type="password"], input[type="text"]');
    const icon = btn.querySelector("i");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
  });
});

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
    const authResult = await login(credentials);
    const user = authResult.data ?? authResult;

    store.save(user);

    let apiKey = user.apiKey;
    if (!apiKey) {
      const keyResult = await createApiKey();
      apiKey =
        keyResult?.data?.key ??
        keyResult?.data?.apiKey ??
        keyResult?.key ??
        keyResult?.apiKey;
    }

    if (apiKey) store.save({ ...store.load(), apiKey });

    location.href = "index.html";
  } catch (error) {
    statusElement.textContent = error.message || "Login failed";
  } finally {
    btn.disabled = false;
  }
});
