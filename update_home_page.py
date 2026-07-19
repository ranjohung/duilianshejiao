import re

input_file = r"F:\开发软件项目文件\对练社交\index.html"
output_file = r"F:\开发软件项目文件\对练社交\index_new.html"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 更新首页布局，添加折叠式设计
old_home_content = """<div class="page-content">
      <div class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">📌 今日推荐训练</span>
          <span class="text-xs" id="recommend-duration">8min</span>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-lg" id="recommend-name">💑 相亲模拟</h3>
            <p class="text-sm opacity-80 mt-0.5" id="recommend-desc">朋友介绍的第一次见面</p>
          </div>
          <button onclick="startTraining(getRecommendedScene())" class="px-4 py-2 bg-white text-orange-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">开始训练</button>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span id="recommend-stars">⭐⭐⭐⭐☆</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-800">🕐 最近训练</h3>
          <button onclick="switchTab('training')" class="text-xs text-indigo-600">查看更多 →</button>
        </div>
        <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-1" id="recent-trainings"></div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">📊 本周进度</h3>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600" id="weekly-days">训练天数：3/7</span>
          <span class="text-sm font-medium text-indigo-600" id="weekly-progress">43%</span>
        </div>
        <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" id="weekly-bar" style="width:43%"></div>
        </div>
        <div class="flex items-center gap-4 mt-3">
          <div class="flex items-center gap-1">
            <span>💬</span><span class="text-xs text-gray-600">沟通力</span>
            <span class="text-xs text-green-500 font-medium" id="improve-communication">+12%</span>
          </div>
          <div class="flex items-center gap-1">
            <span>🎤</span><span class="text-xs text-gray-600">表达力</span>
            <span class="text-xs text-green-500 font-medium" id="improve-expression">+8%</span>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-sm mb-4" id="goodnight-card" style="display:none">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold">🌙 今晚晚安计划</h3>
            <p class="text-sm opacity-80 mt-0.5">"今天辛苦了，睡前想听点什么？"</p>
          </div>
          <button onclick="showGoodnight()" class="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">听TA说晚安 →</button>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">💡 今日小贴士</h3>
        <p class="text-sm text-gray-600 leading-relaxed">倾听是沟通的基础。试着在对话中多听少说，理解对方的感受比表达自己更重要。</p>
      </div>
    </div>"""

