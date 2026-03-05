import "./bootstrap"; // <-- This runs everything we just put in bootstrap.js!
import "@/assets/index.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

// --- PWA registration ---
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register(
                "/sw.js",
                {
                    scope: "/",
                    updateViaCache: "none",
                },
            );
            console.log("ServiceWorker registration successful");

            registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;
                newWorker.addEventListener("statechange", () => {
                    if (
                        newWorker.state === "installed" &&
                        navigator.serviceWorker.controller
                    ) {
                        window.dispatchEvent(
                            new CustomEvent("swUpdated", {
                                detail: registration,
                            }),
                        );
                    }
                });
            });
        } catch (error) {
            console.error("ServiceWorker registration failed:", error);
        }
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CACHE_UPDATED") {
            console.log("Cache updated:", event.data.url);
        }
    });

    window.addEventListener("online", () =>
        document.dispatchEvent(new CustomEvent("app-online")),
    );
    window.addEventListener("offline", () =>
        document.dispatchEvent(new CustomEvent("app-offline")),
    );
}
// ------------------------

app.use(pinia);
app.use(router);

app.mount("#app");
