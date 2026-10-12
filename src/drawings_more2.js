// More characters: Marvel, Bluey's family, Star Wars and PJ Masks friends (original simple sketches).
import { c, e, rect, star } from './shapes.js';
import { blueyLike, pjHero } from './builders.js';

export const MORE2 = [
  // ===== Marvel =====
  {
    id: 'panther', title: 'Black Panther', group: 'marvel',
    steps: [
      { say: 'Draw a big rounded mask.', paths: ['M200 50C275 50 320 110 322 190C324 270 290 340 250 365H150C110 340 76 270 78 190C80 110 125 50 200 50Z'], fill: '#2b2b3a' },
      { say: 'Draw two small pointy ears.', paths: ['M105 115L92 50L152 88', 'M295 115L308 50L248 88'], fill: '#2b2b3a', z: -1 },
      { say: 'Draw two angry white eyes.', paths: ['M108 182L178 196L172 218L112 210Z', 'M292 182L222 196L228 218L288 210Z'], fill: '#ffffff' },
      { say: 'Draw a little triangle nose.', paths: ['M188 226H212L200 266Z'], fill: '#55556b' },
      { say: 'Draw two silver stripes.', paths: ['M128 98L140 92L182 140L170 148Z', 'M272 98L260 92L218 140L230 148Z'], fill: '#cfd4da' },
    ],
  },
  {
    id: 'thor', title: 'Thor', group: 'marvel',
    steps: [
      { say: 'Draw a round face.', paths: [c(200, 235, 100)], fill: '#f5cba7' },
      { say: 'Draw long golden hair on top.', paths: ['M98 235C80 120 130 78 200 78C270 78 320 120 302 235C298 175 270 140 200 140C130 140 102 175 98 235Z'], fill: '#f2c94c' },
      { say: 'Draw two silver wings on the helmet.', paths: ['M108 150L38 98L112 128', 'M292 150L362 98L288 128'], fill: '#cfd4da', z: -1 },
      { say: 'Draw two eyes.', paths: [c(160, 225, 11), c(240, 225, 11)], fill: '#2b2b3a' },
      { say: 'Draw a big golden beard.', paths: ['M108 262C115 335 160 358 200 358C240 358 285 335 292 262C262 300 138 300 108 262Z'], fill: '#f2c94c' },
      { say: 'Draw a big smile.', paths: ['M168 292Q200 312 232 292'] },
    ],
  },
  {
    id: 'captain', title: 'Captain America', group: 'marvel',
    steps: [
      { say: 'Draw a round face.', paths: [c(200, 238, 104)], fill: '#f5cba7' },
      { say: 'Draw the blue hood.', paths: ['M92 228C84 120 135 60 200 60C265 60 316 120 308 228C290 192 255 178 200 178C145 178 110 192 92 228Z'], fill: '#1d4ed8' },
      { say: 'Draw a white star on the hood.', paths: [star(200, 118, 24, 10)], fill: '#ffffff' },
      { say: 'Draw two eyes.', paths: [c(160, 225, 11), c(240, 225, 11)], fill: '#2b2b3a' },
      { say: 'Draw a big smile.', paths: ['M162 285Q200 315 238 285'] },
    ],
  },
  {
    id: 'groot', title: 'Groot', group: 'marvel',
    steps: [
      { say: 'Draw a bumpy tree head.', paths: ['M120 125C108 82 150 70 172 88C190 60 232 64 242 92C272 76 304 92 286 128C302 172 296 282 270 332C250 366 150 366 130 332C104 282 110 172 120 125Z'], fill: '#8d5a2b' },
      { say: 'Draw two green leaves on top.', paths: ['M190 88C170 42 208 22 232 36C244 62 222 88 190 88Z', 'M240 92C262 60 296 62 306 78C290 104 262 108 240 92Z'], fill: '#43a047' },
      { say: 'Draw two eyes.', paths: [c(165, 215, 13), c(235, 215, 13)], fill: '#1b1b1b' },
      { say: 'Draw two curly bark lines.', paths: ['M150 150Q175 175 152 205', 'M252 150Q227 175 250 205'] },
      { say: 'Draw a happy smile.', paths: ['M165 285Q200 312 235 285'] },
    ],
  },

  // ===== Bluey's family =====
  blueyLike({ id: 'bandit', title: 'Bandit', head: '#3d6fa8', ear: '#23456f', muzzle: '#e9c9a0' }),
  blueyLike({ id: 'chilli', title: 'Chilli', head: '#d9824f', ear: '#9a4f2b', muzzle: '#f3d8b0' }),
  blueyLike({ id: 'muffin', title: 'Muffin', head: '#7bbcec', ear: '#3f80c2', muzzle: '#f6e2c4' }),
  blueyLike({ id: 'socks', title: 'Socks', head: '#eea46b', ear: '#c0693a', muzzle: '#faeacb' }),

  // ===== Star Wars =====
  {
    id: 'chewie', title: 'Chewbacca', group: 'starwars',
    steps: [
      { say: 'Draw a big furry head.', paths: ['M200 62C290 62 330 140 320 232C312 312 270 362 200 362C130 362 88 312 80 232C70 140 110 62 200 62Z'], fill: '#8a5a2b' },
      { say: 'Draw spiky fur on top.', paths: ['M108 125L125 70L158 108L200 52L242 108L275 70L292 125'], fill: '#8a5a2b', z: -1 },
      { say: 'Draw a big muzzle.', paths: [e(200, 292, 72, 52)], fill: '#5c3a1e' },
      { say: 'Draw two eyes.', paths: [c(155, 200, 15), c(245, 200, 15)], fill: '#ffffff' },
      { say: 'Draw dots for pupils.', paths: [c(158, 203, 6), c(242, 203, 6)], fill: '#1b1b1b' },
      { say: 'Draw a nose.', paths: [e(200, 240, 24, 15)], fill: '#1b1b1b' },
      { say: 'Draw a line for the mouth.', paths: ['M165 300Q200 320 235 300'] },
    ],
  },
  {
    id: 'grogu', title: 'Grogu', group: 'starwars',
    steps: [
      { say: 'Draw a round head.', paths: ['M200 98C265 98 288 160 282 215C276 268 246 298 200 298C154 298 124 268 118 215C112 160 135 98 200 98Z'], fill: '#a7c96b' },
      { say: 'Draw two big floppy ears.', paths: ['M128 180C82 170 38 190 8 242C58 258 105 248 126 228', 'M272 180C318 170 362 190 392 242C342 258 295 248 274 228'], fill: '#a7c96b', z: -1 },
      { say: 'Draw a little brown robe.', paths: ['M122 296C108 330 118 366 150 382H250C282 366 292 330 278 296Z'], fill: '#c9a27a' },
      { say: 'Draw two huge round eyes.', paths: [c(165, 205, 28), c(235, 205, 28)], fill: '#1a1a2e' },
      { say: 'Draw a little shiny dot in each eye.', paths: [c(173, 196, 8), c(243, 196, 8)], fill: '#ffffff' },
      { say: 'Draw a teeny smile.', paths: ['M185 262Q200 274 215 262'] },
    ],
  },
  {
    id: 'boba', title: 'Boba Fett', group: 'starwars',
    steps: [
      { say: 'Draw a big helmet.', paths: ['M200 45C275 45 318 100 318 180V300C318 332 300 360 270 360H130C100 360 82 332 82 300V180C82 100 125 45 200 45Z'], fill: '#5a7d4a' },
      { say: 'Draw a T-shaped visor.', paths: ['M104 168H296V204H232V304H168V204H104Z'], fill: '#1a1a22' },
      { say: 'Draw a red stripe on the cheek.', paths: [rect(98, 222, 44, 86)], fill: '#c0392b' },
      { say: 'Draw a tall antenna.', paths: ['M318 130V52'] },
      { say: 'Draw two dents on top.', paths: ['M150 90L172 128', 'M250 90L228 128'] },
    ],
  },

  // ===== PJ Masks friends =====
  pjHero({
    id: 'luna', title: 'Luna Girl', cowl: '#7e3ff2',
    ears: ['M96 150C58 132 58 78 100 68C132 74 136 112 132 138', 'M304 150C342 132 342 78 300 68C268 74 264 112 268 138'],
    nose: { say: 'Draw a tiny nose.', d: 'M200 238L190 252H210Z', fill: '#ff9db0' },
    extra: [{ say: 'Draw a moon on the forehead!', paths: ['M214 112A26 26 0 1 0 214 160A19 19 0 1 1 214 112Z'], fill: '#ffe066' }],
  }),
  pjHero({
    id: 'ninja', title: 'Night Ninja', cowl: '#3a3f66',
    ears: ['M110 140L84 84L150 112', 'M290 140L316 84L250 112'],
    nose: { say: 'Draw a tiny nose.', d: 'M200 238L190 252H210Z', fill: '#e5b99a' },
    skin: '#f0e0cf',
    extra: [{ say: 'Draw a sneaky star on the forehead!', paths: [star(200, 140, 18, 8)], fill: '#c4b5fd' }],
  }),
];
