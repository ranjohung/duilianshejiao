const router = require('express').Router();
const fs = require('fs');
const path = require('path');

const KNOWLEDGE_BASE_PATH = path.resolve(__dirname, '../../../knowledge_base');

let scriptCache = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

function loadScripts() {
  const now = Date.now();
  if (scriptCache && now - cacheTimestamp < CACHE_DURATION) {
    return;
  }

  scriptCache = {
    scenes: {},
    emotions: {},
    coachStyles: {},
    allScripts: [],
    purposeIndex: {},
    tagIndex: {}
  };

  const scenesDir = path.join(KNOWLEDGE_BASE_PATH, 'scenes');
  const emotionsDir = path.join(KNOWLEDGE_BASE_PATH, 'emotions');
  const coachStylesDir = path.join(KNOWLEDGE_BASE_PATH, 'coach_styles');

  function loadJsonFiles(dir, category) {
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(dir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          if (category === 'scenes') {
            scriptCache.scenes[data.scene_id] = data.scripts;
          } else if (category === 'emotions') {
            scriptCache.emotions[data.emotion_id] = data.scripts;
          } else if (category === 'coachStyles') {
            scriptCache.coachStyles[data.coach_id] = data.scripts;
          }

          data.scripts.forEach(script => {
            script.source = category;
            script.source_id = category === 'scenes' ? data.scene_id : 
                              category === 'emotions' ? data.emotion_id : data.coach_id;
            scriptCache.allScripts.push(script);

            if (!scriptCache.purposeIndex[script.purpose]) {
              scriptCache.purposeIndex[script.purpose] = [];
            }
            scriptCache.purposeIndex[script.purpose].push(script);

            script.tags.forEach(tag => {
              if (!scriptCache.tagIndex[tag]) {
                scriptCache.tagIndex[tag] = [];
              }
              scriptCache.tagIndex[tag].push(script);
            });
          });
        }
      });
    } catch (err) {
      console.error(`Failed to load ${category} scripts:`, err);
    }
  }

  loadJsonFiles(scenesDir, 'scenes');
  loadJsonFiles(emotionsDir, 'emotions');
  loadJsonFiles(coachStylesDir, 'coachStyles');

  cacheTimestamp = now;
  console.log(`Script cache loaded: ${scriptCache.allScripts.length} scripts`);
}

loadScripts();

router.post('/retrieve', async (req, res) => {
  try {
    const { scene_id, round, user_emotion, coach_style, purpose, user_history, fallback_to_llm } = req.body;

    if (!scene_id && !purpose) {
      return res.status(400).json({ code: -1, message: 'scene_id或purpose不能为空' });
    }

    loadScripts();

    let matchedScript = null;
    let matchLevel = '';
    let confidence = 0;

    const sceneScripts = scriptCache.scenes[scene_id] || [];

    const level1Candidates = sceneScripts.filter(script => {
      const roundMatch = script.round === round;
      const emotionMatch = Array.isArray(script.user_emotion) 
        ? script.user_emotion.includes(user_emotion) 
        : String(script.user_emotion).includes(user_emotion);
      const styleMatch = Array.isArray(script.coach_style) 
        ? script.coach_style.includes(coach_style) 
        : String(script.coach_style).includes(coach_style);
      return roundMatch && emotionMatch && styleMatch;
    });

    if (level1Candidates.length > 0) {
      level1Candidates.sort((a, b) => b.rating - a.rating);
      matchedScript = level1Candidates[0];
      matchLevel = '精确匹配';
      confidence = 0.95;
    } else {
      const level2Candidates = sceneScripts.filter(script => {
        return script.round === round;
      });

      if (level2Candidates.length > 0) {
        level2Candidates.sort((a, b) => b.usage_count - a.usage_count);
        matchedScript = level2Candidates[0];
        matchLevel = '模糊匹配';
        confidence = 0.75;
      } else {
        const level3Candidates = scriptCache.purposeIndex[purpose] || [];
        if (level3Candidates.length > 0) {
          level3Candidates.sort((a, b) => b.rating - a.rating);
          matchedScript = level3Candidates[0];
          matchLevel = '通用兜底';
          confidence = 0.5;
        }
      }
    }

    if (!matchedScript && fallback_to_llm !== false) {
      return res.json({
        code: 0,
        data: {
          script_id: null,
          text: null,
          source: 'LLM生成',
          match_level: 'LLM生成',
          confidence: 0.3,
          coach_adapted_text: null,
          llm_used: true
        }
      });
    }

    let coachAdaptedText = matchedScript.text;
    let llmUsed = false;

    if (matchedScript && user_history) {
      llmUsed = true;
      coachAdaptedText = `${matchedScript.text} 结合你的情况，${user_history.includes('紧张') ? '放轻松一点' : '继续保持'}，你可以做得更好！`;
    }

    res.json({
      code: 0,
      data: {
        script_id: matchedScript.id,
        text: matchedScript.text,
        source: '本地话术库',
        match_level: matchLevel,
        confidence: confidence,
        coach_adapted_text: coachAdaptedText,
        llm_used: llmUsed,
        purpose: matchedScript.purpose,
        level: matchedScript.level,
        tags: matchedScript.tags
      }
    });

  } catch (error) {
    console.error('Script retrieval error:', error);
    res.status(500).json({ code: -1, message: '话术检索失败', error: error.message });
  }
});

