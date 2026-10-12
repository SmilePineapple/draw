import { DRAWINGS, GROUPS, drawingById } from './drawings.js';
import { GLYPHS, CAPS, SMALLS, NUMS, charInfo, layoutText } from './glyphs.js';
import { createTracer } from './tracer.js';
import { prefs, setSound, speak, cheer, stopSpeaking, unlockOnFirstTouch } from './sound.js';
import { createReader } from './reader.js';
import { store, addStar, stars, markDone, isDone, profiles } from './store.js';
import { createGames } from './games.js';
import { createColour } from './colour.js';
import { createMixup } from './mixup.js';
import { createStickers } from './stickers.js';
import { createGrownups } from './grownups.js';

const app = document.getElementById('app');
let tracer = null;

unlockOnFirstTouch();
// stop iPad pinch-zoom / double-tap zoom so little fingers don't lose the page
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

const $ = (sel, root = app) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ============================================================ helpers
const PALETTE = ['auto', '#ffffff', '#222222', '#e53935', '#fb8c00', '#f9d71c', '#a3d63a', '#43a047',
  '#12b5b0', '#1e88e5', '#283593', '#8e24aa', '#ec407a', '#8d5524', '#9e9e9e', '#f4c9a0'];

function topBar({ back, title, right = '' }) {
  return `
    <header class="bar">
      <a class="btn round" href="${back}" aria-label="Back">⬅</a>
      <h2>${title}</h2>
      <div class="bar-right">${right}<button class="btn round" id="snd" aria-label="Sound">${prefs.sound ? '🔊' : '🔇'}</button></div>
    </header>`;
}
function wireSound() {
  const b = $('#snd');
  if (!b) return;
  b.onclick = () => { setSound(!prefs.sound); b.textContent = prefs.sound ? '🔊' : '🔇'; };
}

function drawingThumb(d) {
  const items = d.steps
    .map((s, i) => ({ s, z: s.z ?? i * 10 }))
    .sort((a, b) => a.z - b.z)
    .map(({ s }) => s.paths.map((p) => (s.fill
      ? `<path d="${p}" fill="${s.fill}" stroke="#2b2b3a" stroke-width="6" stroke-linejoin="round"/>`
      : `<path d="${p}" fill="none" stroke="#2b2b3a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`)).join(''))
    .join('');
  return `<svg viewBox="0 0 400 400" aria-hidden="true">${items}</svg>`;
}

