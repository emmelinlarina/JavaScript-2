import { load } from "../utils/storage.js";

const user = load();
if (user?.accessToken) {
    location.href = "index.html";
}