import React, { useState, useEffect, useRef } from 'react';
import { Home, LogOut } from 'lucide-react';
import { GAME_MODES, GAME_STATES, CAMERA_MODES, BALL_SKINS, CHARACTER_STYLES } from './types/bowling';
import { ScoreEngine } from './engine/ScoreEngine';
import { soundEngine } from './engine/SoundEngine';
import { networkManager } from './network/NetworkManager';
import { BotAI } from './engine/BotAI';

// Components
import BowlingCanvas from './components/3d/BowlingCanvas';
import Scoreboard from './components/hud/Scoreboard';
import TurnIndicator from './components/hud/TurnIndicator';
import StrikeCelebration from './components/hud/StrikeCelebration';
import SpinTutorialModal from './components/hud/SpinTutorialModal';
import CupuAlert from './components/social/CupuAlert';
import TauntWheel from './components/social/TauntWheel';
import QuickChat from './components/social/QuickChat';
import DiscoAudioPlayer from './components/common/DiscoAudioPlayer';
import MainMenu from './components/lobby/MainMenu';
import CharacterCustomizer from './components/lobby/CharacterCustomizer';
import RoomLobby from './components/lobby/RoomLobby';
import RoomBrowser from './components/lobby/RoomBrowser';
import GameOverModal from './components/lobby/GameOverModal';