function glyphThumb(ch) {
  const g = GLYPHS[ch];
  const paths = g.strokes.map((d) => `<path d="${d}" fill="none" stroke="#2b2b3a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return `<svg viewBox="-8 8 116 156" aria-hidden="true">${paths}</svg>`;
}

function confetti() {
  cheer();
  const box = document.createElement('div');
  box.className = 'confetti';
  const bits = ['🎉', '⭐', '✨', '🌟', '🎈', '💥'];
  for (let i = 0; i < 36; i++) {
    const s = document.createElement('span');
    s.textContent = bits[i % bits.length];
    s.style.left = `${Math.random() * 100}%`;
    s.style.animationDelay = `${Math.random() * 0.6}s`;
    s.style.fontSize = `${24 + Math.random() * 30}px`;
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3200);
}

function starsBadge() {
  return `<a class="stars" href="#/stickers" title="Stars to spend on stickers">⭐ <b>${stars()}</b></a>`;
}

// ============================================================ shared tracing screen
/**
 * Renders the trace screen (stage + side panel) and wires up all the buttons.
 */
function traceScreen({ back, title, vbW, vbH, steps, mode, backdrop, sayFor, headerExtra = '', panelTop = '', winHtml, winSay, onWin }) {
  const wide = vbW / vbH > 2.4;
  app.innerHTML = `
    <div class="screen trace ${wide ? 'wide' : ''} ${mode}">
      ${topBar({ back, title, right: `${headerExtra}<div class="seg" id="seg" role="group" aria-label="Where to draw"><button data-m="screen">✏️ Screen</button><button data-m="paper">📄 Paper</button></div><button class="btn round" id="print" aria-label="Print a worksheet">🖨️</button>` })}
      <main class="trace-main">
        <div class="stage-host" id="host"></div>
        <aside class="panel" id="panel">
          <div class="panel-top">${panelTop}</div>
          <div class="progress" id="progress"></div>
          <div class="paper-banner">📄 Draw it on your paper!</div>
          <p class="say" id="say"></p>
          <button class="btn big-btn paper-next" id="paperNext">✅ Done! Next step</button>
          <div class="tools" id="tools">
            <button class="btn tool" id="hear"><span>🔊</span>Hear it</button>
            <button class="btn tool" id="hint"><span>👀</span>Show me</button>
            <button class="btn tool" id="again"><span>🧽</span>Try again</button>
            <button class="btn tool" id="prev"><span>◀</span>Back</button>
            <button class="btn tool" id="skip"><span>▶</span>Skip</button>
          </div>
          <div class="palette" id="palette" role="radiogroup" aria-label="Pen colour"></div>
          <div class="win" id="win" hidden></div>
        </aside>
      </main>
    </div>`;
  wireSound();

  const sayEl = $('#say');
  const progress = $('#progress');
  progress.innerHTML = steps.map(() => '<i></i>').join('');
  progress.style.setProperty('--n', steps.length);
  let lastSay = '';

  let onStepUi = null;
  tracer?.destroy();
  tracer = createTracer({
    mount: $('#host'),
    vbW, vbH, steps, mode, backdrop,
    onStepChange(i, step) {
      [...progress.children].forEach((c, k) => c.classList.toggle('done', k < i));
      [...progress.children].forEach((c, k) => c.classList.toggle('now', k === i));
      const text = sayFor(i, step, steps);
      lastSay = text.say;
      sayEl.innerHTML = text.html ?? esc(text.say);
      if (text.speak ?? text.say) speak(text.speak ?? text.say);
      onStepUi?.(i, step);
    },
    onComplete() {
      [...progress.children].forEach((c) => { c.classList.add('done'); c.classList.remove('now'); });
      addStar(1);
      onWin?.();
      showWin();
    },
  });
  const t = tracer;

  function showWin() {
    confetti();
    $('#panel').classList.add('won');
    sayEl.hidden = true;
    $('#tools').hidden = true;
    const w = $('#win');
    w.hidden = false;
    w.innerHTML = winHtml();
    if (paperOn) {
      w.querySelector('[data-act="save"]')?.remove();
      w.querySelector('h3')?.insertAdjacentHTML('afterend', '<p>🖍️ Now colour yours in with your crayons!</p>');
    }
    w.querySelector('[data-act="again"]')?.addEventListener('click', () => resetUi());
    w.querySelector('[data-act="save"]')?.addEventListener('click', savePicture);
    speak(winSay || 'Great job! You did it!');
  }
  function resetUi() {
    $('#win').hidden = true;
    $('#panel').classList.remove('won');
    sayEl.hidden = false;
    $('#tools').hidden = false;
    t.restart();
  }
  async function savePicture() {
    const blob = await t.toBlob();
    if (!blob) return;
    const file = new File([blob], `${title.replace(/\W+/g, '-').toLowerCase()}.png`, { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title }); return; }
    } catch { /* user cancelled share */ return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  let paperOn = store.get('paper', false);
  const panelEl = $('#panel');
  function applyMode(on, first = false) {
    paperOn = on;
    store.set('paper', on);
    panelEl.classList.toggle('paper-on', on);
    app.querySelectorAll('#seg button').forEach((b) => b.classList.toggle('on', (b.dataset.m === 'paper') === on));
    if (!first) {
      $('#win').hidden = true; panelEl.classList.remove('won'); sayEl.hidden = false; $('#tools').hidden = false;
    }
    t.setPaper(on);
  }
  $('#seg').onclick = (e) => {
    const b = e.target.closest('button');
    if (b) applyMode(b.dataset.m === 'paper');
  };
  $('#paperNext').onclick = () => t.skip();
  $('#print').onclick = () => printSheet({ title, vbW, vbH, steps, mode, backdrop });
  applyMode(paperOn, true);

  $('#hear').onclick = () => speak(lastSay);
  $('#hint').onclick = () => { t.hint(); };
  $('#again').onclick = () => t.clearStep();
  $('#prev').onclick = () => t.back();
  $('#skip').onclick = () => t.skip();

  const pal = $('#palette');
  pal.innerHTML = PALETTE.map((c, i) => {
    const style = c === 'auto' ? 'background:conic-gradient(#e53935,#fb8c00,#f9d71c,#43a047,#1e88e5,#8e24aa,#e53935)' : `background:${c}`;
    return `<button class="swatch ${i === 0 ? 'sel' : ''}" role="radio" aria-checked="${i === 0}" data-c="${c}" style="${style}" aria-label="${c === 'auto' ? 'Rainbow' : c}"></button>`;
  }).join('');
  pal.onclick = (e) => {
    const b = e.target.closest('.swatch');
    if (!b) return;
    pal.querySelectorAll('.swatch').forEach((s) => { s.classList.toggle('sel', s === b); s.setAttribute('aria-checked', s === b); });
    t.setColor(b.dataset.c);
  };

  return { tracer: t, setStepUi: (fn) => { onStepUi = fn; }, showWin };
}


// ============================================================ printable worksheets
function printSheet({ title, vbW, vbH, steps, mode, backdrop }) {
  const norm = (p) => (typeof p === 'string' ? { d: p, dx: 0, dy: 0 } : { dx: 0, dy: 0, ...p });
  const paths = (st, cls) => st.paths.map(norm).map((p) => `<path d="${p.d}" transform="translate(${p.dx} ${p.dy})" class="${cls}"/>`).join('');
  let html = `<h1>✏️ ${esc(title)}</h1>`;
  if (mode === 'write') {
    const narrow = vbW / vbH < 2;
    const startDots = (numbered) => steps.map((st) => {
      const p = norm(st.paths[0]);
      const m = p.d.match(/^M\s*(-?[\d.]+)[ ,]\s*(-?[\d.]+)/);
      if (!m) return '';
      const x = +m[1] + p.dx; const y = +m[2] + p.dy;
      return `<circle cx="${x}" cy="${y}" r="7" class="pr-start"/>${numbered && st.strokeCount > 1 ? `<text x="${x}" y="${y + 4}" text-anchor="middle" class="pr-num">${st.strokeIndex + 1}</text>` : ''}`;
    }).join('');
    const row = (dotted) => `<svg viewBox="0 0 ${vbW} ${vbH}" class="pr-row ${narrow ? 'narrow' : ''}">${backdrop || ''}${steps.map((st) => paths(st, dotted ? 'pr-dots' : 'pr-model')).join('')}${startDots(!dotted)}</svg>`;
    const n = narrow ? 11 : 5;
    html += '<p>Look at the first one, then trace the dots with your pencil. Start at the green dots!</p>';
    html += row(false) + Array.from({ length: n }, () => row(true)).join('');
  } else {
    html += '<p>Draw one step at a time. The <b>thick</b> line is the new part!</p><div class="pr-grid">';
    steps.forEach((st, i) => {
      const before = steps.slice(0, i).map((s2) => paths(s2, 'pr-done')).join('');
      html += `<figure><svg viewBox="0 0 400 400">${before}${paths(st, 'pr-cur')}</svg><figcaption><b>${i + 1}.</b> ${esc(st.say || '')}</figcaption></figure>`;
    });
    html += '</div>';
  }
  let box = document.getElementById('print-area');
  if (!box) { box = document.createElement('div'); box.id = 'print-area'; document.body.appendChild(box); }
  box.innerHTML = html;
  setTimeout(() => window.print(), 50);
}

// ============================================================ screens
function home() {
  tracer?.destroy(); tracer = null;
  const me = profiles.current();
  app.innerHTML = `
    <div class="screen home">
      <header class="home-head">
        <a class="who-chip" href="#/who" aria-label="Change player"><span class="who-av">${me ? drawingThumb(drawingById(me.avatar) || DRAWINGS[0]) : ''}</span><b>${esc(me?.name || '')}</b></a>
        <div class="logo"><span>Super</span> <span>Sketch</span></div>
        ${starsBadge()}
        <a class="btn round" href="#/grownups" aria-label="Grown-ups">🔒</a>
        <button class="btn round" id="snd" aria-label="Sound">${prefs.sound ? '🔊' : '🔇'}</button>
      </header>
      <p class="hello">${me ? `Hi ${esc(me.name)}! ` : ''}What shall we do today?</p>
      <nav class="tiles">
        <a class="tile t-draw" href="#/draw"><span class="big">🎨</span><b>Draw Heroes</b><small>Step by step</small></a>
        <a class="tile t-letters" href="#/letters"><span class="big">✏️</span><b>Letters</b><small>A B C &amp; 1 2 3</small></a>
        <a class="tile t-words" href="#/words"><span class="big">📝</span><b>Words</b><small>Write names &amp; words</small></a>
        <a class="tile t-stories" href="#/stories"><span class="big">📖</span><b>Stories</b><small>Funny stories to read</small></a>
        <a class="tile t-games" href="#/games"><span class="big">🎮</span><b>Games</b><small>Match, count, colour &amp; mix</small></a>
        <a class="tile t-stickers" href="#/stickers"><span class="big">🌟</span><b>Sticker Book</b><small>Spend your stars</small></a>
      </nav>
    </div>`;
  wireSound();
  const say = { '.t-draw': 'Draw heroes!', '.t-letters': 'Letters!', '.t-words': 'Words!', '.t-stories': 'Stories!', '.t-games': 'Games!', '.t-stickers': 'Sticker book!' };
  Object.entries(say).forEach(([sel, t]) => { $(sel).onclick = () => speak(t); });
}

function drawList() {
  tracer?.destroy(); tracer = null;
  const sections = GROUPS.map((g) => {
    const items = DRAWINGS.filter((d) => d.group === g.id);
    if (!items.length) return '';
    return `
      <section class="group" style="--gc:${g.color};--gb:${g.bg}">
        <h3><span>${g.emoji}</span> ${esc(g.name)}</h3>
        <div class="cards">
          ${items.map((d) => `
            <a class="card" href="#/draw/${d.id}">
              <div class="thumb">${drawingThumb(d)}</div>
              <b>${esc(d.title)}</b>
              ${isDone('draw', d.id) ? '<i class="badge">⭐</i>' : ''}
            </a>`).join('')}
        </div>
      </section>`;
  }).join('');
  app.innerHTML = `
    <div class="screen list">
      ${topBar({ back: '#/', title: 'Draw Heroes', right: starsBadge() })}
      <main class="scroll">${sections}</main>
    </div>`;
  wireSound();
}

function drawPage(id) {
  const d = drawingById(id);
  if (!d) return (location.hash = '#/draw');
  const idx = DRAWINGS.indexOf(d);
  const next = DRAWINGS[(idx + 1) % DRAWINGS.length];
  traceScreen({
    back: '#/draw', title: d.title, vbW: 400, vbH: 400, mode: 'draw',
    steps: d.steps,
    panelTop: `<div class="mini">${drawingThumb(d)}</div><div class="step-label" id="steplabel"></div>`,
    sayFor(i, step, all) {
      $('#steplabel').textContent = `Step ${i + 1} of ${all.length}`;
      const say = step.say;
      return { say, speak: i === 0 ? `Let's draw ${d.title}! ${say}` : say };
    },
    winHtml() {
      return `
        <div class="win-card">
          <div class="win-emoji">🎉</div>
          <h3>You drew ${esc(d.title)}!</h3>
          <p>Amazing job! You can keep doodling on your picture too.</p>
          <div class="win-actions">
            <button class="btn big-btn" data-act="save">💾 Save picture</button>
            <button class="btn big-btn alt" data-act="again">🔁 Draw again</button>
            <a class="btn big-btn next" href="#/draw/${next.id}">➡ ${esc(next.title)}</a>
            <a class="btn big-btn alt" href="#/draw">🎨 All heroes</a>
          </div>
        </div>`;
    },
    winSay: `You drew ${d.title}! Amazing job!`,
    onWin: () => markDone('draw', d.id),
  });
}

