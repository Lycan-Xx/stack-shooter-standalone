/**
 * Game Storage — Persistence layer for high scores, stats, and settings
 * 
 * Manages localStorage under a "vampireSiege_v1" namespace to avoid collisions.
 * Provides APIs for saving/loading:
 * - High scores per difficulty
 * - Lifetime statistics
 * - Tutorial completion state
 * - User settings (sound, volume)
 */

class GameStorage {
  constructor() {
    this.namespace = 'vampireSiege_v1';
    this.initializeStorageIfNeeded();
  }

  initializeStorageIfNeeded() {
    try {
      const data = localStorage.getItem(this.namespace);
      if (!data) {
        const initial = {
          highScores: {},
          lifetimeStats: {
            totalKills: 0,
            totalScore: 0,
            gamesPlayed: 0,
          },
          highestWaves: {},
          tutorialComplete: false,
          settings: {
            soundEnabled: true,
            soundVolume: 0.4,
            musicVolume: 0.25,
            difficulty: 'normal',
          },
          lastSession: null,
        };
        localStorage.setItem(this.namespace, JSON.stringify(initial));
      }
    } catch (e) {
      console.warn('localStorage unavailable:', e);
    }
  }

  _getData() {
    try {
      const data = localStorage.getItem(this.namespace);
      return data ? JSON.parse(data) : this._getDefaultData();
    } catch (e) {
      console.warn('Failed to read storage:', e);
      return this._getDefaultData();
    }
  }

  _getDefaultData() {
    return {
      highScores: {},
      lifetimeStats: { totalKills: 0, totalScore: 0, gamesPlayed: 0 },
      highestWaves: {},
      tutorialComplete: false,
      settings: { soundEnabled: true, soundVolume: 0.4, musicVolume: 0.25, difficulty: 'normal' },
      lastSession: null,
    };
  }

  _saveData(data) {
    try {
      localStorage.setItem(this.namespace, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save storage:', e);
    }
  }

  // ── High Scores ──────────────────────────────────────────────────
  /**
   * Add a high score for a difficulty.
   * Returns the rank (1-indexed) of this score, or 0 if not top 10.
   */
  addHighScore(difficulty, session) {
    const data = this._getData();
    if (!data.highScores[difficulty]) {
      data.highScores[difficulty] = [];
    }
    
    const scores = data.highScores[difficulty];
    scores.push({
      score: session.score,
      wave: session.wave,
      timestamp: Date.now(),
    });
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    // Keep top 10
    const rank = scores.findIndex(s => s.score === session.score) + 1;
    if (rank <= 10) {
      data.highScores[difficulty] = scores.slice(0, 10);
      this._saveData(data);
      return rank;
    }
    
    data.highScores[difficulty] = scores.slice(0, 10);
    this._saveData(data);
    return 0;
  }

  /**
   * Check if a score qualifies as a high score (top 10).
   */
  isHighScore(difficulty, score) {
    const data = this._getData();
    const scores = data.highScores[difficulty] || [];
    if (scores.length < 10) return true;
    return score > scores[scores.length - 1].score;
  }

  /**
   * Get best score for a difficulty.
   */
  getBestScore(difficulty) {
    const data = this._getData();
    const scores = data.highScores[difficulty] || [];
    return scores.length > 0 ? scores[0].score : 0;
  }

  /**
   * Get all high scores for a difficulty.
   */
  getHighScores(difficulty) {
    const data = this._getData();
    return data.highScores[difficulty] || [];
  }

  // ── Highest Waves ────────────────────────────────────────────────
  /**
   * Update the highest wave reached for a difficulty.
   */
  updateHighestWave(difficulty, wave) {
    const data = this._getData();
    if (!data.highestWaves[difficulty] || wave > data.highestWaves[difficulty]) {
      data.highestWaves[difficulty] = wave;
      this._saveData(data);
    }
  }

  /**
   * Get the highest wave reached for a difficulty.
   */
  getBestWave(difficulty) {
    const data = this._getData();
    return data.highestWaves[difficulty] || 0;
  }

  // ── Lifetime Stats ───────────────────────────────────────────────
  /**
   * Add kills and score to lifetime totals and increment games played.
   */
  addLifetimeStats(kills, score) {
    const data = this._getData();
    data.lifetimeStats.totalKills += kills;
    data.lifetimeStats.totalScore += score;
    data.lifetimeStats.gamesPlayed++;
    this._saveData(data);
  }

  /**
   * Get lifetime statistics.
   */
  getLifetimeStats() {
    const data = this._getData();
    return data.lifetimeStats;
  }

  // ── Tutorial State ───────────────────────────────────────────────
  /**
   * Mark the tutorial as complete.
   */
  markTutorialComplete() {
    const data = this._getData();
    data.tutorialComplete = true;
    this._saveData(data);
  }

  /**
   * Check if tutorial is complete.
   */
  isTutorialComplete() {
    const data = this._getData();
    return data.tutorialComplete;
  }

  // ── Settings ─────────────────────────────────────────────────────
  /**
   * Update settings (soundEnabled, soundVolume, musicVolume, difficulty).
   */
  setSettings(updates) {
    const data = this._getData();
    data.settings = { ...data.settings, ...updates };
    this._saveData(data);
  }

  /**
   * Get all settings.
   */
  getSettings() {
    const data = this._getData();
    return data.settings;
  }

  // ── Last Session ─────────────────────────────────────────────────
  /**
   * Save the last game session (wave, kills, score, difficulty).
   */
  setLastSession(session) {
    const data = this._getData();
    data.lastSession = { ...session, timestamp: Date.now() };
    this._saveData(data);
  }

  /**
   * Get the last game session.
   */
  getLastSession() {
    const data = this._getData();
    return data.lastSession;
  }

  // ── Clear All (for testing) ──────────────────────────────────────
  /**
   * Clear all saved data (debugging only).
   */
  clearAll() {
    try {
      localStorage.removeItem(this.namespace);
      this.initializeStorageIfNeeded();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  }
}

// Singleton instance
export const gameStorage = new GameStorage();

// Helper exports for component imports
export function getBestScore(difficulty) {
  return gameStorage.getBestScore(difficulty);
}

export function getBestWave(difficulty) {
  return gameStorage.getBestWave(difficulty);
}

export function getHighScores(difficulty) {
  return gameStorage.getHighScores(difficulty);
}

export function getLifetimeStats() {
  return gameStorage.getLifetimeStats();
}

export function isTutorialComplete() {
  return gameStorage.isTutorialComplete();
}
