import re

input_file = r"F:\开发软件项目文件\对练社交\index.html"
output_file = r"F:\开发软件项目文件\对练社交\index_new.html"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 更新训练状态变量，添加净得分相关变量
old_training_state = """// 训练状态
let currentTraining = null;
let trainingMessages = [];
let trainingRoundIdx = 0;
let trainingChoices = [];
let trainingScore = 0;
let trainingPointsGain = 0;
let showTrainingOptions = false;
let showTrainingReport = false;
let trainingFeedback = '';"""

new_training_state = """// 训练状态
let currentTraining = null;
let trainingMessages = [];
let trainingRoundIdx = 0;
let trainingChoices = [];
let trainingScore = 0;
let trainingPointsGain = 0;
let showTrainingOptions = false;
let showTrainingReport = false;
let trainingFeedback = '';
let netScore = 0;
let positiveScore = 0;
let negativeScore = 0;
let consecutiveNegativeRounds = 0;
let trainingEndReason = '';"""

content = content.replace(old_training_state, new_training_state)

# 2. 更新开始训练函数，初始化新变量
old_start_training = """  currentTraining = scene;
  trainingMessages = [];
  trainingRoundIdx = 0;
  trainingChoices = [];
  trainingScore = 0;
  trainingPointsGain = 0;
  showTrainingOptions = false;
  showTrainingReport = false;
  trainingFeedback = '';
  useDoublePoints = false;
  useShieldCard = false;
  useHintCard = false;
  currentRewindRound = -1;
  currentImageFit = 0;"""

new_start_training = """  currentTraining = scene;
  trainingMessages = [];
  trainingRoundIdx = 0;
  trainingChoices = [];
  trainingScore = 50;
  trainingPointsGain = 0;
  showTrainingOptions = false;
  showTrainingReport = false;
  trainingFeedback = '';
  netScore = 0;
  positiveScore = 0;
  negativeScore = 0;
  consecutiveNegativeRounds = 0;
  trainingEndReason = '';
  useDoublePoints = false;
  useShieldCard = false;
  useHintCard = false;
  currentRewindRound = -1;
  currentImageFit = 0;"""

content = content.replace(old_start_training, new_start_training)

# 3. 更新showTrainingInput函数，添加参考选项（盲选模式+乱序）
old_show_training_input = """function showTrainingInput() {
  const msgs = $('training-messages');
  let inputDiv = $('training-input-area');
  if (inputDiv) inputDiv.remove();

  inputDiv = document.createElement('div');
  inputDiv.id = 'training-input-area';
  inputDiv.className = 'mt-3 animate-in';
  inputDiv.innerHTML = `
    <div class="flex gap-2">
      <input type="text" id="training-input" placeholder="输入你的回答..." 
        class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        onkeypress="if(event.key==='Enter') sendUserMessage()">
      <button onclick="sendUserMessage()" class="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all">
        发送
      </button>
    </div>
  `;
  msgs.appendChild(inputDiv);
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => $('training-input').focus(), 100);
}"""

