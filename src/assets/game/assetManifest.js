/**
 * Phase 2 asset contract.
 *
 * Keep names stable while art is iterated. Renderer work can resolve these
 * paths later without coupling gameplay state to individual files.
 */
export const GAME_ASSET_MANIFEST = {
  player: [
    'player_idle',
    'player_move',
    'player_fire',
    'player_dash',
    'player_hit',
    'player_death',
  ],
  enemies: [
    'vampire_basic_idle',
    'vampire_basic_move',
    'vampire_basic_attack',
    'vampire_basic_hit',
    'vampire_basic_death',
  ],
  bosses: ['boss_idle', 'boss_move', 'boss_attack', 'boss_special', 'boss_hit', 'boss_death'],
  environments: [
    'ground_stone',
    'ground_cracks',
    'grave_01',
    'grave_02',
    'dead_tree',
    'ruined_wall',
    'pillar',
    'candles',
    'bones',
    'blood_stain_01',
    'blood_stain_02',
    'fog_patch',
  ],
  effects: ['muzzle_flash', 'bullet_tracer', 'impact_spark', 'blood_splash', 'death_burst', 'dash_trail'],
  ui: [],
  upgrades: [],
  backgrounds: [],
  audio: [],
};

export const GAME_ASSET_DIRECTORIES = Object.keys(GAME_ASSET_MANIFEST);
