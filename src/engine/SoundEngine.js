// Advanced Web Audio API Sound Engine & Retro Disco Music Synthesizer

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.musicVolume = 0.35;
    this.sfxVolume = 0.7;
    this.isMusicPlaying = false;
    this.discoTimer = null;
    this.discoBeat = 0;
    this.tempo = 120; // 120 BPM Funk Disco
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.isMusicPlaying) {
      this.stopDiscoMusic();
    } else if (!muted && !this.isMusicPlaying) {
      this.startDiscoMusic();
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  // --- Retro Disco Music Generator ---
  startDiscoMusic() {
    if (this.isMuted || this.isMusicPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    const stepDuration = (60 / this.tempo) / 4; // 16th notes
    let step = 0;

    // Funky disco bassline (D minor / Funk groove)
    const bassNotes = [
      73.42, 73.42, 0, 73.42,  110.00, 0, 98.00, 73.42, // D2, D2, _, D2, A2, _, G2, D2
      87.31, 87.31, 0, 87.31,  130.81, 0, 116.54, 87.31, // F2...
      98.00, 98.00, 0, 98.00,  146.83, 0, 130.81, 98.00, // G2...
      65.41, 73.42, 82.41, 87.31, 98.00, 110.00, 123.47, 130.81 // walk up
    ];

    // Disco synth chords
    const chordPads = [
      [293.66, 349.23, 440.00, 523.25], // Dm7
      [349.23, 440.00, 523.25, 659.25], // Fmaj7
      [392.00, 493.88, 587.33, 698.46], // G7
      [440.00, 523.25, 659.25, 783.99]  // Am7
    ];

    const playStep = () => {
      if (!this.isMusicPlaying || this.isMuted) return;

      const now = this.ctx.currentTime;

      // 1. Kick on every quarter beat (Four-on-the-floor)
      if (step % 4 === 0) {
        this._synthesizeKick(now, 0.25 * this.musicVolume);
      }

      // 2. Snare / Clap on beats 2 and 4 (steps 4 and 12)
      if (step % 8 === 4) {
        this._synthesizeDiscoClap(now, 0.2 * this.musicVolume);
      }

      // 3. Offbeat Hi-hat (steps 2, 6, 10, 14)
      if (step % 2 === 1) {
        this._synthesizeHiHat(now, 0.1 * this.musicVolume, step % 4 === 2);
      }

      // 4. Funky Synth Bassline
      const bassFreq = bassNotes[step % bassNotes.length];
      if (bassFreq > 0) {
        this._synthesizeBass(now, bassFreq, stepDuration * 0.8, 0.22 * this.musicVolume);
      }

      // 5. Ambient Disco Arp / Chords (every 8 steps)
      if (step % 8 === 0) {
        const chordIndex = Math.floor((step / 8) % chordPads.length);
        const chord = chordPads[chordIndex];
        this._synthesizeChordPad(now, chord, stepDuration * 7, 0.12 * this.musicVolume);
      }

      step = (step + 1) % 64;
      this.discoTimer = setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  stopDiscoMusic() {
    this.isMusicPlaying = false;
    if (this.discoTimer) {
      clearTimeout(this.discoTimer);
      this.discoTimer = null;
    }
  }

  _synthesizeKick(time, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  _synthesizeDiscoClap(time, vol) {
    // White noise burst for clap/snare
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(time);
  }

  _synthesizeHiHat(time, vol, isOpen = false) {
    const bufferSize = this.ctx.sampleRate * (isOpen ? 0.08 : 0.03);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isOpen ? 0.07 : 0.025));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(time);
  }

  _synthesizeBass(time, freq, duration, vol) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(250, time + duration);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + duration);
  }

  _synthesizeChordPad(time, freqs, duration, vol) {
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(vol / freqs.length, time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    });
  }

  // --- Bowling SFX ---

  playBallRoll(speed = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const duration = 1.8;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180 * speed, now);
    filter.frequency.linearRampToValueAtTime(240 * speed, now + duration * 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.25 * this.sfxVolume, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playPinHit(intensity = 1.0, pinCount = 1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = Math.min(1.0, (0.3 + pinCount * 0.07) * intensity) * this.sfxVolume;

    // Wood resonant frequencies
    const baseFreqs = [520, 680, 840, 1150, 1420];
    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (1 + (Math.random() * 0.1 - 0.05)), now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.35);

      gain.gain.setValueAtTime(vol * (0.6 / (idx + 1)), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    });

    // Solid impact clack (noise burst)
    const bufSize = this.ctx.sampleRate * 0.08;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 4.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  playStrikeFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C Major triumph
    fanfareNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.08;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.25 * this.sfxVolume, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + (idx === fanfareNotes.length - 1 ? 1.2 : 0.4));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 1.3);
    });

    // Crowd cheer synthesized
    this._synthesizeCheer(now + 0.3, 1.5);
  }

  playSpareFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A Major chime
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.7);
    });
  }

  playGutterSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Dull metallic clonk
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playSwipeWhoosh(speed = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.25;
    const bufSize = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1600 * speed, now + duration * 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2 * this.sfxVolume, now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playSweeper() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.6);
    osc.frequency.linearRampToValueAtTime(70, now + 1.2);

    gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.3);
  }

  // --- CUPU & TROLL SFX PACK ---

  playCupuSound(type = 'sad_trombone') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    switch (type) {
      case 'sad_trombone':
        this._playSadTrombone();
        break;
      case 'clown':
        this._playClownHorn();
        break;
      case 'chicken':
        this._playChickenCluck();
        break;
      case 'baby':
        this._playBabyCrying();
        break;
      case 'laugh':
        this._playGoofyLaugh();
        break;
      case 'bruh':
        this._playBruhSound();
        break;
      case 'fart':
        this._playFartSound();
        break;
      default:
        this._playSadTrombone();
        break;
    }
  }

  _playSadTrombone() {
    const now = this.ctx.currentTime;
    const notes = [
      { freq: 233.08, dur: 0.35 }, // Bb3
      { freq: 220.00, dur: 0.35 }, // A3
      { freq: 207.65, dur: 0.35 }, // Ab3
      { freq: 196.00, dur: 0.9, slideTo: 174.61 } // G3 sliding down to F3
    ];

    let t = now;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.freq, t);

      if (n.slideTo) {
        osc.frequency.linearRampToValueAtTime(n.slideTo, t + n.dur);
      }

      // Wah wah filter envelope
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.linearRampToValueAtTime(1100, t + n.dur * 0.4);
      filter.frequency.linearRampToValueAtTime(350, t + n.dur);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + n.dur);

      t += n.dur * 0.9;
    });
  }

  _playClownHorn() {
    const now = this.ctx.currentTime;
    [0, 0.18].forEach(offset => {
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.linearRampToValueAtTime(720, t + 0.12);

      gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  _playChickenCluck() {
    const now = this.ctx.currentTime;
    const clucks = [
      { t: 0, f: 650 },
      { t: 0.12, f: 720 },
      { t: 0.24, f: 800 },
      { t: 0.4, f: 540, long: true }
    ];

    clucks.forEach(c => {
      const startTime = now + c.t;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, startTime);
      osc.frequency.exponentialRampToValueAtTime(c.f * 1.5, startTime + 0.04);
      osc.frequency.exponentialRampToValueAtTime(c.f * 0.8, startTime + (c.long ? 0.25 : 0.09));

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + (c.long ? 0.26 : 0.1));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + (c.long ? 0.28 : 0.11));
    });
  }

  _playBabyCrying() {
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.35;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.linearRampToValueAtTime(750, t + 0.15);
      osc.frequency.linearRampToValueAtTime(420, t + 0.32);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.33);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.34);
    }
  }

  _playGoofyLaugh() {
    const now = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const t = now + i * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const f = 400 + (i % 2 === 0 ? 150 : 0);
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.11);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  _playBruhSound() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(200, now + 0.45);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  _playFartSound() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.28);

    // FM modulation for raspberry texture
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    mod.frequency.value = 35;
    modGain.gain.value = 40;
    mod.connect(osc.frequency);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    mod.start(now);
    osc.start(now);
    mod.stop(now + 0.32);
    osc.stop(now + 0.32);
  }

  _synthesizeCheer(time, duration) {
    const bufSize = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.2 * this.sfxVolume, time + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(time);
  }
}

export const soundEngine = new SoundEngine();
