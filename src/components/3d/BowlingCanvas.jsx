import React, { useRef, useEffect, useState } from 'react';
import { BowlingScene } from '../../engine/BowlingScene';
import { BowlingPhysics } from '../../engine/BowlingPhysics';
import { soundEngine } from '../../engine/SoundEngine';
import ControlsGuide from '../hud/ControlsGuide';

export default function BowlingCanvas({
  gameState,
  onThrowBall,
  onBallImpact,
  onGutter,
  ballSkin = 'galaxy',
  cameraMode = 'APPROACH',
  characterStyle,
  isMyTurn = true,
  currentStandingPins = 10,
  isFullReset = true,
  ballAimPos = 0,
  curveSpin = 0,
  onUpdateBallAim,
  players = [],
  activePlayerIndex = 0,
  activePlayerName = ''
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const physicsRef = useRef(null);

  // Gesture Tracking State
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const currentPointerRef = useRef({ x: 0, y: 0 });
  const isThrowTriggeredRef = useRef(false);

  // Initialize Three.js and Cannon Physics
  useEffect(() => {
    if (!containerRef.current) return;

    const physics = new BowlingPhysics();
    physics.init();
    physicsRef.current = physics;
    window.__bowlingPhysics = physics;

    const scene = new BowlingScene(containerRef.current);
    scene.init(physics);
    scene.setBallSkin(ballSkin);
    scene.setCameraMode(cameraMode);
    if (characterStyle && scene.bowlerCharacter) {
      scene.bowlerCharacter.updateCustomization(characterStyle);
    }
    sceneRef.current = scene;

    if (gameState === 'READY_TO_BOWL') {
      physics.resetBallPosition(ballAimPos);
      if (scene.bowlerCharacter) {
        scene.bowlerCharacter.setIdlePose(ballAimPos);
      }
      scene.updateAimGuide(ballAimPos, 0, curveSpin);
      if (currentStandingPins === 10 || physics.standingPinIds.size === 0) {
        physics.resetPins();
        scene.showAllPins();
      }
    }

    // Callbacks from physics
    physics.onPinHitCallback = (impactVelocity) => {
      const pinStatus = physics.checkPinStatus();
      window.__lastPinStatus = pinStatus;
      soundEngine.playPinHit(impactVelocity / 15, pinStatus.knockedCount);
      scene.triggerSparks(0, 0.2, 18.3);
      if (pinStatus.knockedCount === 10) {
        scene.celebrateAllLoungeCharacters();
      }
      if (onBallImpact) {
        onBallImpact(pinStatus);
      }
    };

    physics.onGutterCallback = () => {
      const pinStatus = physics.checkPinStatus();
      window.__lastPinStatus = pinStatus;
      soundEngine.playGutterSound();
      if (onGutter) {
        onGutter();
      }
    };

    return () => {
      scene.dispose();
      sceneRef.current = null;
      physicsRef.current = null;
    };
  }, []);

  // Update Ball Skin
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setBallSkin(ballSkin);
    }
  }, [ballSkin]);

  // Update Character Style
  useEffect(() => {
    if (sceneRef.current && sceneRef.current.bowlerCharacter && characterStyle) {
      sceneRef.current.bowlerCharacter.updateCustomization(characterStyle);
    }
  }, [characterStyle]);

  // Update Camera Mode
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCameraMode(cameraMode);
    }
  }, [cameraMode]);

  // Sync Multiplayer & Waiting Player Characters in Lounge
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.syncPlayerCharacters(players, activePlayerIndex);
    }
  }, [players, activePlayerIndex]);

  // Handle Game State Transitions (Reset Ball, Reset Pins, Sweeper)
  useEffect(() => {
    if (!physicsRef.current || !sceneRef.current) return;

    if (gameState === 'READY_TO_BOWL') {
      physicsRef.current.resetBallPosition(ballAimPos);
      if (sceneRef.current.bowlerCharacter) {
        sceneRef.current.bowlerCharacter.setIdlePose(ballAimPos);
      }
      sceneRef.current.setCameraMode(cameraMode);
      sceneRef.current.updateAimGuide(ballAimPos, 0, curveSpin);
      isThrowTriggeredRef.current = false;

      if (currentStandingPins === 10 || physicsRef.current.standingPinIds.size === 0) {
        physicsRef.current.resetPins();
        sceneRef.current.showAllPins();
        sceneRef.current._buildPins();
      } else {
        sceneRef.current.hideKnockedPins();
      }
    } else if (gameState === 'SWEEPING') {
      sceneRef.current.setCameraMode('SWEEP');
      soundEngine.playSweeper();
      sceneRef.current.startSweeperAnimation(isFullReset, () => {
        if (isFullReset) {
          physicsRef.current.resetPins();
          sceneRef.current.showAllPins();
          sceneRef.current._buildPins();
        } else {
          physicsRef.current.clearKnockedPins();
          sceneRef.current.hideKnockedPins();
        }
      });
    }
  }, [gameState, ballAimPos, currentStandingPins, isFullReset, curveSpin]);

  // Mouse & Touch Swipe Throw Handlers
  const handlePointerDown = (e) => {
    if (!isMyTurn || gameState !== 'READY_TO_BOWL') return;
    isThrowTriggeredRef.current = false;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setIsPointerDown(true);
    dragStartRef.current = { x: clientX, y: clientY, time: performance.now() };
    currentPointerRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    if (!isPointerDown || !isMyTurn || gameState !== 'READY_TO_BOWL') return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    currentPointerRef.current = { x: clientX, y: clientY };

    const dx = clientX - dragStartRef.current.x;
    const dy = dragStartRef.current.y - clientY;

    if (Math.abs(dx) > 10 && dy < 20) {
      const laneX = Math.max(-0.45, Math.min(0.45, (dx / 320)));
      if (physicsRef.current) {
        physicsRef.current.setAimPosition(laneX);
      }
      if (sceneRef.current && sceneRef.current.bowlerCharacter) {
        sceneRef.current.bowlerCharacter.setIdlePose(laneX);
      }
      if (sceneRef.current) {
        sceneRef.current.updateAimGuide(laneX, 0, curveSpin);
      }
      if (onUpdateBallAim) {
        onUpdateBallAim(laneX);
      }
    } else {
      const progress = Math.min(1.0, dy / 240);
      setDragProgress(progress);

      const angle = Math.max(-0.08, Math.min(0.08, (dx / 300)));
      const combinedSpin = Math.max(-1.0, Math.min(1.0, curveSpin + (dx / 140)));
      if (sceneRef.current && physicsRef.current && physicsRef.current.ballBody) {
        sceneRef.current.updateAimGuide(physicsRef.current.ballBody.position.x, angle, combinedSpin);
      }
    }
  };

  const handlePointerUp = (e) => {
    if (!isPointerDown || !isMyTurn || gameState !== 'READY_TO_BOWL' || isThrowTriggeredRef.current) {
      setIsPointerDown(false);
      setDragProgress(0);
      return;
    }

    setIsPointerDown(false);
    setDragProgress(0);

    const clientX = currentPointerRef.current.x;
    const clientY = currentPointerRef.current.y;
    const dt = Math.max(50, performance.now() - dragStartRef.current.time);
    const dx = clientX - dragStartRef.current.x;
    const dy = dragStartRef.current.y - clientY;

    if (dy > 35) {
      isThrowTriggeredRef.current = true;

      const swipeSpeed = (dy / dt) * 8.0;
      const power = Math.max(13, Math.min(25, 12 + swipeSpeed));
      const angle = Math.max(-0.075, Math.min(0.075, (dx / (dy + 100)) * 0.4));
      const gestureSpin = (dx / (dy + 50)) * 1.5;
      const spin = Math.max(-1.0, Math.min(1.0, curveSpin + gestureSpin));
      const startX = physicsRef.current.ballBody.position.x;

      if (sceneRef.current && sceneRef.current.bowlerCharacter) {
        sceneRef.current.bowlerCharacter.startThrowAnimation(() => {
          executeBallThrow(power, angle, spin);
        });
      } else {
        executeBallThrow(power, angle, spin);
      }

      if (onThrowBall) {
        onThrowBall({ power, angle, spin, startX });
      }
    }
  };

  const executeBallThrow = (power, angle, spin) => {
    if (!physicsRef.current || !sceneRef.current) return;

    sceneRef.current.hideAimGuide();
    soundEngine.playBallRoll();

    physicsRef.current.throwBall(power, angle, spin);
  };

  // Allow external throw execution
  useEffect(() => {
    window.__executeExternalThrow = (power, angle, spin, startX = 0) => {
      if (!physicsRef.current || !sceneRef.current) return;

      physicsRef.current.resetBallPosition(startX);
      if (sceneRef.current.bowlerCharacter) {
        sceneRef.current.bowlerCharacter.setIdlePose(startX);
        sceneRef.current.bowlerCharacter.startThrowAnimation(() => {
          executeBallThrow(power, angle, spin);
        });
      } else {
        executeBallThrow(power, angle, spin);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="bowling-3d-canvas-wrap"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* Dynamic Aim & Swipe Guide */}
      <ControlsGuide
        gameState={gameState}
        isMyTurn={isMyTurn}
        dragProgress={dragProgress}
        isPointerDown={isPointerDown}
        activePlayerName={activePlayerName}
      />
    </div>
  );
}
