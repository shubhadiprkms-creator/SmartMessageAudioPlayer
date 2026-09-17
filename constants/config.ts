// App Configuration
export const APP_NAME = 'Smart Message Audio Player';
export const APP_VERSION = '1.0.0';

// Storage keys
export const STORAGE_KEYS = {
  PENDING_MESSAGES: 'smap_pending_messages',
  SENT_MESSAGE_IDS: 'smap_sent_ids',
  ESP32_CONFIG: 'smap_esp32_config',
  NOTIFICATION_IDS: 'smap_notif_ids',
  MANUAL_HISTORY: 'smap_manual_history',
};

// ESP32 defaults
export const ESP32_DEFAULTS = {
  ip: '192.168.1.100',
  port: 8080,
  connectTimeout: 5000,
  transferTimeout: 30000,
  ackTimeout: 10000,
};

// ESP32 Protocol endpoints
export const ESP32_ENDPOINTS = {
  status: '/status',
  transfer: '/audio',
  ack: '/ack',
};

// Protocol magic bytes
export const PROTOCOL = {
  TRANSFER_START: 'SMAP_START',
  TRANSFER_END: 'SMAP_END',
  ACK_SUCCESS: 'SMAP_ACK_OK',
  ACK_FAIL: 'SMAP_ACK_FAIL',
};

// TTS Configuration
export const TTS_CONFIG = {
  previewDuration: 5000, // ms
  defaultLanguage: 'en-US',
  sampleRate: 22050,
  bitDepth: 16,
  channels: 1,
};

// Notification filtering
export const FILTER_PATTERNS = [
  /^\d+\s+new\s+message/i,
  /^checking\s+for\s+(new\s+)?(messages?|sms)/i,
  /^you\s+have\s+\d+\s+(new\s+)?message/i,
  /^notification\s+summary/i,
  /group\s+summary/i,
  /^\d+\s+unread/i,
  /^missed\s+call/i,
];

export const FILTER_MIN_LENGTH = 3;
export const FILTER_MAX_INTERVAL_MS = 2000; // dedup window
