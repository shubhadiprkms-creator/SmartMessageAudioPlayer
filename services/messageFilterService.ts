/**
 * Message filter service
 * Decides whether a notification event represents a real incoming message.
 */
import { FILTER_PATTERNS, FILTER_MIN_LENGTH, FILTER_MAX_INTERVAL_MS } from '@/constants/config';

interface FilterInput {
  packageName: string;
  sender: string;
  text: string;
  notificationKey: string;
  timestamp: number;
}

// In-memory dedup: notifKey → last accepted timestamp
const recentNotifKeys = new Map<string, number>();
const CLEANUP_INTERVAL = 60_000;

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [k, ts] of recentNotifKeys.entries()) {
    if (now - ts > 30_000) recentNotifKeys.delete(k);
  }
}

// Apps that should never generate messages (the app itself, system apps, etc.)
const BLOCKED_PACKAGES = [
  'com.smap.app',       // this app
  'com.android.systemui',
  'com.google.android.gms',
  'com.android.vending',
];

// Outgoing SMS indicators (sender would be "You" or user's own number placeholder)
const OUTGOING_SENDER_PATTERNS = [
  /^you$/i,
  /^me$/i,
  /^sent$/i,
  /^outgoing/i,
];

export function shouldAcceptNotification(input: FilterInput): { accept: boolean; reason?: string } {
  cleanup();

  const { packageName, sender, text, notificationKey, timestamp } = input;

  // 1. Block own-app and certain system packages
  if (BLOCKED_PACKAGES.some((p) => packageName.startsWith(p))) {
    return { accept: false, reason: 'Blocked package' };
  }

  // 2. Text length check
  const trimmedText = text.trim();
  if (trimmedText.length < FILTER_MIN_LENGTH) {
    return { accept: false, reason: 'Text too short' };
  }

  // 3. Pattern-based filter (summaries, system messages)
  for (const pattern of FILTER_PATTERNS) {
    if (pattern.test(trimmedText)) {
      return { accept: false, reason: `Filtered by pattern: ${pattern.source}` };
    }
  }

  // 4. Outgoing message sender filter
  for (const pattern of OUTGOING_SENDER_PATTERNS) {
    if (pattern.test(sender.trim())) {
      return { accept: false, reason: 'Outgoing message sender' };
    }
  }

  // 5. Notification dedup: same key within dedup window = update, not new message
  const lastSeen = recentNotifKeys.get(notificationKey);
  if (lastSeen !== undefined && timestamp - lastSeen < FILTER_MAX_INTERVAL_MS) {
    return { accept: false, reason: 'Duplicate notification update' };
  }

  // Accept
  recentNotifKeys.set(notificationKey, timestamp);
  return { accept: true };
}

/**
 * Build a stable dedup key for persisted message dedup.
 * Two genuinely separate messages with same text but different timestamps
 * get different keys.
 */
export function buildMessageDedupKey(
  packageName: string,
  sender: string,
  text: string,
  notificationId: number
): string {
  return `${packageName}:${notificationId}:${sender}`;
}

/**
 * Preprocess text for TTS:
 * - Expand digit sequences (OTP / phone number style)
 * - Handle common Banglish patterns
 */
export function preprocessForTTS(text: string): string {
  let result = text;

  // Expand long digit runs (4+ consecutive digits) → digit-by-digit
  result = result.replace(/\b(\d{4,})\b/g, (match) => {
    return match.split('').join(' ');
  });

  // Common Banglish → English phonetic hints
  const banglishMap: [RegExp, string][] = [
    [/\bkemon\b/gi, 'kemon'],
    [/\bache\b/gi, 'ache'],
    [/\basbe\b/gi, 'ashbe'],
    [/\bkothay\b/gi, 'kothay'],
    [/\bjano\b/gi, 'jano'],
  ];
  for (const [pat, rep] of banglishMap) {
    result = result.replace(pat, rep);
  }

  return result;
}
