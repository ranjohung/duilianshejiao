/* GLB 写实绑定后端验证：加载/绑定/归一化/同步语义/段长/IK 视觉契合 + 截图
 * 走本地 HTTP（fetch 规范禁止 file://，生产 Pages 同为 http） */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.css': 'text/css', '.md': 'text/markdown', '.onnx': 'application/octet-stream' };

function serve(cb) {
  const srv = http.createServer((req, res) => {
    let fp = decodeURIComponent(req.url.split('?')[0]);
    if (fp.endsWith('/')) fp += 'index.html';
    const abs = path.join(ROOT, fp);
    if (!abs.startsWith(ROOT) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(abs).pipe(res);
  });
  srv.listen(0, '127.0.0.1', () => cb(srv.address().port, () => srv.close()));
}

function r2(v) { return (typeof v === 'number' ? v : 0).toFixed(3); }

(async () => {
  serve((port, done) => run(port, done).catch(e => { console.error('HARNESS FAIL', e); process.exit(1); }));
})();

async function run(port, done) {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 480, height: 400 } })).newPage();
  const glbErrs = [];
  p.on('pageerror', e => { glbErrs.push(e.message); console.log('PAGEERROR', e.message.slice(0, 160)); });
  p.on('console', m => { if (m.type() !== 'debug') console.log('[console]', m.text().slice(0, 220)); });
  await p.goto('http://127.0.0.1:' + port + '/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => !!(window.GameStage3D && window.GameStage3D.supported && window.GameStage3D.mount), null, { timeout: 15000 });
  await p.addStyleTag({ content: '*{backdrop-filter:none!important}' });

  let fails = 0;
  const ok = (name, cond, detail) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' | ' + detail : '')); if (!cond) fails++; };

  // 挂载办公室场景（用户 Ch14 西装 + NPC·王 BigVegas 休闲）
  await p.evaluate(() => {
    const st = document.createElement('div');
    st.id = 'gs3d-glb';
    st.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:400px;z-index:99999;background:#222';
    document.body.appendChild(st);
    window.GameStage3D.mount('gs3d-glb', {
      env: 'office',
      npc: { image: 'assets/images/chars/npc-wang.png', label: 'NPC·王' },
      user: { image: 'assets/images/chars/user.png', label: '我' }
    });
  });

  // 1) 等待双方 GLB 绑定完成
  const bound = await p.waitForFunction(() => {
    const g = window.GameStage3D.glbDebug && window.GameStage3D.glbDebug('gs3d-glb');
    return !!(g && g.npc && g.npc.glb && g.user && g.user.glb);
  }, null, { timeout: 30000 }).then(() => true).catch(() => false);
  ok('GLB绑定(双方)', bound);
  if (!bound) { console.log('绑定失败，终止'); await b.close(); process.exit(1); }

  const g0 = await p.evaluate(() => window.GameStage3D.glbDebug('gs3d-glb'));
  ok('胶囊隐退', !g0.npc.capsuleVisible && !g0.user.capsuleVisible);
  ok('映射完整14关节', g0.npc.mapLen === 14 && g0.user.mapLen === 14, `npc=${g0.npc.mapLen} user=${g0.user.mapLen}`);

  // 2) 入场沉淀：等双方腿骨静止（入场走位/入座/问候完成后才发动作，避免冻结中间帧）
  await p.waitForFunction(() => {
    const g = window.GameStage3D.glbDebug && window.GameStage3D.glbDebug('gs3d-glb');
    if (!g || !g.npc || !g.user || !g.npc.bones || !g.user.bones) return false;
    const k = (a) => a.bones.ankL[1].toFixed(2) + '|' + a.bones.hipL[1].toFixed(2) + '|' + a.bones.shL[1].toFixed(2);
    const key = k(g.npc) + '&' + k(g.user);
    if (window.__settleKey === key) return true;
    window.__settleKey = key; return false;
  }, null, { timeout: 30000 }).catch(() => console.log('WARN: 入场未静止（超时），按当前状态继续'));
  await p.waitForTimeout(500);

  // 2b) office 入场坐姿回归：GLB 须跟随 rootY 下沉（髋上椅面+脚踝近地）且 mesh 锚定在 NPC 席位
  const gs = await p.evaluate(() => ({
    d: window.GameStage3D.debugInfo('gs3d-glb'),
    g: window.GameStage3D.glbDebug('gs3d-glb')
  }));
  ok('NPC入场入座', gs.d.npc.state === 'sit', `state=${gs.d.npc.state} pos=${JSON.stringify(gs.d.npc.pos)}`);
  if (gs.d.npc.state === 'sit') {
    const hb = gs.g.npc.bones.hipL, ab = gs.g.npc.bones.ankL;
    ok('NPC坐姿髋上椅面', hb[1] > 0.40 && hb[1] < 0.56, `hipY=${r2(hb[1])} (seat 0.47+0.02)`);
    ok('NPC坐姿脚近地', ab[1] > -0.12 && ab[1] < 0.15, `ankY=${r2(ab[1])}`);
    const mz = (gs.g.npc.bboxMin[2] + gs.g.npc.bboxMax[2]) / 2;
    ok('NPC坐姿mesh在席位', Math.abs(mz - gs.d.npc.pos[1]) < 0.45, `meshZ=${r2(mz)} engZ=${r2(gs.d.npc.pos[1])} (坐姿腿前伸+0.24 内)`);
  }

  // 动作序列先行（握手编排会按需起身走位 —— 数值断言全部押后到站立终态）
  // 鞠躬 30°（GLB 躯干/头部跟随引擎欧拉）
  await p.evaluate(() => window.GameStage3D.setAction('gs3d-glb', 'user', 'bow30'));
  await p.waitForTimeout(1800);
  await p.screenshot({ path: 'test_screenshots/glb_bow30.png' });

  // 握手：引擎 IK 触达 + GLB 视觉接触（截图人工核 + 手部世界距）
  await p.waitForTimeout(2400);
  await p.evaluate(() => {
    window.__hs = { min: 9 };
    window.__hsIv = setInterval(() => {
      const d = window.GameStage3D.debugInfo('gs3d-glb');
      if (!d || !d.user || !d.npc || !d.user.handR || !d.npc.handR) return;
      const a = d.user.handR, c = d.npc.handR;
      const dist = Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);
      if (dist < window.__hs.min) window.__hs.min = dist;
    }, 80);
    window.GameStage3D.setAction('gs3d-glb', 'user', 'handshake');
  });
  await p.waitForTimeout(7000);
  const hs = await p.evaluate(() => { clearInterval(window.__hsIv); return window.__hs; });
  ok('握手引擎IK触达≤0.06', hs.min <= 0.06, `minGap=${r2(hs.min)}`);
  await p.screenshot({ path: 'test_screenshots/glb_handshake.png' });

  // 挥手 + 走步（行走腿部摆动经 GLB 呈现）
  await p.evaluate(() => window.GameStage3D.setAction('gs3d-glb', 'npc', 'wave'));
  await p.waitForTimeout(900);
  await p.screenshot({ path: 'test_screenshots/glb_wave.png' });
  await p.evaluate(() => window.GameStage3D.setAction('gs3d-glb', 'user', 'step'));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: 'test_screenshots/glb_walk.png' });

  // 3) 站立终态数值断言（腿骨两帧一致 = 静止；呼吸微动不影响 0.01 精度）
  await p.waitForFunction(() => {
    const g = window.GameStage3D.glbDebug && window.GameStage3D.glbDebug('gs3d-glb');
    if (!g || !g.npc || !g.user || !g.npc.bones || !g.user.bones) return false;
    const k = (a) => a.bones.ankL[1].toFixed(2) + '|' + a.bones.hipL[1].toFixed(2) + '|' + a.bones.shL[1].toFixed(2);
    const key = k(g.npc) + '&' + k(g.user);
    if (window.__boneKey === key) return true;
    window.__boneKey = key; return false;
  }, null, { timeout: 30000 }).catch(() => console.log('WARN: 骨骼未静止（超时），按当前状态断言'));
  await p.waitForTimeout(400);

  // 3b) 归一化：身高≈1.66m、落地≈0、mesh 锚定引擎组位（站立终态，规避绑定/动画/坐姿竞态）
  const g1 = await p.evaluate(() => ({
    g: window.GameStage3D.glbDebug('gs3d-glb'),
    d: window.GameStage3D.debugInfo('gs3d-glb')
  }));
  for (const who of ['npc', 'user']) {
    const h = g1.g[who].bboxMax[1] - g1.g[who].bboxMin[1];
    ok(`${who} 身高≈1.66`, Math.abs(h - 1.66) < 0.12, `h=${r2(h)} yMin=${r2(g1.g[who].bboxMin[1])}`);
    ok(`${who} 落地`, Math.abs(g1.g[who].bboxMin[1]) < 0.08, `yMin=${r2(g1.g[who].bboxMin[1])}`);
    // mesh 锚定回归：skinnedBBox xz 中心 ≈ 引擎组位（防「对中吃掉 group 平移」回归）
    const cx = (g1.g[who].bboxMin[0] + g1.g[who].bboxMax[0]) / 2, cz = (g1.g[who].bboxMin[2] + g1.g[who].bboxMax[2]) / 2;
    ok(`${who} mesh锚定组位`, Math.abs(cx - g1.d[who].pos[0]) < 0.12 && Math.abs(cz - g1.d[who].pos[1]) < 0.15,
      `mesh=(${r2(cx)},${r2(cz)}) eng=(${r2(g1.d[who].pos[0])},${r2(g1.d[who].pos[1])})`);
  }

  // 3c) 同步语义：站立位双臂竖直下垂 + 段长（臂=0.27 固定；小腿=0.42，大腿自洽保自然髋高）
  for (const who of ['npc', 'user']) {
    const b = g1.g[who].bones;
    const hipH = g1.g[who].hipH || 0.93;
    for (const side of ['L', 'R']) {
      const sh = b['sh' + side], el = b['el' + side];
      if (!sh || !el) { ok(`${who} 臂${side}骨存在`, false); continue; }
      const dx = el[0] - sh[0], dy = el[1] - sh[1], dz = el[2] - sh[2];
      const len = Math.hypot(dx, dy, dz);
      const hang = -dy / len; // 越接近1越竖直下垂
      ok(`${who} 上臂${side}下垂`, hang > 0.9, `hang=${r2(hang)} len=${r2(len)}`);
      ok(`${who} 上臂${side}段长≈0.27`, Math.abs(len - 0.27) < 0.02, `len=${r2(len)}`);
    }
    const hip = b['hipL'], knee = b['kneeL'], ank = b['ankL'];
    if (hip && knee && ank) {
      const thigh = Math.hypot(knee[0] - hip[0], knee[1] - hip[1], knee[2] - hip[2]);
      const shin = Math.hypot(ank[0] - knee[0], ank[1] - knee[1], ank[2] - knee[2]);
      ok(`${who} 小腿段长≈0.42`, Math.abs(shin - 0.42) < 0.025, `shin=${r2(shin)} hipH=${hipH}`);
      ok(`${who} 腿段自洽(髋=踝+大腿+小腿)`, Math.abs(thigh - (hipH - shin - ank[1])) < 0.03, `thigh=${r2(thigh)} hipH=${hipH} ankY=${r2(ank[1])}`);
    }
  }
  await p.screenshot({ path: 'test_screenshots/glb_stand.png' });

  console.log(glbErrs.length ? 'PAGEERRORS: ' + glbErrs.length : 'no page errors');
  const g2 = await p.evaluate(() => window.GameStage3D.glbDebug('gs3d-glb'));
  console.log('NPC-DUMP', JSON.stringify(g2.npc));
  console.log('USER-DUMP', JSON.stringify(g2.user));
  console.log(fails === 0 ? 'ALL PASS' : `FAILED: ${fails}`);
  await b.close();
  done();
  process.exit(fails === 0 ? 0 : 1);
}
