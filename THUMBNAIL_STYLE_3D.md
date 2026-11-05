# Piso Wais 3D thumbnail style (batch 2 onward)

Use this for every NEW guide cover. Batch 1 live covers in `site/assets/articles/<slug>.jpg` stay as they are.
Approved samples: `site/assets/articles/3d-samples/<slug>-3d-mascot.jpg` (credit-card-for-business, rule-50-30-20, thirteenth-month-pay-plan). The older `<slug>-3d.jpg` files (no mascot) are kept for reference only, do not follow them.

## The mascot is MANDATORY
Every new cover shows the 3D Piso Wais mascot, full body, interacting with the topic object (holding the card, adding a coin to the pie chart, hugging the 13th month gift box).
Always pass these as reference images to the image tool:
- `site/assets/brand/pisowais-mascot.png`
- `/workspace/pisowais-anim-test/stills/mascot_full_9x16.png`
- `/workspace/pisowais-anim-test/stills/mascot_closeup_9x16.png`
(`tools/thumbs.py` `MASCOT_REFS`.)

## Output
- 1200 x 800 px JPG (3:2), progressive, quality about 86, under about 200 KB.
- Generate at 4:3 (or larger), then center-crop to 3:2 with `tools/thumbs.py` `cover_3d(src, dest)`.
- Live file name: `site/assets/articles/<slug>.jpg` (build.py picks it up automatically for the feed, the cover figure and og:image).
- Keep the main objects inside the middle 80% so the 600x400 feed crop and social crops still read.

## Palette
- Background: deep navy `#121F47` (to `#0A1433` at the edges), soft radial glow.
- Hero shape: one large warm yellow circle `#F9B909` behind the objects.
- Objects: navy `#121F47`, gold `#F9B909` / `#FBD46B`, pink `#FDAFB0` / `#F36C7A`. Small cream `#FCFBF7` highlights allowed.
- Mascot (required): pink piggy bank character with a gold coin, orange-yellow neckerchief, cream barong, navy pants, brown sandals.

## Prompt template
```
Polished 3D render blog cover about {TOPIC}. The Piso Wais mascot exactly as in the reference images (cute pink piggy
bank character, coin slot on top of the head, big brown eyes and brown eyebrows, round pink snout, orange-yellow
neckerchief, cream embroidered barong shirt, navy rolled pants, brown sandals, often holding a gold coin) shown full
body, smiling, {MASCOT ACTION WITH TOPIC OBJECT}, with {1 TO 3 SUPPORTING OBJECTS}. Cute clay-like 3D style with soft
studio lighting and soft shadows, on a deep navy #121F47 background with a soft radial glow and a large warm yellow
#F9B909 circle shape behind the objects, soft pink #FDAFB0 accents, clean minimal composition, wide landscape, group
centered. Absolutely no text, no letters, no numbers, no logos, no card network marks, no currency symbols.
```
`tools/thumbs.py` has the same template: `prompt_3d(topic, action, objects)`, plus `MASCOT_REFS`.

Object ideas: credit card, storefront, calendar, coins, coin stacks, peso-style bill (no currency symbol), piggy bank,
pie chart, gift box, parol star, shield, padlock, phone with wallet, bank building, house, calculator, magnifier.

## Do
- 2 to 4 objects, one clear hero object, generous empty navy space.
- Same soft clay look as the 3D point icons in `site/assets/icons3d/` so covers and icons feel like one set.
- Filipino context through objects (parol, sari-sari store, jeepney, tricycle), never through flags or text.
- Check the result at 600x400 and 300x200; it must still read.

## Mascot consistency
- Do: same face every time (brown eyes, brown brows, pink snout, rosy cheeks, head slot), same outfit and colours, same proportions, full body, friendly smile, the mascot touching or using the topic object.
- Do: review the face against `mascot-280.png` before approving; regenerate if it drifts.
- Don't: change the outfit, colours or species, add extra mascots, crop off the head, show it sad or scared, or let props hide the face.
- Don't: generate without the reference images.

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
