import React, { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { ESP32Config, ESP32Status } from '@/types';
import { checkESP32Status } from '@/services/esp32Service';
import { loadESP32Config, saveESP32Config } from '@/services/storageService';
import { ESP32_DEFAULTS } from '@/constants/config';

interface ESP32ContextType {
  status: ESP32Status;
  config: ESP32Config;
  statusMessage: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateConfig: (cfg: Partial<ESP32Config>) => void;
  isReady: boolean;
}

export const ESP32Context = createContext<ESP32ContextType | undefined>(undefined);

export function ESP32Provider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ESP32Status>('disconnected');
  const [statusMessage, setStatusMessage] = useState('Not connected');
  const [config, setConfig] = useState<ESP32Config>({
    ip: ESP32_DEFAULTS.ip,
    port: ESP32_DEFAULTS.port,
  });
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectedRef = useRef(false);

  // Load saved config
  useEffect(() => {
    (async () => {
      const saved = await loadESP32Config();
      if (saved) setConfig(saved);
    })();
  }, []);

  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const startPing = useCallback((cfg: ESP32Config) => {
    stopPing();
    pingIntervalRef.current = setInterval(async () => {
      if (!isConnectedRef.current) {
        stopPing();
        return;
      }
      const alive = await checkESP32Status(cfg);
      if (!alive && isConnectedRef.current) {
        isConnectedRef.current = false;
        setStatus('disconnected');
        setStatusMessage('Connection lost — ESP32 unreachable');
        stopPing();
      }
    }, 10_000);
  }, [stopPing]);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setStatusMessage('Connecting to ESP32...');

    const alive = await checkESP32Status(config);
    if (alive) {
      isConnectedRef.current = true;
      setStatus('connected');
      setStatusMessage(`Connected — ${config.ip}:${config.port}`);
      startPing(config);
    } else {
      isConnectedRef.current = false;
      setStatus('failed');
      setStatusMessage(`Cannot reach ESP32 at ${config.ip}:${config.port}`);
    }
  }, [config, startPing]);

  const disconnect = useCallback(() => {
    isConnectedRef.current = false;
    stopPing();
    setStatus('disconnected');
    setStatusMessage('Disconnected');
  }, [stopPing]);

  const updateConfig = useCallback((cfg: Partial<ESP32Config>) => {
    setConfig((prev) => {
      const next = { ...prev, ...cfg };
      saveESP32Config(next);
      return next;
    });
    // Disconnect when config changes
    if (isConnectedRef.current) {
      isConnectedRef.current = false;
      stopPing();
      setStatus('disconnected');
      setStatusMessage('Config changed — please reconnect');
    }
  }, [stopPing]);

  useEffect(() => {
    return () => {
      stopPing();
    };
  }, [stopPing]);

  const isReady = status === 'connected';

  return (
    <ESP32Context.Provider
      value={{ status, config, statusMessage, connect, disconnect, updateConfig, isReady }}
    >
      {children}
    </ESP32Context.Provider>
  );
}
