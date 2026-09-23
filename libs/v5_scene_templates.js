(function(){
  window.EtiquetteClassroomTemplates=window.EtiquetteClassroomTemplates||{
    S001:{id:'S001',title:'第一次拜访客户',category:'商务社交',goals:['正确进入正式社交场合','掌握初次见面的礼仪','自然完成问候与回应'],nodes:[['进入办公室','认识场景'],['第一次见面','动作示范'],['问候与自我介绍','话术示范'],['等待邀请入座','行为检查'],['开始交流','AI 对话'],['告别离开','现实挑战']]},
    S002:{id:'S002',title:'第一次参加团队会议',category:'职场社交',goals:['准时进入会议','自然向同事问候','在发言前建立秩序'],nodes:[['进入会议室','认识场景'],['向同事问候','动作示范'],['找到座位','行为检查'],['等待发言','AI 对话'],['表达不同意见','现实挑战']]},
    S003:{id:'S003',title:'多人场景中的自然问候',category:'基础社交',goals:['判断是否适合问候','兼顾多人注意力','自然加入短对话'],nodes:[['发现熟人','认识场景'],['确认对方空闲','动作示范'],['主动问候','话术示范'],['处理旁边有人','AI 对话'],['现实迁移','现实挑战']]}
  };
  function current(){var title=(window.currentEtiquetteLevel||{}).title||'第一次拜访客户';var all=window.EtiquetteClassroomTemplates;return Object.keys(all).map(function(k){return all[k]}).find(function(x){return title.indexOf(x.title)>=0})||all.S001}
  function enhance(){var root=document.getElementById('v5-classroom');if(!root)return;var nav=root.querySelector('nav .on');if(!nav||nav.textContent.indexOf('01')<0)return;var panel=root.querySelector('.v5-panel');if(!panel||panel.querySelector('.v5-node-map'))return;var t=current(),box=document.createElement('div');box.className='v5-node-map';box.innerHTML='<b>'+t.category+' · 场景路径</b><div>'+t.nodes.map(function(n,i){return '<span><i>'+String(i+1).padStart(2,'0')+'</i>'+n[0]+'</span>'}).join('')+'</div>';panel.appendChild(box)}
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
