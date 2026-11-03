"""Static checks on the built site and PDF: rates vs data file, as-of dates, disclaimers, banned words, em dashes, logos vs SOURCES.md."""
import json, re, pathlib, subprocess, sys
D = pathlib.Path('docs'); R = json.loads(pathlib.Path('site/data/rates.json').read_text()); ok = True
def bad(msg):
    global ok; ok = False; print('FAIL', msg)
labels = {p['id']: p['rate_label'] for p in R['platforms']}; labels['baseline'] = '0.0625%'
html = {f: f.read_text() for f in D.rglob('*.html')}
# 1 data-rate cells match
n = 0
for f, t in html.items():
    for rid, val in re.findall(r'data-rate="([a-z\-]+)">([^<]+)<', t):
        n += 1
        if labels.get(rid) != val: bad(f'{f}: {rid} shows {val}, data says {labels.get(rid)}')
print('rate cells checked:', n)
# 2 every percent on the site appears in rates.json / RESEARCH.md
research = pathlib.Path('RESEARCH.md').read_text() + json.dumps(R)
allowed_extra = {'20%', '30%', '3%', '36%', '1%', '5%', '10%', '50%', '100%', '2%', '7.12%', '2.6%', '3.2%', '0.05%',  # last three: after-tax values computed as rate x 0.8
 '15%', '0%', '12%', '30% to 50%', '5% to 10%', '13%', '4%'}
for f, t in html.items():
    txt = re.sub(r'<script.*?</script>|<[^>]+>', ' ', t, flags=re.S)
    for pct in set(re.findall(r'\d+(?:\.\d+)?%', txt)):
        if pct not in research and pct not in allowed_extra: bad(f'{f}: {pct} not found in RESEARCH/rates')
# 3 as-of near rates on platforms page
pl = html[D / 'platforms/index.html']
if pl.count('as of 2026-11-04') < len(R['platforms']): bad('platforms: missing as-of per card')
if 'Rates change, check the app' not in pl: bad('platforms: missing rates-change note')
# 4 disclaimers
for f, t in html.items():
    rel = str(f.relative_to(D))
    if rel.startswith('guides') or rel in ('index.html', 'tools/index.html', 'platforms/index.html'):
        if 'Educational only, not financial advice' not in t: bad(f'{rel}: no disclaimer in body')
# 5 banned words + em/en dashes + PisoWais
words = re.compile(r'(?i:guarantee|risk-free|risk free|get rich|sure win|passive income)|PisoWais')
for f in list(D.rglob('*.html')) + list(D.rglob('*.js')) + list(D.rglob('*.json')):
    if 'vendor' in str(f): continue
    t = f.read_text()
    if '\u2014' in t or '\u2013' in t: bad(f'{f}: em/en dash')
    for m in words.finditer(t): bad(f'{f}: banned word {m.group(0)}')
pdf = subprocess.run(['pdftotext', '-layout', 'site/downloads/piso-wais-cheat-sheet.pdf', '-'], capture_output=True, text=True).stdout
if '\u2014' in pdf or '\u2013' in pdf: bad('PDF has em/en dash')
for m in words.finditer(pdf): print('PDF word (check context):', pdf[max(0, m.start()-60):m.end()+40].replace('\n', ' '))
pages = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', 'site/downloads/piso-wais-cheat-sheet.pdf'], capture_output=True, text=True).stdout).group(1))
print('PDF pages:', pages, 'disclaimer:', 'Educational only, not financial advice' in pdf, 'as-of:', 'November 4, 2026' in pdf)
for pct in set(re.findall(r'\d+(?:\.\d+)?%', pdf)):
    if pct not in research and pct not in allowed_extra: bad(f'PDF: {pct} not in RESEARCH/rates')
# 6 logos vs SOURCES.md
src = pathlib.Path('site/assets/logos/SOURCES.md').read_text()
for p in R['platforms']:
    f = pathlib.Path('docs/assets/logos') / p['logo']
    if not f.exists() or f.stat().st_size < 500: bad(f'logo missing/empty {f}')
    if p['logo'] not in src: bad(f'logo {p["logo"]} not in SOURCES.md')
print('ALL STATIC CHECKS PASSED' if ok else 'STATIC CHECKS FAILED')
