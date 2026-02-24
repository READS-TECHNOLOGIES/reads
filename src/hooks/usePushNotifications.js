// src/hooks/usePushNotifications.js
import { useEffect } from 'react';
import { api } from '../services/api';

// VAPID public key — set VITE_VAPID_PUBLIC_KEY in Vercel environment variables
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(user) {
  useEffect(() => {
    if (!user) return;

    if (!VAPID_PUBLIC_KEY) {
      console.warn('VITE_VAPID_PUBLIC_KEY not set — push notifications disabled.');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported in this browser.');
      return;
    }

    const register = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Push permission denied by user.');
          return;
        }

        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // Save subscription to backend
        await api.push.saveSubscription(subscription.toJSON());
        console.log('Push subscription saved successfully.');

      } catch (err) {
        console.error('Push registration failed:', err);
      }
    };

    register();
  }, [user]);
}
