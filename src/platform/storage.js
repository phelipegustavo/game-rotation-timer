// Thin localStorage wrapper. Storage can be missing or throw (private mode, quota),
// so every access is guarded and the app keeps working without persistence.

const PREFIX = 'grt:';

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort.
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Persistence is best-effort.
  }
}
