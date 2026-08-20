import React, { useState } from 'react';
import { TAUNT_EMOJIS } from '../../types/bowling';
import { soundEngine } from '../../engine/SoundEngine';
import { MessageSquareShare } from 'lucide-react';

export default function TauntWheel({ onSendEmoji, floatingEmojis = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (item) => {
    soundEngine.playCupuSound(item.sound);
    if (onSendEmoji) {
      onSendEmoji(item.emoji, item.sound);
    }
  };

  return (
    <>
      {/* Floating Emojis Layer Across the 3D Canvas */}
      <div className="floating-emojis-container">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="floating-emoji-item"
            style={{
              left: `${item.x}%`,
              animationDuration: `${item.duration}s`
            }}
          >
            <span className="floating-emoji-text">{item.emoji}</span>
            {item.sender && <span className="floating-emoji-sender">{item.sender}</span>}
          </div>
        ))}
      </div>

      {/* Taunt Emoji Dock */}
      <div className="taunt-dock-wrap">
        <button
          className={`taunt-dock-toggle ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Buka Menu Emotikon & Troll"
        >
          <span className="text-xl">🤡</span>
          <span className="taunt-toggle-label">Taunt</span>
        </button>

        {isOpen && (
          <div className="taunt-emojis-tray">
            <div className="taunt-tray-header">
              <span>SPAM REACTION / TROLL</span>
              <button className="close-tray-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            <div className="taunt-grid">
              {TAUNT_EMOJIS.map((item, idx) => (
                <button
                  key={idx}
                  className="taunt-emoji-btn"
                  onClick={() => handleEmojiClick(item)}
                  title={item.label}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="taunt-emoji-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