// ---------------------------------------------------------------- letters
const SETS = {
  caps: { name: 'ABC', chars: CAPS },
  smalls: { name: 'abc', chars: SMALLS },
  nums: { name: '123', chars: NUMS },
};

function lettersList(set = 'caps') {
  tracer?.destroy(); tracer = null;
  const s = SETS[set] || SETS.caps;
  app.innerHTML = `
    <div class="screen list">
      ${topBar({ back: '#/', title: 'Letters', right: starsBadge() })}
      <nav class="tabs">
        ${Object.entries(SETS).map(([k, v]) => `<a class="tab ${k === set ? 'on' : ''}" href="#/letters/${k}">${v.name}</a>`).join('')}
      </nav>
      <main class="scroll">
        <div class="cards glyphs">
          ${s.chars.map((ch) => `
            <a class="card glyph" href="#/letter/${set}/${encodeURIComponent(ch)}">
              <div class="thumb">${glyphThumb(ch)}</div>
              ${isDone('letter', ch) ? '<i class="badge">⭐</i>' : ''}
            </a>`).join('')}
        </div>
      </main>
    </div>`;
  wireSound();
}

function letterPage(set, ch) {
  const s = SETS[set];
  if (!s || !GLYPHS[ch]) return (location.hash = '#/letters');
  const i = s.chars.indexOf(ch);
  const prev = s.chars[(i - 1 + s.chars.length) % s.chars.length];
  const next = s.chars[(i + 1) % s.chars.length];
  const info = charInfo(ch);
  const lay = layoutText(ch);
  const isNum = /[0-9]/.test(ch);
  traceScreen({
    back: `#/letters/${set}`, title: isNum ? `Number ${ch}` : `Letter ${ch}`,
    vbW: lay.vbW, vbH: lay.vbH, steps: lay.steps, backdrop: lay.backdrop, mode: 'write',
    headerExtra: `<a class="btn round" href="#/letter/${set}/${encodeURIComponent(prev)}" aria-label="Previous">◀</a><a class="btn round" href="#/letter/${set}/${encodeURIComponent(next)}" aria-label="Next">▶</a>`,
    panelTop: `<div class="letter-card"><div class="big-letter">${esc(ch)}</div>${info.emoji ? `<div class="pic">${info.emoji}</div>` : ''}<div class="cap">${esc(info.caption)}</div></div>`,
    sayFor(k, step) {
      if (step.first) {
        const html = step.strokeCount > 1
          ? `Start at the <b class="g">green dot</b>.<br>Line <b>1</b> first!`
          : `Start at the <b class="g">green dot</b> and follow the line.`;
        const say = isNum ? `Let's write the number ${info.name}. Start at the green dot.` : `${info.speak} Start at the green dot.`;
        return { say, html };
      }
      return { say: `Now line ${step.strokeIndex + 1}.`, html: `Now line <b>${step.strokeIndex + 1}</b>!` };
    },
    winHtml() {
      return `
        <div class="win-card">
          <div class="win-emoji">${info.emoji || '🎉'}</div>
          <h3>Great ${isNum ? 'number' : 'letter'} ${esc(ch)}!</h3>
          <div class="win-actions">
            <a class="btn big-btn next" href="#/letter/${set}/${encodeURIComponent(next)}">➡ Next: ${esc(next)}</a>
            <button class="btn big-btn alt" data-act="again">🔁 Again</button>
            <a class="btn big-btn alt" href="#/letters/${set}">🔤 All ${s.name}</a>
          </div>
        </div>`;
    },
    winSay: isNum ? `Great number ${info.name}!` : `Great letter ${info.name}!`,
    onWin: () => markDone('letter', ch),
  });
}

