// Silly short stories for early readers. `art` lists drawing ids (see drawings.js) shown on each page,
// `props` are big emoji props, `sfx` is a tappable sound-effect sticker.
// These are original stories that borrow the characters for fun.

export const STORIES = [
  {
    id: 'balloon', title: 'Bluey and the Wobbly Balloon', bg: ['#d7ecff', '#fff3d1'], cover: ['bluey', 'balloon'],
    pages: [
      { art: ['bluey', 'bingo'], text: 'Bluey had a big red balloon. Bingo wanted a turn.' },
      { art: ['bluey', 'balloon'], text: '"Keepy uppy!" said Bluey. Up, up, up went the balloon.', sfx: 'Boing!' },
      { art: ['bingo'], props: '🎈', text: 'It landed on Bingo\'s head. Now she had a balloon hat!', sfx: 'Boing!' },
      { art: ['bingo', 'balloon'], text: '"I am the balloon queen!" said Bingo. She did a silly dance.', sfx: 'Wiggle wiggle!' },
      { art: ['balloon'], props: '💨', text: 'Then the balloon went PFFFT! It zoomed all around the room.', sfx: 'Pfffft!' },
      { art: ['bluey', 'bingo'], text: 'Bluey and Bingo ran after it. They bumped bottoms and fell over!', sfx: 'Oof!' },
      { art: ['bluey', 'balloon', 'bingo'], props: '🍽️', text: 'The balloon landed in the dog bowl. Everybody laughed and laughed.' },
    ],
  },
  {
    id: 'hiccups', title: 'Hulk Has the Hiccups', bg: ['#e2ffe0', '#fff3d1'], cover: ['hulk'],
    pages: [
      { art: ['hulk'], text: 'Hulk was in a very good mood. Then he got the hiccups.', sfx: 'HIC!' },
      { art: ['hulk'], props: '🌳', text: 'Hic! His hiccup was so big that the trees went boing.', sfx: 'Boing!' },
      { art: ['spidey', 'hulk'], props: '💧', text: '"Drink some water!" said Spidey. Hulk drank a whole lake. Hic!', sfx: 'Glug glug!' },
      { art: ['hulk'], text: '"Stand on your head!" So Hulk stood on his head. Then he fell over.', sfx: 'Thud!' },
      { art: ['spidey'], props: '👻', text: 'Then Spidey jumped out and shouted, "BOO!" Hulk jumped so high that he touched a cloud.', sfx: 'BOO!' },
      { art: ['hulk'], props: '☁️', text: 'The hiccups were gone! But now Hulk was stuck on a cloud.', sfx: 'Uh oh!' },
      { art: ['spidey', 'hulk'], text: 'Spidey made a web slide. Whee! Hulk slid all the way home.', sfx: 'Wheee!' },
    ],
  },
  {
    id: 'socks', title: 'Yoda Lost His Sock', bg: ['#efe3ff', '#e6ffe9'], cover: ['yoda', 'r2d2'],
    pages: [
      { art: ['yoda'], props: '🧦', text: 'Yoda woke up. He had one sock. The other sock was gone!', sfx: 'Oh no!' },
      { art: ['r2d2'], props: '🛏️', text: 'R2-D2 looked under the bed. He found a dusty biscuit and a spider.', sfx: 'Beep boop!' },
      { art: ['bb8'], props: '🍌', text: 'BB-8 rolled round and round. He found a spoon and a very smelly banana.', sfx: 'Phew!' },
      { art: ['yoda'], text: '"Where is my sock?" said Yoda. "Lost it, I have!"' },
      { art: ['r2d2'], props: '🧦', text: 'R2-D2 opened his tummy door. Out popped... a sock!', sfx: 'Ta-da!' },
      { art: ['yoda', 'r2d2', 'bb8'], text: 'R2-D2 had hidden it all day. "Silly droid!" laughed Yoda. They all giggled.', sfx: 'Hee hee!' },
    ],
  },
  {
    id: 'sneeze', title: 'The Big Sneeze', bg: ['#e3e6ff', '#fff3d1'], cover: ['trooper', 'vader'],
    pages: [
      { art: ['trooper'], text: 'Stormtrooper had a tickly nose. "Ah... ah... ahhh..."' },
      { art: ['trooper'], props: '🚀', text: '"ACHOO!" His helmet flew off and zoomed up into the sky.', sfx: 'ACHOO!' },
      { art: ['vader'], props: '👀', text: 'Darth Vader looked up. "Where did that helmet go?"' },
      { art: ['vader'], text: 'The helmet landed on Darth Vader\'s head. Now he had two helmets!', sfx: 'Clonk!' },
      { art: ['vader'], text: 'Vader tried to say, "I am your..." But it came out as, "Mmf mmf mmf!"', sfx: 'Mmf mmf!' },
      { art: ['trooper', 'vader'], text: 'Stormtrooper pulled and pulled. POP! Both helmets came off.', sfx: 'Pop!' },
      { art: ['vader', 'trooper'], props: '😂', text: '"Bless you," said Vader. Then they both laughed and laughed.' },
    ],
  },
  {
    id: 'cookie', title: 'The Missing Cookie', bg: ['#2b2f5a', '#7a3fd1'], dark: true, cover: ['catboy', 'owlette', 'gekko'],
    pages: [
      { art: ['catboy', 'owlette', 'gekko'], props: '🌙', text: 'It was night time. Someone took the last cookie! The PJ Masks went to look.' },
      { art: ['owlette'], props: '🍪', text: 'Owlette flew up high. "I see crumbs!" she said.', sfx: 'Whoosh!' },
      { art: ['gekko'], text: 'Gekko stuck to the wall. "More crumbs!" he said. The crumbs went round the corner.', sfx: 'Splat!' },
      { art: ['catboy'], props: '👃', text: 'Catboy sniffed the air. "Sniff, sniff. I smell chocolate!"', sfx: 'Sniff sniff!' },
      { art: ['catboy'], props: '🍪', text: 'Gekko looked closely. The crumbs were on Catboy\'s nose!', sfx: 'Munch munch!' },
      { art: ['owlette', 'gekko', 'catboy'], text: '"Catboy!" they said. "It was you!" Catboy went red. "Sorry! I was hungry."', sfx: 'Oops!' },
      { art: ['catboy', 'owlette', 'gekko'], props: '😂', text: 'They all laughed. Then they shared a banana instead.' },
    ],
  },
  {
    id: 'pie', title: 'The Silly Pie Party', bg: ['#ffe3e3', '#fff3d1'], cover: ['yoda', 'hulk', 'bluey'],
    pages: [
      { art: ['bluey', 'catboy', 'hulk', 'yoda'], props: '🥧', text: 'Everyone came to the pie party. Bluey, Catboy, Hulk and Yoda.' },
      { art: ['yoda', 'hulk'], text: '"Hungry, I am!" said Yoda. Hulk took a big, big bite.', sfx: 'Nom nom!' },
      { art: ['hulk'], props: '🥧', text: 'Hulk\'s bite was so big that the pie flew up in the air.', sfx: 'Whoosh!' },
      { art: ['yoda'], props: '🥧', text: 'SPLAT! The pie landed on Yoda\'s face. "Yummy, it is!" he said.', sfx: 'Splat!' },
      { art: ['spidey'], text: 'Spidey made a web and caught the next pie. Hooray!', sfx: 'Hooray!' },
      { art: ['bb8'], props: '🥧', text: 'Then BB-8 rolled in and squashed the very last pie.', sfx: 'Squish!' },
      { art: ['bluey', 'catboy', 'hulk', 'yoda', 'spidey'], props: '😂', text: 'Now everybody had pie on their toes. They giggled all night long.' },
    ],
  },
];

