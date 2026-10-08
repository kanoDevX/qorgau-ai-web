"use client";

/**
 * Web Push subscription (§4.3). Asks for permission only after an explicit user action (the switch in
 * notification settings), never on page load — a permission prompt on arrival is a dark pattern.
 */
export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushResult = "subscribed" | "denied" | "unsupported" | "unavailable";

export async function subscribePush(): Promise<PushResult> {
  if (!pushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const keyRes = await fetch("/backend/api/v1/push/vapid-public-key");
  if (!keyRes.ok) return "unavailable";
  const { publicKey } = (await keyRes.json()) as { publicKey: string };

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));

  const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const save = await fetch("/backend/api/v1/me/push-subscriptions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  return save.ok ? "subscribed" : "unavailable";
}

export async function unsubscribePush(): Promise<void> {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await fetch("/backend/api/v1/me/push-subscriptions/remove", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => null);
  await subscription.unsubscribe();
}