export default function App() {
  // Player & Profile
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('bowling_player_name') || `Player_${Math.floor(100 + Math.random() * 900)}`);
  const [playerAvatar, setPlayerAvatar] = useState('🎳');
  const [myPlayerId] = useState(() => {
    let id = localStorage.getItem('bowling_player_id');
    if (!id) {
      id = `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      localStorage.setItem('bowling_player_id', id);
    }
    return id;
  });

  // Character Customization Style
  const [characterStyle, setCharacterStyle] = useState(() => {
    const saved = localStorage.getItem('bowling_character_style');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* use default */ }
    }
    return {
      outfit: CHARACTER_STYLES.OUTFITS[0],
      hair: CHARACTER_STYLES.HAIR_STYLES[0],
      skinTone: CHARACTER_STYLES.SKIN_TONES[0]
    };
  });
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Session Persistence on Refresh
  const savedSession = (() => {
    try {
      const raw = sessionStorage.getItem('bowling_active_session');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();

  // Game Configuration & State
  const [gameMode, setGameMode] = useState(() => savedSession?.gameMode || GAME_MODES.SOLO);
  const [gameState, setGameState] = useState(() => {
    if (savedSession) {
      return savedSession.gameState === GAME_STATES.ROOM_WAITING
        ? GAME_STATES.ROOM_WAITING
        : GAME_STATES.READY_TO_BOWL;
    }
    return GAME_STATES.LOBBY;
  });
  const [players, setPlayers] = useState(() => savedSession?.players || []);
  const [activePlayerIndex, setActivePlayerIndex] = useState(() => savedSession?.activePlayerIndex || 0);
  const [ballSkin, setBallSkin] = useState(() => savedSession?.ballSkin || 'galaxy');
  const [cameraMode, setCameraMode] = useState(() => savedSession?.cameraMode || CAMERA_MODES.APPROACH);
  const [bumpersEnabled, setBumpersEnabled] = useState(false);
  const [ballAimPos, setBallAimPos] = useState(0);
  const [curveSpin, setCurveSpin] = useState(() => savedSession?.curveSpin || 0);

  // Social & Troll State
  const [celebrationType, setCelebrationType] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCupuAlert, setShowCupuAlert] = useState(false);
  const [cupuPlayerName, setCupuPlayerName] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  // Multiplayer Room State
  const [roomCode, setRoomCode] = useState(() => savedSession?.roomCode || '');
  const [roomName, setRoomName] = useState(() => savedSession?.roomName || '');
  const [isPrivateRoom, setIsPrivateRoom] = useState(() => savedSession?.isPrivateRoom || false);
  const [maxRoomSlots, setMaxRoomSlots] = useState(() => savedSession?.maxRoomSlots || 6);
  const [isHost, setIsHost] = useState(() => savedSession?.isHost || false);
  const [publicRooms, setPublicRooms] = useState([]);
  const [showRoomBrowser, setShowRoomBrowser] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sweeperNeedsFullReset, setSweeperNeedsFullReset] = useState(true);

  const rollTimeoutRef = useRef(null);

  // Save profile name & character
  useEffect(() => {
    localStorage.setItem('bowling_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('bowling_character_style', JSON.stringify(characterStyle));
  }, [characterStyle]);

  // Save active session for instant refresh restore
  useEffect(() => {
    if (gameState !== GAME_STATES.LOBBY && gameState !== GAME_STATES.GAME_OVER && players.length > 0) {
      const sessionData = {
        gameMode,
        gameState: (gameState === GAME_STATES.ROOM_WAITING ? GAME_STATES.ROOM_WAITING : GAME_STATES.READY_TO_BOWL),
        players,
        activePlayerIndex,
        roomCode,
        roomName,
        isHost,
        isPrivateRoom,
        maxRoomSlots,
        ballSkin,
        curveSpin,
        cameraMode
      };
      sessionStorage.setItem('bowling_active_session', JSON.stringify(sessionData));

      if (roomCode) {
        window.history.replaceState(null, '', `?room=${roomCode}`);
      }
    } else if (gameState === GAME_STATES.LOBBY) {
      sessionStorage.removeItem('bowling_active_session');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [gameState, gameMode, players, activePlayerIndex, roomCode, roomName, isHost, isPrivateRoom, maxRoomSlots, ballSkin, curveSpin, cameraMode]);

  // Check URL params for direct room join or resume room
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !savedSession) {
      handleJoinRoom(roomParam);
    } else if (savedSession && savedSession.roomCode && savedSession.gameMode === GAME_MODES.ONLINE_MULTIPLAYER) {
      if (savedSession.isHost) {
        networkManager.createRoom(savedSession.roomName || 'Disco Lounge', savedSession.isPrivateRoom, savedSession.roomCode);
      } else {
        networkManager.joinRoom(savedSession.roomCode, { id: myPlayerId, name: playerName, avatar: playerAvatar, style: characterStyle });
      }
    }
  }, []);

  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;
  const maxRoomSlotsRef = useRef(maxRoomSlots);
  maxRoomSlotsRef.current = maxRoomSlots;

  // Initialize Network Manager Listeners
  useEffect(() => {
    networkManager.init({ id: myPlayerId, name: playerName, avatar: playerAvatar, style: characterStyle });

    networkManager.on('JOIN_REQUEST', (payload) => {
      if (isHostRef.current && payload.player) {
        setPlayers((prev) => {
          if (prev.length >= maxRoomSlotsRef.current) return prev;
          if (prev.some(p => p.id === payload.player.id)) {
            // Player already in roster, resend sync to ensure guest sees room state
            networkManager.broadcast('ROOM_PLAYERS_SYNC', { players: prev });
            return prev;
          }
          const joinedPlayer = ScoreEngine.createInitialPlayer(
            payload.player.id,
            payload.player.name || 'Bowler',
            payload.player.avatar || '🎳',
            false
          );
          joinedPlayer.isReady = true;
          const updated = [...prev, joinedPlayer];
          networkManager.broadcast('ROOM_PLAYERS_SYNC', { players: updated });
          return updated;
        });
      }
    });

    networkManager.on('ROOM_PLAYERS_SYNC', (payload) => {
      if (payload.players) {
        setPlayers(payload.players);
        setGameState(GAME_STATES.ROOM_WAITING);
      }
    });

    networkManager.on('START_MATCH_BROADCAST', (payload) => {
      if (payload.players) {
        setPlayers(payload.players);
      }
      setActivePlayerIndex(0);
      setGameState(GAME_STATES.READY_TO_BOWL);
      soundEngine.startDiscoMusic();
    });

    networkManager.on('THROW_BROADCAST', (payload) => {
      if (window.__executeExternalThrow) {
        window.__executeExternalThrow(payload.power, payload.angle, payload.spin, payload.startX);
      }
      setGameState(GAME_STATES.BALL_ROLLING);
    });

    networkManager.on('ROLL_RESULT_BROADCAST', (payload) => {
      handleRemoteRollResult(payload);
    });

    networkManager.on('AIM_UPDATE', (payload) => {
      setBallAimPos(payload.ballX);
    });

    networkManager.on('TAUNT_EMOTE', (payload) => {
      triggerFloatingEmoji(payload.emoji, payload.senderName);
      if (payload.sound) {
        soundEngine.playCupuSound(payload.sound);
      }
    });

    networkManager.on('CHAT_MESSAGE', (payload) => {
      setChatMessages((prev) => [...prev, payload]);
    });
  }, [playerName, playerAvatar, characterStyle]);

  // Current active player object
  const activePlayer = players[activePlayerIndex] || null;
  const isMyTurn = activePlayer
    ? (gameMode === GAME_MODES.SOLO || gameMode === GAME_MODES.PASS_AND_PLAY || gameMode === GAME_MODES.VS_BOT)
      ? !activePlayer.isBot
      : (activePlayer.id === myPlayerId || (isHost && activePlayerIndex === 0) || !activePlayer.isBot)
    : false;

  // --- Bot AI Turn Loop ---
  useEffect(() => {
    if (gameState === 'READY_TO_BOWL' && activePlayer && activePlayer.isBot) {
      const remainingPins = ScoreEngine.getPinsRemaining(activePlayer);
      const throwParams = BotAI.generateThrow(activePlayer.botDifficulty, remainingPins);

      const timer = setTimeout(() => {
        setBallAimPos(throwParams.ballX);
        setTimeout(() => {
          if (window.__executeExternalThrow) {
            window.__executeExternalThrow(throwParams.power, throwParams.angle, throwParams.spin, throwParams.ballX);
          }
          setGameState(GAME_STATES.BALL_ROLLING);
          networkManager.broadcast('THROW_BROADCAST', {
            power: throwParams.power,
            angle: throwParams.angle,
            spin: throwParams.spin,
            startX: throwParams.ballX
          });
        }, 600);
      }, throwParams.delayMs);

      return () => clearTimeout(timer);
    }
  }, [gameState, activePlayerIndex, activePlayer]);

  // --- Handlers for Game Modes ---

  const handleStartSolo = () => {
    const me = ScoreEngine.createInitialPlayer(myPlayerId, playerName, playerAvatar);
    setPlayers([me]);
    setActivePlayerIndex(0);
    setGameMode(GAME_MODES.SOLO);
    setGameState(GAME_STATES.READY_TO_BOWL);
    soundEngine.startDiscoMusic();
  };

  const handleStartVsBot = () => {
    const me = ScoreEngine.createInitialPlayer(myPlayerId, playerName, playerAvatar);
    const botCupu = ScoreEngine.createInitialPlayer('bot_1', 'Si Cupu 🤡', '🐔', true, 'cupu');
    const botPro = ScoreEngine.createInitialPlayer('bot_2', 'Sultan Strike 👑', '🤖', true, 'pro');
    setPlayers([me, botCupu, botPro]);
    setActivePlayerIndex(0);
    setGameMode(GAME_MODES.VS_BOT);
    setGameState(GAME_STATES.READY_TO_BOWL);
    soundEngine.startDiscoMusic();
  };

  const handleStartPassAndPlay = () => {
    const p1 = ScoreEngine.createInitialPlayer(myPlayerId, `${playerName} (P1)`, playerAvatar);
    const p2 = ScoreEngine.createInitialPlayer('p2', 'Teman Disco (P2)', '😎');
    setPlayers([p1, p2]);
    setActivePlayerIndex(0);
    setGameMode(GAME_MODES.PASS_AND_PLAY);
    setGameState(GAME_STATES.READY_TO_BOWL);
    soundEngine.startDiscoMusic();
  };

  // --- Online Multiplayer Room Handlers ---

  const handleCreateRoom = async (name, isPrivate, maxSlots = 6) => {
    setRoomName(name);
    setIsPrivateRoom(isPrivate);
    setMaxRoomSlots(maxSlots);
    setIsHost(true);
    setGameMode(GAME_MODES.ONLINE_MULTIPLAYER);

    const me = ScoreEngine.createInitialPlayer(myPlayerId, playerName, playerAvatar);
    me.isReady = true;
    setPlayers([me]);

    const code = await networkManager.createRoom(name, isPrivate);
    setRoomCode(code);
    setGameState(GAME_STATES.ROOM_WAITING);
  };

  const handleJoinRoom = async (code) => {
    setIsHost(false);
    setRoomCode(code.toUpperCase());
    setGameMode(GAME_MODES.ONLINE_MULTIPLAYER);

    const me = ScoreEngine.createInitialPlayer(myPlayerId, playerName, playerAvatar);
    setPlayers([me]);

    await networkManager.joinRoom(code, { id: myPlayerId, name: playerName, avatar: playerAvatar, style: characterStyle });
    setGameState(GAME_STATES.ROOM_WAITING);
    setShowRoomBrowser(false);
  };

  const handleAddBotToRoom = (difficulty) => {
    if (players.length >= maxRoomSlots) return;
    const botNames = { cupu: 'Si Cupu 🤡', medium: 'Bambang Disco 🎳', pro: 'Dewa Strike 👑' };
    const botAvatars = { cupu: '🐔', medium: '😎', pro: '🤖' };
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const botPlayer = ScoreEngine.createInitialPlayer(
      botId,
      botNames[difficulty] || 'Bot',
      botAvatars[difficulty] || '🤖',
      true,
      difficulty
    );
    botPlayer.isReady = true;

    setPlayers((prev) => {
      const updated = [...prev, botPlayer];
      networkManager.broadcast('ROOM_PLAYERS_SYNC', { players: updated });
      return updated;
    });
  };

  const handleRemovePlayer = (playerId) => {
    setPlayers((prev) => {
      const updated = prev.filter(p => p.id !== playerId);
      networkManager.broadcast('ROOM_PLAYERS_SYNC', { players: updated });
      return updated;
    });
  };

  const handleToggleReady = () => {
    setPlayers((prev) => {
      const updated = prev.map(p => p.id === myPlayerId ? { ...p, isReady: !p.isReady } : p);
      networkManager.broadcast('ROOM_PLAYERS_SYNC', { players: updated });
      return updated;
    });
  };

  const handleStartOnlineMatch = () => {
    networkManager.broadcast('START_MATCH_BROADCAST', { players });
    setActivePlayerIndex(0);
    setGameState(GAME_STATES.READY_TO_BOWL);
    soundEngine.startDiscoMusic();
  };

  const handleBackToMenu = () => {
    if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    if (networkManager.currentRoom) {
      networkManager.leaveRoom();
    }
    setGameState(GAME_STATES.LOBBY);
    setShowExitConfirm(false);
    setShowCelebration(false);
    setShowCupuAlert(false);
    setPlayers([]);
    setActivePlayerIndex(0);
    soundEngine.stopDiscoMusic();
  };

  const handleRematch = () => {
    const resetPlayers = players.map(p => ({
      ...p,
      frames: Array.from({ length: 10 }, () => ({
        rolls: [],
        score: null,
        isStrike: false,
        isSpare: false,
        isComplete: false
      })),
      totalScore: 0,
      currentFrameIndex: 0,
      currentRollIndex: 0,
      isFinished: false
    }));
    setPlayers(resetPlayers);
    setActivePlayerIndex(0);
    setGameState(GAME_STATES.READY_TO_BOWL);
    soundEngine.startDiscoMusic();
  };

  // --- In-Game Throw & Score Handlers ---

  const handleThrowBall = (throwData) => {
    setGameState(GAME_STATES.BALL_ROLLING);
    networkManager.broadcast('THROW_BROADCAST', throwData);

    // Safety timeout to evaluate roll after 4.5 seconds if ball reaches end
    if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    rollTimeoutRef.current = setTimeout(() => {
      evaluateRollResult();
    }, 4500);
  };

  const handleBallImpact = (pinStatus) => {
    if (gameState === 'BALL_ROLLING') {
      setGameState(GAME_STATES.PIN_IMPACT);
      // Wait for pins to finish scattering
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = setTimeout(() => {
        evaluateRollResult();
      }, 2200);
    }
  };

  const handleGutter = () => {
    if (gameState === 'BALL_ROLLING') {
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = setTimeout(() => {
        evaluateRollResult();
      }, 2000);
    }
  };

  /**
   * Evaluate knocked pins and update scoreboard
   */
  const evaluateRollResult = () => {
    if (gameState === 'SWEEPING' || gameState === 'FRAME_RESULT' || gameState === 'GAME_OVER') return;

    const currentPlayer = players[activePlayerIndex];
    if (!currentPlayer) return;

    const pinsRemainingBefore = ScoreEngine.getPinsRemaining(currentPlayer);
    let currentPhysicsKnocked = 0;
    if (window.__bowlingPhysics) {
      const settledStatus = window.__bowlingPhysics.checkPinStatus();
      currentPhysicsKnocked = settledStatus.knockedCount;
      window.__lastPinStatus = settledStatus;
    } else if (window.__lastPinStatus) {
      currentPhysicsKnocked = window.__lastPinStatus.knockedCount;
    }

    const fIdx = currentPlayer.currentFrameIndex;
    const currentFrame = currentPlayer.frames[fIdx];
    const rollsCount = currentFrame.rolls.length;

    let pinsHitThisRoll = 0;
    if (rollsCount === 0) {
      // First roll in frame: Always full 10 pins on deck
      pinsHitThisRoll = Math.max(0, Math.min(10, currentPhysicsKnocked));
    } else if (fIdx < 9) {
      // Frames 1-9, Roll 2: Only newly knocked pins since roll 1
      const firstRollPins = currentFrame.rolls[0] || 0;
      pinsHitThisRoll = Math.max(0, Math.min(pinsRemainingBefore, currentPhysicsKnocked - firstRollPins));
    } else {
      // Frame 10 (10th Frame Special USBC Rules):
      const r = currentFrame.rolls;
      if (rollsCount === 1) {
        // 10th Frame, Roll 2:
        if (r[0] === 10) {
          // Roll 1 was a Strike -> Fresh set of 10 pins was on deck!
          pinsHitThisRoll = Math.max(0, Math.min(10, currentPhysicsKnocked));
        } else {
          // Roll 1 was not a strike -> Spare attempt from remaining pins
          pinsHitThisRoll = Math.max(0, Math.min(10 - r[0], currentPhysicsKnocked - r[0]));
        }
      } else if (rollsCount === 2) {
        // 10th Frame, Roll 3 (Bonus Roll):
        if (r[1] === 10 || r[0] + r[1] === 10) {
          // Previous roll was a Strike or Spare -> Fresh set of 10 pins was on deck!
          pinsHitThisRoll = Math.max(0, Math.min(10, currentPhysicsKnocked));
        } else {
          // Spare attempt after second roll
          pinsHitThisRoll = Math.max(0, Math.min(10 - r[1], currentPhysicsKnocked - r[1]));
        }
      }
    }

    // Process official score
    const result = ScoreEngine.recordRoll(currentPlayer, pinsHitThisRoll);
    const totalFramePins = result.player.frames[fIdx].rolls.reduce((sum, r) => sum + r, 0);

    // Set sweeper reset mode (true = full 10-pin reset for new frame/strike; false = spare partial cleanup)
    let needsFullReset = result.isFrameComplete;
    if (fIdx === 9) {
      if (pinsHitThisRoll === 10 || result.rollType === 'STRIKE' || result.rollType === 'SPARE') {
        needsFullReset = true;
      }
    }
    setSweeperNeedsFullReset(needsFullReset);

    // Trigger visual/sound celebrations, troll taunts, or CUPU ALERT
    processRollFeedback(result.rollType, result.player.name, pinsHitThisRoll, result.isFrameComplete, totalFramePins);

    // Update player state and advance turn
    setPlayers((prev) => {
      const updated = [...prev];
      updated[activePlayerIndex] = result.player;

      // Broadcast roll result in multiplayer
      networkManager.broadcast('ROLL_RESULT_BROADCAST', {
        playerIndex: activePlayerIndex,
        updatedPlayer: result.player,
        rollType: result.rollType,
        pinsHit: pinsHitThisRoll,
        isFrameComplete: result.isFrameComplete,
        isGameOver: result.isGameOver
      });

      // Sweeping state and switch turn
      setGameState(GAME_STATES.SWEEPING);

      setTimeout(() => {
        const allFinished = updated.every(p => p.isFinished);
        if (allFinished) {
          setGameState(GAME_STATES.GAME_OVER);
        } else {
          if (result.isFrameComplete) {
            const nextIdx = (activePlayerIndex + 1) % updated.length;
            setActivePlayerIndex(nextIdx);
          }
          setGameState(GAME_STATES.READY_TO_BOWL);
        }
      }, 2200);

      return updated;
    });
  };

  const handleRemoteRollResult = (payload) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[payload.playerIndex] = payload.updatedPlayer;

      setSweeperNeedsFullReset(payload.isFrameComplete);
      processRollFeedback(payload.rollType, payload.updatedPlayer.name, payload.pinsHit, payload.isFrameComplete);
      setGameState(GAME_STATES.SWEEPING);

      setTimeout(() => {
        const allFinished = updated.every(p => p.isFinished);
        if (allFinished) {
          setGameState(GAME_STATES.GAME_OVER);
        } else {
          if (payload.isFrameComplete) {
            const nextIdx = (payload.playerIndex + 1) % updated.length;
            setActivePlayerIndex(nextIdx);
          }
          setGameState(GAME_STATES.READY_TO_BOWL);
        }
      }, 2200);

      return updated;
    });
  };

  const processRollFeedback = (rollType, name, pinsHit = 0, isFrameComplete = false, totalFramePins = 0) => {
    if (rollType === 'STRIKE') {
      soundEngine.playStrikeFanfare();
      setCelebrationType('STRIKE');
      setShowCelebration(true);
    } else if (rollType === 'SPARE') {
      soundEngine.playSpareFanfare();
      setCelebrationType('SPARE');
      setShowCelebration(true);
    } else if (rollType === 'GUTTER' || pinsHit === 0) {
      setCupuPlayerName(name);
      setShowCupuAlert(true);
      triggerFloatingEmoji('🤡', 'Sistem');
      triggerFloatingEmoji('🐔', name);
      soundEngine.playCupuSound('sad_trombone');

      // Bot auto-taunts in VS_BOT mode
      if (gameMode === GAME_MODES.VS_BOT) {
        setTimeout(() => {
          const botTaunts = [
            'Wkwk cupu banget bro 🐔🤣',
            'Gutter mulu dah 🤡',
            'Pinnya segede gaban masih lu lewatin 💩',
            'Mending balik les bowling dulu 😭'
          ];
          const randTaunt = botTaunts[Math.floor(Math.random() * botTaunts.length)];
          const newMsg = { id: `msg_${Date.now()}`, sender: 'Si Cupu 🤡', text: randTaunt };
          setChatMessages(prev => [...prev, newMsg]);
        }, 1200);
      }
    } else if (isFrameComplete && totalFramePins < 10) {
      // Open frame taunt
      const trollEmotes = ['🤡', '🐔', '💩', '🤣', '👎'];
      const chosenEmote = trollEmotes[Math.floor(Math.random() * trollEmotes.length)];
      triggerFloatingEmoji(chosenEmote, name);
      soundEngine.playCupuSound('clown');
    }
  };

  // --- Social / Taunt Emojis & Chat ---

  const triggerFloatingEmoji = (emoji, sender) => {
    const newEmoji = {
      id: `emoji_${Date.now()}_${Math.random()}`,
      emoji,
      sender,
      x: 10 + Math.random() * 80,
      duration: 3.5 + Math.random() * 1.5
    };
    setFloatingEmojis((prev) => [...prev, newEmoji]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter(e => e.id !== newEmoji.id));
    }, 5000);
  };

  const handleSendEmoji = (emoji, sound) => {
    triggerFloatingEmoji(emoji, playerName);
    networkManager.broadcast('TAUNT_EMOTE', {
      emoji,
      sound,
      senderName: playerName
    });
  };

  const handleSendMessage = (text) => {
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: playerName,
      text
    };
    setChatMessages((prev) => [...prev, newMsg]);
    networkManager.broadcast('CHAT_MESSAGE', newMsg);
  };

  return (
    <div className="disco-bowling-app">
      {/* 3D WebGL Canvas Layer (Active Match) */}
      {gameState !== GAME_STATES.LOBBY && gameState !== GAME_STATES.ROOM_WAITING && (
        <BowlingCanvas
          gameState={gameState}
          onThrowBall={handleThrowBall}
          onBallImpact={handleBallImpact}
          onGutter={handleGutter}
          ballSkin={ballSkin}
          cameraMode={cameraMode}
          characterStyle={characterStyle}
          isMyTurn={isMyTurn}
          currentStandingPins={activePlayer ? ScoreEngine.getPinsRemaining(activePlayer) : 10}
          isFullReset={sweeperNeedsFullReset}
          ballAimPos={ballAimPos}
          curveSpin={curveSpin}
          onUpdateBallAim={(x) => {
            setBallAimPos(x);
            networkManager.broadcast('AIM_UPDATE', { ballX: x });
          }}
          players={players}
          activePlayerIndex={activePlayerIndex}
        />
      )}

      {/* --- HUD Overlay Layers (In-Game) --- */}
      {gameState !== GAME_STATES.LOBBY && gameState !== GAME_STATES.ROOM_WAITING && (
        <>
          {/* Top Scoreboard */}
          <Scoreboard
            players={players}
            activePlayerIndex={activePlayerIndex}
          />

          {/* Turn Status & Controls Bar */}
          <TurnIndicator
            activePlayer={activePlayer}
            currentFrame={activePlayer ? activePlayer.currentFrameIndex + 1 : 1}
            currentRoll={activePlayer ? activePlayer.currentRollIndex + 1 : 1}
            standingPinsCount={activePlayer ? ScoreEngine.getPinsRemaining(activePlayer) : 10}
            cameraMode={cameraMode}
            onChangeCamera={(mode) => setCameraMode(mode)}
            ballSkin={ballSkin}
            onChangeBallSkin={(skinId) => setBallSkin(skinId)}
            curveSpin={curveSpin}
            onChangeCurveSpin={(spin) => setCurveSpin(spin)}
            onOpenTutorial={() => setShowTutorial(true)}
            isMyTurn={isMyTurn}
          />

          {/* Social Taunt Wheel & Quick Chat */}
          <TauntWheel
            onSendEmoji={handleSendEmoji}
            floatingEmojis={floatingEmojis}
          />
          <QuickChat
            messages={chatMessages}
            onSendMessage={handleSendMessage}
          />
        </>
      )}

      {/* Audio Jukebox Controller (Always Available) */}
      <DiscoAudioPlayer />

      {/* Top Right Home Button (Visible during active gameplay) */}
      {gameState !== GAME_STATES.LOBBY && gameState !== GAME_STATES.ROOM_WAITING && (
        <div className="top-right-nav">
          <button
            className="nav-home-btn"
            onClick={() => setShowExitConfirm(true)}
            title="Kembali ke Menu Utama"
          >
            <Home size={16} />
            <span>Menu Utama</span>
          </button>
        </div>
      )}

      {/* --- Overlay Modals & Alerts --- */}

      {/* 1. Main Menu */}
      {gameState === GAME_STATES.LOBBY && (
        <MainMenu
          playerName={playerName}
          setPlayerName={setPlayerName}
          playerAvatar={playerAvatar}
          setPlayerAvatar={setPlayerAvatar}
          characterStyle={characterStyle}
          onOpenCustomizer={() => setShowCustomizer(true)}
          onOpenTutorial={() => setShowTutorial(true)}
          onStartSolo={handleStartSolo}
          onStartVsBot={handleStartVsBot}
          onStartPassAndPlay={handleStartPassAndPlay}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onOpenRoomBrowser={() => setShowRoomBrowser(true)}
        />
      )}

      {/* 2. Character Customizer Modal */}
      {showCustomizer && (
        <CharacterCustomizer
          characterStyle={characterStyle}
          onUpdateStyle={(newStyle) => setCharacterStyle(newStyle)}
          onClose={() => setShowCustomizer(false)}
        />
      )}

      {/* 3. Spin & Mechanics Tutorial Modal */}
      <SpinTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* 4. Room Lobby Waiting Lounge */}
      {gameState === GAME_STATES.ROOM_WAITING && (
        <RoomLobby
          roomCode={roomCode}
          roomName={roomName}
          isPrivate={isPrivateRoom}
          maxSlots={maxRoomSlots}
          isHost={isHost}
          players={players}
          myPlayerId={myPlayerId}
          onStartGame={handleStartOnlineMatch}
          onAddBot={handleAddBotToRoom}
          onRemovePlayer={handleRemovePlayer}
          onToggleReady={handleToggleReady}
          onLeaveRoom={handleBackToMenu}
        />
      )}

      {/* 5. Room Browser Modal */}
      {showRoomBrowser && (
        <RoomBrowser
          publicRooms={publicRooms}
          onJoinRoom={handleJoinRoom}
          onRefresh={() => networkManager.broadcast('DISCOVER_ROOMS', {})}
          onClose={() => setShowRoomBrowser(false)}
        />
      )}

      {/* 6. Strike / Spare Celebration Banner */}
      <StrikeCelebration
        type={celebrationType}
        active={showCelebration}
        onDismiss={() => setShowCelebration(false)}
      />

      {/* 7. CUPU ALERT Troll Overlay */}
      <CupuAlert
        active={showCupuAlert}
        playerName={cupuPlayerName}
        onDismiss={() => setShowCupuAlert(false)}
        onSendTaunt={handleSendEmoji}
      />

      {/* 8. Match Over Summary & Podium */}
      {gameState === GAME_STATES.GAME_OVER && (
        <GameOverModal
          players={players}
          onRematch={handleRematch}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {/* 9. Exit to Main Menu Confirmation Modal */}
      {showExitConfirm && (
        <div className="menu-modal-backdrop">
          <div className="menu-modal-card exit-modal-card">
            <div className="modal-header">
              <h2>⚠️ KELUAR KE MENU UTAMA</h2>
              <button className="close-btn" onClick={() => setShowExitConfirm(false)}>✕</button>
            </div>
            <p className="exit-modal-desc">
              Apakah Anda yakin ingin menghentikan pertandingan saat ini dan kembali ke Menu Utama?
            </p>
            <div className="exit-modal-actions">
              <button className="exit-btn-cancel" onClick={() => setShowExitConfirm(false)}>
                Lanjut Main
              </button>
              <button className="exit-btn-confirm" onClick={handleBackToMenu}>
                <LogOut size={16} />
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
