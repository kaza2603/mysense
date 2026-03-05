import axios from "axios";
window.axios = axios;

// Tells Laravel this is an API request
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// 1. Tell Axios to look at the new Laravel API routes
window.axios.defaults.baseURL = "/api";

// 2. Tell Axios to send cookies with every request (Required for Laravel Sanctum Auth)
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;
