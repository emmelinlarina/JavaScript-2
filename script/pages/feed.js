import { load, logout } from "../utils/storage.js";

const user = load();
if (!user?.accessToken) {
    location.href = "login.html";
}

document.getElementById("logoutBtn").addEventListener("click", logout);