// _probe_glb.js — dump joints / rest pose / Y-range / scales for candidate GLBs
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { MeshoptDecoder } = require('meshoptimizer');
async function main() {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  for (const f of process.argv.slice(2)) {
    const doc = await io.read(f);
    const root = doc.getRoot();
    const skins = root.listSkins();
    const joints = skins.length ? skins[0].listJoints() : [];
    const names = joints.map(j => j.getName());
    console.log('=== ' + f.split(/[\\/]/).pop());
    console.log('joints:', names.length, '| mixamorig:', names.filter(n => n.startsWith('mixamorig')).length);
    console.log('sample:', names.slice(0, 4).join(','));
    let minY = Infinity, maxY = -Infinity;
    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION');
        if (pos) {
          const el = [];
          const step = Math.max(1, Math.floor(pos.getCount() / 300));
          for (let i = 0; i < pos.getCount(); i += step) {
            pos.getElement(i, el);
            minY = Math.min(minY, el[1]); maxY = Math.max(maxY, el[1]);
          }
        }
      }
    }
    console.log('bind-pose local Y range:', minY.toFixed(3), '..', maxY.toFixed(3));
    const want = ['Hips', 'Spine', 'LeftArm', 'RightArm', 'LeftForeArm', 'LeftUpLeg', 'Neck'];
    const walk = (n, d) => {
      const nm = n.getName().replace('mixamorig:', '');
      if (want.includes(nm)) {
        const t = n.getTranslation(), r = n.getRotation(), s = n.getScale();
        console.log(' ', nm, 'T=[' + t.map(v => v.toFixed(3)).join(',') + ']',
          'R=[' + r.map(v => v.toFixed(3)).join(',') + ']',
          s && (s[0] !== 1 || s[1] !== 1 || s[2] !== 1) ? 'S=[' + s.join(',') + ']' : '');
      }
      n.listChildren().forEach(c => walk(c, d + 1));
      const s2 = n.getScale();
      if (s2 && (s2[0] !== 1 || s2[1] !== 1 || s2[2] !== 1)) console.log('  SCALE-NODE', nm, s2.join(','));
    };
    root.listScenes()[0].listChildren().forEach(c => walk(c, 0));
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
