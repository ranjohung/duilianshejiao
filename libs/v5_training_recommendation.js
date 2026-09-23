(function(){
 function enhance(){var list=document.getElementById('etiquette-level-list');if(!list||!list.parentNode||list.parentNode.querySelector('.v5-recommendation'))return;var rec={};try{rec=JSON.parse(localStorage.getItem('duilian_etiquette_next_recommendation')||'{}')}catch(e){}var box=document.createElement('section');box.className='v5-recommendation';box.innerHTML='<div><small>基于你的最近练习</small><b>下一步建议</b><p>'+(rec.title||'低压力问候练习')+'</p><span>'+(rec.reason||'先在熟悉的人身上完成一次自然问候，再逐步增加场景复杂度。')+'</span></div><i>↗</i>';list.parentNode.insertBefore(box,list)}
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
