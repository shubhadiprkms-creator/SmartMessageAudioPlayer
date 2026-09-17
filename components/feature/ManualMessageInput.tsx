import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { AppButton } from '@/components/ui/AppButton';
import { useMessages } from '@/hooks/useMessages';

interface Props {
  onAdded?: () => void;
}

export function ManualMessageInput({ onAdded }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sender, setSender] = useState('Manual');
  const [text, setText] = useState('');
  const { addMessage } = useMessages();

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    await addMessage({
      sender: sender.trim() || 'Manual',
      text: trimmed,
      timestamp: Date.now(),
      isManual: true,
    });
    setText('');
    setIsExpanded(false);
    onAdded?.();
  };

  if (!isExpanded) {
    return (
      <Pressable
        style={({ pressed }) => [styles.collapseBtn, pressed && styles.collapseBtnPressed]}
        onPress={() => setIsExpanded(true)}
        accessibilityLabel="Add manual message"
      >
        <MaterialIcons name="add-circle-outline" size={18} color={Colors.primary} />
        <Text style={styles.collapseBtnText}>Add Message Manually</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Manual Message</Text>
        <Pressable onPress={() => setIsExpanded(false)} hitSlop={12}>
          <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <TextInput
        style={styles.senderInput}
        value={sender}
        onChangeText={setSender}
        placeholder="Sender name"
        placeholderTextColor={Colors.textDisabled}
        accessibilityLabel="Sender name"
      />

      <TextInput
        style={styles.textInput}
        value={text}
        onChangeText={setText}
        placeholder="Type or paste message text..."
        placeholderTextColor={Colors.textDisabled}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        accessibilityLabel="Message text"
      />

      <View style={styles.btnRow}>
        <AppButton
          label="Cancel"
          variant="secondary"
          small
          onPress={() => { setIsExpanded(false); setText(''); }}
          style={styles.btn}
        />
        <AppButton
          label="Add to Queue"
          variant="primary"
          small
          disabled={text.trim().length === 0}
          onPress={handleAdd}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
  },
  collapseBtnPressed: {
    opacity: 0.7,
  },
  collapseBtnText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  container: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  senderInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
    minHeight: 40,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.5,
    minHeight: 90,
    marginBottom: Spacing.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
  },
});
