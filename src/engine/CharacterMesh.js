import * as THREE from 'three';

/**
 * Stylized Humanoid / Roblox-style 3D Bowler Character Mesh
 * Articulated R15 smooth box/capsule anatomical joints:
 * - Head with facial expression, customizable hair & cap
 * - Torso with athletic bowling jersey, collar, and team number
 * - Articulated Arms (Shoulder, Upper Arm, Forearm, Hands)
 * - Articulated Legs (Hips, Thighs, Shins, Bowling Shoes)
 * - Kinetic 4-Phase Bowling Animation (Stance -> Backswing -> Slide & Release -> Follow-through)
 */
export class CharacterMesh {
  constructor(style = {}) {
    this.group = new THREE.Group();

    // Customizable style tokens
    this.skinColor = style.skinColor || '#f8d7b8';
    this.hairStyle = style.hairStyle || 'spiky';
    this.hairColor = style.hairColor || '#1e1b4b';
    this.outfitColor = style.outfitColor || '#00f5ff';
    this.pantsColor = style.pantsColor || '#1e1b4b';
    this.jerseyNumber = style.jerseyNumber || '10';

    // Animation state
    this.animPhase = 'IDLE'; // 'IDLE' | 'BACKSWING' | 'SLIDE_RELEASE' | 'FOLLOW_THROUGH' | 'CELEBRATE'
    this.animTime = 0;
    this.animDuration = 1.0;
    this.onReleaseCallback = null;
    this.isReleased = false;

    this._buildHumanoidMesh();
  }

