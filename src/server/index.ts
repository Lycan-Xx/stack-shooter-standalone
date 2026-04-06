import express from 'express';
import cors from 'cors';

import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
} from '../shared/types/api.js';
import { redis } from './core/redis.js';
import { LeaderboardService } from './core/leaderboard.js';
import { ChallengeService } from './core/challenges.js';
import { SquadService } from './core/squads.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// Helper to get username from header
const getUsername = (req: express.Request): string => {
  return (req.headers['x-username'] as string) || 'anonymous';
};

// Subreddit defaults to global
const getSubreddit = (req: express.Request): string => {
  return (req.headers['x-subreddit'] as string) || 'global';
};

router.get('/api/init', async (req, res): Promise<void> => {
  try {
    const count = await redis.get('count');
    const username = getUsername(req);

    res.json({
      type: 'init',
      postId: 'standalone',
      count: count ? parseInt(count as string) : 0,
      username: username,
    });
  } catch (error) {
    console.error(`API Init Error:`, error);
    res.status(400).json({ status: 'error', message: 'Initialization failed' });
  }
});

router.post('/api/score/submit', async (req, res): Promise<void> => {
  const subredditName = getSubreddit(req);
  const username = getUsername(req);
  const { score, wave, kills, difficulty } = req.body as {
    score: number;
    wave: number;
    kills: number;
    difficulty: string;
  };
  
  try {
    await LeaderboardService.saveMatchResult(
      username,
      subredditName,
      score,
      kills,
      kills,
      false
    );

    await SquadService.addSquadScore(username, score, kills, false);
    const rank = await LeaderboardService.getPlayerRank(username);
    res.json({ success: true, rank });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ success: false });
  }
});

router.get('/api/leaderboard/global', async (_req, res): Promise<void> => {
  try {
    const leaderboard = await LeaderboardService.getGlobalLeaderboard();
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, leaderboard: [] });
  }
});

router.get('/api/leaderboard/subreddit', async (req, res): Promise<void> => {
  const subredditName = getSubreddit(req);
  try {
    const leaderboard = await LeaderboardService.getSubredditLeaderboard(subredditName);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, leaderboard: [] });
  }
});

router.get('/api/leaderboard/daily', async (_req, res): Promise<void> => {
  try {
    const leaderboard = await LeaderboardService.getDailyLeaderboard();
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, leaderboard: [] });
  }
});

router.get('/api/leaderboard/weekly', async (_req, res): Promise<void> => {
  try {
    const leaderboard = await LeaderboardService.getWeeklyLeaderboard();
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, leaderboard: [] });
  }
});

router.get('/api/stats/player', async (req, res): Promise<void> => {
  const username = getUsername(req);
  try {
    const stats = await LeaderboardService.getPlayerStats(username);
    const rank = await LeaderboardService.getPlayerRank(username);
    res.json({ success: true, stats, rank });
  } catch (error) {
    res.status(500).json({ success: false, stats: null });
  }
});

router.get('/api/stats/community', async (req, res): Promise<void> => {
  const subredditName = getSubreddit(req);
  try {
    const stats = await LeaderboardService.getCommunityStats(subredditName);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, stats: null });
  }
});

router.get('/api/challenge/daily', async (_req, res): Promise<void> => {
  try {
    const challenge = await ChallengeService.getDailyChallenge();
    res.json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ success: false, challenge: null });
  }
});

router.post('/api/challenge/submit', async (req, res): Promise<void> => {
  const username = getUsername(req);
  const { score, wave, kills, date } = req.body as {
    score: number;
    wave: number;
    kills: number;
    date: string;
  };
  try {
    const rank = await ChallengeService.submitChallengeScore(username, date, score, wave, kills);
    res.json({ success: true, rank });
  } catch (error) {
    res.status(500).json({ success: false, rank: 0 });
  }
});

router.get('/api/challenge/leaderboard', async (req, res): Promise<void> => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  try {
    const leaderboard = await ChallengeService.getChallengeLeaderboard(date);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, leaderboard: [] });
  }
});

router.get('/api/challenge/stats', async (req, res): Promise<void> => {
  const username = getUsername(req);
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  try {
    const stats = await ChallengeService.getPlayerChallengeStats(username, date);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, stats: null });
  }
});

router.post('/api/squad/create', async (req, res): Promise<void> => {
  const username = getUsername(req);
  const { name, tag } = req.body as { name: string; tag: string };
  try {
    const result = await SquadService.createSquad(username, name, tag);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create squad' });
  }
});

router.get('/api/squad/my', async (req, res): Promise<void> => {
  const username = getUsername(req);
  try {
    const squad = await SquadService.getUserSquad(username);
    res.json({ success: true, squad });
  } catch (error) {
    res.status(500).json({ success: false, squad: null });
  }
});

router.get('/api/squad/:squadId', async (req, res): Promise<void> => {
  const { squadId } = req.params;
  try {
    const squad = await SquadService.getSquad(squadId);
    res.json({ success: true, squad });
  } catch (error) {
    res.status(500).json({ success: false, squad: null });
  }
});

router.get('/api/squad/:squadId/members', async (req, res): Promise<void> => {
  const { squadId } = req.params;
  try {
    const members = await SquadService.getSquadMembers(squadId);
    res.json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, members: [] });
  }
});

router.post('/api/squad/invite', async (req, res): Promise<void> => {
  const username = getUsername(req);
  const { squadId, invitedUser } = req.body as { squadId: string; invitedUser: string };
  try {
    const result = await SquadService.inviteUser(squadId, username, invitedUser);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to invite user' });
  }
});

router.post('/api/squad/join', async (req, res): Promise<void> => {
  const username = getUsername(req);
  const { squadId } = req.body as { squadId: string };
  try {
    const result = await SquadService.acceptInvite(username, squadId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to join squad' });
  }
});

router.post('/api/squad/leave', async (req, res): Promise<void> => {
  const username = getUsername(req);
  try {
    const result = await SquadService.leaveSquad(username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to leave squad' });
  }
});

router.get('/api/squad/leaderboard', async (_req, res): Promise<void> => {
  try {
    const leaderboard = await SquadService.getSquadLeaderboard();
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, leaderboard: [] });
  }
});

router.get('/api/user/avatar', async (req, res): Promise<void> => {
  const username = (req.query.username as string) || getUsername(req);
  res.json({ success: true, avatarUrl: null, username });
});

app.use(router);

export default app;

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
