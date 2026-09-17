import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import type { ESP32Status } from '@/types';

interface Props {
  status: ESP32Status;
  size?: number;
}

const STATUS_COLORS: Record<ESP32Status, string> = {
  connected: Colors.connected,
  disconnected: Colors.disconnected,
  connecting: Colors.connecting,
  failed: Colors.error,
};

export function StatusDot({ status, size = 10 }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'connecting') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(1);
    }
  }, [status, pulse]);

  const color = STATUS_COLORS[status];

  return (
    <View style={[styles.wrapper, { width: size * 2, height: size * 2 }]}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            backgroundColor: color,
            opacity: 0.25,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
  },
});
