/* =========================================================================
 *  v5_scene_training.js
 *  礼仪训练 — 分步教学流程（ChatGPT 方案 R12）
 *
 *  设计理念：
 *  ───────────────────────────────────────────────────────────────────────
 *  3D 降级为辅助演示组件，教学核心回归：
 *    文字知识 → 动作示范(步骤图) → 话术示范 → 跟练 → 自主回答 → AI评价
 *
 *  训练步骤类型：
 *    intro         场景认识（你在什么情境里）
 *    objectives    学习目标（今天要学会什么）
 *    why           为什么要这样做（知识讲解）
 *    action_demo   动作示范（步骤图 + checklist）
 *    speech_demo   话术示范（参考表达 + 为什么这样说）
 *    follow_prac   跟练（动作 checklist + 话术输入）
 *    ai_roleplay   AI 角色扮演（对话式训练）
 *    evaluation    综合评价（知识 + 语言 + 行为三评价）
 *
 *  使用方式：
 *    SceneTraining.start(levelId)    — 开始训练
 *    SceneTraining.gotoStep(n)        — 跳到第 n 步
 *    SceneTraining.getCurrentStep()   — 获取当前步骤数据
 *
 *  挂载：
 *    window.SceneTraining  (IIFE 导出)
 * ========================================================================= */

