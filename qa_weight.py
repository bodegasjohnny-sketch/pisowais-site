import asyncio, sys, json
from playwright.async_api import async_playwright
async def main(base):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        out = {}
        for name, vp in [('mobile', {'width': 390, 'height': 844}), ('desktop', {'width': 1280, 'height': 800})]:
            ctx = await b.new_context(viewport=vp); pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
            await cdp.send('Network.enable'); sizes = {}; urls = {}
            cdp.on('Network.responseReceived', lambda e: urls.__setitem__(e['requestId'], e['response']['url']))
            cdp.on('Network.loadingFinished', lambda e: sizes.__setitem__(e['requestId'], e['encodedDataLength']))
            await pg.goto(base, wait_until='networkidle'); await pg.wait_for_timeout(4000)
            tot = sum(sizes.values()); three = sum(v for k, v in sizes.items() if 'three.module' in urls.get(k, ''))
            out[name] = {'total_kb': round(tot / 1024), 'three_kb': round(three / 1024), 'excl_three_kb': round((tot - three) / 1024), 'requests': len(sizes),
                         'top': sorted([(round(v / 1024), urls.get(k, '').split('/')[-1]) for k, v in sizes.items()], reverse=True)[:6]}
            await ctx.close()
        print(json.dumps(out, indent=1)); await b.close()
asyncio.run(main(sys.argv[1]))
