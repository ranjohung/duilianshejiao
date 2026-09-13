# -*- coding: utf-8 -*-
"""生成角色全身像（有腿有脚）——两段递进 outpaint：
站姿: 540x720 半身 -> 384x896 及膝 -> 384x1216 全身带脚 *-full.png
坐姿: 现有 *-seated.png 半身坐姿 -> 384x1216 坐姿带腿脚 *-seated-full.png
用法: python tools/make_fullbody_chars.py [name ...]
"""
import base64
import io
import json
import os
import sys

import numpy as np
import requests
from PIL import Image, ImageFilter
from rembg import new_session, remove

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'assets', 'images', 'chars')
SD = 'http://127.0.0.1:7860'
CHECKPOINT = 'majicMIX realisticv7.safetensors [7c819b6d13]'

NEG = ('half body, upper body, portrait, cropped, cut off, fading, blurry, '
       'deformed legs, fused legs, extra legs, deformed feet, extra feet, barefoot, '
       '(chair:1.25), (stool:1.2), sofa, deformed hands, extra fingers, bad anatomy, '
       'lowres, watermark, text, jpeg artifacts')

# name -> (源站姿文件, 源坐姿文件, 裤装/鞋描述, 上身外观)
CHARS = {
    'user':      ('user.png',      'user-seated.png',      'dark navy suit trousers, black leather shoes', 'light grey business suit, white shirt'),
    'npc-wang':  ('npc-wang.png',  'npc-wang-seated.png',  'dark slim jeans, white sneakers', 'dark grey henley sweater'),
    'npc-lin':   ('npc-lin.png',   'npc-lin-seated.png',   'beige midi skirt, nude high heels', 'beige knit cardigan'),
    'npc-zhang': ('npc-zhang.png', 'npc-zhang-seated.png', 'black formal trousers, black leather shoes', 'black turtleneck sweater'),
    'npc-li':    ('npc-li.png',    'npc-li-seated.png',    'dark pencil skirt, black low heels', 'light blue formal shirt'),
}

_session = new_session('u2net')


def flatten(im):
    bg = Image.new('RGB', im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[-1])
    return bg


def set_checkpoint():
    r = requests.post(SD + '/sdapi/v1/options', json={'sd_model_checkpoint': CHECKPOINT}, timeout=30)
    print('checkpoint set:', r.status_code)


def b64img(im):
    buf = io.BytesIO()
    im.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()


def stretch_fill(canvas, src, y_from):
    """canvas 的 y_from 以下用 src 底边拉伸+模糊填充。"""
    w, h = canvas.size
    strip = src.crop((0, max(0, src.height - 30), src.width, src.height))
    strip = strip.resize((w, h - y_from), Image.LANCZOS).filter(ImageFilter.GaussianBlur(16))
    canvas.paste(strip, (0, y_from))


def api_inpaint(init_img, mask_top_from, prompt, denoise):
    """mask_top_from 以下为重绘区。"""
    w, h = init_img.size
    mask = Image.new('L', (w, h), 0)
    px = mask.load()
    for y in range(mask_top_from, h):
        for x in range(w):
            px[x, y] = 255
    payload = {
        'init_images': [b64img(init_img)],
        'mask': b64img(mask),
        'prompt': prompt,
        'negative_prompt': NEG,
        'denoising_strength': denoise,
        'steps': 30,
        'cfg_scale': 7,
        'width': w,
        'height': h,
        'sampler_name': 'DPM++ 2M Karras',
        'mask_blur': 12,
        'inpainting_fill': 1,
        'inpaint_full_res': False,
        'restore_faces': False,
        'seed': -1,
    }
    r = requests.post(SD + '/sdapi/v1/img2img', json=payload, timeout=300)
    r.raise_for_status()
    out = json.loads(r.text)['images'][0].split(',', 1)[-1]
    return Image.open(io.BytesIO(base64.b64decode(out)))


def api_img2img(init_img, prompt, denoise):
    payload = {
        'init_images': [b64img(init_img)],
        'prompt': prompt,
        'negative_prompt': NEG,
        'denoising_strength': denoise,
        'steps': 30,
        'cfg_scale': 7,
        'width': init_img.size[0],
        'height': init_img.size[1],
        'sampler_name': 'DPM++ 2M Karras',
        'restore_faces': False,
        'seed': -1,
    }
    r = requests.post(SD + '/sdapi/v1/img2img', json=payload, timeout=300)
    r.raise_for_status()
    out = json.loads(r.text)['images'][0].split(',', 1)[-1]
    return Image.open(io.BytesIO(base64.b64decode(out)))


