const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8000/index.html';

test('真实挑战：每个项目都有场景背景并绑定对应教练角色', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  const state = await page.evaluate(async () => {
    loadMockChallenges(true);
    userData.memberTier = 'pro';
    userData.memberTierExpiresAt = new Date(Date.now() + 86400000).toISOString();
    const cards = Array.from(document.querySelectorAll('#modal-challenge-list > div'));
    const cardBackgrounds = cards.map(card => card.style.backgroundImage);
    const assetUrls = [...new Set(challenges.map(challenge => (challenge.sceneMeta || getChallengeSceneMeta(challenge)).image))];
    const assetResults = await Promise.all(assetUrls.map(url => fetch(url).then(response => response.ok).catch(() => false)));
    const allMapped = challenges.length > 0 && challenges.every(challenge => {
      const meta = challenge.sceneMeta || getChallengeSceneMeta(challenge);
      return Boolean(meta.image && meta.location && meta.role && meta.coachId);
    });

    const first = challenges.find(challenge => challenge.unlocked) || challenges[0];
    startChallenge(first.id);
    const kitSkip = document.getElementById('v3-kit-skip');
    if (kitSkip) kitSkip.click();
    return {
      challengeCount: challenges.length,
      allMapped,
      cardCount: cards.length,
      backgroundCount: cardBackgrounds.filter(value => value.includes('assets/images/challenges/')).length,
      assetsLoad: assetResults.every(Boolean),
      sceneImage: $('challenge-training-surface').style.backgroundImage || (($('challenge-3d-stage').querySelector('.photo-bg') || {}).getAttribute || (() => ''))('src'),
      roleLabel: $('challenge-coach-role').textContent,
      preTrainingText: $('challenge-messages').innerText,
      evaluationText: $('challenge-coach-evaluation').innerText,
      coachAvatar: $('challenge-coach-avatar').src
    };
  });

  expect(state.challengeCount).toBeGreaterThanOrEqual(45);
  expect(state.allMapped).toBe(true);
  expect(state.cardCount).toBe(state.challengeCount);
  expect(state.backgroundCount).toBe(state.challengeCount);
  expect(state.assetsLoad).toBe(true);
  expect(state.sceneImage).toContain('assets/images/challenges/');
  expect(state.roleLabel).toMatch(/·/);
  expect(state.preTrainingText).not.toContain('参考回答');
  expect(state.evaluationText).toContain('不提供选项或示范答案');
  expect(state.coachAvatar).toContain('/assets/images/coaches/');
  expect(pageErrors).toEqual([]);
});
