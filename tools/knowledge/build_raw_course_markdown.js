const fs=require('fs'),path=require('path');
const root='G:\\BaiduNetdiskDownload\\高情商话术';
const source=path.join(root,'高情商话术','580好好接话电子版','好好接话txt版.txt');
const out=path.join('knowledge_base','markdown','原始课程','好好接话');
const rawOriginal=fs.readFileSync(source,'utf8').replace(/^\uFEFF/,'');
const raw=rawOriginal.replace(/\r/g,'');
const lines=raw.split('\n');
const chapterRe=/^第([一二三四五六七八九十百]+)章/;
const lessonRe=/^\s*\d+[．\.、]\s*(.+)$/;
const summaryRe=/^五分钟速记本章重点/;
const tocTitles=[]; const tocSeen=new Set();
for(const line of lines.slice(0,320)){
  const m=line.match(chapterRe);
  if(m && !/\d+[．\.、]/.test(line) && !tocSeen.has(m[1])){tocTitles.push(line.trim()); tocSeen.add(m[1]);}
}
const bodyStart=lines.findIndex((line,i)=>i>250 && /^第一章/.test(line));
if(bodyStart<0) throw new Error('未找到正文起点');
const bodyEndRaw=lines.findIndex((line,i)=>i>bodyStart && /^第一章.*\d+[．\.、]/.test(line));
const bodyEnd=bodyEndRaw<0?lines.length:bodyEndRaw;
const frontMatter=lines.slice(0,bodyStart);
const bodyLines=lines.slice(bodyStart,bodyEnd);
const chapters=[]; let chapter=null; let lesson=null; let chapterNo=0;
function cleanTitle(value){return String(value).replace(/^\s*\d+[．\.、]\s*/,'').trim();}
function cleanChapterTitle(value){return String(value).replace(/^第.+章[　\s]*/,'').trim();}
function finishLesson(){if(!lesson)return; lesson.content=lesson.content.join('\n').replace(/^\n+|\n+$/g,''); chapter.lessons.push(lesson); lesson=null;}
function finishChapter(){finishLesson(); if(chapter){chapter.intro=chapter.intro.join('\n').replace(/^\n+|\n+$/g,''); chapter.summary=chapter.summary.join('\n').replace(/^\n+|\n+$/g,''); chapters.push(chapter);} chapter=null;}
for(let lineIndex=0; lineIndex<bodyLines.length; lineIndex++){
  const line=bodyLines[lineIndex];
  const cm=line.match(chapterRe);
  if(cm){
    finishChapter(); chapterNo++;
    const canonical=tocTitles[chapterNo-1] || line.trim();
    // OCR often wraps a chapter heading over two physical lines. Rejoin only when the
    // concatenated lines exactly match the canonical TOC title, preserving the raw marker.
    let rawMarker=line.trim();
    let nextIndex=lineIndex+1;
    while(nextIndex<bodyLines.length && bodyLines[nextIndex].trim()==='') nextIndex++;
    if(nextIndex<bodyLines.length){
      const joined=(rawMarker+bodyLines[nextIndex].trim()).replace(/\s/g,'');
      const canonicalCompact=canonical.replace(/\s/g,'');
      if(joined===canonicalCompact){ rawMarker=rawMarker+'\n'+bodyLines[nextIndex].trim(); lineIndex=nextIndex; }
    }
    chapter={title:canonical,rawMarker,lessons:[],intro:[],summary:[],summaryMode:false}; continue;
  }
  if(!chapter) continue;
  if(summaryRe.test(line)){finishLesson(); chapter.summaryMode=true; continue;}
  const lm=line.match(lessonRe);
  if(lm && !chapter.summaryMode){finishLesson(); lesson={title:cleanTitle(lm[1]),content:[]}; continue;}
  if(chapter.summaryMode) chapter.summary.push(line); else if(lesson) lesson.content.push(line); else chapter.intro.push(line);
}
finishChapter();
if(chapters.length!==tocTitles.length) throw new Error('章节数量异常: '+chapters.length+' vs '+tocTitles.length);
function safe(value){return String(value).replace(/[\\/:*?"<>|]/g,'／').trim() || '未命名';}
function uniqueName(base,used){const n=(used.get(base)||0)+1; used.set(base,n); return (n===1?base:base+'（'+n+'）');}
function lessonMd(ch,l){return ['# '+l.title,'','> 来源：G:\\BaiduNetdiskDownload\\高情商话术\\高情商话术\\580好好接话电子版\\好好接话txt版.txt','> 原始章节：'+ch.title,'> 正文章节原始标记：'+ch.rawMarker,'> 本课标题去除了原始序号；正文逐字保留。','','## 课程内容','',l.content || '','', '## 检索标注','', '- 内容类型：社交沟通与接话','- 课程章节：'+ch.title,''].join('\n');}
const baseOut=path.dirname(out); fs.mkdirSync(baseOut,{recursive:true});
if(fs.existsSync(out)) fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
const fence=String.fromCharCode(96).repeat(3);
fs.writeFileSync(path.join(out,'前言与目录.md'),['# 前言与目录','','> 来源：G:\\BaiduNetdiskDownload\\高情商话术\\高情商话术\\580好好接话电子版\\好好接话txt版.txt','> 以下代码块保留正文开始前的原始目录与前言，不做删减或改写。','',fence+'text',frontMatter.join('\n'),fence,''].join('\n'),'utf8');
const toc=[]; let totalLessons=0;
for(const ch of chapters){
  const cleanChapter=cleanChapterTitle(ch.title); const dir=path.join(out,safe(cleanChapter)); fs.mkdirSync(dir,{recursive:true}); const items=[]; const used=new Map();
  fs.writeFileSync(path.join(dir,'章节导语.md'),['# '+cleanChapter+' · 章节导语','','> 原始章节标记：'+ch.rawMarker,'> 目录章节标题：'+ch.title,'','## 原文','',ch.intro || '',''].join('\n'),'utf8'); items.push('- [章节导语]('+encodeURI('原始课程/好好接话/'+safe(cleanChapter)+'/章节导语.md')+')');
  for(const l of ch.lessons){const base=safe(l.title); const name=uniqueName(base,used)+'.md'; fs.writeFileSync(path.join(dir,name),lessonMd(ch,l),'utf8'); items.push('- ['+l.title+']('+encodeURI('原始课程/好好接话/'+safe(cleanChapter)+'/'+name)+')'); totalLessons++;}
  if(ch.summary){fs.writeFileSync(path.join(dir,'本章速记.md'),['# '+cleanChapter+' · 本章速记','','> 原始小结标题：五分钟速记本章重点','',ch.summary,''].join('\n'),'utf8'); items.push('- [本章速记]('+encodeURI('原始课程/好好接话/'+safe(cleanChapter)+'/本章速记.md')+')');}
  toc.push('## '+cleanChapter+'\n\n'+items.join('\n'));
}
const overview=['# 好好接话课程总览','','> 来源：G:\\BaiduNetdiskDownload\\高情商话术\\高情商话术\\580好好接话电子版\\好好接话txt版.txt','> 课程拆分规则：以正文中的 9 个章节为目录；每个正文小技能标题对应一课。显示标题去除原始数字序号，正文内容保持原文。','','## 原始目录（保留）','',fence+'text',frontMatter.join('\n'),fence,'','## 章节索引','',...chapters.map(ch=>'- ['+cleanChapterTitle(ch.title)+'](#'+cleanChapterTitle(ch.title)+')'),'','## 课程列表','',toc.join('\n\n'),''].join('\n');
fs.writeFileSync(path.join('knowledge_base','markdown','好好接话课程总览.md'),overview,'utf8');
fs.writeFileSync(path.join('knowledge_base','markdown','原始课程','好好接话-原文转写.md'),['# 好好接话 · 原文转写','','> 以下代码块保留原始文本，不做删减或改写。','',fence+'text',rawOriginal,fence,''].join('\n'),'utf8');
const txtFiles=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.toLowerCase().endsWith('.txt'))txtFiles.push(p);}}walk(root);const rawOut=path.join('knowledge_base','markdown','原始文本');if(fs.existsSync(rawOut))fs.rmSync(rawOut,{recursive:true,force:true});fs.mkdirSync(rawOut,{recursive:true});const rawSeen=new Map();for(const file of txtFiles){const content=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');const base=safe(path.basename(file,'.txt'));const name=uniqueName(base,rawSeen)+'.md';fs.writeFileSync(path.join(rawOut,name),['# '+path.basename(file,'.txt'),'','> 原始路径：'+file,'> 本文件为无损文本归档，未进行删减、改写或纠错。','',fence+'text',content,fence,''].join('\n'),'utf8');}
fs.writeFileSync(path.join(rawOut,'README.md'),['# 原始文本归档','','这里保存从 G 盘社交话术资料目录扫描到的 14 个 TXT 文本文件。每个文件以 Markdown 代码块归档，保留原始文本，不删减、不改写、不纠错。','','## 归档范围','','- 14 个 TXT 文件均已归档为同名 Markdown 文件。','- 《好好接话》正文另行拆分到 `../原始课程/好好接话/`，每个正文小技能是一课，共 78 课；完整原文见 `../原始课程/好好接话-原文转写.md`。','- 目录、前言、OCR 断行和重复页眉仍可在完整原文归档中逐字追溯。','','## 尚未转写的资料','','G 盘中的 PDF、DOC/DOCX、PPT/PPTX、WPS、XLS、MP3、MP4、AVI 等二进制资料已盘点，但本轮未批量 OCR、转写或进入学习卡片。纳入前必须保留来源、页码/时间定位，并完成版权、敏感内容和质量审核。',''].join('\n'),'utf8');
console.log(JSON.stringify({chapters:chapters.length,lessons:totalLessons,summaries:chapters.filter(c=>!!c.summary).length,textSources:txtFiles.length,bodyStart:bodyStart+1,bodyEnd:bodyEnd},null,2));