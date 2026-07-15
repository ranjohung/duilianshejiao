/**
 * 违禁词过滤服务
 * 对用户输入和LLM输出进行内容安全过滤
 * 支持三级过滤：safe / sensitive / banned
 */

// 违禁词库（一级：阻断）
const BANNED_WORDS = [
  '自杀', '自残', '杀', '死', '暴力', '色情', '赌博', '毒品',
  '政治敏感', '法轮', '传销', '诈骗', '恐吓', '威胁',
  '杀人', '裸体', '傻逼', '操你', '滚蛋',
];

// 二级敏感词（需标记但不阻断）
const SENSITIVE_WORDS = [
  '抑郁', '焦虑', '崩溃', '绝望', '无助',
];

/**
 * 内容过滤
 * @param {string} text - 待过滤文本
 * @returns {{ passed: boolean, level: 'safe'|'sensitive'|'banned', matchedWords: string[] }}
 */
function filterContent(text) {
  if (!text || typeof text !== 'string') return { passed: true, level: 'safe', matchedWords: [] };

  const matchedBanned = BANNED_WORDS.filter(w => text.includes(w));
  if (matchedBanned.length > 0) {
    return { passed: false, level: 'banned', matchedWords: matchedBanned };
  }

  const matchedSensitive = SENSITIVE_WORDS.filter(w => text.includes(w));
  if (matchedSensitive.length > 0) {
    return { passed: true, level: 'sensitive', matchedWords: matchedSensitive };
  }

  return { passed: true, level: 'safe', matchedWords: [] };
}

/**
 * 替换违禁词为*
 * @param {string} text - 待替换文本
 * @returns {string} 替换后的文本
 */
function maskContent(text) {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const word of BANNED_WORDS) {
    result = result.replaceAll(word, '*'.repeat(word.length));
  }
  for (const word of SENSITIVE_WORDS) {
    result = result.replaceAll(word, '*'.repeat(word.length));
  }
  return result;
}

/**
 * 兼容旧接口：检查文本是否包含违禁词
 * @param {string} text
 * @returns {{ safe: boolean, matched: string[] }}
 */
function check(text) {
  const result = filterContent(text);
  return { safe: result.passed, matched: result.matchedWords };
}

/**
 * 兼容旧接口：过滤文本中的违禁词（替换为***）
 * @param {string} text
 * @returns {string}
 */
function filter(text) {
  return maskContent(text);
}

module.exports = { filterContent, maskContent, check, filter, BANNED_WORDS, SENSITIVE_WORDS };
