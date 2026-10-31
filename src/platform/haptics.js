// Vibration feedback. It is an extra channel next to sound, not a fallback:
// it fires wherever the Vibration API exists (not on iOS) and is a no-op elsewhere.
// Pulses are kept at 50 ms or more: many Android motors don't register shorter ones.

const PATTERNS = {
  tap: 50,
  start: 120,
  endTurn: [80, 60, 80],
  warning: 60,
  timeout: [200, 80, 200, 80, 400],
  win: [100, 60, 100, 60, 300],
};

let enabled = true;

export function setVibrationEnabled(value) {
  enabled = value;
}

export const canVibrate = () => typeof navigator.vibrate === 'function';

/** Returns whether the browser accepted the vibration request. */
export function vibrate(kind) {
  if (!enabled || !canVibrate()) return false;
  try {
    return navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers throw when vibration is blocked; ignore.
    return false;
  }
}
