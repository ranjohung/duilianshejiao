/**
 * 对练社交 V4.0 — 社交技能教学闭环模块（四级教学 + 行为时间线 + 边说边做）
 * 创建日期：2026-09-16
 *
 * 遵循既有 v3 运行时补丁模式：独立模块，不侵入 index.html 的礼仪/挑战基础对话逻辑。
 *
 * 本模块实现（对应 docs/prd.md §0）：
 * 1. 四级教学闭环：看示范 → 跟练 → 半开放 → 真实模拟
 * 2. 行为时间线：动作触发时间点 + 语音/文字内容合并到同一条时间轴，
 *    写入 LocalStorage 键 `duilian_training_log`
 * 3. 动作快捷面板（边说边做）：底部常驻动作图标，点击立即触发 3D 动作并打时间戳，
 *    **不打断**当前语音/文字输入
 * 4. 课程绑定：Lesson / EtiquetteRule / TrainingScenario 数据结构写入 `duilian_profile`
 * 5. 文案红线：全站用"尝试/跟练/复盘/做成了"，禁用"检验/考核/不及格/作业"字眼
 *
 * 依赖（复用现成基座）：
 * - window.Stage3D（= GameStage3D，libs/game_stage3d.js）用于 3D 舞台与动作
 * - window.DUILIAN_ACTIONS（index.html 动作词典）
 * - $() helper（index.html 全局）
 * 接入点：
 * - 运行时包装 window.showEtiquetteTraining，在礼仪关卡列表注入【四级教学】入口
 * - 暴露 window.V4Teaching.open() / window.startV4Teaching()
 */
