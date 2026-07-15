const axios = require('axios');
const config = require('../config');

// DeepSeek健康状态
let deepseekHealthy = true;
let lastHealthCheck = 0;

/**
 * LLM混合路由
 * 根据会员等级选择LLM后端
 */
function route(memberLevel) {
  // 健康检查（每60秒）
  const now = Date.now();
  if (now - lastHealthCheck > 60000) {
    lastHealthCheck = now;
    checkDeepSeekHealth();
  }

  if (!deepseekHealthy) return 'ollama';

  switch (memberLevel) {
    case 'experience': return 'deepseek'; // 仅1次
    case 'free': return Math.random() < 0.1 ? 'deepseek' : 'ollama'; // 10%偶遇
    case 'daily':
    case 'weekly':
    case 'monthly':
    case 'yearly': return 'deepseek';
    default: return 'ollama';
  }
}

async function checkDeepSeekHealth() {
  try {
    const res = await axios.get(`${config.deepseek.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.deepseek.apiKey}` },
      timeout: 3000,
    });
    deepseekHealthy = res.status === 200;
  } catch { deepseekHealthy = false; }
}

/**
 * 发送LLM对话
 */
async function chat({ memberLevel, systemPrompt, messages }) {
  const backend = route(memberLevel);
  try {
    if (backend === 'deepseek') return await callDeepSeek(systemPrompt, messages);
    return await callOllama(systemPrompt, messages);
  } catch (err) {
    if (backend === 'deepseek') {
      deepseekHealthy = false;
      return await callOllama(systemPrompt, messages);
    }
    throw err;
  }
}

/**
 * 流式LLM对话
 */
async function chatStream({ memberLevel, systemPrompt, messages, onChunk }) {
  const backend = route(memberLevel);
  try {
    if (backend === 'deepseek') return await callDeepSeekStream(systemPrompt, messages, onChunk);
    return await callOllamaStream(systemPrompt, messages, onChunk);
  } catch (err) {
    if (backend === 'deepseek') {
      deepseekHealthy = false;
      return await callOllamaStream(systemPrompt, messages, onChunk);
    }
    throw err;
  }
}

async function callDeepSeek(systemPrompt, messages) {
  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];
  const res = await axios.post(
    `${config.deepseek.baseUrl}/chat/completions`,
    { model: 'deepseek-chat', messages: allMessages, max_tokens: 1024, temperature: 0.7 },
    { headers: { Authorization: `Bearer ${config.deepseek.apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  return res.data.choices[0].message.content;
}

async function callDeepSeekStream(systemPrompt, messages, onChunk) {
  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await axios.post(
    `${config.deepseek.baseUrl}/chat/completions`,
    {
      model: 'deepseek-chat',
      messages: allMessages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    },
    {
      headers: {
        Authorization: `Bearer ${config.deepseek.apiKey}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      timeout: 60000,
    }
  );

  return new Promise((resolve, reject) => {
    let fullContent = '';
    let buffer = '';

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            resolve(fullContent);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onChunk?.(content);
            }
          } catch {}
        }
      }
    });

    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callOllama(systemPrompt, messages) {
  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];
  const res = await axios.post(
    `${config.ollama.baseUrl}/api/chat`,
    { model: 'qwen2.5:14b', messages: allMessages, stream: false },
    { timeout: 60000 }
  );
  return res.data.message.content;
}

async function callOllamaStream(systemPrompt, messages, onChunk) {
  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await axios.post(
    `${config.ollama.baseUrl}/api/chat`,
    { model: 'qwen2.5:14b', messages: allMessages, stream: true },
    { responseType: 'stream', timeout: 120000 }
  );

  return new Promise((resolve, reject) => {
    let fullContent = '';
    let buffer = '';

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const content = parsed.message?.content || '';
          if (content) {
            fullContent += content;
            onChunk?.(content);
          }
          if (parsed.done) {
            resolve(fullContent);
            return;
          }
        } catch {}
      }
    });

    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

/**
 * 构建教练系统提示词
 */
function buildSystemPrompt(coach, scene, emotionState = null) {
  const personality = coach.personality_config || {};
  const traits = personality.traits || {};

  let prompt = `你是${coach.name}，一位AI社交训练教练。

## 教练身份
- 称呼：${coach.name}
- 性格类型：${coach.personality_type || '温和引导型'}
- 教学风格：${coach.teaching_style || '鼓励式'}

## 性格维度
- 温暖度：${traits.warmth || 7}/10（${(traits.warmth || 7) >= 7 ? '热情亲和' : '理性克制'}）
- 专业度：${traits.professionalism || 8}/10
- 幽默度：${traits.humor || 5}/10
- 直接度：${traits.directness || 6}/10

## 行为约束
1. 始终保持教练身份，不提供医疗建议
2. 引导用户思考和表达，而非直接给答案
3. 对用户的进步给予具体肯定
4. 每次回复控制在100-200字
5. 使用"点头认可""眼神鼓励"等非语言暗示表示支持
6. 发现用户有不合理思维时，温和引导使用CBT方法`;

  if (scene) {
    prompt += `\n\n## 当前场景\n- 场景：${scene.name}\n- 阶段：${scene.stage}\n- 难度：${scene.difficulty}\n- 教学目标：${scene.teaching_points ? scene.teaching_points.join('、') : '提升社交技能'}`;
  }

  if (emotionState) {
    prompt += `\n\n## 当前情绪状态\n- 情绪：${emotionState.current || '平静'}\n- 亲密度：${emotionState.intimacy || 0}/100`;
  }

  return prompt;
}

module.exports = { route, chat, chatStream, callDeepSeek, callOllama, callDeepSeekStream, callOllamaStream, buildSystemPrompt };
