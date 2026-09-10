// 综合回归：知识库 / 详情页 / 礼仪训练 / 真实挑战
const { chromium } = require('playwright');
const path = require('path');
const NO_BLUR = '*{backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}';

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 420, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.resolve('index.html').split(path.sep).join('/');
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.addStyleTag({ content: NO_BLUR });
  await p.waitForTimeout(1600);
  const out = {};

  // 1) 知识库
  out.kl = await p.evaluate(() => {
    openKnowledgeLibrary();
    const cards = [...document.querySelectorAll('.chapter-card')];
    const first = cards[0];
    return {
      cards: learningCards.length,
      chapters: cards.length,
      // 关键：卡片不再被 flex 压缩
      cardHeights: cards.slice(0, 5).map(c => Math.round(c.getBoundingClientRect().height)),
      firstTitle: first ? first.querySelector('.chapter-title').textContent : null,
      firstStat: first ? first.querySelector('.chapter-stat').textContent : null
    };
  });

  // 2) 详情页三段式
  await p.evaluate(() => {
    const inp = document.getElementById('knowledge-search-input');
    inp.value = '开场问候';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => { const c = document.querySelector('.chapter-card'); if (c) c.querySelector('.chapter-head').click(); });
  await p.waitForTimeout(400);
  out.lessons = await p.evaluate(() => document.querySelectorAll('.lesson-row').length);
  await p.evaluate(() => { const r = document.querySelector('.lesson-row'); if (r) r.click(); });
  await p.waitForTimeout(700);
  out.detail = await p.evaluate(() => {
    const modal = document.getElementById('modal-knowledge-detail');
    const bar = document.getElementById('knowledge-detail-actions-bar');
    const scroll = modal.querySelector('.kd-scroll');
    const before = Math.round(bar.getBoundingClientRect().top);
    scroll.scrollTop = scroll.scrollHeight;
    const after = Math.round(bar.getBoundingClientRect().top);
    return {
      barInsideScroll: scroll.contains(bar),
      barTopBefore: before, barTopAfter: after, barFixed: before === after,
      catalogItems: document.querySelectorAll('.kd-outline-item').length,
      samples: document.querySelectorAll('.kd-sample').length,
      chips: document.querySelectorAll('.kd-chip').length,
      hasRawtext: !!document.querySelector('.kd-rawtext')
    };
  });

  // 3) 礼仪训练
  await p.evaluate(() => {
    closeModal && closeModal('knowledge-detail');
    closeModal && closeModal('knowledge-library');
    startEtiquetteLevel && startEtiquetteLevel(9001);
  });
  await p.waitForTimeout(2000);
  out.etiquette = await p.evaluate(() => {
    const st = document.getElementById('etiquette-3d-stage');
    const inp = document.getElementById('etiquette-input');
    const s1 = Math.round(st.getBoundingClientRect().top);
    const i1 = Math.round(inp.getBoundingClientRect().top);
    const sc = document.querySelector('#modal-etiquette-training .ct-scroll');
    sc.scrollTop = sc.scrollHeight;
    const s2 = Math.round(st.getBoundingClientRect().top);
    const i2 = Math.round(inp.getBoundingClientRect().top);
    return {
      isPhoto: st.classList.contains('is-photo'),
      stageFixed: s1 === s2, inputFixed: i1 === i2,
      hasActionBtn: !!document.querySelector('.btn-action-trigger'),
      options: document.querySelectorAll('#etiquette-options .option-card').length
    };
  });

  // 4) 真实挑战
  await p.evaluate(() => {
    closeModal && closeModal('etiquette-training');
    if (typeof loadMockChallenges === 'function') loadMockChallenges(true);
  });
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(x => /开始挑战|再次挑战|继续挑战/.test(x.textContent));
    if (btn) btn.click();
  });
  await p.waitForTimeout(2200);
  out.challenge = await p.evaluate(() => {
    const st = document.getElementById('challenge-3d-stage');
    return {
      isPhoto: st.classList.contains('is-photo'),
      desk: !!st.querySelector('.photo-desk'),
      npcSeated: st.querySelector('.photo-npc') ? st.querySelector('.photo-npc').classList.contains('seated') : null,
      optionsSuppressed: document.querySelectorAll('#challenge-messages .option-card').length === 0
    };
  });

  console.log(JSON.stringify(out, null, 1));
  console.log('ERR', JSON.stringify(errs));
  await b.close();
})();
