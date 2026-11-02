// Pure Game rules: Time Banks, Turns, Timeouts, Refills, Skipped Turns, the Rotation, Wins and Standings.
//
// Every function takes a state and returns a new state (or the same object when nothing
// changed). Nothing here touches the DOM or reads the clock: callers pass `now` (ms) in.
// See GLOSSARY.md for the vocabulary.

/**
 * @typedef {{ name: string, bankMs: number, skipNext: boolean }} Player
 * @typedef {{
 *   settings: { startingBankMs: number, refillMs: number, endOnFirstWin: boolean, allowOutOfTurnWins: boolean },
 *   players: Player[],
 *   currentIndex: number,
 *   runningSince: number | null,
 *   ranked: number[],
 *   finished: boolean,
 *   endedEarly: boolean,
 * }} GameState
 *
 * `players` is in Rotation order; a Player is identified by their index in it.
 * `bankMs` is the bank as of the last time the clock stopped (or the Turn started).
 * `skipNext` is set by a Timeout: the Player sits out their next Turn (a Skipped Turn).
 * `runningSince` is set while the current Player's clock is running.
 * `ranked` lists Player indices in Standings order (Wins, then a lone last Player).
 */

/** @returns {GameState} */
export function createGame(names, settings) {
  return {
    settings: {
      startingBankMs: settings.startingBankMs,
      refillMs: settings.refillMs,
      endOnFirstWin: settings.endOnFirstWin,
      allowOutOfTurnWins: settings.allowOutOfTurnWins,
    },
    players: names.map((name) => ({ name, bankMs: settings.startingBankMs, skipNext: false })),
    currentIndex: 0,
    runningSince: null,
    ranked: [],
    finished: false,
    endedEarly: false,
  };
}

export const isRunning = (state) => state.runningSince !== null;

export const isInRotation = (state, index) => !state.ranked.includes(index);

/** Indices of the Players still in the Rotation, in Rotation order. */
export function rotation(state) {
  return state.players.map((_, i) => i).filter((i) => isInRotation(state, i));
}

/** A Player's Time Bank at `now`, accounting for a running clock. Never negative. */
export function bankAt(state, index, now) {
  const { bankMs } = state.players[index];
  if (index !== state.currentIndex || !isRunning(state)) return bankMs;
  return Math.max(0, bankMs - (now - state.runningSince));
}

/** The Player after `from` in the Rotation, or `from` itself when nobody else is left. */
export function nextIndex(state, from = state.currentIndex) {
  const count = state.players.length;
  for (let step = 1; step < count; step++) {
    const candidate = (from + step) % count;
    if (isInRotation(state, candidate)) return candidate;
  }
  return from;
}

/** Starts (or resumes) the current Player's Turn. */
export function startTurn(state, now) {
  if (state.finished || isRunning(state)) return state;
  return { ...state, runningSince: now };
}

/** Stops the clock without ending the Turn, committing the time spent to the bank. */
export function pauseClock(state, now) {
  if (!isRunning(state)) return state;
  return {
    ...withBank(state, state.currentIndex, bankAt(state, state.currentIndex, now)),
    runningSince: null,
  };
}

/** The current Player finishes their Turn; play moves to the next Player's Handoff. */
export function endTurn(state, now) {
  if (state.finished || !isRunning(state)) return state;
  return advance(pauseClock(state, now));
}

/**
 * Applies a Timeout if the running bank has reached zero: the Turn ends, the Refill is
 * credited, the Player's next Turn is marked to be skipped and play moves on. Returns the
 * same state object when nothing happened.
 */
export function tick(state, now) {
  if (state.finished || !isRunning(state)) return state;
  if (bankAt(state, state.currentIndex, now) > 0) return state;
  const index = state.currentIndex;
  const refilled = withPlayer(state, index, { bankMs: state.settings.refillMs, skipNext: true });
  return advance({ ...refilled, runningSince: null });
}

/** Whether `index` may declare a Win right now (current Player with the clock running, or an allowed Out-of-turn Win). */
export function canWin(state, index) {
  if (state.finished || !isInRotation(state, index)) return false;
  if (index === state.currentIndex) return isRunning(state);
  return state.settings.allowOutOfTurnWins;
}

/**
 * Records a Win. The current Player's Win moves play to the next Player's Handoff; an
 * Out-of-turn Win leaves the current Player's Turn in place with their clock stopped.
 */
export function declareWin(state, index, now) {
  if (!canWin(state, index)) return state;
  const paused = pauseClock(state, now);
  const won = { ...paused, ranked: [...paused.ranked, index] };
  const advanced = index === state.currentIndex ? advance(won) : won;
  return finishIfDecided(advanced);
}

/** Ends the Game early (from the pause menu). Players still in the Rotation stay unranked. */
export function endGame(state, now) {
  if (state.finished) return state;
  return { ...pauseClock(state, now), finished: true, endedEarly: true };
}

/**
 * The final (or partial) result: `ranked` in finishing order, `unranked` for Players who
 * were still in the Rotation when the Game ended.
 */
export function standings(state) {
  return { ranked: [...state.ranked], unranked: rotation(state) };
}

function finishIfDecided(state) {
  if (state.settings.endOnFirstWin && state.ranked.length > 0) return { ...state, finished: true };
  const left = rotation(state);
  // A lone Player left in the Rotation takes last place.
  if (left.length === 1) return { ...state, ranked: [...state.ranked, left[0]], finished: true };
  return state;
}

/**
 * Moves play to the next Player's Handoff, passing over anyone with a Skipped Turn pending
 * (which uses it up). Ends since every pass clears one pending skip.
 */
function advance(state) {
  let next = state;
  let index = state.currentIndex;
  for (;;) {
    index = nextIndex(next, index);
    if (!next.players[index].skipNext) return { ...next, currentIndex: index };
    next = withPlayer(next, index, { skipNext: false });
  }
}

function withBank(state, index, bankMs) {
  return withPlayer(state, index, { bankMs });
}

function withPlayer(state, index, changes) {
  const players = state.players.map((player, i) => (i === index ? { ...player, ...changes } : player));
  return { ...state, players };
}
