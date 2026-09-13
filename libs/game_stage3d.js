/* ============================================================
 * GameStage3D v4 —— 游戏 3D 训练舞台（礼仪 & 真实挑战共用）
 * 真 3D 关节人体（非贴图/非 billboard）：
 *   - 真人对视：四元数 slerp 转身 + 头/身视线分离（头 60% 先行、躯干跟随）
 *   - 双骨解析 IK：握手/递名片精准触达，肘限位 0–145°，胶囊推离防穿模
 *   - 动作混合：所有动作以当前实时姿态为起点 crossfade，无硬切
 *   - 对话状态机：setPhase(greet/talk/...)，greet 自动 15° 鞠躬
 *   - Blender 动画管线：window.GS3D_ANIM 存在时固定形态动作播
 *     libs/etiquette_anim_data.js 曲线（tools/blender_automation.py 产物），
 *     缺失自动回退程序化动作
 *   - 真实生活逻辑序列：坐下=拉椅→入座→推回；起身反向
 * 接口：{supported,mount,dispose,getAnchors,setSpeaking,setAction,setPhase}
 * 依赖 libs/three.min.js (r149)；THREE 缺失时 supported=false 走旧降级。
 * ============================================================ */

function _GS3D_init() {
  if (!window.THREE) { window.GameStage3D = null; return; }

  var instances = {};
  var TEX_LOADER = new THREE.TextureLoader();
  var smooth = function (k) { return k * k * (3 - 2 * k); };
  var clamp01 = function (k) { return Math.max(0, Math.min(1, k)); };

  /* ---------- 基础几何 helper ---------- */
  function lam(c) { return new THREE.MeshLambertMaterial({ color: c }); }
  function box(w, h, d, c, x, y, z, parent) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c));
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  function cyl(rt, rb, h, c, x, y, z, seg, parent) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), lam(c));
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  function plane(w, h, c, x, y, z, rotX, rotY) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lam(c));
    m.position.set(x || 0, y || 0, z || 0);
    if (rotX) m.rotation.x = rotX;
    if (rotY) m.rotation.y = rotY;
    m.receiveShadow = true;
    return m;
  }

  /* ---------- 道具工厂 ---------- */
  // 椅子：默认「面朝 +z」（椅背在 -z 侧）；seatY 为座面高
  function mkChair(c, parent, x, z, rotY) {
    var g = new THREE.Group();
    box(0.46, 0.06, 0.44, c, 0, 0.44, 0, g);          // 座面
    box(0.46, 0.5, 0.06, c, 0, 0.72, -0.2, g);        // 椅背
    box(0.05, 0.44, 0.05, 0x3a3a40, -0.18, 0.22, -0.16, g);
    box(0.05, 0.44, 0.05, 0x3a3a40, 0.18, 0.22, -0.16, g);
    box(0.05, 0.44, 0.05, 0x3a3a40, -0.18, 0.22, 0.16, g);
    box(0.05, 0.44, 0.05, 0x3a3a40, 0.18, 0.22, 0.16, g);
    g.position.set(x || 0, 0, z || 0);
    if (rotY) g.rotation.y = rotY;
    g.userData.seatY = 0.47;
    if (parent) parent.add(g);
    return g;
  }
  function mkRoundTable(r, h, topC, legC, parent, x, z) {
    var g = new THREE.Group();
    cyl(r, r, 0.05, topC, 0, h, 0, 28, g);
    cyl(0.05, 0.07, h - 0.05, legC, 0, (h - 0.05) / 2, 0, 12, g);
    cyl(r * 0.5, r * 0.55, 0.04, legC, 0, 0.02, 0, 20, g);
    g.position.set(x || 0, 0, z || 0);
    if (parent) parent.add(g);
    return g;
  }
  function mkDesk(w, d, h, topC, legC, parent, x, z) {
    var g = new THREE.Group();
    box(w, 0.06, d, topC, 0, h, 0, g);
    box(0.06, h, d - 0.1, legC, -w / 2 + 0.08, h / 2, 0, g);
    box(0.06, h, d - 0.1, legC, w / 2 - 0.08, h / 2, 0, g);
    g.position.set(x || 0, 0, z || 0);
    if (parent) parent.add(g);
    return g;
  }
  function mkPlant(parent, x, z, s) {
    s = s || 1;
    var g = new THREE.Group();
    cyl(0.14 * s, 0.11 * s, 0.24 * s, 0x8a5a3a, 0, 0.12 * s, 0, 14, g);
    var leaf = new THREE.Mesh(new THREE.SphereGeometry(0.24 * s, 12, 10), lam(0x3e7d4f));
    leaf.position.y = 0.46 * s; leaf.castShadow = true; g.add(leaf);
    var leaf2 = new THREE.Mesh(new THREE.SphereGeometry(0.17 * s, 10, 8), lam(0x4f9460));
    leaf2.position.set(0.12 * s, 0.6 * s, 0.05 * s); leaf2.castShadow = true; g.add(leaf2);
    g.position.set(x || 0, 0, z || 0);
    if (parent) parent.add(g);
    return g;
  }
  function mkWindow(parent, w, h, x, y, z, rotY) {
    var g = new THREE.Group();
    var glow = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: 0xdfeeff }));
    g.add(glow);
    var fc = 0x7a6a52;
    box(w + 0.08, 0.07, 0.06, fc, 0, h / 2, 0.02, g);
    box(w + 0.08, 0.07, 0.06, fc, 0, -h / 2, 0.02, g);
    box(0.07, h, 0.06, fc, -w / 2, 0, 0.02, g);
    box(0.07, h, 0.06, fc, w / 2, 0, 0.02, g);
    box(w, 0.04, 0.05, fc, 0, 0, 0.02, g);
    g.position.set(x, y, z);
    if (rotY) g.rotation.y = rotY;
    if (parent) parent.add(g);
    return g;
  }
  function mkLamp(parent, x, y, z, color, intensity, scene) {
    var g = new THREE.Group();
    box(0.02, 0.4, 0.02, 0x333333, 0, 0.2, 0, g);
    var shade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.16, 18, 1, true), lam(color || 0xe8b04a));
    shade.position.y = -0.05; g.add(shade);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff2cc }));
    bulb.position.y = -0.1; g.add(bulb);
    var pt = new THREE.PointLight(color || 0xffd9a0, intensity || 0.55, 4.5);
    pt.position.y = -0.16; g.add(pt);
    g.position.set(x, y, z);
    if (parent) parent.add(g);
    return g;
  }
  function mkRug(parent, w, d, c, x, z) {
    var m = plane(w, d, c, x || 0, 0.005, z || 0, -Math.PI / 2, 0);
    if (parent) parent.add(m);
    return m;
  }
  function mkShelf(parent, x, z, rotY) {
    var g = new THREE.Group();
    box(1.1, 1.8, 0.3, 0x5d4a36, 0, 0.9, 0, g);
    var cols = [0xb03a3a, 0x3a6ab0, 0xd8c26a, 0x4a8a5a, 0x8a5ab0];
    for (var r = 0; r < 3; r++) {
      for (var i = 0; i < 6; i++) {
        box(0.12, 0.3, 0.2, cols[(r * 2 + i) % cols.length], -0.42 + i * 0.17, 0.42 + r * 0.52, 0.05, g);
      }
    }
    g.position.set(x, 0, z);
    if (rotY) g.rotation.y = rotY;
    if (parent) parent.add(g);
    return g;
  }
  function mkSofa(parent, x, z, c) {
    c = c || 0x7a6aa8;
    var g = new THREE.Group();
    box(1.9, 0.42, 0.85, c, 0, 0.24, 0.05, g);        // 底座
    box(1.9, 0.55, 0.2, c, 0, 0.62, -0.34, g);        // 靠背
    box(0.22, 0.34, 0.8, c, -0.98, 0.5, 0.05, g);     // 扶手
    box(0.22, 0.34, 0.8, c, 0.98, 0.5, 0.05, g);
    box(0.8, 0.3, 0.75, c, 0, 0.55, 0.02, g);         // 坐垫背层视觉
    g.position.set(x || 0, 0, z || 0);
    if (parent) parent.add(g);
    return g;
  }

  /* ---------- 房间外壳 ---------- */
  function mkShell(scene, o) {
    o = o || {};
    var w = o.w || 6.4, d = o.d || 5.6, h = o.h || 3.0;
    var floor = plane(w, d, o.floor || 0xc9a877, 0, 0, (o.floorZ != null ? o.floorZ : -0.2), -Math.PI / 2, 0);
    scene.add(floor);
    var back = plane(w, h, o.wall || 0xf2e7d8, 0, h / 2, (o.floorZ != null ? o.floorZ : -0.2) - d / 2, 0, 0);
    scene.add(back);
    var sideL = plane(d, h, (o.wallSide || o.wall || 0xf2e7d8), -w / 2, h / 2, (o.floorZ != null ? o.floorZ : -0.2), 0, Math.PI / 2);
    var sideR = plane(d, h, (o.wallSide || o.wall || 0xf2e7d8), w / 2, h / 2, (o.floorZ != null ? o.floorZ : -0.2), 0, -Math.PI / 2);
    scene.add(sideL); scene.add(sideR);
    return { floor: floor, back: back };
  }

  /* ---------- 环境场景定义 ----------
   * 每个环境返回：
   *   npcSeat / userSeat: {x, z, rotY, seatY}  椅位（含各自椅子 group 引用由调用方创建）
   *   npcSeated: NPC 开局是否已就座（符合「提前到的人先坐」）
   *   userPos: 用户开局站立位
   *   cam: [x,y,z], look: [x,y,z]
   */
  function buildEnv(envKey, scene) {
    var cfg = {
      npcSeat: { x: 0, z: -0.82, rotY: 0, seatY: 0.47 },
      userSeat: { x: 0, z: 0.62, rotY: Math.PI, seatY: 0.47 },
      npcSeated: false, userSeated: false,
      userPos: { x: 0, z: 1.05 },
      npcPos: { x: 0, z: -1.4 },
      cam: [3.8, 1.8, 0.05], look: [0, 1.0, -0.3],
      bg: 0x1a1626, amb: 0.75
    };
    var tableG;

    switch (envKey) {
      case 'cafe':
      case 'market':
        cfg.bg = 0x2a2016;
        mkShell(scene, { floor: 0xb08d5f, wall: 0xf0e4d0, wallSide: 0xe8dcc4 });
        mkRug(scene, 2.4, 1.9, 0xa3856a, 0, 0);
        tableG = mkRoundTable(0.52, 0.74, 0x8a6844, 0x4a3a28, scene, 0, -0.02);
        cyl(0.09, 0.07, 0.14, 0xffffff, 0.16, 0.84, 0.05, 14, tableG); // 咖啡杯
        mkChair(0xc76b4a, scene, cfg.npcSeat.x, cfg.npcSeat.z, 0);
        mkChair(0xc76b4a, scene, cfg.userSeat.x, cfg.userSeat.z, Math.PI);
        mkWindow(scene, 1.5, 1.3, -1.7, 1.5, -3.0 + 0.02, 0);
        mkShelf(scene, 2.3, -2.6, -Math.PI / 2); // 吧台架（侧墙）
        mkPlant(scene, -2.6, -1.8, 1.15);
        mkPlant(scene, 2.7, 0.6, 0.95);
        mkLamp(scene, 0, 2.5, -0.1, 0xe8b04a, 0.7);
        mkLamp(scene, -1.6, 2.5, -1.5, 0xe8b04a, 0.5);
        cfg.npcSeated = true;
        break;

      case 'restaurant':
        cfg.bg = 0x241019;
        mkShell(scene, { floor: 0x6e3038, wall: 0x5a2a30, wallSide: 0x4e242a });
        mkRug(scene, 2.8, 2.2, 0x7e3a42, 0, 0);
        tableG = mkRoundTable(0.72, 0.76, 0xf3efe6, 0x6a4a2a, scene, 0, -0.02);
        cyl(0.07, 0.05, 0.12, 0xd8d8e8, 0.2, 0.85, 0.08, 12, tableG);
        cyl(0.07, 0.05, 0.12, 0xd8d8e8, -0.2, 0.85, -0.06, 12, tableG);
        mkChair(0x8a3a3a, scene, cfg.npcSeat.x, cfg.npcSeat.z, 0);
        mkChair(0x8a3a3a, scene, cfg.userSeat.x, cfg.userSeat.z, Math.PI);
        mkChair(0x8a3a3a, scene, -0.95, -0.02, Math.PI / 2);
        mkChair(0x8a3a3a, scene, 0.95, -0.02, -Math.PI / 2);
        mkWindow(scene, 1.2, 1.1, -1.8, 1.55, -3.0 + 0.02, 0);
        mkPlant(scene, -2.5, -1.6, 1.1);
        mkPlant(scene, 2.5, -1.6, 1.1);
        mkLamp(scene, 0, 2.4, -0.05, 0xffcf8a, 0.85);
        cfg.npcSeated = true;
        break;

      case 'office':
      case 'auto':
        cfg.bg = 0x141a24;
        mkShell(scene, { floor: 0x9aa2ac, wall: 0xdfe4ea, wallSide: 0xd2d8e0 });
        mkRug(scene, 2.6, 2.0, 0x8a94a2, 0, 0);
        tableG = mkDesk(1.7, 0.8, 0.74, 0x7a5c3e, 0x4a3a28, scene, 0, -1.05);
        box(0.5, 0.34, 0.04, 0x22262e, 0.3, 0.94, -0.25, tableG); // 显示器
        box(0.12, 0.16, 0.12, 0x33383f, 0.3, 0.82, -0.25, tableG);
        cfg.npcSeat = { x: 0, z: -1.62, rotY: 0, seatY: 0.47 };
        cfg.userSeat = { x: 0, z: -0.35, rotY: Math.PI, seatY: 0.47 };
        mkChair(0x35404e, scene, cfg.npcSeat.x, cfg.npcSeat.z, 0);
        mkChair(0x35404e, scene, cfg.userSeat.x, cfg.userSeat.z, Math.PI);
        mkShelf(scene, -2.45, -2.2, Math.PI / 2);
        mkWindow(scene, 1.4, 1.2, 1.9, 1.55, -3.0 + 0.02, 0);
        mkPlant(scene, 2.5, -1.7, 1.1);
        mkLamp(scene, 0, 2.6, -0.6, 0xfff0d0, 0.6);
        cfg.npcSeated = true;
        cfg.userPos = { x: 0, z: 0.55 };
        break;

      case 'service':
        cfg.bg = 0x101826;
        mkShell(scene, { floor: 0x8a94a4, wall: 0xdce2ec, wallSide: 0xcfd6e2 });
        mkRug(scene, 2.8, 2.1, 0x7d8898, 0, 0);
        tableG = mkDesk(2.1, 0.7, 0.76, 0x5a6a7a, 0x3a4450, scene, 0, -1.0); // 服务台
        box(0.06, 0.5, 0.06, 0xffd960, -0.9, 0.86, 0, tableG); // 台牌
        cfg.npcSeat = { x: 0, z: -1.55, rotY: 0, seatY: 0.47 };
        cfg.userSeat = { x: 0, z: -0.55, rotY: Math.PI, seatY: 0.47 };
        mkChair(0x2c3a4e, scene, cfg.npcSeat.x, cfg.npcSeat.z, 0);
        mkChair(0x2c3a4e, scene, cfg.userSeat.x, cfg.userSeat.z, Math.PI);
        mkShelf(scene, -2.4, -2.3, Math.PI / 2);
        mkWindow(scene, 1.2, 1.1, 1.95, 1.55, -3.0 + 0.02, 0);
        mkPlant(scene, -2.5, 0.6, 1.0);
        mkLamp(scene, 0, 2.6, -0.8, 0xeaf2ff, 0.65);
        cfg.npcSeated = true;
        cfg.userPos = { x: 0, z: 0.5 };
        break;

      case 'family':
      case 'home':
        cfg.bg = 0x2a2018;
        mkShell(scene, { floor: 0xa88a5e, wall: 0xf2e2c8, wallSide: 0xe8d6b8 });
        mkRug(scene, 3.0, 2.2, 0xc4a87a, 0, -0.1);
        mkSofa(scene, 0, -1.5, 0x7a8ac2);
        tableG = mkDesk(1.1, 0.6, 0.42, 0x8a6844, 0x4a3a28, scene, 0, -0.35); // 茶几
        cyl(0.08, 0.06, 0.16, 0xe8e8f0, 0.25, 0.58, 0, 12, tableG);
        cfg.npcSeat = { x: -0.35, z: -1.42, rotY: 0, seatY: 0.5 }; // NPC 坐沙发左侧
        cfg.userSeat = { x: 0, z: 0.6, rotY: Math.PI, seatY: 0.47 };
        mkChair(0x9a6a3a, scene, cfg.userSeat.x, cfg.userSeat.z, Math.PI);
        mkWindow(scene, 1.5, 1.2, 1.8, 1.5, -3.0 + 0.02, 0);
        mkPlant(scene, -2.5, -1.9, 1.2);
        mkLamp(scene, 0, 2.5, -0.5, 0xffd9a0, 0.7);
        mkLamp(scene, -1.9, 2.4, -1.8, 0xffd9a0, 0.45);
        cfg.npcSeated = true;
        cfg.userPos = { x: 0, z: 1.0 };
        break;

      case 'bar':
        cfg.bg = 0x120e1a;
        mkShell(scene, { floor: 0x4a3628, wall: 0x3a2c3e, wallSide: 0x2e2432 });
        mkRug(scene, 3.0, 2.4, 0x54402e, 0, 0);
        tableG = mkDesk(3.6, 0.6, 1.05, 0x6a4a30, 0x3a2c20, scene, 0, -1.75); // 吧台
        var neon = new THREE.PointLight(0xff6a9a, 0.5, 5);
        neon.position.set(0, 2.2, -2.6); scene.add(neon);
        for (var bi = 0; bi < 7; bi++) cyl(0.05, 0.05, 0.3, [0x4a8a5a, 0xb03a3a, 0xd8c26a][bi % 3], -1.2 + bi * 0.4, 1.6, -2.85, 8, scene); // 酒瓶架
        var stool = new THREE.Group(); // 吧凳（可拉动的 group，带 seatY）
        cyl(0.22, 0.22, 0.06, 0x8a5a3a, 0, 0.68, 0, 14, stool);
        cyl(0.05, 0.05, 0.68, 0x3a3a40, 0, 0.34, 0, 10, stool);
        stool.position.set(0, 0, -1.1);
        stool.userData.seatY = 0.71;
        scene.add(stool);
        cfg.npcSeat = { x: 0, z: -1.1, rotY: Math.PI, seatY: 0.71 }; // 面向吧台
        cfg.userSeat = { x: 0.8, z: -1.1, rotY: Math.PI, seatY: 0.71 };
        cfg.userPos = { x: 0, z: 0.55 };
        mkLamp(scene, -1.0, 2.4, -1.6, 0xffc88a, 0.55);
        mkLamp(scene, 1.0, 2.4, -1.6, 0xffc88a, 0.55);
        mkPlant(scene, -2.6, 0.4, 1.0);
        cfg.npcSeated = true;
        break;

      case 'wedding':
        cfg.bg = 0x1c1020;
        mkShell(scene, { floor: 0x8a3a4a, wall: 0xf2e0d8, wallSide: 0xe8d0c8 });
        // 舞台拱门
        var arch = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 10, 24, Math.PI), lam(0xe8d8b8));
        arch.position.set(0, 1.0, -2.55); scene.add(arch);
        box(2.2, 0.5, 0.12, 0xe8d8b8, 0, 0.25, -2.55, scene);
        var fl = [0xe86a8a, 0xf0a0b8, 0xf8d8a0];
        for (var fi = 0; fi < 6; fi++) {
          var fb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), lam(fl[fi % 3]));
          fb.position.set(-1.05 + (fi % 3) * 1.05, 0.55 + Math.floor(fi / 3) * 0.75, -2.5);
          scene.add(fb);
        }
        mkRug(scene, 1.6, 3.4, 0xc8506a, 0, -0.5);
        mkPlant(scene, -2.4, -1.4, 1.15);
        mkPlant(scene, 2.4, -1.4, 1.15);
        mkLamp(scene, 0, 2.5, -1.2, 0xffd9c0, 0.7);
        cfg.npcPos = { x: 0, z: -1.6 };
        cfg.userPos = { x: 0, z: 0.7 };
        break;

      case 'corridor':
        cfg.bg = 0x181c22;
        mkShell(scene, { floor: 0x9aa0a8, wall: 0xe2e0da, wallSide: 0xd8d4cc, w: 4.2, d: 6.0 });
        for (var di = 0; di < 2; di++) {
          box(0.06, 1.9, 0.8, 0x8a6a4a, -2.07, 0.95, -1.6 + di * 1.7, scene); // 仅远侧墙留门（近侧墙门会挡镜头）
        }
        box(1.4, 0.02, 0.5, 0xffffff, 0, 2.8, -1.0, scene); // 顶灯
        box(1.4, 0.02, 0.5, 0xffffff, 0, 2.8, 0.6, scene);
        var cl = new THREE.PointLight(0xffffff, 0.55, 6); cl.position.set(0, 2.6, -0.5); scene.add(cl);
        cfg.npcPos = { x: 0, z: -1.5 };
        cfg.userPos = { x: 0.45, z: 0.9 };
        cfg.cam = [3.6, 1.78, 0.05];
        break;

      default: // community / public / generic
        cfg.bg = 0x1a2028;
        mkShell(scene, { floor: 0xb0a488, wall: 0xe8e2d2, wallSide: 0xdcd4c0 });
        mkRug(scene, 2.8, 2.2, 0x9a9078, 0, 0);
        // 公共长椅
        var bench = new THREE.Group();
        box(1.9, 0.08, 0.45, 0x8a6844, 0, 0.44, 0, bench);
        box(1.9, 0.5, 0.07, 0x8a6844, 0, 0.72, -0.2, bench);
        box(0.08, 0.44, 0.4, 0x4a3a28, -0.85, 0.22, 0, bench);
        box(0.08, 0.44, 0.4, 0x4a3a28, 0.85, 0.22, 0, bench);
        bench.position.set(0, 0, -1.55);
        bench.userData.seatY = 0.44;
        scene.add(bench);
        cfg.npcSeat = { x: 0, z: -1.55, rotY: 0, seatY: 0.48 };
        cfg.userSeat = { x: 0, z: 0.6, rotY: Math.PI, seatY: 0.47 };
        mkChair(0x6a8a5a, scene, cfg.userSeat.x, cfg.userSeat.z, Math.PI);
        mkPlant(scene, -2.4, -1.8, 1.25);
        mkPlant(scene, 2.5, -1.4, 1.05);
        mkWindow(scene, 1.6, 1.3, 1.8, 1.55, -3.0 + 0.02, 0);
        mkLamp(scene, 0, 2.55, -0.4, 0xfff0d0, 0.6);
        cfg.npcSeated = true;
        cfg.userPos = { x: 0, z: 1.0 };
        break;
    }
    return cfg;
  }

  /* ---------- 3D 关节人体（真 3D 角色：转身对视/屈膝/弯腰均为骨骼动作） ---------- */
  var CHAR_LOOKS = {
    'user':      { gender: 'm', skin: 0xf2cba5, hair: 0x18181a, hairStyle: 'short', top: 0xb9bdc6, bottom: 0x2a3242, shoes: 0x1c1c1e },
    'npc-wang':  { gender: 'm', skin: 0xeec298, hair: 0x141416, hairStyle: 'short', top: 0x50505a, bottom: 0x3c4a64, shoes: 0xe8e8e8 },
    'npc-lin':   { gender: 'f', skin: 0xf6d4b2, hair: 0x6a4a32, hairStyle: 'long',  top: 0xd9c6ab, bottom: 0xc9b294, shoes: 0xd8b89a },
    'npc-zhang': { gender: 'm', skin: 0xe8bd92, hair: 0x101012, hairStyle: 'short', top: 0x1e1e22, bottom: 0x242428, shoes: 0x161618 },
    'npc-li':    { gender: 'f', skin: 0xf4d0ae, hair: 0x0e0e10, hairStyle: 'long',  top: 0xaac6de, bottom: 0x2c3440, shoes: 0x1a1a1c }
  };
  var JOINTS = ['torsoG', 'headG', 'shL', 'elL', 'shR', 'elR', 'hipL', 'kneeL', 'ankL', 'hipR', 'kneeR', 'ankR', 'skirt'];
  var HEAD_TOP = 1.66; // 头顶离脚底近似高度（锚点用）

  function stdM(c, rough) { // PBR：皮肤/织物/发丝分开粗糙度，画面更真实
    return new THREE.MeshStandardMaterial({ color: c, roughness: rough == null ? 0.85 : rough, metalness: 0 });
  }

  function mkHuman(look) {
    var fem = look.gender === 'f';
    var HIP = 0.93, TORSO = 0.5, THIGH = 0.44, SHIN = 0.42;
    var mats = {
      skin: stdM(look.skin, 0.62), top: stdM(look.top, 0.88), bottom: stdM(look.bottom, 0.9),
      hair: stdM(look.hair, 0.72), shoe: stdM(look.shoes, 0.5), dark: stdM(0x17171a, 0.45),
      white: stdM(0xf8f8f6, 0.4), lip: stdM(0xb2604e, 0.6), blush: stdM(0xe0937f, 0.8)
    };
    var root = new THREE.Group();
    function mesh(geo, mat, x, y, z, parent) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    }
    function group(x, y, z, parent) {
      var g = new THREE.Group();
      g.position.set(x, y, z);
      parent.add(g);
      return g;
    }

    var hips = group(0, HIP, 0, root);
    mesh(new THREE.BoxGeometry(0.25, 0.16, 0.15), fem ? mats.top : mats.bottom, 0, 0.02, 0, hips);

    var torsoG = group(0, 0.07, 0, hips);
    mesh(new THREE.CapsuleGeometry(0.115, TORSO - 0.18, 4, 10), mats.top, 0, TORSO / 2, 0, torsoG);

    var skirt = null;
    if (fem) {
      skirt = group(0, -0.02, 0, torsoG);
      mesh(new THREE.CylinderGeometry(0.125, 0.19, 0.4, 10), mats.bottom, 0, -0.24, 0, skirt);
    }

    // 头（面向 +z：五官细节指示脸的朝向，注视方向一目了然）
    var headG = group(0, TORSO + 0.02, 0, torsoG);
    var head = mesh(new THREE.SphereGeometry(0.115, 14, 12), mats.skin, 0, 0.115, 0, headG);
    head.scale.set(0.94, 1.1, 0.98);
    mesh(new THREE.SphereGeometry(0.02, 8, 6), mats.skin, -0.103, 0.115, 0, headG).scale.set(0.5, 1, 0.7); // 耳
    mesh(new THREE.SphereGeometry(0.02, 8, 6), mats.skin, 0.103, 0.115, 0, headG).scale.set(0.5, 1, 0.7);
    mesh(new THREE.SphereGeometry(0.021, 8, 6), mats.white, -0.043, 0.128, 0.09, headG); // 眼白
    mesh(new THREE.SphereGeometry(0.021, 8, 6), mats.white, 0.043, 0.128, 0.09, headG);
    mesh(new THREE.SphereGeometry(0.011, 6, 6), mats.dark, -0.043, 0.128, 0.104, headG); // 瞳孔
    mesh(new THREE.SphereGeometry(0.011, 6, 6), mats.dark, 0.043, 0.128, 0.104, headG);
    mesh(new THREE.BoxGeometry(0.05, 0.009, 0.012), mats.hair, -0.045, 0.163, 0.098, headG); // 眉
    mesh(new THREE.BoxGeometry(0.05, 0.009, 0.012), mats.hair, 0.045, 0.163, 0.098, headG);
    (function nose() { // 鼻
      var n = mesh(new THREE.ConeGeometry(0.014, 0.034, 8), mats.skin, 0, 0.102, 0.106, headG);
      n.rotation.x = Math.PI / 2;
    })();
    mesh(new THREE.BoxGeometry(0.05, 0.009, 0.01), mats.lip, 0, 0.062, 0.1, headG); // 唇
    if (fem) { // 腮红
      mesh(new THREE.SphereGeometry(0.017, 6, 5), mats.blush, -0.068, 0.09, 0.082, headG).scale.set(1, 0.55, 0.4);
      mesh(new THREE.SphereGeometry(0.017, 6, 5), mats.blush, 0.068, 0.09, 0.082, headG).scale.set(1, 0.55, 0.4);
    }
    if (look.hairStyle === 'long') {
      var cap = mesh(new THREE.SphereGeometry(0.12, 12, 10), mats.hair, 0, 0.135, -0.015, headG);
      cap.scale.set(1.02, 1.05, 1.0);
      mesh(new THREE.BoxGeometry(0.2, 0.36, 0.09), mats.hair, 0, -0.04, -0.082, headG);
      mesh(new THREE.BoxGeometry(0.045, 0.26, 0.07), mats.hair, -0.098, 0.02, 0.015, headG); // 侧发
      mesh(new THREE.BoxGeometry(0.045, 0.26, 0.07), mats.hair, 0.098, 0.02, 0.015, headG);
      mesh(new THREE.BoxGeometry(0.19, 0.05, 0.06), mats.hair, 0, 0.205, 0.052, headG); // 刘海
    } else {
      var cap2 = mesh(new THREE.SphereGeometry(0.12, 12, 10), mats.hair, 0, 0.15, -0.02, headG);
      cap2.scale.set(1.0, 0.82, 1.02);
      mesh(new THREE.BoxGeometry(0.16, 0.045, 0.05), mats.hair, 0, 0.196, 0.06, headG);
    }

    // 手臂（肩→肘→手）
    function arm(side) {
      var sh = group(0.155 * side, 0.44, 0, torsoG);
      mesh(new THREE.CapsuleGeometry(0.046, 0.16, 4, 8), mats.top, 0, -0.135, 0, sh);
      var el = group(0, -0.27, 0, sh);
      mesh(new THREE.CapsuleGeometry(0.04, 0.15, 4, 8), fem ? mats.skin : mats.top, 0, -0.125, 0, el);
      mesh(new THREE.SphereGeometry(0.047, 8, 6), mats.skin, 0, -0.26, 0, el);
      return { sh: sh, el: el };
    }
    var armL = arm(1), armR = arm(-1);

    // 腿（髋→膝→踝→脚，脚尖朝 +z）
    function leg(side) {
      var hip = group(0.075 * side, -0.02, 0, hips);
      mesh(new THREE.CapsuleGeometry(0.062, THIGH - 0.14, 4, 8), fem ? mats.skin : mats.bottom, 0, -THIGH / 2, 0, hip);
      var knee = group(0, -THIGH, 0, hip);
      mesh(new THREE.CapsuleGeometry(0.05, SHIN - 0.14, 4, 8), fem ? mats.skin : mats.bottom, 0, -SHIN / 2, 0, knee);
      var ank = group(0, -SHIN, 0, knee);
      mesh(new THREE.BoxGeometry(0.095, 0.06, 0.2), mats.shoe, 0, -0.028, 0.05, ank);
      return { hip: hip, knee: knee, ank: ank };
    }
    var legL = leg(1), legR = leg(-1);

    /* 服装细节：衣领 / 纽扣 / 腰带 / 鞋底（视觉层，不改关节变换） */
    mesh(new THREE.CylinderGeometry(0.072, 0.082, 0.05, 12), fem ? mats.skin : mats.top, 0, 0.5, 0, torsoG); // 领口
    var ring = mesh(new THREE.TorusGeometry(0.06, 0.011, 8, 16), stdM(0xf2f2ee, 0.7), 0, 0.482, 0, torsoG);
    ring.rotation.x = Math.PI / 2;
    for (var bi2 = 0; bi2 < 3; bi2++) {
      mesh(new THREE.SphereGeometry(0.009, 6, 5), fem ? mats.top : mats.white, 0, 0.42 - bi2 * 0.085, 0.105, torsoG);
    }
    mesh(new THREE.BoxGeometry(0.24, 0.035, 0.155), mats.dark, 0, -0.028, 0, hips); // 腰带
    mesh(new THREE.BoxGeometry(0.105, 0.02, 0.225), mats.dark, 0, -0.048, 0.05, legL.ank); // 鞋底
    mesh(new THREE.BoxGeometry(0.105, 0.02, 0.225), mats.dark, 0, -0.048, 0.05, legR.ank);

    return {
      root: root,
      j: {
        torsoG: torsoG, headG: headG,
        shL: armL.sh, elL: armL.el, shR: armR.sh, elR: armR.el,
        hipL: legL.hip, kneeL: legL.knee, ankL: legL.ank,
        hipR: legR.hip, kneeR: legR.knee, ankR: legR.ank,
        skirt: skirt
      }
    };
  }

  /* ---------- 姿态（关节角目标 + 骨盆高度） ---------- */
  function poseTargets(actor, seated) {
    if (!seated) {
      return { shL: [0, 0, 0.1], shR: [0, 0, -0.1], skirt: [0, 0, 0] };
    }
    return {
      torsoG: [0.05, 0, 0], headG: [0, 0, 0],
      shL: [-0.35, 0, 0.14], elL: [-0.55, 0, 0],
      shR: [-0.35, 0, -0.14], elR: [-0.55, 0, 0],
      hipL: [-1.5, 0, 0.04], kneeL: [1.42, 0, 0], ankL: [0.08, 0, 0],
      hipR: [-1.5, 0, -0.04], kneeR: [1.42, 0, 0], ankR: [0.08, 0, 0],
      skirt: [-1.2, 0, 0]
    };
  }
  function capturePose(a) {
    var o = {};
    JOINTS.forEach(function (n) {
      if (!a.j[n]) return;
      var r = a.j[n].rotation;
      o[n] = [r.x, r.y, r.z];
    });
    return o;
  }
  function applyPose(a, p) {
    JOINTS.forEach(function (n) {
      if (!a.j[n]) return;
      var t = p[n] || [0, 0, 0];
      a.j[n].rotation.set(t[0], t[1], t[2]);
    });
  }
  function lerpPose(a, from, to, e) {
    JOINTS.forEach(function (n) {
      if (!a.j[n]) return;
      var f = from[n] || [0, 0, 0], t = to[n] || [0, 0, 0];
      a.j[n].rotation.set(f[0] + (t[0] - f[0]) * e, f[1] + (t[1] - f[1]) * e, f[2] + (t[2] - f[2]) * e);
    });
  }
  function snapPose(a) {
    if (!a.j) return;
    applyPose(a, poseTargets(a, a.state === 'sit'));
    a.human.position.y = a.rootY || 0;
  }
  function setRootY(a, y) { a.rootY = y; a.human.position.y = y; }

  /* ---------- 朝向（真 3D 转身对视） ---------- */
  function wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
  function lerpAngle(a, b, e) { return a + wrapAngle(b - a) * e; }
  function yawToPoint(a, tx, tz) {
    var dx = tx - a.group.position.x, dz = tz - a.group.position.z;
    if (Math.abs(dx) + Math.abs(dz) < 0.001) return a.group.rotation.y;
    return Math.atan2(dx, dz);
  }
  var _feE = new THREE.Euler();
  function faceOther(inst, actor, cb) {
    var other = actor.who === 'user' ? inst.npc : inst.user;
    if (!other) { if (cb) cb(); return; }
    // 四元数 slerp 最短路径转身；结果规范回纯 Y 欧拉
    //（yaw=π 的四元数按 XYZ 分解是 (−π,0,−π)，直接 copy 会让 rotation.y 读回 0，
    //  破坏注视/IK/行走全部 yaw 逻辑——必须用 YXZ 序提取真实 yaw）
    var qa = new THREE.Quaternion().copy(actor.group.quaternion);
    var yawT = yawToPoint(actor, other.group.position.x, other.group.position.z);
    var qb = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yawT, 0));
    var qm = new THREE.Quaternion();
    tween(inst, actor, 0.45, function (k) {
      qm.slerpQuaternions(qa, qb, smooth(k));
      _feE.setFromQuaternion(qm, 'YXZ');
      actor.group.rotation.set(0, _feE.y, 0);
    }, function () {
      _feE.setFromQuaternion(qb, 'YXZ');
      actor.group.rotation.set(0, _feE.y, 0);
      if (cb) cb();
    });
  }

  /* ---------- 补间/序列 ---------- */
  function tween(inst, owner, dur, fn, done) {
    inst.tweens.push({ t: 0, dur: dur || 0.3, fn: fn, done: done, owner: owner });
  }
  // 带 busy 保护的补间：动作期间抑制注视/呼吸层覆盖关节（结束恢复原 busy）
  function busyTween(inst, owner, dur, fn, done) {
    var prev = !!owner.busy;
    owner.busy = true;
    tween(inst, owner, dur, fn, function () { owner.busy = prev; if (done) done(); });
  }
  function chain(inst, owner, steps, done) {
    var g = owner.gen;
    owner.busy = true;
    var i = 0;
    function next() {
      if (g !== owner.gen) return;
      if (i >= steps.length) { owner.busy = false; if (done) done(); return; }
      steps[i++](next);
    }
    next();
  }
  function cancelOwner(inst, owner) {
    owner.gen++;
    owner.busy = false;
    inst.tweens = inst.tweens.filter(function (tw) { return tw.owner !== owner; });
    snapPose(owner);
  }

  // 走路：身体朝行进方向，双腿摆动、双臂反摆、重心起伏
  function walkTo(inst, actor, tx, tz, speed, cb) {
    var sx = actor.group.position.x, sz = actor.group.position.z;
    var dist = Math.sqrt((tx - sx) * (tx - sx) + (tz - sz) * (tz - sz));
    if (dist < 0.02) { if (cb) cb(); return; }
    var yaw0 = actor.group.rotation.y;
    var yawT = Math.atan2(tx - sx, tz - sz);
    var dur = Math.max(0.45, dist / (speed || 1.1));
    var baseY = actor.rootY || 0;
    tween(inst, actor, dur, function (k) {
      var e = smooth(k);
      actor.group.position.x = sx + (tx - sx) * e;
      actor.group.position.z = sz + (tz - sz) * e;
      actor.group.rotation.y = lerpAngle(yaw0, yawT, Math.min(1, k * 3));
      var ph = e * dur * 7.2;
      var s = Math.sin(ph), c = Math.abs(Math.cos(ph));
      actor.j.hipL.rotation.x = s * 0.52;
      actor.j.hipR.rotation.x = -s * 0.52;
      actor.j.kneeL.rotation.x = Math.max(0.05, -s) * 0.85;
      actor.j.kneeR.rotation.x = Math.max(0.05, s) * 0.85;
      actor.j.ankL.rotation.x = -actor.j.kneeL.rotation.x * 0.5;
      actor.j.ankR.rotation.x = -actor.j.kneeR.rotation.x * 0.5;
      actor.j.shL.rotation.x = -s * 0.32;
      actor.j.shR.rotation.x = s * 0.32;
      actor.j.elL.rotation.x = -0.25;
      actor.j.elR.rotation.x = -0.25;
      if (actor.j.skirt) actor.j.skirt.rotation.x = -Math.abs(s) * 0.1;
      setRootY(actor, baseY + c * 0.022);
    }, function () {
      snapPose(actor);
      if (cb) cb();
    });
  }

  // 姿态过渡（坐下=屈膝下沉、起身=蹬直），可同步平移到座位/让位
  function setPose(inst, actor, name, dur, opts, done) {
    opts = opts || {};
    var seated = name === 'sit';
    var target = poseTargets(actor, seated);
    var fromPose = capturePose(actor);
    var fromY = actor.rootY || 0;
    var toY = seated ? (actor.seat ? actor.seat.seatY : 0.47) - 0.91 : 0;
    var fx = actor.group.position.x, fz = actor.group.position.z;
    var txx = opts.moveTo ? opts.moveTo.x : fx, tzz = opts.moveTo ? opts.moveTo.z : fz;
    tween(inst, actor, dur, function (k) {
      var e = smooth(k);
      lerpPose(actor, fromPose, target, e);
      setRootY(actor, fromY + (toY - fromY) * e);
      actor.group.position.x = fx + (txx - fx) * e;
      actor.group.position.z = fz + (tzz - fz) * e;
    }, function () {
      setRootY(actor, toY);
      applyPose(actor, target);
      actor.state = seated ? 'sit' : 'stand';
      if (done) done();
    });
  }

  /* ---------- 真实生活逻辑动作序列 ---------- */
  // 坐下：走到椅前 → 拉开椅子 → 绕到座位 → 面向桌子 → 屈膝坐下 → 椅子推回
  function seqSit(inst, actor, done) {
    if (actor.state === 'sit' || !actor.seat) { if (done) done(); return; }
    var seat = actor.seat, chair = seat.chair;
    if (!chair) {
      chain(inst, actor, [
        function (next) { setPose(inst, actor, 'sit', 0.55, { moveTo: { x: seat.x, z: seat.z } }, next); },
        function (next) { faceOther(inst, actor, next); }
      ], done);
      return;
    }
    var facing = new THREE.Vector3(0, 0, 1).applyEuler(chair.rotation);
    var outDir = facing.clone().multiplyScalar(-1);
    var home = new THREE.Vector3(seat.x, 0, seat.z);
    var approach = home.clone().add(outDir.clone().multiplyScalar(0.5));
    chain(inst, actor, [
      function (next) { walkTo(inst, actor, approach.x, approach.z, 1.15, next); },
      function (next) { // 拉开椅子
        var target = home.clone().add(outDir.clone().multiplyScalar(0.42));
        var from = chair.position.clone();
        tween(inst, actor, 0.45, function (k) { chair.position.lerpVectors(from, target, smooth(k)); }, next);
      },
      function (next) { // 走到座位与桌之间
        var at = home.clone().add(outDir.clone().multiplyScalar(0.02));
        walkTo(inst, actor, at.x, at.z, 1.0, next);
      },
      function (next) { // 转身面向桌子
        var yawT = Math.atan2(facing.x, facing.z);
        var y0 = actor.group.rotation.y;
        tween(inst, actor, 0.35, function (k) { actor.group.rotation.y = lerpAngle(y0, yawT, smooth(k)); }, next);
      },
      function (next) { // 屈膝坐下（贴着椅子下沉）
        setPose(inst, actor, 'sit', 0.6, { moveTo: { x: home.x, z: home.z } }, next);
      },
      function (next) { // 椅子推回（人随椅子一起）
        var from = chair.position.clone();
        var ax0 = actor.group.position.x, az0 = actor.group.position.z;
        tween(inst, actor, 0.5, function (k) {
          var e = smooth(k);
          chair.position.lerpVectors(from, home, e);
          actor.group.position.x = ax0 + (home.x - ax0) * e;
          actor.group.position.z = az0 + (home.z - az0) * e;
        }, next);
      },
      function (next) { faceOther(inst, actor, next); }
    ], done);
  }

  // 起身：椅子拉开 → 蹬直起身站到椅侧 → 椅子推回 → 面向对方
  function seqStand(inst, actor, done) {
    if (actor.state === 'stand' || !actor.seat) { if (done) done(); return; }
    var seat = actor.seat, chair = seat.chair;
    if (!chair) {
      chain(inst, actor, [
        function (next) { setPose(inst, actor, 'stand', 0.55, null, next); },
        function (next) { faceOther(inst, actor, next); }
      ], done);
      return;
    }
    var facing = new THREE.Vector3(0, 0, 1).applyEuler(chair.rotation);
    var outDir = facing.clone().multiplyScalar(-1);
    var home = new THREE.Vector3(seat.x, 0, seat.z);
    chain(inst, actor, [
      function (next) { // 椅子拉开
        var target = home.clone().add(outDir.clone().multiplyScalar(0.42));
        var from = chair.position.clone();
        tween(inst, actor, 0.4, function (k) { chair.position.lerpVectors(from, target, smooth(k)); }, next);
      },
      function (next) { // 起身（站到椅子外侧）
        var standAt = home.clone().add(outDir.clone().multiplyScalar(0.42));
        setPose(inst, actor, 'stand', 0.55, { moveTo: standAt }, next);
      },
      function (next) { // 椅子推回
        var from = chair.position.clone();
        tween(inst, actor, 0.45, function (k) { chair.position.lerpVectors(from, home, smooth(k)); }, next);
      },
      function (next) { faceOther(inst, actor, next); }
    ], done);
  }

  /* ---------- 角色创建 ---------- */
  function mkActor(inst, who, imgUrl, cfgSeat, startPos, startSeated) {
    var stem = String(imgUrl || '').split('/').pop().replace(/\.png.*$/, '').replace(/-full$/, '');
    var look = CHAR_LOOKS[stem] || CHAR_LOOKS['user'];
    var human = mkHuman(look);
    var actor = {
      who: who, group: new THREE.Group(), human: human.root, j: human.j,
      state: startSeated ? 'sit' : 'stand',
      seat: cfgSeat || null,
      busy: false, gen: 0, rootY: 0, nameTag: null
    };
    actor.group.add(human.root);
    actor.group.position.set(startPos.x, 0, startPos.z);
    inst.scene.add(actor.group);
    if (startSeated && cfgSeat) {
      setRootY(actor, cfgSeat.seatY - 0.91);
      applyPose(actor, poseTargets(actor, true));
      var f = cfgSeat.chair ? new THREE.Vector3(0, 0, 1).applyEuler(cfgSeat.chair.rotation) : null;
      actor.group.rotation.y = f ? Math.atan2(f.x, f.z) : (cfgSeat.rotY || 0);
    } else {
      applyPose(actor, poseTargets(actor, false));
    }
    return actor;
  }

  /* ---------- 动作分发（礼仪规范：先面向对方再行礼） ---------- */
  function ensureStand(inst, actor, cb) {
    if (actor.state === 'stand') { cb(); return; }
    seqStand(inst, actor, cb);
  }

  /* ---------- 双骨解析 IK（握手/递名片精准触达） ----------
   * 肩-肘-手两段解析解；肘限位 0–145°（禁止反向翻肘）；
   * 目标先转根局部空间解算；胶囊自碰撞：水平推离躯干轴 ≥0.16m。
   * side: +1 左手 / -1 右手；blend: 0..1 与当前姿态混合。 */
  var ARM_L1 = 0.27, ARM_L2 = 0.31, ELBOW_MAX = 145 * Math.PI / 180;
  var _ikW = new THREE.Vector3();
  function armIK(a, side, targetW, blend) {
    if (blend == null) blend = 1;
    var S = side > 0 ? 'L' : 'R';
    var sh = a.j['sh' + S], el = a.j['el' + S];
    if (!sh || !el) return;
    a.group.updateMatrixWorld(true);
    sh.getWorldPosition(_ikW);
    var yaw = a.group.rotation.y;
    var dx = targetW.x - _ikW.x, dy = targetW.y - _ikW.y, dz = targetW.z - _ikW.z;
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var lx = cy * dx - sy * dz;
    var lz = sy * dx + cy * dz;
    // 胶囊自碰撞：手目标不得穿入躯干
    var spine = Math.sqrt(lx * lx + lz * lz);
    if (spine < 0.16 && dy > -0.35 && dy < 0.5) {
      var px = spine > 0.02 ? lx / spine : side * 0.9;
      var pz = spine > 0.02 ? lz / spine : 0.1;
      lx = px * 0.16; lz = pz * 0.16;
    }
    var dFull = Math.sqrt(lx * lx + dy * dy + lz * lz) || 0.001;
    var Dx = lx / dFull, Dy = dy / dFull, Dz = lz / dFull; // 单位射线（根局部空间）
    var d = Math.max(0.1, Math.min((ARM_L1 + ARM_L2) * 0.99, dFull));
    // 余弦定理解「两段夹角」inner（π=伸直、0=全折）；人肘屈曲角 flex = π − inner
    var cosE = (ARM_L1 * ARM_L1 + ARM_L2 * ARM_L2 - d * d) / (2 * ARM_L1 * ARM_L2);
    var inner = Math.acos(Math.max(-1, Math.min(1, cosE)));
    var flex = Math.PI - inner;                    // 0=伸直，越大越弯
    flex = Math.max(0, Math.min(ELBOW_MAX, flex)); // 屈曲限位 0–145°（禁反向翻肘）
    // 精确两骨解析解：手−肩 = Rx(φ)·Rz(θ)·(0, −A, B)（A=L1+L2cos flex, B=L2 sin flex），
    // 令其等于 D·d 反解：θ = asin(Dx·d/A)，φ = atan2(Dz·d, Dy·d) − atan2(B, −A·cosθ)
    var A = ARM_L1 + ARM_L2 * Math.cos(flex);
    var B = ARM_L2 * Math.sin(flex);
    var th = Math.asin(Math.max(-1, Math.min(1, Dx * d / A))); // 方位（绕 z）
    var ph = Math.atan2(Dz * d, Dy * d) - Math.atan2(B, -A * Math.cos(th)); // 俯仰（绕 x）
    var b0 = 1 - blend;
    sh.rotation.x = sh.rotation.x * b0 + ph * blend;
    sh.rotation.z = sh.rotation.z * b0 + th * blend;
    el.rotation.x = el.rotation.x * b0 + (-flex) * blend;
  }

  /* 收手：手臂回基础姿态 */
  function handBack(inst, actor, done) {
    var cap = capturePose(actor);
    var base = poseTargets(actor, actor.state === 'sit');
    busyTween(inst, actor, 0.5, function (k) { lerpPose(actor, cap, base, smooth(k)); },
      function () { snapPose(actor); if (done) done(); });
  }

  /* ---------- Blender 动画曲线播放（GS3D_ANIM，crossfade 无硬切） ---------- */
  function playClip(inst, actor, clipName, opts, done) {
    if (typeof opts === 'function') { done = opts; opts = null; }
    var lib = window.GS3D_ANIM;
    var clip = lib && lib.clips && lib.clips[clipName];
    if (!clip) { if (done) done(); return false; }
    var fps = lib.fps || 24, frames = clip.frames;
    var from = capturePose(actor);
    var base = poseTargets(actor, actor.state === 'sit');
    var names = Object.keys(clip.joints);
    busyTween(inst, actor, frames / fps, function (k) {
      var fi = k * frames;
      var i0 = Math.min(Math.floor(fi), frames - 1);
      var u = fi - i0;
      var bIn = Math.min(1, k / 0.12);           // 入场 crossfade
      var bOut = Math.max(0, (k - 0.9) / 0.1);   // 收势淡回基础姿态
      names.forEach(function (n) {
        var j = actor.j[n];
        if (!j) return;
        var a0 = clip.joints[n][i0], a1 = clip.joints[n][Math.min(i0 + 1, frames)];
        var f = from[n] || [0, 0, 0], bt = base[n] || [0, 0, 0];
        for (var ax = 0; ax < 3; ax++) {
          var cv = a0[ax] + (a1[ax] - a0[ax]) * u;
          var v1 = f[ax] + (cv - f[ax]) * bIn;
          j.rotation.set.apply(j.rotation, ax === 0 ? [v1 + (bt[0] - v1) * bOut, j.rotation.y, j.rotation.z]
            : ax === 1 ? [j.rotation.x, v1 + (bt[1] - v1) * bOut, j.rotation.z]
            : [j.rotation.x, j.rotation.y, v1 + (bt[2] - v1) * bOut]);
        }
      });
    }, function () { snapPose(actor); if (done) done(); });
    return true;
  }

  /* ---------- 程序化兜底动作（GS3D_ANIM 缺失时） ---------- */
  function bowProcedural(inst, actor, deg, done) {
    var peak = deg * Math.PI / 180;
    var hold = deg >= 40 ? 1.0 : (deg >= 25 ? 0.7 : 0.45);
    var at = poseTargets(actor, actor.state === 'sit');
    var from = capturePose(actor);
    var pk = {};
    JOINTS.forEach(function (n) { pk[n] = (at[n] || [0, 0, 0]).slice(); });
    pk.torsoG = [peak + (at.torsoG ? at.torsoG[0] : 0), 0, 0];
    pk.headG = [-peak * 0.35 + (at.headG ? at.headG[0] : 0), 0, 0]; // 头反向补偿：弯腰全程目光不离对方
    if (deg >= 30) {
      pk.shL = [-0.35, 0, 0.14]; pk.elL = [-0.55, 0, 0];
      pk.shR = [-0.35, 0, -0.14]; pk.elR = [-0.55, 0, 0];
    } else {
      pk.shL = [0, 0, (at.shL ? at.shL[2] : 0.1) + 0.06];
      pk.shR = [0, 0, (at.shR ? at.shR[2] : -0.1) - 0.06];
    }
    chain(inst, actor, [
      function (n1) { tween(inst, actor, 0.8, function (k) { lerpPose(actor, from, pk, smooth(k)); }, n1); },
      function (n1) { tween(inst, actor, hold, function () { lerpPose(actor, from, pk, 1); }, n1); },
      function (n1) { tween(inst, actor, 1.0, function (k) { lerpPose(actor, pk, from, smooth(k)); }, n1); }
    ], function () { snapPose(actor); if (done) done(); });
  }
  function leadProcedural(inst, actor, done) {
    var at = poseTargets(actor, actor.state === 'sit');
    var from = capturePose(actor);
    var pk = {};
    JOINTS.forEach(function (n) { pk[n] = (at[n] || [0, 0, 0]).slice(); });
    pk.shR = [-1.15, 0, -0.55]; pk.elR = [-0.15, 0, 0];
    pk.torsoG = [(at.torsoG ? at.torsoG[0] : 0) + 0.04, 0.15, 0];
    pk.headG = [-0.05, 0.12, 0];
    busyTween(inst, actor, 2.6, function (k) {
      var b = Math.min(1, Math.sin(Math.PI * clamp01(k)) * 2.2);
      lerpPose(actor, from, pk, smooth(b));
      actor.j.elR.rotation.x = -0.15 - Math.max(0, Math.sin(Math.PI * k * 3)) * 0.1 * b;
    }, function () { snapPose(actor); if (done) done(); });
  }
  function toastAct(inst, actor, done) { // 干杯：双手举杯至口高，杯沿敬意微顿
    var at = poseTargets(actor, actor.state === 'sit');
    var from = capturePose(actor);
    var pk = {};
    JOINTS.forEach(function (n) { pk[n] = (at[n] || [0, 0, 0]).slice(); });
    pk.shL = [-1.25, 0, 0.12]; pk.elL = [-0.95, 0, 0];
    pk.shR = [-1.25, 0, -0.12]; pk.elR = [-0.95, 0, 0];
    pk.headG = [-0.06, 0, 0];
    busyTween(inst, actor, 1.8, function (k) {
      var b = Math.min(1, k / 0.25, (1 - k) / 0.25);
      lerpPose(actor, from, pk, smooth(b));
      var bounce = Math.sin(Math.PI * k * 3) * 0.045 * b;
      actor.j.elL.rotation.x -= bounce; actor.j.elR.rotation.x -= bounce;
    }, function () { snapPose(actor); if (done) done(); });
  }
  function phoneAct(inst, actor, done) { // 看手机（反面教材）：低头 + 手抬胸前
    var at = poseTargets(actor, actor.state === 'sit');
    var from = capturePose(actor);
    var pk = {};
    JOINTS.forEach(function (n) { pk[n] = (at[n] || [0, 0, 0]).slice(); });
    pk.headG = [0.5, 0, 0];
    pk.torsoG = [(at.torsoG ? at.torsoG[0] : 0) + 0.12, 0, 0];
    pk.shR = [-0.55, 0, -0.15]; pk.elR = [-1.5, 0, 0];
    busyTween(inst, actor, 2.2, function (k) {
      var b = Math.min(1, k / 0.22, (1 - k) / 0.22);
      lerpPose(actor, from, pk, smooth(b));
    }, function () { snapPose(actor); if (done) done(); });
  }

  /* ---------- 名片道具 ---------- */
  function mkCard() {
    var g = new THREE.Group();
    var c1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.062, 0.004), stdM(0xf5f6fa, 0.5));
    var c2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.005), stdM(0x3a5f9a, 0.6));
    c2.position.y = 0.015;
    c1.castShadow = true;
    g.add(c1); g.add(c2);
    return g;
  }

  /* ---------- 握手（双向 IK 精准触达） ---------- */
  function handshakeMid(a, b, out) {
    var pa = a.group.position, pb = b ? b.group.position : pa;
    out.x = (pa.x + pb.x) / 2; out.z = (pa.z + pb.z) / 2; out.y = 1.04;
    return out;
  }
  function shakeAct(inst, actor) {
    var other = actor.who === 'user' ? inst.npc : inst.user;
    chain(inst, actor, [
      function (next) { ensureStand(inst, actor, next); },
      function (next) {
        if (!other) return next();
        var me = actor.group.position, ot = other.group.position;
        var dx = ot.x - me.x, dz = ot.z - me.z, dl = Math.sqrt(dx * dx + dz * dz) || 1;
        var stop = Math.max(0, dl - 0.72);
        walkTo(inst, actor, me.x + dx / dl * stop, me.z + dz / dl * stop, 1.1, next);
      },
      function (next) { faceOther(inst, actor, next); },
      function (next) { // 对方自动对称回应（礼仪双向性），等其迎步就位后再伸手
        if (!other || other.busy) return next();
        other.hsReady = false;
        runAction(inst, other, 'handshakeRespond', { from: actor });
        var t0 = Date.now();
        (function poll() {
          if (inst.disposed || other.hsReady || Date.now() - t0 > 4000) return next();
          setTimeout(poll, 100);
        })();
      },
      function (next) { // IK 精准触达
        var M = new THREE.Vector3();
        handshakeMid(actor, other, M);
        tween(inst, actor, 0.7, function (k) {
          handshakeMid(actor, other, M);
          armIK(actor, -1, M, smooth(k));
          actor.j.torsoG.rotation.x = 0.05 * k;
        }, next);
      },
      function (next) { // 握住轻晃 2 次（虎口相对）
        var M = new THREE.Vector3();
        tween(inst, actor, 1.4, function (k) {
          handshakeMid(actor, other, M);
          M.y = 1.04 + Math.sin(Math.PI * k * 4) * 0.05;
          armIK(actor, -1, M, 1);
          actor.j.torsoG.rotation.x = 0.05;
        }, next);
      },
      function (next) { handBack(inst, actor, next); }
    ]);
  }
  function shakeRespond(inst, actor, partner) {
    chain(inst, actor, [
      function (next) { ensureStand(inst, actor, next); },
      function (next) { faceOther(inst, actor, next); },
      function (next) { // 迎半步：抵消起身后撤，回到握手距离（0.72m，双臂可完全触达）
        if (!partner) return next();
        var me = actor.group.position, pt = partner.group.position;
        var dx = pt.x - me.x, dz = pt.z - me.z, dl = Math.sqrt(dx * dx + dz * dz) || 1;
        var walk = dl - 0.72;
        if (walk <= 0.02) return next();
        walkTo(inst, actor, me.x + dx / dl * walk, me.z + dz / dl * walk, 0.55, next);
      },
      function (next) { actor.hsReady = true; next(); },
      function (next) { // 跟随对方晃动（同一交点，IK 每帧解算）
        var M = new THREE.Vector3();
        tween(inst, actor, 2.8, function () {
          handshakeMid(actor, partner, M);
          M.y += Math.sin(Math.PI * 0.5) * 0;
          armIK(actor, -1, M, 1);
          actor.j.torsoG.rotation.x = 0.05;
        }, next);
      },
      function (next) { handBack(inst, actor, next); }
    ]);
  }

  /* ---------- 递名片（道具所有权移交 + 双手承接礼仪） ---------- */
  function handoverPoint(from, to, out) { // 两人中点偏递出方 0.32m，胸口高度
    var pf = from.group.position, pt = to.group.position;
    var dx = pt.x - pf.x, dz = pt.z - pf.z, dl = Math.sqrt(dx * dx + dz * dz) || 1;
    out.set(pf.x + dx / dl * 0.32, to.rootY + (to.state === 'sit' ? 1.28 : 1.1), pf.z + dz / dl * 0.32);
    return out;
  }
  function cardAct(inst, actor) {
    var other = actor.who === 'user' ? inst.npc : inst.user;
    chain(inst, actor, [
      function (next) { ensureStand(inst, actor, next); },
      function (next) { faceOther(inst, actor, next); },
      function (next) {
        if (!other) return next();
        var card = mkCard();
        actor.j.elL.add(card); // 左手持名片，字朝对方
        card.position.set(0, -0.31, 0.03);
        card.rotation.set(-1.1, 0, 0);
        if (!other.busy) runAction(inst, other, 'cardReceive', { from: actor });
        var T = new THREE.Vector3();
        tween(inst, actor, 0.9, function (k) {
          handoverPoint(actor, other, T);
          armIK(actor, 1, T, smooth(k));
          actor.j.torsoG.rotation.x = 0.06 * k;
        }, function () {
          // 所有权移交 → 对方手承接
          if (card.parent) card.parent.remove(card);
          other.j.elR.add(card);
          card.position.set(0, -0.31, 0.03);
          card.rotation.set(-0.9, 0, 0);
          setTimeout(function () { if (card.parent) card.parent.remove(card); }, 2600);
          next();
        });
      },
      function (next) { handBack(inst, actor, next); }
    ]);
  }
  function cardReceive(inst, actor, opts) {
    var partner = opts && opts.from;
    chain(inst, actor, [
      function (next) { ensureStand(inst, actor, next); },
      function (next) { faceOther(inst, actor, next); },
      function (next) { // 双手迎上（右手 IK 跟随交接点，左手辅助，微前倾）
        var T = new THREE.Vector3();
        tween(inst, actor, 0.85, function (k) {
          if (partner) {
            handoverPoint(actor, partner, T);
            armIK(actor, -1, T, smooth(k));
          }
          actor.j.shL.rotation.x = -0.5 * k;
          actor.j.elL.rotation.x = -0.7 * k;
          actor.j.torsoG.rotation.x = 0.08 * k;
        }, next);
      },
      function (next) { // 收至胸前低头注视（商务礼仪）
        var cap = capturePose(actor);
        var at = {};
        JOINTS.forEach(function (n) { at[n] = (cap[n] || [0, 0, 0]).slice(); });
        at.elR = [-1.35, 0, 0]; at.shR = [-0.55, 0, -0.1]; at.headG = [0.3, 0, 0];
        tween(inst, actor, 0.45, function (k) { lerpPose(actor, cap, at, smooth(k)); }, next);
      },
      function (next) { tween(inst, actor, 1.0, function () {}, next); },
      function (next) { handBack(inst, actor, next); }
    ]);
  }

  function runAction(inst, actor, action, opts) {
    cancelOwner(inst, actor);

    switch (action) {
      case 'sit': seqSit(inst, actor); return;
      case 'stand': seqStand(inst, actor); return;
      case 'greet': // 对话状态机 greet 拍：面向对方 → 15°鞠躬+收势点头
        chain(inst, actor, [
          function (next) { faceOther(inst, actor, next); },
          function (next) {
            if (playClip(inst, actor, 'greet', next)) return;
            bowProcedural(inst, actor, 15, function () {
              busyTween(inst, actor, 0.9, function (k) {
                actor.j.headG.rotation.x = Math.abs(Math.sin(Math.PI * k * 2)) * 0.22;
              }, next);
            });
          }
        ]); return;
      case 'raise': // 起身相迎；已站立则欠身致意
        if (actor.state === 'sit') { seqStand(inst, actor); return; }
        chain(inst, actor, [
          function (next) { faceOther(inst, actor, next); },
          function (next) {
            tween(inst, actor, 0.9, function (k) {
              var e = Math.sin(Math.PI * k);
              actor.j.torsoG.rotation.x = e * 0.15;
              actor.j.headG.rotation.x = e * 0.12;
            }, next);
          }
        ]); return;
      case 'bow15': case 'bow30': case 'bow45': case 'bow': { // 鞠躬三档规范
        var deg = action === 'bow' ? 30 : parseInt(action.slice(3), 10);
        ensureStand(inst, actor, function () {
          faceOther(inst, actor, function () {
            if (!playClip(inst, actor, 'bow' + deg)) bowProcedural(inst, actor, deg);
          });
        }); return;
      }
      case 'nod': // 点头
        if (playClip(inst, actor, 'nod')) return;
        tween(inst, actor, 1.0, function (k) {
          actor.j.headG.rotation.x = Math.abs(Math.sin(Math.PI * k * 2)) * 0.26;
        }); return;
      case 'shake': // 摇头
        tween(inst, actor, 1.2, function (k) {
          actor.j.headG.rotation.y = Math.sin(Math.PI * k * 4) * 0.38;
        }); return;
      case 'handshake': shakeAct(inst, actor); return;
      case 'handshakeRespond': shakeRespond(inst, actor, opts && opts.from); return;
      case 'card': cardAct(inst, actor); return;
      case 'cardReceive': cardReceive(inst, actor, opts); return;
      case 'lead': // 引领手势
        ensureStand(inst, actor, function () {
          faceOther(inst, actor, function () {
            if (!playClip(inst, actor, 'lead')) leadProcedural(inst, actor);
          });
        }); return;
      case 'toast': toastAct(inst, actor); return;
      case 'phone': phoneAct(inst, actor); return;
      case 'smile': // 微笑示意：头部轻倾 + 认可小点头
        busyTween(inst, actor, 1.2, function (k) {
          actor.j.headG.rotation.z = Math.sin(Math.PI * k) * 0.1;
          actor.j.headG.rotation.x = Math.abs(Math.sin(Math.PI * k)) * 0.12;
        }); return;
      case 'wave': // 挥手打招呼：面向对方 → 举手轻摆
        chain(inst, actor, [
          function (next) { faceOther(inst, actor, next); },
          function (next) {
            busyTween(inst, actor, 1.5, function (k) {
              var e = Math.sin(Math.PI * clamp01(k));
              var hold = Math.min(1, e * 3);
              actor.j.shR.rotation.x = -1.9 * hold + Math.sin(Math.PI * k * 6) * 0.16 * e;
              actor.j.shR.rotation.z = -0.25 * hold;
              actor.j.elR.rotation.x = -0.5 * hold;
            }, next);
          }
        ]); return;
      case 'step': { // 朝对方前进一步
        var ot = actor.who === 'user' ? inst.npc : inst.user;
        if (ot) {
          var me2 = actor.group.position, ot2 = ot.group.position;
          var dx2 = ot2.x - me2.x, dz2 = ot2.z - me2.z;
          var dl2 = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1;
          chain(inst, actor, [
            function (next) { walkTo(inst, actor, me2.x + dx2 / dl2 * 0.38, me2.z + dz2 / dl2 * 0.38, 0.85, next); },
            function (next) { faceOther(inst, actor, next); }
          ]);
        }
        return;
      }
      case 'turn': { // 转身（一周后回到原朝向）
        var y0t = actor.group.rotation.y;
        busyTween(inst, actor, 1.3, function (k) {
          actor.group.rotation.y = y0t + Math.PI * 2 * smooth(k);
        }); return;
      }
      default: // 兜底：轻微点头
        busyTween(inst, actor, 0.8, function (k) {
          actor.j.headG.rotation.x = Math.sin(Math.PI * k) * 0.15;
        });
    }
  }

  /* ---------- 挂载 ---------- */
  function mount(stageId, cfg) {
    var stage = document.getElementById(stageId);
    if (!stage) return false;
    // modal 刚打开时可能仍 display:none（clientWidth=0）→ 延迟到可见后再挂载
    if (!stage.clientWidth) {
      var tries = 0;
      (function retry() {
        var st = document.getElementById(stageId);
        var inst = instances[stageId];
        if (inst || !st) return;
        if (st.clientWidth || tries++ > 12) { mount(stageId, cfg); return; }
        setTimeout(retry, 90);
      })();
      return true;
    }
    dispose(stageId);

    cfg = cfg || {};
    var env = cfg.env || 'office';
    var npcImg = (cfg.npc && (cfg.npc.image || cfg.npc.fullBody)) || 'assets/images/chars/npc-wang.png';
    var userImg = (cfg.user && cfg.user.image) || 'assets/images/chars/user.png';

    var W = stage.clientWidth || 360, H = stage.clientHeight || 300;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    if (renderer.shadowMap) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.className = 'stage3d-canvas';
    stage.style.background = '#141020';
    stage.insertBefore(renderer.domElement, stage.firstChild);

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141020);

    var camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 30);

    var ecfg = buildEnv(env, scene);
    scene.background = new THREE.Color(ecfg.bg);

    // 灯光：环境光 + 主方向光（投影）+ 补光
    var amb = new THREE.HemisphereLight(0xfff4e0, 0x554433, ecfg.amb);
    scene.add(amb);
    var dir = new THREE.DirectionalLight(0xfff0dc, 0.85);
    dir.position.set(1.6, 3.2, 2.4);
    dir.castShadow = true;
    if (dir.shadow && dir.shadow.camera) {
      dir.shadow.camera.left = -4; dir.shadow.camera.right = 4;
      dir.shadow.camera.top = 4; dir.shadow.camera.bottom = -4;
      dir.shadow.mapSize.set(1024, 1024);
    }
    scene.add(dir);
    var fill = new THREE.DirectionalLight(0xbcc8ff, 0.25);
    fill.position.set(-2, 2, 1.5);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xa8c4ff, 0.22); // 轮廓光：人物从背景里"立"出来
    rim.position.set(-2.2, 2.6, -2.8);
    scene.add(rim);

    camera.position.set(ecfg.cam[0], ecfg.cam[1], ecfg.cam[2]);
    camera.lookAt(new THREE.Vector3(ecfg.look[0], ecfg.look[1], ecfg.look[2]));

    // 名牌（DOM）
    stage.classList.add('is-3d');
    stage.classList.remove('is-photo');
    var tagN = document.createElement('div');
    tagN.className = 'photo-tag photo-tag-npc';
    tagN.textContent = (cfg.npc && cfg.npc.label) || '场景角色';
    stage.appendChild(tagN);
    var tagU = document.createElement('div');
    tagU.className = 'photo-tag photo-tag-user';
    tagU.textContent = (cfg.user && cfg.user.label) || '我';
    stage.appendChild(tagU);

    var inst = {
      stage: stage, renderer: renderer, scene: scene, camera: camera,
      ecfg: ecfg, tweens: [], anchors: null, onLayout: cfg.onLayout,
      lastLayout: 0, raf: 0, ro: null, disposed: false,
      px: 0, py: 0, pxT: 0, pyT: 0,
      tagN: tagN, tagU: tagU, lastSpeak: { npc: 0, user: 0 }
    };
    instances[stageId] = inst;

    // NPC 椅位绑定
    var npcChair = null, userChair = null;
    scene.traverse(function (o) {
      if (o.isGroup && o.userData && o.userData.seatY) {
        if (!npcChair && Math.abs(o.position.z - ecfg.npcSeat.z) < 0.1 && Math.abs(o.position.x - ecfg.npcSeat.x) < 0.1) npcChair = o;
        else if (!userChair && Math.abs(o.position.z - ecfg.userSeat.z) < 0.1 && Math.abs(o.position.x - ecfg.userSeat.x) < 0.1) userChair = o;
      }
    });
    ecfg.npcSeat.chair = npcChair;
    ecfg.userSeat.chair = userChair;

    // 角色：NPC（提前到 → 已就座）；用户（站立入场）
    var npcStart = ecfg.npcSeated && npcChair
      ? { x: ecfg.npcSeat.x, z: ecfg.npcSeat.z }
      : { x: ecfg.npcPos.x, z: ecfg.npcPos.z };
    var userStartSeated = !!ecfg.userSeated && !!userChair;
    var userStart = userStartSeated
      ? { x: ecfg.userSeat.x, z: ecfg.userSeat.z }
      : { x: ecfg.userPos.x, z: ecfg.userPos.z };

    inst.npc = mkActor(inst, 'npc', npcImg, ecfg.npcSeat, npcStart, ecfg.npcSeated && !!npcChair);
    inst.user = mkActor(inst, 'user', userImg, ecfg.userSeat, userStart, userStartSeated);
    // 初始朝向：就座者已面向桌（椅向）；站立者面向对方（礼仪：入场注视对方）
    if (inst.npc.state !== 'sit') {
      inst.npc.group.rotation.y = Math.atan2(userStart.x - npcStart.x, userStart.z - npcStart.z);
    }
    if (inst.user.state !== 'sit') {
      inst.user.group.rotation.y = Math.atan2(npcStart.x - userStart.x, npcStart.z - userStart.z);
    }

    /* 锚点：世界坐标 → 舞台像素 */
    var v3 = new THREE.Vector3();
    function projectTo(obj, outY, out) {
      v3.set(obj.position.x, outY, obj.position.z).project(camera);
      out.x = (v3.x + 1) / 2 * W;
      out.y = (1 - v3.y) / 2 * H;
    }

    function updateAnchors() {
      if (inst.disposed) return;
      var cw = stage.clientWidth, ch = stage.clientHeight;
      if (cw && (cw !== W || ch !== H)) {
        W = cw; H = ch;
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
      }
      var W2 = W, H2 = H;
      function headOf(a) {
        return (a.rootY || 0) + HEAD_TOP;
      }
      inst.anchors = inst.anchors || { npc: {}, user: {}, npcChest: {}, userChest: {} };
      projectTo(inst.npc.group, headOf(inst.npc) - 0.05, inst.anchors.npc);
      projectTo(inst.user.group, headOf(inst.user) - 0.05, inst.anchors.user);
      projectTo(inst.npc.group, headOf(inst.npc) * 0.62, inst.anchors.npcChest);
      projectTo(inst.user.group, headOf(inst.user) * 0.62, inst.anchors.userChest);
      inst.tagN.style.left = inst.anchors.npcChest.x + 'px';
      inst.tagN.style.top = inst.anchors.npcChest.y + 'px';
      inst.tagU.style.left = inst.anchors.userChest.x + 'px';
      inst.tagU.style.top = inst.anchors.userChest.y + 'px';
      var now = performance.now();
      if (now - inst.lastLayout > 160) {
        inst.lastLayout = now;
        if (inst.onLayout) inst.onLayout(inst.anchors);
      }
    }

    /* 镜头视差（鼠标跟随，游戏感） */
    function onMove(ev) {
      var r = stage.getBoundingClientRect();
      if (!r.width) return;
      inst.pxT = ((ev.clientX - r.left) / r.width - 0.5) * 0.34;
      inst.pyT = -((ev.clientY - r.top) / r.height - 0.5) * 0.16;
    }
    stage.addEventListener('pointermove', onMove);

    /* 渲染循环 */
    var clock = new THREE.Clock();
    function frame() {
      if (inst.disposed) return;
      inst.raf = requestAnimationFrame(frame);
      var dt = Math.min(clock.getDelta(), 0.05);

      // 补间推进
      for (var i = inst.tweens.length - 1; i >= 0; i--) {
        var tw = inst.tweens[i];
        tw.t += dt;
        var k = clamp01(tw.t / tw.dur);
        try { tw.fn(k); } catch (e) {
          if (!inst._twErr) { inst._twErr = 1; console.error('GS3D tween error:', e.message, e.stack ? String(e.stack).split('\n')[1] : ''); }
        }
        if (k >= 1) {
          inst.tweens.splice(i, 1);
          if (tw.done) { try { tw.done(); } catch (e) { if (!inst._twErr) { inst._twErr = 1; console.error('GS3D tween done error:', e.message); } } }
        }
      }

      // 真人对视（礼仪核心）：头 60% 先行、躯干缓慢跟随、大角度整体转身；
      // 复刻"先转头、后转身"的注视动线；说话伴随点头；全程注视对方
      var now = performance.now();
      var tSec = now / 1000;
      [['npc', inst.npc], ['user', inst.user]].forEach(function (p) {
        var a = p[1];
        if (!a || !a.j) return;
        var on = now < inst.lastSpeak[p[0]];
        if (a.busy) return;
        var other = p[0] === 'user' ? inst.npc : inst.user;
        var dyaw = 0;
        if (other) {
          dyaw = wrapAngle(Math.atan2(other.group.position.x - a.group.position.x, other.group.position.z - a.group.position.z) - a.group.rotation.y);
        }
        var wantHead = Math.max(-0.62, Math.min(0.62, dyaw));
        var wantTorso = Math.max(-0.3, Math.min(0.3, dyaw * 0.35));
        a.j.headG.rotation.y += (wantHead - a.j.headG.rotation.y) * 0.14;
        a.j.torsoG.rotation.y += (wantTorso - a.j.torsoG.rotation.y) * 0.05;
        if (a.state !== 'sit' && other && Math.abs(dyaw) > 0.75) {
          a.group.rotation.y = lerpAngle(a.group.rotation.y, a.group.rotation.y + dyaw, 0.012);
        }
        var breath = Math.sin(tSec * 1.3 + (p[0] === 'npc' ? 0 : 1.7)) * 0.012;
        a.j.torsoG.rotation.x = (a.state === 'sit' ? 0.05 : 0) + breath + (on ? Math.sin(tSec * 5.1) * 0.018 : 0);
        a.j.headG.rotation.x = on ? Math.sin(tSec * 5.1 + 1.1) * 0.05 : a.j.headG.rotation.x * 0.92;
      });

      // 视差
      inst.px += (inst.pxT - inst.px) * 0.06;
      inst.py += (inst.pyT - inst.py) * 0.06;
      camera.position.x = ecfg.cam[0] + inst.px;
      camera.position.y = ecfg.cam[1] + inst.py;
      camera.lookAt(new THREE.Vector3(ecfg.look[0], ecfg.look[1], ecfg.look[2]));

      updateAnchors();
      renderer.render(scene, camera);
    }
    frame();

    if (window.ResizeObserver) {
      inst.ro = new ResizeObserver(updateAnchors);
      inst.ro.observe(stage);
    }
    inst.cleanup = function () { stage.removeEventListener('pointermove', onMove); };
    setTimeout(updateAnchors, 80);
    return true;
  }

  /* ---------- 卸载 ---------- */
  function dispose(stageId) {
    var inst = instances[stageId];
    if (!inst) return;
    inst.disposed = true;
    if (inst.raf) cancelAnimationFrame(inst.raf);
    if (inst.ro) inst.ro.disconnect();
    if (inst.cleanup) inst.cleanup();
    if (inst.renderer) {
      inst.renderer.dispose();
      if (inst.renderer.domElement && inst.renderer.domElement.parentNode) {
        inst.renderer.domElement.parentNode.removeChild(inst.renderer.domElement);
      }
    }
    [inst.tagN, inst.tagU].forEach(function (el) { if (el && el.parentNode) el.parentNode.removeChild(el); });
    inst.stage.classList.remove('is-photo');
    inst.stage.style.background = '';
    var layer = inst.stage.querySelector('.challenge-stage-bubble-layer');
    if (layer) {
      layer.classList.remove('anchored');
      Array.prototype.forEach.call(layer.children, function (b) {
        b.style.left = b.style.top = b.style.transform = b.style.opacity = '';
      });
    }
    delete instances[stageId];
  }

  function getAnchors(stageId) {
    var inst = instances[stageId];
    return inst ? inst.anchors : null;
  }

  function setSpeaking(stageId, who) {
    var inst = instances[stageId];
    if (!inst) return;
    inst.lastSpeak[who === 'user' ? 'user' : 'npc'] = performance.now() + 2600;
  }

  function setAction(stageId, who, action) {
    var inst = instances[stageId];
    if (!inst) return;
    var actor = who === 'user' ? inst.user : inst.npc;
    if (!actor) return;
    runAction(inst, actor, action);
  }

  /* ---------- 对话阶段状态机 ---------- */
  function setPhase(stageId, phase) {
    var inst = instances[stageId];
    if (!inst) return;
    inst.phase = phase;
    if (phase === 'greet' && inst.npc) runAction(inst, inst.npc, 'greet');
  }

  /* ---------- 调试探针（验证脚本用：朝向/关节角/手部世界坐标） ---------- */
  var _dbgV = new THREE.Vector3();
  function debugInfo(stageId) {
    var inst = instances[stageId];
    if (!inst) return null;
    function actorInfo(a) {
      if (!a) return null;
      a.group.updateMatrixWorld(true);
      function jrot(n) {
        var j = a.j[n];
        return j ? [+j.rotation.x.toFixed(4), +j.rotation.y.toFixed(4), +j.rotation.z.toFixed(4)] : null;
      }
      function wpos(n, localY) {
        var j = a.j[n];
        if (!j) return null;
        if (localY) { _dbgV.set(0, localY, 0); j.localToWorld(_dbgV); }
        else j.getWorldPosition(_dbgV);
        return [+_dbgV.x.toFixed(3), +_dbgV.y.toFixed(3), +_dbgV.z.toFixed(3)];
      }
      return {
        pos: [+a.group.position.x.toFixed(3), +a.group.position.z.toFixed(3)],
        yaw: +a.group.rotation.y.toFixed(3),
        state: a.state, busy: !!a.busy,
        torsoGx: jrot('torsoG')[0], headGy: jrot('headG')[1],
        elbowR: jrot('elR') ? jrot('elR')[0] : null,
        handR: wpos('elR', -0.3), handL: wpos('elL', -0.3), shoulderR: wpos('shR')
      };
    }
    return { phase: inst.phase || 'talk', npc: actorInfo(inst.npc), user: actorInfo(inst.user) };
  }

  window.GameStage3D = { supported: true, mount: mount, dispose: dispose, getAnchors: getAnchors, setSpeaking: setSpeaking, setAction: setAction, setPhase: setPhase, debugInfo: debugInfo };
}

_GS3D_init();
