const fs=require('fs');const path=require('path');const assert=require('assert');const root=process.cwd();const index=fs.readFileSync(path.join(root,'index.html'),'utf8');const training=fs.readFileSync(path.join(root,'libs/v5_scene_training.js'),'utf8');const bridge=fs.readFileSync(path.join(root,'libs/v5_course_migration_bridge.js'),'utf8');const coach=fs.readFileSync(path.join(root,'libs/v5_dialogue_coach_feedback.js'),'utf8');const history=fs.readFileSync(path.join(root,'libs/v5_dialogue_history_panel.js'),'utf8');const retry=fs.readFileSync(path.join(root,'libs/v5_dialogue_retry.js'),'utf8');
const checks=[
['lesson context enters SceneTraining',index.includes('SceneTraining.start(levelId, lessonContext)')],
['action demo exists',training.includes("type: 'action_demo'")],
['speech demo exists',training.includes("type: 'speech_demo'")],
['follow practice exists',training.includes("type: 'follow_prac'")],
['multi-turn roleplay exists',training.includes("type: 'ai_roleplay'")&&training.includes('_dialogueAnswers')],
['behavior confirmation is explicit',training.includes('行为确认')&&training.includes('系统也没有识别你的实际肢体动作')],
['reality challenge storage',bridge.includes('duilian_challenge_log')],
['next recommendation storage',bridge.includes('duilian_etiquette_next_recommendation')],
['dialogue history storage',coach.includes('duilian_dialogue_history')],
['weakpoint storage',coach.includes('duilian_dialogue_weakpoint')],
['history visible',history.includes('st-dialogue-history')],
['history retry entry',retry.includes('st-history-retry')]
];for(const [name,ok] of checks)assert(ok,name);console.log(JSON.stringify({passed:checks.length,checks:checks.map(x=>x[0])}));