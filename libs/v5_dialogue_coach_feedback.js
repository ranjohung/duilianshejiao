(function(){
'use strict';
function feedback(text){
  text=(text||'').trim();
  if(!text)return '先写下你的第一反应，再继续这一轮。';
  var hasReply=/你好|您好|谢谢|感谢|好的|是的|对/.test(text);
  var hasInfo=text.length>=12;
  var hasQuestion=/[？?]|吗|你呢|您呢|是否/.test(text);
  var tips=[];
  if(hasReply)tips.push('有回应对方');
  else tips.push('可以先回应对方刚说的内容');
  if(hasInfo)tips.push('信息比较完整');
  else tips.push('再补充一个具体信息');
  if(hasQuestion)tips.push('给了对方继续接话的入口');
  else tips.push('可以加一个开放式问题推进话题');
  return '本地教练提示：'+tips.join('；')+'。';
}
function mount(){
  var host=document.getElementById('scene-training-container');
  if(!host||host.dataset.dialogueCoachBound)return;
  host.dataset.dialogueCoachBound='1';
  host.addEventListener('click',function(e){
    var btn=e.target.closest('.st-ai-send');if(!btn)return;
    setTimeout(function(){
      var input=host.querySelector('#st-ai-input'),out=host.querySelector('#st-ai-feedback');
      if(!input||!out||!input.value.trim())return;
      var note=document.createElement('div');
      note.style='margin-top:8px;padding:9px 10px;border-radius:9px;background:#f0fdf4;color:#166534;font-size:12px;line-height:1.6;';
      note.textContent=feedback(input.value);
      try{var raw=input.value.trim(),ctx=window.currentLessonPractice||{},reason=/[？?]|吗|你呢|您呢|是否/.test(raw)?'可以继续增加具体信息，让表达更有内容':'下一次重点加入一个开放式问题，给对方继续接话的入口';var history=[];try{history=JSON.parse(localStorage.getItem('duilian_dialogue_history')||'[]')}catch(e){}history.push({courseId:ctx.courseId||'',courseTitle:ctx.courseTitle||'',knowledgePoint:ctx.knowledgePoint||'',answer:raw,turn:history.length+1,createdAt:Date.now()});localStorage.setItem('duilian_dialogue_history',JSON.stringify(history.slice(-100)));localStorage.setItem('duilian_dialogue_weakpoint',JSON.stringify({text:reason,answer:raw,updatedAt:Date.now()}));localStorage.setItem('duilian_etiquette_next_recommendation',JSON.stringify({title:'针对本轮薄弱点再练',reason:reason,updatedAt:Date.now()}));}catch(e){}
      out.appendChild(note);
    },700);
  });
}
new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});
setTimeout(mount,0);
})();