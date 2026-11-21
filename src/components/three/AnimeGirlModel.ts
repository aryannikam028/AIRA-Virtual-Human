import * as THREE from 'three';
import {
  createAnimeEyeTexture,
  createContactShadowTexture,
  createPedestalRingTexture,
} from './proceduralTextures.ts';
import { ConnectionState, ReactionData } from '../../types/index.ts';

export class AnimeGirlModel {
  public group: THREE.Group;

  // Animatable parts
  private headGroup: THREE.Group;
  private hairPigtailLeft: THREE.Group;
  private hairPigtailRight: THREE.Group;
  private mouthMesh: THREE.Mesh;
  private leftEyeMesh: THREE.Mesh;
  private rightEyeMesh: THREE.Mesh;
  private leftEyelid: THREE.Mesh;
  private rightEyelid: THREE.Mesh;
  private chestGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private pedestalRing: THREE.Mesh;
  private headsetGlowL: THREE.Mesh;
  private headsetGlowR: THREE.Mesh;
  private chokerGlow: THREE.Mesh;

  // Materials for live theme updates
  private cyberGlowMaterial: THREE.MeshBasicMaterial;
  private hairMaterial: THREE.MeshStandardMaterial;
  private outfitAccentMaterial: THREE.MeshStandardMaterial;

  // Animation state tracking
  private blinkTimer = 0;
  private blinkDuration = 0.14;
  private isBlinking = false;
  private currentSmile = 0;
  private targetSmile = 0;
  private currentLipSync = 0;

