import asyncio,sys,json
from playwright.async_api import async_playwright
async def main(u):
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page()
    await pg.goto(u+'platforms/?v='+sys.argv[2]);await pg.wait_for_timeout(2500)
    r=await pg.evaluate("""[...document.querySelectorAll('[data-ref]')].map(a=>{const c=a.closest('article,.card,.platform')||a.parentElement;const t=c&&c.querySelector('.tag.aff');return {id:a.dataset.ref,href:a.href,rel:a.rel,tagVisible:!!(t&&t.offsetParent)}}).filter(x=>['gotyme','gcash'].includes(x.id))""")
    print(json.dumps(r));await b.close()
asyncio.run(main(sys.argv[1]))
