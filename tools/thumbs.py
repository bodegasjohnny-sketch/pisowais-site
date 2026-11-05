"""On-brand placeholder SVG thumbnails (original shapes, no stock art)."""
import pathlib
PAL = dict(cream='#FCFBF7', navy='#121F47', blue='#1F4EA6', gold='#F9B909', pink='#FDAFB0', terra='#D6674B')
ICONS = {
 'loans': '<rect x="430" y="260" width="340" height="220" rx="26" fill="{navy}"/><rect x="470" y="300" width="160" height="22" rx="11" fill="{gold}"/><rect x="470" y="345" width="260" height="14" rx="7" fill="#fff" opacity=".7"/><rect x="470" y="375" width="200" height="14" rx="7" fill="#fff" opacity=".5"/><circle cx="720" cy="430" r="28" fill="{terra}"/>',
 'credit': '<rect x="400" y="280" width="400" height="250" rx="30" fill="{blue}"/><rect x="400" y="330" width="400" height="44" fill="{navy}"/><rect x="440" y="420" width="70" height="50" rx="10" fill="{gold}"/><rect x="540" y="440" width="200" height="16" rx="8" fill="#fff" opacity=".7"/>',
 'saving': '<ellipse cx="600" cy="420" rx="200" ry="150" fill="{pink}"/><rect x="560" y="250" width="80" height="18" rx="9" fill="{navy}"/><circle cx="600" cy="210" r="48" fill="{gold}" stroke="{navy}" stroke-width="10"/><circle cx="680" cy="390" r="14" fill="{navy}"/><rect x="470" y="540" width="40" height="50" rx="10" fill="{terra}"/><rect x="690" y="540" width="40" height="50" rx="10" fill="{terra}"/>',
 'investing': '<rect x="420" y="450" width="70" height="120" rx="12" fill="{blue}"/><rect x="520" y="380" width="70" height="190" rx="12" fill="{navy}"/><rect x="620" y="300" width="70" height="270" rx="12" fill="{gold}"/><rect x="720" y="240" width="70" height="330" rx="12" fill="{terra}"/>',
 'seasonal': '<circle cx="600" cy="400" r="170" fill="{gold}"/><text x="600" y="455" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="800" font-size="150" fill="{navy}">13</text><circle cx="800" cy="250" r="34" fill="{terra}"/><circle cx="400" cy="560" r="24" fill="{pink}"/>',
 'safety': '<path d="M600 210 L780 280 V420 C780 520 700 580 600 620 C500 580 420 520 420 420 V280 Z" fill="{navy}"/><path d="M530 410 L585 465 L680 360" stroke="{gold}" stroke-width="30" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
 'play': '<rect x="400" y="230" width="400" height="360" rx="40" fill="{navy}"/><circle cx="600" cy="360" r="70" fill="{gold}"/><text x="600" y="390" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="800" font-size="90" fill="{navy}">?</text><rect x="470" y="470" width="260" height="22" rx="11" fill="#fff" opacity=".8"/><rect x="470" y="510" width="180" height="22" rx="11" fill="{pink}"/>',
}
BG = {'loans': 'cream', 'credit': 'pink', 'saving': 'cream', 'investing': 'pink', 'seasonal': 'cream', 'safety': 'pink', 'play': 'gold'}
def svg(cat, w=1200, h=800):
    bg = PAL[BG.get(cat, 'cream')]
    body = ICONS.get(cat, ICONS['saving']).format(**PAL)
    deco = f'<circle cx="120" cy="120" r="180" fill="{PAL["gold"]}" opacity=".35"/><circle cx="1110" cy="740" r="220" fill="{PAL["blue"]}" opacity=".12"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="{w}" height="{h}" role="img" aria-hidden="true"><rect width="1200" height="800" fill="{bg}"/>{deco}{body}</svg>'
def write(slug, cat):
    d = pathlib.Path('site/assets/articles'); d.mkdir(parents=True, exist_ok=True)
    (d / f'{slug}.svg').write_text(svg(cat))

# 3D thumbnail style (batch 2 onward). Full recipe: THUMBNAIL_STYLE_3D.md.
# Batch 1 live covers (site/assets/articles/<slug>.jpg) are NOT touched by this.
PROMPT_3D = ('Polished 3D render illustration for a blog cover about {topic}: {objects}, cute clay-like 3D style with soft '
             'studio lighting and soft shadows, on a deep navy #121F47 background with a soft radial glow and a large warm '
             'yellow #F9B909 circle shape behind the objects, soft pink #FDAFB0 accents, clean minimal composition, wide '
             'landscape, no text, no letters, no numbers, no logos.')
def prompt_3d(topic, objects): return PROMPT_3D.format(topic=topic, objects=objects)
def cover_3d(src, dest, w=1200, h=800, quality=86):
    """Center-crop a generated render to 3:2 and save as a 1200x800 progressive JPG."""
    from PIL import Image
    im = Image.open(src).convert('RGB'); W, H = im.size; r = w / h
    if W / H > r: nw = int(H * r); im = im.crop(((W - nw) // 2, 0, (W - nw) // 2 + nw, H))
    else: nh = int(W / r); im = im.crop((0, (H - nh) // 2, W, (H - nh) // 2 + nh))
    dest = pathlib.Path(dest); dest.parent.mkdir(parents=True, exist_ok=True)
    im.resize((w, h), Image.LANCZOS).save(dest, 'JPEG', quality=quality, optimize=True, progressive=True)
