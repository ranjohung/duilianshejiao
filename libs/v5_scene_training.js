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
    _container: null,    saveChallenge: function () {
      const root = document.getElementById('scene-training-container');
      if (!root) return;
      const note = root.querySelector('#st-reality-note');
      const feeling = root.querySelector('#st-reality-feeling');
      const text = note ? note.value.trim() : '';
      if (!text) { if (typeof global.showToast === 'function') global.showToast('先写下你准备在哪里完成，或回来后的真实经历。'); return; }
      const level = SceneTraining._level || {};
      const done = Object.values(SceneTraining._actionDone || {}).reduce((n, row) => n + Object.values(row || {}).filter(Boolean).length, 0);
      const total = (SceneTraining._steps || []).reduce((n, step) => n + (Array.isArray(step.actions) ? step.actions.length : 0) + (Array.isArray(step.actionChecklist) ? step.actionChecklist.length : 0), 0) || Object.values(SceneTraining._actionDone || {}).reduce((n, row) => n + Object.keys(row || {}).length, 0);
      const behaviorPercent = total ? Math.round(done / total * 100) : 0;
      const dialogueTurns = Object.keys(SceneTraining._dialogueAnswers || {}).length;
      const challenge = behaviorPercent < 100 ? '现实中完成全部行为清单，并说出一句完整回应' : (dialogueTurns < 2 ? '现实中用完整句回应，并加入一个开放式问题' : '现实中练习一次临时变化下的自然回应');
      const branchLabel = SceneTraining._branchLabel || '';
      const recommendation = done < 2 ? '再练一次：动作时间轴与行为确认' : (text.length < 12 ? '再练一次：用完整句回应并推进话题' : (branchLabel ? '下一练：继续练习“' + branchLabel + '”后的自然回应' : '下一练：加入对方临时打断或不同意见的分支'));
      const item = { levelId: level.id || 9001, scene: level.title || '礼仪场景', challenge: challenge, note: text, feeling: feeling ? feeling.value : '', dialogueTurns: Object.keys(SceneTraining._dialogueAnswers || {}).length, dialogue: SceneTraining._dialogueAnswers || {}, behaviorDone: done, behaviorTotal: total, behaviorPercent: behaviorPercent, recommendation: recommendation, branch: branchLabel, createdAt: Date.now() };
      let log = []; try { log = JSON.parse(localStorage.getItem('duilian_challenge_log') || '[]'); } catch (e) {}
      log.unshift(item); localStorage.setItem('duilian_challenge_log', JSON.stringify(log.slice(0, 50)));
      localStorage.setItem('duilian_next_training', JSON.stringify({ levelId: level.id || 9001, scene: level.title || '礼仪场景', recommendation: recommendation, source: 'scene-training', createdAt: Date.now() }));
      localStorage.setItem('duilian_etiquette_completed_' + level.id, JSON.stringify({ scene: level.title || '礼仪场景', completedAt: Date.now(), behaviorPercent: behaviorPercent, dialogueTurns: Object.keys(SceneTraining._dialogueAnswers || {}).length }));
      SceneTraining.clearProgress();
      window.dispatchEvent(new CustomEvent('v5-recommendation-refresh'));
      const out = root.querySelector('#st-reality-result');
      if (out) out.innerHTML = '<strong>已保存现实记录</strong><br>下一次建议：' + recommendation;
      const btn = root.querySelector('#st-save-reality'); if (btn) { btn.textContent = '✅ 已保存，可继续复盘'; btn.disabled = true; }
    },
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
      ], branches: [
        { label: '对方临时打断', npc: '小雨：不好意思，我临时要接个电话，我们晚点再聊可以吗？', practicePrompt: '先表示理解，再自然约定下一次继续交流。' },
        { label: '对方提出不同意见', npc: '小雨：不过我觉得那家咖啡厅有点贵，你怎么看？', practicePrompt: '先接住对方的不同意见，再表达你的理由，不要急着否定。' },
        { label: '自然结束话题', npc: '小雨：今天聊得很开心，我要先走了。', practicePrompt: '用简短、礼貌的话回应，并留下自然的告别。' }
      ] },
    { type: 'evaluation', title: '综合评价', dimensions: ['知识评价（你知不知道应该怎么做）', '语言评价（AI 分析你的表达）', '行为确认（你完成了哪些动作）'] }
  ];

  // ──────────────────────────────────────────────────────────────────────
  // Adapter: 从 etiquetteLevels + ETIQUETTE_TURN_CONTENT 构建 8 步完整流程
  // 9001 保留手动 TEMPLATE_9001（最详细），其余走 adapter 但现在也生成多轮 dialogue
  // ──────────────────────────────────────────────────────────────────────

  // action_id → emoji + label 的映射（用于构建动作时间轴）
  const ACTION_ICON_MAP = {
    'turn':  { icon: '↩️', label: '身体转向对方', tip: '上半身微转，不要背对，保持半侧身' },
    'nod':   { icon: '🤝', label: '自然点头示意', tip: '轻点 1-2 下，不要像捣蒜' },
    'listen':{ icon: '👂', label: '认真倾听姿态', tip: '看着对方，不要低头或玩手机，适时点头' },
    'wave':  { icon: '👋', label: '微笑告别/举手示意', tip: '自然挥一下，不要夸张' },
    'bow':   { icon: '🙇', label: '起身微微鞠躬/致谢', tip: '长辈或正式场合，幅度不需要太大' },
    'raise': { icon: '🥂', label: '举杯示意', tip: '杯沿低于对方，说祝福语再喝/碰一下' },
    'step':  { icon: '🚶', label: '站位引导/上前', tip: '保持 1-1.5 米安全距离，不要贴太近' },
    'clap':  { icon: '👏', label: '鼓掌回应', tip: '节奏自然，不要太刻意' },
    'stand': { icon: '🧍', label: '保持正确站姿', tip: '双脚与肩同宽，不要抱胸或插兜' },
    'hand':  { icon: '🤲', label: '双手递接物品', tip: '名片/文件用双手，文字朝上对方易读' },
  };

  // 根据 action id 获取 icon 配置，未知的给一个通用默认
  function getActionMeta(actionId, fallbackLabel) {
    if (ACTION_ICON_MAP[actionId]) return ACTION_ICON_MAP[actionId];
    // 根据 id 猜一下
    const guess = {
      'sit':   { icon: '🪑', label: '等待/入座', tip: '等主人示意再坐，不要抢主位' },
      'greet': { icon: '👋', label: '礼貌问候', tip: '称呼 + 问候语，语气自然' },
      'smile': { icon: '😊', label: '微笑放松', tip: '嘴角上扬，表情自然不僵硬' },
      'speak': { icon: '💬', label: '清晰表达', tip: '语速适中，咬字清楚，声音洪亮' },
      'think': { icon: '🤔', label: '停顿思考', tip: '不要急着回答，3 秒沉默比草率回答好' },
      'leave': { icon: '👋', label: '礼貌告别', tip: '感谢 + 道别语 + 礼貌退出' },
    };
    if (guess[actionId]) return guess[actionId];
    return { icon: '🎯', label: fallbackLabel || actionId, tip: '注意动作的力度和时机' };
  }

  function buildStepsFromLevel(level) {
    if (level.id === 9001) return TEMPLATE_9001.slice();

    const steps = [];
    const focus = level.focus || '';
    const goal = level.goal || '';
    const relation = level.relation || '';
    const opening = level.opening || '';
    const coachAns = level.coachAnswer || '';
    const refReason = level.refReason || '';
    const bestOption = (level.options || []).find(o => o.quality === 'good');
    const coldOptions = (level.options || []).filter(o => o.quality === 'cold');

    // ETIQUETTE_TURN_CONTENT 数据（可能没有的场景 fallback 到空数组）
    const turnContent = (global.ETIQUETTE_TURN_CONTENT || {})[level.id] || [];
    const npcName = relation.split('·')[1] || '对方';  // 从 relation 提取 NPC 名字

    // ────────── Step 1: intro ──────────
    steps.push({
      type: 'intro', title: '场景 · ' + level.title,
      content: level.story + '\n\n对方开口：' + opening,
      sceneHint: (level.icon || '🎭') + ' ' + level.title + ' · ' + (level.category || '')
    });

    // ────────── Step 2: objectives ──────────
    const objItems = [];
    // 从 turnContent 的 title 推导具体目标
    if (turnContent.length > 0) {
      const titles = turnContent.map(t => t[0]);
      titles.forEach(t => { if (t.length >= 2) objItems.push('掌握"' + t + '"环节'); });
    }
    // 加上 focus 拆分的核心点
    if (focus) focus.split(/[、，,]/).forEach(s => {
      const t = s.trim();
      if (t && !objItems.find(o => o.includes(t.substring(0, 3)))) objItems.push(t);
    });
    if (goal && !objItems.includes(goal)) objItems.push(goal);
    // 保底
    if (objItems.length < 2) { objItems.push('顺利完成本次社交互动', '让对方感到被尊重'); }
    steps.push({ type: 'objectives', title: '今天要学会', items: objItems.slice(0, 4) });

    // ────────── Step 3: why ──────────
    const points = [
      { q: '这个场景最容易踩的坑是什么？',
        a: coldOptions.length ? coldOptions.map(o => o.text.substring(0, 45) + '…').join('、') : '回避对方 / 表达冷漠' },
      { q: '核心原则是什么？',
        a: refReason || '在尊重对方的前提下，主动提供信息并推进话题。' }
    ];
    if (bestOption) {
      points.push({ q: '为什么"' + bestOption.label + '"是更好的回应？', a: bestOption.why });
    }
    steps.push({ type: 'why', title: '为什么要这样做', points });

    // ────────── Step 4: action_demo（从 turnContent 构建） ──────────
    const actActions = [];
    // 开场固定 2 步
    actActions.push({ step: 1, icon: '👀', label: '看向对方 + 微笑', tip: '先建立眼神连接，表情放松自然' });
    actActions.push({ step: 2, icon: '💬', label: '问候/打招呼', tip: '称呼 + 问候语，不要上来就说正事' });
    // 从 turnContent 追加每个环节的动作
    turnContent.forEach((t, i) => {
      const actionId = t[2];  // 第3项是 action id
      const actionName = t[3]; // 第4项是 actionName
      const meta = getActionMeta(actionId, actionName);
      actActions.push({ step: actActions.length + 1, icon: meta.icon, label: actionName || meta.label, tip: meta.tip });
    });
    // 收尾动作（如果 turnContent 最后没有 wave/bow）
    const lastAction = turnContent.length > 0 ? turnContent[turnContent.length - 1][2] : '';
    if (!['wave', 'bow', 'raise'].includes(lastAction)) {
      actActions.push({ step: actActions.length + 1, icon: '👍', label: '确认/收尾', tip: '完成关键环节后自然过渡到下一步' });
    }
    // whenToDo 从场景类别推断
    const sceneCategory = (level.category || '');
    const whenMap = {
      '商务': '在迎接、交流、送别三个关键节点分别做对应的动作',
      '家庭': '进门问候、入座、餐桌交流、告别四个环节',
      '职场': '问候开场 + 提问/汇报 + 确认收尾',
      '约会': '开场破冰 → 话题推进 → 礼貌结束',
      '服务': '欢迎 → 观察需求 → 提供帮助 → 欢送',
    };
    let whenToDo = '在对方说话或需要你回应的时刻';
    for (const kw of Object.keys(whenMap)) { if (sceneCategory.includes(kw)) { whenToDo = whenMap[kw]; break; } }

    steps.push({
      type: 'action_demo', title: '动作示范 · ' + (level.title || '') + ' 的完整动作链',
      whenToDo,
      commonMistakes: ['还没轮到你就提前开口', '眼睛一直盯着手机/不抬头', '身体背对对方说话', '表情太严肃或太夸张', '动作时机不对（太早/太晚）'],
      actions: actActions,
      why: '这些动作会在你说话之前就传递出信号：对方立刻会感觉"这个人会不会来事"。先做对动作，再说对内容。'
    });

    // ────────── Step 5: speech_demo ──────────
    const opts = (level.options || []).map(o => ({
      label: o.label + ' · ' + ({good:'最好',neutral:'还行',cold:'欠妥'}[o.quality] || ''),
      quality: o.quality, text: o.text, why: o.why
    }));
    steps.push({
      type: 'speech_demo', title: '话术示范 · 三档回应', options: opts,
      practicePrompt: '现在用你自己的话，给' + npcName + '一个 A 档的回应。不用逐字照搬，自然就好。'
    });

    // ────────── Step 6: follow_prac ──────────
    steps.push({
      type: 'follow_prac', title: '跟练 · 动作 + 话术一起做',
      actionChecklist: actActions.map(a => a.label),
      speechPlaceholder: '在心里默念或小声说出来…',
      coachHint: '先在脑子里或小声把动作做完，再说出你的回应。完成后勾选左边的动作。'
    });

    // ────────── Step 7: ai_roleplay（★ 多轮 dialogue！末轮强依赖上下文 ★） ──────────
    const dialogue = [];
    if (turnContent.length > 0) {
      // 第 1 轮：level.opening（对方开场）
      dialogue.push({
        npc: opening,
        practicePrompt: '这是开场。用你的话给' + npcName + '一个自然的回应。'
      });
      // 第 2-N 轮：从 turnContent 构建
      turnContent.forEach((t, i) => {
        const npcLine = t[1];  // npc 说的话
        const guide = t[4];    // 方法/指导
        const title = t[0];    // 环节名
        const last = i === turnContent.length - 1;
        if (last) {
          // 末轮：practicePrompt 必须强依赖上文（按 Experience 2179623）
          const prevTitles = turnContent.slice(0, i).map(x => x[0]).join('、');
          dialogue.push({
            npc: npcLine + '（前面已经聊过' + prevTitles + '了，现在到了关键的"' + title + '"环节）',
            practicePrompt: '前面你已经回应过' + prevTitles + '了。现在' + npcName + '说这句话，你的回应要**衔接前面聊过的内容**，不能像第一次见面。想想之前你们说过什么，在回应里自然带出来。'
          });
        } else {
          dialogue.push({
            npc: npcLine,
            practicePrompt: '这是"' + title + '"环节。' + guide + ' 你的回应要自然推进话题。'
          });
        }
      });
    } else {
      // fallback: 单轮
      dialogue.push({ npc: opening, practicePrompt: '用你的话给对方一个回应。' });
    }

    steps.push({
      type: 'ai_roleplay', title: 'AI 角色扮演 · 多轮对话',
      dialogue,
      npcOpening: opening,
      practicePrompt: '现在由 AI 扮演' + npcName + '。你可以用文字或语音回应。',
      branches: [
        { label: '对方临时打断', npc: npcName + '：不好意思，我临时要离开一下，我们稍后继续可以吗？', practicePrompt: '先表示理解，再约定稍后继续。' },
        { label: '对方提出异议', npc: npcName + '：我不太确定你的看法，你能再解释一下吗？', practicePrompt: '先确认对方的疑问，再用一句清晰的话补充说明。' },
        { label: '对方准备结束', npc: npcName + '：今天先聊到这里，谢谢你。', practicePrompt: '礼貌回应并自然结束，不要突然中断。' }
      ]
    });

    // ────────── Step 8: evaluation ──────────
    steps.push({ type: 'evaluation', title: '综合评价', dimensions: ['知识评价（你知不知道应该怎么做）', '语言评价（AI 分析你的表达）', '行为确认（你完成了哪些动作）'] });

    return steps;
  }

  // ──────────────────────────────────────────────────────────────────────
  // 渲染主入口
  // ──────────────────────────────────────────────────────────────────────

  function courseNpcLine(context) {
    const topic = String((context.courseTitle || '') + ' ' + (context.knowledgePoint || '') + ' ' + (context.category || ''));
    const rules = [
      [/握手|见面|问候|称呼|迎接/, '对方：您好，很高兴认识您。'],
      [/敬酒|酒桌|饭局|宴请|祝酒/, '同席者：今天大家难得聚在一起，您方便举杯吗？'],
      [/座次|入座|就座|乘车|座位/, '来访者：请问我坐在哪里比较合适？'],
      [/电梯|引导|开门|带路/, '来访者：请问会议室往哪边走？'],
      [/门店|顾客|导购|销售|客户|成交|拜访/, '客户：我想先了解一下，暂时还没有决定。'],
      [/面试|求职|应聘/, '面试官：请用一两分钟介绍一下自己。'],
      [/汇报|演讲|致辞|表达/, '听众：你刚才提到的重点，可以再具体说明一下吗？'],
      [/送礼|礼物|收礼/, '对方：谢谢你还想着我，这份心意我收到了。'],
      [/拒绝|边界|请求|求助/, '对方：这件事你能不能帮我一下？'],
      [/倾听|情绪|安慰|共情/, '对方：最近这件事让我有些烦，想听听你的看法。'],
      [/冲突|分歧|异议|道歉|批评/, '对方：我对刚才的处理不太认同，你怎么看？'],
      [/电话|通话/, '对方：您好，请问您是哪位？'],
      [/家庭|亲友|相亲|约会/, '对方：最近过得怎么样？你最近在忙些什么？']
    ];
    const matched = rules.find(([pattern]) => pattern.test(topic));
    if (matched) return matched[1];
    const point = String(context.knowledgePoint || context.courseTitle || '这件事').replace(/[“”"<>]/g, '').slice(0, 40);
    return '对方：关于“' + point + '”，我想听听你的想法。';
  }

  function buildCourseDrivenSteps(level, context) {
    const esc = global.escapeCardText || function (value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    };
    const source = String(context.sourceText || '');
    const title = String(context.courseTitle || '本课程');
    const point = String(context.knowledgePoint || '当前知识点');
    const npc = courseNpcLine(context);
    const sceneNote = '练习情景由软件依据课程主题设计，不是原资料原文；具体规则只以本课原文为依据。';
    const sourceLabel = esc(title) + ' · ' + esc(point);
    const sourceHtml = esc(source);
    return [
      {
        type: 'intro', title: '本次课程 · ' + esc(point),
        sceneHint: esc(context.category || '社交技能') + ' · 课程驱动练习',
        content: esc(npc) + '\n\n' + esc(sceneNote),
        courseSource: { label: sourceLabel, text: sourceHtml }
      },
      {
        type: 'objectives', title: '先从课程中找依据',
        items: ['指出原文中与当前情境相关的做法', '只按原文明确写出的顺序和边界练习', '用自己的话回应；原文未说明的细节先确认']
      },
      {
        type: 'why', title: '本次练习依据',
        points: [
          { q: '课程原文（保持原句）', a: sourceHtml },
          { q: '练习范围', a: esc(sceneNote) }
        ]
      },
      {
        type: 'action_demo', title: '行为跟练 · 对照原文',
        whenToDo: '在开始回应前，先确认现实关系、场合和对方的意愿。',
        commonMistakes: ['把模拟情景当成原文规则', '把课程没有说明的细节说成固定礼仪', '忽略对方拒绝或不方便的信号'],
        actions: [
          { step: 1, icon: '📖', label: '从原文找出适用内容', tip: '确认原文明确写了什么；不要用猜测补充课程规则。' },
          { step: 2, icon: '🧭', label: '确认场景和对方边界', tip: '把课程方法放进当前关系与场合，留意对方是否愿意继续。' },
          { step: 3, icon: '💬', label: '用自己的话自然回应', tip: '表达后给对方回应空间，再根据真实情况调整。' }
        ],
        why: '动作和话术练习都要回到当前课程原文；此处没有摄像头动作识别。'
      },
      {
        type: 'speech_demo', title: '话术准备 · 先理解再表达',
        options: [], coursePractice: true,
        practicePrompt: '结合上方课程原文，先确定你要遵循的做法，再组织自己的回应。不要背诵或补造原文没有的规则。'
      },
      {
        type: 'follow_prac', title: '跟练 · 行为确认与表达',
        actionChecklist: ['我已在原文中找到本次回应的依据', '我已考虑场景关系和对方边界'],
        speechPlaceholder: '写下或说出你的自然回应…',
        coachHint: '这是自我跟练记录，系统不会假称看见了你的动作。完成后可回到原文核对。'
      },
      {
        type: 'ai_roleplay', title: '真实情景对话 · 课程主题练习',
        dialogue: [{
          npc: esc(npc),
          practicePrompt: '请按本课原文回应。完成后指出你依据的原文内容；若原文没有覆盖情景中的细节，可以先询问，不要自行编成课程规定。'
        }],
        practicePrompt: '使用本课知识回应；课程原文在前面的步骤中可以查看。'
      },
      { type: 'evaluation', title: '练习复盘 · 回到课程原文', courseContext: true }
    ];
  }

  function start(levelId, lessonContext) {
    const levels = global.etiquetteLevels || [];
    const level = levels.find(l => String(l.id) === String(levelId));
    if (!level) { console.warn('[SceneTraining] level not found:', levelId, 'available ids:', levels.map(l=>l.id)); return; }

    SceneTraining._level = level;
    SceneTraining._lessonContext = lessonContext && lessonContext.sourceText ? lessonContext : null;
    SceneTraining._steps = SceneTraining._lessonContext
      ? buildCourseDrivenSteps(level, SceneTraining._lessonContext)
      : buildStepsFromLevel(level);
    SceneTraining._stepIdx = 0;
    SceneTraining._answers = {};
    SceneTraining._actionDone = {};
    SceneTraining._turnIdx = 0;
    SceneTraining._dialogueAnswers = {};
    SceneTraining._branchUsed = false;
    SceneTraining._branchLabel = '';
    SceneTraining._quizAnswer = null;
    SceneTraining._progressKey = 'duilian_scene_progress_' + level.id;
    SceneTraining._resumed = false;
    try { const saved = JSON.parse(localStorage.getItem(SceneTraining._progressKey) || 'null'); if (saved && saved.scene === level.title) { SceneTraining._resumed = true; SceneTraining._stepIdx = Math.min(Number(saved.stepIdx) || 0, SceneTraining._steps.length - 1); SceneTraining._answers = saved.answers || {}; SceneTraining._actionDone = saved.actionDone || {}; SceneTraining._turnIdx = saved.turnIdx || 0; SceneTraining._dialogueAnswers = saved.dialogueAnswers || {}; SceneTraining._branchUsed = !!saved.branchUsed; SceneTraining._branchLabel = saved.branchLabel || ''; SceneTraining._quizAnswer = saved.quizAnswer || null; } } catch (e) {}
if (SceneTraining._branchUsed && SceneTraining._branchLabel) {
      const restoredAI = SceneTraining._steps.find(function (item) { return item.type === 'ai_roleplay'; });
      const restoredBranch = restoredAI && (restoredAI.branches || []).find(function (item) { return item.label === SceneTraining._branchLabel; });
      if (restoredAI && restoredBranch && !(restoredAI.dialogue || []).some(function (item) { return item.npc === restoredBranch.npc; })) {
        restoredAI.dialogue = (restoredAI.dialogue || []).concat([{ npc: restoredBranch.npc, practicePrompt: restoredBranch.practicePrompt }]);
      }
      if (restoredAI) SceneTraining._turnIdx = Math.min(SceneTraining._turnIdx, restoredAI.dialogue.length - 1);
    }
    console.log('[SceneTraining] start:', level.id, level.title, 'steps:', SceneTraining._steps.length);

    // 容器定位 — 和 modal-etiquette-training 共存
    const duplicateContainers = document.querySelectorAll('#scene-training-container');
    duplicateContainers.forEach((node, i) => { if (i > 0) node.remove(); });
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
    let container = SceneTraining._container;
    if (!container || !container.isConnected) {
      container = document.getElementById('scene-training-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'scene-training-container';
        container.style.cssText = 'flex:1;overflow-y:auto;padding:16px;';
        const scrollArea = document.querySelector('#modal-etiquette-training .ct-scroll');
        if (scrollArea && scrollArea.parentNode) scrollArea.parentNode.insertBefore(container, scrollArea);
      }
      SceneTraining._container = container;
      container.style.display = 'block';
    }
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
      ${SceneTraining._resumed ? '<div style="display:inline-block;margin-top:8px;padding:5px 9px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:11px;">↩ 已恢复上次进度</div>' : ''}
      <div style="font-size:18px;font-weight:600;color:#1f2937;margin-top:4px;">${step.title || ''}</div>
    </div>`;
  }

  function renderIntro(step) {
    const source = step.courseSource ? `<div style="margin-top:14px;background:#fff;border:1px solid #c7d2fe;border-radius:10px;padding:12px;"><strong>课程原文依据 · ${step.courseSource.label}</strong><pre style="white-space:pre-wrap;font:inherit;line-height:1.8;margin:8px 0 0;">${step.courseSource.text}</pre></div>` : '';
    return `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;color:#0369a1;font-weight:600;margin-bottom:8px;">📍 ${step.sceneHint || '场景'}</div>
      <div style="font-size:14px;color:#334155;line-height:1.8;white-space:pre-wrap;">${step.content || ''}</div>${source}
    </div>
    <div style="text-align:center;color:#6b7280;font-size:13px;">
      ${step.courseSource ? '本次模拟台词与课程原文分开标示；请只依据课程原文学习规则。' : '先了解清楚"你在什么情境里"，后面的动作和话术才有意义。'}
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
    const actionDoneCount = Object.values(SceneTraining._actionDone[SceneTraining._stepIdx] || {}).filter(Boolean).length;
    const actionTotalCount = (step.actions || []).length;
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
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#047857;font-weight:600;margin-bottom:14px;"><span>🕺 动作时间轴 · 跟着做，完成后点右侧 ✓</span><span id="st-action-progress" style="font-size:11px;color:#047857;">已完成 ${actionDoneCount} / ${actionTotalCount}</span></div>
      ${actionsHtml}
    </div>
    ${whenBox}
    ${mistakesBox}
    ${whyBox}`;
  }

  function renderSpeechDemo(step) {
    if (step.coursePractice) return `<div style="background:#fdf4ff;border:1px solid #f5d0fe;border-radius:12px;padding:16px;"><div style="font-size:13px;color:#a21caf;font-weight:600;margin-bottom:12px;">💬 话术准备</div><p style="font-size:14px;line-height:1.8;color:#374151;">${step.practicePrompt}</p><p style="font-size:12px;color:#6b7280;">参考依据：前一步展示的课程原文。情景台词是练习设计，不能当成原文示例。</p></div>`;
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
    const followDone = Object.values(SceneTraining._actionDone[SceneTraining._stepIdx] || {}).filter(Boolean).length;
    const followTotal = (step.actionChecklist || []).length;
    return `<div style="margin-bottom:16px;">
      <div style="background:#fef3c7;border-radius:10px;padding:10px;font-size:13px;color:#92400e;margin-bottom:12px;">
        💡 ${step.coachHint || '先做动作，再说你的回应'}
      </div>
<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#6b7280;font-weight:600;margin-bottom:6px;"><span>① 完成这些动作（勾上）</span><span id="st-follow-progress" style="font-size:11px;color:#6366f1;">已完成 ${followDone} / ${followTotal}</span></div>
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
    const submitLabel = SceneTraining._lessonContext
      ? '提交回答 · 查看课程对照提示'
      : (isLastTurn ? '发送 · AI 评价' : '发送 · 下一轮 →');

    const savedAnswer = hasMultiTurn && SceneTraining._dialogueAnswers ? SceneTraining._dialogueAnswers[turnIdx] || '' : (SceneTraining._answers[SceneTraining._stepIdx] || '');

    return `<div style="margin-bottom:16px;">
      <!-- 多轮进度 -->
      ${hasMultiTurn ? `
        <div style="display:flex;gap:6px;margin-bottom:10px;align-items:center;">
          ${dp.map((_, i) => `<div style="width:20px;height:6px;border-radius:3px;background:${i<turnIdx?'#10b981':i===turnIdx?'#6366f1':'#e5e7eb'};"></div>`).join('')}
          <span style="font-size:11px;color:#9ca3af;margin-left:6px;">第 ${turnIdx+1} / ${dp.length} 轮</span>
        </div>` : ''}

      ${dialogueBlock}

      ${isLastTurn && Array.isArray(step.branches) && step.branches.length && !SceneTraining._branchUsed ? `<div style="margin:10px 0;padding:10px;border:1px solid #fed7aa;border-radius:10px;background:#fff7ed;"><div style="font-size:12px;color:#c2410c;font-weight:700;margin-bottom:7px;">🧩 选择一个情境变化，继续练习</div>${step.branches.map((b,i)=>`<button class="st-branch-btn" data-branch-idx="${i}" style="display:block;width:100%;text-align:left;padding:8px 10px;margin-top:5px;border:1px solid #fdba74;border-radius:8px;background:#fff;color:#9a3412;cursor:pointer;font-size:12px;">${b.label}</button>`).join('')}</div>` : ''}
      <div style="background:#f0fdf4;border-radius:10px;padding:10px;font-size:13px;color:#15803d;margin-bottom:12px;">
        💬 ${practicePrompt || '用你的话回应'}
      </div>
      <textarea id="st-ai-input" rows="3" placeholder="${hasMultiTurn ? '轮到你了…' : '在这里输入你的回应…'}" style="width:100%;border:1px solid #e5e7eb;border-radius:10px;padding:10px;font-size:14px;resize:outline-none;">${savedAnswer}</textarea>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button style="flex:1;padding:10px;border:1px solid #c7d2fe;background:#eef2ff;border-radius:10px;color:#4338ca;font-size:13px;cursor:pointer;" onclick="startEtiquetteVoiceInput()">🎙️ 语音</button>
        <button class="st-ai-send" style="flex:1;padding:10px;border:none;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">${submitLabel}</button>
      </div>
      <div id="st-ai-feedback" style="margin-top:12px;"></div>
    </div>`;
  }

function renderEvaluation(step) {
    // 到达综合评价即记录课堂完成里程碑；现实挑战稍后再填也不会丢失课程进度。
    try {
      const key = 'duilian_etiquette_completed_' + (SceneTraining._level && SceneTraining._level.id);
      const previous = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify(Object.assign({}, previous, {
        scene: (SceneTraining._level && SceneTraining._level.title) || '礼仪场景',
        evaluationReachedAt: previous.evaluationReachedAt || Date.now(),
        behaviorPercent: previous.behaviorPercent || 0,
        dialogueTurns: previous.dialogueTurns || Object.keys(SceneTraining._dialogueAnswers || {}).length
      })));
    } catch (e) {}
    const courseDriven = !!(step.courseContext && SceneTraining._lessonContext);
    const courseContextNote = courseDriven ? `<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:14px;margin-bottom:12px;line-height:1.7;"><strong style="color:#3730a3;">📘 课程原文对照</strong><p style="font-size:12px;color:#475569;margin:6px 0;">下面的回应来自练习情景；请指出它对应的课程原文依据。原文没有覆盖的细节，不要把模拟台词当成礼仪规则。</p><pre style="white-space:pre-wrap;font:inherit;background:#fff;padding:9px;border-radius:8px;font-size:12px;color:#334155;">${global.escapeCardText ? global.escapeCardText(SceneTraining._lessonContext.sourceText || '') : String(SceneTraining._lessonContext.sourceText || '')}</pre></div>` : '';
    const answers = SceneTraining._answers;
    const level = SceneTraining._level;
    const userAIInput = answers['ai_roleplay'] || answers[SceneTraining._steps.findIndex(s=>s.type==='ai_roleplay')];
    const userFollowInput = answers['follow_prac'] || answers[SceneTraining._steps.findIndex(s=>s.type==='follow_prac')];
    const courseSelfCheck = answers['course_source_check'] || '';
    const allUserInput = userAIInput || userFollowInput || '';
    const bestOpt = (level.options || []).find(o => o.quality === 'good');
    const coldOpt = (level.options || []).find(o => o.quality === 'cold');

    let html = courseContextNote;

    // ── 行为确认汇总 ──
    let doneChecks = 0;
    Object.values(SceneTraining._actionDone).forEach(obj => {
      if (!obj) return;
      Object.values(obj).forEach(v => { if (v) doneChecks++; });
    });
    const definedChecks = (SceneTraining._steps || []).reduce((n, item) => n + (Array.isArray(item.actions) ? item.actions.length : 0) + (Array.isArray(item.actionChecklist) ? item.actionChecklist.length : 0), 0);
    const recordedChecks = Object.values(SceneTraining._actionDone).reduce((n, obj) => n + Object.keys(obj || {}).length, 0);
    const totalChecks = definedChecks || recordedChecks;
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
    const courseKnowledgeScore = courseDriven ? (courseSelfCheck.length >= 12 ? 100 : (courseSelfCheck ? 50 : 0)) : null;

    // ── 知识评价：课程模式只做原文自查，避免复用其他场景的选项 ──
    const quizOptions = courseDriven ? [] : (level.options || []).map((o, i) => ({
      key: String.fromCharCode(65 + i), quality: o.quality,
      text: o.text.substring(0, 80) + (o.text.length > 80 ? '…' : '')
    }));
    const savedQuizAnswer = courseDriven ? null : (SceneTraining._quizAnswer || null);
    let quizHtml = courseDriven
      ? `<div id="st-quiz-block" style="padding:10px;background:#fff;border-radius:8px;font-size:12px;color:#475569;line-height:1.7;"><strong style="display:block;color:#0369a1;margin-bottom:5px;">📚 课程原文自查</strong><div>请从课程原文中找出：本轮回应依据了哪条规则？如果原文没有覆盖该细节，请记录“需要进一步确认”，不要自行补充礼仪标准。</div><textarea id="st-course-source-check" rows="3" placeholder="写下你依据的原文规则…" style="width:100%;margin-top:8px;border:1px solid #c7d2fe;border-radius:8px;padding:8px;font-size:12px;resize:vertical;">${SceneTraining._answers.course_source_check || ''}</textarea><button class="st-course-check-save" style="margin-top:7px;padding:7px 10px;border:0;border-radius:8px;background:#4f46e5;color:#fff;font-size:11px;cursor:pointer;">保存知识自查</button><span id="st-course-check-result" style="margin-left:8px;color:#047857;font-size:11px;"></span></div>`
      : `<div id="st-quiz-block"><div style="font-size:14px;font-weight:700;color:#1f2937;margin-bottom:10px;">第 1 题 · 知识小测验</div><div style="font-size:13px;color:#6b7280;margin-bottom:10px;">面对这个场景，下面哪个回应最合适？</div>`;
    if (!courseDriven) {
      quizOptions.forEach(opt => {
        const isSaved = savedQuizAnswer === opt.key;
        const isWrong = savedQuizAnswer && isSaved && opt.quality !== 'good';
        let bg = '#f9fafb', border = '#e5e7eb', fg = '#374151';
        if (savedQuizAnswer) { if (opt.quality === 'good') { bg = '#ecfdf5'; border = '#a7f3d0'; fg = '#065f46'; } if (isWrong) { bg = '#fef2f2'; border = '#fecaca'; fg = '#991b1b'; } }
        quizHtml += `<button class="st-quiz-opt" data-qkey="${opt.key}" data-qquality="${opt.quality}" style="display:block;width:100%;text-align:left;padding:10px 14px;margin-bottom:8px;background:${bg};border:2px solid ${border};border-radius:10px;font-size:13px;color:${fg};cursor:pointer;" ${savedQuizAnswer ? 'disabled' : ''}><span style="font-weight:700;margin-right:8px;">${opt.key}.</span>${opt.text}${savedQuizAnswer && opt.quality === 'good' ? ' ✅' : ''}${isWrong ? ' ❌' : ''}</button>`;
      });
      if (savedQuizAnswer) {
        const correctKey = quizOptions.find(o => o.quality === 'good')?.key;
        const isRight = savedQuizAnswer === correctKey;
        quizHtml += `<div style="margin-top:8px;padding:10px;border-radius:8px;background:${isRight?'#ecfdf5':'#fef2f2'};font-size:13px;color:${isRight?'#065f46':'#991b1b'};">${isRight ? '🎉 答对了！你理解了这个场景的核心原则。' : `差一点。正确答案是 ${correctKey}。${bestOpt ? '原因：' + bestOpt.why : ''}`}</div>`;
      } else quizHtml += `<div style="font-size:12px;color:#9ca3af;margin-top:6px;">选一个，看看你掌握了多少</div>`;
      quizHtml += `</div>`;
    }
if (courseDriven) {
      quizHtml += `<div style="margin-top:8px;font-size:11px;color:#0369a1;">知识自查完成度：<span id="st-course-knowledge-score">${courseKnowledgeScore}/100</span></div>`;
    }    // ── 总评 ──
    let overallScore = 0, overallLabel = '', overallDesc = '';
    const hasAnyInput = allUserInput.length > 0 || savedQuizAnswer || actionPercent > 0;
    if (hasAnyInput) {
      // 综合分：行为 30% + 语言 40% + 知识 30%
      let actionScore = actionPercent * 0.3;
      let langScore = (langAvg || 50) * 0.4;
      let quizScore = courseDriven ? (courseKnowledgeScore || 0) * 0.3 : (savedQuizAnswer ? ((quizOptions.find(o => o.key === savedQuizAnswer)?.quality === 'good') ? 100 : 30) * 0.3 : 50 * 0.3);
      overallScore = Math.round(actionScore + langScore + quizScore);
      if (overallScore >= 80) { overallLabel = '🌟 优秀'; overallDesc = '你已经掌握了这个场景的核心动作和话术。下次可以挑战更复杂的分支情况（比如对方忽然被人叫走）。'; }
      else if (overallScore >= 60) { overallLabel = '👍 良好'; overallDesc = '基础已经打好了。重点改进建议：让回应信息更丰富 + 加一个开放式问题。'; }
      else if (overallScore >= 40) { overallLabel = '📚 需要加强'; overallDesc = '建议回到"为什么要这样做"那一步再看一遍，然后重新跟练一次。'; }
      else { overallLabel = '💪 继续努力'; overallDesc = '先理解场景的核心原则，再逐一把动作和话术练熟。急不来的。'; }
    }

    // 组装
    html += `<div style="text-align:center;margin-bottom:16px;">
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

    const challengeText = actionPercent < 100
      ? '今天找一个低压力场景，按动作清单完成全部动作，再说出一句完整回应。'
      : (langAvg !== null && langAvg < 65
        ? '今天找一个熟悉的人，练习“礼貌回应 + 具体信息 + 一个开放问题”，不追求完美。'
        : '今天找一个真实场景，练习本课动作，并在对方出现变化时保持自然回应。');    const draftNextRecommendation = actionPercent < 100
      ? '先补齐动作时间轴，再进行下一轮对话。'
      : (langAvg !== null && langAvg < 65 ? '用完整句回应，并加入一个开放式问题。' : '挑战一次对方临时打断或提出不同意见。');
    html += `<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:12px 14px;margin-bottom:12px;"><div style="font-size:13px;color:#6d28d9;font-weight:700;">🧭 下一练预告</div><div style="font-size:12px;color:#5b21b6;margin-top:5px;line-height:1.6;">${draftNextRecommendation}</div></div>`;
    // ── 课堂 → 现实：挑战记录与下一练推荐 ──
    html += `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:14px;margin-bottom:12px;">
      <div style="font-size:13px;color:#047857;font-weight:700;margin-bottom:6px;">🌱 课堂 → 现实挑战</div>
      <div style="font-size:12px;color:#065f46;line-height:1.6;margin-bottom:8px;">${challengeText} 不需要完美，回来记录真实发生了什么。</div>
      <textarea id="st-reality-note" placeholder="在哪里？发生了什么？（也可以先写下准备挑战的场景）" style="width:100%;min-height:64px;border:1px solid #bbf7d0;border-radius:9px;padding:9px;font-size:12px;resize:vertical;"></textarea>
      <select id="st-reality-feeling" style="margin-top:8px;width:100%;border:1px solid #bbf7d0;border-radius:9px;padding:8px;font-size:12px;background:#fff;"><option value="">当时感觉（可选）</option><option>紧张</option><option>一般</option><option>比较自然</option><option>很轻松</option></select>
      <button id="st-save-reality" onclick="SceneTraining.saveChallenge()" style="margin-top:9px;padding:9px 14px;border:0;border-radius:9px;background:#059669;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">保存现实记录</button>
      <div id="st-reality-result" style="margin-top:8px;font-size:12px;color:#047857;"></div>
    </div>`;
    // 底部操作
    html += `<div style="text-align:center;padding-top:8px;">
      <button onclick="SceneTraining._resumed=false;SceneTraining.gotoStep(0);SceneTraining.clearProgress()" style="padding:10px 20px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font-size:13px;cursor:pointer;margin-right:8px;">🔄 从头重练</button>
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
        const currentlyDone = !!SceneTraining._actionDone[idx][aIdx];
        if (!currentlyDone && aIdx > 0) {
          const previousDone = Array.from({ length: aIdx }, (_, i) => !!SceneTraining._actionDone[idx][i]).every(Boolean);
          if (!previousDone) {
            if (typeof global.showToast === 'function') global.showToast('请先完成前面的动作，再进入这一步。');
            return;
          }
        }
        SceneTraining._actionDone[idx][aIdx] = !currentlyDone;
        const done = SceneTraining._actionDone[idx][aIdx];
        const progress = document.getElementById('st-action-progress');
        if (progress) progress.textContent = '已完成 ' + Object.values(SceneTraining._actionDone[idx] || {}).filter(Boolean).length + ' / ' + (step.actions || []).length;
        this.style.background = done ? '#10b981' : 'transparent';
        this.style.color = done ? '#fff' : '#d1d5db';
        this.textContent = done ? '✓' : '';
        SceneTraining.persistProgress();
      });
    });

    // 跟练 checklist
    document.querySelectorAll('.st-follow-check').forEach(cb => {
      cb.addEventListener('change', function () {
        const cIdx = parseInt(this.dataset.checkIdx, 10);
        SceneTraining._actionDone[idx] = SceneTraining._actionDone[idx] || {};
        SceneTraining._actionDone[idx][cIdx] = this.checked;
        const progress = document.getElementById('st-follow-progress');
        if (progress) { const done = Object.values(SceneTraining._actionDone[idx] || {}).filter(Boolean).length; progress.textContent = '已完成 ' + done + ' / ' + (step.actionChecklist || []).length; }
        SceneTraining.persistProgress();
      });
    });

    // 跟练保存
    const saveBtn = document.querySelector('.st-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        const input = document.getElementById('st-follow-input');
        if (input) {
          SceneTraining._answers[idx] = input.value;
          SceneTraining._answers['follow_prac'] = input.value;
          const done = Object.values(SceneTraining._actionDone[idx] || {}).filter(Boolean).length;
          const total = (step.actionChecklist || []).length;
          SceneTraining.persistProgress();
          this.textContent = done === total && input.value.trim() ? '✅ 动作与话术已保存' : '⚠ 已保存，建议补完动作';
          setTimeout(() => { this.textContent = '保存练习'; }, 1500);
        }
      });
    }
    // 情境分支：把用户选择的突发情况追加为下一轮
    document.querySelectorAll('.st-branch-btn').forEach(btn => btn.addEventListener('click', function () {
      const branch = step.branches && step.branches[parseInt(this.dataset.branchIdx, 10)];
      if (!branch) return;
      step.dialogue = (step.dialogue || []).concat([{ npc: branch.npc, practicePrompt: branch.practicePrompt }]);
      SceneTraining._branchUsed = true;
      SceneTraining._branchLabel = branch.label || '';
      SceneTraining._turnIdx = step.dialogue.length - 1;
      SceneTraining.persistProgress();
      render();
    }));
    // AI 评价发送（单轮 + 多轮）
    const aiSend = document.querySelector('.st-ai-send');
    if (aiSend) {
      aiSend.addEventListener('click', function () {
        const input = document.getElementById('st-ai-input');
        const text = input ? input.value.trim() : '';
        const feedback = document.getElementById('st-ai-feedback');
        if (!text) { feedback.innerHTML = '<div style="color:#ef4444;font-size:13px;">请输入你的回应</div>'; return; }
        this.textContent = '发送中…';

        // 课程驱动的本地练习不调用启发式评分，也不冒称 AI 评价。
        const courseDriven = !!SceneTraining._lessonContext;
        const quality = evaluateResponse(text, SceneTraining._level);

        // 多轮模式
        const step = SceneTraining._steps[idx];
        const hasMulti = Array.isArray(step.dialogue) && step.dialogue.length > 0;
        if (hasMulti) {
          SceneTraining._turnIdx = SceneTraining._turnIdx || 0;
          SceneTraining._dialogueAnswers = SceneTraining._dialogueAnswers || {};
          SceneTraining._dialogueAnswers[SceneTraining._turnIdx] = text;
          SceneTraining.persistProgress();

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
              feedback.innerHTML = courseDriven
                ? '<div style="background:${quality.bg};border:1px solid ${quality.border};border-radius:10px;padding:12px;font-size:13px;color:${quality.fg};line-height:1.8;"><strong>${quality.title}</strong><br>${quality.desc}<br><span style="color:#64748b;font-size:11px;">这是基于本课规则的即时反馈；进入复盘可继续对照课程原文。</span></div>'
                : `<div style="background:${quality.bg};border:1px solid ${quality.border};border-radius:10px;padding:12px;font-size:13px;color:${quality.fg};line-height:1.8;">
                  <strong>${quality.title}</strong><br>${quality.desc}<br><span style="color:#6b7280;font-size:11px;margin-top:6px;display:block;">多轮对话完成！下一步进入综合评价。</span>
                </div>`;
              this.textContent = courseDriven ? '✓ 已记录本轮回应' : '✓ 已完成多轮对话';
            }, 600);
          }
        } else {
          // 单轮模式
          SceneTraining._answers[idx] = text;
          SceneTraining._answers['ai_roleplay'] = text;
          setTimeout(() => {
            feedback.innerHTML = courseDriven
              ? '<div style="background:${quality.bg};border:1px solid ${quality.border};border-radius:10px;padding:12px;font-size:13px;color:${quality.fg};line-height:1.8;"><strong>${quality.title}</strong><br>${quality.desc}<br><span style="color:#64748b;font-size:11px;">这是基于本课规则的即时反馈；进入复盘可继续对照课程原文。</span></div>'
              : `<div style="background:${quality.bg};border:1px solid ${quality.border};border-radius:10px;padding:12px;font-size:13px;color:${quality.fg};line-height:1.8;">
                <strong>${quality.title}</strong><br>${quality.desc}
              </div>`;
            this.textContent = courseDriven ? '✓ 已记录本轮回应' : '✓ 已评价';
          }, 600);
        }
      });
    }

    // 课程原文自查保存
    const courseCheckBtn = document.querySelector('.st-course-check-save');
    if (courseCheckBtn) courseCheckBtn.addEventListener('click', function () {
      const input = document.getElementById('st-course-source-check');
      SceneTraining._answers.course_source_check = input ? input.value.trim() : '';
      SceneTraining.persistProgress();
      const result = document.getElementById('st-course-check-result');
      const score = document.getElementById('st-course-knowledge-score');
      if (score) score.textContent = (SceneTraining._answers.course_source_check.length >= 12 ? 100 : (SceneTraining._answers.course_source_check ? 50 : 0)) + '/100';
      if (result) result.textContent = SceneTraining._answers.course_source_check ? '✓ 已保存' : '请先写下依据';
    });
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
    if (SceneTraining._lessonContext) {
      const ctx = SceneTraining._lessonContext || {}; const hasQuestion = /[？?]/.test(text) || text.includes('吗') || text.includes('请问') || text.includes('能否'); const hasCourtesy = /谢谢|您好|请|辛苦|麻烦|理解|感谢/.test(text); const hasAction = /先|然后|再|确认|说明|回应|倾听|点头|微笑|等待/.test(text); if (text.length < 8) return { title: '⚠ 回应还不够完整', desc: '先把对象、回应和下一步说清楚，再进入下一轮。', bg: '#fef2f2', border: '#fecaca', fg: '#dc2626' }; if (hasQuestion && hasCourtesy && hasAction) return { title: '✅ 回应结构完整', desc: '你同时表达了礼貌、行动依据和推进问题，符合“' + String(ctx.knowledgePoint || ctx.courseTitle || '本课规则').slice(0, 28) + '”的训练方向。', bg: '#ecfdf5', border: '#a7f3d0', fg: '#047857' }; if (hasQuestion || hasAction) return { title: '😊 基本合适，还能更自然', desc: '回应已经有场景动作或推进问题；可以再补一句礼貌回应，让对方更容易接话。', bg: '#fffbeb', border: '#fde68a', fg: '#b45309' }; return { title: '📝 建议再具体一点', desc: '参考本课原文，补充你准备采取的动作、理由或下一步，不要只回答“好的/嗯”。', bg: '#eef2ff', border: '#c7d2fe', fg: '#3730a3' };
    }
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
  SceneTraining.persistProgress = function () { try { localStorage.setItem(SceneTraining._progressKey, JSON.stringify({ scene: SceneTraining._level && SceneTraining._level.title, stepIdx: SceneTraining._stepIdx, answers: SceneTraining._answers, actionDone: SceneTraining._actionDone, turnIdx: SceneTraining._turnIdx, dialogueAnswers: SceneTraining._dialogueAnswers, quizAnswer: SceneTraining._quizAnswer, branchUsed: !!SceneTraining._branchUsed, branchLabel: SceneTraining._branchLabel || '', updatedAt: Date.now() })); } catch (e) {} };
  SceneTraining.clearProgress = function () { try { localStorage.removeItem(SceneTraining._progressKey); } catch (e) {} };
  SceneTraining.gotoStep = function (n) {
    if (n < 0 || n >= SceneTraining._steps.length) return;
    SceneTraining._stepIdx = n;
    SceneTraining.persistProgress();
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