  constructor(primaryColorHex = '#ec4899') {
    this.group = new THREE.Group();
    this.group.name = 'ZoyaAnimeGirl';

    // 1. Shared Materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe2d6,
      roughness: 0.85,
      metalness: 0.05,
    });

    const blushMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7b90,
      transparent: true,
      opacity: 0.45,
    });

    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x241434, // Dark violet/plum base
      roughness: 0.35,
      metalness: 0.25,
    });

    const outfitDarkMaterial = new THREE.MeshStandardMaterial({
      color: 0x111118,
      roughness: 0.4,
      metalness: 0.6,
    });

    const outfitWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      roughness: 0.5,
      metalness: 0.2,
    });

    this.outfitAccentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryColorHex),
      roughness: 0.2,
      metalness: 0.8,
      emissive: new THREE.Color(primaryColorHex),
      emissiveIntensity: 0.4,
    });

    this.cyberGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(primaryColorHex),
      transparent: true,
      opacity: 0.9,
    });

    // 2. Head & Face Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.48, 0);

    // Head base (Anime stylized chin and cheeks)
    const headGeom = new THREE.SphereGeometry(0.24, 32, 28);
    // Sculpt anime taper toward chin
    const pos = headGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (y < 0) {
        // Taper jawline
        pos.setX(i, pos.getX(i) * (1 + y * 0.7));
        pos.setZ(i, z * (1 + y * 0.4));
      }
    }
    headGeom.computeVertexNormals();
    const headMesh = new THREE.Mesh(headGeom, skinMaterial);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Cute Anime Ears
    const earGeom = new THREE.SphereGeometry(0.045, 16, 12);
    earGeom.scale(0.5, 1.2, 0.8);
    const earL = new THREE.Mesh(earGeom, skinMaterial);
    earL.position.set(-0.23, 0.02, -0.02);
    earL.rotation.z = 0.2;
    const earR = earL.clone();
    earR.position.set(0.23, 0.02, -0.02);
    earR.rotation.z = -0.2;
    this.headGroup.add(earL, earR);

    // Left & Right Anime Eyes
    const eyeGeom = new THREE.PlaneGeometry(0.12, 0.14);
    const leftEyeTex = createAnimeEyeTexture(false, primaryColorHex);
    const rightEyeTex = createAnimeEyeTexture(true, primaryColorHex);

    const leftEyeMat = new THREE.MeshBasicMaterial({
      map: leftEyeTex,
      transparent: true,
    });
    const rightEyeMat = new THREE.MeshBasicMaterial({
      map: rightEyeTex,
      transparent: true,
    });

    this.leftEyeMesh = new THREE.Mesh(eyeGeom, leftEyeMat);
    this.leftEyeMesh.position.set(-0.088, 0.02, 0.222);
    this.leftEyeMesh.rotation.y = -0.15;

    this.rightEyeMesh = new THREE.Mesh(eyeGeom, rightEyeMat);
    this.rightEyeMesh.position.set(0.088, 0.02, 0.222);
    this.rightEyeMesh.rotation.y = 0.15;

    this.headGroup.add(this.leftEyeMesh, this.rightEyeMesh);

    // Eyelids for blinking
    const eyelidGeom = new THREE.PlaneGeometry(0.125, 0.145);
    const eyelidMat = new THREE.MeshBasicMaterial({
      color: 0xffe2d6,
      side: THREE.DoubleSide,
    });
    this.leftEyelid = new THREE.Mesh(eyelidGeom, eyelidMat);
    this.leftEyelid.position.set(-0.088, 0.02, 0.226);
    this.leftEyelid.rotation.y = -0.15;
    this.leftEyelid.scale.set(1, 0.001, 1); // Open by default

    this.rightEyelid = new THREE.Mesh(eyelidGeom, eyelidMat);
    this.rightEyelid.position.set(0.088, 0.02, 0.226);
    this.rightEyelid.rotation.y = 0.15;
    this.rightEyelid.scale.set(1, 0.001, 1);

    this.headGroup.add(this.leftEyelid, this.rightEyelid);

    // Blush Stickers
    const blushGeom = new THREE.PlaneGeometry(0.065, 0.035);
    const blushL = new THREE.Mesh(blushGeom, blushMaterial);
    blushL.position.set(-0.115, -0.06, 0.208);
    blushL.rotation.y = -0.25;

    const blushR = new THREE.Mesh(blushGeom, blushMaterial);
    blushR.position.set(0.115, -0.06, 0.208);
    blushR.rotation.y = 0.25;
    this.headGroup.add(blushL, blushR);

    // Cute stylized Nose
    const noseGeom = new THREE.ConeGeometry(0.012, 0.025, 8);
    const noseMesh = new THREE.Mesh(noseGeom, skinMaterial);
    noseMesh.position.set(0, -0.02, 0.24);
    noseMesh.rotation.x = Math.PI * 0.45;
    this.headGroup.add(noseMesh);

    // Dynamic Lip-Sync Mouth
    const mouthGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.008, 16);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
    this.mouthMesh = new THREE.Mesh(mouthGeom, mouthMat);
    this.mouthMesh.position.set(0, -0.105, 0.218);
    this.mouthMesh.rotation.x = Math.PI * 0.5;
    this.mouthMesh.scale.set(0.8, 0.3, 0.8);
    this.headGroup.add(this.mouthMesh);

    // Eyebrows
    const browGeom = new THREE.BoxGeometry(0.07, 0.008, 0.01);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x4a154b });
    const browL = new THREE.Mesh(browGeom, browMat);
    browL.position.set(-0.09, 0.105, 0.22);
    browL.rotation.z = 0.08;
    const browR = new THREE.Mesh(browGeom, browMat);
    browR.position.set(0.09, 0.105, 0.22);
    browR.rotation.z = -0.08;
    this.headGroup.add(browL, browR);

    // 3. Cyber Cat-Ear Audio Headset
    const headsetBandGeom = new THREE.TorusGeometry(0.245, 0.018, 12, 24, Math.PI);
    const headsetMat = outfitDarkMaterial;
    const headsetBand = new THREE.Mesh(headsetBandGeom, headsetMat);
    headsetBand.rotation.x = -Math.PI * 0.5;
    headsetBand.position.set(0, 0.05, 0);
    this.headGroup.add(headsetBand);

    // Earcups
    const earcupGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16);
    const earcupL = new THREE.Mesh(earcupGeom, headsetMat);
    earcupL.position.set(-0.25, 0.02, 0);
    earcupL.rotation.z = Math.PI * 0.5;

    const earcupR = earcupL.clone();
    earcupR.position.set(0.25, 0.02, 0);
    this.headGroup.add(earcupL, earcupR);

    // Glowing Cat Ears on Headset
    const catEarGeom = new THREE.ConeGeometry(0.065, 0.12, 4);
    catEarGeom.scale(1, 1, 0.5);

    const catEarL = new THREE.Mesh(catEarGeom, headsetMat);
    catEarL.position.set(-0.16, 0.26, 0.02);
    catEarL.rotation.z = 0.35;

    const catEarR = new THREE.Mesh(catEarGeom, headsetMat);
    catEarR.position.set(0.16, 0.26, 0.02);
    catEarR.rotation.z = -0.35;
    this.headGroup.add(catEarL, catEarR);

    // Glowing inner ear strips
    const glowStripGeom = new THREE.PlaneGeometry(0.035, 0.07);
    this.headsetGlowL = new THREE.Mesh(glowStripGeom, this.cyberGlowMaterial);
    this.headsetGlowL.position.set(-0.155, 0.255, 0.05);
    this.headsetGlowL.rotation.z = 0.35;

    this.headsetGlowR = new THREE.Mesh(glowStripGeom, this.cyberGlowMaterial);
    this.headsetGlowR.position.set(0.155, 0.255, 0.05);
    this.headsetGlowR.rotation.z = -0.35;
    this.headGroup.add(this.headsetGlowL, this.headsetGlowR);

    // 4. Anime Hair Assembly
    // Bangs & Forehead Fringe
    const bangGeom = new THREE.ConeGeometry(0.04, 0.18, 4);
    bangGeom.scale(1, 1, 0.35);

    for (let i = -3; i <= 3; i++) {
      const strand = new THREE.Mesh(bangGeom, this.hairMaterial);
      const angle = (i / 3) * 0.45;
      strand.position.set(Math.sin(angle) * 0.21, 0.14 - Math.abs(i) * 0.015, Math.cos(angle) * 0.21);
      strand.rotation.x = -Math.PI * 0.95;
      strand.rotation.z = -angle * 0.8;
      this.headGroup.add(strand);
    }

    // Side locks framing cheeks
    const sideLockGeom = new THREE.ConeGeometry(0.05, 0.32, 4);
    sideLockGeom.scale(1, 1, 0.3);
    const sideLockL = new THREE.Mesh(sideLockGeom, this.hairMaterial);
    sideLockL.position.set(-0.21, -0.05, 0.12);
    sideLockL.rotation.x = -Math.PI * 0.9;
    sideLockL.rotation.z = 0.15;

    const sideLockR = new THREE.Mesh(sideLockGeom, this.hairMaterial);
    sideLockR.position.set(0.21, -0.05, 0.12);
    sideLockR.rotation.x = -Math.PI * 0.9;
    sideLockR.rotation.z = -0.15;
    this.headGroup.add(sideLockL, sideLockR);

    // Twin Anime Cyber Pigtails
    this.hairPigtailLeft = new THREE.Group();
    this.hairPigtailLeft.position.set(-0.22, 0.16, -0.08);

    this.hairPigtailRight = new THREE.Group();
    this.hairPigtailRight.position.set(0.22, 0.16, -0.08);

    // Multi-segment swaying locks
    const createPigtailMesh = (isLeft: boolean) => {
      const tailGroup = new THREE.Group();
      // Upper segment
      const seg1Geom = new THREE.CylinderGeometry(0.04, 0.055, 0.28, 8);
      const seg1 = new THREE.Mesh(seg1Geom, this.hairMaterial);
      seg1.position.y = -0.14;
      seg1.rotation.z = isLeft ? 0.3 : -0.3;
      tailGroup.add(seg1);

      // Lower segment (tapered)
      const seg2Geom = new THREE.ConeGeometry(0.055, 0.35, 8);
      const seg2 = new THREE.Mesh(seg2Geom, this.hairMaterial);
      seg2.position.set(isLeft ? -0.06 : 0.06, -0.42, 0);
      seg2.rotation.x = Math.PI;
      seg2.rotation.z = isLeft ? 0.2 : -0.2;
      tailGroup.add(seg2);

      // Cyber Hair Ring Ribbon
      const ringGeom = new THREE.TorusGeometry(0.048, 0.012, 8, 16);
      const ring = new THREE.Mesh(ringGeom, this.outfitAccentMaterial);
      tailGroup.add(ring);

      return tailGroup;
    };

    this.hairPigtailLeft.add(createPigtailMesh(true));
    this.hairPigtailRight.add(createPigtailMesh(false));
    this.headGroup.add(this.hairPigtailLeft, this.hairPigtailRight);

    this.group.add(this.headGroup);

    // 5. Torso / Upper Body
    this.chestGroup = new THREE.Group();
    this.chestGroup.position.set(0, 1.05, 0);

    // Neck
    const neckGeom = new THREE.CylinderGeometry(0.07, 0.08, 0.15, 16);
    const neckMesh = new THREE.Mesh(neckGeom, skinMaterial);
    neckMesh.position.set(0, 0.26, 0);
    this.chestGroup.add(neckMesh);

    // Cyber Choker with Glowing Pendant
    const chokerGeom = new THREE.CylinderGeometry(0.075, 0.075, 0.03, 16);
    const chokerMesh = new THREE.Mesh(chokerGeom, outfitDarkMaterial);
    chokerMesh.position.set(0, 0.25, 0);
    this.chestGroup.add(chokerMesh);

    const pendantGeom = new THREE.BoxGeometry(0.025, 0.025, 0.015);
    this.chokerGlow = new THREE.Mesh(pendantGeom, this.cyberGlowMaterial);
    this.chokerGlow.position.set(0, 0.25, 0.08);
    this.chestGroup.add(this.chokerGlow);

    // Cropped Cyber Jacket
    const jacketGeom = new THREE.CylinderGeometry(0.18, 0.15, 0.32, 16);
    jacketGeom.scale(1.15, 1, 0.85);
    const jacketMesh = new THREE.Mesh(jacketGeom, outfitDarkMaterial);
    jacketMesh.position.set(0, 0.06, 0);
    jacketMesh.castShadow = true;
    this.chestGroup.add(jacketMesh);

    // Lapel Trim Accent
    const lapelGeom = new THREE.BoxGeometry(0.05, 0.25, 0.02);
    const lapelL = new THREE.Mesh(lapelGeom, this.outfitAccentMaterial);
    lapelL.position.set(-0.06, 0.08, 0.14);
    lapelL.rotation.z = -0.18;

    const lapelR = new THREE.Mesh(lapelGeom, this.outfitAccentMaterial);
    lapelR.position.set(0.06, 0.08, 0.14);
    lapelR.rotation.z = 0.18;
    this.chestGroup.add(lapelL, lapelR);

    // Undershirt with cyber cleavage line
    const shirtGeom = new THREE.CylinderGeometry(0.14, 0.13, 0.2, 16);
    shirtGeom.scale(1.05, 1, 0.8);
    const shirtMesh = new THREE.Mesh(shirtGeom, outfitWhiteMaterial);
    shirtMesh.position.set(0, 0.08, 0.02);
    this.chestGroup.add(shirtMesh);

    this.group.add(this.chestGroup);

    // 6. Arms & Hands
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.24, 1.2, 0);

    const shoulderGeom = new THREE.SphereGeometry(0.065, 12, 12);
    const shoulderL = new THREE.Mesh(shoulderGeom, outfitDarkMaterial);
    this.leftArmGroup.add(shoulderL);

    // Upper arm + forearm
    const armGeom = new THREE.CylinderGeometry(0.045, 0.038, 0.35, 12);
    const armL = new THREE.Mesh(armGeom, skinMaterial);
    armL.position.set(0, -0.18, 0);
    this.leftArmGroup.add(armL);

    // Cyber cuff
    const cuffGeom = new THREE.CylinderGeometry(0.048, 0.048, 0.06, 12);
    const cuffL = new THREE.Mesh(cuffGeom, this.outfitAccentMaterial);
    cuffL.position.set(0, -0.28, 0);
    this.leftArmGroup.add(cuffL);

    // Hand
    const handGeom = new THREE.SphereGeometry(0.038, 8, 8);
    handGeom.scale(0.8, 1.2, 0.6);
    const handL = new THREE.Mesh(handGeom, skinMaterial);
    handL.position.set(0, -0.38, 0);
    this.leftArmGroup.add(handL);

    this.leftArmGroup.rotation.z = 0.25;
    this.leftArmGroup.rotation.x = 0.1;
    this.group.add(this.leftArmGroup);

    // Right Arm (Posed playfully toward face/chest)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.24, 1.2, 0);

    const shoulderR = shoulderL.clone();
    this.rightArmGroup.add(shoulderR);

    const armR = armL.clone();
    this.rightArmGroup.add(armR);

    const cuffR = cuffL.clone();
    this.rightArmGroup.add(cuffR);

    const handR = handL.clone();
    this.rightArmGroup.add(handR);

    this.rightArmGroup.rotation.z = -0.35;
    this.rightArmGroup.rotation.x = -0.25;
    this.group.add(this.rightArmGroup);

    // 7. Lower Body / Pleated Cyber Skirt & Legs
    const skirtGeom = new THREE.ConeGeometry(0.32, 0.22, 16, 1, true);
    skirtGeom.scale(1.15, 1, 0.9);
    const skirtMesh = new THREE.Mesh(skirtGeom, outfitDarkMaterial);
    skirtMesh.position.set(0, 0.85, 0);
    skirtMesh.rotation.x = Math.PI;
    this.group.add(skirtMesh);

    // Skirt Hem Neon Strip
    const skirtHemGeom = new THREE.TorusGeometry(0.325, 0.01, 8, 24);
    skirtHemGeom.scale(1.15, 1, 0.9);
    const skirtHem = new THREE.Mesh(skirtHemGeom, this.cyberGlowMaterial);
    skirtHem.position.set(0, 0.74, 0);
    skirtHem.rotation.x = Math.PI * 0.5;
    this.group.add(skirtHem);

    // Legs
    const legGeom = new THREE.CylinderGeometry(0.055, 0.042, 0.72, 12);
    const legL = new THREE.Mesh(legGeom, skinMaterial);
    legL.position.set(-0.11, 0.38, 0);
    legL.castShadow = true;

    const legR = new THREE.Mesh(legGeom, skinMaterial);
    legR.position.set(0.11, 0.38, 0);
    legR.castShadow = true;
    this.group.add(legL, legR);

    // Thigh-high cyber boots
    const bootGeom = new THREE.CylinderGeometry(0.058, 0.05, 0.45, 12);
    const bootL = new THREE.Mesh(bootGeom, outfitDarkMaterial);
    bootL.position.set(-0.11, 0.24, 0);

    const bootR = new THREE.Mesh(bootGeom, outfitDarkMaterial);
    bootR.position.set(0.11, 0.24, 0);
    this.group.add(bootL, bootR);

    // 8. Ground Contact Shadow & Holographic Floor Emitter
    const shadowTex = createContactShadowTexture();
    const shadowGeom = new THREE.PlaneGeometry(1.2, 1.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeom, shadowMat);
    contactShadow.rotation.x = -Math.PI * 0.5;
    contactShadow.position.y = 0.01;
    this.group.add(contactShadow);

    // Holographic Pedestal Ring
    const ringTex = createPedestalRingTexture(primaryColorHex);
    const ringGeom = new THREE.PlaneGeometry(1.6, 1.6);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    this.pedestalRing = new THREE.Mesh(ringGeom, ringMat);
    this.pedestalRing.rotation.x = -Math.PI * 0.5;
    this.pedestalRing.position.y = 0.02;
    this.group.add(this.pedestalRing);
  }

  /**
   * Updates animations per frame based on time, audio, and state
   */
  public update(
    deltaTime: number,
    elapsedTime: number,
    audioVolume: number,
    state: ConnectionState,
    reaction: ReactionData | null
  ): void {
    // 1. Natural Posture (Chest completely still)
    this.chestGroup.position.y = 1.05;
    this.chestGroup.scale.set(1, 1, 1);

    // 2. Head Tilt & Inquisitive Micro-movements
    let targetHeadRotY = Math.sin(elapsedTime * 0.8) * 0.08;
    let targetHeadRotX = Math.cos(elapsedTime * 0.6) * 0.04;
    let targetHeadRotZ = Math.sin(elapsedTime * 0.5) * 0.03;

    if (state === 'listening') {
      // Attentive tilt when listening to user
      targetHeadRotZ += 0.06;
      targetHeadRotX += 0.04;
    } else if (state === 'speaking') {
      // Animated head nods and cadence with speech rhythm
      targetHeadRotX += Math.sin(elapsedTime * 6.0) * (0.04 + audioVolume * 0.06);
      targetHeadRotY += Math.cos(elapsedTime * 3.5) * 0.08;
    }

    if (reaction) {
      if (reaction.type === 'wink' || reaction.type === 'smirk') {
        targetHeadRotZ -= 0.12;
      } else if (reaction.type === 'laugh') {
        targetHeadRotX -= 0.1;
      }
    }

    this.headGroup.rotation.y += (targetHeadRotY - this.headGroup.rotation.y) * 0.1;
    this.headGroup.rotation.x += (targetHeadRotX - this.headGroup.rotation.x) * 0.1;
    this.headGroup.rotation.z += (targetHeadRotZ - this.headGroup.rotation.z) * 0.1;

    // 3. Dynamic Hair Physics & Swaying
    const hairSway = Math.sin(elapsedTime * 2.5) * 0.08 + (state === 'speaking' ? Math.sin(elapsedTime * 5.0) * audioVolume * 0.15 : 0);
    this.hairPigtailLeft.rotation.z = hairSway;
    this.hairPigtailRight.rotation.z = -hairSway;

    // 4. Lip-sync mouth morphing with Live Speech Audio
    if (state === 'speaking') {
      const targetMouthOpen = Math.min(1.8, Math.max(0.2, audioVolume * 3.8));
      this.currentLipSync += (targetMouthOpen - this.currentLipSync) * 0.35;
      this.mouthMesh.scale.set(
        0.8 + audioVolume * 0.4,
        this.currentLipSync * 0.8 + 0.1,
        0.8
      );
    } else {
      this.mouthMesh.scale.set(0.8, 0.15, 0.8);
    }

    // 5. Procedural Eye Blinking
    this.blinkTimer += deltaTime;
    if (!this.isBlinking && this.blinkTimer > 3.2 + Math.sin(elapsedTime * 1.5) * 1.2) {
      this.isBlinking = true;
      this.blinkTimer = 0;
    }

    if (this.isBlinking) {
      // Fast closed-and-open
      const blinkProgress = this.blinkTimer / this.blinkDuration;
      if (blinkProgress >= 1) {
        this.isBlinking = false;
        this.blinkTimer = 0;
        this.leftEyelid.scale.y = 0.001;
        this.rightEyelid.scale.y = 0.001;
      } else {
        const lidHeight = Math.sin(blinkProgress * Math.PI);
        this.leftEyelid.scale.y = Math.max(0.001, lidHeight);
        // If winking, only close left eye!
        const isWink = reaction?.type === 'wink';
        this.rightEyelid.scale.y = isWink ? 0.001 : Math.max(0.001, lidHeight);
      }
    }

    // 6. Arm & Gesture Movements
    if (state === 'speaking') {
      this.rightArmGroup.rotation.x = -0.25 + Math.sin(elapsedTime * 4.0) * 0.12 * (1 + audioVolume);
      this.rightArmGroup.rotation.y = Math.cos(elapsedTime * 3.0) * 0.1;
      this.leftArmGroup.rotation.z = 0.25 + Math.sin(elapsedTime * 2.0) * 0.06;
    } else {
      this.rightArmGroup.rotation.x = -0.25 + Math.sin(elapsedTime * 1.2) * 0.03;
      this.leftArmGroup.rotation.z = 0.25 + Math.cos(elapsedTime * 1.2) * 0.03;
    }

    // 7. Rotating Holographic Pedestal
    if (this.pedestalRing) {
      this.pedestalRing.rotation.z += deltaTime * (state === 'speaking' ? 0.8 : 0.3);
    }

    // 8. Headset Emissive Pulse
    const pulseFactor = 0.6 + Math.sin(elapsedTime * 5.0) * 0.3 + audioVolume * 0.5;
    this.cyberGlowMaterial.opacity = Math.min(1, pulseFactor);
  }

  /**
   * Updates colors according to active visual aesthetic theme
   */
  public updateTheme(primaryColorHex: string): void {
    const col = new THREE.Color(primaryColorHex);
    this.cyberGlowMaterial.color.copy(col);
    this.outfitAccentMaterial.color.copy(col);
    this.outfitAccentMaterial.emissive.copy(col);

    // Regenerate eye textures with new iris color
    if (this.leftEyeMesh.material instanceof THREE.MeshBasicMaterial) {
      this.leftEyeMesh.material.map = createAnimeEyeTexture(false, primaryColorHex);
    }
    if (this.rightEyeMesh.material instanceof THREE.MeshBasicMaterial) {
      this.rightEyeMesh.material.map = createAnimeEyeTexture(true, primaryColorHex);
    }
    if (this.pedestalRing.material instanceof THREE.MeshBasicMaterial) {
      this.pedestalRing.material.map = createPedestalRingTexture(primaryColorHex);
    }
  }

  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }
}
