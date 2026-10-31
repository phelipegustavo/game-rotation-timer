// Modals and the toast shown over the game screen.

import { h } from './dom.js';
import { icon } from './icons.js';
import { t } from '../strings.js';
import { rotation } from '../domain/game.js';

function modal(title, ...body) {
  return h(
    'div',
    { class: 'modal-backdrop' },
    h(
      'div',
      { class: 'modal panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title' },
      h('h2', { class: 'modal__title', id: 'modal-title' }, title),
      ...body,
    ),
  );
}

export function modalView(app, actions) {
  const { modal: current, game } = app;
  if (!current) return null;

  switch (current.kind) {
    case 'pause':
      return modal(
        t.paused,
        h(
          'div',
          { class: 'modal__actions' },
          h('button', { class: 'btn btn--primary btn--lg', type: 'button', onClick: actions.closeModal }, t.resume),
          h('button', { class: 'btn btn--danger', type: 'button', onClick: actions.askEndGame }, t.endGame),
        ),
      );

    case 'confirmEndGame':
      return modal(
        t.endGameConfirm,
        h(
          'div',
          { class: 'modal__actions modal__actions--row' },
          h('button', { class: 'btn btn--ghost', type: 'button', onClick: actions.pause }, t.no),
          h('button', { class: 'btn btn--danger', type: 'button', onClick: actions.endGame }, t.yes),
        ),
      );

    case 'whoWon':
      return modal(
        t.whoWon,
        h(
          'div',
          { class: 'modal__actions' },
          rotation(game)
            .filter((index) => index !== game.currentIndex)
            .map((index) =>
              h(
                'button',
                { class: 'btn btn--win', type: 'button', onClick: () => actions.pickWinner(index) },
                game.players[index].name,
              ),
            ),
          h('button', { class: 'btn btn--ghost', type: 'button', onClick: actions.closeModal }, t.cancel),
        ),
      );

    case 'confirmWin':
      return modal(
        t.winConfirm(game.players[current.index].name),
        h(
          'div',
          { class: 'modal__actions modal__actions--row' },
          h('button', { class: 'btn btn--ghost', type: 'button', onClick: actions.closeModal }, t.no),
          h(
            'button',
            { class: 'btn btn--win', type: 'button', onClick: () => actions.confirmWin(current.index) },
            icon('trophy'),
            h('span', {}, t.yes),
          ),
        ),
      );

    default:
      return null;
  }
}

export function toastView(app, actions) {
  const { toast } = app;
  if (!toast) return null;
  return h(
    'div',
    { class: `toast toast--${toast.tone ?? 'info'}`, role: 'status' },
    h('span', { class: 'toast__message' }, toast.message),
    toast.undo && h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onClick: actions.undo }, t.undo),
  );
}
