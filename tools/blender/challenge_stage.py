import bpy
import math
import os
import sys
from mathutils import Vector


def arg_value(name, default):
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    for index, value in enumerate(args):
        if value == name and index + 1 < len(args):
            return args[index + 1]
    return default


OUTPUT_DIR = os.path.abspath(arg_value("--output-dir", "assets/images"))
WORLD = arg_value("--world", "basic")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def material(name, color, roughness=0.65, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def cube(name, location, scale, mat, bevel=0.08):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("soft edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
    obj.data.materials.append(mat)
    return obj


def cylinder(name, location, radius, depth, mat, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def sphere(name, location, radius, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def chair(x, y, rotation, wood, fabric):
    seat = cube("chair_seat", (x, y, 0.9), (0.65, 0.65, 0.12), wood, 0.08)
    seat.rotation_euler[2] = rotation
    for dx, dy in ((-0.45, -0.45), (0.45, -0.45), (-0.45, 0.45), (0.45, 0.45)):
        leg = cylinder("chair_leg", (x + dx * 0.8, y + dy * 0.8, 0.45), 0.07, 0.9, wood, 16)
        leg.rotation_euler[2] = rotation
    back = cube("chair_back", (x, y + 0.52, 1.65), (0.62, 0.1, 0.7), fabric, 0.08)
    back.rotation_euler[2] = rotation


def coach(location, outfit, skin):
    x, y, z = location
    cylinder("coach_body", (x, y, z + 1.4), 0.46, 1.45, outfit)
    sphere("coach_head", (x, y, z + 2.55), 0.38, skin)
    cylinder("coach_neck", (x, y, z + 2.1), 0.16, 0.25, skin, 20)
    for side in (-1, 1):
        arm = cylinder("coach_arm", (x + side * 0.55, y, z + 1.45), 0.14, 1.1, outfit, 20)
        arm.rotation_euler[1] = side * math.radians(12)
        leg = cylinder("coach_leg", (x + side * 0.2, y, z + 0.35), 0.16, 0.8, outfit, 20)
        shoe = cube("coach_shoe", (x + side * 0.2, y - 0.18, z - 0.05), (0.22, 0.38, 0.12), skin, 0.05)
    return bpy.context.object


def build_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    palette = {
        "basic": ((0.18, 0.45, 0.82), (0.93, 0.68, 0.32), (0.10, 0.18, 0.32)),
        "work": ((0.15, 0.38, 0.55), (0.20, 0.70, 0.58), (0.08, 0.12, 0.20)),
        "deep": ((0.68, 0.25, 0.48), (0.90, 0.48, 0.34), (0.16, 0.08, 0.18)),
    }
    accent, secondary, dark = palette.get(WORLD, palette["basic"])
    floor_mat = material("floor", (0.13, 0.15, 0.20), 0.86)
    wall_mat = material("wall", (0.72, 0.76, 0.84), 0.9)
    accent_mat = material("accent", accent, 0.48)
    secondary_mat = material("secondary", secondary, 0.55)
    wood_mat = material("wood", (0.38, 0.20, 0.11), 0.74)
    fabric_mat = material("fabric", dark, 0.88)
    skin_mat = material("skin", (0.64, 0.38, 0.22), 0.78)

    cube("floor", (0, 0, -0.15), (6.8, 5.2, 0.15), floor_mat, 0.04)
    cube("back_wall", (0, 4.9, 3.0), (6.8, 0.12, 3.2), wall_mat, 0.02)
    cube("left_wall", (-6.7, 0, 3.0), (0.12, 5.2, 3.2), wall_mat, 0.02)
    cube("stage_strip", (0, 4.72, 0.55), (6.0, 0.08, 1.25), accent_mat, 0.04)

    if WORLD == "basic":
        cylinder("round_table", (0, 1.0, 1.15), 1.45, 0.16, wood_mat)
        cylinder("table_pedestal", (0, 1.0, 0.52), 0.28, 1.1, wood_mat)
        chair(-2.0, 1.0, math.radians(90), wood_mat, fabric_mat)
        chair(2.0, 1.0, math.radians(-90), wood_mat, fabric_mat)
        cylinder("coffee_cup", (-0.45, 1.0, 1.38), 0.16, 0.16, secondary_mat)
        sphere("plant_leaf", (-4.5, 2.8, 1.2), 0.65, secondary_mat)
        cylinder("plant_pot", (-4.5, 2.8, 0.55), 0.42, 0.65, wood_mat)
    elif WORLD == "work":
        cube("conference_table", (0, 1.0, 1.0), (2.9, 1.25, 0.12), wood_mat, 0.1)
        for x, y in ((-3.1, 1), (3.1, 1), (-2.0, -0.9), (0, -0.9), (2.0, -0.9)):
            chair(x, y, 0 if y < 0 else math.pi, wood_mat, fabric_mat)
        cube("presentation_board", (0, 4.55, 3.3), (2.2, 0.08, 1.2), accent_mat, 0.06)
        cube("podium", (0, 3.8, 1.05), (0.65, 0.5, 1.05), secondary_mat, 0.08)
    else:
        cube("wedding_podium", (0, 3.7, 1.15), (1.15, 0.55, 1.15), secondary_mat, 0.08)
        for x in (-4.0, -2.5, 2.5, 4.0):
            chair(x, 1.1, 0, wood_mat, fabric_mat)
        for x in (-2.0, 2.0):
            cylinder("arch_post", (x, 4.1, 2.5), 0.18, 5.0, accent_mat, 20)
        cube("arch_top", (0, 4.1, 5.0), (2.2, 0.18, 0.18), accent_mat, 0.08)
        for x in (-1.4, 0, 1.4):
            sphere("flower", (x, 3.65, 2.1), 0.24, accent_mat)

    coach((0, 2.65, 0), accent_mat, skin_mat)
    cylinder("user_marker", (0, -2.2, 0.04), 0.72, 0.08, secondary_mat)
    sphere("light_orb", (0, 3.9, 5.4), 0.22, secondary_mat)

    bpy.ops.object.light_add(type="AREA", location=(0, -1.5, 7.0))
    key = bpy.context.object
    key.data.energy = 1000
    key.data.shape = "DISK"
    key.data.size = 6
    look_at(key, (0, 1, 1))
    bpy.ops.object.light_add(type="AREA", location=(4, 1, 4))
    fill = bpy.context.object
    fill.data.energy = 650
    fill.data.size = 4
    look_at(fill, (0, 1, 1))
    bpy.ops.object.light_add(type="POINT", location=(-3, 3, 3))
    bpy.context.object.data.energy = 180

    bpy.ops.object.camera_add(location=(9.5, -11.5, 7.5))
    camera = bpy.context.object
    camera.data.lens = 44
    look_at(camera, (0, 1.3, 1.4))
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.join(OUTPUT_DIR, "challenge-3d-" + WORLD + ".png")
    scene.world.color = (0.035, 0.045, 0.075)
    scene.render.film_transparent = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTPUT_DIR, "challenge-3d-" + WORLD + ".blend"))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTPUT_DIR, "challenge-3d-" + WORLD + ".blend"))
    bpy.ops.render.render(write_still=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUTPUT_DIR, "challenge-3d-" + WORLD + ".glb"), export_format="GLB", use_selection=False)


build_scene()
