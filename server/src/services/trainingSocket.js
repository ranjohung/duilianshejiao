const socketIo = require('socket.io');
const jwt = require('../utils/jwt');
const User = require('../models/User');
const Scene = require('../models/Scene');
const TrainingRecord = require('../models/TrainingRecord');
const { chat } = require('../services/llmRouter');

const MAX_ROUNDS = 20;
const TOPICS = ['work', 'income', 'family', 'values', 'marriage'];

const trainingSessions = new Map();

function initTrainingSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    let userId = null;
    let trainingSession = null;
    let userMemberLevel = 'free';

    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verifyToken(token);
        userId = decoded.userId;
        socket.userId = userId;
        
        const user = await User.getById(userId);
        if (user) {
          userMemberLevel = user.member_level || 'free';
        }
        
        socket.emit('authenticated', { success: true });
      } catch (err) {
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    });

    socket.on('start_training', async (data) => {
      if (!userId) {
        socket.emit('error', { message: '请先登录' });
        return;
      }

      try {
        const { scene_id } = data;
        const scene = await Scene.getById(scene_id);
        if (!scene) {
          socket.emit('error', { message: '场景不存在' });
          return;
        }

        const canUnlock = await Scene.checkUnlock(scene_id, userId);
        if (!canUnlock) {
          socket.emit('error', { message: '场景未解锁' });
          return;
        }

        const sessionId = `tr_${Date.now()}_${userId}`;
        trainingSession = {
          sessionId,
          userId,
          sceneId: scene_id,
          sceneName: scene.name,
          sceneDescription: scene.description,
          messages: [],
          score: 50,
          netScore: 0,
          positiveScore: 0,
          negativeScore: 0,
          round: 0,
          topicsCovered: [],
          suggestionsHistory: [],
          npcAttitudeHistory: [],
          consecutiveNegativeRounds: 0,
          isActive: true,
          startTime: Date.now(),
          personality: ['友好型', '内向型', '挑剔型', '理性型'][Math.floor(Math.random() * 4)]
        };

        trainingSessions.set(sessionId, trainingSession);
        socket.sessionId = sessionId;

        const openingLine = await generateOpeningLineLLM(scene.name, scene.description, trainingSession.personality);
        
        trainingSession.messages.push({
          type: 'npc_message',
          content: openingLine,
          emotion: 'neutral',
          personality: trainingSession.personality
        });

        socket.emit('training_started', {
          session_id: sessionId,
          scene_name: scene.name,
          opening_line: openingLine,
          personality: trainingSession.personality,
          current_score: trainingSession.score,
          round: 0,
          max_rounds: MAX_ROUNDS
        });

      } catch (err) {
        console.error('Start training error:', err);
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('user_message', async (data) => {
      if (!userId || !trainingSession || !trainingSession.isActive) {
        socket.emit('error', { message: '训练未开始或已结束' });
        return;
      }

      try {
        const { content, use_hint = false, use_time_travel = false } = data;
        
        if (use_time_travel) {
          handleTimeTravel(socket, trainingSession);
          return;
        }

        trainingSession.round++;
        trainingSession.messages.push({
          type: 'user_message',
          content: content.trim()
        });

        const analysis = await analyzeUserAnswerLLM(content.trim(), trainingSession);
        
        trainingSession.score = Math.max(-100, Math.min(100, trainingSession.score + analysis.scoreDelta));
        
        if (analysis.scoreDelta > 0) {
          trainingSession.positiveScore += analysis.scoreDelta;
          trainingSession.consecutiveNegativeRounds = 0;
        } else if (analysis.scoreDelta < 0) {
          trainingSession.negativeScore += Math.abs(analysis.scoreDelta);
          trainingSession.consecutiveNegativeRounds++;
        }
        trainingSession.netScore = trainingSession.positiveScore - trainingSession.negativeScore;
        
        trainingSession.suggestionsHistory.push({
          round: trainingSession.round,
          suggestions: analysis.suggestions,
          scoreDelta: analysis.scoreDelta
        });

        detectTopics(content, trainingSession);

        const npcResponse = await generateNPCResponseLLM(content, trainingSession);
        trainingSession.messages.push({
          type: 'npc_message',
          content: npcResponse.content,
          emotion: npcResponse.emotion
        });

        trainingSession.npcAttitudeHistory.push({
          round: trainingSession.round,
          emotion: npcResponse.emotion,
          score: trainingSession.score
        });

        socket.emit('npc_message', {
          content: npcResponse.content,
          emotion: npcResponse.emotion
        });

        socket.emit('suggestions', {
          items: analysis.suggestions
        });

        socket.emit('score_update', {
          current_score: trainingSession.score,
          score_delta: analysis.scoreDelta,
          round: trainingSession.round,
          max_rounds: MAX_ROUNDS,
          topics_covered: trainingSession.topicsCovered.length,
          total_topics: TOPICS.length
        });

        if (checkCompletion(trainingSession, socket)) {
          return;
        }

      } catch (err) {
        console.error('User message error:', err);
        socket.emit('error', { message: '处理失败，请重试' });
      }
    });

    socket.on('end_training', async () => {
      if (trainingSession && trainingSession.isActive) {
        await completeTraining(trainingSession, 'manual', socket);
      }
    });

    socket.on('disconnect', async () => {
      if (trainingSession && trainingSession.isActive) {
        await completeTraining(trainingSession, 'manual', socket);
      }
      if (socket.sessionId) {
        trainingSessions.delete(socket.sessionId);
      }
    });
  });

  return io;
}

