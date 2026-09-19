/**
 * 对练社交 V3.0 — 学习卡片增强模块
 * 1. 学习卡片滑动修复（底部安全距离）
 * 2. 课程详情页（课程正文 + 核心原则 + 红线提示）
 * 3. 【一键去AI演练此场景】按钮 + scenario_id 携带
 * 4. 首次免费体验逻辑
 * 
 * 依赖：v3_economy_loop.js
 */
(function () {
  'use strict';

  var E = window.V3Economy;

  // ============================================================
  // 1. 学习卡片滑动修复
  // ============================================================

  function fixLearningCardScroll() {
    // 确保所有学习卡片列表有足够底部安全距离
    var style = document.createElement('style');
    style.id = 'v3-learning-scroll-fix';
    style.textContent =
      '/* V3 学习卡片滑动修复 */\n' +
      '.page-content .training-card-module { padding-bottom: 120px !important; }\n' +
      '.page-content .training-card-module > *:last-child { margin-bottom: 80px; }\n' +
      '/* 课程列表安全区域 */\n' +
      '#knowledge-card-list { padding-bottom: 100px !important; }\n' +
      '#knowledge-card-list > .chapter-card:last-child { margin-bottom: 80px; }\n' +
      '/* 确保 lesson-row 可点击 */\n' +
      '.lesson-row { cursor: pointer; }\n' +
      '.lesson-row:active { background: #f5f3ff; }\n';
    document.head.appendChild(style);

    console.log('[V3Learn] 学习卡片滑动修复已应用');
  }

  // ============================================================
  // 2. 课程详情页弹窗
  // ============================================================

  /**
   * 显示课程详情页
   * @param {Object} card 学习卡片数据对象
   */
  function showLessonDetail(card) {
    if (!card) return;

    var existing = document.getElementById('v3-lesson-detail-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'v3-lesson-detail-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '9980';

    // 红线提示内容
    var safetyNote = card.safetyNote || '这是参考表达，不是固定答案；请替换为真实信息，不编造、不施压，并允许对方拒绝。';

    // 场景标签
    var tagsHTML = '';
    if (card.tags && card.tags.length) {
      tagsHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">';
      card.tags.forEach(function (tag) {
        tagsHTML += '<span style="padding:3px 10px;background:#f5f3ff;border:1px solid #ede9fe;border-radius:20px;font-size:11px;color:#6d28d9;">' + tag + '</span>';
      });
      tagsHTML += '</div>';
    }

    // 情绪与教练风格
    var metaInfo = '';
    if (card.userEmotion && card.userEmotion.length) {
      metaInfo += '<span style="padding:2px 8px;background:#fef3c7;border-radius:6px;font-size:10px;color:#92400e;margin-right:6px;">情绪：' + card.userEmotion.join('、') + '</span>';
    }
    if (card.coachStyle && card.coachStyle.length) {
      metaInfo += '<span style="padding:2px 8px;background:#ede9fe;border-radius:6px;font-size:10px;color:#5b21b6;">教练：' + card.coachStyle.join('、') + '</span>';
    }

    modal.innerHTML =
      '<div class="modal-content" style="max-width:420px;padding:0;overflow:hidden;max-height:88vh;display:flex;flex-direction:column;">' +
        '<!-- 头部 -->' +
        '<div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:20px;color:#fff;flex-shrink:0;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;">' +
            '<div>' +
              '<div style="font-size:10px;opacity:0.7;margin-bottom:2px;">' + (card.category || '学习卡片') + '</div>' +
              '<div style="font-size:16px;font-weight:700;">' + (card.title || '课程详情') + '</div>' +
              '<div style="font-size:12px;opacity:0.85;margin-top:2px;">📍 ' + (card.scene || '') + '</div>' +
            '</div>' +
            '<button onclick="document.getElementById(\'v3-lesson-detail-modal\').remove()" style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,0.2);color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>' +
          '</div>' +
          (metaInfo ? '<div style="margin-top:8px;">' + metaInfo + '</div>' : '') +
          tagsHTML +
        '</div>' +
        '<!-- 内容区 -->' +
        '<div style="flex:1;overflow-y:auto;padding:16px 20px;">' +
          '<!-- 课程正文 -->' +
          '<div style="margin-bottom:16px;">' +
            '<div style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
              '<span>📖</span> 课程正文' +
            '</div>' +
            '<div style="padding:14px;background:#f9fafb;border-radius:12px;border-left:3px solid #7c3aed;">' +
              '<div style="font-size:14px;color:#1f2937;line-height:1.8;font-style:italic;">' +
                '"' + (card.content || '') + '"' +
              '</div>' +
            '</div>' +
            (card.practicePrompt ? '<div style="margin-top:8px;font-size:12px;color:#667085;line-height:1.5;">🎯 练习要求：' + card.practicePrompt + '</div>' : '') +
          '</div>' +
          '<!-- 核心原则 -->' +
          '<div style="margin-bottom:16px;">' +
            '<div style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
              '<span>💡</span> 核心原则' +
            '</div>' +
            '<div style="padding:14px;background:#ecfdf5;border-radius:12px;border-left:3px solid #10b981;">' +
              '<div style="font-size:13px;color:#064e3b;line-height:1.7;">' + (card.principle || '') + '</div>' +
            '</div>' +
          '</div>' +
          '<!-- 红线提示 -->' +
          '<div style="margin-bottom:16px;">' +
            '<div style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
              '<span>🚨</span> 红线提示' +
            '</div>' +
            '<div style="padding:14px;background:#fef2f2;border-radius:12px;border-left:3px solid #ef4444;">' +
              '<div style="font-size:12px;color:#991b1b;line-height:1.6;">' + safetyNote + '</div>' +
            '</div>' +
          '</div>' +
          '<!-- 难度信息 -->' +
          (card.level || card.round ? '<div style="display:flex;gap:10px;margin-bottom:16px;">' +
            (card.level ? '<div style="padding:8px 12px;background:#f5f3ff;border-radius:10px;font-size:11px;color:#5b21b6;">难度：' + card.level + '</div>' : '') +
            (card.round ? '<div style="padding:8px 12px;background:#fef3c7;border-radius:10px;font-size:11px;color:#92400e;">回合：第' + card.round + '轮</div>' : '') +
          '</div>' : '') +
        '</div>' +
        '<!-- 底部操作区 -->' +
        '<div style="padding:12px 20px 16px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff;">' +
          '<button id="v3-lesson-practice-btn" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 12px rgba(124,58,237,0.3);transition:all .2s;">' +
            '🎯 一键去AI演练此场景' +
          '</button>' +
          '<div style="text-align:center;margin-top:6px;">' +
            '<span style="font-size:11px;color:#9ca3af;">首次演练免费 · 消耗1点能量</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    // 绑定"一键去AI演练"按钮
    var practiceBtn = document.getElementById('v3-lesson-practice-btn');
    practiceBtn.addEventListener('click', function () {
      modal.remove();
      goToPractice(card);
    });

    // 点击遮罩关闭
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.remove();
    });
  }

  // ============================================================
  // 3. 跳转到AI演练（携带 scenario_id）
  // ============================================================

  function goToPractice(card) {
    var scenarioId = card.id || card.scenarioId || '';

    // 检查是否首次免费
    var isFirstFree = E && E.useFreeScenario ? E.useFreeScenario(scenarioId) : true;

    if (!isFirstFree) {
      // 非首次，检查能量
      var cur = E ? E.checkDailyEnergyRefresh() : { energy: 3 };
      if (cur.energy <= 0) {
        // 能量不足，但不拦截入口，在进入后界面引导充值
        showToast('⚡ 能量不足，进入后可购买');
      }
    } else {
      showToast('🎁 首次演练免费体验！');
    }

    // 设置 scenario_id 到全局
    window.currentScenarioId = scenarioId;
    window.currentChallengeId = scenarioId;

    // 尝试使用 practicePrompt 作为初始对话
    if (card.practicePrompt) {
      window._v3_practicePrompt = card.practicePrompt;
    }

    // 跳转到训练中心
    if (typeof window.switchTab === 'function') {
      window.switchTab('challenge');
    } else if (typeof window.showTrainingCenter === 'function') {
      window.showTrainingCenter();
    } else {
      // 降级：找到挑战页并切换
      var pages = document.querySelectorAll('.page');
      pages.forEach(function (p) { p.classList.remove('active'); });
      var challengePage = document.getElementById('page-challenge') || 
                          document.getElementById('page-training');
      if (challengePage) {
        challengePage.classList.add('active');
      }
    }

    // 埋点
    if (E && E.trackEvent) {
      E.trackEvent('learning_to_practice', {
        scenario_id: scenarioId,
        card_title: card.title || '',
        is_first_free: isFirstFree,
        timestamp: new Date().toISOString()
      });
    }

    console.log('[V3Learn] 跳转到AI演练:', scenarioId);
  }

  // ============================================================
  // 4. 为现有学习卡片注入点击事件和演练按钮
  // ============================================================

  function injectDetailAndPracticeButtons() {
    // 找到所有 lesson-row 元素
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.addedNodes.length) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              attachToLessonRows(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 初始扫描
    attachToLessonRows(document);

    console.log('[V3Learn] 学习卡片注入已启动');
  }

  function attachToLessonRows(root) {
    var rows = root.querySelectorAll ? root.querySelectorAll('.lesson-row') : [];
    rows.forEach(function (row) {
      if (row._v3Enhanced) return;
      row._v3Enhanced = true;

      // ★ 修复：lesson-row 已有内联 onclick="KL_openDetailByAttr(this)"，
      // 不要再叠加 addEventListener('click')，否则会双弹窗。
      // 让原有的 KL_openDetailByAttr 正常工作，这里只追加演练按钮。

      // 在行尾添加演练按钮（独立点击，不冒泡）
      var existingBtn = row.querySelector('.v3-inline-practice-btn');
      if (!existingBtn) {
        var btn = document.createElement('button');
        btn.className = 'v3-inline-practice-btn';
        btn.textContent = '🎯 演练';
        btn.style.cssText = 'margin-left:auto;padding:4px 10px;border-radius:8px;border:1px solid #c4b5fd;background:#f5f3ff;color:#6d28d9;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .15s;';
        btn.addEventListener('mouseenter', function () {
          btn.style.background = '#ede9fe';
          btn.style.borderColor = '#7c3aed';
        });
        btn.addEventListener('mouseleave', function () {
          btn.style.background = '#f5f3ff';
          btn.style.borderColor = '#c4b5fd';
        });
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          var card = extractCardFromRow(row);
          if (card) goToPractice(card);
        });
        row.appendChild(btn);
      }
    });
  }

  function extractCardFromRow(row) {
    // 从 lesson-row 提取信息
    var title = '';
    var content = '';
    var scene = '';
    var category = '';

    // 尝试从行内元素获取
    var titleEl = row.querySelector('.lesson-title, .font-medium, [class*="title"]');
    if (titleEl) title = titleEl.textContent.trim();

    // 尝试从 window.knowledgeLearningCards 中查找
    if (typeof window.knowledgeLearningCards !== 'undefined' && title) {
      var found = window.knowledgeLearningCards.find(function (c) {
        return c.title === title || c.id === (row.dataset && row.dataset.cardId);
      });
      if (found) return found;
    }

    // 降级：从行文本构建基本卡片
    var allText = row.textContent.trim();
    return {
      id: (row.dataset && row.dataset.cardId) || 'row_' + Date.now(),
      title: title || allText.substring(0, 30),
      content: allText,
      scene: scene,
      category: category,
      principle: '',
      practicePrompt: '',
      tags: []
    };
  }

  // ============================================================
  // 5. 章节展开时自动增强
  // ============================================================

  function hookChapterToggle() {
    // 监听章节展开
    document.addEventListener('click', function (e) {
      var chapterHead = e.target.closest('.chapter-head');
      if (!chapterHead) return;

      // 延迟扫描新渲染的 lesson-row
      setTimeout(function () {
        var chapterBody = chapterHead.nextElementSibling;
        if (chapterBody) {
          attachToLessonRows(chapterBody);
        }
      }, 100);
    });
  }

  // ============================================================
  // 初始化
  // ============================================================

  function init() {
    fixLearningCardScroll();
    injectDetailAndPracticeButtons();
    hookChapterToggle();

    console.log('[V3Learn] 学习卡片增强模块已加载');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 公开接口
  window.V3Learn = {
    showLessonDetail: showLessonDetail,
    goToPractice: goToPractice,
    fixScroll: fixLearningCardScroll
  };

})();
