/* =====================================================================
   MERGE FRUIT - script.js
   1. CUSTOMIZATION (edit this part freely)
   2. Helpers
   3. Audio manager (files + built-in synth fallback)
   4. Screen/state system (HOME -> PLAYING -> GAME_OVER)
   5. Home screen (title, animated fruits)
   6. Game: physics, merging, danger line, rendering
   7. Input (mouse / touch / keyboard)
   8. Start-up
   ===================================================================== */

// ================= MERGE FRUIT CUSTOMIZATION =================
const GAME_CONFIG = {

    // ---------- Files (images & sounds). Leave "" to disable a sound/music track. ----------
    // Missing files never crash the game: backgrounds fall back to a gradient,
    // fruits fall back to a coloured face, sounds fall back to a built-in synth.
    assets: {
        homeBackground:     "bg/bg.png",      // empty = plain backdrop. png / jpg / jpeg / webp
        gameBackground:     "bg/gamebg.png",
        gameOverBackground: "bg/gamebg.png",

        homeMusic:     "assets/sounds/home-music.mp3",
        gameMusic:     "assets/sounds/game-music.mp3",
        gameOverMusic: "",                                                  // optional

        buttonClickSound: "assets/sounds/button-click.mp3",
        dropSound:        "assets/sounds/drop.mp3",
        collisionSound:   "assets/sounds/collision.mp3",
        mergeSound:       "assets/sounds/merge.mp3",
        scoreSound:       "assets/sounds/score.mp3",
        gameOverSound:    "assets/sounds/game-over.mp3",
        restartSound:     "assets/sounds/restart.mp3",
        bombSound:        "assets/sounds/bomb.mp3",
        shakeSound:       "assets/sounds/shake.mp3"
        // You can add more: "mySound: 'assets/sounds/x.mp3'" and call AudioMgr.sfx('mySound') (see SFX_KEYS below)
    },

    // ---------- Background image display ----------
    background: {
        size: "cover",                  // "cover" (no stretching, may crop) | "contain" | "100% 100%" (stretch)
        position: "center center",
        repeat: "no-repeat",
        gameOverOverlayOpacity: 0.45    // 0 = no dark overlay, 1 = fully dark
    },

    // ---------- Audio ----------
    audio: {
        enabled: true,                  // false = game starts muted (player can unmute with the speaker button)
        musicEnabled: true,
        musicVolume: 0.35,              // 0 - 1
        effectsVolume: 0.70,            // 0 - 1
        fadeInMs: 800,
        fadeOutMs: 500,
        loop: true,
        useSynthFallback: true,         // play built-in beeps/music if a file is missing
        sfxVolumes: { click: 1, drop: 0.9, collision: 0.5, merge: 1, score: 0.6, gameOver: 1, restart: 0.9, bomb: 1, shake: 0.7 },
        minIntervalMs: { collision: 110, drop: 60, merge: 60, score: 80, bomb: 150, shake: 250 },  // stops sounds piling up
        maxSoundsPer100ms: 4,           // global limit of overlapping sound effects
        collisionMinSpeed: 320          // fruits must hit harder than this to make a collision sound
    },

    // ---------- Fonts ----------
    // Put your own font at assets/fonts/game-font.ttf (it is used first), or change the names here.
    fonts: {
        title:    "'MergeFruitFont', 'Lilita One', 'Fredoka', 'Comic Sans MS', 'Trebuchet MS', sans-serif",
        button:   "'MergeFruitFont', 'Lilita One', 'Fredoka', 'Comic Sans MS', 'Trebuchet MS', sans-serif",
        score:    "'MergeFruitFont', 'Lilita One', 'Fredoka', 'Comic Sans MS', 'Trebuchet MS', sans-serif",
        gameOver: "'MergeFruitFont', 'Lilita One', 'Fredoka', 'Comic Sans MS', 'Trebuchet MS', sans-serif"
    },

    // ---------- Text effects ----------
    text: {
        titleLines: ["MERGE", "FRUIT"],
        titleColors: [                                   // one colour list per line (letters cycle through it)
            ["#ff3b3b", "#ff8a1f", "#ffc61a", "#5ccf3a", "#b04cf0"],
            ["#ffa21f", "#ffd21f", "#ff9a1f", "#ffbf1f", "#ff8a1f"]
        ],
        titleOutline: "#5b2a86",
        gameOverLines: ["GAME", "OVER"],
        gameOverColors: [["#ff4b4b", "#ff8a1f", "#ffc61a", "#ff4b4b"], ["#ffc61a", "#ff8a1f", "#ff4b4b", "#ffc61a"]],
        textColor: "#ffffff",
        textOutline: "#6b3a12",
        scoreColor: "#ffffff",
        animationSpeed: 1,                               // 1 = normal, 2 = twice as fast, 0.5 = slower

        scorePopup: { enabled: true, fontSize: 30, color: "#fff6b0", outline: "#b4470a", riseSpeed: 70, lifeMs: 850 },
        mergeText:  {
            enabled: true, chance: 0.55, fontSize: 38, color: "#ffffff", outline: "#d6336c", riseSpeed: 45, lifeMs: 1000,
            texts: ["MERGED!", "COOL!", "BOOM!", "BITTERSWEET!", "SPOOKY!"],
            comboTemplate: "COMBO x{n}!"
        },
        canvasShadow: "rgba(0,0,0,0.35)"
    },

    // ---------- Animation ----------
    animation: {
        homeFruitBounce: true,          // animated fruits on the home screen
        bounceHeight: 10,               // px
        swayDistance: 4,                // px
        tiltDegrees: 3,
        floatingSpeed: 1,               // 2 = twice as fast
        titlePulse: true,
        squashAndStretch: true,         // fruits squash when they land
        fruitRotation: 0,               // 0 = faces always upright (default), 1 = faces spin as fruits roll
        fallingFruitsOnGameOver: true
    },

    // ---------- Gameplay ----------
    gameplay: {
        initialFruitLevel: 0,           // first fruit you hold (0 = grape)
        dropLevels: [0, 0, 1, 1, 2, 3],  // fruits that can appear next (repeat a number to make it more likely)
        jarWidth: 420,                  // logical size of the container (the canvas scales to fit the screen)
        jarHeight: 640,
        holdY: 62,                      // height where you aim the fruit
        dropCooldownMs: 420,            // wait between drops
        keyboardSpeed: 420,             // px per second when using arrow keys
        showScore: true,
        showNextPreview: true,
        showGuideLine: true,
        enableParticles: true,
        maxParticles: 220,
        maxFruitMerge: "vanish",        // two watermelons: "vanish" (bonus points) or "none" (they just bounce)
        maxFruitBonus: 100,
        comboWindowMs: 1400,            // merges closer together than this count as a combo
        comboBonus: 2,                  // extra points per combo step
        gameOverDelayMs: 1100,          // short pause so you can see the final jar
        dangerLineEnabled: true
    },

    // ---------- Danger line / game-over rule ----------
    // A fruit counts as "in danger" while its TOP edge is above lineY.
    // If it stays above the line for graceMs in a row -> GAME OVER (even if it is still moving).
    // New fruits are ignored for newFruitImmunityMs after being dropped, so a fruit falling past the line is fine.
    danger: {
        lineY: 128,
        graceMs: 1800,
        newFruitImmunityMs: 1200,
        mergeImmunityMs: 500
    },

    // ---------- Physics ----------
    physics: {
        gravity: 1700,                  // px/s^2
        linearDamping: 0.08,
        angularDamping: 1.2,
        restitution: 0.12,              // bounciness
        friction: 0.35,                 // fruit vs fruit
        wallFriction: 0.5,
        iterations: 4,                  // collision solver passes (higher = more stable)
        stepsPerSecond: 120,
        maxSpeed: 2200,
        bounceMinSpeed: 260,            // slower impacts don't bounce (helps fruits settle)
        mergeTolerance: 0.8             // px: fruits closer than this (touching) can merge
    },

    // ---------- Home screen theme ----------
    // "halloween" = spooky haunted-orchard home screen, "classic" = the original sunny orchard.
    theme: {
        home: "halloween",
        halloween: {
            titleColors: [                                   // orange -> yellow, one list per title line
                ["#ff861a", "#ff9a22", "#ffae2c", "#ffc13a", "#ffd65a"],
                ["#ffa526", "#ffb932", "#ffc943", "#ffd65a", "#ffe27a"]
            ],
            titleOutline: "#46216D",
            subtitle: "HALLOWEEN EDITION"
        }
    },
    // ---------- JUMPSCARE ----------
    jumpscare: {
        enabled: true,
        trigger: "twoWatermelons",     // "twoWatermelons" or "watermelonCreated"
        video: "jumpscare.mp4",   // your video ("" = built-in fallback scare)
        volume: 1,
        maxDurationMs: 5000,
        respectMute: false,
        oncePerGame: false,
        cooldownMs: 8000
    },
    // ---------- Power-ups ----------
    powerups: {
        bomb:  { uses: 2,              // bombs at the start of a game (-1 = unlimited)
                 radius: 100,          // blast radius in jar px (jar is 420 x 640). Fruits whose CENTRE is closer than this are removed
                 screenShake: 0.35 },  // 0 = no screen shake on explosion
        shake: { uses: 2,              // shakes at the start of a game (-1 = unlimited)
                 durationMs: 600,      // length of the shake (two kicks)
                 upSpeed: 420,         // px/s: how hard fruits are kicked upward (bigger = higher hop)
                 sideSpeed: 260,       // px/s: random sideways kick (this is what lets neighbours touch and merge)
                 spin: 3,              // random spin (rad/s)
                 amplitude: 0,         // extra visual-only wobble in px (0 = off, the motion is real physics now)
                 rotation: 0 },
        watermelonBonus: 1             // merging two watermelons gives +1 bomb AND +1 shake
    },

    // ---------- Fruits, in merge order (index 0 = smallest) ----------
    // radius   = collision radius in logical px (the picture is scaled so its round body matches this)
    // score    = points awarded when this fruit is CREATED by a merge
    // imageBody= where the round body is inside the picture (fractions of the image: cx, cy = centre, r = radius / image width).
    //            Use {cx:0.5, cy:0.5, r:0.5} for a plain round picture that fills its whole image.
    // sound    = optional extra sound when this fruit is created ("" = none)
    // effect   = optional merge sparkle { particles: number, color: "#hex" }
    fruits: [
        { name: "Grape",      image: "fruits/sgrape.png",      radius: 20, score: 0,  fallbackColor: "#9b4fd6", imageBody: { cx: 0.500, cy: 0.582, r: 0.497 }, sound: "", effect: { particles: 10, color: "#d9a6ff" } },
        { name: "Cherry",     image: "fruits/scheery.png",     radius: 27, score: 3,  fallbackColor: "#e0263f", imageBody: { cx: 0.404, cy: 0.664, r: 0.382 }, sound: "", effect: { particles: 12, color: "#ff8fa0" } },
        { name: "Orange",     image: "fruits/sorange.png",     radius: 35, score: 6,  fallbackColor: "#ff9a1f", imageBody: { cx: 0.490, cy: 0.557, r: 0.481 }, sound: "", effect: { particles: 14, color: "#ffd28a" } },
        { name: "Peach",      image: "fruits/speach.png",      radius: 43, score: 10, fallbackColor: "#ff9d8a", imageBody: { cx: 0.506, cy: 0.561, r: 0.466 }, sound: "", effect: { particles: 14, color: "#ffc7b8" } },
        { name: "Red Apple",  image: "fruits/sapple.png",  radius: 52, score: 15, fallbackColor: "#f03a3a", imageBody: { cx: 0.526, cy: 0.607, r: 0.462 }, sound: "", effect: { particles: 16, color: "#ff9a9a" } },
        { name: "Mangosteen", image: "fruits/smangosteen.png", radius: 62, score: 21, fallbackColor: "#6a2a5c", imageBody: { cx: 0.499, cy: 0.607, r: 0.474 }, sound: "", effect: { particles: 18, color: "#d88ad0" } },
        { name: "Pineapple",  image: "fruits/spineapple.png",  radius: 73, score: 28, fallbackColor: "#f5c01a", imageBody: { cx: 0.491, cy: 0.729, r: 0.426 }, sound: "", effect: { particles: 20, color: "#ffe680" } },
        { name: "Coconut",    image: "fruits/scoconut.png",    radius: 85, score: 36, fallbackColor: "#8a5a32", imageBody: { cx: 0.495, cy: 0.520, r: 0.481 }, sound: "", effect: { particles: 22, color: "#d9a877" } },
        { name: "Watermelon", image: "fruits/swatermelon.png", radius: 98, score: 50, fallbackColor: "#3f9a3a", imageBody: { cx: 0.496, cy: 0.546, r: 0.481 }, sound: "", effect: { particles: 40, color: "#ff6b81" } }
    ],

    // ---------- Home screen fruit layout (matches the reference picture) ----------
    // level = which fruit picture (index in the list above). x / y = centre, w = width.
    // All numbers are % of the stage width (the stage is the reference-picture-shaped area). z = stacking order.
    // prop = Halloween costume (only used by the Halloween theme). svg = a drawn extra character.
    homeLayout: [
        { level: 6, x: 65, y: 90, w: 30.0, z: 1 },        // pineapple with a purple aura
        { level: 0, x: 23, y: 135, w: 17.1, z: 1 },       // grape with vampire fangs
        { level: 8, x: 46, y: 115, w: 40.0, z: 2 },    // mischievous watermelon
        { level: 4, x: 19, y: 105, w: 22.7, z: 3 },    // apple in a witch hat
        { level: 2, x: 27, y: 120, w: 18.7, z: 3 },   // jack-o'-lantern orange
        { level: 2, x: 69, y: 120, w: 20.8, z: 4 },                      // orange
        { level: 3, x: 10, y: 127, w: 22.5, z: 5 },  // peach in a ghost costume
        { level: 7, x: 40, y: 89, w: 30.0, z: 1 },    // coconut with a skeleton face
        { level: 1, x: 80, y: 130, w: 22.3, z: 7 },                      // cherry
        { level: 5, x: 84, y: 110, w: 23.2, z: 6 }                       // mangosteen
    ]
};
// ================= END OF CUSTOMIZATION =================


