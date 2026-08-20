import React from 'react';
import { User, Sparkles, Check } from 'lucide-react';
import { CHARACTER_STYLES } from '../../types/bowling';

export default function CharacterCustomizer({
  characterStyle,
  onUpdateStyle,
  onClose
}) {
  return (
    <div className="character-customizer-backdrop">
      <div className="character-customizer-card">
        <div className="customizer-header">
          <div className="flex items-center gap-2">
            <User size={22} className="text-cyan-400" />
            <h2>KUSTOMISASI KARAKTER BOWLER</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="customizer-sections-scroll">
          {/* 1. Outfit / Jersey Section */}
          <div className="custom-section">
            <label className="section-title">👔 KOSTUM / JERSEY BOWLING</label>
            <div className="outfit-grid">
              {CHARACTER_STYLES.OUTFITS.map(outfit => {
                const isSelected = characterStyle.outfit.id === outfit.id;
                return (
                  <button
                    key={outfit.id}
                    className={`custom-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onUpdateStyle({ ...characterStyle, outfit })}
                  >
                    <div className="outfit-preview-box">
                      <div className="outfit-top-color" style={{ backgroundColor: outfit.topColor }} />
                      <div className="outfit-pants-color" style={{ backgroundColor: outfit.pantsColor }} />
                    </div>
                    <span className="item-name">{outfit.name}</span>
                    {isSelected && <Check size={14} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Hair & Cap Style Section */}
          <div className="custom-section">
            <label className="section-title">🧢 GAYA RAMBUT & TOPI</label>
            <div className="hair-grid">
              {CHARACTER_STYLES.HAIR_STYLES.map(hair => {
                const isSelected = characterStyle.hair.id === hair.id;
                return (
                  <button
                    key={hair.id}
                    className={`custom-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onUpdateStyle({ ...characterStyle, hair })}
                  >
                    <span className="hair-color-dot" style={{ backgroundColor: hair.color }} />
                    <span className="item-name">{hair.name}</span>
                    {isSelected && <Check size={14} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Skin Tone Section */}
          <div className="custom-section">
            <label className="section-title">🎨 WARNA KULIT (SKIN TONE)</label>
            <div className="skin-grid">
              {CHARACTER_STYLES.SKIN_TONES.map(skin => {
                const isSelected = characterStyle.skinTone.id === skin.id;
                return (
                  <button
                    key={skin.id}
                    className={`custom-item-card skin-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onUpdateStyle({ ...characterStyle, skinTone: skin })}
                  >
                    <span className="skin-swatch" style={{ backgroundColor: skin.color }} />
                    <span className="item-name">{skin.name}</span>
                    {isSelected && <Check size={14} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="customizer-footer">
          <button className="save-custom-btn" onClick={onClose}>
            <span>Simpan & Pakai Karakter ✓</span>
          </button>
        </div>
      </div>
    </div>
  );
}
