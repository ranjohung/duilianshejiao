const axios = require('axios');

const TTS_BASE_URL = `https://${process.env.AZURE_TTS_REGION || 'eastasia'}.tts.speech.microsoft.com/cognitiveservices/v1`;

/**
 * Azure TTS 语音合成
 */
async function synthesize(text, options = {}) {
  const ssml = `
    <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>
      <voice name='${options.voice || 'zh-CN-XiaoxiaoNeural'}'>
        <prosody rate='${options.rate || '+0%'}' pitch='${options.pitch || '+0Hz'}'>
          ${text}
        </prosody>
      </voice>
    </speak>`.trim();

  const res = await axios.post(TTS_BASE_URL, ssml, {
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_TTS_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': options.format || 'audio-16khz-32kbitrate-mono-mp3',
    },
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  return Buffer.from(res.data);
}

/**
 * 获取可用语音列表
 */
async function listVoices() {
  const res = await axios.get(
    `https://${process.env.AZURE_TTS_REGION || 'eastasia'}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
    {
      headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_TTS_KEY },
      timeout: 10000,
    }
  );
  return res.data;
}

module.exports = { synthesize, listVoices };