/* =====================================================================
   2. HELPERS
   ===================================================================== */
const C = GAME_CONFIG;
const FR = C.fruits;
const LAST = FR.length - 1;
const W = C.gameplay.jarWidth;
const H = C.gameplay.jarHeight;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const isHalloween = () => !!(C.theme && C.theme.home === "halloween");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode: ignore */ } }
};

// Maps sound-effect names -> keys in GAME_CONFIG.assets
const SFX_KEYS = {
    click: "buttonClickSound", drop: "dropSound", collision: "collisionSound", merge: "mergeSound",
    score: "scoreSound", gameOver: "gameOverSound", restart: "restartSound",
    bomb: "bombSound", shake: "shakeSound"
};
const MUSIC_KEYS = { home: "homeMusic", game: "gameMusic", gameOver: "gameOverMusic" };


/* =====================================================================
   3. AUDIO MANAGER
   ===================================================================== */
const SYNTH_SONGS = {   // used only when a music file is missing
    home: { bpm: 128, mel: [523, 659, 784, 659, 880, 784, 659, 587, 523, 659, 784, 880, 784, 659, 587, 659], bass: [131, 131, 110, 110, 87, 87, 98, 98] },
    game: { bpm: 104, mel: [659, 0, 784, 0, 880, 784, 659, 0, 587, 0, 659, 784, 659, 587, 523, 0], bass: [131, 110, 87, 98] }
};

const AudioMgr = {
    unlocked: false, muted: false, ctx: null, master: null,
    musicEls: {}, sfxPools: {}, lastPlay: {}, recent: [],
    want: null, current: null, synth: null, extra: {},

    init() {
        const saved = store.get("mergeFruitMuted");
        this.muted = saved !== null ? saved === "1" : !C.audio.enabled;
        for (const name in MUSIC_KEYS) {
            const src = C.assets[MUSIC_KEYS[name]];
            if (!src) continue;
            const el = new Audio();
            el.preload = "auto"; el.loop = C.audio.loop; el.volume = 0;
            el.addEventListener("error", () => { el._bad = true; });
            el.src = src;
            this.musicEls[name] = el;
        }
        for (const name in SFX_KEYS) {
            const src = C.assets[SFX_KEYS[name]];
            if (!src) continue;
            const els = [];
            for (let i = 0; i < 3; i++) {
                const el = new Audio(); el.preload = "auto";
                el.addEventListener("error", () => { el._bad = true; });
                el.src = src; els.push(el);
            }
            this.sfxPools[name] = { els, i: 0 };
        }
        // Browsers block audio until the player touches the page: unlock on first interaction.
        const unlock = () => {
            if (this.unlocked) return;
            this.unlocked = true;
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) { this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination); }
                if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
            } catch (e) { /* no WebAudio: file sounds still work */ }
            this.playMusic(this.want);
        };
        ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.addEventListener(ev, unlock, { capture: true }));
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) { this.stopAllMusic(true); } else { this.playMusic(this.want); }
        });
        this.updateButtons();
    },

    musicOn() { return !this.muted && C.audio.musicEnabled; },

    // ----- music -----
    playMusic(name) {
        this.want = name;
        if (!this.unlocked) return;
        if (!name || !this.musicOn()) { this.stopAllMusic(); return; }
        if (this.current === name) return;                       // never start the same track twice
        this.stopAllMusic();
        const el = this.musicEls[name];
        if (!el && !SYNTH_SONGS[name]) return;                   // nothing to play for this screen
        this.current = name;
        const fallback = () => { if (this.current === name && C.audio.useSynthFallback) this.startSynth(name); };
        if (el && !el._bad) {
            el.currentTime = 0; el.volume = 0;
            const p = el.play();
            if (p && p.then) p.then(() => { if (this.current === name) this.fade(el, 0, C.audio.musicVolume, C.audio.fadeInMs); else el.pause(); }).catch(fallback);
        } else fallback();
    },
    stopAllMusic(instant) {
        this.current = null;
        for (const n in this.musicEls) {
            const el = this.musicEls[n];
            if (!el.paused) { if (instant) { clearInterval(el._fade); el.pause(); } else this.fade(el, el.volume, 0, C.audio.fadeOutMs, true); }
        }
        this.stopSynth(instant);
    },
    fade(el, from, to, ms, pauseAtEnd) {
        clearInterval(el._fade);
        const t0 = performance.now();
        el._fade = setInterval(() => {
            const k = clamp((performance.now() - t0) / Math.max(1, ms), 0, 1);
            el.volume = clamp(from + (to - from) * k, 0, 1);
            if (k >= 1) { clearInterval(el._fade); if (pauseAtEnd) { el.pause(); } }
        }, 30);
    },
    startSynth(name) {
        const s = SYNTH_SONGS[name];
        if (!s || !this.ctx) return;
        this.stopSynth(true);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(C.audio.musicVolume * 0.5, this.ctx.currentTime + C.audio.fadeInMs / 1000);
        g.connect(this.master);
        const stepMs = 60000 / s.bpm / 2; let step = 0;
        const tick = () => {
            const f = s.mel[step % s.mel.length];
            if (f) this.tone(f, stepMs / 1000 * 1.6, "triangle", 0.5, { dest: g });
            if (step % 2 === 0) this.tone(s.bass[(step >> 1) % s.bass.length], stepMs / 1000 * 3.4, "sine", 0.6, { dest: g });
            step++;
        };
        tick();
        this.synth = { timer: setInterval(tick, stepMs), gain: g };
    },
    stopSynth(instant) {
        if (!this.synth) return;
        const { timer, gain } = this.synth; this.synth = null;
        clearInterval(timer);
        try {
            const t = this.ctx.currentTime;
            gain.gain.cancelScheduledValues(t);
            gain.gain.setValueAtTime(gain.gain.value, t);
            gain.gain.linearRampToValueAtTime(0.0001, t + (instant ? 0.02 : C.audio.fadeOutMs / 1000));
            setTimeout(() => gain.disconnect(), (instant ? 60 : C.audio.fadeOutMs + 80));
        } catch (e) { /* ignore */ }
    },

    // ----- sound effects -----
    sfx(name, volMul = 1) {
        if (!this.unlocked || this.muted) return;
        const now = performance.now();
        const gap = C.audio.minIntervalMs[name] || 0;
        if (now - (this.lastPlay[name] || 0) < gap) return;
        this.recent = this.recent.filter((t) => now - t < 100);
        if (this.recent.length >= C.audio.maxSoundsPer100ms && name !== "gameOver" && name !== "click") return;
        this.lastPlay[name] = now; this.recent.push(now);
        const vol = clamp(C.audio.effectsVolume * (C.audio.sfxVolumes[name] ?? 1) * volMul, 0, 1);
        const pool = this.sfxPools[name];
        if (pool) {
            const el = pool.els[pool.i++ % pool.els.length];
            if (!el._bad) {
                try { el.currentTime = 0; } catch (e) { /* not ready yet */ }
                el.volume = vol;
                const p = el.play();
                if (p && p.catch) p.catch(() => this.synthSfx(name, vol));
                return;
            }
        }
        this.synthSfx(name, vol);
    },
    playFile(path, volMul = 1) {                                  // for per-fruit sounds
        if (!path || !this.unlocked || this.muted) return;
        let el = this.extra[path];
        if (!el) { el = this.extra[path] = new Audio(path); el.addEventListener("error", () => { el._bad = true; }); }
        if (el._bad) return;
        try { el.currentTime = 0; } catch (e) { /* ignore */ }
        el.volume = clamp(C.audio.effectsVolume * volMul, 0, 1);
        const p = el.play(); if (p && p.catch) p.catch(() => {});
    },
    tone(f, d, type = "sine", v = 0.3, o = {}) {
        const c = this.ctx; if (!c) return;
        const t = c.currentTime + (o.delay || 0);
        const osc = c.createOscillator(), g = c.createGain();
        osc.type = type; osc.frequency.setValueAtTime(f, t);
        if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + d);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        osc.connect(g); g.connect(o.dest || this.master);
        osc.start(t); osc.stop(t + d + 0.03);
    },
    synthSfx(name, vol) {                                         // built-in fallback sounds
        if (!C.audio.useSynthFallback || !this.ctx) return;
        const v = vol * 0.6, T = this.tone.bind(this);
        switch (name) {
            case "click":     T(700, 0.08, "triangle", v); T(990, 0.09, "triangle", v, { delay: 0.04 }); break;
            case "drop":      T(620, 0.16, "sine", v, { slide: 300 }); break;
            case "collision": T(150, 0.09, "sine", v, { slide: 70 }); break;
            case "merge":     [523, 659, 784, 1047].forEach((f, i) => T(f, 0.2, "sine", v, { delay: i * 0.07 })); break;
            case "score":     T(988, 0.1, "triangle", v); T(1319, 0.16, "triangle", v, { delay: 0.07 }); break;
            case "gameOver":  [392, 330, 262, 196].forEach((f, i) => T(f, 0.45, "triangle", v, { delay: i * 0.2 })); break;
            case "bomb":      T(130, 0.6, "sawtooth", v, { slide: 38 }); T(70, 0.5, "sine", v); break;
            case "shake":     for (let i = 0; i < 6; i++) T(260 + (i % 2) * 120, 0.07, "triangle", v * 0.8, { delay: i * 0.07 }); break;
            case "restart":   T(392, 0.12, "triangle", v); T(523, 0.16, "triangle", v, { delay: 0.09 }); T(784, 0.2, "triangle", v, { delay: 0.18 }); break;
        }
    },

    // ----- mute button -----
    toggleMute() {
        this.muted = !this.muted;
        store.set("mergeFruitMuted", this.muted ? "1" : "0");
        this.updateButtons();
        if (this.muted) this.stopAllMusic(); else this.playMusic(this.want);
    },
    updateButtons() {
        const icon = this.muted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
        document.querySelectorAll("[data-sound-toggle]").forEach((b) => { b.textContent = icon; });
        const lab = $("set-sound-label"), ic = $("set-sound-icon"), btn = $("set-sound");
        if (lab) lab.textContent = "SOUND: " + (this.muted ? "OFF" : "ON");
        if (ic) ic.textContent = icon;
        if (btn) btn.setAttribute("aria-pressed", String(!this.muted));
    }
};


