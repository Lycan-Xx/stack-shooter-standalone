// Sound effects manager
class SoundManager {
  constructor() {
    this.sounds = {};
    // Check localStorage for saved mute preference
    const savedMute = localStorage.getItem('vampireSiegeMuted');
    this.enabled = savedMute === null ? true : savedMute === 'false';
    this.volume = 0.3;
    this.musicVolume = 0.2;
    this.music = null;
  }

  load(key, url, volume = 1.0) {
    // Completely disabled to avoid CSP violations in Reddit
    // Do not create Audio objects with external URLs
    return;
  }

  loadMusic(url) {
    // Completely disabled to avoid CSP violations in Reddit
    return;
  }

  play(key) {
    // Completely disabled to avoid CSP violations in Reddit
    return;
  }

  playMusic() {
    if (this.music && this.enabled) {
      this.music.play().catch(() => {});
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    Object.entries(this.sounds).forEach(([key, sound]) => {
      sound.audio.volume = this.volume * sound.baseVolume;
    });
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.music) {
      this.music.volume = this.musicVolume;
    }
  }

  mute() {
    this.enabled = false;
    this.stopMusic();
    localStorage.setItem('vampireSiegeMuted', 'false');
  }

  unmute() {
    this.enabled = true;
    localStorage.setItem('vampireSiegeMuted', 'true');
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopMusic();
    } else {
      this.playMusic();
    }
    // Save preference to localStorage
    localStorage.setItem('vampireSiegeMuted', this.enabled);
    return this.enabled;
  }
}

// Create and export sound manager
export const soundManager = new SoundManager();

// Load all sound effects
soundManager.load('shoot', 'https://play.rosebud.ai/assets/Retro Gun SingleShot 04.wav?qSZl', 0.4);
soundManager.load('enemyHit', 'https://play.rosebud.ai/assets/Retro Impact 20.wav?16D7', 0.6);
soundManager.load(
  'enemyDeath',
  'https://play.rosebud.ai/assets/Retro Impact Punch 07.wav?a0jF',
  0.7
);
soundManager.load(
  'playerHurt',
  'https://play.rosebud.ai/assets/Retro Impact Punch Hurt 01.wav?4k5W',
  0.8
);
soundManager.load('dash', 'https://play.rosebud.ai/assets/Retro Event StereoUP 02.wav?GMTo', 0.5);
soundManager.load(
  'waveComplete',
  'https://play.rosebud.ai/assets/Retro PickUp Coin 07.wav?A9Vy',
  0.8
);
soundManager.load(
  'scorePoint',
  'https://play.rosebud.ai/assets/Retro PickUp Coin 04.wav?EL3u',
  0.5
);
soundManager.load('upgrade', 'https://play.rosebud.ai/assets/Retro Event UI 13.wav?jgf1', 0.7);
soundManager.load('gameOver', 'https://play.rosebud.ai/assets/Retro Event Echo 12.wav?RERk', 0.8);
soundManager.load('uiClick', 'https://play.rosebud.ai/assets/Retro Event UI 01.wav?24vp', 0.6);
soundManager.load('powerUp', 'https://play.rosebud.ai/assets/Retro PickUp Coin 07.wav?A9Vy', 0.7);
soundManager.load('respawn', 'https://play.rosebud.ai/assets/Retro Event StereoUP 02.wav?GMTo', 0.6);
soundManager.load('playerKill', 'https://play.rosebud.ai/assets/Retro Impact Punch 07.wav?a0jF', 0.9);

// Load background music
soundManager.loadMusic('https://play.rosebud.ai/assets/1-08. No Mortals Allowed.mp3?y9Cy');