new_home_content = """<div class="page-content">
      <div class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">📌 今日推荐训练</span>
          <span class="text-xs" id="recommend-duration">8min</span>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-lg" id="recommend-name">💑 相亲模拟</h3>
            <p class="text-sm opacity-80 mt-0.5" id="recommend-desc">朋友介绍的第一次见面</p>
          </div>
          <button onclick="startTraining(getRecommendedScene())" class="px-4 py-2 bg-white text-orange-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">开始训练</button>
        </div>
        <div class="flex items-center gap-2 mt-3">
          <span id="recommend-stars">⭐⭐⭐⭐☆</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-800">🕐 最近训练</h3>
          <button onclick="switchTab('training')" class="text-xs text-indigo-600">查看更多 →</button>
        </div>
        <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-1" id="recent-trainings"></div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
        <button onclick="toggleSection('weekly-progress')" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-800">📊 本周进度</h3>
            <span class="text-xs font-medium text-indigo-600" id="weekly-progress-badge">43%</span>
          </div>
          <span class="text-gray-400 text-sm transition-transform" id="weekly-progress-icon">▼</span>
        </button>
        <div id="weekly-progress-content" class="hidden px-4 pb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600" id="weekly-days">训练天数：3/7</span>
            <span class="text-sm font-medium text-indigo-600" id="weekly-progress">43%</span>
          </div>
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" id="weekly-bar" style="width:43%"></div>
          </div>
          <div class="flex items-center gap-4 mt-3">
            <div class="flex items-center gap-1">
              <span>💬</span><span class="text-xs text-gray-600">沟通力</span>
              <span class="text-xs text-green-500 font-medium" id="improve-communication">+12%</span>
            </div>
            <div class="flex items-center gap-1">
              <span>🎤</span><span class="text-xs text-gray-600">表达力</span>
              <span class="text-xs text-green-500 font-medium" id="improve-expression">+8%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-sm mb-4 overflow-hidden">
        <button onclick="toggleSection('goodnight')" class="w-full flex items-center justify-between p-4 text-white hover:bg-white/10 transition-colors">
          <div>
            <h3 class="font-bold">🌙 今晚晚安计划</h3>
            <p class="text-sm opacity-80 mt-0.5">"今天辛苦了，睡前想听点什么？"</p>
          </div>
          <span class="text-white/80 text-sm transition-transform" id="goodnight-icon">▼</span>
        </button>
        <div id="goodnight-content" class="hidden px-4 pb-4">
          <button onclick="showGoodnight()" class="w-full px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">听TA说晚安 →</button>
        </div>
      </div>

      <div class="bg-gradient-to-r from-pink-400 to-rose-500 rounded-2xl shadow-sm mb-4 overflow-hidden">
        <button onclick="showBeautyModal()" class="w-full flex items-center justify-between p-4 text-white hover:bg-white/10 transition-colors">
          <div>
            <h3 class="font-bold">💄 变美联动</h3>
            <p class="text-sm opacity-80 mt-0.5">社交形象管理，内外兼修</p>
          </div>
          <span class="text-white/80 text-sm">→</span>
        </button>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-800">💡 今日小贴士</h3>
          <span class="text-xs text-gray-400" id="tips-date">7月17日</span>
        </div>
        <p class="text-sm text-gray-600 leading-relaxed" id="daily-tips-text">倾听是沟通的基础。试着在对话中多听少说，理解对方的感受比表达自己更重要。</p>
        <div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <button onclick="voteTip('useful')" class="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors">
            <span>👍</span><span>有用</span><span id="tip-useful-count" class="ml-1">128</span>
          </button>
          <button onclick="voteTip('useless')" class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-500 transition-colors">
            <span>👎</span><span>没用</span><span id="tip-useless-count" class="ml-1">23</span>
          </button>
          <button onclick="saveTip()" class="ml-auto flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 transition-colors">
            <span>📌</span><span>收藏</span>
          </button>
        </div>
      </div>
    </div>"""

content = content.replace(old_home_content, new_home_content)

# 2. 添加变美联动弹窗
old_modal_area = """<!-- 我的形象弹窗（PRD §3.2） -->
  <div class="modal-overlay" id="modal-avatar" style="display:none">"""

new_modal_area = """<!-- 变美联动弹窗 -->
  <div class="modal-overlay" id="modal-beauty" style="display:none">
    <div class="modal-content h-[60vh]">
      <div class="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-800">💄 变美联动</h3>
        <button onclick="closeModal('beauty')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      <div class="flex-1 overflow-auto p-4">
        <div class="bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl p-6 text-center mb-4">
          <div class="text-5xl mb-3">💅</div>
          <h4 class="font-semibold text-gray-800 mb-2">悦己颜值社</h4>
          <p class="text-sm text-gray-600">社交形象管理，内外兼修</p>
        </div>
        <div class="bg-amber-50 rounded-xl p-4 mb-4">
          <p class="text-sm text-amber-700">🎯 <strong>即将上线</strong></p>
          <p class="text-xs text-amber-600 mt-1">我们正在开发社交形象管理模块，包括妆容建议、穿搭指导、形象评分等功能。</p>
        </div>
        <div class="space-y-3">
          <div class="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <span class="text-2xl">💄</span>
            <div>
              <div class="text-sm font-medium text-gray-800">妆容建议</div>
              <div class="text-xs text-gray-500">根据场景推荐合适妆容</div>
            </div>
            <span class="ml-auto text-xs text-gray-400">即将上线</span>
          </div>
          <div class="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <span class="text-2xl">👔</span>
            <div>
              <div class="text-sm font-medium text-gray-800">穿搭指导</div>
              <div class="text-xs text-gray-500">根据体型和风格推荐穿搭</div>
            </div>
            <span class="ml-auto text-xs text-gray-400">即将上线</span>
          </div>
          <div class="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <span class="text-2xl">📸</span>
            <div>
              <div class="text-sm font-medium text-gray-800">形象评分</div>
              <div class="text-xs text-gray-500">AI分析你的社交形象</div>
            </div>
            <span class="ml-auto text-xs text-gray-400">即将上线</span>
          </div>
        </div>
        <button onclick="notifyMeBeauty()" class="w-full mt-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
          🔔 上线通知我
        </button>
      </div>
    </div>
  </div>

  <!-- 我的形象弹窗（PRD §3.2） -->
  <div class="modal-overlay" id="modal-avatar" style="display:none">"""

