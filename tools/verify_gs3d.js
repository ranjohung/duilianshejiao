/* GameStage3D v4 全量验证：9 环境对视 + greet 拍 + 鞠躬角度 + 握手 IK 触达 + 名片移交 + 新动作截图 */
const { chromium } = require('playwright');
const path = require('path');

function wrap2(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
function r2(v) { return (typeof v === 'number' ? v : 0).toFixed(3); }

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 480, height: 400 } })).newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  p.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 140)); });
  await p.goto('file://' + path.resolve('index.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => !!(window.GameStage3D && window.GameStage3D.supported && window.GameStage3D.mount), null, { timeout: 15000 });
  await p.addStyleTag({ content: '*{backdrop-filter:none!important}' });

  let fails = 0;
  const ok = (name, cond, detail) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' | ' + detail : '')); if (!cond) fails++; };

  /* 1) 九环境：greet 拍（NPC 自动 15° 鞠躬）截图 */
  const envs = ['cafe', 'restaurant', 'office', 'service', 'family', 'bar', 'wedding', 'corridor', 'community'];
  for (const env of envs) {
    await p.evaluate((e) => {
      const old = document.getElementById('gs3d-probe');
      if (old) old.remove();
      const st = document.createElement('div');
      st.id = 'gs3d-probe';
      st.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:400px;z-index:99999;background:#222';
      document.body.appendChild(st);
      window.GameStage3D.mount('gs3d-probe', { env: e, npc: { image: 'assets/images/chars/npc-wang.png', label: 'NPC·王' }, user: { image: 'assets/images/chars/user.png', label: '我' } });
    }, env);
    await p.waitForTimeout(1600); // greet 鞠躬进行中
    await p.screenshot({ path: `test_screenshots/fb_${env}.png` });
    const d = await p.evaluate(() => window.GameStage3D.debugInfo('gs3d-probe'));
    ok(`env:${env} greet拍`, d.phase === 'greet' || d.phase === 'talk', 'phase=' + d.phase);
    console.log('shot', env);
  }

  /* 2) 对视断言（greet 结束后静止态）：双方头部朝向对方 */
  await p.waitForTimeout(2600);
  {
    const d = await p.evaluate(() => {
      function wrap(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
      const di = window.GameStage3D.debugInfo('gs3d-probe');
      const dyawUser = wrap(Math.atan2(di.npc.pos[0] - di.user.pos[0], di.npc.pos[1] - di.user.pos[1]) - di.user.yaw);
      const dyawNpc = wrap(Math.atan2(di.user.pos[0] - di.npc.pos[0], di.user.pos[1] - di.npc.pos[1]) - di.npc.yaw);
      return { dyawUser, dyawNpc, headUser: di.user.headGy, headNpc: di.npc.headGy };
    });
    ok('对视:用户看NPC', Math.abs(wrap2(d.dyawUser - d.headUser)) < 0.35, `dyaw=${r2(d.dyawUser)} head=${r2(d.headUser)}`);
    ok('对视:NPC看用户', Math.abs(wrap2(d.dyawNpc - d.headNpc)) < 0.45, `dyaw=${r2(d.dyawNpc)} head=${r2(d.headNpc)}`);
    await p.screenshot({ path: 'test_screenshots/fb_act_speaking.png' });
  }

  /* 3) 鞠躬三档：峰值躯干俯角 = 名义角度 ±6% */
  for (const bow of [['bow15', 15], ['bow30', 30], ['bow45', 45]]) {
    await p.evaluate((act) => {
      window.__bow = { max: -9 };
      window.__bowIv = setInterval(() => {
        const d = window.GameStage3D.debugInfo('gs3d-probe');
        if (d && d.user && d.user.torsoGx > window.__bow.max) window.__bow.max = d.user.torsoGx;
      }, 80);
      window.GameStage3D.setAction('gs3d-probe', 'user', act);
    }, bow[0]);
    await p.waitForTimeout(4200);
    const r = await p.evaluate(() => { clearInterval(window.__bowIv); return window.__bow; });
    const want = bow[1] * Math.PI / 180;
    ok(`鞠躬${bow[1]}°角度`, Math.abs(r.max - want) <= want * 0.06, `peak=${(r.max * 180 / Math.PI).toFixed(1)}° want=${bow[1]}°`);
    if (bow[0] === 'bow30') await p.screenshot({ path: 'test_screenshots/fb_bow30.png' });
  }

  /* 4) 握手：双方右手 IK 会合，最小间距 ≤0.06m（PRD §13.2.10） */
  await p.evaluate(() => {
    window.__hs = { min: 9 };
    window.__hsIv = setInterval(() => {
      const d = window.GameStage3D.debugInfo('gs3d-probe');
      if (!d || !d.user || !d.npc || !d.user.handR || !d.npc.handR) return;
      const a = d.user.handR, c = d.npc.handR;
      const dist = Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);
      if (dist < window.__hs.min) window.__hs.min = dist;
    }, 80);
    window.GameStage3D.setAction('gs3d-probe', 'user', 'handshake');
  });
  await p.waitForTimeout(9000);
  {
    const r = await p.evaluate(() => { clearInterval(window.__hsIv); return window.__hs; });
    ok('握手IK触达', r.min <= 0.06, `minGap=${r.min.toFixed(3)}m`);
    await p.screenshot({ path: 'test_screenshots/fb_handshake.png' });
  }

  /* 5) 递名片：移交期对方承接（npc busy）+ 截图 */
  await p.evaluate(() => window.GameStage3D.setAction('gs3d-probe', 'user', 'card'));
  await p.waitForTimeout(2300);
  {
    const d = await p.evaluate(() => window.GameStage3D.debugInfo('gs3d-probe'));
    ok('递名片:对方承接', d.npc.busy, 'npcBusy=' + d.npc.busy);
    await p.screenshot({ path: 'test_screenshots/fb_card.png' });
  }
  await p.waitForTimeout(4500);

  /* 6) 新动作截图：引领 / 干杯 / 看手机 / 挥手 */
  const shots = [['lead', 3000, 'fb_lead.png'], ['toast', 2200, 'fb_toast.png'], ['phone', 1400, 'fb_phone.png'], ['wave', 1200, 'fb_wave.png']];
  for (const s of shots) {
    await p.evaluate((act) => window.GameStage3D.setAction('gs3d-probe', 'user', act), s[0]);
    await p.waitForTimeout(s[1]);
    await p.screenshot({ path: 'test_screenshots/' + s[2] });
    console.log('shot', s[2]);
    await p.waitForTimeout(1800);
  }

  /* 7) 坐下序列保持（拉椅→入座→推回） */
  await p.evaluate(() => window.GameStage3D.setAction('gs3d-probe', 'user', 'sit'));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'test_screenshots/fb_act_pulling.png' });
  await p.waitForTimeout(2600);
  await p.screenshot({ path: 'test_screenshots/fb_act_seated.png' });
  {
    const d = await p.evaluate(() => window.GameStage3D.debugInfo('gs3d-probe'));
    ok('坐下序列', d.user.state === 'sit', 'state=' + d.user.state);
  }

  await b.close();
  console.log(fails ? ('DONE WITH ' + fails + ' FAILS') : 'ALL DONE');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
