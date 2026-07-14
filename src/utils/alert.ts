import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Cross-platform alert.
 *
 * react-native-web does not implement Alert.alert — it is a silent no-op there,
 * which would drop any action wired to a button's onPress (logout, reorder, etc).
 * On web we fall back to the browser's native alert/confirm so those actions still run.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const body = message ? `${title}\n\n${message}` : title;
  const actionable = buttons?.filter((b) => b.style !== 'cancel') ?? [];

  // Informational: no buttons, or a single non-cancel button.
  if (actionable.length <= 1 && (buttons?.length ?? 0) <= 1) {
    window.alert(body);
    actionable[0]?.onPress?.();
    return;
  }

  // Confirmation: a cancel button plus an action.
  const confirmBtn = actionable[actionable.length - 1];
  const cancelBtn = buttons?.find((b) => b.style === 'cancel');

  if (window.confirm(body)) confirmBtn?.onPress?.();
  else cancelBtn?.onPress?.();
}
