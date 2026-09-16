/**
 * 对练社交 V3.0 — P0 冒烟测试清单
 * 
 * 在浏览器控制台中运行此脚本，逐项检查 P0 功能是否正常。
 * 使用方法：打开 index.html → F12 控制台 → 粘贴执行
 */
(function () {
  'use strict';
  
  var results = [];
  var pass = 0;
  var fail = 0;

  function test(name, fn) {
    try {
      var result = fn();
      if (result === true || result === undefined) {
        results.push('✅ ' + name);
        pass++;
      } else {
        results.push('❌ ' + name + ' — ' + result);
        fail++;
      }
    } catch (e) {
      results.push('❌ ' + name + ' — 异常: ' + e.message);
      fail++;
    }
  }

  console.log('=== 对练社交 V3.0 P0 冒烟测试 ===\n');

  // 1. V3 模块加载
  test('1. V3Economy 模块加载', function () {
    if (!window.V3Economy) return 'V3Economy 未定义';
    if (typeof window.V3Economy.getCurrency !== 'function') return 'getCurrency 方法缺失';
    return true;
  });

  test('1b. V3UI 模块加载', function () {
    if (!window.V3UI) return 'V3UI 未定义';
    return true;
  });

  test('1c. V3Learning 模块加载', function () {
    if (!window.V3Learning) return 'V3Learning 未定义';
    return true;
  });

  test('1d. V3Mutation 模块加载', function () {
    if (!window.V3Mutation) return 'V3Mutation 未定义';
    return true;
  });

  test('1e. V3D 模块加载', function () {
    if (!window.V3D) return 'V3D 未定义';
    return true;
  });

  // 2. 经济体系
  test('2. 三币初始化', function () {
    var cur = window.V3Economy.getCurrency();
    if (!cur) return 'getCurrency 返回空';
    if (typeof cur.energy !== 'number') return 'energy 不是数字';
    if (typeof cur.socialCoin !== 'number') return 'socialCoin 不是数字';
    if (typeof cur.growth !== 'number') return 'growth 不是数字';
    return true;
  });

  test('2b. 能量每日刷新逻辑', function () {
    var cur = window.V3Economy.checkDailyEnergyRefresh();
    if (!cur) return 'checkDailyEnergyRefresh 返回空';
    if (cur.energy > cur.energyMax) return '能量超过上限';
    return true;
  });

  test('2c. 能量消耗保护（不能为负）', function () {
    // 连续消耗直到不足
    var cur = window.V3Economy.getCurrency();
    var initialEnergy = cur.energy;
    for (var i = 0; i < 10; i++) {
      window.V3Economy.consumeEnergy();
    }
    var after = window.V3Economy.getCurrency();
    if (after.energy < 0) return '能量变成负数: ' + after.energy;
    // 恢复
    var raw = localStorage.getItem('duilian_currency');
    if (raw) {
      var data = JSON.parse(raw);
      data.energy = initialEnergy;
      localStorage.setItem('duilian_currency', JSON.stringify(data));
    }
    return true;
  });

  // 3. LocalStorage 键名
  test('3. LocalStorage 键名约定', function () {
    var keys = ['duilian_profile', 'duilian_currency'];
    for (var i = 0; i < keys.length; i++) {
      var val = localStorage.getItem(keys[i]);
      // 键可能不存在（新用户），只要不报错就行
      if (val !== null) {
        try { JSON.parse(val); } catch (e) { return keys[i] + ' 不是有效JSON'; }
      }
    }
    return true;
  });

  // 4. 危机热线
  test('4. 危机热线按钮存在', function () {
    var btn = document.getElementById('v3-crisis-hotline-btn');
    if (!btn) return '按钮未找到（可能延迟加载）';
    if (btn.title.indexOf('12356') === -1) return '按钮标题不含12356';
    return true;
  });

  // 5. 经济状态栏
  test('5. 首页经济状态栏', function () {
    var bar = document.getElementById('v3-economy-bar');
    if (!bar) return '状态栏未找到（可能延迟加载）';
    return true;
  });

  // 6. 文案替换
  test('6. "我的作业"已替换为"现实挑战"', function () {
    var found = false;
    document.querySelectorAll('*').forEach(function (el) {
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
        if (el.textContent.includes('我的作业')) found = true;
      }
    });
    if (found) return '仍存在"我的作业"文案';
    return true;
  });

  // 7. 学习卡片增强
  test('7. 学习卡片底部安全距离', function () {
    var list = document.getElementById('training-card-list');
    if (!list) return true; // 模块可能未显示
    var pb = parseInt(list.style.paddingBottom || '0');
    if (pb < 80) return '底部间距不足: ' + pb + 'px';
    return true;
  });

  // 8. 突变模块
  test('8. 突变类型定义完整', function () {
    var types = window.V3Mutation.MUTATION_TYPES;
    if (!types) return 'MUTATION_TYPES 未定义';
    if (!types.SILENCE) return '缺少 SILENCE';
    if (!types.INTERRUPTION) return '缺少 INTERRUPTION';
    if (!types.QUESTIONING) return '缺少 QUESTIONING';
    return true;
  });

  // 9. 场景图资源
  test('9. 写实场景图路径正确', function () {
    var catalog = window.challengeSceneCatalog;
    if (!catalog) return 'challengeSceneCatalog 未定义';
    var expected = ['office', 'cafe', 'community', 'family', 'service', 'market', 'home', 'public', 'auto'];
    for (var i = 0; i < expected.length; i++) {
      if (!catalog[expected[i]]) return '缺少场景: ' + expected[i];
    }
    return true;
  });

  // 10. 埋点接口
  test('10. 埋点事件接口', function () {
    if (typeof window.V3Economy.trackAiTrainingCompleted !== 'function') return 'trackAiTrainingCompleted 缺失';
    if (typeof window.V3Economy.trackChallengeAccepted !== 'function') return 'trackChallengeAccepted 缺失';
    if (typeof window.V3Economy.trackChallengeCompleted !== 'function') return 'trackChallengeCompleted 缺失';
    return true;
  });

  // 11. 勇气证据库模块
  test('11. V3Evidence 模块加载', function () {
    if (!window.V3Evidence) return 'V3Evidence 未定义';
    if (typeof window.V3Evidence.render !== 'function') return 'render 方法缺失';
    if (typeof window.V3Evidence.computeStats !== 'function') return 'computeStats 方法缺失';
    return true;
  });

  test('11b. 勇气证据库成长页入口', function () {
    var entry = document.getElementById('v3-evidence-entry');
    if (!entry) return '入口卡片未找到（可能延迟加载）';
    return true;
  });

  // 12. 协议折叠UI模块
  test('12. V3Protocol 模块加载', function () {
    if (!window.V3Protocol) return 'V3Protocol 未定义';
    if (typeof window.V3Protocol.show !== 'function') return 'show 方法缺失';
    if (typeof window.V3Protocol.hasAcceptedAll !== 'function') return 'hasAcceptedAll 方法缺失';
    return true;
  });

  test('12b. 协议数据结构完整', function () {
    var protocols = window.V3Protocol.getProtocols();
    if (!protocols || !Array.isArray(protocols)) return 'getProtocols 返回异常';
    if (protocols.length < 3) return '协议数量不足3个';
    var ids = protocols.map(function(p) { return p.id; });
    if (ids.indexOf('disclaimer') === -1) return '缺少免责声明';
    if (ids.indexOf('service') === -1) return '缺少服务协议';
    if (ids.indexOf('privacy') === -1) return '缺少隐私政策';
    return true;
  });

  // 输出结果
  console.log('\n=== 测试结果 ===');
  results.forEach(function (r) { console.log(r); });
  console.log('\n通过: ' + pass + '/' + (pass + fail));
  if (fail > 0) {
    console.log('⚠️ 有 ' + fail + ' 项未通过，请检查！');
  } else {
    console.log('🎉 全部通过！');
  }

  return { pass: pass, fail: fail, results: results };
})();
