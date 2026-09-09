#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把教练全身照 + 用户头像抠成透明背景 PNG，供照片合成舞台使用。"""
import os, sys
from rembg import remove
from PIL import Image

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
        out = remove(im)
        out.save(OUT + "/" + name)
        print("OK", name, out.size)
    except Exception as e:
        print("ERR", name, repr(e))
print("done")
