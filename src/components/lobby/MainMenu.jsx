import React, { useState } from 'react';
import { Play, Users, Bot, Globe, PlusCircle, LogIn, ArrowRight, UserCheck, HelpCircle } from 'lucide-react';
import { soundEngine } from '../../engine/SoundEngine';

export default function MainMenu({
  playerName,
  setPlayerName,
  playerAvatar,
  setPlayerAvatar,
  characterStyle,
  onOpenCustomizer,
  onOpenTutorial,
  onStartSolo,
  onStartPassAndPlay,
  onStartVsBot,
  onCreateRoom,
  onJoinRoom,
  onOpenRoomBrowser
}) {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState(`${playerName}'s Disco Club`);
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [maxPlayersChoice, setMaxPlayersChoice] = useState(6);

  const avatars = ['🎳', '🪩', '😎', '🔥', '👑', '⚡', '🤖', '🤡', '🐔', '🦄', '👽', '🍕'];

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      soundEngine.init();
      setShowJoinModal(false);
      onJoinRoom(roomCodeInput.trim());
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    soundEngine.init();
    setShowCreateModal(false);
    onCreateRoom(roomNameInput, isPrivateRoom, maxPlayersChoice);
  };

  return (
    <div className="main-menu-container">
      <div className="disco-bg-glow glow-cyan" />
      <div className="disco-bg-glow glow-magenta" />
      <div className="disco-bg-glow glow-purple" />

      <div className="main-menu-card">
        {/* Header Title */}
        <div className="menu-header">
          <div className="disco-ball-logo animate-bounce">🪩</div>
          <h1 className="menu-title">NEON COSMIC BOWL</h1>
          <p className="menu-subtitle">XTREME MULTIPLAYER DISCO TOURNAMENT 🎳✨</p>
        </div>

        {/* Player Profile & Character Customizer Bar */}
        <div className="player-profile-section">
          <div className="flex justify-between items-center mb-1">
            <label className="profile-label">PROFIL & KARAKTER 3D</label>
            <button className="tutorial-link-btn" onClick={onOpenTutorial}>
              <HelpCircle size={14} /> Panduan Spin / Lempar
            </button>
          </div>

          <div className="profile-row">
            <div className="avatar-picker-wrap">
              <span className="selected-avatar">{playerAvatar}</span>
              <div className="avatar-dropdown">
                {avatars.map(av => (
                  <button
                    key={av}
                    className={`avatar-opt ${playerAvatar === av ? 'selected' : ''}`}
                    onClick={() => setPlayerAvatar(av)}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nama Kamu..."
              className="player-name-input"
              maxLength={16}
            />

            <button
              className="customizer-trigger-btn"
              onClick={onOpenCustomizer}
              title="Kustomisasi Karakter Bowler 3D"
            >
              <UserCheck size={18} />
              <span className="hidden sm:inline">Karakter</span>
            </button>
          </div>
        </div>

        {/* Mode Selection Grid */}
        <div className="menu-modes-grid">
          {/* 1. Solo Practice */}
          <button
            className="menu-mode-btn mode-solo"
            onClick={() => { soundEngine.init(); onStartSolo(); }}
          >
            <div className="mode-icon"><Play size={24} /></div>
            <div className="mode-details">
              <span className="mode-name">Solo Practice</span>
              <span className="mode-desc">Latihan lempar & taklukkan 10 frame</span>
            </div>
          </button>

          {/* 2. Play vs Bot AI */}
          <button
            className="menu-mode-btn mode-bot"
            onClick={() => { soundEngine.init(); onStartVsBot(); }}
          >
            <div className="mode-icon"><Bot size={24} /></div>
            <div className="mode-details">
              <span className="mode-name">Lawan Bot AI</span>
              <span className="mode-desc">Tantang Bot Cupu 🤡 & Sultan Strike 👑</span>
            </div>
          </button>

          {/* 3. Pass & Play (Local Party up to 10) */}
          <button
            className="menu-mode-btn mode-party"
            onClick={() => { soundEngine.init(); onStartPassAndPlay(); }}
          >
            <div className="mode-icon"><Users size={24} /></div>
            <div className="mode-details">
              <span className="mode-name">Pass & Play (Lokal)</span>
              <span className="mode-desc">Main bareng teman di 1 layar (2-10 Player)</span>
            </div>
          </button>

          {/* 4. Create Online Room */}
          <button
            className="menu-mode-btn mode-online"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="mode-icon"><PlusCircle size={24} /></div>
            <div className="mode-details">
              <span className="mode-name">Buat Room Online</span>
              <span className="mode-desc">Bikin room Public / Private s.d 10 Slot</span>
            </div>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="join-room-footer-row">
          <button
            className="footer-action-btn btn-join"
            onClick={() => setShowJoinModal(true)}
          >
            <LogIn size={18} />
            <span>Join Room via Kode</span>
          </button>
          <button
            className="footer-action-btn btn-browse"
            onClick={onOpenRoomBrowser}
          >
            <Globe size={18} />
            <span>Browse Public Rooms</span>
          </button>
        </div>
      </div>

      {/* Modal Create Room */}
      {showCreateModal && (
        <div className="menu-modal-backdrop">
          <div className="menu-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge bg-cyan">🪩</div>
                <div>
                  <h2 className="modal-title">BUAT ROOM MULTIPLAYER</h2>
                  <p className="modal-subtitle">Atur nama room, jumlah slot pemain, dan privasi</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">
                  <span>Nama Room / Klub Bowling</span>
                </label>
                <input
                  type="text"
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  className="modal-input"
                  placeholder="Contoh: Disco King Club"
                  maxLength={24}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Maksimal Slot Pemain</span>
                </label>
                <select
                  value={maxPlayersChoice}
                  onChange={(e) => setMaxPlayersChoice(parseInt(e.target.value))}
                  className="modal-input modal-select"
                >
                  <option value={2}>👥 2 Pemain (Head to Head)</option>
                  <option value={4}>🎳 4 Pemain (Standard Squad)</option>
                  <option value={6}>🪩 6 Pemain (Party Room - Rekomendasi)</option>
                  <option value={8}>🔥 8 Pemain (Big Match)</option>
                  <option value={10}>👑 10 Pemain (Full Tournament 🏆)</option>
                </select>
              </div>

              <div className="form-group-checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPrivateRoom}
                    onChange={(e) => setIsPrivateRoom(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <div className="checkbox-text">
                    <span className="checkbox-title">🔒 Room Private</span>
                    <span className="checkbox-desc">Hanya pemain dengan kode room yang bisa masuk</span>
                  </div>
                </label>
              </div>

              <button type="submit" className="submit-action-btn">
                <span>Gas Bikin Room Sekarang</span>
                <ArrowRight size={20} className="btn-arrow-icon" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Join Room Code */}
      {showJoinModal && (
        <div className="menu-modal-backdrop">
          <div className="menu-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge bg-magenta">🔑</div>
                <div>
                  <h2 className="modal-title">MASUKKAN KODE ROOM</h2>
                  <p className="modal-subtitle">Masukkan 6 karakter kode untuk bergabung</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowJoinModal(false)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">
                  <span>Kode Room (6 Digit)</span>
                </label>
                <input
                  type="text"
                  placeholder="CONTOH: DISCO8"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="modal-input uppercase text-center tracking-widest font-mono text-2xl font-bold"
                  maxLength={8}
                  required
                />
              </div>

              <button type="submit" className="submit-action-btn btn-join-submit">
                <span>Gabung ke Room</span>
                <ArrowRight size={20} className="btn-arrow-icon" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
