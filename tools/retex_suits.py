# -*- coding: utf-8 -*-
"""retex_suits.py — 写实模型服装 HSV 重映射（确定性，UV 对齐无损）
 Soldier 护甲 → 商务西装（navy / charcoal 两版）；Michelle 黄运动裤 → 深色裤装
 用法: python retex_suits.py
"""
import numpy as np
from PIL import Image
import os, sys

SRC = r"F:\开发软件项目文件\对练社交\assets\models\source"
OUT = SRC

def rgb_to_hsv_arr(rgb):  # rgb float 0..1 -> h 0..360, s 0..1, v 0..1
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.max(rgb, axis=-1); mn = np.min(rgb, axis=-1)
    v = mx; d = mx - mn
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    h = np.zeros_like(mx)
    mask = d > 1e-6
    rm = mask & (mx == r); gm = mask & (mx == g) & ~rm; bm = mask & ~rm & ~gm
    h[rm] = (60 * ((g - b) / np.maximum(d, 1e-6)))[rm] % 360
    h[gm] = (60 * ((b - r) / np.maximum(d, 1e-6)) + 120)[gm]
    h[bm] = (60 * ((r - g) / np.maximum(d, 1e-6)) + 240)[bm]
    return h, s, v

def hsv_to_rgb_arr(h, s, v):
    h = h % 360
    c = v * s
    x = c * (1 - np.abs((h / 60) % 2 - 1))
    m = v - c
    z = np.zeros_like(h)
    conds = [(h < 60), (h < 120), (h < 180), (h < 240), (h < 300), (h >= 300)]
    rgbs = [(c, x, z), (x, c, z), (z, c, x), (z, x, c), (x, z, c), (c, z, x)]
    r = np.select(conds, [a for a, b, cc in rgbs])
    g = np.select(conds, [b for a, b, cc in rgbs])
    b = np.select(conds, [cc for a, b, cc in rgbs])
    return np.stack([(r + m), (g + m), (b + m)], axis=-1)

def remap(img, rules, keep=None):
    """rules: list of (mask_fn(h,s,v), out_h, out_s, v_scale) — 先匹配先生效"""
    a = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0
    h, s, v = rgb_to_hsv_arr(a)
    out_h, out_s, out_v = h.copy(), s.copy(), v.copy()
    assigned = np.zeros(h.shape, dtype=bool)
    for mfn, oh, os_, vs in rules:
        m = mfn(h, s, v) & ~assigned
        if keep is not None:
            m &= ~keep(h, s, v)
        out_h[m] = oh; out_s[m] = os_; out_v[m] = np.clip(v[m] * vs, 0, 1)
        assigned |= m
    rgb = hsv_to_rgb_arr(out_h, out_s, out_v)
    return Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8))

# ---- Soldier 护甲 → 西装 ----
def m_cream(h, s, v):   return (h >= 15) & (h <= 55) & (s >= 0.05) & (s <= 0.60) & (v >= 0.45)   # 米白护甲板
def m_olive(h, s, v):   return (h > 55) & (h <= 115) & (s >= 0.08) & (v <= 0.65)                  # 橄榄绿织物
def m_red(h, s, v):     return ((h <= 15) | (h >= 340)) & (s >= 0.30) & (v >= 0.15)               # 红色饰条
def m_dark(h, s, v):    return v < 0.18                                                           # 近黑（保留）

NAVY = dict(plate=(218, 0.30, 0.46), fabric=(215, 0.14, 0.78), red=(218, 0.22, 0.48))
CHARCOAL = dict(plate=(226, 0.07, 0.44), fabric=(226, 0.04, 0.82), red=(226, 0.08, 0.55))

def suit_variant(src, dst, C):
    img = Image.open(src)
    rules = [
        (m_red,   C["red"][0],   C["red"][1],   C["red"][2]),
        (m_cream, C["plate"][0], C["plate"][1], C["plate"][2]),
        (m_olive, C["fabric"][0], C["fabric"][1], C["fabric"][2]),
    ]
    out = remap(img, rules, keep=m_dark)
    out.save(dst, quality=92)
    print("saved", dst, out.size)

# ---- Michelle 黄运动裤 → 深色裤装 ----
def michelle_variant(src, dst):
    img = Image.open(src)
    def m_yellow(h, s, v): return (h >= 35) & (h <= 70) & (s >= 0.25) & (v >= 0.30)
    def m_teal(h, s, v):   return (h >= 150) & (h <= 210) & (s >= 0.25) & (v >= 0.20)  # 青条纹
    def m_red(h, s, v):    return ((h <= 20) | (h >= 335)) & (s >= 0.35) & (v >= 0.15) # 红色运动配饰
    def keep_dark(h, s, v): return v < 0.22
    rules = [
        (m_yellow, 224, 0.38, 0.30),   # 黄裤 → 藏青西裤
        (m_teal,   224, 0.20, 0.55),   # 青条纹 → 暗灰蓝
        (m_red,    350, 0.45, 0.40),   # 亮红配饰 → 暗酒红
    ]
    out = remap(img, rules, keep=keep_dark)
    out.save(dst, quality=92)
    print("saved", dst, out.size)

if __name__ == "__main__":
    sol = os.path.join(SRC, "soldier_imgs", "img1_vanguard_vanguard_diffuse_tga.jpg")
    mic = os.path.join(SRC, "michelle_imgs", "img2_Ch03_1001_Diffuse.jpg")
    if os.path.exists(sol):
        suit_variant(sol, os.path.join(OUT, "suit_navy.jpg"), NAVY)
        suit_variant(sol, os.path.join(OUT, "suit_charcoal.jpg"), CHARCOAL)
    if os.path.exists(mic):
        michelle_variant(mic, os.path.join(OUT, "michelle_dark.jpg"))
    # 转 png 供人工检查
    for f in ["suit_navy.jpg", "suit_charcoal.jpg", "michelle_dark.jpg"]:
        p = os.path.join(OUT, f)
        if os.path.exists(p):
            Image.open(p).save(p.replace(".jpg", "_preview.png"))
            print("preview", p.replace(".jpg", "_preview.png"))
