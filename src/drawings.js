// Step-by-step drawings. Every drawing lives in a 400x400 box.
// A step = { say, paths:[svg path d, ...], fill?, z? }
//   say   – read aloud and shown to the child
//   paths – what the child traces in this step (all paths must be traced to finish the step)
//   fill  – colour that fades in underneath once the step is traced (closed shapes)
//   z     – paint order of the fill (default: step order). Use negative to tuck behind earlier shapes.
// These are simple, original, hand-built vector sketches inspired by the characters.

import { c, e, rect, star } from './shapes.js';
import { MORE } from './drawings_more.js';
import { MORE2 } from './drawings_more2.js';
import { blueyLike, pjHero } from './builders.js';

export const GROUPS = [
  { id: 'marvel', name: 'Marvel Heroes', color: '#e23636', bg: '#ffe3e3', emoji: '🦸' },
  { id: 'bluey', name: 'Bluey', color: '#3b8fd9', bg: '#dff0ff', emoji: '🐾' },
  { id: 'starwars', name: 'Star Wars', color: '#2b2f4a', bg: '#e3e6ff', emoji: '✨' },
  { id: 'pjmasks', name: 'PJ Masks', color: '#7a3fd1', bg: '#efe3ff', emoji: '🌙' },
  { id: 'animals', name: 'Cute Animals', color: '#e8590c', bg: '#fff0e0', emoji: '🐾' },
  { id: 'things', name: 'Fun Things', color: '#0b7285', bg: '#d9f5f8', emoji: '🚀' },
  { id: 'easy', name: 'Easy Peasy', color: '#18a35a', bg: '#dcf8e6', emoji: '🌈' },
];

// ---------- the drawings ----------

