# Game Rotation Timer: Product Spec

Terms in **bold** are defined in [`GLOSSARY.md`](../GLOSSARY.md). Architectural decisions live in [`docs/adr/`](./adr/).

## Overview

A PWA that shares one device around a card-game table. Each **Player** has a **Time Bank** that only drains during their own **Turn**. When a bank runs dry the Player hits a **Timeout**, loses the rest of that Turn, and gets a **Refill**.

## Screens

### 1. Setup (opening screen)

- Add, remove and rename Players. Names must be unique (trimmed, case-insensitive).
- Minimum 2, maximum 12 Players. "Iniciar jogo" is disabled with fewer than 2.
- The list order is the **Rotation**. Players can be reordered with ↑/↓ buttons, and a **Shuffle** button randomises the order. The first Player in the list goes first.
- A settings button (gear) opens the Settings screen.
- Players and settings persist on the device (no auth) and are pre-filled next time.

### 2. Settings

| Setting | Range | Step | Default |
|---|---|---|---|
| **Starting Bank** | 1–60 min | 1 min | 10 min |
| **Refill** | 15 s – 5 min | 15 s | 1:00 |
| Game ends on first Win | on/off | | off |
| Allow **Out-of-turn Wins** | on/off | | off |
| Sounds | on/off | | on |

### 3. Game

**Handoff state** (between Turns, including before the first Turn):
- The current Player's name, very large.
- Their Time Bank, not running.
- A big **Iniciar** button that starts the Turn.

**Turn state** (clock running):
- The current Player's name and their Time Bank counting down in real time.
- A big **Finalizar** button, which ends the Turn and moves to the next Player's Handoff.
- A big **Ganhei** button. It asks for confirmation ("<name> ganhou?" Sim/Não), and then a **Win** is recorded.

**Always visible:**
- A small **Pausar** button (top right). It stops the clock and opens a modal with **Continuar** and **Encerrar jogo**; Encerrar jogo asks for confirmation.
- A 🏆 button next to Pausar, shown only when Out-of-turn Wins are allowed (see below).
- A Rotation strip with every Player and their Time Bank. The current Player is highlighted and Players who have won are marked with 🏆.

**Undo End Turn:** for about 5 s after Finalizar, an "Desfazer" toast is shown. Tapping it returns to the previous Player's Turn, paused, with their bank as it was. The toast disappears early if the next Player taps Iniciar.

### 4. Standings

- Lists the order in which Players won (1st, 2nd, …).
- In a natural finish, the lone remaining Player takes last place. If the Game was ended early, Players still in the Rotation are listed as "não terminou", unranked.
- Buttons: **Jogar de novo** (same Players, same order) and **Voltar** (to Setup).

## Rules

### Time

- Every Player starts the Game with the Starting Bank.
- Only the current Player's bank drains, and only during a Turn: never during the Handoff, while paused, or while a modal is open.
- **Timeout:** when the bank reaches 0:00 during a Turn, the Turn ends immediately, the Timeout sound and vibration fire, the Refill is credited, and play moves to the next Player's Handoff. Any unused Refill stays in the bank.
- **Warning:** with 5 s or less remaining, a beep plays every second (5, 4, 3, 2, 1) and the timer flashes red. This also applies during Refill time and when a Turn starts with under 5 s.

### Wins

- **Ganhei** is available only to the current Player and only while their clock runs. To win during their own Handoff, a Player taps Iniciar and then Ganhei.
- After a Win, confetti shows with the winner's name and the Player leaves the Rotation.
- With "Game ends on first Win" on, the Game ends at the first Win. Otherwise it ends automatically when one Player is left.
- **Out-of-turn Win** (only when enabled): tapping 🏆 pauses the current clock and opens "Quem ganhou?", which lists the Players in the Rotation except the current one. After confirmation and confetti, the Game returns to the current Player's Turn, paused. They keep their Turn and tap Iniciar to resume. The winner is skipped from then on.

### Persistence and robustness

- The clock is derived from wall-clock timestamps, not by counting ticks, so it stays correct if the page is briefly backgrounded.
- Game state is saved continuously. If the app is closed or killed mid-Turn, on reopening it resumes **paused** with the bank as last saved, and time while closed is not charged.
- The screen is kept awake (Wake Lock API) during a Game.

## Feedback (sound and haptics)

- Sound and vibration are **independent channels**, not fallbacks. Sound plays on every device (when enabled). Vibration fires in addition wherever `navigator.vibrate` exists; it is unavailable on iOS.
- Feedback fires on: Iniciar, Finalizar, the countdown beeps, Timeout, and Win.
- Sounds are synthesized 8-bit bleeps via WebAudio, with no audio files. The audio context is unlocked on the first user tap.
- Every button also has a visual "press" (it shifts 4 px and its shadow collapses).

## Design system

- Dark theme only, with a modern take on a classic arcade-maze look. It uses colours only, with no references to any existing game.
- Fonts (self-hosted): **Press Start 2P** for headings and the timer, and a more legible pixel font (VT323 or Silkscreen) for small text.
- A 4 px grid for spacing, borders and hard shadows (`4px 4px 0`, no blur).
- Icons are inline pixel SVGs on an 8×8 or 16×16 grid. Confetti uses a canvas of pixel squares in the palette colours.
- Two token layers: primitive colours, and semantic tokens on top. Components use only semantic tokens.

| Primitive | Value | Semantic use |
|---|---|---|
| `--px-black` | `#000000` | `--color-surface` |
| `--px-maze` | `#2121DE` | `--color-border` (double line, subtle neon glow) |
| `--px-yellow` | `#FFE81F` | `--color-action-primary` (Iniciar), current-Player highlight |
| `--px-cyan` | `#00FFFF` | `--color-action-secondary` (Finalizar) |
| `--px-pink` | `#FFB8FF` | `--color-action-win` (Ganhei, 🏆) |
| `--px-red` | `#FF0000` | `--color-timer-danger`, destructive actions |
| `--px-orange` | `#FFB852` | `--color-warning`, confetti |
| `--px-peach` | `#FFB897` | `--color-text-muted` |
| `--px-white` | `#FFFFFF` | `--color-text` |

## Tech

- A PWA that is installable and fully offline, via a service worker with a hand-maintained precache list.
- Vanilla JS with native ES modules, no frameworks and no build step ([ADR 0002](./adr/0002-no-build-step.md)).
- The UI is in pt-BR. Code, comments and docs are in English, and all UI copy lives in one strings module ([ADR 0001](./adr/0001-ptbr-ui-english-code.md)).
- The domain logic is pure (no DOM, current time passed in) and is tested with `node --test`.
- Hosted on GitHub Pages. No auth and no backend.
