import Phaser from 'phaser';
import { AUDIO, COLORS, EVENTS, TIMING, BALANCE, GAME_WIDTH, GAME_HEIGHT, GROUND_Y, FORMATION } from '../constants';
import EventBus from '../events';
import Player from '../entities/Player';
import Teammate from '../entities/Teammate';
import Solo from '../entities/archetypes/Solo';
import ADC from '../entities/archetypes/ADC';
import Mid from '../entities/archetypes/Mid';
import Jungler from '../entities/archetypes/Jungler';
import WaveSystem from '../systems/WaveSystem';
import ShineSystem from '../systems/ShineSystem';
import XPSystem from '../systems/XPSystem';
import { ALL_BLESSINGS, drawBlessingChoices } from '../data/upgrades';
import type { Blessing } from '../data/upgrades';

interface GameState {
  healAmount: number;
  healCooldown: number;
  shieldAmount: number;
  shieldCooldown: number;
  dashCooldown: number;
  interceptCooldown: number;
  xpMultiplier: number;
  dashImmune: boolean;
  triageRush: boolean;
  shineSync: boolean;
  martyrsGrace: boolean;
  lastLight: boolean;
}

export default class Game extends Phaser.Scene {
  player!: Player;
  teammates: Teammate[] = [];
  waveSystem!: WaveSystem;
  shineSystem!: ShineSystem;
  xpSystem!: XPSystem;

  private background!: Phaser.GameObjects.Graphics;
  private dayTimer: number = TIMING.DAY_DURATION_MS;
  private isNight: boolean = false;
  private isOver: boolean = false;
  private isPaused: boolean = false;
  private victoryAchieved: boolean = false;
  private nightVignette?: Phaser.GameObjects.Graphics;
  private blessingPool: Blessing[] = [...ALL_BLESSINGS];
  private chosenBlessings: string[] = [];

  gameState: GameState = {
    healAmount: BALANCE.HEAL_AMOUNT,
    healCooldown: BALANCE.HEAL_COOLDOWN_MS,
    shieldAmount: BALANCE.SHIELD_AMOUNT,
    shieldCooldown: BALANCE.SHIELD_COOLDOWN_MS,
    dashCooldown: BALANCE.DASH_COOLDOWN_MS,
    interceptCooldown: BALANCE.INTERCEPT_COOLDOWN_MS,
    xpMultiplier: 1,
    dashImmune: false,
    triageRush: false,
    shineSync: false,
    martyrsGrace: false,
    lastLight: false,
  };

  constructor() {
    super({ key: 'Game' });
  }

  create() {
    this.isOver = false;
    this.isPaused = false;
    this.isNight = false;
    this.victoryAchieved = false;
    this.dayTimer = TIMING.DAY_DURATION_MS;

    this.createBackground();
    this.createTeammates();
    this.createPlayer();

    this.waveSystem = new WaveSystem(this);
    this.shineSystem = new ShineSystem(this, this.teammates);
    this.xpSystem = new XPSystem();

    this.bindEvents();
    this.setupPause();
    this.waveSystem.start();

    // Emit initial state to UI
    this.time.delayedCall(100, () => {
      EventBus.emit('game_ready', {
        teammates: this.teammates,
        dayDuration: TIMING.DAY_DURATION_MS,
      });
    });
  }

