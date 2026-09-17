/**
 * Notification Listener Hook
 * Subscribes to notification events from native bridge and routes valid
 * messages into the message queue.
 */
import { useEffect, useRef } from 'react';
import {
  subscribeToNotifications,
  isNativeBridgeAvailable,
  startListening,
} from '@/services/notificationBridge';
import { useMessages } from './useMessages';

export function useNotificationListener() {
  const { addNotificationMessage } = useMessages();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!isNativeBridgeAvailable()) return;
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    startListening();

    const unsub = subscribeToNotifications(async (event) => {
      const accepted = await addNotificationMessage(event);
      if (accepted) {
        console.log('[Listener] New message accepted from:', event.sender);
      }
    });

    return () => {
      unsub();
      subscribedRef.current = false;
    };
  }, [addNotificationMessage]);
}
