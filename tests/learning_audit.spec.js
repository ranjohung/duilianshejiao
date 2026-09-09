const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8000/index.html';

async function loginDemo(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /演示账号登录/ }).click();
  const onboarding = page.locator('#modal-onboarding');
  if (await onboarding.isVisible().catch(() => false)) {
    await onboarding.getByRole('button', { name: '开始训练' }).click();
  }
  const selection = page.locator('#initial-selection-dialog');
  if (await selection.isVisible().catch(() => false)) {
    await selection.getByRole('button', { name: /相亲模拟/ }).click();
    await page.locator('#initial-selection-confirm-dialog').getByRole('button', { name: '确认选择' }).click();
    const success = page.locator('#initial-selection-success-dialog');
    if (await success.isVisible().catch(() => false)) {
      await success.getByRole('button', { name: '稍后再练' }).click();
    }
  }
}

test('学习者视角：主导航和训练子模块均可进入且有明确反馈', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await loginDemo(page);

  const tabs = ['home', 'coach', 'training', 'growth', 'profile'];
  for (const tab of tabs) {
    await page.evaluate(tabName => switchTab(tabName), tab);
    await expect(page.locator(`.page.active#page-${tab}`)).toBeVisible();
    const content = await page.locator(`.page.active#page-${tab}`).innerText();
    expect(content.trim().length, `${tab} 页面不应是空白`).toBeGreaterThan(20);
  }

  await page.evaluate(() => switchTab('training'));
  await expect(page.getByText(/好感度负向扣减与场景折扣当前为 Web 原型预览/)).toBeVisible();
  const modules = [
    ['market', '#training-market-module'],
    ['custom', '#training-custom-module'],
  ];
  for (const [moduleName, selector] of modules) {
    await page.evaluate(name => showTrainingModule(name), moduleName);
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator('#training-module-hub')).toBeHidden();
  }
  await page.evaluate(() => showTrainingModule('market'));
  await expect(page.getByText(/好感度扣减\/折扣：原型预览·未上线/)).toBeVisible();
  await page.evaluate(() => showMoreScenes());
  await expect(page.locator('#modal-more-scenes')).toBeVisible();
  await expect(page.locator('#scene-category-list')).not.toBeEmpty();
  await page.evaluate(() => showCategoryScenes('亲密关系与约会'));
  await expect(page.locator('#scene-detail-list')).not.toBeEmpty();
  await page.evaluate(() => closeModal('more-scenes'));
  const datingCard = page.locator('#template-scene-list > div').filter({ hasText: '相亲模拟' }).first();
  await datingCard.getByRole('button', { name: '开始训练' }).click();
  await expect(page.locator('#modal-prepare:visible, #modal-training:visible').first()).toBeVisible();
  await page.evaluate(() => document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; }));
  await page.evaluate(() => showTrainingModule('hub'));
  await expect(page.getByRole('button', { name: /社交礼仪训练/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /语音训练/ })).toBeVisible();

  // 训练中心的真实挑战和作业入口必须打开实际内容，而不是只停留在卡片层。
  await page.evaluate(() => showChallenge());
  await expect(page.locator('#modal-challenge')).toBeVisible();
  await page.evaluate(() => closeModal('challenge'));
  await page.evaluate(() => showHomework());
  await expect(page.locator('#modal-homework')).toBeVisible();
  await expect(page.locator('#homework-content')).not.toBeEmpty();
  await page.evaluate(() => closeModal('homework'));

  await page.getByRole('button', { name: /社交礼仪训练/ }).click();
  await expect(page.locator('#modal-etiquette')).toBeVisible();
  await expect(page.locator('#etiquette-level-list')).toContainText('咖啡厅的邂逅');
  await page.evaluate(() => closeModal('etiquette'));

  expect(pageErrors, '主导航或训练子模块出现 JS 异常').toEqual([]);
});

