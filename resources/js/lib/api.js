import axios from "axios";

const api = axios.create({
    // 1. Point directly to Laravel's local API route
    baseURL: import.meta.env.VITE_API_URL || "/api",

    // 2. THIS IS THE MAGIC: It tells the browser to automatically send the secure login cookies
    withCredentials: true,
    withXSRFToken: true,

    headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest", // Tells Laravel to return JSON errors, not HTML pages
    },
});

// Look how clean! No more manual interceptors required. Laravel Sanctum handles it automatically.

export default api;
