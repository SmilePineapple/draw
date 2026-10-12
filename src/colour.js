// Colouring book (tap a shape to fill it) and Count & Colour pages.
import { DRAWINGS, drawingById } from './drawings.js';
import { speak, ding, oops, cheer } from './sound.js';
import { addStar, markDone, isDone } from './store.js';
import { fitBox, savePng, svgToPng, paletteHtml, wirePalette, pick, shuffle } from './util.js';

const STROKE = '#2b2b3a';

/** An uncoloured drawing: closed shapes are tappable and start white; lines sit on top. */
function colourSvg(d) {
  const layers = d.steps
    .map((s, i) => ({ s, z: s.z ?? i * 10 }))
    .sort((a, b) => a.z - b.z)
    .map(({ s }) => s.paths.map((p) => (s.fill
      ? `<path class="cshape" d="${p}" fill="#ffffff" stroke="${STROKE}" stroke-width="5" stroke-linejoin="round"/>`
      : `<path class="cline" pointer-events="none" d="${p}" fill="none" stroke="${STROKE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`)).join(''))
    .join('');
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">${layers}</svg>`;
}

// things that are fun to count (id -> plural)
export const COUNTABLES = [
  ['hulk', 'Hulks'], ['spidey', 'Spidey masks'], ['yoda', 'Yodas'], ['bluey', 'Blueys'], ['bingo', 'Bingos'],
  ['trooper', 'Stormtroopers'], ['catboy', 'Catboys'], ['owlette', 'Owlettes'], ['gekko', 'Gekkos'],
  ['cat', 'cats'], ['dog', 'puppies'], ['fish', 'fish'], ['bird', 'birds'], ['butterfly', 'butterflies'],
  ['turtle', 'turtles'], ['rabbit', 'bunnies'], ['penguin', 'penguins'], ['pig', 'piggies'], ['apple', 'apples'],
  ['star', 'stars'], ['heart', 'hearts'], ['sun', 'suns'], ['rocket', 'rockets'], ['icecream', 'ice creams'],
  ['balloon', 'balloons'], ['car', 'cars'], ['house', 'houses'], ['flower', 'flowers'], ['tree', 'trees'],
  ['bb8', 'BB-8s'], ['r2d2', 'R2-D2s'], ['grogu', 'Grogus'], ['groot', 'Groots'], ['muffin', 'Muffins'], ['shield', 'shields'],
].filter(([id]) => drawingById(id));

