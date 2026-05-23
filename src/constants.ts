export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Color palette — per-archetype identity + shared
export const COLORS = {
  PLAYER: 0xf5e642,         // support gold (particles / UI)
  PLAYER_LIGHT: 0xfff8a0,
  SUPPORT_CORE: 0xe8f0ff,   // The Last Support — near-white
  SUPPORT_HALO: 0x88ccff,   // soft cyan halo / orbits
  SUPPORT_VIOLET: 0xaa88ff, // pale violet armor accent

  // Solo — Knight: gold / steel / orange
  SOLO: 0xd4a820,           // knightly gold
  SOLO_STEEL: 0x8899bb,     // armor steel
  SOLO_ACCENT: 0xff9922,    // orange crack/glow

  // ADC — Elf Ranger: purple / silver
  ADC: 0x9944ff,            // deep purple
  ADC_SILVER: 0xccddff,     // silver highlight
  ADC_BOLT: 0xdd99ff,       // tracer bolt purple-white

  // Mid — Flame Humanoid: red / magma / lava
  MID: 0xff3311,            // lava red
  MID_MAGMA: 0xff7722,      // magma orange core
  MID_EMBER: 0xffcc44,      // ember yellow

  // Jungler — Rogue: green / shadow
  JUNGLER: 0x33dd66,        // spectral green
  JUNGLER_SHADOW: 0x0d2e1a, // deep shadow
  JUNGLER_TRAIL: 0x88ffaa,  // phantom afterimage

  // Enemies
  GRUNT: 0x778899,          // slate grey
  HARASSER: 0xff8844,       // orange
  ASSASSIN: 0xbb1133,       // blood red

  // World
  BACKGROUND: 0x0a0a14,
  BACKGROUND_NIGHT: 0x04040c,
  UI_BG: 0x0e0e1e,
  UI_BORDER: 0x2233aa,
  UI_TEXT: 0xe0e0ff,
  HEALTH_HIGH: 0x33cc55,
  HEALTH_MID: 0xccaa22,
  HEALTH_LOW: 0xcc2222,
  XP_BAR: 0x6655ff,
  SHINE_GOLD: 0xffd700,
  HEAL_PARTICLE: 0x44ff88,
  SHIELD_PARTICLE: 0x88aaff,
  DAMAGE_PARTICLE: 0xff4444,
  WHITE: 0xffffff,
  BLACK: 0x000000,
};

// Timing (ms)
export const TIMING = {
  DAY_DURATION_MS: 6 * 60 * 1000, // 6 minutes
  WAVE_LULL_MS: 5000,
  SHINE_INTERVAL_MIN_MS: 35000,
  SHINE_INTERVAL_MAX_MS: 50000,
  SHINE_DURATION_MS: 12000,
  QUIP_CARD_HOLD_MS: 1800,
  LEVEL_UP_PAUSE_MS: 0, // paused until player chooses
};

export const AUDIO = {
  SHINE_TRIGGER: 'shine_trigger',
  HEAL_CAST: 'heal_cast',
  SHIELD_CAST: 'shield_cast',
  WAVE_START: 'wave_start',
  NIGHT_BEGINS: 'night_begins',
  ENEMY_DEATH: 'enemy_death',
};

// Entity sizes (radius or half-size)
export const SIZES = {
  PLAYER: 16,
  SOLO: 22,
  ADC: 14,
  MID: 16,
  JUNGLER: 13,
  GRUNT: 14,
  HARASSER: 10,
  ASSASSIN: 12,
};

// Gameplay tuning
export const BALANCE = {
  PLAYER_SPEED: 240,
  PLAYER_MAX_HP: 100,
  TEAMMATE_MAX_HP: 200,
  HEAL_AMOUNT: 50,
  HEAL_COOLDOWN_MS: 4000,
  SHIELD_AMOUNT: 60,
  SHIELD_COOLDOWN_MS: 6000,
  DASH_COOLDOWN_MS: 5000,
  INTERCEPT_COOLDOWN_MS: 8000,
  SHINE_DAMAGE_MULT: 1.6,
  XP_PER_HEAL: 10,
  XP_PER_SHIELD: 8,
  XP_PER_INTERCEPT: 15,
  XP_PER_LEVEL: 100,
  MAX_BLESSINGS: 6,
  BLESSING_CHOICES: 3,
  GRUNT_HP: 80,
  HARASSER_HP: 60,
  ASSASSIN_HP: 50,
  GRUNT_DMG: 12,
  HARASSER_DMG: 10,
  ASSASSIN_DMG: 18,
  GRUNT_SPEED: 90,
  HARASSER_SPEED: 110,
  ASSASSIN_SPEED: 200,
  CRITICAL_HP_THRESHOLD: 0.25,
  MAX_ENEMIES: 20,
};

// Ground line Y — characters stand here (side-scrolling brawler perspective)
export const GROUND_Y = 520;

// Formation: Solo centered, team ranked left behind him, enemies from right
export const FORMATION = {
  GROUND_Y,
  SOLO_X: 0.50,        // Solo anchored at visual center
  SOLO_Y: GROUND_Y,
  PLAYER_X: 0.385,     // Support directly behind Solo
  PLAYER_Y: GROUND_Y,
  ADC_X: 0.29,         // Ranger further back
  ADC_Y: GROUND_Y - 8,
  MID_X: 0.21,         // Flame mage deepest back
  MID_Y: GROUND_Y + 4,
};

// Asset keys (swap these to real sprite keys in Phase 2)
export const ASSETS = {
  // Fonts
  FONT_MONO: 'monospace',
  FONT_DISPLAY: 'monospace',
};

// Events
export const EVENTS = {
  TEAMMATE_DAMAGED: 'teammate_damaged',
  TEAMMATE_HEALED: 'teammate_healed',
  TEAMMATE_SHIELDED: 'teammate_shielded',
  TEAMMATE_DIED: 'teammate_died',
  TEAMMATE_SHINE_START: 'teammate_shine_start',
  TEAMMATE_SHINE_END: 'teammate_shine_end',
  PLAYER_CAST: 'player_cast',
  PLAYER_DAMAGED: 'player_damaged',
  ENEMY_DIED: 'enemy_died',
  WAVE_START: 'wave_start',
  WAVE_CLEAR: 'wave_clear',
  LEVEL_UP: 'level_up',
  BLESSING_CHOSEN: 'blessing_chosen',
  DAY_COMPLETE: 'day_complete',
  NIGHT_BEGINS: 'night_begins',
  GAME_OVER: 'game_over',
  XP_GAINED: 'xp_gained',
};
