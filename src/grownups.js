// Player profiles ("Who's playing?") and the grown-ups progress page (behind a small maths gate).
import { DRAWINGS, drawingById } from './drawings.js';
import { STORIES } from './stories.js';
import { CAPS, SMALLS, NUMS } from './glyphs.js';
import { profiles, storeOf, starsEarned, starsSpent, doneOf } from './store.js';
import { prefs, setSound, speak } from './sound.js';
import { voiceStatus, downloadVoices } from './offline.js';
import { P } from './phrases.js';

const AVATARS = ['bluey', 'bingo', 'spidey', 'hulk', 'yoda', 'catboy', 'owlette', 'gekko', 'grogu', 'chewie', 'penguin', 'cat', 'dog', 'rabbit', 'ironman', 'trooper']
  .filter((id) => drawingById(id));

let unlocked = false;

export function createGrownups({ app, $, esc, topBar, wireSound, drawingThumb, confetti }) {
  const avatarThumb = (id) => drawingThumb(drawingById(id) || drawingById('bluey'));

  // ------------------------------------------------------------ who's playing
  function who(forceAdd = false) {
    const list = profiles.list();
    app.innerHTML = `
      <div class="screen who">
        <header class="home-head"><div class="logo"><span>Who's</span> <span>playing?</span></div></header>
        <p class="hello who-hello">Tap your picture!</p>
        <main class="scroll">
          <div class="cards players">
            ${list.map((p) => `
              <button class="card player" data-id="${p.id}"><div class="thumb">${avatarThumb(p.avatar)}</div><b>${esc(p.name)}</b></button>`).join('')}
          </div>
        </main>
        <div class="sheet" id="sheet" hidden></div>
      </div>`;
    app.querySelectorAll('.player[data-id]').forEach((b) => b.addEventListener('click', () => {
      profiles.setCurrent(b.dataset.id);
      try { sessionStorage.setItem('picked', '1'); } catch { /* ignore */ }
      speak(P.hello);
      location.hash = '#/';
    }));
    if (!list.length || forceAdd) profileForm(null, !list.length);
  }

  function profileForm(existing = null, first = false) {
    const sheet = $('#sheet');
    let avatar = existing?.avatar || AVATARS[0];
    sheet.hidden = false;
    sheet.innerHTML = `
      <div class="sheet-card form">
        ${first ? '' : '<button class="sheet-x btn round" aria-label="Close">✕</button>'}
        <h3>${first ? '👋 Welcome! Let\'s add the first player' : existing ? 'Edit player' : 'New player'}</h3>
        <label class="field">Name <input id="pname" type="text" maxlength="14" autocomplete="off" value="${esc(existing?.name || '')}" placeholder="Type a name"></label>
        <div class="field-label">Pick a friend</div>
        <div class="avatars" id="avatars">
          ${AVATARS.map((id) => `<button class="avatar ${id === avatar ? 'sel' : ''}" data-id="${id}">${avatarThumb(id)}</button>`).join('')}
        </div>
        <button class="btn big-btn" id="save">${existing ? 'Save' : 'Let\'s play!'}</button>
      </div>`;
    $('#avatars').onclick = (e) => {
      const b = e.target.closest('.avatar');
      if (!b) return;
      avatar = b.dataset.id;
      sheet.querySelectorAll('.avatar').forEach((x) => x.classList.toggle('sel', x === b));
    };
    sheet.onclick = (e) => { if (e.target === sheet && !first) sheet.hidden = true; if (e.target.closest('.sheet-x')) sheet.hidden = true; };
    $('#save').onclick = () => {
      const name = $('#pname').value.trim() || (existing?.name ?? `Player ${profiles.list().length + 1}`);
      if (existing) { profiles.update(existing.id, { name, avatar }); sheet.hidden = true; dashboard(existing.id); return; }
      profiles.add({ name, avatar });
      confetti();
      speak(P.hello);
      location.hash = '#/';
    };
  }

  // ------------------------------------------------------------ gate (grown-ups PIN)
  const PIN = '5253';
  function gate() {
    if (unlocked) { dashboard(); return; }
    let entered = '';
    app.innerHTML = `
      <div class="screen">
        ${topBar({ back: '#/', title: 'Grown-ups', right: '' })}
        <main class="scroll gate">
          <div class="gate-card">
            <div class="gate-lock">🔒</div>
            <h2>Grown-ups only</h2>
            <p>Enter the PIN</p>
            <div class="pin-dots" id="dots" aria-live="polite">${'<i></i>'.repeat(PIN.length)}</div>
            <div class="keypad" id="keys">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" data-k="${n}">${n}</button>`).join('')}
              <span></span><button class="key" data-k="0">0</button><button class="key del" data-k="del" aria-label="Delete">⌫</button>
            </div>
            <p class="gate-err" id="err" hidden>Not quite — try again!</p>
          </div>
        </main>
      </div>`;
    wireSound();
    const paint = () => [...$('#dots').children].forEach((d, i) => d.classList.toggle('on', i < entered.length));
    $('#keys').addEventListener('click', (e) => {
      const k = e.target.closest('.key')?.dataset.k;
      if (!k) return;
      $('#err').hidden = true;
      if (k === 'del') entered = entered.slice(0, -1);
      else if (entered.length < PIN.length) entered += k;
      paint();
      if (entered.length === PIN.length) {
        if (entered === PIN) { unlocked = true; dashboard(); return; }
        $('#dots').classList.add('shake');
        $('#err').hidden = false;
        setTimeout(() => { entered = ''; paint(); $('#dots').classList.remove('shake'); }, 450);
      }
    });
  }

  // ------------------------------------------------------------ dashboard
  const DAY = 86400000;
  function dashboard(pid) {
    const list = profiles.list();
    if (!list.length) { location.hash = '#/who'; return; }
    pid = pid || profiles.currentId() || list[0].id;
    const p = profiles.get(pid) || list[0];
    const st = storeOf(p.id);
    const done = doneOf(p.id);
    const has = (k, id) => !!done[`${k}:${id}`];
    const count = (k) => Object.keys(done).filter((x) => x.startsWith(`${k}:`)).length;
    const log = st.get('activity', []);
    const tricky = Object.keys(st.get('tricky', {}));
    const stickers = st.get('stickers', []).length;
    const games = log.filter((e) => e.k === 'game');

    // last 14 days of activity
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 14 }, (_, i) => {
      const t0 = today.getTime() - (13 - i) * DAY;
      return { t0, n: log.filter((e) => e.t >= t0 && e.t < t0 + DAY).length };
    });
    const max = Math.max(1, ...days.map((d) => d.n));
    const gameRows = ['match', 'hunt', 'build'].map((g) => {
      const rows = games.filter((e) => e.i === g);
      const nm = { match: '🖼️ Picture Match', hunt: '🔎 Word Hunt', build: '🔤 Word Builder' }[g];
      const last = rows.at(-1);
      return `<tr><td>${nm}</td><td>${rows.length}</td><td>${last ? `${last.score}/${last.of}` : '–'}</td></tr>`;
    }).join('');
    const doneWords = Object.keys(done).filter((k) => k.startsWith('word:')).map((k) => k.slice(5));

    app.innerHTML = `
      <div class="screen">
        ${topBar({ back: '#/', title: 'Grown-ups', right: '' })}
        <nav class="tabs">
          ${list.map((x) => `<button class="tab ${x.id === p.id ? 'on' : ''}" data-id="${x.id}">${esc(x.name)}</button>`).join('')}
          <button class="tab" id="newp">➕ Add player</button>
        </nav>
        <main class="scroll dash">
          <section class="dash-head">
            <div class="dash-avatar">${avatarThumb(p.avatar)}</div>
            <div class="dash-title"><h2>${esc(p.name)}</h2>
              <div class="dash-actions">
                <button class="btn" id="edit">✏️ Edit</button>
                <button class="btn" id="reset">♻️ Reset progress</button>
                <button class="btn" id="del">🗑️ Remove player</button>
              </div></div>
          </section>

          <section class="stats">
            <div class="stat"><b>${starsEarned(p.id)}</b><span>⭐ stars earned</span></div>
            <div class="stat"><b>${starsEarned(p.id) - starsSpent(p.id)}</b><span>stars to spend</span></div>
            <div class="stat"><b>${stickers}</b><span>stickers</span></div>
            <div class="stat"><b>${count('draw')}/${DRAWINGS.length}</b><span>drawings</span></div>
            <div class="stat"><b>${count('letter')}/${CAPS.length + SMALLS.length + NUMS.length}</b><span>letters &amp; numbers</span></div>
            <div class="stat"><b>${count('word')}</b><span>words written</span></div>
            <div class="stat"><b>${count('story')}/${STORIES.length}</b><span>stories read</span></div>
            <div class="stat"><b>${games.length}</b><span>games played</span></div>
          </section>

          <section class="panelbox"><h3>Last 14 days</h3>
            <div class="bars">${days.map((d) => `<div class="bar-col" title="${new Date(d.t0).toDateString()}: ${d.n}"><i style="height:${Math.max(4, (d.n / max) * 100)}%"></i><span>${new Date(d.t0).getDate()}</span></div>`).join('')}</div>
          </section>

          <section class="panelbox"><h3>Letters &amp; numbers practised</h3>
            <div class="chips">${[...CAPS, ...SMALLS, ...NUMS].map((c) => `<span class="chip ${has('letter', c) ? 'on' : ''}">${esc(c)}</span>`).join('')}</div>
          </section>

          <section class="panelbox"><h3>Drawings finished</h3>
            <div class="mini-grid">${DRAWINGS.map((d) => `<div class="mini-card ${has('draw', d.id) ? 'on' : ''}" title="${esc(d.title)}">${drawingThumb(d)}</div>`).join('')}</div>
          </section>

          <section class="panelbox"><h3>Stories</h3>
            <ul class="list-ticks">${STORIES.map((s) => `<li class="${has('story', s.id) ? 'on' : ''}">${has('story', s.id) ? '✅' : '⬜'} ${esc(s.title)}</li>`).join('')}</ul>
          </section>

          <section class="panelbox"><h3>Words written</h3>
            <div class="chips">${doneWords.length ? doneWords.map((w) => `<span class="chip on wide">${esc(w)}</span>`).join('') : '<em>None yet</em>'}</div>
          </section>

          <section class="panelbox"><h3>Tricky words (tapped while reading)</h3>
            <div class="chips">${tricky.length ? tricky.map((w) => `<span class="chip wide">${esc(w)}</span>`).join('') : '<em>None yet</em>'}</div>
          </section>

          <section class="panelbox"><h3>Games</h3>
            <table class="gtable"><tr><th>Game</th><th>Played</th><th>Last score</th></tr>${gameRows}</table>
          </section>

          <section class="panelbox"><h3>Settings for ${esc(p.name)}</h3>
            <div class="seg-row">Letter style
              ${['Abc', 'ABC', 'abc'].map((c) => `<button class="tab ${st.get('case', 'Abc') === c ? 'on' : ''}" data-case="${c}">${c}</button>`).join('')}
            </div>
            <div class="seg-row">Drawing mode
              <button class="tab ${!st.get('paper', false) ? 'on' : ''}" data-paper="0">✏️ Screen</button>
              <button class="tab ${st.get('paper', false) ? 'on' : ''}" data-paper="1">📄 Paper</button>
            </div>
          </section>

          <section class="panelbox"><h3>This device</h3>
            <div class="seg-row">Sound &amp; voice
              <button class="tab ${prefs.sound ? 'on' : ''}" id="snd-on">🔊 On</button>
              <button class="tab ${!prefs.sound ? 'on' : ''}" id="snd-off">🔇 Off</button>
            </div>
            <p id="offline" class="offline-note">Checking offline status…</p>
            <p id="voice" class="offline-note">Checking voice…</p>
            <button class="btn" id="dlvoice" hidden>⬇️ Save voices for offline</button>
            <button class="link" id="lock">🔒 Lock this page</button>
          </section>
        </main>
        <div class="sheet" id="sheet" hidden></div>
      </div>`;
    wireSound();

    app.querySelectorAll('.tabs [data-id]').forEach((b) => b.addEventListener('click', () => dashboard(b.dataset.id)));
    $('#newp').addEventListener('click', () => profileForm());
    $('#edit').addEventListener('click', () => profileForm(p));
    $('#reset').addEventListener('click', () => {
      if (confirm(`Reset all of ${p.name}'s stars, stickers and progress? This cannot be undone.`)) { profiles.resetData(p.id); dashboard(p.id); }
    });
    $('#del').addEventListener('click', () => {
      if (confirm(`Remove ${p.name} and all their progress?`)) {
        profiles.remove(p.id);
        if (!profiles.list().length) { location.hash = '#/who'; return; }
        dashboard();
      }
    });
    app.querySelectorAll('[data-case]').forEach((b) => b.addEventListener('click', () => { st.set('case', b.dataset.case); dashboard(p.id); }));
    app.querySelectorAll('[data-paper]').forEach((b) => b.addEventListener('click', () => { st.set('paper', b.dataset.paper === '1'); dashboard(p.id); }));
    $('#snd-on').onclick = () => { setSound(true); dashboard(p.id); };
    $('#snd-off').onclick = () => { setSound(false); dashboard(p.id); };
    $('#lock').onclick = () => { unlocked = false; location.hash = '#/'; };
    offlineStatus();
    voiceInfo();
  }

  async function voiceInfo() {
    const el = $('#voice');
    const btn = $('#dlvoice');
    if (!el) return;
    const refresh = async () => {
      const { total, saved } = await voiceStatus();
      if (!total) {
        el.textContent = '🎙️ Voice: using this iPad\'s own voice (the British recordings have not been added yet).';
        btn.hidden = true;
        return;
      }
      el.textContent = `🎙️ Voice: British narrator — ${total} recordings, ${saved} saved for offline.`;
      btn.hidden = saved >= total;
    };
    await refresh();
    btn.onclick = async () => {
      btn.disabled = true;
      await downloadVoices((d, t) => { btn.textContent = `Saving… ${d}/${t}`; });
      btn.textContent = '⬇️ Save voices for offline';
      btn.disabled = false;
      refresh();
    };
  }

  async function offlineStatus() {
    const el = $('#offline');
    if (!el) return;
    try {
      if (!('serviceWorker' in navigator)) { el.textContent = '📴 Offline mode is not available in this browser.'; return; }
      const reg = await navigator.serviceWorker.getRegistration();
      const keys = await caches.keys();
      const n = keys.length ? (await (await caches.open(keys[keys.length - 1])).keys()).length : 0;
      el.textContent = reg && n
        ? `📴 Offline ready — ${n} files saved on this device. The app works without wifi.`
        : '📴 Offline mode is still getting ready. Open the app once with wifi and give it a minute.';
    } catch {
      el.textContent = '📴 Offline status unknown.';
    }
  }

  return { who, gate, dashboard };
}
