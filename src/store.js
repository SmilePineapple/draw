// localStorage wrapper that never throws (private mode / blocked storage).
// Everything a child does is saved per player profile; a few things (sound, the player list) are global.
const PFX = 'supersketch:';

const rawGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(PFX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const rawSet = (key, value) => {
  try { localStorage.setItem(PFX + key, JSON.stringify(value)); } catch { /* ignore */ }
};

/** device-wide settings */
export const gstore = { get: rawGet, set: rawSet };

// ---------------------------------------------------------------- profiles
const LEGACY_KEYS = ['stars', 'done', 'tricky', 'words', 'case', 'paper'];

export const profiles = {
  list: () => rawGet('profiles', []),
  currentId: () => rawGet('current', null),
  current() {
    const id = rawGet('current', null);
    return this.list().find((p) => p.id === id) || null;
  },
  get(id) { return this.list().find((p) => p.id === id) || null; },
  add({ name, avatar }) {
    const list = this.list();
    const id = `p${Date.now().toString(36)}${list.length}`;
    list.push({ id, name: name || `Player ${list.length + 1}`, avatar: avatar || 'bluey' });
    rawSet('profiles', list);
    if (list.length === 1) {
      // the first player inherits anything saved before profiles existed
      for (const k of LEGACY_KEYS) {
        try {
          const v = localStorage.getItem(PFX + k);
          if (v != null) localStorage.setItem(`${PFX}p:${id}:${k}`, v);
        } catch { /* ignore */ }
      }
    }
    rawSet('current', id);
    return id;
  },
  setCurrent(id) { rawSet('current', id); },
  update(id, patch) {
    rawSet('profiles', this.list().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },
  remove(id) {
    rawSet('profiles', this.list().filter((p) => p.id !== id));
    this.resetData(id);
    if (rawGet('current', null) === id) rawSet('current', this.list()[0]?.id ?? null);
  },
  resetData(id) {
    try {
      const prefix = `${PFX}p:${id}:`;
      Object.keys(localStorage).filter((k) => k.startsWith(prefix)).forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};

// ---------------------------------------------------------------- per-profile store
const storeFor = (idFn) => ({
  get: (key, fallback) => rawGet(`p:${idFn()}:${key}`, fallback),
  set: (key, value) => rawSet(`p:${idFn()}:${key}`, value),
});
export const store = storeFor(() => profiles.currentId());
export const storeOf = (id) => storeFor(() => id);

// ---------------------------------------------------------------- stars + progress
export function addStar(n = 1) {
  const total = store.get('stars', 0) + n;
  store.set('stars', total);
  return total;
}
export const starsEarned = (id) => (id ? storeOf(id) : store).get('stars', 0);
export const starsSpent = (id) => (id ? storeOf(id) : store).get('spent', 0);
export const stars = () => starsEarned() - starsSpent();
export function spendStars(n) {
  if (stars() < n) return false;
  store.set('spent', starsSpent() + n);
  return true;
}

export function logActivity(kind, id, extra = {}) {
  const log = store.get('activity', []);
  log.push({ t: Date.now(), k: kind, i: id, ...extra });
  store.set('activity', log.slice(-800));
}

export function markDone(kind, id) {
  const done = store.get('done', {});
  done[`${kind}:${id}`] = (done[`${kind}:${id}`] || 0) + 1;
  store.set('done', done);
  logActivity(kind, id);
}
export const isDone = (kind, id) => !!store.get('done', {})[`${kind}:${id}`];
export const doneOf = (pid) => storeOf(pid).get('done', {});
