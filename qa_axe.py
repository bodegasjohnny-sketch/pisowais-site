import asyncio, sys, json
from playwright.async_api import async_playwright
PAGES = ['', 'tools/', 'platforms/', 'guides/', 'guides/credit-card-for-business/', 'about/', 'disclosure/', 'privacy/']
async def main(base):
    axe = open('/tmp/axe/axe.min.js').read(); res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for vp in [{'width': 390, 'height': 844}, {'width': 1280, 'height': 800}]:
            pg = await b.new_page(viewport=vp)
            for path in PAGES:
                await pg.goto(base + path); await pg.wait_for_timeout(1200)
                await pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))"); await pg.wait_for_timeout(900)
                await pg.add_script_tag(content=axe)
                r = await pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes.slice(0,2).map(n=>n.target.join(' ')+' :: '+(n.failureSummary||'').slice(0,160))})))")
                res[f"{vp['width']} {path or '/'}"] = r
        await b.close()
    print(json.dumps(res, indent=1))
asyncio.run(main(sys.argv[1]))