  private createBackground() {
    this.background = this.add.graphics();
    this.drawBackground(false);

    // Subtle vertical grid lines (sky only)
    const grid = this.add.graphics();
    grid.lineStyle(1, COLORS.UI_BORDER, 0.05);
    for (let x = 0; x < GAME_WIDTH; x += 80) grid.lineBetween(x, 0, x, GROUND_Y);
    grid.setDepth(0);
    this.background.setDepth(0);

    const midground = this.add.graphics();
    midground.setDepth(1);

    // Team-side distant base structures
    midground.fillStyle(0x080816, 0.7);
    midground.fillRect(0, GROUND_Y - 300, 80, 300);
    midground.fillTriangle(0, GROUND_Y, 0, GROUND_Y - 220, 80, GROUND_Y);

    // Structural columns/pillars
    const pillarXs = [120, 310, 580, 890, 1140];
    const pillarWidths = [18, 28, 14, 24, 20];
    const pillarHeights = [140, 220, 90, 180, 120];

    midground.fillStyle(0x0d0d22, 1);
    midground.lineStyle(1, COLORS.UI_BORDER, 0.18);
    for (let i = 0; i < pillarXs.length; i++) {
      const width = pillarWidths[i];
      const height = pillarHeights[i];
      const x = pillarXs[i] - width / 2;
      const y = GROUND_Y - height;
      midground.fillRect(x, y, width, height);
      midground.strokeRect(x, y, width, height);
    }

    // Enemy-side looming fortress silhouette
    midground.fillStyle(0x0a0814, 1);
    midground.beginPath();
    midground.moveTo(1200, GROUND_Y);
    midground.lineTo(1260, GROUND_Y - 280);
    midground.lineTo(1280, GROUND_Y - 180);
    midground.lineTo(1280, GROUND_Y);
    midground.closePath();
    midground.fillPath();
  }

  private drawBackground(night: boolean) {
    const bg = this.background;
    bg.clear();

    // Sky
    const skyColor = night ? COLORS.BACKGROUND_NIGHT : COLORS.BACKGROUND;
    bg.fillStyle(skyColor, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GROUND_Y);

    // Floor (darker slab below ground line)
    const floorColor = night ? 0x020208 : 0x06060f;
    bg.fillStyle(floorColor, 1);
    bg.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    // Ground line
    bg.lineStyle(2, night ? 0x223344 : COLORS.UI_BORDER, 0.5);
    bg.lineBetween(0, GROUND_Y, GAME_WIDTH, GROUND_Y);

    // Perspective grid on floor
    bg.lineStyle(1, night ? 0x112233 : COLORS.UI_BORDER, 0.12);
    const vp = { x: GAME_WIDTH / 2, y: GROUND_Y };
    for (let x = 0; x <= GAME_WIDTH; x += 160) {
      bg.lineBetween(x, GROUND_Y, vp.x + (x - vp.x) * 3, GAME_HEIGHT + 40);
    }
    for (let i = 1; i <= 3; i++) {
      const fy = GROUND_Y + (GAME_HEIGHT - GROUND_Y) * (i / 4);
      bg.lineBetween(0, fy, GAME_WIDTH, fy);
    }
  }

  private createTeammates() {
    this.teammates = [
      new Solo(this),
      new ADC(this),
      new Mid(this),
      new Jungler(this),
    ];
  }

  private createPlayer() {
    this.player = new Player(this, GAME_WIDTH * FORMATION.PLAYER_X, FORMATION.PLAYER_Y);
    this.player.teammates = this.teammates;
  }

