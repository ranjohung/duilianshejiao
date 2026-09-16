/**
 * 对练社交 V3.0 — UI组件层
 * 3秒记录卡弹窗 + 勇气证据库页面 + 冷启动卡片 + 危机热线悬浮按钮
 * 
 * 依赖：libs/v3_economy_loop.js（必须先加载）
 */
(function () {
  'use strict';

  var E = window.V3Economy;
  if (!E) { console.error('[V3UI] V3Economy 未加载'); return; }

  // ============================================================
  // 1. 3秒记录卡弹窗
  // ============================================================

  /**
   * 显示3秒记录卡
   * @param {Object} opts { scenarioId, challengeTier, onSubmit }
   */
  function showQuickRecordCard(opts) {
    opts = opts || {};
    var existing = document.getElementById('v3-quick-record-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'v3-quick-record-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '9998';
    modal.innerHTML =
    '<div class="modal-content" style="max-width:400px;padding:0;overflow:hidden;">' +
      '<!-- 头部 -->' +
      '<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:20px 20px 16px;color:#fff;">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:4px;">🎉 挑战完成！</div>' +
        '<div style="font-size:12px;opacity:0.8;">花3秒记录一下刚才的经历</div>' +
      '</div>' +
      '<!-- 内容 -->' +
      '<div style="padding:16px 20px 20px;">' +
        '<!-- 感受 -->' +
        '<div style="margin-bottom:16px;">' +
          '<div style="font-size:13px;font-weight:500;color:#374151;margin-bottom:8px;">你当时的感受</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;" id="v3-qr-feelings">' +
            '<label class="v3-qr-option" data-value="紧张" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;transition:all .15s;">' +
              '<input type="radio" name="v3-qr-feeling" value="紧张" style="accent-color:#7c3aed;"> ' +
              '<span style="font-size:13px;color:#374151;">😰 紧张</span>' +
            '</label>' +
            '<label class="v3-qr-option" data-value="有点紧张但做了" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;transition:all .15s;">' +
              '<input type="radio" name="v3-qr-feeling" value="有点紧张但做了" style="accent-color:#7c3aed;"> ' +
              '<span style="font-size:13px;color:#374151;">😤 有点紧张但做了</span>' +
            '</label>' +
            '<label class="v3-qr-option" data-value="还挺顺利" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;transition:all .15s;">' +
              '<input type="radio" name="v3-qr-feeling" value="还挺顺利" style="accent-color:#7c3aed;"> ' +
              '<span style="font-size:13px;color:#374151;">😊 还挺顺利</span>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<!-- 对方反应 -->' +
        '<div style="margin-bottom:16px;">' +
          '<div style="font-size:13px;font-weight:500;color:#374151;margin-bottom:8px;">对方反应</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;" id="v3-qr-reactions">' +
            '<label class="v3-qr-option" data-value="友好" style="display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;transition:all .15s;">' +
              '<input type="radio" name="v3-qr-reaction" value="友好" style="accent-color:#7c3aed;"> ' +
              '<span style="font-size:12px;">😄 友好</span>' +
            '</label>' +
            '<label class="v3-qr-option" data-value="正常" style="display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;transition:all .15s;">' +
              '<input type="radio" name="v3-qr-reaction" value="正常" style="accent-color:#7c3aed;"> ' +
              '<span style="font-size:12px;">😐 正常</span>' +
            '</label>' +
            '<label class="v3-qr-option" data-value="没注意" style="display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;transition:all .15s;">' +
              '<input type="radio" name="v3-qr-reaction" value="没注意" style="accent-color:#7c3aed;"> ' +
              '<span style="font-size:12px;">🤷 没注意</span>' +
            '</label>' +
            '<label class="v3-qr-option" data-value="不太热情" style="display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;transition:all .15s;">' +
              '<input type="radio" name="v3-qr-reaction" value="不太热情" style="accent-color:#7c3aed;"> ' +
              '<span style="font-size:12px;">😞 不太热情</span>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<!-- 可选补充 -->' +
        '<div style="margin-bottom:16px;">' +
          '<textarea id="v3-qr-note" placeholder="（可选）一句话补充..." rows="2" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:10px;font-size:13px;resize:none;outline:none;font-family:inherit;"></textarea>' +
        '</div>' +
        '<!-- 提交按钮 -->' +
        '<button id="v3-qr-submit" disabled style="width:100%;padding:13px;border-radius:12px;border:none;background:#e5e7eb;color:#9ca3af;font-size:14px;font-weight:600;cursor:not-allowed;transition:all .2s;">' +
          '选择感受和反应后提交' +
        '</button>' +
      '</div>' +
    '</div>';

    document.body.appendChild(modal);

    // 交互逻辑
    var feeling = null;
    var reaction = null;
    var submitBtn = document.getElementById('v3-qr-submit');

    function updateSubmitState() {
      if (feeling && reaction) {
        submitBtn.disabled = false;
        submitBtn.style.background = 'linear-gradient(135deg,#7c3aed,#6d28d9)';
        submitBtn.style.color = '#fff';
        submitBtn.style.cursor = 'pointer';
        submitBtn.textContent = '提交记录 ✨';
      }
    }

    function highlightOption(radio) {
      var group = radio.closest('[id^="v3-qr-"]');
      if (!group) return;
      group.querySelectorAll('.v3-qr-option').forEach(function (opt) {
        opt.style.borderColor = '#e5e7eb';
        opt.style.background = 'transparent';
      });
      var label = radio.closest('.v3-qr-option');
      if (label) {
        label.style.borderColor = '#7c3aed';
        label.style.background = '#f5f3ff';
      }
    }

    // 感受选项
    modal.querySelectorAll('input[name="v3-qr-feeling"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        feeling = this.value;
        highlightOption(this);
        updateSubmitState();
      });
    });

    // 反应选项
    modal.querySelectorAll('input[name="v3-qr-reaction"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        reaction = this.value;
        highlightOption(this);
        updateSubmitState();
      });
    });

    // 提交
    submitBtn.addEventListener('click', function () {
      if (!feeling || !reaction) return;
      var note = document.getElementById('v3-qr-note').value.trim();

      var record = E.submitQuickRecord({
        feeling: feeling,
        reaction: reaction,
        note: note,
        scenarioId: opts.scenarioId || '',
        challengeTier: opts.challengeTier || 'easy'
      });

      modal.remove();

      // 显示认知重构反馈
      setTimeout(function () {
        showReframeModal(record, opts);
      }, 400);

      if (typeof opts.onSubmit === 'function') {
        opts.onSubmit(record);
      }
    });

    // 点击遮罩关闭
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.remove();
    });
  }

  // ============================================================
  // 2. 认知重构反馈弹窗（三段式）
  // ============================================================

  function showReframeModal(record, opts) {
    opts = opts || {};
    var ref = E.generateCognitiveReframe(record);

    var existing = document.getElementById('v3-reframe-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'v3-reframe-modal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '9997';
    modal.innerHTML =
    '<div class="modal-content" style="max-width:400px;padding:0;overflow:hidden;">' +
      '<div style="background:linear-gradient(135deg,#059669,#10b981);padding:20px;color:#fff;">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:4px;">💚 教练说</div>' +
        '<div style="font-size:12px;opacity:0.85;">基于你刚才的记录</div>' +
      '</div>' +
      '<div style="padding:16px 20px 20px;max-height:55vh;overflow-y:auto;">' +
        '<div style="margin-bottom:14px;padding:12px;background:#fef3c7;border-radius:10px;border-left:3px solid #f59e0b;">' +
          '<div style="font-size:11px;font-weight:600;color:#92400e;margin-bottom:4px;">① 共情接纳</div>' +
          '<div style="font-size:13px;color:#78350f;line-height:1.6;">' + ref.empathy + '</div>' +
        '</div>' +
        '<div style="margin-bottom:14px;padding:12px;background:#ede9fe;border-radius:10px;border-left:3px solid #7c3aed;">' +
          '<div style="font-size:11px;font-weight:600;color:#5b21b6;margin-bottom:4px;">② 肯定勇气</div>' +
          '<div style="font-size:13px;color:#4c1d95;line-height:1.6;">' + ref.courage + '</div>' +
        '</div>' +
        '<div style="padding:12px;background:#ecfdf5;border-radius:10px;border-left:3px solid #10b981;">' +
          '<div style="font-size:11px;font-weight:600;color:#065f46;margin-bottom:4px;">③ 换个角度看</div>' +
          '<div style="font-size:13px;color:#064e3b;line-height:1.6;white-space:pre-line;">' + ref.reframe + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:12px 20px 16px;border-top:1px solid #f0f0f0;">' +
        '<div style="display:flex;gap:8px;">' +
          '<button onclick="document.getElementById(\'v3-reframe-modal\').remove()" style="flex:1;padding:11px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-size:13px;cursor:pointer;">' +
            '我知道了' +
          '</button>' +
          // 如果对方冷淡/受挫，提供情绪教练陪聊（触点3）
          (record.reaction === '不太热情' || record.outcome_negative
            ? '<button id="v3-reframe-coach-btn" style="flex:1;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;font-size:13px;font-weight:500;cursor:pointer;">' +
              '💬 和AI咨询师聊聊（10币）' +
            '</button>'
            : '') +
        '</div>' +
      '</div>' +
    '</div>';

    document.body.appendChild(modal);

    // 触点3：情绪教练陪聊
    var coachBtn = document.getElementById('v3-reframe-coach-btn');
    if (coachBtn) {
      coachBtn.addEventListener('click', function () {
        E.requestEmotionalCoach(function () {
          document.getElementById('v3-reframe-modal').remove();
          // TODO: 打开AI陪聊界面
          showToast('AI咨询师已上线，随时倾诉...');
        });
      });
    }

    // 埋点
    E.trackReflectionCompleted(opts.scenarioId);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.remove();
    });
  }

  // ============================================================
  // 3. 勇气证据库页面渲染
  // ============================================================

  /**
   * 渲染勇气证据库内容到指定容器
   * @param {string} containerId 容器元素ID
   */
  function renderEvidenceLibrary(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var display = E.getEvidenceDisplayText();

    var html = '<div style="padding:16px;">';

    // 标题区
    html += '<div style="text-align:center;margin-bottom:20px;">' +
      '<div style="font-size:24px;margin-bottom:6px;">🏆</div>' +
      '<div style="font-size:18px;font-weight:700;color:#1f2937;">' + display.title + '</div>' +
      '<div style="font-size:13px;color:#667085;margin-top:4px;">' + display.subtitle + '</div>' +
    '</div>';

    if (display.mainStat) {
      // 核心数据卡片
      html += '<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:16px;padding:20px;color:#fff;margin-bottom:16px;text-align:center;">' +
        '<div style="font-size:14px;line-height:1.6;opacity:0.95;">' + display.mainStat.headline + '</div>' +
      '</div>';

      // 详细统计
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">';
      display.details.forEach(function (d) {
        html += '<div style="background:#fff;border:1px solid #f0f0f0;border-radius:12px;padding:12px;text-align:center;">' +
          '<div style="font-size:12px;color:#667085;margin-bottom:4px;">' + d.label + '</div>' +
          '<div style="font-size:16px;font-weight:700;color:#7c3aed;">' + d.value + '</div>' +
        '</div>';
      });
      html += '</div>';

      // 本周概况（免费）
      html += '<div style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:12px;padding:14px;margin-bottom:12px;">' +
        '<div style="font-size:13px;font-weight:500;color:#374151;margin-bottom:6px;">📊 本周概况</div>' +
        '<div style="font-size:12px;color:#667085;line-height:1.5;">' +
          '本周完成 <b>' + getWeekChallengeCount() + '</b> 次挑战' +
          (getWeekFearNotRealized() > 0 ? '，<b>' + getWeekFearNotRealized() + '</b> 次预想坏事未发生' : '') +
        '</div>' +
        '<div style="font-size:11px;color:#9ca3af;margin-top:4px;">✅ 免费查看</div>' +
      '</div>';

      // 深度报告（付费）
      html += '<button id="v3-evidence-deep-report" style="width:100%;padding:13px;border-radius:12px;border:1px solid #ede9fe;background:linear-gradient(135deg,#f5f3ff,#ede9fe);color:#5b21b6;font-size:13px;font-weight:500;cursor:pointer;">' +
        '🔍 解锁认知模式改变报告（5社交币）' +
      '</button>';
      html += '<div style="text-align:center;margin-top:6px;">' +
        '<button onclick="V3UI.shareUnlockReport()" style="border:none;background:none;color:#7c3aed;font-size:12px;cursor:pointer;text-decoration:underline;">通过分享免费解锁</button>' +
      '</div>';

    } else {
      // 空状态
      html += '<div style="text-align:center;padding:30px 20px;">' +
        '<div style="font-size:48px;margin-bottom:12px;">🌱</div>' +
        '<div style="font-size:14px;color:#667085;">完成第一次现实挑战后，你的勇气证据就会在这里积累。</div>' +
        '<div style="font-size:12px;color:#9ca3af;margin-top:8px;">每一次尝试都算数。</div>' +
      '</div>';
    }

    // 说明文字
    html += '<div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:10px;">' +
      '<div style="font-size:11px;color:#9ca3af;line-height:1.5;">' +
        '📝 说明：个人成长记录与勇气证据库永久保留、绝不清零。' +
        '这里只展示你自己的成长轨迹，不做任何排名。' +
      '</div>' +
    '</div>';

    html += '</div>';
    container.innerHTML = html;

    // 绑定深度报告按钮
    var deepBtn = document.getElementById('v3-evidence-deep-report');
    if (deepBtn) {
      deepBtn.addEventListener('click', function () {
        E.requestDeepEvidenceReport(function () {
          showToast('深度报告已解锁');
          renderEvidenceReport(containerId);
        });
      });
    }
  }

  function getWeekChallengeCount() {
    var log = E.getChallengeLog();
    var weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return log.filter(function (r) { return new Date(r.timestamp) >= weekAgo; }).length;
  }

  function getWeekFearNotRealized() {
    var log = E.getChallengeLog();
    var weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return log.filter(function (r) {
      return new Date(r.timestamp) >= weekAgo && r.fear_predicted && !r.outcome_negative;
    }).length;
  }

  function renderEvidenceReport(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var stats = E.getEvidenceStats();
    var html = '<div style="padding:16px;">' +
      '<div style="font-size:16px;font-weight:700;color:#1f2937;margin-bottom:12px;">📊 认知模式改变报告</div>' +
      '<div style="font-size:13px;color:#374151;line-height:1.8;padding:14px;background:#f5f3ff;border-radius:12px;margin-bottom:12px;">' +
        '<p>根据你的 ' + stats.totalChallenges + ' 次挑战记录：</p>' +
        '<p style="margin-top:8px;"><b>模式发现：</b>' +
        (stats.fearPredictedButNotNegative > stats.fearPredictedCount * 0.5
          ? '你在超过一半的情况下，担心的事情并没有发生。这说明你的焦虑可能在系统性地高估负面结果的可能性。'
          : '目前你的担心和实际结果比较接近，但随着练习增加，你会逐渐学会更准确地评估社交风险。') +
        '</p>' +
        '<p style="margin-top:8px;"><b>建议：</b>继续保持每天一次小挑战的节奏。重点关注那些"预想坏事未发生"的经历，把它们当作证据来对抗焦虑。</p>' +
      '</div>' +
      '<button onclick="V3UI.showEvidenceLibrary()" style="width:100%;padding:12px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-size:13px;cursor:pointer;">返回证据库</button>' +
    '</div>';
    container.innerHTML = html;
  }

  // ============================================================
  // 4. 冷启动引导卡片
  // ============================================================

  function showOnboardingCard() {
    if (!E.shouldShowOnboarding()) return;

    var existing = document.getElementById('v3-onboarding-card');
    if (existing) return;

    var card = document.createElement('div');
    card.id = 'v3-onboarding-card';
    card.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:400px;background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.15);padding:16px;z-index:9990;animation:fadeIn 0.4s ease-out;';
    card.innerHTML =
      '<div style="display:flex;align-items:flex-start;gap:12px;">' +
        '<div style="font-size:32px;flex-shrink:0;">👋</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:4px;">嗨，欢迎来对练社交！</div>' +
          '<div style="font-size:12px;color:#667085;line-height:1.5;margin-bottom:10px;">不需要准备什么，先试着和AI说一句问候就好，30秒就行。</div>' +
          '<button id="v3-onboard-start" style="padding:9px 16px;border-radius:10px;border:none;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:13px;font-weight:500;cursor:pointer;">和AI打个招呼 →</button>' +
          '<button id="v3-onboard-skip" style="padding:9px 12px;border:none;background:none;color:#9ca3af;font-size:12px;cursor:pointer;margin-left:4px;">稍后再说</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(card);

    document.getElementById('v3-onboard-start').addEventListener('click', function () {
      card.remove();
      E.completeOnboarding();
      // 跳转到AI对话界面（调用现有函数）
      if (typeof window.showTrainingCenter === 'function') {
        window.showTrainingCenter();
      }
      showToast('选一个场景，开始你的第一次练习吧！');
    });

    document.getElementById('v3-onboard-skip').addEventListener('click', function () {
      card.style.opacity = '0';
      card.style.transform = 'translateX(-50%) translateY(20px)';
      card.style.transition = 'all 0.3s ease-out';
      setTimeout(function () { card.remove(); }, 300);
      E.completeOnboarding();
    });
  }

  // ============================================================
  // 5. 危机热线悬浮按钮
  // ============================================================

  function addCrisisHotlineButton() {
    var existing = document.getElementById('v3-crisis-hotline');
    if (existing) return;

    var btn = document.createElement('button');
    btn.id = 'v3-crisis-hotline';
    btn.innerHTML = '📞';
    btn.title = E.CRISIS_HOTLINE_DISPLAY;
    btn.setAttribute('aria-label', E.CRISIS_HOTLINE_DISPLAY);
    btn.style.cssText = 'position:fixed;bottom:160px;right:16px;width:44px;height:44px;border-radius:50%;border:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 4px 12px rgba(239,68,68,0.4);z-index:9989;display:flex;align-items:center;justify-content:center;transition:transform .2s;';

    btn.addEventListener('mouseenter', function () { btn.style.transform = 'scale(1.1)'; });
    btn.addEventListener('mouseleave', function () { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('click', function () {
      // 显示热线信息
      var existing = document.getElementById('v3-crisis-popup');
      if (existing) { existing.remove(); return; }

      var popup = document.createElement('div');
      popup.id = 'v3-crisis-popup';
      popup.style.cssText = 'position:fixed;bottom:212px;right:16px;background:#fff;border-radius:14px;padding:16px;box-shadow:0 8px 30px rgba(0,0,0,0.15);z-index:9989;max-width:260px;animation:fadeIn 0.2s ease-out;';
      popup.innerHTML =
        '<div style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:6px;">需要帮助？</div>' +
        '<div style="font-size:12px;color:#667085;line-height:1.5;margin-bottom:10px;">如果你正在经历心理危机，请拨打：</div>' +
        '<a href="tel:' + E.CRISIS_HOTLINE + '" style="display:block;text-align:center;padding:10px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">' +
          '📞 ' + E.CRISIS_HOTLINE_DISPLAY +
        '</a>' +
        '<div style="font-size:10px;color:#9ca3af;margin-top:6px;text-align:center;">24小时免费 · 专业倾听</div>';

      document.body.appendChild(popup);
      setTimeout(function () {
        document.addEventListener('click', function closePopup(e) {
          if (!popup.contains(e.target) && e.target !== btn) {
            popup.remove();
            document.removeEventListener('click', closePopup);
          }
        });
      }, 100);
    });

    document.body.appendChild(btn);
  }

  // ============================================================
  // 6. 深度复盘弹窗（触点1）
  // ============================================================

  function showDeepReviewPrompt(scenarioId, onUnlocked) {
    E.requestDeepReview(scenarioId, function (isFirstFree) {
      if (typeof onUnlocked === 'function') onUnlocked(isFirstFree);
    }, function () {
      // 余额不足，showRechargeModal 已自动调用
    });
  }

  // ============================================================
  // 公开接口
  // ============================================================

  window.V3UI = {
    showQuickRecordCard: showQuickRecordCard,
    showReframeModal: showReframeModal,
    renderEvidenceLibrary: renderEvidenceLibrary,
    showEvidenceLibrary: function () { renderEvidenceLibrary('v3-evidence-container'); },
    renderEvidenceReport: renderEvidenceReport,
    showOnboardingCard: showOnboardingCard,
    addCrisisHotlineButton: addCrisisHotlineButton,
    showDeepReviewPrompt: showDeepReviewPrompt,
    shareUnlockReport: function () {
      // 分享解锁逻辑
      if (navigator.share) {
        navigator.share({
          title: '对练社交 - 我的勇气证据',
          text: '我正在通过AI练习社交能力，一起来试试吧！',
          url: window.location.href
        }).then(function () {
          showToast('分享成功！报告已解锁');
        }).catch(function () {});
      } else {
        // 降级：复制链接
        navigator.clipboard.writeText(window.location.href).then(function () {
          showToast('链接已复制，分享后报告自动解锁');
        });
      }
    }
  };

  // ============================================================
  // 自动初始化
  // ============================================================

  // DOM加载完成后初始化
  function autoInit() {
    // 添加危机热线悬浮按钮
    addCrisisHotlineButton();

    // 检查冷启动
    setTimeout(function () {
      showOnboardingCard();
    }, 1000);

    // 初始化每日能量恢复
    E.checkDailyEnergyRefresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  console.log('[V3UI] UI组件层已加载');
})();
