const router = require('express').Router();
const { getProviderStatus, checkAllHealth, chat, chatStream } = require('../services/llmRouter');
const { successResponse, errorResponse } = require('../utils/response');

router.get('/providers', async (req, res) => {
  try {
    const status = getProviderStatus();
    successResponse(res, { providers: status }, '获取LLM模型列表成功');
  } catch (error) {
    errorResponse(res, 500, '获取失败', error.message);
  }
});

router.get('/health', async (req, res) => {
  try {
    const status = await checkAllHealth();
    successResponse(res, { providers: status }, '健康检查完成');
  } catch (error) {
    errorResponse(res, 500, '健康检查失败', error.message);
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { memberLevel = 'free', systemPrompt, messages } = req.body;
    
    if (!systemPrompt || !messages) {
      return errorResponse(res, 400, '缺少必要参数：systemPrompt 和 messages');
    }
    
    const result = await chat({ memberLevel, systemPrompt, messages });
    successResponse(res, { content: result }, '对话成功');
  } catch (error) {
    errorResponse(res, 500, '对话失败', error.message);
  }
});

router.post('/chat-stream', async (req, res) => {
  try {
    const { memberLevel = 'free', systemPrompt, messages } = req.body;
    
    if (!systemPrompt || !messages) {
      return errorResponse(res, 400, '缺少必要参数：systemPrompt 和 messages');
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const onChunk = (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    };
    
    const result = await chatStream({ memberLevel, systemPrompt, messages, onChunk });
    
    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      errorResponse(res, 500, '对话失败', error.message);
    }
  }
});

module.exports = router;