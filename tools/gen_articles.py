#!/usr/bin/env python3
"""Generates batch-1 article pages, the /guides/ feed, /plays/ pages and the home section.
Run: python3 tools/gen_articles.py && python3 build.py"""
import sys, json, pathlib, re, html
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from articles_data import ARTICLES, EXISTING, D, ASOF
from articles_more import MORE, ACTIONS
import thumbs
P = pathlib.Path('site/pages')
CATS = [('all', 'All'), ('loans', 'Loans and borrowing'), ('credit', 'Credit score'), ('saving', 'Saving and budgeting'), ('investing', 'Investing and insurance'), ('seasonal', 'Seasonal and extra income'), ('safety', 'Safety')]
CATNAME = dict(CATS)
FOOT = '<p class="page-foot">Educational only, not financial advice. Rates and rules change, check the official source.</p>'
PLAYS = [('loan-basics', 'Basic Elements of Loan', '10 questions on principal, interest, term and more.', 'Loans and borrowing'), ('financial-fitness', 'How Financially Fit Are You?', '12 habit questions, score out of 36.', 'Saving and budgeting'), ('borrowing-basics', 'Basics of Borrowing', '10 questions on what to know before you apply.', 'Loans and borrowing')]
PLAYNAME = {p[0]: p[1] for p in PLAYS}
def nice(d): import datetime; return datetime.date.fromisoformat(d).strftime('%b %-d, %Y')

def ex_box(t):
    lab = '' if t.startswith('Example only') else '<span class="ex-tag">Example</span> '
    return f'<div class="example"><p class="small">{lab}{t}</p></div>'

TOOLS = {
 'amort': '''<section class="tool-box" id="calc" aria-labelledby="calc-h"><p class="eyebrow">Try it, in your browser</p><h2 id="calc-h">Amortization mini calculator</h2><p class="small muted">Example only, not a real offer. Diminishing balance, fixed monthly payment. Fees not included. Nothing is sent anywhere.</p>
<form id="t-amort" class="tool-form"><label>Amount borrowed (&#8369;)<input name="p" type="number" inputmode="decimal" min="1" value="50000"></label><label>Interest per month (%)<input name="r" type="number" inputmode="decimal" step="0.01" min="0" value="1.5"></label><label>Months<input name="n" type="number" inputmode="numeric" min="1" max="360" value="12"></label></form><div id="t-amort-out" aria-live="polite"></div></section>''',
 'budget': '''<section class="tool-box" id="calc" aria-labelledby="calc-h"><p class="eyebrow">Try it, in your browser</p><h2 id="calc-h">50-30-20 calculator</h2><p class="small muted">Example only. Nothing is sent anywhere.</p><form id="t-budget" class="tool-form"><label>Monthly take-home pay (&#8369;)<input name="t" type="number" inputmode="decimal" min="0" value="25000"></label></form><div id="t-budget-out" aria-live="polite"></div></section>''',
 'efund': '''<section class="tool-box" id="calc" aria-labelledby="calc-h"><p class="eyebrow">Try it, in your browser</p><h2 id="calc-h">Emergency fund target</h2><p class="small muted">Example only. Nothing is sent anywhere.</p><form id="t-efund" class="tool-form"><label>Monthly essentials (&#8369;)<input name="m" type="number" inputmode="decimal" min="0" value="18000"></label></form><div id="t-efund-out" aria-live="polite"></div></section>''',
 '13th': '''<section class="tool-box" id="calc" aria-labelledby="calc-h"><p class="eyebrow">Try it, in your browser</p><h2 id="calc-h">13th month estimate</h2><p class="small muted">Estimate of the minimum (1/12 of basic salary earned in the year). Example only. Nothing is sent anywhere.</p><form id="t-13th" class="tool-form"><label>Monthly basic salary (&#8369;)<input name="b" type="number" inputmode="decimal" min="0" value="20000"></label><label>Months worked this year<input name="mo" type="number" min="0" max="12" value="12"></label></form><div id="t-13th-out" aria-live="polite"></div></section>''',
 'ipon': '''<section class="tool-box" id="calc" aria-labelledby="calc-h"><p class="eyebrow">Try it, in your browser</p><h2 id="calc-h">2027 ipon challenge generator</h2><p class="small muted">Starts Monday, Jan 4, 2027. Example only. Nothing is sent or saved.</p><form id="t-ipon" class="tool-form"><label>Amount per unit or per week (&#8369;)<input name="b" type="number" inputmode="decimal" min="0" value="20"></label><label>Weeks<input name="w" type="number" min="1" max="52" value="52"></label><label>Style<select name="mode"><option value="up">Ascending 52-week</option><option value="down">Reverse, descending</option><option value="flat">Flat weekly</option></select></label></form><div id="t-ipon-out" aria-live="polite"></div></section>''',
}

