import { load } from "../utils/storage.js";
if (!load()?.accessToken) {
    location.href = "auth.html";
}