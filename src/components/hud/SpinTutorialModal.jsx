import React from 'react';
import { HelpCircle, Sparkles, MoveHorizontal, RotateCw, Flame, Target } from 'lucide-react';

export default function SpinTutorialModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="spin-tutorial-backdrop">
      <div className="spin-tutorial-card">
        <div className="tutorial-header">
          <div className="flex items-center gap-2">
            <HelpCircle size={24} className="text-yellow-400" />
            <h2>PANDUAN LENGKAP MEKANIK & EFEK SPIN 🎳</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="tutorial-content-scroll">
          {/* Step 1 */}
          <div className="tutorial-step-card">
            <div className="step-badge">1. POSISI AWAL (APPROACH)</div>
            <div className="step-body">
              <MoveHorizontal size={28} className="text-cyan-400 shrink-0" />
              <div>
                <p className="step-heading">Geser Bola ke Samping</p>
                <p className="step-desc">
                  Sebelum melempar, geser kursor atau jari Anda ke kiri/kanan di area approach untuk memposisikan titik start bowler.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="tutorial-step-card">
            <div className="step-badge">2. MELEMPAR & POWER</div>
            <div className="step-body">
              <Flame size={28} className="text-orange-400 shrink-0 animate-bounce" />
              <div>
                <p className="step-heading">Swipe Maju ke Atas</p>
                <p className="step-desc">
                  Klik & tarik cepat (swipe flick) ke arah atas. Karakter 3D akan melangkah, melakukan <em>backswing</em>, meluncur (slide), dan melepas bola ke jalur! Makin cepat swipe = makin kencang power lemparan.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="tutorial-step-card highlight">
            <div className="step-badge">3. EFEK SPIN & CURVE (HOOK SHOT) 🔥</div>
            <div className="step-body">
              <RotateCw size={28} className="text-pink-400 shrink-0 animate-spin" />
              <div>
                <p className="step-heading">Membuat Bola Melengkung</p>
                <p className="step-desc">
                  <strong>• Cara Swipe:</strong> Tarik serong atau melengkung ke kiri/kanan saat swipe up.<br />
                  <strong>• Cara Spin Slider:</strong> Gunakan tombol / slider <em>Spin Control</em> di HUD.<br />
                  Bola akan berputar dan berbelok tajam (hook) di ujung lane ketika mengenai permukaan kering!
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="tutorial-step-card">
            <div className="step-badge">4. RAHASIA AUTO STRIKE 👑</div>
            <div className="step-body">
              <Target size={28} className="text-green-400 shrink-0" />
              <div>
                <p className="step-heading">Incar "Pocket" (Antara Pin 1 & Pin 3)</p>
                <p className="step-desc">
                  Berdiri agak ke kanan jalur (x: +0.20), lalu lempar dengan spin kiri (-0.50). Bola akan melengkung masuk sempurna di antara Headpin 1 dan Pin 3 sehingga seluruh 10 pin bertabrakan rata (Strike Domino Effect)!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-footer">
          <button className="tutorial-action-btn" onClick={onClose}>
            <span>Siap, Saya Mau Coba Sekarang! 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}
