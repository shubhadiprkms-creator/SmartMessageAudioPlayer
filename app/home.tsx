import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { ESP32StatusCard } from '@/components/feature/ESP32StatusCard';
import { MessageCard } from '@/components/feature/MessageCard';
import { ManualMessageInput } from '@/components/feature/ManualMessageInput';
import { useMessages } from '@/hooks/useMessages';
import { useNotificationListener } from '@/hooks/useNotificationListener';
import { isNativeBridgeAvailable } from '@/services/notificationBridge';

export default function HomeScreen() {
  const router = useRouter();
  const { messages, isLoaded } = useMessages();
  const insets = useSafeAreaInsets();

  // Start notification listener
  useNotificationListener();

  const pendingMessages = messages.filter((m) => m.status !== 'sent');

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="inbox" size={52} color={Colors.textDisabled} />
      <Text style={styles.emptyTitle}>No Pending Messages</Text>
      <Text style={styles.emptySubtitle}>
        Incoming SMS and messages will appear here automatically.
        {!isNativeBridgeAvailable()
          ? '\n\nNote: Notification auto-detection requires a custom dev build with native modules.'
          : '\n\nMake sure notification access is enabled in Settings.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="speaker" size={22} color={Colors.primary} />
          <View>
            <Text style={styles.appName}>Smart Message</Text>
            <Text style={styles.appNameSub}>Audio Player</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
          accessibilityLabel="Settings"
        >
          <MaterialIcons name="settings" size={24} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Message count badge */}
      {pendingMessages.length > 0 ? (
        <View style={styles.countBadge}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>
            {pendingMessages.length} pending message{pendingMessages.length !== 1 ? 's' : ''}
          </Text>
        </View>
      ) : null}

      {/* Main list */}
      <FlatList
        data={pendingMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageCard message={item} />}
        ListHeaderComponent={
          <>
            <ESP32StatusCard />
            <View style={styles.sectionLabel}>
              <Text style={styles.sectionText}>MESSAGE QUEUE</Text>
            </View>
          </>
        }
        ListFooterComponent={
          <ManualMessageInput />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          pendingMessages.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.lg * 1.2,
  },
  appNameSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
  settingsBtn: {
    padding: Spacing.xs,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  countDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.warning,
  },
  countText: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  sectionText: {
    color: Colors.textDisabled,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textDisabled,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.7,
  },
});
