const axios = require('axios');
const config = require('../config');

/**
 * 调用DeepSeek API
 */
async function chat(messages, options = {}) {
  const res = await axios.post(
    `${config.deepseek.baseUrl}/chat/completions`,
    {
      model: options.model || 'deepseek-chat',
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${config.deepseek.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: options.timeout || 30000,
    }
  );
  return res.data;
}

/**
 * 流式调用DeepSeek API
 */
async function chatStream({ systemPrompt, messages, onChunk }) {
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

module.exports = { chat, chatStream };