  _buildHumanoidMesh() {
    // Clear existing
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    const skinMat = new THREE.MeshStandardMaterial({
      color: this.skinColor,
      roughness: 0.35,
      metalness: 0.05
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: this.hairColor,
      roughness: 0.5
    });

    const jerseyMat = this._createJerseyMaterial(this.outfitColor, this.jerseyNumber);
    const pantsMat = new THREE.MeshStandardMaterial({
      color: this.pantsColor,
      roughness: 0.6
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.1
    });

    const soleMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.5
    });

    // --- ROOT / PELVIS (Hips) ---
    this.hips = new THREE.Group();
    this.hips.position.set(0, 0.72, 0);

    const pelvisGeo = new THREE.BoxGeometry(0.32, 0.14, 0.22);
    const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvis.castShadow = true;
    this.hips.add(pelvis);

    // --- TORSO (Chest & Upper Body) ---
    this.torso = new THREE.Group();
    this.torso.position.set(0, 0.18, 0);

    const torsoGeo = new THREE.BoxGeometry(0.36, 0.38, 0.24);
    const torsoMesh = new THREE.Mesh(torsoGeo, jerseyMat);
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);

    // Collar / Neck
    const neckGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.08, 12);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 0.23, 0);
    this.torso.add(neck);

    // --- HEAD & FACE ---
    this.head = new THREE.Group();
    this.head.position.set(0, 0.34, 0);

    const headGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Stylized Expressive Face Canvas Texture
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 256; faceCanvas.height = 256;
    const fCtx = faceCanvas.getContext('2d');
    fCtx.fillStyle = this.skinColor; fCtx.fillRect(0, 0, 256, 256);

    // Eyes
    fCtx.fillStyle = '#111827';
    fCtx.beginPath(); fCtx.arc(80, 110, 14, 0, Math.PI * 2); fCtx.fill();
    fCtx.beginPath(); fCtx.arc(176, 110, 14, 0, Math.PI * 2); fCtx.fill();
    // Eye shines
    fCtx.fillStyle = '#ffffff';
    fCtx.beginPath(); fCtx.arc(75, 105, 5, 0, Math.PI * 2); fCtx.fill();
    fCtx.beginPath(); fCtx.arc(171, 105, 5, 0, Math.PI * 2); fCtx.fill();

    // Eyebrows
    fCtx.strokeStyle = '#374151'; fCtx.lineWidth = 6; fCtx.lineCap = 'round';
    fCtx.beginPath(); fCtx.moveTo(65, 85); fCtx.lineTo(98, 88); fCtx.stroke();
    fCtx.beginPath(); fCtx.moveTo(158, 88); fCtx.lineTo(191, 85); fCtx.stroke();

    // Confident Gamer Smile
    fCtx.strokeStyle = '#dc2626'; fCtx.lineWidth = 5;
    fCtx.beginPath(); fCtx.arc(128, 155, 24, 0.15 * Math.PI, 0.85 * Math.PI, false); fCtx.stroke();

    const faceTex = new THREE.CanvasTexture(faceCanvas);
    const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.35 });
    const facePlate = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.25), faceMat);
    facePlate.position.set(0, 0, 0.122);
    this.head.add(facePlate);

    // Hair / Cap
    const capGeo = new THREE.BoxGeometry(0.26, 0.10, 0.28);
    const cap = new THREE.Mesh(capGeo, hairMat);
    cap.position.set(0, 0.12, -0.01);
    this.head.add(cap);

    const visorGeo = new THREE.BoxGeometry(0.24, 0.025, 0.12);
    const visor = new THREE.Mesh(visorGeo, hairMat);
    visor.position.set(0, 0.08, 0.18);
    this.head.add(visor);

    this.torso.add(this.head);

    // --- RIGHT ARM (Throwing Arm) ---
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.25, 0.14, 0);

    const rUpperGeo = new THREE.BoxGeometry(0.12, 0.22, 0.12);
    const rUpper = new THREE.Mesh(rUpperGeo, jerseyMat);
    rUpper.position.set(0, -0.11, 0);
    rUpper.castShadow = true;
    this.rightShoulder.add(rUpper);

    this.rightElbow = new THREE.Group();
    this.rightElbow.position.set(0, -0.22, 0);

    const rForearmGeo = new THREE.BoxGeometry(0.10, 0.20, 0.10);
    const rForearm = new THREE.Mesh(rForearmGeo, skinMat);
    rForearm.position.set(0, -0.10, 0);
    rForearm.castShadow = true;
    this.rightElbow.add(rForearm);

    // Right Hand
    const rHandGeo = new THREE.BoxGeometry(0.10, 0.10, 0.10);
    const rHand = new THREE.Mesh(rHandGeo, skinMat);
    rHand.position.set(0, -0.22, 0);
    this.rightElbow.add(rHand);

    this.rightShoulder.add(this.rightElbow);
    this.torso.add(this.rightShoulder);

    // --- LEFT ARM (Balance Arm) ---
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.25, 0.14, 0);

    const lUpperGeo = new THREE.BoxGeometry(0.12, 0.22, 0.12);
    const lUpper = new THREE.Mesh(lUpperGeo, jerseyMat);
    lUpper.position.set(0, -0.11, 0);
    lUpper.castShadow = true;
    this.leftShoulder.add(lUpper);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.set(0, -0.22, 0);

    const lForearmGeo = new THREE.BoxGeometry(0.10, 0.20, 0.10);
    const lForearm = new THREE.Mesh(lForearmGeo, skinMat);
    lForearm.position.set(0, -0.10, 0);
    lForearm.castShadow = true;
    this.leftElbow.add(lForearm);

    const lHandGeo = new THREE.BoxGeometry(0.10, 0.10, 0.10);
    const lHand = new THREE.Mesh(lHandGeo, skinMat);
    lHand.position.set(0, -0.22, 0);
    this.leftElbow.add(lHand);

    this.leftShoulder.add(this.leftElbow);
    this.torso.add(this.leftShoulder);

    this.hips.add(this.torso);

    // --- LEFT LEG (Sliding Lead Leg) ---
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.10, -0.07, 0);

    const lThighGeo = new THREE.BoxGeometry(0.13, 0.28, 0.14);
    const lThigh = new THREE.Mesh(lThighGeo, pantsMat);
    lThigh.position.set(0, -0.14, 0);
    lThigh.castShadow = true;
    this.leftHip.add(lThigh);

    this.leftKnee = new THREE.Group();
    this.leftKnee.position.set(0, -0.28, 0);

    const lShinGeo = new THREE.BoxGeometry(0.12, 0.28, 0.13);
    const lShin = new THREE.Mesh(lShinGeo, pantsMat);
    lShin.position.set(0, -0.14, 0);
    lShin.castShadow = true;
    this.leftKnee.add(lShin);

    // Left Bowling Shoe (White with red slide sole)
    const lShoeGeo = new THREE.BoxGeometry(0.13, 0.10, 0.24);
    const lShoe = new THREE.Mesh(lShoeGeo, shoeMat);
    lShoe.position.set(0, -0.28, 0.05);
    lShoe.castShadow = true;
    this.leftKnee.add(lShoe);

    const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.24), soleMat);
    lSole.position.set(0, -0.33, 0.05);
    this.leftKnee.add(lSole);

    this.leftHip.add(this.leftKnee);
    this.hips.add(this.leftHip);

    // --- RIGHT LEG (Trailing Leg) ---
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.10, -0.07, 0);

    const rThighGeo = new THREE.BoxGeometry(0.13, 0.28, 0.14);
    const rThigh = new THREE.Mesh(rThighGeo, pantsMat);
    rThigh.position.set(0, -0.14, 0);
    rThigh.castShadow = true;
    this.rightHip.add(rThigh);

    this.rightKnee = new THREE.Group();
    this.rightKnee.position.set(0, -0.28, 0);

    const rShinGeo = new THREE.BoxGeometry(0.12, 0.28, 0.13);
    const rShin = new THREE.Mesh(rShinGeo, pantsMat);
    rShin.position.set(0, -0.14, 0);
    rShin.castShadow = true;
    this.rightKnee.add(rShin);

    // Right Bowling Shoe
    const rShoeGeo = new THREE.BoxGeometry(0.13, 0.10, 0.24);
    const rShoe = new THREE.Mesh(rShoeGeo, shoeMat);
    rShoe.position.set(0, -0.28, 0.05);
    rShoe.castShadow = true;
    this.rightKnee.add(rShoe);

    const rSole = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.24), soleMat);
    rSole.position.set(0, -0.33, 0.05);
    this.rightKnee.add(rSole);

    this.rightHip.add(this.rightKnee);
    this.hips.add(this.rightHip);

    this.group.add(this.hips);

    // Initial position on the approach
    this.group.position.set(0, 0, -2.1);
  }

  _createJerseyMaterial(colorHex, numberStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colorHex; ctx.fillRect(0, 0, 256, 256);

    // Black & white athletic side stripes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 36, 256);
    ctx.fillRect(220, 0, 36, 256);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(36, 0, 10, 256);
    ctx.fillRect(210, 0, 10, 256);

    // Team Number & Star on chest
    ctx.font = '900 100px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000'; ctx.shadowBlur = 10;
    ctx.fillText(numberStr, 128, 155);

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('★ BOWLER ★', 128, 65);

    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.3,
      metalness: 0.15
    });
  }

  setIdlePose(ballX = 0) {
    this.animPhase = 'IDLE';
    this.animTime = 0;
    this.isReleased = false;

    this.group.position.set(ballX * 0.7 + 0.32, 0, -1.9);
    this.hips.position.set(0, 0.72, 0);
    this.hips.rotation.set(0, 0, 0);
    this.torso.rotation.set(0.08, 0, 0);
    this.head.rotation.set(-0.04, 0, 0);

    // Ready stance: Holding ball in front
    this.rightShoulder.rotation.set(0.65, -0.2, 0.1);
    this.rightElbow.rotation.set(1.15, 0, 0);

    this.leftShoulder.rotation.set(0.55, 0.25, -0.1);
    this.leftElbow.rotation.set(1.05, 0, 0);

    this.leftHip.rotation.set(0, 0, 0);
    this.leftKnee.rotation.set(0, 0, 0);
    this.rightHip.rotation.set(0, 0, 0);
    this.rightKnee.rotation.set(0, 0, 0);
  }

  startThrowAnimation(onRelease) {
    this.triggerThrowAnimation(1.0, onRelease);
  }

  triggerThrowAnimation(power = 1.0, onRelease) {
    this.animPhase = 'BACKSWING';
    this.animTime = 0;
    this.animDuration = Math.max(0.45, 0.75 - power * 0.2);
    this.onReleaseCallback = onRelease;
    this.isReleased = false;
  }

  updateCustomization(newStyle) {
    this.updateStyle(newStyle);
  }

  triggerCelebrate() {
    this.animPhase = 'CELEBRATE';
    this.animTime = 0;
    this.animDuration = 1.6;
  }

  setWalking(isWalking) {
    if (isWalking) {
      this.animPhase = 'WALKING';
    } else if (this.animPhase === 'WALKING') {
      this.animPhase = 'IDLE';
      this.leftHip.rotation.set(0, 0, 0);
      this.rightHip.rotation.set(0, 0, 0);
      this.leftKnee.rotation.set(0, 0, 0);
      this.rightKnee.rotation.set(0, 0, 0);
      this.leftShoulder.rotation.set(0.2, 0, 0);
      this.rightShoulder.rotation.set(0.2, 0, 0);
      this.hips.position.y = 0.72;
    }
  }

  setSitting(isSitting) {
    if (isSitting) {
      this.animPhase = 'SITTING';
      this.hips.position.y = 0.42;
      this.leftHip.rotation.set(-Math.PI / 2, 0, 0);
      this.leftKnee.rotation.set(Math.PI / 2, 0, 0);
      this.rightHip.rotation.set(-Math.PI / 2, 0, 0);
      this.rightKnee.rotation.set(Math.PI / 2, 0, 0);
      this.leftShoulder.rotation.set(0.3, 0, -0.2);
      this.rightShoulder.rotation.set(0.3, 0, 0.2);
    } else if (this.animPhase === 'SITTING') {
      this.animPhase = 'IDLE';
      this.hips.position.y = 0.72;
      this.leftHip.rotation.set(0, 0, 0);
      this.rightHip.rotation.set(0, 0, 0);
      this.leftKnee.rotation.set(0, 0, 0);
      this.rightKnee.rotation.set(0, 0, 0);
    }
  }

  update(deltaTime) {
    if (this.animPhase === 'IDLE' || this.animPhase === 'SITTING') return;

    this.animTime += deltaTime;

    if (this.animPhase === 'WALKING') {
      // Natural walking swing
      const walkFreq = 7.5;
      const swing = Math.sin(this.animTime * walkFreq);
      this.leftHip.rotation.x = swing * 0.55;
      this.rightHip.rotation.x = -swing * 0.55;

      this.leftKnee.rotation.x = Math.max(0, -swing * 0.45);
      this.rightKnee.rotation.x = Math.max(0, swing * 0.45);

      this.leftShoulder.rotation.x = -swing * 0.45;
      this.rightShoulder.rotation.x = swing * 0.45;

      this.hips.position.y = 0.72 + Math.abs(Math.sin(this.animTime * walkFreq * 2)) * 0.03;
      return;
    }

    if (this.animPhase === 'CELEBRATE') {
      // Jump and pump fists
      const progress = this.animTime / this.animDuration;
      const jumpHeight = Math.abs(Math.sin(progress * Math.PI * 4)) * 0.25;
      this.hips.position.y = 0.72 + jumpHeight;

      this.rightShoulder.rotation.set(2.4, 0, -0.3);
      this.leftShoulder.rotation.set(2.4, 0, 0.3);
      this.rightElbow.rotation.set(0.6, 0, 0);
      this.leftElbow.rotation.set(0.6, 0, 0);

      if (progress >= 1.0) {
        this.animPhase = 'IDLE';
        this.setIdlePose(0);
      }
      return;
    }

    const progress = Math.min(1.0, this.animTime / this.animDuration);

    if (this.animPhase === 'BACKSWING') {
      // Phase 1: High Pendulum Backswing & Stride
      const t = progress;
      this.hips.position.z = -t * 0.35;
      this.hips.position.y = 0.72 - t * 0.12;
      this.torso.rotation.x = 0.08 + t * 0.32;

      // Right arm swings high backwards
      this.rightShoulder.rotation.x = 0.65 - t * 2.2;
      this.rightShoulder.rotation.z = -t * 0.25;
      this.rightElbow.rotation.x = Math.max(0.1, 1.15 - t * 1.0);

      // Left arm opens wide for balance
      this.leftShoulder.rotation.x = 0.55 - t * 0.75;
      this.leftShoulder.rotation.z = -0.1 - t * 0.95;

      // Right leg steps back, Left leg prepares to slide
      this.rightHip.rotation.x = t * 0.45;
      this.leftHip.rotation.x = -t * 0.35;

      if (progress >= 1.0) {
        this.animPhase = 'SLIDE_RELEASE';
        this.animTime = 0;
        this.animDuration = 0.38;
      }
    } else if (this.animPhase === 'SLIDE_RELEASE') {
      // Phase 2: Athletic Deep Slide & Ball Release
      const t = progress;
      this.hips.position.z = -0.35 + t * 1.15; // Slide forward towards foul line
      this.hips.position.y = 0.60 - Math.sin(t * Math.PI * 0.5) * 0.22; // Deep knee bend

      this.torso.rotation.x = 0.40 + t * 0.15;
      this.torso.rotation.y = -t * 0.2; // Slight shoulder rotation

      // Right arm whips forward & down to release
      this.rightShoulder.rotation.x = -1.55 + t * 2.8;
      this.rightShoulder.rotation.z = -0.25 + t * 0.25;
      this.rightElbow.rotation.x = 0.15;

      // Deep Left Leg Slide
      this.leftHip.rotation.x = -0.35 - t * 0.55;
      this.leftKnee.rotation.x = t * 0.85;

      // Right leg trails behind cross-body
      this.rightHip.rotation.x = 0.45 + t * 0.75;
      this.rightHip.rotation.z = t * 0.35;
      this.rightKnee.rotation.x = t * 0.65;

      // Trigger actual ball physics release at bottom of arm swing
      if (t >= 0.75 && !this.isReleased) {
        this.isReleased = true;
        if (this.onReleaseCallback) {
          this.onReleaseCallback();
        }
      }

      if (progress >= 1.0) {
        this.animPhase = 'FOLLOW_THROUGH';
        this.animTime = 0;
        this.animDuration = 0.55;
      }
    } else if (this.animPhase === 'FOLLOW_THROUGH') {
      // Phase 3: High Follow-through Hold
      const t = progress;
      this.torso.rotation.x = 0.55 - t * 0.2;

      // Right arm high in the air
      this.rightShoulder.rotation.x = 1.25 + t * 0.65;
      this.rightShoulder.rotation.y = -0.15;
      this.rightElbow.rotation.x = 0.15 + t * 0.45;

      if (progress >= 1.0) {
        this.animPhase = 'IDLE';
      }
    }
  }

  updateStyle(newStyle) {
    if (newStyle.skinColor) this.skinColor = newStyle.skinColor;
    if (newStyle.hairStyle) this.hairStyle = newStyle.hairStyle;
    if (newStyle.hairColor) this.hairColor = newStyle.hairColor;
    if (newStyle.outfitColor) this.outfitColor = newStyle.outfitColor;
    if (newStyle.pantsColor) this.pantsColor = newStyle.pantsColor;
    if (newStyle.jerseyNumber) this.jerseyNumber = newStyle.jerseyNumber;
    this._buildHumanoidMesh();
  }
}
