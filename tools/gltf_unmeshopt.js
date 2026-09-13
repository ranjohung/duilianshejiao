// _unmeshopt.js — read meshopt GLB, strip compression, write plain GLB
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { MeshoptDecoder } = require('meshoptimizer');
async function main() {
  const [src, dst] = process.argv.slice(2);
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(src);
  const ext = doc.getRoot().listExtensionsUsed()
    .find(e => e.extensionName === 'EXT_meshopt_compression');
  if (ext) { ext.dispose(); console.log('EXT_meshopt_compression disposed'); }
  else console.log('no meshopt extension found');
  await new NodeIO().write(dst, doc);
  console.log('written:', dst);
}
main().catch(e => { console.error('FAIL', e.stack || e.message); process.exit(1); });
