const axios = require('axios');
const config = require('../config');

const llmConfig = config.llm.providers;

const healthStatus = {};
const lastHealthCheck = {};
const requestCount = {};
const errorCount = {};

Object.keys(llmConfig).forEach(provider => {
  healthStatus[provider] = true;
  lastHealthCheck[provider] = 0;
  requestCount[provider] = 0;
  errorCount[provider] = 0;
});

function isProviderConfigured(provider) {
  const cfg = llmConfig[provider];
  if (!cfg || !cfg.enabled) return false;
  if (provider === 'ollama') return true;
  return cfg.apiKey && cfg.apiKey.length > 0;
}

function getHealthScore(provider) {
  const cfg = llmConfig[provider];
  const baseScore = cfg.priority * 10;
  const healthPenalty = healthStatus[provider] ? 0 : 50;
  const errorRate = requestCount[provider] > 0 ? errorCount[provider] / requestCount[provider] : 0;
  const errorPenalty = errorRate * 30;
  return Math.max(0, baseScore - healthPenalty - errorPenalty);
}

async function checkProviderHealth(provider) {
  const cfg = llmConfig[provider];
  if (!isProviderConfigured(provider)) {
    healthStatus[provider] = false;
    return;
  }

  const now = Date.now();
  if (now - lastHealthCheck[provider] < 60000) return;
  lastHealthCheck[provider] = now;

  try {
    let res;
    switch (provider) {
      case 'deepseek':
        res = await axios.get(`${cfg.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          timeout: 3000,
        });
        healthStatus[provider] = res.status === 200;
        break;
      case 'openai':
        res = await axios.get(`${cfg.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          timeout: 3000,
        });
        healthStatus[provider] = res.status === 200;
        break;
      case 'gemini':
        res = await axios.get(`${cfg.baseUrl}/models`, {
          headers: { 'x-goog-api-key': cfg.apiKey },
          timeout: 3000,
        });
        healthStatus[provider] = res.status === 200;
        break;
      case 'anthropic':
        res = await axios.get(`${cfg.baseUrl}/models`, {
          headers: { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
          timeout: 3000,
        });
        healthStatus[provider] = res.status === 200;
        break;
      case 'moonshot':
        res = await axios.get(`${cfg.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          timeout: 3000,
        });
        healthStatus[provider] = res.status === 200;
        break;
      case 'qwen':
        res = await axios.get(`${cfg.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          timeout: 3000,
        });
        healthStatus[provider] = res.status === 200;
        break;
      case 'zhipu':
        res = await axios.get(`${cfg.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          timeout: 3000,
        });
        healthStatus[provider] = res.status === 200;
        break;
      case 'huggingface':
        res = await axios.get(`${cfg.baseUrl}/${cfg.model}`, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          timeout: 5000,
        });
        healthStatus[provider] = res.status === 200;
        break;
      case 'perplexity':
        res = await axios.get(`${cfg.baseUrl}/models`, {
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          timeout: 3000,
        });
        healthStatus[provider] = res.status === 200;
        break;
      case 'ollama':
        res = await axios.get(`${cfg.baseUrl}/api/tags`, { timeout: 3000 });
        healthStatus[provider] = res.status === 200;
        break;
      default:
        healthStatus[provider] = false;
    }
  } catch {
    healthStatus[provider] = false;
  }
}

function route(memberLevel) {
  const now = Date.now();
  Object.keys(llmConfig).forEach(provider => {
    if (now - lastHealthCheck[provider] > 60000) {
      checkProviderHealth(provider);
    }
  });

  const configuredProviders = Object.keys(llmConfig)
    .filter(provider => isProviderConfigured(provider))
    .filter(provider => healthStatus[provider])
    .sort((a, b) => getHealthScore(b) - getHealthScore(a));

  if (configuredProviders.length === 0) {
    const anyProvider = Object.keys(llmConfig).find(isProviderConfigured);
    return anyProvider || 'ollama';
  }

  switch (memberLevel) {
    case 'experience':
    case 'free':
      const freeProviders = configuredProviders.filter(p => ['deepseek', 'moonshot', 'qwen', 'zhipu', 'huggingface', 'perplexity', 'ollama'].includes(p));
      return freeProviders[0] || configuredProviders[0];
    case 'daily':
    case 'weekly':
    case 'monthly':
      const paidProviders = configuredProviders.filter(p => ['deepseek', 'openai', 'gemini', 'anthropic', 'moonshot', 'qwen', 'zhipu'].includes(p));
      return paidProviders[0] || configuredProviders[0];
    case 'yearly':
      const premiumProviders = configuredProviders.filter(p => ['openai', 'gemini', 'anthropic', 'deepseek'].includes(p));
      return premiumProviders[0] || configuredProviders[0];
    default:
      return configuredProviders[0];
  }
}

async function chat({ memberLevel, systemPrompt, messages }) {
  const backend = route(memberLevel);
  requestCount[backend]++;
  
  try {
    const result = await callProvider(backend, systemPrompt, messages, false);
    errorCount[backend] = Math.max(0, errorCount[backend] - 1);
    return result;
  } catch (err) {
    errorCount[backend]++;
    healthStatus[backend] = false;
    
    const fallback = route(memberLevel);
    if (fallback !== backend) {
      requestCount[fallback]++;
      try {
        const result = await callProvider(fallback, systemPrompt, messages, false);
        errorCount[fallback] = Math.max(0, errorCount[fallback] - 1);
        return result;
      } catch (fallbackErr) {
        errorCount[fallback]++;
        healthStatus[fallback] = false;
      }
    }
    
    throw err;
  }
}

async function chatStream({ memberLevel, systemPrompt, messages, onChunk }) {
  const backend = route(memberLevel);
  requestCount[backend]++;
  
  try {
    const result = await callProvider(backend, systemPrompt, messages, true, onChunk);
    errorCount[backend] = Math.max(0, errorCount[backend] - 1);
    return result;
  } catch (err) {
    errorCount[backend]++;
    healthStatus[backend] = false;
    
    const fallback = route(memberLevel);
    if (fallback !== backend) {
      requestCount[fallback]++;
      try {
        const result = await callProvider(fallback, systemPrompt, messages, true, onChunk);
        errorCount[fallback] = Math.max(0, errorCount[fallback] - 1);
        return result;
      } catch (fallbackErr) {
        errorCount[fallback]++;
        healthStatus[fallback] = false;
      }
    }
    
    throw err;
  }
}

async function callProvider(provider, systemPrompt, messages, stream, onChunk) {
  const cfg = llmConfig[provider];
  
  switch (provider) {
    case 'deepseek':
      return stream ? await callDeepSeekStream(systemPrompt, messages, onChunk) : await callDeepSeek(systemPrompt, messages);
    case 'openai':
      return stream ? await callOpenAIStream(systemPrompt, messages, onChunk) : await callOpenAI(systemPrompt, messages);
    case 'gemini':
      return stream ? await callGeminiStream(systemPrompt, messages, onChunk) : await callGemini(systemPrompt, messages);
    case 'anthropic':
      return stream ? await callAnthropicStream(systemPrompt, messages, onChunk) : await callAnthropic(systemPrompt, messages);
    case 'moonshot':
      return stream ? await callMoonshotStream(systemPrompt, messages, onChunk) : await callMoonshot(systemPrompt, messages);
    case 'qwen':
      return stream ? await callQwenStream(systemPrompt, messages, onChunk) : await callQwen(systemPrompt, messages);
    case 'zhipu':
      return stream ? await callZhipuStream(systemPrompt, messages, onChunk) : await callZhipu(systemPrompt, messages);
    case 'huggingface':
      return stream ? await callHuggingFaceStream(systemPrompt, messages, onChunk) : await callHuggingFace(systemPrompt, messages);
    case 'perplexity':
      return stream ? await callPerplexityStream(systemPrompt, messages, onChunk) : await callPerplexity(systemPrompt, messages);
    case 'ollama':
      return stream ? await callOllamaStream(systemPrompt, messages, onChunk) : await callOllama(systemPrompt, messages);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function callDeepSeek(systemPrompt, messages) {
  const cfg = llmConfig.deepseek;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  return res.data.choices[0].message.content;
}

async function callDeepSeekStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.deepseek;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  
  const response = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature, stream: true },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, responseType: 'stream', timeout: 60000 }
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
          if (data === '[DONE]') { resolve(fullContent); return; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) { fullContent += content; onChunk?.(content); }
          } catch {}
        }
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callOpenAI(systemPrompt, messages) {
  const cfg = llmConfig.openai;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  return res.data.choices[0].message.content;
}

async function callOpenAIStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.openai;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  
  const response = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature, stream: true },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, responseType: 'stream', timeout: 60000 }
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
          if (data === '[DONE]') { resolve(fullContent); return; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) { fullContent += content; onChunk?.(content); }
          } catch {}
        }
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callGemini(systemPrompt, messages) {
  const cfg = llmConfig.gemini;
  const parts = [{ text: systemPrompt }];
  messages.forEach(msg => {
    parts.push({ text: `${msg.role}: ${msg.content}` });
  });
  
  const res = await axios.post(
    `${cfg.baseUrl}/models/${cfg.model}:generateContent`,
    { contents: [{ parts }] },
    { headers: { 'x-goog-api-key': cfg.apiKey, 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  
  const candidates = res.data.candidates || [];
  const content = candidates[0]?.content?.parts?.[0]?.text || '';
  return content || '抱歉，我无法回答这个问题。';
}

async function callGeminiStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.gemini;
  const parts = [{ text: systemPrompt }];
  messages.forEach(msg => {
    parts.push({ text: `${msg.role}: ${msg.content}` });
  });
  
  const response = await axios.post(
    `${cfg.baseUrl}/models/${cfg.model}:streamGenerateContent`,
    { contents: [{ parts }] },
    { headers: { 'x-goog-api-key': cfg.apiKey, 'Content-Type': 'application/json' }, responseType: 'stream', timeout: 60000 }
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
          try {
            const parsed = JSON.parse(line.slice(6).trim());
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (content) { fullContent += content; onChunk?.(content); }
          } catch {}
        }
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callAnthropic(systemPrompt, messages) {
  const cfg = llmConfig.anthropic;
  const allMessages = [{ role: 'user', content: systemPrompt }, ...messages];
  
  const res = await axios.post(
    `${cfg.baseUrl}/messages`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature },
    { headers: { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  
  return res.data.content[0]?.text || '';
}

async function callAnthropicStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.anthropic;
  const allMessages = [{ role: 'user', content: systemPrompt }, ...messages];
  
  const response = await axios.post(
    `${cfg.baseUrl}/messages`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature, stream: true },
    { headers: { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }, responseType: 'stream', timeout: 60000 }
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
          try {
            const parsed = JSON.parse(line.slice(6).trim());
            const content = parsed.delta?.text || '';
            if (content) { fullContent += content; onChunk?.(content); }
          } catch {}
        }
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callMoonshot(systemPrompt, messages) {
  const cfg = llmConfig.moonshot;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  return res.data.choices[0].message.content;
}

async function callMoonshotStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.moonshot;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  
  const response = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature, stream: true },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, responseType: 'stream', timeout: 60000 }
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
          if (data === '[DONE]') { resolve(fullContent); return; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) { fullContent += content; onChunk?.(content); }
          } catch {}
        }
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callQwen(systemPrompt, messages) {
  const cfg = llmConfig.qwen;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await axios.post(
    `${cfg.baseUrl}/services/aigc/text-generation/generation`,
    { model: cfg.model, input: { messages: allMessages }, parameters: { max_tokens: cfg.maxTokens, temperature: cfg.temperature } },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  
  return res.data.output?.choices?.[0]?.message?.content || '';
}

async function callQwenStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.qwen;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  
  const response = await axios.post(
    `${cfg.baseUrl}/services/aigc/text-generation/generation`,
    { model: cfg.model, input: { messages: allMessages }, parameters: { max_tokens: cfg.maxTokens, temperature: cfg.temperature }, stream: true },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, responseType: 'stream', timeout: 60000 }
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
          try {
            const parsed = JSON.parse(line.slice(6).trim());
            const content = parsed.output?.choices?.[0]?.message?.content || '';
            if (content) { fullContent += content; onChunk?.(content); }
          } catch {}
        }
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callZhipu(systemPrompt, messages) {
  const cfg = llmConfig.zhipu;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  return res.data.choices[0].message.content;
}

async function callZhipuStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.zhipu;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  
  const response = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature, stream: true },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, responseType: 'stream', timeout: 60000 }
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
          if (data === '[DONE]') { resolve(fullContent); return; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) { fullContent += content; onChunk?.(content); }
          } catch {}
        }
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callHuggingFace(systemPrompt, messages) {
  const cfg = llmConfig.huggingface;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await axios.post(
    `${cfg.baseUrl}/${cfg.model}`,
    { inputs: JSON.stringify(allMessages), parameters: { max_new_tokens: cfg.maxTokens, temperature: cfg.temperature } },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, timeout: 60000 }
  );
  
  if (Array.isArray(res.data)) {
    return res.data[0]?.generated_text || res.data[0]?.text || '';
  }
  return res.data.generated_text || res.data.text || '';
}

async function callHuggingFaceStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.huggingface;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  
  const response = await axios.post(
    `${cfg.baseUrl}/${cfg.model}`,
    { inputs: JSON.stringify(allMessages), parameters: { max_new_tokens: cfg.maxTokens, temperature: cfg.temperature, stream: true } },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, responseType: 'stream', timeout: 120000 }
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
          const content = parsed.token?.text || parsed.generated_text || '';
          if (content) { fullContent += content; onChunk?.(content); }
        } catch {}
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callPerplexity(systemPrompt, messages) {
  const cfg = llmConfig.perplexity;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
  );
  return res.data.choices[0].message.content;
}

async function callPerplexityStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.perplexity;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  
  const response = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: cfg.model, messages: allMessages, max_tokens: cfg.maxTokens, temperature: cfg.temperature, stream: true },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }, responseType: 'stream', timeout: 60000 }
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
          if (data === '[DONE]') { resolve(fullContent); return; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) { fullContent += content; onChunk?.(content); }
          } catch {}
        }
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

async function callOllama(systemPrompt, messages) {
  const cfg = llmConfig.ollama;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  const res = await axios.post(
    `${cfg.baseUrl}/api/chat`,
    { model: cfg.model, messages: allMessages, stream: false },
    { timeout: 60000 }
  );
  return res.data.message.content;
}

async function callOllamaStream(systemPrompt, messages, onChunk) {
  const cfg = llmConfig.ollama;
  const allMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  
  const response = await axios.post(
    `${cfg.baseUrl}/api/chat`,
    { model: cfg.model, messages: allMessages, stream: true },
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
          if (content) { fullContent += content; onChunk?.(content); }
          if (parsed.done) { resolve(fullContent); return; }
        } catch {}
      }
    });
    response.data.on('end', () => resolve(fullContent));
    response.data.on('error', reject);
  });
}

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

function getProviderStatus() {
  return Object.keys(llmConfig).map(provider => ({
    id: provider,
    name: provider.charAt(0).toUpperCase() + provider.slice(1),
    configured: isProviderConfigured(provider),
    healthy: healthStatus[provider],
    priority: llmConfig[provider].priority,
    healthScore: getHealthScore(provider),
    requestCount: requestCount[provider],
    errorCount: errorCount[provider],
    model: llmConfig[provider].model,
    baseUrl: llmConfig[provider].baseUrl,
  }));
}

async function checkAllHealth() {
  await Promise.all(Object.keys(llmConfig).map(checkProviderHealth));
  return getProviderStatus();
}

module.exports = { 
  route, 
  chat, 
  chatStream, 
  buildSystemPrompt,
  getProviderStatus,
  checkAllHealth,
  isProviderConfigured,
  getHealthScore,
};
