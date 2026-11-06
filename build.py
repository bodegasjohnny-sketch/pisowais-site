#!/usr/bin/env python3
"""Static site builder for Piso Wais. Reads site/pages/**.html fragments, wraps them in the shared layout,
pre-renders data-driven blocks from site/data/rates.json, and writes the deployable site to docs/.
All internal URLs are relative ({{root}}), so the site works at /pisowais-site/ on github.io AND at the
root of pisowais.johnnybodegas.com."""
import json, re, shutil, pathlib, html, datetime
SRC = pathlib.Path('site'); OUT = pathlib.Path('docs'); SITE = 'https://pisowais.johnnybodegas.com'
RATES = json.loads((SRC / 'data/rates.json').read_text())
import sys; sys.path.insert(0, 'tools')
from icon_map import ICON_MAP

def point_icons(slug, body):
    # Adds a decorative 3D icon (site/assets/icons3d) before each mapped guide point heading.
    m = ICON_MAP.get(slug)
    if not m: return body
    def rep(g):
        attrs, inner = g.group(1), g.group(2)
        key = html.unescape(re.sub(r'<[^>]+>', '', inner)).strip()
        ic = m.get(key)
        if not ic: return g.group(0)
        img = f'<img class="pt-ico" src="{{{{root}}}}assets/icons3d/{ic}-160.webp" srcset="{{{{root}}}}assets/icons3d/{ic}-160.webp 1x, {{{{root}}}}assets/icons3d/{ic}-320.webp 2x" alt="" width="72" height="72" loading="lazy" decoding="async">'
        cls = ' class="pt-h"' if 'class=' not in attrs else attrs.replace('class="', 'class="pt-h ')
        attrs = re.sub(r'\s*class="[^"]*"', '', attrs) + cls
        return f'<h2{attrs}>{img}<span>{inner}</span></h2>'
    out = re.sub(r'<h2((?:\s+id="l\d+")?)>(.*?)</h2>', rep, body, flags=re.S)
    missing = set(m) - {html.unescape(re.sub(r'<[^>]+>', '', x)).strip() for x in re.findall(r'<h2[^>]*>(.*?)</h2>', body, re.S)}
    if missing: print('WARN icon map keys not found in', slug, missing)
    return out

def nav(path):
    items = [('', 'Home'), ('tools/', 'Free tools'), ('platforms/', 'Where to park cash'), ('guides/', 'Guides'), ('plays/', 'Quizzes'), ('dashboard/', 'Dashboard')]
    return ''.join(f'<li><a href="{{{{root}}}}{p}"{" aria-current=page" if p == path else ""}>{t}</a></li>' for p, t in items)

LAYOUT = (SRC / 'layout.html').read_text()

def tile(p, w, h):
    dark = 'dark' if p['logo_tile'] == 'dark' else ''
    if p.get('logo_kind') == 'icon':
        return f'<div class="logo-tile icon {dark}"><img src="{{{{root}}}}assets/logos/{p["logo"]}" alt="{p["name"]} logo" loading="lazy" width="56" height="56"><span class="wordmark">{p["name"]}</span></div>'
    return f'<div class="logo-tile {dark}"><img src="{{{{root}}}}assets/logos/{p["logo"]}" alt="{p["name"]} logo" loading="lazy" width="{w}" height="{h}"></div>'

def platform_cards():
    out = []
    for p in sorted(RATES['platforms'], key=lambda p: -p['rate']):
        src = ' '.join(f'<a href="{html.escape(s)}" target="_blank" rel="noopener">[{i+1}]</a>' for i, s in enumerate(p['sources']))
        promo = f'<div><span class="tag promo">Promo</span> <span class="small">{p["promo_label"]}</span></div>' if p.get('promo') else ''
        out.append(f'''<article class="card plat tilt reveal" id="p-{p["id"]}">
{tile(p, 180, 48)}
<div><h3 style="margin:0">{p["name"]}</h3><div class="small muted">{p["product"]}</div></div>
<div><span class="rate" data-rate="{p["id"]}">{p["rate_label"]}</span><div class="asof">Base rate, as of {p["as_of"]}. Rates change, check the app.</div></div>
{promo}<div><span class="tag">Best for: {p["best_for"]}</span></div>
<p class="small" style="margin:0">{p["conditions"]}</p>
<p class="con" style="margin:0"><strong>Honest con:</strong> {p["cons"]}</p>
<p class="small" style="margin:0"><strong>Who holds the money:</strong> {p["holder"]}. <strong>Insurance:</strong> {p["pdic"]}</p>
<div class="actions"><a class="btn btn-navy btn-sm" data-ref="{p["id"]}" href="{p["official"]}" target="_blank" rel="noopener" aria-label="Open account at {p["name"]} (opens official site)">Open account</a><span class="tag aff" hidden>Affiliate link</span></div>
<p class="asof" style="margin:0">Sources: {src}</p></article>''')
    return '\n'.join(out)

def rate_table():
    b = RATES['baseline']
    rows = [f'<tr><td>Traditional bank example</td><td>BPI Regular Savings</td><td data-rate="baseline">0.0625%</td><td>{b["conditions"]}</td><td>{b["as_of"]}</td></tr>']
    for p in sorted(RATES['platforms'], key=lambda p: -p['rate']):
        rows.append(f'<tr><td><strong>{p["name"]}</strong></td><td>{p["product"]}</td><td data-rate="{p["id"]}">{p["rate_label"]}</td><td>{p["conditions"].split(". ")[0]}.</td><td>{p["as_of"]}</td></tr>')
    return '<div class="table-scroll" tabindex="0" role="region" aria-label="Savings rate comparison table"><table class="cmp"><caption class="visually-hidden">Savings rates compared, per annum, before 20% tax</caption><thead><tr><th scope="col">Platform</th><th scope="col">Product</th><th scope="col">Base rate p.a.</th><th scope="col">Key condition</th><th scope="col">As of</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table></div>'

