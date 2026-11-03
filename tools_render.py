"""Render the cheat sheet PDF and its cover image, plus the hero poster, OG image and favicons."""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).parent
async def main(what):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        if 'pdf' in what:
            pg = await b.new_page()
            await pg.goto((ROOT / 'site/cheatsheet/cheatsheet.html').as_uri()); await pg.wait_for_timeout(600)
            await pg.pdf(path=str(ROOT / 'site/downloads/piso-wais-cheat-sheet.pdf'), format='A4', print_background=True, prefer_css_page_size=True)
            pg2 = await b.new_page(viewport={'width': 794, 'height': 1123})
            await pg2.goto((ROOT / 'site/cheatsheet/cheatsheet.html').as_uri()); await pg2.wait_for_timeout(600)
            await pg2.screenshot(path=str(ROOT / 'qa/cover_full.png'), clip={'x': 0, 'y': 0, 'width': 794, 'height': 1123})
        await b.close()
asyncio.run(main(sys.argv[1:]))
