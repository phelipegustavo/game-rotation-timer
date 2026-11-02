// App shell: holds UI state, wires user actions to the pure Game rules, renders screens and
// runs the clock loop (Timeouts, countdown warnings, persistence).

import { t } from './strings.js';
import { formatClock } from './ui/dom.js';
import { load, save, remove } from './platform/storage.js';
import { sfx, unlockAudio, setSoundEnabled } from './platform/audio.js';
import { vibrate, setVibrationEnabled } from './platform/haptics.js';
import { keepScreenOn } from './platform/wake-lock.js';
import { launchConfetti } from './ui/confetti.js';
import { normalizeSettings, stepSetting } from './domain/settings.js';
import * as rosterRules from './domain/roster.js';
import * as rules from './domain/game.js';
import { setupScreen } from './ui/screens/setup.js';
import { settingsScreen } from './ui/screens/settings.js';
import { gameScreen, updateClocks, WARNING_MS } from './ui/screens/game.js';
import { standingsScreen } from './ui/screens/standings.js';
import { modalView, toastView } from './ui/overlays.js';

const UNDO_WINDOW_MS = 5000;
const TOAST_MS = 3000;
const LOOP_MS = 100;
const SAVE_EVERY_MS = 1000;

const root = document.getElementById('app');

const app = {
  /** @type {'setup' | 'settings' | 'game' | 'standings'} */
  screen: 'setup',
  roster: loadRoster(),
  settings: normalizeSettings(load('settings')),
  /** @type {import('./domain/game.js').GameState | null} */
  game: null,
  /** @type {null | { kind: 'pause' | 'confirmEndGame' | 'whoWon' } | { kind: 'confirmWin', index: number }} */
  modal: null,
  /** Whether closing the current modal should restart the clock it stopped. */
  resumeAfterModal: false,
  /** @type {null | { message: string, tone?: string, expiresAt: number, undo?: object }} */
  toast: null,
  rosterError: null,
  focusNameInput: false,
  /** Last countdown second a warning beep was played for, so each second beeps once. */
  lastWarnedSecond: null,
  lastSavedAt: 0,
};

setSoundEnabled(app.settings.sound);
setVibrationEnabled(app.settings.vibration);
restoreGame();

// ---------------------------------------------------------------------------
// Persistence

function loadRoster() {
  const saved = load('roster', []);
  return Array.isArray(saved) ? saved.filter((name) => typeof name === 'string').slice(0, rosterRules.MAX_PLAYERS) : [];
}

function persistGame(now = Date.now()) {
  if (!app.game) return;
  save('game', { state: app.game, savedAt: now });
  app.lastSavedAt = now;
}

/**
 * Resumes a Game interrupted by a reload or the app being killed. The clock is stopped at the
 * last save, so time while the app was closed is not charged to anyone.
 */
function restoreGame() {
  const saved = load('game');
  if (!saved?.state?.players?.length) return;
  try {
    app.game = rules.pauseClock(saved.state, saved.savedAt);
    app.screen = app.game.finished ? 'standings' : 'game';
    if (!app.game.finished) keepScreenOn(true);
  } catch {
    remove('game');
    app.game = null;
  }
}

// ---------------------------------------------------------------------------
// Actions

function setGame(next, now = Date.now()) {
  app.game = next;
  persistGame(now);
}

function showToast(message, { tone, undo, duration = TOAST_MS } = {}) {
  app.toast = { message, tone, undo, expiresAt: Date.now() + duration };
}

function openModal(modal) {
  const now = Date.now();
  // Opening the first modal stops the clock; switching between modals keeps the original intent.
  if (!app.modal) app.resumeAfterModal = rules.isRunning(app.game);
  setGame(rules.pauseClock(app.game, now), now);
  app.modal = modal;
  render();
}

function goToGame() {
  app.game = rules.createGame(app.roster, app.settings);
  app.screen = 'game';
  app.modal = null;
  app.toast = null;
  persistGame();
  keepScreenOn(true);
  render();
}

function finishGame() {
  app.screen = 'standings';
  app.toast = null;
  keepScreenOn(false);
}

