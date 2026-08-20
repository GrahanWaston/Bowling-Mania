import React, { useState } from 'react';
import { Globe, RefreshCw, Users, ArrowRight, Lock } from 'lucide-react';

export default function RoomBrowser({
  publicRooms = [],
  onJoinRoom,
  onRefresh,
  onClose
}) {
  const [directCode, setDirectCode] = useState('');

  const handleDirectJoin = (e) => {
    e.preventDefault();
    if (directCode.trim()) {
      onJoinRoom(directCode.trim());
    }
  };

  return (
    <div className="room-browser-backdrop">
      <div className="room-browser-card">
        <div className="browser-header">
          <div className="browser-title-row">
            <Globe size={22} className="text-cyan-400" />
            <h2>PUBLIC ROOM BROWSER</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Quick Code Search Bar */}
        <form onSubmit={handleDirectJoin} className="quick-code-search">
          <input
            type="text"
            placeholder="Cari kode room spesifik..."
            value={directCode}
            onChange={(e) => setDirectCode(e.target.value.toUpperCase())}
            className="search-input uppercase"
            maxLength={8}
          />
          <button type="submit" className="search-btn" disabled={!directCode.trim()}>
            Join Kode <ArrowRight size={16} />
          </button>
        </form>

        {/* Public Rooms List */}
        <div className="browser-list-header">
          <span>ROOMS YANG SEDANG AKTIF</span>
          <button className="refresh-btn" onClick={onRefresh} title="Refresh Daftar Room">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="rooms-scroll-list">
          {publicRooms.length === 0 ? (
            <div className="empty-rooms-state">
              <span className="text-4xl">🎳</span>
              <p>Belum ada public room yang aktif saat ini.</p>
              <span className="text-xs text-gray-400">Jadilah host pertama dan buat room baru!</span>
            </div>
          ) : (
            publicRooms.map((room) => (
              <div key={room.roomCode} className="public-room-item">
                <div className="room-item-info">
                  <div className="room-name-row">
                    <span className="room-name">{room.roomName || 'Disco Room'}</span>
                    <span className="room-code-badge">{room.roomCode}</span>
                  </div>
                  <div className="room-host-details">
                    <span>Host: <strong>{room.hostName || 'Player'}</strong></span>
                    <span>•</span>
                    <span className="player-count">
                      <Users size={14} className="inline mr-1" />
                      {room.playerCount || 1}/4 Pemain
                    </span>
                  </div>
                </div>

                <button
                  className="join-item-btn"
                  onClick={() => onJoinRoom(room.roomCode)}
                  disabled={room.playerCount >= 4}
                >
                  {room.playerCount >= 4 ? 'Penuh' : 'Gabung'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
