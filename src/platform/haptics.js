// Vibration feedback. It is an extra channel next to sound, not a fallback:
// it fires wherever the Vibration API exists (not on iOS) and is a no-op elsewhere.

const PATTERNS = {
  start: 40,
  endTurn: [30, 40, 30],
  warning: 20,
  timeout: [120, 60, 120, 60, 240],
  win: [60, 40, 60, 40, 200],
};

export function vibrate(kind) {
  try {
    navigator.vibrate?.(PATTERNS[kind]);
  } catch {
    // Some browsers throw when vibration is blocked; ignore.
  }
}
