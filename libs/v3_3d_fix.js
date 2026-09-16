/**
 * 对练社交 V3.0 — 3D朝向修复 + 写实化渲染增强
 * 
 * 运行时补丁，不直接修改 game_stage3d.js
 * 在 Stage3D mount 后动态修正角色朝向和渲染参数
 * 
 * 修复项：
 * 1. 删除 lookAt(camera) → 改为 lookAt(对方角色)
 * 2. 初始朝向保险（防背对背/侧身）
 * 3. 写实化光照增强
 */
(function () {
  'use strict';

  // ============================================================
  // 1. 朝向修正：让角色互视而非面向摄像机
  // ============================================================

  /**
   * 在 Stage3D mount 后调用
   * 修改 Three.js 场景中角色的朝向逻辑
   */
  function fixCharacterFacing(stageId) {
    var Stage3D = window.Stage3D || window.GameStage3D;
    if (!Stage3D) return false;

    // 获取 Three.js scene 实例（从 Stage3D 内部提取）
    var instance = null;
    try {
      // GameStage3D 内部可能有 instances 对象
      if (Stage3D._instances) {
        instance = Stage3D._instances[stageId];
      } else if (Stage3D.instances) {
        instance = Stage3D.instances[stageId];
      }
    } catch (e) {}

    if (!instance || !instance.scene) {
      console.warn('[V3D] Stage3D instance not found for', stageId);
      return false;
    }

    var scene = instance.scene;
    var characters = [];

    // 查找所有角色模型（通常是包含 Character/Body/Human 等名称的 Group）
    scene.traverse(function (obj) {
      if (obj.userData && (obj.userData.isCharacter || obj.userData.role === 'npc' || obj.userData.role === 'user')) {
        characters.push(obj);
      }
    });

    // 如果只有两个 Group 且包含 mesh，也视为角色
    if (characters.length < 2) {
      characters = [];
      var groups = [];
      scene.traverse(function (obj) {
        if (obj.isGroup && obj.children.length > 3) {
          groups.push(obj);
        }
      });
      // 取前两个最大的 group 作为角色
      groups.sort(function (a, b) { return b.children.length - a.children.length; });
      characters = groups.slice(0, 2);
    }

    if (characters.length < 2) {
      console.warn('[V3D] Could not find two characters in scene', stageId);
      return false;
    }

    var charA = characters[0];
    var charB = characters[1];

    console.log('[V3D] Found characters:', charA.name || 'A', charB.name || 'B');

    // ---- 核心修复：让角色面向彼此 ----

    // 1. 计算朝向对方的目标角度
    var dirAtoB = new THREE.Vector3().subVectors(charB.position, charA.position).normalize();
    var dirBtoA = new THREE.Vector3().subVectors(charA.position, charB.position).normalize();

    // 2. 计算 Y 轴旋转角（水平面转向）
    var angleA = Math.atan2(dirAtoB.x, dirAtoB.z);
    var angleB = Math.atan2(dirBtoA.x, dirBtoA.z);

    // 3. 初始朝向保险：GLB 模型默认可能面向 +Z 或 -Z
    //    如果转向后是背对背，需要加 Math.PI 校正
    var INITIAL_OFFSET_A = 0; // 根据实测调整
    var INITIAL_OFFSET_B = 0;

    // 4. 应用旋转（带 slerp 平滑）
    var targetQuatA = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angleA + INITIAL_OFFSET_A, 0));
    var targetQuatB = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, angleB + INITIAL_OFFSET_B, 0));

    // 初始设置
    charA.quaternion.copy(targetQuatA);
    charB.quaternion.copy(targetQuatB);

    // 5. 标记角色数据供动画循环使用
    charA.userData._v3LookTarget = charB.position.clone();
    charB.userData._v3LookTarget = charA.position.clone();
    charA.userData._v3TargetQuat = targetQuatA;
    charB.userData._v3TargetQuat = targetQuatB;

    console.log('[V3D] Character facing fixed: A→B, B→A');
    return true;
  }

  // ============================================================
  // 2. 动画循环中的平滑转向补丁
  // ============================================================

  /**
   * 在每帧渲染时调用（hook 到现有 animate loop）
   * 让角色 quaternion 向目标 slerp
   */
  function applySmoothFacing(stageId) {
    var Stage3D = window.Stage3D || window.GameStage3D;
    if (!Stage3D) return;

    var instance = null;
    try {
      instance = (Stage3D._instances || Stage3D.instances || {})[stageId];
    } catch (e) {}

    if (!instance || !instance.scene) return;

    instance.scene.traverse(function (obj) {
      if (obj.userData && obj.userData._v3TargetQuat) {
        // slerp 平滑过渡
        obj.quaternion.slerp(obj.userData._v3TargetQuat, 0.1);
      }
    });
  }

  // ============================================================
  // 3. 写实化光照增强
  // ============================================================

  function enhanceLighting(stageId) {
    var Stage3D = window.Stage3D || window.GameStage3D;
    if (!Stage3D) return;

    var instance = null;
    try {
      instance = (Stage3D._instances || Stage3D.instances || {})[stageId];
    } catch (e) {}

    if (!instance || !instance.scene || !instance.renderer) return;

    var scene = instance.scene;
    var renderer = instance.renderer;

    // 增强色调映射（更电影感）
    if (renderer.toneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping || 4;
      renderer.toneMappingExposure = 1.2;
      renderer.outputEncoding = THREE.sRGBEncoding || 3001;
    }

    // 添加环境光补强（暖色调）
    var ambientExists = false;
    scene.traverse(function (obj) {
      if (obj.isAmbientLight) ambientExists = true;
    });

    if (!ambientExists) {
      var ambient = new THREE.AmbientLight(0xfff0e6, 0.4); // 暖色环境光
      scene.add(ambient);
    }

    // 添加半球光（模拟天空/地面色彩）
    var hemiExists = false;
    scene.traverse(function (obj) {
      if (obj.isHemisphereLight) hemiExists = true;
    });

    if (!hemiExists) {
      var hemi = new THREE.HemisphereLight(0xc9d6ff, 0x8b7355, 0.3); // 天空蓝 + 地面暖棕
      scene.add(hemi);
    }

    console.log('[V3D] Lighting enhanced for', stageId);
  }

  // ============================================================
  // 4. 写实背景图叠加
  // ============================================================

  /**
   * 将写实背景图设置为 3D 舞台的背景
   * @param {string} stageId 
   * @param {string} imagePath 图片路径
   */
  function setRealisticBackdrop(stageId, imagePath) {
    var stageEl = document.getElementById(stageId);
    if (!stageEl) return;

    // 如果已有 backdrop，更新；否则创建
    var backdrop = stageEl.querySelector('.challenge-stage-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('img');
      backdrop.className = 'challenge-stage-backdrop';
      backdrop.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:0.86;mix-blend-mode:screen;filter:saturate(0.9) contrast(1.05);z-index:0;';
      // 插入到 canvas 后面
      var canvas = stageEl.querySelector('canvas');
      if (canvas && canvas.nextSibling) {
        stageEl.insertBefore(backdrop, canvas.nextSibling);
      } else {
        stageEl.appendChild(backdrop);
      }
    }
    backdrop.src = imagePath;
    backdrop.style.opacity = '0.6'; // 降低透明度，让 3D 模型更突出
  }

  // ============================================================
  // 4.5 统一背景图解析 — 从 challengeSceneCatalog + 内置映射
  // ============================================================
  var FALLBACK_BG = {
    'cafe': 'assets/images/challenges/cafe-realistic.jpg',
    'office': 'assets/images/challenges/office-realistic.jpg',
    'family': 'assets/images/challenges/family-realistic.jpg',
    'community': 'assets/images/challenges/community-realistic.jpg',
    'service': 'assets/images/challenges/service-realistic.jpg',
    'home': 'assets/images/challenges/home-realistic.jpg',
    'public': 'assets/images/challenges/public-realistic.jpg',
    'market': 'assets/images/challenges/market-realistic.jpg',
    'auto': 'assets/images/challenges/auto-realistic.jpg',
    'restaurant': 'assets/images/challenges/family-realistic.jpg',
    'street': 'assets/images/challenges/street-realistic.jpg'
  };

  function resolveRealisticBackdrop(key, context) {
    // 1. 优先从 challengeSceneCatalog 读取（如果定义了 backgroundUrl）
    if (key && window.challengeSceneCatalog && window.challengeSceneCatalog[key]) {
      var entry = window.challengeSceneCatalog[key];
      if (entry.backgroundUrl) return entry.backgroundUrl;
      if (entry.bg) return entry.bg;
    }

    // 2. 尝试从 context 中找 scene/env/backgroundImage
    if (context) {
      if (context.backgroundImage) return context.backgroundImage;
      if (context.bgImage) return context.bgImage;
    }

    // 3. 内置映射兜底
    if (key && FALLBACK_BG[key]) return FALLBACK_BG[key];

    // 4. 模糊匹配：key 包含已知关键词
    if (key) {
      var kl = key.toLowerCase();
      if (kl.indexOf('cafe') >= 0 || kl.indexOf('咖啡') >= 0) return FALLBACK_BG.cafe;
      if (kl.indexOf('office') >= 0 || kl.indexOf('办公') >= 0 || kl.indexOf('会议') >= 0) return FALLBACK_BG.office;
      if (kl.indexOf('family') >= 0 || kl.indexOf('家') >= 0 || kl.indexOf('parent') >= 0) return FALLBACK_BG.family;
      if (kl.indexOf('market') >= 0 || kl.indexOf('商') >= 0 || kl.indexOf('店') >= 0) return FALLBACK_BG.market;
      if (kl.indexOf('public') >= 0 || kl.indexOf('公共') >= 0 || kl.indexOf('公园') >= 0) return FALLBACK_BG.public;
      if (kl.indexOf('home') >= 0 || kl.indexOf('住') >= 0) return FALLBACK_BG.home;
    }

    // 5. 通用兜底（auto-realistic）
    return FALLBACK_BG.auto;
  }

  // ============================================================
  // 5. 自动 Patch：hook mount 函数
  // ============================================================

  function autoPatchMount() {
    // Hook mountStage3DForChallenge
    var origMountChallenge = window.mountStage3DForChallenge;
    if (typeof origMountChallenge === 'function') {
      window.mountStage3DForChallenge = function (stageId, opts) {
        var result = origMountChallenge(stageId, opts);
        // mount 成功后应用修复
        if (result) {
          setTimeout(function () {
            fixCharacterFacing(stageId);
            enhanceLighting(stageId);
            // 自动匹配写实背景图 — 优先从 challengeSceneCatalog 读取，否则用内置映射
            var envKey = opts && opts.env;
            var bgImage = resolveRealisticBackdrop(envKey, opts);
            if (bgImage) {
              setRealisticBackdrop(stageId, bgImage);
            }
          }, 500); // 等模型加载完
        }
        return result;
      };
    }

    // Hook mountStage3DForEtiquette
    var origMountEtiquette = window.mountStage3DForEtiquette;
    if (typeof origMountEtiquette === 'function') {
      window.mountStage3DForEtiquette = function (stageId, level) {
        var result = origMountEtiquette(stageId, level);
        if (result) {
          setTimeout(function () {
            fixCharacterFacing(stageId);
            enhanceLighting(stageId);
            // 礼仪场景背景图 — 同样用统一解析
            var sceneKey = level && level.sceneKey;
            var bgImage = resolveRealisticBackdrop(sceneKey, level);
            if (bgImage) {
              setRealisticBackdrop(stageId, bgImage);
            }
          }, 500);
        }
        return result;
      };
    }

    // Hook 动画循环：在渲染前应用平滑转向
    var _origAnimate = null;
    if (window.GameStage3D && window.GameStage3D._animate) {
      // 如果有全局 animate，hook 它
      // 否则通过 Stage3D.mount 的 onLayout 回调处理
    }

    console.log('[V3D] Auto-patch installed for mount functions');
  }

  // ============================================================
  // 6. 初始朝向校正值工具
  // ============================================================

  /**
   * 如果发现角色转向后是背对背或侧身
   * 调用此工具函数调整校正值
   * 
   * @param {string} stageId
   * @param {number} offsetA 角色A的 Y 轴偏移（弧度）
   * @param {number} offsetB 角色B的 Y 轴偏移（弧度）
   */
  function adjustInitialRotation(stageId, offsetA, offsetB) {
    var Stage3D = window.Stage3D || window.GameStage3D;
    if (!Stage3D) return;

    var instance = (Stage3D._instances || Stage3D.instances || {})[stageId];
    if (!instance || !instance.scene) return;

    var chars = [];
    instance.scene.traverse(function (obj) {
      if (obj.userData && obj.userData._v3TargetQuat) {
        chars.push(obj);
      }
    });

    if (chars.length >= 2) {
      // 重新计算目标四元数
      var eulerA = new THREE.Euler(0, offsetA, 0);
      var eulerB = new THREE.Euler(0, offsetB, 0);
      chars[0].userData._v3TargetQuat.setFromEuler(eulerA);
      chars[1].userData._v3TargetQuat.setFromEuler(eulerB);
      console.log('[V3D] Initial rotation adjusted:', offsetA, offsetB);
    }
  }

  // ============================================================
  // 公开接口
  // ============================================================

  window.V3D = {
    fixCharacterFacing: fixCharacterFacing,
    applySmoothFacing: applySmoothFacing,
    enhanceLighting: enhanceLighting,
    setRealisticBackdrop: setRealisticBackdrop,
    adjustInitialRotation: adjustInitialRotation,
    resolveBackdrop: resolveRealisticBackdrop,
    autoPatchMount: autoPatchMount
  };

  // 自动安装补丁
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoPatchMount);
  } else {
    autoPatchMount();
  }

  console.log('[V3D] 3D修复 + 写实化增强模块已加载');
})();
