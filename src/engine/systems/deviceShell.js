import { registerPlugin } from '@capacitor/core';

const NativeDeviceShell = registerPlugin('DeviceShell');

export async function setDeviceOrientation(orientation) {
  try {
    await NativeDeviceShell.setOrientation({ orientation });
    return true;
  } catch {
    // Fall back to the browser API for web/PWA builds.
  }

  if (typeof screen === 'undefined' || !screen.orientation?.lock) return false;

  try {
    await screen.orientation.lock(orientation);
    return true;
  } catch {
    // Browsers may reject orientation locks outside a user gesture. Android
    // still receives the requested orientation through the native activity.
    return false;
  }
}

export function requestGameplayOrientation() {
  return setDeviceOrientation('landscape');
}

export function requestLobbyOrientation() {
  return setDeviceOrientation('portrait');
}
