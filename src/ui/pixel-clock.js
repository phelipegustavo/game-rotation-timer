// The big timer, drawn as inline SVG from a 6×10 pixel font ('X' = filled pixel).
// Rendering the digits ourselves (with crispEdges and no text-shadow) avoids the hairline
// repaint artifacts some Android GPUs leave around large, fractionally-sized text, and lets
// the timer fill the screen width.

const GLYPHS = {
  0: ['.XXXX.', 'XXXXXX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XXXXXX', '.XXXX.'],
  1: ['..XX..', '.XXX..', 'XXXX..', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..', 'XXXXXX', 'XXXXXX'],
  2: ['.XXXX.', 'XXXXXX', 'XX..XX', '....XX', '...XXX', '..XXX.', '.XXX..', 'XXX...', 'XXXXXX', 'XXXXXX'],
  3: ['XXXXX.', 'XXXXXX', '....XX', '....XX', '.XXXX.', '.XXXX.', '....XX', '....XX', 'XXXXXX', 'XXXXX.'],
  4: ['XX..XX', 'XX..XX', 'XX..XX', 'XX..XX', 'XXXXXX', 'XXXXXX', '....XX', '....XX', '....XX', '....XX'],
  5: ['XXXXXX', 'XXXXXX', 'XX....', 'XX....', 'XXXXX.', 'XXXXXX', '....XX', '....XX', 'XXXXXX', 'XXXXX.'],
  6: ['.XXXX.', 'XXXXX.', 'XX....', 'XX....', 'XXXXX.', 'XXXXXX', 'XX..XX', 'XX..XX', 'XXXXXX', '.XXXX.'],
  7: ['XXXXXX', 'XXXXXX', '....XX', '....XX', '...XX.', '...XX.', '..XX..', '..XX..', '..XX..', '..XX..'],
  8: ['.XXXX.', 'XXXXXX', 'XX..XX', 'XX..XX', '.XXXX.', 'XXXXXX', 'XX..XX', 'XX..XX', 'XXXXXX', '.XXXX.'],
  9: ['.XXXX.', 'XXXXXX', 'XX..XX', 'XX..XX', 'XXXXXX', '.XXXXX', '....XX', '....XX', '.XXXXX', '.XXXX.'],
  ':': ['..', '..', 'XX', 'XX', '..', '..', 'XX', 'XX', '..', '..'],
};

const HEIGHT = 10;
const GAP = 1;
const SHADOW = 0.5;

/** Returns SVG markup for a clock string such as "4:59". */
export function pixelClockSvg(text) {
  let d = '';
  let x = 0;
  for (const char of text) {
    const rows = GLYPHS[char];
    if (!rows) continue;
    rows.forEach((row, y) => {
      [...row].forEach((cell, dx) => {
        if (cell === 'X') d += `M${x + dx} ${y}h1v1h-1z`;
      });
    });
    x += rows[0].length + GAP;
  }
  const width = x - GAP + SHADOW;
  return (
    `<svg viewBox="0 0 ${width} ${HEIGHT + SHADOW}" shape-rendering="crispEdges" aria-hidden="true">` +
    `<path class="timer__shadow" transform="translate(${SHADOW} ${SHADOW})" d="${d}"/>` +
    `<path class="timer__digits" d="${d}"/>` +
    `</svg>`
  );
}
