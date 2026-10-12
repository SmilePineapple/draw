// The tracing engine: shows one step at a time, lets the child trace it with a finger/pencil,
// checks how much of the guide they covered, then reveals colour and moves on.
import { ding, oops } from './sound.js';

const NS = 'http://www.w3.org/2000/svg';
const RAINBOW = ['#e53935', '#fb8c00', '#f2a900', '#2e9e46', '#1e88e5', '#8e24aa'];

const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.appendChild(n);
  return n;
};

const PRESETS = {
  draw: { ink: 6, guideW: 15, tol: 28, thr: 0.62, spacing: 7 },
  write: { ink: 7, guideW: 15, tol: 17, thr: 0.65, spacing: 4 },
};

/**
 * @param {object} o
 * @param {HTMLElement} o.mount
 * @param {number} o.vbW @param {number} o.vbH   – coordinate box
 * @param {Array} o.steps  – [{paths:[string|{d,dx,dy}], fill?, z?, strokeIndex?, strokeCount?, letterIndex?}]
 * @param {'draw'|'write'} o.mode
 * @param {string} [o.backdrop] – extra svg markup drawn behind everything (writing lines)
 * @param {(i:number)=>void} [o.onStepChange] – called when a new step becomes current
 * @param {()=>void} [o.onComplete]
 */
