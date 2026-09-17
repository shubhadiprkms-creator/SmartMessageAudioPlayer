export type MessageStatus =
  | 'pending'
  | 'generating'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'preview';

export interface PendingMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  errorMessage?: string;
  notificationKey?: string;        // unique key from notification system
  notificationId?: number;
  isManual?: boolean;
  audioPath?: string;
  retryCount?: number;
}

export interface NotificationEvent {
  id: number;
  key: string;
  packageName: string;
  sender: string;
  text: string;
  timestamp: number;
  isGroup?: boolean;
}

export type ESP32Status = 'connected' | 'disconnected' | 'connecting' | 'failed';

export interface ESP32Config {
  ip: string;
  port: number;
}

export interface TransferResult {
  success: boolean;
  errorMessage?: string;
}

export interface ManualHistoryItem {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}