// ---------------------------------------------------------------- words
const DEFAULT_WORDS = [
  ['Bluey', '🐶'], ['Bingo', '🐕'], ['Hulk', '💚'], ['Thor', '⚡'], ['Yoda', '🟢'], ['Luke', '🗡️'],
  ['Vader', '🖤'], ['Catboy', '🐱'], ['Owlette', '🦉'], ['Gekko', '🦎'], ['Hero', '🦸'], ['Star', '⭐'],
  ['Mom', '💖'], ['Dad', '💙'], ['Love', '❤️'], ['Cat', '🐈'], ['Dog', '🐕'], ['Sun', '☀️'],
  ['Bandit', '🐕'], ['Chilli', '🐕'], ['Muffin', '🐶'], ['Socks', '🐾'], ['Groot', '🌳'], ['Grogu', '💚'],
  ['Chewie', '🐻'], ['Boba', '🚀'], ['Luna', '🌙'], ['Ninja', '🥷'], ['Panther', '🐆'],
];
const getCustom = () => store.get('words', []);
const caseStyle = () => store.get('case', 'Abc');
function styled(w) {
  const l = w.toLowerCase();
  return { Abc: l.charAt(0).toUpperCase() + l.slice(1), ABC: l.toUpperCase(), abc: l }[caseStyle()] || w;
}
const clean = (w) => w.replace(/[^A-Za-z ]/g, '').trim().replace(/\s+/g, ' ').slice(0, 12);

