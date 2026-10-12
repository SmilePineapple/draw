// Every sentence the app speaks that has a template. Used by the screens AND by the voice-clip generator,
// so the clips that get recorded always match what the app asks to say.
// A phrase is either a string or a list of parts that are played one after another
// (e.g. ['That says', 'dog', 'Try again!']) so the same recorded words can be reused.
import { withArticle, L, letterOrName } from './wordlist.js';
export { L };

export const P = {
  tile: { draw: 'Draw heroes!', letters: 'Letters!', words: 'Words!', stories: 'Stories!', games: 'Games!', stickers: 'Sticker book!' },
  hello: "Hello! Let's play!",
  wellDone: 'Great job! You did it!',
  atTheDot: 'Start at the green dot.',
  drawIntro: (title, say) => ["Let's draw", title, say],
  drawWin: (title) => ['You drew', title, 'Amazing job!'],
  numberIntro: (name) => ["Let's write the number", name, 'Start at the green dot.'],
  letterStart: (info) => [info, 'Start at the green dot.'],
  nextLine: (n) => `Now line ${n}.`,
  wordLetter: (name) => [letterOrName(name), 'Start at the green dot.'],
  keepGoing: (n) => `Keep going! Line ${n}.`,
  greatNumber: (name) => ['Great number', name],
  greatLetter: (name) => ['Great letter', letterOrName(name)],
  wroteWin: (text) => ['You wrote', text, 'Great job!'],
  theEnd: 'The end! Great reading!',
  // games
  matchP2W: 'Which word matches the picture?',
  matchW2P: 'Which picture is this word?',
  wrongWord: (w) => ['That says', w, 'Try again!'],
  wrongPic: (w) => ['That one is', withArticle(w), 'Try again!'],
  findWord: (w) => ['Can you find the word', w],
  findShort: (w) => ['Find the word', w],
  foundIt: (w) => ['Yes!', w],
  keepLooking: (w) => ['That says', w, 'Keep looking!'],
  buildWord: (w) => ['Build the word', w],
  notThat: (ch) => ['Not', L(ch), 'Try again!'],
  score: (n, total) => `${n} out of ${total}! ${n >= total - 1 ? 'Amazing!' : 'Well done!'}`,
  // count & colour
  tapToCount: (plural) => ['Tap each', plural, 'to count them!'],
  howMany: (plural) => ['How many', plural, 'are there?'],
  countYes: (n, plural) => ['Yes!', String(n), plural, 'Now colour them in!'],
  countNo: (n) => ['That is', String(n), "Let's count again!"],
  countDone: 'Great counting and colouring!',
  // stickers + mix-up
  gotSticker: 'You got a new sticker!',
  needStars: 'You need more stars!',
  itsA: "It's a",
};

/** Flatten a phrase to plain text (for the screen / fallback voice). */
export const phraseText = (p) => (Array.isArray(p) ? p.map((x) => (typeof x === 'string' ? x : x.t)).join(' ') : typeof p === 'string' ? p : p.t);
