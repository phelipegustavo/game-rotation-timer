// Game settings: defaults, allowed ranges and normalisation.
// All durations are in milliseconds.

const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const SETTING_LIMITS = Object.freeze({
  startingBankMs: { min: 1 * MINUTE, max: 60 * MINUTE, step: 1 * MINUTE },
  refillMs: { min: 15 * SECOND, max: 5 * MINUTE, step: 15 * SECOND },
});

export const DEFAULT_SETTINGS = Object.freeze({
  startingBankMs: 10 * MINUTE,
  refillMs: 1 * MINUTE,
  endOnFirstWin: false,
  allowOutOfTurnWins: false,
  sound: true,
  vibration: true,
});

/** Snaps a value onto a range's step grid and clamps it to the range. */
function fitRange(value, { min, max, step }, fallback) {
  if (!Number.isFinite(value)) return fallback;
  const snapped = Math.round(value / step) * step;
  return Math.min(max, Math.max(min, snapped));
}

/** Returns a complete, valid settings object from any (possibly partial or stale) input. */
export function normalizeSettings(input = {}) {
  const raw = input ?? {};
  return {
    startingBankMs: fitRange(raw.startingBankMs, SETTING_LIMITS.startingBankMs, DEFAULT_SETTINGS.startingBankMs),
    refillMs: fitRange(raw.refillMs, SETTING_LIMITS.refillMs, DEFAULT_SETTINGS.refillMs),
    endOnFirstWin: typeof raw.endOnFirstWin === 'boolean' ? raw.endOnFirstWin : DEFAULT_SETTINGS.endOnFirstWin,
    allowOutOfTurnWins:
      typeof raw.allowOutOfTurnWins === 'boolean' ? raw.allowOutOfTurnWins : DEFAULT_SETTINGS.allowOutOfTurnWins,
    sound: typeof raw.sound === 'boolean' ? raw.sound : DEFAULT_SETTINGS.sound,
    vibration: typeof raw.vibration === 'boolean' ? raw.vibration : DEFAULT_SETTINGS.vibration,
  };
}

/** Moves a duration setting one step up (+1) or down (-1), staying within its range. */
export function stepSetting(settings, key, direction) {
  const limits = SETTING_LIMITS[key];
  return normalizeSettings({ ...settings, [key]: settings[key] + direction * limits.step });
}
