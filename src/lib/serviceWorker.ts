/**
 * Register Service Worker
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      { scope: "/" }
    );
    console.log("Service Worker registered successfully", registration);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}
