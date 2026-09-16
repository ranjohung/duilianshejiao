/**
 * 对练社交 V3.0 — 勇气证据库页面
 * 
 * 功能：
 * 1. 汇总用户现实挑战数据（从 duilian_challenge_log 读取）
 * 2. 统计 fear_predicted=true 且 outcome_negative=false 的次数
 * 3. 生成个人成长展示（禁止排名）
 * 4. 免费查看本周概况 / 付费解锁认知模式改变报告（5社交币）
 * 5. 数据统一从 duilian_challenge_log 读取，不存副本
 */
(function () {
  'use strict';

  var E = window.V3Economy;

  // ============================================================
  // 1. 数据读取 — 统一从 duilian_challenge_log
  // ============================================================
  function getAllChallengeRecords() {
    try {
      var raw = localStorage.getItem('duilian_challenge_log');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function getWeeklyRecords() {
    var all = getAllChallengeRecords();
    var now = Date.now();
    var weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return all.filter(function (r) {
      return r.timestamp && r.timestamp >= weekAgo;
    });
  }

  // ============================================================
  // 2. 统计计算
  // ============================================================
  function computeStats() {
    var all = getAllChallengeRecords();
    var weekly = getWeeklyRecords();

    // 总挑战次数
    var totalChallenges = all.length;
    var weeklyChallenges = weekly.length;

    // 预想坏事未发生：fear_predicted=true 且 outcome_negative=false
    var fearPredicted = all.filter(function (r) { return r.fear_predicted === true; });
    var fearNotRealized = fearPredicted.filter(function (r) { return r.outcome_negative !== true; });

    // 本周
    var weeklyFearPredicted = weekly.filter(function (r) { return r.fear_predicted === true; });
    var weeklyFearNotRealized = weeklyFearPredicted.filter(function (r) { return r.outcome_negative !== true; });

    // 感受分布
    var feelings = { nervous: 0, nervous_but_did: 0, smooth: 0 };
    all.forEach(function (r) {
      if (r.feeling === 'nervous') feelings.nervous++;
      else if (r.feeling === 'nervous_but_did') feelings.nervous_but_did++;
      else if (r.feeling === 'smooth') feelings.smooth++;
    });

    // 对方反应分布
    var reactions = { friendly: 0, normal: 0, didnt_notice: 0, cold: 0 };
    all.forEach(function (r) {
      if (r.reaction === 'friendly') reactions.friendly++;
      else if (r.reaction === 'normal') reactions.normal++;
      else if (r.reaction === 'didnt_notice') reactions.didnt_notice++;
      else if (r.reaction === 'cold') reactions.cold++;
    });

    // 连续挑战天数
    var days = {};
    all.forEach(function (r) {
      if (r.timestamp) {
        var d = new Date(r.timestamp).toLocaleDateString('zh-CN');
        days[d] = true;
      }
    });
    var consecutiveDays = computeConsecutiveDays(all);

    return {
      totalChallenges: totalChallenges,
      weeklyChallenges: weeklyChallenges,
      fearPredicted: fearPredicted.length,
      fearNotRealized: fearNotRealized.length,
      weeklyFearPredicted: weeklyFearPredicted.length,
      weeklyFearNotRealized: weeklyFearNotRealized.length,
      successRate: fearPredicted.length > 0 ? Math.round(fearNotRealized.length / fearPredicted.length * 100) : 0,
      weeklySuccessRate: weeklyFearPredicted.length > 0 ? Math.round(weeklyFearNotRealized.length / weeklyFearPredicted.length * 100) : 0,
      feelings: feelings,
      reactions: reactions,
      consecutiveDays: consecutiveDays,
      activeDays: Object.keys(days).length
    };
  }

  function computeConsecutiveDays(records) {
    if (records.length === 0) return 0;
    var days = {};
    records.forEach(function (r) {
      if (r.timestamp) {
        var d = new Date(r.timestamp);
        d.setHours(0, 0, 0, 0);
        days[d.getTime()] = true;
      }
    });

    var sorted = Object.keys(days).map(Number).sort(function (a, b) { return b - a; });
    if (sorted.length === 0) return 0;

    var count = 1;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var yesterday = today.getTime() - 86400000;

    if (sorted[0] !== today.getTime() && sorted[0] !== yesterday) return 0;

    for (var i = 1; i < sorted.length; i++) {
      if (sorted[i - 1] - sorted[i] === 86400000) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  // ============================================================
  // 3. 页面渲染
  // ============================================================
  function renderEvidenceLibrary() {
    var stats = computeStats();

    var container = document.getElementById('v3-evidence-library');
    if (!container) {
      container = document.createElement('div');
      container.id = 'v3-evidence-library';
      // 找到页面内容区域
      var growthPage = document.getElementById('page-growth');
      if (growthPage) {
        var content = growthPage.querySelector('.page-content');
        if (content) {
          content.insertBefore(container, content.firstChild);
        }
      }
    }

    if (!container) return;

    // 主展示区
    var mainCard =
      '<div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:20px;padding:20px;color:#fff;margin-bottom:16px;box-shadow:0 8px 24px rgba(124,58,237,0.3);">' +
        '<div style="font-size:14px;font-weight:600;opacity:0.9;margin-bottom:12px;">🏆 勇气证据库</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-end;">' +
          '<div>' +
            '<div style="font-size:36px;font-weight:800;">' + stats.totalChallenges + '</div>' +
            '<div style="font-size:12px;opacity:0.8;">次挑战已完成</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:24px;font-weight:700;color:#fbbf24;">' + stats.fearNotRealized + '</div>' +
            '<div style="font-size:11px;opacity:0.8;">次预想的坏事没有发生</div>' +
          '</div>' +
        '</div>' +
        (stats.fearPredicted > 0 ?
          '<div style="margin-top:12px;padding:10px;background:rgba(255,255,255,0.15);border-radius:12px;">' +
            '<div style="font-size:12px;line-height:1.5;">' +
              '📊 在你感到害怕的 ' + stats.fearPredicted + ' 次中，有 ' + stats.fearNotRealized + ' 次结果并没有你想的那么糟。<br>' +
              '<b>成功率 ' + stats.successRate + '%</b> — 你的勇气正在改变你的认知。' +
            '</div>' +
          '</div>'
        : '<div style="margin-top:12px;padding:10px;background:rgba(255,255,255,0.15);border-radius:12px;">' +
            '<div style="font-size:12px;">完成更多现实挑战，这里会记录你的勇气成长。</div>' +
          '</div>') +
      '</div>';

    // 本周概况（免费）
    var weeklyCard =
      '<div style="background:#fff;border-radius:16px;padding:16px;border:1px solid #f3f4f6;margin-bottom:12px;">' +
        '<div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:12px;">📅 本周概况</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
          '<div style="text-align:center;padding:10px;background:#f5f3ff;border-radius:12px;">' +
            '<div style="font-size:20px;font-weight:700;color:#7c3aed;">' + stats.weeklyChallenges + '</div>' +
            '<div style="font-size:10px;color:#6b7280;margin-top:2px;">本周挑战</div>' +
          '</div>' +
          '<div style="text-align:center;padding:10px;background:#f0fdf4;border-radius:12px;">' +
            '<div style="font-size:20px;font-weight:700;color:#22c55e;">' + stats.weeklyFearNotRealized + '</div>' +
            '<div style="font-size:10px;color:#6b7280;margin-top:2px;">恐惧未应验</div>' +
          '</div>' +
          '<div style="text-align:center;padding:10px;background:#fef3c7;border-radius:12px;">' +
            '<div style="font-size:20px;font-weight:700;color:#d97706;">' + stats.consecutiveDays + '</div>' +
            '<div style="font-size:10px;color:#6b7280;margin-top:2px;">连续天数</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 感受分布
    var feelingsCard = '';
    if (stats.totalChallenges > 0) {
      var total = stats.feelings.nervous + stats.feelings.nervous_but_did + stats.feelings.smooth;
      if (total > 0) {
        feelingsCard =
          '<div style="background:#fff;border-radius:16px;padding:16px;border:1px solid #f3f4f6;margin-bottom:12px;">' +
            '<div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:12px;">💭 你的感受分布</div>' +
            renderBar('😰 紧张', stats.feelings.nervous, total, '#ef4444') +
            renderBar('😅 紧张但做了', stats.feelings.nervous_but_did, total, '#f59e0b') +
            renderBar('😊 还挺顺利', stats.feelings.smooth, total, '#22c55e') +
          '</div>';
      }
    }

    // 对方反应分布
    var reactionsCard = '';
    if (stats.totalChallenges > 0) {
      var rTotal = stats.reactions.friendly + stats.reactions.normal + stats.reactions.didnt_notice + stats.reactions.cold;
      if (rTotal > 0) {
        reactionsCard =
          '<div style="background:#fff;border-radius:16px;padding:16px;border:1px solid #f3f4f6;margin-bottom:12px;">' +
            '<div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:12px;">🤝 对方反应分布</div>' +
            renderBar('😊 友好', stats.reactions.friendly, rTotal, '#22c55e') +
            renderBar('😐 正常', stats.reactions.normal, rTotal, '#6b7280') +
            renderBar('🤷 没注意', stats.reactions.didnt_notice, rTotal, '#9ca3af') +
            renderBar('😞 不太热情', stats.reactions.cold, rTotal, '#ef4444') +
          '</div>';
      }
    }

    // 深度报告付费点
    var reportCard =
      '<div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:16px;padding:16px;border:1px solid rgba(245,158,11,0.2);margin-bottom:16px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
          '<span style="font-size:20px;">📊</span>' +
          '<div style="font-size:14px;font-weight:600;color:#92400e;">认知模式改变报告</div>' +
        '</div>' +
        '<div style="font-size:12px;color:#78350f;line-height:1.5;margin-bottom:12px;">' +
          '分析你的恐惧模式、应对策略和认知变化趋势。<br>' +
          '每周免费查看本周概况，完整报告需 5 社交币。' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button onclick="window.V3Evidence.showWeeklyReport()" style="flex:1;padding:10px;border-radius:10px;border:1px solid #d97706;background:#fff;color:#92400e;font-size:12px;font-weight:500;cursor:pointer;">免费看本周</button>' +
          '<button onclick="window.V3Evidence.purchaseFullReport()" style="flex:1;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:12px;font-weight:600;cursor:pointer;">💎 5币解锁完整报告</button>' +
        '</div>' +
      '</div>';

    // 声明
    var disclaimer =
      '<div style="text-align:center;padding:12px;font-size:11px;color:#9ca3af;line-height:1.5;">' +
        '📌 这里只展示你个人的成长记录，没有排名、没有比较。<br>' +
        '个人成长记录与勇气证据永久保留，绝不清零。' +
      '</div>';

    container.innerHTML = mainCard + weeklyCard + feelingsCard + reactionsCard + reportCard + disclaimer;
  }

  function renderBar(label, count, total, color) {
    var pct = total > 0 ? Math.round(count / total * 100) : 0;
    return '<div style="margin-bottom:8px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-bottom:3px;">' +
        '<span>' + label + '</span>' +
        '<span>' + count + '次 (' + pct + '%)</span>' +
      '</div>' +
      '<div style="height:6px;background:#f3f4f6;border-radius:3px;overflow:hidden;">' +
        '<div style="height:100%;background:' + color + ';border-radius:3px;width:' + pct + '%;transition:width 0.5s;"></div>' +
      '</div>' +
    '</div>';
  }

  // ============================================================
  // 4. 付费报告
  // ============================================================
  function showWeeklyReport() {
    var stats = computeStats();
    var report =
      '📅 本周勇气概况\n\n' +
      '• 完成挑战：' + stats.weeklyChallenges + ' 次\n' +
      '• 预想坏事未发生：' + stats.weeklyFearNotRealized + ' 次\n' +
      '• 本周成功率：' + stats.weeklySuccessRate + '%\n' +
      '• 连续挑战天数：' + stats.consecutiveDays + ' 天\n\n' +
      '你的勇气正在积累，继续保持！';

    showToast(report);
  }

  function purchaseFullReport() {
    if (!E) { showToast('经济系统未加载'); return; }

    var cur = E.getCurrency();
    if (cur.socialCoin < 5) {
      showToast('💎 社交币不足，需要5社交币');
      if (typeof window.V3UI !== 'undefined' && window.V3UI.showRechargeModal) {
        window.V3UI.showRechargeModal();
      }
      return;
    }

    // 确认弹窗
    E.requestCoinPayment(5, '解锁认知模式改变报告', function () {
      showToast('📊 报告已解锁！正在生成...');
      generateFullReport();
    });
  }

  function generateFullReport() {
    var stats = computeStats();
    var all = getAllChallengeRecords();

    var report = '📊 认知模式改变报告\n\n';
    report += '🔢 总览\n';
    report += '• 总挑战次数：' + stats.totalChallenges + '\n';
    report += '• 预想坏事次数：' + stats.fearPredicted + '\n';
    report += '• 坏事未发生：' + stats.fearNotRealized + '\n';
    report += '• 整体成功率：' + stats.successRate + '%\n';
    report += '• 活跃天数：' + stats.activeDays + '\n';
    report += '• 连续挑战：' + stats.consecutiveDays + ' 天\n\n';

    report += '💭 感受分析\n';
    report += '• 紧张：' + stats.feelings.nervous + ' 次\n';
    report += '• 紧张但做了：' + stats.feelings.nervous_but_did + ' 次\n';
    report += '• 还挺顺利：' + stats.feelings.smooth + ' 次\n\n';

    report += '🤝 对方反应\n';
    report += '• 友好：' + stats.reactions.friendly + ' 次\n';
    report += '• 正常：' + stats.reactions.normal + ' 次\n';
    report += '• 没注意：' + stats.reactions.didnt_notice + ' 次\n';
    report += '• 不太热情：' + stats.reactions.cold + ' 次\n\n';

    if (stats.successRate >= 70) {
      report += '✨ 你的认知正在积极转变！大多数时候，你预想的坏事并没有发生。这说明你的焦虑往往高估了风险。\n';
    } else if (stats.successRate >= 40) {
      report += '💪 你已经有了不少成功的经历。继续练习，你会发现恐惧并没有想象中那么可怕。\n';
    } else {
      report += '🌱 每一次尝试都是勇气的证明。不需要每次都"成功"，做了就是胜利。\n';
    }

    showToast(report);
  }

  // ============================================================
  // 5. 成长页入口注入
  // ============================================================
  function injectGrowthPageEntry() {
    // 在成长页"关卡进度"之前插入勇气证据库入口卡片
    var levelSection = document.querySelector('#page-growth [data-page-node-id="nUtBc26w4BxdtzFtxCyUoP"]');
    if (!levelSection) return;
    if (document.getElementById('v3-evidence-entry')) return; // 已注入

    var entry = document.createElement('div');
    entry.id = 'v3-evidence-entry';
    entry.className = 'bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 shadow-sm mb-3 cursor-pointer border border-amber-100';
    entry.onclick = function () { renderEvidenceLibrary(); };

    // 读取当前统计
    var stats = computeStats();
    var totalRecords = stats.totalChallenges || 0;
    var successRate = stats.successRate || 0;

    entry.innerHTML =
      '<div class="flex items-center justify-between mb-2">' +
        '<h3 class="text-sm font-semibold text-gray-800">🏆 勇气证据库</h3>' +
        '<span class="text-xs text-amber-600">查看你的勇敢时刻 →</span>' +
      '</div>' +
      '<div class="flex items-center gap-4">' +
        '<div class="text-center">' +
          '<div class="text-2xl font-bold text-amber-600">' + totalRecords + '</div>' +
          '<div class="text-[10px] text-gray-500 mt-0.5">次记录</div>' +
        '</div>' +
        '<div class="text-center">' +
          '<div class="text-2xl font-bold text-green-600">' + successRate + '%</div>' +
          '<div class="text-[10px] text-gray-500 mt-0.5">恐惧落空率</div>' +
        '</div>' +
        '<div class="text-center">' +
          '<div class="text-2xl font-bold text-purple-600">' + stats.consecutiveDays + '</div>' +
          '<div class="text-[10px] text-gray-500 mt-0.5">连续挑战</div>' +
        '</div>' +
        '<div class="flex-1 text-right">' +
          '<div class="text-[11px] text-gray-500">每一次面对恐惧</div>' +
          '<div class="text-[11px] text-gray-500">都值得被看见</div>' +
        '</div>' +
      '</div>';

    levelSection.parentNode.insertBefore(entry, levelSection);
  }

  // ============================================================
  // 6. 初始化
  // ============================================================
  function init() {
    // 注入成长页入口
    setTimeout(injectGrowthPageEntry, 1500);
    setTimeout(injectGrowthPageEntry, 4000);

    // 延迟渲染（用户点击后才会真正展示）
    // renderEvidenceLibrary 由入口卡片的 onclick 触发

    // 暴露接口
    window.V3Evidence = {
      render: renderEvidenceLibrary,
      computeStats: computeStats,
      showWeeklyReport: showWeeklyReport,
      purchaseFullReport: purchaseFullReport,
      getAllRecords: getAllChallengeRecords,
      getWeeklyRecords: getWeeklyRecords,
      refreshEntry: injectGrowthPageEntry
    };

    console.log('[V3Evidence] 勇气证据库初始化完成');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
