(function(){
  var stateKey='duilian_etiquette_training_state';
  function read(){try{return JSON.parse(localStorage.getItem(stateKey)||'{}')}catch(e){return {}}}
  function write(v){try{localStorage.setItem(stateKey,JSON.stringify(v))}catch(e){}}
  function enhance(){var root=document.getElementById('v5-classroom');if(!root)return;var nav=root.querySelector('nav .on');if(!nav)return;var text=nav.textContent,store=read();
    if(text.indexOf('04')>=0){root.querySelectorAll('.check input').forEach(function(input,i){input.checked=!!(store.checks&&store.checks[i]);if(!input.dataset.persist){input.dataset.persist='1';input.addEventListener('change',function(){var s=read();s.checks=s.checks||{};s.checks[i]=input.checked;s.updatedAt=Date.now();write(s)})}})}
    if(text.indexOf('05')>=0){var panel=root.querySelector('.v5-panel');if(panel&&!panel.querySelector('.v5-rubric')){var rubric=document.createElement('div');rubric.className='v5-rubric';rubric.innerHTML='<b>本轮评价看什么</b><span>✓ 是否回应了对方的问候</span><span>✓ 是否符合当前场景</span><span>✓ 是否自然、简洁、有礼貌</span>';panel.insertBefore(rubric,panel.querySelector('textarea'))}var sub=root.querySelector('[data-submit]');if(sub&&!sub.dataset.scored){sub.dataset.scored='1';sub.addEventListener('click',function(){var answer=(root.querySelector('textarea')||{}).value||'';var tier=answer.length>=16?'符合场景':answer.length>=8?'基本合适':answer.length?'可以更自然':'需要再尝试';var s=read();s.lastEvaluation={tier:tier,answer:answer,createdAt:Date.now()};write(s);try{var logs=JSON.parse(localStorage.getItem('duilian_training_log')||'[]');logs.unshift({type:'language_evaluation',scene:'第一次拜访客户',tier:tier,answer:answer,createdAt:Date.now()});localStorage.setItem('duilian_training_log',JSON.stringify(logs))}catch(e){}})}}
  }
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();



