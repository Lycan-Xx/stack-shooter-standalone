import { redis } from './redis';

export type Squad = {
  id: string;
  name: string;
  tag: string; // 3-4 letter squad tag
  creator: string;
  members: string[];
  createdAt: number;
  totalScore: number;
  totalKills: number;
  totalWins: number;
  memberLimit: number;
};

export type SquadMember = {
  username: string;
  joinedAt: number;
  contribution: number; // Total score contributed
  kills: number;
  wins: number;
};

export type SquadInvite = {
  squadId: string;
  squadName: string;
  invitedBy: string;
  invitedUser: string;
  createdAt: number;
  expiresAt: number;
};

export class SquadService {
  private static readonly MAX_SQUAD_SIZE = 10;
  private static readonly INVITE_EXPIRY = 86400000 * 7; // 7 days

  /**
   * Create a new squad
   */
  static async createSquad(
    creator: string,
    name: string,
    tag: string
  ): Promise<{ success: boolean; squad?: Squad; error?: string }> {
    try {
      // Validate inputs
      if (!name || name.trim().length === 0) {
        return { success: false, error: 'Squad name is required' };
      }

      if (!tag || tag.trim().length === 0) {
        return { success: false, error: 'Squad tag is required' };
      }

      // Validate tag (3-4 uppercase letters)
      if (!/^[A-Z]{3,4}$/.test(tag)) {
        return { success: false, error: 'Tag must be 3-4 uppercase letters' };
      }

      // Check if tag is already taken
      const existingSquad = await redis.get(`squad:tag:${tag}`);
      if (existingSquad) {
        return { success: false, error: 'Squad tag already taken' };
      }

      // Check if user is already in a squad
      const userSquad = await redis.get(`user:${creator}:squad`);
      if (userSquad) {
        return { success: false, error: 'You are already in a squad' };
      }

      // Create squad
      const squadId = `squad_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const squad: Squad = {
        id: squadId,
        name: name.trim(),
        tag: tag.trim().toUpperCase(),
        creator,
        members: [creator],
        createdAt: Date.now(),
        totalScore: 0,
        totalKills: 0,
        totalWins: 0,
        memberLimit: this.MAX_SQUAD_SIZE,
      };

      console.log(`Creating squad: ${JSON.stringify(squad)}`);

      // Save squad
      await redis.set(`squad:${squadId}`, JSON.stringify(squad));
      await redis.set(`squad:tag:${tag}`, squadId);
      await redis.set(`user:${creator}:squad`, squadId);

      // Add to squad leaderboard
      await redis.zAdd('squads:leaderboard', { member: squadId, score: 0 });

      console.log(`Squad created successfully: ${squadId}`);
      return { success: true, squad };
    } catch (error) {
      console.error('Error creating squad:', error);
      return { success: false, error: 'Failed to create squad. Please try again.' };
    }
  }

  /**
   * Get squad by ID
   */
  static async getSquad(squadId: string): Promise<Squad | null> {
    const data = await redis.get(`squad:${squadId}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  /**
   * Get squad by tag
   */
  static async getSquadByTag(tag: string): Promise<Squad | null> {
    const squadId = await redis.get(`squad:tag:${tag}`);
    if (!squadId) return null;
    return this.getSquad(squadId);
  }

  /**
   * Get user's squad
   */
  static async getUserSquad(username: string): Promise<Squad | null> {
    const squadId = await redis.get(`user:${username}:squad`);
    if (!squadId) return null;
    return this.getSquad(squadId);
  }

  /**
   * Invite user to squad
   */
  static async inviteUser(
    squadId: string,
    invitedBy: string,
    invitedUser: string
  ): Promise<{ success: boolean; error?: string }> {
    const squad = await this.getSquad(squadId);
    if (!squad) {
      return { success: false, error: 'Squad not found' };
    }

    // Check if inviter is in squad
    if (!squad.members.includes(invitedBy)) {
      return { success: false, error: 'You are not in this squad' };
    }

    // Check if squad is full
    if (squad.members.length >= squad.memberLimit) {
      return { success: false, error: 'Squad is full' };
    }

    // Check if user is already in a squad
    const userSquad = await redis.get(`user:${invitedUser}:squad`);
    if (userSquad) {
      return { success: false, error: 'User is already in a squad' };
    }

    // Check if invite already exists
    const existingInvite = await redis.get(`invite:${invitedUser}:${squadId}`);
    if (existingInvite) {
      return { success: false, error: 'Invite already sent' };
    }

    // Create invite
    const invite: SquadInvite = {
      squadId,
      squadName: squad.name,
      invitedBy,
      invitedUser,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.INVITE_EXPIRY,
    };

    await redis.set(`invite:${invitedUser}:${squadId}`, JSON.stringify(invite), {
      expiration: new Date(invite.expiresAt),
    });

    return { success: true };
  }

  /**
   * Get user's pending invites
   */
  static async getUserInvites(username: string): Promise<SquadInvite[]> {
    // This is a simplified version - in production you'd want to scan for all invites
    // For now, we'll return empty array and handle invites through direct links
    return [];
  }

  /**
   * Accept squad invite
   */
  static async acceptInvite(
    username: string,
    squadId: string
  ): Promise<{ success: boolean; error?: string }> {
    const squad = await this.getSquad(squadId);
    if (!squad) {
      return { success: false, error: 'Squad not found' };
    }

    // Check if user is already in a squad
    const userSquad = await redis.get(`user:${username}:squad`);
    if (userSquad) {
      return { success: false, error: 'You are already in a squad' };
    }

    // Check if squad is full
    if (squad.members.length >= squad.memberLimit) {
      return { success: false, error: 'Squad is full' };
    }

    // Add user to squad
    squad.members.push(username);
    await redis.set(`squad:${squadId}`, JSON.stringify(squad));
    await redis.set(`user:${username}:squad`, squadId);

    // Delete invite
    await redis.del(`invite:${username}:${squadId}`);

    return { success: true };
  }

  /**
   * Leave squad
   */
  static async leaveSquad(username: string): Promise<{ success: boolean; error?: string }> {
    const squadId = await redis.get(`user:${username}:squad`);
    if (!squadId) {
      return { success: false, error: 'You are not in a squad' };
    }

    const squad = await this.getSquad(squadId);
    if (!squad) {
      return { success: false, error: 'Squad not found' };
    }

    // Remove user from squad
    squad.members = squad.members.filter((m) => m !== username);

    // If squad is empty, delete it
    if (squad.members.length === 0) {
      await redis.del(`squad:${squadId}`);
      await redis.del(`squad:tag:${squad.tag}`);
      await redis.zRem('squads:leaderboard', [squadId]);
    } else {
      // If creator left, assign new creator
      if (squad.creator === username) {
        squad.creator = squad.members[0];
      }
      await redis.set(`squad:${squadId}`, JSON.stringify(squad));
    }

    await redis.del(`user:${username}:squad`);

    return { success: true };
  }

  /**
   * Add score to squad
   */
  static async addSquadScore(
    username: string,
    score: number,
    kills: number,
    won: boolean
  ): Promise<void> {
    const squadId = await redis.get(`user:${username}:squad`);
    if (!squadId) return;

    const squad = await this.getSquad(squadId);
    if (!squad) return;

    // Update squad stats
    squad.totalScore += score;
    squad.totalKills += kills;
    if (won) squad.totalWins += 1;

    await redis.set(`squad:${squadId}`, JSON.stringify(squad));

    // Update squad leaderboard
    await redis.zAdd('squads:leaderboard', { member: squadId, score: squad.totalScore });

    // Update member contribution
    const memberKey = `squad:${squadId}:member:${username}`;
    const memberData = await redis.hGetAll(memberKey);
    const contribution = parseInt(memberData.contribution || '0') + score;
    const memberKills = parseInt(memberData.kills || '0') + kills;
    const memberWins = parseInt(memberData.wins || '0') + (won ? 1 : 0);

    await redis.hSet(memberKey, {
      contribution: contribution.toString(),
      kills: memberKills.toString(),
      wins: memberWins.toString(),
    });
  }

  /**
   * Get squad leaderboard
   */
  static async getSquadLeaderboard(limit: number = 10) {
    const results = await redis.zRange('squads:leaderboard', 0, limit - 1, {
      by: 'rank',
      reverse: true,
    });

    const squads = await Promise.all(
      results.map(async (item) => {
        const squadId = typeof item === 'string' ? item : item.member;
        const squad = await this.getSquad(squadId);
        return squad;
      })
    );

    return squads.filter((s) => s !== null).map((squad, index) => ({
      rank: index + 1,
      squad: squad!,
    }));
  }

  /**
   * Get squad member stats
   */
  static async getSquadMemberStats(squadId: string, username: string) {
    const memberKey = `squad:${squadId}:member:${username}`;
    const data = await redis.hGetAll(memberKey);

    if (!data || Object.keys(data).length === 0) {
      return {
        contribution: 0,
        kills: 0,
        wins: 0,
      };
    }

    return {
      contribution: parseInt(data.contribution || '0'),
      kills: parseInt(data.kills || '0'),
      wins: parseInt(data.wins || '0'),
    };
  }

  /**
   * Get all squad members with stats
   */
  static async getSquadMembers(squadId: string): Promise<SquadMember[]> {
    const squad = await this.getSquad(squadId);
    if (!squad) return [];

    const members = await Promise.all(
      squad.members.map(async (username) => {
        const stats = await this.getSquadMemberStats(squadId, username);
        return {
          username,
          joinedAt: squad.createdAt, // Simplified - would track individual join times
          contribution: stats.contribution,
          kills: stats.kills,
          wins: stats.wins,
        };
      })
    );

    return members.sort((a, b) => b.contribution - a.contribution);
  }
}
