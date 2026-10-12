// Games hub + three reading games: Picture Match, Word Hunt, Word Builder (letter tiles).
import { drawingById } from './drawings.js';
import { STORIES, WORD_PICS } from './stories.js';
import { speak, ding, oops, cheer, stopSpeaking } from './sound.js';
import { addStar, store, logActivity } from './store.js';
import { shuffle, pick, sample } from './util.js';

// word -> drawing id (pictures we can show)
const PICS = [
  ['cat', 'cat'], ['dog', 'dog'], ['pig', 'pig'], ['fish', 'fish'], ['bird', 'bird'], ['star', 'star'], ['sun', 'sun'],
  ['tree', 'tree'], ['house', 'house'], ['car', 'car'], ['apple', 'apple'], ['heart', 'heart'], ['rocket', 'rocket'],
  ['flower', 'flower'], ['turtle', 'turtle'], ['bunny', 'rabbit'], ['penguin', 'penguin'], ['balloon', 'balloon'],
  ['hulk', 'hulk'], ['yoda', 'yoda'], ['bluey', 'bluey'], ['bingo', 'bingo'], ['vader', 'vader'], ['catboy', 'catboy'],
  ['gekko', 'gekko'], ['owlette', 'owlette'], ['groot', 'groot'], ['thor', 'thor'], ['grogu', 'grogu'], ['sword', 'lightsaber'],
].filter(([, id]) => drawingById(id));

const STOP = new Set('the and was were his her she him they them that this with had has have for are you not but all out day one then what when from there their said went into just very over some would could back more'.split(' '));

const styled = (w) => {
  const l = w.toLowerCase();
  const style = store.get('case', 'Abc');
  return style === 'ABC' ? l.toUpperCase() : style === 'abc' ? l : l.charAt(0).toUpperCase() + l.slice(1);
};
const tileCase = (ch) => (store.get('case', 'Abc') === 'ABC' ? ch.toUpperCase() : ch.toLowerCase());