new_show_training_input = """function showTrainingInput() {
  const msgs = $('training-messages');
  let inputDiv = $('training-input-area');
  if (inputDiv) inputDiv.remove();

  const round = currentTraining.rounds[trainingRoundIdx];
  let referenceOptions = [];
  if (round && round.tips && round.tips.length > 0) {
    referenceOptions = round.tips.map((tip, idx) => ({
      text: ['A', 'B', 'C', 'D'][idx],
      content: tip
    }));
    referenceOptions.sort(() => Math.random() - 0.5);
  }

  const optionsHtml = referenceOptions.length > 0 ? `
    <div class="mb-3">
      <div class="text-xs text-gray-400 mb-2">💡 参考选项（选前全黑，仅供参考）</div>
      <div class="space-y-2">
        ${referenceOptions.map(opt => `
          <div class="option-card px-3 py-2 bg-gray-100 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition-colors"
               onclick="selectReferenceOption('${opt.content}', this)">
            <span class="font-medium text-gray-700">${opt.text}.</span>
            <span class="option-text" style="color: #374151;">${opt.content}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  inputDiv = document.createElement('div');
  inputDiv.id = 'training-input-area';
  inputDiv.className = 'mt-3 animate-in';
  inputDiv.innerHTML = `
    ${optionsHtml}
    <div class="flex gap-2">
      <input type="text" id="training-input" placeholder="输入你的回答..." 
        class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        onkeypress="if(event.key==='Enter') sendUserMessage()">
      <button onclick="sendUserMessage()" class="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all">
        发送
      </button>
    </div>
  `;
  msgs.appendChild(inputDiv);
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    const input = $('training-input');
    if (input) input.focus();
  }, 100);
}

function selectReferenceOption(content, element) {
  const input = $('training-input');
  if (input) input.value = content;
  
  const allOptions = document.querySelectorAll('.option-card');
  allOptions.forEach(opt => {
    opt.classList.remove('bg-green-100', 'bg-red-100');
    const textEl = opt.querySelector('.option-text');
    if (textEl) textEl.style.color = '#374151';
  });
  
  element.classList.add('bg-green-100');
  const textEl = element.querySelector('.option-text');
  if (textEl) textEl.style.color = '#16a34a';
}"""

content = content.replace(old_show_training_input, new_show_training_input)

# 4. 更新analyzeUserAnswer函数，使用0-10分双向评分
old_analyze_answer = """function analyzeUserAnswer(answer, round) {
  const len = answer.length;
  
  let score = 0;
  let comment = '';
  let suggestion = '';
  let isGood = false;

  if (len === 0) {
    score = 0;
    comment = '回答为空';
    suggestion = '请输入具体的回答内容';
  } else if (len <= 5) {
    score = 20;
    comment = '回答过于简短';
    suggestion = round.tips && round.tips.length > 0 ? round.tips[0] : '尝试给出更详细的回答，展示你的想法';
  } else if (len <= 15) {
    score = 40;
    comment = '回答比较简短';
    suggestion = round.tips && round.tips.length > 1 ? round.tips[1] : '可以适当展开，让回答更丰富一些';
  } else if (len <= 50) {
    score = 70;
    comment = '回答良好，表达清晰';
    isGood = true;
    if (round.tips && round.tips.length > 2) {
      suggestion = round.tips[2];
    }
  } else {
    score = 85;
    comment = '回答详细，内容丰富';
    isGood = true;
  }

  if (answer.includes('你呢') || answer.includes('你呢？') || answer.includes('你呢？') || 
      answer.includes('你呢') || answer.includes('你怎么样') || answer.includes('你呢')) {
    score += 10;
    comment += '，主动反问加分';
  }

  if (answer.includes('抱怨') || answer.includes('烦') || answer.includes('累') || 
      answer.includes('压力') && !round.ai.includes('压力')) {
    score = Math.max(0, score - 15);
    comment += '，但语气略显消极';
    suggestion = '试着用更积极的方式表达';
  }

  if (answer.includes('好的') || answer.includes('嗯') || answer.includes('哦') || 
      answer.includes('随便') || answer.includes('都行')) {
    score = Math.max(0, score - 10);
    comment += '，回答有些敷衍';
    suggestion = '尝试给出更真诚、具体的回答';
  }

  if (score >= 70) {
    comment += ' ✅';
  } else if (score >= 40) {
    comment += ' ⚪';
  } else {
    comment += ' ❌';
  }

  return { score, comment, suggestion, isGood };
}"""

