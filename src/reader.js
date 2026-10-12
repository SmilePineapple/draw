// Reading section: story list, story pages with read-aloud + tap-a-word help, and "my tricky words".
import { STORIES, storyById, WORD_PICS, syllables } from './stories.js';
import { drawingById } from './drawings.js';
import { GLYPHS } from './glyphs.js';
import { speak, speakSync, speakSeq, stopSpeaking, prefs, setSound } from './sound.js';
import { store, addStar, markDone, isDone } from './store.js';
import { P } from './phrases.js';

const WORD_RE = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;

/** Split a sentence into tappable words and plain punctuation. */
function tokenize(text) {
  const out = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(WORD_RE)) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    out.push({ w: m[0], i: n++, start: m.index });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

const baseWord = (w) => w.replace(/['’]s$/i, '');
const canWrite = (w) => /^[A-Za-z]{1,12}$/.test(w) && [...w].every((c) => GLYPHS[c]);

export function createReader({ app, $, esc, topBar, wireSound, drawingThumb, starsBadge, confetti }) {
  let autoplay = false;

  // ---------------------------------------------------------- tricky words store
  const getTricky = () => store.get('tricky', {});
  function rememberWord(w) {
    const key = baseWord(w).toLowerCase();
    if (!/[a-z]/.test(key)) return;
    const t = getTricky();
    t[key] = (t[key] || 0) + 1;
    store.set('tricky', t);
  }

  // ---------------------------------------------------------- word help sheet
  function openSheet(rawWord) {
    const word = baseWord(rawWord);
    const sheet = $('#sheet');
    const parts = syllables(word.replace(/[^A-Za-z0-9-]/g, ''));
    const pic = WORD_PICS[word.toLowerCase()] || '';
    sheet.hidden = false;
    sheet.innerHTML = `
      <div class="sheet-card">
        <button class="sheet-x btn round" aria-label="Close">✕</button>
        ${pic ? `<div class="sheet-pic">${pic}</div>` : ''}
        <div class="sheet-word" id="sw">${parts.map((p, i) => `<span class="syl" data-i="${i}">${esc(p)}</span>`).join('')}</div>
        <div class="sheet-btns">
          <button class="btn big-btn" data-a="say">🔊 Say it</button>
          <button class="btn big-btn alt" data-a="slow">🐢 Slowly</button>
          <button class="btn big-btn alt" data-a="out">🔤 Sound it out</button>
          ${canWrite(word) ? `<a class="btn big-btn next" href="#/word/${encodeURIComponent(word)}">✏️ Write it</a>` : ''}
        </div>
      </div>`;
    const sylEls = [...sheet.querySelectorAll('.syl')];
    const lit = (i) => sylEls.forEach((el, k) => el.classList.toggle('on', k === i));
    const say = () => speak(word, { rate: 0.8 });
    sheet.onclick = (e) => {
      if (e.target === sheet || e.target.closest('.sheet-x')) { sheet.hidden = true; stopSpeaking(); return; }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'say') say();
      if (a === 'slow') speak(word, { rate: 0.45, pitch: 1.05 });
      if (a === 'out') {
        if (!prefs.sound) setSound(true);
        speakSeq(parts.length > 1 ? parts : [word], { rate: 0.5, gap: 380, onEach: lit, onEnd: () => { lit(-1); speak(word, { rate: 0.8 }); } });
      }
    };
    say();
  }

  function wireWords(root) {
    root.addEventListener('click', (e) => {
      const el = e.target.closest('.w');
      if (!el) return;
      stopAuto();
      root.querySelectorAll('.w.tap').forEach((x) => x.classList.remove('tap'));
      el.classList.add('tap');
      rememberWord(el.dataset.w);
      openSheet(el.dataset.w);
    });
  }

  // ---------------------------------------------------------- list screens
  function storiesList() {
    const tricky = Object.keys(getTricky()).length;
    app.innerHTML = `
      <div class="screen list">
        ${topBar({ back: '#/', title: 'Stories', right: starsBadge() })}
        <main class="scroll">
          <div class="cards stories">
            ${STORIES.map((s) => `
              <a class="card story-card-tile" href="#/story/${s.id}/0" style="--b1:${s.bg[0]};--b2:${s.bg[1]}">
                <div class="cover">${s.cover.slice(0, 3).map((id) => `<div>${drawingThumb(drawingById(id))}</div>`).join('')}</div>
                <b>${esc(s.title)}</b>
                <small>${s.pages.length} pages</small>
                ${isDone('story', s.id) ? '<i class="badge">⭐</i>' : ''}
              </a>`).join('')}
            <a class="card story-card-tile tricky-tile" href="#/tricky">
              <div class="cover big">📚</div>
              <b>My tricky words</b>
              <small>${tricky ? `${tricky} word${tricky === 1 ? '' : 's'}` : 'Tap words in stories'}</small>
            </a>
          </div>
        </main>
      </div>`;
    wireSound();
  }

  function trickyList() {
    const t = getTricky();
    const words = Object.keys(t).sort((a, b) => t[b] - t[a] || a.localeCompare(b));
    app.innerHTML = `
      <div class="screen list">
        ${topBar({ back: '#/stories', title: 'My tricky words', right: '' })}
        <main class="scroll">
          ${words.length ? `
            <p class="intro">Tap a word to hear it and sound it out.</p>
            <div class="cards words">
              ${words.map((w) => `<button class="card word tw" data-w="${esc(w)}"><span class="w2">${esc(w)}</span><span class="e">${WORD_PICS[w] || ''}</span></button>`).join('')}
            </div>
            <button class="link" id="clear">🗑️ Clear my list</button>`
          : '<p class="intro">No words yet! While you read a story, tap any word you find tricky and it will show up here.</p>'}
        </main>
        <div class="sheet" id="sheet" hidden></div>
      </div>`;
    wireSound();
    app.querySelectorAll('.tw').forEach((b) => b.addEventListener('click', () => openSheet(b.dataset.w)));
    $('#clear')?.addEventListener('click', () => { if (confirm('Clear all tricky words?')) { store.set('tricky', {}); trickyList(); } });
  }

  // ---------------------------------------------------------- story pages
  function sceneHtml(page, story) {
    const actors = (page.art || story.cover).map((id, i) => `<div class="actor" style="--d:${i * 0.35}s">${drawingThumb(drawingById(id))}</div>`).join('');
    return `
      <div class="scene n${(page.art || story.cover).length}" id="scene">
        ${page.props ? `<div class="prop">${page.props}</div>` : ''}
        <div class="actors">${actors}</div>
        ${page.sfx ? `<button class="sfx" id="sfx">${esc(page.sfx)}</button>` : ''}
      </div>`;
  }

  function stopAuto() {
    autoplay = false;
    stopSpeaking();
    document.querySelectorAll('.w.now').forEach((x) => x.classList.remove('now'));
    const rb = document.getElementById('read');
    if (rb) rb.innerHTML = '🔊 Read to me';
  }

  function storyPage(id, n) {
    const story = storyById(id);
    if (!story) { location.hash = '#/stories'; return; }
    const total = story.pages.length;
    n = Math.max(0, Math.min(total + 1, n | 0));
    const dark = story.dark ? 'dark' : '';
    const idx = STORIES.indexOf(story);
    const nextStory = STORIES[(idx + 1) % STORIES.length];
    const go = (k) => { location.hash = `#/story/${id}/${k}`; };

    // ---- cover
    if (n === 0) {
      app.innerHTML = `
        <div class="screen story ${dark}" style="--b1:${story.bg[0]};--b2:${story.bg[1]}">
          ${topBar({ back: '#/stories', title: '', right: '' })}
          <main class="story-main">
            <div class="scene n${story.cover.length}">
              <div class="actors">${story.cover.map((cid, i) => `<div class="actor" style="--d:${i * 0.35}s">${drawingThumb(drawingById(cid))}</div>`).join('')}</div>
            </div>
            <section class="story-card center">
              <h1 class="story-title">${esc(story.title)}</h1>
              <div class="story-ctl col">
                <button class="btn big-btn" id="auto">📖 Read it to me</button>
                <button class="btn big-btn alt" id="self">👀 I'll read it myself</button>
              </div>
            </section>
          </main>
        </div>`;
      wireSound();
      speak(story.title);
      $('#auto').onclick = () => { autoplay = true; go(1); };
      $('#self').onclick = () => { autoplay = false; go(1); };
      return;
    }

    // ---- the end
    if (n === total + 1) {
      app.innerHTML = `
        <div class="screen story ${dark}" style="--b1:${story.bg[0]};--b2:${story.bg[1]}">
          ${topBar({ back: '#/stories', title: '', right: starsBadge() })}
          <main class="story-main">
            <div class="scene n${story.cover.length}">
              <div class="prop">🎉</div>
              <div class="actors">${story.cover.map((cid, i) => `<div class="actor" style="--d:${i * 0.35}s">${drawingThumb(drawingById(cid))}</div>`).join('')}</div>
            </div>
            <section class="story-card center">
              <h1 class="story-title">The End!</h1>
              <div class="story-ctl col">
                <a class="btn big-btn next" href="#/story/${nextStory.id}/0">➡ ${esc(nextStory.title)}</a>
                <a class="btn big-btn alt" href="#/story/${id}/0">🔁 Read it again</a>
                <a class="btn big-btn alt" href="#/stories">📚 All stories</a>
              </div>
            </section>
          </main>
        </div>`;
      wireSound();
      addStar(1);
      markDone('story', id);
      confetti();
      speak(P.theEnd);
      return;
    }

    // ---- a story page
    const page = story.pages[n - 1];
    const tokens = tokenize(page.text);
    const starts = tokens.filter((t) => t.w).map((t) => t.start);
    // punctuation stays glued to its word so it never wraps onto a line by itself
    const textHtml = page.text.split(/(\s+)/).filter(Boolean).map((chunk) => {
      if (/^\s+$/.test(chunk)) return ' ';
      let inner = '';
      let last = 0;
      for (const m of chunk.matchAll(WORD_RE)) {
        inner += esc(chunk.slice(last, m.index));
        inner += `<span class="w" data-w="${esc(m[0])}">${esc(m[0])}</span>`;
        last = m.index + m[0].length;
      }
      return `<span class="nb">${inner}${esc(chunk.slice(last))}</span>`;
    }).join('');
    app.innerHTML = `
      <div class="screen story ${dark}" style="--b1:${story.bg[0]};--b2:${story.bg[1]}">
        ${topBar({ back: '#/stories', title: esc(story.title), right: '' })}
        <main class="story-main">
          ${sceneHtml(page, story)}
          <section class="story-card">
            <p class="story-text" id="text">${textHtml}</p>
            <div class="story-ctl">
              <a class="btn big-btn alt round-ish" id="prev" href="#/story/${id}/${n - 1}" aria-label="Previous page">◀</a>
              <button class="btn big-btn" id="read">🔊 Read to me</button>
              <a class="btn big-btn next round-ish" id="next" href="#/story/${id}/${n + 1}" aria-label="Next page">▶</a>
            </div>
            <div class="dots">${story.pages.map((_, k) => `<i class="${k + 1 < n ? 'done' : ''} ${k + 1 === n ? 'now' : ''}"></i>`).join('')}</div>
            <p class="hint">👆 Tap any word to hear it!</p>
          </section>
        </main>
        <div class="sheet" id="sheet" hidden></div>
      </div>`;
    wireSound();
    wireWords($('#text'));
    $('#prev').onclick = () => stopAuto();
    $('#next').onclick = () => stopAuto();

    const wordEls = [...app.querySelectorAll('#text .w')];
    const lit = (i) => wordEls.forEach((el, k) => el.classList.toggle('now', k === i));
    const readBtn = $('#read');
    let reading = false;

    function readPage() {
      if (!prefs.sound) setSound(true);
      reading = true;
      readBtn.innerHTML = '⏹ Stop';
      speakSync(page.text, {
        rate: 0.8, starts,
        onWord: lit,
        onEnd() {
          reading = false;
          lit(-1);
          readBtn.innerHTML = '🔊 Read to me';
          if (autoplay) setTimeout(() => { if (autoplay && location.hash.startsWith(`#/story/${id}/${n}`)) go(n + 1); }, 1100);
        },
      });
    }
    readBtn.onclick = () => {
      if (reading || autoplay) { stopAuto(); reading = false; readBtn.innerHTML = '🔊 Read to me'; return; }
      readPage();
    };
    $('#sfx')?.addEventListener('click', () => {
      stopAuto();
      const sc = $('#scene');
      sc.classList.remove('wobble'); void sc.offsetWidth; sc.classList.add('wobble');
      speak(page.sfx, { rate: 0.95, pitch: 1.5 + Math.random() * 0.4 });
    });

    if (autoplay) setTimeout(readPage, 500);
  }

  return { storiesList, storyPage, trickyList };
}