(function (global) {
  'use strict';

  if (!global) return;

  const SceneTraining = {
    _level: null,
    _steps: [],
    _stepIdx: 0,
    _answers: {},      // stepIdx -> user input
    _actionDone: {},   // stepIdx -> checklist completion {idx: true}
    _container: null,
  };

  // ──────────────────────────────────────────────────────────────────────
  // 训练模板适配器：从 etiquetteLevels 自动生成多步骤训练流程
  // 9001 有完整手动模板，其余走 adapter 自动生成 6 步流程
  // ──────────────────────────────────────────────────────────────────────

  // 9001 咖啡厅的邂逅 — 完整 8 步模板（ChatGPT 方案原型）
  const TEMPLATE_9001 = [
    { type: 'intro', title: '场景 · 咖啡厅排队的瞬间', content: '你刚搬到新城市，在咖啡厅排队买咖啡。前面的女生忽然回头：\u201c小雨：咦，我们是不是住在同一个小区？我经常在楼下看到你。\u201d', sceneHint: '☕ 咖啡厅 · 同小区邻居 · 第一次主动开口' },
    { type: 'objectives', title: '今天要学会', items: ['用共同点（同小区）自然开场', '给出具体的回应而不是“嗯”', '加一个开放式问题让话题继续', '保持微笑和自然的眼神接触'] },
    { type: 'why', title: '为什么要这样做', points: [
      { q: '为什么要点出“同小区”？', a: '共同点是最安全的开场白。它暗示你们已经有了“弱连接”，让对方觉得“我们不是完全的陌生人”，心理距离一下子就拉近了。' },
      { q: '为什么不能只说“嗯”？', a: '“嗯”是最省力也最不友好的回应。它告诉对方“我接了你的话，但我不想继续这个话题”。一次完整的回应应该包含：确认 + 信息 + 开放问题。' },
      { q: '为什么要加一个开放式问题？', a: '如果只说“是的，我们住在同一个小区”，话题就停在那里了。加一个“你平时也爱来这家咖啡厅吗？”——给对方接话的钩子，话题才能动起来。' }
    ] },
    { type: 'action_demo', title: '动作示范 · 自然开场的 4 个动作',
      whenToDo: '对方主动开口、你需要回应的时候（不是排队刚站好就开始）',
      commonMistakes: ['还没轮到你就提前伸手/开口', '眼睛一直盯着手机不抬头', '身体完全背对对方说话', '表情太严肃或太夸张'],
      actions: [
      { step: 1, icon: '↩️', label: '身体转向对方', tip: '上半身微微转向小雨，不要保持正对前方的姿势' },
      { step: 2, icon: '🧍', label: '保持自然站姿', tip: '双手放松垂在身侧或轻握咖啡杯，不要交叉抱胸（抱胸=防御）' },
      { step: 3, icon: '👀', label: '目光看向对方', tip: '看她的眼睛和鼻子之间的三角区域，每次 3-5 秒就移开一下（避免紧张）' },
      { step: 4, icon: '😊', label: '微笑放松表情', tip: '嘴角微微上扬，不需要大笑或挤眉弄眼——自然就好' }
    ], why: '身体朝向 + 眼神 + 微笑，这三个小动作同时做到，对方立刻会觉得"这个人愿意跟我说话"。它比你说什么话更先被感知。' },
    { type: 'speech_demo', title: '话术示范 · 三档回应', options: [
      { label: 'A · 最好', quality: 'good', text: '是的！我也觉得你面熟，原来我们是邻居啊。你平时也爱来这家咖啡厅吗？', why: '「确认共同点 + 补充信息 + 开放问题」结构完整，既自然又给了对方接话的入口。' },
      { label: 'B · 还行', quality: 'neutral', text: '嗯，对，我住那边。你也住这儿吗？', why: '回应了对方，但信息量偏少，容易让话题停在表面。' },
      { label: 'C · 欠妥', quality: 'cold', text: '哦，你好。（低头看手机）', why: '回避了话题，会让小雨觉得你不想交流。低头看手机是对当前交流最明显的不尊重信号。' }
    ], practicePrompt: '现在用你自己的话，给小雨一个 A 档的回应。不用逐字照搬，自然就好。' },
    { type: 'follow_prac', title: '跟练 · 动作 + 话术一起做', actionChecklist: ['身体转向对方', '保持自然站姿（不抱胸）', '目光和小雨有过交流', '表情放松带微笑'], speechPlaceholder: '在心里默念或小声说出来…', coachHint: '先在脑子里或小声把动作做完，再说出你的回应。完成后勾选左边的动作。' },
    { type: 'ai_roleplay', title: 'AI 角色扮演 · 多轮对话',
      dialogue: [
        { npc: '小雨：（看着你的咖啡杯）你常来吗？我感觉这家环境还不错，但我其实更喜欢街角那家新开的。', practicePrompt: '小雨在聊咖啡厅。你怎么回应？', },
        { npc: '小雨：（眼睛亮了）真的？那家我还没去过！你觉得什么好喝？', practicePrompt: '她感兴趣了，继续推荐吧。' },
        { npc: '小雨：哈哈好，那就这么定了！我叫小雨，你呢？', practicePrompt: '破冰成功！轻松收尾 + 下次见面的钩子。' }
      ] },
    { type: 'evaluation', title: '综合评价', dimensions: ['知识评价（你知不知道应该怎么做）', '语言评价（AI 分析你的表达）', '行为确认（你完成了哪些动作）'] }
  ];

  // Adapter: 从 etiquetteLevels 通用生成 6 步训练流程（除 9001 外）
  function buildStepsFromLevel(level) {
    if (level.id === 9001) return TEMPLATE_9001.slice();

    // 基于 level 数据生成
    const steps = [];
    const focus = level.focus || '';
    const goal = level.goal || '';
    const relation = level.relation || '';
    const opening = level.opening || '';
    const coachAns = level.coachAnswer || '';
    const refReason = level.refReason || '';
    const bestOption = (level.options || []).find(o => o.quality === 'good');

    steps.push({ type: 'intro', title: '场景认识', content: level.story + '\n\n对方开口：' + opening, sceneHint: (level.icon || '🎭') + ' ' + level.title });

    const objItems = [];
    if (focus) focus.split(/[、，,]/).forEach(s => s.trim() && objItems.push(s.trim()));
    if (goal) objItems.push(goal);
    if (objItems.length < 2) { objItems.push('顺利完成本次社交互动', '让对方感到被尊重和被看见'); }
    steps.push({ type: 'objectives', title: '学习目标', items: objItems.slice(0, 4) });

    steps.push({ type: 'why', title: '为什么要这样做', points: [
      { q: '这个场景最容易踩的坑是什么？', a: (level.options || []).filter(o => o.quality === 'cold').map(o => o.text.substring(0, 40) + '…').join('、') || '回避对方 / 表达冷漠' },
      { q: '核心原则是什么？', a: refReason || '在尊重对方的前提下，主动提供信息并推进话题。' },
      { q: '为什么这样说更好？', a: bestOption ? bestOption.why : coachAns }
    ] });

    // 动作示范 — 根据 focus 推断通用动作（含 icon 时间轴风格）
    const actionMap = {
      '微笑': [{step:1,icon:'😊',label:'嘴角微微上扬',tip:'不要假笑或夸张'},{step:2,icon:'👀',label:'目光对视',tip:'看眼睛和鼻子之间，每次3-5秒'},{step:3,icon:'↩️',label:'身体朝向对方',tip:'上半身微转，不要背对'}],
      '眼神': [{step:1,icon:'👀',label:'自然注视对方',tip:'不要盯着手机或天花板'},{step:2,icon:'😌',label:'3-5秒后可以移开',tip:'避免过长对视造成紧张'},{step:3,icon:'👂',label:'对方说话时保持注视',tip:'这是最基本的尊重信号'}],
      '称呼': [{step:1,icon:'🔍',label:'找到合适的称呼',tip:'根据年龄和关系决定'},{step:2,icon:'👋',label:'称呼 + 问候',tip:'不要只称呼不问候'},{step:3,icon:'🎵',label:'语气自然',tip:'不要过于僵硬或谄媚'}],
      '开场': [{step:1,icon:'👀',label:'看向对方',tip:'建立眼神连接再开口'},{step:2,icon:'😊',label:'微笑',tip:'放松的表情让对方也放松'},{step:3,icon:'💬',label:'说问候语',tip:'简短自然，不要长篇大论'},{step:4,icon:'❓',label:'给对方接话的钩子',tip:'问一个开放式问题'}]
    };
    let actions = actionMap['开场'] || [{step:1,icon:'↩️',label:'面向对方',tip:'上半身微转'},{step:2,icon:'😊',label:'微笑放松',tip:'表情自然'},{step:3,icon:'💬',label:'说问候',tip:'先打招呼再说话'}];
    const focusIconMap = {};
    for (const key of Object.keys(actionMap)) {
      if (focus.includes(key)) { actions = actionMap[key]; break; }
    }
    steps.push({ type: 'action_demo', title: '动作示范',
      whenToDo: '在对方说话或需要你回应的时刻',
      commonMistakes: ['还没轮到你就开口', '一直低头不看人', '抱胸/插兜显得不投入', '表情过于僵硬'],
      actions, why: '这是本场景中对方最先注意到的肢体信号。做对了，对方立刻会觉得你"会来事"；做错了，后面说什么都难救。' });

    const opts = (level.options || []).map(o => ({
      label: o.label + ' · ' + ({good:'最好',neutral:'还行',cold:'欠妥'}[o.quality] || ''),
      quality: o.quality, text: o.text, why: o.why
    }));
    steps.push({ type: 'speech_demo', title: '话术示范 · 三档回应', options: opts, practicePrompt: '用你自己的话，给' + (relation.split('·')[1] || '对方') + '一个最好的回应。' });

    steps.push({ type: 'follow_prac', title: '跟练 · 动作 + 话术', actionChecklist: actions.map(a => a.label), speechPlaceholder: '你的回应…', coachHint: '先做动作（在心里或小声说），再说出你的话。完成后勾选动作。' });

    steps.push({ type: 'ai_roleplay', title: 'AI 角色扮演', npcOpening: opening, practicePrompt: '现在由 AI 扮演' + (relation.split('·')[1] || '对方') + '。你可以用文字或语音回应。' });

    steps.push({ type: 'evaluation', title: '综合评价', dimensions: ['知识评价', '语言评价（AI 分析）', '行为确认（你完成了哪些动作）'] });

    return steps;
  }

  // ──────────────────────────────────────────────────────────────────────
  // 渲染主入口
  // ──────────────────────────────────────────────────────────────────────

  function start(levelId) {
    const levels = global.etiquetteLevels || [];
    const level = levels.find(l => String(l.id) === String(levelId));
    if (!level) { console.warn('[SceneTraining] level not found:', levelId, 'available ids:', levels.map(l=>l.id)); return; }

    SceneTraining._level = level;
    SceneTraining._steps = buildStepsFromLevel(level);
    SceneTraining._stepIdx = 0;
    SceneTraining._answers = {};
    SceneTraining._actionDone = {};
    console.log('[SceneTraining] start:', level.id, level.title, 'steps:', SceneTraining._steps.length);

    // 容器定位 — 和 modal-etiquette-training 共存
    let container = document.getElementById('scene-training-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'scene-training-container';
      container.style.cssText = 'flex:1;overflow-y:auto;padding:16px;';
      // 插入到 ct-scroll 之前（在 ct-input-fixed 和 ct-stage-fixed 之间）
      const scrollArea = document.querySelector('#modal-etiquette-training .ct-scroll');
      if (scrollArea && scrollArea.parentNode) {
        scrollArea.parentNode.insertBefore(container, scrollArea);
      }
    }
    SceneTraining._container = container;
    container.style.display = 'block';

    // 隐藏旧 3D stage（可选保留，作为 fallback）
    const oldStage = document.getElementById('etiquette-3d-stage');
    if (oldStage) oldStage.style.display = 'none';

    // 更新 HUD
    updateHUD();

    render();
  }

  function updateHUD() {
    const level = SceneTraining._level;
    const idx = SceneTraining._stepIdx;
    const total = SceneTraining._steps.length;

    const progressEl = document.getElementById('etiquette-stage-progress');
    if (progressEl) progressEl.textContent = (idx + 1) + ' / ' + total;

    // 更新 stage-location 为场景名
    const locEl = document.getElementById('etiquette-stage-location');
    if (locEl) locEl.textContent = (level.icon || '') + ' ' + level.title + ' · Step ' + (idx + 1);
  }

  function render() {
    const container = SceneTraining._container;
    if (!container) return;
    const step = SceneTraining._steps[SceneTraining._stepIdx];
    const level = SceneTraining._level;

    let html = renderStepHeader(level, SceneTraining._stepIdx, SceneTraining._steps.length);

    switch (step.type) {
      case 'intro':         html += renderIntro(step); break;
      case 'objectives':    html += renderObjectives(step); break;
      case 'why':           html += renderWhy(step); break;
      case 'action_demo':   html += renderActionDemo(step); break;
      case 'speech_demo':   html += renderSpeechDemo(step); break;
      case 'follow_prac':   html += renderFollowPrac(step); break;
      case 'ai_roleplay':   html += renderAIRoleplay(step); break;
      case 'evaluation':    html += renderEvaluation(step); break;
      default:              html += '<div class="text-gray-400">未知步骤类型：' + step.type + '</div>';
    }

    html += renderStepNav();

    container.innerHTML = html;
    bindStepEvents();
  }

  // ──────────────────────────────────────────────────────────────────────
  // 每步的 HTML 渲染
  // ──────────────────────────────────────────────────────────────────────

  function renderStepHeader(level, idx, total) {
    const step = SceneTraining._steps[idx];
    const typeIcon = { intro:'📖', objectives:'🎯', why:'💡', action_demo:'🕺', speech_demo:'💬', follow_prac:'✍️', ai_roleplay:'🎭', evaluation:'🏆' }[step.type] || '📝';
    return `<div class="st-step-header" style="text-align:center;margin-bottom:16px;">
      <div style="font-size:28px;margin-bottom:4px;">${typeIcon}</div>
      <div style="font-size:11px;color:#9ca3af;">Step ${idx+1} / ${total}</div>
      <div style="font-size:18px;font-weight:600;color:#1f2937;margin-top:4px;">${step.title || ''}</div>
    </div>`;
  }

  function renderIntro(step) {
    return `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;color:#0369a1;font-weight:600;margin-bottom:8px;">📍 ${step.sceneHint || '场景'}</div>
      <div style="font-size:14px;color:#334155;line-height:1.8;white-space:pre-wrap;">${step.content || ''}</div>
    </div>
    <div style="text-align:center;color:#6b7280;font-size:13px;">
      先了解清楚"你在什么情境里"，后面的动作和话术才有意义。
    </div>`;
  }

  function renderObjectives(step) {
    let items = (step.items || []).map((it, i) =>
      `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px dashed #e5e7eb;">
        <span style="width:24px;height:24px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#d97706;">${i+1}</span>
        <span style="font-size:14px;color:#374151;">${it}</span>
      </div>`
    ).join('');
    return `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px;">
      <div style="font-size:13px;color:#ca8a04;font-weight:600;margin-bottom:8px;">🎯 今天要学会这几件事</div>
      ${items}
    </div>`;
  }

  function renderWhy(step) {
    let points = (step.points || []).map((p, i) =>
      `<div style="margin-bottom:14px;">
        <div style="font-size:14px;font-weight:600;color:#4f46e5;margin-bottom:4px;">Q${i+1}. ${p.q}</div>
        <div style="font-size:14px;color:#374151;line-height:1.8;padding-left:12px;border-left:3px solid #c7d2fe;">${p.a}</div>
      </div>`
    ).join('');
    return `<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px;">
      <div style="font-size:13px;color:#4338ca;font-weight:600;margin-bottom:12px;">💡 为什么要这样做？（理解原理，才能举一反三）</div>
      ${points}
    </div>`;
  }

  function renderActionDemo(step) {
    // 时间轴样式：大圆 icon + 纵向连线 + 每步 label + tip
    let actionsHtml = '';
    (step.actions || []).forEach((a, i) => {
      const isLast = i === (step.actions.length - 1);
      const icon = a.icon || ('①②③④⑤⑥⑦⑧'[i] || (i+1));
      const done = SceneTraining._actionDone[SceneTraining._stepIdx] && SceneTraining._actionDone[SceneTraining._stepIdx][i];
      actionsHtml += `
        <div class="st-action-item" style="display:flex;gap:14px;margin-bottom:0;" data-action-idx="${i}">
          <!-- 左列：icon + 连线 -->
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(99,102,241,.3);">
              ${icon}
            </div>
            ${isLast ? '' : '<div style="width:2px;flex:1;background:#c7d2fe;min-height:20px;"></div>'}
          </div>
          <!-- 右列：label + tip + 完成按钮 -->
          <div style="flex:1;padding-bottom:${isLast?'8px':'20px'};">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <div style="font-size:15px;font-weight:700;color:#1f2937;">Step ${a.step || i+1} · ${a.label}</div>
              <button class="st-action-check" data-action-idx="${i}" style="width:28px;height:28px;border-radius:50%;border:2px solid ${done?'#10b981':'#d1d5db'};background:${done?'#10b981':'transparent'};color:${done?'#fff':'#d1d5db'};font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;" title="我完成了">${done?'✓':''}</button>
            </div>
            <div style="font-size:13px;color:#6b7280;margin-top:4px;line-height:1.6;">💡 ${a.tip}</div>
          </div>
        </div>`;
    });

    // 什么时候做
    const whenBox = step.whenToDo ? `
      <div style="margin-top:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 14px;">
        <div style="font-size:12px;color:#16a34a;font-weight:700;margin-bottom:4px;">⏰ 什么时候做？</div>
        <div style="font-size:13px;color:#166534;">${step.whenToDo}</div>
      </div>` : '';

    // 不要这样
    const mistakesBox = (step.commonMistakes && step.commonMistakes.length) ? `
      <div style="margin-top:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;">
        <div style="font-size:12px;color:#dc2626;font-weight:700;margin-bottom:6px;">❌ 常见错误（避免这样）</div>
        ${step.commonMistakes.map(m => `<div style="font-size:13px;color:#991b1b;padding:3px 0;">· ${m}</div>`).join('')}
      </div>` : '';

    // 为什么重要
    const whyBox = step.why ? `
      <div style="margin-top:12px;background:#fef3c7;border-radius:8px;padding:12px;font-size:13px;color:#92400e;line-height:1.7;">
        <strong>💭 为什么这些动作重要：</strong>${step.why}
      </div>` : '';

    return `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;color:#047857;font-weight:600;margin-bottom:14px;">🕺 动作时间轴 · 跟着做，完成后点右侧 ✓</div>
      ${actionsHtml}
    </div>
    ${whenBox}
    ${mistakesBox}
    ${whyBox}`;
  }

  function renderSpeechDemo(step) {
    let options = (step.options || []).map((o, i) => {
      const colorMap = { good:'#10b981', neutral:'#f59e0b', cold:'#ef4444' };
      const bgMap = { good:'#ecfdf5', neutral:'#fffbeb', cold:'#fef2f2' };
      const borderMap = { good:'#a7f3d0', neutral:'#fde68a', cold:'#fecaca' };
      return `<div class="st-speech-option" style="background:${bgMap[o.quality]};border:1px solid ${borderMap[o.quality]};border-radius:10px;padding:12px;margin-bottom:10px;" data-opt-quality="${o.quality}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="color:${colorMap[o.quality]};font-weight:700;font-size:13px;">${o.label}</span>
        </div>
        <div style="font-size:14px;color:#1f2937;margin-bottom:6px;padding:8px;background:rgba(255,255,255,.6);border-radius:6px;">"${o.text}"</div>
        <div style="font-size:12px;color:#6b7280;">${o.why}</div>
      </div>`;
    }).join('');
    return `<div style="background:#fdf4ff;border:1px solid #f5d0fe;border-radius:12px;padding:16px;">
      <div style="font-size:13px;color:#a21caf;font-weight:600;margin-bottom:12px;">💬 三档回应 · 理解差异，再选你的版本</div>
      ${options}
      <div style="margin-top:12px;padding:10px;background:#faf5ff;border-radius:8px;font-size:13px;color:#6b21a8;">
        🎯 ${step.practicePrompt || '现在想想，你会怎么说？'}
      </div>
    </div>`;
  }

  function renderFollowPrac(step) {
    let checklist = (step.actionChecklist || []).map((c, i) => {
      const done = SceneTraining._actionDone[SceneTraining._stepIdx] && SceneTraining._actionDone[SceneTraining._stepIdx][i];
      return `<label style="display:flex;align-items:center;gap:10px;padding:6px 0;cursor:pointer;">
        <input type="checkbox" class="st-follow-check" data-check-idx="${i}" ${done?'checked':''} style="width:18px;height:18px;accent-color:#6366f1;">
        <span style="font-size:14px;color:#374151;">${c}</span>
      </label>`;
    }).join('');
    const savedAnswer = SceneTraining._answers[SceneTraining._stepIdx] || '';
    return `<div style="margin-bottom:16px;">
      <div style="background:#fef3c7;border-radius:10px;padding:10px;font-size:13px;color:#92400e;margin-bottom:12px;">
        💡 ${step.coachHint || '先做动作，再说你的回应'}
      </div>
      <div style="font-size:13px;color:#6b7280;font-weight:600;margin-bottom:6px;">① 完成这些动作（勾上）</div>
      <div style="background:#f9fafb;border-radius:10px;padding:12px;margin-bottom:14px;">${checklist}</div>
      <div style="font-size:13px;color:#6b7280;font-weight:600;margin-bottom:6px;">② 说出你的回应</div>
      <textarea id="st-follow-input" rows="3" placeholder="${step.speechPlaceholder || '在这里输入…'}" style="width:100%;border:1px solid #e5e7eb;border-radius:10px;padding:10px;font-size:14px;resize:outline-none;">${savedAnswer}</textarea>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="st-voice-btn" style="flex:1;padding:10px;border:1px solid #c7d2fe;background:#eef2ff;border-radius:10px;color:#4338ca;font-size:13px;cursor:pointer;">🎙️ 语音输入</button>
        <button class="st-save-btn" style="flex:1;padding:10px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">保存练习</button>
      </div>
    </div>`;
  }

  function renderAIRoleplay(step) {
    const dp = step.dialogue;
    const hasMultiTurn = Array.isArray(dp) && dp.length > 0;
    // 多轮：维护 SceneTraining._turnIdx
    if (hasMultiTurn && SceneTraining._turnIdx === undefined) SceneTraining._turnIdx = 0;
    const turnIdx = SceneTraining._turnIdx || 0;

    const dialogueBlock = hasMultiTurn ? `
      <div style="margin-bottom:12px;">
        ${dp.slice(0, turnIdx).map((t, i) => `
          <!-- 已完成的对话轮次 -->
          <div style="margin-bottom:8px;">
            <div style="display:flex;gap:10px;margin-bottom:6px;">
              <div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0;">🤖</div>
              <div style="flex:1;background:#ede9fe;border-radius:10px;padding:10px;font-size:13px;color:#4c1d95;">${t.npc}</div>
            </div>
            ${SceneTraining._dialogueAnswers && SceneTraining._dialogueAnswers[i] ? `
              <div style="display:flex;gap:10px;justify-content:flex-end;">
                <div style="background:#dcfce7;border-radius:10px;padding:10px;font-size:13px;color:#166534;max-width:80%;">${SceneTraining._dialogueAnswers[i]}</div>
                <div style="width:28px;height:28px;background:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0;">你</div>
              </div>` : ''}
          </div>`).join('')}
        <!-- 当前轮次 NPC 说话 -->
        <div style="display:flex;gap:10px;margin-bottom:6px;">
          <div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0;">🤖</div>
          <div style="flex:1;background:#ede9fe;border-radius:10px;padding:10px;font-size:13px;color:#4c1d95;box-shadow:0 0 0 2px #a78bfa40;">${dp[turnIdx].npc}</div>
        </div>
      </div>` : `
      <!-- 旧格式：单轮 npcOpening -->
      <div style="display:flex;gap:10px;margin-bottom:8px;">
        <div style="width:28px;height:28px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0;">🤖</div>
        <div style="flex:1;background:#ede9fe;border-radius:10px;padding:10px;font-size:13px;color:#4c1d95;">${step.npcOpening || '（对方开口了…）'}</div>
      </div>`;

    const practicePrompt = hasMultiTurn ? dp[turnIdx].practicePrompt : step.practicePrompt;
    const isLastTurn = hasMultiTurn && turnIdx >= dp.length - 1;

    const savedAnswer = hasMultiTurn && SceneTraining._dialogueAnswers ? SceneTraining._dialogueAnswers[turnIdx] || '' : (SceneTraining._answers[SceneTraining._stepIdx] || '');

    return `<div style="margin-bottom:16px;">
      <!-- 多轮进度 -->
      ${hasMultiTurn ? `
        <div style="display:flex;gap:6px;margin-bottom:10px;align-items:center;">
          ${dp.map((_, i) => `<div style="width:20px;height:6px;border-radius:3px;background:${i<turnIdx?'#10b981':i===turnIdx?'#6366f1':'#e5e7eb'};"></div>`).join('')}
          <span style="font-size:11px;color:#9ca3af;margin-left:6px;">第 ${turnIdx+1} / ${dp.length} 轮</span>
        </div>` : ''}

      ${dialogueBlock}

      <div style="background:#f0fdf4;border-radius:10px;padding:10px;font-size:13px;color:#15803d;margin-bottom:12px;">
        💬 ${practicePrompt || '用你的话回应'}
      </div>
      <textarea id="st-ai-input" rows="3" placeholder="${hasMultiTurn ? '轮到你了…' : '在这里输入你的回应…'}" style="width:100%;border:1px solid #e5e7eb;border-radius:10px;padding:10px;font-size:14px;resize:outline-none;">${savedAnswer}</textarea>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button style="flex:1;padding:10px;border:1px solid #c7d2fe;background:#eef2ff;border-radius:10px;color:#4338ca;font-size:13px;cursor:pointer;" onclick="startEtiquetteVoiceInput()">🎙️ 语音</button>
        <button class="st-ai-send" style="flex:1;padding:10px;border:none;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">${isLastTurn ? '发送 · AI 评价' : '发送 · 下一轮 →'}</button>
      </div>
      <div id="st-ai-feedback" style="margin-top:12px;"></div>
    </div>`;
  }

  function renderEvaluation(step) {
    const answers = SceneTraining._answers;
    const level = SceneTraining._level;
    const userAIInput = answers['ai_roleplay'] || answers[SceneTraining._steps.findIndex(s=>s.type==='ai_roleplay')];
    const userFollowInput = answers['follow_prac'] || answers[SceneTraining._steps.findIndex(s=>s.type==='follow_prac')];
    const allUserInput = userAIInput || userFollowInput || '';
    const bestOpt = (level.options || []).find(o => o.quality === 'good');
    const coldOpt = (level.options || []).find(o => o.quality === 'cold');

    // ── 行为确认汇总 ──
    let totalChecks = 0, doneChecks = 0;
    Object.values(SceneTraining._actionDone).forEach(obj => {
      if (!obj) return;
      Object.values(obj).forEach(v => { totalChecks++; if (v) doneChecks++; });
    });
    const actionPercent = totalChecks > 0 ? Math.round(doneChecks / totalChecks * 100) : 0;
    const actionProgressColor = actionPercent >= 80 ? '#10b981' : actionPercent >= 50 ? '#f59e0b' : '#ef4444';

    // ── 语言评价（多维度） ──
    let langDims = [];
    if (allUserInput) {
      const text = allUserInput;
      const hasQuestion = /[？?]/.test(text) || text.includes('吗') || text.includes('是不是') || text.includes('你呢');
      const hasInfo = text.length >= 15;
      const hasGreeting = /你好|您好|hi|hello|很高兴/.test(text.toLowerCase());
      const hasAvoid = /手机|低头|不知道|随便/.test(text);
      const lenScore = Math.min(100, text.length / 50 * 100);
      langDims = [
        { label: '场景匹配', score: hasAvoid ? 25 : (hasInfo ? 80 : 50), desc: hasAvoid ? '出现了回避类词汇，建议避免' : (hasInfo ? '回应符合场景预期' : '回应偏短，信息量不够') },
        { label: '表达自然度', score: lenScore, desc: text.length >= 20 ? '长度合适，语气自然' : '可以再丰富一点' },
        { label: '礼貌程度', score: hasGreeting ? 85 : (text.length >= 10 ? 70 : 50), desc: hasGreeting ? '包含问候/礼貌用语' : (text.length >= 10 ? '基本得体' : '礼貌信号不足') },
        { label: '对话推进力', score: hasQuestion ? 90 : 40, desc: hasQuestion ? '✓ 包含开放式问题，话题能继续' : '建议加一个"你呢？"或"你平时…"来推进话题' }
      ];
    }

    // 语言评价总分
    const langAvg = langDims.length ? Math.round(langDims.reduce((s, d) => s + d.score, 0) / langDims.length) : null;

    // ── 知识评价（内置选择题） ──
    // 用 level.options 生成 A/B/C 题
    const quizOptions = (level.options || []).map((o, i) => ({
      key: String.fromCharCode(65 + i),  // A, B, C
      quality: o.quality,
      text: o.text.substring(0, 80) + (o.text.length > 80 ? '…' : '')
    }));

    const savedQuizAnswer = SceneTraining._quizAnswer || null;

    let quizHtml = `<div id="st-quiz-block">
      <div style="font-size:14px;font-weight:700;color:#1f2937;margin-bottom:10px;">第 1 题 · 知识小测验</div>
      <div style="font-size:13px;color:#6b7280;margin-bottom:10px;">面对这个场景，下面哪个回应最合适？</div>`;
    quizOptions.forEach(opt => {
      const isSaved = savedQuizAnswer === opt.key;
      const isCorrect = savedQuizAnswer && opt.quality === 'good';
      const isWrong = savedQuizAnswer && isSaved && opt.quality !== 'good';
      let bg = '#f9fafb', border = '#e5e7eb', fg = '#374151';
      if (savedQuizAnswer) {
        if (opt.quality === 'good') { bg = '#ecfdf5'; border = '#a7f3d0'; fg = '#065f46'; }
        if (isWrong) { bg = '#fef2f2'; border = '#fecaca'; fg = '#991b1b'; }
      }
      quizHtml += `<button class="st-quiz-opt" data-qkey="${opt.key}" data-qquality="${opt.quality}"
        style="display:block;width:100%;text-align:left;padding:10px 14px;margin-bottom:8px;background:${bg};border:2px solid ${border};border-radius:10px;font-size:13px;color:${fg};cursor:pointer;transition:all .15s;"
        ${savedQuizAnswer ? 'disabled' : ''}>
        <span style="font-weight:700;margin-right:8px;">${opt.key}.</span>${opt.text}
        ${savedQuizAnswer && opt.quality === 'good' ? ' ✅' : ''}
        ${isWrong ? ' ❌' : ''}
      </button>`;
    });
    if (savedQuizAnswer) {
      const correctKey = quizOptions.find(o => o.quality === 'good')?.key;
      const isRight = savedQuizAnswer === correctKey;
      quizHtml += `<div style="margin-top:8px;padding:10px;border-radius:8px;background:${isRight?'#ecfdf5':'#fef2f2'};font-size:13px;color:${isRight?'#065f46':'#991b1b'};">
        ${isRight ? '🎉 答对了！你理解了这个场景的核心原则。' : `差一点。正确答案是 ${correctKey}。${bestOpt ? '原因：' + bestOpt.why : ''}`}
      </div>`;
    } else {
      quizHtml += `<div style="font-size:12px;color:#9ca3af;margin-top:6px;">选一个，看看你掌握了多少</div>`;
    }
    quizHtml += `</div>`;

    // ── 总评 ──
    let overallScore = 0, overallLabel = '', overallDesc = '';
    const hasAnyInput = allUserInput.length > 0 || savedQuizAnswer || actionPercent > 0;
    if (hasAnyInput) {
      // 综合分：行为 30% + 语言 40% + 知识 30%
      let actionScore = actionPercent * 0.3;
      let langScore = (langAvg || 50) * 0.4;
      let quizScore = savedQuizAnswer ? ((quizOptions.find(o => o.key === savedQuizAnswer)?.quality === 'good') ? 100 : 30) * 0.3 : 50 * 0.3;
      overallScore = Math.round(actionScore + langScore + quizScore);
      if (overallScore >= 80) { overallLabel = '🌟 优秀'; overallDesc = '你已经掌握了这个场景的核心动作和话术。下次可以挑战更复杂的分支情况（比如对方忽然被人叫走）。'; }
      else if (overallScore >= 60) { overallLabel = '👍 良好'; overallDesc = '基础已经打好了。重点改进建议：让回应信息更丰富 + 加一个开放式问题。'; }
      else if (overallScore >= 40) { overallLabel = '📚 需要加强'; overallDesc = '建议回到"为什么要这样做"那一步再看一遍，然后重新跟练一次。'; }
      else { overallLabel = '💪 继续努力'; overallDesc = '先理解场景的核心原则，再逐一把动作和话术练熟。急不来的。'; }
    }

    // 组装
    let html = `<div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:48px;margin-bottom:8px;">🏆</div>
      <div style="font-size:16px;font-weight:600;color:#1f2937;">训练完成！来看看你的三种评价</div>
      ${hasAnyInput ? `<div style="margin-top:8px;font-size:28px;font-weight:800;background:linear-gradient(135deg,#6366f1,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${overallScore} / 100</div>
        <div style="font-size:13px;color:#6b7280;">${overallLabel} — ${overallDesc}</div>` : ''}
    </div>`;

    // ① 知识评价（选择题）
    html += `<div style="background:#f0f9ff;border-radius:12px;padding:14px;margin-bottom:12px;">
      <div style="font-size:13px;color:#0369a1;font-weight:600;margin-bottom:10px;">📚 ① 知识评价 · 你知不知道应该怎么做？</div>
      ${quizHtml}
    </div>`;

    // ② 语言评价（多维度）
    if (langDims.length) {
      let barsHtml = langDims.map(d => {
        const barColor = d.score >= 75 ? '#10b981' : d.score >= 50 ? '#f59e0b' : '#ef4444';
        return `<div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
            <span style="color:#374151;font-weight:600;">${d.label}</span>
            <span style="color:${barColor};font-weight:700;">${d.score}</span>
          </div>
          <div style="background:#f3f4f6;border-radius:4px;height:6px;overflow:hidden;">
            <div style="width:${d.score}%;background:${barColor};height:100%;border-radius:4px;transition:width .4s;"></div>
          </div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">${d.desc}</div>
        </div>`;
      }).join('');
      html += `<div style="background:#fdf4ff;border-radius:12px;padding:14px;margin-bottom:12px;">
        <div style="font-size:13px;color:#a21caf;font-weight:600;margin-bottom:10px;">💬 ② 语言评价 · AI 分析你的表达</div>
        ${barsHtml}
        <div style="font-size:11px;color:#9ca3af;margin-top:8px;padding-top:8px;border-top:1px dashed #e5e7eb;">基于你在「AI 角色扮演」中输入的回应做的启发式分析，真实项目会调 AI API</div>
      </div>`;
    } else {
      html += `<div style="background:#fdf4ff;border-radius:12px;padding:14px;margin-bottom:12px;">
        <div style="font-size:13px;color:#a21caf;font-weight:600;margin-bottom:6px;">💬 ② 语言评价</div>
        <div style="font-size:13px;color:#6b7280;">在「AI 角色扮演」那一步输入你的回应后，这里会出现多维度分析。</div>
      </div>`;
    }

    // ③ 行为确认（汇总）
    html += `<div style="background:#fefce8;border-radius:12px;padding:14px;margin-bottom:12px;">
      <div style="font-size:13px;color:#ca8a04;font-weight:600;margin-bottom:10px;">🕺 ③ 行为确认 · 你完成了哪些动作</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="font-size:36px;font-weight:800;color:${actionProgressColor};">${actionPercent}%</div>
        <div style="flex:1;">
          <div style="background:#fef3c7;border-radius:6px;height:10px;overflow:hidden;">
            <div style="width:${actionPercent}%;background:${actionProgressColor};height:100%;border-radius:6px;transition:width .4s;"></div>
          </div>
          <div style="font-size:11px;color:#92400e;margin-top:4px;">${doneChecks} / ${totalChecks} 个动作已确认</div>
        </div>
      </div>
      <div style="font-size:12px;color:#6b7280;margin-top:6px;">
        ${actionPercent === 100 ? '全部完成！你在脑子里/现实中把每个动作都过了一遍。' :
          actionPercent >= 60 ? '大部分完成了。没勾的动作是哪一步还没跟上？' :
          '别跳步 — 回去把每个动作都过一遍，再回来。'}
      </div>
    </div>`;

    // 底部操作
    html += `<div style="text-align:center;padding-top:8px;">
      <button onclick="SceneTraining.gotoStep(0)" style="padding:10px 20px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font-size:13px;cursor:pointer;margin-right:8px;">🔄 从头重练</button>
      <button onclick="SceneTraining.gotoStep(SceneTraining._steps.findIndex(s=>s.type==='ai_roleplay'))" style="padding:10px 20px;border:1px solid #c7d2fe;border-radius:10px;background:#eef2ff;color:#4338ca;font-size:13px;cursor:pointer;margin-right:8px;">🎭 再练一次 AI</button>
      <button onclick="closeModal('etiquette-training')" style="padding:10px 20px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:13px;font-weight:600;cursor:pointer;">✅ 完成训练</button>
    </div>`;

    return html;
  }

  function renderStepNav() {
    const idx = SceneTraining._stepIdx;
    const total = SceneTraining._steps.length;
    const isLast = idx >= total - 1;
    const isFirst = idx === 0;

    let dots = '';
    for (let i = 0; i < total; i++) {
      dots += `<div onclick="SceneTraining.gotoStep(${i})" style="width:10px;height:10px;border-radius:50%;background:${i===idx?'#6366f1':'#d1d5db'};cursor:pointer;transition:all .2s;"></div>`;
    }

    return `<div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;margin-top:16px;border-top:1px solid #f3f4f6;">
      <button onclick="SceneTraining.prev()" ${isFirst?'disabled':''} style="padding:8px 18px;border:1px solid #e5e7eb;border-radius:10px;background:${isFirst?'#f9fafb':'#fff'};color:${isFirst?'#d1d5db':'#374151'};cursor:${isFirst?'not-allowed':'pointer'};font-size:13px;">← 上一步</button>
      <div style="display:flex;gap:6px;">${dots}</div>
      <button onclick="SceneTraining.next()" ${isLast?'disabled':''} style="padding:8px 18px;border:none;border-radius:10px;background:${isLast?'#f3f4f6':'linear-gradient(135deg,#6366f1,#8b5cf6)'};color:${isLast?'#d1d5db':'#fff'};cursor:${isLast?'not-allowed':'pointer'};font-size:13px;font-weight:600;">${isLast?'已完成':'下一步 →'}</button>
    </div>`;
  }

  // ──────────────────────────────────────────────────────────────────────
  // 事件绑定（渲染后调用）
  // ──────────────────────────────────────────────────────────────────────

  function bindStepEvents() {
    const idx = SceneTraining._stepIdx;
    const step = SceneTraining._steps[idx];
    const stepType = step.type;

    // 动作步骤勾选
    document.querySelectorAll('.st-action-check').forEach(btn => {
      btn.addEventListener('click', function () {
        const aIdx = parseInt(this.dataset.actionIdx, 10);
        SceneTraining._actionDone[idx] = SceneTraining._actionDone[idx] || {};
        SceneTraining._actionDone[idx][aIdx] = !SceneTraining._actionDone[idx][aIdx];
        const done = SceneTraining._actionDone[idx][aIdx];
        this.style.background = done ? '#10b981' : 'transparent';
        this.style.color = done ? '#fff' : '#d1d5db';
        this.textContent = done ? '✓' : '';
      });
    });

    // 跟练 checklist
    document.querySelectorAll('.st-follow-check').forEach(cb => {
      cb.addEventListener('change', function () {
        const cIdx = parseInt(this.dataset.checkIdx, 10);
        SceneTraining._actionDone[idx] = SceneTraining._actionDone[idx] || {};
        SceneTraining._actionDone[idx][cIdx] = this.checked;
      });
    });

    // 跟练保存
    const saveBtn = document.querySelector('.st-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        const input = document.getElementById('st-follow-input');
        if (input) {
          SceneTraining._answers[idx] = input.value;
          SceneTraining._answers['follow_prac'] = input.value;  // 类型 key，evaluation 能找到
          this.textContent = '✅ 已保存';
          setTimeout(() => { this.textContent = '保存练习'; }, 1500);
        }
      });
    }

    // AI 评价发送（单轮 + 多轮）
    const aiSend = document.querySelector('.st-ai-send');
    if (aiSend) {
      aiSend.addEventListener('click', function () {
        const input = document.getElementById('st-ai-input');
        const text = input ? input.value.trim() : '';
        const feedback = document.getElementById('st-ai-feedback');
        if (!text) { feedback.innerHTML = '<div style="color:#ef4444;font-size:13px;">请输入你的回应</div>'; return; }
        this.textContent = '发送中…';

        // 简单启发式评价（真实项目会调 AI API）
        const quality = evaluateResponse(text, SceneTraining._level);

        // 多轮模式
        const step = SceneTraining._steps[idx];
        const hasMulti = Array.isArray(step.dialogue) && step.dialogue.length > 0;
        if (hasMulti) {
          SceneTraining._turnIdx = SceneTraining._turnIdx || 0;
          SceneTraining._dialogueAnswers = SceneTraining._dialogueAnswers || {};
          SceneTraining._dialogueAnswers[SceneTraining._turnIdx] = text;

          if (SceneTraining._turnIdx < step.dialogue.length - 1) {
            // 不是最后一轮 → 跳到下一轮
            SceneTraining._turnIdx++;
            setTimeout(() => {
              render();  // 重渲染进入下一轮
            }, 400);
          } else {
            // 最后一轮 → 存 ai_roleplay 类型 key 用于最终评价 + 显示评价
            SceneTraining._answers[idx] = text;
            SceneTraining._answers['ai_roleplay'] = text;
            SceneTraining._answers['ai_roleplay_full'] = Object.values(SceneTraining._dialogueAnswers || {}).join('\n');
            setTimeout(() => {
              feedback.innerHTML = `<div style="background:${quality.bg};border:1px solid ${quality.border};border-radius:10px;padding:12px;font-size:13px;color:${quality.fg};line-height:1.8;">
                <strong>${quality.title}</strong><br>${quality.desc}<br><span style="color:#6b7280;font-size:11px;margin-top:6px;display:block;">多轮对话完成！下一步进入综合评价。</span>
              </div>`;
              this.textContent = '✓ 已完成多轮对话';
            }, 600);
          }
        } else {
          // 单轮模式
          SceneTraining._answers[idx] = text;
          SceneTraining._answers['ai_roleplay'] = text;
          setTimeout(() => {
            feedback.innerHTML = `<div style="background:${quality.bg};border:1px solid ${quality.border};border-radius:10px;padding:12px;font-size:13px;color:${quality.fg};line-height:1.8;">
              <strong>${quality.title}</strong><br>${quality.desc}
            </div>`;
            this.textContent = '✓ 已评价';
          }, 600);
        }
      });
    }

    // 知识评价选择题
    document.querySelectorAll('.st-quiz-opt').forEach(btn => {
      btn.addEventListener('click', function () {
        const qkey = this.dataset.qkey;
        SceneTraining._quizAnswer = qkey;
        render();  // 重新渲染，显示对错
      });
    });
  }

  // 简单启发式评价（MVP，真实项目调 AI）
  function evaluateResponse(text, level) {
    const goodOpt = (level.options || []).find(o => o.quality === 'good');
    const coldOpt = (level.options || []).find(o => o.quality === 'cold');
    const textLower = text.toLowerCase();

    // 检查是否和"低头看手机"类似回避
    const redFlags = ['嗯', '哦', '你好', 'hi', 'hello'];
    if (text.length < 8 || (text.length < 20 && redFlags.some(w => textLower.includes(w)))) {
      return { title: '⚠ 你的回应偏短', desc: 'AI 分析：回应信息量较少，对方可能不知道怎么接。试试加上你们的共同点和一个开放式问题。', bg: '#fef2f2', border: '#fecaca', fg: '#dc2626' };
    }
    if (text.includes('手机') || text.includes('低头') || textLower.includes('ignore')) {
      return { title: '❌ 不建议这样做', desc: '回避对方的姿态会让对方觉得你不想交流。', bg: '#fef2f2', border: '#fecaca', fg: '#dc2626' };
    }
    // 检查是否有提问
    const hasQuestion = /[？?]/.test(text) || text.includes('吗') || text.includes('是不是');
    if (hasQuestion && text.length >= 20) {
      return { title: '✅ 做得好！', desc: 'AI 分析：你的回应包含了信息 + 开放式问题，对方有接话的入口。继续保持！', bg: '#ecfdf5', border: '#a7f3d0', fg: '#059669' };
    }
    if (text.length >= 15) {
      return { title: '😊 基本合适', desc: 'AI 分析：回应可以，但如果能加一个"你呢？"或"你平时…"的开放式问题，会让话题更自然地继续。', bg: '#fffbeb', border: '#fde68a', fg: '#b45309' };
    }
    return { title: '📝 可以试试再具体一点', desc: '参考表达：' + (goodOpt ? goodOpt.text.substring(0, 60) + '…' : ''), bg: '#f0f9ff', border: '#bae6fd', fg: '#0369a1' };
  }

  // ──────────────────────────────────────────────────────────────────────
  // 公共 API
  // ──────────────────────────────────────────────────────────────────────

  SceneTraining.start = start;
  SceneTraining.gotoStep = function (n) {
    if (n < 0 || n >= SceneTraining._steps.length) return;
    SceneTraining._stepIdx = n;
    updateHUD();
    render();
  };
  SceneTraining.next = function () {
    if (SceneTraining._stepIdx < SceneTraining._steps.length - 1) {
      SceneTraining.gotoStep(SceneTraining._stepIdx + 1);
    }
  };
  SceneTraining.prev = function () {
    if (SceneTraining._stepIdx > 0) {
      SceneTraining.gotoStep(SceneTraining._stepIdx - 1);
    }
  };
  SceneTraining.getCurrentStep = function () { return SceneTraining._steps[SceneTraining._stepIdx]; };
  SceneTraining.getProgress = function () { return { idx: SceneTraining._stepIdx, total: SceneTraining._steps.length }; };

  global.SceneTraining = SceneTraining;

})(window);
