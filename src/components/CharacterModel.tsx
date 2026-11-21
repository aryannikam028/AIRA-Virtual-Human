import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { CHARACTER_CONFIG } from '../config/character';
import { useCharacterStore, CharacterGesture, CharacterExpression } from '../state/useCharacterStore';

const _lookAtTarget = new THREE.Vector3();


export const CharacterModel: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const status = useCharacterStore((state) => state.status);
  const expression = useCharacterStore((state) => state.expression);
  const currentGesture = useCharacterStore((state) => state.currentGesture);
  const cameraFraming = useCharacterStore((state) => state.cameraFraming);
  const audioAmplitude = useCharacterStore((state) => state.audioAmplitude);

  const isPortrait = cameraFraming === 'portrait';

  const [vrm, setVrm] = useState<VRM | null>(null);
  const [fallbackScene, setFallbackScene] = useState<THREE.Group | null>(null);

  // Procedural blinking state
  const blinkState = useRef({
    nextBlinkTime: Date.now() + 3000,
    isBlinking: false,
    blinkProgress: 0,
  });

  // Natural active listening nod cycle
  const nodState = useRef({
    nextNodTime: Date.now() + 4000,
    isNodding: false,
    nodProgress: 0,
  });

  // Animation timeline phase
  const animTime = useRef(0);
  // Reference to Face SkinnedMesh for fine-tuning eye openness and width
  const faceMeshRef = useRef<THREE.SkinnedMesh | null>(null);

  // Micro-saccade eye motion offset
  const saccadeOffset = useRef({ x: 0, y: 0, nextTime: Date.now() + 2000 });

  // Load Authentic VRM Model
  useEffect(() => {
    let isMounted = true;
    let loadedVrm: VRM | null = null;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    console.log('[CharacterModel] Loading full-body anime VRM from:', CHARACTER_CONFIG.modelUrl);

    loader.load(
      CHARACTER_CONFIG.modelUrl,
      (gltf) => {
        if (!isMounted) return;
        const vrmModel = gltf.userData.vrm as VRM;

        if (vrmModel) {
          console.log('[CharacterModel] Full-body VRM avatar loaded successfully!');
          loadedVrm = vrmModel;
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          VRMUtils.removeUnnecessaryJoints(gltf.scene);
          VRMUtils.rotateVRM0(vrmModel);

          // Enable shadow casting on full-body meshes while preserving authentic textures
          gltf.scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });

          // Permanently disable SpringBone physics on chest / bust bones so chest NEVER bounces or pops
          if (vrmModel.springBoneManager) {
            const jointsToDelete: any[] = [];
            vrmModel.springBoneManager.joints.forEach((joint: any) => {
              const bName = (joint.bone?.name || '').toLowerCase();
              if (bName.includes('bust') || bName.includes('breast') || bName.includes('chest')) {
                jointsToDelete.push(joint);
              }
            });
            jointsToDelete.forEach((joint) => {
              vrmModel.springBoneManager?.deleteJoint(joint);
            });
          }

          // Pre-lock bust nodes to 0 rotation
          gltf.scene.traverse((obj) => {
            const name = (obj.name || '').toLowerCase();
            if (name.includes('bust') || name.includes('breast')) {
              obj.rotation.set(0, 0, 0);
            }
          });

          // Pre-set humanoid bones immediately to exact reference A-pose so arms NEVER swing from T-pose on reload
          if (vrmModel.humanoid) {
            const lua = vrmModel.humanoid.getNormalizedBoneNode('leftUpperArm');
            const lla = vrmModel.humanoid.getNormalizedBoneNode('leftLowerArm');
            const lh = vrmModel.humanoid.getNormalizedBoneNode('leftHand');
            const rua = vrmModel.humanoid.getNormalizedBoneNode('rightUpperArm');
            const rla = vrmModel.humanoid.getNormalizedBoneNode('rightLowerArm');
            const rh = vrmModel.humanoid.getNormalizedBoneNode('rightHand');
            const c = vrmModel.humanoid.getNormalizedBoneNode('chest');
            const uc = vrmModel.humanoid.getNormalizedBoneNode('upperChest');
            const s = vrmModel.humanoid.getNormalizedBoneNode('spine');
            const h = vrmModel.humanoid.getNormalizedBoneNode('hips');
            const lul = vrmModel.humanoid.getNormalizedBoneNode('leftUpperLeg');
            const rul = vrmModel.humanoid.getNormalizedBoneNode('rightUpperLeg');

            // Exact natural A-pose matching reference image
            if (lua) lua.rotation.set(0.04, 0.02, 1.13);
            if (lla) lla.rotation.set(0, 0, 0);
            if (lh) lh.rotation.set(0, 0, 0.05);
            if (rua) rua.rotation.set(0.04, -0.02, -1.13);
            if (rla) rla.rotation.set(0, 0, 0);
            if (rh) rh.rotation.set(0, 0, -0.05);
            if (c) c.rotation.set(0, 0, 0);
            if (uc) uc.rotation.set(0, 0, 0);
            if (s) s.rotation.set(0, 0, 0);
            if (h) {
              h.rotation.set(0, 0, 0);
            }
            if (rul) rul.rotation.set(0, 0, 0.025);

            // Gently curled, natural fingers
            const rightFingers = ['rightIndexProximal', 'rightMiddleProximal', 'rightRingProximal', 'rightLittleProximal', 'rightThumbProximal'];
            rightFingers.forEach((name) => {
              const b = vrmModel.humanoid.getNormalizedBoneNode(name as any);
              if (b) b.rotation.set(0, 0, -0.12);
            });

          }

          // Initialize spring bones with stable pose
          vrmModel.springBoneManager?.setInitState();
          vrmModel.springBoneManager?.reset();

          setVrm(vrmModel);
        }
      },
      undefined,
      (error) => {
        console.error('[CharacterModel] Error loading VRM model:', error);
        if (CHARACTER_CONFIG.fallbackModelUrl) {
          loader.load(
            CHARACTER_CONFIG.fallbackModelUrl,
            (fallbackGltf) => {
              if (!isMounted) return;
              setFallbackScene(fallbackGltf.scene);
            },
            undefined,
            (fallbackErr) => {
              console.error('[CharacterModel] Fallback model also failed:', fallbackErr);
            }
          );
        }
      }
    );

    return () => {
      isMounted = false;
      if (loadedVrm) {
        VRMUtils.deepDispose(loadedVrm.scene);
      }
    };
  }, []);

  // Main 60fps Full-Body Animation Loop
  useFrame((state, delta) => {
    if (!vrm || !vrm.humanoid) return;

    const { pointer } = state;
    const now = Date.now();
    animTime.current += delta;
    const t = animTime.current;

    // Fast-access bone nodes
    const hips = vrm.humanoid.getNormalizedBoneNode('hips');
    const spine = vrm.humanoid.getNormalizedBoneNode('spine');
    const chest = vrm.humanoid.getNormalizedBoneNode('chest');
    const neck = vrm.humanoid.getNormalizedBoneNode('neck');
    const head = vrm.humanoid.getNormalizedBoneNode('head');

    const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
    const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
    const leftHand = vrm.humanoid.getNormalizedBoneNode('leftHand');

    const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
    const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
    const rightHand = vrm.humanoid.getNormalizedBoneNode('rightHand');

    const leftUpperLeg = vrm.humanoid.getNormalizedBoneNode('leftUpperLeg');
    const rightUpperLeg = vrm.humanoid.getNormalizedBoneNode('rightUpperLeg');

    // -------------------------------------------------------------
    // 1. ORGANIC FULL-BODY IDLE SYSTEM (Rock-Solid Stance - Chest & Torso Permanently Still)
    // -------------------------------------------------------------
    const speechAmp = Math.min(1.0, audioAmplitude * 1.6);
    const upperChest = vrm.humanoid.getNormalizedBoneNode('upperChest');

    // Natural Leg Posture (Full-body grounded standing stance matching reference image)
    if (leftUpperLeg) leftUpperLeg.rotation.set(0, 0, -0.025);
    if (rightUpperLeg) rightUpperLeg.rotation.set(0, 0, 0.025);

    // Hips, Spine, UpperChest, and Chest: Rock-solid stability without sway, wobble, or popping
    if (hips) {
      hips.rotation.set(0, 0, 0);
    }
    if (spine) spine.rotation.set(0, 0, 0);
    if (chest) chest.rotation.set(0, 0, 0);
    if (upperChest) upperChest.rotation.set(0, 0, 0);

    // Lock bust / breast bones so they NEVER bounce or pop
    const bustBones = ['J_Sec_L_Bust1', 'J_Sec_L_Bust2', 'J_Sec_R_Bust1', 'J_Sec_R_Bust2'];
    for (let i = 0; i < bustBones.length; i++) {
      const node = vrm.scene.getObjectByName(bustBones[i]);
      if (node) {
        node.rotation.set(0, 0, 0);
      }
    }

    // -------------------------------------------------------------
    // 2. PROCEDURAL BLINKING & ACTIVE LISTENING NODS
    // -------------------------------------------------------------
    if (now >= blinkState.current.nextBlinkTime && !blinkState.current.isBlinking) {
      blinkState.current.isBlinking = true;
      blinkState.current.blinkProgress = 0;
    }

    let blinkVal = 0;
    if (blinkState.current.isBlinking) {
      blinkState.current.blinkProgress += delta * 14;
      if (blinkState.current.blinkProgress >= Math.PI) {
        blinkState.current.isBlinking = false;
        blinkState.current.nextBlinkTime =
          now +
          CHARACTER_CONFIG.blinkIntervalRange[0] +
          Math.random() * (CHARACTER_CONFIG.blinkIntervalRange[1] - CHARACTER_CONFIG.blinkIntervalRange[0]);
        blinkVal = 0;
      } else {
        blinkVal = Math.sin(blinkState.current.blinkProgress);
      }
    }

    // Natural nod while listening
    if (status === 'listening' && now >= nodState.current.nextNodTime && !nodState.current.isNodding) {
      nodState.current.isNodding = true;
      nodState.current.nodProgress = 0;
    }

    let nodAngleX = 0;
    if (nodState.current.isNodding) {
      nodState.current.nodProgress += delta * 5.5;
      if (nodState.current.nodProgress >= Math.PI) {
        nodState.current.isNodding = false;
        nodState.current.nextNodTime = now + 3500 + Math.random() * 3000;
      } else {
        nodAngleX = Math.sin(nodState.current.nodProgress) * 0.07;
      }
    }

    // -------------------------------------------------------------
    // 3. EYE GAZE & MICRO-SACCADES
    // -------------------------------------------------------------
    if (now >= saccadeOffset.current.nextTime) {
      saccadeOffset.current.x = (Math.random() - 0.5) * 0.08;
      saccadeOffset.current.y = (Math.random() - 0.5) * 0.06;
      saccadeOffset.current.nextTime = now + 1200 + Math.random() * 2200;
    }

    if (vrm.lookAt) {
      _lookAtTarget.set(
        pointer.x * 2.2 + saccadeOffset.current.x,
        pointer.y * 1.5 + 1.25 + saccadeOffset.current.y,
        2.5
      );
      vrm.lookAt.lookAt(_lookAtTarget);
    }

    // -------------------------------------------------------------
    // 4. HEAD POSTURE & CONVERSATIONAL HEAD TURNS
    // -------------------------------------------------------------
    if (head) {
      let targetHeadPitchX = 0.02 + nodAngleX;
      let targetHeadYawY = pointer.x * 0.10;
      let targetHeadRollZ = -0.045; // Subtle cute tilt to her right as in reference image

      if (currentGesture === 'thinking' || status === 'thinking') {
        targetHeadPitchX = -0.07;
        targetHeadRollZ = 0.09;
        targetHeadYawY = 0.08;
      } else if (currentGesture === 'headTilt' || status === 'listening') {
        targetHeadRollZ = 0.075 * Math.sin(t * 0.6);
        targetHeadPitchX = 0.04 + nodAngleX;
      } else if (currentGesture === 'sassy') {
        targetHeadRollZ = 0.11;
        targetHeadYawY = -0.06;
        targetHeadPitchX = -0.03;
      } else if (status === 'speaking') {
        // Subtle rhythm bobbing while speaking
        const speechBob = Math.sin(t * 7.5) * speechAmp * 0.04;
        targetHeadPitchX = 0.02 + speechBob;
        targetHeadRollZ = -0.045 + Math.sin(t * 1.5) * 0.03;
      }

      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetHeadPitchX, delta * 4.0);
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetHeadYawY, delta * 3.5);
      head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, targetHeadRollZ, delta * 3.5);
    }

    // -------------------------------------------------------------
    // 5. RESTING ARM & HAND SYSTEM (Holding Roses Bouquet Gracefully)
    // -------------------------------------------------------------
    // Soft, organic breathing rhythm
    const breath = Math.sin(t * 1.4) * 0.008;

    if (leftUpperArm) leftUpperArm.rotation.set(0.10 + breath * 0.3, 0.02, 1.28 + breath * 0.7);
    if (leftLowerArm) leftLowerArm.rotation.set(0.0, 0.18 + breath * 0.3, 0.12);
    if (leftHand) leftHand.rotation.set(0.05, 0.02, 0.0);

    if (rightUpperArm) rightUpperArm.rotation.set(0.10 + breath * 0.3, -0.02, -1.28 - breath * 0.7);
    if (rightLowerArm) rightLowerArm.rotation.set(0.0, -0.18 - breath * 0.3, -0.12);
    if (rightHand) rightHand.rotation.set(0.05, -0.02, 0.0);

    const leftFingers = ['leftIndexProximal', 'leftMiddleProximal', 'leftRingProximal', 'leftLittleProximal', 'leftThumbProximal'];
    leftFingers.forEach((name) => {
      const b = vrm.humanoid?.getNormalizedBoneNode(name as any);
      if (b) b.rotation.set(0, 0, 0.10);
    });
    const rightFingers = ['rightIndexProximal', 'rightMiddleProximal', 'rightRingProximal', 'rightLittleProximal', 'rightThumbProximal'];
    rightFingers.forEach((name) => {
      const b = vrm.humanoid?.getNormalizedBoneNode(name as any);
      if (b) b.rotation.set(0, 0, -0.12);
    });

    // -------------------------------------------------------------
    // 6. FACIAL EXPRESSIONS & LIP-SYNC
    // -------------------------------------------------------------
    if (vrm.expressionManager) {
      // Natural Eye Blinks
      const isWinking = expression === 'wink' || (currentGesture === 'sassy' && Math.sin(t * 0.4) > 0.85);
      if (isWinking) {
        vrm.expressionManager.setValue('blinkRight', 1.0);
        vrm.expressionManager.setValue('blink', 0);
      } else {
        vrm.expressionManager.setValue('blinkRight', 0);
        vrm.expressionManager.setValue('blink', blinkVal);
      }

      // Real-Time Lip-Sync
      if (status === 'speaking') {
        const mouthOpen = speechAmp;
        const aaVal = mouthOpen * 0.88;
        const ohVal = Math.sin(now * 0.014) > 0 ? mouthOpen * 0.5 : 0;
        const ihVal = Math.cos(now * 0.012) > 0 ? mouthOpen * 0.45 : 0;

        vrm.expressionManager.setValue('aa', aaVal);
        vrm.expressionManager.setValue('oh', ohVal);
        vrm.expressionManager.setValue('ih', ihVal);
      } else {
        vrm.expressionManager.setValue('aa', 0);
        vrm.expressionManager.setValue('oh', 0);
        vrm.expressionManager.setValue('ih', 0);
      }

      // Contextual Expressions
      const isHappy = expression === 'happy' || expression === 'smile' || expression === 'laugh';
      const isSurprised = expression === 'surprised';

      // Remove constant squint when neutral (happy 0.0), so her eyes don't narrow into slits
      vrm.expressionManager.setValue('happy', isHappy ? 0.55 : 0.0);
      vrm.expressionManager.setValue('surprised', isSurprised ? 0.75 : 0.0);

      vrm.expressionManager.update();

      // Fine-tune eye aperture and width: make eyes more open and slightly wider
      if (faceMeshRef.current && faceMeshRef.current.morphTargetDictionary && faceMeshRef.current.morphTargetInfluences) {
        const dict = faceMeshRef.current.morphTargetDictionary;
        const influences = faceMeshRef.current.morphTargetInfluences;
        const openFactor = Math.max(0, 1.0 - blinkVal);

        // Open eyelids vertically (removes narrow squint, makes eyes open and alert)
        const eyeSurprisedIdx = dict['Face.M_F00_000_00_Fcl_EYE_Surprised'];
        if (eyeSurprisedIdx !== undefined) {
          influences[eyeSurprisedIdx] = (isSurprised ? 0.75 : 0.22) * openFactor;
        }

        // Widen eyes horizontally (subtly wider)
        const eyeSpreadIdx = dict['Face.M_F00_000_00_Fcl_EYE_Spread'];
        if (eyeSpreadIdx !== undefined) {
          influences[eyeSpreadIdx] = 0.32 * openFactor;
        }
      }
    }

    // -------------------------------------------------------------
    // 7. SPRING BONES (Real-Time Anime Hair Physics) & CHEST LOCK
    // -------------------------------------------------------------
    vrm.update(delta);

    // Post-update safety lock: Ensure chest and bust bones remain completely still after physics update
    if (chest) chest.rotation.set(0, 0, 0);
    if (upperChest) upperChest.rotation.set(0, 0, 0);
    for (let i = 0; i < bustBones.length; i++) {
      const node = vrm.scene.getObjectByName(bustBones[i]);
      if (node) {
        node.rotation.set(0, 0, 0);
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={CHARACTER_CONFIG.position}
      rotation={CHARACTER_CONFIG.rotation}
      scale={CHARACTER_CONFIG.scale}
    >
      {vrm && <primitive object={vrm.scene} />}
      {!vrm && fallbackScene && <primitive object={fallbackScene} />}
    </group>
  );
};
