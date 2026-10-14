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
    const WORLD = 6000;
    const SP = 20; // spacing between body segments
    const mk = (x, y, colour, len) => ({
      segs: Array.from({ length: len }, (_, i) => ({ x: x - i * SP, y })), dir: 0, speed: 120, colour, grow: 0, turn: 0, alive: true,
    });
    const me = mk(WORLD / 2, WORLD / 2, '#ff6b9d', 12);
    me.speed = 230;
    let bots = [];
    let foods = [];
    const addFood = (x = Math.random() * WORLD, y = Math.random() * WORLD, v = 1, c = pick(FOOD)) => foods.push({ x, y, v, c });
    for (let i = 0; i < 900; i++) addFood();
    const spawnBot = () => {
      let bx; let by;
      do { bx = 100 + Math.random() * (WORLD - 200); by = 100 + Math.random() * (WORLD - 200); } while (Math.hypot(bx - me.segs[0].x, by - me.segs[0].y) < 700);
      const b = mk(bx, by, pick(WORM_COLOURS.slice(1)), 8 + Math.floor(Math.random() * 25));
      b.dir = Math.random() * 6.28; b.speed = 150 + Math.random() * 40;
      bots.push(b);
    };
    for (let i = 0; i < 16; i++) spawnBot();
    const radius = (w) => Math.min(46, 18 + w.segs.length * 0.22);
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
      const h = w.segs[0]; const r = radius(w) + 16;
      for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i];
        if (Math.hypot(f.x - h.x, f.y - h.y) < r) { foods.splice(i, 1); w.grow += f.v * 0.7; w.eaten = (w.eaten || 0) + f.v; if (w === me) { $('#ws').textContent = Math.floor(me.eaten); ding(); } }
      }
    };
    const die = (w) => {
      w.alive = false;
      w.segs.forEach((s, i) => { if (i % 2 === 0) addFood(s.x + (Math.random() - 0.5) * 8, s.y + (Math.random() - 0.5) * 8, 2, w.colour); });
    };
    let last = performance.now(); let over = false; let raf = 0; let age = 0;
    const tick = (now) => {
      if (!cv.isConnected || over) return;
      const dt = Math.min(0.04, (now - last) / 1000); last = now; age += dt;
      // steer: towards the finger relative to screen centre
      if (target) turnTo(me, Math.atan2(target.y - cv.clientHeight / 2, target.x - cv.clientWidth / 2), dt, 5.5);
      me.speed = boosting && me.segs.length > 7 ? 400 : 230;
      if (me.speed > 230) { // boosting costs a little tail, dropped behind as sweets
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
        if (b.segs.some((s, i) => i > 0 && Math.hypot(s.x - me.segs[0].x, s.y - me.segs[0].y) < rr * 0.8) && age > 4) over = true; // a few safe seconds at the start
        // bot's head hits the player's body: bot pops into sweets
        if (!over && me.segs.some((s, i) => i > 3 && Math.hypot(s.x - h.x, s.y - h.y) < rr * 0.7)) { die(b); me.grow += 3; cheer(); }
      }
      bots = bots.filter((b) => b.alive);
      while (bots.length < 16) spawnBot();
      while (foods.length < 900) addFood();
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
      const z = Math.max(0.5, 1 - me.segs.length * 0.003); // the camera pulls back as the worm grows
      const W = cv.clientWidth / z; const H = cv.clientHeight / z;
      g.setTransform(dpr * z, 0, 0, dpr * z, 0, 0);
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
        g.beginPath(); g.arc(x, y, f.v > 1 ? 12 : 8, 0, 7); g.fill();
      }
      g.shadowBlur = 0;
      bots.forEach((b) => wormPath(b, x0, y0));
      wormPath(me, x0, y0);
      // little map in the corner so you can see where you are in the big world
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mw = 90; const mx = 12; const my = 12;
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(mx, my, mw, mw);
      g.fillStyle = '#ffd23f'; for (const b of bots) g.fillRect(mx + (b.segs[0].x / WORLD) * mw - 1.5, my + (b.segs[0].y / WORLD) * mw - 1.5, 3, 3);
      g.fillStyle = '#ff6b9d'; g.beginPath(); g.arc(mx + (h.x / WORLD) * mw, my + (h.y / WORLD) * mw, 4, 0, 7); g.fill();
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

  // ------------------------------------------------------------ 5. zoom race (steer, dodge cones, grab boosts, beat the other cars)
  function race() {
    shell('Zoom Race', `
      <div class="gbody wormbody">
        <div class="arc-hud"><span>🏁 <b id="rp">1st</b></span><span>⭐ <b id="rs">0</b></span><span>🏆 ${best('race')}</span></div>
        <canvas id="rc" class="worm-canvas race-canvas"></canvas>
        <div class="worm-hint" id="rh">Drag your finger left and right to steer. Grab ⚡ to zoom, dodge the cones!</div>
      </div>`);
    const cv = $('#rc'); const g = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; };
    resize();
    const LEN = 9000;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const car = (x, colour, base) => ({ x, s: 0, v: 0, colour, base, boost: 0 });
    const me = car(0.5, '#ff3b3b', 0);
    const rivals = [car(0.2, '#2e86ff', 430), car(0.5, '#ffb02e', 415), car(0.8, '#8a5cf6', 440)];
    rivals.forEach((r, i) => { r.s = 0; r.phase = i * 2; });
    me.s = 0;
    const objs = [];
    for (let s0 = 700; s0 < LEN - 400; s0 += rnd(170, 300)) {
      const kind = Math.random() < 0.3 ? 'boost' : Math.random() < 0.35 ? 'star' : 'cone';
      objs.push({ s: s0, x: rnd(0.1, 0.9), kind, used: false });
    }
    let stars = 0; let target = null; let t = 0; let over = false; let raf = 0; let last = performance.now();
    let countdown = 3.2; let finished = null; let msg = ''; let msgT = 0;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left); };
    const roadBox = () => { const W = cv.clientWidth; const rw = Math.min(W, 560); return { rw, x0: (W - rw) / 2 }; };
    const down = (e) => { target = pos(e); $('#rh')?.remove(); };
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') target = pos(e); });
    const place = () => 1 + rivals.filter((r) => r.s > me.s).length;
    const ord = (n) => ['1st', '2nd', '3rd', '4th'][n - 1];
    const flash = (m) => { msg = m; msgT = 1; };
    const tick = (now) => {
      if (!cv.isConnected || over) return;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      if (countdown > 0) {
        const before = Math.ceil(countdown);
        countdown -= dt;
        if (Math.ceil(countdown) !== before && countdown > 0) ding();
      } else if (!finished) {
        t += dt;
        const { rw, x0 } = roadBox();
        if (target != null) me.x += (Math.max(0.06, Math.min(0.94, (target - x0) / rw)) - me.x) * Math.min(1, dt * 9);
        // speed: eases up to a top speed, boost adds a burst
        me.boost = Math.max(0, me.boost - dt);
        const top = 470 + (me.boost > 0 ? 230 : 0);
        me.v += (top - me.v) * Math.min(1, dt * 1.6);
        me.s += me.v * dt;
        for (const o of objs) {
          if (o.used || Math.abs(o.s - me.s) > 40 || Math.abs(o.x - me.x) > 0.11) continue;
          o.used = true;
          if (o.kind === 'cone') { me.v *= 0.35; oops(); flash('Bump!'); } else if (o.kind === 'boost') { me.boost = 1.6; cheer(); flash('ZOOM!'); } else { stars++; ding(); $('#rs').textContent = stars; }
        }
        rivals.forEach((r) => {
          // rivals speed up a bit when behind and slow a bit when well ahead, so it is always a close race
          const gap = me.s - r.s;
          const v = r.base + Math.max(-60, Math.min(70, gap * 0.12)) + Math.sin(t * 1.3 + r.phase) * 25;
          r.s += v * dt;
          r.x += Math.sin(t * 0.8 + r.phase) * 0.06 * dt;
        });
        $('#rp').textContent = ord(place());
        const crossed = [me, ...rivals].filter((c) => c.s >= LEN);
        if (me.s >= LEN) finished = place();
        void crossed;
        if (finished) setTimeout(() => { over = true; const pts = [10, 6, 3, 1][finished - 1] + stars; result('race', 'Zoom Race', pts, 'points'); }, 900);
      }
      msgT = Math.max(0, msgT - dt * 1.4);
      draw();
      raf = requestAnimationFrame(tick);
    };
    const drawCar = (cx, cy, w, colour, boost) => {
      const h = w * 1.7;
      if (boost) { g.fillStyle = '#ffb400'; g.beginPath(); g.moveTo(cx - w * 0.3, cy + h / 2); g.lineTo(cx, cy + h / 2 + w * (0.8 + Math.random() * 0.4)); g.lineTo(cx + w * 0.3, cy + h / 2); g.fill(); }
      g.fillStyle = '#222';
      for (const sx of [-1, 1]) for (const sy of [-0.3, 0.32]) g.fillRect(cx + sx * w * 0.52 - w * 0.11, cy + sy * h - h * 0.11, w * 0.22, h * 0.22);
      g.fillStyle = colour; g.beginPath(); g.roundRect(cx - w / 2, cy - h / 2, w, h, w * 0.3); g.fill();
      g.fillStyle = '#bfe9ff'; g.beginPath(); g.roundRect(cx - w * 0.34, cy - h * 0.18, w * 0.68, h * 0.3, w * 0.12); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(cx - w * 0.06, cy - h / 2 + 2, w * 0.12, h * 0.9);
    };
    const draw = () => {
      const W = cv.clientWidth; const H = cv.clientHeight;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { rw, x0 } = roadBox();
      g.fillStyle = '#58b947'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#4a4e5a'; g.fillRect(x0, 0, rw, H);
      g.fillStyle = '#fff'; g.fillRect(x0 - 8, 0, 8, H); g.fillRect(x0 + rw, 0, 8, H);
      const py = H * 0.78; const sc = 0.55; // world units -> pixels
      const off = (me.s * sc) % 80;
      g.fillStyle = '#ffe066';
      for (let y = -80 + off; y < H; y += 80) { g.fillRect(x0 + rw / 3 - 3, y, 6, 40); g.fillRect(x0 + (2 * rw) / 3 - 3, y, 6, 40); }
      const sy = (s) => py - (s - me.s) * sc;
      // finish line
      const fy = sy(LEN);
      if (fy > -40 && fy < H + 40) { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#fff' : '#111'; g.fillRect(x0 + (rw / 16) * i, fy - 12, rw / 16, 12); g.fillStyle = i % 2 ? '#111' : '#fff'; g.fillRect(x0 + (rw / 16) * i, fy, rw / 16, 12); } }
      for (const o of objs) {
        const y = sy(o.s); if (y < -40 || y > H + 40 || o.used) continue;
        const x = x0 + o.x * rw;
        if (o.kind === 'cone') { g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(x, y - 24); g.lineTo(x + 18, y + 14); g.lineTo(x - 18, y + 14); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 9, y - 4, 18, 6); } else if (o.kind === 'boost') { g.fillStyle = '#ffd23f'; g.beginPath(); g.roundRect(x - 22, y - 22, 44, 44, 10); g.fill(); g.font = '30px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚡', x, y + 2); } else { g.font = '34px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⭐', x, y); }
      }
      const cw = Math.min(46, rw * 0.085);
      rivals.forEach((r) => { const y = sy(r.s); if (y > -80 && y < H + 80) drawCar(x0 + r.x * rw, y, cw, r.colour, false); });
      drawCar(x0 + me.x * rw, py, cw, me.colour, me.boost > 0);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (countdown > 0) { g.font = '900 120px system-ui'; g.fillStyle = '#fff'; g.strokeStyle = '#222'; g.lineWidth = 10; const c = Math.ceil(countdown - 0.2); const txt = c > 0 ? String(c) : 'GO!'; g.strokeText(txt, W / 2, H * 0.35); g.fillText(txt, W / 2, H * 0.35); }
      if (msgT > 0 && !finished) { g.font = '900 54px system-ui'; g.globalAlpha = msgT; g.fillStyle = '#fff'; g.strokeStyle = '#222'; g.lineWidth = 8; g.strokeText(msg, W / 2, H * 0.4); g.fillText(msg, W / 2, H * 0.4); g.globalAlpha = 1; }
      if (finished) { g.font = '900 80px system-ui'; g.fillStyle = '#fff'; g.strokeStyle = '#222'; g.lineWidth = 10; const txt = finished === 1 ? '🏆 You won!' : `${ord(finished)} place!`; g.strokeText(txt, W / 2, H * 0.35); g.fillText(txt, W / 2, H * 0.35); }
    };
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);
    stopLoop = () => { over = true; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }

  const api = { quick, pop, worm, shoot, race };
  return api;
}
