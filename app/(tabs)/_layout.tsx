// This file exists to satisfy Expo Router's tab group structure.
// The app uses stack navigation (app/home.tsx) rather than tabs.
// Redirect to home.
import { Redirect } from 'expo-router';

export default function TabsLayout() {
  return <Redirect href="/home" />;
}