export function createGames({ app, $, esc, topBar, wireSound, drawingThumb, starsBadge, confetti }) {
  const art = (id) => drawingThumb(drawingById(id));

  // ------------------------------------------------------------------ hub
  function hub() {
    const tiles = [
      ['#/game/match', '🖼️', 'Picture Match', 'Match words to pictures', '#e53935'],
      ['#/game/hunt', '🔎', 'Word Hunt', 'Find the word in a story', '#1e6fe0'],
      ['#/game/build', '🔤', 'Word Builder', 'Make words with letter tiles', '#7a3fd1'],
      ['#/count', '🔢', 'Count & Colour', 'Count them, then colour them', '#f08a24'],
      ['#/colour', '🖍️', 'Colouring Book', 'Colour in your heroes', '#18a35a'],
      ['#/mixup', '🤪', 'Silly Mix-up', 'Mix heads, eyes and mouths', '#d6336c'],
    ];
    app.innerHTML = `
      <div class="screen list">
        ${topBar({ back: '#/', title: 'Games', right: starsBadge() })}
        <main class="scroll">
          <div class="cards hubs">
            ${tiles.map(([href, e, t, s, c]) => `<a class="card hub" href="${href}" style="--hc:${c}"><span class="hub-e">${e}</span><b>${t}</b><small>${s}</small></a>`).join('')}
          </div>
        </main>
      </div>`;
    wireSound();
  }

  // ------------------------------------------------------------------ round shell
  function run({ id, title, total, round }) {
    app.innerHTML = `
      <div class="screen game">
        ${topBar({ back: '#/games', title, right: starsBadge() })}
        <main class="game-main"><div class="dots" id="gd"></div><div id="gbody" class="gbody"></div></main>
      </div>`;
    wireSound();
    const dots = $('#gd');
    dots.innerHTML = Array.from({ length: total }, () => '<i></i>').join('');
    let firstTry = 0;
    let i = 0;
    const next = () => {
      [...dots.children].forEach((d, k) => { d.classList.toggle('done', k < i); d.classList.toggle('now', k === i); });
      if (i >= total) return finish();
      round(i, (ok) => { if (ok) firstTry++; i++; setTimeout(next, 1100); });
    };
    function finish() {
      const bonus = firstTry >= total - 1;
      addStar(bonus ? 2 : 1);
      logActivity('game', id, { score: firstTry, of: total });
      confetti();
      $('#gbody').innerHTML = `
        <div class="win-card gwin">
          <div class="win-emoji">${bonus ? '🏆' : '🎉'}</div>
          <h3>${firstTry} out of ${total} first time!</h3>
          <p>${bonus ? 'Wow! You earned 2 stars!' : 'Great playing! You earned a star!'}</p>
          <div class="win-actions">
            <a class="btn big-btn next" href="#/game/${id}" id="again">🔁 Play again</a>
            <a class="btn big-btn alt" href="#/games">🎮 All games</a>
          </div>
        </div>`;
      $('#again').addEventListener('click', (e) => { e.preventDefault(); stopSpeaking(); games[id](); });
      speak(`${firstTry} out of ${total}! ${bonus ? 'Amazing!' : 'Well done!'}`);
    }
    next();
  }

  // ------------------------------------------------------------------ 1. picture match
  function match() {
    const targets = sample(PICS, 6);
    run({
      id: 'match', title: 'Picture Match', total: targets.length,
      round(i, done) {
        const [word, id] = targets[i];
        const p2w = i % 2 === 0;
        const others = sample(PICS.filter(([w]) => w !== word), 2);
        const opts = shuffle([[word, id], ...others]);
        let missed = false;
        const body = $('#gbody');
        body.innerHTML = p2w
          ? `<div class="g-prompt">Which word matches the picture?</div>
             <div class="g-pic">${art(id)}</div>
             <div class="g-opts">${opts.map(([w]) => `<button class="btn g-opt word" data-w="${w}">${esc(styled(w))}</button>`).join('')}</div>`
          : `<div class="g-prompt">Which picture is this word?</div>
             <div class="g-word"><span>${esc(styled(word))}</span><button class="btn round" id="hear" aria-label="Hear it">🔊</button></div>
             <div class="g-opts pics">${opts.map(([w, pid]) => `<button class="btn g-opt pic" data-w="${w}">${art(pid)}</button>`).join('')}</div>`;
        speak(p2w ? 'Which word matches the picture?' : 'Which picture is this word?');
        $('#hear')?.addEventListener('click', () => speak(word));
        body.querySelector('.g-opts').addEventListener('click', (e) => {
          const b = e.target.closest('.g-opt');
          if (!b || b.disabled) return;
          if (b.dataset.w === word) {
            body.querySelectorAll('.g-opt').forEach((x) => { x.disabled = true; });
            b.classList.add('right');
            ding();
            speak(word);
            done(!missed);
          } else {
            missed = true;
            b.disabled = true;
            b.classList.add('wrong');
            oops();
            speak(p2w ? `That says ${b.dataset.w}. Try again!` : `That is a ${b.dataset.w}. Try again!`);
          }
        });
      },
    });
  }

  // ------------------------------------------------------------------ 2. word hunt
  function huntRounds() {
    const rounds = [];
    const stories = shuffle(STORIES);
    for (const s of stories) {
      if (rounds.length >= 5) break;
      const pages = shuffle(s.pages);
      for (const page of pages) {
        const words = [...page.text.matchAll(/[A-Za-z]+/g)].map((m) => m[0].toLowerCase());
        const cands = [...new Set(words.filter((w) => w.length >= 3 && w.length <= 8 && !STOP.has(w)))];
        const withPic = cands.filter((w) => WORD_PICS[w]);
        const target = pick(withPic.length ? withPic : cands);
        if (target) { rounds.push({ story: s, page, target }); break; }
      }
    }
    return rounds;
  }
  function hunt() {
    const rounds = huntRounds();
    run({
      id: 'hunt', title: 'Word Hunt', total: rounds.length,
      round(i, done) {
        const { page, target } = rounds[i];
        const textHtml = page.text.split(/(\s+)/).filter(Boolean).map((chunk) => {
          if (/^\s+$/.test(chunk)) return ' ';
          let inner = ''; let last = 0;
          for (const m of chunk.matchAll(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)) {
            inner += esc(chunk.slice(last, m.index));
            inner += `<span class="w" data-w="${esc(m[0].replace(/['’]s$/i, '').toLowerCase())}">${esc(m[0])}</span>`;
            last = m.index + m[0].length;
          }
          return `<span class="nb">${inner}${esc(chunk.slice(last))}</span>`;
        }).join('');
        let missed = false;
        const body = $('#gbody');
        body.innerHTML = `
          <div class="g-word hunt"><span>🔎 Find: <b>${esc(styled(target))}</b> ${WORD_PICS[target] || ''}</span><button class="btn round" id="hear" aria-label="Hear it">🔊</button></div>
          <div class="hunt-scene">${(page.art || []).map((a) => `<div class="actor">${art(a)}</div>`).join('')}</div>
          <p class="story-text hunt-text" id="ht">${textHtml}</p>`;
        speak(`Can you find the word ${target}?`);
        $('#hear').addEventListener('click', () => speak(`Find the word ${target}`));
        let found = false;
        $('#ht').addEventListener('click', (e) => {
          const w = e.target.closest('.w');
          if (!w || found) return;
          if (w.dataset.w === target) {
            found = true;
            w.classList.add('found');
            ding(); speak(`Yes! ${target}!`);
            done(!missed);
          } else {
            missed = true;
            w.classList.add('miss');
            oops();
            speak(`That says ${w.dataset.w}. Keep looking!`);
          }
        });
      },
    });
  }

  // ------------------------------------------------------------------ 3. word builder
  function build() {
    const targets = sample(PICS.filter(([w]) => w.length >= 3 && w.length <= 6), 5);
    run({
      id: 'build', title: 'Word Builder', total: targets.length,
      round(i, done) {
        const [word, id] = targets[i];
        const letters = [...word];
        const extra = sample([...'abcdefghijklmnopqrstuvwxyz'].filter((c) => !letters.includes(c)), 2);
        const tiles = shuffle([...letters, ...extra].map((ch, k) => ({ ch, k })));
        let pos = 0;
        let missed = false;
        const body = $('#gbody');
        body.innerHTML = `
          <div class="g-prompt">Build the word!</div>
          <div class="g-pic small">${art(id)}</div>
          <div class="slots" id="slots">${letters.map(() => '<span class="slot"></span>').join('')}</div>
          <div class="tiles" id="tiles">${tiles.map((t) => `<button class="tile-btn" data-k="${t.k}" data-ch="${t.ch}">${esc(tileCase(t.ch))}</button>`).join('')}</div>
          <button class="btn" id="hint">💡 Help me</button>`;
        speak(`Build the word ${word}`);
        const slots = [...body.querySelectorAll('.slot')];
        $('#hint').addEventListener('click', () => {
          speak(word);
          const want = body.querySelector(`.tile-btn:not(.used)[data-ch="${letters[pos]}"]`);
          want?.classList.add('hintme');
          missed = true;
        });
        $('#tiles').addEventListener('click', (e) => {
          const b = e.target.closest('.tile-btn');
          if (!b || b.classList.contains('used') || pos >= letters.length) return;
          if (b.dataset.ch === letters[pos]) {
            b.classList.add('used');
            b.classList.remove('hintme');
            slots[pos].textContent = tileCase(b.dataset.ch);
            slots[pos].classList.add('filled');
            speak(b.dataset.ch, { rate: 0.8 });
            pos++;
            if (pos === letters.length) {
              cheer();
              setTimeout(() => speak(word), 450);
              done(!missed);
            } else ding();
          } else {
            missed = true;
            oops();
            b.classList.add('shake');
            setTimeout(() => b.classList.remove('shake'), 400);
            speak(`Not ${b.dataset.ch}. Try again!`);
          }
        });
      },
    });
  }

  const games = { match, hunt, build };
  return { hub, ...games };
}
