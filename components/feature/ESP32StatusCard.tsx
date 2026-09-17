import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { StatusDot } from '@/components/ui/StatusDot';
import { AppButton } from '@/components/ui/AppButton';
import { useESP32 } from '@/hooks/useESP32';
import type { ESP32Status } from '@/types';

const STATUS_LABELS: Record<ESP32Status, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  failed: 'Connection Failed',
};

export function ESP32StatusCard() {
  const { status, statusMessage, connect, disconnect, config } = useESP32();

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MaterialIcons name="speaker" size={20} color={Colors.primary} />
          <Text style={styles.title}>ESP32 Speaker</Text>
        </View>
        <View style={styles.statusRow}>
          <StatusDot status={status} size={7} />
          <Text style={[styles.statusLabel, { color: getStatusColor(status) }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      {/* Address */}
      <Text style={styles.address}>
        <Text style={styles.addressLabel}>Address: </Text>
        {config.ip}:{config.port}
      </Text>

      {/* Status message */}
      {statusMessage ? (
        <Text style={[styles.statusMsg, status === 'failed' && styles.statusMsgError]}>
          {statusMessage}
        </Text>
      ) : null}

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {isConnected ? (
          <AppButton
            label="Disconnect"
            variant="danger"
            small
            onPress={disconnect}
            style={styles.btn}
          />
        ) : (
          <AppButton
            label={isConnecting ? 'Connecting...' : 'Connect'}
            variant="primary"
            small
            loading={isConnecting}
            disabled={isConnecting}
            onPress={connect}
            style={styles.btn}
          />
        )}
      </View>
    </View>
  );
}

function getStatusColor(status: ESP32Status): string {
  switch (status) {
    case 'connected': return Colors.connected;
    case 'connecting': return Colors.warning;
    case 'failed': return Colors.error;
    default: return Colors.textSecondary;
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  address: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  addressLabel: {
    color: Colors.textDisabled,
  },
  statusMsg: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  statusMsgError: {
    color: Colors.error,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btn: {
    flex: 1,
  },
});