/* =====================================================================
   4. SCREEN / STATE SYSTEM
   ===================================================================== */
const SCREENS = { HOME: "screen-home", PLAYING: "screen-game", GAME_OVER: "screen-gameover" };
let state = null;
let transitioning = false;

function enter(next) {
    // leave the old state
    if (state === "PLAYING") { closeModals(); cancelBomb(); stopLoop(); if (game) clearTimeout(game.overTimer); }
    if (state === "GAME_OVER") $("over-fruits").innerHTML = "";
    state = next;
    document.body.dataset.state = next;
    for (const s in SCREENS) $(SCREENS[s]).classList.toggle("active", s === next);

    if (next === "HOME") AudioMgr.playMusic("home");
    if (next === "PLAYING") { AudioMgr.playMusic("game"); resizeCanvas(); newGame(); startLoop(); updatePowerButtons(); }
    if (next === "GAME_OVER") { showGameOver(); AudioMgr.playMusic("gameOver"); }
}

async function goTo(next) {
    if (transitioning || next === state) return;
    transitioning = true;
    const ov = $("transition");
    ov.classList.add("show");
    await wait(270);
    enter(next);
    await wait(70);
    ov.classList.remove("show");
    await wait(270);
    transitioning = false;
}


/* =====================================================================
   5. HOME SCREEN
   ===================================================================== */
function applyCssConfig() {
    const r = document.documentElement.style, F = C.fonts, T = C.text;
    r.setProperty("--font-title", F.title);
    r.setProperty("--font-button", F.button);
    r.setProperty("--font-score", F.score);
    r.setProperty("--font-gameover", F.gameOver);
    r.setProperty("--title-outline", T.titleOutline);
    r.setProperty("--text-color", T.textColor);
    r.setProperty("--text-outline", T.textOutline);
    r.setProperty("--score-color", T.scoreColor);
    r.setProperty("--text-speed", T.animationSpeed);
    $("title").classList.toggle("pulse", !!C.animation.titlePulse);
    document.body.classList.toggle("no-title-pulse", !C.animation.titlePulse);
    $("home-fruits").parentElement.classList.toggle("no-fruit-anim", !C.animation.homeFruitBounce);
    $("over-overlay").style.opacity = C.background.gameOverOverlayOpacity;
    const hw = isHalloween();
    $("screen-home").classList.toggle("theme-halloween", hw);
    if (hw) { r.setProperty("--title-outline", C.theme.halloween.titleOutline); $("h-sub").textContent = C.theme.halloween.subtitle; }
}

// Show a background image only if it loads; otherwise the CSS gradient stays (graceful fallback).
function applyBackground(el, src) {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
        el.style.backgroundImage = `url("${src}")`;
        el.style.backgroundSize = C.background.size;
        el.style.backgroundPosition = C.background.position;
        el.style.backgroundRepeat = C.background.repeat;
    };
    img.onerror = () => console.warn("Background not found, using fallback:", src);
    img.src = src;
}

function buildLetters(el, lines, colors, fancy) {
    el.innerHTML = "";
    let idx = 0;
    lines.forEach((word, li) => {
        const line = document.createElement("span");
        line.className = "line";
        const pal = colors[li] || colors[0] || ["#fff"];
        [...word].forEach((ch, ci) => {
            const s = document.createElement("span");
            s.className = "letter";
            s.textContent = ch === " " ? "\u00A0" : ch;
            s.dataset.ch = s.textContent;
            s.style.setProperty("--c", pal[ci % pal.length]);
            s.style.setProperty("--i", idx++);
            if (fancy) {                                            // slightly irregular, "organic" letters
                s.style.setProperty("--tilt", rand(-4, 4).toFixed(1) + "deg");
                s.style.setProperty("--sy", rand(0.94, 1.07).toFixed(2));
            }
            line.appendChild(s);
        });
        el.appendChild(line);
    });
}

// ----- Halloween costumes. Each draws on top of a fruit picture using the fruit's round body:
//       b.x / b.y = body centre, b.R = body radius (all in picture units, picture width = 100) -----
const f2 = (n) => +n.toFixed(2);
const PROPS = {
    fangs: ({ x, y, R }) => {                                         // vampire grape
        const mx = x + 0.03 * R, my = y + 0.2 * R, s = 0.1 * R, d = 0.16 * R;
        const fang = (cx) => `<path d="M${f2(cx - s / 2)} ${f2(my)} L${f2(cx + s / 2)} ${f2(my)} L${f2(cx)} ${f2(my + s * 1.7)} Z" fill="#fff" stroke="#cdbcf0" stroke-width=".5" stroke-linejoin="round"/>`;
        return fang(mx - d) + fang(mx + d);
    },
    witchHat: ({ x, y, R }) => {                                      // witch hat on the apple
        const cx = x + 0.12 * R, by = y - 0.9 * R, bl = cx - 0.5 * R, br = cx + 0.5 * R;
        return `<g transform="rotate(-14 ${f2(cx)} ${f2(by)})">` +
            `<ellipse cx="${f2(cx)}" cy="${f2(by)}" rx="${f2(0.8 * R)}" ry="${f2(0.2 * R)}" fill="#2b1654" stroke="#140a2c" stroke-width=".8"/>` +
            `<path d="M${f2(bl)} ${f2(by)} Q${f2(cx - 0.25 * R)} ${f2(by - 0.65 * R)} ${f2(cx + 0.3 * R)} ${f2(by - 1.2 * R)} Q${f2(cx + 0.42 * R)} ${f2(by - 0.6 * R)} ${f2(br)} ${f2(by)} Z" fill="#3d1f72" stroke="#140a2c" stroke-width=".8" stroke-linejoin="round"/>` +
            `<path d="M${f2(bl + 0.02 * R)} ${f2(by - 0.1 * R)} Q${f2(cx)} ${f2(by + 0.06 * R)} ${f2(br - 0.02 * R)} ${f2(by - 0.1 * R)} L${f2(br - 0.06 * R)} ${f2(by - 0.28 * R)} Q${f2(cx)} ${f2(by - 0.12 * R)} ${f2(bl + 0.06 * R)} ${f2(by - 0.28 * R)} Z" fill="#ff861a"/>` +
            `<rect x="${f2(cx - 0.09 * R)}" y="${f2(by - 0.24 * R)}" width="${f2(0.18 * R)}" height="${f2(0.15 * R)}" rx="${f2(0.02 * R)}" fill="#FFD65A" stroke="#a8761a" stroke-width=".4"/></g>`;
    },
    pumpkin: ({ x, y, R }) =>                                         // pumpkin ridges on the orange
        [0.38, 0.72].map((k) => `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(k * R)}" ry="${f2(0.97 * R)}" fill="none" stroke="rgba(150,50,0,.3)" stroke-width=".9"/>`).join(""),
    ghostSheet: ({ x, y, R }) => {                                    // see-through ghost sheet on the peach
        const w = 1.07 * R, y0 = y - 0.02 * R, bot = y + 1.15 * R, n = 5, sw = (2 * w) / n;
        let d = `M${f2(x - w)} ${f2(bot)} L${f2(x - w)} ${f2(y0)} A${f2(w)} ${f2(w * 1.02)} 0 0 1 ${f2(x + w)} ${f2(y0)} L${f2(x + w)} ${f2(bot)}`;
        for (let i = 0; i < n; i++) d += ` Q${f2(x + w - (i + 0.5) * sw)} ${f2(bot + 0.28 * R)} ${f2(x + w - (i + 1) * sw)} ${f2(bot)}`;
        return `<path d="${d} Z" fill="rgba(255,255,255,.38)" stroke="rgba(255,255,255,.85)" stroke-width=".7" stroke-linejoin="round"/>`;
    },
    skeleton: ({ x, y, R }) => {                                      // skeleton-inspired coconut
        const ring = (dx, dy) => `<circle cx="${f2(x + dx * R)}" cy="${f2(y + dy * R)}" r="${f2(0.25 * R)}" fill="none" stroke="#f4efe0" stroke-width="${f2(0.06 * R)}"/>`;
        const tx = x - 0.04 * R, ty = y + 0.36 * R;
        let teeth = `<rect x="${f2(tx - 0.17 * R)}" y="${f2(ty)}" width="${f2(0.34 * R)}" height="${f2(0.1 * R)}" rx="${f2(0.025 * R)}" fill="#f4efe0" stroke="#5a4630" stroke-width=".35"/>`;
        for (let i = -1; i <= 1; i++) teeth += `<path d="M${f2(tx + i * 0.085 * R + 0.0425 * R)} ${f2(ty)} v${f2(0.1 * R)}" stroke="#5a4630" stroke-width=".3"/>`;
        return ring(-0.42, 0.08) + ring(0.41, 0.21) + teeth;
    },
    mischief: ({ x, y, R }) => {                                      // sly eyebrows on the watermelon
        const br = (x1, y1, x2, y2) => `<path d="M${f2(x + x1 * R)} ${f2(y + y1 * R)} L${f2(x + x2 * R)} ${f2(y + y2 * R)}" stroke="#1f3d12" stroke-width="${f2(0.075 * R)}" stroke-linecap="round"/>`;
        return br(-0.66, -0.3, -0.24, -0.14) + br(0.22, -0.08, 0.66, -0.24);
    }
};