content = content.replace(old_modal_area, new_modal_area)

# 3. 添加折叠功能和小贴士反馈功能的JavaScript
old_render_home = """// ===== 首页 =====
function renderHome() {
  $('greeting-text').textContent = getGreeting() + '，' + userData.nickname;
  const level = getLevel(userData.points);
  $('user-level').textContent = '✨ ' + level.name;
  $('user-level').className = 'text-lg font-bold ' + level.color;"""

new_render_home = """// ===== 首页 =====
function toggleSection(id) {
  const content = $(id + '-content');
  const icon = $(id + '-icon');
  if (content && icon) {
    if (content.classList.contains('hidden')) {
      content.classList.remove('hidden');
      content.classList.add('animate-in');
      icon.style.transform = 'rotate(180deg)';
    } else {
      content.classList.add('hidden');
      content.classList.remove('animate-in');
      icon.style.transform = 'rotate(0deg)';
    }
  }
}

function showBeautyModal() {
  showModal('beauty');
}

function notifyMeBeauty() {
  alert('🎉 已订阅！变美联动功能上线时我们会通知你！');
  closeModal('beauty');
}

const tipsData = [
  { text: '倾听是沟通的基础。试着在对话中多听少说，理解对方的感受比表达自己更重要。', category: 'communication' },
  { text: '问开放式问题：把"你喜欢旅游吗"换成"你印象最深的一次旅行是去哪里"', category: 'question' },
  { text: '微笑是最好的开场白，真诚的笑容能瞬间拉近距离。', category: 'body' },
  { text: '用数据说话：不要说"我工作很努力"，要说"我今年完成了X个项目"', category: 'work' },
  { text: '重复对方的感受："听起来你当时一定很委屈"，这是共情的关键。', category: 'empathy' },
  { text: '保持眼神交流，这能展现你的自信和真诚。', category: 'body' },
  { text: 'STAR法则：先讲情境，再讲任务，然后讲行动，最后讲结果。', category: 'work' }
];

function getDailyTip() {
  const day = new Date().getDate();
  return tipsData[day % tipsData.length];
}

function voteTip(type) {
  const usefulEl = $('tip-useful-count');
  const uselessEl = $('tip-useless-count');
  if (type === 'useful') {
    usefulEl.textContent = parseInt(usefulEl.textContent) + 1;
  } else {
    uselessEl.textContent = parseInt(uselessEl.textContent) + 1;
  }
}

function saveTip() {
  const tipText = $('daily-tips-text').textContent;
  if (!userData.savedTips) userData.savedTips = [];
  if (!userData.savedTips.includes(tipText)) {
    userData.savedTips.push(tipText);
    saveUserData();
    alert('📌 已收藏到学习卡片！');
  } else {
    alert('✨ 已经收藏过了');
  }
}

function renderHome() {
  $('greeting-text').textContent = getGreeting() + '，' + userData.nickname;
  const level = getLevel(userData.points);
  $('user-level').textContent = '✨ ' + level.name;
  $('user-level').className = 'text-lg font-bold ' + level.color;
  
  const today = new Date();
  $('tips-date').textContent = today.getMonth() + 1 + '月' + today.getDate() + '日';
  const tip = getDailyTip();
  $('daily-tips-text').textContent = tip.text;"""

content = content.replace(old_render_home, new_render_home)

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Home page updated successfully!")
