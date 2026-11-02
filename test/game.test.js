import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  bankAt,
  startTurn,
  pauseClock,
  endTurn,
  tick,
  canWin,
  declareWin,
  endGame,
  standings,
  rotation,
  isRunning,
} from '../src/domain/game.js';

const MIN = 60_000;
const SETTINGS = { startingBankMs: 10 * MIN, refillMs: 1 * MIN, endOnFirstWin: false, allowOutOfTurnWins: false };
const ANA = 0;
const BRUNO = 1;
const CARLA = 2;
const DAVI = 3;

const newGame = (overrides = {}) => createGame(['Ana', 'Bruno', 'Carla', 'Davi'], { ...SETTINGS, ...overrides });

test('every Player starts with the Starting Bank and the first Player is in Handoff', () => {
  const game = newGame();
  assert.deepEqual(game.players.map((p) => p.bankMs), [10 * MIN, 10 * MIN, 10 * MIN, 10 * MIN]);
  assert.equal(game.currentIndex, ANA);
  assert.equal(isRunning(game), false);
});

test("only the current Player's bank drains, and only while the clock runs", () => {
  let game = startTurn(newGame(), 0);
  assert.equal(bankAt(game, ANA, 30_000), 10 * MIN - 30_000);
  assert.equal(bankAt(game, BRUNO, 30_000), 10 * MIN);

  game = endTurn(game, 30_000);
  assert.equal(game.currentIndex, BRUNO);
  // Handoff: nothing drains however long the device takes to pass.
  assert.equal(bankAt(game, ANA, 999_999), 10 * MIN - 30_000);
  assert.equal(bankAt(game, BRUNO, 999_999), 10 * MIN);
});

test('the bank resumes where it left off on the next Turn', () => {
  let game = newGame();
  game = endTurn(startTurn(game, 0), 20_000); // Ana uses 20s
  for (const _ of [BRUNO, CARLA, DAVI]) game = endTurn(startTurn(game, 0), 1_000);
  assert.equal(game.currentIndex, ANA);
  game = startTurn(game, 100_000);
  assert.equal(bankAt(game, ANA, 110_000), 10 * MIN - 30_000);
});

test('pausing stops the clock without ending the Turn', () => {
  let game = pauseClock(startTurn(newGame(), 0), 5_000);
  assert.equal(isRunning(game), false);
  assert.equal(game.currentIndex, ANA);
  assert.equal(bankAt(game, ANA, 60_000), 10 * MIN - 5_000);
  game = startTurn(game, 60_000);
  assert.equal(bankAt(game, ANA, 61_000), 10 * MIN - 6_000);
});

test('Timeout ends the Turn on the spot, credits the Refill and moves to the next Player', () => {
  let game = startTurn(newGame(), 0);
  assert.equal(tick(game, 10 * MIN - 1), game, 'no change before the bank is empty');

  game = tick(game, 10 * MIN);
  assert.equal(game.currentIndex, BRUNO);
  assert.equal(isRunning(game), false);
  assert.equal(game.players[ANA].bankMs, 1 * MIN);
});

test('Timeout credits exactly the Refill even if detected late', () => {
  const game = tick(startTurn(newGame(), 0), 10 * MIN + 45_000);
  assert.equal(game.players[ANA].bankMs, 1 * MIN);
});

test('a Timeout makes the Player sit out their next Turn', () => {
  let game = tick(startTurn(newGame(), 0), 10 * MIN); // Ana times out
  assert.equal(game.players[ANA].skipNext, true);
  for (const _ of [BRUNO, CARLA]) game = endTurn(startTurn(game, 0), 1_000);
  game = endTurn(startTurn(game, 0), 1_000); // Davi ends: Ana is skipped
  assert.equal(game.currentIndex, BRUNO);
  assert.equal(game.players[ANA].skipNext, false);
  assert.equal(game.players[ANA].bankMs, 1 * MIN, 'a Skipped Turn spends nothing');

  // The round after, Ana plays again.
  for (const _ of [BRUNO, CARLA, DAVI]) game = endTurn(startTurn(game, 0), 1_000);
  assert.equal(game.currentIndex, ANA);
});

test('a Skipped Turn also applies after the previous Player wins', () => {
  let game = newGame();
  for (const _ of [ANA, BRUNO]) game = endTurn(startTurn(game, 0), 1_000);
  game = tick(startTurn(game, 0), 10 * MIN); // Carla times out -> Davi
  game = declareWin(startTurn(game, 0), DAVI, 1_000); // Davi wins -> Ana
  game = endTurn(startTurn(game, 0), 1_000); // -> Bruno
  game = endTurn(startTurn(game, 0), 1_000); // Carla is skipped -> Ana
  assert.equal(game.currentIndex, ANA);
});

test('with two Players, a Timeout gives the other Player two Turns in a row', () => {
  let game = createGame(['Ana', 'Bruno'], SETTINGS);
  game = tick(startTurn(game, 0), 10 * MIN); // Ana times out -> Bruno
  game = endTurn(startTurn(game, 0), 1_000); // Ana is skipped -> Bruno again
  assert.equal(game.currentIndex, BRUNO);
  game = endTurn(startTurn(game, 0), 1_000);
  assert.equal(game.currentIndex, ANA);
});

