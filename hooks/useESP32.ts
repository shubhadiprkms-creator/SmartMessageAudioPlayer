import { useContext } from 'react';
import { ESP32Context } from '@/contexts/ESP32Context';

export function useESP32() {
  const ctx = useContext(ESP32Context);
  if (!ctx) throw new Error('useESP32 must be used within ESP32Provider');
  return ctx;
}
