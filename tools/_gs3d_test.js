/* GameStage3D 引擎验证：挂载 cafe 场景，驱动坐下/起身/鞠躬序列并截图 */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 780 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
  await page.goto(url);
  await page.waitForFunction(() => !!window.GameStage3D && GameStage3D.supported, null, { timeout: 15000 });
  await page.addStyleTag({ content: '*{backdrop-filter:none!important}' });

  // 建一个测试舞台并挂载 cafe 场景（相亲：小雅已入座，我站立）
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'gs3d-test';
    d.style.cssText = 'position:fixed;left:10px;top:60px;width:400px;height:300px;border-radius:14px;overflow:hidden;background:#141020;z-index:9999;';
    document.body.appendChild(d);
    return GameStage3D.mount('gs3d-test', {
      env: 'cafe',
      npc: { label: '小雅 · 约会对象', image: 'assets/images/chars/npc-li.png' },
      user: { label: '我 · 主角', image: 'assets/images/chars/user.png' }
    });
  });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: 'test_screenshots/gs3d_1_cafe_init.png' });

  const anchors1 = await page.evaluate(() => JSON.stringify(GameStage3D.getAnchors('gs3d-test')));
  console.log('anchors:', anchors1);

  // 坐下序列：拉开椅子 → 入座
  await page.evaluate(() => GameStage3D.setAction('gs3d-test', 'user', 'sit'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test_screenshots/gs3d_2_sit_pulling.png' });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'test_screenshots/gs3d_3_sit_done.png' });

  // 起身
  await page.evaluate(() => GameStage3D.setAction('gs3d-test', 'user', 'stand'));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_screenshots/gs3d_4_stand.png' });

  // 鞠躬
  await page.evaluate(() => GameStage3D.setAction('gs3d-test', 'user', 'bow'));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test_screenshots/gs3d_5_bow.png' });

  // 换办公室场景 + 鞠躬后坐下再点头，顺带验证 dispose/mount 复用
  const remount = await page.evaluate(() => {
    GameStage3D.dispose('gs3d-test');
    return GameStage3D.mount('gs3d-test', {
      env: 'office',
      npc: { label: '李经理', image: 'assets/images/chars/npc-wang.png' },
      user: { label: '我 · 主角', image: 'assets/images/chars/user.png' }
    });
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_screenshots/gs3d_6_office.png' });
  console.log('office remount:', remount);

  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
  if (errors.length) process.exit(2);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
