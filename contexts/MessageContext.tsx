import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { PendingMessage, MessageStatus } from '@/types';
import {
  loadPendingMessages,
  savePendingMessages,
  loadSeenNotifKeys,
  addSeenNotifKey,
} from '@/services/storageService';
import { shouldAcceptNotification, buildMessageDedupKey } from '@/services/messageFilterService';
import type { NotificationEvent } from '@/types';

interface MessageContextType {
  messages: PendingMessage[];
  addMessage: (msg: Omit<PendingMessage, 'id' | 'status' | 'retryCount'>) => Promise<string | null>;
  addNotificationMessage: (event: NotificationEvent) => Promise<boolean>;
  updateMessageStatus: (id: string, status: MessageStatus, error?: string) => void;
  removeMessage: (id: string) => void;
  setAudioPath: (id: string, path: string) => void;
  isLoaded: boolean;
}

export const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const seenKeysRef = useRef<Set<string>>(new Set());

  // Load persisted messages on mount
  useEffect(() => {
    (async () => {
      const saved = await loadPendingMessages();
      const seenKeys = await loadSeenNotifKeys();
      seenKeysRef.current = seenKeys;
      setMessages(saved);
      setIsLoaded(true);
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    if (isLoaded) {
      savePendingMessages(messages);
    }
  }, [messages, isLoaded]);

  const generateId = () => `smap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const addMessage = useCallback(
    async (msg: Omit<PendingMessage, 'id' | 'status' | 'retryCount'>): Promise<string | null> => {
      const id = generateId();
      const newMsg: PendingMessage = {
        ...msg,
        id,
        status: 'pending',
        retryCount: 0,
      };
      setMessages((prev) => [...prev, newMsg]);
      return id;
    },
    []
  );

  const addNotificationMessage = useCallback(
    async (event: NotificationEvent): Promise<boolean> => {
      // 1. Build notification dedup key
      const notifKey = event.key || buildMessageDedupKey(
        event.packageName,
        event.sender,
        event.text,
        event.id
      );

      // 2. Run filter
      const filterResult = shouldAcceptNotification({
        packageName: event.packageName,
        sender: event.sender,
        text: event.text,
        notificationKey: notifKey,
        timestamp: event.timestamp,
      });

      if (!filterResult.accept) {
        console.log('[MessageFilter] Rejected:', filterResult.reason, event.text.slice(0, 40));
        return false;
      }

      // 3. Check persistent seen keys (prevents cross-session duplicates for same notif ID)
      if (seenKeysRef.current.has(notifKey)) {
        console.log('[MessageFilter] Already seen key:', notifKey);
        return false;
      }

      // 4. Add to seen
      seenKeysRef.current.add(notifKey);
      await addSeenNotifKey(notifKey);

      // 5. Add message
      const id = generateId();
      const newMsg: PendingMessage = {
        id,
        sender: event.sender || 'Unknown',
        text: event.text,
        timestamp: event.timestamp,
        status: 'pending',
        notificationKey: notifKey,
        notificationId: event.id,
        retryCount: 0,
      };
      setMessages((prev) => [...prev, newMsg]);
      return true;
    },
    []
  );

  const updateMessageStatus = useCallback(
    (id: string, status: MessageStatus, error?: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status,
                errorMessage: error,
                retryCount: status === 'failed' ? (m.retryCount ?? 0) + 1 : m.retryCount,
              }
            : m
        )
      );
    },
    []
  );

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const setAudioPath = useCallback((id: string, path: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, audioPath: path } : m))
    );
  }, []);

  return (
    <MessageContext.Provider
      value={{
        messages,
        addMessage,
        addNotificationMessage,
        updateMessageStatus,
        removeMessage,
        setAudioPath,
        isLoaded,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}
