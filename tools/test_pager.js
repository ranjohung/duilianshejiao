const fs=require('fs'), vm=require('vm');
const ctx={ window:{}, document:{getElementById:()=>null}, console:console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('knowledge_base/learning_cards.js','utf8'), ctx);
vm.runInContext(fs.readFileSync('knowledge_base/raw_course_cards.js','utf8'), ctx);
vm.runInContext(fs.readFileSync('knowledge_base/extra_course_cards.js','utf8'), ctx);

const learningCards = [].concat(ctx.window.knowledgeLearningCards||[], ctx.window.rawCourseLearningCards||[], ctx.window.extraCourseCards||[]);
const targetScene = '好好接话 · 懂得倾听，做对表情回应，别当\u201c谈话终结者\u201d';
const sameScene = learningCards.filter(function(c){ return c && c.scene === targetScene; });
console.log('scene cards:', sameScene.length);

const KIND_ORDER = { intro: 0, lesson: 1, summary: 2 };
const indexMap = {};
learningCards.forEach(function(c,i){ if(c && c.id) indexMap[c.id]=i; });
sameScene.sort(function(a,b){
  var ka = KIND_ORDER[a.kind]==null?1:KIND_ORDER[a.kind];
  var kb = KIND_ORDER[b.kind]==null?1:KIND_ORDER[b.kind];
  if (ka!==kb) return ka-kb;
  var ra=a.round||0, rb=b.round||0;
  if (ra!==rb) return ra-rb;
  return (indexMap[a.id]||0) - (indexMap[b.id]||0);
});

console.log('\nOrdered outline (after sort):');
sameScene.forEach(function(c,i){
  console.log('  '+(i+1)+'. ['+(c.kind||'?')+'] '+c.title.slice(0,40)+' | round='+(c.round||0));
});

var curIdx = sameScene.findIndex(function(c){ return c.id==='hhjh_intro_001'; });
console.log('\nintro is at idx:', curIdx, '(0-based)');
console.log('Prev:', curIdx>0 ? sameScene[curIdx-1].title.slice(0,30) : 'N/A');
console.log('Next:', curIdx<sameScene.length-1 ? sameScene[curIdx+1].title.slice(0,30) : 'N/A');

// 测试 kb_* 类卡片（短表达型）的同 title 分组是否还能用
console.log('\n\n=== 短表达型场景测试：4S店砍价 / 了解底价 ===');
var ksScene = '4S店砍价';
var ksCards = learningCards.filter(function(c){ return c && c.scene === ksScene; });
console.log('kb_ks cards in 4S店砍价:', ksCards.length);
const KIND_ORDER_KB = { intro: 0, lesson: 1, summary: 2 };
const indexMapKB = {};
learningCards.forEach(function(c,i){ if(c && c.id) indexMapKB[c.id]=i; });
ksCards.sort(function(a,b){
  var ka = KIND_ORDER_KB[a.kind]==null?1:KIND_ORDER_KB[a.kind];
  var kb = KIND_ORDER_KB[b.kind]==null?1:KIND_ORDER_KB[b.kind];
  if (ka!==kb) return ka-kb;
  var ra=a.round||0, rb=b.round||0;
  if (ra!==rb) return ra-rb;
  return (indexMapKB[a.id]||0) - (indexMapKB[b.id]||0);
});
ksCards.forEach(function(c,i){
  console.log('  '+(i+1)+'. ['+(c.kind||'?')+'] '+c.title+' | round='+(c.round||0));
});