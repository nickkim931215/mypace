// Web Push client helpers. Everything here is best-effort and degrades
// gracefully: if push isn't supported, the VAPID key isn't configured, or the
// user denies permission, callers get a clear status instead of a thrown error.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// True only in a browser that can actually do Web Push.
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// The server VAPID public key must be present for subscriptions to work.
export function isPushConfigured(): boolean {
  return VAPID_PUBLIC_KEY.length > 0;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

// iOS/iPadOS only allows Web Push for a PWA installed to the home screen
// (Safari 16.4+). Detect that case so the UI can guide the user to install.
export function isIosNeedsInstall(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  if (!isIos) return false;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // legacy iOS Safari flag
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true;
  return !standalone;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  // Register on demand (dev never auto-registers the SW; this is user-initiated).
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export type EnableResult =
  | { ok: true; subscription: PushSubscription }
  | { ok: false; reason: "unsupported" | "unconfigured" | "denied" | "error" };

// Request permission (must be called from a user gesture) and subscribe.
export async function enablePush(): Promise<EnableResult> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  if (!isPushConfigured()) return { ok: false, reason: "unconfigured" };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "denied" };

    const reg = await getRegistration();
    const existing = await reg.pushManager.getSubscription();
    const subscription =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));
    return { ok: true, subscription };
  } catch (err) {
    console.error("[push] enable failed:", err);
    return { ok: false, reason: "error" };
  }
}

export async function disablePush(): Promise<void> {
  try {
    const sub = await getExistingSubscription();
    if (sub) await sub.unsubscribe();
  } catch (err) {
    console.error("[push] disable failed:", err);
  }
}

// Fire a test push to the given subscription via our API (proves the whole
// pipeline end-to-end with only the VAPID env vars set).
export async function sendTestPush(
  subscription: PushSubscription,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, reason: data?.error ?? `HTTP ${res.status}` };
  } catch (err) {
    console.error("[push] test send failed:", err);
    return { ok: false, reason: "network" };
  }
}

// VAPID public key (base64url) → Uint8Array for applicationServerKey.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
