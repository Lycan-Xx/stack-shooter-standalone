import { redis } from './redis';
import { PlayerStats, LeaderboardEntry, CommunityStats } from '../../shared/types/api';

const TOP_DISPLAY = 10;

export class LeaderboardService {
  /**
   * Save match results and update leaderboards
   */
  static async saveMatchResult(
    username: string,
    subredditName: string,
    score: number,
    kills: number,
    vampireKills: number,
    won: boolean
  ): Promise<void> {
    // Update global all-time leaderboard
    await redis.zAdd('leaderboard:global:alltime', { member: username, score });

    // Update subreddit leaderboard
    await redis.zAdd(`leaderboard:subreddit:${subredditName}`, { member: username, score });

    // Update daily leaderboard
    const dailyKey = `leaderboard:daily:${this.getDayKey()}`;
    await redis.zAdd(dailyKey, { member: username, score });
    await redis.expire(dailyKey, 86400 * 7); // 7 days retention

    // Update weekly leaderboard
    const weeklyKey = `leaderboard:weekly:${this.getWeekKey()}`;
    await redis.zAdd(weeklyKey, { member: username, score });
    await redis.expire(weeklyKey, 86400 * 30); // 30 days retention

    // Update player stats
    await this.updatePlayerStats(username, score, kills, vampireKills, won);

    // Update community stats
    await this.updateCommunityStats(subredditName, vampireKills);
  }

  /**
   * Update player statistics
   */
  static async updatePlayerStats(
    username: string,
    score: number,
    kills: number,
    vampireKills: number,
    won: boolean
  ): Promise<void> {
    const statsKey = `player:${username}:stats`;
    const currentStats = await redis.hGetAll(statsKey);

    const stats: PlayerStats = {
      username,
      totalKills: parseInt(currentStats.totalKills || '0') + kills,
      totalDeaths: parseInt(currentStats.totalDeaths || '0') + (won ? 0 : 1),
      totalWins: parseInt(currentStats.totalWins || '0') + (won ? 1 : 0),
      totalMatches: parseInt(currentStats.totalMatches || '0') + 1,
      bestScore: Math.max(parseInt(currentStats.bestScore || '0'), score),
      vampireKills: parseInt(currentStats.vampireKills || '0') + vampireKills,
      playerKills: parseInt(currentStats.playerKills || '0') + kills,
      kdRatio: 0,
      lastPlayed: Date.now(),
    };

    // Calculate K/D ratio
    stats.kdRatio = stats.totalDeaths > 0 ? stats.totalKills / stats.totalDeaths : stats.totalKills;

    // Save stats
    await redis.hSet(statsKey, {
      username: stats.username,
      totalKills: stats.totalKills.toString(),
      totalDeaths: stats.totalDeaths.toString(),
      totalWins: stats.totalWins.toString(),
      totalMatches: stats.totalMatches.toString(),
      bestScore: stats.bestScore.toString(),
      vampireKills: stats.vampireKills.toString(),
      playerKills: stats.playerKills.toString(),
      kdRatio: stats.kdRatio.toFixed(2),
      lastPlayed: stats.lastPlayed.toString(),
    });
  }

  /**
   * Update community statistics
   */
  static async updateCommunityStats(subredditName: string, vampireKills: number): Promise<void> {
    const statsKey = `subreddit:${subredditName}:stats`;
    const weeklyKey = `subreddit:${subredditName}:weekly:${this.getWeekKey()}`;

    // Update all-time stats
    await redis.hIncrBy(statsKey, 'totalVampiresKilled', vampireKills);
    await redis.hIncrBy(statsKey, 'totalMatches', 1);

    // Update weekly stats
    await redis.hIncrBy(weeklyKey, 'vampiresKilled', vampireKills);
    await redis.hIncrBy(weeklyKey, 'matches', 1);
    await redis.expire(weeklyKey, 86400 * 30); // 30 days retention

    // Track unique players (using a simple counter for now)
    await redis.hIncrBy(statsKey, 'uniquePlayers', 1);
  }

