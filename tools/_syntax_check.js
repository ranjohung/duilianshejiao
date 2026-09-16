const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8');
const re=/<script[^>]*>([\s\S]*?)<\/script>/g;
let m,i=0;
while((m=re.exec(html))!==null){
  i++;
  try { new vm.Script(m[1], {filename:'s'+i+'.js'}); }
  catch(e){ console.log('SYNTAX ERROR #'+i+':', e.message); process.exit(1); }
}
console.log('脚本语法检查通过：', i, '块');
