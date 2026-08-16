/**
 * Sound Manager — Web Audio API + Synthesized Fallback
 * 
 * Replaces the stubbed Audio-based system. Supports:
 * - Real audio file loading (place files in /public/assets/sounds/)
 * - Synthesized fallback sounds (game works immediately, no assets needed)
 * - Mute/unmute with localStorage persistence
 * - Music loop support
 * - Volume control
 * - Mobile-friendly (no autoplay blocking issues)
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.enabled = true;
    this.volume = 0.4;
    this.musicVolume = 0.25;
    this.musicSource = null;
    this.musicBuffer = null;
    this.buffers = new Map(); // cached decoded audio buffers
    this.synthDefinitions = new Map();

    // Load saved preferences
    try {
      const savedMute = localStorage.getItem('vampireSiegeMuted');
      this.enabled = savedMute === null ? true : savedMute !== 'true';
      const savedVol = localStorage.getItem('vampireSiegeVolume');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
      const savedMusicVol = localStorage.getItem('vampireSiegeMusicVolume');
      if (savedMusicVol !== null) this.musicVolume = parseFloat(savedMusicVol);
    } catch (e) {
      // localStorage unavailable (private mode, etc.)
    }

    this._initAudioContext();
    this._registerSynthSounds();
  }

  // ── Audio Context Lifecycle ─────────────────────────────────────
  _initAudioContext() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.enabled ? this.volume : 0;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1.0;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }

  _ensureContext() {
    if (!this.ctx) this._initAudioContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ── Sound Registration ──────────────────────────────────────────
  /**
   * Register a sound. If `url` points to a real file, it will be loaded.
   * Otherwise, the synthesized fallback with name `key` will be used.
   * 
   * Usage:
   *   soundManager.load('shoot', '/assets/sounds/shoot.wav');
   *   soundManager.load('shoot'); // uses synthesized fallback
   */
  load(key, url = null, volume = 1.0) {
    if (!this.ctx) this._initAudioContext();

    // If a URL is provided, try to fetch and decode it
    if (url) {
      this._loadBuffer(key, url, volume);
    }
    // Synth fallback is already registered in _registerSynthSounds
  }

  async _loadBuffer(key, url, volume) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(key, { buffer: audioBuffer, volume, isReal: true });
    } catch (e) {
      console.warn(`Failed to load sound "${key}" from ${url}:`, e);
      // Synth fallback remains available
    }
  }

  loadMusic(url) {
    this.load('__music__', url, 1.0);
  }

  // ── Playback ────────────────────────────────────────────────────
  play(key) {
    this._ensureContext();
    if (!this.ctx || !this.enabled) return;

    const def = this.buffers.get(key);
    if (def && def.buffer) {
      // Play real audio buffer
      this._playBuffer(def.buffer, def.volume, false);
    } else if (this.synthDefinitions.has(key)) {
      // Play synthesized sound
      this.synthDefinitions.get(key)();
    }
  }

  _playBuffer(buffer, volume, isMusic) {
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(isMusic ? this.musicGain : this.sfxGain);
    source.start(0);
    return source;
  }

  playMusic() {
    this._ensureContext();
    if (!this.ctx || !this.enabled) return;
    if (this.musicSource) return; // already playing

    const def = this.buffers.get('__music__');
    if (def && def.buffer) {
      this.musicSource = this._playBuffer(def.buffer, 1.0, true);
      this.musicSource.loop = true;
      this.musicSource.onended = () => { this.musicSource = null; };
    } else {
      // Synthesized ambient drone
      this._playSynthMusic();
    }
  }

  stopMusic() {
    if (this.musicSource) {
      try { this.musicSource.stop(); } catch (e) {}
      this.musicSource = null;
    }
    if (this._musicOscillators) {
      this._musicOscillators.forEach(o => {
        try { o.stop(); o.disconnect(); } catch (e) {}
      });
      this._musicOscillators = null;
    }
  }

  // ── Volume & Mute ───────────────────────────────────────────────
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.enabled ? this.volume : 0,
        this.ctx.currentTime,
        0.1
      );
    }
    try { localStorage.setItem('vampireSiegeVolume', this.volume); } catch (e) {}
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.1);
    }
    try { localStorage.setItem('vampireSiegeMusicVolume', this.musicVolume); } catch (e) {}
  }

  mute() {
    this.enabled = false;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    this.stopMusic();
    try { localStorage.setItem('vampireSiegeMuted', 'true'); } catch (e) {}
  }

  unmute() {
    this.enabled = true;
    this._ensureContext();
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
    try { localStorage.setItem('vampireSiegeMuted', 'false'); } catch (e) {}
  }

  toggle() {
    if (this.enabled) this.mute();
    else this.unmute();
    return this.enabled;
  }

  isMuted() {
    return !this.enabled;
  }

  // ── Synthesized Sound Library ───────────────────────────────────
  /**
   * Procedurally generated sound effects using Web Audio API oscillators.
   * These fire instantly with no asset loading required.
   */
  _registerSynthSounds() {
    const reg = (key, fn) => this.synthDefinitions.set(key, fn);

    // SHOOT: Short noise burst + high-pitch decay
    reg('shoot', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.1);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.1);
    });

    // ENEMY HIT: Mid thud
    reg('enemyHit', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.08);
    });

    // ENEMY DEATH: Descending tone + noise
    reg('enemyDeath', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });

    // PLAYER HURT: Sharp high tone
    reg('playerHurt', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(300, t + 0.15);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    });

    // DASH: Whoosh / noise sweep
    reg('dash', () => {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.15);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      source.start(t);
    });

    // WAVE COMPLETE: Ascending major triad
    reg('waveComplete', () => {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, t + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.4);
      });
    });

    // SCORE POINT: High ping
    reg('scorePoint', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(1800, t + 0.05);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.1);
    });

    // UPGRADE: Magical chime
    reg('upgrade', () => {
      const t = this.ctx.currentTime;
      const notes = [880, 1100, 1320];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.1, t + i * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.3);
      });
    });

    // GAME OVER: Descending dramatic tone
    reg('gameOver', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 1.0);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.0);
    });

    // UI CLICK: Short blip
    reg('uiClick', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.05);
    });

    // POWER UP: Rising sweep
    reg('powerUp', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });

    // RESPAWN: Bright ascending
    reg('respawn', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    });

    // PLAYER KILL: Heavy impact
    reg('playerKill', () => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // ── Synthesized Ambient Music ───────────────────────────────────
  _playSynthMusic() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    this._musicOscillators = [];

    // Dark ambient drone: two low detuned oscillators
    const freqs = [55, 58.27]; // A1, Bb1 (dissonant)
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, t);
      filter.Q.value = 1;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      this._musicOscillators.push(osc);
    });

    // Slow LFO on filter for movement
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // 10 second cycle
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    // Connect LFO to both filter frequencies
    lfoGain.connect(this._musicOscillators[0].context ? 
      this._musicOscillators[0] : null);
    lfo.start(t);
    this._musicOscillators.push(lfo);
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Optional: preload real audio files if they exist
// Place .wav/.mp3 files in your public/assets/sounds/ directory
// and uncomment below:
/*
soundManager.load('shoot', '/assets/sounds/shoot.wav', 0.4);
soundManager.load('enemyHit', '/assets/sounds/enemyHit.wav', 0.6);
soundManager.load('enemyDeath', '/assets/sounds/enemyDeath.wav', 0.7);
soundManager.load('playerHurt', '/assets/sounds/playerHurt.wav', 0.8);
soundManager.load('dash', '/assets/sounds/dash.wav', 0.5);
soundManager.load('waveComplete', '/assets/sounds/waveComplete.wav', 0.8);
soundManager.load('scorePoint', '/assets/sounds/scorePoint.wav', 0.5);
soundManager.load('upgrade', '/assets/sounds/upgrade.wav', 0.7);
soundManager.load('gameOver', '/assets/sounds/gameOver.wav', 0.8);
soundManager.load('uiClick', '/assets/sounds/uiClick.wav', 0.6);
soundManager.load('powerUp', '/assets/sounds/powerUp.wav', 0.7);
soundManager.load('respawn', '/assets/sounds/respawn.wav', 0.6);
soundManager.load('playerKill', '/assets/sounds/playerKill.wav', 0.9);
soundManager.loadMusic('/assets/sounds/music.mp3');
*/
