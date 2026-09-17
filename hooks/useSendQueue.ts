/**
 * Send Queue Hook
 * Manages sequential sending of messages to ESP32.
 * One message at a time — never parallel.
 */
import { useCallback, useRef, useState } from 'react';
import { useMessages } from './useMessages';
import { useESP32 } from './useESP32';
import { generateWAV, cleanupAudioFile } from '@/services/ttsService';
import { transferAudio } from '@/services/esp32Service';
import type { PendingMessage } from '@/types';

export function useSendQueue() {
  const { messages, updateMessageStatus, removeMessage, setAudioPath } = useMessages();
  const { config, isReady } = useESP32();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const isSendingRef = useRef(false);

  const sendMessage = useCallback(
    async (msg: PendingMessage): Promise<void> => {
      if (isSendingRef.current) return;
      if (!isReady) {
        updateMessageStatus(msg.id, 'failed', 'ESP32 not connected. Please connect first.');
        return;
      }

      isSendingRef.current = true;
      setSendingId(msg.id);
      setTransferProgress(0);

      try {
        // Step 1: Generate WAV
        updateMessageStatus(msg.id, 'generating');
        const wavResult = await generateWAV(msg.text);

        if (!wavResult.success || !wavResult.filePath) {
          updateMessageStatus(
            msg.id,
            'failed',
            wavResult.errorMessage ?? 'WAV generation failed'
          );
          return;
        }

        setAudioPath(msg.id, wavResult.filePath);

        // Step 2: Transfer to ESP32
        updateMessageStatus(msg.id, 'sending');

        const transferResult = await transferAudio(
          config,
          wavResult.filePath,
          setTransferProgress
        );

        // Cleanup audio file regardless
        await cleanupAudioFile(wavResult.filePath);

        if (transferResult.success) {
          // Remove from pending queue on success
          removeMessage(msg.id);
        } else {
          updateMessageStatus(
            msg.id,
            'failed',
            transferResult.errorMessage ?? 'Transfer failed'
          );
        }
      } catch (e: any) {
        updateMessageStatus(msg.id, 'failed', e?.message ?? 'Unexpected error');
      } finally {
        isSendingRef.current = false;
        setSendingId(null);
        setTransferProgress(0);
      }
    },
    [isReady, config, updateMessageStatus, removeMessage, setAudioPath]
  );

  const isSending = sendingId !== null;

  return {
    sendMessage,
    sendingId,
    isSending,
    transferProgress,
  };
}
