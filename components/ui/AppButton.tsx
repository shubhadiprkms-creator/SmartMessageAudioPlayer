import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  small?: boolean;
  accessibilityLabel?: string;
}

const VARIANTS: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.primary, text: '#000000' },
  secondary: { bg: Colors.surfaceElevated, text: Colors.textPrimary, border: Colors.surfaceBorder },
  danger: { bg: Colors.error, text: '#FFFFFF' },
  ghost: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
  success: { bg: Colors.success, text: '#000000' },
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  textStyle,
  small,
  accessibilityLabel,
}: Props) {
  const v = VARIANTS[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        {
          backgroundColor: v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border ?? 'transparent',
          opacity: isDisabled ? 0.45 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text
          style={[
            styles.text,
            small && styles.textSmall,
            { color: v.text },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 80,
  },
  small: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 4,
    minHeight: 36,
    minWidth: 60,
  },
  text: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: FontSize.sm,
  },
});