new_analyze_answer = """function analyzeUserAnswer(answer, round) {
  const len = answer.length;
  
  let scoreDelta = 0;
  let comment = '';
  let suggestion = '';
  let isGood = false;

  if (len === 0) {
    scoreDelta = -8;
    comment = '回答为空';
    suggestion = '请输入具体的回答内容';
  } else if (len <= 5) {
    scoreDelta = -5;
    comment = '回答过于简短';
    suggestion = round.tips && round.tips.length > 0 ? round.tips[0] : '尝试给出更详细的回答，展示你的想法';
  } else if (len <= 15) {
    scoreDelta = -2;
    comment = '回答比较简短';
    suggestion = round.tips && round.tips.length > 1 ? round.tips[1] : '可以适当展开，让回答更丰富一些';
  } else if (len <= 30) {
    scoreDelta = 3;
    comment = '回答良好，表达清晰';
    isGood = true;
    if (round.tips && round.tips.length > 2) {
      suggestion = round.tips[2];
    }
  } else if (len <= 50) {
    scoreDelta = 6;
    comment = '回答详细，内容丰富';
    isGood = true;
  } else {
    scoreDelta = 8;
    comment = '回答非常详细，思考深入';
    isGood = true;
  }

  if (answer.includes('你呢') || answer.includes('你呢？') || 
      answer.includes('你怎么样') || answer.includes('你觉得呢')) {
    scoreDelta += 3;
    if (scoreDelta > 10) scoreDelta = 10;
    comment += '，主动反问加分';
  }

  if (answer.includes('抱怨') || answer.includes('烦') || answer.includes('累') || 
      answer.includes('压力') && !round.ai.includes('压力')) {
    scoreDelta -= 4;
    if (scoreDelta < -10) scoreDelta = -10;
    comment += '，但语气略显消极';
    suggestion = '试着用更积极的方式表达';
  }

  if (answer.includes('好的') || answer.includes('嗯') || answer.includes('哦') || 
      answer.includes('随便') || answer.includes('都行')) {
    scoreDelta -= 3;
    if (scoreDelta < -10) scoreDelta = -10;
    comment += '，回答有些敷衍';
    suggestion = '尝试给出更真诚、具体的回答';
  }

  if (scoreDelta > 0) {
    comment += ' +' + scoreDelta;
  } else if (scoreDelta < 0) {
    comment += ' ' + scoreDelta;
  }

  return { scoreDelta, comment, suggestion, isGood };
}"""

content = content.replace(old_analyze_answer, new_analyze_answer)

# 5. 更新sendUserMessage函数，使用双向评分和净得分计算
old_send_message = """function sendUserMessage() {
  const input = $('training-input');
  const userAnswer = input.value.trim();
  if (!userAnswer) return;

  showTrainingOptions = false;
  const inputArea = $('training-input-area');
  if (inputArea) inputArea.remove();

  addTrainingMessage(userAnswer, true);

  const round = currentTraining.rounds[trainingRoundIdx];
  const analysis = analyzeUserAnswer(userAnswer, round);

  setTimeout(() => {
    addTrainingMessage('📊 分析：' + analysis.comment, false, true);
    
    if (analysis.suggestion) {
      setTimeout(() => {
        addTrainingMessage('💡 改善建议：' + analysis.suggestion, false, true);
      }, 600);
    }

    trainingChoices.push({ 
      round: trainingRoundIdx+1, 
      answer: userAnswer,
      score: analysis.score,
      isGood: analysis.isGood 
    });

    setTimeout(() => {
      trainingRoundIdx++;
      $('rewind-btn').style.display = timeRewindTickets > 0 ? 'inline-flex' : 'none';
      $('rewind-btn').disabled = timeRewindTickets <= 0;
      updatePropButtons();
      if (trainingRoundIdx < currentTraining.rounds.length) {
        setTimeout(() => showRound(), 1500);
      } else {
        setTimeout(() => finishTraining(), 1500);
      }
    }, 1200);
  }, 800);
}"""

