/**
 * 对练社交 V3.0 — 集成层
 * 将 V3 经济体系/UI组件 接入现有 index.html 函数
 * 
 * 依赖：v3_economy_loop.js, v3_ui_components.js
 */
(function () {
  'use strict';

  var E = window.V3Economy;
  var UI = window.V3UI;
  if (!E || !UI) { console.error('[V3Int] 依赖模块未加载'); return; }

  // ============================================================
  // 1. 现实挑战完成 → 弹出3秒记录卡
  // ============================================================

  // 拦截 submitChallengeEvidence（现有的挑战证据提交函数）
  var _origSubmitChallengeEvidence = window.submitChallengeEvidence;
  window.submitChallengeEvidence = function () {
    // 调用原函数（如果存在）
    if (typeof _origSubmitChallengeEvidence === 'function') {
      try { _origSubmitChallengeEvidence(); } catch (e) { console.warn(e); }
    }

    // 弹出3秒记录卡
    var challengeId = window.currentChallengeId || '';
    var tier = 'easy';
    // 从 realChallengeLevels 获取难度
    if (typeof window.realChallengeLevels !== 'undefined') {
      var level = window.realChallengeLevels.find(function (l) { return l.id === challengeId; });
      if (level) tier = level.difficulty || 'easy';
    }

    UI.showQuickRecordCard({
      scenarioId: String(challengeId),
      challengeTier: tier,
      onSubmit: function (record) {
        // 完成挑战后增加成长值
        E.completeChallenge();
        showToast('🎉 挑战记录已保存 +20成长值');
      }
    });
  };

  // ============================================================
  // 2. AI对练结束 → 深度复盘提示（触点1）
  // ============================================================

  // 包装训练完成后的处理
  var _origShowChallengeResult = window.showChallengeResult;
  window.showChallengeResult = function () {
    if (typeof _origShowChallengeResult === 'function') {
      try { _origShowChallengeResult(); } catch (e) { console.warn(e); }
    }

    // 完成训练后增加成长值
    E.completeTraining();
    E.trackAiTrainingCompleted(window.currentChallengeId);

    // 延迟弹出深度复盘提示
    setTimeout(function () {
      UI.showDeepReviewPrompt(String(window.currentChallengeId || ''), function (isFirstFree) {
        if (isFirstFree) {
          showToast('🎁 首次深度复盘免费解锁！');
        } else {
          showToast('💎 深度复盘已解锁');
        }
        // 渲染深度复盘内容
        renderDeepReviewContent();
      });
    }, 1500);
  };

  function renderDeepReviewContent() {
    // 在现有结果区域追加深度复盘内容
    var evaluation = document.getElementById('challenge-coach-evaluation') ||
                     document.getElementById('etiquette-coach-evaluation');
    if (!evaluation) return;

    var deepReview = document.createElement('div');
    deepReview.style.cssText = 'margin-top:12px;padding:14px;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:14px;border:1px solid rgba(124,58,237,0.12);';
    deepReview.innerHTML =
      '<div style="font-size:13px;font-weight:600;color:#5b21b6;margin-bottom:8px;">📝 深度复盘</div>' +
      '<div style="font-size:12px;color:#4c1d95;line-height:1.6;">' +
        '<p><b>逐句拆解：</b>AI教练将在这里对你的每句话给出具体分析和更好的表达方式。</p>' +
        '<p style="margin-top:6px;"><b>更好话术版本：</b>基于你的表达，AI教练会给出升级版本的参考话术。</p>' +
      '</div>';
    evaluation.appendChild(deepReview);
  }

  // ============================================================
  // 3. 开始现实挑战前 → 检查能量 + 应急锦囊提示（触点2）
  // ============================================================

  var _origStartChallenge = window.startChallenge;
  window.startChallenge = function (challengeId) {
    // 先检查能量
    var cur = E.checkDailyEnergyRefresh();
    if (cur.energy <= 0) {
      // 能量不足，提示购买
      var buyModal = document.createElement('div');
      buyModal.id = 'v3-energy-prompt';
      buyModal.className = 'modal-overlay';
      buyModal.style.zIndex = '9996';
      buyModal.innerHTML =
        '<div class="modal-content" style="max-width:360px;padding:24px;text-align:center;">' +
          '<div style="font-size:40px;margin-bottom:12px;">⚡</div>' +
          '<div style="font-size:16px;font-weight:600;color:#1f2937;margin-bottom:6px;">今日能量已用完</div>' +
          '<div style="font-size:13px;color:#667085;margin-bottom:16px;line-height:1.5;">' +
            '每天0点自动恢复至' + cur.energyMax + '点<br>' +
            '<span style="color:#9ca3af;font-size:12px;">（这只是练习资源重置，你的成长记录和积分永不清零）</span>' +
          '</div>' +
          '<button id="v3-energy-buy" style="width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:8px;">' +
            '💎 1社交币购买1点能量' +
          '</button>' +
          '<button onclick="document.getElementById(\'v3-energy-prompt\').remove()" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;color:#667085;font-size:13px;cursor:pointer;">' +
            '明天再来' +
          '</button>' +
        '</div>';
      document.body.appendChild(buyModal);
      document.getElementById('v3-energy-buy').onclick = function () {
        E.requestCoinPayment(1, '购买1点能量继续练习', function (updatedCur) {
          document.getElementById('v3-energy-prompt').remove();
          showToast('⚡ 能量已恢复，继续挑战！');
          // 递归调用
          window.startChallenge(challengeId);
        });
      };
      return;
    }

    // 消耗1点能量
    E.consumeEnergy();

    // 应急锦囊提示（触点2）
    var kitModal = document.createElement('div');
    kitModal.id = 'v3-kit-prompt';
    kitModal.className = 'modal-overlay';
    kitModal.style.zIndex = '9995';
    kitModal.innerHTML =
      '<div class="modal-content" style="max-width:360px;padding:24px;text-align:center;">' +
        '<div style="font-size:40px;margin-bottom:12px;">🆘</div>' +
        '<div style="font-size:16px;font-weight:600;color:#1f2937;margin-bottom:6px;">此刻有点紧张？</div>' +
        '<div style="font-size:13px;color:#667085;margin-bottom:16px;line-height:1.5;">' +
          '焦虑急救包：30秒语音引导 + 3句保命话术' +
        '</div>' +
        '<button id="v3-kit-buy" style="width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:8px;">' +
          '💊 应急锦囊（2社交币）' +
        '</button>' +
        '<button id="v3-kit-skip" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;color:#667085;font-size:13px;cursor:pointer;">' +
          '不需要，直接开始' +
        '</button>' +
      '</div>';
    document.body.appendChild(kitModal);

    document.getElementById('v3-kit-buy').onclick = function () {
      E.requestEmergencyKit(function () {
        document.getElementById('v3-kit-prompt').remove();
        showToast('🆘 应急锦囊已解锁');
        showEmergencyKitContent();
        // 继续进入挑战
        if (typeof _origStartChallenge === 'function') {
          _origStartChallenge(challengeId);
        }
      });
    };

    document.getElementById('v3-kit-skip').onclick = function () {
      document.getElementById('v3-kit-prompt').remove();
      if (typeof _origStartChallenge === 'function') {
        _origStartChallenge(challengeId);
      }
    };

    E.trackChallengeAccepted(challengeId, 'easy');
  };

  function showEmergencyKitContent() {
    var kit = document.createElement('div');
    kit.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:16px;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,0.15);z-index:9994;max-width:360px;width:calc(100% - 40px);animation:fadeIn 0.3s ease-out;';
    kit.innerHTML =
      '<div style="font-size:15px;font-weight:600;color:#1f2937;margin-bottom:12px;">🆘 焦虑急救包</div>' +
      '<div style="padding:12px;background:#fef3c7;border-radius:10px;margin-bottom:10px;">' +
        '<div style="font-size:12px;font-weight:500;color:#92400e;margin-bottom:4px;">🫁 30秒呼吸引导</div>' +
        '<div style="font-size:13px;color:#78350f;">吸气4秒 → 屏住4秒 → 呼气6秒，重复3次</div>' +
      '</div>' +
      '<div style="padding:12px;background:#ede9fe;border-radius:10px;margin-bottom:10px;">' +
        '<div style="font-size:12px;font-weight:500;color:#5b21b6;margin-bottom:4px;">💬 三句保命话术</div>' +
        '<div style="font-size:13px;color:#4c1d95;line-height:1.6;">' +
          '1. "我理解你的感受"<br>' +
          '2. "能再多说一点吗？"<br>' +
          '3. "谢谢你告诉我这些"' +
        '</div>' +
      '</div>' +
      '<button onclick="this.parentElement.remove()" style="width:100%;padding:10px;border-radius:10px;border:none;background:#7c3aed;color:#fff;font-size:13px;cursor:pointer;">准备好了，开始挑战</button>';
    document.body.appendChild(kit);
  }

  // ============================================================
  // 4. 礼仪训练完成 → 深度复盘 + 解锁微小现实任务
  // ============================================================

  var _origShowEtiquetteResult = window.showEtiquetteResult;
  window.showEtiquetteResult = function () {
    if (typeof _origShowEtiquetteResult === 'function') {
      try { _origShowEtiquetteResult(); } catch (e) { console.warn(e); }
    }
    E.completeTraining();
    E.trackAiTrainingCompleted('etiquette');

    // 延迟弹出微小现实任务解锁提示
    setTimeout(function () {
      unlockMicroTask();
    }, 2500);
  };

  // ============================================================
  // 4.5 微小现实任务 — 完成AI训练后自动解锁
  // ============================================================
  var MICRO_TASKS = {
    'cafe': { title: '向咖啡师推荐一杯你喜欢的饮品', desc: '下次去咖啡店，试着和店员聊一句："今天推荐哪杯？"', icon: '☕' },
    'office': { title: '在会议中主动说一句话', desc: '下次开会时，第一个举手或主动发表一句看法。', icon: '💼' },
    'family': { title: '对家人说一句感谢', desc: '今天给家人发一条"谢谢你一直支持我"的消息。', icon: '🏠' },
    'community': { title: '向邻居打招呼', desc: '在小区里遇到邻居时，主动微笑并说"你好"。', icon: '🏘️' },
    'service': { title: '询问一个服务细节', desc: '下次办理业务时多问一句："还有什么需要注意的吗？"', icon: '🏛️' },
    'market': { title: '尝试砍价一次', desc: '在菜市场或小店，试着问一句"能便宜点吗？"', icon: '🛒' },
    'home': { title: '主动开启一段对话', desc: '今天和一个不太熟的家人/室友聊5分钟。', icon: '🏡' },
    'public': { title: '向陌生人问路或提供帮助', desc: '在外面时，试着给陌生人指路或主动问路。', icon: '🌳' },
    'auto': { title: '和一个不太熟的人打招呼', desc: '今天主动向一个认识但不熟的人打招呼。', icon: '👋' },
    'default': { title: '对服务员说一声"谢谢"', desc: '今天的任何一次服务场景中，真诚地说出"谢谢"。', icon: '😊' }
  };

  function unlockMicroTask() {
    // 检查今天是否已解锁过
    var profile = E.getProfile ? E.getProfile() : {};
    try {
      var raw = localStorage.getItem('duilian_profile');
      if (raw) profile = JSON.parse(raw);
    } catch (e) {}

    var today = new Date().toISOString().slice(0, 10);
    if (profile.microTaskDate === today) return; // 今天已解锁

    // 获取当前训练场景
    var sceneKey = 'default';
    if (window.currentTrainingScene) {
      sceneKey = window.currentTrainingScene.env || window.currentTrainingScene.sceneKey || 'default';
    }

    var task = MICRO_TASKS[sceneKey] || MICRO_TASKS['default'];

    // 标记今天已解锁
    profile.microTaskDate = today;
    profile.microTaskTitle = task.title;
    localStorage.setItem('duilian_profile', JSON.stringify(profile));

    // 弹出解锁提示
    var modal = document.createElement('div');
    modal.id = 'v3-micro-task-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '9993';
    modal.innerHTML =
      '<div style="max-width:360px;width:calc(100% - 32px);background:#fff;border-radius:20px;margin:auto;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.15);">' +
        '<div style="background:linear-gradient(135deg,#10b981,#059669);padding:20px;text-align:center;">' +
          '<div style="font-size:48px;margin-bottom:8px;">' + task.icon + '</div>' +
          '<div style="font-size:16px;font-weight:700;color:#fff;">🎉 解锁了一个微小现实任务</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;">完成AI练习后自动解锁</div>' +
        '</div>' +
        '<div style="padding:20px;">' +
          '<div style="font-size:15px;font-weight:600;color:#1f2937;margin-bottom:8px;">' + task.title + '</div>' +
          '<div style="font-size:13px;color:#6b7280;line-height:1.6;margin-bottom:16px;">' + task.desc + '</div>' +
          '<div style="padding:10px 12px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;margin-bottom:16px;">' +
            '<div style="font-size:11px;color:#166534;">💡 提示：不需要"完美完成"，做了就是胜利。完成后在现实挑战中记录你的感受。</div>' +
          '</div>' +
          '<button id="v3-micro-task-ok" style="width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:14px;font-weight:500;cursor:pointer;">' +
            '好的，我去试试 💪' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('v3-micro-task-ok').onclick = function () {
      modal.remove();
      showToast('🌟 去现实中试试吧！完成后记得回来记录感受。');
    };

    modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
  }

  // ============================================================
  // 5. 签到增加成长值
  // ============================================================

  // 如果有签到函数，增加成长值
  var _origSignIn = window.signIn || window.dailySignIn;
  if (typeof _origSignIn === 'function') {
    var wrappedSignIn = function () {
      var result = _origSignIn.apply(this, arguments);
      E.dailySignIn();
      return result;
    };
    if (window.signIn) window.signIn = wrappedSignIn;
    if (window.dailySignIn) window.dailySignIn = wrappedSignIn;
  }

  // ============================================================
  // 6. 首页顶部显示经济数据
  // ============================================================

  function injectEconomyStatusBar() {
    var homePage = document.getElementById('page-home');
    if (!homePage) return;
    var statusBar = document.createElement('div');
    statusBar.id = 'v3-economy-bar';
    statusBar.style.cssText = 'padding:8px 16px;display:flex;justify-content:space-around;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-bottom:1px solid #ede9fe;font-size:11px;color:#5b21b6;';
    
    function updateBar() {
      var cur = E.checkDailyEnergyRefresh();
      statusBar.innerHTML =
        '<span title="每天0点自动恢复，这不是惩罚，只是练习资源重置。成长值和积分永不清零。">⚡ 能量 <b>' + cur.energy + '/' + cur.energyMax + '</b></span>' +
        '<span title="用于解锁深度复盘、应急锦囊等功能">💎 社交币 <b>' + cur.socialCoin + '</b></span>' +
        '<span title="只增不减，记录你的每一次练习">🌱 成长值 <b>' + cur.growth + '</b></span>' +
        '<span id="v3-energy-info-btn" style="cursor:pointer;margin-left:4px;" title="每天0点恢复至' + cur.energyMax + '点。能量用完不代表你不能继续——可以用社交币购买，也可以明天再来。你的成长记录和积分永远不会清零。">ℹ️</span>';
    }

    updateBar();
    // 插入到首页顶部
    var firstChild = homePage.querySelector('.page-content');
    if (firstChild) {
      homePage.insertBefore(statusBar, firstChild);
    }

    // 定期刷新
    setInterval(updateBar, 30000);
    // 暴露更新函数
    window.V3_updateEconomyBar = updateBar;
  }

  // ============================================================
  // 7. "我的作业" → "现实挑战" 文案替换
  // ============================================================

  function renameHomeworkToChallenge() {
    // 替换所有"我的作业"为"现实挑战"
    document.querySelectorAll('*').forEach(function (el) {
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
        el.textContent = el.textContent.replace(/我的作业/g, '现实挑战');
      }
    });
  }

  // ============================================================
  // 8. 危机热线兜底（如果UI模块未加载）
  // ============================================================
  function addCrisisHotLineFallback() {
    if (document.getElementById('v3-crisis-hotline-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'v3-crisis-hotline-btn';
    btn.setAttribute('aria-label', '一键拨打全国统一心理援助热线12356');
    btn.style.cssText = 'position:fixed;right:16px;bottom:90px;z-index:9990;width:48px;height:48px;border-radius:50%;border:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 4px 14px rgba(239,68,68,0.4);display:flex;align-items:center;justify-content:center;';
    btn.innerHTML = '📞';
    btn.title = '全国统一心理援助热线 12356';
    btn.onclick = function () {
      var c = document.getElementById('v3-crisis-confirm');
      if (c) c.remove();
      var d = document.createElement('div');
      d.id = 'v3-crisis-confirm';
      d.className = 'modal-overlay';
      d.style.zIndex = '9997';
      d.innerHTML = '<div style="max-width:340px;width:calc(100% - 40px);background:#fff;border-radius:20px;padding:24px;text-align:center;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);">' +
        '<div style="font-size:36px;margin-bottom:12px;">📞</div>' +
        '<div style="font-size:16px;font-weight:700;color:#1f2937;margin-bottom:6px;">全国统一心理援助热线</div>' +
        '<div style="font-size:28px;font-weight:800;color:#dc2626;margin-bottom:12px;">12356</div>' +
        '<div style="font-size:12px;color:#667085;margin-bottom:16px;line-height:1.5;">国家卫健委设置的全国统一心理援助热线</div>' +
        '<a href="tel:12356" style="display:block;width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:15px;font-weight:600;text-decoration:none;text-align:center;margin-bottom:8px;">📞 一键拨打</a>' +
        '<button onclick="document.getElementById(\'v3-crisis-confirm\').remove()" style="width:100%;padding:10px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;color:#667085;font-size:13px;cursor:pointer;">稍后再说</button>' +
        '</div>';
      document.body.appendChild(d);
      d.onclick = function (e) { if (e.target === d) d.remove(); };
    };
    document.body.appendChild(btn);
  }

  // ============================================================
  // 9. 现实挑战防挫败 — "换个更简单的"降级按钮
  // ============================================================
  function addDowngradeButton() {
    // 找到挑战弹窗中的内容区域
    var modals = ['modal-challenge-training', 'modal-challenge-checkin'];
    modals.forEach(function (id) {
      var modal = document.getElementById(id);
      if (!modal) return;
      if (modal.querySelector('#v3-downgrade-btn')) return;
      var content = modal.querySelector('.modal-content') || modal.querySelector('.challenge-training-surface');
      if (!content) return;

      var btn = document.createElement('button');
      btn.id = 'v3-downgrade-btn';
      btn.style.cssText = 'width:calc(100% - 32px);margin:8px 16px;padding:10px;border-radius:10px;border:1px dashed #d1d5db;background:#fefce8;color:#92400e;font-size:12px;cursor:pointer;';
      btn.textContent = '😮‍💨 今天状态差，换个更简单的';
      btn.onclick = function () {
        showToast('💛 没关系，已为你切换到更简单的挑战');
        if (window.challenges && Array.isArray(window.challenges)) {
          var easier = window.challenges.find(function (c) {
            return c.difficulty === 'easy' && !c.completed && c.id !== window.currentChallengeId;
          });
          if (easier) {
            setTimeout(function () { window.startChallenge(easier.id); }, 500);
            return;
          }
        }
        showToast('请在列表中选择难度更低的挑战');
      };
      content.appendChild(btn);
    });
  }

  // ============================================================
  // 初始化
  // ============================================================

  function init() {
    // 文案替换
    renameHomeworkToChallenge();

    // 注入经济数据状态栏
    setTimeout(injectEconomyStatusBar, 500);

    // 冷启动引导卡片（新用户首次进入）
    setTimeout(function () {
      if (UI.showOnboardingCard) UI.showOnboardingCard();
    }, 1500);

    // 危机热线悬浮按钮
    setTimeout(function () {
      if (UI.addCrisisHotlineButton) UI.addCrisisHotlineButton();
      else addCrisisHotLineFallback();
    }, 2000);

    // 降级按钮
    setTimeout(addDowngradeButton, 2500);

    console.log('[V3Int] 集成层初始化完成（含冷启动+危机热线+降级按钮）');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
