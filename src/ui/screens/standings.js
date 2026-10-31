import { h } from '../dom.js';
import { icon } from '../icons.js';
import { t } from '../../strings.js';
import { standings } from '../../domain/game.js';

export function standingsScreen(app, actions) {
  const { game } = app;
  const { ranked, unranked } = standings(game);

  return h(
    'main',
    { class: 'screen screen--standings' },
    h('header', { class: 'topbar' }, h('h1', { class: 'topbar__title' }, t.standingsTitle)),
    h(
      'ol',
      { class: 'standings panel' },
      ranked.map((index, position) =>
        h(
          'li',
          { class: `standings__item ${position === 0 ? 'is-first' : ''}` },
          h('span', { class: 'standings__place' }, t.place(position + 1)),
          h('span', { class: 'standings__name' }, game.players[index].name),
          position === 0 && icon('trophy'),
        ),
      ),
      unranked.map((index) =>
        h(
          'li',
          { class: 'standings__item is-unranked' },
          h('span', { class: 'standings__place' }, '—'),
          h('span', { class: 'standings__name' }, game.players[index].name),
          h('span', { class: 'standings__note' }, t.didNotFinish),
        ),
      ),
    ),
    h(
      'footer',
      { class: 'actions' },
      h('button', { class: 'btn btn--ghost', type: 'button', onClick: actions.backToSetup }, t.backToSetup),
      h('button', { class: 'btn btn--primary btn--xl', type: 'button', onClick: actions.playAgain }, t.playAgain),
    ),
  );
}
