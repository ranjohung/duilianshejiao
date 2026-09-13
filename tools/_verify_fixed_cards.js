// 专项验证：OCR/复用修复后的卡片，详情页正文能否真实渲染
// 用法: node tools/_verify_fixed_cards.js
const { chromium } = require('playwright');
const path = require('path');
const NO_BLUR = '*{backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}';

(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 420, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.resolve('index.html').split(path.sep).join('/');
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.addStyleTag({ content: NO_BLUR });
  await p.waitForTimeout(1500);

  const targets = ['人性买单99招', '职场厚黑学', '保险十大经典成交话术', '销售话术总结', '酒桌话术', '察言观色'];

  for (const t of targets) {
    const r = await p.evaluate(async (title) => {
      const card = learningCards.find(c => (c.title || '').includes(title));
      if (!card) return { found: false };
      // 打开详情（会按需加载 bundle）
      KL_openDetail(card.id);
      await new Promise(r => setTimeout(r, 1200));
      const modal = document.querySelector('#modal-knowledge-detail');
      const visible = modal && getComputedStyle(modal).display !== 'none';
      const body = modal ? modal.innerText : '';
      const emptyLike = /该资料为扫描版|原文件损坏|无法提取正文|正文尚未提取|文件不完整/.test(body);
      const secCount = (card.sections || []).length;
      return { found: true, title: card.title, chars: card.chars || 0, visible,
               bodyLen: body.length, emptyLike, secCount,
               sample: body.replace(/\s+/g, ' ').slice(0, 150) };
    }, t);
    console.log('----', t, JSON.stringify(r).slice(0, 400));
    // 关闭 modal
    await p.evaluate(() => { const m = document.querySelector('#modal-knowledge-detail .modal-close, #modal-knowledge-detail [data-close]'); if (m) m.click(); const f = window.closeModal; if (f) f('knowledge-detail'); });
    await p.waitForTimeout(300);
  }
  console.log('pageerrors:', errs.length, errs.slice(0, 3));
  await b.close();
})();