(function () {
  'use strict';
  if (window.__v4TeachingReady) return;
  window.__v4TeachingReady = true;

  var esc = window.escapeCardText || function (t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function $(id) { return document.getElementById(id); }
  function now() { return Date.now(); }

  var TRAINING_LOG_KEY = 'duilian_training_log';
  var PROFILE_KEY = 'duilian_profile';
  var CRISIS = '12356'; // 全国统一心理援助热线（开发者已核实，禁止改动）

  /* ---------------- 课程绑定数据结构（一次课程 = Lesson + EtiquetteRule + TrainingScenario） ---------------- */
  var COURSES = {
    'first-meeting-client': {
      lesson: {
        id: 'L001', title: '第一次见客户', chapter: '商务社交与职场礼仪',
        knowledgePoints: [
          '见面前准备好称呼与开场，避免临时冷场',
          '动作与语言同步发生，比"先做完动作再开口"更自然',
          '视线先到位，传递真诚与自信',
          '握手松手后恢复自然距离，不黏着也不过度疏远'
        ]
      },
      rule: {
        id: 'R001', situation: '第一次见客户 / 对方主动向你走来',
        recommendedActions: ['靠近, 视线看向对方', '微笑并伸手', '握手'],
        timing: '对方靠近时即可微笑；开口同时伸手，语言与动作并行',
        posture: '身体正面朝向对方，不侧身、不背对',
        facial: '微笑、眼神温和、眉头放松',
        eye: '看向对方双眼或眉心三角区，不飘忽躲闪',
        distance: '社交距离约 0.6–1.2 米，握手时自然前倾',
        language: '"您好，很高兴认识您。我是XX。"（可顺势追问对方一个开放问题）',
        tone: '语速平稳、音量适中，不用念稿感',
        avoid: ['背对对方', '眼睛看手机或地面', '声音太小听不清', '握手僵硬或用力过猛'],
        explain: '动作与语言同步进行，能让对方感受到真诚与从容，避免"做完动作再开口"的机械感'
      },
      scenario: {
        id: 'S001', env: 'office', npcLabel: '李总（重要客户）', userLabel: '我',
        goal: '完成一次自然的初次商务问候：靠近→注视→微笑→握手→打招呼',
        allowedActions: ['微笑', '点头', '握手', '鞠躬', '挥手'],
        expected: ['靠近', '视线看向对方', '微笑', '说"您好，很高兴认识您"', '握手', '松手恢复自然距离'],
        randomEvents: [
          { label: '对方声音很小', prompt: '客户说话声音很小，你有些听不清。', hint: '可以先微笑示意，再温和地说"不好意思，您的声音可以稍大一点吗？"来确认信息。' },
          { label: '对方没回应', prompt: '你说完"您好"后，对方愣了一下，没有立刻回应。', hint: '保持微笑，缓一拍再自然补充一句："李总，我是之前和您约好谈项目的小张。"来化解空白。' },
          { label: '对方主动伸手', prompt: '客户先主动向你伸出了手。', hint: '第一时间回应握手，力度适中，边握边做自我介绍。' },
          { label: '对方插话', prompt: '你刚开口，客户插话打断了你的自我介绍。', hint: '先停下来认真听对方说，等对方说完再补齐你的介绍，避免抢话。' },
          { label: '对方表现冷淡', prompt: '客户表情比较冷淡，回应很简短。', hint: '不要慌，保持微笑和从容，改用更具体、有工作价值的开放问题来拉回话题。' }
        ]
      }
    }
  };

  var DEMO_TIMELINE = [ // 看示范：动作+语音并行 + 暂停讲解
    { at: 0, who: 'npc', action: 'step',     text: '靠近对方', why: '在对方目光可及的距离内停下，避免过远看不见、过近有压迫感。' },
    { at: 1, who: 'npc', action: 'nod',      text: '视线看向对方', why: '视线先到位，能传达真诚和自信，避免侧身或背对对方。' },
    { at: 2, who: 'npc', action: 'nod',      text: '微笑', why: '一个自然的微笑能放松对方戒备，是建立好感的第一步。' },
    { at: 3, who: 'npc', action: 'nod',      text: '说："您好，很高兴认识您"', speak: true, why: '动作与语言同步发生比"先做完动作再开口"更自然，边说边做。' },
    { at: 4, who: 'npc', action: 'handshake', text: '握手', why: '握手要虎口相对、力度适中，配合目光与问候，是商务见面的尊重表达。' },
    { at: 5, who: 'npc', action: 'nod',      text: '松手，恢复自然距离', why: '握完轻收自然站立，恢复社交距离，不黏着也不生硬。' }
  ];

  /* ---------------- 会话状态 ---------------- */
  var state = {
    mode: null,          // 'demo' | 'follow' | 'open' | 'sim'
    scenario: null,
    startedAt: 0,
    timeline: [],        // { at(秒), type:'action'|'message'|'mutation', who, value, action }
    demoIdx: -1,
    followIdx: -1,
    demoTimer: null,
    over: false
  };

  function sid() { return 'v4-3d-stage'; }

  function mountStage() {
    if (!window.Stage3D || !window.Stage3D.mount) return false;
    var st = $(sid());
    if (!st) return false;
    var cfg = state.scenario ? state.scenario : COURSES['first-meeting-client'].scenario;
    try {
      window.Stage3D.mount(sid(), {
        env: cfg.env || 'office',
        npc: { label: cfg.npcLabel || '客户', image: 'assets/images/chars/npc-wang.png', fullBody: 'assets/images/chars/npc-wang-full.png' },
        user: { label: cfg.userLabel || '我', image: 'assets/images/chars/user.png' }
      });
      return true;
    } catch (e) { return false; }
  }

  function triggerAction(who, actionKey) {
    // actionKey 既可以是动作中文名（'微笑'），也可以是 GameStage3D 动作类（'step'/'nod'/'handshake'）
    var acts = window.DUILIAN_ACTIONS || {};
    var item = acts[actionKey];
    var cls = item && item.cls ? item.cls : actionKey; // '微笑'→nod；demo 用 'step'/'nod'/'handshake' 直接作 cls
    var label = item ? item.label : actionKey;
    if (window.Stage3D && window.Stage3D.setAction) {
      window.Stage3D.setAction(sid(), who === 'npc' ? 'npc' : 'user', cls);
    }
    pushTimeline({ type: 'action', who: who, value: label, action: cls });
    if (who === 'user') addBubble('user', '（动作：' + label + '）');
  }

  function setSpeaking(who) {
    if (window.Stage3D && window.Stage3D.setSpeaking) {
      window.Stage3D.setSpeaking(sid(), who === 'npc' ? 'npc' : 'user');
    }
  }

  function pushTimeline(e) {
    var t = (now() - state.startedAt) / 1000;
    e.at = Math.round(t * 100) / 100;
    state.timeline.push(e);
    renderTimeline();
    return e.at;
  }

  /* 边说边做：文字发送函数（不打断动作面板） */
  function sendText() {
    var input = $('v4-input');
    var text = (input && input.value || '').trim();
    if (!text || state.over) return;
    if (input) input.value = '';
    addBubble('user', text);
    setSpeaking('user');
    pushTimeline({ type: 'message', who: 'user', value: text });
    if (state.mode === 'follow') advanceFollowBySpeech(text);
  }

  /* ---------------- 3D 舞台气泡（复用礼仪气泡层） ---------------- */
  function addBubble(role, text) {
    var layer = $('v4-stage-bubbles');
    if (!layer) return;
    var isUser = role === 'user';
    var b = document.createElement('div');
    b.className = 'challenge-stage-bubble ' + (isUser ? 'user' : 'npc');
    b.textContent = text;
    layer.appendChild(b);
    while (layer.children.length > 3) layer.removeChild(layer.firstElementChild);
  }

  /* ---------------- 行为时间轴渲染 ---------------- */
  function renderTimeline() {
    var tl = $('v4-timeline');
    if (!tl) return;
    if (!state.timeline.length) { tl.innerHTML = '<div class="v4-tl-empty">行为时间轴：开始练习后，"动作时间点"与"语音内容"会记录在这里。</div>'; return; }
    tl.innerHTML = state.timeline.map(function (e) {
      var icon = e.type === 'action' ? '🤲' : (e.type === 'mutation' ? '⚡' : '💬');
      return '<div class="v4-tl-row"><span class="v4-tl-time">' + fmtTS(e.at) + '</span><span class="v4-tl-icon">' + icon + '</span><span class="v4-tl-val">' + esc(e.value) + '</span></div>';
    }).join('');
  }

  /* ---------------- 复盘：动作-语言衔接 ---------------- */
  function review() {
    var acts = state.timeline.filter(function (e) { return e.type === 'action'; });
    var msgs = state.timeline.filter(function (e) { return e.type === 'message'; });
    var lines = [];
    var syncLine = '';
    // 找"动作与语言几乎同时"的证据（2 秒内既有动作又有语音）
    for (var i = 0; i < state.timeline.length; i++) {
      var e = state.timeline[i];
      for (var j = 0; j < state.timeline.length; j++) {
        if (i === j) continue;
        var o = state.timeline[j];
        if (Math.abs(e.at - o.at) < 2 && e.type !== o.type) { syncLine = '你做到了"边说边做"：动作与语言在近 2 秒内同步发生，衔接自然。'; break; }
      }
      if (syncLine) break;
    }
    if (!syncLine) syncLine = '本次动作与语言基本分步进行；下次可以在开口的同时点动作图标，让两者同步，更贴近真实社交。';
    lines.push(syncLine);
    if (acts.length === 0) lines.push('没有触发任何动作。可以试试在训练中点一下底部的 [微笑] [握手] 等图标，让身体表达配合语言。');
    else if (acts.length >= 2) lines.push('你触发了 ' + acts.length + ' 个动作，动作表达比较丰富。');
    if (msgs.length === 0) lines.push('没有留下文字/语音内容。试着说一句问候，AI 才能帮你复盘语言表达。');
    return { score: Math.min(3, Math.max(1, acts.length)) , lines: lines };
  }

  var MODE_LABEL = { demo: '看示范', follow: '跟练', open: '半开放', sim: '真实模拟' };

  /* ---------------- 计时辅助 ---------------- */
  function durationSec() { return (now() - state.startedAt) / 1000; }
  function fmtTS(sec) {
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
  }

  /* ---------------- 日志写入：合并到同一条时间轴 ----------------
   * 结构：{ type:'teaching_session', scenarioKey, id, mode, modeLabel,
   *          timeline:[{at,type,who,value,action}], startedAt, endedAt, durationMs } */
  function saveToLog() {
    try {
      var arr = [];
      var raw = localStorage.getItem(TRAINING_LOG_KEY);
      if (raw) { var p = JSON.parse(raw); if (Array.isArray(p)) arr = p; }
      arr.push({
        type: 'teaching_session',
        id: 'ts_' + now(),
        scenarioKey: state.scenario ? (state.scenario.id || 'S001') : 'S001',
        mode: state.mode,
        modeLabel: MODE_LABEL[state.mode] || state.mode,
        timeline: state.timeline,
        startedAt: state.startedAt,
        endedAt: now(),
        durationMs: now() - (state.startedAt || now())
      });
      localStorage.setItem(TRAINING_LOG_KEY, JSON.stringify(arr));
    } catch (e) { console.error('[V4] saveToLog failed:', e); }
  }

  function seedProfileCourses() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      var p = raw ? JSON.parse(raw) : {};
      if (!raw) { p = { nickname: '', avatar: '👤', freeScenariosUsed: [], freeReviewsUsed: [], hasCompletedOnboarding: false }; }
      if (!p.lesson) p.lesson = [];
      if (!p.etiquetteRules) p.etiquetteRules = [];
      if (!p.trainingScenarios) p.trainingScenarios = [];
      var root = COURSES['first-meeting-client'];
      if (!p.lesson.some(function (l) { return l.id === root.lesson.id; })) p.lesson.push(root.lesson);
      if (!p.etiquetteRules.some(function (r) { return r.id === root.rule.id; })) p.etiquetteRules.push(root.rule);
      if (!p.trainingScenarios.some(function (s) { return s.id === root.scenario.id; })) p.trainingScenarios.push(root.scenario);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch (e) { console.warn('[V4] seedProfileCourses:', e); }
  }

  /* ---------------- 看示范：暂停式播放 ---------------- */
  function playDemoNode(idx) {
    state.demoIdx = idx;
    if (idx >= DEMO_TIMELINE.length) { demoDone(); return; }
    var node = DEMO_TIMELINE[idx];
    // 动作与语音并行触发
    if (node.speak) setSpeaking(node.who);
    triggerAction(node.who, node.action);
    // 更新时间轴高亮
    renderTimeline();
    // 暂停并弹出"为什么这么做"
    var p = $('v4-demo-panel');
    if (p) {
      p.className = 'v4-demo-panel show';
      p.innerHTML =
        '<div class="v4-demo-step">节点 ' + (idx + 1) + '/' + DEMO_TIMELINE.length + ' · ' + MODE_LABEL.demo + '</div>' +
        '<div class="v4-demo-text">' + esc(node.text) + '</div>' +
        '<div class="v4-demo-why"><b>为什么这么做：</b>' + esc(node.why) + '</div>' +
        '<button class="v4-btn" onclick="V4Teaching.nextDemo()">继续（' + fmtTS(node.at) + '）</button>';
    }
  }
  function demoDone() {
    stopDemo();
    var p = $('v4-demo-panel');
    if (p) {
      p.innerHTML =
        '<div class="v4-demo-text">你看完了完整示范👏</div>' +
        '<div class="v4-demo-why">行为时间轴已经把"动作与语言同步"的关键节点都标注出来了。接下来进入【跟练模式】，轮到你边做边说。</div>' +
        '<div class="v4-btn-row"><button class="v4-btn" onclick="V4Teaching.mode(\'follow\')">开始跟练</button>' +
        '<button class="v4-btn v4-btn-ghost" onclick="V4Teaching.close()">退出</button></div>';
    }
  }
  function stopDemo() {
    state.demoIdx = -1; state.demoTimer = null;
    var p = $('v4-demo-panel');
    if (p) p.className = 'v4-demo-panel';
  }

  /* ---------------- 跟练：逐步提示，动作+语音并发 ---------------- */
  var FOLLOW_STEPS = [
    { prompt: '现在请看向对方', action: 'nod', acceptAction: true },
    { prompt: '现在请微笑，同时伸手', action: 'nod', acceptAction: true, note: '点 [微笑] 即可；可以和下一句同时进行' },
    { prompt: '现在请说："您好，很高兴认识您"（可同时点 [握手]）', action: 'handshake', acceptSpeech: true }
  ];
  function startFollow() {
    state.followIdx = 0;
    showFollowStep(0);
  }
  function showFollowStep(idx) {
    if (idx >= FOLLOW_STEPS.length) { followDone(); return; }
    state.followIdx = idx;
    var s = FOLLOW_STEPS[idx];
    var p = $('v4-demo-panel');
    if (p) {
      p.className = 'v4-demo-panel show';
      p.innerHTML = '<div class="v4-demo-step">跟练 · 第 ' + (idx + 1) + '/' + FOLLOW_STEPS.length + ' 步</div>' +
        '<div class="v4-demo-text">' + esc(s.prompt) + '</div>' +
        (s.note ? '<div class="v4-demo-why">' + esc(s.note) + '</div>' : '') +
        '<div class="v4-btn-row">' +
        (s.acceptAction ? '<button class="v4-btn" onclick="V4Teaching.followDoAction()">我做了这个动作</button>' : '') +
        (s.acceptSpeech ? '<button class="v4-btn v4-btn-ghost" onclick="V4Teaching.nextFollow()">我开口说了</button>' : '') +
        '</div>';
    }
  }
  function advanceFollowBySpeech() {
    var s = FOLLOW_STEPS[state.followIdx];
    if (s && s.acceptSpeech) nextFollow();
  }
  function nextFollow() {
    // 动作与语言衔接：记录一条"衔接完成"到时间轴
    pushTimeline({ type: 'mutation', who: 'user', value: '跟练步骤 ' + (state.followIdx + 1) + ' 完成（动作+语言衔接）' });
    showFollowStep(state.followIdx + 1);
  }
  function followDone() {
    var p = $('v4-demo-panel');
    if (p) {
      p.innerHTML =
        '<div class="v4-demo-text">跟练完成做成了🎉（没有评判，只是记录你的尝试）</div>' +
        '<div class="v4-demo-why">动作与语言可以同步发生，这就是真实社交的自然状态。接下来进入【半开放】，你自主决定做什么。</div>' +
        '<div class="v4-btn-row"><button class="v4-btn" onclick="V4Teaching.mode(\'open\')">进入半开放</button></div>';
    }
  }

  /* ---------------- 半开放：只给场景，自主决策 ---------------- */
  function startOpen() {
    var sc = state.scenario || COURSES['first-meeting-client'].scenario;
    var p = $('v4-demo-panel');
    if (p) {
      p.className = 'v4-demo-panel show';
      p.innerHTML =
        '<div class="v4-demo-step">半开放训练 · 自主决策</div>' +
        '<div class="v4-demo-text">' + esc(sc.goal) + '</div>' +
        '<div class="v4-demo-why">' + esc(sc.expected.join(' → ')) + '</div>' +
        '<div class="v4-btn-row"><button class="v4-btn" onclick="V4Teaching.review()">结束并复盘</button></div>';
    }
    addBubble('npc', '（客户）你好，我是李总。你是小张吧？今天主要想聊聊项目的进展。');
    setSpeaking('npc');
    pushTimeline({ type: 'message', who: 'npc', value: '客户开场：你好，我是李总。…' });
  }

  /* ---------------- 真实模拟：随机突变 ---------------- */
  function startSim() {
    var sc = state.scenario;
    var events = (sc && sc.randomEvents) || COURSES['first-meeting-client'].scenario.randomEvents;
    var ev = events[Math.floor(Math.random() * events.length)];
    var p = $('v4-demo-panel');
    if (p) {
      p.className = 'v4-demo-panel show';
      p.innerHTML =
        '<div class="v4-demo-step">真实模拟 · 对方会随机反应</div>' +
        '<div class="v4-demo-text">⚠ 意外触发：' + esc(ev.label) + '</div>' +
        '<div class="v4-demo-why">' + esc(ev.prompt) + '<br><span style="opacity:.75">应对参考：</span>' + esc(ev.hint) + '</div>' +
        '<div class="v4-btn-row"><button class="v4-btn" onclick="V4Teaching.review()">结束并复盘</button></div>';
    }
    addBubble('npc', '（客户）' + ev.prompt);
    setSpeaking('npc');
    pushTimeline({ type: 'mutation', who: 'npc', value: 'AI 随机突变：' + ev.label });
  }

  /* ---------------- 复盘展示 ---------------- */
  function showReview() {
    var r = review();
    saveToLog();
    addGrowth(1);
    var p = $('v4-demo-panel');
    if (p) {
      p.className = 'v4-demo-panel show';
      p.innerHTML =
        '<div class="v4-demo-step">复盘 · ' + (MODE_LABEL[state.mode] || '') + '完成</div>' +
        '<div class="v4-demo-text">这次你尝试了 ' + state.timeline.length + ' 次动作/表达：</div>' +
        '<ul class="v4-review-list">' + r.lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' +
        '<div class="v4-btn-row"><button class="v4-btn" onclick="V4Teaching.nextMode()">进入下一环节</button>' +
        '<button class="v4-btn v4-btn-ghost" onclick="V4Teaching.close()">完成练习</button></div>';
    }
    // 埋点
    try { if (window.trackAiTrainingCompleted) window.trackAiTrainingCompleted({ scenario_id: state.scenario ? state.scenario.id : 'S001', mode: state.mode }); } catch (e) {}
  }
  function nextMode() {
    var order = ['demo', 'follow', 'open', 'sim'];
    var cur = order.indexOf(state.mode);
    var nxt = order[cur + 1 < order.length ? cur + 1 : 0];
    mode(nxt);
  }
  function addGrowth(n) {
    try {
      if (!window.V3Economy || !window.V3Economy.addGrowth) return;
      window.V3Economy.addGrowth(n, 'V4 教学闭环完成');
    } catch (e) {}
  }

  /* ---------------- 模式入口 ---------------- */
  function mode(m) {
    if (!state.scenario) state.scenario = COURSES['first-meeting-client'].scenario;
    state.startedAt = now();
    state.timeline = [];
    state.over = false;
    state.mode = m;
    updateModeTabs();
    renderTimeline();
    var prompt = $('v4-input-hint');
    if (prompt) prompt.textContent = '①说明：底部动作图标可随时点击、不影响输入 —— 这正是"边说边做"。';
    if (m === 'demo') playDemoNode(0);
    else if (m === 'follow') startFollow();
    else if (m === 'open') startOpen();
    else if (m === 'sim') startSim();
  }

  function updateModeTabs() {
    var tabs = $('v4-modes');
    if (!tabs) return;
    var order = ['demo', 'follow', 'open', 'sim'];
    tabs.innerHTML = order.map(function (k) {
      var active = state.mode === k;
      return '<button class="v4-mode-tab' + (active ? ' on' : '') + '" onclick="V4Teaching.mode(\'' + k + '\')">' + MODE_LABEL[k] + '</button>';
    }).join('');
  }

  /* ---------------- 构建教学模态框（自包含） ---------------- */
  function ensureModal() {
    var m = $('modal-v4-teaching');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'modal-v4-teaching';
    m.className = 'modal-overlay v4-overlay';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(6,4,18,.72);display:none;align-items:center;justify-content:center;z-index:300;padding:12px;';
    m.innerHTML =
      '<div class="v4-shell" style="width:min(96vw,440px);max-height:94vh;background:linear-gradient(160deg,#13102a,#241d4a);border-radius:22px;overflow:hidden;display:flex;flex-direction:column;color:#f4f1ff;box-shadow:0 26px 60px rgba(6,3,20,.6);border:1px solid rgba(255,255,255,.12);">' +
        '<div class="v4-head" style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.10);display:flex;align-items:center;gap:10px;">' +
          '<div style="flex:1;min-width:0;"><div class="v4-title" id="v4-title" style="font-weight:700;font-size:15px;"></div>' +
          '<div class="v4-sub" id="v4-sub" style="font-size:11px;opacity:.7;"></div></div>' +
          '<button style="border:none;background:rgba(255,255,255,.08);color:#fff;border-radius:50%;width:28px;height:28px;cursor:pointer;" onclick="V4Teaching.close()">✕</button>' +
        '</div>' +
        '<div id="v4-modes" class="v4-modes" style="display:flex;gap:6px;padding:10px 14px;"></div>' +
        '<div id="v4-3d-stage" class="v4-stage" style="position:relative;margin:0 12px;height:clamp(230px,40vh,300px);border-radius:16px;overflow:hidden;background:#0d0a1c;border:1px solid rgba(255,255,255,.12);">' +
          '<div id="v4-stage-bubbles" class="challenge-stage-bubble-layer" style="position:absolute;left:10px;right:10px;bottom:10px;top:46px;z-index:4;display:flex;flex-direction:column;justify-content:flex-end;gap:7px;pointer-events:none;"></div>' +
        '</div>' +
        '<div id="v4-demo-panel" class="v4-demo-panel" style="margin:10px 12px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10);display:none;"></div>' +
        '<div id="v4-timeline" class="v4-timeline" style="margin:10px 12px 0;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);max-height:120px;overflow-y:auto;font-size:12px;border:1px solid rgba(255,255,255,.07);"></div>' +
        '<div class="v4-input-hint" id="v4-input-hint" style="margin:8px 16px 0;font-size:10px;opacity:.6;"></div>' +
        '<div class="v4-inputrow" style="display:flex;gap:8px;align-items:center;margin:8px 14px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);">' +
          '<input id="v4-input" style="flex:1;background:none;border:none;outline:none;color:#fff;font-size:13px;min-width:0;" placeholder="输入/说一句话（可边说边点动作）" onkeydown="if(event.key===\'Enter\')V4Teaching.send()">' +
          '<button onclick="V4Teaching.send()" style="border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:6px 12px;font-size:12px;cursor:pointer;">发送</button>' +
        '</div>' +
        '<div class="v4-dock" style="display:flex;gap:8px;justify-content:center;align-items:center;padding:10px 12px 16px;flex-wrap:wrap;background:rgba(8,5,20,.5);border-top:1px solid rgba(255,255,255,.08);">' +
          '<span style="font-size:11px;opacity:.7;margin-right:2px;">边说边做🎬</span>' +
          '<button onclick="V4Teaching.action(\'微笑\')" class="v4-act">😊 微笑</button>' +
          '<button onclick="V4Teaching.action(\'点头\')" class="v4-act">👍 点头</button>' +
          '<button onclick="V4Teaching.action(\'握手\')" class="v4-act">🤝 握手</button>' +
          '<button onclick="V4Teaching.action(\'鞠躬\')" class="v4-act">🙇 鞠躬</button>' +
          '<button onclick="V4Teaching.action(\'挥手\')" class="v4-act">👋 挥手</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(m);
    return m;
  }

  var openState = { mounted: false };

  function open(scenarioKey) {
    var course = COURSES[scenarioKey] || COURSES['first-meeting-client'];
    state.scenario = course.scenario;
    state.mode = null;
    state.timeline = [];
    state.startedAt = now();
    state.over = false;
    seedProfileCourses();

    var m = ensureModal();
    m.style.display = 'flex';
    $('v4-title').textContent = course.lesson.title + ' · ' + course.lesson.chapter;
    $('v4-sub').textContent = '四级教学：' + course.scenario.npcLabel + '，目标 - ' + course.scenario.goal;
    $('v4-input').value = '';
    renderTimeline();

    if (!openState.mounted) {
      openState.mounted = mountStage();
    }
    mode('demo');
    if (document.getElementById('v4-3d-stage') && !document.getElementById('v4-3d-stage').firstElementChild && !openState.mounted) {
      // 兜底提示 3D 不可用时不崩溃
    }
  }

  function close() {
    stopDemo();
    state.over = true;
    var m = $('modal-v4-teaching');
    if (m) m.style.display = 'none';
    if (window.Stage3D && window.Stage3D.dispose) { try { window.Stage3D.dispose(sid()); } catch (e) {} }
    openState.mounted = false;
  }

  /* ---------------- 公开接口 ---------------- */
  window.V4Teaching = {
    open: open, close: close, mode: mode,
    action: function (k) { triggerAction('user', k); },
    send: sendText,
    nextDemo: function () { if (state.demoIdx >= 0 && state.demoIdx < DEMO_TIMELINE.length) playDemoNode(state.demoIdx + 1); },
    followDoAction: function () { nextFollow(); },
    nextFollow: nextFollow,
    review: showReview,
    nextMode: nextMode,
    _state: state
  };
  window.startV4Teaching = open;

  /* ---------------- 运行时包装：礼仪训练模态框注入四级教学入口 ---------------- */
  function injectEtiquetteEntry() {
    var root = $('etiquette-world-map-list');
    if (!root) return;
    if (root.querySelector('.v4-entry-btn')) return;
    var b = document.createElement('div');
    b.style.cssText = 'margin:12px 0 4px;padding:14px;border:1px solid rgba(124,58,237,.28);border-radius:16px;background:linear-gradient(135deg,rgba(124,58,237,.16),rgba(236,72,153,.10));';
    b.innerHTML =
      '<div style="font-weight:700;font-size:13px;color:#241d4a;">🎓 四级教学 · 第一次见客户</div>' +
      '<div style="font-size:11px;color:#5b4a7a;margin:4px 0 10px;">看示范 → 跟练 → 半开放 → 真实模拟；动作与语言同步发生的完整闭环。</div>' +
      '<button class="v4-entry-btn" onclick="V4Teaching.open(\'first-meeting-client\')" style="width:100%;padding:10px;border:none;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:13px;font-weight:600;cursor:pointer;">📖 进入跟练模式</button>' +
      '<div style="font-size:9px;opacity:.55;margin-top:8px;">文案：无"检验/考核/不及格"，只有尝试与复盘。受挫时你的感受是被尊重的。</div>';
    // 插到关卡列表上方
    root.insertBefore(b, root.firstElementChild);
  }

  var origShowEtiquetteTraining = window.showEtiquetteTraining;
  if (typeof origShowEtiquetteTraining === 'function') {
    window.showEtiquetteTraining = function () {
      origShowEtiquetteTraining.apply(this, arguments);
      setTimeout(injectEtiquetteEntry, 60);
    };
  } else {
    window.showEtiquetteTraining = function () { injectEtiquetteEntry(); };
  }

  console.log('[V4] 社交技能教学闭环模块已加载');
})();