function addProp(bob, def, img, key) {
    const fn = PROPS[key]; if (!fn) return;
    const ratio = (img.naturalHeight || img.height || 1) / (img.naturalWidth || img.width || 1);
    const B = def.imageBody || { cx: 0.5, cy: 0.5, r: 0.5 };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "prop");
    svg.setAttribute("viewBox", `0 0 100 ${f2(100 * ratio)}`);
    svg.innerHTML = fn({ x: B.cx * 100, y: B.cy * 100 * ratio, R: B.r * 100 });
    bob.appendChild(svg);
}

const DRAGON_SVG = `<svg class="dragon" viewBox="0 0 100 118" xmlns="http://www.w3.org/2000/svg" aria-label="Dragon fruit">
<defs><radialGradient id="dfBody" cx=".4" cy=".3"><stop offset="0" stop-color="#ff7ac0"/><stop offset=".6" stop-color="#e0368f"/><stop offset="1" stop-color="#a50f68"/></radialGradient>
<radialGradient id="dfGlow"><stop offset="0" stop-color="#A7F3C5" stop-opacity=".95"/><stop offset="1" stop-color="#A7F3C5" stop-opacity="0"/></radialGradient>
<path id="dfFin" d="M0 0 C-8 -9 -7 -22 0 -32 C7 -22 8 -9 0 0Z"/></defs>
<g fill="#4fc766" stroke="#1f7a3a" stroke-width="1.2" stroke-linejoin="round">
<use href="#dfFin" transform="translate(50 32)"/><use href="#dfFin" transform="translate(27 40) rotate(-35)"/><use href="#dfFin" transform="translate(73 40) rotate(35)"/>
<use href="#dfFin" transform="translate(13 60) rotate(-70)"/><use href="#dfFin" transform="translate(87 60) rotate(70)"/>
<use href="#dfFin" transform="translate(17 88) rotate(-110)"/><use href="#dfFin" transform="translate(83 88) rotate(110)"/></g>
<ellipse cx="50" cy="70" rx="38" ry="40" fill="url(#dfBody)" stroke="#8a0c55" stroke-width="1.6"/>
<ellipse cx="34" cy="48" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 34 48)"/>
<g fill="#5a0a3a" opacity=".4"><circle cx="30" cy="92" r="1.2"/><circle cx="70" cy="95" r="1.2"/><circle cx="50" cy="100" r="1.2"/><circle cx="62" cy="48" r="1.2"/><circle cx="40" cy="58" r="1"/></g>
<circle class="dg-halo" cx="36" cy="66" r="13" fill="url(#dfGlow)"/><circle class="dg-halo" cx="64" cy="66" r="13" fill="url(#dfGlow)"/>
<g stroke="#2b6a4a" stroke-width="1"><circle cx="36" cy="66" r="6.5" fill="#A7F3C5"/><circle cx="64" cy="66" r="6.5" fill="#A7F3C5"/></g>
<circle cx="36" cy="66.5" r="3.1" fill="#12332a"/><circle cx="64" cy="66.5" r="3.1" fill="#12332a"/><circle cx="37.2" cy="65" r="1.2" fill="#fff"/><circle cx="65.2" cy="65" r="1.2" fill="#fff"/>
<path d="M43 80 Q50 88 57 80 Q50 84 43 80Z" fill="#7a0a3a" stroke="#7a0a3a" stroke-width="1" stroke-linejoin="round"/>
<circle cx="27" cy="78" r="5" fill="#ffb0d0" opacity=".6"/><circle cx="73" cy="78" r="5" fill="#ffb0d0" opacity=".6"/></svg>`;

function buildHomeFruits() {
    const box = $("home-fruits"), A = C.animation, HW = isHalloween();
    box.innerHTML = "";
    C.homeLayout.forEach((it) => {
        if (it.halloweenOnly && !HW) return;
        const def = it.svg ? null : FR[it.level];
        const wrap = document.createElement("div");
        wrap.className = "home-fruit" + (HW ? (it.svg ? " p-dragon" : (it.prop ? " p-" + (it.prop === "aura" ? "aura" : it.prop) : "")) : "");
        wrap.style.left = it.x + "cqw"; wrap.style.top = it.y + "cqw"; wrap.style.width = it.w + "cqw"; wrap.style.zIndex = it.z || 1;
        const dur = rand(3.2, 5.4) / A.floatingSpeed;                 // every fruit gets its own timing
        wrap.style.setProperty("--dur", dur.toFixed(2) + "s");
        wrap.style.setProperty("--delay", (-rand(0, dur)).toFixed(2) + "s");
        wrap.style.setProperty("--bob", (A.bounceHeight * rand(0.6, 1.3)).toFixed(1) + "px");
        wrap.style.setProperty("--sway", (A.swayDistance * rand(0.5, 1.4)).toFixed(1) + "px");
        wrap.style.setProperty("--rot", (A.tiltDegrees * rand(0.5, 1.3) * (Math.random() < 0.5 ? -1 : 1)).toFixed(1) + "deg");
        const bob = document.createElement("div");                    // picture + costume move together
        bob.className = "bob";
        wrap.appendChild(bob);
        if (it.svg) bob.innerHTML = DRAGON_SVG;
        else {
            const img = new Image();
            img.alt = def.name; img.draggable = false; img.dataset.level = it.level; img.src = fruitSrc(it.level);
            if (it.filter && !(HW && it.prop)) img.style.filter = it.filter + " drop-shadow(0 .8cqw .6cqw rgba(0,0,0,.25))";
            img.onerror = () => {                                      // missing picture -> coloured circle
                const fb = document.createElement("div");
                fb.className = "fallback"; fb.style.background = def.fallbackColor;
                img.replaceWith(fb);
            };
            bob.appendChild(img);
            if (HW && it.prop && PROPS[it.prop]) {
                const add = () => addProp(bob, def, img, it.prop);
                if (img.complete && img.naturalWidth) add(); else img.addEventListener("load", add, { once: true });
            }
        }
        box.appendChild(wrap);
    });
}

/* =====================================================================
   6. GAME
   ===================================================================== */
const canvas = $("game-canvas");
const ctx = canvas.getContext("2d");
const nextCanvas = $("next-canvas");
const nctx = nextCanvas.getContext("2d");
const images = [];                    // loaded fruit pictures (null = missing -> fallback drawing)
let view = { k: 1 };
let game = null;
let rafId = 0, lastTs = 0;
let best = parseInt(store.get("mergeFruitBest") || "0", 10) || 0;
const keys = { left: false, right: false };

// If a picture still has its black/white background (e.g. an original JPG), cut it out automatically.
// Returns { canvas, body } or null when the picture is already transparent (or the browser blocks pixel access).
function autoCutout(img) {
    try {
        const w = img.naturalWidth, h = img.naturalHeight;
        const s = Math.min(1, 640 / Math.max(w, h));
        const cw = Math.round(w * s), ch = Math.round(h * s);
        const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
        const c = cv.getContext("2d"); c.drawImage(img, 0, 0, cw, ch);
        const id = c.getImageData(0, 0, cw, ch), d = id.data;     // throws if the browser treats the file as cross-origin
        if (d[3] < 200 && d[(cw - 1) * 4 + 3] < 200) return null;  // corners already transparent: nothing to do
        const dark = Math.max(d[0], d[1], d[2]) < 90;
        const isBg = (p) => {
            const r = d[p * 4], g = d[p * 4 + 1], b = d[p * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            return dark ? mx < 45 : (mn > 195 && mx - mn < 45);
        };
        const bg = new Uint8Array(cw * ch), stack = [];
        const push = (p) => { if (!bg[p] && isBg(p)) { bg[p] = 1; stack.push(p); } };
        for (let x = 0; x < cw; x++) { push(x); push((ch - 1) * cw + x); }
        for (let y = 0; y < ch; y++) { push(y * cw); push(y * cw + cw - 1); }
        while (stack.length) {                                      // flood fill from the edges
            const p = stack.pop(), x = p % cw, y = (p / cw) | 0;
            if (x > 0) push(p - 1); if (x < cw - 1) push(p + 1);
            if (y > 0) push(p - cw); if (y < ch - 1) push(p + cw);
        }
        let x0 = cw, y0 = ch, x1 = 0, y1 = 0;
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
            const p = y * cw + x;
            let a = 255;
            if (bg[p]) a = 0;
            else {                                                  // soften the edge, remove the dark/white fringe
                const near = (x > 0 && bg[p - 1]) || (x < cw - 1 && bg[p + 1]) || (y > 0 && bg[p - cw]) || (y < ch - 1 && bg[p + cw]);
                if (near) a = 0;
            }
            d[p * 4 + 3] = a;
            if (a) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 <= x0 || y1 <= y0) return null;
        c.putImageData(id, 0, 0);
        const ow = x1 - x0 + 1, oh = y1 - y0 + 1;
        const out = document.createElement("canvas"); out.width = ow; out.height = oh;
        out.getContext("2d").drawImage(cv, x0, y0, ow, oh, 0, 0, ow, oh);
        // find the round body: biggest circle that fits inside the shape (distance transform on a small copy)
        const k = Math.min(1, 96 / Math.max(ow, oh)), sw = Math.max(2, Math.round(ow * k)), sh = Math.max(2, Math.round(oh * k));
        const sm = document.createElement("canvas"); sm.width = sw; sm.height = sh;
        const sc = sm.getContext("2d"); sc.drawImage(out, 0, 0, sw, sh);
        const sd = sc.getImageData(0, 0, sw, sh).data, dist = new Float32Array(sw * sh);
        for (let p = 0; p < sw * sh; p++) dist[p] = sd[p * 4 + 3] > 128 ? 9999 : 0;
        for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
            const p = y * sw + x; if (!dist[p]) continue;
            let v = (x === 0 || y === 0) ? 3 : 9999;
            if (x > 0) v = Math.min(v, dist[p - 1] + 3);
            if (y > 0) v = Math.min(v, dist[p - sw] + 3);
            if (x > 0 && y > 0) v = Math.min(v, dist[p - sw - 1] + 4);
            if (x < sw - 1 && y > 0) v = Math.min(v, dist[p - sw + 1] + 4);
            dist[p] = v;
        }
        let best = 0, bx = sw / 2, by = sh / 2;
        for (let y = sh - 1; y >= 0; y--) for (let x = sw - 1; x >= 0; x--) {
            const p = y * sw + x; if (!dist[p]) continue;
            let v = (x === sw - 1 || y === sh - 1) ? 3 : dist[p];
            if (x < sw - 1) v = Math.min(v, dist[p + 1] + 3);
            if (y < sh - 1) v = Math.min(v, dist[p + sw] + 3);
            if (x < sw - 1 && y < sh - 1) v = Math.min(v, dist[p + sw + 1] + 4);
            if (x > 0 && y < sh - 1) v = Math.min(v, dist[p + sw - 1] + 4);
            dist[p] = v;
            if (v > best) { best = v; bx = x; by = y; }
        }
        return { canvas: out, body: { cx: (bx + 0.5) / sw, cy: (by + 0.5) / sh, r: Math.max(0.2, (best / 3) / sw) } };
    } catch (e) { return null; }
}

