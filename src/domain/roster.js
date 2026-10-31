// The list of Player names entered on the setup screen, before a Game starts.
// Its order becomes the Rotation.

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 12;
export const MAX_NAME_LENGTH = 16;

const nameKey = (name) => name.trim().toLocaleLowerCase('pt-BR');

/**
 * Adds a name to the roster.
 * @returns {{ roster: string[], error?: 'empty' | 'duplicate' | 'full' }}
 */
export function addPlayer(roster, name) {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  if (!trimmed) return { roster, error: 'empty' };
  if (roster.length >= MAX_PLAYERS) return { roster, error: 'full' };
  if (roster.some((existing) => nameKey(existing) === nameKey(trimmed))) return { roster, error: 'duplicate' };
  return { roster: [...roster, trimmed] };
}

export function removePlayer(roster, index) {
  return roster.filter((_, i) => i !== index);
}

/** Moves the name at `index` one slot up (-1) or down (+1); out-of-bounds moves are ignored. */
export function movePlayer(roster, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= roster.length) return roster;
  const next = [...roster];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Fisher–Yates shuffle. `random` is injectable so tests can be deterministic. */
export function shuffleRoster(roster, random = Math.random) {
  const next = [...roster];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function canStartGame(roster) {
  return roster.length >= MIN_PLAYERS && roster.length <= MAX_PLAYERS;
}