  /**
   * Get global leaderboard
   */
  static async getGlobalLeaderboard(limit: number = TOP_DISPLAY): Promise<LeaderboardEntry[]> {
    const results = await redis.zRange('leaderboard:global:alltime', 0, limit - 1, {
      by: 'rank',
      reverse: true,
    });

    return results.map((item, index) => ({
      rank: index + 1,
      username: typeof item === 'string' ? item : item.member,
      score: typeof item === 'string' ? 0 : item.score,
    }));
  }

  /**
   * Get subreddit leaderboard
   */
  static async getSubredditLeaderboard(
    subredditName: string,
    limit: number = TOP_DISPLAY
  ): Promise<LeaderboardEntry[]> {
    const results = await redis.zRange(`leaderboard:subreddit:${subredditName}`, 0, limit - 1, {
      by: 'rank',
      reverse: true,
    });

    return results.map((item, index) => ({
      rank: index + 1,
      username: typeof item === 'string' ? item : item.member,
      score: typeof item === 'string' ? 0 : item.score,
    }));
  }

  /**
   * Get daily leaderboard
   */
  static async getDailyLeaderboard(limit: number = TOP_DISPLAY): Promise<LeaderboardEntry[]> {
    const dailyKey = `leaderboard:daily:${this.getDayKey()}`;
    const results = await redis.zRange(dailyKey, 0, limit - 1, { by: 'rank', reverse: true });

    return results.map((item, index) => ({
      rank: index + 1,
      username: typeof item === 'string' ? item : item.member,
      score: typeof item === 'string' ? 0 : item.score,
    }));
  }

  /**
   * Get weekly leaderboard
   */
  static async getWeeklyLeaderboard(limit: number = TOP_DISPLAY): Promise<LeaderboardEntry[]> {
    const weeklyKey = `leaderboard:weekly:${this.getWeekKey()}`;
    const results = await redis.zRange(weeklyKey, 0, limit - 1, { by: 'rank', reverse: true });

    return results.map((item, index) => ({
      rank: index + 1,
      username: typeof item === 'string' ? item : item.member,
      score: typeof item === 'string' ? 0 : item.score,
    }));
  }

  /**
   * Get player statistics
   */
  static async getPlayerStats(username: string): Promise<PlayerStats | null> {
    const statsKey = `player:${username}:stats`;
    const data = await redis.hGetAll(statsKey);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      username,
      totalKills: parseInt(data.totalKills || '0'),
      totalDeaths: parseInt(data.totalDeaths || '0'),
      totalWins: parseInt(data.totalWins || '0'),
      totalMatches: parseInt(data.totalMatches || '0'),
      bestScore: parseInt(data.bestScore || '0'),
      vampireKills: parseInt(data.vampireKills || '0'),
      playerKills: parseInt(data.playerKills || '0'),
      kdRatio: parseFloat(data.kdRatio || '0'),
      lastPlayed: parseInt(data.lastPlayed || '0'),
    };
  }

  /**
   * Get player rank in global leaderboard
   */
  static async getPlayerRank(username: string): Promise<number> {
    const rank = await redis.zRank('leaderboard:global:alltime', username);
    return rank !== undefined ? rank + 1 : 0; // Convert to 1-based rank
  }

  /**
   * Get community statistics
   */
  static async getCommunityStats(subredditName: string): Promise<CommunityStats> {
    const statsKey = `subreddit:${subredditName}:stats`;
    const weeklyKey = `subreddit:${subredditName}:weekly:${this.getWeekKey()}`;

    const [allTimeData, weeklyData] = await Promise.all([
      redis.hGetAll(statsKey),
      redis.hGetAll(weeklyKey),
    ]);

    return {
      subredditName,
      totalVampiresKilled: parseInt(allTimeData.totalVampiresKilled || '0'),
      totalMatches: parseInt(allTimeData.totalMatches || '0'),
      totalPlayers: parseInt(allTimeData.uniquePlayers || '0'),
      weeklyVampires: parseInt(weeklyData.vampiresKilled || '0'),
      weeklyMatches: parseInt(weeklyData.matches || '0'),
    };
  }

  /**
   * Get day key for daily leaderboards (YYYY-MM-DD)
   */
  private static getDayKey(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /**
   * Get week key for weekly leaderboards (YYYY-WW)
   */
  private static getWeekKey(): string {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }
}
