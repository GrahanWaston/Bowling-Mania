import React, { useState } from 'react';
import { Copy, Check, Users, Bot, Play, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { soundEngine } from '../../engine/SoundEngine';

export default function RoomLobby({
  roomCode,
  roomName,
  isPrivate,
  isHost,
  maxSlots = 10,
  players = [],
  myPlayerId,
  onStartGame,
  onAddBot,
  onRemovePlayer,
  onToggleReady,
  onLeaveRoom
}) {
  const [copied, setCopied] = useState(false);

  const safeCopy = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    safeCopy(url);
  };

  const copyRoomCode = () => {
    safeCopy(roomCode);
  };

  const myPlayer = players.find(p => p.id === myPlayerId);
  const isReady = myPlayer?.isReady || false;
  const canStart = players.length >= 1;

  return (
    <div className="room-lobby-container">
      <div className="room-lobby-card lobby-wide">
        {/* Header with Room Code */}
        <div className="lobby-header">
          <div className="lobby-title-wrap">
            <h2 className="lobby-title">{roomName || 'Xtreme Disco Lounge'}</h2>
            <span className={`privacy-badge ${isPrivate ? 'private' : 'public'}`}>
              {isPrivate ? '🔒 PRIVATE ROOM' : '🌐 PUBLIC ROOM'}
            </span>
          </div>

          <div className="room-code-box">
            <span className="code-label">KODE ROOM:</span>
            <span className="code-value">{roomCode}</span>
            <button className="copy-btn" onClick={copyRoomCode} title="Salin Kode Room">
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Share invite banner */}
        <div className="invite-banner">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            <span>Maksimal <strong>{maxSlots} Pemain</strong>! Bagikan kode atau link untuk mabar.</span>
          </div>
          <button className="share-link-btn" onClick={copyRoomLink}>
            {copied ? 'Link Tersalin! ✓' : 'Salin Link Room'}
          </button>
        </div>

        {/* Player Slots (Up to 10 slots) */}
        <div className="player-slots-section">
          <div className="slots-header">
            <span>DAFTAR SLOT PEMAIN ({players.length}/{maxSlots})</span>
            {isHost && players.length < maxSlots && (
              <div className="add-bot-dropdown">
                <button className="add-bot-btn" title="Tambahkan Bot AI">
                  <Bot size={16} />
                  <span>+ Tambah Bot</span>
                </button>
                <div className="bot-dropdown-menu">
                  <button onClick={() => onAddBot('cupu')}>🤡 Bot Cupu (Langganan Gutter)</button>
                  <button onClick={() => onAddBot('medium')}>🎳 Bot Bambang (Casual)</button>
                  <button onClick={() => onAddBot('pro')}>👑 Bot Dewa Strike (Pro Pocket)</button>
                </div>
              </div>
            )}
          </div>

          <div className="player-slots-scrollable-grid">
            {Array.from({ length: Math.min(10, Math.max(players.length + 1, maxSlots)) }).map((_, slotIdx) => {
              const player = players[slotIdx];

              if (player) {
                const isMe = player.id === myPlayerId;
                const isPlayerHost = slotIdx === 0;

                return (
                  <div key={player.id} className={`player-slot-card filled ${isMe ? 'slot-me' : ''}`}>
                    <div className="slot-avatar">{player.avatar}</div>
                    <div className="slot-info">
                      <div className="slot-name-row">
                        <span className="slot-name">{player.name} {isMe ? '(Kamu)' : ''}</span>
                        {isPlayerHost && <span className="host-tag">HOST</span>}
                      </div>
                      {player.isBot ? (
                        <span className="bot-badge">BOT ({player.botDifficulty})</span>
                      ) : (
                        <span className={`ready-badge ${player.isReady ? 'ready' : 'waiting'}`}>
                          {player.isReady ? '✓ READY' : 'Belum Ready'}
                        </span>
                      )}
                    </div>

                    {isHost && !isPlayerHost && (
                      <button
                        className="remove-slot-btn"
                        onClick={() => onRemovePlayer(player.id)}
                        title="Keluarkan dari Room"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div key={slotIdx} className="player-slot-card empty">
                  <span className="empty-slot-icon"><Users size={20} /></span>
                  <span className="empty-slot-text">Slot Kosong {slotIdx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lobby Actions Footer */}
        <div className="lobby-actions-footer">
          <button className="leave-room-btn" onClick={onLeaveRoom}>
            <LogOut size={18} />
            <span>Keluar Room</span>
          </button>

          <div className="right-actions-group">
            {!isHost && (
              <button
                className={`ready-toggle-btn ${isReady ? 'is-ready' : ''}`}
                onClick={onToggleReady}
              >
                <ShieldCheck size={18} />
                <span>{isReady ? 'BATAL READY' : 'SIAP / READY!'}</span>
              </button>
            )}

            {isHost && (
              <button
                className="start-match-btn"
                onClick={() => { soundEngine.init(); onStartGame(); }}
                disabled={!canStart}
              >
                <Play size={20} />
                <span>MULAI MATCH ({players.length} Pemain) 🎳</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
