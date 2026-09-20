/**
 * 对练社交 V3.0 — 学习卡片增强
 * 
 * 功能：
 * 1. 学习卡片列表滑动修复（底部安全距离≥80px，防Tab遮挡）
 * 2. 课程详情页（课程正文 + 核心原则 + 红线提示）
 * 3. 【一键去AI演练此场景】按钮 + scenario_id 跳转
 * 4. 免费体验名额控制（free_scenarios_used）
 * 5. 入口不拦截，能量不足时进入后引导充值
 */
(function () {
  'use strict';

  var E = window.V3Economy;

  // ============================================================
  // 1. 列表滑动修复 — 底部安全距离
  // ============================================================
  function fixCardListScroll() {
    var cardModule = document.getElementById('training-card-module');
    if (!cardModule) return;

    var cardList = document.getElementById('training-card-list');
    if (cardList) {
      // 确保有足够底部空间不被Tab遮挡
      cardList.style.paddingBottom = '100px';
      cardList.style.overflowY = 'visible';
      cardList.style.webkitOverflowScrolling = 'touch';
    }

    var loadMore = document.getElementById('training-card-load-more');
    if (loadMore) {
      loadMore.style.marginBottom = '100px';
    }

    // 整个模块滚动支持
    cardModule.style.overflowY = 'auto';
    cardModule.style.webkitOverflowScrolling = 'touch';
  }

  // ============================================================
  // 2. 课程详情数据 — 从 learningCards / templateScenes 构建
  // ============================================================
  var courseDetails = {};

  function buildCourseDetails() {
    // 构建 scene name → templateScene id 映射表
    var sceneNameToId = {};
    if (window.templateScenes && Array.isArray(window.templateScenes)) {
      window.templateScenes.forEach(function (s) {
        if (s.name) sceneNameToId[s.name] = s.id;
      });
    }

    // 从 knowledgeLearningCards 数组（knowledge_base 加载的全局变量）
    if (window.knowledgeLearningCards && Array.isArray(window.knowledgeLearningCards)) {
      window.knowledgeLearningCards.forEach(function (card) {
        if (!card || !card.id) return;
        // 优先用 bindScenario/scenario_id，其次按 scene 名称匹配 templateScenes
        var sid = card.bindScenario || card.scenario_id || null;
        if (!sid && card.scene && sceneNameToId[card.scene] !== undefined) {
          sid = sceneNameToId[card.scene];
        }
        courseDetails[card.id] = {
          id: card.id,
          title: card.title || '知识点',
          category: card.category || '社交沟通',
          scene: card.scene || '通用场景',
          content: card.content || card.principle || '',
          principle: card.principle || '',
          practicePrompt: card.practicePrompt || '',
          safetyNote: card.safetyNote || '请结合真实情况改写，不编造、不施压。',
          tips: card.tips || [],
          scenarioId: sid,
          isLearningCard: true
        };
      });
    }

    // 从 templateScenes（训练场景模板）
    if (window.templateScenes && Array.isArray(window.templateScenes)) {
      window.templateScenes.forEach(function (scene) {
        var key = 'scene_' + scene.id;
        if (!courseDetails[key]) {
          courseDetails[key] = {
            id: key,
            title: scene.name || '训练场景',
            category: scene.type || '通用',
            content: scene.desc || '',
            principle: '在模拟中练习，在真实中检验效果。',
            practicePrompt: '用你自己的话完成一次表达',
            safetyNote: '请结合真实情况改写，不编造、不施压。',
            tips: [],
            scenarioId: scene.id,
            difficulty: scene.difficulty || 1,
            isScene: true
          };
        }
      });
    }

    // 从 realChallengeLevels（真实挑战剧情）
    if (window.realChallengeLevels && Array.isArray(window.realChallengeLevels)) {
      window.realChallengeLevels.forEach(function (level) {
        var key = 'challenge_' + level.id;
        if (!courseDetails[key]) {
          courseDetails[key] = {
            id: key,
            title: level.title || '挑战',
            category: level.category || '通用',
            content: level.story || level.description || '',
            principle: level.focus || '关注过程，而非结果。',
            practicePrompt: '在真实场景中完成一次尝试',
            safetyNote: '未完成也没关系，机会永远都在。',
            tips: [],
            scenarioId: level.id,
            difficulty: level.difficultyStars || 1,
            isChallenge: true,
            world: level.worldName
          };
        }
      });
    }
  }

  // ============================================================
  // 3. 课程详情页渲染
  // ============================================================
  function showCourseDetail(courseId) {
    var course = courseDetails[courseId];
    if (!course) {
      // 尝试从 learningCards 实时查找
      if (window.knowledgeLearningCards && Array.isArray(window.knowledgeLearningCards)) {
        var found = window.knowledgeLearningCards.find(function (c) { return c.id === courseId; });
        if (found) {
          course = {
            id: found.id,
            title: found.title || '知识点',
            category: found.category || '社交沟通',
            scene: found.scene || '通用场景',
            content: found.content || '',
            principle: found.principle || '',
            practicePrompt: found.practicePrompt || '',
            safetyNote: found.safetyNote || '请结合真实情况改写。',
            tips: found.tips || [],
            isLearningCard: true
          };
          courseDetails[courseId] = course;
        }
      }
    }

    if (!course) {
      showToast('课程数据加载中，请稍后重试');
      return;
    }

    // 关闭已有详情
    var existing = document.getElementById('v3-course-detail');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'v3-course-detail';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '9990';

    // 红线提示
    var redLinesHtml =
      '<div style="margin-top:16px;">' +
        '<div style="font-size:13px;font-weight:600;color:#dc2626;margin-bottom:8px;">🚫 红线提示</div>' +
        '<div style="padding:10px 12px;background:#fef2f2;border-radius:10px;border:1px solid rgba(220,38,38,0.1);">' +
          '<div style="font-size:12px;color:#991b1b;line-height:1.6;">⚠ ' + escapeHtml(course.safetyNote || '不评判、不否定、不施压。请结合真实情况改写。') + '</div>' +
        '</div>' +
      '</div>';

    // Tips 标签
    var tipsHtml = '';
    if (course.tips && course.tips.length > 0) {
      tipsHtml = '<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">' +
        course.tips.map(function (t) {
          return '<span style="padding:4px 10px;background:#f5f3ff;color:#6d28d9;border-radius:8px;font-size:11px;">' + escapeHtml(t) + '</span>';
        }).join('') +
      '</div>';
    }

    // 演练按钮
    var practiceBtnHtml = '';
    if (course.scenarioId || course.isScene || course.isChallenge || course.isLearningCard) {
      practiceBtnHtml =
        '<button id="v3-practice-scene-btn" style="width:100%;margin-top:20px;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(124,58,237,0.3);transition:transform 0.15s;">' +
          '🎯 一键去AI演练此场景' +
        '</button>' +
        '<div style="text-align:center;margin-top:6px;font-size:11px;color:#9ca3af;">首次进入免费体验，不会在入口拦截</div>';
    }

    // 练习提示
    var practiceHtml = '';
    if (course.practicePrompt) {
      practiceHtml =
        '<div style="margin-top:12px;padding:10px 12px;background:#f0fdf4;border-radius:10px;border:1px solid rgba(34,197,94,0.12);">' +
          '<div style="font-size:12px;font-weight:500;color:#166534;margin-bottom:4px;">🎯 练习提示</div>' +
          '<div style="font-size:12px;color:#15803d;">' + escapeHtml(course.practicePrompt) + '</div>' +
        '</div>';
    }

    var difficultyStars = course.difficulty ? '⭐'.repeat(Math.min(course.difficulty, 5)) : '';
    var worldLabel = course.world ? '<span style="margin-left:8px;padding:2px 8px;background:#f3e8ff;color:#7c3aed;border-radius:99px;font-size:11px;">' + course.world + '</span>' : '';

    modal.innerHTML =
      '<div style="max-width:420px;width:calc(100% - 32px);max-height:85vh;overflow-y:auto;background:#fff;border-radius:20px;padding:0;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);">' +
        '<div style="position:sticky;top:0;background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:20px;border-radius:20px 20px 0 0;z-index:1;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
            '<div style="flex:1;">' +
              '<div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:4px;">' + escapeHtml(course.title) + '</div>' +
              '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,0.8);">' +
                '<span>' + escapeHtml(course.category) + '</span>' +
                (course.scene ? '<span>·</span><span>' + escapeHtml(course.scene) + '</span>' : '') +
                (difficultyStars ? '<span>·</span><span>' + difficultyStars + '</span>' : '') +
                worldLabel +
              '</div>' +
            '</div>' +
            '<button onclick="document.getElementById(\'v3-course-detail\').remove()" style="color:rgba(255,255,255,0.7);font-size:20px;background:none;border:none;cursor:pointer;padding:0 4px;">✕</button>' +
          '</div>' +
        '</div>' +
        '<div style="padding:20px;">' +
          // 课程正文
          '<div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">📖 课程正文</div>' +
          '<div style="font-size:13px;color:#4b5563;line-height:1.7;background:#f9fafb;padding:14px;border-radius:12px;border:1px solid #f3f4f6;">' +
            escapeHtml(course.content || '本节内容将帮助你掌握「' + course.title + '」的核心技巧。') +
          '</div>' +
          // 核心原则
          '<div style="margin-top:16px;">' +
            '<div style="font-size:13px;font-weight:600;color:#1e40af;margin-bottom:8px;">📌 核心原则</div>' +
            '<div style="padding:10px 12px;background:#eff6ff;border-radius:10px;border:1px solid rgba(30,64,175,0.1);font-size:12px;color:#1e40af;line-height:1.6;">' +
              escapeHtml(course.principle || '结合真实信息，尊重对方边界。') +
            '</div>' +
          '</div>' +
          tipsHtml +
          practiceHtml +
          redLinesHtml +
          practiceBtnHtml +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    // 绑定演练按钮
    var practiceBtn = document.getElementById('v3-practice-scene-btn');
    if (practiceBtn) {
      practiceBtn.onclick = function () { navigateToPractice(course); };
      practiceBtn.onmousedown = function () { this.style.transform = 'scale(0.97)'; };
      practiceBtn.onmouseup = function () { this.style.transform = 'scale(1)'; };
    }

    // 点击背景关闭
    modal.onclick = function (e) {
      if (e.target === modal) modal.remove();
    };
  }

  // ============================================================
  // 4. 【一键去AI演练此场景】跳转逻辑
  // ============================================================
  function navigateToPractice(course) {
    var detail = document.getElementById('v3-course-detail');
    if (detail) detail.remove();

    var scenarioId = course.scenarioId;

    // 记录免费体验
    var profile = getV3Profile();
    var usedScenarios = profile.free_scenarios_used || [];
    if (scenarioId && usedScenarios.indexOf(String(scenarioId)) === -1) {
      usedScenarios.push(String(scenarioId));
      profile.free_scenarios_used = usedScenarios;
      saveV3Profile(profile);
    }

    // 检查能量（不在入口拦截）
    if (E) {
      var cur = E.checkDailyEnergyRefresh();
      if (cur.energy <= 0) {
        showToast('⚡ 能量不足，进入场景后可购买能量包继续');
      }
    }

    // 跳转
    if (course.isChallenge) {
      jumpToChallenge(scenarioId);
    } else if (course.isScene) {
      jumpToTraining(scenarioId);
    } else if (scenarioId) {
      // 学习卡片绑定的场景 — 先尝试在 templateScenes 找
      if (window.templateScenes && Array.isArray(window.templateScenes)) {
        var scene = window.templateScenes.find(function (s) { return s.id === scenarioId; });
        if (scene) { jumpToTraining(scene.id); return; }
      }
      if (window.realChallengeLevels && Array.isArray(window.realChallengeLevels)) {
        var level = window.realChallengeLevels.find(function (l) { return l.id === scenarioId; });
        if (level) { jumpToChallenge(level.id); return; }
      }
      // 兜底
      showToast('已为你跳转到训练中心，请选择对应场景');
      if (typeof window.showView === 'function') window.showView('page-training');
    } else {
      // 没有绑定场景 — 跳转到训练中心
      showToast('已跳转到训练中心');
      if (typeof window.showView === 'function') window.showView('page-training');
    }
  }

  function jumpToChallenge(challengeId) {
    closeAllModals();
    setTimeout(function () {
      if (typeof window.startChallenge === 'function') {
        window.startChallenge(challengeId);
      } else {
        showToast('正在跳转到挑战场景...');
        if (typeof window.showChallenge === 'function') window.showChallenge();
      }
    }, 300);
  }

  function jumpToTraining(sceneId) {
    closeAllModals();
    setTimeout(function () {
      if (typeof window.startTraining === 'function') {
        window.startTraining(sceneId);
      } else {
        showToast('正在跳转到训练场景...');
        if (typeof window.showView === 'function') window.showView('page-training');
      }
    }, 300);
  }

  function closeAllModals() {
    var overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(function (m) {
      if (m.id !== 'v3-course-detail' && m.style.display !== 'none') m.style.display = 'none';
    });
  }

  // ============================================================
  // 5. 给现有卡片注入"去AI演练"按钮
  // ============================================================
  function enhanceCardRendering() {
    // Hook renderCardItem — 在原有渲染结果上追加按钮
    if (typeof window.renderCardItem !== 'function') {
      // 等待函数加载
      setTimeout(enhanceCardRendering, 1000);
      return;
    }

    var _origRenderCardItem = window.renderCardItem;
    window.renderCardItem = function (card) {
      var html = _origRenderCardItem(card);

      // 课程库列表只放"查看详情"一个按钮
      // 演练功能只在课程详情页里提供，不在列表页占位
      var practiceBtn =
        '<div class="relative z-10 mt-3">' +
          '<button onclick="event.stopPropagation();window.V3Learning.showCourseDetail(' + JSON.stringify(card.id) + ')" class="w-full py-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-xs font-medium hover:bg-indigo-50 transition-colors">📖 查看详情 · 学习完整课程</button>' +
        '</div>';

      html = html.replace('</article>', practiceBtn + '</article>');
      return html;
    };
  }

  function quickPractice(cardId) {
    var course = courseDetails[cardId];
    if (course) {
      navigateToPractice(course);
    } else {
      // 尝试从 knowledgeLearningCards 构建
      if (window.knowledgeLearningCards && Array.isArray(window.knowledgeLearningCards)) {
        var card = window.knowledgeLearningCards.find(function (c) { return c.id === cardId; });
        if (card) {
          // 按 scene 名称匹配 templateScenes id
          var sid = card.bindScenario || card.scenario_id || null;
          if (!sid && card.scene && window.templateScenes) {
            var matched = window.templateScenes.find(function (s) { return s.name === card.scene; });
            if (matched) sid = matched.id;
          }
          courseDetails[cardId] = {
            id: card.id,
            title: card.title,
            category: card.category,
            scene: card.scene || '通用场景',
            content: card.content || card.principle || '',
            practicePrompt: card.practicePrompt || '',
            safetyNote: card.safetyNote || '',
            tips: card.tips || [],
            scenarioId: sid,
            isLearningCard: true
          };
          navigateToPractice(courseDetails[cardId]);
        }
      }
    }
  }

  // ============================================================
  // 6. LocalStorage 辅助
  // ============================================================
  function getV3Profile() {
    try {
      var raw = localStorage.getItem('duilian_profile');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveV3Profile(profile) {
    localStorage.setItem('duilian_profile', JSON.stringify(profile));
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  // ============================================================
  // 7. 初始化
  // ============================================================
  function init() {
    // 修复滑动
    fixCardListScroll();

    // 构建详情数据（多次尝试，等待知识库加载）
    setTimeout(buildCourseDetails, 800);
    setTimeout(buildCourseDetails, 2500);
    setTimeout(buildCourseDetails, 5000);

    // 增强卡片渲染
    setTimeout(enhanceCardRendering, 1000);

    // 暴露接口
    window.V3Learning = {
      showCourseDetail: showCourseDetail,
      navigateToPractice: navigateToPractice,
      quickPractice: quickPractice,
      buildCourseDetails: buildCourseDetails,
      getCourseDetails: function () { return courseDetails; }
    };

    console.log('[V3Learn] 学习卡片增强初始化完成');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
