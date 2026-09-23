(function(){
 function getTemplate(){var title=(window.currentEtiquetteLevel||{}).title||'';var all=window.EtiquetteClassroomTemplates||{};var keys=Object.keys(all);for(var i=0;i<keys.length;i++){if(title.indexOf(all[keys[i]].title)>=0)return all[keys[i]]}return all.S001}
 function enhance(){var root=document.getElementById('v5-classroom');if(!root)return;var nav=root.querySelector('nav .on');if(!nav||nav.textContent.indexOf('01')<0)return;var panel=root.querySelector('.v5-panel');if(!panel||panel.querySelector('.v5-template-goals'))return;var t=getTemplate();var box=document.createElement('div');box.className='v5-template-goals';box.innerHTML='<div><b>'+t.category+'</b><span>'+t.nodes.length+' 个训练节点</span></div><strong>本课学习目标</strong>'+t.goals.map(function(g){return '<p>✓ '+g+'</p>'}).join('');panel.innerHTML=box.outerHTML+panel.innerHTML}
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
