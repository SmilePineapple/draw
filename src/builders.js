// Builders for characters that share a shape (Bluey's family, PJ Masks heroes).
import { c, e, star } from './shapes.js';


export function blueyLike({ id, title, head, ear, muzzle }) {
  return {
    id, title, group: 'bluey',
    steps: [
      { say: 'Draw a big round head.', paths: ['M90 195C80 115 140 82 200 82C260 82 320 115 310 195C305 275 260 332 200 332C140 332 95 275 90 195Z'], fill: head },
      { say: 'Draw two pointy ears.', paths: ['M110 130L52 42L160 92', 'M290 130L348 42L240 92'], fill: ear, z: -1 },
      { say: 'Draw a round tummy-coloured snout.', paths: [e(200, 265, 68, 52)], fill: muzzle },
      { say: 'Draw a little nose.', paths: [e(200, 228, 26, 17)], fill: '#2b2b3a' },
      { say: 'Draw two eyes.', paths: [c(152, 175, 13), c(248, 175, 13)], fill: '#2b2b3a' },
      { say: 'Draw a big smile!', paths: ['M200 245V268', 'M168 272Q200 302 232 272'] },
    ],
  };
}

export function pjHero({ id, title, cowl, ears, nose, skin = '#f1c9a5', extra = [] }) {
  return {
    id, title, group: 'pjmasks',
    steps: [
      { say: 'Draw a round face.', paths: [c(200, 225, 112)], fill: skin },
      { say: 'Draw the hero mask.', paths: ['M88 200C84 140 130 104 200 104C270 104 316 140 312 200C300 232 262 226 200 226C138 226 100 232 88 200Z'], fill: cowl },
      { say: 'Draw the ears.', paths: ears, fill: cowl, z: -1 },
      { say: 'Draw two big eyes.', paths: [e(150, 180, 28, 22), e(250, 180, 28, 22)], fill: '#ffffff' },
      { say: 'Draw little black dots in the eyes.', paths: [c(154, 182, 8), c(246, 182, 8)], fill: '#222' },
      { say: nose.say, paths: [nose.d], fill: nose.fill },
      { say: 'Draw a happy smile!', paths: ['M165 275Q200 305 235 275'] },
      ...extra,
    ],
  };
}

