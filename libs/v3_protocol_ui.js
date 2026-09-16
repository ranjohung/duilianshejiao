/**
 * 对练社交 V3.0 — 协议折叠UI
 * 
 * 功能：
 * 1. 免责声明、服务协议、隐私政策分步展示（非一次性长滚动）
 * 2. 关键条款先摘要，完整协议折叠在下方
 * 3. 确认状态存入 duilian_settings
 * 4. 支持单独查看（设置页入口）
 * 5. 首次使用时强制完成三步确认
 * 
 * 依赖：libs/v3_economy_loop.js（SETTINGS_KEY 约定）
 */
(function () {
  'use strict';

  var SETTINGS_KEY = 'duilian_settings';

  // ============================================================
  // 1. 协议数据定义
  // ============================================================

  var PROTOCOLS = [
    {
      id: 'disclaimer',
      icon: '🛡️',
      title: '免责声明',
      summary: '请先阅读以下关键条款：',
      keyPoints: [
        '本应用提供社交训练辅助，不替代专业心理咨询或治疗',
        '如遇到严重心理困扰，请拨打全国统一心理援助热线 12356',
        '训练效果因人而异，我们不做效果保证承诺',
        '你的成长记录保存在本地设备，不会未经授权上传'
      ],
      fullText: [
        '1. 本应用（"对练社交"）是一款社交技能训练辅助工具，所提供的课程内容、AI对练反馈、现实挑战建议等均基于社交心理学常识设计，不构成医学诊断、临床心理咨询或心理治疗方案。',
        '2. 如果你正在经历严重心理危机（如自伤/自杀念头、严重抑郁发作、创伤后应激等），请立即停止使用本应用，拨打全国统一心理援助热线 12356 或前往最近的医疗机构。',
        '3. 训练效果因人而异，受个人基础、练习频率、实际场景复杂度等多重因素影响。我们不承诺特定训练次数后必然达到某种效果。',
        '4. AI生成的反馈和建议仅供参考，可能存在偏差。请结合自身判断和真实社交情境灵活运用。',
        '5. 你的学习记录、挑战数据、勇气证据等存储在你本地浏览器的 LocalStorage 中。清除浏览器数据会导致记录丢失。我们不会在未经你明确授权的情况下上传你的个人数据。',
        '6. 使用本应用即表示你理解并同意上述条款。如有疑问，请在使用前联系我们。'
      ]
    },
    {
      id: 'service',
      icon: '📋',
      title: '服务协议',
      summary: '关于你使用本服务的权利与义务：',
      keyPoints: [
        '基础功能免费可用，高级功能需消耗社交币或开通会员',
        '社交币为虚拟商品，一经购买不支持退款',
        '你的会员权益在订阅期内有效，到期后自动恢复为免费版',
        '禁止利用本应用生成或传播违法、有害内容'
      ],
      fullText: [
        '1. 服务说明：对练社交提供社交技能学习、AI模拟对练、现实挑战引导、成长记录等功能。基础功能（每日3次AI对练、基础课程、现实挑战）免费使用。',
        '2. 付费功能：深度复盘（3社交币/次，每场景首免）、应急锦囊（2社交币/次）、情绪教练陪聊（10社交币/次）、勇气证据库深度报告（5社交币/次或分享解锁）。社交币购买比例为 1元=10社交币。',
        '3. 会员订阅：同行者会员 29元/月，权益包括能量上限提升至5点、高级场景解锁、课程库全免、每月1次定制化成长报告。订阅到期后自动恢复免费版，已获得的成长值和勇气证据不清除。',
        '4. 虚拟商品：社交币为虚拟商品，一经购买成功，除法律规定的情形外，不支持退款或兑换现金。',
        '5. 用户行为规范：你承诺不利用本应用生成、传播违法、暴力、色情、骚扰或其他有害内容。不利用技术手段干扰应用正常运行或破解付费机制。',
        '6. 服务变更：我们保留在合理范围内调整功能、定价和服务内容的权利。重大变更将提前通知。',
        '7. 未成年人：未满18周岁的用户建议在监护人指导下使用本应用。如遇到严重心理困扰，应优先寻求专业帮助。'
      ]
    },
    {
      id: 'privacy',
      icon: '🔒',
      title: '隐私政策',
      summary: '关于你的数据如何被处理和保护：',
      keyPoints: [
        '你的训练数据和成长记录默认仅存储在本地设备',
        '我们不会收集你的真实姓名、手机号等个人身份信息（除非你主动提供）',
        'AI对话内容不会被用于训练其他模型',
        '你可以随时清除本地数据来删除所有记录'
      ],
      fullText: [
        '1. 数据存储：你的个人训练数据（AI对练记录、现实挑战记录、勇气证据等）默认存储在浏览器的 LocalStorage 中，仅保留在你的设备上。我们不会将此类数据上传至服务器，除非你主动使用云同步功能。',
        '2. 信息收集：我们不收集你的真实姓名、手机号、身份证号等个人身份信息。应用内产生的用户ID为随机生成的匿名标识。',
        '3. AI对话：你与AI的对话内容仅用于生成当次训练反馈和复盘，不会被用于训练其他AI模型或提供给第三方。',
        '4. 数据分析：我们可能收集匿名化的使用统计（如功能使用频次、完成率等）用于改善产品体验，但不包含任何可识别个人身份的信息。',
        '5. 第三方服务：本应用可能使用CDN加载外部库（如Tailwind CSS）、字体等，这些第三方服务有其各自的隐私政策。',
        '6. 数据删除：你可以随时通过浏览器设置清除 LocalStorage 来删除所有本地数据。清除后记录不可恢复。',
        '7. 政策更新：如隐私政策发生重大变更，我们将在应用内通知你。继续使用即视为同意更新后的政策。'
      ]
    }
  ];

  // ============================================================
  // 2. 设置读写
  // ============================================================

  function getSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function saveSettings(data) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[V3Protocol] saveSettings failed:', e);
    }
  }

  /**
   * 检查某个协议是否已确认
   * @param {string} protocolId - 'disclaimer' | 'service' | 'privacy'
   * @returns {boolean}
   */
  function isProtocolConfirmed(protocolId) {
    var settings = getSettings();
    return !!(settings.protocols && settings.protocols[protocolId]);
  }

  /**
   * 检查是否所有协议都已确认
   * @returns {boolean}
   */
  function areAllProtocolsConfirmed() {
    return PROTOCOLS.every(function (p) {
      return isProtocolConfirmed(p.id);
    });
  }

  /**
   * 标记某个协议已确认
   * @param {string} protocolId
   */
  function confirmProtocol(protocolId) {
    var settings = getSettings();
    if (!settings.protocols) settings.protocols = {};
    settings.protocols[protocolId] = {
      confirmed: true,
      confirmedAt: new Date().toISOString()
    };
    saveSettings(settings);
  }

  // ============================================================
  // 3. UI渲染 — 分步协议确认流程
  // ============================================================

  /**
   * 渲染单步协议面板
   * @param {Object} protocol - 协议数据
   * @param {number} stepIndex - 当前步骤（0/1/2）
   * @param {number} totalSteps - 总步骤数
   * @returns {HTMLElement}
   */
  function renderProtocolStep(protocol, stepIndex, totalSteps) {
    var wrapper = document.createElement('div');
    wrapper.className = 'v3-protocol-step';
    wrapper.style.cssText = 'padding:20px;animation:modalFadeIn 0.3s ease-out;';

    // 步骤指示器
    var stepper = document.createElement('div');
    stepper.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;';
    for (var i = 0; i < totalSteps; i++) {
      var dot = document.createElement('div');
      dot.style.cssText = 'width:8px;height:8px;border-radius:50%;';
      dot.style.background = i <= stepIndex ? '#6366f1' : '#e5e7eb';
      stepper.appendChild(dot);
      if (i < totalSteps - 1) {
        var line = document.createElement('div');
        line.style.cssText = 'width:24px;height:2px;';
        line.style.background = i < stepIndex ? '#6366f1' : '#e5e7eb';
        stepper.appendChild(line);
      }
    }
    wrapper.appendChild(stepper);

    // 标题
    var title = document.createElement('h3');
    title.style.cssText = 'font-size:18px;font-weight:700;text-align:center;margin:0 0 6px;color:#1f2937;';
    title.textContent = protocol.icon + ' ' + protocol.title;
    wrapper.appendChild(title);

    // 摘要提示
    var summaryEl = document.createElement('p');
    summaryEl.style.cssText = 'font-size:13px;color:#6b7280;text-align:center;margin:0 0 16px;';
    summaryEl.textContent = protocol.summary;
    wrapper.appendChild(summaryEl);

    // 关键条款卡片
    var keyCard = document.createElement('div');
    keyCard.style.cssText = 'background:#f0f4ff;border:1px solid #c7d2fe;border-radius:12px;padding:14px;margin-bottom:16px;';
    protocol.keyPoints.forEach(function (point) {
      var item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:13px;color:#374151;line-height:1.5;';
      var check = document.createElement('span');
      check.textContent = '✓';
      check.style.cssText = 'color:#6366f1;font-weight:700;flex-shrink:0;margin-top:1px;';
      var text = document.createElement('span');
      text.textContent = point;
      item.appendChild(check);
      item.appendChild(text);
      keyCard.appendChild(item);
    });
    wrapper.appendChild(keyCard);

    // 折叠完整协议
    var details = document.createElement('details');
    details.style.cssText = 'margin-bottom:16px;';
    var summaryTag = document.createElement('summary');
    summaryTag.style.cssText = 'font-size:13px;color:#6366f1;cursor:pointer;padding:8px 0;user-select:none;';
    summaryTag.textContent = '📄 查看完整' + protocol.title;
    details.appendChild(summaryTag);

    var fullContent = document.createElement('div');
    fullContent.style.cssText = 'background:#f9fafb;border-radius:8px;padding:12px;max-height:200px;overflow-y:auto;margin-top:8px;';
    protocol.fullText.forEach(function (para) {
      var p = document.createElement('p');
      p.style.cssText = 'font-size:12px;color:#4b5563;line-height:1.7;margin:0 0 8px;';
      p.textContent = para;
      fullContent.appendChild(p);
    });
    details.appendChild(fullContent);
    wrapper.appendChild(details);

    // 确认按钮
    var confirmBtn = document.createElement('button');
    confirmBtn.style.cssText = 'width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:transform 0.15s;';
    confirmBtn.textContent = stepIndex < totalSteps - 1 ? '已阅读，下一步' : '全部阅读完毕，开始使用 🎉';
    confirmBtn.onmousedown = function () { confirmBtn.style.transform = 'scale(0.97)'; };
    confirmBtn.onmouseup = function () { confirmBtn.style.transform = 'scale(1)'; };
    confirmBtn.onclick = function () {
      confirmProtocol(protocol.id);
      console.log('[V3Protocol] 已确认: ' + protocol.title);
      if (stepIndex < totalSteps - 1) {
        // 下一步
        showStep(stepIndex + 1);
      } else {
        // 全部完成
        closeProtocolFlow();
        showToast('✅ 协议确认完成，欢迎使用对练社交！');
      }
    };
    wrapper.appendChild(confirmBtn);

    // 返回按钮（非第一步时）
    if (stepIndex > 0) {
      var backBtn = document.createElement('button');
      backBtn.style.cssText = 'width:100%;padding:10px;border:none;background:transparent;color:#9ca3af;font-size:13px;cursor:pointer;margin-top:8px;';
      backBtn.textContent = '← 上一步';
      backBtn.onclick = function () { showStep(stepIndex - 1); };
      wrapper.appendChild(backBtn);
    }

    return wrapper;
  }

  // ============================================================
  // 4. 流程控制
  // ============================================================

  var _overlayEl = null;
  var _currentStep = 0;

  function showStep(stepIndex) {
    if (!_overlayEl) return;
    _currentStep = stepIndex;
    // 清空内容重新渲染
    var content = _overlayEl.querySelector('.v3-protocol-content');
    if (content) {
      content.innerHTML = '';
      var stepEl = renderProtocolStep(PROTOCOLS[stepIndex], stepIndex, PROTOCOLS.length);
      content.appendChild(stepEl);
    }
  }

  /**
   * 显示协议确认流程（覆盖层）
   * 首次使用时调用，或用户从设置页触发
   */
  function showProtocolFlow() {
    // 如果全部已确认，不显示
    if (areAllProtocolsConfirmed()) {
      console.log('[V3Protocol] 所有协议已确认，跳过');
      return;
    }

    // 找到第一个未确认的步骤
    var firstUnconfirmed = 0;
    for (var i = 0; i < PROTOCOLS.length; i++) {
      if (!isProtocolConfirmed(PROTOCOLS[i].id)) {
        firstUnconfirmed = i;
        break;
      }
    }
    _currentStep = firstUnconfirmed;

    // 创建覆盖层
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'v3-protocol-overlay';
    _overlayEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99998;padding:16px;animation:modalFadeIn 0.3s ease-out;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:20px;width:100%;max-width:400px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);';

    var content = document.createElement('div');
    content.className = 'v3-protocol-content';
    modal.appendChild(content);

    _overlayEl.appendChild(modal);
    document.body.appendChild(_overlayEl);

    // 渲染当前步骤
    showStep(_currentStep);

    console.log('[V3Protocol] 协议确认流程已启动，从步骤 ' + (_currentStep + 1) + ' 开始');
  }

  function closeProtocolFlow() {
    if (_overlayEl) {
      _overlayEl.remove();
      _overlayEl = null;
    }
    _currentStep = 0;
  }

  // ============================================================
  // 5. 设置页入口 — 单独查看已确认的协议
  // ============================================================

  /**
   * 显示协议查看面板（非确认模式，仅查看）
   * @param {string} protocolId - 可选，指定查看某个协议
   */
  function showProtocolViewer(protocolId) {
    var protocolsToShow = protocolId
      ? PROTOCOLS.filter(function (p) { return p.id === protocolId; })
      : PROTOCOLS;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99998;padding:16px;animation:modalFadeIn 0.3s ease-out;';
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:20px;width:100%;max-width:400px;max-height:85vh;overflow-y:auto;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);';

    // 标题
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;';
    var title = document.createElement('h3');
    title.style.cssText = 'font-size:17px;font-weight:700;margin:0;color:#1f2937;';
    title.textContent = '📄 协议中心';
    header.appendChild(title);
    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'border:none;background:none;font-size:20px;cursor:pointer;color:#9ca3af;padding:4px 8px;';
    closeBtn.textContent = '✕';
    closeBtn.onclick = function () { overlay.remove(); };
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // 各协议状态
    protocolsToShow.forEach(function (protocol) {
      var card = document.createElement('div');
      card.style.cssText = 'border:1px solid #e5e7eb;border-radius:12px;margin-bottom:12px;overflow:hidden;';

      var cardHeader = document.createElement('div');
      cardHeader.style.cssText = 'padding:12px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:#f9fafb;';
      var left = document.createElement('div');
      left.style.cssText = 'display:flex;align-items:center;gap:8px;';
      var icon = document.createElement('span');
      icon.style.fontSize = '18px';
      icon.textContent = protocol.icon;
      left.appendChild(icon);
      var name = document.createElement('span');
      name.style.cssText = 'font-size:14px;font-weight:600;color:#374151;';
      name.textContent = protocol.title;
      left.appendChild(name);
      cardHeader.appendChild(left);

      var status = document.createElement('span');
      status.style.cssText = 'font-size:11px;padding:3px 8px;border-radius:10px;';
      if (isProtocolConfirmed(protocol.id)) {
        status.textContent = '✅ 已确认';
        status.style.cssText += 'background:#ecfdf5;color:#059669;';
      } else {
        status.textContent = '⚠️ 未确认';
        status.style.cssText += 'background:#fef3c7;color:#d97706;';
      }
      cardHeader.appendChild(status);
      card.appendChild(cardHeader);

      // 折叠详情
      var details = document.createElement('details');
      details.style.cssText = 'padding:0 14px 12px;';
      var summaryTag = document.createElement('summary');
      summaryTag.style.cssText = 'font-size:12px;color:#6366f1;cursor:pointer;padding:8px 0;';
      summaryTag.textContent = '展开查看';
      details.appendChild(summaryTag);

      // 关键条款
      var keyBox = document.createElement('div');
      keyBox.style.cssText = 'background:#f0f4ff;border-radius:8px;padding:10px;margin-bottom:8px;';
      protocol.keyPoints.forEach(function (point) {
        var item = document.createElement('div');
        item.style.cssText = 'font-size:12px;color:#374151;line-height:1.6;margin-bottom:4px;';
        item.textContent = '✓ ' + point;
        keyBox.appendChild(item);
      });
      details.appendChild(keyBox);

      // 完整协议
      protocol.fullText.forEach(function (para) {
        var p = document.createElement('p');
        p.style.cssText = 'font-size:11px;color:#6b7280;line-height:1.7;margin:0 0 6px;';
        p.textContent = para;
        details.appendChild(p);
      });

      card.appendChild(details);
      modal.appendChild(card);
    });

    // 如果有未确认的，显示重新确认按钮
    if (!areAllProtocolsConfirmed()) {
      var reconfirmBtn = document.createElement('button');
      reconfirmBtn.style.cssText = 'width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;';
      reconfirmBtn.textContent = '完成未确认的协议';
      reconfirmBtn.onclick = function () {
        overlay.remove();
        showProtocolFlow();
      };
      modal.appendChild(reconfirmBtn);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // ============================================================
  // 6. 自动触发逻辑
  // ============================================================

  /**
   * 应用启动时检查是否需要显示协议确认
   * 仅在首次使用（所有协议未确认）时自动弹出
   */
  function autoCheckOnStartup() {
    if (!areAllProtocolsConfirmed()) {
      // 延迟显示，等待页面加载完毕
      setTimeout(function () {
        showProtocolFlow();
      }, 3000);
    }
  }

  // ============================================================
  // Toast 辅助
  // ============================================================
  function showToast(msg) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg);
      return;
    }
    var toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:99999;animation:fadeIn 0.3s ease-out;';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2500);
  }

  // ============================================================
  // 7. 导出接口
  // ============================================================

  window.V3Protocol = {
    // 流程控制
    showProtocolFlow: showProtocolFlow,
    closeProtocolFlow: closeProtocolFlow,
    showProtocolViewer: showProtocolViewer,
    autoCheckOnStartup: autoCheckOnStartup,

    // 状态查询
    isProtocolConfirmed: isProtocolConfirmed,
    areAllProtocolsConfirmed: areAllProtocolsConfirmed,
    confirmProtocol: confirmProtocol,

    // 数据
    PROTOCOLS: PROTOCOLS
  };

  // ============================================================
  // 8. 初始化
  // ============================================================

  function init() {
    autoCheckOnStartup();
    console.log('[V3Protocol] 协议折叠UI模块已加载');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