function loadFruitImages() {
    FR.forEach((def, i) => {
        images[i] = null;
        const img = new Image();
        img.onload = () => {
            const cut = autoCutout(img);
            if (cut) {                                              // background removed automatically
                images[i] = cut.canvas; def.imageBody = cut.body;
                try { def._clean = cut.canvas.toDataURL("image/png"); } catch (e) { /* ignore */ }
                if (def._clean) document.querySelectorAll('.home-fruit img[data-level="' + i + '"]').forEach((el) => { el.src = def._clean; });
            } else images[i] = img;
            updateNextPreview();
        };
        img.onerror = () => { images[i] = null; console.warn("Fruit image not found, using fallback drawing:", def.image); };
        img.src = def.image;
    });
}
const fruitSrc = (level) => FR[level]._clean || FR[level].image;

function createGame() {
    return {
        fruits: [], particles: [], texts: [], mergeQueue: [],
        score: 0, over: false, overTimer: 0, nextId: 1, time: 0, acc: 0,
        heldLevel: 0, nextLevel: 0, holdX: W / 2, canDrop: true, cooldown: 0, heldPop: 1,
        combo: 0, lastMergeTime: -99, maxImpact: 0, danger: false, bestAtStart: best,
        // power-ups (all temporary: a new game object resets them)
        bombMode: false, bombsLeft: C.powerups.bomb.uses, shakesLeft: C.powerups.shake.uses, bombX: W / 2, bombY: H / 2, aimed: false,
        explosions: [], screenShake: 0, shakeT: 0, shakeDur: C.powerups.shake.durationMs / 1000
    };
}

function randomLevel() {
    const list = C.gameplay.dropLevels;
    return clamp(list[Math.floor(Math.random() * list.length)], 0, LAST);
}

function newGame() {
    if (game) clearTimeout(game.overTimer);
    game = createGame();                                           // old fruits, particles, timers are all dropped
    game.heldLevel = clamp(C.gameplay.initialFruitLevel, 0, LAST);
    game.nextLevel = randomLevel();
    updateScoreUI(false);
    updateNextPreview();
    hideHint(); canvas.classList.remove("bomb-cursor");            // no leftover bomb / hint from the old game
    updatePowerButtons();
}

function makeFruit(level, x, y) {
    const def = FR[level];
    return {
        id: game.nextId++, level, r: def.radius, m: def.radius * def.radius,
        x, y, vx: 0, vy: 0, angle: 0, av: 0,
        alive: true, merging: false, age: 0, popDur: 0, squash: 0, sqA: 0, immuneUntil: 0, dangerT: 0
    };
}

/* ---------- UI helpers ---------- */
function updateScoreUI(bump) {
    const s = $("score"), b = $("best");
    if (!C.gameplay.showScore) { s.parentElement.style.visibility = "hidden"; b.parentElement.style.visibility = "hidden"; }
    s.textContent = game ? game.score : 0;
    b.textContent = best;
    if (bump) { s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop"); }
}
function updateNextPreview() {
    nextCanvas.parentElement.style.display = C.gameplay.showNextPreview ? "" : "none";
    nctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!game) return;
    const def = FR[game.nextLevel];
    nctx.save();
    nctx.translate(nextCanvas.width / 2, nextCanvas.height / 2);
    const k = 38 / def.radius; nctx.scale(k, k);
    drawFruit(nctx, game.nextLevel, 0, 0, 0, 1, 0, 0);
    nctx.restore();
}

/* ---------- Effects ---------- */
function burst(x, y, color, n) {
    if (!C.gameplay.enableParticles) return;
    for (let i = 0; i < n && game.particles.length < C.gameplay.maxParticles; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(90, 340);
        game.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, life: 0, max: rand(0.4, 0.85), size: rand(3, 7), color, star: i % 3 === 0 });
    }
}
function floatText(text, x, y, o) {
    game.texts.push({
        text, x: clamp(x, 70, W - 70), y: Math.max(y, 50), life: 0, max: o.lifeMs / 1000,
        vy: -o.riseSpeed, size: o.fontSize, color: o.color, outline: o.outline
    });
}

/* ---------- Dropping ---------- */
function dropFruit() {
    if (state !== "PLAYING" || !game || game.over || !game.canDrop) return;
    if (modalOpen || game.bombMode || performance.now() - M.closedAt < 250) return;   // menus / bomb mode never drop a fruit
    const def = FR[game.heldLevel];
    const f = makeFruit(game.heldLevel, clamp(game.holdX, def.radius, W - def.radius), C.gameplay.holdY);
    f.vy = 120;
    f.immuneUntil = game.time + C.danger.newFruitImmunityMs / 1000;
    game.fruits.push(f);
    AudioMgr.sfx("drop");
    game.canDrop = false;
    game.cooldown = C.gameplay.dropCooldownMs / 1000;
}

/* ---------- Physics ---------- */
function recordImpact(f, speed, nx, ny) {
    if (speed > game.maxImpact) game.maxImpact = speed;
    if (C.animation.squashAndStretch && speed > 120) {
        const s = Math.min(0.2, 0.02 + speed / 4500);
        if (s > f.squash) { f.squash = s; f.sqA = Math.atan2(ny, nx); }
    }
}

// Circle vs a straight wall. (nx, ny) points from the fruit INTO the wall.
function wallContact(f, nx, ny, pen) {
    const P = C.physics;
    f.x -= nx * pen; f.y -= ny * pen;
    const vn = f.vx * nx + f.vy * ny;
    if (vn <= 0) return;
    const e = vn > P.bounceMinSpeed ? P.restitution : 0;
    f.vx -= (1 + e) * vn * nx; f.vy -= (1 + e) * vn * ny;
    recordImpact(f, vn, nx, ny);
    // friction + spin (rolling)
    const tx = -ny, ty = nx;
    const vt = f.vx * tx + f.vy * ty + f.av * f.r;
    let jt = -vt / 3;
    const maxJ = P.wallFriction * (1 + e) * vn;
    jt = clamp(jt, -maxJ, maxJ);
    f.vx += jt * tx; f.vy += jt * ty;
    f.av += 2 * jt / f.r;
}

function pairContact(a, b) {
    const P = C.physics;
    const dx = b.x - a.x, dy = b.y - a.y, rs = a.r + b.r;
    const d2 = dx * dx + dy * dy;
    if (d2 >= rs * rs) return;
    const d = Math.sqrt(d2) || 0.0001;
    const nx = dx / d, ny = dy / d;

    // ---- merge check: same level + touching + neither already merging ----
    if (a.level === b.level && !a.merging && !b.merging && d <= rs + P.mergeTolerance &&
        (a.level < LAST || C.gameplay.maxFruitMerge === "vanish")) {
        a.merging = b.merging = true;                              // flag NOW so it can never merge twice
        game.mergeQueue.push([a, b]);
        return;
    }
    if (a.merging || b.merging) return;

    const ima = 1 / a.m, imb = 1 / b.m, sum = ima + imb;
    const pen = Math.max(0, rs - d - 0.05);
    const corr = Math.min(pen * 0.8, 8) / sum;                     // push apart (capped so nothing explodes)
    a.x -= nx * corr * ima; a.y -= ny * corr * ima;
    b.x += nx * corr * imb; b.y += ny * corr * imb;

    const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rvn >= 0) return;
    const e = -rvn > P.bounceMinSpeed ? P.restitution : 0;
    const jn = -(1 + e) * rvn / sum;
    a.vx -= jn * ima * nx; a.vy -= jn * ima * ny;
    b.vx += jn * imb * nx; b.vy += jn * imb * ny;
    recordImpact(a, -rvn, nx, ny); recordImpact(b, -rvn, -nx, -ny);

    // friction + spin
    const tx = -ny, ty = nx;
    const vt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty - b.av * b.r - a.av * a.r;
    let jt = -vt / (3 * sum);
    const maxJ = P.friction * jn;
    jt = clamp(jt, -maxJ, maxJ);
    a.vx -= jt * ima * tx; a.vy -= jt * ima * ty; b.vx += jt * imb * tx; b.vy += jt * imb * ty;
    a.av -= 2 * jt * ima / a.r; b.av -= 2 * jt * imb / b.r;
}

function stepPhysics(h) {
    const P = C.physics, fs = game.fruits, n = fs.length;
    for (let i = 0; i < n; i++) {
        const f = fs[i];
        f.vy += P.gravity * h;
        const damp = Math.max(0, 1 - P.linearDamping * h);
        f.vx *= damp; f.vy *= damp;
        f.av *= Math.max(0, 1 - P.angularDamping * h);
        const sp = Math.hypot(f.vx, f.vy);
        if (sp > P.maxSpeed) { f.vx *= P.maxSpeed / sp; f.vy *= P.maxSpeed / sp; }
        f.x += f.vx * h; f.y += f.vy * h; f.angle += f.av * h;
    }
    for (let it = 0; it < P.iterations; it++) {
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) pairContact(fs[i], fs[j]);
        }
        for (let i = 0; i < n; i++) {                              // walls last: they always win
            const f = fs[i];
            if (f.x < f.r) wallContact(f, -1, 0, f.r - f.x);
            if (f.x > W - f.r) wallContact(f, 1, 0, f.x - (W - f.r));
            if (f.y > H - f.r) wallContact(f, 0, 1, f.y - (H - f.r));
        }
    }
    // Safety net: a fruit can never end a step outside the container.
    for (let i = 0; i < n; i++) {
        const f = fs[i];
        if (f.x < f.r) { f.x = f.r; if (f.vx < 0) f.vx = 0; }
        if (f.x > W - f.r) { f.x = W - f.r; if (f.vx > 0) f.vx = 0; }
        if (f.y > H - f.r) { f.y = H - f.r; if (f.vy > 0) f.vy = 0; }
    }
}

/* ---------- Merging ---------- */
function processMerges() {
    if (!game.mergeQueue.length) return;
    const G = C.gameplay, created = [];
    for (const [a, b] of game.mergeQueue) {
        if (!a.alive || !b.alive) continue;
        a.alive = b.alive = false;
        const x = (a.x * a.m + b.x * b.m) / (a.m + b.m), y = (a.y * a.m + b.y * b.m) / (a.m + b.m);

        // combo counter
        game.combo = (game.time - game.lastMergeTime) * 1000 <= G.comboWindowMs ? game.combo + 1 : 1;
        game.lastMergeTime = game.time;
        const comboExtra = (game.combo - 1) * G.comboBonus;

        if (a.level >= LAST) {                                     // two watermelons: vanish + bonus
            const pts = G.maxFruitBonus + comboExtra;
            addScore(pts, x, y);
            burst(x, y, FR[LAST].effect.color, 60);
            floatText("SUPER MERGE!", W / 2, y - 40, { ...C.text.mergeText, fontSize: 44 });
            triggerJumpscare("twoWatermelons");
            const WB = C.powerups.watermelonBonus || 0;                // reward: +1 bomb and +1 shake (works from 0, unlimited stays unlimited)
            if (WB > 0) {
                if (game.bombsLeft >= 0) game.bombsLeft += WB;
                if (game.shakesLeft >= 0) game.shakesLeft += WB;
                floatText(`+${WB} BOMB  +${WB} SHAKE`, W / 2, y + 10, { ...C.text.mergeText, fontSize: 30 });
                updatePowerButtons();
            }
            AudioMgr.sfx("merge"); AudioMgr.sfx("score");
            continue;
        }
        const level = a.level + 1, def = FR[level];
        const nf = makeFruit(level, x, y);
        nf.vx = (a.vx * a.m + b.vx * b.m) / (a.m + b.m) * 0.5;
        nf.vy = (a.vy * a.m + b.vy * b.m) / (a.m + b.m) * 0.5;
        nf.av = (a.av + b.av) * 0.5;
        nf.x = clamp(nf.x, nf.r, W - nf.r); nf.y = Math.min(nf.y, H - nf.r);
        nf.popDur = 0.32;                                          // grows in with a little overshoot
        nf.immuneUntil = game.time + C.danger.mergeImmunityMs / 1000;
        created.push(nf);

        addScore(def.score + comboExtra, x, y);
        const eff = def.effect || {};
        burst(x, y, eff.color || "#fff", eff.particles || 12);
        // merge text
        const M = C.text.mergeText;
        if (M.enabled) {
            if (game.combo >= 2) floatText(M.comboTemplate.replace("{n}", game.combo), x, y - def.radius - 18, M);
            else if (Math.random() < M.chance) floatText(M.texts[Math.floor(Math.random() * M.texts.length)], x, y - def.radius - 18, M);
        }
        AudioMgr.sfx("merge", 0.7 + 0.3 * (level / LAST));
        AudioMgr.sfx("score");
        if (def.sound) AudioMgr.playFile(def.sound);
        if (level === LAST) triggerJumpscare("watermelonCreated");
    }
    game.mergeQueue.length = 0;
    game.fruits = game.fruits.filter((f) => f.alive);
    for (const nf of created) game.fruits.push(nf);
}

