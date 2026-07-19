import re

input_file = r"F:\开发软件项目文件\对练社交\index.html"
output_file = r"F:\开发软件项目文件\对练社交\index_new.html"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 添加头像变量定义（在训练状态变量附近）
old_training_state = """let netScore = 0;
let positiveScore = 0;
let negativeScore = 0;
let consecutiveNegativeRounds = 0;
let trainingEndReason = '';"""

new_training_state = """let netScore = 0;
let positiveScore = 0;
let negativeScore = 0;
let consecutiveNegativeRounds = 0;
let trainingEndReason = '';
let coachAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Coach';
let userAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';"""

content = content.replace(old_training_state, new_training_state)

# 2. 更新addTrainingMessage函数，添加头像显示
old_add_message = """function addTrainingMessage(content, isUser, isFeedback) {
  const msgs = $('training-messages');
  const div = document.createElement('div');
  div.className = 'flex ' + (isUser ? 'justify-end' : 'justify-start') + ' animate-in';
  div.innerHTML = `<div class="max-w-[90%] px-4 py-2 rounded-xl text-sm ${isFeedback ? 'bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-lg' : isUser ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-800'}">${content}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}"""

new_add_message = """function addTrainingMessage(content, isUser, isFeedback) {
  const msgs = $('training-messages');
  const div = document.createElement('div');
  div.className = 'flex ' + (isUser ? 'justify-end' : 'justify-start') + ' items-end gap-2 animate-in mb-3';
  
  if (isUser) {
    div.innerHTML = `
      <div class="max-w-[75%] px-4 py-2.5 rounded-xl text-sm bg-indigo-500 text-white rounded-br-md">${content}</div>
      <img src="${userAvatar}" class="w-9 h-9 rounded-full border-2 border-indigo-200 object-cover" alt="用户">
    `;
  } else if (isFeedback) {
    div.className = 'flex justify-center animate-in mb-2';
    div.innerHTML = `<div class="max-w-[85%] px-3 py-1.5 bg-amber-100 text-amber-700 text-xs rounded-lg">${content}</div>`;
  } else {
    div.innerHTML = `
      <img src="${coachAvatar}" class="w-9 h-9 rounded-full border-2 border-gray-200 object-cover" alt="教练">
      <div class="max-w-[75%] px-4 py-2.5 rounded-xl text-sm bg-gray-100 text-gray-800 rounded-bl-md">${content}</div>
    `;
  }
  
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}"""

content = content.replace(old_add_message, new_add_message)

# 3. 更新开始训练时设置教练头像（根据场景性格）
old_set_coach_personality = """function startTraining(scene) {
  currentTraining = scene;
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

new_set_coach_personality = """function startTraining(scene) {
  currentTraining = scene;
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
  
  const personalities = ['友好型', '内向型', '挑剔型', '理性型'];
  const personality = personalities[Math.floor(Math.random() * personalities.length)];
  const avatarSeeds = {
    '友好型': 'Smiley',
    '内向型': 'Shy',
    '挑剔型': 'Angry',
    '理性型': 'Glasses'
  };
  coachAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeeds[personality] || 'Coach'}`;
  
  useDoublePoints = false;
  useShieldCard = false;
  useHintCard = false;
  currentRewindRound = -1;
  currentImageFit = 0;"""

content = content.replace(old_set_coach_personality, new_set_coach_personality)

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Index.html updated with chat avatar feature!")