LADDER = '''<section class="ladder" aria-labelledby="ladder-h"><p class="eyebrow">Your next step</p><h2 id="ladder-h">Learn more, at your pace</h2><ol class="ladder-steps">
<li><span class="tag live">Free now</span><h3>Piso Wais cheat sheet</h3><p class="small">Credit card rules, idle money ladder, 30-day cash flow plan.</p><a class="btn btn-navy btn-sm" href="{{root}}#cheatsheet">Get the free cheat sheet</a></li>
<li><span class="tag ph">Placeholder</span><h3>Premium Pack</h3><p class="small">Planned worksheets and templates. Not available yet, nothing to buy.</p></li>
<li><span class="tag build">Being built</span><h3>Cash-Flow Check</h3><p class="small">A guided check of where your money leaks. Coming later.</p></li></ol></section>'''

def article_page(a):
    thumbs.write(a['slug'], a['cat'])
    lessons = a['lessons'] + MORE.get(a['slug'], [])
    L = []
    for i, (h, body, ex) in enumerate(lessons, 1):
        L.append(f'<section class="lesson" aria-labelledby="l{i}"><div class="lnum" aria-hidden="true">{i}</div><div><p class="eyebrow">Lesson {i} <span class="tag free">Free</span></p><h2 id="l{i}">{h}</h2>{body}{ex_box(ex) if ex else ""}</div></section>')
        if i == 2 and a.get('tool'): L.append(TOOLS[a['tool']])
    pains = ''.join(f'<article class="card pain"><div class="ico" aria-hidden="true">{ic}</div><h3>{h}</h3><p>{p}</p></article>' for ic, h, p in a['pains'])
    faq = ''.join(f'<details class="faq"><summary>{q}</summary><p>{x}</p></details>' for q, x in a['faq'])
    src = ''
    if a['sources']:
        src = '<section class="sources" aria-labelledby="src-h"><h2 id="src-h">Sources</h2><ul>' + ''.join(f'<li><a href="{u}" target="_blank" rel="noopener">{html.escape(t)}</a>, checked {ASOF}</li>' for t, u in a['sources']) + '</ul></section>'
    acts = ''.join(f'<li>{html.escape(x)}</li>' for x in ACTIONS.get(a['slug'], []))
    meta = dict(title=f"{a['title']} | Piso Wais", desc=re.sub('<[^>]+>', '', a['lead'])[:155], path=f"guides/{a['slug']}/", jsonld='article', date=D)
    if a.get('tool'): meta['scripts'] = '<script type="module" src="{{root}}js/article-tools.js"></script>'
    play = a['play']
    body = f'''<!--meta {json.dumps(meta)} -->
<section class="page-hero art-hero"><div class="wrap"><p class="crumbs"><a href="{{{{root}}}}">Home</a> / <a href="{{{{root}}}}guides/">Guides</a> / {CATNAME[a['cat']]}</p><p class="kicker">{a['kicker']}</p><h1>{a['title']}</h1><p class="hook">{a['hook']}</p><p>{a['lead']}</p><p class="small">Piso Wais, published <time datetime="{D}">{nice(D)}</time></p></div></section>
<div class="wrap article art">
<div class="notice"><strong>Educational only, not financial advice.</strong> Peso amounts marked Example are illustrations, not real offers.</div>
<section aria-labelledby="sf-h"><p class="eyebrow">Sound familiar?</p><h2 id="sf-h" class="visually-hidden">Common situations</h2><div class="grid pains">{pains}</div></section>
{''.join(L)}
{a.get('extra', '')}
<section class="actions-box" aria-labelledby="act-h"><h2 id="act-h">Your 7-day action</h2><ol>{acts}</ol></section>
<section class="play-promo"><p class="eyebrow">Quick quiz, 3 minutes</p><h2>{PLAYNAME[play]}</h2><p>One question per screen, no sign-up, answers stay on your phone.</p><a class="btn btn-gold" href="{{{{root}}}}plays/{play}/">Take the quiz</a></section>
{LADDER}
<section aria-labelledby="faq-h"><h2 id="faq-h">FAQ</h2>{faq}</section>
{src}
{FOOT}
</div>
'''
    (P / 'guides' / f"{a['slug']}.html").write_text(body)

