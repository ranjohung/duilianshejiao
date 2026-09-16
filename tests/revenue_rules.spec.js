const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8000/index.html';

test('奖励、每日额度和解锁状态遵守统一规则', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    userData = {
      ...userData,
      phone: 'rule-audit',
      member: 'free',
      points: 1950,
      lifetimePoints: 1950,
      dailyTrainingCount: 0,
      dailyTrainingDate: getDateKey(),
      hasStartedTrainingBefore: false,
    };

    const capped = addPoints(100);
    const locked = trainingScenes.find(scene => !scene.unlocked && scene.unlockPoints > 0);
    if (locked) {
      locked.unlocked = false;
      checkSceneUnlocks();
    }
    return {
      capped,
      lifetimePoints: userData.lifetimePoints,
      lockedStillLocked: locked ? !locked.unlocked : true,
      apiSuccessCodes: [
        isApiSuccess({ code: 0 }),
        isApiSuccess({ code: 200 }),
        isApiSuccess({ success: true }),
        isApiSuccess({ code: 400 }),
      ],
      productDetailChecks: (() => {
        userData.antiAddiction = { dailyTimeLimit: 0, continuousReminder: 0, usageDate: getDateKey(), dailyTrainingSeconds: 0, forcedRestUntil: 0, lastReminderAt: 0 };
        normalizeAntiAddictionState();
        setAntiAddictionSetting('dailyTimeLimit', 1);
        const savedLimit = userData.antiAddiction.dailyTimeLimit;
        renderCSFAQ();
        const faqCount = (window.customerServiceFaqs || []).length;
        filterFAQs('注销');
        const filteredFaqCount = document.querySelectorAll('#faq-list > div').length;
        return { savedLimit, faqCount, filteredFaqCount };
      })(),
      dailyCustomSceneLimit: (() => {
        const previousMember = userData.member;
        const previousExpiry = userData.membershipExpiresAt;
        userData.member = 'daily';
        userData.membershipExpiresAt = new Date(Date.now() + 86400000).toISOString();
        const limit = getCustomSceneLimit();
        userData.member = previousMember;
        userData.membershipExpiresAt = previousExpiry;
        return limit;
      })(),
    };
  });

  expect(result.capped).toBe(50);
  expect(result.lifetimePoints).toBe(2000);
  expect(result.lockedStillLocked).toBeTruthy();
  expect(result.apiSuccessCodes).toEqual([true, true, true, false]);
  expect(result.productDetailChecks.savedLimit).toBe(1);
  expect(result.productDetailChecks.faqCount).toBeGreaterThanOrEqual(30);
  expect(result.productDetailChecks.filteredFaqCount).toBeGreaterThan(0);
  expect(result.dailyCustomSceneLimit).toBe(1);
});

test('会员购买入口明确不会扣款或开通', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-phone').fill('13800138000');
  await page.locator('#login-password').fill('123456');
  await page.getByRole('button', { name: '登 录' }).click();
  await page.waitForTimeout(300);
  // 本用例只验证会员购买入口；关闭引导层，避免引导/首选场景的交互干扰会员弹窗断言。
  await page.evaluate(() => {
    const onboarding = document.getElementById('modal-onboarding');
    if (onboarding) onboarding.style.display = 'none';
    const selection = document.getElementById('initial-selection-dialog');
    if (selection) selection.remove();
    switchTab('profile');
    showModal('member');
  });
  await expect(page.locator('#modal-member')).toBeVisible();
  await expect(page.locator('#modal-member')).toContainText('支付通道尚未接入');
  await page.getByRole('button', { name: '支付接入中' }).first().click();
  await expect(page.locator('body')).toContainText('不会扣款或开通会员');
});