export function createColour({ app, $, esc, topBar, wireSound, drawingThumb, starsBadge, confetti }) {
  let stopFit = () => {};

  // ------------------------------------------------------------ colouring book
  function colourList() {
    stopFit();
    app.innerHTML = `
      <div class="screen list">
        ${topBar({ back: '#/games', title: 'Colouring Book', right: starsBadge() })}
        <main class="scroll">
          <div class="cards">
            ${DRAWINGS.map((d) => `
              <a class="card" href="#/colour/${d.id}">
                <div class="thumb">${colourSvg(d)}</div>
                <b>${esc(d.title)}</b>
              </a>`).join('')}
          </div>
        </main>
      </div>`;
    wireSound();
  }

  function colourPage(id) {
    const d = drawingById(id);
    if (!d) { location.hash = '#/colour'; return; }
    stopFit();
    const i = DRAWINGS.indexOf(d);
    const next = DRAWINGS[(i + 1) % DRAWINGS.length];
    app.innerHTML = `
      <div class="screen trace colour">
        ${topBar({ back: '#/colour', title: `Colour ${esc(d.title)}`, right: '' })}
        <main class="trace-main">
          <div class="stage-host" id="host"><div class="colour-stage" id="cs">${colourSvg(d)}</div></div>
          <aside class="panel">
            <p class="say">Pick a colour, then tap a shape!</p>
            <div class="palette" id="pal">${paletteHtml('#e53935')}</div>
            <div class="tools">
              <button class="btn tool" id="undo"><span>↩️</span>Undo</button>
              <button class="btn tool" id="clear"><span>🧽</span>Clear</button>
              <button class="btn tool" id="save"><span>💾</span>Save</button>
            </div>
            <a class="btn big-btn next" href="#/colour/${next.id}">➡ ${esc(next.title)}</a>
          </aside>
        </main>
      </div>`;
    wireSound();
    stopFit = fitBox($('#host'), $('#cs'), 1);
    let colour = '#e53935';
    const history = [];
    wirePalette($('#pal'), (c) => { colour = c; });
    $('#cs').addEventListener('click', (e) => {
      const el = e.target.closest('.cshape');
      if (!el) return;
      history.push([el, el.getAttribute('fill')]);
      el.setAttribute('fill', colour);
      ding();
    });
    $('#undo').onclick = () => { const h = history.pop(); if (h) h[0].setAttribute('fill', h[1]); };
    $('#clear').onclick = () => { $('#cs').querySelectorAll('.cshape').forEach((s) => s.setAttribute('fill', '#ffffff')); history.length = 0; };
    $('#save').onclick = async () => {
      const svg = $('#cs svg').cloneNode(true);
      svg.setAttribute('width', 1200); svg.setAttribute('height', 1200);
      await savePng(await svgToPng(new XMLSerializer().serializeToString(svg), 1200, 1200), `coloured-${d.id}`);
      if (!isDone('colour', d.id)) addStar(1);
      markDone('colour', d.id);
    };
  }

  // ------------------------------------------------------------ count & colour
  function countPage() {
    stopFit();
    const [id, plural] = pick(COUNTABLES);
    const d = drawingById(id);
    const n = 2 + Math.floor(Math.random() * 7); // 2..8
    const cols = n <= 4 ? n : Math.ceil(n / 2);
    app.innerHTML = `
      <div class="screen trace count">
        ${topBar({ back: '#/games', title: 'Count & Colour', right: starsBadge() })}
        <main class="trace-main">
          <div class="stage-host" id="host">
            <div class="count-grid" id="grid" style="--cols:${cols}">
              ${Array.from({ length: n }, (_, i) => `<div class="count-item" data-i="${i}">${colourSvg(d)}<i class="count-badge"></i></div>`).join('')}
            </div>
          </div>
          <aside class="panel">
            <div class="count-num" id="num">0</div>
            <p class="say" id="say"></p>
            <div class="answers" id="answers" hidden></div>
            <div class="palette" id="pal" hidden>${paletteHtml('#e53935')}</div>
            <button class="btn big-btn" id="done" hidden>✅ I'm finished!</button>
            <div class="win" id="win" hidden></div>
          </aside>
        </main>
      </div>`;
    wireSound();
    const say = $('#say');
    const grid = $('#grid');
    let phase = 'count';
    let counted = 0;
    let colour = '#e53935';
    const speakSay = (t) => { say.textContent = t; speak(t); };
    speakSay(`Tap each ${plural} to count them!`);

    grid.addEventListener('click', (e) => {
      const item = e.target.closest('.count-item');
      if (!item) return;
      if (phase === 'count') {
        if (item.classList.contains('counted')) return;
        item.classList.add('counted');
        counted++;
        item.querySelector('.count-badge').textContent = counted;
        $('#num').textContent = counted;
        ding();
        speak(String(counted), { rate: 0.9 });
        if (counted === n) setTimeout(askHowMany, 900);
      } else if (phase === 'colour') {
        const shape = e.target.closest('.cshape');
        if (shape) { shape.setAttribute('fill', colour); ding(); }
      }
    });

    function askHowMany() {
      phase = 'answer';
      const opts = new Set([n]);
      while (opts.size < 4) { const x = 1 + Math.floor(Math.random() * 9); if (x !== n) opts.add(x); }
      const box = $('#answers');
      box.hidden = false;
      box.innerHTML = shuffle([...opts]).map((x) => `<button class="btn ans" data-n="${x}">${x}</button>`).join('');
      speakSay(`How many ${plural} are there?`);
      box.onclick = (e) => {
        const b = e.target.closest('.ans');
        if (!b) return;
        if (+b.dataset.n === n) {
          box.hidden = true;
          cheer();
          speakSay(`Yes! ${n} ${plural}! Now colour them in!`);
          grid.querySelectorAll('.count-badge').forEach((x) => x.remove());
          phase = 'colour';
          $('#pal').hidden = false;
          $('#done').hidden = false;
        } else {
          oops();
          b.classList.add('wrong');
          speak(`That is ${b.dataset.n}. Let's count again!`);
          b.disabled = true;
        }
      };
    }

    wirePalette($('#pal'), (c) => { colour = c; });
    $('#done').onclick = () => {
      phase = 'finished';
      addStar(1);
      markDone('count', `${id}`);
      confetti();
      $('#pal').hidden = true; $('#done').hidden = true; say.hidden = true;
      const w = $('#win');
      w.hidden = false;
      w.innerHTML = `<div class="win-card"><div class="win-emoji">🎉</div><h3>You counted ${n} ${esc(plural)}!</h3>
        <div class="win-actions"><a class="btn big-btn next" href="#/count" id="again">➡ Count more</a><a class="btn big-btn alt" href="#/games">🎮 All games</a></div></div>`;
      w.querySelector('#again').addEventListener('click', (e) => { e.preventDefault(); countPage(); });
      speak(`Great counting and colouring!`);
    };
  }

  return { colourList, colourPage, countPage };
}