async function generateOpeningLineLLM(sceneName, sceneDescription, personality) {
  const systemPrompt = `你是一个社交模拟场景中的NPC。
场景：${sceneName}
描述：${sceneDescription || '无'}
你的性格：${personality}

请根据场景和你的性格，说出第一句开场白。要求：
1. 自然、真实，符合该场景的社交语境
2. 简短，50字以内
3. 能引导对方开始对话
4. 使用口语化表达`;

  try {
    const response = await chat({
      memberLevel: 'free',
      systemPrompt,
      messages: [{ role: 'user', content: '请说出你的第一句话。' }]
    });
    return response.trim() || generateFallbackOpening(sceneName);
  } catch (err) {
    console.warn('LLM opening generation failed, using fallback');
    return generateFallbackOpening(sceneName);
  }
}

function generateFallbackOpening(sceneName) {
  const openings = {
    '相亲模拟': ['你好，很高兴认识你！我是小雨。', '你好呀，我是朋友介绍来的。', '终于见面了，你比照片上好看呢~'],
    '模拟面试': ['你好，请坐。先做个自我介绍吧。', '欢迎来面试，请简单介绍一下自己。', '你好，期待你的表现。'],
    '加薪谈判': ['找我有什么事吗？', '最近工作怎么样？', '有什么想聊的？'],
    '兴趣社群自我介绍': ['大家好！欢迎新人加入！', '新朋友来了，快来介绍一下自己吧。', '欢迎欢迎！'],
    '被朋友误解(NVC)': ['你昨天为什么不回我消息？', '我很担心你，你去哪了？', '你是不是不在乎我了？'],
    '共情沟通训练': ['最近压力好大，感觉好累...', '我真的快撑不住了...', '想找人聊聊，你愿意听吗？']
  };
  const sceneOpenings = openings[sceneName] || ['你好！'];
  return sceneOpenings[Math.floor(Math.random() * sceneOpenings.length)];
}

async function analyzeUserAnswerLLM(answer, session) {
  const systemPrompt = `你是一个专业的社交技能教练，正在评估用户的对话表现。

当前场景：${session.sceneName}
当前得分：${session.score}/100
对话轮数：第${session.round}轮

请分析用户的回答，并给出：
1. 评分变化（-10到+10之间的整数）
2. 2-3条具体的改进建议

评分规则：
加分项：
- 真诚回答：+2~5
- 表达清晰：+2~5
- 展现共情：+3~8
- 主动提问：+3~5
- 幽默得体的回应：+2~5
- 展现自信：+2~5

扣分项：
- 回避问题：-3~8
- 回答过于简短：-2~5
- 表达模糊不清：-2~5
- 不恰当的用词：-3~8
- 打断或无视对方：-3~8

请以JSON格式返回，格式如下：
{
  "scoreDelta": 5,
  "suggestions": [
    {"type": "内容建议", "content": "具体建议内容"},
    {"type": "加分提示", "content": "加分原因"}
  ]
}`;

  try {
    const response = await chat({
      memberLevel: 'free',
      systemPrompt,
      messages: [{ role: 'user', content: `用户回答："${answer}"` }]
    });
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        scoreDelta: Math.max(-10, Math.min(10, result.scoreDelta || 0)),
        suggestions: result.suggestions || generateDefaultSuggestions(answer)
      };
    }
  } catch (err) {
    console.warn('LLM analysis failed, using fallback');
  }

  return generateDefaultAnalysis(answer, session);
}