export function createTracer(o) {
  const base = PRESETS[o.mode || 'draw'];
  const cfg = { ...base };
  const { vbW, vbH } = o;
  const steps = o.steps.map((s) => ({
    ...s,
    paths: s.paths.map((p) => (typeof p === 'string' ? { d: p, dx: 0, dy: 0 } : { dx: 0, dy: 0, ...p })),
  }));

  // ---------- DOM ----------
  const wrap = document.createElement('div');
  wrap.className = 'stage-wrap';
  const stage = document.createElement('div');
  stage.className = `stage mode-${o.mode || 'draw'}`;
  const svg = el('svg', { viewBox: `0 0 ${vbW} ${vbH}`, class: 'guide-svg', 'aria-hidden': 'true' });
  const gBack = el('g', {}, svg);
  gBack.innerHTML = o.backdrop || '';
  const gFill = el('g', { class: 'fills' }, svg);
  const gGhost = el('g', { class: 'ghosts' }, svg);
  const gCur = el('g', { class: 'current' }, svg);
  const canvas = document.createElement('canvas');
  canvas.className = 'ink';
  const fx = document.createElement('div');
  fx.className = 'fx';
  stage.append(svg, canvas, fx);
  wrap.append(stage);
  o.mount.replaceChildren(wrap);

  // fills, sorted by z (behind first). Hidden until their step is traced.
  const fillEls = new Map();
  steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.fill !== undefined || (o.mode === 'draw'))
    .sort((a, b) => (a.s.z ?? a.i * 10) - (b.s.z ?? b.i * 10))
    .forEach(({ s, i }) => {
      const g = el('g', { class: 'reveal' }, gFill);
      s.paths.forEach((p) => {
        const isShape = !!s.fill;
        el('path', {
          d: p.d,
          transform: `translate(${p.dx} ${p.dy})`,
          class: isShape ? 'fill-shape' : 'fill-line',
          ...(isShape ? { fill: s.fill } : {}),
        }, g);
      });
      fillEls.set(i, g);
    });

  // ghost outlines of every step (used for sampling too)
  steps.forEach((s) => {
    s.ghostEls = s.paths.map((p) =>
      el('path', { d: p.d, transform: `translate(${p.dx} ${p.dy})`, class: 'ghost' }, gGhost));
    s.samples = s.paths.map((p, k) => {
      const path = s.ghostEls[k];
      const len = path.getTotalLength();
      const n = Math.max(2, Math.ceil(len / cfg.spacing));
      const pts = [];
      for (let j = 0; j <= n; j++) {
        const pt = path.getPointAtLength((len * j) / n);
        pts.push({ x: pt.x + p.dx, y: pt.y + p.dy });
      }
      return pts;
    });
  });

  // ---------- state ----------
  let idx = 0;
  let finished = false;
  let color = 'auto';
  let strokes = []; // {step, color, pts:[{x,y}]}
  let active = null; // {id, stroke}
  let advanceTimer = 0;
  let destroyed = false;
  let paper = false; // pencil-and-paper mode: show the model, no on-screen tracing

  const ctx = canvas.getContext('2d');
  let scale = 1; // css px per viewBox unit

  function fit() {
    const r = wrap.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const ar = vbW / vbH;
    let w = r.width;
    let h = w / ar;
    if (h > r.height) { h = r.height; w = h * ar; }
    stage.style.width = `${Math.floor(w)}px`;
    stage.style.height = `${Math.floor(h)}px`;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scale = (w * dpr) / vbW;
    // very wide stages (long words) shrink everything on screen – compensate so fingers still fit
    const m = o.mode === 'write' ? Math.min(2, Math.max(1, 2.6 / (w / vbW))) : 1;
    const changed = Math.abs(m - (cfg.m || 1)) > 0.05;
    cfg.m = m;
    cfg.ink = base.ink * m; cfg.guideW = base.guideW * m; cfg.tol = base.tol * m;
    redraw();
    if (changed) renderGuide();
  }
  const ro = new ResizeObserver(fit);
  ro.observe(wrap);

  const inkColor = (step) =>
    color !== 'auto' ? color : RAINBOW[((steps[step]?.letterIndex ?? step) + 0) % RAINBOW.length];

  // ---------- canvas drawing ----------
  function paintStroke(c, s, k) {
    const pts = s.pts;
    c.lineCap = c.lineJoin = 'round';
    const white = s.color.toLowerCase() === '#ffffff';
    if (white) {
      // thin grey edge so a white pen is visible on the cream page
      c.strokeStyle = c.fillStyle = '#cdd2de';
      c.lineWidth = (cfg.ink + 2.4) * k;
      outline(c, pts, k, cfg.ink + 2.4);
    }
    c.strokeStyle = c.fillStyle = s.color;
    c.lineWidth = cfg.ink * k;
    if (pts.length === 1) {
      c.beginPath();
      c.arc(pts[0].x * k, pts[0].y * k, (cfg.ink * k) / 2, 0, Math.PI * 2);
      c.fill();
      return;
    }
    c.beginPath();
    c.moveTo(pts[0].x * k, pts[0].y * k);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      c.quadraticCurveTo(pts[i].x * k, pts[i].y * k, mx * k, my * k);
    }
    const last = pts[pts.length - 1];
    c.lineTo(last.x * k, last.y * k);
    c.stroke();
  }
  function outline(c, pts, k, w) {
    if (pts.length === 1) {
      c.beginPath(); c.arc(pts[0].x * k, pts[0].y * k, (w * k) / 2, 0, Math.PI * 2); c.fill();
      return;
    }
    c.beginPath();
    c.moveTo(pts[0].x * k, pts[0].y * k);
    for (let i = 1; i < pts.length - 1; i++) {
      c.quadraticCurveTo(pts[i].x * k, pts[i].y * k, ((pts[i].x + pts[i + 1].x) / 2) * k, ((pts[i].y + pts[i + 1].y) / 2) * k);
    }
    const l = pts[pts.length - 1];
    c.lineTo(l.x * k, l.y * k);
    c.stroke();
  }
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((s) => paintStroke(ctx, s, scale));
  }

  // ---------- the current step's guide ----------
  function showStep() {
    renderGuide();
    playDemo();
    o.onStepChange?.(idx, steps[idx]);
  }

  function renderGuide() {
    gCur.replaceChildren();
    steps.forEach((s, i) => s.ghostEls.forEach((g) => g.classList.toggle('hide', finished || i <= idx)));
    if (paper) {
      steps.forEach((st, i) => {
        if (i < idx || finished) {
          st.paths.forEach((p) => el('path', { d: p.d, transform: `translate(${p.dx} ${p.dy})`, class: 'paper-done' }, gCur));
        }
      });
    }
    if (finished) return;
    const s = steps[idx];
    const w = cfg.guideW;
    // little numbers on the remaining strokes of this letter
    steps.forEach((n, i) => {
      if (i > idx && n.letterIndex !== undefined && n.letterIndex === s.letterIndex) {
        const st = n.samples[0][0];
        const g = el('g', { class: 'next-num', transform: `translate(${st.x} ${st.y})` }, gCur);
        el('circle', { r: w * 0.7 }, g);
        const t = el('text', { 'font-size': w, y: w * 0.35, 'text-anchor': 'middle' }, g);
        t.textContent = String(n.strokeIndex + 1);
      }
    });
    s.paths.forEach((p, k) => {
      const t = `translate(${p.dx} ${p.dy})`;
      el('path', { d: p.d, transform: t, class: 'cur-glow', 'stroke-width': w * 1.5 }, gCur);
      el('path', { d: p.d, transform: t, class: 'cur-band', 'stroke-width': w }, gCur);
      el('path', { d: p.d, transform: t, class: 'cur-demo', 'stroke-width': w * 0.5, pathLength: 1 }, gCur);
      const start = s.samples[k][0];
      const dot = el('g', { class: 'start', transform: `translate(${start.x} ${start.y})` }, gCur);
      el('circle', { r: w * 0.95, class: 'start-dot' }, dot);
      if (s.strokeCount > 1) {
        const t = el('text', { class: 'start-num', 'font-size': w * 1.25, y: w * 0.45, 'text-anchor': 'middle' }, dot);
        t.textContent = String(s.strokeIndex + 1);
      }
    });
  }

  function playDemo() {
    gCur.classList.remove('hint');
    void gCur.getBoundingClientRect();
    gCur.classList.add('hint');
  }

  // ---------- checking the trace ----------
  const stepPoints = (i) => strokes.filter((s) => s.step === i).flatMap((s) => s.pts);

  function d2(a, b) { const dx = a.x - b.x; const dy = a.y - b.y; return dx * dx + dy * dy; }

  function coverage(samples, pts) {
    const t2 = cfg.tol * cfg.tol;
    let hit = 0;
    for (const sp of samples) {
      for (const p of pts) { if (d2(sp, p) <= t2) { hit++; break; } }
    }
    return hit / samples.length;
  }
  function precision(allSamples, pts) {
    const t2 = (cfg.tol * 2) * (cfg.tol * 2);
    let good = 0;
    for (const p of pts) {
      for (const sp of allSamples) { if (d2(sp, p) <= t2) { good++; break; } }
    }
    return good / pts.length;
  }

  function evaluate() {
    if (finished) return;
    const s = steps[idx];
    const pts = stepPoints(idx);
    if (!pts.length) return;
    const covered = s.samples.every((smp) => coverage(smp, pts) >= cfg.thr);
    const prec = precision(s.samples.flat(), pts);
    if (covered && prec >= 0.5) {
      completeStep();
    } else if (pts.length > 30 && prec < 0.35) {
      // scribbling – wipe this step so they can try again
      oops();
      shake();
      setTimeout(() => api.clearStep(), 650);
    } else if (pts.length > 12 && !covered) {
      shake();
    }
  }

  function shake() {
    gCur.classList.remove('shake');
    void gCur.getBoundingClientRect();
    gCur.classList.add('shake');
  }

  function sparkle(x, y) {
    const emojis = ['⭐', '✨', '🌟', '💫'];
    for (let i = 0; i < 7; i++) {
      const sp = document.createElement('span');
      sp.className = 'spark';
      sp.textContent = emojis[i % emojis.length];
      sp.style.left = `${(x / vbW) * 100}%`;
      sp.style.top = `${(y / vbH) * 100}%`;
      sp.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
      sp.style.setProperty('--dy', `${-30 - Math.random() * 110}px`);
      fx.appendChild(sp);
      setTimeout(() => sp.remove(), 1000);
    }
  }

  function revealFill(i) {
    fillEls.get(i)?.classList.add('on');
  }

  function completeStep(skipped = false) {
    clearTimeout(advanceTimer);
    if (!paper) revealFill(idx);
    const pts = stepPoints(idx);
    const last = pts[pts.length - 1] || steps[idx].samples[0][0];
    if (!skipped) { ding(); sparkle(last.x, last.y); }
    gCur.classList.add('ok');
    const done = idx;
    advanceTimer = setTimeout(() => {
      if (destroyed) return;
      gCur.classList.remove('ok');
      if (done + 1 >= steps.length) {
        finished = true;
        if (paper) fillEls.forEach((g) => g.classList.add('on'));
        showStep();
        o.onComplete?.();
      } else {
        idx = done + 1;
        showStep();
      }
    }, skipped ? 60 : 520);
  }

  // ---------- pointer input ----------
  const toVB = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * vbW, y: ((e.clientY - r.top) / r.height) * vbH };
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (active || destroyed || paper) return;
    if (!finished && advanceTimer && gCur.classList.contains('ok')) return; // celebrating
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const stroke = { step: finished ? -1 : idx, color: finished ? (color === 'auto' ? RAINBOW[strokes.length % 6] : color) : inkColor(idx), pts: [toVB(e)] };
    strokes.push(stroke);
    active = { id: e.pointerId, stroke };
    paintStroke(ctx, stroke, scale);
    stage.classList.add('drawing');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!active || e.pointerId !== active.id) return;
    e.preventDefault();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events.length ? events : [e]) active.stroke.pts.push(toVB(ev));
    redraw();
  });
  const end = (e) => {
    if (!active || e.pointerId !== active.id) return;
    active = null;
    stage.classList.remove('drawing');
    evaluate();
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- public API ----------
  const api = {
    get index() { return idx; },
    get total() { return steps.length; },
    get finished() { return finished; },
    get step() { return steps[Math.min(idx, steps.length - 1)]; },
    setColor(c) { color = c; },
    setPaper(on) {
      paper = on;
      canvas.style.pointerEvents = on ? 'none' : '';
      stage.classList.toggle('paper', on);
      api.restart();
    },
    /** wipe what was drawn for the current step */
    clearStep() {
      strokes = strokes.filter((s) => s.step !== (finished ? -1 : idx));
      redraw();
    },
    /** go back one step and redo it */
    back() {
      clearTimeout(advanceTimer);
      gCur.classList.remove('ok');
      const target = finished ? steps.length - 1 : idx - 1;
      if (target < 0) { api.clearStep(); return; }
      strokes = strokes.filter((s) => s.step < target && s.step !== -1);
      for (let i = target; i < steps.length; i++) fillEls.get(i)?.classList.remove('on');
      finished = false;
      idx = target;
      redraw();
      showStep();
    },
    /** let the grown-up/child skip a tricky step */
    skip() {
      if (finished) return;
      completeStep(true);
    },
    /** replay the "watch me" animation */
    hint: playDemo,
    /** clear everything and start again */
    restart() {
      clearTimeout(advanceTimer);
      strokes = [];
      finished = false;
      idx = 0;
      fillEls.forEach((g) => g.classList.remove('on'));
      gCur.classList.remove('ok');
      redraw();
      showStep();
    },
    /** PNG of the finished picture (colour + the child's lines) */
    async toBlob() {
      const size = 1200;
      const h = Math.round(size * (vbH / vbW));
      const out = document.createElement('canvas');
      out.width = size; out.height = h;
      const c = out.getContext('2d');
      c.fillStyle = '#fffdf6';
      c.fillRect(0, 0, size, h);
      const clone = svg.cloneNode(true);
      clone.querySelector('.current')?.remove();
      clone.querySelector('.ghosts')?.remove();
      clone.setAttribute('xmlns', NS);
      clone.setAttribute('width', size);
      clone.setAttribute('height', h);
      const on = [...svg.querySelectorAll('.reveal')].map((g) => g.classList.contains('on'));
      clone.querySelectorAll('.reveal').forEach((g, i) => { g.style.opacity = on[i] ? '1' : '0'; });
      clone.querySelectorAll('.fill-line').forEach((p) => {
        p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#222'); p.setAttribute('stroke-width', '3');
        p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
      });
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
      await new Promise((res) => {
        const img = new Image();
        img.onload = () => { c.drawImage(img, 0, 0, size, h); res(); };
        img.onerror = res;
        img.src = url;
      });
      URL.revokeObjectURL(url);
      strokes.forEach((s) => paintStroke(c, s, size / vbW));
      return new Promise((res) => out.toBlob(res, 'image/png'));
    },
    destroy() {
      destroyed = true;
      clearTimeout(advanceTimer);
      ro.disconnect();
    },
  };

  showStep();
  requestAnimationFrame(fit);
  return api;
}
