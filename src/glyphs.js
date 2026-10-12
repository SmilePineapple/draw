import { LETTER_SPELL } from './wordlist.js';
// Handwriting glyphs. Every glyph is drawn in a box that is ~100 wide:
//   y=20  top line (capitals / tall letters)
//   y=60  middle line (small letters)
//   y=120 baseline
//   y=155 bottom of descenders (g j p q y)
// Each stroke is one SVG path, listed in the order (and direction) a child writes it.

export const LINES = { top: 20, mid: 60, base: 120, desc: 155, height: 175 };

const G = (strokes, adv = 100) => ({ strokes, adv });

// shared pieces
const circleA = 'M76 74C68 63 58 60 50 60C32 60 20 74 20 90C20 108 32 120 50 120C62 120 72 112 76 104';
const bump = 'M20 20H52C86 20 86 70 52 70H20';

export const GLYPHS = {
  // ---------- CAPITALS ----------
  A: G(['M50 20L15 120', 'M50 20L85 120', 'M28 85H72']),
  B: G(['M22 20V120', 'M22 20H52C84 20 84 68 52 68H22', 'M22 68H58C92 68 92 120 58 120H22']),
  C: G(['M82 35C72 24 60 20 50 20C28 20 15 42 15 70C15 98 28 120 50 120C62 120 74 115 82 105']),
  D: G(['M22 20V120', 'M22 20H46C90 20 90 120 46 120H22']),
  E: G(['M22 20V120', 'M22 20H82', 'M22 70H70', 'M22 120H82']),
  F: G(['M22 20V120', 'M22 20H82', 'M22 70H70']),
  G: G(['M82 35C72 24 60 20 50 20C28 20 15 42 15 70C15 98 28 120 50 120C72 120 85 105 85 78', 'M55 78H85']),
  H: G(['M20 20V120', 'M80 20V120', 'M20 70H80']),
  I: G(['M50 20V120', 'M30 20H70', 'M30 120H70'], 80),
  J: G(['M72 20V85C72 112 58 122 44 122C28 122 18 112 15 98'], 90),
  K: G(['M22 20V120', 'M78 20L22 78', 'M42 58L80 120']),
  L: G(['M22 20V120H80']),
  M: G(['M15 120V20L50 90L85 20V120'], 100),
  N: G(['M20 120V20L80 120V20']),
  O: G(['M50 20C25 20 15 45 15 70C15 98 28 120 50 120C72 120 85 98 85 70C85 45 75 20 50 20']),
  P: G(['M22 20V120', 'M22 20H54C86 20 86 72 54 72H22']),
  Q: G(['M50 20C25 20 15 45 15 70C15 98 28 120 50 120C72 120 85 98 85 70C85 45 75 20 50 20', 'M58 92L86 128']),
  R: G(['M22 20V120', 'M22 20H54C86 20 86 72 54 72H22', 'M52 72L82 120']),
  S: G(['M78 34C68 22 56 20 46 20C26 20 20 42 35 55C50 68 82 72 82 95C82 112 68 120 48 120C32 120 20 112 15 100']),
  T: G(['M12 20H88', 'M50 20V120']),
  U: G(['M18 20V80C18 125 82 125 82 80V20']),
  V: G(['M15 20L50 120L85 20']),
  W: G(['M8 20L28 120L50 55L72 120L92 20'], 100),
  X: G(['M18 20L82 120', 'M82 20L18 120']),
  Y: G(['M15 20L50 72L85 20', 'M50 72V120']),
  Z: G(['M18 20H82L18 120H82']),

  // ---------- small letters ----------
  a: G([circleA, 'M78 60V120']),
  b: G(['M25 20V120', 'M25 78C32 66 42 60 52 60C72 60 82 76 82 90C82 108 70 120 52 120C42 120 32 116 25 104']),
  c: G(['M78 72C70 62 60 60 50 60C32 60 20 74 20 90C20 108 32 120 50 120C62 120 72 114 78 106']),
  d: G([circleA, 'M78 20V120']),
  e: G(['M20 90H80C80 70 66 60 50 60C32 60 20 74 20 90C20 108 32 120 50 120C62 120 72 115 78 106']),
  f: G(['M68 30C62 22 54 20 48 24C42 28 40 36 40 48V120', 'M22 62H64'], 80),
  g: G([circleA, 'M78 60V135C78 152 62 156 45 154C35 152 28 148 22 140']),
  h: G(['M25 20V120', 'M25 80C32 66 42 60 52 60C68 60 76 70 76 84V120']),
  i: G(['M50 60V120', 'M50 32V38'], 60),
  j: G(['M44 60V138C44 150 36 156 22 152', 'M44 32V38'], 70),
  k: G(['M25 20V120', 'M72 60L25 98', 'M42 84L76 120']),
  l: G(['M50 20V120'], 60),
  m: G(['M18 60V120', 'M18 82C22 68 30 60 40 60C52 60 56 70 56 82V120', 'M56 82C60 68 68 60 78 60C90 60 94 70 94 82V120'], 112),
  n: G(['M25 60V120', 'M25 82C32 66 42 60 52 60C68 60 76 70 76 84V120']),
  o: G(['M50 60C30 60 20 76 20 90C20 108 32 120 50 120C68 120 80 108 80 90C80 76 70 60 50 60']),
  p: G(['M25 60V155', 'M25 78C32 66 42 60 52 60C72 60 82 76 82 90C82 108 70 120 52 120C42 120 32 116 25 104']),
  q: G([circleA, 'M78 60V155']),
  r: G(['M30 60V120', 'M30 84C34 68 44 60 60 62'], 80),
  s: G(['M74 70C68 62 58 60 50 60C34 60 28 72 36 80C44 88 72 92 72 104C72 116 62 120 48 120C36 120 26 114 22 106']),
  t: G(['M46 28V108C46 118 52 122 64 120', 'M24 62H68'], 80),
  u: G(['M24 60V94C24 112 36 120 50 120C64 120 76 112 76 96', 'M76 60V120']),
  v: G(['M20 60L50 120L80 60']),
  w: G(['M10 60L30 120L50 76L70 120L90 60']),
  x: G(['M22 60L78 120', 'M78 60L22 120']),
  y: G(['M22 60L48 116', 'M78 60L40 140C34 152 26 154 18 152']),
  z: G(['M22 60H78L22 120H80']),

  // ---------- numbers ----------
  0: G(['M50 20C28 20 22 45 22 70C22 98 32 120 50 120C68 120 78 98 78 70C78 45 72 20 50 20']),
  1: G(['M30 44L52 20V120']),
  2: G(['M20 45C22 28 36 20 50 20C68 20 80 32 78 50C76 72 35 98 20 120H82']),
  3: G(['M22 35C30 22 40 20 50 20C70 20 78 32 78 45C78 60 62 68 45 68C65 68 82 78 82 95C82 112 68 120 50 120C35 120 24 112 18 100']),
  4: G(['M62 20L15 90H88', 'M62 20V120']),
  5: G(['M74 20H28L24 64C32 58 42 56 52 56C74 56 82 76 80 96C78 114 62 122 46 120C34 118 24 112 18 100']),
  6: G(['M70 22C45 30 20 55 20 85C20 110 32 120 50 120C70 120 80 106 80 90C80 72 66 62 50 62C34 62 22 72 21 88']),
  7: G(['M18 20H82L42 120']),
  8: G(['M50 20C30 20 22 32 22 44C22 58 36 66 50 70C70 76 82 84 82 98C82 112 68 120 50 120C32 120 18 112 18 98C18 84 30 76 50 70C64 66 78 58 78 44C78 32 70 20 50 20']),
  9: G(['M50 20C32 20 22 32 22 48C22 64 34 74 50 74C66 74 78 62 78 48C78 32 66 20 50 20', 'M78 48V72C78 102 64 120 36 120']),
};

