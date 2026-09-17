/**
 * Notification Bridge Service
 *
 * Provides the interface between the native Android NotificationListenerService
 * and the React Native layer.
 *
 * On Android, true notification listening requires:
 * 1. A native Kotlin/Java NotificationListenerService in android/app/src/main/...
 * 2. BIND_NOTIFICATION_LISTENER_SERVICE permission
 * 3. User granting notification access in Android Settings
 *
 * This service file provides:
 * - The JS-side bridge API
 * - Notification access permission checking via Linking
 * - An event emitter to receive notifications from native side
 *
 * The native Kotlin module (SmapNotificationModule) must emit events:
 *   'onNotificationPosted' with payload: NotificationEvent
 *   'onNotificationRemoved' with payload: { key: string }
 */

import { NativeModules, NativeEventEmitter, Platform, Linking } from 'react-native';
import type { NotificationEvent } from '@/types';

const NOTIFICATION_ACCESS_SETTINGS =
  'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS';

// ── Native Module Bridge ──────────────────────────────────────────────────────

const SmapNotifModule = NativeModules.SmapNotificationModule;
let emitter: NativeEventEmitter | null = null;

if (SmapNotifModule && Platform.OS === 'android') {
  try {
    emitter = new NativeEventEmitter(SmapNotifModule);
  } catch {
    emitter = null;
  }
}

// ── Permission ─────────────────────────────────────────────────────────────────

/**
 * Check if notification listener access has been granted.
 * Uses native module if available, otherwise returns null (unknown).
 */
export async function checkNotificationAccess(): Promise<boolean | null> {
  if (Platform.OS !== 'android') return null;
  try {
    if (SmapNotifModule && typeof SmapNotifModule.isNotificationAccessEnabled === 'function') {
      const result: boolean = await SmapNotifModule.isNotificationAccessEnabled();
      return result;
    }
    return null; // Cannot determine without native module
  } catch {
    return null;
  }
}

/**
 * Open Android Notification Listener Settings
 */
export async function openNotificationAccessSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Linking.sendIntent(NOTIFICATION_ACCESS_SETTINGS);
  } catch {
    // Fallback
    await Linking.openSettings();
  }
}

// ── Event Subscription ────────────────────────────────────────────────────────

type NotifListener = (event: NotificationEvent) => void;

export function subscribeToNotifications(listener: NotifListener): () => void {
  if (!emitter) {
    console.warn('[NotifBridge] Native module not available. Notification auto-detection disabled.');
    return () => {};
  }
  const sub = emitter.addListener('onNotificationPosted', listener);
  return () => sub.remove();
}

// ── Status ────────────────────────────────────────────────────────────────────

export function isNativeBridgeAvailable(): boolean {
  return SmapNotifModule != null && Platform.OS === 'android';
}

/**
 * Request native module to start listening (if not already started).
 */
export function startListening(): void {
  if (SmapNotifModule && typeof SmapNotifModule.startListening === 'function') {
    SmapNotifModule.startListening();
  }
}

export function stopListening(): void {
  if (SmapNotifModule && typeof SmapNotifModule.stopListening === 'function') {
    SmapNotifModule.stopListening();
  }
}
