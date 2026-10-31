// Keeps the screen on during a Game. The browser drops the lock whenever the page is
// hidden, so it is re-acquired when the page becomes visible again.

let sentinel = null;
let wanted = false;

async function acquire() {
  if (!wanted || sentinel || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    // Denied (e.g. battery saver); the Game still works.
  }
}

document.addEventListener('visibilitychange', acquire);

export function keepScreenOn(on) {
  wanted = on;
  if (on) acquire();
  else {
    sentinel?.release();
    sentinel = null;
  }
}
