import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { AppButton } from '@/components/ui/AppButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { useESP32 } from '@/hooks/useESP32';
import {
  checkNotificationAccess,
  openNotificationAccessSettings,
  isNativeBridgeAvailable,
} from '@/services/notificationBridge';
import { checkTTSAvailable } from '@/services/ttsService';
import { APP_NAME, APP_VERSION } from '@/constants/config';

export default function SettingsScreen() {
  const router = useRouter();
  const { status, config, updateConfig, connect, isReady } = useESP32();

  const [ip, setIp] = useState(config.ip);
  const [port, setPort] = useState(String(config.port));
  const [configChanged, setConfigChanged] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const [notifAccess, setNotifAccess] = useState<boolean | null>(null);
  const [ttsAvailable, setTTSAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check notification access on mount and when screen focuses
    checkNotificationAccess().then(setNotifAccess);
    checkTTSAvailable().then(setTTSAvailable);
  }, []);

  const handleSaveConfig = () => {
    const portNum = parseInt(port, 10);
    if (!ip.trim() || isNaN(portNum) || portNum < 1 || portNum > 65535) return;
    updateConfig({ ip: ip.trim(), port: portNum });
    setConfigChanged(false);
  };

  const handleTestConnection = async () => {
    if (configChanged) handleSaveConfig();
    setTestingConnection(true);
    await connect();
    setTestingConnection(false);
  };

  const handleNotifSettings = async () => {
    await openNotificationAccessSettings();
    // Re-check after returning
    setTimeout(async () => {
      const result = await checkNotificationAccess();
      setNotifAccess(result);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Notification Access ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MESSAGE ACCESS</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <MaterialIcons name="notifications" size={20} color={Colors.primary} />
                <Text style={styles.cardLabel}>Notification Access</Text>
              </View>
              <View style={styles.rowLeft}>
                <MaterialIcons
                  name={notifAccess === true ? 'check-circle' : notifAccess === false ? 'cancel' : 'help'}
                  size={18}
                  color={notifAccess === true ? Colors.success : notifAccess === false ? Colors.error : Colors.textDisabled}
                />
                <Text style={[
                  styles.accessStatus,
                  {
                    color: notifAccess === true ? Colors.success
                      : notifAccess === false ? Colors.error
                      : Colors.textDisabled
                  }
                ]}>
                  {notifAccess === true ? 'Enabled' : notifAccess === false ? 'Disabled' : 'Unknown'}
                </Text>
              </View>
            </View>

            {!isNativeBridgeAvailable() ? (
              <View style={styles.infoBox}>
                <MaterialIcons name="info-outline" size={14} color={Colors.info} />
                <Text style={styles.infoText}>
                  Auto-detection requires a custom dev build with native Android modules (SmapNotificationModule + NotificationListenerService).
                </Text>
              </View>
            ) : notifAccess === false ? (
              <>
                <Text style={styles.accessDescription}>
                  Enable notification access so the app can detect incoming SMS and messages automatically.
                </Text>
                <AppButton
                  label="Enable Message Access"
                  variant="primary"
                  onPress={handleNotifSettings}
                  style={styles.accessBtn}
                />
              </>
            ) : (
              <Text style={styles.accessDescription}>
                Notification access is active. The app will detect incoming messages automatically.
              </Text>
            )}

            <Pressable
              onPress={handleNotifSettings}
              style={({ pressed }) => [styles.openSettingsLink, pressed && { opacity: 0.6 }]}
            >
              <MaterialIcons name="open-in-new" size={14} color={Colors.primary} />
              <Text style={styles.openSettingsText}>Open Notification Access Settings</Text>
            </Pressable>
          </View>
        </View>

        {/* ── ESP32 Configuration ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESP32 SPEAKER DEVICE</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardLabel}>Connection Status</Text>
              <View style={styles.rowLeft}>
                <StatusDot status={status} size={6} />
                <Text style={styles.statusText}>
                  {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting' : status === 'failed' ? 'Failed' : 'Disconnected'}
                </Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>ESP32 IP Address</Text>
            <TextInput
              style={styles.input}
              value={ip}
              onChangeText={(v) => { setIp(v); setConfigChanged(true); }}
              placeholder="192.168.1.100"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="decimal-pad"
              accessibilityLabel="ESP32 IP address"
            />

            <Text style={styles.fieldLabel}>Port</Text>
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={(v) => { setPort(v); setConfigChanged(true); }}
              placeholder="8080"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="number-pad"
              accessibilityLabel="ESP32 port number"
            />

            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={14} color={Colors.info} />
              <Text style={styles.infoText}>
                Both your phone and the ESP32 must be on the same WiFi network.
                The ESP32 must have its HTTP server running on this port.
              </Text>
            </View>

            <View style={styles.btnRow}>
              {configChanged ? (
                <AppButton
                  label="Save Config"
                  variant="secondary"
                  small
                  onPress={handleSaveConfig}
                  style={styles.halfBtn}
                />
              ) : null}
              <AppButton
                label={isReady ? 'Re-test' : 'Test Connection'}
                variant={isReady ? 'success' : 'primary'}
                small
                loading={testingConnection}
                onPress={handleTestConnection}
                style={styles.halfBtn}
              />
            </View>

            {/* Protocol info */}
            <Pressable style={styles.protocolBox}>
              <Text style={styles.protocolTitle}>ESP32 Protocol Reference</Text>
              <Text style={styles.protocolText}>
                {'GET /status → { "status": "ready" }\n'}
                {'POST /audio → multipart WAV upload\n'}
                {'Response: { "ack": "SMAP_ACK_OK" }\n'}
                {'Port: 8080 (default) | Format: PCM 16-bit mono 22050Hz'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── TTS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEXT-TO-SPEECH</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <MaterialIcons name="record-voice-over" size={20} color={Colors.primary} />
                <Text style={styles.cardLabel}>TTS Engine</Text>
              </View>
              <View style={styles.rowLeft}>
                <MaterialIcons
                  name={ttsAvailable === true ? 'check-circle' : ttsAvailable === false ? 'cancel' : 'help'}
                  size={18}
                  color={ttsAvailable === true ? Colors.success : ttsAvailable === false ? Colors.error : Colors.textDisabled}
                />
                <Text style={[
                  styles.accessStatus,
                  { color: ttsAvailable === true ? Colors.success : ttsAvailable === false ? Colors.error : Colors.textDisabled }
                ]}>
                  {ttsAvailable === true ? 'Available' : ttsAvailable === false ? 'Unavailable' : 'Checking...'}
                </Text>
              </View>
            </View>
            <Text style={styles.accessDescription}>
              Supports English, Bengali, and Banglish mixed text.{'\n'}
              Long digit sequences (OTPs, phone numbers) are spoken digit-by-digit.
            </Text>
            {ttsAvailable === false ? (
              <View style={styles.infoBox}>
                <MaterialIcons name="warning" size={14} color={Colors.warning} />
                <Text style={[styles.infoText, { color: Colors.warning }]}>
                  No TTS voices found. Install a TTS engine from the Play Store (e.g. Google Text-to-Speech).
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── App Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.fieldLabel}>Application</Text>
              <Text style={styles.valueText}>{APP_NAME}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.fieldLabel}>Version</Text>
              <Text style={styles.valueText}>{APP_VERSION}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.fieldLabel}>Platform</Text>
              <Text style={styles.valueText}>{Platform.OS === 'android' ? `Android ${Platform.Version}` : Platform.OS}</Text>
            </View>
            <View style={styles.infoBox}>
              <MaterialIcons name="lock-outline" size={14} color={Colors.success} />
              <Text style={styles.infoText}>
                Message data remains on your device. No cloud upload occurs except to your configured ESP32.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: {
    padding: Spacing.xs,
    width: 40,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textDisabled,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accessStatus: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  accessDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.6,
  },
  accessBtn: {
    marginTop: 2,
  },
  openSettingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: Spacing.xs,
  },
  openSettingsText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    minHeight: 44,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    flex: 1,
    lineHeight: FontSize.xs * 1.7,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfBtn: {
    flex: 1,
  },
  protocolBox: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  protocolTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  protocolText: {
    color: Colors.textDisabled,
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: FontSize.xs * 1.8,
  },
  valueText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});
