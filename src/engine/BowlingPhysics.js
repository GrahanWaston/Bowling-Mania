import * as CANNON from 'cannon-es';
import { LANE_CONFIG, PIN_POSITIONS } from '../types/bowling';

export class BowlingPhysics {
  constructor() {
    this.world = null;
    this.ballBody = null;
    this.pinBodies = [];
    this.standingPinIds = new Set();
    this.knockedPinIds = new Set();
    this.bumpersEnabled = false;
    this.bumperBodies = [];
    this.isSimulating = false;

    // Contact Materials
    this.laneMaterial = new CANNON.Material('lane');
    this.ballMaterial = new CANNON.Material('ball');
    this.pinMaterial = new CANNON.Material('pin');
    this.wallMaterial = new CANNON.Material('wall');

    this.onPinHitCallback = null;
    this.onGutterCallback = null;
    this.hasGutterTriggered = false;
    this.hasFirstPinHit = false;
  }

  init() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });

    // Broadphase & Solver settings
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.solver.iterations = 15;
    this.world.defaultContactMaterial.friction = 0.2;
    this.world.defaultContactMaterial.restitution = 0.3;

    this._setupContactMaterials();
    this._setupEnvironment();
    this._setupBall();
    this.resetPins();
  }

  _setupContactMaterials() {
    // Ball on Lane (slick oiled lane with realistic traction)
    const ballLaneContact = new CANNON.ContactMaterial(this.ballMaterial, this.laneMaterial, {
      friction: 0.16,
      restitution: 0.05
    });
    this.world.addContactMaterial(ballLaneContact);

    // Ball on Pin (authentic energy absorption & lateral deflection)
    const ballPinContact = new CANNON.ContactMaterial(this.ballMaterial, this.pinMaterial, {
      friction: 0.48,
      restitution: 0.20
    });
    this.world.addContactMaterial(ballPinContact);

    // Pin on Pin (absorbed kinetic energy, preventing excessive domino explosions)
    const pinPinContact = new CANNON.ContactMaterial(this.pinMaterial, this.pinMaterial, {
      friction: 0.38,
      restitution: 0.20
    });
    this.world.addContactMaterial(pinPinContact);

    // Pin on Floor (firm friction to keep corner pins standing on weak hits)
    const pinLaneContact = new CANNON.ContactMaterial(this.pinMaterial, this.laneMaterial, {
      friction: 0.68,
      restitution: 0.08
    });
    this.world.addContactMaterial(pinLaneContact);
  }

  _setupEnvironment() {
    const halfWidth = LANE_CONFIG.WIDTH / 2;
    const totalLen = LANE_CONFIG.LENGTH + LANE_CONFIG.APPROACH_LENGTH;

    // 1. Main Bowling Lane Floor
    const laneShape = new CANNON.Box(new CANNON.Vec3(halfWidth, 0.1, totalLen / 2));
    const laneBody = new CANNON.Body({
      mass: 0,
      material: this.laneMaterial,
      position: new CANNON.Vec3(0, -0.1, (LANE_CONFIG.LENGTH - LANE_CONFIG.APPROACH_LENGTH) / 2)
    });
    laneBody.addShape(laneShape);
    this.world.addBody(laneBody);

    // 2. Left & Right Gutters (sunken channels)
    const gutterWidth = LANE_CONFIG.GUTTER_WIDTH;
    const gutterDepth = 0.06;

    // Left gutter floor
    const leftGutterShape = new CANNON.Box(new CANNON.Vec3(gutterWidth / 2, 0.1, LANE_CONFIG.LENGTH / 2));
    const leftGutterBody = new CANNON.Body({
      mass: 0,
      material: this.laneMaterial,
      position: new CANNON.Vec3(-(halfWidth + gutterWidth / 2), -0.1 - gutterDepth, LANE_CONFIG.LENGTH / 2)
    });
    leftGutterBody.addShape(leftGutterShape);
    this.world.addBody(leftGutterBody);

    // Right gutter floor
    const rightGutterShape = new CANNON.Box(new CANNON.Vec3(gutterWidth / 2, 0.1, LANE_CONFIG.LENGTH / 2));
    const rightGutterBody = new CANNON.Body({
      mass: 0,
      material: this.laneMaterial,
      position: new CANNON.Vec3(halfWidth + gutterWidth / 2, -0.1 - gutterDepth, LANE_CONFIG.LENGTH / 2)
    });
    rightGutterBody.addShape(rightGutterShape);
    this.world.addBody(rightGutterBody);

    // 3. Kickback Side Walls (for pin bounce around deck)
    const wallLen = 3.5;
    const wallHeight = 0.5;
    const leftWallShape = new CANNON.Box(new CANNON.Vec3(0.05, wallHeight / 2, wallLen / 2));
    const leftWallBody = new CANNON.Body({
      mass: 0,
      material: this.wallMaterial,
      position: new CANNON.Vec3(-(halfWidth + gutterWidth + 0.05), wallHeight / 2, LANE_CONFIG.PIN_DECK_Z + 1.0)
    });
    leftWallBody.addShape(leftWallShape);
    this.world.addBody(leftWallBody);

    const rightWallShape = new CANNON.Box(new CANNON.Vec3(0.05, wallHeight / 2, wallLen / 2));
    const rightWallBody = new CANNON.Body({
      mass: 0,
      material: this.wallMaterial,
      position: new CANNON.Vec3(halfWidth + gutterWidth + 0.05, wallHeight / 2, LANE_CONFIG.PIN_DECK_Z + 1.0)
    });
    rightWallBody.addShape(rightWallShape);
    this.world.addBody(rightWallBody);

    // 4. Back Pit Cushion (stops ball and pins from flying infinitely)
    const backWallShape = new CANNON.Box(new CANNON.Vec3(halfWidth + gutterWidth + 0.2, 0.6, 0.1));
    const backWallBody = new CANNON.Body({
      mass: 0,
      material: this.wallMaterial,
      position: new CANNON.Vec3(0, 0.6, LANE_CONFIG.PIN_DECK_Z + 3.2)
    });
    backWallBody.addShape(backWallShape);
    this.world.addBody(backWallBody);
  }

  setBumpers(enabled) {
    this.bumpersEnabled = enabled;
    // Remove old bumpers
    this.bumperBodies.forEach(b => this.world.removeBody(b));
    this.bumperBodies = [];

    if (enabled) {
      const halfWidth = LANE_CONFIG.WIDTH / 2;
      const bumperShape = new CANNON.Cylinder(0.08, 0.08, LANE_CONFIG.LENGTH, 8);
      const q = new CANNON.Quaternion();
      q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

      const leftBumper = new CANNON.Body({
        mass: 0,
        material: this.wallMaterial,
        position: new CANNON.Vec3(-halfWidth, 0.08, LANE_CONFIG.LENGTH / 2)
      });
      leftBumper.addShape(bumperShape, new CANNON.Vec3(0, 0, 0), q);
      this.world.addBody(leftBumper);
      this.bumperBodies.push(leftBumper);

      const rightBumper = new CANNON.Body({
        mass: 0,
        material: this.wallMaterial,
        position: new CANNON.Vec3(halfWidth, 0.08, LANE_CONFIG.LENGTH / 2)
      });
      rightBumper.addShape(bumperShape, new CANNON.Vec3(0, 0, 0), q);
      this.world.addBody(rightBumper);
      this.bumperBodies.push(rightBumper);
    }
  }

  _setupBall() {
    const radius = LANE_CONFIG.BALL_RADIUS;
    const ballShape = new CANNON.Sphere(radius);

    this.ballBody = new CANNON.Body({
      mass: LANE_CONFIG.BALL_MASS,
      material: this.ballMaterial,
      linearDamping: 0.06,
      angularDamping: 0.18
    });
    this.ballBody.addShape(ballShape);
    this.resetBallPosition(0);
    this.world.addBody(this.ballBody);

    // Collision listener with realistic energy transfer & deflection
    this.ballBody.addEventListener('collide', (e) => {
      const hitPinObj = this.pinBodies.find(p => p.body === e.body);
      if (hitPinObj) {
        if (!this.hasFirstPinHit) {
          this.hasFirstPinHit = true;
        }

        // Realistic energy absorption: ball forward speed drops on impact
        this.ballBody.velocity.z *= 0.86;

        // Headpin (#1) direct hit deflection physics:
        // Hitting dead straight on the nose (|offset| < 0.02) causes deflection that drives Pin 1 into Pin 5,
        // often leaving corner pins (e.g. Pin 7 or 10) standing unless entering with pocket curve!
        if (hitPinObj.id === 1) {
          const hitOffset = this.ballBody.position.x - hitPinObj.body.position.x;
          if (Math.abs(hitOffset) < 0.025) {
            const deflectDir = hitOffset >= 0 ? 1 : -1;
            this.ballBody.velocity.x += deflectDir * 0.7;
          }
        }

        if (this.onPinHitCallback) {
          const relVel = e.contact.getImpactVelocityAlongNormal();
          this.onPinHitCallback(Math.abs(relVel));
        }
      }
    });
  }

  setAimPosition(x = 0) {
    this.resetBallPosition(x);
  }

  setBallPosition(x = 0) {
    this.resetBallPosition(x);
  }

  resetBallPosition(x = 0) {
    if (!this.ballBody) return;
    const clampedX = Math.max(-LANE_CONFIG.WIDTH / 2 + 0.15, Math.min(LANE_CONFIG.WIDTH / 2 - 0.15, x));
    this.ballBody.position.set(clampedX, LANE_CONFIG.BALL_RADIUS, -1.0);
    this.ballBody.velocity.set(0, 0, 0);
    this.ballBody.angularVelocity.set(0, 0, 0);
    this.ballBody.quaternion.set(0, 0, 0, 1);
    this.ballBody.wakeUp();
    this.hasGutterTriggered = false;
    this.hasFirstPinHit = false;
  }

  /**
   * Reset all 10 pins in standard triangle formation
   */
  resetPins() {
    // Remove existing pin bodies
    this.pinBodies.forEach(p => this.world.removeBody(p.body));
    this.pinBodies = [];
    this.standingPinIds.clear();
    this.knockedPinIds.clear();

    const pinHeight = LANE_CONFIG.PIN_HEIGHT;
    const pinRadius = LANE_CONFIG.PIN_RADIUS;

    PIN_POSITIONS.forEach(pos => {
      // Compound shape: cylinder body + top spherical neck + base stability cylinder
      const cylinderShape = new CANNON.Cylinder(pinRadius * 0.65, pinRadius * 1.0, pinHeight * 0.7, 8);
      const topSphere = new CANNON.Sphere(pinRadius * 0.60);
      const baseCylinder = new CANNON.Cylinder(pinRadius * 0.95, pinRadius * 0.95, 0.06, 8);

      const q = new CANNON.Quaternion();
      q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

      const pinBody = new CANNON.Body({
        mass: LANE_CONFIG.PIN_MASS,
        material: this.pinMaterial,
        linearDamping: 0.18,
        angularDamping: 0.28
      });

      // Assemble compound shape to create realistic center of gravity
      pinBody.addShape(cylinderShape, new CANNON.Vec3(0, 0, 0), q);
      pinBody.addShape(topSphere, new CANNON.Vec3(0, pinHeight * 0.35, 0));
      pinBody.addShape(baseCylinder, new CANNON.Vec3(0, -pinHeight * 0.3, 0), q);

      const startX = pos.x;
      const startY = pinHeight / 2;
      const startZ = LANE_CONFIG.PIN_DECK_Z + pos.z;

      pinBody.position.set(startX, startY, startZ);
      pinBody.quaternion.set(0, 0, 0, 1);

      this.world.addBody(pinBody);
      this.pinBodies.push({
        id: pos.id,
        body: pinBody,
        initialPos: new CANNON.Vec3(startX, startY, startZ)
      });

      this.standingPinIds.add(pos.id);
    });
  }

  /**
   * Keep only pins that are still standing, remove knocked pins from physics world (for roll 2)
   */
  clearKnockedPins() {
    this.checkPinStatus();
    const remaining = [];
    this.pinBodies.forEach(pin => {
      if (this.knockedPinIds.has(pin.id)) {
        this.world.removeBody(pin.body);
      } else {
        // Reset upright standing position for roll 2
        pin.body.velocity.set(0, 0, 0);
        pin.body.angularVelocity.set(0, 0, 0);
        pin.body.quaternion.set(0, 0, 0, 1);
        pin.body.position.set(pin.initialPos.x, LANE_CONFIG.PIN_HEIGHT / 2, pin.initialPos.z);
        pin.body.wakeUp();
        remaining.push(pin);
      }
    });
    this.pinBodies = remaining;
  }

  /**
   * Launch the ball down the lane
   * @param {number} power - speed multiplier (12 to 24 m/s)
   * @param {number} angle - release angle in radians (-0.1 to +0.1)
   * @param {number} spin - curve/hook torque (-1.0 to +1.0)
   */
  throwBall(power, angle, spin) {
    if (!this.ballBody) return;

    const clampedPower = Math.max(11, Math.min(24, power));
    const vx = Math.sin(angle) * clampedPower;
    const vz = Math.cos(angle) * clampedPower;
    const vy = 0.15;

    this.ballBody.velocity.set(vx, vy, vz);

    const spinTorque = spin * 32;
    this.ballBody.angularVelocity.set(clampedPower / LANE_CONFIG.BALL_RADIUS, -spinTorque * 0.35, -spinTorque);

    this.isSimulating = true;
    this.hasGutterTriggered = false;
    this.hasFirstPinHit = false;
  }

  /**
   * Evaluate which pins have fallen
   */
  checkPinStatus() {
    const upVector = new CANNON.Vec3(0, 1, 0);
    const pinVector = new CANNON.Vec3(0, 1, 0);

    this.pinBodies.forEach(pin => {
      if (this.knockedPinIds.has(pin.id)) return;

      pin.body.quaternion.vmult(upVector, pinVector);
      const dot = pinVector.dot(upVector);

      const dx = pin.body.position.x - pin.initialPos.x;
      const dz = pin.body.position.z - pin.initialPos.z;
      const distDisplaced = Math.sqrt(dx * dx + dz * dz);

      const height = pin.body.position.y;
      const posX = Math.abs(pin.body.position.x);
      const posZ = pin.body.position.z;

      // Accurate pin knockdown criteria matching 3D visual physics:
      // 1. Tilted > 24 degrees: dot < 0.82 (pin has lost balance and toppled)
      // 2. Lying on floor or resting on another fallen pin: height < 0.14
      // 3. Displaced away from its spot: distDisplaced > 0.18
      // 4. Fell in gutter or back pit: posX > 0.55 || posZ > 19.1
      const isTilted = dot < 0.82;
      const isLyingDown = height < 0.14;
      const isDisplaced = distDisplaced > 0.18;
      const isInGutterOrPit = posX > 0.55 || posZ > 19.1;

      if (isTilted || isLyingDown || isDisplaced || isInGutterOrPit) {
        this.standingPinIds.delete(pin.id);
        this.knockedPinIds.add(pin.id);
      }
    });

    return {
      knockedCount: this.knockedPinIds.size,
      standingCount: this.standingPinIds.size,
      knockedIds: Array.from(this.knockedPinIds),
      standingIds: Array.from(this.standingPinIds)
    };
  }

  /**
   * Step physics world with realistic 2-phase lane oil pattern
   */
  update(deltaTime) {
    if (!this.world) return;
    const dt = Math.min(deltaTime, 1 / 30);
    this.world.step(1 / 60, dt, 3);

    // Check Gutter detection for ball
    if (this.ballBody && !this.hasGutterTriggered && !this.hasFirstPinHit) {
      const halfLane = LANE_CONFIG.WIDTH / 2;
      const bx = this.ballBody.position.x;
      const bz = this.ballBody.position.z;

      if (bz > 1.0 && bz < LANE_CONFIG.PIN_DECK_Z && Math.abs(bx) > halfLane + 0.05) {
        this.hasGutterTriggered = true;
        if (this.onGutterCallback) {
          this.onGutterCallback();
        }
      }
    }

    // Apply 2-Zone Oil Pattern: Skid zone (0-11m) & Dry Backend hook zone (11-18.3m)
    if (this.ballBody && this.ballBody.position.z > 0 && this.ballBody.position.z < LANE_CONFIG.PIN_DECK_Z) {
      const spinZ = this.ballBody.angularVelocity.z;
      const bz = this.ballBody.position.z;
      if (Math.abs(spinZ) > 0.5) {
        let hookFactor = 0.04;
        if (bz > 10.5) {
          // Dry backend sharp hook progression
          hookFactor = 0.04 + ((bz - 10.5) / (LANE_CONFIG.PIN_DECK_Z - 10.5)) * 0.20;
        }
        const lateralHookForce = spinZ * hookFactor;
        this.ballBody.velocity.x += lateralHookForce * dt;
      }
    }
  }
}
