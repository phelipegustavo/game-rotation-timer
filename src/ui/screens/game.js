import { h, formatClock } from '../dom.js';
import { icon } from '../icons.js';
import { pixelClockSvg } from '../pixel-clock.js';
import { t } from '../../strings.js';
import { bankAt, isRunning, isInRotation, canWin } from '../../domain/game.js';

export const WARNING_MS = 5000;

export function gameScreen(app, actions, now) {
  const { game } = app;
  const current = game.currentIndex;
  const running = isRunning(game);
  const player = game.players[current];

  const rotationStrip = h(
    'ol',
    { class: 'rotation', 'aria-label': t.rotationLabel },
    game.players.map((p, index) => {
      const out = !isInRotation(game, index);
      return h(
        'li',
        {
          class: ['rotation__item', index === current && 'is-current', out && 'is-out'].filter(Boolean).join(' '),
          'aria-current': index === current ? 'true' : null,
        },
        out && icon('trophy'),
        h('span', { class: 'rotation__name' }, p.name),
        !out && h('span', { class: 'rotation__bank', 'data-bank': String(index) }, formatClock(bankAt(game, index, now))),
      );
    }),
  );

  const actionButtons = running
    ? [
        h('button', { class: 'btn btn--secondary btn--xl', type: 'button', onClick: actions.endTurn }, t.endTurn),
        canWin(game, current) &&
          h(
            'button',
            { class: 'btn btn--win btn--lg', type: 'button', onClick: actions.iWon },
            icon('trophy'),
            h('span', {}, t.iWon),
          ),
      ]
    : [
        h(
          'button',
          { class: 'btn btn--primary btn--xl', type: 'button', onClick: actions.start },
          icon('play'),
          h('span', {}, t.start),
        ),
      ];

  return h(
    'main',
    { class: `screen screen--game ${running ? 'is-running' : 'is-handoff'}` },
    h(
      'header',
      { class: 'topbar' },
      h('span', { class: 'topbar__title topbar__title--small' }, t.appName),
      h(
        'div',
        { class: 'topbar__actions' },
        game.settings.allowOutOfTurnWins &&
          h(
            'button',
            { class: 'icon-btn icon-btn--win', type: 'button', 'aria-label': t.outOfTurnWin, onClick: actions.openWhoWon },
            icon('trophy'),
          ),
        h(
          'button',
          { class: 'icon-btn', type: 'button', 'aria-label': t.pause, onClick: actions.pause },
          icon('pause'),
        ),
      ),
    ),
    rotationStrip,
    h(
      'section',
      { class: 'turn', 'aria-live': 'polite' },
      h('p', { class: 'turn__label' }, t.yourTurn),
      h('h1', { class: 'turn__name' }, player.name),
      setTimerText(
        h('div', { class: 'timer', 'data-bank': String(current), 'data-timer': '', role: 'timer' }),
        formatClock(bankAt(game, current, now)),
      ),
    ),
    h('footer', { class: 'actions actions--game' }, actionButtons),
  );
}

/** Updates every visible Time Bank in place, without re-rendering the screen. */
export function updateClocks(root, game, now) {
  for (const el of root.querySelectorAll('[data-bank]')) {
    const index = Number(el.dataset.bank);
    const ms = bankAt(game, index, now);
    const text = formatClock(ms);
    if (el.hasAttribute('data-timer')) {
      if (el.dataset.text !== text) setTimerText(el, text);
      el.classList.toggle('is-danger', ms <= WARNING_MS);
      el.classList.toggle('is-blinking', ms <= WARNING_MS && isRunning(game));
    } else if (el.textContent !== text) {
      el.textContent = text;
    }
  }
}

/** Draws the big pixel timer; the text itself is exposed to assistive tech via aria-label. */
function setTimerText(el, text) {
  el.dataset.text = text;
  el.setAttribute('aria-label', text);
  el.innerHTML = pixelClockSvg(text);
  return el;
}
