(function(){
 var old=window.checkInitialSceneSelection;
 window.checkInitialSceneSelection=function(){try{var p=JSON.parse(localStorage.getItem('duilian_profile')||'{}');if(p.onboarding_completed&&p.user_persona)return;}catch(e){}if(typeof old==='function')return old.apply(this,arguments)};
})();