function wordsList(edit = false) {
  tracer?.destroy(); tracer = null;
  const custom = getCustom();
  const card = (w, emoji, isCustom) => `
    <a class="card word" href="#/word/${encodeURIComponent(w)}">
      <span class="w">${esc(styled(w))}</span>
      ${emoji ? `<span class="e">${emoji}</span>` : ''}
      ${isDone('word', w.toLowerCase()) ? '<i class="badge">⭐</i>' : ''}
      ${isCustom && edit ? `<button class="del" data-w="${esc(w)}" aria-label="Remove ${esc(w)}">✕</button>` : ''}
    </a>`;
  app.innerHTML = `
    <div class="screen list">
      ${topBar({ back: '#/', title: 'Words', right: starsBadge() })}
      <nav class="tabs">
        ${['Abc', 'ABC', 'abc'].map((c) => `<button class="tab ${c === caseStyle() ? 'on' : ''}" data-case="${c}">${c}</button>`).join('')}
      </nav>
      <main class="scroll">
        <section class="group" style="--gc:#7a3fd1;--gb:#efe3ff">
          <h3><span>👨‍👩‍👧</span> Our names &amp; words</h3>
          <div class="cards words">
            ${custom.map((w) => card(w, '🌟', true)).join('')}
            <button class="card word add" id="add"><span class="w">➕</span><span class="e">Add a word</span></button>
          </div>
          ${custom.length ? `<button class="link" id="edit">${edit ? '✔ Done' : '✎ Remove words'}</button>` : ''}
        </section>
        <section class="group" style="--gc:#e23636;--gb:#ffe3e3">
          <h3><span>🦸</span> Hero &amp; fun words</h3>
          <div class="cards words">${DEFAULT_WORDS.map(([w, e]) => card(w, e, false)).join('')}</div>
        </section>
      </main>
    </div>`;
  wireSound();
  app.querySelectorAll('[data-case]').forEach((b) => b.onclick = () => { store.set('case', b.dataset.case); wordsList(edit); });
  $('#add').onclick = () => {
    const w = clean(prompt('Type a name or word (letters only):') || '');
    if (!w) return;
    const list = getCustom().filter((x) => x.toLowerCase() !== w.toLowerCase());
    store.set('words', [...list, w]);
    wordsList(edit);
  };
  $('#edit')?.addEventListener('click', () => wordsList(!edit));
  app.querySelectorAll('.del').forEach((b) => b.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    store.set('words', getCustom().filter((x) => x !== b.dataset.w));
    wordsList(true);
  });
}

