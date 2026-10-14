// Fun arcade games (not about reading): Quick Tap, Pop Party and Wormy (a snake-style worm game, all offline).
import { drawingById } from './drawings.js';
import { ding, oops, cheer, speak } from './sound.js';
import { addStar, store, logActivity } from './store.js';
import { pick, shuffle } from './util.js';

const HEROES = ['bluey', 'bingo', 'hulk', 'yoda', 'vader', 'catboy', 'owlette', 'gekko', 'groot', 'thor', 'grogu', 'cat', 'dog', 'penguin'];
const FOOD = ['#ff5252', '#ffd23f', '#43d17a', '#4ec3ff', '#c77dff', '#ff9f43'];
const WORM_COLOURS = ['#ff6b9d', '#4ec3ff', '#ffb02e', '#8a5cf6', '#2ec27e', '#ef476f'];

export function createArcade({ app, $, topBar, wireSound, drawingThumb, starsBadge, confetti }) {
  let stopLoop = () => {};
  const shell = (title, body) => {
    stopLoop();
    app.innerHTML = `
      <div class="screen game arc">
        ${topBar({ back: '#/games', title, right: starsBadge() })}
        <main class="game-main">${body}</main>
      </div>`;
    wireSound();
  };
  const best = (id) => store.get(`best:${id}`, 0);

  function result(id, title, score, unit) {
    stopLoop();
    const old = best(id);
    const record = score > old;
    if (record) store.set(`best:${id}`, score);
    addStar(record && old > 0 ? 2 : 1);
    logActivity('game', id, { score });
    confetti();
    cheer();
    $('.game-main').innerHTML = `
      <div class="gbody"><div class="win-card gwin">
        <div class="win-emoji">${record ? '🏆' : '🎉'}</div>
        <h3>${score} ${unit}!</h3>
        <p>${record ? 'A new best score! You earned 2 stars!' : `Your best is ${Math.max(old, score)}. You earned a star!`}</p>
        <div class="win-actions">
          <a class="btn big-btn next" href="#/arcade/${id}" id="again">🔁 Play again</a>
          <a class="btn big-btn alt" href="#/games">🎮 All games</a>
        </div>
      </div></div>`;
    $('#again').addEventListener('click', (e) => { e.preventDefault(); api[id](); });
    speak(record ? 'A new best score! Amazing!' : 'Great playing!');
  }

  // a timed countdown shared by the two tap games
  function timer(seconds, onTick, onEnd) {
    const t0 = performance.now();
    const id = setInterval(() => {
      if (!$('.arc')) { clearInterval(id); return; }
      const left = Math.max(0, seconds - (performance.now() - t0) / 1000);
      onTick(left);
      if (left <= 0) { clearInterval(id); onEnd(); }
    }, 100);
    stopLoop = () => clearInterval(id);
  }

  // ------------------------------------------------------------ 1. quick tap
  function quick() {
    const hero = pick(HEROES);
    shell('Quick Tap', `
      <div class="gbody">
        <div class="g-prompt" id="qp">Tap the hero as fast as you can!</div>
        <div class="arc-hud"><span>⏱️ <b id="qt">10</b></span><span>👆 <b id="qs">0</b></span><span>🏆 ${best('quick')}</span></div>
        <button class="quick-btn" id="qb" aria-label="Tap!">${drawingThumb(drawingById(hero))}</button>
      </div>`);
    let n = 0; let started = false; let over = false;
    const b = $('#qb');
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (over) return;
      if (!started) {
        started = true;
        $('#qp').textContent = 'Go go go!';
        timer(10, (l) => { $('#qt').textContent = l.toFixed(1); }, () => { over = true; result('quick', 'Quick Tap', n, 'taps'); });
      }
      n++;
      $('#qs').textContent = n;
      b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
      if (n % 10 === 0) ding();
    });
  }

  // ------------------------------------------------------------ 2. pop party
  function pop() {
    shell('Pop Party', `
      <div class="gbody">
        <div class="arc-hud"><span>⏱️ <b id="pt">30</b></span><span>💥 <b id="ps">0</b></span><span>🏆 ${best('pop')}</span></div>
        <div class="pop-field" id="pf"></div>
      </div>`);
    const field = $('#pf');
    let score = 0; let over = false; let elapsed = 0;
    timer(30, (l) => { $('#pt').textContent = Math.ceil(l); elapsed = 30 - l; }, () => { over = true; result('pop', 'Pop Party', score, 'pops'); });
    const spawn = () => {
      if (over || !field.isConnected) return;
      const size = Math.max(70, 120 - elapsed * 1.4);
      const el = document.createElement('button');
      el.className = 'pop-t';
      el.style.width = el.style.height = `${size}px`;
      el.style.left = `${Math.random() * (field.clientWidth - size)}px`;
      el.style.top = `${Math.random() * (field.clientHeight - size)}px`;
      el.innerHTML = drawingThumb(drawingById(pick(HEROES)));
      field.appendChild(el);
      const life = Math.max(750, 2000 - elapsed * 40);
      const gone = setTimeout(() => el.remove(), life);
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        clearTimeout(gone);
        score++;
        $('#ps').textContent = score;
        el.classList.add('popped');
        ding();
        setTimeout(() => el.remove(), 250);
      });
      setTimeout(spawn, Math.max(280, 800 - elapsed * 17));
    };
    spawn();
    spawn();
  }

  // ------------------------------------------------------------ 3. wormy
  function worm() {
    shell('Wormy', `
      <div class="gbody wormbody">
        <div class="arc-hud"><span>🍬 <b id="ws">0</b></span><span>🏆 ${best('worm')}</span></div>
        <canvas id="wc" class="worm-canvas"></canvas>
        <button class="boost-btn" id="boost" aria-label="Boost">🚀<small>BOOST</small></button>
        <div class="worm-hint" id="wh">Drag your finger to steer. Hold 🚀 to zoom! Eat sweets and don't bump the other worms!</div>
      </div>`);
    const cv = $('#wc');
    const g = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
    };
    resize();
    const WORLD = 1800;
    const SP = 14; // spacing between body segments
    const mk = (x, y, colour, len) => ({
      segs: Array.from({ length: len }, (_, i) => ({ x: x - i * SP, y })), dir: 0, speed: 120, colour, grow: 0, turn: 0, alive: true,
    });
    const me = mk(WORLD / 2, WORLD / 2, '#ff6b9d', 8);
    me.speed = 150;
    let bots = [];
    let foods = [];
    const addFood = (x = Math.random() * WORLD, y = Math.random() * WORLD, v = 1, c = pick(FOOD)) => foods.push({ x, y, v, c });
    for (let i = 0; i < 170; i++) addFood();
    const spawnBot = () => {
      const a = Math.random() * Math.PI * 2;
      const b = mk(WORLD / 2 + Math.cos(a) * 600, WORLD / 2 + Math.sin(a) * 600, pick(WORM_COLOURS.slice(1)), 8 + Math.floor(Math.random() * 10));
      b.dir = Math.random() * 6.28; b.speed = 95 + Math.random() * 25;
      bots.push(b);
    };
    for (let i = 0; i < 5; i++) spawnBot();
    const radius = (w) => Math.min(28, 13 + w.segs.length * 0.15);
    let target = null; // finger position (screen)
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('pointerdown', (e) => { target = pos(e); cv.setPointerCapture?.(e.pointerId); $('#wh')?.remove(); });
    cv.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') target = pos(e); });
    cv.addEventListener('pointerup', () => { target = null; });
    let boosting = false; let boostCost = 0;
    const bb = $('#boost');
    const setBoost = (on) => (e) => { e.preventDefault(); boosting = on; bb.classList.toggle('on', on); if (on) $('#wh')?.remove(); };
    bb.addEventListener('pointerdown', setBoost(true));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => bb.addEventListener(ev, setBoost(false)));

    const move = (w, dt) => {
      const h = w.segs[0];
      h.x += Math.cos(w.dir) * w.speed * dt;
      h.y += Math.sin(w.dir) * w.speed * dt;
      if (h.x < 0 || h.x > WORLD) { h.x = Math.max(0, Math.min(WORLD, h.x)); w.dir = Math.PI - w.dir; }
      if (h.y < 0 || h.y > WORLD) { h.y = Math.max(0, Math.min(WORLD, h.y)); w.dir = -w.dir; }
      for (let i = 1; i < w.segs.length; i++) {
        const p = w.segs[i - 1]; const s = w.segs[i];
        const dx = p.x - s.x; const dy = p.y - s.y; const d = Math.hypot(dx, dy) || 1;
        if (d > SP) { s.x = p.x - (dx / d) * SP; s.y = p.y - (dy / d) * SP; }
      }
      if (w.grow >= 1) { const t = w.segs[w.segs.length - 1]; w.segs.push({ x: t.x, y: t.y }); w.grow -= 1; }
    };
    const turnTo = (w, want, dt, rate = 4.5) => {
      let d = want - w.dir;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      w.dir += Math.max(-rate * dt, Math.min(rate * dt, d));
    };
    const eat = (w) => {
      const h = w.segs[0]; const r = radius(w) + 12;
      for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i];
        if (Math.hypot(f.x - h.x, f.y - h.y) < r) { foods.splice(i, 1); w.grow += f.v * 0.7; w.eaten = (w.eaten || 0) + f.v; if (w === me) { $('#ws').textContent = Math.floor(me.eaten); ding(); } }
      }
    };
    const die = (w) => {
      w.alive = false;
      w.segs.forEach((s, i) => { if (i % 2 === 0) addFood(s.x + (Math.random() - 0.5) * 8, s.y + (Math.random() - 0.5) * 8, 2, w.colour); });
    };
    let last = performance.now(); let over = false; let raf = 0;
    const tick = (now) => {
      if (!cv.isConnected || over) return;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      // steer: towards the finger relative to screen centre
      if (target) turnTo(me, Math.atan2(target.y - cv.clientHeight / 2, target.x - cv.clientWidth / 2), dt, 5.5);
      me.speed = boosting && me.segs.length > 7 ? 270 : 150;
      if (me.speed > 150) { // boosting costs a little tail, dropped behind as sweets
        boostCost += dt;
        if (boostCost > 0.3) { boostCost = 0; const t = me.segs.pop(); addFood(t.x, t.y, 1, me.colour); }
      }
      move(me, dt); eat(me);
      for (const b of bots) {
        if (!b.alive) continue;
        const h = b.segs[0];
        // wander towards the nearest sweet
        let bf = null; let bd = 1e9;
        for (const f of foods) { const d = Math.hypot(f.x - h.x, f.y - h.y); if (d < bd) { bd = d; bf = f; } }
        b.turn -= dt;
        if (b.turn <= 0) { b.turn = 0.6 + Math.random(); b.want = bf && bd < 500 ? Math.atan2(bf.y - h.y, bf.x - h.x) : b.dir + (Math.random() - 0.5) * 2; }
        // steer away from the player's body if it is close ahead
        for (const s of me.segs) { if (Math.hypot(s.x - h.x, s.y - h.y) < 40) { b.want = Math.atan2(h.y - s.y, h.x - s.x); break; } }
        turnTo(b, b.want ?? b.dir, dt, 3); move(b, dt); eat(b);
        // player's head touches the bot: the player is bumped
        const rr = radius(me) + radius(b) - 4;
        if (b.segs.some((s, i) => i > 0 && Math.hypot(s.x - me.segs[0].x, s.y - me.segs[0].y) < rr * 0.8)) over = true;
        // bot's head hits the player's body: bot pops into sweets
        if (!over && me.segs.some((s, i) => i > 3 && Math.hypot(s.x - h.x, s.y - h.y) < rr * 0.7)) { die(b); me.grow += 3; cheer(); }
      }
      bots = bots.filter((b) => b.alive);
      while (bots.length < 5) spawnBot();
      while (foods.length < 170) addFood();
      draw();
      if (over) { oops(); stopLoop(); setTimeout(() => result('worm', 'Wormy', Math.floor(me.eaten || 0), 'sweets'), 500); return; }
      raf = requestAnimationFrame(tick);
    };
    const wormPath = (w, x0, y0) => {
      const r = radius(w);
      for (let i = w.segs.length - 1; i >= 0; i--) {
        const s = w.segs[i];
        g.fillStyle = i % 2 ? w.colour : shade(w.colour);
        g.beginPath(); g.arc(s.x - x0, s.y - y0, r * (i === 0 ? 1.05 : 1), 0, 7); g.fill();
      }
      const h = w.segs[0];
      for (const side of [-1, 1]) {
        const ex = h.x - x0 + Math.cos(w.dir + side * 0.7) * r * 0.55; const ey = h.y - y0 + Math.sin(w.dir + side * 0.7) * r * 0.55;
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, r * 0.36, 0, 7); g.fill();
        g.fillStyle = '#222'; g.beginPath(); g.arc(ex + Math.cos(w.dir) * 2, ey + Math.sin(w.dir) * 2, r * 0.18, 0, 7); g.fill();
      }
    };
    const shade = (c) => c + 'cc';
    const draw = () => {
      const W = cv.clientWidth; const H = cv.clientHeight;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#1b1f3b'; g.fillRect(0, 0, W, H);
      const h = me.segs[0];
      const x0 = h.x - W / 2; const y0 = h.y - H / 2;
      g.fillStyle = '#2a3060';
      for (let gx = -(x0 % 60); gx < W; gx += 60) for (let gy = -(y0 % 60); gy < H; gy += 60) g.fillRect(gx, gy, 3, 3);
      g.strokeStyle = '#ff6b9d'; g.lineWidth = 6; g.strokeRect(-x0, -y0, WORLD, WORLD);
      for (const f of foods) {
        const x = f.x - x0; const y = f.y - y0;
        if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
        g.fillStyle = f.c; g.shadowColor = f.c; g.shadowBlur = 10;
        g.beginPath(); g.arc(x, y, f.v > 1 ? 8 : 6, 0, 7); g.fill();
      }
      g.shadowBlur = 0;
      bots.forEach((b) => wormPath(b, x0, y0));
      wormPath(me, x0, y0);
    };
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);
    stopLoop = () => { over = true; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }

  // ------------------------------------------------------------ 4. bullseye blast (target shooting)
  function shoot() {
    shell('Bullseye Blast', `
      <div class="gbody">
        <div class="arc-hud"><span>⏱️ <b id="bt">30</b></span><span>🎯 <b id="bs">0</b></span><span>🏆 ${best('shoot')}</span></div>
        <div class="shoot-field" id="sf"></div>
      </div>`);
    const field = $('#sf');
    let score = 0; let over = false; let elapsed = 0;
    const targets = [];
    const mkTarget = () => {
      const size = 96 + Math.random() * 50;
      const el = document.createElement('div');
      el.className = 'bull';
      el.style.width = el.style.height = `${size}px`;
      el.innerHTML = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff" stroke="#e53935" stroke-width="3"/><circle cx="50" cy="50" r="34" fill="#e53935"/><circle cx="50" cy="50" r="22" fill="#fff"/><circle cx="50" cy="50" r="10" fill="#e53935"/></svg>';
      field.appendChild(el);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const t = { el, size, dir, x: dir > 0 ? -size : field.clientWidth, y: 10 + Math.random() * Math.max(10, field.clientHeight - size - 20), vx: dir * (110 + Math.random() * 90 + elapsed * 5), wob: Math.random() * 6, amp: 20 + Math.random() * 50 };
      targets.push(t);
    };
    const hitAt = (px, py) => {
      let hit = null;
      for (const t of targets) {
        const cx = t.x + t.size / 2; const cy = t.cy + t.size / 2;
        const d = Math.hypot(px - cx, py - cy) / (t.size / 2);
        if (d <= 1 && (!hit || d < hit.d)) hit = { t, d };
      }
      return hit;
    };
    const splat = (x, y, txt, good) => {
      const m = document.createElement('div');
      m.className = `shot ${good ? 'good' : ''}`;
      m.style.left = `${x}px`; m.style.top = `${y}px`;
      m.textContent = txt;
      field.appendChild(m);
      setTimeout(() => m.remove(), 700);
    };
    field.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (over) return;
      const r = field.getBoundingClientRect();
      const x = e.clientX - r.left; const y = e.clientY - r.top;
      const h = hitAt(x, y);
      if (!h) { oops(); splat(x, y, '💨', false); return; }
      const pts = h.d < 0.2 ? 5 : h.d < 0.45 ? 3 : h.d < 0.7 ? 2 : 1;
      score += pts;
      $('#bs').textContent = score;
      ding();
      splat(x, y, pts === 5 ? '🎯 +5' : `+${pts}`, true);
      h.t.el.classList.add('hit');
      h.t.dead = true;
      setTimeout(() => h.t.el.remove(), 300);
    });
    let last = performance.now(); let raf = 0; let spawnT = 0;
    const tick = (now) => {
      if (over || !field.isConnected) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      spawnT -= dt;
      if (spawnT <= 0 && targets.length < 6) { mkTarget(); spawnT = Math.max(0.45, 1.1 - elapsed * 0.02); }
      for (const t of targets) {
        t.x += t.vx * dt; t.wob += dt * 2;
        t.cy = Math.max(0, Math.min(field.clientHeight - t.size, t.y + Math.sin(t.wob) * t.amp));
        t.el.style.transform = `translate(${t.x}px,${t.cy}px)`;
      }
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        if (t.dead || t.x < -t.size - 5 && t.dir < 0 || t.x > field.clientWidth + 5 && t.dir > 0) { if (!t.dead) t.el.remove(); targets.splice(i, 1); }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    timer(30, (l) => { $('#bt').textContent = Math.ceil(l); elapsed = 30 - l; }, () => { over = true; cancelAnimationFrame(raf); result('shoot', 'Bullseye Blast', score, 'points'); });
    const clear = stopLoop;
    stopLoop = () => { clear(); over = true; cancelAnimationFrame(raf); };
  }

  const api = { quick, pop, worm, shoot };
  return api;
}
