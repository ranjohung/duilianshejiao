// v2.5 经济系统专项回归（PRD §8.5 / §13.3 / §18）
// 覆盖：软硬通货钱包 / 每日积分封顶（签到20+训练10≤30）/ C档倒扣 /
//       免费3次训练+付费墙三选一 / 10币续练 / 广告1次 / 会员三档订阅 /
//       进阶场景100币双轨 / 深度复盘15币 / 课程试读+锁定+单章解锁 / AI批改 / 原始资料pro专属
const { chromium } = require('playwright');
const path = require('path');

const NO_BLUR = '*{backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}';
const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail === undefined ? '' : detail });
}

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 420, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.resolve('index.html').split(path.sep).join('/');
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.addStyleTag({ content: NO_BLUR });
  await p.waitForTimeout(1500);
  // 演示支付自动确认；alert 静音
  await p.evaluate(() => { window.confirm = () => true; window.alert = () => {}; window.showToast = (typeof showToast === 'function') ? showToast : window.showToast; });

  // ===== 0) 初始化测试账号 =====
  await p.evaluate(() => {
    userData = EM_normalizeUser(Object.assign({}, userData, { phone: 'em-regress', nickname: '经济回归' }));
    saveData();
  });

  // ===== 1) 钱包与字段规范化 =====
  const wallet = await p.evaluate(() => ({
    coins: EM_coins(),
    tier: userData.memberTier,
    hasChapters: Array.isArray(userData.unlockedChapters),
    ledger: Array.isArray(userData.coinLedger)
  }));
  check('钱包初始化 coins=0', wallet.coins === 0 && wallet.tier === 'free', JSON.stringify(wallet));
  check('经济字段规范化', wallet.hasChapters && wallet.ledger);

  // ===== 2) 每日积分封顶：签到20 + 训练10 ≤ 30（§8.5） =====
  const capFlow = await p.evaluate(() => {
    const r = {};
    r.signin = EM_grantPoints(EM.SIGNIN_POINTS, 'signin');          // 20
    r.signinAgain = EM_grantPoints(20, 'signin');                   // 签到池满 → 0
    r.trainA = EM_grantPoints(EM.TRAIN_GAIN.A, 'train');            // 10
    r.trainAgain = EM_grantPoints(5, 'train');                      // 训练池满 → 0
    r.bonusStar = EM_grantPoints(20, 'bonus');                      // 全天30满 → 0
    r.total = userData.dailyPointsGained;
    r.points = userData.points;
    // 跨天重置
    userData.dailyPointsDate = '2000-01-01';
    EM_syncDaily();
    r.afterReset = EM_grantPoints(20, 'signin');
    return r;
  });
  check('签到入账20/签到池封顶', capFlow.signin === 20 && capFlow.signinAgain === 0, JSON.stringify(capFlow));
  check('训练池≤10/全天≤30', capFlow.trainA === 10 && capFlow.trainAgain === 0 && capFlow.bonusStar === 0 && capFlow.total === 30);
  check('跨天重置恢复', capFlow.afterReset === 20);

  // ===== 3) C档倒扣：余额最低扣至0，等级进度不受影响（§8.5） =====
  const deduct = await p.evaluate(() => {
    userData.points = 100; userData.lifetimePoints = 5000;
    const a = EM_deductPoints(5, '回归测试');       // 95
    userData.points = 3;
    const b = EM_deductPoints(10, '回归测试');      // 扣至0，实际扣3
    return { a, b: (3 - b), lifetime: userData.lifetimePoints, balance: userData.points };
  });
  check('C档倒扣5分', deduct.a === 5 && deduct.b === 0, JSON.stringify(deduct));
  check('余额不为负/等级进度不减', deduct.b === 0 && deduct.lifetime === 5000 && deduct.balance === 0);

  // ===== 4) 免费3次训练 + 付费墙弹出（§8.3/§18.3） =====
  const gate1 = await p.evaluate(() => {
    userData.dailyTrainingCount = 3; userData.bonusTrains = 0;
    const ok = EM_checkTrainGate('train', null);
    const wallShown = document.getElementById('modal-paywall').style.display !== 'none';
    const wallText = document.getElementById('paywall-content').textContent || '';
    return { ok, wallShown, hasBuy: wallText.includes('10 社交币续练'), hasAd: wallText.includes('看广告'), hasMember: wallText.includes('开通会员') };
  });
  check('第4次训练被拦截并弹付费墙', !gate1.ok && gate1.wallShown, JSON.stringify({ ok: gate1.ok, wallShown: gate1.wallShown }));
  check('付费墙三选一齐全', gate1.hasBuy && gate1.hasAd && gate1.hasMember);

  // ===== 5) 10币续练 + 广告1次（§18.5） =====
  const extra = await p.evaluate(() => {
    EM_addCoins(50, '回归充值');
    EM_paywallBuyTrain();
    const afterBuy = { coins: EM_coins(), bonus: userData.bonusTrains, gate: EM_checkTrainGate('train', null) };
    EM_paywallAd();
    const afterAd = { adUsed: userData.adTrainsUsed, bonus: userData.bonusTrains };
    EM_paywallAd();   // 第二次应被拦截
    const adCapped = userData.adTrainsUsed;
    closeModal('paywall');
    return { afterBuy, afterAd, adCapped };
  });
  check('10币续练成功并放行', extra.afterBuy.coins === 40 && extra.afterBuy.bonus === 1 && extra.afterBuy.gate === true, JSON.stringify(extra.afterBuy));
  check('广告得1次且每日限1次', extra.afterAd.adUsed === 1 && extra.afterAd.bonus === 2 && extra.adCapped === 1);

  // ===== 6) 会员三档订阅（演示支付）+ 会员不限次 =====
  const member = await p.evaluate(() => {
    EM_subscribe('basic', 'monthly');
    const basic = { tier: userData.memberTier, active: EM_memberTierActive(), paid: hasPaidMembership(), pro: EM_isPro(), coins: EM_coins() };
    const countBefore = userData.dailyTrainingCount;
    EM_accountTrainStart();   // 会员不计数
    const unlimited = userData.dailyTrainingCount === countBefore;
    // 跨月场景：把月赠标记改为上月 → pro 年费订阅应再次赠 800
    userData.memberGiftMonth = '2000-01';
    EM_subscribe('pro', 'yearly');
    const pro = { tier: userData.memberTier, pro: EM_isPro(), coins: EM_coins() };
    return { basic, unlimited, pro };
  });
  check('基础会员开通+月赠300币', member.basic.tier === 'basic' && member.basic.active && member.basic.paid && member.basic.coins === 340, JSON.stringify(member.basic));
  check('会员训练不限次不计数', member.unlimited);
  check('高级会员开通+跨月赠800币+pro判定', member.pro.tier === 'pro' && member.pro.pro && member.pro.coins === 1140, JSON.stringify(member.pro));

  // ===== 7) 3D礼仪高级会员专属（§18.3） =====
  const etiquetteGate = await p.evaluate(() => {
    userData.memberTier = 'basic'; userData.memberTierExpiresAt = new Date(Date.now() + 86400000).toISOString();
    return { basicPro: EM_isPro() };
  });
  check('基础会员不等于高级权益', etiquetteGate.basicPro === false);

  // ===== 8) 场景双轨：advanced=100币（§18.3） =====
  const sceneTier = await p.evaluate(() => {
    const adv = trainingScenes.find(s => s.stage >= 2);
    const bas = trainingScenes.find(s => s.stage === 1 && !s.membershipOnly);
    userData.memberTier = 'free'; userData.memberTierExpiresAt = '';
    const advScene = Object.assign({}, adv, { unlocked: false });
    const statusRich = getSceneUnlockStatus(advScene);          // coins>=? 当前币1140 → coins
    userData.coins = 30;
    const statusPoor = getSceneUnlockStatus(advScene);          // coins-poor
    const basStatus = getSceneUnlockStatus(Object.assign({}, bas, { unlocked: false }));
    return { tier: EM_sceneTier(adv), tierBasic: EM_sceneTier(bas), statusRich, statusPoor, basStatus };
  });
  check('进阶场景 tier=advanced/基础=basic', sceneTier.tier === 'advanced' && sceneTier.tierBasic === 'basic', JSON.stringify(sceneTier));
  check('进阶场景币足coins/币不足coins-poor', sceneTier.statusRich === 'coins' && sceneTier.statusPoor === 'coins-poor');

  // ===== 9) 深度复盘 15 币 / pro 免费（§18.5） =====
  const deepReview = await p.evaluate(() => {
    const r = {};
    userData.coins = 100;
    r.basicCost = EM_spendCoins(EM.DEEP_REVIEW_COINS, '回归-深度复盘');   // basic 扣15
    r.coinsAfter = EM_coins();
    userData.memberTier = 'pro'; userData.memberTierExpiresAt = new Date(Date.now() + 86400000).toISOString();
    r.proFree = EM_isPro();
    return r;
  });
  check('深度复盘15币（非pro）', deepReview.basicCost === true && deepReview.coinsAfter === 85, JSON.stringify(deepReview));
  check('高级会员免费判定', deepReview.proFree === true);

  // ===== 10) 课程门控：试读卡/锁定卡渲染/单章解锁（§13.3） =====
  const gate = await p.evaluate(() => {
    userData.memberTier = 'free'; userData.memberTierExpiresAt = ''; userData.unlockedChapters = [];
    // 试读卡 = 每分类第1张 status:ok 卡
    const cat = (learningCards.find(c => c && c.status === 'ok') || {}).category;
    const trialCard = learningCards.find(c => c && c.category === cat && c.status === 'ok');
    const lockedCard = learningCards.find(c => c && c.category === cat && c.status === 'ok' && c.id !== trialCard.id);
    const r = {};
    r.trialOk = EM_isTrialCard(trialCard) && !EM_cardLocked(trialCard);
    r.lockedOk = !!lockedCard && EM_cardLocked(lockedCard);
    // 打开锁定卡详情，验证锁定引导渲染
    KL_openDetail(lockedCard.id);
    r.renderLocked = (document.getElementById('knowledge-detail-content').textContent || '').includes('该课程为会员内容');
    r.hasUnlockBtns = !!document.querySelector('[onclick="EM_unlockChapterByCoins(this)"]') && !!document.querySelector('[onclick="EM_unlockChapterByCash(this)"]');
    r.sourceLocked = (document.getElementById('knowledge-detail-content').textContent || '').includes('高级会员专属');
    // ¥6 现金解锁章节（confirm 已 override）
    const btn = document.querySelector('[onclick="EM_unlockChapterByCash(this)"]');
    EM_unlockChapterByCash(btn);
    r.chapterUnlocked = EM_isChapterUnlocked(lockedCard) && !EM_cardLocked(lockedCard);
    r.rerenderFree = !(document.getElementById('knowledge-detail-content').textContent || '').includes('该课程为会员内容');
    closeModal('knowledge-detail');
    return r;
  });
  check('试读卡免费可读', gate.trialOk, JSON.stringify(gate));
  check('非试读卡锁定判定', gate.lockedOk);
  check('锁定卡渲染解锁引导（VIP/200币/¥6）', gate.renderLocked && gate.hasUnlockBtns);
  check('原始资料对免费用户隐藏', gate.sourceLocked);
  check('¥6单章解锁后畅读该章节', gate.chapterUnlocked && gate.rerenderFree);

  // ===== 11) AI 批改：free 20币 / 会员免费（§13.3） =====
  const ai = await p.evaluate(() => {
    userData.coins = 50;
    userData.unlockedChapters = [];
    EM_payAiReview();   // free：扣20
    const afterFree = EM_coins();
    userData.memberTier = 'basic'; userData.memberTierExpiresAt = new Date(Date.now() + 86400000).toISOString();
    EM_payAiReview();   // 会员免费
    return { afterFree, afterMember: EM_coins() };
  });
  check('AI批改 free扣20币/会员免费', ai.afterFree === 30 && ai.afterMember === 30, JSON.stringify(ai));

  // ===== 12) 去对练次数闸门（§18.4） =====
  const jump = await p.evaluate(() => {
    userData.memberTier = 'free'; userData.memberTierExpiresAt = '';
    userData.bonusTrains = 0; userData.dailyTrainingCount = 3;
    const blocked = !EM_checkTrainGate('knowledge', null);
    const wallShown = document.getElementById('modal-paywall').style.display !== 'none';
    closeModal('paywall');
    userData.dailyTrainingCount = 1;
    const freeOk = EM_checkTrainGate('knowledge', null);
    return { blocked, wallShown, freeOk };
  });
  check('去对练次数不足触发付费墙', jump.blocked && jump.wallShown, JSON.stringify(jump));
  check('去对练次数充足放行', jump.freeOk === true);

  // ===== 13) 会员中心渲染（三档+充值包+权益表） =====
  const memberUi = await p.evaluate(() => {
    goToMember();
    const plans = document.getElementById('member-plans').textContent || '';
    const packs = document.getElementById('member-coinpacks').children.length;
    const benefits = document.getElementById('member-benefits').textContent || '';
    return {
      hasBasic: plans.includes('基础会员') && plans.includes('39'),
      hasPro: plans.includes('高级会员') && plans.includes('698'),
      packs: packs, fourPacks: packs === 4,
      benefitsOk: benefits.includes('畅读') && benefits.includes('800')
    };
  });
  check('会员中心三档阶梯渲染', memberUi.hasBasic && memberUi.hasPro, JSON.stringify(memberUi));
  check('充值包四档（60/320/750/1480）', memberUi.fourPacks);
  check('权益对比表完整', memberUi.benefitsOk);

  // ===== 输出 =====
  await p.screenshot({ path: 'test_screenshots/em_v25_member.png' });
  const failed = results.filter(r => !r.ok);
  console.log('==== v2.5 经济系统回归 ====');
  results.forEach(r => console.log((r.ok ? 'PASS' : 'FAIL') + ' | ' + r.name + (r.ok ? '' : ' | ' + r.detail)));
  console.log('----');
  console.log('通过 ' + (results.length - failed.length) + '/' + results.length);
  if (errs.length) { console.log('PAGEERRORS:'); errs.forEach(e => console.log('  ' + e)); }
  await b.close();
  process.exit(failed.length || errs.length ? 1 : 0);
})().catch(e => { console.error('REGRESS ERROR:', e); process.exit(1); });
