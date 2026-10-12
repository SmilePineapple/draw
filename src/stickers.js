// Sticker book: spend stars in the shop, then stick your stickers on a scene.
import { DRAWINGS, GROUPS, drawingById } from './drawings.js';
import { ding, cheer, speak } from './sound.js';
import { store, stars, spendStars } from './store.js';
import { fitBox } from './util.js';

const EMOJI = ['🌈', '🦄', '🍕', '⚽', '🎸', '🚀', '🦖', '🐙', '🍦', '🎈', '🌟', '🏰', '🚂', '🚁', '🍩', '🐝', '🦋', '🌻', '🍉', '🎂', '🛸', '🐳', '🦁', '🐸'];
const SHOP = [
  ...GROUPS.map((g) => ({ name: `${g.emoji} ${g.name}`, color: g.color, items: DRAWINGS.filter((d) => d.group === g.id).map((d) => ({ id: `d:${d.id}`, price: 3 })) })),
  { name: '✨ Fun stickers', color: '#7a3fd1', items: EMOJI.map((e) => ({ id: `e:${e}`, price: 1 })) },
].filter((s) => s.items.length);

const BGS = [
  ['sky', 'linear-gradient(#bfe4ff, #e8f7ff 60%, #b8e8a0 60%, #8fd37a)', '🌤️'],
  ['night', 'linear-gradient(#1f2447, #5a3fa8)', '🌙'],
  ['sunset', 'linear-gradient(#ffd59e, #ff8fa3 60%, #7a3fd1)', '🌅'],
  ['plain', '#fffdf6', '⬜'],
];

