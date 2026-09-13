# -*- coding: utf-8 -*-
"""
blender_automation.py —— 3D 礼仪教学 Blender 全自动动画管线（零手动骨骼操作）
用法（后台一次跑完）：
  blender-launcher.exe --background --factory-startup --python tools/blender_automation.py

流程：
  1. 程序化绑定：按 Web 骨架（libs/game_stage3d.js mkHuman / JOINTS 13 关节）
     同层级、同比例自动创建 EMPTY 节点链并父子绑定（坐标 web Y-up → Blender Z-up）。
  2. 动作库关键帧：鞠躬 15/30/45°、点头、引领、入场问候、呼吸待机（24fps）。
  3. 批量姿态校准：逐采样帧断言关节限位（肘 0–145°、膝≥0、鞠躬名义角度±5%…），
     违例 → STATUS=FAIL。
  4. 双产物导出：
     - assets/models/etiquette_actions.glb（并排人偶 + 场景级动画，供 glTF 查看器审计）
     - libs/etiquette_anim_data.js（window.GS3D_ANIM 逐帧欧拉曲线表，Web 运行时直接播放）
  5. 结果落盘 tools/_blender_automation_result.txt（MSIX 别名不回传 stdout，一切以文件为准）。

姿态角度全部使用 Web 约定（弧度；rotation.x 正=前倾/低头，负=抬臂向前，
rotation.y 正=左转，rotation.z 正=左倾；导出时映射回 Web 欧拉）。
"""
import bpy
import math
import os
import json
import time

FPS = 24
PROJ = r"F:\开发软件项目文件\对练社交"
OUT_JS = os.path.join(PROJ, "libs", "etiquette_anim_data.js")
OUT_GLB = os.path.join(PROJ, "assets", "models", "etiquette_actions.glb")
OUT_RESULT = os.path.join(PROJ, "tools", "_blender_automation_result.txt")

D = math.radians

# ---- 与 Web mkHuman 完全一致的关节层级（local offset 为 web x,y,z） ----
JOINT_SPEC = [
    ("hips",   None,     (0, 0.93, 0)),
    ("torsoG", "hips",   (0, 0.07, 0)),
    ("headG",  "torsoG", (0, 0.52, 0)),
    ("shL",    "torsoG", (0.155, 0.44, 0)),
    ("elL",    "shL",    (0, -0.27, 0)),
    ("shR",    "torsoG", (-0.155, 0.44, 0)),
    ("elR",    "shR",    (0, -0.27, 0)),
    ("skirt",  "torsoG", (0, -0.02, 0)),
    ("hipL",   "hips",   (0.075, -0.02, 0)),
    ("kneeL",  "hipL",   (0, -0.44, 0)),
    ("ankL",   "kneeL",  (0, -0.42, 0)),
    ("hipR",   "hips",   (-0.075, -0.02, 0)),
    ("kneeR",  "hipR",   (0, -0.44, 0)),
    ("ankR",   "kneeR",  (0, -0.42, 0)),
]
JOINT_ORDER = [j[0] for j in JOINT_SPEC]

# ---- 基础站立姿态（web 欧拉） ----
BASE = {"shL": (0, 0, 0.1), "shR": (0, 0, -0.1)}


def pose(**over):
    """合并基础姿态与覆盖项，返回全关节欧拉表"""
    p = {n: (0.0, 0.0, 0.0) for n in JOINT_ORDER}
    for k, v in BASE.items():
        p[k] = tuple(v)
    for k, v in over.items():
        p[k] = tuple(v)
    return p


# ---- 动作库：name -> (frames, [(frame, pose_dict), ...]) ----
def bow_clip(deg, dur):
    """鞠躬：快下-保持-缓起；≥30° 双手扶大腿前侧；头部反向补偿保持对视"""
    peak = D(deg)
    f_in, f_hold = int(dur * 0.35), int(dur * 0.6)
    if deg >= 30:
        arm = {"shL": (-0.35, 0, 0.14), "elL": (-0.55, 0, 0),
               "shR": (-0.35, 0, -0.14), "elR": (-0.55, 0, 0)}
    else:
        arm = {"shL": (0.06, 0, 0.16), "shR": (0.06, 0, -0.16)}
    pk = dict(torsoG=(peak, 0, 0), headG=(-peak * 0.35, 0, 0))
    pk.update(arm)
    return (dur, [(0, pose()), (f_in, pose(**pk)), (f_hold, pose(**pk)), (dur, pose())])


def nod_clip():
    return (26, [(0, pose()), (6, pose(headG=(0.26, 0, 0))), (12, pose(headG=(0.03, 0, 0))),
                 (18, pose(headG=(0.26, 0, 0))), (26, pose())])


