import asyncio
from playwright.async_api import async_playwright
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        for name,vw,vh in [('desk',1600,900),('mob',390,844)]:
            pg = await b.new_page(viewport={'width':vw,'height':vh})
            logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text)); pg.on('pageerror', lambda e: logs.append('PAGEERROR '+str(e)))
            await pg.goto('http://localhost:8765/'); await pg.wait_for_timeout(6000)
            mode = await pg.get_attribute('.hero','data-hero-mode'); print(name,'mode',mode, logs[:5])
            await pg.screenshot(path=f'qa/hero_live_{name}.png')
            # poster: hide text, capture only stage
            await pg.add_style_tag(content='.hero-inner,.site-header,.sticky-cta{visibility:hidden}')
            await pg.wait_for_timeout(500)
            box = await pg.locator('.hero').bounding_box()
            await pg.screenshot(path=f'qa/poster_src_{name}.png', clip=box)
        pg = await b.new_page(viewport={'width':1200,'height':630})
        await pg.goto('http://localhost:8765/og.html'); await pg.wait_for_timeout(800)
        await pg.screenshot(path='site/assets/og-image.png')
        await b.close()
asyncio.run(main())
