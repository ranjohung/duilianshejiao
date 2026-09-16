/* V4 教学闭环 smoke：用 Node 桩环境验证核心逻辑（四级切换/边说边做/时间线写日志） */
'use strict';
const fs = require('fs');
const path = require('path');

function makeEl(id) {
  return {
    id: id || null,
    style: {},
    set className(v) { this._c = v; }, get className() { return this._c || ''; },
    innerHTML: '',
    textContent: '',
    value: '',
    children: [],
    styleObj: {},
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c, ref) { this.children.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); },
    querySelector() { return { querySelector: () => null, closest: () => null }; },
    querySelectorAll() { return []; },
    get firstElementChild() { return this.children[0] || null; },
    get clientWidth() { return 360; }, get clientHeight() { return 300; }
  };
}

const els = {};
const store = {};
globalThis.window = globalThis;

globalThis.document = {
  getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
  createElement(tag) { const e = makeEl(null); e.tag = tag; return e; },
  body: makeEl('body'),
  addEventListener() {},
  readyState: 'complete'
};

globalThis.localStorage = {
  getItem(k) { return store[k] === undefined ? null : store[k]; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; }
};

globalThis.Stage3D = {
  mount() { return true; }, dispose() {}, setAction() {}, setSpeaking() {}
};
globalThis.DUILIAN_ACTIONS = {
  '微笑': { cls: 'nod', label: '微笑示意' },
  '点头': { cls: 'nod', label: '点头示意' },
  '握手': { cls: 'handshake', label: '伸手握手' },
  '鞠躬': { cls: 'bow', label: '鞠躬行礼' },
  '挥手': { cls: 'wave', label: '挥手打招呼' }
};
globalThis.V3Economy = { addGrowth: function (n, r) { globalThis.__growth = (globalThis.__growth || 0) + n; } };

const src = fs.readFileSync(path.join(__dirname, '..', 'libs', 'v4_teaching_closed_loop.js'), 'utf8');
eval(src);

if (typeof globalThis.V4Teaching !== 'object' || typeof globalThis.V4Teaching.open !== 'function') {
  console.error('FAIL: V4Teaching not exposed'); process.exit(1);
}
// 进入教学模式
globalThis.V4Teaching.open('first-meeting-client'); // 默认 demo
if (globalThis.V4Teaching._state.mode !== 'demo') { console.error('FAIL: mode not demo'); process.exit(1); }
// 模拟：跟练 → 点动作(边说边做) + 发送语音（同一条时间轴并发） → 复盘
 globalThis.V4Teaching.mode('follow');
 globalThis.V4Teaching.action('微笑');   // 边说边做：点击动作不打断输入
 els['v4-input'].value = '您好，很高兴认识您，我是小张。';
 globalThis.V4Teaching.send();          // 语音/文字不被打断
 globalThis.V4Teaching.review(); // 触发 saveToLog + addGrowth（模式=follow）
 
 const log1 = JSON.parse(store['duilian_training_log'] || '[]');
 const session = log1.find(x => x.type === 'teaching_session');
 if (!session) { console.error('FAIL: no teaching_session written'); process.exit(1); }
 if (!Array.isArray(session.timeline) || session.timeline.length < 2) { console.error('FAIL: timeline too short'); process.exit(1); }
 const hasAction = session.timeline.some(x => x.type === 'action');
 const hasMsg = session.timeline.some(x => x.type === 'message');
 if (!hasAction || !hasMsg) { console.error('FAIL: timeline missing action/message concurrency'); process.exit(1); }
 if (!globalThis.__growth) { console.error('FAIL: no growth added'); process.exit(1); }

 // 跨环节独立成段：半开放再写一条会话
 globalThis.V4Teaching.mode('open');
 globalThis.V4Teaching.action('握手');
 globalThis.V4Teaching.review();
 const log2 = JSON.parse(store['duilian_training_log'] || '[]');
 const session2 = log2.filter(x => x.type === 'teaching_session');
 if (session2.length < 2) { console.error('FAIL: mode segmentation (expect 2 sessions)'); process.exit(1); }
 if (session2[1].mode !== 'open' || session2[1].timeline.length < 1) { console.error('FAIL: open session timeline'); process.exit(1); }

const prof = JSON.parse(store['duilian_profile'] || '{}');
if (!prof.lesson || !prof.etiquetteRules || !prof.trainingScenarios || prof.lesson.length === 0) {
  console.error('FAIL: course bindings not seeded'); process.exit(1);
}

console.log('PASS v4 smoke:');
console.log(' - 四级模式切换 OK（demo→follow→open）');
console.log(' - 边说边做 OK（action 与 message 同时间轴并发）');
console.log(' - 行为时间线写入 duilian_training_log OK');
console.log(' - 课程绑定 Lesson/EtiquetteRule/TrainingScenario 写入 duilian_profile OK');
console.log(' - 复盘成长值 addGrowth OK');
console.log('session timeline entries:', session.timeline.length);
process.exit(0);
