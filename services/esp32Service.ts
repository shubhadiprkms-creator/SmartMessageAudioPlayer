/**
 * ESP32 Communication Service
 *
 * Protocol over HTTP on local WiFi:
 *
 * GET  /status           → { "status": "ready" }
 * POST /audio            → multipart WAV upload
 *                          Response: { "ack": "SMAP_ACK_OK" | "SMAP_ACK_FAIL", "msg": string }
 *
 * The ESP32 firmware must implement this same protocol.
 * See protocol documentation at bottom of this file.
 */
import * as FileSystem from 'expo-file-system';
import { ESP32_DEFAULTS, PROTOCOL } from '@/constants/config';
import type { ESP32Config, TransferResult } from '@/types';

function buildBaseUrl(config: ESP32Config): string {
  return `http://${config.ip}:${config.port}`;
}

// ── Connection / Status ───────────────────────────────────────────────────────

export async function checkESP32Status(config: ESP32Config): Promise<boolean> {
  const url = `${buildBaseUrl(config)}/status`;
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), ESP32_DEFAULTS.connectTimeout);
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return false;
    const body = await res.json();
    return body?.status === 'ready' || body?.status === 'ok';
  } catch {
    return false;
  }
}

// ── Audio Transfer ────────────────────────────────────────────────────────────

export async function transferAudio(
  config: ESP32Config,
  wavFilePath: string,
  onProgress?: (percent: number) => void
): Promise<TransferResult> {
  const url = `${buildBaseUrl(config)}/audio`;

  // 1. Verify file exists and has content
  let fileInfo: FileSystem.FileInfo;
  try {
    fileInfo = await FileSystem.getInfoAsync(wavFilePath);
  } catch (e) {
    return { success: false, errorMessage: 'Cannot access audio file' };
  }
  if (!fileInfo.exists) {
    return { success: false, errorMessage: 'Audio file does not exist' };
  }
  const fileSize = (fileInfo as any).size ?? 0;
  if (fileSize <= 44) {
    return { success: false, errorMessage: 'Audio file is empty or invalid (size: ' + fileSize + ')' };
  }

  // 2. Upload via FileSystem.uploadAsync (supports multipart + progress)
  try {
    onProgress?.(5);

    const uploadResult = await FileSystem.uploadAsync(url, wavFilePath, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'audio',
      mimeType: 'audio/wav',
      headers: {
        'X-SMAP-Protocol': PROTOCOL.TRANSFER_START,
        'X-SMAP-Size': String(fileSize),
      },
    });

    onProgress?.(80);

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      return {
        success: false,
        errorMessage: `HTTP ${uploadResult.status}: ESP32 rejected the audio`,
      };
    }

    // 3. Parse acknowledgement
    let body: { ack?: string; msg?: string } = {};
    try {
      body = JSON.parse(uploadResult.body);
    } catch {
      // Non-JSON response – check text
      if (uploadResult.body.includes(PROTOCOL.ACK_SUCCESS)) {
        onProgress?.(100);
        return { success: true };
      }
      return { success: false, errorMessage: 'ESP32 response not understood: ' + uploadResult.body };
    }

    onProgress?.(100);

    if (body.ack === PROTOCOL.ACK_SUCCESS) {
      return { success: true };
    }
    return {
      success: false,
      errorMessage: body.msg ?? `ESP32 returned: ${body.ack ?? 'no ack'}`,
    };
  } catch (e: any) {
    if (e?.message?.includes('Network request failed') || e?.message?.includes('AbortError')) {
      return { success: false, errorMessage: 'Connection lost during transfer. Message kept in queue.' };
    }
    return { success: false, errorMessage: e?.message ?? 'Transfer failed unexpectedly' };
  }
}

/*
 * ════════════════════════════════════════════════════════════════
 * ESP32 FIRMWARE PROTOCOL DOCUMENTATION
 * ════════════════════════════════════════════════════════════════
 *
 * The ESP32 must implement an HTTP server on port 8080 (default)
 * with the following endpoints:
 *
 * ──────────────────────────────────────────────────────────────
 * GET /status
 * ──────────────────────────────────────────────────────────────
 * Purpose: Connection health check
 * Response 200 JSON:
 *   { "status": "ready" }
 *   or
 *   { "status": "ok" }
 *
 * ──────────────────────────────────────────────────────────────
 * POST /audio
 * ──────────────────────────────────────────────────────────────
 * Purpose: Receive WAV audio file to play
 * Content-Type: multipart/form-data
 * Field: "audio" (WAV file)
 * Headers:
 *   X-SMAP-Protocol: SMAP_START
 *   X-SMAP-Size: <file size in bytes>
 *
 * Success Response 200 JSON:
 *   { "ack": "SMAP_ACK_OK", "msg": "Playing audio" }
 *
 * Failure Response 200 or 4xx JSON:
 *   { "ack": "SMAP_ACK_FAIL", "msg": "<reason>" }
 *
 * On receiving complete audio:
 *   1. Verify X-SMAP-Size matches received bytes
 *   2. Write to SD card (optional) or RAM buffer
 *   3. Start playback through DAC/amplifier
 *   4. Respond with SMAP_ACK_OK
 *
 * If transfer is incomplete (size mismatch):
 *   Respond with SMAP_ACK_FAIL + reason
 *
 * WAV Format:
 *   PCM, 16-bit, Mono, 22050 Hz
 *   Standard RIFF/WAV header
 * ════════════════════════════════════════════════════════════════
 */