function wordPage(raw) {
  const word = clean(decodeURIComponent(raw));
  const text = styled(word);
  const lay = layoutText(text);
  if (!lay.steps.length) return (location.hash = '#/words');
  const emoji = (DEFAULT_WORDS.find(([w]) => w.toLowerCase() === word.toLowerCase()) || [])[1] || '';
  const order = [...getCustom(), ...DEFAULT_WORDS.map(([w]) => w)];
  const pos = order.findIndex((w) => w.toLowerCase() === word.toLowerCase());
  const nextWord = order[(pos + 1) % order.length];
  const prevWord = order[(pos - 1 + order.length) % order.length];
  const letters = [...text];
  traceScreen({
    back: '#/words', title: text,
    vbW: lay.vbW, vbH: lay.vbH, steps: lay.steps, backdrop: lay.backdrop, mode: 'write',
    headerExtra: `<a class="btn round" href="#/word/${encodeURIComponent(prevWord)}" aria-label="Previous word">◀</a><a class="btn round" href="#/word/${encodeURIComponent(nextWord)}" aria-label="Next word">▶</a>`,
    panelTop: `<div class="word-card" id="wordcard">${letters.map((l, k) => `<span data-k="${k}">${esc(l)}</span>`).join('')}${emoji ? `<em>${emoji}</em>` : ''}</div>`,
    sayFor(k, step) {
      const spans = app.querySelectorAll('#wordcard span');
      let li = 0; let n = -1;
      letters.forEach((l, pos) => { if (l !== ' ') { n++; if (n === step.letterIndex) li = pos; } });
      spans.forEach((sp, pos) => sp.classList.toggle('now', pos === li));
      const info = charInfo(step.letter);
      if (step.first) {
        const what = /[A-Z]/.test(step.letter) ? 'capital' : 'small';
        return {
          say: `Write ${info.name}.`,
          html: `Write the ${/[0-9]/.test(step.letter) ? 'number' : what + ' letter'} <b class="g">${esc(step.letter)}</b>`,
          speak: `${info.name}. Start at the green dot.`,
        };
      }
      return { say: `Keep going! Line ${step.strokeIndex + 1}.`, html: `Keep going! Line <b>${step.strokeIndex + 1}</b>` };
    },
    winHtml() {
      return `
        <div class="win-card">
          <div class="win-emoji">${emoji || '🎉'}</div>
          <h3>You wrote ${esc(text)}!</h3>
          <div class="win-actions">
            <a class="btn big-btn next" href="#/word/${encodeURIComponent(nextWord)}">➡ Next word: ${esc(styled(nextWord))}</a>
            <button class="btn big-btn" data-act="save">💾 Save picture</button>
            <button class="btn big-btn alt" data-act="again">🔁 Again</button>
            <a class="btn big-btn alt" href="#/words">📝 All words</a>
          </div>
        </div>`;
    },
    winSay: `You wrote ${text}! Great job!`,
    onWin: () => markDone('word', word.toLowerCase()),
  });
}

