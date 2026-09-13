/* gltf_retex.js — 替换 GLB 内嵌贴图（保持几何/骨骼不变）
 * 用法: node gltf_retex.js <in.glb> <out.glb> texName=imageFile [texName2=imageFile2 ...]
 * NODE_PATH=C:\Users\Administrator\.workbuddy\binaries\node\workspace\node_modules
 */
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const fs = require('fs');

(async () => {
  const [src, dst, ...pairs] = process.argv.slice(2);
  if (!src || !dst || !pairs.length) { console.error('usage: node gltf_retex.js in.glb out.glb texName=img.jpg ...'); process.exit(1); }
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(src);
  const root = doc.getRoot();
  let hit = 0;
  for (const pair of pairs) {
    const eq = pair.indexOf('=');
    const texName = pair.slice(0, eq), imgPath = pair.slice(eq + 1);
    const bytes = fs.readFileSync(imgPath);
    const ext = imgPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    let found = false;
    for (const t of root.listTextures()) {
      if (t.getName() !== texName) continue;
      t.setImage(new Uint8Array(bytes));
      t.setMimeType(ext);
      found = true; hit++;
      console.log(`replaced "${texName}" <- ${imgPath} (${bytes.length}B, ${ext})`);
    }
    if (!found) console.warn(`WARN: texture "${texName}" not found in ${src}`);
  }
  if (!hit) { console.error('no textures replaced, abort'); process.exit(1); }
  await io.write(dst, doc);
  console.log('written:', dst);
})().catch(e => { console.error('FAIL:', e.stack || e.message); process.exit(1); });