new_send_message = """function sendUserMessage() {
  const input = $('training-input');
  const userAnswer = input.value.trim();
  if (!userAnswer) return;

  showTrainingOptions = false;
  const inputArea = $('training-input-area');
  if (inputArea) inputArea.remove();

  addTrainingMessage(userAnswer, true);

  const round = currentTraining.rounds[trainingRoundIdx];
  const analysis = analyzeUserAnswer(userAnswer, round);

  trainingScore = Math.max(-100, Math.min(100, trainingScore + analysis.scoreDelta));
  
  if (analysis.scoreDelta > 0) {
    positiveScore += analysis.scoreDelta;
    consecutiveNegativeRounds = 0;
  } else if (analysis.scoreDelta < 0) {
    negativeScore += Math.abs(analysis.scoreDelta);
    consecutiveNegativeRounds++;
  }
  netScore = positiveScore - negativeScore;

  setTimeout(() => {
    addTrainingMessage('📊 分析：' + analysis.comment, false, true);
    addTrainingMessage('📈 净得分：' + (netScore > 0 ? '+' : '') + netScore, false, true);
    
    if (analysis.suggestion) {
      setTimeout(() => {
        addTrainingMessage('💡 改善建议：' + analysis.suggestion, false, true);
      }, 600);
    }

    if (analysis.scoreDelta < 0 && timeRewindTickets > 0) {
      setTimeout(() => {
        if (confirm(`⚠️ 这次回答不太理想（${analysis.scoreDelta}分），要使用时空穿梭券重新回答吗？重新回答后可能得到更高或更低的分数，请谨慎使用。`)) {
          useTimeRewind();
          return;
        }
      }, 800);
    }

    trainingChoices.push({ 
      round: trainingRoundIdx+1, 
      answer: userAnswer,
      scoreDelta: analysis.scoreDelta,
      isGood: analysis.isGood 
    });

    setTimeout(() => {
      if (checkCompletion()) return;
      
      trainingRoundIdx++;
      $('rewind-btn').style.display = timeRewindTickets > 0 ? 'inline-flex' : 'none';
      $('rewind-btn').disabled = timeRewindTickets <= 0;
      updatePropButtons();
      if (trainingRoundIdx < currentTraining.rounds.length) {
        setTimeout(() => showRound(), 1500);
      } else {
        trainingEndReason = 'complete';
        setTimeout(() => finishTraining(), 1500);
      }
    }, 1200);
  }, 800);
}

function checkCompletion() {
  if (trainingScore >= 100) {
    trainingEndReason = 'perfect';
    setTimeout(() => finishTraining(), 500);
    return true;
  }

  if (trainingScore <= -100) {
    trainingEndReason = 'zero';
    setTimeout(() => finishTraining(), 500);
    return true;
  }

  if (consecutiveNegativeRounds >= 3) {
    trainingEndReason = 'forced';
    setTimeout(() => finishTraining(), 500);
    return true;
  }

  if (trainingRoundIdx >= 20) {
    trainingEndReason = 'max_rounds';
    setTimeout(() => finishTraining(), 500);
    return true;
  }

  return false;
}"""

content = content.replace(old_send_message, new_send_message)

# 6. 更新finishTraining函数，显示净得分和结束原因
old_finish_training_start = """function finishTraining() {
  if (!currentTraining) return;

  let totalScore = 0, goodCount = 0, safeCount = 0, coldCount = 0;
  trainingChoices.forEach(c => {
    totalScore += c.score || 0;
    if (c.isGood) goodCount++;
    else if ((c.score || 0) >= 40) safeCount++;
    else coldCount++;
  });

  const total = trainingChoices.length || currentTraining.rounds.length;
  const avgScore = total > 0 ? Math.floor(totalScore / total) : 0;
  
  trainingPointsGain = Math.max(10, Math.min(80, avgScore / 2));
  if (useDoublePoints) {
    doublePointCards--;
    trainingPointsGain *= 2;
  }
  userData.points += trainingPointsGain;
  weeklyTrainingDays = Math.min(7, weeklyTrainingDays + (checkedInToday ? 0 : 1));

  trainingScore = avgScore;"""

new_finish_training_start = """function finishTraining() {
  if (!currentTraining) return;

  let goodCount = 0, safeCount = 0, coldCount = 0;
  trainingChoices.forEach(c => {
    if (c.isGood) goodCount++;
    else if ((c.scoreDelta || 0) >= 0) safeCount++;
    else coldCount++;
  });

  trainingPointsGain = Math.max(10, Math.min(80, (netScore + 100) / 4));
  if (useDoublePoints) {
    doublePointCards--;
    trainingPointsGain *= 2;
  }
  userData.points += trainingPointsGain;
  weeklyTrainingDays = Math.min(7, weeklyTrainingDays + (checkedInToday ? 0 : 1));"""

