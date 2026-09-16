/**
 * 对练社交 V3.0 — 经济体系 + 3秒记录卡 + 勇气证据库 + 冷启动 + 埋点
 * 创建日期：2026-09-14
 * 
 * 本模块实现：
 * 1. 三币机制（成长值 / 能量 / 社交币）
 * 2. 付费触点与扣费保护
 * 3. 3秒记录卡（含 fear_predicted / outcome_negative 标签）
 * 4. 勇气证据库数据层
 * 5. 冷启动引导
 * 6. 埋点事件
 * 7. 危机热线
 * 
 * LocalStorage 键名约定：
 * - duilian_profile：用户基本资料
 * - duilian_training_log：AI对练记录
 * - duilian_challenge_log：现实挑战记录
 * - duilian_currency：三币余额
 * - duilian_evidence：勇气证据库聚合
 * - duilian_settings：设置与协议
 */

(function () {
  'use strict';

  // ============================================================
  // 1. 三币核心数据结构与读写
  // ============================================================

  const CURRENCY_KEY = 'duilian_currency';
  const PROFILE_KEY = 'duilian_profile';
  const CHALLENGE_LOG_KEY = 'duilian_challenge_log';
  const TRAINING_LOG_KEY = 'duilian_training_log';
  const EVIDENCE_KEY = 'duilian_evidence';
  const SETTINGS_KEY = 'duilian_settings';

  /** 默认货币数据 */
  function defaultCurrency() {
    return {
      growth: 0,            // 成长值（只增不减）
      energy: 3,            // 当前能量
      energyMax: 3,         // 能量上限（免费3 / 会员5）
      socialCoin: 0,        // 社交币（1元=10社交币）
      energyLastRefresh: '', // 最后刷新日期 YYYY-MM-DD
      memberTier: 'free',   // free | pay_as_you_go | companion
      createdAt: new Date().toISOString()
    };
  }

  /** 默认用户档案 */
  function defaultProfile() {
    return {
      nickname: '',
      avatar: '👤',
      phone: '',
      freeScenariosUsed: [],   // 已使用免费名额的 scenario_id 列表
      freeReviewsUsed: [],     // 已使用免费深度复盘的 scenario_id 列表
      hasCompletedOnboarding: false, // 是否完成冷启动引导
      crisisHotlineAcknowledged: false
    };
  }

  /** 读取货币数据，自动初始化 */
  function getCurrency() {
    try {
      var raw = localStorage.getItem(CURRENCY_KEY);
      if (!raw) {
        var d = defaultCurrency();
        localStorage.setItem(CURRENCY_KEY, JSON.stringify(d));
        return d;
      }
      var data = JSON.parse(raw);
      // 补齐可能缺失的字段
      if (data.energy === undefined) data.energy = 3;
      if (data.energyMax === undefined) data.energyMax = 3;
      if (data.socialCoin === undefined) data.socialCoin = 0;
      if (data.growth === undefined) data.growth = 0;
      return data;
    } catch (e) {
      console.warn('[V3] getCurrency parse error, resetting:', e);
      var d = defaultCurrency();
      localStorage.setItem(CURRENCY_KEY, JSON.stringify(d));
      return d;
    }
  }

  /** 保存货币数据 */
  function saveCurrency(data) {
    try {
      localStorage.setItem(CURRENCY_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[V3] saveCurrency failed:', e);
    }
  }

  /** 读取用户档案 */
  function getProfile() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) {
        var d = defaultProfile();
        localStorage.setItem(PROFILE_KEY, JSON.stringify(d));
        return d;
      }
      var data = JSON.parse(raw);
      if (!Array.isArray(data.freeScenariosUsed)) data.freeScenariosUsed = [];
      if (!Array.isArray(data.freeReviewsUsed)) data.freeReviewsUsed = [];
      return data;
    } catch (e) {
      var d = defaultProfile();
      localStorage.setItem(PROFILE_KEY, JSON.stringify(d));
      return d;
    }
  }

  /** 保存用户档案 */
  function saveProfile(data) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[V3] saveProfile failed:', e);
    }
  }

  // ============================================================
  // 2. 每日能量恢复
  // ============================================================

  function getTodayStr() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  /**
   * 检查并执行每日能量恢复
   * 每天0点恢复至上限，非惩罚性（成长值、挑战记录永不清零）
   */
  function checkDailyEnergyRefresh() {
    var cur = getCurrency();
    var today = getTodayStr();
    if (cur.energyLastRefresh !== today) {
      // 根据会员等级决定能量上限
      var maxEnergy = 3;
      if (cur.memberTier === 'companion') maxEnergy = 5;
      cur.energy = maxEnergy;
      cur.energyMax = maxEnergy;
      cur.energyLastRefresh = today;
      saveCurrency(cur);
      console.log('[V3] 每日能量已恢复至 ' + maxEnergy);
    }
    return cur;
  }

  // ============================================================
  // 3. 能量消耗与恢复
  // ============================================================

  /**
   * 消耗1点能量进行AI对练
   * @returns {Object} { success: boolean, message: string, currency: Object }
   */
  function consumeEnergy() {
    var cur = checkDailyEnergyRefresh();
    if (cur.energy > 0) {
      cur.energy -= 1;
      saveCurrency(cur);
      return { success: true, message: '消耗1点能量，剩余' + cur.energy + '点', currency: cur };
    }
    // 能量不足，需要购买
    return {
      success: false,
      message: '今日能量已用完，消耗1社交币购买1点能量继续练习',
      currency: cur,
      needPurchase: true
    };
  }

  /**
   * 用社交币购买能量（1社交币=1点能量）
   * @param {number} amount 购买数量
   * @returns {Object}
   */
  function buyEnergy(amount) {
    amount = amount || 1;
    var cur = getCurrency();
    if (cur.socialCoin < amount) {
      return { success: false, message: '社交币不足，需要' + amount + '社交币' };
    }
    // 必须经过用户确认（由UI层处理），这里只做数据变更
    cur.socialCoin -= amount;
    cur.energy = Math.min(cur.energy + amount, cur.energyMax + 10); // 允许超出上限存储
    saveCurrency(cur);
    return { success: true, message: '成功购买' + amount + '点能量', currency: cur };
  }

  // ============================================================
  // 4. 社交币扣费保护（核心安全函数）
  // ============================================================

  /**
   * 安全的社交币扣费函数
   * 严格前置校验 + 余额保护，绝不静默扣费
   * 
   * @param {number} amount 扣费金额（正数）
   * @param {string} purpose 用途描述（显示给用户）
   * @param {Function} onConfirmed 用户确认后的回调
   * @param {Function} onInsufficient 余额不足时的回调（可选）
   */
  function requestCoinPayment(amount, purpose, onConfirmed, onInsufficient) {
    var cur = getCurrency();

    // 前置校验：余额是否足够
    if (cur.socialCoin < amount) {
      if (typeof onInsufficient === 'function') {
        onInsufficient(cur);
      } else {
        showRechargeModal(amount, purpose);
      }
      return false;
    }

    // 弹出确认窗口
    var confirmed = showPaymentConfirm(amount, purpose, function () {
      // 用户确认后执行扣费
      var latest = getCurrency();
      // 二次校验（防止确认期间余额变化）
      if (latest.socialCoin < amount) {
        showToast('余额不足，请充值');
        showRechargeModal(amount, purpose);
        return;
      }
      latest.socialCoin -= amount;
      saveCurrency(latest);
      showToast('已扣除' + amount + '社交币');
      if (typeof onConfirmed === 'function') {
        onConfirmed(latest);
      }
    });

    return confirmed;
  }

  /**
   * 显示付费确认弹窗
   * @returns {boolean} 是否已弹出确认（实际确认是异步的）
   */
  function showPaymentConfirm(amount, purpose, onConfirm) {
    // 移除已有弹窗
    var existing = document.getElementById('v3-payment-confirm-modal');
    if (existing) existing.remove();

    var cur = getCurrency();
    var modal = document.createElement('div');
    modal.id = 'v3-payment-confirm-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '9999';
    modal.innerHTML = '<div class="modal-content" style="max-width:360px;padding:24px;">' +
      '<div style="text-align:center;margin-bottom:16px;">' +
        '<div style="font-size:32px;margin-bottom:8px;">💎</div>' +
        '<div style="font-size:16px;font-weight:600;color:#1f2937;">确认消费社交币</div>' +
      '</div>' +
      '<div style="background:#f8f7fb;border-radius:12px;padding:14px;margin-bottom:16px;">' +
        '<div style="font-size:13px;color:#667085;margin-bottom:8px;">' + purpose + '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:14px;color:#1f2937;">消耗</span>' +
          '<span style="font-size:20px;font-weight:700;color:#7c3aed;">' + amount + ' 社交币</span>' +
        '</div>' +
        '<div style="font-size:12px;color:#9ca3af;margin-top:6px;">当前余额：' + cur.socialCoin + ' 社交币</div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;">' +
        '<button id="v3-pay-cancel" style="flex:1;padding:12px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-size:14px;font-weight:500;cursor:pointer;">取消</button>' +
        '<button id="v3-pay-confirm" style="flex:1;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:14px;font-weight:600;cursor:pointer;">确认支付</button>' +
      '</div>' +
    '</div>';

    document.body.appendChild(modal);

    // 绑定事件
    document.getElementById('v3-pay-cancel').onclick = function () {
      modal.remove();
    };
    document.getElementById('v3-pay-confirm').onclick = function () {
      modal.remove();
      if (typeof onConfirm === 'function') onConfirm();
    };
    // 点击遮罩关闭
    modal.onclick = function (e) {
      if (e.target === modal) modal.remove();
    };

    return true;
  }

  /**
   * 显示充值弹窗
   */
  function showRechargeModal(requiredAmount, purpose) {
    var existing = document.getElementById('v3-recharge-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'v3-recharge-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '9999';
    modal.innerHTML = '<div class="modal-content" style="max-width:380px;padding:24px;">' +
      '<div style="text-align:center;margin-bottom:16px;">' +
        '<div style="font-size:32px;margin-bottom:8px;">💎</div>' +
        '<div style="font-size:16px;font-weight:600;color:#1f2937;">社交币不足</div>' +
        '<div style="font-size:13px;color:#667085;margin-top:4px;">' + (purpose || '') + ' 需要 ' + requiredAmount + ' 社交币</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">' +
        '<button onclick="V3Economy.recharge(10)" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:12px;border:1px solid #ede9fe;background:#f5f3ff;cursor:pointer;">' +
          '<span style="font-size:14px;color:#1f2937;">10 社交币</span>' +
          '<span style="font-size:14px;font-weight:600;color:#7c3aed;">¥1</span>' +
        '</button>' +
        '<button onclick="V3Economy.recharge(30)" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:12px;border:1px solid #ede9fe;background:#f5f3ff;cursor:pointer;position:relative;">' +
          '<span style="font-size:14px;color:#1f2937;">30 社交币</span>' +
          '<span style="font-size:14px;font-weight:600;color:#7c3aed;">¥3</span>' +
          '<span style="position:absolute;top:-6px;right:12px;background:#ec4899;color:#fff;font-size:10px;padding:2px 6px;border-radius:8px;">推荐</span>' +
        '</button>' +
        '<button onclick="V3Economy.recharge(100)" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:12px;border:1px solid #ede9fe;background:#f5f3ff;cursor:pointer;">' +
          '<span style="font-size:14px;color:#1f2937;">100 社交币</span>' +
          '<span style="font-size:14px;font-weight:600;color:#7c3aed;">¥10</span>' +
        '</button>' +
      '</div>' +
      '<div style="text-align:center;margin-bottom:12px;">' +
        '<div style="font-size:12px;color:#9ca3af;border-top:1px solid #f0f0f0;padding-top:12px;">' +
          '或开通 <b style="color:#7c3aed;">同行者会员 ¥29/月</b><br>' +
          '<span style="font-size:11px;">能量上限5点 · 高级场景 · 课程库全免 · 月度成长报告</span>' +
        '</div>' +
      '</div>' +
      '<button onclick="document.getElementById(\'v3-recharge-modal\').remove()" style="width:100%;padding:12px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-size:14px;cursor:pointer;">稍后再说</button>' +
    '</div>';

    document.body.appendChild(modal);
    modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
  }

  // ============================================================
  // 5. 成长值奖励
  // ============================================================

  /**
   * 增加成长值（只增不减）
   * @param {number} amount 
   * @param {string} reason 原因（签到/对练/挑战）
   */
  function addGrowth(amount, reason) {
    var cur = getCurrency();
    cur.growth += amount;
    saveCurrency(cur);
    console.log('[V3] 成长值 +' + amount + '（' + reason + '），当前：' + cur.growth);
    return cur;
  }

  /** 每日签到 +5 成长值 */
  function dailySignIn() {
    return addGrowth(5, '每日签到');
  }

  /** 完成AI对练 +10 成长值 */
  function completeTraining() {
    return addGrowth(10, '完成AI对练');
  }

  /** 完成现实挑战 +20 成长值 */
  function completeChallenge() {
    return addGrowth(20, '完成现实挑战');
  }

  // ============================================================
  // 6. 免费额度管理
  // ============================================================

  /**
   * 检查并使用场景免费名额
   * @param {string} scenarioId 
   * @returns {boolean} 是否可以免费进入
   */
  function useFreeScenario(scenarioId) {
    var profile = getProfile();
    if (profile.freeScenariosUsed.indexOf(scenarioId) === -1) {
      profile.freeScenariosUsed.push(scenarioId);
      saveProfile(profile);
      return true; // 首次免费
    }
    return false; // 已使用过免费
  }

  /**
   * 检查并使用场景首次免费深度复盘
   * @param {string} scenarioId 
   * @returns {boolean}
   */
  function useFreeReview(scenarioId) {
    var profile = getProfile();
    if (profile.freeReviewsUsed.indexOf(scenarioId) === -1) {
      profile.freeReviewsUsed.push(scenarioId);
      saveProfile(profile);
      return true;
    }
    return false;
  }

  // ============================================================
  // 7. 3秒记录卡 + 数据标签
  // ============================================================

  /**
   * 提交3秒记录卡
   * @param {Object} data
   *   - feeling: string (紧张|有点紧张但做了|还挺顺利)
   *   - reaction: string (友好|正常|没注意|不太热情)
   *   - note: string (可选补充)
   *   - scenarioId: string
   *   - challengeTier: string (难度级)
   * @returns {Object} 写入的记录
   */
  function submitQuickRecord(data) {
    // 计算标签
    var fearPredicted = ['紧张', '有点紧张但做了'].indexOf(data.feeling) !== -1;
    var outcomeNegative = ['没注意', '不太热情'].indexOf(data.reaction) !== -1;

    var record = {
      id: 'cr_' + Date.now(),
      timestamp: new Date().toISOString(),
      scenarioId: data.scenarioId || '',
      challengeTier: data.challengeTier || 'easy',
      feeling: data.feeling,
      reaction: data.reaction,
      note: data.note || '',
      // 核心标签
      fear_predicted: fearPredicted,
      outcome_negative: outcomeNegative
    };

    // 统一写入 duilian_challenge_log
    var log = getChallengeLog();
    log.push(record);
    saveChallengeLog(log);

    // 同步更新勇气证据库聚合数据
    updateEvidenceStats();

    // 触发埋点
    trackEvent('challenge_completed', {
      scenario_id: data.scenarioId,
      challenge_tier: data.challengeTier,
      fear_predicted: fearPredicted,
      outcome_negative: outcomeNegative
    });

    console.log('[V3] 3秒记录卡已提交:', record);
    return record;
  }

  // ============================================================
  // 8. 挑战记录读写
  // ============================================================

  function getChallengeLog() {
    try {
      var raw = localStorage.getItem(CHALLENGE_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveChallengeLog(log) {
    try {
      localStorage.setItem(CHALLENGE_LOG_KEY, JSON.stringify(log));
    } catch (e) {
      console.error('[V3] saveChallengeLog failed:', e);
    }
  }

  // ============================================================
  // 9. 勇气证据库数据层（从 challenge_log 计算，不单独存储副本）
  // ============================================================

  function updateEvidenceStats() {
    var log = getChallengeLog();
    var total = log.length;
    var fearPredictedButNotNegative = 0;
    var fearPredictedCount = 0;
    var outcomeNegativeCount = 0;
    var successStreak = 0; // 连续"预想坏事未发生"次数

    for (var i = 0; i < log.length; i++) {
      var r = log[i];
      if (r.fear_predicted) fearPredictedCount++;
      if (r.outcome_negative) outcomeNegativeCount++;
      if (r.fear_predicted && !r.outcome_negative) {
        fearPredictedButNotNegative++;
      }
    }

    // 计算连续成功（从最近一条往前）
    for (var j = log.length - 1; j >= 0; j--) {
      if (log[j].fear_predicted && !log[j].outcome_negative) {
        successStreak++;
      } else if (log[j].fear_predicted) {
        break;
      }
    }

    var stats = {
      totalChallenges: total,
      fearPredictedCount: fearPredictedCount,
      fearPredictedButNotNegative: fearPredictedButNotNegative,
      outcomeNegativeCount: outcomeNegativeCount,
      successStreak: successStreak,
      lastUpdated: new Date().toISOString()
    };

    try {
      localStorage.setItem(EVIDENCE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('[V3] updateEvidenceStats save failed:', e);
    }
    return stats;
  }

  /**
   * 获取勇气证据库统计（从 duilian_challenge_log 实时计算）
   */
  function getEvidenceStats() {
    return updateEvidenceStats();
  }

  /**
   * 生成勇气证据库展示文案
   */
  function getEvidenceDisplayText() {
    var stats = getEvidenceStats();
    if (stats.totalChallenges === 0) {
      return {
        title: '还没有挑战记录',
        subtitle: '完成第一次现实挑战，开始积累你的勇气证据吧',
        mainStat: null
      };
    }

    var ratio = stats.fearPredictedCount > 0
      ? Math.round(stats.fearPredictedButNotNegative / stats.fearPredictedCount * 100)
      : 0;

    return {
      title: '你的勇气证据',
      subtitle: '每一次尝试都是勇敢的证明',
      mainStat: {
        total: stats.totalChallenges,
        fearNotRealized: stats.fearPredictedButNotNegative,
        headline: '你已完成 ' + stats.totalChallenges + ' 次挑战' +
          (stats.fearPredictedCount > 0
            ? '，其中 ' + stats.fearPredictedButNotNegative + ' 次你预想的结果都没有发生'
            : '')
      },
      details: [
        { label: '预想有坏事', value: stats.fearPredictedCount + ' 次' },
        { label: '实际结果不好', value: stats.outcomeNegativeCount + ' 次' },
        { label: '预想坏事未发生', value: stats.fearPredictedButNotNegative + ' 次（' + ratio + '%）' },
        { label: '连续成功', value: stats.successStreak + ' 次' }
      ]
    };
  }

  // ============================================================
  // 10. AI三段式认知重构反馈
  // ============================================================

  /**
   * 根据3秒记录卡生成认知重构反馈
   * 严格三段式：①共情接纳 → ②肯定勇气 → ③引导认知重构
   * 
   * @param {Object} record 刚提交的挑战记录
   * @returns {Object} { empathy, courage, reframe, fullText }
   */
  function generateCognitiveReframe(record) {
    var empathy = '';
    var courage = '';
    var reframe = '';

    // 第一段：共情接纳
    if (record.feeling === '紧张') {
      empathy = '当时确实很紧张，那种心跳加速的感觉不好受。你的感受是完全正常的。';
    } else if (record.feeling === '有点紧张但做了') {
      empathy = '虽然有些紧张，但你没有退缩。紧张感确实让人不舒服，我理解。';
    } else if (record.feeling === '还挺顺利') {
      empathy = '听起来这次经历比你预想的要顺利，这很棒。';
    }

    // 第二段：肯定勇气
    courage = '但最重要的是——你勇敢地去做了。很多人连尝试的勇气都没有，而你已经迈出了这一步。这本身就值得被看见。';

    // 第三段：引导认知重构
    if (record.outcome_negative && record.fear_predicted) {
      // 预想坏事且实际结果不好
      reframe = '这次结果确实不太理想。不过，除了"我搞砸了"，有没有更中性的说法？比如"这次没有达到预期，但我学到了经验"？';
    } else if (!record.outcome_negative && record.fear_predicted) {
      // 预想坏事但实际结果还行 → 最佳重构机会
      reframe = '你看，你之前担心会出问题，但实际结果并没有那么糟。这说明了什么？也许我们的担心，很多时候比实际结果要可怕得多。下次感到紧张时，可以回想这次经历。';
    } else if (record.outcome_negative && !record.fear_predicted) {
      // 没预想坏事但结果不好
      reframe = '结果虽然不太理想，但这不代表你做得不好。社交中有很多不可控因素。你觉得有哪些是你可以控制的，哪些是对方的反应？';
    } else {
      // 一切顺利
      reframe = '一切顺利！记住这种感觉——你比自己想象的更有社交能力。把这次成功的经验储存起来，下次紧张时可以调出来提醒自己。';
    }

    // 根据对方反应补充
    if (record.reaction === '不太热情') {
      reframe += '\n\n对方的反应可能和TA自己的状态有关，不一定是你的问题。试着把"TA不喜欢我"换成"TA今天可能心情不好"。';
    } else if (record.reaction === '没注意') {
      reframe += '\n\n有时候我们太关注自己的表现，反而忽略了对方的真实反应。下次可以试着多观察一下对方的表情和回应。';
    }

    return {
      empathy: empathy,
      courage: courage,
      reframe: reframe,
      fullText: empathy + '\n\n' + courage + '\n\n' + reframe
    };
  }

  // ============================================================
  // 11. 冷启动引导
  // ============================================================

  /**
   * 检查是否需要显示冷启动引导
   */
  function shouldShowOnboarding() {
    var profile = getProfile();
    return !profile.hasCompletedOnboarding;
  }

  /**
   * 标记冷启动完成
   */
  function completeOnboarding() {
    var profile = getProfile();
    profile.hasCompletedOnboarding = true;
    saveProfile(profile);
  }

  // ============================================================
  // 12. 埋点系统
  // ============================================================

  var analyticsQueue = [];

  /**
   * 通用埋点函数
   * @param {string} eventName 事件名
   * @param {Object} params 参数
   */
  function trackEvent(eventName, params) {
    var event = {
      event: eventName,
      params: Object.assign({
        timestamp: new Date().toISOString(),
        user_id: getUserId()
      }, params || {})
    };

    analyticsQueue.push(event);

    // 本地存储埋点数据（后续可对接后端）
    try {
      var existing = JSON.parse(localStorage.getItem('duilian_analytics') || '[]');
      existing.push(event);
      // 最多保留1000条
      if (existing.length > 1000) existing = existing.slice(-1000);
      localStorage.setItem('duilian_analytics', JSON.stringify(existing));
    } catch (e) {
      // ignore
    }

    console.log('[V3 Analytics]', eventName, params);
    return event;
  }

  function getUserId() {
    try {
      var profile = getProfile();
      return profile.phone || profile.nickname || 'anonymous';
    } catch (e) {
      return 'anonymous';
    }
  }

  // 预定义埋点快捷函数
  function trackAiTrainingCompleted(scenarioId) {
    trackEvent('ai_training_completed', { scenario_id: scenarioId });
  }
  function trackChallengeAccepted(scenarioId, challengeTier) {
    trackEvent('challenge_accepted', { scenario_id: scenarioId, challenge_tier: challengeTier });
  }
  function trackChallengeCompleted(scenarioId, challengeTier) {
    trackEvent('challenge_completed', { scenario_id: scenarioId, challenge_tier: challengeTier });
  }
  function trackReflectionCompleted(scenarioId) {
    trackEvent('reflection_completed', { scenario_id: scenarioId });
  }

  // ============================================================
  // 13. 危机热线
  // ============================================================

  var CRISIS_HOTLINE = '12356';
  var CRISIS_HOTLINE_DISPLAY = '全国统一心理援助热线 12356';

  function getCrisisHotlineHTML() {
    return '<a href="tel:' + CRISIS_HOTLINE + '" style="color:#7c3aed;font-weight:600;text-decoration:underline;">' +
      '一键拨打' + CRISIS_HOTLINE_DISPLAY + '</a>';
  }

  // ============================================================
  // 14. 付费触点封装
  // ============================================================

  /**
   * 触点1：AI对练后的深度复盘
   * 首次免费，后续3社交币
   */
  function requestDeepReview(scenarioId, onApproved, onDenied) {
    // 检查是否首次
    if (useFreeReview(scenarioId)) {
      // 首次免费
      if (typeof onApproved === 'function') onApproved(true);
      return true;
    }
    // 后续扣费
    return requestCoinPayment(3, '解锁深度复盘（逐句拆解+更好话术版本）', function () {
      if (typeof onApproved === 'function') onApproved(false);
    }, onDenied);
  }

  /**
   * 触点2：应急锦囊（现实挑战开始前）
   * 2社交币
   */
  function requestEmergencyKit(onApproved, onDenied) {
    return requestCoinPayment(2, '此刻焦虑急救包（30秒语音+3句保命话术）', function () {
      if (typeof onApproved === 'function') onApproved();
    }, onDenied);
  }

  /**
   * 触点3：情绪教练陪聊（现实挑战受挫后）
   * 10社交币
   */
  function requestEmotionalCoach(onApproved, onDenied) {
    return requestCoinPayment(10, '和AI咨询师聊5分钟', function () {
      if (typeof onApproved === 'function') onApproved();
    }, onDenied);
  }

  /**
   * 触点4：勇气报告深度洞察
   * 本周概况免费，完整报告5社交币或分享解锁
   */
  function requestDeepEvidenceReport(onApproved, onDenied) {
    return requestCoinPayment(5, '认知模式改变报告', function () {
      if (typeof onApproved === 'function') onApproved();
    }, onDenied);
  }

  // ============================================================
  // 公开接口
  // ============================================================

  window.V3Economy = {
    // 货币读写
    getCurrency: getCurrency,
    saveCurrency: saveCurrency,
    getProfile: getProfile,
    saveProfile: saveProfile,

    // 能量
    checkDailyEnergyRefresh: checkDailyEnergyRefresh,
    consumeEnergy: consumeEnergy,
    buyEnergy: buyEnergy,

    // 社交币
    requestCoinPayment: requestCoinPayment,
    showRechargeModal: showRechargeModal,

    // 充值（模拟，生产环境对接支付）
    recharge: function (amount) {
      var cur = getCurrency();
      cur.socialCoin += amount;
      saveCurrency(cur);
      showToast('充值成功！获得 ' + amount + ' 社交币');
      var modal = document.getElementById('v3-recharge-modal');
      if (modal) modal.remove();
      return cur;
    },

    // 成长值
    addGrowth: addGrowth,
    dailySignIn: dailySignIn,
    completeTraining: completeTraining,
    completeChallenge: completeChallenge,

    // 免费额度
    useFreeScenario: useFreeScenario,
    useFreeReview: useFreeReview,

    // 3秒记录卡
    submitQuickRecord: submitQuickRecord,

    // 勇气证据库
    getEvidenceStats: getEvidenceStats,
    getEvidenceDisplayText: getEvidenceDisplayText,

    // 认知重构
    generateCognitiveReframe: generateCognitiveReframe,

    // 冷启动
    shouldShowOnboarding: shouldShowOnboarding,
    completeOnboarding: completeOnboarding,

    // 埋点
    trackEvent: trackEvent,
    trackAiTrainingCompleted: trackAiTrainingCompleted,
    trackChallengeAccepted: trackChallengeAccepted,
    trackChallengeCompleted: trackChallengeCompleted,
    trackReflectionCompleted: trackReflectionCompleted,

    // 危机热线
    CRISIS_HOTLINE: CRISIS_HOTLINE,
    CRISIS_HOTLINE_DISPLAY: CRISIS_HOTLINE_DISPLAY,
    getCrisisHotlineHTML: getCrisisHotlineHTML,

    // 付费触点
    requestDeepReview: requestDeepReview,
    requestEmergencyKit: requestEmergencyKit,
    requestEmotionalCoach: requestEmotionalCoach,
    requestDeepEvidenceReport: requestDeepEvidenceReport,

    // 挑战记录
    getChallengeLog: getChallengeLog
  };

  // Toast 辅助（复用项目已有的 showToast，若不存在则自建）
  if (typeof window.showToast !== 'function') {
    window.showToast = function (msg) {
      var toast = document.createElement('div');
      toast.textContent = msg;
      toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:99999;animation:fadeIn 0.3s ease-out;';
      document.body.appendChild(toast);
      setTimeout(function () { toast.remove(); }, 2500);
    };
  }

  console.log('[V3] 经济体系 + 闭环逻辑模块已加载');
})();
