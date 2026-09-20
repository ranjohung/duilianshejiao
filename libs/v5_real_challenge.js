/* =========================================================================
 *  v5_real_challenge.js
 *  真实挑战 — 课堂→现实 迁移训练（ChatGPT 方案 R12 · 第 14-16 节）
 *
 *  设计理念：
 *  ───────────────────────────────────────────────────────────────────────
 *  真实挑战不是"打勾任务清单"。它是：
 *
 *    礼仪训练 → 挑战下发 → 现实记录 → 复盘 → 推荐下一训练
 *
 *  每个挑战 = 迁移训练包，包含：
 *    ① 挑战任务（今日在现实世界做一件事）
 *    ② 完成前 checklist（心理准备 / 观察点）
 *    ③ 现实记录表单（地点 + 行为 + 感受 + 结果 + 描述）
 *    ④ 复盘反馈（基于你做的 + 感受 + 结果）
 *    ⑤ 推荐下一训练（基于暴露的薄弱点）
 *
 *  使用方式：
 *    RealChallenge.start(challengeId)      — 开始挑战（从已学的礼仪训练 level 迁移）
 *    RealChallenge.startFromLevel(levelId) — 从礼仪训练 level 自动推荐匹配的挑战
 *
 *  挂载：
 *    window.RealChallenge  (IIFE 导出)
 * ========================================================================= */