content = content.replace(old_finish_training_start, new_finish_training_start)

# 7. 更新情绪日记生成部分
old_emotion_diary = """  // 生成情绪日记
  const emotionTag = goodCount >= total*0.7 ? '😊' : goodCount >= total*0.4 ? '😐' : '😟';
  diaries.unshift({
    id: Date.now(), date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
    sceneName: currentTraining.name, emotionTag,
    score: trainingScore, insight: trainingScore>=80 ? '表现很棒！' : trainingScore>=60 ? '继续加油！' : '别灰心，继续练习'
  });"""

new_emotion_diary = """  // 生成情绪日记
  const total = trainingChoices.length || currentTraining.rounds.length;
  const emotionTag = goodCount >= total*0.7 ? '😊' : goodCount >= total*0.4 ? '😐' : '😟';
  diaries.unshift({
    id: Date.now(), date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
    sceneName: currentTraining.name, emotionTag,
    score: netScore, insight: netScore>=40 ? '表现很棒！' : netScore>=10 ? '继续加油！' : '别灰心，继续练习'
  });"""

content = content.replace(old_emotion_diary, new_emotion_diary)

# 8. 更新能力增长计算
old_ability_inc = """  // 更新能力
  const inc = Math.floor(trainingScore / 20);
  abilityStats.communication = Math.min(100, abilityStats.communication + inc);
  abilityStats.expression = Math.min(100, abilityStats.expression + inc);
  abilityStats.empathy = Math.min(100, abilityStats.empathy + inc);
  abilityStats.emotionControl = Math.min(100, abilityStats.emotionControl + Math.floor(inc/2));
  abilityStats.adaptability = Math.min(100, abilityStats.adaptability + Math.floor(inc/2));

  if (trainingScore >= 90) trainingFeedback = '🎉 太棒了！你的社交能力很强，继续保持！';
  else if (trainingScore >= 70) trainingFeedback = '👍 表现不错！有些地方还可以做得更好~';
  else if (trainingScore >= 60) trainingFeedback = '💪 及格了！多练习几次就会越来越好的！';
  else trainingFeedback = '📚 别灰心，学习需要过程，再来一次吧！';"""

new_ability_inc = """  // 更新能力
  const inc = Math.floor((netScore + 100) / 40);
  abilityStats.communication = Math.min(100, abilityStats.communication + inc);
  abilityStats.expression = Math.min(100, abilityStats.expression + inc);
  abilityStats.empathy = Math.min(100, abilityStats.empathy + inc);
  abilityStats.emotionControl = Math.min(100, abilityStats.emotionControl + Math.floor(inc/2));
  abilityStats.adaptability = Math.min(100, abilityStats.adaptability + Math.floor(inc/2));

  if (netScore >= 60) trainingFeedback = '🎉 太棒了！你的社交能力很强，继续保持！';
  else if (netScore >= 30) trainingFeedback = '👍 表现不错！有些地方还可以做得更好~';
  else if (netScore >= 0) trainingFeedback = '💪 及格了！多练习几次就会越来越好的！';
  else trainingFeedback = '📚 别灰心，学习需要过程，再来一次吧！';"""

content = content.replace(old_ability_inc, new_ability_inc)

# 9. 更新训练结果显示，显示净得分和结束原因
old_result_display = """      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white animate-in">
        <h4 class="font-semibold text-center mb-2">🎉 训练完成！</h4>
        <p class="text-sm text-center mb-3">${trainingFeedback}</p>
        <div class="flex items-center justify-center gap-6">
          <div class="text-center"><div class="text-2xl font-bold">${trainingScore}</div><div class="text-xs opacity-80">综合得分</div></div>
          <div class="text-center"><div class="text-2xl font-bold">+${trainingPointsGain}</div><div class="text-xs opacity-80">训练积分</div></div>
        </div>
      </div>"""

