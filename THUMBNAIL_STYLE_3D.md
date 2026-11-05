# Piso Wais 3D thumbnail style (batch 2 onward)

Use this for every NEW guide cover. Batch 1 live covers in `site/assets/articles/<slug>.jpg` stay as they are.
Approved samples: `site/assets/articles/3d-samples/` (credit-card-for-business, rule-50-30-20, thirteenth-month-pay-plan).

## Output
- 1200 x 800 px JPG (3:2), progressive, quality about 86, under about 200 KB.
- Generate at 4:3 (or larger), then center-crop to 3:2 with `tools/thumbs.py` `cover_3d(src, dest)`.
- Live file name: `site/assets/articles/<slug>.jpg` (build.py picks it up automatically for the feed, the cover figure and og:image).
- Keep the main objects inside the middle 80% so the 600x400 feed crop and social crops still read.

## Palette
- Background: deep navy `#121F47` (to `#0A1433` at the edges), soft radial glow.
- Hero shape: one large warm yellow circle `#F9B909` behind the objects.
- Objects: navy `#121F47`, gold `#F9B909` / `#FBD46B`, pink `#FDAFB0` / `#F36C7A`. Small cream `#FCFBF7` highlights allowed.
- Mascot (optional): pink piggy bank with a gold coin.

## Prompt template
```
Polished 3D render illustration for a blog cover about {TOPIC}: {2 to 4 OBJECTS}, cute clay-like 3D style with soft
studio lighting and soft shadows, on a deep navy #121F47 background with a soft radial glow and a large warm yellow
#F9B909 circle shape behind the objects, soft pink #FDAFB0 accents, clean minimal composition, wide landscape,
no text, no letters, no numbers, no logos.
```
`tools/thumbs.py` has the same template as `PROMPT_3D` / `prompt_3d(topic, objects)`.

Object ideas: credit card, storefront, calendar, coins, coin stacks, peso-style bill (no currency symbol), piggy bank,
pie chart, gift box, parol star, shield, padlock, phone with wallet, bank building, house, calculator, magnifier.

## Do
- 2 to 4 objects, one clear hero object, generous empty navy space.
- Same soft clay look as the 3D point icons in `site/assets/icons3d/` so covers and icons feel like one set.
- Filipino context through objects (parol, sari-sari store, jeepney, tricycle), never through flags or text.
- Check the result at 600x400 and 300x200; it must still read.

## Don't
- No baked-in text, numbers, prices, logos, bank or e-wallet brand marks.
- No dollar signs or other foreign currency symbols. Plain coins or a star emblem are fine.
- No real people, faces or photo realism; no stock photos.
- No neon, gradients outside the palette, busy patterns, or dark-on-dark objects that vanish on navy.
- Do not overwrite batch 1 covers without an explicit go-ahead.

## 3D point icons
- Library: `site/assets/icons3d/<name>-160.webp` and `-320.webp` (transparent), sources in `src/`, sheet in `contact-sheet.png`.
- Icon prompt: `A single glossy 3D rendered icon of {OBJECT}, cute clay-like 3D render style, soft studio lighting, smooth rounded shapes, subtle soft contact shadow below, color palette: deep navy #121F47, warm yellow gold #F9B909, soft pink #FDAFB0 accents. Centered with generous padding, isolated on a pure flat white background (#FFFFFF), no text, no letters, no numbers, no border.`
- Save the render to `site/assets/icons3d/src/<name>.jpg`, run `python3 tools/icons3d.py`, then map headings in `tools/icon_map.py`.
