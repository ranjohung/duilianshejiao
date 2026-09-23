/* Source-backed reading and rehearsal, only inside the etiquette training area. */
(function () {
  'use strict';
  var active = null, step = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function courses() { return (window.textCourseCards || []).filter(function(c) { return c.category === '礼仪训练与规范'; }); }
  function panel() {
    var host = document.getElementById('etiquette-level-list');
    if (!host) return null;
    var p = document.getElementById('text-etiquette-courses');
    if (!p) { p = document.createElement('section'); p.id='text-etiquette-courses'; host.before(p); }
    return p;
  }
  window.renderTextEtiquetteCourses = function () {
    var p=panel(); if (!p) return;
    p.innerHTML='<h3 style="font-weight:700;margin:16px 0">礼仪文字课程与练习</h3><input id="etiquette-text-search" aria-label="查找礼仪课程" placeholder="搜索礼仪课程" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:12px"><div id="etiquette-text-list" style="max-height:360px;overflow:auto"></div><div id="etiquette-text-practice"></div>';
    function list() {
      var q=document.getElementById('etiquette-text-search').value.trim().toLowerCase();
      document.getElementById('etiquette-text-list').innerHTML=courses().filter(function(c){return (c.title+' '+c.scene).toLowerCase().includes(q);}).map(function(c){return '<article style="padding:12px;border-bottom:1px solid #eee"><strong>'+esc(c.title)+'</strong><p style="font-size:12px">'+esc(c.scene)+'</p><button data-course="'+esc(c.id)+'" style="padding:8px;color:#6d28d9">阅读并练习</button></article>';}).join('') || '<p>没有匹配的文字课程。</p>';
    }
    document.getElementById('etiquette-text-search').addEventListener('input',list);
    document.getElementById('etiquette-text-list').addEventListener('click',function(e){var b=e.target.closest('[data-course]');if(b)open(b.dataset.course);});
    list();
  };
  function open(id) {
    active=courses().find(function(c){return c.id===id;}); step=0;
    if (!active) return;
    if (typeof EM_cardLocked==='function' && EM_cardLocked(active)) { KL_openDetail(id); return; }
    if ((window.CourseContent||{})[id]) { render(); return; }
    var selected=active;
    document.getElementById('etiquette-text-practice').textContent='正在加载文字课程…';
    var script=document.createElement('script');script.src='knowledge_base/course_content/'+active.bundle;
    script.onload=function(){if(active===selected)render();script.remove();};
    script.onerror=function(){if(active===selected)document.getElementById('etiquette-text-practice').textContent='正文加载失败，请重新选择课程。';script.remove();};
    document.head.appendChild(script);
  }
  function render() {
    var data=(window.CourseContent||{})[active.id],p=document.getElementById('etiquette-text-practice');
    if(!data||!p)return;
    var sections=data.sections,s=sections[step];
    var key='etiquette-text:'+active.id+':'+step;
    var saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch(e){}
    p.innerHTML='<h4 style="font-weight:700;margin:16px 0">'+esc(active.title)+'</h4><label>章节目录 <select id="etiquette-text-section" style="max-width:100%">'+sections.map(function(x,i){return '<option value="'+i+'"'+(i===step?' selected':'')+'>'+esc(x.t)+'</option>';}).join('')+'</select></label><pre style="white-space:pre-wrap;font-family:inherit;line-height:1.9;max-height:440px;overflow:auto;padding:16px;background:#faf8ff">'+esc(s.x)+'</pre><h4>本节练习</h4><p>根据本节内容，记录适用场景、礼仪动作顺序和你准备说的话，再对照正文检查。</p><textarea id="etiquette-text-answer" rows="5" aria-label="礼仪练习记录" style="width:100%;border:1px solid #ddd;border-radius:10px;padding:12px">'+esc(saved.answer||'')+'</textarea><label><input id="etiquette-text-checked" type="checkbox"'+(saved.checked?' checked':'')+'> 已对照正文检查措辞与动作顺序</label><button id="etiquette-text-save" style="display:block;padding:12px;color:#6d28d9">保存本节练习</button><p id="etiquette-text-feedback" aria-live="polite"></p>';
    p.querySelector('pre').textContent=s.x;
    document.getElementById('etiquette-text-section').onchange=function(e){step=Number(e.target.value);render();};
    document.getElementById('etiquette-text-save').onclick=function(){
      var answer=document.getElementById('etiquette-text-answer').value,checked=document.getElementById('etiquette-text-checked').checked;
      if(!answer.trim()){document.getElementById('etiquette-text-feedback').textContent='请先填写练习记录。';return;}
      try{localStorage.setItem(key,JSON.stringify({answer:answer,checked:checked,updatedAt:Date.now()}));document.getElementById('etiquette-text-feedback').textContent='练习记录已保存。';}catch(e){document.getElementById('etiquette-text-feedback').textContent='保存失败，请保留文字后重试。';}
    };
  }
})();
