import asyncio
from playwright.async_api import async_playwright
from PIL import Image
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        for name,vw,vh,dpr in [('desk',1600,900,1),('mob',390,1400,2)]:
            pg = await b.new_page(viewport={'width':vw,'height':vh},device_scale_factor=dpr)
            await pg.goto('http://localhost:8765/'); await pg.wait_for_timeout(7000)
            await pg.add_style_tag(content='.hero-inner,.site-header,.sticky-cta,.hero-stage:after{visibility:hidden}')
            await pg.wait_for_timeout(400)
            await pg.locator('.hero-stage').screenshot(path=f'qa/poster_{name}.png')
        await b.close()
    d=Image.open('qa/poster_desk.png').convert('RGB'); d.save('site/assets/hero-poster.jpg',quality=82,optimize=True,progressive=True); d.save('site/assets/hero-poster.webp',quality=78)
    m=Image.open('qa/poster_mob.png').convert('RGB'); m.save('site/assets/hero-poster-mobile.webp',quality=78)
    print(d.size,m.size)
asyncio.run(main())
