// Minimal hyperscript helper for building DOM without a framework.

/**
 * Creates an element. Props starting with `on` become event listeners, `class` sets the
 * className, non-string values are assigned as properties (e.g. `disabled: true`) and
 * everything else becomes an attribute. `null`, `undefined` and `false` are skipped.
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.className = value;
    else if (typeof value !== 'string' && key in el) el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...children.flat(Infinity).filter((child) => child != null && child !== false));
  return el;
}

/** Formats milliseconds as m:ss, rounding up so 0:00 only shows when the time is truly gone. */
export function formatClock(ms) {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