def logo_strip():
    return ''.join(tile(p, 160, 44) for p in RATES['platforms'])

def thumb(m):
    # Real art drops in at site/assets/articles/<slug>.jpg; until then the SVG placeholder is used.
    slug = m.group(1)
    for ext in ('jpg', 'webp', 'png'):
        if (SRC / f'assets/articles/{slug}.{ext}').exists(): return f'{{{{root}}}}assets/articles/{slug}.{ext}'
    return f'{{{{root}}}}assets/articles/{slug}.svg'

def build():
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir()
    for d in ['assets', 'css', 'js', 'vendor', 'data', 'config', 'downloads']:
        if (SRC / d).exists(): shutil.copytree(SRC / d, OUT / d)
    shutil.rmtree(OUT / 'assets/icons3d/src', ignore_errors=True)  # raw renders, not needed live
    pages = []
    for f in sorted((SRC / 'pages').rglob('*.html')):
        raw = f.read_text()
        m = re.match(r'<!--meta\s*(\{.*?\})\s*-->', raw, re.S); meta = json.loads(m.group(1)); body = raw[m.end():]
        path = meta['path']  # '' for home, 'tools/' etc, '404.html'
        depth = 0 if path in ('', '404.html') else path.count('/')
        root = './' if depth == 0 else '../' * depth
        head_extra = ''
        if path == '404.html':
            root = ''
            head_extra = '<script>document.write(\'<base href="\'+(location.hostname.endsWith("github.io")?"/pisowais-site/":"/")+\'">\')</script>'
        body = body.replace('{{platform_cards}}', platform_cards()).replace('{{rate_table}}', rate_table()).replace('{{logo_strip}}', logo_strip()).replace('{{checked}}', RATES['checked'])
        body = re.sub(r'\{\{thumb:([a-z0-9-]+)\}\}', thumb, body)
        if path.startswith('guides/') and path.count('/') == 2: body = point_icons(path.split('/')[1], body)
        og_image, og_w, og_h, og_alt = SITE + '/assets/og-image.png', '1200', '630', 'Piso Wais: simple money habits for Filipinos'
        sect = path.split('/')[0] if path.count('/') == 2 else ''
        if sect in ('guides', 'plays'):
            slug = path.split('/')[1]
            cslug = slug if sect == 'guides' else 'play-' + slug
            if (SRC / f'assets/articles/{cslug}.jpg').exists():
                h1 = re.search(r'<h1>(.*?)</h1>', body, re.S)
                alt = html.escape(re.sub(r'<[^>]+>', '', h1.group(1)) if h1 else meta['title'], quote=True)
                og_image, og_w, og_h, og_alt = f'{SITE}/assets/articles/{cslug}.jpg', '1200', '800', 'Cover image: ' + alt
                if sect == 'guides':
                    fig = f'<div class="wrap"><figure class="article-cover"><img src="{{{{root}}}}assets/articles/{cslug}.jpg" alt="Cover image: {alt}" width="600" height="400" fetchpriority="high" decoding="async"></figure></div>'
                    body = body.replace('</section>', '</section>\n<section class="cover-sec">' + fig + '</section>', 1)
        canon = SITE + '/' + ('' if path == '404.html' else path)
        jsonld = meta.get('jsonld', 'org')
        if jsonld == 'article':
            ld = {"@context": "https://schema.org", "@type": "Article", "headline": meta['title'], "description": meta['desc'], "datePublished": meta.get('date', '2026-11-04'), "dateModified": meta.get('date', '2026-11-04'), "author": {"@type": "Organization", "name": "Piso Wais"}, "publisher": {"@type": "Organization", "name": "Piso Wais", "logo": {"@type": "ImageObject", "url": SITE + '/assets/brand/pisowais-badge.png'}}, "mainEntityOfPage": canon, "image": og_image}
        else:
            ld = {"@context": "https://schema.org", "@type": "Organization", "name": "Piso Wais", "url": SITE + '/', "logo": SITE + '/assets/brand/pisowais-badge.png', "sameAs": ["https://www.facebook.com/pisowaisph"], "description": "Simple money habits for Filipinos. Educational content, not financial advice."}
        page = (SRC / 'dashboard-layout.html').read_text() if meta.get('layout') == 'dashboard' else LAYOUT
        for k, v in {'title': meta['title'], 'desc': meta['desc'], 'canonical': canon, 'nav': nav(path), 'body': body, 'jsonld': json.dumps(ld), 'scripts': meta.get('scripts', ''), 'robots': 'noindex,nofollow' if path == '404.html' or meta.get('layout') == 'dashboard' else 'index,follow', 'year': '2026', 'head_extra': head_extra, 'og_image': og_image, 'og_w': og_w, 'og_h': og_h, 'og_alt': og_alt}.items():
            page = page.replace('{{' + k + '}}', v)
        page = page.replace('{{root}}', root)
        dest = OUT / (path + 'index.html' if path.endswith('/') or path == '' else path)
        dest.parent.mkdir(parents=True, exist_ok=True); dest.write_text(page)
        if path != '404.html' and meta.get('layout') != 'dashboard': pages.append(path)
    (OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{SITE}/{p}</loc><lastmod>{RATES["checked"]}</lastmod></url>\n' for p in pages) + '</urlset>\n')
    (OUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
    import os
    if os.environ.get('NO_CNAME') != '1':  # NO_CNAME=1 only while QA-testing on github.io
        (OUT / 'CNAME').write_text('pisowais.johnnybodegas.com')
    (OUT / '.nojekyll').write_text('')
    print('built', len(pages) + 1, 'pages')

if __name__ == '__main__': build()
