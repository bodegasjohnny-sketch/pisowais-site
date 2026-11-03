# Piso Wais brand notes (for the website)

Name in copy: **Piso Wais** (two words). Logo artwork reads "Pisowais"; social handle @pisowaisph. Never "PisoWais" in copy.

## Palette (sampled from the real assets, not invented)

Method: k-means clustering (10 clusters) on non-background pixels of each asset with Python/PIL/numpy, plus visual review of the images (`qa/brand/sheet.png`). Cream background measured directly from pixel (0,0).

| Role on site | Hex | Where it came from |
|---|---|---|
| Ink / navy (text, dark sections) | `#121F47` | fb_cover.jpg text region (cluster 26%: #121f47); logo4 #121f46; logo5 #18264c |
| Deep navy (footer, gradients) | `#0A1433` | darker shade of the same navy; logo1 outline cluster #061032 |
| Royal blue (accent, links, chart) | `#1F4EA6` | fb_cover.jpg "for Filipinos." text (#1f4ea6); logo1 badge background #0257ad (also used as `--blue-2`) |
| Pig pink (cards, icons) | `#FDAFB0` | logo1 pig (#fdafb0, 26% of pixels); logo5 #faa693 |
| Coral pink (accent) | `#F36C7A` | logo1 cheeks/ears (#f36c7a) |
| Coin gold (primary CTA) | `#F9B909` | logo1 coin (#f9b909); logo4 #fdb80c |
| Light gold | `#FBD46B` | logo1 coin highlight (#fbd46b) |
| Terracotta (eyebrows, tagline) | `#D6674B` | fb_cover.jpg tagline "Tips lang, hindi financial advice." (#d6674b); logo4 #e66c58 |
| Cream (page background) | `#FCFBF7` | fb_cover.jpg and logo1 background pixel (252,251,247) |
| Warm cream (alt sections) | `#F7EEE0` | mascot stills background (pisowais-anim-test/stills, #f7eee0) |

Sources checked: `/workspace/brand/pisowais/drive/logo1.jpg` to `logo5.jpg`, `/workspace/brand/pisowais/fb_cover.jpg`, `/workspace/pisowais-anim-test/stills/*.png`, `/workspace/pisowais-anim-test/prompts.md` (style line: "cream, pink and navy palette, gold coin accents"), Drive file `pisowais_pay_yourself_first_image.png` (Piso Wais Content folder). Drive "Palette & Fonts" folder only contained `cis_palette.png`, which is the CryptoInScope palette, not Piso Wais, so it was NOT used. /workspace/3x3-live-run v4 (`README.md`, frames_v4) has a Piso Wais *demo end card* in a dark-stage palette (#0B0F1A stage, #F5F7FA, cyan #00C2FF, green #16C784). Those exact hexes are the CryptoInScope palette (Drive `cis_palette.png`), used for a 3x3 pipeline mock-up, so they conflict with the real Piso Wais logos and Facebook cover. Decision: follow the real logos + FB cover (cream, navy, blue, pink, gold, terracotta) and ignore the demo end card. /workspace/3x3-showreel and 3x3-analysis contained no Piso Wais imagery (3x3-analysis only references a test build script). The public Facebook page was not used for sampling (not needed; no login attempted).

## Logos used
- Header: `logo5.jpg` (horizontal mascot + "Pisowais") cut out to a transparent PNG (`site/assets/brand/pisowais-horizontal.png`) by removing only the corner-connected cream background (scipy connected components). No distortion, aspect ratio preserved.
- Badge / favicon / footer / PDF cover: `logo1.jpg` (app-icon badge) cut out the same way (`pisowais-badge.png`).
- Mascot (About, 404, PDF): `logo3.jpg` cut out (`pisowais-mascot.png`).
- The artwork is AI-generated (per the anim-test prompts), so the footer carries an AI-imagery note.

## Type
Poppins 400/600/800 (Google Fonts, OFL), vendored locally in `site/assets/fonts/`. Closest match to the rounded geometric wordmark and the cover tagline.
