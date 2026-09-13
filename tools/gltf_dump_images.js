/* 导出 GLB 内嵌贴图清单 + 提取图片文件
 * 用法: node tools/gltf_dump_images.js <in.glb> <outdir>
 * NODE_PATH=C:\Users\Administrator\.workbuddy\binaries\node\workspace\node_modules
 */
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const fs = require('fs');
const path = require('path');

(async () => {
  const [,, inGlb, outDir] = process.argv;
  if (!inGlb || !outDir) { console.error('usage: node gltf_dump_images.js <in.glb> <outdir>'); process.exit(1); }
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(inGlb);
  fs.mkdirSync(outDir, { recursive: true });
  const root = doc.getRoot();
  const mats = root.listMaterials();
  console.log('== materials ==');
  mats.forEach((m, i) => {
    const base = m.getBaseColorTexture();
    const mr = m.getMetallicRoughnessTexture();
    const nr = m.getNormalTexture();
    const nameOf = (t) => t ? (t.getImage() ? '(embedded)' : '') + ' texName="' + (t.getName() || '') + '"' : '';
    console.log(`mat[${i}] "${m.getName()}" baseTex:${nameOf(base)} mrTex:${nameOf(mr)} nTex:${nameOf(nr)}`);
    if (base) {
      const texInfo = base;
      console.log(`   base image mimeType=${texInfo.getMimeType()} imageSize=${texInfo.getImage() ? texInfo.getImage().length : 0}B`);
    }
  });
  console.log('== textures/images ==');
  root.listTextures().forEach((t, i) => {
    const img = t.getImage();
    const ext = (t.getMimeType() || '').includes('png') ? 'png' : 'jpg';
    const fname = `img${i}_${(t.getName() || 'unnamed').replace(/[^\w.-]/g, '_')}.${ext}`;
    if (img) fs.writeFileSync(path.join(outDir, fname), img);
    console.log(`tex[${i}] name="${t.getName()}" mime=${t.getMimeType()} size=${img ? img.length : 0}B -> ${fname}`);
  });
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