const ctx = { app, $, esc, topBar, wireSound, drawingThumb, starsBadge, confetti };
const reader = createReader(ctx);
const games = createGames(ctx);
const colour = createColour(ctx);
const mixup = createMixup(ctx);
const stickers = createStickers(ctx);
const grownups = createGrownups(ctx);
const leave = (fn) => (...a) => { tracer?.destroy(); tracer = null; fn(...a); };

// ============================================================ router
const routes = [
  [/^#?\/?$/, home],
  [/^#\/draw$/, drawList],
  [/^#\/draw\/([\w-]+)$/, drawPage],
  [/^#\/letters(?:\/(caps|smalls|nums))?$/, lettersList],
  [/^#\/letter\/(caps|smalls|nums)\/(.+)$/, (set, ch) => letterPage(set, decodeURIComponent(ch))],
  [/^#\/words$/, () => wordsList(false)],
  [/^#\/word\/(.+)$/, wordPage],
  [/^#\/stories$/, () => { tracer?.destroy(); tracer = null; reader.storiesList(); }],
  [/^#\/story\/([\w-]+)\/(\d+)$/, (id, n) => { tracer?.destroy(); tracer = null; reader.storyPage(id, +n); }],
  [/^#\/story\/([\w-]+)$/, (id) => { tracer?.destroy(); tracer = null; reader.storyPage(id, 0); }],
  [/^#\/tricky$/, () => { tracer?.destroy(); tracer = null; reader.trickyList(); }],
  [/^#\/who$/, leave(() => grownups.who())],
  [/^#\/grownups$/, leave(() => grownups.gate())],
  [/^#\/games$/, leave(() => games.hub())],
  [/^#\/game\/(match|hunt|build)$/, leave((g) => games[g]())],
  [/^#\/count$/, leave(() => colour.countPage())],
  [/^#\/colour$/, leave(() => colour.colourList())],
  [/^#\/colour\/([\w-]+)$/, leave((id) => colour.colourPage(id))],
  [/^#\/mixup$/, leave(() => mixup.mixupPage())],
  [/^#\/stickers$/, leave(() => stickers.shop())],
  [/^#\/stickers\/book$/, leave(() => stickers.book())],
];

function route() {
  stopSpeaking();
  document.querySelectorAll('.confetti').forEach((c) => c.remove());
  const h = location.hash || '#/';
  // everyone needs a player profile first
  if (!profiles.current()) {
    const first = profiles.list()[0];
    if (first) profiles.setCurrent(first.id);
    else if (!h.startsWith('#/who')) { location.hash = '#/who'; return; }
  }
  for (const [re, fn] of routes) {
    const m = h.match(re);
    if (m) { fn(...m.slice(1)); return; }
  }
  location.hash = '#/';
}
window.addEventListener('hashchange', route);
route();

// offline support: save the app on this device
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
