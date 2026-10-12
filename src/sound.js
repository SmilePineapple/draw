// Tiny helpers for sound effects + reading instructions aloud (works offline on iPad).
import { store } from './store.js';

export const prefs = { sound: store.get('sound', true) };
export function setSound(on) {
  prefs.sound = on;
  store.set('sound', on);
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

export function speak(text) {
  if (!prefs.sound || !text || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = 1.15;
    const v = pickVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}
