import { h } from '../dom.js';
import { icon } from '../icons.js';
import { t } from '../../strings.js';
import { MIN_PLAYERS, MAX_NAME_LENGTH, canStartGame } from '../../domain/roster.js';

export function setupScreen(app, actions) {
  const { roster } = app;

  const input = h('input', {
    class: 'field',
    type: 'text',
    name: 'player',
    placeholder: t.playerNamePlaceholder,
    'aria-label': t.playerNamePlaceholder,
    maxlength: String(MAX_NAME_LENGTH),
    autocomplete: 'off',
    enterkeyhint: 'done',
  });

  const form = h(
    'form',
    {
      class: 'add-player',
      onSubmit: (event) => {
        event.preventDefault();
        actions.addPlayer(input.value);
      },
    },
    input,
    h('button', { class: 'btn btn--primary btn--square', type: 'submit', 'aria-label': t.addPlayer }, icon('plus')),
  );

  const list = h(
    'ol',
    { class: 'roster panel' },
    roster.map((name, index) =>
      h(
        'li',
        { class: 'roster__item' },
        h('span', { class: 'roster__index' }, String(index + 1)),
        h('span', { class: 'roster__name' }, name),
        h(
          'button',
          {
            class: 'icon-btn',
            type: 'button',
            'aria-label': t.moveUp(name),
            disabled: index === 0,
            onClick: () => actions.movePlayer(index, -1),
          },
          icon('up'),
        ),
        h(
          'button',
          {
            class: 'icon-btn',
            type: 'button',
            'aria-label': t.moveDown(name),
            disabled: index === roster.length - 1,
            onClick: () => actions.movePlayer(index, +1),
          },
          icon('down'),
        ),
        h(
          'button',
          {
            class: 'icon-btn icon-btn--danger',
            type: 'button',
            'aria-label': t.removePlayer(name),
            onClick: () => actions.removePlayer(index),
          },
          icon('close'),
        ),
      ),
    ),
  );

  const ready = canStartGame(roster);

  const screen = h(
    'main',
    { class: 'screen screen--setup' },
    h(
      'header',
      { class: 'topbar' },
      h('h1', { class: 'topbar__title' }, t.setupTitle),
      h(
        'button',
        { class: 'icon-btn', type: 'button', 'aria-label': t.settings, onClick: actions.openSettings },
        icon('gear'),
      ),
    ),
    form,
    app.rosterError && h('p', { class: 'error', role: 'alert' }, t.errors[app.rosterError]),
    roster.length > 0 && list,
    h('p', { class: 'hint' }, ready ? t.firstPlayerHint : t.minPlayersHint(MIN_PLAYERS)),
    h(
      'footer',
      { class: 'actions' },
      roster.length > 1 &&
        h(
          'button',
          { class: 'btn btn--ghost', type: 'button', onClick: actions.shuffle },
          icon('dice'),
          h('span', {}, t.shuffle),
        ),
      h(
        'button',
        { class: 'btn btn--primary btn--xl', type: 'button', disabled: !ready, onClick: actions.startGame },
        t.startGame,
      ),
    ),
  );

  // Keep typing flow fast: after adding a name, the field is ready for the next one.
  if (app.focusNameInput) queueMicrotask(() => input.focus());
  return screen;
}
