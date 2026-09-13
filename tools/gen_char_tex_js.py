# -*- coding: utf-8 -*-
"""生成角色抠图 data-URL 纹理包 libs/game_chars_tex.js。

用途：file:// 协议下 WebGL 无法上传本地图片纹理（Chrome 安全限制），
GameStage3D 优先从该 JS 包取 data-URL 贴图，http/https 部署则自动回退相对路径。
新增/更新 assets/images/chars/*.png 后重跑本脚本即可。
"""
import base64
import glob
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR_DIR = os.path.join(ROOT, 'assets', 'images', 'chars')
OUT = os.path.join(ROOT, 'libs', 'game_chars_tex.js')


def main():
    files = [f for f in glob.glob(os.path.join(CHAR_DIR, '*.png'))
             if 'half' not in os.path.basename(f) and 'pass1' not in os.path.basename(f)]
    lines = [
        '/* 自动生成：角色抠图 data-URL 纹理包（file:// 协议下 WebGL 需要） gen by tools/gen_char_tex_js */',
        'window.GS3D_TEX = window.GS3D_TEX || {};',
    ]
    total = 0
    for f in sorted(files):
        stem = os.path.splitext(os.path.basename(f))[0]
        b = open(f, 'rb').read()
        total += len(b)
        lines.append('GS3D_TEX["%s"] = "data:image/png;base64,%s";' % (stem, base64.b64encode(b).decode()))
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
    print('files:', len(files), 'raw KB:', total // 1024, '->', OUT)


if __name__ == '__main__':
    main()
