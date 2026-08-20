import React, { useEffect, useState } from 'react';
import { AlertTriangle, Flame, Laugh, Skull } from 'lucide-react';
import { CUPU_TAUNT_MESSAGES } from '../../types/bowling';
import { soundEngine } from '../../engine/SoundEngine';

export default function CupuAlert({ active, playerName, onDismiss, onSendTaunt }) {
  const [currentMsg, setCurrentMsg] = useState(CUPU_TAUNT_MESSAGES[0]);
  const [memeIcon, setMemeIcon] = useState('🤡');

  const memeIcons = ['🤡', '🐔', '💩', '👶', '😭', '💀', '👎', '🤣'];

  useEffect(() => {
    if (active) {
      // Pick random hilarious message & icon
      const randMsg = CUPU_TAUNT_MESSAGES[Math.floor(Math.random() * CUPU_TAUNT_MESSAGES.length)];
      const randIcon = memeIcons[Math.floor(Math.random() * memeIcons.length)];
      setCurrentMsg(randMsg);
      setMemeIcon(randIcon);

      // Play random cupu sound
      const cupuSounds = ['sad_trombone', 'clown', 'chicken', 'baby', 'laugh', 'bruh', 'fart'];
      const chosenSound = cupuSounds[Math.floor(Math.random() * cupuSounds.length)];
      soundEngine.playCupuSound(chosenSound);

      const timer = setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 3400);

      return () => clearTimeout(timer);
    }
  }, [active, onDismiss]);

  if (!active) return null;

  return (
    <div className="cupu-alert-overlay">
      <div className="cupu-siren-bar top">
        <span>🚨 CUPU ALERT 🚨 ZERO PINS HIT 🚨 BEBAN TONGKRONGAN 🚨</span>
      </div>

      <div className="cupu-alert-card">
        <div className="cupu-icon-bounce">{memeIcon}</div>
        <div className="cupu-tag">
          <AlertTriangle size={18} className="text-red-500 animate-bounce" />
          <span>SKILL ISSUE DETECTED</span>
          <AlertTriangle size={18} className="text-red-500 animate-bounce" />
        </div>

        <h1 className="cupu-main-text">{currentMsg.text}</h1>
        <p className="cupu-sub-text">
          <strong className="text-yellow-300">{playerName}</strong> {currentMsg.sub}
        </p>

        {/* Quick Troll Action Buttons for Spectators / Opponents */}
        <div className="cupu-quick-taunt-row">
          <button
            className="cupu-taunt-chip"
            onClick={() => onSendTaunt && onSendTaunt('🤡', 'clown')}
          >
            Spam 🤡 Badut
          </button>
          <button
            className="cupu-taunt-chip"
            onClick={() => onSendTaunt && onSendTaunt('🐔', 'chicken')}
          >
            Spam 🐔 Ayam
          </button>
          <button
            className="cupu-taunt-chip"
            onClick={() => onSendTaunt && onSendTaunt('💩', 'fart')}
          >
            Spam 💩 Ampas
          </button>
          <button
            className="cupu-taunt-chip"
            onClick={() => onSendTaunt && onSendTaunt('👶', 'baby')}
          >
            Spam 👶 Bayi
          </button>
        </div>
      </div>

      <div className="cupu-siren-bar bottom">
        <span>🚨 GUTTER KING 👑 SEDEKAH KE SELOKAN 🚨 MOHON BERSABAR INI UJIAN 🚨</span>
      </div>
    </div>
  );
}
