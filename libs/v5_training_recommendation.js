(function(){
 function readRecommendation(){
  var rec={};
  try{rec=JSON.parse(localStorage.getItem('duilian_next_training')||'{}')}catch(e){}
  if(rec.recommendation)return {title:rec.recommendation,reason:'来自上一节课的现实记录，继续练习最薄弱的行为环节。',source:rec.scene||'礼仪训练',levelId:rec.levelId||9001};
  try{rec=JSON.parse(localStorage.getItem('duilian_etiquette_next_recommendation')||'{}')}catch(e){}
  return {title:rec.title||'低压力问候练习',reason:rec.reason||'先在熟悉的人身上完成一次自然问候，再逐步增加场景复杂度。',source:rec.scene||'礼仪训练',levelId:rec.levelId||9001};
 }
 window.showEtiquetteReviewHistory=function(){
  var logs=[];try{logs=JSON.parse(localStorage.getItem('duilian_challenge_log')||'[]')}catch(e){}
  var old=document.getElementById('v5-review-history');if(old)old.remove();
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c;});};
  var renderDialogue=function(dialogue){
   if(!dialogue||typeof dialogue!=='object')return '';
   var keys=Object.keys(dialogue).sort(function(a,b){return Number(a)-Number(b);});
   if(!keys.length)return '';
   return '<details style="margin-top:9px;border-top:1px solid #eef2f7;padding-top:8px;"><summary style="cursor:pointer;color:#4f46e5;font-size:12px;font-weight:600;">查看逐轮对话</summary><div style="margin-top:8px;">'+keys.map(function(k,i){return '<div style="margin:7px 0;padding:8px 10px;border-radius:9px;background:#f8fafc;"><small style="color:#94a3b8;">第'+(i+1)+'轮</small><div style="color:#334155;font-size:12px;line-height:1.55;margin-top:3px;">'+esc(dialogue[k])+'</div></div>';}).join('')+'</div></details>';
  };
  var rows=logs.slice(0,8).map(function(x){
   var behavior=Number(x.behaviorPercent||0);var turns=Number(x.dialogueTurns||0);
   var tip=behavior<100?'下次先把行为清单全部完成，再进入对话。':(turns<2?'下次尝试把回应扩展成完整句，并推动对方继续交流。':'保持这个节奏，再挑战一个临时变化。');
   return '<article style="padding:12px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:8px;background:#fff;"><b style="color:#4338ca;">'+esc(x.scene||'礼仪训练')+'</b><span style="display:block;font-size:11px;color:#64748b;margin-top:4px;">'+esc(x.feeling||'未填写感受')+' · '+(x.createdAt?new Date(x.createdAt).toLocaleDateString():'')+'</span><p style="font-size:12px;color:#374151;line-height:1.6;margin:6px 0;">'+esc(x.note||'暂无文字记录')+'</p><div style="margin:7px 0;padding:8px 10px;border-radius:9px;background:#ecfdf5;color:#065f46;font-size:11px;line-height:1.55;"><b>现实挑战：</b>'+esc(x.challenge||'把本课动作带到现实场景')+(x.branch?'<br><b>本次分支：</b>'+esc(x.branch):'')+'</div><small style="color:#64748b;">AI 对话：'+turns+' 轮 · 行为完成：'+behavior+'%</small>'+renderDialogue(x.dialogue)+'<small style="display:block;color:#b45309;margin-top:6px;">复盘提示：'+esc(tip)+'</small><small style="display:block;color:#047857;margin-top:4px;">下一步：'+esc(x.recommendation||'继续保持练习')+'</small></article>';
  }).join('');
  var modal=document.createElement('div');modal.id='v5-review-history';modal.className='modal-overlay';modal.style.zIndex='10000';
  modal.innerHTML='<div class="modal-content" style="max-width:440px;max-height:82vh;overflow:auto;padding:20px;"><div style="display:flex;justify-content:space-between;align-items:center;"><h3 style="font-size:18px;font-weight:700;color:#1f2937;">最近复盘</h3><button aria-label="关闭复盘" onclick="document.getElementById(\'v5-review-history\').remove()" style="border:0;background:none;font-size:22px;color:#94a3b8;cursor:pointer;">×</button></div><p style="font-size:12px;color:#64748b;margin:6px 0 14px;">回看你当时的行为、表达和感受，下一次训练会更贴近你的真实困难。</p>'+(rows||'<div style="padding:20px;text-align:center;color:#94a3b8;">完成一次现实挑战后，这里会出现复盘记录。</div>')+'</div>';
  document.body.appendChild(modal);
 }; function enhance(){
  var list=document.getElementById('etiquette-level-list');
  if(!list||!list.parentNode)return;
  var old=list.parentNode.querySelector('.v5-recommendation'); if(old)return;
  var rec=readRecommendation();
  var box=document.createElement('section');box.className='v5-recommendation';box.setAttribute('role','status');
  box.innerHTML='<div><small>基于你的最近练习 · '+rec.source+'</small><b>下一步建议</b><p>'+rec.title+'</p><span>'+rec.reason+'</span><button type="button" onclick="startEtiquetteLevel('+rec.levelId+')" style="display:block;margin-top:10px;border:0;border-radius:9px;padding:8px 12px;background:#7c3aed;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">进入下一练 →</button><button type="button" onclick="showEtiquetteReviewHistory()" style="display:block;margin-top:6px;border:0;background:none;color:#6d28d9;font-size:11px;cursor:pointer;">查看最近复盘</button></div><i aria-hidden="true">↗</i>';
  list.parentNode.insertBefore(box,list);
 }
 window.addEventListener('v5-recommendation-refresh',function(){document.querySelectorAll('.v5-recommendation').forEach(function(node){node.remove();});setTimeout(enhance,0);});
 enhance();
 setInterval(enhance,800);
})();