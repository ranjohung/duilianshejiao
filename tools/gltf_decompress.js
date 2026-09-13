// gltf_decompress.js — 读入压缩 GLB（EXT_meshopt_compression / KHR_draco_mesh_compression），
// 解压并转存为普通 GLB（运行时无需解码器）。用法：node gltf_decompress.js in.glb out.glb
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { MeshoptDecoder } = require('meshoptimizer');
const { createDecoderModule } = require('draco3dgltf');

async function main() {
  const [src, dst] = process.argv.slice(2);
  if (!src || !dst) { console.error('usage: node gltf_decompress.js in.glb out.glb'); process.exit(1); }
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'draco3d.decoder': await createDecoderModule()
  });
  const doc = await io.read(src);
  doc.getRoot().listExtensionsUsed().forEach(e => {
    if (e.extensionName === 'EXT_meshopt_compression' || e.extensionName === 'KHR_draco_mesh_compression') {
      e.dispose();
      console.log('disposed', e.extensionName);
    }
  });
  await new NodeIO().write(dst, doc);
  console.log('written:', dst);
}
main().catch(e => { console.error('FAIL', e.stack || e.message); process.exit(1); });
