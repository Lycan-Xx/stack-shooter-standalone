import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

// Create redis instance. Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
export const redis = Redis.fromEnv();
