(function(){
 function enhance(){var root=document.getElementById('v5-classroom');if(!root)return;var map=root.querySelector('.v5-node-map');if(!map||map.dataset.nav)return;map.dataset.nav='1';map.querySelectorAll('span').forEach(function(node,i){node.setAttribute('role','button');node.tabIndex=0;node.onclick=function(){var target=root.querySelector('[data-i="'+Math.min(i,5)+'"]');if(target)target.click()};node.onkeydown=function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();node.click()}}})}
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
