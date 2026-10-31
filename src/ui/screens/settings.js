import { h, formatClock } from '../dom.js';
import { icon } from '../icons.js';
import { t } from '../../strings.js';
import { SETTING_LIMITS } from '../../domain/settings.js';

function stepper(label, key, settings, actions, hint) {
  const value = settings[key];
  const { min, max } = SETTING_LIMITS[key];
  return h(
    'div',
    { class: 'setting' },
    h('div', { class: 'setting__text' }, h('span', { class: 'setting__label' }, label), hint && h('span', { class: 'hint' }, hint)),
    h(
      'div',
      { class: 'stepper' },
      h(
        'button',
        {
          class: 'icon-btn',
          type: 'button',
          'aria-label': t.decrease(label),
          disabled: value <= min,
          onClick: () => actions.stepSetting(key, -1),
        },
        icon('minus'),
      ),
      h('output', { class: 'stepper__value', 'aria-live': 'polite' }, formatClock(value)),
      h(
        'button',
        {
          class: 'icon-btn',
          type: 'button',
          'aria-label': t.increase(label),
          disabled: value >= max,
          onClick: () => actions.stepSetting(key, +1),
        },
        icon('plus'),
      ),
    ),
  );
}

function toggle(label, key, settings, actions) {
  const on = settings[key];
  return h(
    'div',
    { class: 'setting' },
    h('span', { class: 'setting__label', id: `label-${key}` }, label),
    h(
      'button',
      {
        class: 'switch',
        type: 'button',
        role: 'switch',
        'aria-checked': String(on),
        'aria-labelledby': `label-${key}`,
        onClick: () => actions.toggleSetting(key),
      },
      h('span', { class: 'switch__thumb' }),
    ),
  );
}

export function settingsScreen(app, actions) {
  const { settings } = app;
  return h(
    'main',
    { class: 'screen screen--settings' },
    h(
      'header',
      { class: 'topbar' },
      h(
        'button',
        { class: 'icon-btn', type: 'button', 'aria-label': t.back, onClick: actions.closeSettings },
        icon('back'),
      ),
      h('h1', { class: 'topbar__title' }, t.settings),
    ),
    h(
      'section',
      { class: 'panel settings' },
      stepper(t.startingBank, 'startingBankMs', settings, actions),
      stepper(t.refill, 'refillMs', settings, actions, t.refillHint),
      toggle(t.endOnFirstWin, 'endOnFirstWin', settings, actions),
      toggle(t.allowOutOfTurnWins, 'allowOutOfTurnWins', settings, actions),
      toggle(t.sound, 'sound', settings, actions),
    ),
  );
}
