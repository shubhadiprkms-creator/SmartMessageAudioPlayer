import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MessageProvider } from '@/contexts/MessageContext';
import { ESP32Provider } from '@/contexts/ESP32Context';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <ESP32Provider>
          <MessageProvider>
            <StatusBar style="light" backgroundColor="#0D1117" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0D1117' },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="home" />
              <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </MessageProvider>
        </ESP32Provider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
