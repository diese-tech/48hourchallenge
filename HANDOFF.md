# HANDOFF — I Died and Woke Up a Support Main
**For:** Codex phased implementation  
**Repo:** https://github.com/diese-tech/48hourchallenge  
**Stack:** Vite 8 + Phaser 3.90.0 + TypeScript (strict, verbatimModuleSyntax)  
**Run:** `npm install && npm run dev` → localhost:5173

---

## What Was Built

A browser game jam entry: side-scrolling support survival MOBA. Player controls "The Last Support" — a floating celestial entity that heals/shields 4 AI teammates fighting autonomously. Core loop: survive 6-minute day phase → night transition → endless collapse.

**Working systems:**
- Full game loop: MainMenu → Game → (LevelUp overlay) → GameOver
- 4 AI teammates (Arthur/Lyria/Vorax/Nyx) with state machines: PATROL → ENGAGE → SHINING → CRITICAL → DEAD
- 3 enemy types: Grunt (melee), Harasser (ranged kiter), Assassin (locks onto Shine State target)
- Wave system: 8 scripted day waves + endless night escalation
- Shine State system: every 35–50s, one teammate glows, gets buffed, shows quip card overlay
- Player abilities: Heal (1), Shield (2), Dash (3), Intercept (4) — all on cooldown timers
- XP system → Level Up → 3 blessing choices (9 blessings total)
- Night transition at 6:00 with narrative text + dark tint
- UI overlay scene: portrait cards (Arthur/Lyria/Vorax/Nyx), countdown timer, wave counter, XP bar, ability slots with cooldown ghost + countdown
- All characters: side-profile geometric art, standing on GROUND_Y=520, facing right (team) or left (enemies)

**Not yet built:**
- Floating HP bars above characters in-world
- Floating damage numbers on hit
- Background depth / midground layer
- Projectile visuals for ranged attacks
- Sound / audio (placeholder system ready)
- Real sprites (user supplies Phase 2 assets)

---

## Architecture — Critical Patterns

**Read this before touching any entity file.**

### 1. Physics on Containers
Phaser 3 physics doesn't type-check cleanly on Containers. Every entity uses:
```typescript
declare body: Phaser.Physics.Arcade.Body;  // NOT body!: or body:
(scene.physics.add.existing as (go: Phaser.GameObjects.Container) => void)(this);
```

### 2. State transitions
Phaser `Container` has a `setState()` method. All entity state changes use `transitionTo()` instead:
```typescript
transitionTo(s: TeammateState)  // defined in Teammate.ts — never rename to setState
```

### 3. Import types
`verbatimModuleSyntax` is on. Interface/type-only imports must use `import type`:
```typescript
import type { TeammateConfig } from '../Teammate';
import type { EnemyConfig } from '../Enemy';
```

### 4. EventBus
All cross-entity communication goes through `src/events.ts`:
```typescript
import EventBus from '../events';
EventBus.emit(EVENTS.TEAMMATE_DAMAGED, { teammate, hp, maxHp });
EventBus.on(EVENTS.LEVEL_UP, () => { ... });
```
Event keys are in `EVENTS` object in `src/constants.ts`. Add new events there first.

### 5. Ground line
`GROUND_Y = 520` in constants. All characters have their container at y=GROUND_Y. Character shapes draw UPWARD from y=0 (local space). Enemies spawn at x=GAME_WIDTH+30, y≈GROUND_Y.

### 6. Scene layering
- `Game` — world entities, physics
- `UI` — always-active HUD overlay (portrait cards, timer, ability bar)
- `LevelUp` — launched on top of paused Game scene
- Never put HUD elements in Game scene

### 7. Art pipeline
Each entity has isolated `createVisual()` and `drawShape()` methods. Phase 2 sprite swap = change only those methods. Never mix visual and logic code.

---

## File Map

