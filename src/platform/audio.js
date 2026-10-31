// 8-bit sound effects synthesised with WebAudio (no audio files).
// Browsers only allow audio after a user gesture, so `unlockAudio` runs on the first tap.

let ctx = null;
let enabled = true;

export function setSoundEnabled(value) {
  enabled = value;
}

export function unlockAudio() {
  if (!ctx) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return;
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

/**
 * Plays a sequence of square-wave notes.
 * @param {Array<[frequency: number, durationSec: number]>} notes
 */
function play(notes, { volume = 0.12, type = 'square' } = {}) {
  if (!enabled || !ctx) return;
  let at = ctx.currentTime;
  for (const [frequency, duration] of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(volume, at);
    // Short release so notes don't click.
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + duration);
    at += duration;
  }
}

export const sfx = {
  start: () => play([[523, 0.06], [784, 0.1]]),
  endTurn: () => play([[784, 0.06], [523, 0.1]]),
  tap: () => play([[660, 0.04]], { volume: 0.06 }),
  /** Countdown beep; higher and shorter as `secondsLeft` approaches zero. */
  warning: (secondsLeft) => play([[880 + (5 - secondsLeft) * 110, 0.08]], { volume: 0.14 }),
  timeout: () => play([[392, 0.12], [330, 0.12], [262, 0.12], [196, 0.35]], { type: 'sawtooth', volume: 0.1 }),
  win: () => play([[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.16], [784, 0.08], [1047, 0.3]]),
};
