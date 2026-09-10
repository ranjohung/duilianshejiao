// 翻页专项验证：长内容型（好好接话）+ 短表达型（4S店砍价）
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

  // ---- 场景 A：长内容型（好好接话）----
  // 找到第一张好好接话课程的卡片并打开
  out.A_open = await p.evaluate(() => {
    const card = learningCards.find(c => c.kind === 'intro' && (c.scene || '').indexOf('懂得倾听') >= 0);
    if (!card) return { error: 'no intro card found' };
    KL_openDetail(card.id);
    return {
      id: card.id,
      title: card.title,
      scene: card.scene,
      pagerExists: !!document.getElementById('knowledge-detail-pager'),
      pagerHasContent: (document.getElementById('knowledge-detail-pager') || {}).innerHTML?.length > 0,
      pagerButtons: document.querySelectorAll('#knowledge-detail-pager button').length,
      pagerPos: (document.querySelector('#knowledge-detail-pager .pager-pos') || {}).textContent,
      pagerTitle: (document.querySelector('#knowledge-detail-pager .pager-title') || {}).textContent,
      outlineItems: document.querySelectorAll('.kd-outline-item').length,
      curItemIdx: [...document.querySelectorAll('.kd-outline-item.cur')].map(el => el.querySelector('.kd-outline-name')?.textContent)
    };
  });
  await p.waitForTimeout(400);

  // 点击「下一节」按钮
  out.A_next = await p.evaluate(() => {
    const btn = document.querySelector('#knowledge-detail-pager button[data-dir="1"]');
    if (!btn || btn.disabled) return { error: 'next button missing/disabled' };
    const beforeTitle = (document.querySelector('#knowledge-detail-pager .pager-title') || {}).textContent;
    btn.click();
    return {
      clicked: true,
      beforeTitle: beforeTitle,
      afterTitle: (document.querySelector('#knowledge-detail-pager .pager-title') || {}).textContent,
      afterPos: (document.querySelector('#knowledge-detail-pager .pager-pos') || {}).textContent,
      detailHeadTitle: (document.querySelector('.knowledge-detail-head div:nth-child(2)') || {}).textContent
    };
  });
  await p.waitForTimeout(400);

  // 通过目录项直接跳转：点击目录第 5 项
  out.A_jump = await p.evaluate(() => {
    const items = document.querySelectorAll('.kd-outline-item');
    if (items.length < 5) return { error: 'less than 5 items' };
    const target = items[4]; // 第 5 项
    const targetTitle = target.querySelector('.kd-outline-name').textContent;
    target.click();
    return {
      targetTitle: targetTitle,
      afterTitle: (document.querySelector('#knowledge-detail-pager .pager-title') || {}).textContent,
      afterPos: (document.querySelector('#knowledge-detail-pager .pager-pos') || {}).textContent
    };
  });
  await p.waitForTimeout(400);

  // 「上一节」按钮
  out.A_prev = await p.evaluate(() => {
    const btn = document.querySelector('#knowledge-detail-pager button[data-dir="-1"]');
    if (!btn || btn.disabled) return { error: 'prev missing/disabled' };
    const before = (document.querySelector('#knowledge-detail-pager .pager-pos') || {}).textContent;
    btn.click();
    return {
      before: before,
      after: (document.querySelector('#knowledge-detail-pager .pager-pos') || {}).textContent
    };
  });

  // 跳到最后一节，确认下一节按钮 disabled
  out.A_last = await p.evaluate(() => {
    const items = document.querySelectorAll('.kd-outline-item');
    items[items.length - 1].click();
    const nextBtn = document.querySelector('#knowledge-detail-pager button[data-dir="1"]');
    const prevBtn = document.querySelector('#knowledge-detail-pager button[data-dir="-1"]');
    return {
      pos: (document.querySelector('#knowledge-detail-pager .pager-pos') || {}).textContent,
      nextDisabled: nextBtn ? nextBtn.disabled : null,
      prevDisabled: prevBtn ? prevBtn.disabled : null
    };
  });
  await p.waitForTimeout(400);

  // ---- 场景 B：短表达型（4S店砍价）----
  out.B_open = await p.evaluate(() => {
    const card = learningCards.find(c => c.id === 'kb_ks_001');
    if (!card) return { error: 'no kb_ks_001' };
    closeModal && closeModal('knowledge-detail');
    KL_openDetail(card.id);
    return {
      title: card.title,
      scene: card.scene,
      pagerHasContent: (document.getElementById('knowledge-detail-pager') || {}).innerHTML?.length > 0,
      pagerButtons: document.querySelectorAll('#knowledge-detail-pager button').length,
      outlineItems: document.querySelectorAll('.kd-outline-item').length,
      pagerPos: (document.querySelector('#knowledge-detail-pager .pager-pos') || {}).textContent
    };
  });
  await p.waitForTimeout(400);

  // 单场景只有 1 节时（无翻页）
  out.B_singleScene = await p.evaluate(() => {
    // 找一张同 scene 只有一条的场景卡片，验证 pager 为空
    const card = learningCards.find(c => c.id === 'kb_yh_020'); // VIP服务咨询（在 银行办理业务 同场景共 20 条，但选最后一节测试）
    // 找一张孤立的、单条的卡片：找个不重复的 scene
    const seenScenes = {};
    let alone = null;
    learningCards.forEach(c => {
      if (!c.scene) return;
      if (!seenScenes[c.scene]) seenScenes[c.scene] = 0;
      seenScenes[c.scene]++;
    });
    Object.keys(seenScenes).forEach(s => { if (seenScenes[s] === 1 && !alone) alone = s; });
    if (alone) {
      const c = learningCards.find(c => c.scene === alone);
      KL_openDetail(c.id);
      return {
        aloneScene: alone,
        pagerEmpty: (document.getElementById('knowledge-detail-pager') || {}).innerHTML === ''
      };
    }
    return { aloneScene: null, note: 'no single-card scene' };
  });

  // ---- 布局正确性：翻页栏与底部操作栏都不应该遮挡滚动区，滚动后位置不变 ----
  out.B_layout = await p.evaluate(() => {
    const modal = document.getElementById('modal-knowledge-detail');
    const pager = document.getElementById('knowledge-detail-pager');
    const bar = document.getElementById('knowledge-detail-actions-bar');
    const scroll = modal.querySelector('.kd-scroll');
    if (!pager || !bar || !scroll) return { error: 'missing elements' };

    const p1 = pager.getBoundingClientRect();
    const b1 = bar.getBoundingClientRect();
    scroll.scrollTop = scroll.scrollHeight;
    const p2 = pager.getBoundingClientRect();
    const b2 = bar.getBoundingClientRect();
    return {
      pagerBefore: Math.round(p1.top), pagerAfter: Math.round(p2.top), pagerFixed: Math.round(p1.top) === Math.round(p2.top),
      barBefore: Math.round(b1.top), barAfter: Math.round(b2.top), barFixed: Math.round(b1.top) === Math.round(b2.top),
      pagerAboveBar: p1.top < b1.top
    };
  });

  console.log(JSON.stringify(out, null, 1));
  console.log('ERR', JSON.stringify(errs));
  await b.close();
})();