const actions = {
  // Setup
  addPlayer(name) {
    const { roster, error } = rosterRules.addPlayer(app.roster, name);
    app.rosterError = error ?? null;
    if (!error) setRoster(roster);
    app.focusNameInput = true;
    render();
    app.focusNameInput = false;
  },
  removePlayer(index) {
    setRoster(rosterRules.removePlayer(app.roster, index));
    render();
  },
  movePlayer(index, direction) {
    setRoster(rosterRules.movePlayer(app.roster, index, direction));
    render();
  },
  shuffle() {
    setRoster(rosterRules.shuffleRoster(app.roster));
    render();
  },
  startGame() {
    if (!rosterRules.canStartGame(app.roster)) return;
    goToGame();
  },

  // Settings
  openSettings() {
    app.screen = 'settings';
    render();
  },
  closeSettings() {
    app.screen = 'setup';
    render();
  },
  stepSetting(key, direction) {
    setSettings(stepSetting(app.settings, key, direction));
    render();
  },
  toggleSetting(key) {
    setSettings(normalizeSettings({ ...app.settings, [key]: !app.settings[key] }));
    // Turning vibration on doubles as a test, so the player can feel whether it works.
    if (key === 'vibration' && app.settings.vibration) vibrate('start');
    render();
  },

  // Game
  start() {
    const now = Date.now();
    setGame(rules.startTurn(app.game, now), now);
    app.lastWarnedSecond = null;
    if (app.toast?.undo) app.toast = null; // Undo is only offered until the next Player starts.
    sfx.start();
    vibrate('start');
    render();
  },
  endTurn() {
    const now = Date.now();
    const before = rules.pauseClock(app.game, now);
    setGame(rules.endTurn(app.game, now), now);
    showToast(t.turnEnded(before.players[before.currentIndex].name), { undo: before, duration: UNDO_WINDOW_MS });
    sfx.endTurn();
    vibrate('endTurn');
    render();
  },
  undo() {
    if (!app.toast?.undo) return;
    setGame(app.toast.undo);
    app.toast = null;
    render();
  },
  iWon() {
    openModal({ kind: 'confirmWin', index: app.game.currentIndex });
  },
  openWhoWon() {
    openModal({ kind: 'whoWon' });
  },
  pickWinner(index) {
    app.modal = { kind: 'confirmWin', index };
    render();
  },
  confirmWin(index) {
    const now = Date.now();
    const { game } = app;
    const name = game.players[index].name;
    // The confirmation modal stopped the clock; the current Player's Win still happens within
    // their Turn, so restart it for zero elapsed time before recording the Win.
    const ready = index === game.currentIndex ? rules.startTurn(game, now) : game;
    setGame(rules.declareWin(ready, index, now), now);
    app.modal = null;
    app.resumeAfterModal = false;
    showToast(t.wonBanner(name), { tone: 'win' });
    if (app.game.finished) finishGame();
    sfx.win();
    vibrate('win');
    render();
    launchConfetti();
  },
  pause() {
    if (app.modal) {
      app.modal = { kind: 'pause' };
      render();
    } else {
      openModal({ kind: 'pause' });
    }
  },
  closeModal() {
    const now = Date.now();
    if (app.resumeAfterModal) setGame(rules.startTurn(app.game, now), now);
    app.modal = null;
    app.resumeAfterModal = false;
    render();
  },
  askEndGame() {
    app.modal = { kind: 'confirmEndGame' };
    render();
  },
  endGame() {
    setGame(rules.endGame(app.game, Date.now()));
    app.modal = null;
    app.resumeAfterModal = false;
    finishGame();
    render();
  },

  // Standings
  playAgain() {
    app.roster = app.game.players.map((p) => p.name);
    goToGame();
  },
  backToSetup() {
    app.game = null;
    remove('game');
    app.screen = 'setup';
    render();
  },
};

function setRoster(roster) {
  app.roster = roster;
  save('roster', roster);
}

function setSettings(settings) {
  app.settings = settings;
  setSoundEnabled(settings.sound);
  setVibrationEnabled(settings.vibration);
  save('settings', settings);
}

// ---------------------------------------------------------------------------
// Rendering

function render() {
  const now = Date.now();
  let screen;
  switch (app.screen) {
    case 'settings':
      screen = settingsScreen(app, actions);
      break;
    case 'game':
      screen = gameScreen(app, actions, now);
      break;
    case 'standings':
      screen = standingsScreen(app, actions);
      break;
    default:
      screen = setupScreen(app, actions);
  }
  root.replaceChildren(
    ...[screen, app.screen === 'game' || app.screen === 'standings' ? toastView(app, actions) : null, modalView(app, actions)].filter(Boolean),
  );
}

// ---------------------------------------------------------------------------
// Clock loop

function loop() {
  const now = Date.now();
  if (app.toast && now >= app.toast.expiresAt) {
    app.toast = null;
    render();
  }
  if (app.screen !== 'game' || !app.game) return;

  const next = rules.tick(app.game, now);
  if (next !== app.game) {
    const name = app.game.players[app.game.currentIndex].name;
    setGame(next, now);
    showToast(`${name}: ${t.timeout} +${formatClock(app.game.settings.refillMs)} · ${t.skipsNext}`, { tone: 'danger' });
    sfx.timeout();
    vibrate('timeout');
    render();
    return;
  }

  updateClocks(root, app.game, now);
  warnIfRunningOut(now);
  if (rules.isRunning(app.game) && now - app.lastSavedAt >= SAVE_EVERY_MS) persistGame(now);
}

/** One beep (and short buzz) per second during the last seconds of a running Turn. */
function warnIfRunningOut(now) {
  if (!rules.isRunning(app.game)) return;
  const remaining = rules.bankAt(app.game, app.game.currentIndex, now);
  if (remaining > WARNING_MS) return;
  const second = Math.ceil(remaining / 1000);
  if (second < 1 || second === app.lastWarnedSecond) return;
  app.lastWarnedSecond = second;
  sfx.warning(second);
  vibrate('warning');
}

setInterval(loop, LOOP_MS);

// Save immediately when the page is hidden, since it may be killed without warning.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persistGame();
});

// Browsers only allow audio after a user gesture.
document.addEventListener('pointerdown', unlockAudio, { capture: true });

// A light buzz on every button press; actions with their own pattern (Start, End Turn…)
// override it, since a new vibrate() call replaces the one in progress.
document.addEventListener(
  'pointerdown',
  (event) => {
    if (event.target.closest('button:not(:disabled)')) vibrate('tap');
  },
  { capture: true },
);
document.addEventListener('keydown', unlockAudio, { capture: true });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));

  // When an updated service worker takes over, reload to pick up the new files, but only
  // outside a Game, so nobody's Turn is interrupted (the update then applies on next launch).
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && (app.screen === 'setup' || app.screen === 'settings')) location.reload();
  });
}

render();
