// Original cartoon animals and everyday things (same step format as drawings.js).
import { c, e, rect } from './shapes.js';

const petals = (cx, cy, dist, r, n) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return c(Math.round(cx + dist * Math.cos(a)), Math.round(cy + dist * Math.sin(a)), r);
  });

export const MORE = [
  // ===== Cute Animals =====
  {
    id: 'cat', title: 'Cat', group: 'animals',
    steps: [
      { say: 'Draw a big round head.', paths: [c(200, 230, 110)], fill: '#f6a24a' },
      { say: 'Draw two pointy ears.', paths: ['M105 170L100 60L180 125', 'M295 170L300 60L220 125'], fill: '#e8892b', z: -1 },
      { say: 'Draw two eyes.', paths: [c(160, 215, 12), c(240, 215, 12)], fill: '#2b2b3a' },
      { say: 'Draw a little triangle nose.', paths: ['M188 245H212L200 260Z'], fill: '#ff8fa3' },
      { say: 'Draw a happy mouth.', paths: ['M200 260Q188 285 165 275', 'M200 260Q212 285 235 275'] },
      { say: 'Draw whiskers!', paths: ['M70 240L135 255', 'M70 290L135 272', 'M330 240L265 255', 'M330 290L265 272'] },
    ],
  },
  {
    id: 'dog', title: 'Puppy', group: 'animals',
    steps: [
      { say: 'Draw a big round head.', paths: [e(200, 235, 100, 105)], fill: '#c8935a' },
      { say: 'Draw two floppy ears.', paths: ['M118 160C70 150 55 250 90 290C112 280 122 220 122 170', 'M282 160C330 150 345 250 310 290C288 280 278 220 278 170'], fill: '#8a5a2b', z: -1 },
      { say: 'Draw a round snout.', paths: [e(200, 280, 52, 38)], fill: '#f3d9b5' },
      { say: 'Draw a big black nose.', paths: [e(200, 262, 20, 13)], fill: '#2b2b3a' },
      { say: 'Draw two eyes.', paths: [c(160, 205, 12), c(240, 205, 12)], fill: '#2b2b3a' },
      { say: 'Draw a smile and a tongue.', paths: ['M200 275V292Q180 312 162 298', 'M200 292Q220 312 238 298'] },
    ],
  },
  {
    id: 'fish', title: 'Fish', group: 'animals',
    steps: [
      { say: 'Draw a big oval body.', paths: [e(170, 200, 120, 80)], fill: '#4dabf7' },
      { say: 'Draw a triangle tail.', paths: ['M285 200L365 135V265Z'], fill: '#1e6fe0', z: -1 },
      { say: 'Draw one big eye.', paths: [c(110, 185, 16)], fill: '#ffffff' },
      { say: 'Draw a dot for the pupil.', paths: [c(107, 185, 6)], fill: '#2b2b3a' },
      { say: 'Draw a curvy fin on top.', paths: ['M150 125Q185 75 225 125'] },
      { say: 'Draw a little smile.', paths: ['M52 215Q70 228 90 218'] },
      { say: 'Draw two curvy scales.', paths: ['M175 165Q205 200 175 235', 'M225 165Q255 200 225 235'] },
    ],
  },
  {
    id: 'bird', title: 'Little Bird', group: 'animals',
    steps: [
      { say: 'Draw a big round body.', paths: [c(200, 230, 100)], fill: '#ffd23f' },
      { say: 'Draw a wing.', paths: ['M215 205C285 200 300 275 240 305C220 275 208 240 215 205Z'], fill: '#f5a623' },
      { say: 'Draw a pointy beak.', paths: ['M118 200L62 222L118 244Z'], fill: '#ff8a3d' },
      { say: 'Draw one eye.', paths: [c(160, 192, 13)], fill: '#2b2b3a' },
      { say: 'Draw two feathers on top.', paths: ['M185 132Q175 95 160 84', 'M215 132Q225 95 242 84'] },
      { say: 'Draw two skinny legs.', paths: ['M170 328V362H145', 'M230 328V362H255'] },
    ],
  },
  {
    id: 'butterfly', title: 'Butterfly', group: 'animals',
    steps: [
      { say: 'Draw the two top wings.', paths: ['M186 190C130 90 50 110 70 190C80 225 150 225 186 200Z', 'M214 190C270 90 350 110 330 190C320 225 250 225 214 200Z'], fill: '#ff6fa8' },
      { say: 'Draw the two bottom wings.', paths: ['M186 222C140 232 100 290 140 322C175 337 195 277 190 232Z', 'M214 222C260 232 300 290 260 322C225 337 205 277 210 232Z'], fill: '#ffb347' },
      { say: 'Draw a long skinny body.', paths: [e(200, 215, 14, 72)], fill: '#5a3b2e' },
      { say: 'Draw two curly antennae.', paths: ['M195 145Q180 110 160 100', 'M205 145Q220 110 240 100'] },
      { say: 'Draw a dot on each wing.', paths: [c(115, 160, 14), c(285, 160, 14)], fill: '#ffffff' },
    ],
  },
  {
    id: 'turtle', title: 'Turtle', group: 'animals',
    steps: [
      { say: 'Draw a big round shell.', paths: ['M70 280C70 150 330 150 330 280Z'], fill: '#3fae5a' },
      { say: 'Draw a round head.', paths: [c(355, 245, 32)], fill: '#8fd36b', z: -1 },
      { say: 'Draw two stumpy legs.', paths: ['M120 280V335H170V280', 'M230 280V335H280V280'], fill: '#8fd36b', z: -1 },
      { say: 'Draw a shape on the shell.', paths: ['M170 215H230L252 248L230 272H170L148 248Z'], fill: '#2e8b46' },
      { say: 'Draw an eye.', paths: [c(362, 238, 6)], fill: '#2b2b3a' },
      { say: 'Draw a happy smile.', paths: ['M345 262Q360 275 376 260'] },
    ],
  },
  {
    id: 'rabbit', title: 'Bunny', group: 'animals',
    steps: [
      { say: 'Draw a round head.', paths: [e(200, 255, 92, 85)], fill: '#f2e9e1' },
      { say: 'Draw two long ears.', paths: [e(155, 115, 28, 80), e(245, 115, 28, 80)], fill: '#f2e9e1', z: -1 },
      { say: 'Draw pink inside the ears.', paths: [e(155, 120, 12, 52), e(245, 120, 12, 52)], fill: '#ffb6c8' },
      { say: 'Draw two eyes.', paths: [c(160, 240, 12), c(240, 240, 12)], fill: '#2b2b3a' },
      { say: 'Draw a tiny nose.', paths: ['M188 266H212L200 280Z'], fill: '#ff8fa3' },
      { say: 'Draw a smile.', paths: ['M200 280Q185 300 168 290', 'M200 280Q215 300 232 290'] },
    ],
  },
  {
    id: 'penguin', title: 'Penguin', group: 'animals',
    steps: [
      { say: 'Draw a big oval body.', paths: [e(200, 220, 95, 135)], fill: '#2b2b3a' },
      { say: 'Draw a white tummy.', paths: [e(200, 250, 65, 100)], fill: '#ffffff' },
      { say: 'Draw two eyes.', paths: [c(168, 150, 13), c(232, 150, 13)], fill: '#ffffff' },
      { say: 'Draw dots for pupils.', paths: [c(170, 152, 5), c(230, 152, 5)], fill: '#2b2b3a' },
      { say: 'Draw a pointy beak.', paths: ['M178 172H222L200 205Z'], fill: '#ff9f1c' },
      { say: 'Draw two flippers.', paths: ['M112 190C70 230 70 290 98 302C118 270 124 230 118 195', 'M288 190C330 230 330 290 302 302C282 270 276 230 282 195'], fill: '#2b2b3a', z: -1 },
      { say: 'Draw two orange feet.', paths: [e(160, 362, 32, 12), e(240, 362, 32, 12)], fill: '#ff9f1c' },
    ],
  },
  {
    id: 'pig', title: 'Piggy', group: 'animals',
    steps: [
      { say: 'Draw a big round head.', paths: [c(200, 215, 115)], fill: '#ffb3c1' },
      { say: 'Draw two floppy ears.', paths: ['M108 150L88 78L165 112', 'M292 150L312 78L235 112'], fill: '#ff8fa6', z: -1 },
      { say: 'Draw two eyes.', paths: [c(155, 190, 12), c(245, 190, 12)], fill: '#2b2b3a' },
      { say: 'Draw a big oval snout.', paths: [e(200, 255, 55, 40)], fill: '#ff8fa6' },
      { say: 'Draw two tiny nostrils.', paths: [c(182, 255, 7), c(218, 255, 7)], fill: '#8a2a44' },
      { say: 'Draw a smile.', paths: ['M150 305Q200 335 250 305'] },
    ],
  },

  // ===== Fun Things =====
  {
    id: 'house', title: 'House', group: 'things',
    steps: [
      { say: 'Draw a big square for the house.', paths: [rect(95, 190, 210, 160)], fill: '#ffd6a5' },
      { say: 'Draw a triangle roof.', paths: ['M65 205L200 85L335 205Z'], fill: '#e5383b' },
      { say: 'Draw a tall door.', paths: [rect(175, 255, 50, 95)], fill: '#8d5524' },
      { say: 'Draw two square windows.', paths: [rect(118, 215, 40, 40), rect(242, 215, 40, 40)], fill: '#bde0fe' },
      { say: 'Draw a little door knob.', paths: [c(214, 305, 5)], fill: '#ffd23f' },
    ],
  },
  {
    id: 'car', title: 'Car', group: 'things',
    steps: [
      { say: 'Draw a long rectangle for the car.', paths: [rect(50, 240, 300, 60)], fill: '#e63946' },
      { say: 'Draw the roof on top.', paths: ['M110 240L145 175H255L290 240'], fill: '#ff6b6b' },
      { say: 'Draw two windows.', paths: ['M125 238L152 190H190V238Z', 'M212 238V190H248L275 238Z'], fill: '#bde0fe' },
      { say: 'Draw two big wheels.', paths: [c(125, 305, 36), c(275, 305, 36)], fill: '#2b2b3a' },
      { say: 'Draw a small circle in each wheel.', paths: [c(125, 305, 14), c(275, 305, 14)], fill: '#cfd4da' },
    ],
  },
  {
    id: 'icecream', title: 'Ice Cream', group: 'things',
    steps: [
      { say: 'Draw a triangle cone.', paths: ['M135 215L200 375L265 215Z'], fill: '#e9b872' },
      { say: 'Draw a big round scoop.', paths: [c(200, 195, 68)], fill: '#ff9ecf', z: 5 },
      { say: 'Draw another scoop on top.', paths: [c(200, 120, 52)], fill: '#8ed1fc' },
      { say: 'Draw a cherry!', paths: [c(200, 55, 16)], fill: '#e63946' },
      { say: 'Draw criss-cross lines on the cone.', paths: ['M160 260L225 335', 'M240 260L175 335'] },
    ],
  },
  {
    id: 'apple', title: 'Apple', group: 'things',
    steps: [
      { say: 'Draw a big round apple.', paths: ['M200 130C130 80 60 140 70 230C80 320 150 365 200 345C250 365 320 320 330 230C340 140 270 80 200 130Z'], fill: '#e63946' },
      { say: 'Draw a stem.', paths: ['M200 130Q200 92 215 65'] },
      { say: 'Draw a leaf.', paths: ['M210 100C235 65 280 65 290 75C275 112 235 118 210 100Z'], fill: '#43a047' },
      { say: 'Draw a little shine.', paths: ['M115 190Q118 160 145 145'] },
    ],
  },
  {
    id: 'flower', title: 'Flower', group: 'things',
    steps: [
      { say: 'Draw six round petals.', paths: petals(200, 140, 62, 36, 6), fill: '#ff6fa8', z: -1 },
      { say: 'Draw a circle in the middle.', paths: [c(200, 140, 36)], fill: '#ffd23f' },
      { say: 'Draw a long stem.', paths: ['M200 215V370'] },
      { say: 'Draw a leaf.', paths: ['M200 310C240 275 285 285 295 305C265 338 222 338 200 310Z'], fill: '#43a047' },
    ],
  },
  {
    id: 'tree', title: 'Tree', group: 'things',
    steps: [
      { say: 'Draw a tall trunk.', paths: [rect(172, 240, 56, 125)], fill: '#8d5524' },
      { say: 'Draw a big round top.', paths: [c(200, 165, 100)], fill: '#43a047', z: 5 },
      { say: 'Draw three red apples.', paths: [c(160, 150, 14), c(235, 130, 14), c(215, 200, 14)], fill: '#e63946' },
      { say: 'Draw some grass.', paths: ['M60 365H340'] },
    ],
  },
  {
    id: 'rocket', title: 'Rocket', group: 'things',
    steps: [
      { say: 'Draw a long pointy body.', paths: ['M200 35C265 90 275 175 262 265H138C125 175 135 90 200 35Z'], fill: '#f1f1f1' },
      { say: 'Draw a round window.', paths: [c(200, 150, 32)], fill: '#74c0fc' },
      { say: 'Draw two fins.', paths: ['M140 215L88 295L140 272', 'M260 215L312 295L260 272'], fill: '#e63946', z: -1 },
      { say: 'Draw fiery flames!', paths: ['M165 265Q200 380 235 265Z'], fill: '#ffa62b' },
      { say: 'Draw a stripe.', paths: ['M138 235H262'] },
    ],
  },
];