new_result_display = """      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white animate-in">
        <h4 class="font-semibold text-center mb-2">🎉 训练完成！</h4>
        <p class="text-sm text-center mb-3">${trainingFeedback}</p>
        <div class="text-xs text-center mb-2 opacity-80">
          ${trainingEndReason === 'perfect' ? '满分结束' : trainingEndReason === 'zero' ? '累计得分降至-100分' : trainingEndReason === 'forced' ? '连续3轮负分强制结束' : trainingEndReason === 'max_rounds' ? '达到最大轮数' : trainingEndReason === 'complete' ? '话题覆盖完成' : '用户主动结束'}
        </div>
        <div class="flex items-center justify-center gap-4">
          <div class="text-center"><div class="text-2xl font-bold">${trainingScore}</div><div class="text-xs opacity-80">综合得分</div></div>
          <div class="text-center"><div class="text-2xl font-bold">${netScore > 0 ? '+' : ''}${netScore}</div><div class="text-xs opacity-80">净得分</div></div>
          <div class="text-center"><div class="text-2xl font-bold">+${trainingPointsGain}</div><div class="text-xs opacity-80">训练积分</div></div>
        </div>
      </div>"""

content = content.replace(old_result_display, new_result_display)

# 10. 更新对话回顾部分，显示双向评分
old_conversation_review = """      <div class="bg-gray-50 rounded-xl p-4 animate-in">
        <h5 class="text-sm font-semibold text-gray-800 mb-2">📝 对话回顾</h5>
        ${trainingChoices.map(c => {
          const score = c.score || 0;
          const colorClass = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-gray-400' : 'text-red-500';
          const icon = score >= 70 ? '✅' : score >= 40 ? '⚪' : '❌';
          return `
            <div class="mb-3">
              <div class="flex items-center gap-2 text-xs mb-1">
                <span class="${colorClass}">${icon}</span>
                <span class="text-gray-600">第${c.round}轮</span>
                <span class="${colorClass} font-medium">${score}分</span>
              </div>
              <div class="text-xs text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-100">
                "${c.answer}"
              </div>
            </div>`;
        }).join('')}
      </div>"""

new_conversation_review = """      <div class="bg-gray-50 rounded-xl p-4 animate-in">
        <h5 class="text-sm font-semibold text-gray-800 mb-2">📝 对话回顾</h5>
        ${trainingChoices.map(c => {
          const delta = c.scoreDelta || 0;
          const colorClass = delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-gray-400';
          const icon = delta > 0 ? '✅' : delta < 0 ? '❌' : '⚪';
          return `
            <div class="mb-3">
              <div class="flex items-center gap-2 text-xs mb-1">
                <span class="${colorClass}">${icon}</span>
                <span class="text-gray-600">第${c.round}轮</span>
                <span class="${colorClass} font-medium">${delta > 0 ? '+' : ''}${delta}分</span>
              </div>
              <div class="text-xs text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-100">
                "${c.answer}"
              </div>
              ${delta < 0 ? '<div class="text-xs text-red-500 mt-1">💡 此轮回答有待改进，建议重新思考表达方式</div>' : ''}
            </div>`;
        }).join('')}
      </div>"""

content = content.replace(old_conversation_review, new_conversation_review)

# 11. 更新形象影响分析中的能力表现显示
old_image_analysis = """          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-gray-500">能力表现</span>
              <span class="text-indigo-600">${trainingScore}分</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full transition-all" style="width:${trainingScore}%"></div>
            </div>
          </div>"""

new_image_analysis = """          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-gray-500">能力表现</span>
              <span class="text-indigo-600">${netScore > 0 ? '+' : ''}${netScore}分</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full transition-all" style="width:${Math.max(0, Math.min(100, (netScore + 100) / 2))}%"></div>
            </div>
          </div>"""

content = content.replace(old_image_analysis, new_image_analysis)

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Index.html updated successfully!")