export const storyById = (id) => STORIES.find((s) => s.id === id);

// small picture dictionary for the word-help card
export const WORD_PICS = {
  balloon: '🎈', cookie: '🍪', cookies: '🍪', pie: '🥧', sock: '🧦', banana: '🍌', cloud: '☁️', water: '💧', lake: '🏞️',
  trees: '🌳', tree: '🌳', helmet: '⛑️', head: '🙂', hat: '🎩', dog: '🐶', bowl: '🥣', night: '🌙', bed: '🛏️', spider: '🕷️',
  spoon: '🥄', biscuit: '🍪', sky: '🌤️', crumbs: '🍞', nose: '👃', chocolate: '🍫', tummy: '🤰', door: '🚪', wall: '🧱',
  sneeze: '🤧', toes: '🦶', web: '🕸️', party: '🎉', queen: '👑', dance: '💃', hungry: '🍽️', laughed: '😂', giggled: '🤭',
  zoomed: '💨', room: '🏠', boing: '🦘', face: '😄', star: '⭐', sun: '☀️', moon: '🌙', cat: '🐱', cake: '🎂',
};

// syllable overrides where the simple splitter gets it wrong
export const HYPHENS = {
  balloon: 'bal-loon', everybody: 'ev-ry-bod-y', hiccups: 'hic-cups', hiccup: 'hic-cup', giggled: 'gig-gled',
  tickly: 'tick-ly', Stormtrooper: 'storm-troop-er', stormtrooper: 'storm-troop-er', helmet: 'hel-met', biscuit: 'bis-cuit',
  banana: 'ba-na-na', spider: 'spi-der', droid: 'droid', chocolate: 'choc-o-late', hungry: 'hun-gry', yummy: 'yum-my',
  hooray: 'hoo-ray', whoosh: 'whoosh', vader: 'va-der', darth: 'darth', bluey: 'blu-ey', bingo: 'bin-go', catboy: 'cat-boy',
  owlette: 'owl-ette', gekko: 'gek-ko', yoda: 'yo-da', spidey: 'spi-dey', hulk: 'hulk', closely: 'close-ly', corner: 'cor-ner',
  another: 'an-oth-er', laughed: 'laughed', sorry: 'sor-ry', dusty: 'dust-y', lonely: 'lone-ly', queen: 'queen', silly: 'sil-ly',
  bottoms: 'bot-toms', dance: 'dance', party: 'par-ty', squashed: 'squashed', touched: 'touched', pulled: 'pulled', stuck: 'stuck',
  woke: 'woke', would: 'would', 'r2-d2': 'R-2 D-2', sniffed: 'sniffed', 'bb-8': 'B-B 8', whole: 'whole', before: 'be-fore',
  achoo: 'a-choo', bumped: 'bumped', cookie: 'cook-ie', everyone: 'ev-ry-one', jumped: 'jumped', keepy: 'keep-y', landed: 'land-ed',
  opened: 'o-pened', other: 'oth-er', shared: 'shared', shouted: 'shout-ed', someone: 'some-one', zoomed: 'zoomed', wanted: 'want-ed',
  popped: 'popped', missing: 'miss-ing', very: 'ver-y', helmets: 'hel-mets', cookies: 'cook-ies',
  tummy: 'tum-my', smelly: 'smell-y', mood: 'mood', night: 'night', looked: 'looked', rolled: 'rolled', bless: 'bless',
};

/** Break a word into syllables for the "sound it out" button. */
export function syllables(word) {
  const w = word.toLowerCase();
  if (HYPHENS[w]) return HYPHENS[w].split('-');
  if (w.length <= 3) return [w];
  const parts = w.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/g) || [w];
  // silent e: "cake" should not become "ca-ke"
  if (parts.length > 1 && /^[^aeiouy]*e$/.test(parts[parts.length - 1]) && !/le$/.test(w)) {
    parts[parts.length - 2] += parts.pop();
  }
  return parts;
}