export function createStickers({ app, $, esc, topBar, wireSound, drawingThumb, starsBadge, confetti }) {
  const owned = () => store.get('stickers', []);
  let stopFit = () => {};

  const artOf = (id) => (id.startsWith('d:') ? drawingThumb(drawingById(id.slice(2))) : `<span class="emo">${id.slice(2)}</span>`);
  const nameOf = (id) => (id.startsWith('d:') ? drawingById(id.slice(2))?.title : 'Fun sticker');

  // ------------------------------------------------------------ shop
  function shop() {
    stopFit();
    const have = new Set(owned());
    app.innerHTML = `
      <div class="screen list">
        ${topBar({ back: '#/', title: 'Sticker Book', right: starsBadge() })}
        <nav class="tabs"><a class="tab on" href="#/stickers">🛍️ Shop</a><a class="tab" href="#/stickers/book">📒 My book (${have.size})</a></nav>
        <main class="scroll">
          ${SHOP.map((sec) => `
            <section class="group" style="--gc:${sec.color};--gb:#fff8">
              <h3>${esc(sec.name)}</h3>
              <div class="cards stickers">
                ${sec.items.map((it) => `
                  <button class="card sticker ${have.has(it.id) ? 'own' : stars() >= it.price ? 'can' : 'cant'}" data-id="${esc(it.id)}">
                    <div class="thumb">${artOf(it.id)}</div>
                    <span class="price">${have.has(it.id) ? '✔ Mine' : `${it.price} ⭐`}</span>
                  </button>`).join('')}
              </div>
            </section>`).join('')}
        </main>
        <div class="sheet" id="sheet" hidden></div>
      </div>`;
    wireSound();
    app.querySelectorAll('.sticker').forEach((b) => b.addEventListener('click', () => openBuy(b.dataset.id)));
  }

  function openBuy(id) {
    const it = SHOP.flatMap((s) => s.items).find((x) => x.id === id);
    const have = owned().includes(id);
    const sheet = $('#sheet');
    const can = stars() >= it.price;
    sheet.hidden = false;
    sheet.innerHTML = `
      <div class="sheet-card">
        <button class="sheet-x btn round" aria-label="Close">✕</button>
        <div class="buy-art">${artOf(id)}</div>
        <h3>${esc(nameOf(id) || '')}</h3>
        ${have ? '<p class="buy-note">You already have this one! 🎉</p>'
          : can ? `<button class="btn big-btn" id="buy">Get it for ${it.price} ⭐</button>`
          : `<p class="buy-note">You need ${it.price - stars()} more ⭐<br>Draw, write or play a game to earn stars!</p>`}
      </div>`;
    sheet.onclick = (e) => {
      if (e.target === sheet || e.target.closest('.sheet-x')) { sheet.hidden = true; return; }
      if (e.target.closest('#buy')) {
        if (!spendStars(it.price)) return;
        store.set('stickers', [...owned(), id]);
        cheer(); confetti();
        speak('You got a new sticker!');
        sheet.hidden = true;
        shop();
      }
    };
    if (!have && !can) speak('You need more stars!');
  }

  // ------------------------------------------------------------ book (sticker board)
  function book() {
    stopFit();
    const mine = owned();
    const board = store.get('board', { bg: 'sky', items: [] });
    let selected = -1;
    app.innerHTML = `
      <div class="screen trace book">
        ${topBar({ back: '#/', title: 'Sticker Book', right: starsBadge() })}
        <nav class="tabs"><a class="tab" href="#/stickers">🛍️ Shop</a><a class="tab on" href="#/stickers/book">📒 My book (${mine.length})</a></nav>
        <main class="book-main">
          <div class="stage-host" id="host"><div class="board" id="board"></div></div>
          <div class="book-side">
            <div class="book-tools">
              ${BGS.map(([k, , e]) => `<button class="btn round bgbtn ${board.bg === k ? 'sel' : ''}" data-bg="${k}" aria-label="${k} background">${e}</button>`).join('')}
              <button class="btn round" id="clear" aria-label="Clear board">🗑️</button>
            </div>
            <div class="book-sel" id="sel" hidden>
              <button class="btn round" data-op="smaller" aria-label="Smaller">➖</button>
              <button class="btn round" data-op="bigger" aria-label="Bigger">➕</button>
              <button class="btn round" data-op="flip" aria-label="Flip">↔️</button>
              <button class="btn round" data-op="del" aria-label="Remove">❌</button>
            </div>
            <div class="tray" id="tray">
              ${mine.length ? mine.map((id) => `<button class="tray-item" data-id="${esc(id)}">${artOf(id)}</button>`).join('') : '<p class="buy-note">No stickers yet! Visit the 🛍️ Shop and spend your stars.</p>'}
            </div>
          </div>
        </main>
      </div>`;
    wireSound();
    const boardEl = $('#board');
    stopFit = fitBox($('#host'), boardEl, 4 / 3);
    const save = () => store.set('board', board);

    function paint() {
      boardEl.style.background = BGS.find((b) => b[0] === board.bg)?.[1] || '#fff';
      boardEl.innerHTML = board.items.map((it, i) => `
        <div class="placed ${i === selected ? 'sel' : ''}" data-i="${i}" style="left:${it.x}%;top:${it.y}%;width:${it.s}%;transform:translate(-50%,-50%) scaleX(${it.f ? -1 : 1})">${artOf(it.id)}</div>`).join('');
      $('#sel').hidden = selected < 0;
    }
    paint();

    let drag = null;
    boardEl.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.placed');
      if (!el) { selected = -1; paint(); return; }
      e.preventDefault();
      selected = +el.dataset.i;
      const it = board.items[selected];
      board.items.push(board.items.splice(selected, 1)[0]); // bring to front
      selected = board.items.length - 1;
      paint();
      const el2 = boardEl.querySelector(`.placed[data-i="${selected}"]`);
      el2.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, it, ox: e.clientX, oy: e.clientY, sx: it.x, sy: it.y, el: el2 };
    });
    boardEl.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const r = boardEl.getBoundingClientRect();
      drag.it.x = Math.max(3, Math.min(97, drag.sx + ((e.clientX - drag.ox) / r.width) * 100));
      drag.it.y = Math.max(3, Math.min(97, drag.sy + ((e.clientY - drag.oy) / r.height) * 100));
      drag.el.style.left = `${drag.it.x}%`;
      drag.el.style.top = `${drag.it.y}%`;
    });
    const up = (e) => { if (drag && e.pointerId === drag.id) { drag = null; save(); } };
    boardEl.addEventListener('pointerup', up);
    boardEl.addEventListener('pointercancel', up);

    $('#tray').addEventListener('click', (e) => {
      const b = e.target.closest('.tray-item');
      if (!b) return;
      board.items.push({ id: b.dataset.id, x: 30 + Math.random() * 40, y: 35 + Math.random() * 30, s: 22, f: false });
      selected = board.items.length - 1;
      ding(); save(); paint();
    });
    $('#sel').addEventListener('click', (e) => {
      const op = e.target.closest('[data-op]')?.dataset.op;
      const it = board.items[selected];
      if (!op || !it) return;
      if (op === 'bigger') it.s = Math.min(70, it.s * 1.2);
      if (op === 'smaller') it.s = Math.max(8, it.s / 1.2);
      if (op === 'flip') it.f = !it.f;
      if (op === 'del') { board.items.splice(selected, 1); selected = -1; }
      save(); paint();
    });
    app.querySelectorAll('.bgbtn').forEach((b) => b.addEventListener('click', () => {
      board.bg = b.dataset.bg; save();
      app.querySelectorAll('.bgbtn').forEach((x) => x.classList.toggle('sel', x === b));
      paint();
    }));
    $('#clear').addEventListener('click', () => { if (confirm('Take all the stickers off the page?')) { board.items = []; selected = -1; save(); paint(); } });
  }

  return { shop, book };
}
