// Tiny helpers for sound effects + reading instructions aloud (works offline on iPad).
import { gstore } from './store.js';

export const prefs = { sound: gstore.get('sound', true) };
export function setSound(on) {
  prefs.sound = on;
  gstore.set('sound', on);
  if (!on) window.speechSynthesis?.cancel();
}

let ctx;
function audio() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* no audio available */ }
  return ctx;
}

/** iOS only allows sound/speech after a tap — unlock both on the very first touch. */
export function unlockOnFirstTouch() {
  const unlock = () => {
    const a = audio();
    if (a) {
      const b = a.createBuffer(1, 1, 22050);
      const s = a.createBufferSource();
      s.buffer = b; s.connect(a.destination); s.start(0);
    }
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis?.speak(u);
    } catch { /* ignore */ }
    window.removeEventListener('pointerdown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
}

function note(freq, start, dur, type = 'sine', vol = 0.18) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

export function ding() {
  if (!prefs.sound) return;
  note(784, 0, 0.18, 'triangle');
  note(1175, 0.09, 0.28, 'triangle');
}
export function cheer() {
  if (!prefs.sound) return;
  [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.12, 0.3, 'triangle', 0.2));
  note(1568, 0.5, 0.5, 'sine', 0.15);
}
export function oops() {
  if (!prefs.sound) return;
  note(330, 0, 0.15, 'sine', 0.12);
  note(262, 0.12, 0.22, 'sine', 0.12);
}

let voice;
function pickVoice() {
  if (voice) return voice;
  const vs = window.speechSynthesis?.getVoices?.() || [];
  voice =
    vs.find((v) => /samantha|ava|allison|karen|moira|google us english/i.test(v.name) && /^en/i.test(v.lang)) ||
    vs.find((v) => /^en/i.test(v.lang));
  return voice;
}
window.speechSynthesis?.addEventListener?.('voiceschanged', () => { voice = null; });

const makeUtterance = (text, { rate = 0.85, pitch = 1.15 } = {}) => {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.pitch = pitch;
  const v = pickVoice();
  if (v) u.voice = v;
  return u;
};

let token = 0; // bumps whenever speech is cancelled so old callbacks go quiet

export function stopSpeaking() {
  token++;
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}

export function speak(text, opts) {
  if (!prefs.sound || !text || !window.speechSynthesis) return;
  try {
    stopSpeaking();
    window.speechSynthesis.speak(makeUtterance(text, opts));
  } catch { /* ignore */ }
}

/**
 * Read text aloud and report which word is being spoken (for highlighting).
 * iPad Safari doesn't always send word boundaries, so we fall back to estimated timing.
 * `starts` = character offset where each word begins.
 */
export function speakSync(text, { rate = 0.8, starts = [], onWord, onEnd } = {}) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  stopSpeaking();
  const mine = token;
  let gotBoundary = false;
  let finished = false;
  const timers = [];
  const finish = () => {
    if (finished || mine !== token) return;
    finished = true;
    timers.forEach(clearTimeout);
    onEnd?.();
  };
  const u = makeUtterance(text, { rate });
  u.onboundary = (e) => {
    if (mine !== token || (e.name && e.name !== 'word')) return;
    gotBoundary = true;
    let idx = 0;
    starts.forEach((st, i) => { if (st <= e.charIndex) idx = i; });
    onWord?.(idx);
  };
  u.onend = finish;
  u.onerror = finish;
  timers.push(setTimeout(() => {
    if (gotBoundary || mine !== token || finished) return;
    let t = 0;
    starts.forEach((st, i) => {
      const next = starts[i + 1] ?? text.length;
      timers.push(setTimeout(() => { if (mine === token && !finished) onWord?.(i); }, t));
      t += ((next - st) * 62 + 130) / rate / 0.8;
    });
  }, 700));
  window.speechSynthesis.speak(u);
}

/** Say several chunks one after another with a small gap (used for "sound it out"). */
export function speakSeq(parts, { rate = 0.6, gap = 420, onEach, onEnd } = {}) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  stopSpeaking();
  const mine = token;
  let i = 0;
  const next = () => {
    if (mine !== token) return;
    if (i >= parts.length) { onEnd?.(); return; }
    const idx = i++;
    onEach?.(idx);
    const u = makeUtterance(parts[idx], { rate, pitch: 1.1 });
    u.onend = () => setTimeout(next, gap);
    u.onerror = () => setTimeout(next, gap);
    window.speechSynthesis.speak(u);
  };
  next();
}
