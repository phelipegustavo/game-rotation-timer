import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addPlayer, removePlayer, movePlayer, shuffleRoster, canStartGame, MAX_PLAYERS } from '../src/domain/roster.js';
import { normalizeSettings, stepSetting, DEFAULT_SETTINGS } from '../src/domain/settings.js';

test('names are trimmed and must be non-empty and unique (case-insensitive)', () => {
  assert.deepEqual(addPlayer([], '  Ana '), { roster: ['Ana'] });
  assert.equal(addPlayer([], '   ').error, 'empty');
  assert.equal(addPlayer(['Ana'], 'ana').error, 'duplicate');
  assert.equal(addPlayer(['João'], 'JOÃO').error, 'duplicate');
});

test('the roster is capped at the maximum number of Players', () => {
  const full = Array.from({ length: MAX_PLAYERS }, (_, i) => `P${i}`);
  assert.equal(addPlayer(full, 'Extra').error, 'full');
});

test('a Game needs at least two Players', () => {
  assert.equal(canStartGame(['Ana']), false);
  assert.equal(canStartGame(['Ana', 'Bruno']), true);
});

test('Players can be removed and reordered', () => {
  assert.deepEqual(removePlayer(['A', 'B', 'C'], 1), ['A', 'C']);
  assert.deepEqual(movePlayer(['A', 'B', 'C'], 2, -1), ['A', 'C', 'B']);
  assert.deepEqual(movePlayer(['A', 'B', 'C'], 0, -1), ['A', 'B', 'C']);
});

test('shuffle keeps the same Players', () => {
  const shuffled = shuffleRoster(['A', 'B', 'C', 'D'], () => 0);
  assert.deepEqual([...shuffled].sort(), ['A', 'B', 'C', 'D']);
  assert.deepEqual(shuffled, ['B', 'C', 'D', 'A']);
});

test('settings fall back to defaults and are clamped to their ranges', () => {
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
  assert.equal(normalizeSettings({ refillMs: 0 }).refillMs, 15_000);
  assert.equal(normalizeSettings({ startingBankMs: 999 * 60_000 }).startingBankMs, 60 * 60_000);
  assert.equal(normalizeSettings({ refillMs: 22_000 }).refillMs, 15_000);
});

test('stepping a setting moves one step and stops at the limits', () => {
  const s = normalizeSettings({ refillMs: 15_000 });
  assert.equal(stepSetting(s, 'refillMs', +1).refillMs, 30_000);
  assert.equal(stepSetting(s, 'refillMs', -1).refillMs, 15_000);
});
