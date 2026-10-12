# Super Sketch ✏️

A tiny, no-build web app for little kids (made for a 4- and 5-year-old on iPads):

- **Draw Heroes** – step-by-step drawings (Marvel, Bluey, Star Wars, PJ Masks + easy shapes). One step at a time: trace the glowing guide with a finger, colour fades in, next step appears.
- **Letters** – A–Z, a–z and 0–9 with numbered strokes and a green start dot.
- **Words** – hero words, plus grown-ups can add the kids' names ("➕ Add a word").
- **Stories** – six silly original stories starring the characters. "Read it to me" reads a whole story (words light up as they're read, pages turn by themselves); or the child reads on their own and **taps any tricky word** to hear it, see it split into syllables, "sound it out", or jump to **Write it**. Tapped words collect in **My tricky words**.
- **Screen / Paper toggle** on every drawing, letter and word: in *Paper* mode the screen shows the model one step at a time and the child draws or writes it on real paper, then taps "Done! Next step". The 🖨️ button prints a worksheet (dotted letters/words to trace with a pencil, or a step-by-step drawing guide).
- **Games** – Picture Match, Word Hunt (find a word in a story page), Word Builder (letter tiles), **Count & Colour** (count the heroes, then colour them), a **Colouring Book** (tap a shape to fill it) and **Silly Mix-up** (swap the top, eyes and mouth of any two or three characters).
- **Sticker Book** – stars earned from drawing, writing, reading and games are spent in the shop; stickers are stuck on a scene (drag, resize, flip, backgrounds).
- **Players** – the app opens on "Who's playing?" with **Arty** and **Harry** (set up in `src/store.js`); stars, stickers, progress and settings are saved separately on each iPad. The **🔒 Grown-ups** page (behind a PIN keypad — the PIN is `PIN` in `src/grownups.js`) shows letters, drawings, stories, words, tricky words, games and a 14-day activity chart for each child, plus reset/rename/remove.
- **Works offline** – a service worker saves the app on the device after the first visit.
- 16 pen colours including white, and a **Next word** button.
- Instructions and stories are **read aloud by a British female narrator** (recorded ahead of time — see *Voice* below), with word-by-word highlighting; the iPad's own British voice is the fallback, with sound effects, stars, confetti and "Save picture".
- Works with finger or Apple Pencil, portrait or landscape. Progress (stars, ⭐ badges, custom words) is stored on the device only.

No dependencies, no build step — just static files.

## Run locally

```sh
python3 -m http.server 8080   # or: npx http-server
# open http://localhost:8080
```

## Deploy to Vercel

Import the repo in Vercel. Framework preset: **Other**, no build command, no output directory
(the project root is served as-is). Or from the CLI: `npx vercel --prod`.

On the iPad: open the site in Safari → Share → **Add to Home Screen** for a full-screen app icon.

## Resetting data

Progress is stored on each device (no server). To wipe everything on every device and start fresh, bump `DATA_VERSION` in `src/store.js`: the next time the app opens on a device it clears all saved data once and recreates the players.

## Voice (British female narrator)

The app plays pre-recorded clips from `audio/` (a British English female voice) and falls back to the device's own voice for
anything without a clip (e.g. a name a grown-up typed in).

- `node scripts/audio-texts.mjs` lists every phrase the app can say (`audio/texts.json`).
- `python3 scripts/gen_audio.py` records them → `audio/*.mp3` + `audio/index.json`. Re-runs only record new phrases.
  Default engine is **Piper** (`pip install piper-tts numpy`, needs ffmpeg), voice `en_GB-cori-medium`
  (try `TTS_VOICE=en_GB-jenny_dioco-medium` or `en_GB-alba-medium`).
- The **Voice clips** GitHub Action (`.github/workflows/voice-clips.yml`) does this automatically whenever `src/` changes and
  commits the clips, so the next deploy has them. Run it by hand from the Actions tab if needed.
- Microsoft's Edge voices (`TTS_ENGINE=edge TTS_VOICE=en-GB-SoniaNeural`, `pip install edge-tts`) also work, but Microsoft
  refuses requests from cloud servers like GitHub's, so run that one on your own computer.
- The Grown-ups page has **Save voices for offline** to cache every clip on the iPad.

## Offline support

`sw.js` precaches the app. After adding or removing files run `node scripts/precache.mjs` to refresh its file list (and bump `VERSION` in `sw.js` if you want to force every device to re-download).

## Adding more stories

Add an entry to `STORIES` in `src/stories.js`: each page has `text`, `art` (drawing ids from `src/drawings.js`), optional `props` (emoji) and `sfx` (a tappable sound-effect sticker). Add oddly-spelled words to `HYPHENS` if the syllable splitter gets them wrong.

## Adding more drawings

Open `src/drawings.js` and add an entry to `DRAWINGS` (everything is drawn in a 400×400 box):

```js
{
  id: 'my-thing', title: 'My Thing', group: 'marvel',   // group ids are in GROUPS
  steps: [
    { say: 'Draw a big circle.', paths: [c(200, 200, 120)], fill: '#ffd23f' },
    { say: 'Draw a smile.',      paths: ['M150 230Q200 280 250 230'] },
  ],
}
```

- `paths` are SVG path strings the child traces (all of them must be traced to finish the step).
- `fill` fades in under the child's lines once the step is done (use closed shapes); `z` controls paint order.
- Helpers `c()` circle, `e()` ellipse, `rect()` and `star()` are at the top of the file.

Letter shapes live in `src/glyphs.js` (one SVG path per stroke, in writing order).

## About the character art

The character drawings are simple, original vector sketches inspired by the characters, built for
personal/family use. Marvel, Bluey, Star Wars and PJ Masks are trademarks of their respective owners;
this project is not affiliated with or endorsed by them, and does not include any official artwork.
