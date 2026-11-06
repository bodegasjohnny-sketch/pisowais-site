# Piso Wais website

Static site (no server) for **Piso Wais**: free cheat sheet, three in-browser money tools, dated savings-rate comparison, and guides.
Live (GitHub Pages): https://bodegasjohnny-sketch.github.io/pisowais-site/ . Custom domain (after DNS): https://pisowais.johnnybodegas.com

## Change referral links (no coding)
1. Open `docs/config/referrals.json` (the live copy) and `site/config/referrals.json` (source).
2. Paste your link into `ref_url` for a platform. Leave `official_url` as is.
3. Commit and push. Buttons switch automatically and show an "Affiliate link" tag whenever `ref_url` differs from `official_url`.

## Update rates
Edit `site/data/rates.json` (rate, rate_label, as_of, sources), update `checked`, then run `npm run build` and push. Also update RESEARCH.md and re-render the PDF (`python3 tools_render.py pdf`) if the cheat sheet table changed.

## Build / test
- `npm ci && npm run build` builds `site/` into `docs/` (published folder, all URLs relative so it works on both the github.io subpath and the custom domain root).
- `node tests/calc.test.mjs` runs calculator unit tests.
- `python3 qa_run.py <base-url> <label>` runs the Playwright QA (screenshots in `qa/`).

Vendored: three.js r170 (MIT, `site/vendor/`), Poppins (OFL). No analytics, no trackers, no CDN at runtime. The dashboard loads its vendored Supabase SDK only if account configuration is explicitly enabled.
Educational only, not financial advice.

## Dashboard review build

The mobile-first `/dashboard/` review supports labelled examples and an explicit local-only preview. Cloud accounts and paid features are **not launched**. See [DASHBOARD_SETUP.md](DASHBOARD_SETUP.md) for calculations, testing, privacy and the backend approval checklist. Run `npm test` for all suites. Do not apply the review migration or enable cloud accounts without the staging/security steps.
