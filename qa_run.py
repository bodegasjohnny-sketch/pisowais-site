"""Real-browser QA. Usage: python3 qa_run.py BASE_URL LABEL
Screenshots every page (mobile 390x844, desktop 1280x800), checks console errors, horizontal scroll,
hero mode, broken internal links/assets, and exercises every tool. Results -> qa/<label>/report.json"""
import asyncio, json, sys, re, urllib.parse, pathlib, time
from playwright.async_api import async_playwright
BASE = sys.argv[1].rstrip('/') + '/'; LABEL = sys.argv[2]
OUT = pathlib.Path('qa') / LABEL; OUT.mkdir(parents=True, exist_ok=True)
PAGES = ['', 'tools/', 'platforms/', 'guides/', 'guides/credit-card-for-business/', 'guides/where-to-park-idle-money/', 'guides/cash-flow-gaps/', 'guides/bank-vs-digital-bank-vs-ewallet/', 'guides/debt-snowball-vs-avalanche/', 'guides/emergency-fund-daily-income/', 'about/', 'disclosure/', 'privacy/', 'this-page-does-not-exist/']
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
VIEWS = {'mobile': dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True), 'desktop': dict(viewport={'width': 1280, 'height': 800})}
CLS_JS = """window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries()){if(!e.hadRecentInput)window.__cls+=e.value}}).observe({type:'layout-shift',buffered:true});
window.__lcp=0;new PerformanceObserver(l=>{const e=l.getEntries();window.__lcp=e[e.length-1].startTime}).observe({type:'largest-contentful-paint',buffered:true});"""
async def main():
    rep = {'base': BASE, 'when': time.strftime('%Y-%m-%d %H:%M %Z'), 'pages': {}, 'links': {}, 'tools': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        links = set()
        for vname, vopt in VIEWS.items():
            ctx = await b.new_context(**vopt); await ctx.add_init_script(CLS_JS)
            for path in PAGES:
                pg = await ctx.new_page(); errs = []; bad = []
                pg.on('console', lambda m, e=errs: e.append(m.text) if m.type == 'error' else None)
                pg.on('pageerror', lambda x, e=errs: e.append('PAGEERROR ' + str(x)))
                pg.on('response', lambda r, bd=bad: bd.append((r.status, r.url)) if r.status >= 400 else None)
                t0 = time.time(); resp = await pg.goto(BASE + path, wait_until='load'); load = time.time() - t0
                await pg.wait_for_timeout(2500)
                # scroll through for reveals
                h = await pg.evaluate('document.body.scrollHeight')
                for y in range(0, h, 600): await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(60)
                await pg.evaluate('window.scrollTo(0,0)'); await pg.wait_for_timeout(1200)
                m = await pg.evaluate("""()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,cls:window.__cls,lcp:window.__lcp,
                    nav:performance.getEntriesByType('navigation')[0]?.toJSON(), hero:document.querySelector('.hero')?.dataset.heroMode||null,
                    title:document.title, canon:document.querySelector('link[rel=canonical]')?.href, h1:document.querySelectorAll('h1').length,
                    imgsNoAlt:[...document.images].filter(i=>!i.hasAttribute('alt')).length, brokenImgs:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.loading!=='lazy').map(i=>i.src),
                    disclaimer:document.body.innerText.includes('Educational only, not financial advice'),
                    links:[...document.querySelectorAll('a[href]')].map(a=>a.href)})""")
                links.update(m.pop('links'))
                fn = (path.strip('/').replace('/', '_') or 'home')
                await pg.screenshot(path=str(OUT / f'{vname}_{fn}.png'), full_page=True)
                nav = m.pop('nav') or {}
                rep['pages'].setdefault(path, {})[vname] = {**m, 'status': resp.status if resp else None, 'load_s': round(load, 2), 'domContentLoaded_ms': round(nav.get('domContentLoadedEventEnd', 0)), 'loadEvent_ms': round(nav.get('loadEventEnd', 0)), 'console_errors': errs, 'http_errors': bad, 'hscroll': m['sw'] > m['cw']}
                await pg.close()
            await ctx.close()
        # tools interaction (mobile + desktop)
        for vname, vopt in VIEWS.items():
            ctx = await b.new_context(**vopt); pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda x: errs.append(str(x)))
            await pg.goto(BASE + 'tools/'); await pg.wait_for_timeout(1500)
            await pg.fill('#cmp-amount', '100000') if False else None
            await pg.evaluate("""()=>{const s=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};s('cmp-amount',100000);s('cmp-monthly',0);s('cmp-years',1)}""")
            await pg.wait_for_timeout(1200)
            cards = await pg.inner_text('#cmp-cards'); notes = await pg.inner_text('#cmp-notes')
            await pg.locator('#compounder').screenshot(path=str(OUT / f'{vname}_tool_compounder.png'))
            await pg.fill('#lev-purchase', '30000'); await pg.fill('#lev-cashback', '39000'); await pg.fill('#lev-days', '35'); await pg.fill('#lev-float', '45'); await pg.fill('#lev-rate', '3'); await pg.fill('#lev-limit', '200000')
            await pg.wait_for_timeout(300); g = await pg.get_attribute('.verdict', 'class')
            await pg.locator('#leverage').screenshot(path=str(OUT / f'{vname}_tool_leverage_green.png'))
            await pg.fill('#lev-days', '65'); await pg.wait_for_timeout(300); y = await pg.get_attribute('.verdict', 'class'); ytxt = await pg.inner_text('#lev-out')
            await pg.locator('#leverage').screenshot(path=str(OUT / f'{vname}_tool_leverage_yellow.png'))
            await pg.fill('#lev-cashback', '29000'); await pg.wait_for_timeout(300); r = await pg.get_attribute('.verdict', 'class')
            await pg.locator('#leverage').screenshot(path=str(OUT / f'{vname}_tool_leverage_red.png'))
            # quiz: submit empty first
            await pg.click('#quiz-form button[type=submit]'); await pg.wait_for_timeout(300); empty_msg = await pg.inner_text('#quiz-out')
            answers = {'cash': 0, 'pricing': 2, 'inventory': 1, 'tracking': 0, 'followup': 2, 'owner': 2, 'marketing': 2, 'debt': 1, 'idle': 2, 'credit': 2}
            for k, v in answers.items(): await pg.check(f'input[name={k}][value="{v}"]')
            await pg.click('#quiz-form button[type=submit]'); await pg.wait_for_timeout(500)
            qtxt = await pg.inner_text('#quiz-out')
            await pg.locator('#bottleneck').screenshot(path=str(OUT / f'{vname}_tool_quiz_done.png'))
            rep['tools'][vname] = {'compounder_cards': cards, 'compounder_notes': notes, 'lev_green': g, 'lev_yellow': y, 'lev_yellow_text': ytxt, 'lev_red': r, 'quiz_empty_msg': empty_msg, 'quiz_result': qtxt, 'errors': errs}
            # lead form states on home
            await pg.goto(BASE); await pg.wait_for_timeout(800)
            await pg.locator('#cheatsheet').scroll_into_view_if_needed()
            await pg.fill('#lead-email', 'not-an-email'); await pg.click('.lead-form button'); await pg.wait_for_timeout(300)
            inv = await pg.inner_text('#cheatsheet .form-status')
            await pg.locator('#cheatsheet').screenshot(path=str(OUT / f'{vname}_form_invalid.png'))
            async with pg.expect_download() as dl:
                await pg.fill('#lead-email', 'test@example.com'); await pg.click('.lead-form button')
            d = await dl.value; await pg.wait_for_timeout(300)
            ok = await pg.inner_text('#cheatsheet .form-status')
            await pg.locator('#cheatsheet').screenshot(path=str(OUT / f'{vname}_form_submitted.png'))
            rep['tools'][vname].update({'form_invalid': inv, 'form_ok': ok, 'form_download': d.suggested_filename})
            # sticky CTA on mobile
            if vname == 'mobile':
                await pg.evaluate('window.scrollTo(0,1400)'); await pg.wait_for_timeout(600)
                rep['tools']['sticky_visible'] = await pg.evaluate("getComputedStyle(document.querySelector('.sticky-cta')).visibility")
                await pg.screenshot(path=str(OUT / 'mobile_sticky_cta.png'))
            await ctx.close()
        # fallbacks
        for name, opts, url in [('reduced_motion', {'reduced_motion': 'reduce'}, BASE), ('poster_param', {}, BASE + '?hero=poster')]:
            ctx = await b.new_context(viewport={'width': 1280, 'height': 800}, **opts); pg = await ctx.new_page()
            await pg.goto(url); await pg.wait_for_timeout(3000)
            rep['tools'][name] = await pg.evaluate("({mode:document.querySelector('.hero').dataset.heroMode, canvas:!!document.querySelector('.hero-stage canvas'), poster:document.querySelector('.hero-poster').naturalWidth})")
            await pg.screenshot(path=str(OUT / f'hero_{name}.png')); await ctx.close()
        b2 = await p.chromium.launch(args=['--disable-gpu', '--disable-webgl', '--disable-3d-apis'])
        ctx = await b2.new_context(viewport={'width': 1280, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda x: errs.append(str(x)))
        await pg.goto(BASE); await pg.wait_for_timeout(3000)
        rep['tools']['webgl_disabled'] = await pg.evaluate("({mode:document.querySelector('.hero').dataset.heroMode, canvas:!!document.querySelector('.hero-stage canvas'), poster:document.querySelector('.hero-poster').naturalWidth})")
        rep['tools']['webgl_disabled']['errors'] = errs
        await pg.screenshot(path=str(OUT / 'hero_webgl_disabled.png')); await b2.close()
        # crawl links + assets
        ctx = await b.new_context(); req = ctx.request
        host = urllib.parse.urlparse(BASE).netloc
        internal = sorted({l.split('#')[0] for l in links if urllib.parse.urlparse(l).netloc == host})
        external = sorted({l.split('#')[0] for l in links if urllib.parse.urlparse(l).scheme.startswith('http') and urllib.parse.urlparse(l).netloc != host})
        for u in internal:
            r = await req.get(u); rep['links'][u] = r.status
        rep['external_links'] = external
        await b.close()
    (OUT / 'report.json').write_text(json.dumps(rep, indent=1))
    bad = {u: s for u, s in rep['links'].items() if s >= 400}
    print('internal links:', len(rep['links']), 'bad:', bad)
    for path, v in rep['pages'].items():
        for vn, d in v.items():
            flag = [k for k in ('hscroll',) if d[k]] + (['console'] if d['console_errors'] else []) + (['http'] if d['http_errors'] else []) + ([] if d['disclaimer'] else ['no-disclaimer'])
            print(f"{vn:7} {path or '/':42} {d['status']} load={d['load_s']}s dcl={d['domContentLoaded_ms']}ms cls={d['cls']:.3f} lcp={d['lcp']:.0f} hero={d['hero']} {flag} {d['console_errors'][:2]} {d['http_errors'][:2]}")
    t = rep['tools']; print(json.dumps({k: (v if not isinstance(v, dict) else {kk: (vv if len(str(vv)) < 200 else str(vv)[:200]) for kk, vv in v.items()}) for k, v in t.items()}, indent=1))
asyncio.run(main())
