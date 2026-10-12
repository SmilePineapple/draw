// Silly Mix-up: swap the top, middle and bottom of any character's face.
import { drawingById } from './drawings.js';
import { speak, ding, cheer } from './sound.js';
import { addStar, markDone } from './store.js';
import { pick, savePng, svgToPng } from './util.js';

const HEADS = ['bluey', 'bingo', 'bandit', 'chilli', 'muffin', 'socks', 'hulk', 'spidey', 'ironman', 'vader', 'trooper', 'yoda',
  'catboy', 'owlette', 'gekko', 'luna', 'ninja', 'cat', 'dog', 'pig', 'rabbit', 'penguin', 'chewie', 'grogu', 'boba',
  'panther', 'thor', 'captain', 'groot'].filter((id) => drawingById(id));

// [y0, y1] slices of the 400x400 drawing box
const BANDS = [[20, 170], [170, 265], [265, 392]];
const W = 400;

const firstName = (d) => d.title.split(' ').slice(-1)[0];

export function createMixup({ app, $, esc, topBar, wireSound, drawingThumb, starsBadge, confetti }) {
  const inner = (id) => drawingThumb(drawingById(id)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

  function mixupPage() {
    const sel = [pick(HEADS), pick(HEADS), pick(HEADS)];
    let starred = false;
    app.innerHTML = `
      <div class="screen mixup">
        ${topBar({ back: '#/games', title: 'Silly Mix-up', right: starsBadge() })}
        <main class="mix-main">
          <div class="mix-rows" id="rows">
            ${BANDS.map(([y0, y1], b) => `
              <div class="mix-row">
                <button class="btn round" data-b="${b}" data-d="-1" aria-label="Previous">◀</button>
                <div class="mix-band" style="aspect-ratio:${W}/${y1 - y0}"><svg viewBox="0 ${y0} ${W} ${y1 - y0}" id="band${b}"></svg></div>
                <button class="btn round" data-b="${b}" data-d="1" aria-label="Next">▶</button>
              </div>`).join('')}
          </div>
          <div class="mix-ctl">
            <div class="mix-name" id="mname"></div>
            <div class="mix-btns">
              <button class="btn big-btn" id="rand">🎲 Surprise me!</button>
              <button class="btn big-btn alt" id="say">🔊 Say it</button>
              <button class="btn big-btn alt" id="save">💾 Save</button>
            </div>
            <p class="hint">Tap the arrows to change the top, the eyes and the mouth!</p>
          </div>
        </main>
      </div>`;
    wireSound();

    const name = () => sel.map((id) => firstName(drawingById(id))).join(' ');
    function paint(speakIt = false) {
      sel.forEach((id, b) => { $(`#band${b}`).innerHTML = inner(id); });
      $('#mname').textContent = name();
      if (speakIt) speak(`It's a ${name()}!`);
    }
    paint(false);

    $('#rows').addEventListener('click', (e) => {
      const b = e.target.closest('[data-b]');
      if (!b) return;
      const band = +b.dataset.b;
      const idx = HEADS.indexOf(sel[band]);
      sel[band] = HEADS[(idx + +b.dataset.d + HEADS.length) % HEADS.length];
      ding();
      paint(false);
    });
    $('#rand').onclick = () => { for (let i = 0; i < 3; i++) sel[i] = pick(HEADS); cheer(); paint(true); };
    $('#say').onclick = () => speak(`It's a ${name()}!`);
    $('#save').onclick = async () => {
      const h = BANDS.reduce((a, [y0, y1]) => a + (y1 - y0), 0);
      let y = 0;
      const parts = BANDS.map(([y0, y1], b) => {
        const part = `<svg x="0" y="${y}" width="${W}" height="${y1 - y0}" viewBox="0 ${y0} ${W} ${y1 - y0}">${inner(sel[b])}</svg>`;
        y += y1 - y0;
        return part;
      }).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="1200" height="${Math.round(1200 * h / W)}">${parts}</svg>`;
      await savePng(await svgToPng(svg, 1200, Math.round(1200 * h / W)), `silly-${name().replace(/\s+/g, '-').toLowerCase()}`);
      if (!starred) { starred = true; addStar(1); markDone('mixup', name()); confetti(); }
    };
  }

  return { mixupPage };
}
