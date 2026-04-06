import { redis } from './redis';

export type ChallengeModifier = {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: {
    enemySpeedMultiplier?: number;
    enemyHealthMultiplier?: number;
    enemyCountMultiplier?: number;
    playerSpeedMultiplier?: number;
    playerDamageMultiplier?: number;
    scoreMultiplier?: number;
    specialRule?: string;
  };
};

export type DailyChallenge = {
  date: string; // YYYY-MM-DD
  seed: number;
  modifiers: ChallengeModifier[];
  name: string;
  description: string;
};

const CHALLENGE_MODIFIERS: ChallengeModifier[] = [
  {
    id: 'speed_demons',
    name: 'Speed Demons',
    description: 'Vampires move 50% faster',
    icon: '⚡',
    effect: { enemySpeedMultiplier: 1.5, scoreMultiplier: 1.3 },
  },
  {
    id: 'tank_mode',
    name: 'Tank Mode',
    description: 'Vampires have 2x health',
    icon: '🛡️',
    effect: { enemyHealthMultiplier: 2.0, scoreMultiplier: 1.4 },
  },
  {
    id: 'horde',
    name: 'The Horde',
    description: '50% more vampires per wave',
    icon: '🌊',
    effect: { enemyCountMultiplier: 1.5, scoreMultiplier: 1.5 },
  },
  {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    description: 'You deal 2x damage but move slower',
    icon: '💥',
    effect: { playerDamageMultiplier: 2.0, playerSpeedMultiplier: 0.7, scoreMultiplier: 1.2 },
  },
  {
    id: 'bullet_time',
    name: 'Bullet Time',
    description: 'Everything moves slower',
    icon: '⏱️',
    effect: { enemySpeedMultiplier: 0.7, playerSpeedMultiplier: 0.7, scoreMultiplier: 0.9 },
  },
  {
    id: 'nightmare_fuel',
    name: 'Nightmare Fuel',
    description: 'Vampires are faster AND tougher',
    icon: '💀',
    effect: {
      enemySpeedMultiplier: 1.3,
      enemyHealthMultiplier: 1.5,
      scoreMultiplier: 1.8,
    },
  },
  {
    id: 'one_shot',
    name: 'One Shot Wonder',
    description: 'You deal massive damage but vampires are faster',
    icon: '🎯',
    effect: { playerDamageMultiplier: 3.0, enemySpeedMultiplier: 1.4, scoreMultiplier: 1.6 },
  },
  {
    id: 'swarm',
    name: 'Swarm Mode',
    description: '2x vampires, but they have less health',
    icon: '🦇',
    effect: {
      enemyCountMultiplier: 2.0,
      enemyHealthMultiplier: 0.6,
      scoreMultiplier: 1.4,
    },
  },
];

export class ChallengeService {
  /**
   * Get or generate today's daily challenge
   */
  static async getDailyChallenge(): Promise<DailyChallenge> {
    const today = this.getTodayKey();
    const cacheKey = `challenge:daily:${today}`;

    // Check if challenge exists in cache
    const cached = await redis.get<any>(cacheKey);
    if (cached) {
      return (typeof cached === "string" ? JSON.parse(cached) : cached);
    }

    // Generate new challenge
    const challenge = this.generateChallenge(today);

    // Cache for 24 hours
    await redis.set(cacheKey, JSON.stringify(challenge), { ex: 86400 });

    return challenge;
  }

  /**
   * Generate a challenge based on date seed
   */
  private static generateChallenge(date: string): DailyChallenge {
    // Use date as seed for consistent daily challenges
    const seed = this.dateToSeed(date);
    const rng = this.seededRandom(seed);

    // Pick 1-2 modifiers
    const modifierCount = Math.floor(rng() * 2) + 1; // 1 or 2 modifiers
    const selectedModifiers: ChallengeModifier[] = [];

    const availableModifiers = [...CHALLENGE_MODIFIERS];
    for (let i = 0; i < modifierCount; i++) {
      const index = Math.floor(rng() * availableModifiers.length);
      selectedModifiers.push(availableModifiers[index]);
      availableModifiers.splice(index, 1);
    }

    // Generate challenge name
    const name = this.generateChallengeName(selectedModifiers, rng);

    return {
      date,
      seed,
      modifiers: selectedModifiers,
      name,
      description: selectedModifiers.map((m) => m.description).join(' + '),
    };
  }

  /**
   * Generate a fun challenge name
   */
  private static generateChallengeName(modifiers: ChallengeModifier[], rng: () => number): string {
    const prefixes = ['Deadly', 'Extreme', 'Ultimate', 'Insane', 'Epic', 'Brutal', 'Chaos'];
    const suffixes = ['Trial', 'Gauntlet', 'Ordeal', 'Challenge', 'Test', 'Nightmare'];

    const prefix = prefixes[Math.floor(rng() * prefixes.length)];
    const suffix = suffixes[Math.floor(rng() * suffixes.length)];

    return `${prefix} ${suffix}`;
  }

  /**
   * Submit score for daily challenge
   */
  static async submitChallengeScore(
    username: string,
    date: string,
    score: number,
    wave: number,
    kills: number
  ): Promise<number> {
    const leaderboardKey = `challenge:leaderboard:${date}`;

    // Add to daily challenge leaderboard
    await redis.zadd(leaderboardKey, { member: username, score });

    // Set expiration for 30 days
    await redis.expire(leaderboardKey, 86400 * 30);

    // Get player's rank
    const rank = await redis.zrank(leaderboardKey, username);

    // Store player's challenge stats
    const statsKey = `challenge:stats:${username}:${date}`;
    await redis.hset(statsKey, {
      score: score.toString(),
      wave: wave.toString(),
      kills: kills.toString(),
      timestamp: Date.now().toString(),
    });
    await redis.expire(statsKey, 86400 * 30);

    return rank !== undefined ? rank + 1 : 0;
  }

  /**
   * Get daily challenge leaderboard
   */
  static async getChallengeLeaderboard(date: string, limit: number = 10) {
    const leaderboardKey = `challenge:leaderboard:${date}`;
    const results = (await redis.zrange(leaderboardKey, 0, limit - 1, { rev: true }) as any[]);

    return results.map((item, index) => ({
      rank: index + 1,
      username: typeof item === 'string' ? item : item.member,
      score: typeof item === 'string' ? 0 : item.score,
    }));
  }

  /**
   * Get player's challenge stats for a specific date
   */
  static async getPlayerChallengeStats(username: string, date: string) {
    const statsKey = `challenge:stats:${username}:${date}`;
    const stats = (await redis.hgetall(statsKey) as any);

    if (!stats || Object.keys(stats).length === 0) {
      return null;
    }

    return {
      score: parseInt(stats.score || '0'),
      wave: parseInt(stats.wave || '0'),
      kills: parseInt(stats.kills || '0'),
      timestamp: parseInt(stats.timestamp || '0'),
    };
  }

  /**
   * Convert date string to seed number
   */
  private static dateToSeed(date: string): number {
    const parts = date.split('-').map(Number);
    return parts[0] * 10000 + parts[1] * 100 + parts[2];
  }

  /**
   * Seeded random number generator
   */
  private static seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Get today's date key (YYYY-MM-DD)
   */
  private static getTodayKey(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
