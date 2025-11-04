const STORAGE_KEY = "userData";

//js Doc for later

export function save(response) {
    const normalized = response?.data ?? response;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

//js Doc for later

export function load() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed?.data ?? parsed;
}

export function clear() {
    localStorage.removeItem(STORAGE_KEY);
}

export function logout() {
    localStorage.removeItem(STORAGE_KEY);
    location.href = "auth.html";
}