def clean_gaps(im, gap=10):
    """裁掉主体下方（中间有空隙的）杂散 disconnected 像素，如 outpaint 残留的孤鞋。"""
    a = np.array(im)[:, :, 3]
    rows = (a > 16).any(axis=1)
    idx = np.where(rows)[0]
    if len(idx) == 0:
        return im
    start = int(idx[0])
    last = start
    empty = 0
    for y in range(start, a.shape[0]):
        if rows[y]:
            last = y
            empty = 0
        else:
            empty += 1
            if empty >= gap:
                break
    return im.crop((0, 0, im.width, last + 1))


def cutout(im):
    return Image.fromarray(np.array(remove(im, session=_session)))


def fit_canvas(cut, w, h):
    cut = clean_gaps(cut)
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    scale = min(w / cut.width, h * 0.97 / cut.height)
    nw, nh = max(1, int(cut.width * scale)), max(1, int(cut.height * scale))
    cut = cut.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    canvas.paste(cut, ((w - nw) // 2, h - nh), cut)
    return canvas


def fullbody_stand(name, src_file, pants_shoes, look):
    """两段 outpaint：半身 → 及膝 → 全身。"""
    src = flatten(Image.open(os.path.join(OUT_DIR, src_file)).convert('RGBA'))

    # pass1: 384x896, 原图 384x480 顶部, 下半重绘（到大腿/膝盖）
    c1 = Image.new('RGB', (384, 896))
    c1.paste(src.resize((384, 480), Image.LANCZOS), (0, 0))
    stretch_fill(c1, src, 480)
    p1 = (f'1person, {look}, (full body:1.3), standing, relaxed, '
          f'{pants_shoes}, (legs:1.4), head to knees visible, (photorealistic:1.2), indoor, soft light')
    r1 = api_inpaint(c1, 462, p1, 0.85)
    r1.save(os.path.join(OUT_DIR, f'{name}-full-pass1.png'))
    print(f'[{name}] pass1 done', flush=True)

    # pass2: 384x1216, pass1 结果 384x896 顶部, 下半重绘（小腿+鞋）
    c2 = Image.new('RGB', (384, 1216))
    c2.paste(r1.resize((384, 896), Image.LANCZOS), (0, 0))
    stretch_fill(c2, r1, 896)
    p2 = (f'(full body:1.35), standing on floor, (lower legs:1.45), {pants_shoes}, '
          '(feet:1.45), (shoes fully visible:1.3), head to feet visible, full body shot, '
          '(photorealistic:1.2), indoor floor, soft light')
    r2 = api_inpaint(c2, 850, p2, 0.8)
    print(f'[{name}] pass2 done', flush=True)

    cut = cutout(r2.convert('RGBA'))
    final = fit_canvas(cut, 384, 1216)
    dst = os.path.join(OUT_DIR, f'{name}-full.png')
    final.save(dst)
    print(f'[{name}] OK -> {dst}', flush=True)
    return final


def fullbody_sit(name, src_file, pants_shoes, look):
    """从坐姿半身像向下 outpaint 腿脚。"""
    src = flatten(Image.open(os.path.join(OUT_DIR, src_file)).convert('RGBA'))
    c = Image.new('RGB', (384, 1216))
    c.paste(src.resize((384, 512), Image.LANCZOS), (0, 0))
    stretch_fill(c, src, 512)
    p = (f'1person, {look}, sitting on a chair, (bent knees:1.45), (lap:1.3), '
         f'{pants_shoes}, (feet flat on floor:1.4), knees toward viewer, '
         '(full body:1.2), (photorealistic:1.2), indoor, soft light')
    r = api_inpaint(c, 470, p, 0.82)
    cut = cutout(r.convert('RGBA'))
    final = fit_canvas(cut, 384, 1216)
    dst = os.path.join(OUT_DIR, f'{name}-seated-full.png')
    final.save(dst)
    print(f'[{name}] OK -> {dst}', flush=True)


def main():
    set_checkpoint()
    only = sys.argv[1:] or list(CHARS.keys())
    for raw in only:
        if ':' in raw:
            mode, _, name = raw.partition(':')
        else:
            mode, name = 'both', raw
        src_file, sit_file, pants_shoes, look = CHARS[name]
        if mode == 'sit':
            fullbody_sit(name, sit_file, pants_shoes, look)
            continue
        if mode == 'stand':
            fullbody_stand(name, src_file, pants_shoes, look)
            continue
        fullbody_stand(name, src_file, pants_shoes, look)
        fullbody_sit(name, sit_file, pants_shoes, look)


if __name__ == '__main__':
    main()
