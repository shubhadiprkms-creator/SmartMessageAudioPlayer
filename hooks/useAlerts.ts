import { useAlert } from '@/template';

export function useAlerts() {
  const { showAlert } = useAlert();
  return { showAlert };
}
