/**
 * TTS Service – wraps expo-speech
 * Handles preview (phone speaker) and WAV file generation (for ESP32 transfer).
 *
 * WAV file generation uses Android's TextToSpeech synthesizeToFile via
 * a native bridge module. When that bridge is unavailable (e.g. Expo Go),
 * it falls back to a fetch-based approach.
 */
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { Platform, NativeModules } from 'react-native';
import { preprocessForTTS } from './messageFilterService';
import { TTS_CONFIG } from '@/constants/config';

export type TTSStatus = 'idle' | 'speaking' | 'error';

let previewTimer: ReturnType<typeof setTimeout> | null = null;

// ── Preview (phone speaker, ~5 seconds) ──────────────────────────────────────

export function previewMessage(
  text: string,
  onDone?: () => void,
  onError?: (err: string) => void
): void {
  stopPreview();

  const processed = preprocessForTTS(text);

  const options: Speech.SpeechOptions = {
    language: detectLanguage(text),
    rate: 0.9,
    pitch: 1.0,
    onDone: () => {
      clearTimeout(previewTimer!);
      onDone?.();
    },
    onError: (err) => {
      clearTimeout(previewTimer!);
      onError?.(err.message ?? 'TTS error');
    },
  };

  Speech.speak(processed, options);

  // Stop after preview duration
  previewTimer = setTimeout(() => {
    Speech.stop();
    onDone?.();
  }, TTS_CONFIG.previewDuration);
}

export function stopPreview(): void {
  if (previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
  Speech.stop();
}

// ── WAV File Generation ───────────────────────────────────────────────────────

export interface WAVResult {
  success: boolean;
  filePath?: string;
  errorMessage?: string;
}

/**
 * Generates a WAV file from text.
 * On Android, attempts native TTS synthesizeToFile.
 * Falls back to a mock minimal WAV generation with a clear error if unavailable.
 */
export async function generateWAV(text: string): Promise<WAVResult> {
  if (Platform.OS !== 'android') {
    return { success: false, errorMessage: 'WAV generation only supported on Android' };
  }

  const processed = preprocessForTTS(text);
  const language = detectLanguage(text);
  const outputPath = `${FileSystem.cacheDirectory}smap_audio_${Date.now()}.wav`;

  // Try native bridge first (custom native module)
  try {
    const SmapTTS = NativeModules.SmapTTSModule;
    if (SmapTTS && typeof SmapTTS.synthesizeToFile === 'function') {
      const result: { success: boolean; path?: string; error?: string } =
        await SmapTTS.synthesizeToFile(processed, language, outputPath);
      if (result.success && result.path) {
        const info = await FileSystem.getInfoAsync(result.path);
        if (info.exists && (info as any).size > 44) {
          return { success: true, filePath: result.path };
        }
      }
      return { success: false, errorMessage: result.error ?? 'WAV generation failed' };
    }
  } catch (e) {
    console.warn('[TTS] Native module unavailable, trying alternate method', e);
  }

  // Fallback: write a minimal WAV header + PCM silence as placeholder
  // Real implementation requires the native module installed on device
  // This ensures the app does NOT silently succeed with an empty file
  return {
    success: false,
    errorMessage:
      'WAV generation requires the SmapTTSModule native module. ' +
      'Please build a custom dev client with the native module included. ' +
      'Message remains in pending queue.',
  };
}

export async function cleanupAudioFile(path: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
  } catch {}
}

// ── Language detection ─────────────────────────────────────────────────────────

function detectLanguage(text: string): string {
  // Bengali Unicode range: \u0980-\u09FF
  const bengaliChars = (text.match(/[\u0980-\u09FF]/g) ?? []).length;
  const totalChars = text.replace(/\s/g, '').length;

  if (totalChars === 0) return TTS_CONFIG.defaultLanguage;

  const bengaliRatio = bengaliChars / totalChars;

  if (bengaliRatio > 0.5) return 'bn-BD';     // Mostly Bengali
  if (bengaliRatio > 0.1) return 'en-IN';     // Mixed – use Indian English (better Banglish)
  return 'en-US';
}

// ── TTS availability check ─────────────────────────────────────────────────────

export async function checkTTSAvailable(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length > 0;
  } catch {
    return false;
  }
}
