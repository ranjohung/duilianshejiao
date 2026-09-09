const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8000/index.html';
const SCREENSHOT_DIR = 'F:/开发软件项目文件/对练社交/test_screenshots';

test('训练流程测试 - 场景模板市场点击开始训练', async ({ page }) => {
  page.setViewportSize({ width: 430, height: 932 });

  // 1. Navigate to the page
  console.log('1. 打开页面...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01_initial_page.png` });
  console.log('   页面已加载');

  // 2. Login with demo account
  console.log('2. 使用演示账号登录...');
  const demoBtn = page.getByRole('button', { name: /演示账号登录/ });
  await demoBtn.waitFor({ state: 'visible', timeout: 5000 });
  await demoBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02_after_login.png` });
  console.log('   登录完成');

  // 3. Handle onboarding modal
  console.log('3. 处理新手引导弹窗...');
  const onboardingModal = page.locator('#modal-onboarding');
  if (await onboardingModal.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('   新手引导弹窗出现，关闭它...');
    const startBtn = onboardingModal.getByRole('button', { name: '开始训练' });
    await startBtn.click();
    await page.waitForTimeout(500);
  }
  const initialSelection = page.locator('#initial-selection-dialog');
  if (await initialSelection.isVisible().catch(() => false)) {
    await page.evaluate(() => selectInitialScene(4));
    await expect(page.locator('#initial-selection-confirm-dialog')).toBeVisible();
    await expect(page.locator('#initial-selection-confirm-dialog')).toContainText('唯一一次免费选择机会');
    await page.getByRole('button', { name: '确认选择' }).click();
    await expect(page.locator('#initial-selection-success-dialog')).toBeVisible();
    await expect(page.locator('#initial-selection-success-dialog')).toContainText('已免费解锁「加薪谈判」');
    await page.getByRole('button', { name: '稍后再练' }).click();
  }
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03_after_onboarding.png` });

  // 4. Click "训练" tab
  console.log('4. 点击"训练"标签...');
  const trainingTab = page.locator('.tab-item').filter({ hasText: '训练' });
  await trainingTab.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04_training_tab.png` });
  console.log('   已切换到训练页面');

  // 5. Enter the scene template market module
  console.log('5. 进入"场景模板市场"功能区...');
  await page.getByRole('button', { name: /场景模板市场/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05_after_initial_selection.png` });

  // 6. Scroll down to find "场景模板市场" section
  console.log('6. 滚动查找"场景模板市场"...');
  const templateSection = page.locator('#training-market-module');
  await templateSection.waitFor({ state: 'visible', timeout: 5000 });
  await templateSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06_template_market.png` });
  console.log('   已找到场景模板市场');

  // 7. Find "加薪谈判" template card and its "开始训练" button
  console.log('7. 查找"加薪谈判"模板卡片...');
  const templateList = page.locator('#template-scene-list');

  let targetCard;
  let startButton;

  const jiaxinCard = templateList.locator('div').filter({ hasText: '加薪谈判' }).first();

  if (await jiaxinCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('   找到"加薪谈判"卡片');
    targetCard = jiaxinCard;
    startButton = jiaxinCard.getByRole('button', { name: '开始训练' });
  } else {
    console.log('   "加薪谈判"卡片未找到，尝试找第一个可用的模板卡片...');
    const cards = templateList.locator('div.bg-white.rounded-xl');
    const cardCount = await cards.count();
    console.log(`   共找到 ${cardCount} 个模板卡片`);

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const btn = card.getByRole('button', { name: '开始训练' });
      if (await btn.isVisible().catch(() => false)) {
        targetCard = card;
        startButton = btn;
        const cardText = await card.innerText();
        console.log(`   使用卡片 ${i + 1}: ${cardText.substring(0, 50)}`);
        break;
      }
    }
  }

  if (!startButton) {
    throw new Error('找不到"开始训练"按钮');
  }

  // 8. Take screenshot before clicking
  console.log('8. 点击"开始训练"按钮...');
  await page.screenshot({ path: `${SCREENSHOT_DIR}/07_before_click.png` });

  // Scene id 4 is "加薪谈判"；首次选择完成后可直接开始
  await page.evaluate(() => {
    chooseTrainingScene(4);
  });

  // 9. Take screenshot immediately after click
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/09_immediate_after_click.png` });
  console.log('   已截图（点击后立即）');

  // 10. Wait 2 seconds and take another screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/10_after_2seconds.png` });
  console.log('   已截图（点击后2秒）');

  // 11. Analyze what modal/overlay appeared
  console.log('11. 分析出现的弹窗/覆盖层...');

  const modalTraining = page.locator('#modal-training');
  const modalPrepare = page.locator('#modal-prepare');
  const modalOnboarding = page.locator('#modal-onboarding');
  const modalVoiceTraining = page.locator('#modal-voice-training');
  const modalChallengeTraining = page.locator('#modal-challenge-training');
  const modalMoreScenes = page.locator('#modal-more-scenes');
  const modalTrainingReminder = page.locator('#modal-training-reminder');
  const initialDialogAfter = page.locator('#initial-selection-dialog');

  const results = {};

  const checks = [
    ['modal-training', modalTraining],
    ['modal-prepare', modalPrepare],
    ['modal-onboarding', modalOnboarding],
    ['modal-voice-training', modalVoiceTraining],
    ['modal-challenge-training', modalChallengeTraining],
    ['modal-more-scenes', modalMoreScenes],
    ['modal-training-reminder', modalTrainingReminder],
    ['initial-selection-dialog', initialDialogAfter],
  ];

  for (const [name, locator] of checks) {
    const visible = await locator.isVisible().catch(() => false);
    results[name] = visible;
    console.log(`   ${name}: ${visible ? '可见' : '不可见'}`);
  }

  const visibleModals = Object.entries(results)
    .filter(([_, v]) => v)
    .map(([k, _]) => k);

  if (visibleModals.length > 0) {
    console.log(`   可见的弹窗: ${visibleModals.join(', ')}`);
  } else {
    console.log('   没有发现可见的弹窗');
  }

  // 12. If training modal appeared, check its content
  if (results['modal-training']) {
    console.log('   训练弹窗已出现！检查其内容...');
    const trainingTitle = page.locator('#training-title');
    const trainingSubtitle = page.locator('#training-subtitle');

    const titleText = await trainingTitle.innerText().catch(() => '');
    const subtitleText = await trainingSubtitle.innerText().catch(() => '');
    console.log(`   训练标题: ${titleText}`);
    console.log(`   训练副标题: ${subtitleText}`);

    const messages = page.locator('#training-messages > div');
    const msgCount = await messages.count();
    console.log(`   训练消息数: ${msgCount}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/11_training_modal_detail.png` });

    console.log('   验证训练退出确认...');
    await page.getByRole('button', { name: '退出训练' }).click();
    await expect(page.locator('#training-exit-dialog')).toBeVisible();
    await expect(page.locator('#training-exit-dialog')).toContainText('本次不会获得训练积分或好感度');
    await page.getByRole('button', { name: '继续训练' }).click();
    await expect(page.locator('#training-exit-dialog')).toHaveCount(0);
  }

  // 13. If prepare modal appeared, check its content and click "直接开始训练"
  if (results['modal-prepare']) {
    console.log('   准备弹窗已出现！检查其内容...');
    const prepareTitle = page.locator('#prepare-title');
    const titleText = await prepareTitle.innerText().catch(() => '');
    console.log(`   准备标题: ${titleText}`);

    const startBtnPrepare = page.locator('#modal-prepare').getByRole('button', { name: '直接开始训练' });
    const dressBtnVisible = await startBtnPrepare.isVisible().catch(() => false);
    console.log(`   "直接开始训练"按钮: ${dressBtnVisible ? '可见' : '不可见'}`);

    if (dressBtnVisible) {
      console.log('   点击"直接开始训练"...');
      await startBtnPrepare.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/12_after_skip_dress.png` });

      const trainingVisible = await modalTraining.isVisible().catch(() => false);
      console.log(`   点击后训练弹窗: ${trainingVisible ? '可见' : '不可见'}`);
    }
  }

  // 14. Check for toast messages
  const toastLocator = page.locator('.toast, [class*="toast"], [class*="Toast"]');
  const toastCount = await toastLocator.count();
  console.log(`   Toast元素数: ${toastCount}`);

  // 15. Final analysis screenshot
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/12_final_state.png` });

  console.log('\n===== 测试完成 =====');
  console.log(`可见弹窗: ${visibleModals.length > 0 ? visibleModals.join(', ') : '无'}`);
  console.log('截图已保存到 test_screenshots/ 目录');
});

