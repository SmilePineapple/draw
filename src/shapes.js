// Tiny path builders shared by the drawing files.
export const c = (cx, cy, r) => `M${cx} ${cy - r}a${r} ${r} 0 1 0 0 ${2 * r}a${r} ${r} 0 1 0 0 ${-2 * r}z`;
export const e = (cx, cy, rx, ry) => `M${cx} ${cy - ry}a${rx} ${ry} 0 1 0 0 ${2 * ry}a${rx} ${ry} 0 1 0 0 ${-2 * ry}z`;
export const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;
export const star = (cx, cy, R, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const rad = i % 2 ? r : R;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
};

