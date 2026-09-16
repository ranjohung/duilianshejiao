const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 420, height: 820 } })).newPage();
  await p.goto('file://' + path.resolve('index.html').split(path.sep).join('/'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);

  const targetId = await p.evaluate(() => {
    const c = learningCards.find(x => x.status === 'ok' && x.chars > 5000);
    return c ? c.id : null;
  });
  console.log('Test card:', targetId);

  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });

  await p.evaluate(id => { KL_openDetail(id); }, targetId);
  await p.waitForTimeout(2000);

  const info = await p.evaluate(() => {
    const m = document.getElementById('modal-knowledge-detail');
    const main = document.querySelector('.knowledge-content-main');
    const rawtxtEl = main ? main.querySelector('.kc-sec-x') : null;
    const rawtxt = rawtxtEl ? rawtxtEl.textContent.slice(0, 200) : null;
    return {
      modalVisible: getComputedStyle(m).display !== 'none',
      mainExists: !!main,
      mainEmpty: main ? main.classList.contains('empty') : null,
      rawtxtPreview: rawtxt,
      rawtxtLen: rawtxtEl ? rawtxtEl.textContent.length : 0,
      sectionCount: main ? main.querySelectorAll('.kc-sec').length : 0,
      outlineToggle: !!document.querySelector('.kd-outline-toggle'),
      outlineHidden: document.querySelector('#kd-outline-wrap') ? (getComputedStyle(document.querySelector('#kd-outline-wrap')).display === 'none') : null,
    };
  });
  console.log('Detail:', JSON.stringify(info, null, 1));
  console.log('Errors:', errors);

  await p.screenshot({ path: 'screenshots/dnd_real_top.png' });

  // 滚到正文中间
  await p.evaluate(() => {
    const sc = document.querySelector('#modal-knowledge-detail .kd-scroll');
    if (sc) sc.scrollTop = 200;
  });
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'screenshots/dnd_real_mid.png' });

  // 展开课程目录
  await p.evaluate(() => {
    const t = document.querySelector('.kd-outline-toggle');
    if (t) t.click();
  });
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    const el = document.querySelector('#kd-outline-wrap');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'screenshots/dnd_outline_open.png' });

  await b.close();
})();
