import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/notifications";

// Register Service Worker for push notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    registerServiceWorker().catch((error) => {
      console.error("Failed to register service worker:", error);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
