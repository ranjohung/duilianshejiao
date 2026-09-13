/* 真实 UI 验证：9001 咖啡厅的邂逅（全身像 + 对视） */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 420, height: 820 } })).newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('file://' + path.resolve('index.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.addStyleTag({ content: '*{backdrop-filter:none!important}' });
  await p.waitForTimeout(1600);
  // v2.5 会员门禁：测试直接置有效月卡（EM_isPro 读 userData.member + 有效期）
  await p.evaluate(() => {
    if (typeof userData !== 'undefined') {
      userData.member = 'monthly';
      userData.membershipExpiresAt = new Date(Date.now() + 365 * 864e5).toISOString();
    }
  });
  await p.evaluate(() => { window.startEtiquetteLevel && startEtiquetteLevel(9001); });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: 'test_screenshots/fb_ui_9001.png' });
  // 跟做「坐下」动作
  await p.evaluate(() => { window.postAction && postAction('etiquette', '坐下'); });
  await p.waitForTimeout(3200);
  await p.screenshot({ path: 'test_screenshots/fb_ui_9001_sit.png' });
  await b.close();
  console.log('UI shots done');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
