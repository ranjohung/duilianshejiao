(function(){
 var key='duilian_etiquette_progress';
 function load(){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(e){return {}}}
 function save(v){try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}}
 function sceneKey(){return (window.currentEtiquetteLevel||{}).id||'S001'}
 function enhance(){var root=document.getElementById('v5-classroom');if(!root)return;var id=sceneKey(),data=load();if(!root.dataset.progressBound){root.dataset.progressBound='1';root.querySelectorAll('[data-i]').forEach(function(b){b.addEventListener('click',function(){var x=load();x[id]=Number(b.dataset.i);x.updatedAt=Date.now();save(x)})})}if(!root.dataset.progressRestored&&data[id]>0){root.dataset.progressRestored='1';var target=root.querySelector('[data-i="'+data[id]+'"]');if(target)setTimeout(function(){target.click()},0)}}
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