def lead_clip():
    """引领手势：右臂斜前 45° 抬起、掌展开、躯干微转，中段轻微摆动示方向"""
    up = dict(shR=(-1.15, 0, -0.55), elR=(-0.15, 0, 0), torsoG=(0.04, 0.15, 0),
              headG=(-0.05, 0.12, 0))
    wav = dict(up)
    wav = dict(wav)
    wav["elR"] = (-0.30, 0, -0.48)
    return (72, [(0, pose()), (12, pose(**up)), (30, pose(**wav)), (46, pose(**up)),
                 (58, pose(**up)), (72, pose())])


def greet_clip():
    """入场问候拍：15° 鞠躬 + 收势点头（对话状态机 greet 阶段自动播放）"""
    pk = dict(torsoG=(D(15), 0, 0), headG=(-D(15) * 0.35, 0, 0),
              shL=(0.06, 0, 0.16), shR=(0.06, 0, -0.16))
    return (84, [(0, pose()), (18, pose(**pk)), (30, pose(**pk)), (48, pose()),
                 (56, pose(headG=(0.22, 0, 0))), (64, pose(headG=(0.04, 0, 0))),
                 (74, pose()), (84, pose())])


def idle_clip():
    a = pose(torsoG=(0.008, 0, 0), shL=(0, 0, 0.115), shR=(0, 0, -0.115))
    b = pose(torsoG=(-0.004, 0, 0), shL=(0, 0, 0.092), shR=(0, 0, -0.092))
    return (48, [(0, a), (24, b), (48, a)])


CLIPS = {
    "bow15": bow_clip(15, 48),
    "bow30": bow_clip(30, 60),
    "bow45": bow_clip(45, 72),
    "nod": nod_clip(),
    "lead": lead_clip(),
    "greet": greet_clip(),
    "idle": idle_clip(),
}

# ---- 批量姿态校准规则（逐采样帧） ----
LIMITS = {
    "elL": (-2.531, 0.05), "elR": (-2.531, 0.05),      # 肘 0–145°（负=前弯）
    "kneeL": (-0.05, 2.4), "kneeR": (-0.05, 2.4),
    "ankL": (-0.8, 0.8), "ankR": (-0.8, 0.8),
    "headG": (-0.7, 1.0), "torsoG": (-0.2, 1.2),
    "shL": (-2.2, 1.2), "shR": (-2.2, 1.2),
    "hipL": (-2.2, 0.2), "hipR": (-2.2, 0.2),
}


def build_rig(prefix, xoff):
    """创建 EMPTY 关节链（Blender Z-up：web(x,y,z) -> blender(x, -z, y)）"""
    objs = {}
    for name, parent, off in JOINT_SPEC:
        e = bpy.data.objects.new(prefix + ":" + name, None)
        e.empty_display_type = 'SPHERE'
        e.empty_display_size = 0.035
        e.location = (xoff + off[0], -off[2], off[1])
        if parent:
            e.parent = objs[parent]     # identity parent_inverse → location 即父局部偏移
        bpy.context.scene.collection.objects.link(e)
        objs[name] = e
    return objs


def key_clip(objs, frames, keys):
    for f, pdict in keys:
        for jn in JOINT_ORDER:
            wx, wy, wz = pdict.get(jn, (0, 0, 0))
            e = objs[jn]
            e.rotation_mode = 'XYZ'
            # web -> blender：bX=wx, bY=-wz, bZ=wy
            e.rotation_euler = (wx, -wz, wy)
            e.keyframe_insert(data_path="rotation_euler", frame=f)


def sample_clip(objs, frames):
    """逐帧采样并转回 web 欧拉：web=(bX, bZ, -bY)"""
    sc = bpy.context.scene
    out = {n: [] for n in JOINT_ORDER}
    for f in range(frames + 1):
        sc.frame_set(f)
        for n in JOINT_ORDER:
            ex, ey, ez = objs[n].rotation_euler
            out[n].append([round(ex, 4), round(ez, 4), round(-ey, 4)])
    return out


def validate(frames, joints, name):
    errs = []
    for n, (lo, hi) in LIMITS.items():
        if n not in joints:
            continue
        for fi, v in enumerate(joints[n]):
            if v[0] < lo - 1e-4 or v[0] > hi + 1e-4:
                errs.append("%s f%d %s.x=%.3f out [%d,%d]" % (name, fi, n, v[0], lo, hi))
    if name.startswith("bow"):
        deg = int(name[3:])
        want = D(deg)
        got = joints["torsoG"][int(frames * 0.35)][0]
        if abs(got - want) > want * 0.05 + 1e-4:
            errs.append("%s torso peak %.4f != nominal %.4f (±5%%)" % (name, got, want))
    return errs


def add_limb(parent, length, r1, r2, mat, sphere_at=None):
    """肢段圆柱（沿 -Z / 躯干 +Z），关节球可选"""
    bpy.ops.mesh.primitive_cylinder_add(radius=r2, depth=length, vertices=12)
    m = bpy.context.object
    m.scale = (1, r1 / max(r2, 1e-6), 1)
    m.location = (0, 0, -length / 2)
    m.parent = parent
    m.data.materials.append(mat)
    if sphere_at == 'joint':
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r1 * 1.05, segments=10, ring_count=8)
        s = bpy.context.object
        s.parent = parent
        s.data.materials.append(mat)


