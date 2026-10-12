// "Save voices for offline": downloads every recorded voice clip into the app's offline cache.
import { clipFiles } from './sound.js';

const cacheName = async () => (await caches.keys()).filter((n) => n.startsWith('supersketch-')).sort().pop() || 'supersketch-v4';

export async function voiceStatus() {
  const files = [...new Set(await clipFiles())];
  if (!files.length) return { total: 0, saved: 0 };
  let saved = 0;
  try {
    const cache = await caches.open(await cacheName());
    const keys = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
    saved = files.filter((f) => keys.has(`/audio/${f}`)).length;
  } catch { /* ignore */ }
  return { total: files.length, saved };
}

export async function downloadVoices(onProgress) {
  const files = [...new Set(await clipFiles())];
  const cache = await caches.open(await cacheName());
  let done = 0;
  const queue = [...files];
  const worker = async () => {
    while (queue.length) {
      const f = queue.pop();
      const url = `/audio/${f}`;
      try {
        if (!(await cache.match(url))) {
          const r = await fetch(url);
          if (r.ok) await cache.put(url, r);
        }
      } catch { /* try the rest */ }
      onProgress?.(++done, files.length);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}