test('新注册账号提示链路完整', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: '立即注册' }).click();
  await page.locator('#reg-phone').fill('13900000001');
  await page.locator('#reg-nickname').fill('新用户测试');
  await page.locator('#reg-password').fill('123456');
  await page.locator('#reg-confirm-password').fill('123456');
  await page.locator('#agree-terms').check();
  await page.locator('#register-form').getByRole('button', { name: '注 册' }).click();

  const onboarding = page.locator('#modal-onboarding');
  await expect(onboarding).toBeVisible();
  await expect(onboarding).toContainText('欢迎来到对练社交');
  await onboarding.getByRole('button', { name: '开始训练' }).click();

  const selection = page.locator('#initial-selection-dialog');
  await expect(selection).toBeVisible();
  await selection.getByRole('button', { name: /相亲模拟/ }).click();

  const confirm = page.locator('#initial-selection-confirm-dialog');
  await expect(confirm).toBeVisible();
  await expect(confirm).toContainText('唯一一次免费选择机会');
  await confirm.getByRole('button', { name: '确认选择' }).click();

  const success = page.locator('#initial-selection-success-dialog');
  await expect(success).toBeVisible();
  await success.getByRole('button', { name: '开始训练' }).click();

  await expect(page.locator('#modal-training')).toBeVisible();
  await page.getByRole('button', { name: '退出训练' }).click();
  const exitDialog = page.locator('#training-exit-dialog');
  await expect(exitDialog).toBeVisible();
  await expect(exitDialog).toContainText('本次不会获得训练积分或好感度');
});
