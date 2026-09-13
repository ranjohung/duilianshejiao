# -*- coding: utf-8 -*-
"""生成角色坐姿变体：SD img2img + rembg u2net 抠图 → assets/images/chars/*-seated.png"""
import base64
import io
import json
import os
import sys

import numpy as np
import requests
from PIL import Image
from rembg import new_session, remove

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'assets', 'images', 'chars')
SD = 'http://127.0.0.1:7860'

CHECKPOINT = 'majicMIX realisticv7.safetensors [7c819b6d13]'

NEG = ('standing, (deformed hands:1.3), extra fingers, bad anatomy, '
       'lowres, watermark, text, jpeg artifacts, cropped head')

# name -> (文件, 正向提示词)
CHARS = {
    'user': ('user.png',
             '1man, handsome young chinese man, light grey business suit, white shirt, '
             '(sitting on a wooden chair, hands resting on lap:1.45), upper body leaning slightly forward, gentle smile, '
             'waist up, facing viewer, (photorealistic:1.2), indoor cafe background, soft light'),
    'npc-wang': ('npc-wang.png',
                 '1man, handsome young chinese man, dark grey henley sweater, short black hair, '
                 '(sitting on a wooden chair, one hand resting on table:1.45), upper body leaning slightly forward, warm smile, '
                 'waist up, facing viewer, (photorealistic:1.2), indoor cafe background, soft light'),
    'npc-lin': ('npc-lin.png',
                '1woman, beautiful young chinese woman, beige knit cardigan, long wavy brown hair, '
                '(sitting on a wooden chair, hands resting on lap:1.45), upper body leaning slightly forward, soft smile, '
                'waist up, facing viewer, (photorealistic:1.2), indoor cafe background, soft light'),
    'npc-zhang': ('npc-zhang.png',
                  '1man, handsome chinese man, black turtleneck sweater, neat black hair, '
                  '(sitting on a wooden chair, hands clasped on lap:1.45), upright posture, calm expression, '
                  'waist up, facing viewer, (photorealistic:1.2), indoor office background, soft light'),
    'npc-li': ('npc-li.png',
               '1woman, beautiful young chinese woman, light blue formal shirt, long straight black hair, '
               '(sitting on a wooden chair, hands resting on lap:1.45), elegant upright posture, gentle expression, '
               'waist up, facing viewer, (photorealistic:1.2), indoor office background, soft light'),
}

_session = new_session('u2net')


def flatten(im):
    bg = Image.new('RGB', im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[-1])
    return bg


def set_checkpoint():
    r = requests.post(SD + '/sdapi/v1/options', json={'sd_model_checkpoint': CHECKPOINT}, timeout=30)
    print('checkpoint set:', r.status_code)


def img2img(init_img, prompt):
    buf = io.BytesIO()
    init_img.save(buf, format='PNG')
    payload = {
        'init_images': [base64.b64encode(buf.getvalue()).decode()],
        'prompt': prompt,
        'negative_prompt': NEG,
        'denoising_strength': 0.58,
        'steps': 28,
        'cfg_scale': 7,
        'width': 540,
        'height': 720,
        'sampler_name': 'DPM++ 2M Karras',
        'restore_faces': False,
        'seed': -1,
    }
    r = requests.post(SD + '/sdapi/v1/img2img', json=payload, timeout=300)
    r.raise_for_status()
    out = json.loads(r.text)['images'][0]
    out = out.split(',', 1)[-1]
    return Image.open(io.BytesIO(base64.b64decode(out)))


def cutout(im):
    arr = np.array(remove(im, session=_session))
    return Image.fromarray(arr)


def fit_canvas(cut, w=540, h=720):
    """贴回 540x720 画布：按原站位底边对齐（坐姿头部略上移）。"""
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    scale = min(w / cut.width, h * 0.94 / cut.height)
    nw, nh = max(1, int(cut.width * scale)), max(1, int(cut.height * scale))
    cut = cut.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    canvas.paste(cut, ((w - nw) // 2, h - nh), cut)
    return canvas


def main():
    set_checkpoint()
    only = sys.argv[1:] or list(CHARS.keys())
    for name in only:
        fname, prompt = CHARS[name]
        src = Image.open(os.path.join(OUT_DIR, fname)).convert('RGBA')
        print(f'[{name}] img2img ...', flush=True)
        seated = img2img(flatten(src), prompt)
        seated = seated.convert('RGBA')
        print(f'[{name}] rembg ...', flush=True)
        cut = cutout(seated)
        final = fit_canvas(cut)
        dst = os.path.join(OUT_DIR, f'{name}-seated.png')
        final.save(dst)
        print(f'[{name}] OK -> {dst}', flush=True)


if __name__ == '__main__':
    main()
