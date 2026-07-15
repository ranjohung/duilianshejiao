const axios = require('axios');
const config = require('../config');

/**
 * 调用Ollama本地API
 */
async function chat(messages, options = {}) {
  const res = await axios.post(
    `${config.ollama.baseUrl}/api/chat`,
    {
      model: options.model || 'qwen2.5:14b',
      messages,
      stream: false,
    },
    { timeout: options.timeout || 60000 }
  );
  return res.data;
}

/**
 * 流式调用Ollama API
 */
async function chatStream(messages, options = {}) {
  const res = await axios.post(
    `${config.ollama.baseUrl}/api/chat`,
    {
      model: options.model || 'qwen2.5:14b',
      messages,
      stream: true,
    },
    {
      timeout: options.timeout || 120000,
      responseType: 'stream',
    }
  );
  return res.data;
}

/**
 * 获取可用模型列表
 */
async function listModels() {
  const res = await axios.get(`${config.ollama.baseUrl}/api/tags`, { timeout: 5000 });
  return res.data.models || [];
}

module.exports = { chat, chatStream, listModels };
