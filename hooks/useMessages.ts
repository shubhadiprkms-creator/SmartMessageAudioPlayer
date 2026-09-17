import { useContext } from 'react';
import { MessageContext } from '@/contexts/MessageContext';

export function useMessages() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error('useMessages must be used within MessageProvider');
  return ctx;
}
