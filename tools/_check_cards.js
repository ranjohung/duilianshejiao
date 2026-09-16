const fs=require('fs'),vm=require('vm');
const ctx={window:{}}; vm.createContext(ctx);
const errs=[];
['knowledge_base/learning_cards.js','knowledge_base/raw_course_cards.js','knowledge_base/extra_course_cards.js'].forEach(p=>{
  try { vm.runInContext(fs.readFileSync(p,'utf8'), ctx); }
  catch(e){ errs.push(p+': '+e.message); }
});
const c=[...(ctx.window.knowledgeLearningCards||[]),...(ctx.window.rawCourseLearningCards||[]),...(ctx.window.extraCourseCards||[])];
console.log('总卡片数:', c.length);
console.log('加载错误:', errs.length);
const bySt={};c.forEach(x=>bySt[x.status]=(bySt[x.status]||0)+1);
console.log('status 分布:', JSON.stringify(bySt));
const byCat={};c.forEach(x=>{const k=x.category||'(空)';byCat[k]=(byCat[k]||0)+1;});
console.log('章节卡片数 Top10:');
Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v])=>console.log(' ', v, '|', k));
const ok=c.filter(x=>x.status==='ok');
console.log('\n首条OK卡片详情:');
console.log('  id:', ok[0]?.id, '| title:', ok[0]?.title.slice(0,40));
console.log('  chars:', ok[0]?.chars, '| bundle:', ok[0]?.bundle);
console.log('  sourceKind:', ok[0]?.sourceKind, '| medium:', ok[0]?.medium);
console.log('  tips:', JSON.stringify(ok[0]?.tips));
console.log('  principle:', ok[0]?.principle);
console.log('  有 rawText (摘要300字):');
if (ok[0]?.rawText) console.log('   ...', ok[0].rawText.slice(0,300));

console.log('\n=== 检查 content bundle 是否真实存在 ===');
const cnt=c.filter(x=>x.bundle).length;
console.log('带 bundle 的卡片:', cnt);
const bundles=[...new Set(c.filter(x=>x.bundle).map(x=>x.bundle))];
console.log('不同 bundle 文件数:', bundles.length);
const missing=bundles.filter(b=>!fs.existsSync('knowledge_base/course_content/'+b));
console.log('缺失 bundle:', missing.length, missing.slice(0,3));
