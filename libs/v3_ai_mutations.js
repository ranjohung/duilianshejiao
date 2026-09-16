/**
 * 对练社交 V3.0 — AI对练临场突变分支
 * 
 * 功能：
 * 1. 在第2-3回合，概率触发"突然沉默"/"突然插话"/"质疑用户"
 * 2. 训练用户临场应变能力
 * 3. 突变事件记录到训练日志，用于后续复盘
 * 4. 突变后给出引导性提示，帮助用户应对
 */
(function () {
  'use strict';

  // ============================================================
  // 突变类型定义
  // ============================================================
  var MUTATION_TYPES = {
    SILENCE: {
      id: 'silence',
      label: '突然沉默',
      icon: '😶',
      probability: 0.25,
      // 不同场景的沉默反应
      responses: {
        default: [
          '（对方突然沉默了，看着你，不说话……）',
          '（对方低下头，陷入了沉默，空气变得有些安静……）',
          '（对方没有回应，似乎在思考什么……）'
        ],
        cafe: [
          '（对方放下杯子，眼神看向窗外，沉默不语……）',
          '（突然的安静。对方用手指轻轻转着杯沿……）'
        ],
        office: [
          '（对方靠在椅背上，沉默地看着你……）',
          '（领导没有说话，只是翻看着文件……）'
        ],
        family: [
          '（对方叹了口气，沉默了……）',
          '（餐桌上一阵安静，对方放下了筷子……）'
        ]
      },
      // 给用户的引导提示
      hint: '面对沉默，你可以：①给对方一些时间 ②温和地询问"你在想什么？" ③不要急着填补沉默',
      coachEvaluation: '对方沉默时，保持镇定本身就是一种能力。你不需要急着说话，给对方空间也是尊重。'
    },
    INTERRUPTION: {
      id: 'interruption',
      label: '突然插话',
      icon: '🗣️',
      probability: 0.20,
      responses: {
        default: [
          '等一下——我想说的不是这个意思。',
          '（打断你）不好意思，我有个想法想先说。',
          '（举手示意）让我先说完这一句。'
        ],
        office: [
          '（打断）这个点先放一放，我觉得有更重要的事。',
          '等一下，我觉得方向不太对。'
        ],
        cafe: [
          '（插话）不是不是，你误会我的意思了。',
          '（突然打断）哎，我想到一个事……'
        ],
        family: [
          '（打断）你先别说这个，我想问你另一件事。',
          '（提高声音）等等，你听我说完！'
        ]
      },
      hint: '被插话时，你可以：①暂停，让对方说完 ②说"好的，你说完我再继续" ③深呼吸，不要觉得被冒犯',
      coachEvaluation: '被打断不代表你说得不好。能耐心地让对方表达完，再回到自己的话题，是很成熟的沟通能力。'
    },
    QUESTIONING: {
      id: 'questioning',
      label: '质疑用户',
      icon: '🤨',
      probability: 0.20,
      responses: {
        default: [
          '你说的这些……真的能做到吗？我觉得不太现实。',
          '（皱眉）我怎么觉得你说的和做的不太一样？',
          '你确定吗？听起来有点不对劲。'
        ],
        office: [
          '这个数据你确认过了吗？我觉得和上次不一样。',
          '（质疑）你这个方案的风险有没有考虑过？',
          '我不太同意，之前的经验不是这样的。'
        ],
        cafe: [
          '你真的这么想？我觉得你只是在迎合我吧。',
          '（怀疑地看你）你说的这个……我怎么不太信呢。'
        ],
        family: [
          '你每次都是这么说的，结果呢？',
          '（质疑）你说得好听，但你能做到吗？',
          '你这话说得轻巧，实际情况你了解吗？'
        ]
      },
      hint: '被质疑时，你可以：①不要急着辩解 ②说"我理解你的疑虑" ③用具体例子支撑你的观点 ④承认不确定的部分',
      coachEvaluation: '被质疑时保持冷静，用事实和例子回应，比情绪化辩解更有说服力。承认"这部分我确实不确定"反而更让人信任你。'
    }
  };

  // ============================================================
  // 突变状态管理
  // ============================================================
  var mutationState = {
    triggered: false,
    type: null,
    round: 0,
    log: []
  };

  function resetMutationState() {
    mutationState.triggered = false;
    mutationState.type = null;
    mutationState.round = 0;
    mutationState.log = [];
  }

  // ============================================================
  // 突变判定逻辑
  // ============================================================
  function shouldTriggerMutation(round) {
    // 只在第2-3回合触发
    if (round < 2 || round > 3) return null;
    // 每场对话最多触发一次突变
    if (mutationState.triggered) return null;

    // 根据场景key获取对应响应
    var sceneKey = '';
    if (window.challengeSceneMeta && window.challengeSceneMeta.key) {
      sceneKey = window.challengeSceneMeta.key;
    }

    // 按概率随机选择突变类型
    var rand = Math.random();
    var cumulative = 0;
    var types = Object.keys(MUTATION_TYPES);

    for (var i = 0; i < types.length; i++) {
      var type = MUTATION_TYPES[types[i]];
      cumulative += type.probability;
      if (rand < cumulative) {
        return type;
      }
    }

    return null;
  }

  // ============================================================
  // 突变响应生成
  // ============================================================
  function getMutationResponse(mutationType) {
    var sceneKey = '';
    if (window.challengeSceneMeta && window.challengeSceneMeta.key) {
      sceneKey = window.challengeSceneMeta.key;
    }

    var responses = mutationType.responses[sceneKey] || mutationType.responses.default;
    var idx = Math.floor(Math.random() * responses.length);
    return responses[idx];
  }

  // ============================================================
  // 突变注入 — Hook sendChallengeMessage
  // ============================================================
  function hookChallengeMessage() {
    var _origSend = window.sendChallengeMessage;
    if (!_origSend) return;

    window.sendChallengeMessage = function () {
      var input = document.getElementById('challenge-input');
      var text = input ? input.value.trim() : '';
      if (!text || window.challengeBusy) return;

      // 计算当前回合
      var round = (window.challengeRound || 0) + 1;

      // 检查是否触发突变
      var mutation = shouldTriggerMutation(round);

      if (mutation) {
        // 触发突变！
        mutationState.triggered = true;
        mutationState.type = mutation.id;
        mutationState.round = round;

        // 先执行用户消息
        if (typeof window.addChallengeMessage === 'function') {
          window.addChallengeMessage('user', text);
        }
        window.challengeRound = round;
        window.challengeBusy = true;

        // 更新进度
        var progress = document.getElementById('challenge-stage-progress');
        if (progress) progress.textContent = round + ' / 3';

        // 延迟后触发突变反应
        setTimeout(function () {
          // 显示突变反应
          var mutationResponse = getMutationResponse(mutation);
          if (typeof window.addChallengeMessage === 'function') {
            window.addChallengeMessage('npc', mutationResponse);
          }

          // 显示突变引导提示
          showMutationHint(mutation);

          // 更新教练评价
          showMutationEvaluation(mutation);

          // 记录突变事件
          mutationState.log.push({
            type: mutation.id,
            round: round,
            challengeId: window.currentChallengeId,
            timestamp: Date.now(),
            userText: text,
            npcResponse: mutationResponse
          });

          window.challengeBusy = false;

          // 记录埋点
          if (window.V3Economy) {
            window.V3Economy.trackEvent('mutation_triggered', {
              mutation_type: mutation.id,
              round: round,
              scenario_id: String(window.currentChallengeId || ''),
              challenge_tier: 'easy',
              timestamp: Date.now()
            });
          }

          // 突变后继续正常对话（第3轮结束）
          if (round >= 3) {
            setTimeout(function () {
              if (typeof window.showChallengeResult === 'function') {
                window.showChallengeResult();
              }
            }, 2000);
          }
        }, 1200);

      } else {
        // 没有突变，正常执行
        _origSend.apply(this, arguments);
      }
    };
  }

  // ============================================================
  // 突变引导提示UI
  // ============================================================
  function showMutationHint(mutation) {
    var messages = document.getElementById('challenge-messages');
    if (!messages) return;

    var hint = document.createElement('div');
    hint.className = 'flex justify-center animate-in mb-3';
    hint.innerHTML =
      '<div style="max-width:85%;padding:10px 14px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:12px;border:1px solid rgba(245,158,11,0.2);">' +
        '<div style="font-size:11px;font-weight:600;color:#92400e;margin-bottom:4px;">' +
          mutation.icon + ' 临场突变：' + mutation.label +
        '</div>' +
        '<div style="font-size:11px;color:#78350f;line-height:1.5;">' +
          mutation.hint +
        '</div>' +
      '</div>';
    messages.appendChild(hint);
    messages.scrollTop = messages.scrollHeight;
  }

  function showMutationEvaluation(mutation) {
    var evaluation = document.getElementById('challenge-coach-evaluation');
    if (!evaluation) return;

    evaluation.className = 'challenge-coach-evaluation';
    evaluation.innerHTML =
      '<strong>🎯 临场应变评价</strong><br>' +
      '<span class="font-medium" style="color:#7c3aed;">检测到「' + mutation.label + '」场景</span>' +
      '<div class="mt-2" style="font-size:12px;color:#4b5563;line-height:1.6;">' +
        mutation.coachEvaluation +
      '</div>';
  }

  // ============================================================
  // 突变统计 — 供复盘使用
  // ============================================================
  function getMutationLog() {
    return mutationState.log.slice();
  }

  function saveMutationLogToTrainingLog() {
    if (mutationState.log.length === 0) return;

    try {
      var raw = localStorage.getItem('duilian_training_log');
      var logs = raw ? JSON.parse(raw) : [];
      logs.push({
        type: 'mutation_session',
        challengeId: window.currentChallengeId,
        mutations: mutationState.log,
        timestamp: Date.now()
      });
      localStorage.setItem('duilian_training_log', JSON.stringify(logs));
    } catch (e) {
      console.warn('[V3Mutation] 保存突变日志失败:', e);
    }
  }

  // ============================================================
  // 礼仪训练也加入突变
  // ============================================================
  function hookEtiquetteMessage() {
    var _origSend = window.sendEtiquetteMessage;
    if (!_origSend) return;

    window.sendEtiquetteMessage = function () {
      var input = document.getElementById('etiquette-input');
      var text = input ? input.value.trim() : '';
      if (!text) return;

      // 礼仪训练的回合追踪
      window._etiquetteRound = (window._etiquetteRound || 0) + 1;
      var round = window._etiquetteRound;

      // 礼仪训练也支持突变，但概率稍低
      if (round >= 2 && round <= 3 && !mutationState.triggered && Math.random() < 0.3) {
        var mutationTypes = Object.keys(MUTATION_TYPES);
        var idx = Math.floor(Math.random() * mutationTypes.length);
        var mutation = MUTATION_TYPES[mutationTypes[idx]];

        mutationState.triggered = true;
        mutationState.type = mutation.id;
        mutationState.round = round;

        // 执行用户消息
        if (typeof window.addEtiquetteBubble === 'function') {
          window.addEtiquetteBubble('user', text);
        }

        setTimeout(function () {
          var response = getMutationResponse(mutation);
          if (typeof window.addEtiquetteBubble === 'function') {
            window.addEtiquetteBubble('npc', response);
          }
          showMutationHint(mutation);

          mutationState.log.push({
            type: mutation.id,
            round: round,
            mode: 'etiquette',
            timestamp: Date.now()
          });
        }, 1000);

      } else {
        _origSend.apply(this, arguments);
      }
    };
  }

  // ============================================================
  // 重置逻辑 — 每次开始新挑战时重置突变状态
  // ============================================================
  function hookStartChallenge() {
    var _origStart = window.startChallenge;
    if (!_origStart) return;

    var wrappedStart = function (challengeId) {
      resetMutationState();
      return _origStart.apply(this, arguments);
    };

    // 如果 v3_integration 已经包装过，需要在其之后重置
    window.startChallenge = wrappedStart;
  }

  function hookStartEtiquette() {
    var _origStart = window.startEtiquetteLevel;
    if (!_origStart) return;

    window.startEtiquetteLevel = function (levelId) {
      resetMutationState();
      window._etiquetteRound = 0;
      return _origStart.apply(this, arguments);
    };
  }

  // ============================================================
  // 初始化
  // ============================================================
  function init() {
    // 延迟注入hooks，确保原始函数已定义
    setTimeout(function () {
      hookChallengeMessage();
      hookEtiquetteMessage();
      hookStartChallenge();
      hookStartEtiquette();
    }, 500);

    // 暴露接口
    window.V3Mutation = {
      getMutationLog: getMutationLog,
      resetMutationState: resetMutationState,
      saveMutationLog: saveMutationLogToTrainingLog,
      MUTATION_TYPES: MUTATION_TYPES
    };

    console.log('[V3Mutation] AI临场突变模块初始化完成');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
