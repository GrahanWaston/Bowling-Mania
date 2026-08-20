import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { STRIKE_MESSAGES, SPARE_MESSAGES } from '../../types/bowling';

export default function StrikeCelebration({ type, active, onDismiss }) {
  useEffect(() => {
    if (active && type === 'STRIKE') {
      // Fire cosmic fireworks confetti
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00ffff', '#ff007f', '#fbbf24', '#c084fc', '#ffffff']
      });

      const timer = setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 2400);
      return () => clearTimeout(timer);
    } else if (active && type === 'SPARE') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#34d399', '#38bdf8', '#fbbf24']
      });

      const timer = setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [active, type, onDismiss]);

  if (!active || (type !== 'STRIKE' && type !== 'SPARE')) return null;

  const msgList = type === 'STRIKE' ? STRIKE_MESSAGES : SPARE_MESSAGES;
  const chosenMsg = msgList[Math.floor(Math.random() * msgList.length)];

  return (
    <div className="celebration-overlay">
      <div className={`celebration-card ${type === 'STRIKE' ? 'strike-glow' : 'spare-glow'}`}>
        <div className="celebration-badge">
          {type === 'STRIKE' ? '🎳 10 PINS DOWN 🎳' : '✨ CLEAN SPARE ✨'}
        </div>
        <h1 className="celebration-title">{chosenMsg.text}</h1>
        <p className="celebration-sub">{chosenMsg.sub}</p>
      </div>
    </div>
  );
}
