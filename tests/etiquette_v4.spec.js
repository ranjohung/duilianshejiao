const { test, expect } = require('@playwright/test');
async function acceptProtocol(page) {
  const protocol = page.locator('#v3-protocol-overlay');
  await protocol.waitFor({ state: 'visible', timeout: 4500 }).catch(() => {});
  for (let step = 0; step < 3; step += 1) {
    if (!(await protocol.isVisible().catch(() => false))) break;
    const next = protocol.getByRole('button', { name: /已阅读，下一步|全部阅读完毕/ }).last();
    if (await next.isVisible().catch(() => false)) await next.click();
    else break;
  }
}

test('礼仪训练是先教后练课堂，真实挑战保持无提示', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    performLocalLogin('etiquette-classroom', '课堂验收用户', 99999, '钻石学员');
    userData.memberTier = 'pro';
    userData.memberTierExpiresAt = new Date(Date.now() + 86400000).toISOString();
    showEtiquetteTraining();
  });
  await acceptProtocol(page);
  await expect.poll(async () => page.locator('.etiquette-course-card').count()).toBeGreaterThanOrEqual(15);
  await page.locator('.etiquette-course-card[data-level-id="9001"] .etiquette-course-action').click();
  await expect(page.locator('#modal-etiquette-training')).toBeVisible();
  await expect.poll(async () => page.locator('#scene-training-container').isVisible().catch(() => false), { timeout: 10000 }).toBe(true);
  if (await page.locator('#scene-training-container').isVisible().catch(() => false)) {
    await page.evaluate(() => { while (SceneTraining.getCurrentStep().type !== 'action_demo') SceneTraining.next(); });
    await expect(page.locator('#scene-training-container')).toContainText('动作示范');
    await page.locator('.st-action-check').nth(1).click();
    await expect.poll(async () => page.evaluate(() => { const p = JSON.parse(localStorage.getItem('duilian_scene_progress_9001') || '{}'); const row = p.actionDone && p.actionDone[SceneTraining._stepIdx]; return !!(row && row[1]); })).toBe(false);
    await page.locator('.st-action-check').nth(0).click();
    await page.locator('.st-action-check').nth(1).click();
    await page.evaluate(() => { while (SceneTraining.getCurrentStep().type !== 'speech_demo') SceneTraining.next(); });
    await expect(page.locator('#scene-training-container')).toContainText('话术示范');
    await page.evaluate(() => { while (SceneTraining.getCurrentStep().type !== 'follow_prac') SceneTraining.next(); });
    await expect(page.locator('#scene-training-container')).toContainText('跟练');
    await expect(page.locator('#st-follow-progress')).toContainText('已完成');
    await page.evaluate(() => { while (SceneTraining.getCurrentStep().type !== 'ai_roleplay') SceneTraining.next(); });
    await expect(page.locator('#scene-training-container')).toContainText('AI 角色扮演');
    const turns = await page.evaluate(() => SceneTraining.getCurrentStep().dialogue.length);
    for (let i = 0; i < turns; i += 1) {
      await page.locator('#st-ai-input').fill('您好，谢谢您的介绍。我会先确认重点，再和您同步下一步，您最关注哪一项？');
      await page.locator('.st-ai-send').click();
      await page.waitForTimeout(750);
    }
    await expect(page.locator('.st-branch-btn')).toHaveCount(3);
    await page.locator('.st-branch-btn').first().click();
    await expect(page.locator('#scene-training-container')).toContainText('临时要接个电话');
    await page.locator('#st-ai-input').fill('好的，你先接电话，我们晚点再继续聊。');
    await page.locator('.st-ai-send').click();
    await page.waitForTimeout(750);
    await expect(page.locator('#st-ai-feedback')).toContainText('本地教练提示');
    await page.evaluate(() => SceneTraining.next());
    await expect(page.locator('#scene-training-container')).toContainText('训练完成');
    await expect(page.locator('#scene-training-container')).toContainText('2 / 8 个动作已确认');
    await expect(page.locator('#scene-training-container')).toContainText('下一练预告');
    const reached = await page.evaluate(() => JSON.parse(localStorage.getItem('duilian_etiquette_completed_9001') || 'null'));
    expect(reached.evaluationReachedAt).toBeTruthy();
    await expect(page.locator('#st-reality-note').first()).toBeVisible();
    await page.locator('#st-reality-note').first().fill('今天在办公室主动向同事问候，并保持自然目光交流。');
    await page.locator('#st-reality-feeling').first().selectOption('比较自然');
    await page.locator('#st-save-reality').first().click();
    await expect(page.locator('#st-reality-result').first()).toContainText('已保存现实记录');
    const challenge = await page.evaluate(() => JSON.parse(localStorage.getItem('duilian_challenge_log') || '[]')[0]);
    expect(challenge.note).toContain('办公室');
    expect(challenge.recommendation).toBeTruthy();
    expect(challenge.challenge).toContain('行为清单');
    expect(challenge.branch).toBe('对方临时打断');
    expect(challenge.recommendation).toContain('对方临时打断');
    const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('duilian_etiquette_completed_9001') || 'null'));
    expect(completed.scene).toContain('咖啡厅');
    await page.evaluate(() => { closeModal('etiquette-training'); showEtiquetteTraining(); });
    await expect(page.locator('.v5-recommendation')).toContainText(challenge.recommendation);
    await page.locator('.v5-recommendation button', { hasText: '查看最近复盘' }).click();
    await expect(page.locator('#v5-review-history')).toContainText('办公室');
    await expect(page.locator('#v5-review-history')).toContainText('行为清单');
    await expect(page.locator('#v5-review-history')).toContainText('对方临时打断');
    await page.locator('#v5-review-history details summary').click();
    await expect(page.locator('#v5-review-history')).toContainText('第1轮');
    await expect(page.locator('#v5-review-history')).toContainText('您好，谢谢您的介绍');
    await page.locator('#v5-review-history button[aria-label="关闭复盘"]').click();
    await page.locator('.v5-recommendation button', { hasText: '进入下一练' }).click();
    await expect(page.locator('#modal-etiquette-training')).toBeVisible();
    return;
  }
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

test('礼仪训练中途退出后可恢复，并支持从头重练', async ({ page }) => {
  await page.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    performLocalLogin('etiquette-progress', '进度恢复用户', 99999, '钻石学员');
    userData.memberTier = 'pro';
    userData.memberTierExpiresAt = new Date(Date.now() + 86400000).toISOString();
    showEtiquetteTraining();
  });
  await acceptProtocol(page);
  await page.locator('.etiquette-course-card[data-level-id="9001"] .etiquette-course-action').click();
  await expect(page.locator('#scene-training-container')).toBeVisible();
  await page.evaluate(() => {
    while (SceneTraining.getCurrentStep().type !== 'action_demo') SceneTraining.next();
    SceneTraining.persistProgress();
  });
  await expect.poll(async () => page.evaluate(() => !!localStorage.getItem('duilian_scene_progress_9001'))).toBe(true);
  await page.evaluate(() => { closeModal('etiquette-training'); showEtiquetteTraining(); });
  await page.locator('.etiquette-course-card[data-level-id="9001"] .etiquette-course-action').click();
  await expect(page.locator('#scene-training-container')).toContainText('已恢复上次进度');
  await page.evaluate(() => { SceneTraining._resumed = false; SceneTraining.gotoStep(0); SceneTraining.clearProgress(); });
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('duilian_scene_progress_9001'))).toBeNull();
  await expect(page.locator('#scene-training-container')).toContainText('Step 1 / 8');
});