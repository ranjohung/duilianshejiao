// 一次性验证：测试账号登录 → 最高会员权益全量生效
const { chromium } = require('playwright');
const path = require('path');

const testPassword = process.env.DUILIAN_TEST_PASSWORD;
if (!testPassword) throw new Error('请先设置 DUILIAN_TEST_PASSWORD（变量名去掉空格）环境变量后再运行');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('file:///' + path.resolve(__dirname, '..').replace(/\\/g, '/') + '/index.html');
  await page.waitForTimeout(1500);

  // 走真实 UI：点演示账号按钮 → 填手机号 → 手动输密码 → 登录
  await page.evaluate((password) => {
    demoLogin();
    document.getElementById('login-password').value = password;
  }, testPassword);
  await page.evaluate(() => doLogin());
  await page.waitForFunction(() => {
    const k = Object.keys(localStorage).find(x => x === 'dl_user_17351455944');
    return !!k && document.getElementById('page-home');
  }, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);

  const saved = await page.evaluate(() => {
    const raw = localStorage.getItem('dl_user_17351455944');
    return raw ? JSON.parse(raw).userData : null;
  });

  const checks = [];
  const ok = (name, cond, detail) => checks.push({ name, pass: !!cond, detail });
  if (!saved) {
    ok('登录落库', false, 'localStorage 无 dl_user_17351455944');
  } else {
    ok('登录落库', true, saved.nickname);
    ok('pro 会员档位', saved.memberTier === 'pro', saved.memberTier);
    ok('会员有效期 1 年', saved.memberTierExpiresAt && (new Date(saved.memberTierExpiresAt) - Date.now()) > 300 * 86400000, saved.memberTierExpiresAt);
    ok('旧档 member=yearly', saved.member === 'yearly', saved.member);
    ok('金币 99999', saved.coins === 99999, saved.coins);
    ok('积分 99999', saved.points === 99999, saved.points);
    ok('测试账号标记', saved.isTestAccount === true, '');
    ok('已实名', saved.realNameVerified === true, saved.realNameInfo ? saved.realNameInfo.name : '');
  }

  // 运行时权益判定（页内导出函数）
  const runtime = await page.evaluate(() => {
    const out = {};
    try { out.isPro = !!EM_isPro(); } catch (e) { out.isPro = 'ERR:' + e.message; }
    try { out.paid = !!hasPaidMembership(); } catch (e) { out.paid = 'ERR:' + e.message; }
    try { out.scenesUnlocked = trainingScenes.filter(s => s.unlocked).length + '/' + trainingScenes.length; } catch (e) { out.scenesUnlocked = 'ERR:' + e.message; }
    try { out.canAiReview = !!EM_canAiReview(); } catch (e) { out.canAiReview = 'ERR:' + e.message; }
    try { out.canSource = !!EM_canAccessSource(); } catch (e) { out.canSource = 'ERR:' + e.message; }
    return out;
  });
  ok('EM_isPro', runtime.isPro === true, String(runtime.isPro));
  ok('hasPaidMembership', runtime.paid === true, String(runtime.paid));
  ok('全场景解锁', /^(\d+)\/\1$/.test(runtime.scenesUnlocked || ''), String(runtime.scenesUnlocked));
  ok('AI 深度复盘', runtime.canAiReview === true, String(runtime.canAiReview));
  ok('Pro 资料权限', runtime.canSource === true, String(runtime.canSource));

  const pass = checks.filter(c => c.pass).length;
  checks.forEach(c => console.log((c.pass ? 'PASS' : 'FAIL') + ' | ' + c.name + ' | ' + c.detail));
  console.log('---');
  console.log(pass + '/' + checks.length + ' passed; pageerrors=' + errors.length);
  errors.slice(0, 5).forEach(e => console.log('PAGEERROR:', e.slice(0, 200)));
  await page.screenshot({ path: path.join(__dirname, '..', 'test_screenshots', 'test_account_login.png') });
  await browser.close();
  process.exit(pass === checks.length && errors.length === 0 ? 0 : 1);
})();