function addScore(pts, x, y) {
    if (pts <= 0) return;
    game.score += pts;
    if (game.score > best) { best = game.score; store.set("mergeFruitBest", String(best)); }
    updateScoreUI(true);
    const P = C.text.scorePopup;
    if (P.enabled) floatText("+" + pts, x, y, P);
}

/* ---------- Danger line / game over ---------- */
function checkDanger(dt) {
    const D = C.danger;
    game.danger = false;
    if (!C.gameplay.dangerLineEnabled) return;
    for (const f of game.fruits) {
        if (f.merging || game.time < f.immuneUntil) { f.dangerT = 0; continue; }
        if (f.y - f.r < D.lineY) {                                 // actual position of the fruit's top edge
            f.dangerT += dt;
            game.danger = true;
            if (f.dangerT * 1000 >= D.graceMs) { triggerGameOver(); return; }
        } else f.dangerT = 0;                                      // left the line: timer resets
    }
}

function triggerGameOver() {
    if (game.over) return;                                         // fires only once
    game.over = true;
    game.canDrop = false;
    cancelBomb();
    AudioMgr.stopAllMusic();
    AudioMgr.sfx("gameOver");
    store.set("mergeFruitBest", String(best));
    game.overTimer = setTimeout(() => { if (state === "PLAYING" && game.over) goTo("GAME_OVER"); }, C.gameplay.gameOverDelayMs);
}

function showGameOver() {
    buildLetters($("over-title"), C.text.gameOverLines, C.text.gameOverColors);
    $("final-score").textContent = game.score;
    $("final-best").textContent = best;
    $("new-best").hidden = !(game.score > 0 && game.score > game.bestAtStart);
    const box = $("over-fruits"); box.innerHTML = "";
    if (C.animation.fallingFruitsOnGameOver) {
        // Equal number of fruits on each side of the centre panel, spread evenly in lanes.
        const perSide = 6;
        for (let i = 0; i < perSide * 2; i++) {
            const side = i % 2, k = Math.floor(i / 2);                // side 0 = left, 1 = right
            const lvl = (k * 3 + side * 4 + Math.floor(rand(0, 2))) % FR.length, img = new Image();
            img.className = "fall-fruit"; img.src = fruitSrc(lvl); img.alt = ""; img.draggable = false;
            const lane = (k + rand(0.1, 0.7)) / perSide;               // 0..1 inside this side's area
            const pos = side === 0 ? 1 + lane * 28 : 69 + lane * 25;    // left: 1-29%, right: 69-94%
            img.style.width = rand(50, 96) + "px"; img.style.left = pos + "%";
            img.style.animationDuration = rand(7, 10).toFixed(1) + "s";
            img.style.animationDelay = (-(k + side * 0.5) * (9 / perSide) - rand(0, 1)).toFixed(1) + "s";
            img.style.setProperty("--spin", (side ? 1 : -1) * rand(180, 540) + "deg");
            img.onerror = () => img.remove();
            box.appendChild(img);
        }
    }
}

/* ---------- Main loop ---------- */
function startLoop() { cancelAnimationFrame(rafId); lastTs = 0; rafId = requestAnimationFrame(frame); }
function stopLoop() { cancelAnimationFrame(rafId); rafId = 0; }

function frame(ts) {
    rafId = requestAnimationFrame(frame);
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    if (game) { if (!modalOpen && !jumpscare.active) update(dt); render(); }      // menus pause the game (but it stays drawn)
}

function update(dt) {
    const g = game;
    if (!g.over) {
        g.time += dt;
        // keyboard aiming
        if (keys.left) g.holdX -= C.gameplay.keyboardSpeed * dt;
        if (keys.right) g.holdX += C.gameplay.keyboardSpeed * dt;
        g.holdX = clamp(g.holdX, 0, W);
        // next fruit appears after the cooldown
        if (!g.canDrop) {
            g.cooldown -= dt;
            if (g.cooldown <= 0) { g.heldLevel = g.nextLevel; g.nextLevel = randomLevel(); g.canDrop = true; g.heldPop = 0; updateNextPreview(); }
        } else g.heldPop = Math.min(1, g.heldPop + dt / 0.25);
        // physics with a fixed time step
        const h = 1 / C.physics.stepsPerSecond;
        g.acc += dt;
        while (g.acc >= h) { stepPhysics(h); g.acc -= h; processMerges(); }
        if (g.maxImpact > C.audio.collisionMinSpeed) AudioMgr.sfx("collision", clamp(g.maxImpact / 1200, 0.25, 1));
        g.maxImpact = 0;
        checkDanger(dt);
        if (g.shakeT > 0) {
            g.shakeT = Math.max(0, g.shakeT - dt);
            if (g.shakeKicks === 1 && g.shakeT <= g.shakeDur * 0.5) { g.shakeKicks = 2; kickFruits(); }   // second kick, opposite mix
            if (g.shakeT === 0) updatePowerButtons();
        }
    }
    // visual-only updates (these never change the score)
    for (const f of g.fruits) { f.age += dt; f.squash *= Math.pow(0.0006, dt); if (f.squash < 0.002) f.squash = 0; }
    for (const p of g.particles) { p.life += dt; p.vy += 650 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    g.particles = g.particles.filter((p) => p.life < p.max);
    for (const t of g.texts) { t.life += dt; t.y += t.vy * dt; }
    g.texts = g.texts.filter((t) => t.life < t.max);
    for (const e of g.explosions) e.t += dt;
    g.explosions = g.explosions.filter((e) => e.t < e.dur);
    g.screenShake = Math.max(0, g.screenShake - dt * 1.8);
}

/* ---------- Rendering ---------- */
function drawFruit(c, level, x, y, angle, scale, squash, sqA) {
    const def = FR[level], r = def.radius;
    c.save();
    c.translate(x, y);
    if (squash) { c.rotate(sqA); c.scale(1 - squash, 1 + squash); c.rotate(angle - sqA); } else c.rotate(angle);
    if (scale !== 1) c.scale(scale, scale);
    const img = images[level];
    if (img) {
        const b = def.imageBody || { cx: 0.5, cy: 0.5, r: 0.5 };
        const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
        const dw = r / b.r, dh = dw * ih / iw;   // body radius in the picture == collision radius
        c.drawImage(img, -b.cx * dw, -b.cy * dh, dw, dh);
    } else {                                                        // fallback: coloured ball with a cute face
        const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
        g.addColorStop(0, "#ffffff"); g.addColorStop(0.25, def.fallbackColor); g.addColorStop(1, def.fallbackColor);
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 2; c.stroke();
        c.fillStyle = "#3a1a10";
        c.beginPath(); c.arc(-r * 0.3, -r * 0.05, r * 0.11, 0, 7); c.arc(r * 0.3, -r * 0.05, r * 0.11, 0, 7); c.fill();
        c.strokeStyle = "#3a1a10"; c.lineWidth = Math.max(2, r * 0.06);
        c.beginPath(); c.arc(0, r * 0.12, r * 0.22, 0.2, Math.PI - 0.2); c.stroke();
    }
    c.restore();
}

function drawStar(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s);
    c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s); c.fill();
}

function visualScale(f) {
    return f.popDur > 0 && f.age < f.popDur ? 0.35 + 0.65 * easeOutBack(f.age / f.popDur) : 1;
}

