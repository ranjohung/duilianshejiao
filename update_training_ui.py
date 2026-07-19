import re

input_file = r"F:\开发软件项目文件\对练社交\index.html"
output_file = r"F:\开发软件项目文件\对练社交\index_new.html"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 更新analyzeUserAnswer函数，添加正确回答模板和原因
old_analyze_answer = """function analyzeUserAnswer(answer, round) {
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

new_analyze_answer = """function analyzeUserAnswer(answer, round) {
  const len = answer.length;
  
  let scoreDelta = 0;
  let comment = '';
  let suggestion = '';
  let isGood = false;
  let correctAnswer = '';
  let correctReason = '';

  if (len === 0) {
    scoreDelta = -8;
    comment = '回答为空';
    suggestion = '请输入具体的回答内容';
    correctAnswer = '你好！很高兴认识你，我叫[你的名字]。';
    correctReason = '主动介绍自己能快速建立信任，让对方对你产生基本了解，是良好沟通的开始。';
  } else if (len <= 5) {
    scoreDelta = -5;
    comment = '回答过于简短';
    suggestion = round.tips && round.tips.length > 0 ? round.tips[0] : '尝试给出更详细的回答，展示你的想法';
    correctAnswer = '你好！很高兴认识你，我叫[你的名字]，目前在[行业/公司]工作。';
    correctReason = '简短回答会让对方觉得你不太愿意交流，适当展开能让对话更顺畅。';
  } else if (len <= 15) {
    scoreDelta = -2;
    comment = '回答比较简短';
    suggestion = round.tips && round.tips.length > 1 ? round.tips[1] : '可以适当展开，让回答更丰富一些';
    correctAnswer = '你好！我是[名字]，在[公司]做[职位]，平时喜欢[爱好]。你呢？';
    correctReason = '加入反问可以引导对方继续交流，避免对话中断，展现你的兴趣。';
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
    correctAnswer = '最近工作确实比较充实，但也让我学到了很多，你最近怎么样？';
    correctReason = '用积极的方式表达压力，既真实又不会传递负面情绪，同时反问对方保持对话。';
  }

  if (answer.includes('好的') || answer.includes('嗯') || answer.includes('哦') || 
      answer.includes('随便') || answer.includes('都行')) {
    scoreDelta -= 3;
    if (scoreDelta < -10) scoreDelta = -10;
    comment += '，回答有些敷衍';
    suggestion = '尝试给出更真诚、具体的回答';
    correctAnswer = '我觉得这个方案很不错，可以试试！你觉得呢？';
    correctReason = '具体的回应能让对方感受到你的认真态度，敷衍的回答会让对方失去交流兴趣。';
  }

  if (scoreDelta > 0) {
    comment += ' +' + scoreDelta;
  } else if (scoreDelta < 0) {
    comment += ' ' + scoreDelta;
  }

  return { scoreDelta, comment, suggestion, isGood, correctAnswer, correctReason };
}"""

content = content.replace(old_analyze_answer, new_analyze_answer)

# 2. 更新sendUserMessage函数，替换confirm弹窗为自定义界面，并添加正确回答模板显示
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

    if (analysis.scoreDelta < 0 && analysis.correctAnswer) {
      setTimeout(() => {
        addTrainingMessage('✅ 正确回答参考：', false, true);
        addTrainingMessage(analysis.correctAnswer, false, true);
        addTrainingMessage('💬 为什么这么说：' + analysis.correctReason, false, true);
      }, 800);
    }

    setTimeout(() => {
      if (analysis.scoreDelta < 0 && timeRewindTickets > 0) {
        showRewindDialog();
      } else {
        continueTrainingFlow(userAnswer, analysis);
      }
    }, 1500);
  }, 800);
}

function showRewindDialog() {
  const msgs = $('training-messages');
  
  const dialogDiv = document.createElement('div');
  dialogDiv.id = 'rewind-dialog';
  dialogDiv.className = 'mt-3 animate-in bg-red-50 border border-red-200 rounded-xl p-3';
  dialogDiv.innerHTML = `
    <div class="flex items-center gap-2 mb-2">
      <span class="text-lg">⏳</span>
      <span class="text-sm font-medium text-red-700">时空穿梭</span>
    </div>
    <p class="text-xs text-red-600 mb-3">这次回答不太理想，要使用时空穿梭券重新回答吗？重新回答后可能得到更高或更低的分数，请谨慎使用。</p>
    <div class="flex gap-2">
      <button onclick="confirmRewind()" class="flex-1 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors">
        使用穿梭券（${timeRewindTickets}张）
      </button>
      <button onclick="cancelRewind()" class="flex-1 py-2 bg-white border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
        继续
      </button>
    </div>
  `;
  msgs.appendChild(dialogDiv);
  msgs.scrollTop = msgs.scrollHeight;
}

function confirmRewind() {
  const dialog = $('rewind-dialog');
  if (dialog) dialog.remove();
  useTimeRewind();
}

function cancelRewind() {
  const dialog = $('rewind-dialog');
  if (dialog) dialog.remove();
  continueTrainingFlow('', { isGood: false });
}

function continueTrainingFlow(userAnswer, analysis) {
  if (userAnswer) {
    trainingChoices.push({ 
      round: trainingRoundIdx+1, 
      answer: userAnswer,
      scoreDelta: analysis.scoreDelta,
      isGood: analysis.isGood 
    });
  }

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
}"""

content = content.replace(old_send_message, new_send_message)

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Index.html updated successfully with new training UI features!")
