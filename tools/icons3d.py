#!/usr/bin/env python3
"""Turns raw 3D icon renders (white background JPG, in site/assets/icons3d/src/) into transparent WebP
at 160px and 320px, plus a contact sheet. Run: python3 tools/icons3d.py"""
import pathlib, numpy as np
from PIL import Image
from scipy import ndimage
SRC = pathlib.Path('site/assets/icons3d/src'); OUT = pathlib.Path('site/assets/icons3d')

def cutout(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    mx, mn = a.max(2), a.min(2)
    bgish = (mn > 190) & ((mx - mn) < 22)           # light, low saturation: background or soft shadow
    lab, _ = ndimage.label(bgish)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    # inside the background region, alpha from darkness (keeps the soft contact shadow translucent)
    dark = (255 - a.mean(2)) / 255.0
    alpha = np.where(bg, np.clip((dark - 0.025) * 3.2, 0, 0.55), 1.0)
    alpha = ndimage.gaussian_filter(alpha, 0.8) * np.where(bg, 1, 1) 
    alpha = np.where(bg, alpha, 1.0)
    rgb = np.where(bg[..., None], np.full_like(a, 18 * 0 + 40), a)  # shadow pixels tinted dark navy-grey
    rgb[bg] = [24, 31, 60]
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA')
    bbox = Image.fromarray((alpha > 0.04).astype(np.uint8) * 255).getbbox()
    img = img.crop(bbox); w, h = img.size; s = int(max(w, h) * 1.06)
    sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(img, ((s - w) // 2, (s - h) // 2)); return sq

if __name__ == '__main__':
    names = sorted(p.stem for p in SRC.glob('*.jpg'))
    for n in names:
        sq = cutout(Image.open(SRC / f'{n}.jpg'))
        for px in (160, 320):
            sq.resize((px, px), Image.LANCZOS).save(OUT / f'{n}-{px}.webp', 'WEBP', quality=88, method=6)
    cols = 6; rows = -(-len(names) // cols); cell = 200
    from PIL import ImageDraw
    sheet = Image.new('RGB', (cols * cell, rows * (cell + 30)), '#FCFBF7'); d = ImageDraw.Draw(sheet)
    for i, n in enumerate(names):
        ic = Image.open(OUT / f'{n}-160.webp'); x, y = (i % cols) * cell, (i // cols) * (cell + 30)
        sheet.paste(ic, (x + 20, y + 15), ic); d.text((x + cell // 2, y + cell + 8), n, fill='#121F47', anchor='mt')
    sheet.save(OUT / 'contact-sheet.png'); print(len(names), 'icons')
