/**
 * Register Service Worker
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Workers not supported");
    return null;
  }

  try {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const scope = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const swUrl = new URL("service-worker.js", window.location.origin + scope).toString();
    const registration = await navigator.serviceWorker.register(
      swUrl,
      { scope }
    );
    console.log("Service Worker registered successfully", registration);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}