(function (global) {
  'use strict';

  if (!global) return;

  const RealChallenge = {
    _challenge: null,      // 当前 challenge level
    _stepIdx: 0,           // 当前步骤
    _form: {},             // 用户填写的记录 { location, behavior, feeling, result, description }
    _container: null,
  };

  // ──────────────────────────────────────────────────────────────────────
  // 挑战模板适配器：从 realChallengeLevels / etiquetteLevels 生成挑战包
  // ──────────────────────────────────────────────────────────────────────

  // 挑战步骤
  // 0: intro      今天的挑战是什么
  // 1: prep       完成前 checklist（心理准备 + 观察点）
  // 2: record     现实记录表单
  // 3: review     复盘反馈 + 推荐下一训练

  function buildChallengeFromLevel(level) {
    const challengeId = level.id;
    const focus = level.focus || '';
    const goal = level.goal || '';
    const story = level.story || '';
    const relation = level.relation || '';

    // 匹配的现实场景地点选项
    const locationMap = {
      '咖啡厅': ['公司茶水间', '楼下咖啡厅', '朋友聚会', '地铁/公交'],
      '社交': ['公司茶水间', '小区楼下', '朋友聚会', '购物结账'],
      '职场': ['公司茶水间', '电梯里', '走廊遇到', '会议室门口'],
      '家庭': ['家里', '朋友家', '家庭聚会', '社区活动'],
      '公共': ['电梯里', '走廊遇到', '购物结账', '餐厅'],
      '客户': ['电梯里', '公司前台', '走廊遇到', '会议室门口'],
    };

    let locations = ['公司茶水间', '小区楼下', '朋友聚会', '购物结账', '电梯里'];
    for (const [key, locs] of Object.entries(locationMap)) {
      if (level.title && level.title.includes(key)) { locations = locs; break; }
      if (level.category && level.category.includes(key)) { locations = locs; break; }
    }

    // prep checklist（完成前心理准备）
    const prepChecklist = [
      { text: '找到一个合适的现实场景（上面的地点选一个）', tip: '不需要追求完美，"有机会就尝试"比"等到完美时机"好' },
      { text: '回忆今天训练的核心动作：' + focus, tip: '不要想全套，抓 1-2 个最重要的动作' },
      { text: '给自己一个"只练这一件事"的许可', tip: '不是让你在现实中演戏，而是让你更有意识地去做' },
      { text: '接受"做得不好也没关系"', tip: '这是训练，不是考试。哪怕只做了一半，也是有价值的反馈' },
    ];

    // 观察点（完成前想好要注意什么）
    const observePoints = focus ? focus.split(/[、，,]/).map(f => f.trim()).filter(Boolean).slice(0, 4) : ['对方的反应', '自己的紧张程度', '对话是否在继续'];

    return {
      challengeId,
      level,
      steps: [
        {
          type: 'intro',
          title: '🎯 今日现实挑战',
          content: `在${goal || level.title || '一次现实互动'}中，练习${focus || '一个小动作'}。`,
          story: story,
          relation: relation,
          instructions: [
            '选择一个合适的现实场景（见下一步）',
            '找到一个可以练习的机会',
            '做你能做的，不用完美',
            '回来记录你的经历',
          ],
          locations: locations,
          timeHint: '建议在 24 小时内完成',
        },
        {
          type: 'prep',
          title: '📝 完成前 · 准备好了吗？',
          checklist: prepChecklist,
          observePoints: observePoints,
          coachHint: '勾选完就带着这些清单出门吧。你不需要演得像训练里一样，只要让自己有意识地去做，就是进步。',
        },
        {
          type: 'record',
          title: '📸 记录你的经历',
          fields: [
            { key: 'location', label: '在哪里？', type: 'choice', options: locations.concat(['其他（请在描述里说明）']), placeholder: '选择一个' },
            { key: 'behavior', label: '你做了什么？', type: 'choice', options: ['完全按训练的动作和话术做了', '做了动作但话术是自己想的', '只做了部分动作', '没做 / 没找到机会'], placeholder: '选一个最接近的' },
            { key: 'feeling', label: '当时感觉怎么样？', type: 'choice', options: ['😰 很紧张', '😐 一般', '🙂 比较自然', '😄 很轻松'], placeholder: '选一个' },
            { key: 'result', label: '结果如何？', type: 'choice', options: ['✅ 对方有回应，对话继续了', '✅ 对方回应了但没继续', '⚠️ 有点尴尬但撑过去了', '❌ 我临阵退缩了'], placeholder: '选一个' },
            { key: 'description', label: '描述一下（可选，越具体越好）', type: 'text', placeholder: '比如：在咖啡厅排队，我看到前面是同事小李。我做了眼神接触，微笑说"早啊小李，上周那个方案搞定了吗？"他说搞定了，还聊了两句周末的事。其实说出口之前我挺紧张的，但开口之后反而自然了。' },
          ],
        },
        {
          type: 'review',
          title: '🔍 复盘 · 看看你暴露了什么',
          // 根据 record 动态生成
        },
      ],
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // 渲染主入口
  // ──────────────────────────────────────────────────────────────────────

  function start(challengeId) {
    // 先从 realChallengeLevels 找，找不到从 etiquetteLevels 找
    const levels = global.realChallengeLevels || global.etiquetteLevels || [];
    const level = levels.find(l => String(l.id) === String(challengeId));
    if (!level) { console.warn('[RealChallenge] challenge not found:', challengeId); return; }

    RealChallenge._challenge = buildChallengeFromLevel(level);
    RealChallenge._stepIdx = 0;
    RealChallenge._form = {};

    // 定位容器 — 用 modal-challenge 里的区域
    let container = document.getElementById('real-challenge-v5-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'real-challenge-v5-container';
      container.style.cssText = 'flex:1;overflow-y:auto;padding:16px;';
      // 插入到 modal-challenge 内（如果存在），或插到 body 末尾
      const modal = document.getElementById('modal-real-challenge');
      if (modal) {
        const scrollArea = modal.querySelector('.ct-scroll, .modal-content');
        if (scrollArea) scrollArea.parentNode.insertBefore(container, scrollArea);
        else modal.appendChild(container);
      } else {
        // fallback：append 到 body
        container.style.cssText += ';position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:9999;';
        document.body.appendChild(container);
      }
    }
    RealChallenge._container = container;
    container.style.display = 'block';

    render();
  }

  function startFromLevel(levelId) {
    // 从礼仪训练 level 自动推荐挑战（默认找同 id）
    start(levelId);
  }

  function render() {
    const container = RealChallenge._container;
    if (!container) return;
    const step = RealChallenge._challenge.steps[RealChallenge._stepIdx];
    const total = RealChallenge._challenge.steps.length;
    const idx = RealChallenge._stepIdx;

    let html = `<div style="text-align:center;margin-bottom:14px;">
      <div style="font-size:11px;color:#9ca3af;">Real Challenge · Step ${idx+1} / ${total}</div>
      <div style="font-size:18px;font-weight:700;color:#1f2937;margin-top:4px;">${step.title}</div>
    </div>`;

    switch (step.type) {
      case 'intro':   html += renderIntro(step); break;
      case 'prep':    html += renderPrep(step); break;
      case 'record':  html += renderRecord(step); break;
      case 'review':  html += renderReview(step); break;
      default:        html += '<div class="text-gray-400">未知步骤类型</div>';
    }

    html += renderStepNav();
    container.innerHTML = html;
    bindEvents();
  }

  function renderStepNav() {
    const idx = RealChallenge._stepIdx;
    const total = RealChallenge._challenge.steps.length;
    const isLast = idx >= total - 1;
    const isFirst = idx === 0;

    let dots = '';
    for (let i = 0; i < total; i++) {
      dots += `<div onclick="RealChallenge.gotoStep(${i})" style="width:10px;height:10px;border-radius:50%;background:${i<idx?'#10b981':i===idx?'#6366f1':'#d1d5db'};cursor:pointer;"></div>`;
    }

    return `<div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;margin-top:16px;border-top:1px solid #f3f4f6;">
      <button onclick="RealChallenge.prev()" ${isFirst?'disabled':''} style="padding:8px 18px;border:1px solid #e5e7eb;border-radius:10px;background:${isFirst?'#f9fafb':'#fff'};color:${isFirst?'#d1d5db':'#374151'};cursor:${isFirst?'not-allowed':'pointer'};font-size:13px;">← 上一步</button>
      <div style="display:flex;gap:6px;">${dots}</div>
      <button onclick="RealChallenge.next()" ${isLast?'disabled':''} style="padding:8px 18px;border:none;border-radius:10px;background:${isLast?'#f3f4f6':'linear-gradient(135deg,#6366f1,#8b5cf6)'};color:${isLast?'#d1d5db':'#fff'};cursor:${isLast?'not-allowed':'pointer'};font-size:13px;font-weight:600;">${isLast?'完成':'下一步 →'}</button>
    </div>`;
  }

  // ──────────────────────────────────────────────────────────────────────
  // 各 step 渲染
  // ──────────────────────────────────────────────────────────────────────

  function renderIntro(step) {
    let instrs = (step.instructions || []).map((t, i) =>
      `<div style="display:flex;gap:10px;padding:6px 0;">
        <span style="width:24px;height:24px;background:#6366f1;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${i+1}</span>
        <span style="font-size:14px;color:#374151;padding-top:2px;">${t}</span>
      </div>`
    ).join('');

    let locs = (step.locations || []).map(l =>
      `<span style="display:inline-block;background:#f3f4f6;border-radius:20px;padding:4px 12px;font-size:12px;color:#4b5563;margin:2px;">📍 ${l}</span>`
    ).join('');

    return `<div style="margin-bottom:16px;">
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:14px;padding:20px;color:#fff;margin-bottom:14px;">
        <div style="font-size:12px;opacity:.8;margin-bottom:6px;">📚 你刚学过的</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">${step.content}</div>
        ${step.story ? `<div style="font-size:12px;opacity:.95;line-height:1.6;">「${step.story}」</div>` : ''}
      </div>

      <div style="background:#f0fdf4;border-radius:12px;padding:14px;margin-bottom:14px;">
        <div style="font-size:12px;color:#16a34a;font-weight:600;margin-bottom:10px;">🎯 现实迁移任务</div>
        ${instrs}
      </div>

      <div style="background:#f9fafb;border-radius:12px;padding:14px;">
        <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:8px;">💡 找个类似的现实场景</div>
        ${locs}
        <div style="font-size:11px;color:#9ca3af;margin-top:8px;">${step.timeHint || '建议在 24 小时内完成'}</div>
      </div>
    </div>`;
  }

  function renderPrep(step) {
    let checks = (step.checklist || []).map((c, i) =>
      `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px dashed #f3f4f6;">
        <input type="checkbox" class="rc-prep-check" data-idx="${i}" style="width:18px;height:18px;accent-color:#6366f1;margin-top:2px;">
        <div style="flex:1;">
          <div style="font-size:14px;color:#1f2937;font-weight:500;">${c.text}</div>
          <div style="font-size:12px;color:#9ca3af;margin-top:2px;">💡 ${c.tip}</div>
        </div>
      </div>`
    ).join('');

    let observes = (step.observePoints || []).map(p =>
      `<span style="display:inline-block;background:#fef3c7;border-radius:20px;padding:4px 12px;font-size:12px;color:#92400e;margin:2px;">👀 ${p}</span>`
    ).join('');

    return `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:14px;">
      <div style="font-size:13px;color:#ca8a04;font-weight:600;margin-bottom:10px;">✓ 心理准备 · 逐条确认</div>
      ${checks}
    </div>

    <div style="background:#ede9fe;border-radius:12px;padding:14px;margin-bottom:14px;">
      <div style="font-size:12px;color:#6d28d9;font-weight:600;margin-bottom:8px;">🔍 这次重点观察什么</div>
      <div>${observes}</div>
    </div>

    <div style="background:#f9fafb;border-radius:10px;padding:12px;font-size:12px;color:#6b7280;line-height:1.7;">
      ${step.coachHint}
    </div>`;
  }

  function renderRecord(step) {
    let fieldsHtml = '';
    (step.fields || []).forEach(f => {
      const saved = RealChallenge._form[f.key] || '';
      if (f.type === 'choice') {
        let opts = (f.options || []).map(o =>
          `<label style="display:inline-flex;align-items:center;gap:6px;margin:4px 8px 4px 0;padding:6px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:20px;cursor:pointer;font-size:13px;color:#374151;">
            <input type="radio" name="rc-choice-${f.key}" value="${o}" ${saved===o?'checked':''} style="accent-color:#6366f1;">
            ${o}
          </label>`
        ).join('');
        fieldsHtml += `<div style="margin-bottom:16px;">
          <div style="font-size:13px;color:#374151;font-weight:600;margin-bottom:8px;">${f.label}</div>
          <div>${opts}</div>
        </div>`;
      } else {
        fieldsHtml += `<div style="margin-bottom:16px;">
          <div style="font-size:13px;color:#374151;font-weight:600;margin-bottom:8px;">${f.label}</div>
          <textarea id="rc-field-${f.key}" rows="3" placeholder="${f.placeholder || ''}" style="width:100%;border:1px solid #e5e7eb;border-radius:10px;padding:10px;font-size:14px;resize:outline-none;font-family:inherit;">${saved}</textarea>
        </div>`;
      }
    });

    return `<div style="margin-bottom:16px;">
      <div style="background:#1e1b4b;border-radius:12px;padding:12px;margin-bottom:14px;font-size:13px;color:#a5b4fc;line-height:1.7;">
        💭 刚刚经历了什么？回来记录一下吧。<br>
        <span style="opacity:.7; font-size:11px;">不追求完美 — 哪怕只填了地点和感觉，也有价值。</span>
      </div>
      ${fieldsHtml}
      <button class="rc-save-form" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:14px;font-weight:600;cursor:pointer;">保存记录 → 进入复盘</button>
    </div>`;
  }

  function renderReview(step) {
    const form = RealChallenge._form;
    const challenge = RealChallenge._challenge;

    // 根据 form 数据生成复盘
    let feelingEmoji = '';
    let feelingLabel = '';
    if (form.feeling) {
      feelingEmoji = form.feeling.charAt(0);
      feelingLabel = form.feeling.replace(/^[😰😐🙂😄]\s*/, '');
    }

    // 动态生成反馈
    let feedbackBlocks = [];

    // 1. 肯定（通用）
    feedbackBlocks.push({
      icon: '🎉',
      color: '#ecfdf5', border: '#a7f3d0', fg: '#047857',
      title: '你跨出了舒适区',
      content: '从"知道怎么做"到"在现实里真的做了"，这是最大的跨越。哪怕做得不完美，这一步就已经赢了。'
    });

    // 2. 根据 feeling
    if (form.feeling) {
      let feelingAdvice = '';
      if (form.feeling.includes('紧张')) feelingAdvice = '紧张≠做得差，紧张只是你的身体在应对重要时刻。下次试试：先深呼吸 3 次再开口。';
      else if (form.feeling.includes('一般')) feelingAdvice = '"一般"是进步的好信号 — 说明你没有被社交吓退，也没有过度兴奋。保持这种"平稳感"，下次可以挑战更难一点的场景。';
      else if (form.feeling.includes('自然') || form.feeling.includes('轻松')) feelingAdvice = '你已经在建立"这块社交我能hold住"的肌肉记忆了。保持自信，下次可以试试更难的场景。';
      feedbackBlocks.push({ icon: feelingEmoji || '💭', color: '#f0f9ff', border: '#bae6fd', fg: '#0369a1', title: '你的感受在告诉你', content: feelingAdvice });
    }

    // 3. 根据 behavior
    if (form.behavior) {
      let behAdvice = '';
      if (form.behavior.includes('完全')) behAdvice = '你几乎完全按训练做了 — 训练和现实的 gap 被你填上了！现在可以挑战更复杂的分支情况（比如对方忽然被人叫走、话题突然中断）。';
      else if (form.behavior.includes('做了动作但话术')) behAdvice = '动作到位了，但话术是自己想的 — 这反而是好事！说明训练给了你"行动信心"，你能自然表达自己。保持这种"不完全依赖模板"的状态。';
      else if (form.behavior.includes('部分')) behAdvice = '只做了部分动作没关系 — 下次把注意力集中在你没做到的那一步（比如"微笑"或"加一个开放式问题"），一次只练一件事。';
      else if (form.behavior.includes('没做')) behAdvice = '"没找到机会"也是一种结果 — 说明你在观察而不是盲目行动。下次可以试试更主动：跟一个平时不太说话的同事说声早安。';
      feedbackBlocks.push({ icon: '🎯', color: '#fdf4ff', border: '#f5d0fe', fg: '#a21caf', title: '你做到了什么', content: behAdvice });
    }

    // 4. 结果分析 → 暴露薄弱点 → 推荐下一训练
    let nextRecommendation = '';
    if (form.result) {
      if (form.result.includes('对话继续')) nextRecommendation = '🔥 表现不错！推荐下一训练：<strong>9007 约会中的试探</strong> — 话题继续之后，怎么自然收尾 + 留下次见面的钩子。';
      else if (form.result.includes('回应了但没继续')) nextRecommendation = '💡 话题没继续通常是因为回应里缺少"给对方接话的钩子"。推荐重练：<strong>回到礼仪训练 Step 5 话术示范</strong>，重点看 A 档回应的"开放式问题"结构。';
      else if (form.result.includes('尴尬')) nextRecommendation = '💪 尴尬是训练素材！尴尬通常来自"不知道接下来该说什么"。推荐下一训练：<strong>9002 朋友家的晚餐</strong> — 餐桌话题边界练习。';
      else if (form.result.includes('退缩')) nextRecommendation = '🫂 临阵退缩是非常真实的反馈 — 说明"知道"和"做到"之间还有 gap。推荐从最简单的场景重新开始：<strong>礼仪训练 9001 咖啡厅的邂逅</strong>，这次只练"微笑 + 眼神"两个小动作。';
    }

    let feedbackHtml = feedbackBlocks.map(b => `
      <div style="background:${b.color};border:1px solid ${b.border};border-radius:12px;padding:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:20px;">${b.icon}</span>
          <span style="font-size:13px;font-weight:700;color:${b.fg};">${b.title}</span>
        </div>
        <div style="font-size:13px;color:#374151;line-height:1.7;padding-left:4px;">${b.content}</div>
      </div>`).join('');

    const hasRecord = Object.keys(form).length > 0;

    return `<div style="margin-bottom:16px;">
      ${hasRecord ? `
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:14px;margin-bottom:14px;">
          <div style="font-size:12px;color:#0369a1;font-weight:600;margin-bottom:8px;">📋 你的现实记录</div>
          ${form.location ? `<div style="font-size:12px;color:#475569;margin-bottom:4px;">📍 在${form.location}</div>` : ''}
          ${form.behavior ? `<div style="font-size:12px;color:#475569;margin-bottom:4px;">🎯 ${form.behavior}</div>` : ''}
          ${form.feeling ? `<div style="font-size:12px;color:#475569;margin-bottom:4px;">💭 感觉${form.feeling}</div>` : ''}
          ${form.result ? `<div style="font-size:12px;color:#475569;margin-bottom:4px;">📊 ${form.result}</div>` : ''}
          ${form.description ? `<div style="font-size:12px;color:#475569;margin-top:6px;padding-top:6px;border-top:1px dashed #bae6fd;white-space:pre-wrap;">${form.description}</div>` : ''}
        </div>` : ''}
      ${feedbackHtml}
      ${nextRecommendation ? `
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:14px;color:#fff;margin-top:12px;">
          <div style="font-size:12px;opacity:.8;margin-bottom:6px;">📚 基于你的暴露点，推荐下一训练</div>
          <div style="font-size:14px;font-weight:600;line-height:1.7;">${nextRecommendation}</div>
        </div>` : ''}
    </div>`;
  }

  // ──────────────────────────────────────────────────────────────────────
  // 事件绑定
  // ──────────────────────────────────────────────────────────────────────

  function bindEvents() {
    const idx = RealChallenge._stepIdx;
    const step = RealChallenge._challenge.steps[idx];

    // prep checklist
    document.querySelectorAll('.rc-prep-check').forEach(cb => {
      cb.addEventListener('change', function () {
        const i = parseInt(this.dataset.idx, 10);
        RealChallenge._prepDone = RealChallenge._prepDone || {};
        RealChallenge._prepDone[i] = this.checked;
      });
    });

    // record: radio choices
    document.querySelectorAll('[name^="rc-choice-"]').forEach(radio => {
      radio.addEventListener('change', function () {
        const key = this.name.replace('rc-choice-', '');
        RealChallenge._form[key] = this.value;
      });
    });

    // save form
    const saveBtn = document.querySelector('.rc-save-form');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        // 收集 textarea
        document.querySelectorAll('[id^="rc-field-"]').forEach(ta => {
          const key = ta.id.replace('rc-field-', '');
          RealChallenge._form[key] = ta.value;
        });
        // 保存到 localStorage 留档
        try {
          const records = JSON.parse(localStorage.getItem('rc_records') || '[]');
          records.push({ timestamp: Date.now(), challengeId: RealChallenge._challenge.challengeId, form: RealChallenge._form });
          localStorage.setItem('rc_records', JSON.stringify(records.slice(-20)));
        } catch(e) {}
        // 跳到 review step
        RealChallenge.gotoStep(idx + 1);
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 公共 API
  // ──────────────────────────────────────────────────────────────────────

  RealChallenge.start = start;
  RealChallenge.startFromLevel = startFromLevel;
  RealChallenge.gotoStep = function (n) {
    if (n < 0 || n >= RealChallenge._challenge.steps.length) return;
    RealChallenge._stepIdx = n;
    render();
  };
  RealChallenge.next = function () {
    if (RealChallenge._stepIdx < RealChallenge._challenge.steps.length - 1) {
      RealChallenge.gotoStep(RealChallenge._stepIdx + 1);
    }
  };
  RealChallenge.prev = function () {
    if (RealChallenge._stepIdx > 0) {
      RealChallenge.gotoStep(RealChallenge._stepIdx - 1);
    }
  };

  global.RealChallenge = RealChallenge;

})(window);
