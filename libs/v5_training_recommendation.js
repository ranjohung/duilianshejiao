(function(){
 function readRecommendation(){
  var rec={};
  try{rec=JSON.parse(localStorage.getItem('duilian_next_training')||'{}')}catch(e){}
  if(rec.recommendation)return {title:rec.recommendation,reason:'来自上一节课的现实记录，继续练习最薄弱的行为环节。',source:rec.scene||'礼仪训练',levelId:rec.levelId||9001};
  try{rec=JSON.parse(localStorage.getItem('duilian_etiquette_next_recommendation')||'{}')}catch(e){}
  return {title:rec.title||'低压力问候练习',reason:rec.reason||'先在熟悉的人身上完成一次自然问候，再逐步增加场景复杂度。',source:rec.scene||'礼仪训练',levelId:rec.levelId||9001};
 }
 function enhance(){
  var list=document.getElementById('etiquette-level-list');
  if(!list||!list.parentNode)return;
  var old=list.parentNode.querySelector('.v5-recommendation'); if(old)return;
  var rec=readRecommendation();
  var box=document.createElement('section');box.className='v5-recommendation';box.setAttribute('role','status');
  box.innerHTML='<div><small>基于你的最近练习 · '+rec.source+'</small><b>下一步建议</b><p>'+rec.title+'</p><span>'+rec.reason+'</span><button type="button" onclick="startEtiquetteLevel('+rec.levelId+')" style="display:block;margin-top:10px;border:0;border-radius:9px;padding:8px 12px;background:#7c3aed;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">进入下一练 →</button></div><i aria-hidden="true">↗</i>';
  list.parentNode.insertBefore(box,list);
 }
 window.addEventListener('v5-recommendation-refresh',function(){document.querySelectorAll('.v5-recommendation').forEach(function(node){node.remove();});setTimeout(enhance,0);});
 enhance();
 setInterval(enhance,800);
})();