function render() {
    const g = game, D = C.danger, rot = C.animation.fruitRotation;
    ctx.setTransform(view.k, 0, 0, view.k, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (g.screenShake > 0) ctx.translate(rand(-1, 1) * g.screenShake * 10, rand(-1, 1) * g.screenShake * 10);

    // container interior (translucent so the fruits stand out on any background)
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "rgba(255,255,255,.30)"); bg.addColorStop(1, "rgba(255,255,255,.52)");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (C.gameplay.dangerLineEnabled) { ctx.fillStyle = "rgba(120,60,20,.07)"; ctx.fillRect(0, 0, W, D.lineY); }

    // danger line
    if (C.gameplay.dangerLineEnabled) {
        ctx.save();
        ctx.setLineDash([14, 10]); ctx.lineWidth = 3;
        ctx.strokeStyle = g.danger ? `rgba(255,30,30,${0.6 + 0.4 * Math.sin(g.time * 14)})` : "rgba(225,60,60,.7)";
        ctx.beginPath(); ctx.moveTo(0, D.lineY); ctx.lineTo(W, D.lineY); ctx.stroke();
        ctx.restore();
    }

    // aiming guide + held fruit
    if (!g.over && g.canDrop) {
        const def = FR[g.heldLevel], x = clamp(g.holdX, def.radius, W - def.radius);
        if (C.gameplay.showGuideLine) {
            ctx.save(); ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.75)";
            ctx.beginPath(); ctx.moveTo(x, C.gameplay.holdY + def.radius); ctx.lineTo(x, H); ctx.stroke(); ctx.restore();
        }
        const s = 0.35 + 0.65 * easeOutBack(clamp(g.heldPop, 0, 1));
        if (g.bombMode) ctx.globalAlpha = 0.3;                       // dim the held fruit while aiming a bomb
        drawFruit(ctx, g.heldLevel, x, C.gameplay.holdY, 0, s, 0, 0);
        ctx.globalAlpha = 1;
    }

    // fruits
    // SHAKE is visual only: sprites get a temporary offset, the physics positions are never touched.
    const SK = C.powerups.shake;
    const env = g.shakeT > 0 ? Math.sin((1 - g.shakeT / g.shakeDur) * Math.PI) : 0;
    const sx = (f) => env ? Math.sin(g.time * 70 + f.id * 1.7) * SK.amplitude * env : 0;
    const sr = (f) => env ? Math.sin(g.time * 55 + f.id * 2.3) * SK.rotation * env : 0;
    // Pass 1: whole pictures (leaves and stems included).
    for (const f of g.fruits) drawFruit(ctx, f.level, f.x + sx(f), f.y, f.angle * rot + sr(f), visualScale(f), f.squash, f.sqA);
    // Pass 2: redraw each fruit's round body on top, so one fruit's leaves never cover another fruit's face.
    for (const f of g.fruits) {
        ctx.save();
        ctx.beginPath(); ctx.arc(f.x + sx(f), f.y, f.r * visualScale(f) * 1.02, 0, Math.PI * 2); ctx.clip();
        drawFruit(ctx, f.level, f.x + sx(f), f.y, f.angle * rot + sr(f), visualScale(f), f.squash, f.sqA);
        ctx.restore();
    }

    // particles
    for (const p of g.particles) {
        const k = 1 - p.life / p.max;
        ctx.globalAlpha = Math.max(0, k); ctx.fillStyle = p.color;
        if (p.star) drawStar(ctx, p.x, p.y, p.size * 1.8 * k + 1);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k + 0.5, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;

    // explosions (cartoon fireball + shock ring, only around the blast)
    for (const e of g.explosions) {
        const p = e.t / e.dur, out = 1 - Math.pow(1 - p, 3);
        if (p < 0.18) { ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - p / 0.18)})`; ctx.beginPath(); ctx.arc(e.x, e.y, e.R * 1.15, 0, 7); ctx.fill(); }
        const r = e.R * (0.3 + 0.8 * out), gr = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        gr.addColorStop(0, `rgba(255,240,150,${1 - p})`); gr.addColorStop(0.45, `rgba(255,140,30,${0.85 * (1 - p)})`); gr.addColorStop(1, "rgba(200,40,10,0)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - p)})`; ctx.lineWidth = 5 * (1 - p) + 1;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.R * (0.2 + 1.0 * out), 0, 7); ctx.stroke();
    }

    // bomb reticle: shows the blast area and which fruits it will hit
    if (g.bombMode && g.aimed && !g.over) {
        const R = C.powerups.bomb.radius;
        ctx.save();
        ctx.fillStyle = "rgba(255,120,30,.14)"; ctx.beginPath(); ctx.arc(g.bombX, g.bombY, R, 0, 7); ctx.fill();
        ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = "#ff4a1a"; ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(g.bombX - 14, g.bombY); ctx.lineTo(g.bombX + 14, g.bombY); ctx.moveTo(g.bombX, g.bombY - 14); ctx.lineTo(g.bombX, g.bombY + 14); ctx.stroke();
        ctx.strokeStyle = "rgba(255,60,20,.95)"; ctx.lineWidth = 3;
        for (const f of g.fruits) if (Math.hypot(f.x - g.bombX, f.y - g.bombY) <= R) { ctx.beginPath(); ctx.arc(f.x, f.y, f.r + 3, 0, 7); ctx.stroke(); }
        ctx.font = "28px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("\uD83D\uDCA3", g.bombX, g.bombY - R - 16);
        ctx.restore();
    }

    // floating texts (score popups, NICE!, COMBO...)
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    for (const t of g.texts) {
        const k = t.life / t.max, pop = k < 0.2 ? easeOutBack(k / 0.2) : 1;
        ctx.save();
        ctx.globalAlpha = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
        ctx.translate(t.x, t.y); ctx.scale(pop, pop);
        ctx.font = `${t.size}px ${C.fonts.score}`;
        ctx.shadowColor = C.text.canvasShadow; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
        ctx.lineWidth = t.size * 0.2; ctx.strokeStyle = t.outline; ctx.strokeText(t.text, 0, 0);
        ctx.shadowColor = "transparent"; ctx.fillStyle = t.color; ctx.fillText(t.text, 0, 0);
        ctx.restore();
    }

    // game-over flash
    if (g.over) { ctx.fillStyle = `rgba(255,40,40,${0.12 + 0.08 * Math.sin(performance.now() / 90)})`; ctx.fillRect(0, 0, W, H); }
}

function resizeCanvas() {
    const holder = $("jar-holder"), cs = getComputedStyle(holder);
    const aw = holder.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = holder.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (aw <= 0 || ah <= 0) return;
    const s = Math.min(aw / W, ah / H);
    const cssW = Math.floor(W * s), cssH = Math.floor(H * s);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    view.k = canvas.width / W;
}


/* =====================================================================
   7. INPUT (mouse, touch, keyboard)
   ===================================================================== */
function aimAt(e) {
    if (!game) return;
    const rect = canvas.getBoundingClientRect();
    game.holdX = (e.clientX - rect.left) / rect.width * W;
    game.bombX = clamp(game.holdX, 0, W);
    game.bombY = clamp((e.clientY - rect.top) / rect.height * H, 0, H);
    game.aimed = true;
}

function bindInput() {
    let pressed = false;
    const live = () => state === "PLAYING" && game && !game.over && !modalOpen;
    canvas.addEventListener("pointerdown", (e) => {
        if (!live()) return;
        pressed = true; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        aimAt(e);
    });
    canvas.addEventListener("pointermove", (e) => {
        if (!live()) return;
        if (e.pointerType === "mouse" || pressed) aimAt(e);        // mouse: follow cursor; touch: follow finger
    });
    canvas.addEventListener("pointerup", (e) => {
        if (!live()) { pressed = false; return; }
        if (pressed) { aimAt(e); if (game.bombMode) detonate(); else dropFruit(); }   // bomb mode: blast, never drop
        pressed = false;
    });
    canvas.addEventListener("pointercancel", () => { pressed = false; });
    canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && game && !pressed) game.aimed = false; });

    window.addEventListener("keydown", (e) => {
        const k = e.key;
        if (k === "Escape") { handleEscape(); return; }
        if (state !== "PLAYING" || modalOpen || !game) return;
        if (game.bombMode) {                                       // keyboard bomb aiming
            const step = 18;
            if (k === "ArrowLeft" || k === "a" || k === "A") game.bombX = clamp(game.bombX - step, 0, W);
            else if (k === "ArrowRight" || k === "d" || k === "D") game.bombX = clamp(game.bombX + step, 0, W);
            else if (k === "ArrowUp" || k === "w" || k === "W") game.bombY = clamp(game.bombY - step, 0, H);
            else if (k === "ArrowDown" || k === "s" || k === "S") game.bombY = clamp(game.bombY + step, 0, H);
            else if ((k === " " || k === "Enter") && !e.repeat) { detonate(); }
            else return;
            game.aimed = true; e.preventDefault(); return;
        }
        if (k === "ArrowLeft" || k === "a" || k === "A") { keys.left = true; e.preventDefault(); }
        else if (k === "ArrowRight" || k === "d" || k === "D") { keys.right = true; e.preventDefault(); }
        else if ((k === " " || k === "ArrowDown" || k === "Enter") && !e.repeat) {
            if (document.activeElement && document.activeElement.tagName === "BUTTON") document.activeElement.blur();
            e.preventDefault(); dropFruit();
        } else if (k === "m" || k === "M") AudioMgr.toggleMute();
    });
    window.addEventListener("keyup", (e) => {
        const k = e.key;
        if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = false;
        if (k === "ArrowRight" || k === "d" || k === "D") keys.right = false;
    });
    window.addEventListener("blur", () => { keys.left = keys.right = false; pressed = false; });
    window.addEventListener("resize", () => { if (state === "PLAYING") resizeCanvas(); });
    window.addEventListener("orientationchange", () => setTimeout(() => { if (state === "PLAYING") resizeCanvas(); }, 200));
}
const jumpscare = { active: false, count: 0, lastAt: -1e9, timer: 0, game: null };

function jumpscareFallbackSound() {
    try {
        const ac = AudioMgr.ctx; if (!ac) return;
        const t = ac.currentTime, out = ac.createGain(); out.gain.value = 0.9 * C.jumpscare.volume; out.connect(ac.destination);
        const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(140, t + 1.2);
        const g = ac.createGain(); g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.4); o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.5);
        const buf = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const n = ac.createBufferSource(); n.buffer = buf; const ng = ac.createGain(); ng.gain.value = 0.9; n.connect(ng); ng.connect(out); n.start(t);
    } catch (e) { /* ignore */ }
}

function endJumpscare() {
    if (!jumpscare.active) return;
    clearTimeout(jumpscare.timer);
    const box = $("jumpscare"), v = $("jumpscare-video");
    box.hidden = true; box.classList.remove("fallback");
    try { v.pause(); } catch (e) { /* ignore */ }
    v.removeAttribute("src"); v.load();
    jumpscare.active = false;
    lastTs = 0;
    if (state === "PLAYING" && game && !game.over) AudioMgr.playMusic("game");
}

function triggerJumpscare(kind) {
    const J = C.jumpscare;
    if (!J || !J.enabled || kind !== J.trigger || jumpscare.active || !game || game.over) return;
    const now = performance.now();
    if (J.oncePerGame && jumpscare.game === game) return;
    if (now - jumpscare.lastAt < J.cooldownMs) return;
    jumpscare.game = game; jumpscare.lastAt = now; jumpscare.active = true;
    cancelBomb(); keys.left = keys.right = false;
    AudioMgr.stopAllMusic(true);

    const box = $("jumpscare"), v = $("jumpscare-video");
    box.classList.remove("fallback"); box.hidden = false;
    const fallback = () => {
        box.classList.add("fallback");
        try { v.pause(); } catch (e) { /* ignore */ }
        if (!(J.respectMute && AudioMgr.muted)) jumpscareFallbackSound();
        clearTimeout(jumpscare.timer); jumpscare.timer = setTimeout(endJumpscare, 1800);
    };
    if (J.video) {
        v.muted = !!(J.respectMute && AudioMgr.muted); v.volume = clamp(J.volume, 0, 1); v.currentTime = 0;
        v.onended = endJumpscare;
        v.onerror = fallback;
        v.src = J.video;
        const p = v.play();
        if (p && p.catch) p.catch(() => { v.muted = true; const q = v.play(); if (q && q.catch) q.catch(fallback); });
    } else fallback();
    jumpscare.timer = setTimeout(endJumpscare, J.maxDurationMs);
}
/* =====================================================================
   7b. POWER-UPS (bomb / shake) AND MODALS (settings / confirm / tutorial)
   ===================================================================== */
let modalOpen = false;                                   // true while any menu is open (game is paused)
const M = { current: null, from: null, closedAt: -1e9, confirmYes: null, tutPage: 0 };
let hintTimer = 0;
const isPlaying = () => state === "PLAYING" && !!game && !game.over;

// ----- hint banner -----
function showHint(text, ms, cancelable) {
    clearTimeout(hintTimer);
    $("hint-text").textContent = text;
    $("hint-cancel").hidden = !cancelable;
    $("power-hint").hidden = false;
    if (ms) hintTimer = setTimeout(() => { if (!(game && game.bombMode)) $("power-hint").hidden = true; }, ms);
}
function hideHint() { clearTimeout(hintTimer); $("power-hint").hidden = true; }

function updatePowerButtons() {
    const ok = isPlaying() && !modalOpen;
    const left = game ? game.bombsLeft : 0;
    $("bomb-count").textContent = left < 0 ? "\u221E" : left;
    $("btn-bomb").disabled = !ok || left === 0;
    $("btn-bomb").classList.toggle("armed", !!(game && game.bombMode));
    const sLeft = game ? game.shakesLeft : 0;
    $("shake-count").textContent = sLeft < 0 ? "\u221E" : sLeft;
    $("btn-shake").disabled = !ok || sLeft === 0 || !!(game && game.shakeT > 0);
    $("btn-settings").disabled = false;                      // settings must always be clickable (openSettings has its own guards)
}