```
src/
  constants.ts          — all colors, sizes, timing, balance, events, formation
  events.ts             — EventBus singleton
  main.ts               — Phaser game config
  entities/
    Teammate.ts         — base class: state machine, combat, shine FX
    Player.ts           — WASD movement, 4 abilities, cooldowns
    Enemy.ts            — base enemy class, death scatter
    archetypes/
      Solo.ts           — Arthur: knight, sword, gold/steel
      ADC.ts            — Lyria: elf ranger, crossbow, purple/silver
      Mid.ts            — Vorax: flame humanoid, lava, red/orange
      Jungler.ts        — Nyx: rogue, daggers, green/shadow (roaming)
    enemies/
      Grunt.ts          — melee, targets nearest
      Harasser.ts       — ranged, targets lowest HP, kites
      Assassin.ts       — fast, locks onto Shine State target
  systems/
    WaveSystem.ts       — spawn queue, wave state machine
    ShineSystem.ts      — Shine State timer, quip card overlay
    XPSystem.ts         — XP tracking, level-up emission
  scenes/
    Game.ts             — main game loop, ability resolution, blessing application
    UI.ts               — HUD overlay scene
    LevelUp.ts          — blessing choice cards
    GameOver.ts         — end screen
    MainMenu.ts         — title screen
    Boot.ts             — asset preload
  data/
    waves.ts            — DAY_WAVES array + getNightWave()
    upgrades.ts         — ALL_BLESSINGS array with apply(gameState) functions
```

---

## Characters

| Key | Name | Color constant | Role |
|-----|------|---------------|------|
| `arthur` | Sovereign Arthur | `COLORS.SOLO` (gold) | Frontline tank, center anchor |
| `lyria` | Shadowstride Lyria | `COLORS.ADC` (purple) | Ranged hypercarry |
| `vorax` | Emberlord Vorax | `COLORS.MID` (lava red) | Artillery mage |
| `nyx` | Voidstalker Nyx | `COLORS.JUNGLER` (green) | Roaming assassin |
| Player | The Last Support | `COLORS.SUPPORT_CORE` (near-white) | Support — player controlled |

**Formation (x as fraction of GAME_WIDTH=1280, all at y=GROUND_Y=520):**
- Arthur: 0.50 (screen center anchor)
- Player: 0.385
- Lyria: 0.29
- Vorax: 0.21
- Nyx: roams near left edge (-60 to x=448)

---

## Phased Next Steps

### PHASE A — Combat Readability (Highest priority)
**Floating HP bars above every character.**

Add to `Teammate.ts` base class — a thin bar drawn above each character that updates on `EVENTS.TEAMMATE_DAMAGED` and `EVENTS.TEAMMATE_HEALED`:
- Bar width: `config.size * 3`, height: 4px
- Position: centered above the character, y offset = `-(config.size * 4.5)`
- Colors: use existing `COLORS.HEALTH_HIGH / HEALTH_MID / HEALTH_LOW`
- Track as a `Phaser.GameObjects.Graphics` child of the container
- Update it in `takeDamage()` and `receiveHeal()`

Do the same for `Enemy.ts` — thinner bar (3px), always red → black.

**Floating damage numbers.**

On every `takeDamage(amount)` call in both Teammate and Enemy:
- Create a `scene.add.text()` at `(this.x, this.y - config.size * 3)` showing the damage value
- Tween: y -= 40, alpha 0 → 0, duration 800ms, then destroy
- Color: `#ff4444` for damage on teammates, `#ffffff` for damage on enemies
- Font: monospace, 13px, bold

---

### PHASE B — Background Depth Layer
**Midground structural elements for visual depth.**

In `Game.ts → createBackground()`, after the grid, add a midground layer (depth=1):
- 3–5 dark geometric structures (tall rectangles, ~20–40px wide, 80–200px tall) at varying x positions across GAME_WIDTH
- Color: slightly lighter than background (`0x0d0d22`), subtle `COLORS.UI_BORDER` edge glow
- These are static decorations — no physics, no gameplay effect
- Keep them at depth=1, below characters (depth=4–10)
- Optional: a distant "base structure" on the far left (team side) and a looming silhouette on the right (enemy side)

---

### PHASE C — Projectile Visuals
**Lyria and Vorax need visible attacks.**

Currently attacks are instant (no projectile). Add optional projectile to `doAttack()` in Teammate.ts or as an override in ADC/Mid.

For Lyria (ADC):
- On attack: spawn a small purple bolt (`COLORS.ADC_BOLT`, 3×3 circle) at `(this.x, this.y - size*1.5)`
- Tween it to target position over 150ms, then destroy
- No physics needed — pure visual

For Vorax (Mid):
- On attack: spawn an ember orb (`COLORS.MID_EMBER`, 5px radius) with ADD blend mode
- Tween to target over 300ms with slight arc (tween y up then down using timeline)
- On arrive: small particle burst (use existing `scene.add.particles` pattern)

---

### PHASE D — Juice Pass
Apply in this order — each is independent:

1. **Screen shake on wave start** — in `WaveSystem.ts`, emit event on wave start; in `Game.ts`, call `this.cameras.main.shake(200, 0.005 * waveNumber)` (scales with wave)

