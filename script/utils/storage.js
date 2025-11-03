const STORAGE_KEY = "userData";

//js Doc for later

export function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

//js Doc for later

export function load() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
}

export function clear() {
    localStorage.removeItem(STORAGE_KEY);
}