// ----- BOMB -----
function toggleBomb() {
    if (!isPlaying() || modalOpen) return;
    if (game.bombMode) { cancelBomb(); return; }                    // pressing again cancels
    if (game.bombsLeft === 0) { showHint("NO BOMBS LEFT!", 1200, false); return; }
    if (!game.fruits.length) { showHint("NOTHING TO BLAST YET!", 1200, false); return; }
    game.bombMode = true; game.aimed = false;
    canvas.classList.add("bomb-cursor");
    showHint("TAP A SECTION TO BLOW IT UP!", 0, true);
    AudioMgr.sfx("click");
    updatePowerButtons();
}
function cancelBomb() {                                           // does not use up a bomb
    if (game) game.bombMode = false;
    canvas.classList.remove("bomb-cursor");
    hideHint();
    updatePowerButtons();
}
function detonate() {
    const g = game, P = C.powerups.bomb;
    if (!g || !g.bombMode || g.over || modalOpen) return;
    const x = g.bombX, y = g.bombY;
    // distance d = sqrt((xf - xb)^2 + (yf - yb)^2); a fruit is removed only when d <= blast radius
    const victims = g.fruits.filter((f) => !f.merging && Math.hypot(f.x - x, f.y - y) <= P.radius);
    if (!victims.length) { showHint("NO FRUITS THERE - TRY ANOTHER SPOT!", 1200, true); return; }   // stays armed, bomb not used
    g.bombMode = false;                                            // one selection = one explosion
    if (g.bombsLeft > 0) g.bombsLeft--;
    for (const f of victims) {
        f.alive = false;
        burst(f.x, f.y, (FR[f.level].effect || {}).color || "#fff", 12);
        burst(f.x, f.y, "#7a6c86", 4);                             // smoke
    }
    g.fruits = g.fruits.filter((f) => f.alive);                    // gone from physics, collisions and drawing
    for (const f of g.fruits) f.dangerT = 0;                       // let the pile settle before the danger-line timer counts
    g.explosions.push({ x, y, t: 0, dur: 0.6, R: P.radius });
    g.screenShake = P.screenShake;
    AudioMgr.sfx("bomb");
    canvas.classList.remove("bomb-cursor");
    hideHint();
    updatePowerButtons();
}

// ----- SHAKE (real physics: every fruit gets a small hop + random sideways push) -----
function kickFruits() {
    const SK = C.powerups.shake, g = game;
    for (const f of g.fruits) {
        if (f.merging) continue;
        f.vy -= SK.upSpeed * rand(0.7, 1.15);
        f.vx += (Math.random() < 0.5 ? -1 : 1) * SK.sideSpeed * rand(0.35, 1);
        f.av += rand(-SK.spin, SK.spin);
        f.dangerT = 0;
        f.immuneUntil = Math.max(f.immuneUntil || 0, g.time + 1.2); // hopping above the red line must not cause game over
    }
}
function doShake() {
    if (!isPlaying() || modalOpen || game.shakeT > 0) return;       // ignore while already shaking
    if (game.shakesLeft === 0) { showHint("NO SHAKES LEFT!", 1200, false); return; }
    if (game.shakesLeft > 0) game.shakesLeft--;
    game.shakeDur = C.powerups.shake.durationMs / 1000;
    game.shakeT = game.shakeDur;
    game.shakeKicks = 1;
    kickFruits();                                                   // real physics kick: fruits hop and bump into each other
    AudioMgr.sfx("shake");
    if (!game.bombMode) showHint("SHAKE THE FRUITS!", 900, false);
    updatePowerButtons();
}

// ----- modals -----
function setModal(name) {
    const layer = $("modal-layer");
    layer.hidden = false;
    layer.querySelectorAll(".modal").forEach((m) => { m.hidden = m.id !== "modal-" + name; m.classList.remove("in"); });
    void layer.offsetWidth;
    layer.classList.add("open");
    $("modal-" + name).classList.add("in");
    M.current = name; modalOpen = true;
    keys.left = keys.right = false;
    updatePowerButtons();
    const first = $("modal-" + name).querySelector("button:not([disabled])"); if (first) first.focus();
}
function closeModals() {
    if (!modalOpen) return;
    const layer = $("modal-layer");
    layer.classList.remove("open");
    modalOpen = false; M.current = null; M.closedAt = performance.now();
    updatePowerButtons();
    setTimeout(() => {
        if (modalOpen) return;
        layer.hidden = true;
        layer.querySelectorAll(".modal").forEach((m) => { m.hidden = true; m.classList.remove("in"); });
    }, 230);
}
function openSettings() {
    if (modalOpen || transitioning || state === "GAME_OVER") return;   // never two menus at once
    if (state === "PLAYING" && (!game || game.over)) return;
    cancelBomb();
    M.from = state;                                                // remember where we came from
    AudioMgr.sfx("click");
    const playing = state === "PLAYING";
    $("set-restart").disabled = !playing;
    $("set-restart").title = playing ? "" : "Start a game first";
    AudioMgr.updateButtons();
    setModal("settings");
}
function openConfirm(msg, yesLabel, onYes) {
    $("confirm-msg").textContent = msg;
    $("confirm-yes-label").textContent = yesLabel;
    M.confirmYes = onYes;
    setModal("confirm");
}
function handleEscape() {
    if (modalOpen) { if (M.current === "confirm") setModal("settings"); else closeModals(); }
    else if (state === "PLAYING" && game && game.bombMode) cancelBomb();
    else if ((state === "PLAYING" && isPlaying()) || state === "HOME") openSettings();
}

// ----- tutorial (text matches the real rules and config) -----
function tutorialPages() {
    const pts = FR.slice(1).map((f) => `${f.name} ${f.score}`).join(", ");
    const chain = FR.map((f, i) => `<img src="${fruitSrc(i)}" alt="${f.name}">`).join("<i>&rsaquo;</i>");
    const bombs = C.powerups.bomb.uses < 0 ? "unlimited bombs" : `${C.powerups.bomb.uses} bombs`;
    const shakes = C.powerups.shake.uses < 0 ? "unlimited shakes" : `${C.powerups.shake.uses} shakes`;
    return [
        `<h3>DROP &amp; AIM</h3><p>Move the mouse, drag your finger, or use <b>&larr; &rarr;</b> / <b>A D</b> to aim the fruit at the top.</p><p>Click, lift your finger, or press <b>Space</b> to drop it. The <b>NEXT</b> box shows the fruit that comes after.</p>`,
        `<h3>MERGE &amp; SCORE</h3><p>Two touching fruits of the same kind merge into the next fruit:</p><div class="tut-chain">${chain}</div><p>Each merge scores the new fruit's points (${pts}). Merges in quick succession make a <b>combo</b> (+${C.gameplay.comboBonus} per step). Two watermelons vanish for +${C.gameplay.maxFruitBonus}.</p>`,
        `<h3>DON'T FILL THE JAR</h3><p>If a fruit stays above the red dashed line for about ${(C.danger.graceMs / 1000).toFixed(1)} seconds, the game is over.</p><p>Keep merging to keep the pile low!</p>`,
        `<h3>POWER-UPS</h3><div class="tut-power"><b>&#128163;</b><span><b>BOMB</b> (${bombs}): Tap the Bomb button, then select a section of the board to destroy nearby fruits. Use it strategically to clear space. Press Cancel or Esc to back out without using a bomb. You start with ${bombs}.</span></div><div class="tut-power"><b>&#128243;</b><span><b>SHAKE</b> (${shakes}): Tap the Shake button to make every fruit hop and shuffle, so two matching fruits may touch and merge. Merge two watermelons to earn +1 bomb and +1 shake!</span></div>`
    ];
}
function renderTutorial() {
    const pages = tutorialPages(), n = pages.length;
    M.tutPage = clamp(M.tutPage, 0, n - 1);
    $("tut-body").innerHTML = pages[M.tutPage];
    $("tut-dots").innerHTML = pages.map((_, i) => `<span class="${i === M.tutPage ? "on" : ""}"></span>`).join("");
    $("tut-back").disabled = M.tutPage === 0;
    $("tut-next").disabled = M.tutPage === n - 1;
}

function bindUI() {
    const press = (id, fn) => $(id).addEventListener("click", (e) => { e.currentTarget.blur(); fn(); });
    const on = (id, fn) => $(id).addEventListener("click", fn);          // menu buttons keep keyboard focus
    press("btn-play",      () => { AudioMgr.sfx("click"); goTo("PLAYING"); });
    press("btn-again",     () => { AudioMgr.sfx("restart"); goTo("PLAYING"); });
    press("btn-over-home", () => { AudioMgr.sfx("click"); goTo("HOME"); });
    press("btn-settings",  openSettings);
    press("btn-gear",      openSettings);
    press("btn-bomb",      toggleBomb);
    press("btn-shake",     doShake);
    press("hint-cancel",   () => cancelBomb());
    document.querySelectorAll("[data-sound-toggle]").forEach((b) => b.addEventListener("click", (e) => { e.currentTarget.blur(); AudioMgr.toggleMute(); }));

    // settings menu
    on("set-sound", () => { AudioMgr.toggleMute(); if (!AudioMgr.muted) AudioMgr.sfx("click"); });
    on("set-home", () => {
        AudioMgr.sfx("click");
        if (M.from !== "PLAYING") { closeModals(); return; }               // already on the home screen
        openConfirm("Are you sure you want to return to the home screen?", "YES, GO HOME", () => { closeModals(); cancelBomb(); goTo("HOME"); });
    });
    on("set-restart", () => {
        AudioMgr.sfx("click");
        openConfirm("Are you sure you want to restart? Your current game progress will be lost.", "YES, RESTART", () => {
            closeModals(); AudioMgr.sfx("restart"); newGame();               // newGame clears bomb, shake, explosions, score, fruits
        });
    });
    on("set-tutorial", () => { AudioMgr.sfx("click"); M.tutPage = 0; renderTutorial(); setModal("tutorial"); });
    on("set-close", () => { AudioMgr.sfx("click"); closeModals(); });
    // confirm dialog
    on("confirm-yes", () => { const fn = M.confirmYes; M.confirmYes = null; if (fn) fn(); });
    on("confirm-no",  () => { M.confirmYes = null; AudioMgr.sfx("click"); setModal("settings"); });
    // tutorial
    on("tut-back",  () => { M.tutPage--; renderTutorial(); AudioMgr.sfx("click"); });
    on("tut-next",  () => { M.tutPage++; renderTutorial(); AudioMgr.sfx("click"); });
    on("tut-close", () => { AudioMgr.sfx("click"); closeModals(); });
}


/* =====================================================================
   8. START-UP
   ===================================================================== */
function init() {
    applyCssConfig();
    const hw = isHalloween();
    buildLetters($("title"), C.text.titleLines, hw ? C.theme.halloween.titleColors : C.text.titleColors, hw);
    buildHomeFruits();
    applyBackground($("bg-home"), C.assets.homeBackground);
    applyBackground($("bg-game"), C.assets.gameBackground);
    applyBackground($("bg-over"), C.assets.gameOverBackground);
    loadFruitImages();
    AudioMgr.init();
    bindUI();
    bindInput();
    updateScoreUI(false);
    enter("HOME");
}

init();
