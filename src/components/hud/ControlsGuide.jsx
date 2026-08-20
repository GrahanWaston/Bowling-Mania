import React from 'react';
import { MoveHorizontal, ArrowUp, Flame, Zap } from 'lucide-react';

export default function ControlsGuide({ isAiming, dragProgress = 0, isMyTurn = true }) {
  if (!isMyTurn) {
    return (
      <div className="spectate-guide-pill">
        <span className="animate-pulse">👀 Menunggu giliran lawan melempar...</span>
      </div>
    );
  }

  return (
    <div className="controls-guide-container">
      {isAiming ? (
        <div className="aiming-power-hud">
          <div className="power-bar-wrap">
            <div
              className="power-bar-fill"
              style={{
                height: `${Math.min(100, dragProgress * 100)}%`,
                backgroundColor: dragProgress > 0.8 ? '#ef4444' : dragProgress > 0.4 ? '#f59e0b' : '#00f5ff'
              }}
            />
          </div>
          <div className="aiming-text">
            <Flame size={18} className="text-yellow-400 animate-bounce inline mr-1" />
            <span>LEPASKAN UNTUK LEMPAR!</span>
          </div>
        </div>
      ) : (
        <div className="holographic-swipe-zone">
          <div className="swipe-arrow-indicator">
            <ArrowUp size={24} className="arrow-pulse arrow-1" />
            <ArrowUp size={24} className="arrow-pulse arrow-2" />
          </div>
          <div className="swipe-guide-text">
            <span className="main-hint">👆 SWIPE KE ATAS UNTUK LEMPAR BOLA</span>
            <span className="sub-hint">Geser samping untuk atur posisi • Miringkan swipe untuk curve/spin</span>
          </div>
        </div>
      )}
    </div>
  );
}
