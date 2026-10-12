# Super Sketch ✏️

A tiny, no-build web app for little kids (made for a 4- and 5-year-old on iPads):

- **Draw Heroes** – step-by-step drawings (Marvel, Bluey, Star Wars, PJ Masks + easy shapes). One step at a time: trace the glowing guide with a finger, colour fades in, next step appears.
- **Letters** – A–Z, a–z and 0–9 with numbered strokes and a green start dot.
- **Words** – hero words, plus grown-ups can add the kids' names ("➕ Add a word").
- Instructions are **read aloud** (iPad voice), with sound effects, stars, confetti and "Save picture".
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
