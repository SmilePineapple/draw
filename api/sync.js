// Cloud sync for the children's progress, so grown-ups can see it from any device.
// Storage: an Upstash Redis database connected through Vercel (Storage / Marketplace). It sets the env vars below.
// Each device writes only its own entry (hash field = device id); the grown-ups page merges them.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const PIN = process.env.SYNC_PIN || '5253';
const ID = /^[\w-]{1,40}$/;

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (b.op === 'status') { res.status(200).json({ configured: !!(URL_ && TOKEN) }); return; }
  if (!URL_ || !TOKEN) { res.status(503).json({ error: 'not_configured' }); return; }
  try {
    if (b.op === 'push') {
      if (!ID.test(b.profile || '') || !ID.test(b.device || '') || typeof b.data !== 'object') { res.status(400).json({ error: 'bad request' }); return; }
      const json = JSON.stringify({ updated: Date.now(), label: String(b.label || '').slice(0, 40), data: b.data });
      if (json.length > 150000) { res.status(413).json({ error: 'too big' }); return; }
      await redis(['HSET', `ss:${b.profile}`, b.device, json]);
      res.status(200).json({ ok: true });
      return;
    }
    if (b.pin !== PIN) { res.status(401).json({ error: 'wrong pin' }); return; }
    if (b.op === 'pull') {
      const out = {};
      for (const id of (b.profiles || []).filter((x) => ID.test(x)).slice(0, 10)) {
        const flat = (await redis(['HGETALL', `ss:${id}`])) || [];
        out[id] = [];
        for (let i = 0; i < flat.length; i += 2) { try { out[id].push({ device: flat[i], ...JSON.parse(flat[i + 1]) }); } catch { /* skip */ } }
      }
      res.status(200).json({ profiles: out });
      return;
    }
    if (b.op === 'reset' && ID.test(b.profile || '')) { await redis(['DEL', `ss:${b.profile}`]); res.status(200).json({ ok: true }); return; }
    res.status(400).json({ error: 'unknown op' });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
