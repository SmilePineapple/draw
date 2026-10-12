// Word lists shared by the screens and by the voice-clip generator (scripts/audio-texts.mjs).
// No browser APIs in here, so Node can import it.
import { drawingById } from './drawings.js';

export const DEFAULT_WORDS = [
  ['Bluey', '🐶'], ['Bingo', '🐕'], ['Hulk', '💚'], ['Thor', '⚡'], ['Yoda', '🟢'], ['Luke', '🌟'],
  ['Vader', '🖤'], ['Catboy', '🐱'], ['Owlette', '🦉'], ['Gekko', '🦎'], ['Hero', '🦸'], ['Star', '⭐'],
  ['Mum', '💖'], ['Dad', '💙'], ['Love', '❤️'], ['Cat', '🐈'], ['Dog', '🐕'], ['Sun', '☀️'],
  ['Bandit', '🐕'], ['Chilli', '🐕'], ['Muffin', '🐶'], ['Socks', '🐾'], ['Groot', '🌳'], ['Grogu', '💚'],
  ['Chewie', '🤎'], ['Boba', '🎯'], ['Luna', '🌙'], ['Ninja', '🥷'], ['Panther', '🐈‍⬛'],
];

// word -> drawing id (pictures we can show in the games)
export const PICS = [
  ['cat', 'cat'], ['dog', 'dog'], ['pig', 'pig'], ['fish', 'fish'], ['bird', 'bird'], ['star', 'star'], ['sun', 'sun'],
  ['tree', 'tree'], ['house', 'house'], ['car', 'car'], ['apple', 'apple'], ['heart', 'heart'], ['rocket', 'rocket'],
  ['flower', 'flower'], ['turtle', 'turtle'], ['bunny', 'rabbit'], ['penguin', 'penguin'], ['balloon', 'balloon'],
  ['hulk', 'hulk'], ['yoda', 'yoda'], ['bluey', 'bluey'], ['bingo', 'bingo'], ['vader', 'vader'], ['catboy', 'catboy'],
  ['gekko', 'gekko'], ['owlette', 'owlette'], ['groot', 'groot'], ['thor', 'thor'], ['grogu', 'grogu'], ['lightsaber', 'lightsaber'],
].filter(([, id]) => drawingById(id));

// character names are said without "a"/"an"
const NAME_WORDS = new Set(['hulk', 'yoda', 'bluey', 'bingo', 'vader', 'catboy', 'gekko', 'owlette', 'groot', 'thor', 'grogu']);
export const withArticle = (w) => (NAME_WORDS.has(w) ? w : `${/^[aeiou]/.test(w) ? 'an' : 'a'} ${w}`);

// things that are fun to count (id -> plural)
export const COUNTABLES = [
  ['hulk', 'Hulks'], ['spidey', 'Spidey masks'], ['yoda', 'Yodas'], ['bluey', 'Blueys'], ['bingo', 'Bingos'],
  ['trooper', 'Stormtroopers'], ['catboy', 'Catboys'], ['owlette', 'Owlettes'], ['gekko', 'Gekkos'],
  ['cat', 'cats'], ['dog', 'puppies'], ['fish', 'fish'], ['bird', 'birds'], ['butterfly', 'butterflies'],
  ['turtle', 'turtles'], ['rabbit', 'bunnies'], ['penguin', 'penguins'], ['pig', 'piggies'], ['apple', 'apples'],
  ['star', 'stars'], ['heart', 'hearts'], ['sun', 'suns'], ['rocket', 'rockets'], ['icecream', 'ice creams'],
  ['balloon', 'balloons'], ['car', 'cars'], ['house', 'houses'], ['flower', 'flowers'], ['tree', 'trees'],
  ['bb8', 'BB-8s'], ['r2d2', 'R2-D2s'], ['grogu', 'Grogus'], ['groot', 'Groots'], ['muffin', 'Muffins'], ['shield', 'shields'],
].filter(([id]) => drawingById(id));

// Silly Mix-up: which faces, and how each is spoken
export const MIX_HEADS = ['bluey', 'bingo', 'bandit', 'chilli', 'muffin', 'socks', 'hulk', 'spidey', 'ironman', 'vader', 'trooper', 'yoda',
  'catboy', 'owlette', 'gekko', 'luna', 'ninja', 'cat', 'dog', 'pig', 'rabbit', 'penguin', 'chewie', 'grogu', 'boba',
  'panther', 'thor', 'captain', 'groot'].filter((id) => drawingById(id));
const MIX_NAMES = { ironman: 'Iron Man', captain: 'Captain America', panther: 'Black Panther', vader: 'Darth Vader', boba: 'Boba Fett', trooper: 'Stormtrooper', rabbit: 'Bunny', dog: 'Puppy' };
export const mixName = (id) => MIX_NAMES[id] || drawingById(id).title;

// how each letter NAME is spelled for the voice (British: "zed")
export const LETTER_SPELL = {
  a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'jee', h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'el', m: 'em',
  n: 'en', o: 'oh', p: 'pee', q: 'cue', r: 'ar', s: 'ess', t: 'tee', u: 'you', v: 'vee', w: 'double you', x: 'ex', y: 'why', z: 'zed',
};
/** A letter-name part: its own clip key, so it never clashes with the word "a". */
export const L = (ch) => ({ k: `letter:${ch.toLowerCase()}`, t: LETTER_SPELL[ch.toLowerCase()] });
export const letterOrName = (name) => (/^[A-Za-z]$/.test(name) ? L(name) : name);
