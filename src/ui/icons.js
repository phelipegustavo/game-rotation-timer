// Pixel-art icons drawn from 8×8 bitmaps ('X' = filled pixel) into inline SVG.

const BITMAPS = {
  pause: [
    '........',
    '.XX..XX.',
    '.XX..XX.',
    '.XX..XX.',
    '.XX..XX.',
    '.XX..XX.',
    '.XX..XX.',
    '........',
  ],
  play: [
    '.X......',
    '.XXX....',
    '.XXXXX..',
    '.XXXXXXX',
    '.XXXXXXX',
    '.XXXXX..',
    '.XXX....',
    '.X......',
  ],
  trophy: [
    'XXXXXXXX',
    'X.XXXX.X',
    'X.XXXX.X',
    '.XXXXXX.',
    '..XXXX..',
    '...XX...',
    '..XXXX..',
    '.XXXXXX.',
  ],
  gear: [
    '...XX...',
    '.XXXXXX.',
    '.XX..XX.',
    'XX....XX',
    'XX....XX',
    '.XX..XX.',
    '.XXXXXX.',
    '...XX...',
  ],
  dice: [
    'XXXXXXXX',
    'X......X',
    'X.X..X.X',
    'X......X',
    'X......X',
    'X.X..X.X',
    'X......X',
    'XXXXXXXX',
  ],
  up: [
    '...XX...',
    '..XXXX..',
    '.XXXXXX.',
    'XXXXXXXX',
    '...XX...',
    '...XX...',
    '...XX...',
    '...XX...',
  ],
  close: [
    'XX....XX',
    'XXX..XXX',
    '.XXXXXX.',
    '..XXXX..',
    '..XXXX..',
    '.XXXXXX.',
    'XXX..XXX',
    'XX....XX',
  ],
  back: [
    '...X....',
    '..XX....',
    '.XXXXXXX',
    'XXXXXXXX',
    '.XXXXXXX',
    '..XX....',
    '...X....',
    '........',
  ],
  plus: [
    '...XX...',
    '...XX...',
    '...XX...',
    'XXXXXXXX',
    'XXXXXXXX',
    '...XX...',
    '...XX...',
    '...XX...',
  ],
  minus: [
    '........',
    '........',
    '........',
    'XXXXXXXX',
    'XXXXXXXX',
    '........',
    '........',
    '........',
  ],
};
BITMAPS.down = [...BITMAPS.up].reverse();

function toPath(rows) {
  let d = '';
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === 'X') d += `M${x} ${y}h1v1h-1z`;
    });
  });
  return d;
}

const PATHS = Object.fromEntries(Object.entries(BITMAPS).map(([name, rows]) => [name, toPath(rows)]));

/** Returns a decorative icon element (hidden from assistive tech; label the button instead). */
export function icon(name) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 8 8" shape-rendering="crispEdges"><path fill="currentColor" d="${PATHS[name]}"/></svg>`;
  return span;
}
