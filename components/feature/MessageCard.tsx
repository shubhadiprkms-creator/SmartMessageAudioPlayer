import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { AppButton } from '@/components/ui/AppButton';
import { previewMessage, stopPreview } from '@/services/ttsService';
import { useSendQueue } from '@/hooks/useSendQueue';
import { useAlerts } from '@/hooks/useAlerts';
import type { PendingMessage } from '@/types';

interface Props {
  message: PendingMessage;
}

export function MessageCard({ message }: Props) {
  const { sendMessage, sendingId, isSending } = useSendQueue();
  const { showAlert } = useAlerts();
  const [isPreviewing, setIsPreviewing] = useState(false);

  const isSendingThis = sendingId === message.id;
  const isProcessing = isSendingThis;

  const handlePreview = () => {
    if (isPreviewing) {
      stopPreview();
      setIsPreviewing(false);
      return;
    }
    setIsPreviewing(true);
    previewMessage(
      message.text,
      () => setIsPreviewing(false),
      (err) => {
        setIsPreviewing(false);
        showAlert('TTS Error', err);
      }
    );
  };

  const handleSend = () => {
    if (isSending && !isSendingThis) {
      showAlert('Queue Busy', 'Another message is currently being sent. Please wait.');
      return;
    }
    sendMessage(message);
  };

  const statusColor = getStatusColor(message.status);
  const statusIcon = getStatusIcon(message.status);

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.card, isSendingThis && styles.cardActive]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.senderRow}>
          <MaterialIcons name="person" size={14} color={Colors.textSecondary} />
          <Text style={styles.sender}>{message.sender}</Text>
          {message.isManual ? (
            <View style={styles.manualBadge}>
              <Text style={styles.manualBadgeText}>Manual</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.time}>{formattedTime}</Text>
      </View>

      {/* Message text */}
      <Text style={styles.messageText}>{message.text}</Text>

      {/* Status */}
      {message.status !== 'pending' ? (
        <View style={styles.statusRow}>
          <MaterialIcons name={statusIcon as any} size={13} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(message.status)}
            {isSendingThis && message.status === 'generating' ? ' audio...' : ''}
            {isSendingThis && message.status === 'sending' ? ' to ESP32...' : ''}
          </Text>
        </View>
      ) : null}

      {/* Error */}
      {message.errorMessage ? (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={13} color={Colors.error} />
          <Text style={styles.errorText}>{message.errorMessage}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionRow}>
        <AppButton
          label={isPreviewing ? 'Stop' : 'Preview'}
          variant="secondary"
          small
          onPress={handlePreview}
          style={styles.previewBtn}
        />

        {isProcessing ? (
          <View style={styles.sendingIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.sendingText}>Sending...</Text>
          </View>
        ) : (
          <AppButton
            label={message.status === 'failed' ? 'Retry' : 'Send'}
            variant={message.status === 'failed' ? 'danger' : 'primary'}
            small
            onPress={handleSend}
            disabled={isSending && !isSendingThis}
            style={styles.sendBtn}
          />
        )}
      </View>
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'generating': return Colors.warning;
    case 'sending': return Colors.info;
    case 'sent': return Colors.success;
    case 'failed': return Colors.error;
    default: return Colors.textSecondary;
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'generating': return 'graphic-eq';
    case 'sending': return 'upload';
    case 'sent': return 'check-circle';
    case 'failed': return 'error';
    default: return 'schedule';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'generating': return 'Generating';
    case 'sending': return 'Sending';
    case 'sent': return 'Sent';
    case 'failed': return 'Failed';
    case 'pending': return 'Pending';
    default: return status;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sender: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  manualBadge: {
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    marginLeft: 4,
  },
  manualBadgeText: {
    color: '#C4B5FD',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  time: {
    color: Colors.textDisabled,
    fontSize: FontSize.xs,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.55,
    marginBottom: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: Colors.errorDim,
    borderRadius: Radius.sm,
    padding: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    flex: 1,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  previewBtn: {
    flex: 1,
  },
  sendBtn: {
    flex: 1,
  },
  sendingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 36,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
  },
  sendingText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