function generateDefaultAnalysis(answer, session) {
  const len = answer.length;
  let scoreDelta = 0;
  const suggestions = [];

  if (len === 0) {
    scoreDelta = -5;
    suggestions.push({ type: '内容建议', content: '请输入具体的回答内容' });
  } else if (len <= 5) {
    scoreDelta = -3;
    suggestions.push({ type: '表达建议', content: '回答过于简短，可以多说一些让对方感受到你愿意交流' });
  } else if (len <= 15) {
    scoreDelta = -1;
    suggestions.push({ type: '表达建议', content: '可以适当展开，让回答更丰富一些' });
  } else if (len <= 50) {
    scoreDelta = 3;
    suggestions.push({ type: '加分提示', content: '回答良好，表达清晰！+3分' });
  } else {
    scoreDelta = 5;
    suggestions.push({ type: '加分提示', content: '回答详细，内容丰富！+5分' });
  }

  if (answer.includes('你呢') || answer.includes('你怎么样') || answer.includes('你呢？')) {
    scoreDelta += 3;
    suggestions.push({ type: '加分提示', content: '主动反问加分！+3分' });
  }

  const negativeWords = ['抱怨', '烦', '累', '压力大', '没意思', '无聊'];
  const hasNegative = negativeWords.some(word => answer.includes(word));
  if (hasNegative && !session.sceneName.includes('压力') && !session.sceneName.includes('误解')) {
    scoreDelta = Math.max(-5, scoreDelta - 2);
    suggestions.push({ type: '表达建议', content: '语气略显消极，试着用更积极的方式表达' });
  }

  const perfunctoryWords = ['好的', '嗯', '哦', '随便', '都行', '没什么', '还好'];
  const hasPerfunctory = perfunctoryWords.some(word => answer.includes(word));
  if (hasPerfunctory && len < 20) {
    scoreDelta = Math.max(-3, scoreDelta - 2);
    suggestions.push({ type: '策略建议', content: '回答有些敷衍，尝试给出更真诚、具体的回答' });
  }

  if (answer.includes('因为') || answer.includes('所以') || answer.includes('首先')) {
    scoreDelta += 2;
    suggestions.push({ type: '加分提示', content: '逻辑清晰！+2分' });
  }

  return { scoreDelta, suggestions };
}

function generateDefaultSuggestions(answer) {
  const suggestions = [];
  if (answer.length < 20) {
    suggestions.push({ type: '表达建议', content: '可以多说一些让对方感受到你愿意交流' });
  } else {
    suggestions.push({ type: '加分提示', content: '回答内容充实，继续保持！' });
  }
  suggestions.push({ type: '策略建议', content: '试着主动提问，引导对方深入交流' });
  return suggestions;
}

async function generateNPCResponseLLM(userAnswer, session) {
  const recentMessages = session.messages.slice(-6).map(m => 
    `${m.type === 'user_message' ? '用户' : 'NPC'}: ${m.content}`
  ).join('\n');

  const systemPrompt = `你是一个社交模拟场景中的NPC。
场景：${session.sceneName}
描述：${session.sceneDescription || '无'}
你的性格：${session.personality}

对话历史：
${recentMessages}

请根据以上信息，生成你的下一句回应。要求：
1. 自然、真实，符合该场景的社交语境
2. 根据用户的回答内容进行回应，不是凭空说话
3. 简短，80字以内
4. 使用口语化表达
5. 可以适当追问或表达感受

请以JSON格式返回，格式如下：
{
  "content": "你的回应内容",
  "emotion": "情绪状态（如：interested, curious, happy, neutral, angry等）"
}`;

  try {
    const response = await chat({
      memberLevel: 'free',
      systemPrompt,
      messages: [{ role: 'user', content: `用户刚刚说："${userAnswer}"` }]
    });
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        content: result.content.trim() || generateFallbackResponse(session.sceneName),
        emotion: result.emotion || 'neutral'
      };
    }
  } catch (err) {
    console.warn('LLM NPC response generation failed, using fallback');
  }

  return generateFallbackNPCResponse(userAnswer, session);
}

