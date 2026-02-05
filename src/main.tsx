import { createRoot } from "react-dom/client";
import "./index.css";
import { registerServiceWorker } from "./lib/serviceWorker";
import { MissingEnvScreen } from "./components/MissingEnvScreen";
import { hasSupabaseEnv } from "./lib/env";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

const boot = async () => {
  if (!hasSupabaseEnv) {
    root.render(<MissingEnvScreen />);
    return;
  }

  // Register Service Worker for push notifications
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      registerServiceWorker().catch((error) => {
        console.error("Failed to register service worker:", error);
      });
    });
  }

  const { default: App } = await import("./App.tsx");
  root.render(<App />);
};

boot().catch((error) => {
  console.error("Failed to start app:", error);
  if (!hasSupabaseEnv) {
    root.render(<MissingEnvScreen />);
    return;
  }

  root.render(
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-lg p-6">
        <h1 className="text-xl font-semibold">App failed to load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          May error habang naglo-load. Please check the console logs for details.
        </p>
      </div>
    </div>
  );
});
