export async function setDeviceOrientation(orientation) {
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