function generateFallbackNPCResponse(userAnswer, session) {
  const responses = {
    '相亲模拟': generateDateResponse,
    '模拟面试': generateInterviewResponse,
    '加薪谈判': generateNegotiationResponse,
    '兴趣社群自我介绍': generateCommunityResponse,
    '被朋友误解(NVC)': generateMisunderstandingResponse,
    '共情沟通训练': generateEmpathyResponse
  };
  const generator = responses[session.sceneName] || generateDefaultResponse;
  return generator(userAnswer, session);
}

function generateDateResponse(answer, session) {
  const responses = [];
  if (answer.includes('工作') || answer.includes('职业') || answer.includes('公司')) {
    responses.push({ content: '听起来很厉害！平时工作忙吗？', emotion: 'interested' });
    responses.push({ content: '做这个工作需要经常加班吗？', emotion: 'curious' });
  }
  if (answer.includes('爱好') || answer.includes('喜欢') || answer.includes('兴趣')) {
    responses.push({ content: '这个爱好挺有意思的！你最喜欢哪种活动？', emotion: 'interested' });
    responses.push({ content: '我也挺喜欢类似的活动呢~', emotion: 'happy' });
  }
  if (answer.includes('房') || answer.includes('车') || answer.includes('收入')) {
    responses.push({ content: '现在年轻人压力都挺大的...', emotion: 'neutral' });
    responses.push({ content: '慢慢来，都会有的！', emotion: 'encouraging' });
  }
  if (answer.includes('家庭') || answer.includes('父母')) {
    responses.push({ content: '你的家庭观念很重呢~', emotion: 'warm' });
    responses.push({ content: '和父母住在一起吗？', emotion: 'curious' });
  }
  if (answer.includes('单身') || answer.includes('恋爱')) {
    responses.push({ content: '缘分到了自然会有的！', emotion: 'encouraging' });
    responses.push({ content: '你对另一半有什么要求吗？', emotion: 'curious' });
  }
  if (responses.length === 0) {
    responses.push({ content: '嗯，我明白了~', emotion: 'neutral' });
    responses.push({ content: '你平时还喜欢做什么？', emotion: 'curious' });
    responses.push({ content: '听起来不错！', emotion: 'positive' });
  }
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateInterviewResponse(answer, session) {
  const responses = [];
  if (answer.includes('介绍') || answer.includes('毕业') || answer.includes('经验')) {
    responses.push({ content: '你的经历很丰富。最大的优点是什么？', emotion: 'professional' });
    responses.push({ content: '为什么选择我们公司？', emotion: 'curious' });
  }
  if (answer.includes('优点') || answer.includes('优势')) {
    responses.push({ content: '能举个具体的例子吗？', emotion: 'professional' });
    responses.push({ content: '这个优点如何帮助你工作？', emotion: 'curious' });
  }
  if (answer.includes('公司') || answer.includes('选择')) {
    responses.push({ content: '对我们公司了解多少？', emotion: 'professional' });
    responses.push({ content: '最吸引你的是什么？', emotion: 'curious' });
  }
  if (answer.includes('薪资') || answer.includes('待遇')) {
    responses.push({ content: '为什么期望这个薪资？', emotion: 'professional' });
    responses.push({ content: '市场行情是怎样的？', emotion: 'analytical' });
  }
  if (answer.includes('压力') || answer.includes('加班')) {
    responses.push({ content: '如何处理工作中的压力？', emotion: 'professional' });
    responses.push({ content: '如何平衡工作和生活？', emotion: 'curious' });
  }
  if (responses.length === 0) {
    responses.push({ content: '明白了。还有什么想补充的吗？', emotion: 'neutral' });
    responses.push({ content: '继续。', emotion: 'professional' });
  }
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateNegotiationResponse(answer, session) {
  const responses = [];
  if (answer.includes('加薪') || answer.includes('薪资') || answer.includes('工资')) {
    responses.push({ content: '为什么觉得自己值得加薪？', emotion: 'professional' });
    responses.push({ content: '能具体说说你的贡献吗？', emotion: 'analytical' });
  }
  if (answer.includes('贡献') || answer.includes('业绩') || answer.includes('价值')) {
    responses.push({ content: '公司最近成本压力很大...', emotion: 'neutral' });
    responses.push({ content: '你期望的涨幅是多少？', emotion: 'professional' });
  }
  if (answer.includes('压力') || answer.includes('困难')) {
    responses.push({ content: '理解你的感受，但公司也有难处。', emotion: 'sympathetic' });
    responses.push({ content: '有没有其他替代方案？', emotion: 'curious' });
  }
  if (answer.includes('比较') || answer.includes('同事')) {
    responses.push({ content: '每个人的情况不同，不能简单比较。', emotion: 'professional' });
    responses.push({ content: '你的核心竞争力是什么？', emotion: 'analytical' });
  }
  if (responses.length === 0) {
    responses.push({ content: '我需要考虑一下。', emotion: 'neutral' });
    responses.push({ content: '还有其他事吗？', emotion: 'professional' });
  }
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateCommunityResponse(answer, session) {
  const responses = [];
  if (answer.includes('爱好') || answer.includes('喜欢') || answer.includes('摄影')) {
    responses.push({ content: '太棒了！有作品可以分享吗？', emotion: 'excited' });
    responses.push({ content: '最喜欢拍什么类型的？', emotion: 'curious' });
  }
  if (answer.includes('新人') || answer.includes('加入') || answer.includes('学习')) {
    responses.push({ content: '欢迎加入！有什么问题随时问。', emotion: 'friendly' });
    responses.push({ content: '大家都很热心的~', emotion: 'warm' });
  }
  if (answer.includes('作品') || answer.includes('照片') || answer.includes('分享')) {
    responses.push({ content: '哇，拍得真好！', emotion: 'excited' });
    responses.push({ content: '这张照片的故事是什么？', emotion: 'curious' });
  }
  if (responses.length === 0) {
    responses.push({ content: '欢迎欢迎！', emotion: 'friendly' });
    responses.push({ content: '很高兴认识你！', emotion: 'happy' });
  }
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateMisunderstandingResponse(answer, session) {
  const responses = [];
  if (answer.includes('抱歉') || answer.includes('对不起') || answer.includes('让你担心')) {
    responses.push({ content: '好吧，这次就原谅你了...', emotion: 'forgiving' });
    responses.push({ content: '下次一定要及时回复！', emotion: 'expectant' });
  }
  if (answer.includes('忙') || answer.includes('没时间') || answer.includes('忘了')) {
    responses.push({ content: '忙就可以不回消息吗？', emotion: 'angry' });
    responses.push({ content: '我很担心你知道吗？', emotion: 'sad' });
  }
  if (answer.includes('解释') || answer.includes('原因')) {
    responses.push({ content: '好吧，我理解了。', emotion: 'neutral' });
    responses.push({ content: '下次记得提前说一声。', emotion: 'expectant' });
  }
  if (answer.includes('不在乎') || answer.includes('敏感') || answer.includes('管')) {
    responses.push({ content: '我在乎你才会担心啊！', emotion: 'hurt' });
    responses.push({ content: '你太让我失望了...', emotion: 'sad' });
  }
  if (responses.length === 0) {
    responses.push({ content: '我真的很生气！', emotion: 'angry' });
    responses.push({ content: '你怎么可以这样...', emotion: 'sad' });
  }
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateEmpathyResponse(answer, session) {
  const responses = [];
  if (answer.includes('辛苦') || answer.includes('不容易') || answer.includes('理解')) {
    responses.push({ content: '谢谢你愿意听我说...', emotion: 'grateful' });
    responses.push({ content: '被理解的感觉真好...', emotion: 'relieved' });
  }
  if (answer.includes('加油') || answer.includes('挺住') || answer.includes('支持')) {
    responses.push({ content: '谢谢你的鼓励...', emotion: 'grateful' });
    responses.push({ content: '有你在真好...', emotion: 'warm' });
  }
  if (answer.includes('怎么办') || answer.includes('建议') || answer.includes('帮忙')) {
    responses.push({ content: '我也不知道该怎么办...', emotion: 'helpless' });
    responses.push({ content: '谢谢你愿意帮我...', emotion: 'grateful' });
  }
  if (answer.includes('抱怨') || answer.includes('别难过') || answer.includes('想开点')) {
    responses.push({ content: '我不是在抱怨...', emotion: 'frustrated' });
    responses.push({ content: '有时候只是需要有人倾听...', emotion: 'sad' });
  }
  if (responses.length === 0) {
    responses.push({ content: '谢谢你愿意听我倾诉...', emotion: 'grateful' });
    responses.push({ content: '说出来感觉好多了...', emotion: 'relieved' });
  }
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateDefaultResponse(answer, session) {
  return {
    content: ['我明白了~', '继续说说吧~', '听起来不错！', '有意思~'][Math.floor(Math.random() * 4)],
    emotion: 'neutral'
  };
}

function generateFallbackResponse(sceneName) {
  const responses = {
    '相亲模拟': ['嗯，我明白了~', '你平时还喜欢做什么？', '听起来不错！'],
    '模拟面试': ['明白了。还有什么想补充的吗？', '继续。', '好的，请继续。'],
    '加薪谈判': ['我需要考虑一下。', '还有其他事吗？', '明白了。'],
    '兴趣社群自我介绍': ['欢迎欢迎！', '很高兴认识你！', '期待你的分享~'],
    '被朋友误解(NVC)': ['我真的很生气！', '你怎么可以这样...', '我很失望...'],
    '共情沟通训练': ['谢谢你愿意听我倾诉...', '说出来感觉好多了...', '有你在真好...']
  };
  const sceneResponses = responses[sceneName] || ['我明白了~'];
  return sceneResponses[Math.floor(Math.random() * sceneResponses.length)];
}

function detectTopics(answer, session) {
  const topicKeywords = {
    work: ['工作', '职业', '公司', '上班', '职场', '老板', '同事', '项目'],
    income: ['工资', '薪资', '收入', '待遇', '房', '车', '钱'],
    family: ['家庭', '父母', '爸妈', '家人', '亲戚', '孩子'],
    values: ['价值观', '人生观', '理想', '目标', '追求', '信仰'],
    marriage: ['恋爱', '单身', '结婚', '对象', '另一半', '相亲']
  };

  TOPICS.forEach(topic => {
    if (!session.topicsCovered.includes(topic)) {
      const keywords = topicKeywords[topic] || [];
      if (keywords.some(keyword => answer.includes(keyword))) {
        session.topicsCovered.push(topic);
      }
    }
  });
}

function handleTimeTravel(socket, session) {
  if (session.round <= 1) {
    socket.emit('error', { message: '无法回到第一轮之前' });
    return;
  }

  session.round--;
  session.messages = session.messages.slice(0, -2);
  
  const lastNPCMessage = session.messages.find(m => m.type === 'npc_message');
  if (lastNPCMessage) {
    socket.emit('time_travel', {
      round: session.round,
      npc_message: lastNPCMessage.content
    });
  }
}

function checkCompletion(session, socket) {
  if (session.score >= 100) {
    completeTraining(session, 'perfect', socket);
    return true;
  }

  if (session.score <= -100) {
    completeTraining(session, 'zero', socket);
    return true;
  }

  if (session.consecutiveNegativeRounds >= 3) {
    completeTraining(session, 'forced', socket);
    return true;
  }

  if (session.round >= MAX_ROUNDS) {
    completeTraining(session, 'max_rounds', socket);
    return true;
  }

  if (session.topicsCovered.length >= TOPICS.length) {
    completeTraining(session, 'complete', socket);
    return true;
  }

  return false;
}

async function completeTraining(session, reason, socket) {
  session.isActive = false;

  try {
    const duration = Math.floor((Date.now() - session.startTime) / 1000);
    
    await TrainingRecord.create({
      user_id: session.userId,
      coach_id: null,
      scene_id: session.sceneId,
      messages: JSON.stringify(session.messages),
      score: session.score,
      duration,
      total_rounds: session.round,
      suggestions_history: JSON.stringify(session.suggestionsHistory),
      npc_attitude_history: JSON.stringify(session.npcAttitudeHistory),
      topics_covered: JSON.stringify(session.topicsCovered),
      completion_reason: reason,
      net_score: session.netScore,
      positive_score: session.positiveScore,
      negative_score: session.negativeScore
    });

    const pointsToAdd = Math.max(0, Math.floor(session.netScore / 10));
    await User.addTrainingPoints(session.userId, pointsToAdd);

    socket.emit('training_complete', {
      reason,
      final_score: session.score,
      net_score: session.netScore,
      rounds: session.round,
      topics_covered: session.topicsCovered,
      points_gained: pointsToAdd
    });

  } catch (err) {
    console.error('Complete training error:', err);
    socket.emit('error', { message: '保存记录失败' });
  }

  trainingSessions.delete(session.sessionId);
}

module.exports = { initTrainingSocket };