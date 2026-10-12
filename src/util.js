// Small helpers shared by several screens.

export const PALETTE16 = ['#ffffff', '#222222', '#e53935', '#fb8c00', '#f9d71c', '#a3d63a', '#43a047', '#12b5b0',
  '#1e88e5', '#283593', '#8e24aa', '#ec407a', '#8d5524', '#9e9e9e', '#f4c9a0', '#ff8a80'];

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const sample = (arr, n) => shuffle(arr).slice(0, n);

/** Keep `el` as large as possible inside `host` at aspect ratio `ar` (w/h). Returns a disconnect fn. */
export function fitBox(host, el, ar) {
  const fit = () => {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let w = r.width;
    let h = w / ar;
    if (h > r.height) { h = r.height; w = h * ar; }
    el.style.width = `${Math.floor(w)}px`;
    el.style.height = `${Math.floor(h)}px`;
  };
  const ro = new ResizeObserver(fit);
  ro.observe(host);
  fit();
  return () => ro.disconnect();
}

/** Render a standalone SVG string to a PNG blob. */
export async function svgToPng(svgString, w, h, bg = '#fffdf6') {
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const c = out.getContext('2d');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }));
  await new Promise((res) => {
    const img = new Image();
    img.onload = () => { c.drawImage(img, 0, 0, w, h); res(); };
    img.onerror = res;
    img.src = url;
  });
  URL.revokeObjectURL(url);
  return new Promise((res) => out.toBlob(res, 'image/png'));
}

/** Share (iPad share sheet) or download a PNG. */
export async function savePng(blob, name) {
  if (!blob) return;
  const file = new File([blob], `${name}.png`, { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
  } catch { return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** Palette buttons. `onPick(colour)`. Returns the container's html + a wire function. */
export function paletteHtml(selected = '#e53935') {
  return PALETTE16.map((c) => `<button class="swatch ${c === selected ? 'sel' : ''}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('');
}
export function wirePalette(el, onPick) {
  el.onclick = (e) => {
    const b = e.target.closest('.swatch');
    if (!b) return;
    el.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('sel', s === b));
    onPick(b.dataset.c);
  };
}
