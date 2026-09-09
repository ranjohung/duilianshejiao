#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把教练全身照 + 用户头像抠成透明背景 PNG，供照片合成舞台使用。"""
import os, sys
from rembg import remove, new_session
from PIL import Image

# 强制使用已下载的 u2net 模型，避免 rembg 2.0 默认去下载 1GB 的 bria-rmbg
SESS = new_session("u2net")

ROOT = "F:/开发软件项目文件/对练社交"
IN_COACH = ROOT + "/assets/images/coaches"
IN_USER = ROOT + "/assets/images/user-avatars"
OUT = ROOT + "/assets/images/chars"
os.makedirs(OUT, exist_ok=True)

# 需要抠的图：npc 用 coach 全身照，主角用用户头像
jobs = [
    # (源文件, 输出名)
    (IN_USER + "/user-avatar-01.png", "user.png"),
    (IN_COACH + "/coach-02.jpg", "npc-lin.png"),   # 女·温和 全身
    (IN_COACH + "/coach-03.jpg", "npc-wang.png"),  # 男·干练 全身
    (IN_COACH + "/coach-04.jpg", "npc-li.png"),    # 女·热情 全身
    (IN_COACH + "/coach-07.jpg", "npc-zhang.png"), # 男·沉稳 全身
    (IN_COACH + "/coach-08.jpg", "npc-wang-half.png"), # 男 头像(近景)
]
for src, name in jobs:
    try:
        im = Image.open(src).convert("RGBA")
        # 缩图加速 + 减少 CPU 负担（720px 足够页面展示）
        if max(im.size) > 720:
            im.thumbnail((720, 720), Image.LANCZOS)
        out = remove(im, session=SESS)
        out.save(OUT + "/" + name)
        print("OK", name, out.size, flush=True)
    except Exception as e:
        print("ERR", name, repr(e), flush=True)
print("done")
