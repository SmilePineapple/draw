// Sends each child's progress to /api/sync (Upstash Redis behind Vercel) so the grown-ups page works from any device.
// Everything still works offline: a failed push is simply retried on the next change.
import { gstore, profiles, storeOf, setChangeHook } from './store.js';

const PFX = 'supersketch:';
const KEYS = ['done', 'activity', 'stars', 'spent', 'tricky'];
const PIN = '5253';

const deviceId = () => {
  let id = gstore.get('deviceId', null);
  if (!id) { id = `d${Math.random().toString(36).slice(2, 10)}`; gstore.set('deviceId', id); }
  return id;
};
const deviceLabel = () => (/iPad/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)) ? 'iPad' : /iPhone/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'Computer');

/** The syncable part of one child's saved data on this device. */
export function snapshot(pid) {
  const st = storeOf(pid);
  const data = {};
  for (const k of KEYS) data[k] = st.get(k, k === 'activity' ? [] : k === 'stars' || k === 'spent' ? 0 : {});
  try {
    const prefix = `${PFX}p:${pid}:best:`;
    Object.keys(localStorage).filter((k) => k.startsWith(prefix)).forEach((k) => { data[k.slice(`${PFX}p:${pid}:`.length)] = JSON.parse(localStorage.getItem(k)); });
  } catch { /* ignore */ }
  return data;
}

const post = (body, keepalive = false) => fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive }).then((r) => r.json().then((j) => ({ status: r.status, ...j })));

export function push(pid, keepalive = false) {
  if (!pid || !navigator.onLine) return Promise.resolve();
  return post({ op: 'push', profile: pid, device: deviceId(), label: deviceLabel(), data: snapshot(pid) }, keepalive)
    .then((r) => { gstore.set('syncOk', r.ok ? Date.now() : gstore.get('syncOk', 0)); gstore.set('syncConfigured', r.error !== 'not_configured'); })
    .catch(() => {});
}

const dirty = new Set();
let timer = 0;
function schedule(pid) {
  dirty.add(pid);
  clearTimeout(timer);
  timer = setTimeout(flush, 4000);
}
function flush(keepalive = false) { const ids = [...dirty]; dirty.clear(); ids.forEach((id) => push(id, keepalive)); }

export function startSync() {
  setChangeHook(schedule);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && dirty.size) flush(true); });
  window.addEventListener('online', () => profiles.list().forEach((p) => schedule(p.id)));
  // upload what is already saved on this device
  setTimeout(() => profiles.list().forEach((p) => push(p.id)), 2500);
}

// ---------------------------------------------------------------- grown-ups side
let remote = null; // profile id -> [{device, updated, label, data}]
let fetchedAt = 0;
export const syncState = { status: 'unknown' }; // unknown | ok | off | error

export async function refreshRemote(force = false) {
  if (!force && remote && Date.now() - fetchedAt < 15000) return false;
  try {
    const r = await post({ op: 'pull', pin: PIN, profiles: profiles.list().map((p) => p.id) });
    if (r.error === 'not_configured') { syncState.status = 'off'; return false; }
    if (!r.profiles) { syncState.status = 'error'; return false; }
    remote = r.profiles; fetchedAt = Date.now(); syncState.status = 'ok';
    return true;
  } catch { syncState.status = 'error'; return false; }
}
export async function resetRemote(pid) { try { await post({ op: 'reset', pin: PIN, profile: pid }); if (remote) delete remote[pid]; } catch { /* ignore */ } }

/** One child's progress combined from every device (this device's live data replaces its own cloud copy). */
export function mergedView(pid) {
  const me = deviceId();
  const parts = [{ device: me, label: deviceLabel(), updated: Date.now(), data: snapshot(pid), local: true }, ...((remote?.[pid] || []).filter((d) => d.device !== me))];
  const v = { done: {}, activity: [], earned: 0, spent: 0, tricky: {}, best: {}, devices: parts.map((p) => ({ label: p.label, updated: p.updated, local: !!p.local })) };
  const seen = new Set();
  for (const { data } of parts) {
    for (const [k, n] of Object.entries(data.done || {})) v.done[k] = (v.done[k] || 0) + n;
    for (const e of data.activity || []) { const key = `${e.t}|${e.k}|${e.i}`; if (!seen.has(key)) { seen.add(key); v.activity.push(e); } }
    v.earned += data.stars || 0; v.spent += data.spent || 0;
    Object.assign(v.tricky, data.tricky || {});
    for (const [k, n] of Object.entries(data)) if (k.startsWith('best:')) v.best[k.slice(5)] = Math.max(v.best[k.slice(5)] || 0, n);
  }
  v.activity.sort((a, b) => a.t - b.t);
  return v;
}
