/* tslint:disable */
/* eslint-disable */

export class Engine {
    free(): void;
    [Symbol.dispose](): void;
    add_floating_text(x: number, y: number, text: string, color: string): void;
    add_max_health(new_max: number, heal: number): void;
    blood_len(): number;
    blood_ptr(): number;
    blood_stride(): number;
    build_render_buffers(): void;
    clear_enemies(): void;
    end_dash(): void;
    enemies_len(): number;
    enemies_ptr(): number;
    enemy_count(): number;
    enemy_stride(): number;
    fire_hitscan(): number;
    heal_full(): void;
    hit_angle(i: number): number;
    hit_killed(i: number): number;
    hit_score(i: number): number;
    hit_x(i: number): number;
    hit_y(i: number): number;
    hits_count(): number;
    constructor();
    particle_stride(): number;
    particles_len(): number;
    particles_ptr(): number;
    player_angle(): number;
    player_dash_cooldown(): number;
    player_dash_energy(): number;
    player_health(): number;
    player_is_dashing(): boolean;
    player_max_dash_cooldown(): number;
    player_max_dash_energy(): number;
    player_max_health(): number;
    player_size(): number;
    player_x(): number;
    player_y(): number;
    reset_world(): void;
    set_canvas_size(w: number, h: number): void;
    set_player_health(hp: number): void;
    set_player_stats(max_health: number, speed: number, max_dash_cooldown_ms: number, fire_rate_ms: number, damage: number, piercing: number): void;
    spawn_boss(x: number, y: number, hp: number, speed: number, damage: number, score_value: number): void;
    spawn_vampire(x: number, y: number, hp: number, speed: number, damage: number, score_value: number): void;
    step(dt_ms: number, move_x: number, move_y: number, mouse_x: number, mouse_y: number): StepEvents;
    text_alpha(i: number): number;
    text_color(i: number): string;
    text_str(i: number): string;
    text_x(i: number): number;
    text_y(i: number): number;
    texts_count(): number;
    try_dash(): boolean;
}

export class StepEvents {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly bits: number;
    readonly damage_taken: number;
    readonly shake: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_engine_free: (a: number, b: number) => void;
    readonly __wbg_stepevents_free: (a: number, b: number) => void;
    readonly engine_add_floating_text: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly engine_add_max_health: (a: number, b: number, c: number) => void;
    readonly engine_blood_len: (a: number) => number;
    readonly engine_blood_ptr: (a: number) => number;
    readonly engine_blood_stride: (a: number) => number;
    readonly engine_build_render_buffers: (a: number) => void;
    readonly engine_clear_enemies: (a: number) => void;
    readonly engine_end_dash: (a: number) => void;
    readonly engine_enemies_len: (a: number) => number;
    readonly engine_enemies_ptr: (a: number) => number;
    readonly engine_enemy_stride: (a: number) => number;
    readonly engine_fire_hitscan: (a: number) => number;
    readonly engine_heal_full: (a: number) => void;
    readonly engine_hit_angle: (a: number, b: number) => number;
    readonly engine_hit_killed: (a: number, b: number) => number;
    readonly engine_hit_score: (a: number, b: number) => number;
    readonly engine_hit_x: (a: number, b: number) => number;
    readonly engine_hit_y: (a: number, b: number) => number;
    readonly engine_hits_count: (a: number) => number;
    readonly engine_new: () => number;
    readonly engine_particle_stride: (a: number) => number;
    readonly engine_particles_len: (a: number) => number;
    readonly engine_particles_ptr: (a: number) => number;
    readonly engine_player_angle: (a: number) => number;
    readonly engine_player_dash_cooldown: (a: number) => number;
    readonly engine_player_dash_energy: (a: number) => number;
    readonly engine_player_health: (a: number) => number;
    readonly engine_player_is_dashing: (a: number) => number;
    readonly engine_player_max_dash_cooldown: (a: number) => number;
    readonly engine_player_max_dash_energy: (a: number) => number;
    readonly engine_player_max_health: (a: number) => number;
    readonly engine_player_size: (a: number) => number;
    readonly engine_player_x: (a: number) => number;
    readonly engine_player_y: (a: number) => number;
    readonly engine_reset_world: (a: number) => void;
    readonly engine_set_canvas_size: (a: number, b: number, c: number) => void;
    readonly engine_set_player_health: (a: number, b: number) => void;
    readonly engine_set_player_stats: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly engine_spawn_boss: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly engine_spawn_vampire: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly engine_step: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly engine_text_alpha: (a: number, b: number) => number;
    readonly engine_text_color: (a: number, b: number) => [number, number];
    readonly engine_text_str: (a: number, b: number) => [number, number];
    readonly engine_text_x: (a: number, b: number) => number;
    readonly engine_text_y: (a: number, b: number) => number;
    readonly engine_texts_count: (a: number) => number;
    readonly engine_try_dash: (a: number) => number;
    readonly stepevents_bits: (a: number) => number;
    readonly stepevents_damage_taken: (a: number) => number;
    readonly stepevents_shake: (a: number) => number;
    readonly engine_enemy_count: (a: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
