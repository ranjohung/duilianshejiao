/* 用本机 A1111 WebUI 生成 8 张真实生活场景底图 */
const BASE = 'http://127.0.0.1:7860/sdapi/v1';
const OUT = 'assets/images/scenes';
const fs = require('fs');
const path = require('path');
fs.mkdirSync(OUT, { recursive: true });

const MODEL = 'majicMIX realisticv7.safetensors [7c819b6d13]';

const NEG = 'people,human,crowd,person,text,watermark,logo,signage,letters,lowres,blurry,bad quality,deformed,extra limbs,worst quality,low quality,jpeg artifacts,ugly';

const SCENES = [
  ['office', 'professional modern office interior, floor to ceiling windows, minimalist desks, ergonomic chairs, soft natural daylight, empty room, photorealistic, wide angle, architectural photography, 8k'],
  ['cafe', 'cozy specialty coffee shop interior, warm Edison pendant lights, wooden espresso counter, latte art, small cafe tables, green plants, afternoon sunlight, empty, photorealistic, 8k'],
  ['family', 'warm home dining room, wooden dining table set for a family dinner, dishes and glasses, warm pendant light, family photos on wall, cozy evening atmosphere, empty, photorealistic, 8k'],
  ['restaurant', 'elegant chinese private dining room, round banquet table with glass lazy susan, red lanterns, luxury chairs, warm ambient golden light, empty, photorealistic, 8k'],
  ['wedding', 'romantic wedding reception venue, white flower arch, rose petals aisle, elegant round tables, soft pink and warm candle light, dreamy, empty, photorealistic, 8k'],
  ['bar', 'stylish dark cocktail bar interior, neon accent lighting, backlit liquor bottle shelves, bar counter with stools, moody night atmosphere, empty, photorealistic, 8k'],
  ['corridor', 'residential apartment building hallway, stacked cardboard moving boxes near a door, ceiling corridor lights, clean modern walls, empty, photorealistic, 8k'],
  ['generic', 'modern bright living room, comfortable sofa, wooden coffee table, houseplants, soft daylight through curtains, cozy, empty, photorealistic, 8k'],
];

async function setModel() {
  const r = await fetch(`${BASE}/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sd_model_checkpoint: MODEL }),
  });
  console.log('set model ->', r.status);
}

async function gen(name, prompt) {
  const r = await fetch(`${BASE}/txt2img`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt + ', no people, empty scene',
      negative_prompt: NEG,
      steps: 30,
      cfg_scale: 7,
      width: 1024,
      height: 768,
      sampler_name: 'DPM++ 2M Karras',
      save_images: false,
      override_settings: { sd_model_checkpoint: MODEL },
    }),
  });
  const j = await r.json();
  if (!j.images || !j.images[0]) { console.log('FAIL', name, JSON.stringify(j).slice(0, 160)); return; }
  const buf = Buffer.from(j.images[0], 'base64');
  fs.writeFileSync(path.join(OUT, name + '.png'), buf);
  console.log('OK', name, buf.length);
}

(async () => {
  try { await setModel(); } catch (e) { console.log('setModel err', e.message); }
  for (const [name, prompt] of SCENES) {
    try { await gen(name, prompt); } catch (e) { console.log('gen err', name, e.message); }
  }
  console.log('ALL DONE');
})();
