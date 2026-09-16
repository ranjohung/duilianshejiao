# -*- coding: utf-8 -*-
"""测试 reflow 段落重排效果"""
import sys, os, json
sys.path.insert(0, r"F:\开发软件项目文件\对练社交\tools\knowledge")
from gen_course_cards import split_sections, reflow

BASE = r"F:\开发软件项目文件\对练社交\knowledge_base\extracted"

# 取几个代表性的提取文件
samples = []
for fn in os.listdir(BASE):
    if fn.endswith(".txt") and not fn.startswith("_"):
        p = os.path.join(BASE, fn)
        sz = os.path.getsize(p)
        if sz > 30000:
            samples.append((sz, fn))
samples.sort(reverse=True)

import io
for sz, fn in samples[:5]:
    with open(os.path.join(BASE, fn), encoding="utf-8") as f:
        raw = f.read()
    print("=" * 70)
    print("FILE:", fn, "| raw chars:", len(raw))
    print("--- 原始（前 180 字，换行显示为 ⏎）---")
    print(raw[:180].replace("\n", "⏎"))
    secs = split_sections(raw)
    print("--- 重排后节数:", len(secs))
    if secs:
        print("--- 第 1 节标题:", secs[0]["t"])
        print("--- 第 1 节正文（前 220 字）:")
        print(secs[0]["x"][:220])
        lens = [len(s["x"]) for s in secs]
        print("--- 各节字数: min=%d max=%d avg=%d" % (min(lens), max(lens), sum(lens)//len(lens)))
    print()