// name + sound + picture for each letter (read aloud)
export const ABC_INFO = {
  a: ['apple', '🍎'], b: ['ball', '⚽'], c: ['cat', '🐱'], d: ['dog', '🐶'], e: ['egg', '🥚'],
  f: ['fish', '🐟'], g: ['goat', '🐐'], h: ['hat', '🎩'], i: ['ice cream', '🍦'], j: ['juice', '🧃'],
  k: ['kite', '🪁'], l: ['lion', '🦁'], m: ['moon', '🌙'], n: ['nose', '👃'], o: ['octopus', '🐙'],
  p: ['pig', '🐷'], q: ['queen', '👑'], r: ['rocket', '🚀'], s: ['sun', '☀️'], t: ['tiger', '🐯'],
  u: ['umbrella', '☂️'], v: ['van', '🚐'], w: ['whale', '🐳'], x: ['xylophone', '🎶'], y: ['yo-yo', '🪀'],
  z: ['zebra', '🦓'],
};
const NUM_NAMES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

export const CAPS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const SMALLS = 'abcdefghijklmnopqrstuvwxyz'.split('');
export const NUMS = '0123456789'.split('');

/** What to say / show for a single character. */
export function charInfo(ch) {
  const lower = ch.toLowerCase();
  if (/[0-9]/.test(ch)) return { name: NUM_NAMES[+ch], big: ch, caption: NUM_NAMES[+ch], emoji: '' };
  const [word, emoji] = ABC_INFO[lower] || ['', ''];
  const isCap = ch !== lower;
  return {
    name: ch.toUpperCase(),
    big: ch,
    caption: `${ch.toUpperCase()} is for ${word}`,
    speak: `${isCap ? 'Capital' : 'Small'} ${LETTER_SPELL[lower]}. ${LETTER_SPELL[lower]} is for ${word}.`,
    emoji,
  };
}

/**
 * Lay a piece of text out into tracer steps.
 * Returns { vbW, vbH, steps, backdrop }.
 * Each stroke becomes one step with a transform offset so the same glyph path can be reused.
 */
export function layoutText(text, { pad = 24, minW = 200 } = {}) {
  const chars = [...text].filter((c) => c === ' ' || GLYPHS[c]);
  const gap = 8;
  let x = pad;
  const placed = [];
  for (const ch of chars) {
    if (ch === ' ') { x += 50; continue; }
    const g = GLYPHS[ch];
    placed.push({ ch, g, x: x + g.adv / 2 - 50 });
    x += g.adv + gap;
  }
  const contentW = x - gap + pad;
  const vbW = Math.max(minW, contentW);
  const shift = (vbW - contentW) / 2;
  const steps = [];
  placed.forEach((p, li) => {
    p.x += shift;
    p.g.strokes.forEach((d, si) => {
      steps.push({
        paths: [{ d, dx: p.x, dy: 0 }],
        letter: p.ch,
        letterIndex: li,
        strokeIndex: si,
        strokeCount: p.g.strokes.length,
        first: si === 0,
      });
    });
  });
  const L = LINES;
  const backdrop = `
    <line x1="6" x2="${vbW - 6}" y1="${L.top}" y2="${L.top}" stroke="#a8c8f5" stroke-width="1.6"/>
    <line x1="6" x2="${vbW - 6}" y1="${L.mid}" y2="${L.mid}" stroke="#a8c8f5" stroke-width="1.4" stroke-dasharray="5 5"/>
    <line x1="6" x2="${vbW - 6}" y1="${L.base}" y2="${L.base}" stroke="#f5a8a8" stroke-width="1.8"/>`;
  return { vbW, vbH: L.height, steps, backdrop };
}