  private bindEvents() {
    // Player ability casts resolve here
    EventBus.on(EVENTS.PLAYER_CAST, ({ ability }: { ability: string; x: number; y: number }) => {
      if (this.isOver) return;
      this.resolveAbility(ability);
    });

    EventBus.on(EVENTS.WAVE_START, ({ wave }: { wave: number }) => {
      this.cameras.main.shake(200, Math.min(0.035, 0.005 * wave));
      this.showWaveAnnouncement(wave);
      this.playSound(AUDIO.WAVE_START, 0.5);
    });

    EventBus.on(EVENTS.TEAMMATE_SHINE_START, () => {
      this.cameras.main.shake(80, 0.004);
      this.playSound(AUDIO.SHINE_TRIGGER, 0.55);
    });

    // Enemy attacked teammate
    EventBus.on('enemy_attacked', ({ target, damage }: { target: any; damage: number; attacker: any }) => {
      if (target.takeDamage) target.takeDamage(damage);

      // Martyr's grace: player taking damage near teammate triggers shield
      if (this.gameState.martyrsGrace && Phaser.Math.Distance.Between(
        this.player.x, this.player.y, target.x, target.y
      ) < 150) {
        // Store a pending shield charge (simplified: just do it)
      }
    });

    // Level up → show blessing choices
    EventBus.on(EVENTS.LEVEL_UP, () => {
      if (this.isOver) return;
      if (!this.xpSystem.canChooseBlessing()) return;

      this.isPaused = true;
      this.player.enterUpgradeMenu();

      const choices = drawBlessingChoices(
        this.blessingPool.filter(b => !this.chosenBlessings.includes(b.id)),
        BALANCE.BLESSING_CHOICES
      );

      this.scene.pause('Game');
      this.scene.launch('LevelUp', {
        choices,
        level: this.xpSystem.level,
        onChoose: (blessing: Blessing) => this.applyBlessing(blessing),
      });
    });

    // Teammate died
    EventBus.on(EVENTS.TEAMMATE_DIED, () => {
      // Screen shake
      this.cameras.main.shake(300, 0.012);

      // Check for Last Light
      const dead = this.teammates.filter(t => t.state === 'DEAD');
      if (this.gameState.lastLight && dead.length === 1) {
        const revive = dead[0];
        revive.receiveHeal(revive.maxHp * 0.5);
        revive.transitionTo('PATROL');
        revive.setActive(true).setVisible(true);
        this.gameState.lastLight = false; // one-use

        const text = this.add.text(revive.x, revive.y - 40, 'LAST LIGHT', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffd700',
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: text, y: revive.y - 100, alpha: 0, duration: 1500, onComplete: () => text.destroy() });
      }

      // Check game over
      const allDead = this.teammates.every(t => t.state === 'DEAD');
      if (allDead) this.triggerGameOver();
    });

    // Player died
    EventBus.on(EVENTS.PLAYER_DIED, () => {
      this.triggerGameOver();
    });