def mannequin(prefix, xoff, mat):
    objs = build_rig(prefix, xoff)
    # 躯干/头/骨盆
    bpy.ops.mesh.primitive_cylinder_add(radius=0.115, depth=0.5, vertices=12)
    t = bpy.context.object
    t.location = (0, 0, 0.25); t.parent = objs["torsoG"]; t.data.materials.append(mat)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.115, segments=12, ring_count=10)
    h = bpy.context.object
    h.location = (0, 0, 0.13); h.parent = objs["headG"]; h.data.materials.append(mat)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.16, vertices=12)
    hp = bpy.context.object
    hp.parent = objs["hips"]; hp.data.materials.append(mat)
    # 四肢
    for L, sfx in ((1, "L"), (-1, "R")):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.046, depth=0.27, vertices=10)
        ua = bpy.context.object
        ua.parent = objs["sh" + sfx]; ua.data.materials.append(mat)
        add_limb(objs["el" + sfx], 0.27, 0.04, 0.037, mat)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.047, segments=8, ring_count=6)
        hd = bpy.context.object
        hd.parent = objs["el" + sfx]; hd.data.materials.append(mat)
        add_limb(objs["hip" + sfx], 0.44, 0.062, 0.055, mat)
        add_limb(objs["knee" + sfx], 0.42, 0.05, 0.045, mat)
    return objs


def main():
    t0 = time.time()
    report = {"blender": bpy.app.version_string, "clips": [], "violations": [],
              "outputs": {}}

    sc = bpy.context.scene
    sc.render.fps = FPS
    sc.frame_start = 0
    maxf = max(c[0] for c in CLIPS.values())
    sc.frame_end = maxf

    anim = {"fps": FPS, "source": "blender " + bpy.app.version_string,
            "generated": time.strftime("%Y-%m-%d %H:%M:%S"), "clips": {}}

    # 1) 采样用 rig（原点一套，逐 clip 覆盖关键帧）
    for name, (frames, keys) in CLIPS.items():
        objs = build_rig("S_" + name, 0.0)
        key_clip(objs, frames, keys)
        joints = sample_clip(objs, frames)
        report["clips"].append("%s(%df/%.1fs)" % (name, frames, frames / FPS))
        report["violations"] += validate(frames, joints, name)
        anim["clips"][name] = {"frames": frames, "joints": joints}
        # 清掉本 clip 的 rig，避免动作互串
        for o in list(objs.values()):
            bpy.data.objects.remove(o, do_unlink=True)

    # 2) 审计用并排人偶（每个 clip 一套，含动画）
    mat = bpy.data.materials.new("mannequin")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.42, 0.48, 0.58, 1)
        bsdf.inputs["Roughness"].default_value = 0.75
    xoff = -4.2
    for i, (name, (frames, keys)) in enumerate(sorted(CLIPS.items())):
        objs = mannequin("M_" + name, xoff, mat)
        key_clip(objs, frames, keys)
        xoff += 1.3

    # 3) 导出
    os.makedirs(os.path.dirname(OUT_JS), exist_ok=True)
    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("/* etiquette_anim_data.js —— Blender 全自动管线产物，勿手改\n")
        f.write(" * 生成：%s | Blender %s | 24fps | clips: %s\n" % (anim["generated"], report["blender"], ", ".join(sorted(anim["clips"]))))
        f.write(" * 重新生成：blender-launcher.exe --background --factory-startup --python tools/blender_automation.py */\n")
        f.write("window.GS3D_ANIM = ")
        f.write(json.dumps(anim, separators=(',', ':'), ensure_ascii=False))
        f.write(";\n")
    report["outputs"]["js"] = "%s (%d bytes)" % (OUT_JS, os.path.getsize(OUT_JS))

    gltf_ok = hasattr(bpy.ops.export_scene, "gltf")
    report["gltf_exporter"] = gltf_ok
    if gltf_ok:
        kw = {"filepath": OUT_GLB, "export_format": 'GLB', "export_yup": True}
        try:
            bpy.ops.export_scene.gltf(export_animation_mode='SCENE', **kw)
        except TypeError:
            bpy.ops.export_scene.gltf(**kw)
        report["outputs"]["glb"] = "%s (%d bytes)" % (OUT_GLB, os.path.getsize(OUT_GLB))

    report["elapsed_s"] = round(time.time() - t0, 1)
    with open(OUT_RESULT, "w", encoding="utf-8") as f:
        f.write("STATUS=%s\n" % ("FAIL" if report["violations"] else "OK"))
        f.write(json.dumps(report, ensure_ascii=False, indent=1))
    print("AUTOMATION_DONE", report["violations"] and "WITH_VIOLATIONS" or "CLEAN")


main()
