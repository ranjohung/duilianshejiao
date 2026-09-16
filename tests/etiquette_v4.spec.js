const { test, expect } = require('@playwright/test');

test('礼仪训练是先教后练课堂，真实挑战保持无提示', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('http://localhost:8000/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    performLocalLogin('etiquette-classroom', '课堂验收用户', 99999, '钻石学员');
    userData.memberTier = 'pro';
    userData.memberTierExpiresAt = new Date(Date.now() + 86400000).toISOString();
    showEtiquetteTraining();
  });
  await expect(page.locator('.etiquette-course-card')).toHaveCount(9);
  await page.locator('.etiquette-course-card[data-level-id="9001"] .etiquette-course-action').click();
  await expect(page.locator('#modal-etiquette-training')).toBeVisible();
  await expect(page.locator('#modal-v4-teaching')).toHaveCount(0);
  await expect(page.locator('#etiquette-3d-stage')).toHaveClass(/is-photo/);
  await expect(page.locator('.etiquette-teaching-card')).toBeVisible();
  await expect(page.locator('.etiquette-teaching-card')).toContainText('说话方法');
  await expect(page.locator('.etiquette-teaching-card')).toContainText('轮到你');
  await expect(page.locator('.etiquette-action-lesson')).toContainText('看教练示范');
  await expect(page.locator('.etiquette-reference-dialogue')).toBeVisible();
  await expect(page.locator('.etiquette-reference-dialogue')).toContainText('对方');
  await expect(page.locator('.etiquette-reference-dialogue')).toContainText('你可以说');
  await expect(page.locator('.etiquette-reference-dialogue')).toContainText('是的！我也觉得你面熟');
  await expect(page.locator('#etiquette-options')).not.toContainText('A/B/C');
  await expect(page.locator('#etiquette-voice-btn')).toBeVisible();
  await page.evaluate(() => {
    window.SpeechRecognition = window.webkitSpeechRecognition = class {
      start() {
        this.onresult({ resultIndex: 0, results: [{ 0: { transcript: '你好，很高兴认识你' }, isFinal: true }] });
        this.onend();
      }
    };
  });
  await page.locator('#etiquette-voice-btn').click();
  await expect(page.locator('#etiquette-input')).toHaveValue('你好，很高兴认识你');

  await page.locator('#etiquette-input').fill('我会先转向对方，微笑并自然地点头回应。');
  await page.getByRole('button', { name: '提交跟练' }).click();
  await expect(page.locator('#etiquette-coach-evaluation')).toContainText('为什么');
  await expect(page.locator('#etiquette-coach-evaluation')).toContainText('怎么做');
  await expect(page.locator('#etiquette-coach-evaluation')).toContainText('参考回答');
  await expect(page.locator('#etiquette-coach-evaluation')).toContainText('对方为什么这样回应');
  await expect(page.locator('.etiquette-teaching-card')).toContainText('本课第 2 / 4 步');

  expect(pageErrors).toEqual([]);
});