def feed_items():
    items = [dict(slug=a['slug'], cat=a['cat'], title=a['title'], blurb=a['hook'], date=D, href=f"guides/{a['slug']}/") for a in ARTICLES]
    for e in EXISTING:
        thumbs.write(e['slug'], e['cat'])
        items.append(dict(e, date='2026-11-04', href=f"guides/{e['slug']}/"))
    return items

def card(it, cls='feed-card'):
    return f'''<article class="{cls}" data-cat="{it['cat']}"><a href="{{{{root}}}}{it['href']}"><img src="{{{{thumb:{it['slug']}}}}}" alt="" width="600" height="400" loading="lazy"><div class="fc-body"><span class="tag">{CATNAME[it['cat']]}</span><h3>{it['title']}</h3><p class="small muted"><time datetime="{it['date']}">{nice(it['date'])}</time></p></div></a></article>'''

def guides_index(items):
    chips = ''.join(f'<button type="button" data-cat="{k}" aria-pressed="{"true" if k == "all" else "false"}">{v}</button>' for k, v in CATS)
    meta = dict(title='Piso Wais guides: loans, credit, saving, safety | Piso Wais', desc='Practical money guides for Filipinos: loans, credit reports, budgeting, ipon challenges, 13th month pay and scam safety.', path='guides/', scripts='<script type="module" src="{{root}}js/feed.js"></script>')
    plays = ''.join(card(dict(slug='play-' + s, cat='loans' if 'loan' in s or 'borrow' in s else 'saving', title=t + ' (quiz)', date=D, href=f'plays/{s}/')) for s, t, _, _ in PLAYS)
    for s, *_ in PLAYS: thumbs.write('play-' + s, 'play')
    (P / 'guides.html').write_text(f'''<!--meta {json.dumps(meta)} -->
<section class="page-hero"><div class="wrap"><p class="crumbs"><a href="{{{{root}}}}">Home</a> / Guides</p><p class="kicker">Articles and quizzes</p><h1>Guides</h1><p>Practical, Philippines-specific. Peso examples are labelled, facts are sourced and dated.</p><p class="disclaimer-pill">Educational only, not financial advice.</p></div></section>
<section class="feed"><div class="wrap">
<div class="feed-tools"><label class="search"><span class="visually-hidden">Search guides</span><input id="feed-q" type="search" placeholder="Search guides" autocomplete="off"></label>
<div class="feed-chips" role="group" aria-label="Filter by topic">{chips}</div></div>
<div class="feed-grid">{''.join(card(i) for i in items)}{plays}</div>
<p id="feed-empty" class="muted" hidden>No guides match. Try another word or tap All.</p>
{FOOT}</div></section>
''')

