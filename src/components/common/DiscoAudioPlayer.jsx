import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Disc } from 'lucide-react';
import { soundEngine } from '../../engine/SoundEngine';

export default function DiscoAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicVol, setMusicVol] = useState(0.35);
  const [sfxVol, setSfxVol] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleMusic = () => {
    soundEngine.init();
    if (isPlaying) {
      soundEngine.stopDiscoMusic();
      setIsPlaying(false);
    } else {
      soundEngine.startDiscoMusic();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundEngine.setMuted(newMuted);
    if (newMuted) {
      setIsPlaying(false);
    }
  };

  const handleMusicVolChange = (e) => {
    const v = parseFloat(e.target.value);
    setMusicVol(v);
    soundEngine.setMusicVolume(v);
  };

  const handleSfxVolChange = (e) => {
    const v = parseFloat(e.target.value);
    setSfxVol(v);
    soundEngine.setSfxVolume(v);
  };

  return (
    <div className="disco-audio-widget">
      <div className="audio-widget-bar">
        {/* Play/Pause Disco Beat */}
        <button
          className={`disco-beat-btn ${isPlaying ? 'playing' : ''}`}
          onClick={toggleMusic}
          title={isPlaying ? 'Pause Disco Synth Music' : 'Play Disco Funk Music'}
        >
          <Disc size={18} className={isPlaying ? 'animate-spin' : ''} />
          <span className="hidden md:inline">{isPlaying ? 'Disco: ON 🪩' : 'Disco: OFF'}</span>
          {isPlaying && (
            <div className="eq-bars">
              <span className="eq-bar bar-1" />
              <span className="eq-bar bar-2" />
              <span className="eq-bar bar-3" />
            </div>
          )}
        </button>

        {/* Mute toggle */}
        <button
          className="audio-icon-btn"
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute All'}
        >
          {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-cyan-400" />}
        </button>

        {/* Volume Settings dropdown trigger */}
        <button
          className="audio-icon-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="Audio Mixer Settings"
        >
          <Music size={18} />
        </button>
      </div>

      {isOpen && (
        <div className="audio-mixer-modal">
          <div className="mixer-header">
            <span>🎛️ COSMIC AUDIO MIXER</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="mixer-row">
            <label>Disco Synth Music</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVol}
              onChange={handleMusicVolChange}
            />
            <span>{Math.round(musicVol * 100)}%</span>
          </div>
          <div className="mixer-row">
            <label>Bowling & Taunt SFX</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVol}
              onChange={handleSfxVolChange}
            />
            <span>{Math.round(sfxVol * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
