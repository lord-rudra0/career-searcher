import api from '@/services/api';

// urlBase64ToUint8Array helper
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) throw new Error('Service Worker not supported');
  const registration = await navigator.serviceWorker.register('/sw.js');
  return registration;
}

export async function subscribePush() {
  const registration = await ensureServiceWorker();
  const { publicKey } = await api.getPushPublicKey();
  if (!publicKey) throw new Error('Push not configured');
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  await api.savePushSubscription(sub.toJSON());
  return sub;
}

export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return await registration.pushManager.getSubscription();
}

export async function unsubscribePush() {
  const sub = await getExistingSubscription();
  if (sub) {
    try { await api.removePushSubscription(sub.endpoint); } catch {}
    await sub.unsubscribe();
  }
}