2. **Enemy death scatter** — already in `Enemy.ts` base class but verify it fires. Each of the 5 fragment tweens should fly out in random directions, alpha fade to 0 over 300ms.

3. **Heal beam visual** — when `resolveAbility('heal')` fires in `Game.ts`, draw a thin line from `player.x/y` to `target.x/y` using `scene.add.graphics()`, tween alpha 1→0 over 200ms.

4. **Shield ring pulse** — already in `Teammate.receiveShield()` — verify it works and increase ring size (use `config.size + 8` not `config.size + 4`).

5. **Wave announcement text** — in `Game.ts` or `UI.ts`, when `EVENTS.WAVE_START` fires, slam text "WAVE X" down from y=-50 to y=center, hold 600ms, fade up. Depth=45.

6. **Shine State camera nudge** — in `Game.ts` when `EVENTS.TEAMMATE_SHINE_START` fires: `this.cameras.main.shake(80, 0.004)`.

---

### PHASE E — Night Phase Polish
**Make the night transition and night gameplay feel distinct.**

1. In `triggerDayComplete()` (Game.ts), after the text fades, apply `this.cameras.main.setBackgroundColor('#04040c')` and add a persistent vignette overlay (dark radial gradient on the edges).

2. Enemy speed in night waves: `getNightWave()` in `data/waves.ts` already increases spawn rate. Also increase `GRUNT_SPEED` and `ASSASSIN_SPEED` by 15% per night wave iteration (pass a multiplier through the wave def).

3. Night-mode enemy tint: after `EVENTS.NIGHT_BEGINS`, apply `enemy.setTint(0xaabbdd)` (cool blue tint) to all subsequently spawned enemies to visually distinguish them from day enemies.

---

### PHASE F — Audio Scaffolding
**Wire placeholder audio system — user will supply real assets.**

In `Boot.ts`, preload silence/stub audio for these keys:
- `'shine_trigger'` — plays when Shine State activates
- `'heal_cast'` — plays on heal ability
- `'shield_cast'` — plays on shield ability
- `'wave_start'` — plays on each wave start
- `'night_begins'` — ambient shift audio
- `'enemy_death'` — light SFX

In each relevant event handler, call `this.sound.play(key, { volume: 0.6 })` guarded by a try/catch so missing audio never crashes. When user supplies real `.ogg`/`.mp3` files, drop into `public/audio/` and update preload keys.

---

### PHASE G — Balance & Tuning Pass
**After all above phases are in, do one tuning pass:**

All tuning values live in `BALANCE` object in `src/constants.ts`. Key levers:

- `PLAYER_SPEED: 240` — feel of player movement
- `HEAL_COOLDOWN_MS: 4000` — how often player can heal
- `HEAL_AMOUNT: 60` — how much a heal restores (TEAMMATE_MAX_HP=200)
- `CRITICAL_HP_THRESHOLD: 0.25` — when teammates flee to player
- `ASSASSIN_SPEED: 200` — Assassins should feel terrifying
- `SHINE_INTERVAL_MIN_MS: 35000` — how frequently Shine State triggers
- `MAX_ENEMIES: 20` — entity budget cap

Check `data/waves.ts` for wave difficulty curve — Wave 5 should feel noticeably harder than Wave 1, Wave 8 should feel barely survivable.

---

## Do Not Change Without Reading First

- **`Teammate.transitionTo()`** — never rename to `setState`, Phaser Container conflict
- **`declare body:`** — never change to `body!:` or `body:`, breaks TS
- **`(scene.physics.add.existing as ...)(this)`** — required cast, don't simplify
- **Phaser version** — locked to `^3.90.0`. Do NOT upgrade to v4 (different API)
- **`import type`** — required for all interface/type imports (verbatimModuleSyntax)
- **`src/events.ts`** — EventBus is a singleton. Never re-instantiate it.
- **Scene keys** — `'Game'`, `'UI'`, `'LevelUp'`, `'GameOver'`, `'MainMenu'`, `'Boot'` — referenced by string in scene transitions

---

## Art Pipeline Note

All entity visuals are in isolated `createVisual()` / `drawShape()` methods. When the user supplies real sprite assets:
1. Add asset keys to `ASSETS` in `src/constants.ts`
2. Preload in `Boot.ts`
3. Replace `drawShape()` body in each entity — swap `scene.add.graphics()` for `scene.add.sprite(key)`
4. Zero structural changes required

Asset keys to reserve: `'arthur'`, `'lyria'`, `'vorax'`, `'nyx'`, `'support'`, `'grunt'`, `'harasser'`, `'assassin'`
