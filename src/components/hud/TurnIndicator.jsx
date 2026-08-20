import React, { useState } from 'react';
import { Camera, Shield, Palette, Zap, RotateCcw, RotateCw, HelpCircle, Eye, Disc, ArrowUpRight } from 'lucide-react';
import { BALL_SKINS, CAMERA_MODES } from '../../types/bowling';

export default function TurnIndicator({
  activePlayer,
  currentFrame,
  currentRoll,
  standingPinsCount = 10,
  cameraMode,
  onChangeCamera,
  ballSkin,
  onChangeBallSkin,
  bumpersEnabled,
  onToggleBumpers,
  curveSpin = 0,
  onChangeCurveSpin,
  onOpenTutorial,
  isMyTurn = true
}) {
  const [showSkinPicker, setShowSkinPicker] = useState(false);
  const [showCameraPicker, setShowCameraPicker] = useState(false);

  if (!activePlayer) return null;

  const currentSkinObj = BALL_SKINS.find(s => s.id === ballSkin) || BALL_SKINS[0];

  const cameraOptions = [
    { id: 'APPROACH', name: 'Standard (Pundak)', desc: 'Pandangan dari belakang pemain' },
    { id: 'FOLLOW', name: 'Follow Ball (Aksi)', desc: 'Kamera meluncur mengikuti bola' },
    { id: 'PIN_VIEW', name: 'Pin Deck (Depan)', desc: 'Fokus sudut pandang pin' },
    { id: 'SIDE', name: 'Side Lounge (Samping)', desc: 'Sudut pandang penonton lounge' },
    { id: 'OVERHEAD', name: 'Overhead (Disco Top)', desc: 'Dari atas lampu disko' }
  ];

  return (
    <>
      <div className="turn-indicator-bar">
        {/* Active Player Card & Match Status */}
        <div className={`active-player-card ${isMyTurn ? 'my-turn-glow' : ''}`}>
          <div className="active-avatar-wrap">
            <span className="active-avatar">{activePlayer.avatar}</span>
            {isMyTurn && <span className="turn-pulse-ring" />}
          </div>
          <div className="active-player-info">
            <div className="active-turn-label">
              {isMyTurn ? (
                <span className="my-turn-tag">
                  <Zap size={14} className="animate-bounce text-yellow-400" /> GILIRAN ANDA
                </span>
              ) : (
                <span className="other-turn-tag">
                  Giliran: <strong>{activePlayer.name}</strong>
                </span>
              )}
            </div>
            <div className="frame-roll-badge">
              <span className="badge-item">FRAME <strong className="text-cyan-300">{currentFrame}</strong>/10</span>
              <span className="badge-divider">•</span>
              <span className="badge-item">ROLL <strong className="text-yellow-300">{currentRoll}</strong></span>
              <span className="badge-divider">•</span>
              <span className="badge-item pins-on-deck">
                <strong className="text-green-400">{standingPinsCount}</strong> PINS
              </span>
            </div>
          </div>
        </div>

        {/* Spin / Hook Angle Preset Tray */}
        {isMyTurn && (
          <div className="spin-control-tray">
            <div className="spin-header">
              <span className="spin-label">HOOK / SPIN EFEK:</span>
              <span className="spin-val-badge">
                {curveSpin < -0.1 ? 'HOOK KIRI ◄' : curveSpin > 0.1 ? 'HOOK KANAN ►' : 'LURUS ▲'}
              </span>
            </div>
            <div className="spin-btn-group">
              <button
                className={`spin-preset-btn ${curveSpin < -0.2 ? 'active-left' : ''}`}
                onClick={() => onChangeCurveSpin(-0.65)}
                title="Hook Kiri (Meliuk tajam ke kiri)"
              >
                <RotateCcw size={14} />
                <span>Kiri</span>
              </button>
              <button
                className={`spin-preset-btn ${Math.abs(curveSpin) <= 0.2 ? 'active-straight' : ''}`}
                onClick={() => onChangeCurveSpin(0)}
                title="Lemparan Lurus Menuju Headpin"
              >
                <span>Lurus</span>
              </button>
              <button
                className={`spin-preset-btn ${curveSpin > 0.2 ? 'active-right' : ''}`}
                onClick={() => onChangeCurveSpin(0.65)}
                title="Hook Kanan (Meliuk tajam ke kanan)"
              >
                <span>Kanan</span>
                <RotateCw size={14} />
              </button>
            </div>
          </div>
        )}

        {/* HUD Quick Tools & Settings */}
        <div className="hud-tools-tray">
          {/* 1. Ball Skin & Weight */}
          <button
            className="tool-btn skin-tool-btn"
            onClick={() => setShowSkinPicker(true)}
            title="Ganti Skin & Berat Bola Bowling"
          >
            <span className="skin-orb-preview" style={{ backgroundColor: currentSkinObj.color, boxShadow: `0 0 10px ${currentSkinObj.emissive}` }} />
            <div className="tool-btn-texts">
              <span className="tool-main-label">{currentSkinObj.name}</span>
              <span className="tool-sub-label">14 LBS • GALAXY</span>
            </div>
          </button>

          {/* 2. Cinematic Camera Selector */}
          <button
            className="tool-btn cam-tool-btn"
            onClick={() => setShowCameraPicker(true)}
            title="Pilih Sudut Pandang Kamera"
          >
            <Camera size={16} className="text-cyan-400" />
            <div className="tool-btn-texts">
              <span className="tool-main-label">Kamera</span>
              <span className="tool-sub-label">{cameraMode}</span>
            </div>
          </button>

          {/* 3. Tutorial Guide */}
          <button
            className="tool-btn tutorial-btn"
            onClick={onOpenTutorial}
            title="Panduan Cara Melempar Bola"
          >
            <HelpCircle size={16} className="text-yellow-400" />
            <span className="hidden md:inline">Tutorial</span>
          </button>
        </div>
      </div>

      {/* --- Ball Skin Picker Modal --- */}
      {showSkinPicker && (
        <div className="modal-backdrop">
          <div className="modal-card skin-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Disc size={20} className="text-cyan-400" />
                <h3 className="modal-title">PILIH SKIN BOLA BOWLING</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowSkinPicker(false)}>✕</button>
            </div>
            <p className="modal-subtitle">Pilih motif dan kilau bola disco favorit Anda:</p>
            <div className="skins-modal-grid">
              {BALL_SKINS.map(skin => (
                <button
                  key={skin.id}
                  className={`skin-card-btn ${ballSkin === skin.id ? 'selected' : ''}`}
                  onClick={() => {
                    onChangeBallSkin(skin.id);
                    setShowSkinPicker(false);
                  }}
                >
                  <div
                    className="skin-preview-orb"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, #ffffff, ${skin.color} 60%, #000000)`,
                      boxShadow: `0 0 16px ${skin.emissive}`
                    }}
                  />
                  <div className="skin-card-info">
                    <span className="skin-card-name">{skin.name}</span>
                    <span className="skin-card-tag">{skin.pattern.toUpperCase()} FINISH</span>
                  </div>
                  {ballSkin === skin.id && <span className="skin-active-tag">DIGUNAKAN</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Camera Angle Picker Modal --- */}
      {showCameraPicker && (
        <div className="modal-backdrop">
          <div className="modal-card camera-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Camera size={20} className="text-purple-400" />
                <h3 className="modal-title">SUDUT PANDANG KAMERA</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCameraPicker(false)}>✕</button>
            </div>
            <p className="modal-subtitle">Pilih perspektif sinematik pertandingan:</p>
            <div className="camera-modal-grid">
              {cameraOptions.map(cam => (
                <button
                  key={cam.id}
                  className={`cam-card-btn ${cameraMode === cam.id ? 'selected' : ''}`}
                  onClick={() => {
                    onChangeCamera(cam.id);
                    setShowCameraPicker(false);
                  }}
                >
                  <div className="cam-card-header">
                    <Eye size={18} className="cam-icon" />
                    <span className="cam-card-name">{cam.name}</span>
                  </div>
                  <p className="cam-card-desc">{cam.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
