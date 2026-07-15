/**
 * 违禁词过滤服务
 * 对用户输入和LLM输出进行内容安全过滤
 */

// 违禁词列表（按类别分组）
const BANNED_WORDS = {
  violence: ['暴力', '杀人', '自杀', '自残'],
  sexual: ['色情', '裸体'],
  politics: [],
  abuse: ['傻逼', '操你', '滚蛋'],
};

// 所有违禁词合集
const ALL_BANNED = Object.values(BANNED_WORDS).flat();

/**
 * 检查文本是否包含违禁词
 * @returns {{ safe: boolean, matched: string[] }}
 */
function check(text) {
  const matched = ALL_BANNED.filter((word) => text.includes(word));
  return { safe: matched.length === 0, matched };
}

/**
 * 过滤文本中的违禁词（替换为***）
 */
function filter(text) {
  let result = text;
  for (const word of ALL_BANNED) {
    result = result.replaceAll(word, '*'.repeat(word.length));
  }
  return result;
}

module.exports = { check, filter, BANNED_WORDS };
