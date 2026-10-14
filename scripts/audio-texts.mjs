// Lists every phrase the app can speak -> audio/texts.json  (read by scripts/gen_audio.py).
// Run:  node scripts/audio-texts.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { DRAWINGS } from '../src/drawings.js';
import { STORIES, syllables } from '../src/stories.js';
import { GLYPHS, charInfo } from '../src/glyphs.js';
import { DEFAULT_WORDS, PICS, COUNTABLES, MIX_HEADS, mixName } from '../src/wordlist.js';
import { P } from '../src/phrases.js';
import { withArticle, L, letterOrName } from '../src/wordlist.js';

const key = (t) => t.toLowerCase().replace(/\s+/g, ' ').trim();
const out = new Map(); // key -> {text, page}
const add = (x, page = false) => {
  if (Array.isArray(x)) { x.forEach((p) => add(p)); return; } // phrases are lists of reusable parts
  if (x && typeof x === 'object' && x.pause) return;
  if (x && typeof x === 'object') { if (!out.has(x.k)) out.set(x.k, { k: x.k, text: x.t, page }); return; }
  if (x && !out.has(key(x))) out.set(key(x), { k: key(x), text: x.replace(/\s+/g, ' ').trim(), page });
};

// ---- app chrome
Object.values(P.tile).forEach((t) => add(t));
[P.hello, P.wellDone, P.theEnd, P.matchP2W, P.matchW2P, P.countDone, P.gotSticker, P.needStars, P.itsA, P.atTheDot].forEach((t) => add(t));

// ---- drawings
for (const d of DRAWINGS) {
  d.steps.forEach((s) => add(s.say));
  add(P.drawIntro(d.title, ''));
  add(P.drawWin(d.title));
}

// ---- letters & numbers
for (const ch of Object.keys(GLYPHS)) {
  const info = charInfo(ch);
  const isNum = /[0-9]/.test(ch);
  add(isNum ? P.numberIntro(info.name) : P.letterStart(info.speak));
  add(P.wordLetter(info.name));
  add(isNum ? P.greatNumber(info.name) : P.greatLetter(info.name));
  add(letterOrName(info.name));
}
for (let n = 2; n <= 4; n++) { add(P.nextLine(n)); add(P.keepGoing(n)); }

// ---- words they can write
const words = new Set();
DEFAULT_WORDS.forEach(([w]) => words.add(w));
PICS.forEach(([w]) => words.add(w));
for (const w of words) { add(P.wroteWin(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())); add(w); }

// ---- stories
const storyWords = new Set();
for (const s of STORIES) {
  add(s.title);
  for (const p of s.pages) {
    add(p.text, true);
    if (p.sfx) add(p.sfx);
    for (const m of p.text.matchAll(/[A-Za-z0-9]+(?:['\u2019-][A-Za-z0-9]+)*/g)) storyWords.add(m[0].replace(/['\u2019]s$/i, ''));
  }
}
for (const w of storyWords) {
  add(w);
  const parts = syllables(w.replace(/[^A-Za-z0-9-]/g, ''));
  if (parts.length > 1) parts.forEach((p) => add(p));
}

// ---- game prompts (the parts are reused for every word)
add(P.findWord('x')); add(P.findShort('x')); add(P.foundIt('x')); add(P.keepLooking('x')); add(P.wrongWord('x')); add(P.buildWord('x'));
for (const [w] of PICS) { add(P.wrongPic(w)); add(w); add(withArticle(w)); }
for (const ch of 'abcdefghijklmnopqrstuvwxyz') { add(L(ch)); add(P.notThat(ch)); }
for (const total of [5, 6]) for (let n = 0; n <= total; n++) add(P.score(n, total));

// ---- counting
for (let n = 1; n <= 10; n++) { add(String(n)); add(P.countNo(n)); }
for (const [, plural] of COUNTABLES) { add(P.tapToCount(plural)); add(P.howMany(plural)); add(P.countYes(2, plural)); }

// ---- silly mix-up names
MIX_HEADS.forEach((id) => add(mixName(id)));

mkdirSync(new URL('../audio/', import.meta.url), { recursive: true });
const list = [...out.values()];
writeFileSync(new URL('../audio/texts.json', import.meta.url), JSON.stringify(list));
console.log(`audio/texts.json: ${list.length} phrases (${list.filter((x) => x.page).length} story pages)`);