    // Triage Rush: auto-heal any teammate at ≤20% HP
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (!this.gameState.triageRush || this.isOver) return;
        for (const t of this.teammates) {
          if (t.state !== 'DEAD' && t.hp / t.maxHp <= 0.2) {
            t.receiveHeal(this.gameState.healAmount * 0.6);
            break; // one per tick
          }
        }
      },
    });
  }

  private resolveAbility(ability: string) {
    switch (ability) {
      case 'heal': {
        const target = this.findLowestHpTeammate();
        if (target) {
          this.playSound(AUDIO.HEAL_CAST, 0.55);
          this.drawHealBeam(target);
          target.receiveHeal(this.gameState.healAmount);
          this.xpSystem.addSupportXP('heal');
          this.tryShineSync(target);
          this.cameras.main.shake(60, 0.003);
        }
        break;
      }
      case 'shield': {
        const target = this.findLowestHpTeammate();
        if (target) {
          this.playSound(AUDIO.SHIELD_CAST, 0.55);
          target.receiveShield(this.gameState.shieldAmount);
          this.drawShieldBeam(target);
          this.xpSystem.addSupportXP('shield');
          this.tryShineSync(target);
        }
        break;
      }
      case 'dash':
        // Handled in Player directly
        break;
      case 'intercept': {
        // Protective Pulse: damage nearby enemies, shield nearby allies
        this.xpSystem.addSupportXP('intercept');
        this.cameras.main.shake(100, 0.006);

        // Damage enemies within 200px
        const enemies = this.waveSystem.getEnemies();
        for (const enemy of enemies) {
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          if (dist <= 200) {
            enemy.takeDamage(25);
          }
        }

        // Shield allies within 250px
        for (const tm of this.teammates) {
          if (tm.state === 'DEAD') continue;
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tm.x, tm.y);
          if (dist <= 250) {
            tm.receiveShield(30);
          }
        }

        // Emit pulse visual (larger)
        const ring = this.add.graphics();
        ring.lineStyle(3, COLORS.WHITE, 1);
        ring.strokeCircle(this.player.x, this.player.y, 20);
        ring.setDepth(15);
        this.tweens.add({
          targets: ring,
          scaleX: 8,
          scaleY: 8,
          alpha: 0,
          duration: 400,
          ease: 'Cubic.easeOut',
          onComplete: () => ring.destroy(),
        });

        // Floating PULSE! text
        const pulseText = this.add.text(this.player.x, this.player.y - 40, 'PULSE!', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffd700',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
          targets: pulseText,
          y: pulseText.y - 60,
          alpha: 0,
          duration: 1000,
          ease: 'Cubic.easeOut',
          onComplete: () => pulseText.destroy(),
        });
        break;
      }
    }
  }

  private tryShineSync(target: Teammate) {
    if (!this.gameState.shineSync) return;
    const shine = this.shineSystem.getCurrentShine();
    if (shine && shine === target) {
      // Reset a random cooldown
      const keys = Object.keys(this.player.cooldowns);
      const key = keys[Math.floor(Math.random() * keys.length)];
      this.player.cooldowns[key] = 0;

      const text = this.add.text(this.player.x, this.player.y - 30, 'SYNC!', {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffd700',
      }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: text, y: this.player.y - 80, alpha: 0, duration: 800, onComplete: () => text.destroy() });
    }
  }

  private findLowestHpTeammate(): Teammate | null {
    return this.teammates
      .filter(t => t.state !== 'DEAD')
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] ?? null;
  }

  private applyBlessing(blessing: Blessing) {
    blessing.apply(this.gameState);
    this.chosenBlessings.push(blessing.id);
    this.xpSystem.recordBlessingChosen();

    // Sync cooldowns to player
    this.player.cooldowns.heal = Math.min(this.player.cooldowns.heal, this.gameState.healCooldown);
    this.player.cooldowns.shield = Math.min(this.player.cooldowns.shield, this.gameState.shieldCooldown);

    this.scene.resume('Game');
    this.isPaused = false;
    this.player.exitUpgradeMenu();

    EventBus.emit(EVENTS.BLESSING_CHOSEN, { blessing, chosenBlessings: this.chosenBlessings });
  }

  private setupPause() {
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.isOver) return;
      if (this.isPaused) {
        this.scene.resume('Game');
        this.isPaused = false;
        EventBus.emit('pause_closed');
      } else {
        this.scene.pause('Game');
        this.isPaused = true;
        EventBus.emit('pause_opened', { blessings: this.chosenBlessings });
      }
    });
    this.input.keyboard!.addKey('P').on('down', () => {
      this.input.keyboard!.emit('keydown-ESC');
    });
  }

  private triggerVictory() {
    if (this.isNight) return;
    this.victoryAchieved = true;
    this.isPaused = true;

    // Gold flash
    this.cameras.main.flash(400, 255, 215, 0);

    // Victory overlay
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setDepth(40);
    overlay.setAlpha(0);

    this.tweens.add({ targets: overlay, alpha: 1, duration: 1200 });

    const line1 = this.add.text(cx, cy - 30, 'VICTORY!', {
      fontFamily: 'monospace', fontSize: '42px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(41).setAlpha(0);

    const line2 = this.add.text(cx, cy + 20, 'ENDLESS MODE UNLOCKED', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffee88', fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(41).setAlpha(0);

    this.tweens.add({ targets: line1, alpha: 1, delay: 600, duration: 600 });
    this.tweens.add({ targets: line2, alpha: 1, delay: 1200, duration: 600 });

    this.time.delayedCall(3000, () => {
      this.tweens.add({ targets: [overlay, line1, line2], alpha: 0, duration: 800, onComplete: () => {
        overlay.destroy();
        line1.destroy();
        line2.destroy();

        this.isPaused = false;
        this.isNight = true;
        this.cameras.main.setBackgroundColor('#04040c');
        this.createNightVignette();
        this.drawBackground(true);
        this.playSound(AUDIO.NIGHT_BEGINS, 0.6);
        EventBus.emit(EVENTS.VICTORY);
        EventBus.emit(EVENTS.NIGHT_BEGINS);
        this.waveSystem.start();
      }});
    });
  }

  private triggerGameOver() {
    if (this.isOver) return;
    this.isOver = true;

    this.cameras.main.shake(600, 0.02);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOver', {
        wave: this.waveSystem.getWaveNumber(),
        level: this.xpSystem.level,
        isNight: this.isNight,
        blessings: this.chosenBlessings,
        victory: this.victoryAchieved,
      });
      this.scene.stop('UI');
    });
  }

  update(_time: number, delta: number) {
    if (this.isOver || this.isPaused) return;

    // Day timer
    if (!this.isNight) {
      this.dayTimer -= delta;
      EventBus.emit('day_timer', { remaining: Math.max(0, this.dayTimer), total: TIMING.DAY_DURATION_MS });
      if (this.dayTimer <= 0) {
        this.triggerVictory();
      }
    }

    // Update player
    this.player.update(delta);

    // Update teammates
    const liveEnemies = this.waveSystem.getEnemies();
    for (const t of this.teammates) {
      if (t.active) {
        t.update(delta, liveEnemies, this.player.x, this.player.y);
      }
    }

    // Update enemies
    const liveTeammates = this.teammates.filter(t => t.active && t.state !== 'DEAD');
    const shineTarget = this.shineSystem.getCurrentShine();
    for (const e of liveEnemies) {
      e.update(delta, liveTeammates, shineTarget, this.player);
    }

    // Systems
    this.waveSystem.update(delta);
    this.shineSystem.update(delta);

    // Sync cooldowns from gameState to player (blessings may have changed them)
    this.syncPlayerCooldownCaps();
  }

  private syncPlayerCooldownCaps() {
    // Update the max cooldown durations if blessings changed them
    // (already applied at blessing time; this is a no-op normally)
  }

  private drawHealBeam(target: Teammate) {
    const beam = this.add.graphics();
    beam.lineStyle(3, COLORS.HEAL_PARTICLE, 0.95);
    beam.lineBetween(this.player.x, this.player.y - 28, target.x, target.y - target.config.size * 2);
    beam.setDepth(18);

    this.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => beam.destroy(),
    });
  }

  private drawShieldBeam(target: Teammate) {
    const beam = this.add.graphics();
    beam.lineStyle(3, COLORS.SHIELD_PARTICLE, 0.95);
    beam.lineBetween(this.player.x, this.player.y - 28, target.x, target.y - target.config.size * 2);
    beam.setDepth(18);

    this.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => beam.destroy(),
    });
  }

  private showWaveAnnouncement(wave: number) {
    const text = this.add.text(GAME_WIDTH / 2, -50, `WAVE ${wave}`, {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#e0e0ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(45).setScrollFactor(0);

    this.tweens.add({
      targets: text,
      y: GAME_HEIGHT / 2 - 80,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(600, () => {
          this.tweens.add({
            targets: text,
            y: text.y - 40,
            alpha: 0,
            duration: 260,
            ease: 'Cubic.easeIn',
            onComplete: () => text.destroy(),
          });
        });
      },
    });
  }

  private createNightVignette() {
    this.nightVignette?.destroy();

    const vignette = this.add.graphics();
    vignette.setDepth(39).setScrollFactor(0);
    vignette.fillStyle(0x000000, 0.38);
    vignette.fillRect(0, 0, GAME_WIDTH, 90);
    vignette.fillRect(0, GAME_HEIGHT - 120, GAME_WIDTH, 120);
    vignette.fillRect(0, 0, 90, GAME_HEIGHT);
    vignette.fillRect(GAME_WIDTH - 110, 0, 110, GAME_HEIGHT);
    vignette.fillStyle(0x000000, 0.18);
    vignette.fillRect(90, 0, 120, GAME_HEIGHT);
    vignette.fillRect(GAME_WIDTH - 230, 0, 120, GAME_HEIGHT);
    this.nightVignette = vignette;
  }

  private playSound(key: string, volume: number) {
    try {
      this.sound.play(key, { volume });
    } catch {
      // Placeholder audio must never block gameplay.
    }
  }

  shutdown() {
    EventBus.removeAllListeners();
    this.waveSystem?.destroy();
    this.shineSystem?.destroy();
    this.xpSystem?.destroy();
  }
}
