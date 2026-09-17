import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';
import type { PendingMessage, ESP32Config, ManualHistoryItem } from '@/types';

// ── Pending Messages ──────────────────────────────────────────────────────────

export async function loadPendingMessages(): Promise<PendingMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_MESSAGES);
    if (!raw) return [];
    const parsed: PendingMessage[] = JSON.parse(raw);
    // Reset in-flight statuses on restore
    return parsed.map((m) => ({
      ...m,
      status: m.status === 'sending' || m.status === 'generating' ? 'pending' : m.status,
      audioPath: undefined, // audio files may be stale after restart
    }));
  } catch {
    return [];
  }
}

export async function savePendingMessages(messages: PendingMessage[]): Promise<void> {
  try {
    // Only persist non-sent messages
    const toSave = messages.filter((m) => m.status !== 'sent');
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_MESSAGES, JSON.stringify(toSave));
  } catch (e) {
    console.warn('[Storage] Failed to save pending messages', e);
  }
}

// ── Sent Message IDs (dedup / history) ────────────────────────────────────────

export async function loadSentIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SENT_MESSAGE_IDS);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function addSentId(id: string): Promise<void> {
  try {
    const existing = await loadSentIds();
    existing.add(id);
    // Keep only last 500 to avoid bloat
    const trimmed = Array.from(existing).slice(-500);
    await AsyncStorage.setItem(STORAGE_KEYS.SENT_MESSAGE_IDS, JSON.stringify(trimmed));
  } catch {}
}

// ── Notification dedup IDs ─────────────────────────────────────────────────────

export async function loadSeenNotifKeys(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_IDS);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function addSeenNotifKey(key: string): Promise<void> {
  try {
    const existing = await loadSeenNotifKeys();
    existing.add(key);
    const trimmed = Array.from(existing).slice(-1000);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_IDS, JSON.stringify(trimmed));
  } catch {}
}

// ── ESP32 Config ──────────────────────────────────────────────────────────────

export async function loadESP32Config(): Promise<ESP32Config | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ESP32_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw) as ESP32Config;
  } catch {
    return null;
  }
}

export async function saveESP32Config(config: ESP32Config): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ESP32_CONFIG, JSON.stringify(config));
  } catch {}
}

// ── Manual History ─────────────────────────────────────────────────────────────

export async function loadManualHistory(): Promise<ManualHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.MANUAL_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as ManualHistoryItem[];
  } catch {
    return [];
  }
}

export async function saveManualHistory(items: ManualHistoryItem[]): Promise<void> {
  try {
    const trimmed = items.slice(-50);
    await AsyncStorage.setItem(STORAGE_KEYS.MANUAL_HISTORY, JSON.stringify(trimmed));
  } catch {}
}
