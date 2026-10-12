// localStorage wrapper that never throws (private mode / blocked storage).
const PREFIX = 'supersketch:';

export const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch { /* ignore */ }
  },
};

export function addStar(n = 1) {
  const total = store.get('stars', 0) + n;
  store.set('stars', total);
  return total;
}
export const stars = () => store.get('stars', 0);

export function markDone(kind, id) {
  const done = store.get('done', {});
  done[`${kind}:${id}`] = (done[`${kind}:${id}`] || 0) + 1;
  store.set('done', done);
}
export const isDone = (kind, id) => !!store.get('done', {})[`${kind}:${id}`];
