import * as THREE from 'three';
import { LANE_CONFIG, BALL_SKINS, PIN_POSITIONS } from '../types/bowling';
import { CharacterMesh } from './CharacterMesh';

export class BowlingScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.physics = null;

    // 3D Meshes
    this.ballMesh = null;
    this.ballTrail = null;
    this.pinMeshes = new Map();
    this.sweeperArm = null;

    // Humanoid Bowler Characters
    this.bowlerCharacter = null;
    this.otherCharacters = new Map();

    // Aim Guide
    this.aimDots = [];

    // Camera state
    this.cameraMode = 'APPROACH'; // 'APPROACH' | 'FOLLOW' | 'PIN_VIEW' | 'SIDE' | 'OVERHEAD' | 'LOUNGE'
    this.targetCameraPos = new THREE.Vector3(0.12, 1.70, -3.5);
    this.targetCameraLook = new THREE.Vector3(0, 0.35, 18.28);
    this.isBallInFlight = false;

    // Animation loop
    this.clock = new THREE.Clock();
    this.animationFrameId = null;
    this.currentSkinId = 'galaxy';

    // Particle system & effects
    this.sparkParticles = null;
    this.isSweeperActive = false;
    this.sweeperProgress = 0;
  }

  init(physicsEngine) {
    this.physics = physicsEngine;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // 1. Scene setup with bright, warm authentic bowling alley atmosphere (No pitch black void)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x181426);
    this.scene.fog = new THREE.FogExp2(0x181426, 0.0015);

    // 2. Camera setup - Clean wide-angle perspective
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 160);
    this.camera.position.set(0.12, 1.70, -3.5);
    this.camera.lookAt(0, 0.35, 18.28);

    // 3. Renderer with rich color mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;

    this.container.appendChild(this.renderer.domElement);

    // 4. Build Environment
    this._buildLightingMatrix();
    this._buildTorqEZoneAlley();
    this._buildPins();
    this._buildBall();
    this._buildCharacter();
    this._buildSweeper();
    this._buildAimGuide();
    this._buildSparks();

    // 5. Window resize listener
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    // 6. Start Render Loop
    this._renderLoop = this._renderLoop.bind(this);
    this._renderLoop();
  }

  _buildLightingMatrix() {
    // 1. Warm Golden Ambient & Soft Hemispheric Fill (Warm & Saturated, not washed out)
    const ambientLight = new THREE.AmbientLight(0xffedd5, 1.35);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfff1db, 0x3d281a, 1.25);
    hemiLight.position.set(0, 8, 0);
    this.scene.add(hemiLight);

    // 2. Approach Key Directional Light with clean shadow bias
    const approachKey = new THREE.DirectionalLight(0xffedd5, 1.5);
    approachKey.position.set(1.5, 7.0, -3.5);
    approachKey.target.position.set(0, 0.4, 3.0);
    approachKey.castShadow = true;
    approachKey.shadow.mapSize.width = 2048;
    approachKey.shadow.mapSize.height = 2048;
    approachKey.shadow.bias = -0.0008;
    this.scene.add(approachKey);
    this.scene.add(approachKey.target);

    // 3. Grid of Warm Recessed Downlight Fixtures
    const laneXs = [-4.65, -3.1, -1.55, 0, 1.55, 3.1, 4.65];
    const spotZs = [-1.0, 3.0, 7.0, 11.0, 15.0];

    spotZs.forEach(z => {
      laneXs.forEach(x => {
        const spot = new THREE.PointLight(0xffddaa, 1.8, 8.0, 1.2);
        spot.position.set(x, 5.7, z);
        this.scene.add(spot);

        // Warm glowing light fixture
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xffe8b8 })
        );
        bulb.position.set(x, 5.75, z);
        this.scene.add(bulb);

        const housing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.16, 0.12, 12),
          new THREE.MeshStandardMaterial({ color: 0x1e1c24, metalness: 0.8, roughness: 0.3 })
        );
        housing.position.set(x, 5.85, z);
        this.scene.add(housing);
      });
    });

    // 4. Bright Pin Deck Warm & Neon Spotlights
    const pinFlood = new THREE.SpotLight(0xffffff, 4.5, 18, Math.PI / 3.2, 0.3, 1.0);
    pinFlood.position.set(0, 5.2, 16.5);
    pinFlood.target.position.set(0, 0.2, 18.5);
    pinFlood.castShadow = false;
    this.scene.add(pinFlood);
    this.scene.add(pinFlood.target);

    const pinPitBlue = new THREE.PointLight(0x06b6d4, 4.0, 8);
    pinPitBlue.position.set(0, 1.2, 19.5);
    this.scene.add(pinPitBlue);

    const pinPitMagenta = new THREE.PointLight(0xec4899, 3.0, 7);
    pinPitMagenta.position.set(0, 1.8, 19.8);
    this.scene.add(pinPitMagenta);
  }

  _buildTorqEZoneAlley() {
    const laneWidth = LANE_CONFIG.WIDTH;
    const gutterW = LANE_CONFIG.GUTTER_WIDTH;
    const lanePitch = 1.55;
    const length = LANE_CONFIG.LENGTH;
    const approach = LANE_CONFIG.APPROACH_LENGTH;

    // --- 1. Rich Amber Golden Maple Hardwood Texture (Warm Brown, Polyurethane Sheen) ---
    const laneCanvas = document.createElement('canvas');
    laneCanvas.width = 512;
    laneCanvas.height = 2048;
    const ctx = laneCanvas.getContext('2d');

    // Rich warm honey maple linear base
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#783d12');      // Warm dark amber outer edge
    grad.addColorStop(0.18, '#a15c1b');   // Golden teak
    grad.addColorStop(0.5, '#ba7a2d');    // Core honey maple
    grad.addColorStop(0.82, '#a15c1b');   // Golden teak
    grad.addColorStop(1, '#783d12');      // Warm dark amber outer edge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 2048);

    // Subtle individual maple wood planks
    ctx.strokeStyle = 'rgba(60, 28, 6, 0.22)';
    ctx.lineWidth = 1.6;
    for (let x = 0; x < 512; x += 512 / 39) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
    }

    // Classic dark mahogany lane targeting arrows
    const arrowY = 2048 * 0.26;
    const arrowPositions = [0.15, 0.27, 0.39, 0.5, 0.61, 0.73, 0.85];
    ctx.fillStyle = '#380e03';
    arrowPositions.forEach((pos, i) => {
      const ax = 512 * pos;
      const ay = arrowY + Math.abs(i - 3) * 28;
      ctx.beginPath();
      ctx.moveTo(ax, ay - 38);
      ctx.lineTo(ax + 14, ay);
      ctx.lineTo(ax - 14, ay);
      ctx.closePath();
      ctx.fill();
    });

    // Dark cherry guide dots
    const dotY = 2048 * 0.12;
    ctx.fillStyle = '#451a03';
    arrowPositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(512 * pos, dotY, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    // Foul line dark bar
    ctx.fillStyle = '#1c0a02';
    ctx.fillRect(0, 2048 * 0.012, 512, 14);

    const laneTex = new THREE.CanvasTexture(laneCanvas);
    const laneMat = new THREE.MeshStandardMaterial({
      map: laneTex,
      roughness: 0.12,
      metalness: 0.08
    });

    // --- 2. Multiple Continuous Visible Lanes ---
    const laneIndices = [-3, -2, -1, 0, 1, 2, 3];

    laneIndices.forEach((laneIdx) => {
      const laneX = laneIdx * lanePitch;

      const laneGeo = new THREE.PlaneGeometry(laneWidth, length);
      const laneMesh = new THREE.Mesh(laneGeo, laneMat);
      laneMesh.rotation.x = -Math.PI / 2;
      laneMesh.position.set(laneX, 0, length / 2);
      laneMesh.receiveShadow = true;
      this.scene.add(laneMesh);

      // Matte dark metallic gutters
      const gutterGeo = new THREE.CylinderGeometry(gutterW / 2, gutterW / 2, length, 16, 1, false, 0, Math.PI);
      const gutterMat = new THREE.MeshStandardMaterial({ color: 0x181920, roughness: 0.35, metalness: 0.5 });

      const leftGutter = new THREE.Mesh(gutterGeo, gutterMat);
      leftGutter.rotation.z = Math.PI;
      leftGutter.rotation.y = Math.PI / 2;
      leftGutter.position.set(laneX - (laneWidth / 2 + gutterW / 2), -0.02, length / 2);
      this.scene.add(leftGutter);

      const rightGutter = new THREE.Mesh(gutterGeo, gutterMat);
      rightGutter.rotation.z = Math.PI;
      rightGutter.rotation.y = Math.PI / 2;
      rightGutter.position.set(laneX + (laneWidth / 2 + gutterW / 2), -0.02, length / 2);
      this.scene.add(rightGutter);

      // Clean division caps between lanes
      const capGeo = new THREE.BoxGeometry(0.10, 0.05, length);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x22242c, roughness: 0.4, metalness: 0.4 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(laneX + (laneWidth / 2 + gutterW + 0.05), 0.025, length / 2);
      this.scene.add(capMesh);

      if (laneIdx !== 0) {
        PIN_POSITIONS.forEach(pos => {
          const adjPin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.058, 0.38, 12),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15 })
          );
          adjPin.position.set(laneX + pos.x, 0.19, LANE_CONFIG.PIN_DECK_Z + pos.z);
          this.scene.add(adjPin);
        });
      }
    });

    // --- 3. Approach Concourse Flooring (Matching Warm Teak) ---
    const appCanvas = document.createElement('canvas');
    appCanvas.width = 512; appCanvas.height = 512;
    const aCtx = appCanvas.getContext('2d');
    aCtx.fillStyle = '#6b360d'; aCtx.fillRect(0, 0, 512, 512);
    aCtx.strokeStyle = 'rgba(50, 20, 5, 0.25)'; aCtx.lineWidth = 2;
    for (let x = 0; x < 512; x += 512 / 39) {
      aCtx.beginPath(); aCtx.moveTo(x, 0); aCtx.lineTo(x, 512); aCtx.stroke();
    }
    aCtx.fillStyle = '#380e03';
    arrowPositions.forEach(pos => {
      aCtx.beginPath(); aCtx.arc(512 * pos, 120, 6, 0, Math.PI * 2); aCtx.fill();
      aCtx.beginPath(); aCtx.arc(512 * pos, 380, 6, 0, Math.PI * 2); aCtx.fill();
    });
    const appTex = new THREE.CanvasTexture(appCanvas);
    const appMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(lanePitch * 8.5, approach + 6.0),
      new THREE.MeshStandardMaterial({ map: appTex, roughness: 0.22 })
    );
    appMesh.rotation.x = -Math.PI / 2;
    appMesh.position.set(0, 0, -(approach + 6.0) / 2);
    appMesh.receiveShadow = true;
    this.scene.add(appMesh);

    // --- 4. Open Industrial Ceiling with Acoustic Baffles ---
    const ceilingGeo = new THREE.PlaneGeometry(lanePitch * 10.0, length + approach + 10.0);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x0f0e17, roughness: 0.9 });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, 6.0, (length - approach) / 2);
    this.scene.add(ceilingMesh);

    const trussMat = new THREE.MeshStandardMaterial({ color: 0x1f1f28, metalness: 0.7, roughness: 0.4 });
    for (let tz = -2; tz <= 18; tz += 4.0) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(lanePitch * 9.5, 0.16, 0.16), trussMat);
      beam.position.set(0, 5.85, tz);
      this.scene.add(beam);
    }

    // --- 5. Left & Right Walls with Horizontal Warm Cedar Wood & Neon Signage ---
    const wallHalfWidth = lanePitch * 4.4; // 6.82m
    this._buildSideWall(-wallHalfWidth, 'LEFT', length, approach);
    this._buildSideWall(wallHalfWidth, 'RIGHT', length, approach);

    // --- 6. Back Wall Behind Pin Deck (Full Span Masking Unit & Neon Logo) ---
    this._buildBackWallTorqEZone(21.5);

    // --- 7. Lounge Seating Area in Concourse ---
    this._buildLoungeBooths();
  }

  _buildSideWall(wallX, side, length, approach) {
    const totalWallLen = length + approach + 10.0;
    const wallGeo = new THREE.BoxGeometry(0.3, 6.0, totalWallLen);

    // Rich horizontal cedar wood plank texture
    const woodCanvas = document.createElement('canvas');
    woodCanvas.width = 512; woodCanvas.height = 512;
    const wCtx = woodCanvas.getContext('2d');
    const plankColors = ['#5a2b0c', '#7c3f15', '#4c2209', '#663211', '#854719', '#54260a'];
    for (let y = 0; y < 512; y += 32) {
      wCtx.fillStyle = plankColors[Math.floor(Math.random() * plankColors.length)];
      wCtx.fillRect(0, y, 512, 30);
      wCtx.fillStyle = 'rgba(0,0,0,0.35)';
      wCtx.fillRect(0, y + 30, 512, 2);
    }
    const woodTex = new THREE.CanvasTexture(woodCanvas);
    woodTex.wrapS = THREE.RepeatWrapping; woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(6, 3);

    const wallMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(wallX, 3.0, (length - approach) / 2);
    this.scene.add(wallMesh);

    // Vertical Glowing Neon LED Accent Light Strips
    const neonMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
    const neonMatAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const inwardOffset = side === 'LEFT' ? 0.16 : -0.16;

    for (let nz = -3.0; nz <= 18.0; nz += 4.5) {
      const isCyan = (Math.round(nz) % 2 === 0);
      const stripGeo = new THREE.BoxGeometry(0.04, 4.8, 0.06);
      const stripMesh = new THREE.Mesh(stripGeo, isCyan ? neonMatCyan : neonMatAmber);
      stripMesh.position.set(wallX + inwardOffset, 3.0, nz);
      this.scene.add(stripMesh);
    }

    if (side === 'LEFT') {
      // Left Wall: "XTREME COSMIC BOWL" Neon Sign & Ball Racks
      this._buildCosmicBowlSign(wallX + 0.18);
      this._buildLeftWallBallRacks(wallX + 0.6);
    } else {
      // Right Wall: "RACE • PLAY • EAT • DRINK" & Strike Poster
      this._buildRacePlayEatDrinkSign(wallX - 0.18);
      this._buildStrikePoster(wallX - 0.18);
    }
  }

  _buildCosmicBowlSign(wallX) {
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024; signCanvas.height = 256;
    const ctx = signCanvas.getContext('2d');

    ctx.clearRect(0, 0, 1024, 256);
    ctx.font = '900 76px Arial, sans-serif';

    ctx.fillStyle = '#00f5ff'; ctx.shadowColor = '#00f5ff'; ctx.shadowBlur = 24;
    ctx.fillText('XTREME', 40, 150);

    ctx.fillStyle = '#f59e0b'; ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 24;
    ctx.fillText('COSMIC', 420, 150);

    ctx.fillStyle = '#ec4899'; ctx.shadowColor = '#ec4899'; ctx.shadowBlur = 24;
    ctx.fillText('BOWL 🎳', 780, 150);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signGeo = new THREE.PlaneGeometry(8.0, 2.0);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.rotation.y = Math.PI / 2;
    signMesh.position.set(wallX, 4.1, 5.0);
    this.scene.add(signMesh);
  }

  _buildRacePlayEatDrinkSign(wallX) {
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024; signCanvas.height = 256;
    const ctx = signCanvas.getContext('2d');

    ctx.clearRect(0, 0, 1024, 256);
    ctx.font = '900 80px Arial, sans-serif';

    ctx.fillStyle = '#22c55e'; ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 26;
    ctx.fillText('RACE', 40, 150);

    ctx.fillStyle = '#06b6d4'; ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 26;
    ctx.fillText('PLAY', 300, 150);

    ctx.fillStyle = '#f97316'; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 26;
    ctx.fillText('EAT', 560, 150);

    ctx.fillStyle = '#eab308'; ctx.shadowColor = '#eab308'; ctx.shadowBlur = 26;
    ctx.fillText('DRINK', 740, 150);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signGeo = new THREE.PlaneGeometry(8.0, 2.0);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.rotation.y = -Math.PI / 2;
    signMesh.position.set(wallX, 4.1, 5.0);
    this.scene.add(signMesh);
  }

  _buildStrikePoster(wallX) {
    const posterCanvas = document.createElement('canvas');
    posterCanvas.width = 512; posterCanvas.height = 512;
    const ctx = posterCanvas.getContext('2d');

    ctx.fillStyle = '#991b1b'; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 498, 498);

    ctx.font = '900 74px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#000000'; ctx.shadowBlur = 15;
    ctx.fillText('PERFECT STRIKE!', 256, 120);

    ctx.font = '130px Arial';
    ctx.fillText('🎳💥👑', 256, 310);

    const posterTex = new THREE.CanvasTexture(posterCanvas);
    const posterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: posterTex }));
    posterMesh.rotation.y = -Math.PI / 2;
    posterMesh.position.set(wallX, 3.4, -0.5);
    this.scene.add(posterMesh);
  }

  _buildLeftWallBallRacks(rackX) {
    const rackFrameGeo = new THREE.BoxGeometry(0.35, 0.9, 4.0);
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x1f2128, metalness: 0.85, roughness: 0.3 });
    const rackFrame = new THREE.Mesh(rackFrameGeo, rackMat);
    rackFrame.position.set(rackX, 0.45, -1.8);
    this.scene.add(rackFrame);

    const ballColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4, 0xf43f5e];
    for (let r = 0; r < 2; r++) {
      for (let b = 0; b < 6; b++) {
        const hBall = new THREE.Mesh(
          new THREE.SphereGeometry(0.108, 16, 16),
          new THREE.MeshStandardMaterial({
            color: ballColors[(r * 6 + b) % ballColors.length],
            roughness: 0.15,
            metalness: 0.65
          })
        );
        hBall.position.set(rackX, 0.35 + r * 0.42, -3.1 + b * 0.52);
        this.scene.add(hBall);
      }
    }
  }

  _buildBackWallTorqEZone(backZ) {
    const wallWidth = 15.0;

    // Full-height solid back wall background
    const backWallBgGeo = new THREE.PlaneGeometry(wallWidth, 6.0);
    const backWallBgMat = new THREE.MeshStandardMaterial({ color: 0x161424, roughness: 0.8 });
    const backWallBg = new THREE.Mesh(backWallBgGeo, backWallBgMat);
    backWallBg.position.set(0, 3.0, backZ);
    this.scene.add(backWallBg);

    // Distressed Brick Masking Unit
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 1024; maskCanvas.height = 512;
    const mCtx = maskCanvas.getContext('2d');

    mCtx.fillStyle = '#6b1d1d'; mCtx.fillRect(0, 0, 1024, 512);
    mCtx.strokeStyle = '#421111'; mCtx.lineWidth = 3;
    for (let y = 0; y < 512; y += 24) {
      for (let x = (y % 48 === 0 ? 0 : 24); x < 1024; x += 48) {
        mCtx.strokeRect(x, y, 48, 24);
      }
    }
    mCtx.fillStyle = 'rgba(60, 20, 5, 0.8)';
    mCtx.fillRect(0, 360, 1024, 152);

    const maskTex = new THREE.CanvasTexture(maskCanvas);
    const maskGeo = new THREE.PlaneGeometry(wallWidth, 2.5);
    const maskMesh = new THREE.Mesh(maskGeo, new THREE.MeshStandardMaterial({ map: maskTex, roughness: 0.65 }));
    maskMesh.position.set(0, 1.6, backZ - 0.05);
    this.scene.add(maskMesh);

    // Giant Glowing Illuminated 3D Neon Club Logo
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 1024; logoCanvas.height = 256;
    const lCtx = logoCanvas.getContext('2d');

    lCtx.clearRect(0, 0, 1024, 256);
    lCtx.font = '900 78px Arial, sans-serif';
    lCtx.textAlign = 'center';

    lCtx.fillStyle = '#ffffff'; lCtx.shadowColor = '#00f5ff'; lCtx.shadowBlur = 28;
    lCtx.fillText('★ COSMIC', 320, 150);

    lCtx.fillStyle = '#f59e0b'; lCtx.shadowColor = '#f59e0b'; lCtx.shadowBlur = 28;
    lCtx.fillText('DISCO', 570, 150);

    lCtx.fillStyle = '#ec4899'; lCtx.shadowColor = '#ec4899'; lCtx.shadowBlur = 28;
    lCtx.fillText('BOWL ★', 810, 150);

    const logoTex = new THREE.CanvasTexture(logoCanvas);
    const logoGeo = new THREE.PlaneGeometry(6.4, 1.6);
    const logoMesh = new THREE.Mesh(logoGeo, new THREE.MeshBasicMaterial({ map: logoTex, transparent: true }));
    logoMesh.position.set(0, 4.5, backZ - 0.04);
    this.scene.add(logoMesh);

    // Illuminated Retro Square Lane Number Boxes
    const laneXs = [-4.65, -3.1, -1.55, 0, 1.55, 3.1, 4.65];
    const laneNums = ['6', '7', '8', '9', '10', '11', '12'];

    laneXs.forEach((lx, i) => {
      const numCanvas = document.createElement('canvas');
      numCanvas.width = 128; numCanvas.height = 128;
      const nCtx = numCanvas.getContext('2d');
      nCtx.fillStyle = '#1c1917'; nCtx.fillRect(0, 0, 128, 128);
      nCtx.strokeStyle = '#f59e0b'; nCtx.lineWidth = 8;
      nCtx.strokeRect(4, 4, 120, 120);
      nCtx.font = '900 76px Arial'; nCtx.fillStyle = '#fbbf24';
      nCtx.textAlign = 'center'; nCtx.textBaseline = 'middle';
      nCtx.fillText(laneNums[i], 64, 64);

      const numTex = new THREE.CanvasTexture(numCanvas);
      const numMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshBasicMaterial({ map: numTex }));
      numMesh.position.set(lx, 1.45, backZ - 0.08);
      this.scene.add(numMesh);
    });
  }

  _buildLoungeBooths() {
    const loungeGroup = new THREE.Group();
    loungeGroup.position.set(0, 0, -5.0);

    const couchMat = new THREE.MeshStandardMaterial({ color: 0x2e284a, roughness: 0.5 });
    const couchBase = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.35, 1.2), couchMat);
    couchBase.position.set(0, 0.175, -1.0);
    loungeGroup.add(couchBase);

    const couchBack = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.55, 0.25), couchMat);
    couchBack.position.set(0, 0.5, -1.5);
    loungeGroup.add(couchBack);

    for (let t = -1; t <= 1; t += 2) {
      const table = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8, roughness: 0.2 })
      );
      table.position.set(t * 1.6, 0.45, 0.2);
      loungeGroup.add(table);

      const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), new THREE.MeshStandardMaterial({ color: 0x64748b }));
      tableLeg.position.set(t * 1.6, 0.225, 0.2);
      loungeGroup.add(tableLeg);
    }

    this.scene.add(loungeGroup);
  }

  _buildCharacter() {
    this.bowlerCharacter = new CharacterMesh();
    this.bowlerCharacter.setIdlePose(0.3);
    this.scene.add(this.bowlerCharacter.group);
  }

  syncPlayerCharacters(players = [], activePlayerIndex = 0) {
    if (!players || players.length <= 1) {
      this.otherCharacters.forEach(obj => this.scene.remove(obj.mesh.group));
      this.otherCharacters.clear();
      return;
    }

    const hangoutSpots = [
      { x: -1.8, z: -4.2, rot: 0.3 },
      { x: 1.6, z: -4.0, rot: -0.4 },
      { x: -2.8, z: -3.2, rot: 0.8 },
      { x: 2.5, z: -3.5, rot: -0.7 },
      { x: 0.6, z: -5.0, rot: 0.1 },
      { x: -0.8, z: -5.2, rot: -0.2 }
    ];

    players.forEach((p, idx) => {
      if (idx === activePlayerIndex) return;

      let charObj = this.otherCharacters.get(p.id);
      if (!charObj) {
        const spot = hangoutSpots[idx % hangoutSpots.length];
        const outfitColors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
        const newChar = new CharacterMesh({
          outfitColor: outfitColors[idx % outfitColors.length],
          jerseyNumber: String(idx + 1)
        });
        newChar.group.position.set(spot.x, 0, spot.z);
        newChar.group.rotation.y = spot.rot;
        this.scene.add(newChar.group);

        charObj = {
          mesh: newChar,
          currentPos: new THREE.Vector3(spot.x, 0, spot.z),
          targetPos: new THREE.Vector3(spot.x, 0, spot.z),
          roamTimer: Math.random() * 4.0,
          isWalking: false
        };
        this.otherCharacters.set(p.id, charObj);
      }
    });

    this.otherCharacters.forEach((obj, pId) => {
      if (!players.some(p => p.id === pId) || players[activePlayerIndex]?.id === pId) {
        this.scene.remove(obj.mesh.group);
        this.otherCharacters.delete(pId);
      }
    });
  }

  celebrateAllLoungeCharacters() {
    this.otherCharacters.forEach(obj => {
      obj.mesh.triggerCelebrate();
    });
  }

  _buildPins() {
    this.pinMeshes.forEach(mesh => this.scene.remove(mesh));
    this.pinMeshes.clear();

    PIN_POSITIONS.forEach(pos => {
      const pinGroup = new THREE.Group();

      const points = [];
      points.push(new THREE.Vector2(0.045, 0));
      points.push(new THREE.Vector2(0.058, 0.06));
      points.push(new THREE.Vector2(0.060, 0.12));
      points.push(new THREE.Vector2(0.042, 0.20));
      points.push(new THREE.Vector2(0.024, 0.26));
      points.push(new THREE.Vector2(0.022, 0.29));
      points.push(new THREE.Vector2(0.038, 0.34));
      points.push(new THREE.Vector2(0.025, 0.375));
      points.push(new THREE.Vector2(0, 0.38));

      const pinGeo = new THREE.LatheGeometry(points, 24);

      const pinCanvas = document.createElement('canvas');
      pinCanvas.width = 128; pinCanvas.height = 256;
      const ctx = pinCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 128, 256);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 68, 128, 14);
      ctx.fillRect(0, 92, 128, 14);

      const pinTex = new THREE.CanvasTexture(pinCanvas);
      const pinMat = new THREE.MeshStandardMaterial({
        map: pinTex,
        roughness: 0.10,
        metalness: 0.1,
        transparent: true,
        opacity: 1.0
      });

      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.castShadow = true;
      pinMesh.receiveShadow = true;
      pinGroup.add(pinMesh);

      const initX = pos.x;
      const initZ = LANE_CONFIG.PIN_DECK_Z + pos.z;
      pinGroup.position.set(initX, 0, initZ);

      this.scene.add(pinGroup);
      this.pinMeshes.set(pos.id, pinGroup);
    });
  }

  hideKnockedPins() {
    if (!this.physics) return;
    this.pinMeshes.forEach((mesh, id) => {
      if (this.physics.knockedPinIds.has(id)) {
        mesh.visible = false;
      }
    });
  }

  showAllPins() {
    this.pinMeshes.forEach(mesh => {
      mesh.visible = true;
      if (mesh.children[0] && mesh.children[0].material) {
        mesh.children[0].material.opacity = 1.0;
      }
    });
  }

  _buildBall() {
    const radius = LANE_CONFIG.BALL_RADIUS;
    const ballGeo = new THREE.SphereGeometry(radius, 32, 32);

    this.ballMesh = new THREE.Mesh(ballGeo, this._createBallMaterial(this.currentSkinId));
    this.ballMesh.castShadow = true;
    this.ballMesh.position.set(0, radius, -1.0);
    this.scene.add(this.ballMesh);

    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.85,
      linewidth: 3
    });
    this.ballTrail = new THREE.Line(trailGeo, trailMat);
    this.trailPoints = [];
    this.scene.add(this.ballTrail);
  }

  _createBallMaterial(skinId) {
    const skin = BALL_SKINS.find(s => s.id === skinId) || BALL_SKINS[0];
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = skin.color;
    ctx.fillRect(0, 0, 512, 256);

    if (skin.pattern === 'nebula') {
      const grad1 = ctx.createRadialGradient(150, 100, 10, 150, 100, 180);
      grad1.addColorStop(0, '#c084fc'); grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1; ctx.fillRect(0, 0, 512, 256);
    } else if (skin.pattern === 'gold') {
      ctx.fillStyle = '#fef08a';
      for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * 512, Math.random() * 256, 6, 6);
    } else if (skin.pattern === 'cyber') {
      ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 452, 196);
    } else if (skin.pattern === 'fire') {
      const fireGrad = ctx.createLinearGradient(0, 0, 512, 256);
      fireGrad.addColorStop(0, '#ef4444'); fireGrad.addColorStop(0.5, '#f59e0b'); fireGrad.addColorStop(1, '#b91c1c');
      ctx.fillStyle = fireGrad; ctx.fillRect(0, 0, 512, 256);
    }

    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(256, 70, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(230, 120, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(282, 120, 14, 0, Math.PI * 2); ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.08,
      metalness: 0.65,
      emissive: new THREE.Color(skin.emissive),
      emissiveIntensity: 0.45
    });
  }

  setBallSkin(skinId) {
    this.currentSkinId = skinId;
    if (this.ballMesh) {
      this.ballMesh.material = this._createBallMaterial(skinId);
    }
  }

  _buildSweeper() {
    const sweeperGroup = new THREE.Group();

    const bladeGeo = new THREE.BoxGeometry(LANE_CONFIG.WIDTH + 0.35, 0.18, 0.06);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.3 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    sweeperGroup.add(blade);

    const stripGeo = new THREE.BoxGeometry(LANE_CONFIG.WIDTH + 0.25, 0.04, 0.07);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    sweeperGroup.add(strip);

    const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x18181b });

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-(LANE_CONFIG.WIDTH / 2 + 0.16), 0.7, 0);
    sweeperGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(LANE_CONFIG.WIDTH / 2 + 0.16, 0.7, 0);
    sweeperGroup.add(rightArm);

    sweeperGroup.position.set(0, 2.2, 17.5);
    this.sweeperArm = sweeperGroup;
    this.scene.add(sweeperGroup);
  }

  _buildAimGuide() {
    this.aimDots = [];
  }

  updateAimGuide(ballX, angle, curveSpin) {
    // Aim guide line removed for clean, authentic bowling lane visuals
  }

  hideAimGuide() {
    // No-op
  }

  _buildSparks() {
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.12,
      transparent: true,
      opacity: 0
    });
    this.sparkParticles = new THREE.Points(geo, mat);
    this.scene.add(this.sparkParticles);
  }

  triggerSparks(x, y, z) {
    if (!this.sparkParticles) return;
    const posAttr = this.sparkParticles.geometry.attributes.position;
    const count = posAttr.count;

    this.sparkVelocities = [];
    for (let i = 0; i < count; i++) {
      posAttr.setXYZ(i, x, y, z);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2.0 + Math.random() * 5.0;
      this.sparkVelocities.push({
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.abs(Math.cos(phi)) * speed + 1.5,
        vz: Math.sin(phi) * Math.sin(theta) * speed
      });
    }
    posAttr.needsUpdate = true;
    this.sparkParticles.material.opacity = 1.0;
    this.sparkDuration = 0.8;
  }

  startSweeperAnimation(isFullReset, onComplete) {
    this.isSweeperActive = true;
    this.sweeperProgress = 0;
    this.isFullReset = isFullReset;
    this.onSweeperComplete = onComplete;
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    this.isBallInFlight = false;
  }

  _updateCamera(deltaTime) {
    const ballPos = this.ballMesh ? this.ballMesh.position : new THREE.Vector3(0, 0.1, -1);
    this.isBallInFlight = ballPos.z > -0.4 && ballPos.z < 18.8;

    if (this.isBallInFlight) {
      // Dynamic Kinetic Follow-Ball Camera
      const followZ = Math.min(ballPos.z - 2.8, 14.5);
      this.targetCameraPos.set(ballPos.x * 0.5, 1.25, Math.max(followZ, -2.5));
      this.targetCameraLook.set(ballPos.x * 0.35, 0.32, ballPos.z + 4.5);
    } else if (this.cameraMode === 'APPROACH') {
      this.targetCameraPos.set(0.12, 1.70, -3.5);
      this.targetCameraLook.set(0, 0.35, 18.28);
    } else if (this.cameraMode === 'FOLLOW') {
      const followZ = Math.min(ballPos.z - 2.8, 14.5);
      this.targetCameraPos.set(ballPos.x * 0.5, 1.25, Math.max(followZ, -2.5));
      this.targetCameraLook.set(ballPos.x * 0.35, 0.32, ballPos.z + 4.5);
    } else if (this.cameraMode === 'PIN_VIEW') {
      this.targetCameraPos.set(0, 0.95, 15.2);
      this.targetCameraLook.set(0, 0.3, 18.5);
    } else if (this.cameraMode === 'SIDE') {
      this.targetCameraPos.set(3.2, 1.45, -0.8);
      this.targetCameraLook.set(0, 0.35, 9.0);
    } else if (this.cameraMode === 'OVERHEAD') {
      this.targetCameraPos.set(0, 5.8, 8.5);
      this.targetCameraLook.set(0, 0, 11.5);
    } else if (this.cameraMode === 'LOUNGE') {
      this.targetCameraPos.set(0, 1.6, -5.8);
      this.targetCameraLook.set(0, 1.0, 0);
    } else if (this.cameraMode === 'SWEEP') {
      this.targetCameraPos.set(0, 1.35, 15.6);
      this.targetCameraLook.set(0, 0.25, 18.5);
    }

    if (!this.currentCameraPos) {
      this.currentCameraPos = this.targetCameraPos.clone();
    }
    if (!this.currentLookAt) {
      this.currentLookAt = this.targetCameraLook.clone();
    }

    const t = Math.min(1.0, (deltaTime || 0.016) * 5.0);
    this.currentCameraPos.lerp(this.targetCameraPos, t);
    this.currentLookAt.lerp(this.targetCameraLook, t);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);
  }

  _renderLoop() {
    this.animationFrameId = requestAnimationFrame(this._renderLoop);
    const dt = this.clock.getDelta();

    // 1. Update Active Bowler Character
    if (this.bowlerCharacter) {
      this.bowlerCharacter.update(dt);
    }

    // 2. Update Other Players Roaming in Lounge Concourse
    this.otherCharacters.forEach((obj) => {
      obj.roamTimer -= dt;
      if (obj.roamTimer <= 0) {
        obj.roamTimer = 3.0 + Math.random() * 4.0;
        obj.targetPos.set(
          -3.0 + Math.random() * 6.0,
          0,
          -5.5 + Math.random() * 2.2
        );
      }

      const diffX = obj.targetPos.x - obj.currentPos.x;
      const diffZ = obj.targetPos.z - obj.currentPos.z;
      const dist = Math.sqrt(diffX * diffX + diffZ * diffZ);

      if (dist > 0.1) {
        obj.isWalking = true;
        obj.mesh.setWalking(true);

        const moveSpeed = 1.2 * dt;
        obj.currentPos.x += (diffX / dist) * Math.min(dist, moveSpeed);
        obj.currentPos.z += (diffZ / dist) * Math.min(dist, moveSpeed);
        obj.mesh.group.position.copy(obj.currentPos);

        const angle = Math.atan2(diffX, diffZ);
        obj.mesh.group.rotation.y = angle;
      } else {
        if (obj.isWalking) {
          obj.isWalking = false;
          obj.mesh.setWalking(false);
        }
      }

      obj.mesh.update(dt);
    });

    // 3. Update Physics
    if (this.physics) {
      this.physics.update(dt);

      // Sync Ball
      if (this.ballMesh && this.physics.ballBody) {
        this.ballMesh.position.copy(this.physics.ballBody.position);
        this.ballMesh.quaternion.copy(this.physics.ballBody.quaternion);

        if (this.ballMesh.position.z > 0 && this.ballMesh.position.z < 18.5) {
          this.trailPoints.push(this.ballMesh.position.clone());
          if (this.trailPoints.length > 25) this.trailPoints.shift();
          if (this.trailPoints.length >= 2) {
            this.ballTrail.geometry.dispose();
            this.ballTrail.geometry = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
          }
        } else {
          if (this.trailPoints.length > 0) {
            this.trailPoints = [];
            this.ballTrail.geometry.dispose();
            this.ballTrail.geometry = new THREE.BufferGeometry().setFromPoints([]);
          }
        }
      }

      // Sync Pins
      this.physics.pinBodies.forEach(pinObj => {
        const mesh = this.pinMeshes.get(pinObj.id);
        if (mesh) {
          mesh.position.copy(pinObj.body.position);
          mesh.quaternion.copy(pinObj.body.quaternion);
        }
      });
    }

    // 4. Animate Sweeper Arm & Fade Fallen Pins
    if (this.isSweeperActive && this.sweeperArm) {
      this.sweeperProgress += dt * 0.9;
      if (this.sweeperProgress < 0.3) {
        const p = this.sweeperProgress / 0.3;
        this.sweeperArm.position.y = 2.2 - p * 2.1;
        this.sweeperArm.position.z = 17.5;
      } else if (this.sweeperProgress < 0.75) {
        const p = (this.sweeperProgress - 0.3) / 0.45;
        this.sweeperArm.position.y = 0.1;
        this.sweeperArm.position.z = 17.5 + p * 3.5;

        this.pinMeshes.forEach((mesh, id) => {
          if (this.physics && this.physics.knockedPinIds.has(id)) {
            const childMesh = mesh.children[0];
            if (childMesh && childMesh.material) {
              childMesh.material.opacity = Math.max(0, 1.0 - p * 1.8);
            }
          }
        });
      } else if (this.sweeperProgress < 1.0) {
        const p = (this.sweeperProgress - 0.75) / 0.25;
        this.sweeperArm.position.y = 0.1 + p * 2.1;
        this.sweeperArm.position.z = 21.0 - p * 3.5;
      } else {
        this.isSweeperActive = false;
        this.sweeperArm.position.set(0, 2.2, 17.5);

        this.pinMeshes.forEach(mesh => {
          const childMesh = mesh.children[0];
          if (childMesh && childMesh.material) {
            childMesh.material.opacity = 1.0;
          }
        });

        if (this.onSweeperComplete) {
          this.onSweeperComplete();
          this.onSweeperComplete = null;
        }
      }
    }

    // 5. Sparks
    if (this.sparkParticles && this.sparkDuration > 0) {
      this.sparkDuration -= dt;
      const posAttr = this.sparkParticles.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const v = this.sparkVelocities[i];
        v.vy -= 9.8 * dt;
        posAttr.setXYZ(i, posAttr.getX(i) + v.vx * dt, posAttr.getY(i) + v.vy * dt, posAttr.getZ(i) + v.vz * dt);
      }
      posAttr.needsUpdate = true;
      this.sparkParticles.material.opacity = Math.max(0, this.sparkDuration / 0.8);
    }

    // 6. Camera
    this._updateCamera(dt);

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this._onResize);
    if (this.renderer) {
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
  }
}