router.get('/index', async (req, res) => {
  try {
    const indexPath = path.join(KNOWLEDGE_BASE_PATH, 'script_index.json');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    res.json({ code: 0, data: index });
  } catch (error) {
    res.status(500).json({ code: -1, message: '获取索引失败', error: error.message });
  }
});

router.get('/scenes', async (req, res) => {
  try {
    loadScripts();
    const scenes = Object.keys(scriptCache.scenes).map(sceneId => ({
      scene_id: sceneId,
      script_count: scriptCache.scenes[sceneId].length
    }));
    res.json({ code: 0, data: scenes });
  } catch (error) {
    res.status(500).json({ code: -1, message: '获取场景列表失败', error: error.message });
  }
});

router.get('/scene/:sceneId', async (req, res) => {
  try {
    const { sceneId } = req.params;
    loadScripts();
    const scripts = scriptCache.scenes[sceneId] || [];
    res.json({ code: 0, data: scripts });
  } catch (error) {
    res.status(500).json({ code: -1, message: '获取场景话术失败', error: error.message });
  }
});

router.get('/emotions', async (req, res) => {
  try {
    loadScripts();
    const emotions = Object.keys(scriptCache.emotions).map(emotionId => ({
      emotion_id: emotionId,
      script_count: scriptCache.emotions[emotionId].length
    }));
    res.json({ code: 0, data: emotions });
  } catch (error) {
    res.status(500).json({ code: -1, message: '获取情绪列表失败', error: error.message });
  }
});

router.get('/coach-styles', async (req, res) => {
  try {
    loadScripts();
    const styles = Object.keys(scriptCache.coachStyles).map(coachId => ({
      coach_id: coachId,
      script_count: scriptCache.coachStyles[coachId].length
    }));
    res.json({ code: 0, data: styles });
  } catch (error) {
    res.status(500).json({ code: -1, message: '获取教练风格列表失败', error: error.message });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { script_id, rating, user_id } = req.body;

    if (!script_id || !rating) {
      return res.status(400).json({ code: -1, message: 'script_id和rating不能为空' });
    }

    loadScripts();
    const script = scriptCache.allScripts.find(s => s.id === script_id);

    if (script) {
      script.usage_count += 1;
      script.rating = ((script.rating * (script.usage_count - 1)) + rating) / script.usage_count;

      const jsonPath = path.join(KNOWLEDGE_BASE_PATH, script.source, `${script.source_id}.json`);
      if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const targetScript = data.scripts.find(s => s.id === script_id);
        if (targetScript) {
          targetScript.usage_count = script.usage_count;
          targetScript.rating = script.rating;
          fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
        }
      }

      res.json({ code: 0, message: '反馈提交成功', data: { script_id, rating } });
    } else {
      res.status(404).json({ code: -1, message: '话术不存在' });
    }
  } catch (error) {
    res.status(500).json({ code: -1, message: '反馈提交失败', error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ code: -1, message: 'keyword不能为空' });
    }

    loadScripts();
    const lowerKeyword = keyword.toLowerCase();
    
    const results = scriptCache.allScripts.filter(script => {
      const textMatch = script.text.toLowerCase().includes(lowerKeyword);
      const tagMatch = script.tags.some(tag => tag.toLowerCase().includes(lowerKeyword));
      const purposeMatch = script.purpose.toLowerCase().includes(lowerKeyword);
      return textMatch || tagMatch || purposeMatch;
    });

    res.json({ code: 0, data: results });
  } catch (error) {
    res.status(500).json({ code: -1, message: '搜索失败', error: error.message });
  }
});

router.post('/warmup', async (req, res) => {
  try {
    loadScripts();
    res.json({ 
      code: 0, 
      message: '话术库预热完成',
      data: {
        total_scripts: scriptCache.allScripts.length,
        scenes_count: Object.keys(scriptCache.scenes).length,
        emotions_count: Object.keys(scriptCache.emotions).length,
        coach_styles_count: Object.keys(scriptCache.coachStyles).length
      }
    });
  } catch (error) {
    res.status(500).json({ code: -1, message: '预热失败', error: error.message });
  }
});

module.exports = router;