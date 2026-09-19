/**
 * 对练社交 V3.0 — AI对练"临场突变"模块
 * 在对话第2-3回合概率触发：突然沉默 / 突然插话 / 质疑用户
 * 训练用户的临场应变能力
 * 
 * 依赖：v3_economy_loop.js（埋点）
 * 集成：拦截 postAction / 对话回合推进函数
 */
(function () {
  'use strict';

  // ============================================================
  // 1. 突变事件库
  // ============================================================

  var MUTATION_TYPES = [
    {
      id: 'sudden_silence',
      label: '突然沉默',
      description: '对方突然不说话了，沉默了5秒...',
      npcAction: 'silence',
      responses: [
        { text: '（对方沉默不语，表情变得复杂）', delay: 0 },
        { text: '......', delay: 1500 },
        { text: '（空气仿佛凝固了）', delay: 3000 }
      ],
      hint: '💡 沉默不代表失败。你可以主动打破僵局，比如："您觉得呢？"或"我继续说？"'
    },
    {
      id: 'sudden_interrupt',
      label: '突然插话',
      description: '对方突然打断了你的话',
      npcAction: 'interrupt',
      responses: [
        { text: '等一下，我想说——', delay: 0 },
        { text: '你说的这个我不太同意。', delay: 1200 },
        { text: '我觉得你可能没理解我的意思。', delay: 2500 }
      ],
      hint: '💡 被插话时，先停一秒。可以用"我理解你的想法，让我也说完好吗？"来应对。'
    },
    {
      id: 'sudden_question',
      label: '质疑用户',
      description: '对方突然对你的说法提出质疑',
      npcAction: 'challenge',
      responses: [
        { text: '你说的这些，真的有依据吗？', delay: 0 },
        { text: '我觉得你是在回避核心问题。', delay: 1500 },
        { text: '能不能给我一个更具体的例子？', delay: 3000 }
      ],
      hint: '💡 被质疑时别慌。承认不确定的部分，用"这个问题我确实需要再确认"来争取时间。'
    },
    {
      id: 'sudden_emotion',
      label: '突然情绪化',
      description: '对方突然变得激动或沮丧',
      npcAction: 'emotional',
      responses: [
        { text: '我真的受够了...', delay: 0 },
        { text: '每次都是这样，没人听我说话。', delay: 1500 }
      ],
      hint: '💡 对方情绪激动时，先共情："我能感受到你的frustration"，不要急着反驳。'
    },
    {
      id: 'sudden_topic_switch',
      label: '突然换话题',
      description: '对方突然转移了话题方向',
      npcAction: 'topic_switch',
      responses: [
        { text: '对了，还有一件事我想问你——', delay: 0 },
        { text: '你之前提到的那个问题，后来怎么样了？', delay: 1500 }
      ],
      hint: '💡 对方换话题时，你可以选择跟上，也可以温和地拉回来："那个话题我也想说，不过先聊完这个？"'
    }
  ];

  // ============================================================
  // 2. 触发概率与条件
  // ============================================================

  var TRIGGER_PROBABILITY = 0.45; // 45% 概率触发
  var MIN_ROUND = 2; // 最早第2回合
  var MAX_ROUND = 4; // 最晚第4回合（第4回合后不再触发）

  // 每个场景最多触发1次突变
  var triggeredScenes = {};

  // ============================================================
  // 3. 突变UI展示
  // ============================================================

  function showMutationBanner(mutation, mode) {
    var existing = document.getElementById('v3-mutation-banner');
    if (existing) existing.remove();

    var banner = document.createElement('div');
    banner.id = 'v3-mutation-banner';
    banner.style.cssText = 'position:relative;margin:8px 16px;padding:14px 16px;background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #f59e0b;border-radius:14px;animation:fadeIn 0.4s ease-out;z-index:10;';
    banner.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
        '<span style="font-size:18px;">⚡</span>' +
        '<span style="font-size:13px;font-weight:600;color:#92400e;">临场突变！</span>' +
        '<span style="font-size:12px;color:#b45309;margin-left:auto;">' + mutation.label + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:#78350f;line-height:1.6;margin-bottom:8px;">' + mutation.description + '</div>' +
      '<div style="font-size:11px;color:#92400e;padding:8px 10px;background:rgba(255,255,255,0.6);border-radius:8px;line-height:1.5;">' + mutation.hint + '</div>' +
      '<button id="v3-mutation-dismiss" style="margin-top:10px;width:100%;padding:8px;border-radius:8px;border:1px solid #f59e0b;background:#fff;color:#92400e;font-size:12px;font-weight:500;cursor:pointer;">我知道了，继续应对</button>';

    // 插入到对话区域顶部
    var chatArea = null;
    if (mode === 'etiquette') {
      chatArea = document.getElementById('etiquette-messages') || document.getElementById('challenge-messages');
    } else {
      chatArea = document.getElementById('challenge-messages');
    }

    if (chatArea && chatArea.parentNode) {
      chatArea.parentNode.insertBefore(banner, chatArea);
    } else {
      document.body.appendChild(banner);
    }

    document.getElementById('v3-mutation-dismiss').addEventListener('click', function () {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-10px)';
      banner.style.transition = 'all 0.3s ease-out';
      setTimeout(function () { banner.remove(); }, 300);
    });

    // 自动消失（12秒后）
    setTimeout(function () {
      if (document.getElementById('v3-mutation-banner')) {
        banner.style.opacity = '0';
        banner.style.transition = 'opacity 0.5s';
        setTimeout(function () { if (banner.parentNode) banner.remove(); }, 500);
      }
    }, 12000);
  }

  // ============================================================
  // 4. NPC突变对话注入
  // ============================================================

  function injectMutationMessages(mutation, mode) {
    var chatArea = null;
    if (mode === 'etiquette') {
      chatArea = document.getElementById('etiquette-messages') || document.getElementById('challenge-messages');
    } else {
      chatArea = document.getElementById('challenge-messages');
    }
    if (!chatArea) return;

    // 逐条注入NPC消息（模拟真实对话节奏）
    mutation.responses.forEach(function (resp, idx) {
      setTimeout(function () {
        var msgEl = document.createElement('div');
        msgEl.className = 'flex gap-2 mb-3 items-start';
        msgEl.style.animation = 'fadeIn 0.3s ease-out';
        msgEl.innerHTML =
          '<div class="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs flex-shrink-0">🎭</div>' +
          '<div class="flex-1 max-w-[80%]">' +
            '<div class="text-xs text-gray-400 mb-1">对方 <span style="color:#f59e0b;font-size:10px;">⚡突变</span></div>' +
            '<div class="bg-white border border-amber-200 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-gray-800 shadow-sm">' +
              resp.text +
            '</div>' +
          '</div>';
        chatArea.appendChild(msgEl);
        // 滚动到底部
        chatArea.scrollTop = chatArea.scrollHeight;
      }, resp.delay);
    });
  }

  // ============================================================
  // 5. 核心触发逻辑
  // ============================================================

  /**
   * 检查是否应触发临场突变
   * @param {string} scenarioId 场景ID
   * @param {number} currentRound 当前对话回合
   * @param {string} mode 'training' | 'etiquette'
   * @returns {Object|null} 突变对象或null
   */
  function shouldTriggerMutation(scenarioId, currentRound, mode) {
    // 已触发过此场景
    if (triggeredScenes[scenarioId]) return null;

    // 回合范围检查
    if (currentRound < MIN_ROUND || currentRound > MAX_ROUND) return null;

    // 概率判定
    if (Math.random() > TRIGGER_PROBABILITY) return null;

    // 随机选一种突变类型
    var mutation = MUTATION_TYPES[Math.floor(Math.random() * MUTATION_TYPES.length)];

    // 标记已触发
    triggeredScenes[scenarioId] = mutation.id;

    return mutation;
  }

  /**
   * 执行临场突变
   */
  function executeMutation(mutation, mode) {
    if (!mutation) return;

    console.log('[V3Mutation] 触发临场突变:', mutation.label, mutation.id);

    // 显示横幅提示
    showMutationBanner(mutation, mode);

    // 注入NPC突变消息
    injectMutationMessages(mutation, mode);

    // 埋点
    if (window.V3Economy && window.V3Economy.trackEvent) {
      window.V3Economy.trackEvent('mutation_triggered', {
        mutation_type: mutation.id,
        mutation_label: mutation.label,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================================
  // 6. 拦截对话回合推进
  // ============================================================

  /**
   * 包装 postAction 函数，在回合推进时检查是否触发突变
   * postAction 是主程序发送消息的核心函数
   */
  function hookPostAction() {
    var origPostAction = window.postAction;
    if (typeof origPostAction !== 'function') {
      // ★ 修复：postAction 不存在，不要无限重试。
      // 改为注册公开接口，等后续代码实现了 postAction 再手动调用 hook。
      console.log('[V3Mutation] postAction 尚未就绪，延迟 3s 后再尝试（仅重试 3 次）');
      if (!window.__v3HookRetries) window.__v3HookRetries = 0;
      window.__v3HookRetries++;
      if (window.__v3HookRetries <= 3) {
        setTimeout(hookPostAction, 3000);
      } else {
        console.warn('[V3Mutation] postAction hook 放弃（重试耗尽），模块仍可用 executeMutation()');
      }
      return;
    }

    // 跟踪回合数
    var roundCounters = {};

    window.postAction = function (mode, text) {
      // 调用原函数
      var result = origPostAction.apply(this, arguments);

      // 获取当前场景和回合
      var scenarioId = window.currentChallengeId || window.currentScenarioId || 'unknown';
      var key = mode + '_' + scenarioId;

      if (!roundCounters[key]) roundCounters[key] = 0;
      roundCounters[key]++;

      var currentRound = roundCounters[key];

      // 检查是否触发突变
      var mutation = shouldTriggerMutation(scenarioId + '_' + key, currentRound, mode);
      if (mutation) {
        // 延迟触发（让用户的消息先显示）
        setTimeout(function () {
          executeMutation(mutation, mode);
        }, 800);
      }

      return result;
    };

    console.log('[V3Mutation] postAction 已hook');
  }

  // ============================================================
  // 7. 也hook直接发送消息的函数（sendChatMessage等）
  // ============================================================

  function hookSendFunctions() {
    // 拦截 sendChallengeMessage / sendEtiquetteMessage
    var targets = ['sendChallengeMessage', 'sendEtiquetteMessage', 'sendMessage'];
    targets.forEach(function (fnName) {
      var orig = window[fnName];
      if (typeof orig !== 'function') return;

      var roundCounters = {};

      window[fnName] = function () {
        var result = orig.apply(this, arguments);

        var mode = /etiquette/i.test(fnName) ? 'etiquette' : 'training';
        var scenarioId = window.currentChallengeId || window.currentScenarioId || 'unknown';
        var key = mode + '_' + scenarioId;

        if (!roundCounters[key]) roundCounters[key] = 0;
        roundCounters[key]++;

        var mutation = shouldTriggerMutation(scenarioId + '_' + key + '_' + fnName, roundCounters[key], mode);
        if (mutation) {
          setTimeout(function () {
            executeMutation(mutation, mode);
          }, 800);
        }

        return result;
      };
    });
  }

  // ============================================================
  // 8. 降级按钮：【今天状态差，换个更简单的】
  // ============================================================

  function addDowngradeButton() {
    // 在训练中心区域（真实挑战入口旁）添加降级按钮
    // ★ 修复：页面用 page-training 而不是 page-challenge
    var challengeArea = document.getElementById('page-challenge') ||
                        document.getElementById('page-training') ||
                        document.getElementById('training-center') ||
                        document.querySelector('[id*="training"]') ||
                        document.querySelector('[id*="challenge"]');
    if (!challengeArea) return;

    // 检查是否已添加
    if (document.getElementById('v3-downgrade-btn')) return;

    var btn = document.createElement('button');
    btn.id = 'v3-downgrade-btn';
    btn.textContent = '😌 今天状态差，换个更简单的';
    btn.style.cssText = 'display:block;margin:8px auto 16px;padding:10px 16px;border-radius:12px;border:1px solid #e5e7eb;background:#fafafa;color:#667085;font-size:12px;cursor:pointer;transition:all .2s;';
    
    btn.addEventListener('mouseenter', function () {
      btn.style.background = '#f5f3ff';
      btn.style.borderColor = '#c4b5fd';
      btn.style.color = '#5b21b6';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.background = '#fafafa';
      btn.style.borderColor = '#e5e7eb';
      btn.style.color = '#667085';
    });

    btn.addEventListener('click', function () {
      // 显示降级弹窗
      var modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.style.zIndex = '9995';
      modal.innerHTML =
        '<div class="modal-content" style="max-width:360px;padding:24px;text-align:center;">' +
          '<div style="font-size:36px;margin-bottom:10px;">🌿</div>' +
          '<div style="font-size:15px;font-weight:600;color:#1f2937;margin-bottom:6px;">没关系，慢慢来</div>' +
          '<div style="font-size:13px;color:#667085;line-height:1.5;margin-bottom:16px;">' +
            '今天没准备好也没关系，<br>机会永远都在。' +
          '</div>' +
          '<div style="font-size:12px;color:#9ca3af;margin-bottom:16px;">' +
            '已为你切换到更简单的场景 ↓' +
          '</div>' +
          '<button id="v3-downgrade-confirm" style="width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:8px;">' +
            '试试这个简单任务 →' +
          '</button>' +
          '<button onclick="this.closest(\'.modal-overlay\').remove()" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;color:#667085;font-size:13px;cursor:pointer;">' +
            '今天先休息' +
          '</button>' +
        '</div>';
      document.body.appendChild(modal);

      document.getElementById('v3-downgrade-confirm').addEventListener('click', function () {
        modal.remove();
        // 切换到最简单的场景
        showToast('🌿 已为你选择最简单的任务');
        // 如果有场景列表，选择最简单的
        if (typeof window.realChallengeLevels !== 'undefined' && window.realChallengeLevels.length > 0) {
          var easiest = window.realChallengeLevels.reduce(function (a, b) {
            return (a.difficulty || 1) <= (b.difficulty || 1) ? a : b;
          });
          if (typeof window.startChallenge === 'function') {
            // 直接调用原始的 startChallenge（避免再次检查能量）
            window.startChallenge(easiest.id);
          }
        }
      });
    });

    // 添加到挑战区域
    var targetEl = challengeArea.querySelector('.page-content') || challengeArea;
    targetEl.appendChild(btn);
  }

  // ============================================================
  // 9. 能量清零边界说明
  // ============================================================

  function addEnergyExplanationTooltip() {
    // 在能量显示旁添加说明
    var existing = document.getElementById('v3-energy-explain');
    if (existing) return;

    var tip = document.createElement('div');
    tip.id = 'v3-energy-explain';
    tip.style.cssText = 'display:none;position:fixed;bottom:200px;left:50%;transform:translateX(-50%);background:#fff;border-radius:14px;padding:16px;box-shadow:0 8px 30px rgba(0,0,0,0.15);z-index:9991;max-width:320px;width:calc(100% - 40px);animation:fadeIn 0.3s ease-out;';
    tip.innerHTML =
      '<div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:8px;">⚡ 关于能量</div>' +
      '<div style="font-size:12px;color:#667085;line-height:1.6;">' +
        '<p>能量是你每天练习的"入场券"，每天0点自动恢复。</p>' +
        '<p style="margin-top:6px;"><b>重要说明：</b>能量归零只是今天的练习额度用完了，<b>不是惩罚</b>。</p>' +
        '<p style="margin-top:6px;">✅ 你的个人成长记录 <b>永久保留</b></p>' +
        '<p>✅ 你的勇气证据库 <b>绝不清零</b></p>' +
        '<p>✅ 你的成长值和积分 <b>不受影响</b></p>' +
        '<p style="margin-top:6px;color:#9ca3af;font-size:11px;">明天0点自动恢复满能量，继续加油！</p>' +
      '</div>' +
      '<button onclick="document.getElementById(\'v3-energy-explain\').style.display=\'none\'" style="margin-top:10px;width:100%;padding:8px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-size:12px;cursor:pointer;">知道了</button>';
    document.body.appendChild(tip);
  }

  // ============================================================
  // 初始化
  // ============================================================

  function init() {
    hookPostAction();
    hookSendFunctions();
    addDowngradeButton();
    addEnergyExplanationTooltip();

    console.log('[V3Mutation] 临场突变模块已加载');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 公开接口
  window.V3Mutation = {
    triggerMutation: executeMutation,
    getMutationTypes: function () { return MUTATION_TYPES.slice(); },
    resetSceneTrigger: function (sceneId) { delete triggeredScenes[sceneId]; },
    TRIGGER_PROBABILITY: TRIGGER_PROBABILITY
  };

})();
