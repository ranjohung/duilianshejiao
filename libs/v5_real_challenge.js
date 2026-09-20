/* =========================================================================
 *  v5_real_challenge.js
 *  真实挑战 — 纯文字对话模式适配器（2026-09-15 重构）
 *
 *  设计理念：
 *  ───────────────────────────────────────────────────────────────────────
 *  真实挑战 = 场景介绍 → 用户主动输入话术+动作 → 教练评价
 *
 *  和场景模板市场里的训练项目完全一样的文字对话体验：
 *    - 没有 3D/照片场景装饰
 *    - 没有选项卡，用户自由输入
 *    - 教练根据礼仪规则给出"对/错 + 为什么 + 应该怎么做"
 *
 *  使用方式：
 *    RealChallenge.start(challengeId)   — 直接开始对话挑战（纯文字模式）
 *
 *  核心流程：
 *    场景介绍弹窗 → 教练开场 → 多轮对话（用户输入 → 教练评价 → NPC回应）
 *    → 完成 3 轮后结算 → 复盘反馈 → 推荐下一训练
 *
 *  挂载：window.RealChallenge
 * ========================================================================= */

(function () {
  'use strict';

  // ===== 礼仪要素关键词库 =====
  const ETIQUETTE_KEYWORDS = {
    // 动作类
    actions: ['微笑', '笑', '点头', '鞠躬', '欠身', '起立', '起身', '握手', '伸手', '眼神', '看着', '注视',
              '眼神接触', '目光', '对视', '招手', '挥手', '让开', '侧身', '让路', '前倾', '身体前倾',
              '坐直', '站直', '保持距离', '保持', '递', '接', '双手', '单手', '捧', '推'],
    // 称呼类
    greetings: ['你好', '您好', '早上好', '中午好', '下午好', '晚上好', '早安', '晚安',
                '老师', '经理', '总', '老板', '阿姨', '叔叔', '哥', '姐', '小朋友',
                '先生', '女士', '同学', '同事', '朋友', '亲爱的', '宝宝'],
    // 礼貌用语
    polite: ['请', '麻烦', '请问', '能不能', '可不可以', '谢谢', '感谢', '多谢', '辛苦',
             '不好意思', '抱歉', '对不起', '打扰', '劳烦', '费心', '麻烦您'],
    // 姿态描述
    posture: ['礼貌', '得体', '自然', '放松', '大方', '诚恳', '真诚', '尊重', '谦逊',
              '自信', '从容', '淡定', '热情', '友好', '温和', '轻柔', '语气平和'],
    // 表达类
    expression: ['开放式', '问题', '提问', '反问', '追问', '倾听', '共情', '理解', '感受',
                 '感受如何', '觉得', '怎么样', '为什么', '怎么回事', '能说说', '具体说说',
                 '我懂', '我明白', '我理解'],
    // 禁忌类
    forbidden: ['滚', '傻', '白痴', '笨蛋', '废物', '垃圾', '讨厌你', '烦死人', '滚开',
                '有病', '脑残', '闭嘴', '走开', '讨厌', '够了', '懒得', '随便你', '跟我没关系',
                '关我屁事', '关你屁事']
  };

  // ===== 场景礼仪规则（场景-specific 的检查项）=====
  const SCENE_RULES = {
    '咖啡厅的邂逅': {
      mustHave: ['微笑', '眼神接触', '开放式问题'],
      niceToHave: ['称呼', '自我介绍'],
      forbidden: ['身体接触', '追问隐私'],
      tips: '咖啡馆是轻松的公共场景，核心是"破冰+不唐突"：微笑对视 + 简短问候 + 一个开放式问题（如"你常来这家吗？"）'
    },
    '朋友家的晚餐': {
      mustHave: ['称呼长辈', '问候长辈', '入座等待'],
      niceToHave: ['带礼物', '主动帮忙', '不先动筷'],
      forbidden: ['直呼长辈姓名', '抢着吃', '玩手机'],
      tips: '做客核心是"尊重边界"：先问候主人父母 + 等主人示意后入座 + 不先动筷 + 饭后主动帮忙'
    },
    '模拟面试': {
      mustHave: ['称呼面试官', '坐姿端正', '眼神接触', '清晰表达'],
      niceToHave: ['自我介绍结构化', '案例支撑'],
      forbidden: ['说前公司坏话', '抱怨', '过度谦虚'],
      tips: '面试核心是"专业+自信"：坐姿端正 + 条理清晰 + 用具体案例 + 结尾问1-2个问题'
    },
    '主动打招呼': {
      mustHave: ['微笑', '眼神接触', '问候'],
      niceToHave: ['自我介绍', '开场白'],
      forbidden: ['无视对方', '太热情'],
      tips: '打招呼核心是"友好+不尴尬"：微笑对视 + 简单问候 + 一句轻松的开场白'
    },
    '深度对话': {
      mustHave: ['倾听', '共情', '眼神接触'],
      niceToHave: ['开放式问题', '复述确认'],
      forbidden: ['打断对方', '否定感受'],
      tips: '深度对话核心是"先倾听后回应"：先共情 + 复述对方感受 + 问开放式问题引导深入'
    },
    '加薪谈判': {
      mustHave: ['数据支撑', '语气平和', '先肯定后表达'],
      niceToHave: ['结构化表达'],
      forbidden: ['情绪化', '威胁', '拿离职要挟'],
      tips: '谈判核心是"理性+有依据"：先肯定团队 + 用数据证明贡献 + 谈价值不谈需要'
    },
    '年终述职演讲': {
      mustHave: ['结构化表达', '眼神环视', '站姿端正'],
      niceToHave: ['数据支撑', '亮点突出'],
      forbidden: ['念PPT', '太谦虚', '只讲自己'],
      tips: '公开表达核心是"结构+亮点"：背景-目标-行动-结果 + 重点讲亮点 + 结尾感谢'
    },
    '朋友间的冲突': {
      mustHave: ['表达感受', '先倾听', '非暴力'],
      niceToHave: ['I-message（我觉得...）'],
      forbidden: ['指责', '翻旧账', '情绪化'],
      tips: '冲突处理核心是"表达感受+不指责"：先让对方说完 + 用"我觉得..."表达 + 讨论解决方式'
    }
  };

  // ===== 教练评价引擎 =====
  function evaluateAnswer(answer, sceneTitle, round) {
    const text = (answer || '').trim();
    const rules = SCENE_RULES[sceneTitle] || {};
    const mustHave = rules.mustHave || [];
    const niceToHave = rules.niceToHave || [];
    const forbidden = rules.forbidden || [];

    const positives = [];
    const improvements = [];
    let scoreDelta = 0;
    let pass = true;

    // 1. 长度检查
    if (text.length < 8) {
      pass = false;
      scoreDelta -= 5;
      improvements.push('回应太简短（少于8个字），教练看不到你的礼仪动作或完整表达');
    }

    // 2. 礼仪要素检测
    const foundActions = ETIQUETTE_KEYWORDS.actions.filter(k => text.includes(k));
    const foundGreetings = ETIQUETTE_KEYWORDS.greetings.filter(k => text.includes(k));
    const foundPolite = ETIQUETTE_KEYWORDS.polite.filter(k => text.includes(k));
    const foundPosture = ETIQUETTE_KEYWORDS.posture.filter(k => text.includes(k));
    const foundExpression = ETIQUETTE_KEYWORDS.expression.filter(k => text.includes(k));
    const foundForbidden = ETIQUETTE_KEYWORDS.forbidden.filter(k => text.includes(k));

    // 3. 场景必选项检查
    mustHave.forEach(item => {
      const hit = ETIQUETTE_KEYWORDS.actions.concat(ETIQUETTE_KEYWORDS.greetings, ETIQUETTE_KEYWORDS.polite).some(k => item.includes(k) || k.includes(item));
      // 更智能的匹配
      const simpleMatch = text.includes(item) || (item === '微笑' && text.includes('笑'));
      if (simpleMatch) {
        positives.push(`包含了"${item}"这个关键礼仪要素`);
        scoreDelta += 3;
      } else {
        improvements.push(`缺少"${item}"——这是本场景的核心礼仪`);
        scoreDelta -= 2;
      }
    });

    // 4. 加分项检查
    niceToHave.forEach(item => {
      if (text.includes(item)) {
        positives.push(`额外加分："${item}"做得很好！`);
        scoreDelta += 2;
      }
    });

    // 5. 禁忌检查
    foundForbidden.forEach(word => {
      pass = false;
      scoreDelta -= 8;
      improvements.push(`出现了不恰当的表达"${word}"，在当前场景中不合适`);
    });

    // 6. 有动作描述但没话术
    const hasAction = foundActions.length > 0;
    const hasSpeech = foundGreetings.length > 0 || foundPolite.length > 0 || text.length > 15;
    if (hasAction && !hasSpeech && text.length < 20) {
      improvements.push('你描述了动作，但可以补充一两句社交话术让场景更完整');
      scoreDelta -= 1;
    }
    if (!hasAction && hasSpeech && text.length > 20) {
      improvements.push('你说了话，但没描述会做的礼仪动作（如微笑、眼神接触等）');
      scoreDelta -= 1;
    }
    if (hasAction && hasSpeech) {
      positives.push('话术 + 动作都覆盖到了，很棒的完整度！');
      scoreDelta += 2;
    }

    // 7. 肯定
    if (foundActions.length > 0) {
      positives.push(`你提到了动作: ${foundActions.slice(0, 3).join('、')}`);
    }
    if (foundPolite.length > 0) {
      positives.push(`你用了礼貌用语: ${foundPolite.slice(0, 2).join('、')}`);
    }
    if (foundExpression.length > 0) {
      positives.push(`你有${foundExpression.includes('开放式') ? '开放式问题' : '引导对话的意识'}`);
    }

    // 8. 收尾判断
    if (round >= 3 && text.length > 20) {
      positives.push('最后一轮了！保持自然收尾，不要太刻意');
      scoreDelta += 1;
    }

    // 默认值
    if (positives.length === 0) {
      positives.push('你的回应切题，可以尝试描述更多礼仪动作（微笑、眼神、姿势等）');
    }

    // 生成建议（应该怎么做）
    const tip = rules.tips || '先回应对方，再补充一个细节或反问，让对方有话可接。';

    // 控制分数范围
    scoreDelta = Math.max(-10, Math.min(10, scoreDelta));

    return {
      scoreDelta,
      pass,
      positives,
      improvements,
      tip,
      comment: pass ? (scoreDelta >= 3 ? '做得很棒！继续保持' : scoreDelta >= 0 ? '基本合格，可以更好' : '勉强过关，注意改进') : '有些地方需要注意',
      correctReason: improvements.length > 0 ? improvements.join('；') : '你的回应很好地匹配了当前场景的社交目标。',
      suggestion: tip,
      correctAnswer: null  // 纯文字模式不给固定答案
    };
  }

  // ===== 重写 sendChallengeMessage 里的教练评价逻辑 =====
  function wrapExistingAnalyzer() {
    // 如果 index.html 里已经有 analyzeChallengeAnswer，我们增强它
    if (typeof window.analyzeChallengeAnswer === 'function') {
      const originalAnalyzer = window.analyzeChallengeAnswer;
      window.analyzeChallengeAnswer = function (answer, challengeId, round) {
        const challenge = (window.challenges || []).find(c => c.id === challengeId);
        const title = challenge ? challenge.title : '';

        // 纯文字模式用我们的礼仪引擎
        if (window.challengePlainChat) {
          const evalResult = evaluateAnswer(answer, title, round);
          return {
            scoreDelta: evalResult.scoreDelta,
            comment: evalResult.comment,
            correctReason: evalResult.correctReason,
            suggestion: evalResult.suggestion,
            correctAnswer: evalResult.correctAnswer,
            positives: evalResult.positives,       // ✅ 新增
            improvements: evalResult.improvements  // ✅ 新增
          };
        }
        // 非纯文字模式保持原有行为
        return originalAnalyzer.apply(this, arguments);
      };
      return true;
    }
    return false;
  }

  // ===== 初始化：替换评价逻辑 + 导出 API =====
  function init() {
    // 等待 index.html 的 challenges 加载
    const tryInit = () => {
      if (typeof window.analyzeChallengeAnswer === 'function') {
        wrapExistingAnalyzer();
        return true;
      }
      return false;
    };

    if (!tryInit()) {
      // 延迟重试
      let retries = 0;
      const timer = setInterval(() => {
        retries++;
        if (tryInit() || retries > 20) clearInterval(timer);
      }, 200);
    }
  }

  function start(challengeId) {
    // 确保 challenges 已加载
    if (!window.challenges || window.challenges.length === 0) {
      // 先加载
      if (typeof window.loadMockChallenges === 'function') {
        window.loadMockChallenges(false);
      } else {
        console.warn('[RealChallenge] challenges 未加载');
        return;
      }
    }

    if (typeof window.startChallenge === 'function') {
      // 第2个参数 = plainChat，开启纯文字对话模式
      window.startChallenge(challengeId, true);
    } else {
      console.warn('[RealChallenge] startChallenge 未找到');
    }
  }

  // ===== 导出 API =====
  window.RealChallenge = {
    start,
    evaluate: evaluateAnswer,
    init,
    // 内部使用
    _SCENE_RULES: SCENE_RULES,
    _ETIQUETTE_KEYWORDS: ETIQUETTE_KEYWORDS
  };

  // DOM ready 后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