export const DRAWINGS = [
  ...MORE,
  ...MORE2,
  // ===== Marvel =====
  {
    id: 'spidey', title: 'Spidey', group: 'marvel',
    steps: [
      { say: 'Draw a big round head.', paths: ['M200 50C285 50 330 120 330 200C330 300 270 360 200 360C130 360 70 300 70 200C70 120 115 50 200 50Z'], fill: '#d62828' },
      { say: 'Draw two big eyes.', paths: ['M95 170C120 150 175 175 185 215C150 235 105 215 95 170Z', 'M305 170C280 150 225 175 215 215C250 235 295 215 305 170Z'], fill: '#ffffff' },
      { say: 'Draw a line down the middle.', paths: ['M200 52V358'] },
      { say: 'Draw curvy web lines!', paths: ['M90 125Q200 85 310 125', 'M85 270Q200 330 315 270', 'M125 325Q200 355 275 325'] },
    ],
  },
  {
    id: 'ironman', title: 'Iron Man', group: 'marvel',
    steps: [
      { say: 'Draw a big helmet.', paths: ['M200 40C290 40 325 100 320 190C318 260 300 310 270 350L240 378H160L130 350C100 310 82 260 80 190C75 100 110 40 200 40Z'], fill: '#c62828' },
      { say: 'Draw the golden face plate.', paths: ['M122 105H278C288 185 275 255 250 312L232 338H168L150 312C125 255 112 185 122 105Z'], fill: '#f5c542' },
      { say: 'Draw two glowing eyes.', paths: ['M138 172L186 184L182 204L140 194Z', 'M262 172L214 184L218 204L260 194Z'], fill: '#e6fbff' },
      { say: 'Draw a nose line and a mouth line.', paths: ['M200 205V262', 'M168 296H232'] },
    ],
  },
  {
    id: 'shield', title: "Captain America's Shield", group: 'marvel',
    steps: [
      { say: 'Draw a big circle.', paths: [c(200, 200, 150)], fill: '#d62828' },
      { say: 'Draw a smaller circle inside.', paths: [c(200, 200, 118)], fill: '#ffffff' },
      { say: 'Draw another circle.', paths: [c(200, 200, 86)], fill: '#d62828' },
      { say: 'Draw a little circle in the middle.', paths: [c(200, 200, 54)], fill: '#1d4ed8' },
      { say: 'Draw a star!', paths: [star(200, 205, 42, 17)], fill: '#ffffff' },
    ],
  },
  {
    id: 'hulk', title: 'Hulk', group: 'marvel',
    steps: [
      { say: 'Draw a big square-ish face.', paths: ['M105 115C105 70 295 70 295 115L306 250C306 330 262 362 200 362C138 362 94 330 94 250Z'], fill: '#5dbb3f' },
      { say: 'Draw messy hair on top.', paths: ['M102 135C92 62 148 38 200 52C252 38 308 62 298 135C272 102 240 88 200 90C160 88 128 102 102 135Z'], fill: '#2b1d3a' },
      { say: 'Draw two angry eyebrows.', paths: ['M125 158L188 182', 'M275 158L212 182'] },
      { say: 'Draw two eyes.', paths: [c(158, 202, 15), c(242, 202, 15)], fill: '#ffffff' },
      { say: 'Draw little dots for pupils.', paths: [c(162, 205, 6), c(238, 205, 6)], fill: '#111' },
      { say: 'Draw a nose.', paths: ['M200 210V245'] },
      { say: 'Draw a grumpy mouth. Roar!', paths: ['M138 305Q200 265 262 305'] },
    ],
  },
  {
    id: 'hammer', title: "Thor's Hammer", group: 'marvel',
    steps: [
      { say: 'Draw a big rectangle for the hammer head.', paths: [rect(85, 85, 230, 105)], fill: '#9aa5b1' },
      { say: 'Draw the long handle.', paths: ['M180 190V345H220V190'], fill: '#8b5a2b' },
      { say: 'Draw a little circle at the bottom.', paths: [c(200, 365, 16)], fill: '#8b5a2b' },
      { say: 'Draw two stripes on the hammer.', paths: ['M85 118H315', 'M85 160H315'] },
    ],
  },

  // ===== Bluey =====
  blueyLike({ id: 'bluey', title: 'Bluey', head: '#5aa9e6', ear: '#2f6cb3', muzzle: '#f3d8b0' }),
  blueyLike({ id: 'bingo', title: 'Bingo', head: '#f08a4b', ear: '#c4552b', muzzle: '#f7e1bd' }),
  {
    id: 'balloon', title: 'Keepy Uppy Balloon', group: 'bluey',
    steps: [
      { say: 'Draw a big oval balloon.', paths: [e(200, 150, 100, 115)], fill: '#ef476f' },
      { say: 'Draw a tiny triangle for the knot.', paths: ['M200 265L184 290H216Z'], fill: '#ef476f' },
      { say: 'Draw a wiggly string.', paths: ['M200 290C170 322 230 348 200 385'] },
      { say: 'Draw a little shine.', paths: ['M142 100Q150 76 176 68'] },
    ],
  },

  // ===== Star Wars =====
  {
    id: 'vader', title: 'Darth Vader', group: 'starwars',
    steps: [
      { say: 'Draw the round helmet.', paths: ['M200 40C285 40 325 110 322 190V235H78V190C75 110 115 40 200 40Z'], fill: '#3b3b46' },
      { say: 'Draw two big eyes.', paths: ['M102 168C140 160 172 168 186 182L180 218H108Z', 'M298 168C260 160 228 168 214 182L220 218H292Z'], fill: '#101014' },
      { say: 'Draw the mask below.', paths: ['M80 235L132 352H268L320 235'], fill: '#2d2d34' },
      { say: 'Draw a triangle nose.', paths: ['M200 218L180 258H220Z'], fill: '#101014' },
      { say: 'Draw three lines for the mouth.', paths: ['M155 296V340', 'M200 296V340', 'M245 296V340'] },
    ],
  },
  {
    id: 'trooper', title: 'Stormtrooper', group: 'starwars',
    steps: [
      { say: 'Draw a big helmet.', paths: ['M200 40C280 40 320 100 318 180C316 250 290 322 250 352H150C110 322 84 250 82 180C80 100 120 40 200 40Z'], fill: '#f6f6f6' },
      { say: 'Draw two big black eyes.', paths: ['M112 165H180C180 195 170 218 150 226C126 216 112 196 112 165Z', 'M288 165H220C220 195 230 218 250 226C274 216 288 196 288 165Z'], fill: '#15151a' },
      { say: 'Draw a tiny triangle nose.', paths: ['M200 238L188 264H212Z'], fill: '#b8bec8' },
      { say: 'Draw a rectangle for the mouth.', paths: [rect(172, 288, 56, 34)], fill: '#8b93a1' },
      { say: 'Draw two lines on the cheeks.', paths: ['M130 262C140 290 148 310 160 330', 'M270 262C260 290 252 310 240 330'] },
    ],
  },
  {
    id: 'yoda', title: 'Yoda', group: 'starwars',
    steps: [
      { say: 'Draw a round head.', paths: ['M200 90C275 90 295 170 285 240C275 300 240 335 200 335C160 335 125 300 115 240C105 170 125 90 200 90Z'], fill: '#a7c96b' },
      { say: 'Draw two long pointy ears.', paths: ['M124 160C90 138 50 128 14 140C30 188 80 214 122 226', 'M276 160C310 138 350 128 386 140C370 188 320 214 278 226'], fill: '#a7c96b', z: -1 },
      { say: 'Draw two big eyes.', paths: [c(165, 200, 17), c(235, 200, 17)], fill: '#ffffff' },
      { say: 'Draw little dots for pupils.', paths: [c(165, 203, 7), c(235, 203, 7)], fill: '#222' },
      { say: 'Draw wrinkly eyebrows.', paths: ['M132 172Q163 150 190 168', 'M268 172Q237 150 210 168', 'M165 116Q200 106 235 116'] },
      { say: 'Draw a tiny nose and a little smile.', paths: ['M200 222V244', 'M162 288Q200 306 238 288'] },
    ],
  },
  {
    id: 'r2d2', title: 'R2-D2', group: 'starwars',
    steps: [
      { say: 'Draw a half circle for the head.', paths: ['M118 150C118 70 282 70 282 150Z'], fill: '#e9edf2' },
      { say: 'Draw the body.', paths: ['M118 150V318H282V150'], fill: '#e9edf2' },
      { say: 'Draw one round eye.', paths: [c(200, 118, 16)], fill: '#1a1a22' },
      { say: 'Draw a blue rectangle.', paths: [rect(140, 190, 120, 36)], fill: '#2f6fd0' },
      { say: 'Draw a blue circle.', paths: [c(200, 270, 18)], fill: '#2f6fd0' },
      { say: 'Draw two feet.', paths: ['M118 290H82V342H118', 'M282 290H318V342H282'], fill: '#2f6fd0' },
    ],
  },
  {
    id: 'bb8', title: 'BB-8', group: 'starwars',
    steps: [
      { say: 'Draw a big round body.', paths: [c(200, 262, 98)], fill: '#f2f2f2' },
      { say: 'Draw an orange circle.', paths: [c(200, 262, 48)], fill: '#f08a24' },
      { say: 'Draw a half circle for the head.', paths: ['M138 160C138 100 262 100 262 160Z'], fill: '#f2f2f2' },
      { say: 'Draw one eye.', paths: [c(200, 138, 13)], fill: '#111' },
      { say: 'Draw two antennas.', paths: ['M222 112L236 56', 'M190 106V78'] },
    ],
  },
  {
    id: 'deathstar', title: 'Death Star', group: 'starwars',
    steps: [
      { say: 'Draw a giant circle.', paths: [c(200, 200, 150)], fill: '#aeb4bd' },
      { say: 'Draw a line across the middle.', paths: ['M52 200H348'] },
      { say: 'Draw a small circle for the laser.', paths: [c(268, 142, 34)], fill: '#8c939d' },
    ],
  },
  {
    id: 'lightsaber', title: 'Lightsaber', group: 'starwars',
    steps: [
      { say: 'Draw the glowing blade.', paths: ['M186 235V70C186 40 214 40 214 70V235'], fill: '#46e07a' },
      { say: 'Draw the handle.', paths: [rect(178, 235, 44, 135)], fill: '#8d949d' },
      { say: 'Draw a little red button.', paths: [c(200, 272, 10)], fill: '#d33' },
      { say: 'Draw two grip lines.', paths: ['M178 305H222', 'M178 348H222'] },
    ],
  },

  // ===== PJ Masks =====
  pjHero({
    id: 'catboy', title: 'Catboy', cowl: '#2f5bd9',
    ears: ['M100 150L88 50L168 112', 'M300 150L312 50L232 112'],
    nose: { say: 'Draw a tiny cat nose.', d: 'M200 238L188 252H212Z', fill: '#ff8fa3' },
  }),
  pjHero({
    id: 'owlette', title: 'Owlette', cowl: '#d62f3d',
    ears: ['M104 146L92 62L172 112', 'M296 146L308 62L228 112'],
    nose: { say: 'Draw a little beak.', d: 'M200 236L188 250L200 264L212 250Z', fill: '#ffc83d' },
    extra: [{ say: 'Draw a star on the forehead!', paths: [star(200, 140, 18, 8)], fill: '#ffc83d' }],
  }),
  pjHero({
    id: 'gekko', title: 'Gekko', cowl: '#26a65b',
    ears: ['M100 150C62 135 52 98 68 68C100 78 132 100 150 120', 'M300 150C338 135 348 98 332 68C300 78 268 100 250 120'],
    nose: { say: 'Draw two tiny nose dots.', d: 'M192 246h2M206 246h2', fill: null },
    skin: '#e9b98f',
  }),

  // ===== Easy Peasy =====
  {
    id: 'star', title: 'Star', group: 'easy',
    steps: [
      { say: 'Draw a star! Go point to point.', paths: [star(200, 210, 160, 66)], fill: '#ffd23f' },
      { say: 'Draw a happy face.', paths: [c(172, 205, 9), c(228, 205, 9), 'M170 240Q200 268 230 240'] },
    ],
  },
  {
    id: 'heart', title: 'Heart', group: 'easy',
    steps: [
      { say: 'Draw a big heart.', paths: ['M200 345C60 250 60 120 130 100C170 90 195 115 200 135C205 115 230 90 270 100C340 120 340 250 200 345Z'], fill: '#ff5d8f' },
      { say: 'Draw a little shine.', paths: ['M118 140Q125 122 145 118'] },
    ],
  },
  {
    id: 'sun', title: 'Sunshine', group: 'easy',
    steps: [
      { say: 'Draw a big round sun.', paths: [c(200, 200, 90)], fill: '#ffd23f' },
      { say: 'Draw sunshine rays all around.', paths: ['M200 70V30', 'M200 330V370', 'M70 200H30', 'M330 200H370', 'M108 108L80 80', 'M292 292L320 320', 'M292 108L320 80', 'M108 292L80 320'] },
      { say: 'Draw two eyes.', paths: [c(168, 185, 9), c(232, 185, 9)], fill: '#222' },
      { say: 'Draw a big smile!', paths: ['M155 218Q200 270 245 218'] },
    ],
  },
];

export const drawingById = (id) => DRAWINGS.find((d) => d.id === id);