test('学习者视角：成长与我的页入口不产生空白或无响应', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await loginDemo(page);

  await page.evaluate(() => switchTab('growth'));
  const growthActions = ['showCBT', 'showNVC', 'showSkillProgress', 'showLeaderboard', 'showEvolution', 'showDiary', 'showMilestone', 'showHomework'];
  for (const action of growthActions) {
    await page.evaluate(name => {
      document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; });
      window[name]();
    }, action);
    const visibleModal = page.locator('.modal-overlay:visible').last();
    await expect(visibleModal, `${action} 未打开可见内容`).toBeVisible();
    await page.evaluate(() => document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; }));
  }

  await page.evaluate(() => switchTab('profile'));
  const profileActions = ['signin', 'editprofile', 'member', 'props', 'invite', 'realname', 'privacy', 'antiaddiction', 'beauty-settings'];
  for (const modalName of profileActions) {
    await page.evaluate(name => {
      document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; });
      showModal(name);
    }, modalName);
    const visibleModal = page.locator('.modal-overlay:visible').last();
    await expect(visibleModal, `${modalName} 未打开可见内容`).toBeVisible();
    await page.evaluate(() => document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; }));
  }

  for (const action of ['showCustomerService', 'showNotificationSettings', 'showDeviceManagement']) {
    await page.evaluate(name => {
      document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; });
      window[name]();
    }, action);
    const visibleModal = page.locator('.modal-overlay:visible').last();
    await expect(visibleModal, `${action} 未打开可见内容`).toBeVisible();
    await page.evaluate(() => document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; }));
  }

  expect(pageErrors, '成长/我的入口出现 JS 异常').toEqual([]);
});

test('学习者视角：切换账号不会继承上一账号的训练资产', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const state = await page.evaluate(() => {
    performLocalLogin('13800138001', '甲用户', 0, '青铜学员');
    document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; });
    userData.hasSeenOnboarding = true;
    userData.hasSelectedInitial = true;
    trainingScenes[0].unlocked = true;
    customScenes.push({ id: 99001, name: '甲的场景', unlocked: true, rounds: [] });
    timeRewindTickets = 0;
    userData.lifetimePoints = 250;
    saveData();

    performLocalLogin('13800138002', '乙用户', 0, '青铜学员');
    return {
      unlocked: trainingScenes.filter(scene => scene.unlocked).length,
      customCount: customScenes.length,
      tickets: timeRewindTickets,
      levelStatus: getSceneUnlockStatus(trainingScenes.find(scene => scene.id === 7))
    };
  });

  expect(state.unlocked, '新账号不应继承旧账号解锁场景').toBe(0);
  expect(state.customCount, '新账号不应继承旧账号自定义场景').toBe(0);
  expect(state.tickets, '新账号应使用独立道具库存').toBe(3);
  expect(state.levelStatus).toBe('level');
});

test('真实挑战：凭证待审核时不重复开始或发放本地奖励', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    userData = { ...userData, phone: 'challenge-evidence-audit', points: 123, lifetimePoints: 123, challengeEvidence: {}, completedChallengeIds: [] };
    window.alert = () => {};
    loadMockChallenges(false);
    const challenge = challenges[0];
    window.currentChallengeId = challenge.id;
    window.challengeScore = 8;

    showChallengeResult();
    const checkinOpened = $('modal-challenge-checkin').style.display !== 'none';
    userData.challengeEvidence[challenge.id] = { text: '已完成现实行动复盘'.repeat(20), attachment: null, status: 'local_demo_pending_review' };
    document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; });
    renderChallenges(true);
    const listText = $('modal-challenge-list').innerText;
    const pointsBefore = userData.points;
    startChallenge(challenge.id);
    showChallengeResult();
    return { checkinOpened, pendingVisible: listText.includes('凭证待审核'), pointsUnchanged: userData.points === pointsBefore };
  });

  expect(result).toEqual({ checkinOpened: true, pendingVisible: true, pointsUnchanged: true });
});

test('学习卡片：原始课程已接入并可检索', async ({ page }) => {
  await loginDemo(page);
  await page.evaluate(() => switchTab('training'));
  await page.evaluate(() => showTrainingModule('cards'));
  await expect(page.locator('#training-card-module')).toBeVisible();
  await expect(page.locator('#training-card-total')).toHaveText('1024');
  const search = page.locator('#training-card-search');
  await search.fill('表情动作');
  await expect(page.locator('#training-card-result-count')).toContainText('显示 2 / 2');
  await expect(page.locator('#training-card-list')).toContainText('做错“表情动作”，说得再好也不讨喜');
});