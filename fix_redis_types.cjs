const fs = require('fs');

const files = [
  'src/server/core/challenges.ts',
  'src/server/core/leaderboard.ts',
  'src/server/core/squads.ts'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  // Convert methods to lowercase
  content = content.replace(/redis\.zAdd/g, 'redis.zadd');
  content = content.replace(/redis\.zRank/g, 'redis.zrank');
  content = content.replace(/redis\.zRange/g, 'redis.zrange');
  content = content.replace(/redis\.hSet/g, 'redis.hset');
  content = content.replace(/redis\.hGetAll/g, 'redis.hgetall');
  content = content.replace(/redis\.hIncrBy/g, 'redis.hincrby');
  content = content.replace(/redis\.zRem/g, 'redis.zrem');
  
  // Fix expiration
  content = content.replace(/{ expiration: new Date\(Date\.now\(\) \+ 86400000\) }/g, '{ ex: 86400 }');
  content = content.replace(/{ expiration: new Date\([^)]+\) }/g, '{ ex: 604800 }'); // generic fallback to 7 days if the exact match fails (only used in one place with invite.expiresAt)

  content = content.replace(/{ expiration: new Date\(invite\.expiresAt\) }/g, '{ pxat: invite.expiresAt }');

  // Fix zrange options
  content = content.replace(/{ by: 'rank', reverse: true }/g, '{ rev: true }');
  content = content.replace(/{\s*by:\s*'rank',\s*reverse:\s*true,?\s*}/g, '{ rev: true }');

  // Any string casting for get
  content = content.replace(/await redis\.get\(/g, 'await redis.get<any>(');

  // Fix hGetAll returns which are Record<string, unknown> in Upstash but string in devvit
  // We don't need to change hGetAll return type yet, TS will accept it if we cast or if type allows
  // Let's add 'as any' to hGetall to avoid TS issues if it expects string
  content = content.replace(/await redis\.hgetall\(([^)]+)\)/g, '(await redis.hgetall($1) as any)');

  // Upstash zRange returns array of unknown, so we cast it to any[]
  content = content.replace(/await redis\.zrange\(([^)]+)\)/g, '(await redis.zrange($1) as any[])');

  // Fix the Squad map type issues
  content = content.replace(/\(s\) => s !== null/g, '(s) => s != null');

  // Fix JSON parsing (Upstash does it automatically if we don't stringify, but since we DO stringify, it might parse it, so let's simplify)
  content = content.replace(/JSON\.parse\(([^)]+)\)/g, '(typeof $1 === "string" ? JSON.parse($1) : $1)');

  fs.writeFileSync(f, content);
});

console.log("Replacements complete!");
