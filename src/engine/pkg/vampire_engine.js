/* @ts-self-types="./vampire_engine.d.ts" */

export class Engine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EngineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_engine_free(ptr, 0);
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {string} text
     * @param {string} color
     */
    add_floating_text(x, y, text, color) {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(color, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.engine_add_floating_text(this.__wbg_ptr, x, y, ptr0, len0, ptr1, len1);
    }
    /**
     * @param {number} new_max
     * @param {number} heal
     */
    add_max_health(new_max, heal) {
        wasm.engine_add_max_health(this.__wbg_ptr, new_max, heal);
    }
    /**
     * @returns {number}
     */
    blood_len() {
        const ret = wasm.engine_blood_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    blood_ptr() {
        const ret = wasm.engine_blood_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    blood_stride() {
        const ret = wasm.engine_blood_stride(this.__wbg_ptr);
        return ret >>> 0;
    }
    build_render_buffers() {
        wasm.engine_build_render_buffers(this.__wbg_ptr);
    }
    clear_enemies() {
        wasm.engine_clear_enemies(this.__wbg_ptr);
    }
    end_dash() {
        wasm.engine_end_dash(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    enemies_len() {
        const ret = wasm.engine_enemies_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    enemies_ptr() {
        const ret = wasm.engine_enemies_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    enemy_count() {
        const ret = wasm.engine_enemy_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    enemy_stride() {
        const ret = wasm.engine_enemy_stride(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    fire_hitscan() {
        const ret = wasm.engine_fire_hitscan(this.__wbg_ptr);
        return ret >>> 0;
    }
    heal_full() {
        wasm.engine_heal_full(this.__wbg_ptr);
    }
    /**
     * @param {number} i
     * @returns {number}
     */
    hit_angle(i) {
        const ret = wasm.engine_hit_angle(this.__wbg_ptr, i);
        return ret;
    }
    /**
     * @param {number} i
     * @returns {number}
     */
    hit_killed(i) {
        const ret = wasm.engine_hit_killed(this.__wbg_ptr, i);
        return ret >>> 0;
    }
    /**
     * @param {number} i
     * @returns {number}
     */
    hit_score(i) {
        const ret = wasm.engine_hit_score(this.__wbg_ptr, i);
        return ret;
    }
    /**
     * @param {number} i
     * @returns {number}
     */
    hit_x(i) {
        const ret = wasm.engine_hit_x(this.__wbg_ptr, i);
        return ret;
    }
    /**
     * @param {number} i
     * @returns {number}
     */
    hit_y(i) {
        const ret = wasm.engine_hit_y(this.__wbg_ptr, i);
        return ret;
    }
    /**
     * @returns {number}
     */
    hits_count() {
        const ret = wasm.engine_hits_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    constructor() {
        const ret = wasm.engine_new();
        this.__wbg_ptr = ret >>> 0;
        EngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    particle_stride() {
        const ret = wasm.engine_particle_stride(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    particles_len() {
        const ret = wasm.engine_particles_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    particles_ptr() {
        const ret = wasm.engine_particles_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    player_angle() {
        const ret = wasm.engine_player_angle(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    player_dash_cooldown() {
        const ret = wasm.engine_player_dash_cooldown(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    player_dash_energy() {
        const ret = wasm.engine_player_dash_energy(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    player_health() {
        const ret = wasm.engine_player_health(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    player_is_dashing() {
        const ret = wasm.engine_player_is_dashing(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    player_max_dash_cooldown() {
        const ret = wasm.engine_player_max_dash_cooldown(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    player_max_dash_energy() {
        const ret = wasm.engine_player_max_dash_energy(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    player_max_health() {
        const ret = wasm.engine_player_max_health(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    player_size() {
        const ret = wasm.engine_player_size(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    player_x() {
        const ret = wasm.engine_player_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    player_y() {
        const ret = wasm.engine_player_y(this.__wbg_ptr);
        return ret;
    }
    reset_world() {
        wasm.engine_reset_world(this.__wbg_ptr);
    }
    /**
     * @param {number} w
     * @param {number} h
     */
    set_canvas_size(w, h) {
        wasm.engine_set_canvas_size(this.__wbg_ptr, w, h);
    }
    /**
     * @param {number} hp
     */
    set_player_health(hp) {
        wasm.engine_set_player_health(this.__wbg_ptr, hp);
    }
    /**
     * @param {number} max_health
     * @param {number} speed
     * @param {number} max_dash_cooldown_ms
     * @param {number} fire_rate_ms
     * @param {number} damage
     * @param {number} piercing
     */
    set_player_stats(max_health, speed, max_dash_cooldown_ms, fire_rate_ms, damage, piercing) {
        wasm.engine_set_player_stats(this.__wbg_ptr, max_health, speed, max_dash_cooldown_ms, fire_rate_ms, damage, piercing);
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} hp
     * @param {number} speed
     * @param {number} damage
     * @param {number} score_value
     */
    spawn_boss(x, y, hp, speed, damage, score_value) {
        wasm.engine_spawn_boss(this.__wbg_ptr, x, y, hp, speed, damage, score_value);
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} hp
     * @param {number} speed
     * @param {number} damage
     * @param {number} score_value
     */
    spawn_vampire(x, y, hp, speed, damage, score_value) {
        wasm.engine_spawn_vampire(this.__wbg_ptr, x, y, hp, speed, damage, score_value);
    }
    /**
     * @param {number} dt_ms
     * @param {number} move_x
     * @param {number} move_y
     * @param {number} mouse_x
     * @param {number} mouse_y
     * @returns {StepEvents}
     */
    step(dt_ms, move_x, move_y, mouse_x, mouse_y) {
        const ret = wasm.engine_step(this.__wbg_ptr, dt_ms, move_x, move_y, mouse_x, mouse_y);
        return StepEvents.__wrap(ret);
    }
    /**
     * @param {number} i
     * @returns {number}
     */
    text_alpha(i) {
        const ret = wasm.engine_text_alpha(this.__wbg_ptr, i);
        return ret;
    }
    /**
     * @param {number} i
     * @returns {string}
     */
    text_color(i) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.engine_text_color(this.__wbg_ptr, i);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {number} i
     * @returns {string}
     */
    text_str(i) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.engine_text_str(this.__wbg_ptr, i);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {number} i
     * @returns {number}
     */
    text_x(i) {
        const ret = wasm.engine_text_x(this.__wbg_ptr, i);
        return ret;
    }
    /**
     * @param {number} i
     * @returns {number}
     */
    text_y(i) {
        const ret = wasm.engine_text_y(this.__wbg_ptr, i);
        return ret;
    }
    /**
     * @returns {number}
     */
    texts_count() {
        const ret = wasm.engine_texts_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {boolean}
     */
    try_dash() {
        const ret = wasm.engine_try_dash(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) Engine.prototype[Symbol.dispose] = Engine.prototype.free;

export class StepEvents {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(StepEvents.prototype);
        obj.__wbg_ptr = ptr;
        StepEventsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StepEventsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_stepevents_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get bits() {
        const ret = wasm.stepevents_bits(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get damage_taken() {
        const ret = wasm.stepevents_damage_taken(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get shake() {
        const ret = wasm.stepevents_shake(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) StepEvents.prototype[Symbol.dispose] = StepEvents.prototype.free;
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_6b64449b9b9ed33c: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./vampire_engine_bg.js": import0,
    };
}

const EngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_engine_free(ptr >>> 0, 1));
const StepEventsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_stepevents_free(ptr >>> 0, 1));

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('vampire_engine_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
