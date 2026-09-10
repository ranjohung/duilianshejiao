const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8000/index.html';

test('教练素材按用途渲染且编辑资料支持上传全身照', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    performLocalLogin('coach-assets-test', '头像测试用户', 0, '青铜学员');
    document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; });
    userData.hasSeenOnboarding = true;
    userData.hasSelectedInitial = true;
    trainingScenes[0].unlocked = true;
    currentTraining = trainingScenes[0];
    currentPersonalityLabel = '😊 友好型';
    switchTab('coach');
    showCoachSelection();
  });

  const coachImages = await page.locator('#coach-select-list img').evaluateAll(images => images.map(img => img.getAttribute('src')));
  expect(coachImages).toHaveLength(4);
  expect(coachImages.every(src => src && src.includes('assets/images/coaches/coach-'))).toBeTruthy();

  await page.evaluate(() => {
    closeModal('coach-select');
    startTrainingSession();
  });
  await expect(page.locator('#training-coach-avatar').first()).toHaveAttribute('src', /assets\/images\/coaches\/coach-02\.jpg/);
  await expect(page.locator('#training-messages img').first()).toHaveAttribute('src', /assets\/images\/coaches\/coach-02\.jpg/);

  await page.evaluate(() => {
    document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; });
    showModal('editprofile');
  });
  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  await page.locator('#edit-avatar-upload').first().setInputFiles({ name: 'full-body.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.locator('#edit-avatar-preview-image').first()).toBeVisible();
  await page.getByRole('button', { name: '保存修改' }).first().click();

  const userAvatar = await page.evaluate(() => ({
    stored: typeof userData.avatarImage === 'string' && userData.avatarImage.startsWith('data:image/jpeg'),
    homeVisible: Boolean(document.querySelector('#home-avatar-btn img'))
  }));
  expect(userAvatar).toEqual({ stored: true, homeVisible: true });
  expect(pageErrors).toEqual([]);
});

test('编辑资料：真人全身头像预设可选择、预览并保存', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    performLocalLogin('user-avatar-preset-test', '真人头像用户', 0, '青铜学员');
    document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; });
    userData.hasSeenOnboarding = true;
    userData.hasSelectedInitial = true;
    showModal('editprofile');
  });

  const cards = page.locator('#profile-avatar-select-grid .avatar-preset-card');
  await expect(cards).toHaveCount(10);
  await expect(page.locator('#profile-avatar-select-grid img')).toHaveCount(10);
  await page.waitForFunction(() => [...document.querySelectorAll('#profile-avatar-select-grid img')].every(img => img.complete && img.naturalWidth > 0));
  const imagesLoaded = await page.locator('#profile-avatar-select-grid img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0));
  expect(imagesLoaded).toBeTruthy();
  const firstPreset = page.locator('#profile-avatar-select-grid [data-avatar-id="steady"]');
  await expect(firstPreset).toHaveAttribute('data-avatar-id', 'steady');
  await firstPreset.locator('.avatar-preset-zoom').click();
  await expect(page.locator('#modal-avatar-detail')).toBeVisible();
  await expect(page.locator('#avatar-detail-image')).toHaveAttribute('src', /assets\/images\/user-avatars\/user-avatar-01\.png/);
  await page.getByRole('button', { name: '使用这个形象' }).first().click();

  const creative = page.locator('#profile-avatar-select-grid [data-avatar-id="creative"]');
  await creative.scrollIntoViewIfNeeded();
  await creative.click();
  await expect(page.locator('#edit-avatar-preview-image').first()).toHaveAttribute('src', /assets\/images\/user-avatars\/user-avatar-06\.png/);
  await expect(page.locator('#profile-avatar-select-grid [data-avatar-id="creative"]')).toHaveClass(/is-selected/);
  await page.getByRole('button', { name: '保存修改' }).first().click();

  const stored = await page.evaluate(() => ({
    preset: userData.avatarPresetId,
    image: userData.avatarImage,
    homeVisible: Boolean(document.querySelector('#home-avatar-btn img'))
  }));
  expect(stored).toEqual({
    preset: 'creative',
    image: 'assets/images/user-avatars/user-avatar-06.png',
    homeVisible: true
  });
  expect(pageErrors).toEqual([]);
});
test('训练前形象准备与结算评分透明可追溯', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    performLocalLogin('appearance-score-test', '形象评分用户', 650, '钻石学员');
    document.querySelectorAll('.modal-overlay').forEach(el => { el.style.display = 'none'; });
    userData.hasSeenOnboarding = true;
    userData.hasSelectedInitial = true;
    userData.avatarPresetId = 'steady';
    userData.avatar = '🧑';
    userData.avatarImage = 'assets/images/user-avatars/user-avatar-01.png';
    userAvatarImage = userData.avatarImage;
    const scene = trainingScenes[0];
    scene.unlocked = true;
    currentTraining = scene;
    currentTraining.shuffledRounds = [...scene.rounds];
    trainingRoundIdx = currentTraining.shuffledRounds.length - 1;
    trainingChoices = currentTraining.shuffledRounds.map((_, index) => ({ round: index + 1, scoreDelta: 8, isGood: true }));
    trainingScore = 60;
    netScore = 40;
    currentImageFit = 85;
    trainingSettlementApplied = false;
    fullAnalysisUnlocked = false;
    finishTraining();
    return { appearance: currentAppearanceScore, bonus: currentAppearanceBonus, net: netScore, score: trainingScore };
  });
  expect(result).toEqual({ appearance: 85, bonus: 5, net: 45, score: 65 });
});