def plays_pages():
    for s, *_ in PLAYS: pass
    cards = ''.join(f'<article class="feed-card play-card-link" data-cat="loans"><a href="{{{{root}}}}plays/{s}/"><img src="{{{{thumb:play-{s}}}}}" alt="" width="600" height="400" loading="lazy"><div class="fc-body"><span class="tag">{c}</span><h3>{t}</h3><p class="small muted">{d}</p></div></a></article>' for s, t, d, c in PLAYS)
    meta = dict(title='Piso Wais quizzes: loans, borrowing, financial fitness | Piso Wais', desc='Three free browser-only money quizzes. No sign-up, nothing collected.', path='plays/')
    (P / 'plays').mkdir(exist_ok=True)
    (P / 'plays.html').write_text(f'''<!--meta {json.dumps(meta)} -->
<section class="page-hero"><div class="wrap"><p class="crumbs"><a href="{{{{root}}}}">Home</a> / Quizzes</p><p class="kicker">Free, 3 minutes each</p><h1>Quick money quizzes</h1><p>Alamin kung saan ka malakas at saan pa pwedeng mag-improve. No sign-up. Your answers stay in your browser.</p></div></section>
<section><div class="wrap"><div class="feed-grid">{cards}</div>{FOOT}</div></section>
''')
    for s, t, d, c in PLAYS:
        meta = dict(title=f'{t} | Piso Wais quiz', desc=d + ' Free, browser-only, no sign-up.', path=f'plays/{s}/', scripts='<script type="module" src="{{root}}js/plays-ui.js"></script>')
        (P / 'plays' / f'{s}.html').write_text(f'''<!--meta {json.dumps(meta)} -->
<section class="page-hero art-hero"><div class="wrap"><p class="crumbs"><a href="{{{{root}}}}">Home</a> / <a href="{{{{root}}}}plays/">Quizzes</a></p><p class="kicker">Free quiz</p><h1>{t}</h1><p>{d} One question per screen. No data collected, no sign-up.</p>
<div class="lang-toggle" role="group" aria-label="Language"><button type="button" data-lang="en" aria-pressed="true">English</button><button type="button" data-lang="fil" aria-pressed="false">Filipino</button></div></div></section>
<section><div class="wrap play-wrap"><div id="play" data-play="{s}" data-root="../../"><noscript><p>This quiz needs JavaScript. Our guides work without it.</p></noscript></div>
<p class="small muted">Your progress is saved only in this browser (localStorage) so you can continue later. Nothing is sent to Piso Wais or anyone else.</p>
{FOOT}</div></section>
''')

def home_section(items):
    latest = items[:6]
    plays = ''.join(f'<a class="mini-play" href="{{{{root}}}}plays/{s}/"><span class="tag">Quiz</span><strong>{t}</strong><span class="small muted">{d}</span></a>' for s, t, d, c in PLAYS)
    sec = f'''<!--ARTICLES-START-->
<section aria-labelledby="art-title" class="home-articles">
  <div class="wrap">
    <div class="section-head reveal"><p class="eyebrow">Articles and Surveys</p><h2 id="art-title">Basahin, sagutan, i-apply.</h2><p class="muted">New guides on loans, credit, budgeting and scam safety, plus three quick quizzes. Free, no sign-up.</p></div>
    <div class="feed-grid">{''.join(card(i) for i in latest)}</div>
    <div class="mini-plays">{plays}</div>
    <p><a class="btn btn-navy" href="{{{{root}}}}guides/">See all guides</a> <a class="btn btn-ghost" href="{{{{root}}}}plays/">All quizzes</a></p>
  </div>
</section>
<!--ARTICLES-END-->'''
    f = P / 'index.html'; s = f.read_text()
    if '<!--ARTICLES-START-->' in s:
        s = re.sub(r'<!--ARTICLES-START-->.*?<!--ARTICLES-END-->', lambda m: sec, s, flags=re.S)
    else:
        anchor = '<section aria-labelledby="tools-title">'
        s = s.replace(anchor, sec + '\n\n' + anchor, 1)
    f.write_text(s)

if __name__ == '__main__':
    for a in ARTICLES: article_page(a)
    items = feed_items(); guides_index(items); plays_pages(); home_section(items)
    print('generated', len(ARTICLES), 'articles')