test('Players whose Skipped Turns are all pending use them up in one pass', () => {
  let game = createGame(['Ana', 'Bruno'], SETTINGS);
  game = tick(startTurn(game, 0), 10 * MIN); // Ana times out -> Bruno
  game = tick(startTurn(game, 0), 10 * MIN); // Bruno times out: both skip once -> Ana
  assert.equal(game.currentIndex, ANA);
  assert.deepEqual(game.players.map((p) => p.skipNext), [false, false]);
});

test('unused Refill stays in the bank', () => {
  let game = tick(startTurn(newGame(), 0), 10 * MIN); // Ana times out -> 1:00
  for (const _ of [BRUNO, CARLA, DAVI]) game = endTurn(startTurn(game, 0), 1_000);
  for (const _ of [BRUNO, CARLA, DAVI]) game = endTurn(startTurn(game, 0), 1_000); // Ana sat out
  game = endTurn(startTurn(game, 0), 20_000); // Ana uses 20s of her Refill
  assert.equal(game.players[ANA].bankMs, 40_000);
});

test('ending a Turn requires a running clock', () => {
  const game = newGame();
  assert.equal(endTurn(game, 1_000), game);
});

test('the current Player can only Win while their clock runs', () => {
  const game = newGame();
  assert.equal(canWin(game, ANA), false);
  assert.equal(declareWin(game, ANA, 0), game);
  assert.equal(canWin(startTurn(game, 0), ANA), true);
});

test('a Win removes the Player from the Rotation and moves to the next Handoff', () => {
  let game = startTurn(newGame(), 0);
  game = endTurn(game, 1_000); // Bruno's Handoff
  game = declareWin(startTurn(game, 2_000), BRUNO, 5_000);
  assert.deepEqual(rotation(game), [ANA, CARLA, DAVI]);
  assert.equal(game.currentIndex, CARLA);
  assert.equal(isRunning(game), false);
  assert.equal(game.finished, false);

  // Davi is followed by Ana, and Ana by Carla (Bruno is skipped).
  game = endTurn(startTurn(game, 0), 1_000);
  game = endTurn(startTurn(game, 0), 1_000);
  assert.equal(game.currentIndex, ANA);
  game = endTurn(startTurn(game, 0), 1_000);
  assert.equal(game.currentIndex, CARLA);
});

test('the Game ends when one Player is left, who takes last place', () => {
  let game = newGame();
  game = declareWin(startTurn(game, 0), ANA, 1_000); // -> Bruno
  game = declareWin(startTurn(game, 0), BRUNO, 1_000); // -> Carla
  assert.equal(game.finished, false);
  game = declareWin(startTurn(game, 0), CARLA, 1_000);
  assert.equal(game.finished, true);
  assert.deepEqual(standings(game), { ranked: [ANA, BRUNO, CARLA, DAVI], unranked: [] });
});

test('with "end on first Win" the Game ends at the first Win and the rest stay unranked', () => {
  let game = newGame({ endOnFirstWin: true });
  game = endTurn(startTurn(game, 0), 1_000);
  game = declareWin(startTurn(game, 0), BRUNO, 1_000);
  assert.equal(game.finished, true);
  assert.deepEqual(standings(game), { ranked: [BRUNO], unranked: [ANA, CARLA, DAVI] });
});

test('Out-of-turn Wins are rejected unless enabled', () => {
  const game = startTurn(newGame(), 0);
  assert.equal(canWin(game, DAVI), false);
  assert.equal(declareWin(game, DAVI, 1_000), game);
});

test("an Out-of-turn Win pauses the current Player's Turn without ending it", () => {
  let game = newGame({ allowOutOfTurnWins: true });
  game = endTurn(startTurn(game, 0), 1_000);
  game = endTurn(startTurn(game, 0), 1_000); // Carla's Handoff
  game = startTurn(game, 10_000);

  game = declareWin(game, DAVI, 25_000);
  assert.equal(game.currentIndex, CARLA, 'Carla keeps her Turn');
  assert.equal(isRunning(game), false);
  assert.equal(game.players[CARLA].bankMs, 10 * MIN - 15_000);
  assert.deepEqual(standings(game).ranked, [DAVI]);

  // After Carla, play goes straight to Ana.
  game = endTurn(startTurn(game, 30_000), 31_000);
  assert.equal(game.currentIndex, ANA);
});

test('a Player who already won cannot win again', () => {
  let game = newGame({ allowOutOfTurnWins: true });
  game = declareWin(startTurn(game, 0), DAVI, 1_000);
  assert.equal(canWin(game, DAVI), false);
});

test('ending the Game early keeps the Standings so far and leaves the rest unranked', () => {
  let game = newGame();
  game = declareWin(startTurn(game, 0), ANA, 1_000);
  game = startTurn(game, 2_000);
  game = endGame(game, 7_000);
  assert.equal(game.finished, true);
  assert.equal(game.endedEarly, true);
  assert.equal(isRunning(game), false);
  assert.equal(game.players[BRUNO].bankMs, 10 * MIN - 5_000);
  assert.deepEqual(standings(game), { ranked: [ANA], unranked: [BRUNO, CARLA, DAVI] });
});

test('a finished Game ignores further actions', () => {
  const game = endGame(newGame(), 0);
  assert.equal(startTurn(game, 1), game);
  assert.equal(tick(game, 1), game);
  assert.equal(endGame(game, 1), game);
});