test('训练结算和免费资源领取具备幂等保护', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    userData = {
      ...userData,
      phone: 'rule-idempotency',
      member: 'free',
      points: 100,
      lifetimePoints: 100,
      trainingCount: 0,
      favorability: 0,
      actionSuggestions: [],
      homeworks: generateMockHomeworks(),
    };
    const scene = trainingScenes[0];
    scene.unlocked = true;
    currentTraining = scene;
    currentTraining.shuffledRounds = [...scene.rounds];
    trainingRoundIdx = currentTraining.shuffledRounds.length - 1;
    trainingChoices = currentTraining.shuffledRounds.map((_, index) => ({ round: index + 1, scoreDelta: 10, isGood: true }));
    trainingScore = 90;
    netScore = 90;
    showTrainingReport = false;
    trainingSettlementApplied = false;
    fullAnalysisUnlocked = false;
    finishTraining();
    const afterFirst = {
      points: userData.points,
      lifetimePoints: userData.lifetimePoints,
      trainingCount: userData.trainingCount,
      favorability: userData.favorability,
      diaries: diaries.length,
    };
    fullAnalysisUnlocked = true;
    finishTraining();
    const afterRerender = {
      points: userData.points,
      lifetimePoints: userData.lifetimePoints,
      trainingCount: userData.trainingCount,
      favorability: userData.favorability,
      diaries: diaries.length,
    };
    // 自定义教练属于积分消费，取消确认时不得扣除积分。
    document.getElementById('custom-coach-name').value = '确认测试教练';
    customCoachData = {
      ...customCoachData,
      style: '引导式',
      avatarSeed: 'confirm-test',
      personality: { socialEnergy: '外向', infoProcess: '直觉', decision: '理性', lifestyle: '简约' },
    };
    const coachPointsBeforeCancel = userData.points;
    const originalConfirm = window.confirm;
    window.confirm = () => false;
    createCustomCoach();
    window.confirm = originalConfirm;
    return {
      sameSettlement: JSON.stringify(afterFirst) === JSON.stringify(afterRerender),
      customFreeLimit: getCustomSceneLimit(),
      customCoachPointsUnchanged: userData.points === coachPointsBeforeCancel,
    };
  });

  expect(result.sameSettlement).toBeTruthy();
  expect(result.customFreeLimit).toBe(1);
  expect(result.customCoachPointsUnchanged).toBeTruthy();
});

test('好感度负向规则只扣明确态度问题且场景解锁折扣统一生效', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    showToast = () => {};
    userData = {
      ...userData,
      phone: 'favorability-rule-audit',
      favorability: 20,
      favorabilityPenaltyLog: [],
      lastFavorabilityPenalty: null,
      points: 1000,
      lifetimePoints: 1000,
    };
    currentTraining = { id: 1, name: '相亲模拟' };
    favorabilityBehaviorState = { sessionId: 'training:test:1', lowEffortStreak: 0, penaltyApplied: false, inappropriateApplied: false };
    currentTrainingFavorabilityPenalty = 0;
    const assetsBeforePenalty = { points: userData.points, tickets: timeRewindTickets };

    // 三次连续敷衍只触发一次-3；重新认真回答后，下一轮连续计数应归零。
    registerFavorabilityAnswer('嗯', { comment: '回答太敷衍' });
    registerFavorabilityAnswer('哦', { comment: '回答太敷衍' });
    registerFavorabilityAnswer('随便', { comment: '回答太敷衍' });
    const afterDismissive = { favorability: userData.favorability, penaltyCount: userData.favorabilityPenaltyLog.length };
    registerFavorabilityAnswer('我最近喜欢徒步，你平时喜欢什么？', { comment: '回答比较完整' });
    const afterSubstantive = favorabilityBehaviorState.lowEffortStreak;
    const safety = checkContentSafety('你个傻逼');
    const inappropriateApplied = applyFavorabilityPenalty(5, '输入不当或攻击性内容', {
      key: 'training:test:1:inappropriate',
      source: 'moderation',
      session: true,
      notify: false,
    });
    const assetsAfterPenalty = { points: userData.points, tickets: timeRewindTickets };

    const costs = [0, 20, 50, 80, 120, 180].map(value => {
      userData.favorability = value;
      return getSceneUnlockRequirement({ unlockLevel: '青铜', unlockPoints: 100, unlockTickets: 1 }).unlockPoints;
    });
    userData.favorability = 100;
    userData.favorabilityPenaltyLog = [];
    userData.lastLoginTime = Date.now() - (5 * 24 * 60 * 60 * 1000);
    const decay = syncFavorabilityOnLogin();
    return { afterDismissive, afterSubstantive, safety, inappropriateApplied, assetsBeforePenalty, assetsAfterPenalty, costs, discountTexts: [
      getSceneUnlockRequirement({ unlockLevel: '青铜', unlockPoints: 100, unlockTickets: 1 }).discountPercent
    ], decay, favorabilityAfterDecay: userData.favorability };
  });

  expect(result.afterDismissive.favorability).toBe(17);
  expect(result.afterDismissive.penaltyCount).toBe(1);
  expect(result.afterSubstantive).toBe(0);
  expect(result.safety.safe).toBeFalsy();
  expect(result.safety.category).toBe('inappropriate');
  expect(result.inappropriateApplied).toBe(5);
  expect(result.assetsAfterPenalty).toEqual(result.assetsBeforePenalty);
  expect(result.costs).toEqual([100, 90, 80, 70, 60, 50]);
  expect(result.decay).toBe(3);
  expect(result.favorabilityAfterDecay).toBe(97);
});
