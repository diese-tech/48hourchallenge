import Phaser from 'phaser';
import { COLORS, SIZES, BALANCE, EVENTS } from '../constants';
import EventBus from '../events';

export type PlayerState = 'FREE' | 'CASTING' | 'UPGRADE_MENU';

export default class Player extends Phaser.GameObjects.Container {
  scene: Phaser.Scene;
  declare body: Phaser.Physics.Arcade.Body;

  state: PlayerState = 'FREE';
  hp: number = BALANCE.PLAYER_MAX_HP;
  maxHp: number = BALANCE.PLAYER_MAX_HP;

  // Cooldowns (ms remaining)
  cooldowns: Record<string, number> = {
    heal: 0,
    shield: 0,
    dash: 0,
    intercept: 0,
  };

  private graphic!: Phaser.GameObjects.Graphics;
  private glowGraphic!: Phaser.GameObjects.Graphics;
  private keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    ability1: Phaser.Input.Keyboard.Key;
    ability2: Phaser.Input.Keyboard.Key;
    ability3: Phaser.Input.Keyboard.Key;
    ability4: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.scene = scene;

    this.createVisual();
    scene.add.existing(this);
    (scene.physics.add.existing as (go: Phaser.GameObjects.Container) => void)(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(SIZES.PLAYER, -SIZES.PLAYER, -SIZES.PLAYER);
    body.setCollideWorldBounds(true);

    this.setupKeys();
    this.setDepth(10);
  }

  createVisual() {
    this.glowGraphic = this.scene.add.graphics();
    this.add(this.glowGraphic);

    this.graphic = this.scene.add.graphics();
    this.add(this.graphic);

    this.drawShape();

    // Gentle float above ground
    this.scene.tweens.add({
      targets: this.graphic,
      y: '-=5',
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Orbiting support constructs on a rotating child container
    const s = SIZES.PLAYER;
    const orbitRing = this.scene.add.container(0, -s * 2.8);
    this.add(orbitRing);

    const orbitR = s * 1.9;
    for (let i = 0; i < 3; i++) {
      const orb = this.scene.add.graphics();
      orb.fillStyle(COLORS.SUPPORT_HALO, 0.9);
      orb.fillCircle(0, 0, s * 0.19);
      orb.lineStyle(1, COLORS.SUPPORT_CORE, 0.5);
      orb.strokeCircle(0, 0, s * 0.28);
      const a = (i / 3) * Math.PI * 2;
      orb.setPosition(Math.cos(a) * orbitR, Math.sin(a) * orbitR * 0.5);
      orbitRing.add(orb);
    }

    this.scene.tweens.add({
      targets: orbitRing,
      angle: 360,
      duration: 5500,
      repeat: -1,
      ease: 'Linear',
    });
  }

  drawShape() {
    const g = this.graphic;
    g.clear();
    const s = SIZES.PLAYER;

    // Flowing ribbon left (translucent)
    g.fillStyle(COLORS.SUPPORT_HALO, 0.28);
    g.beginPath();
    g.moveTo(-s * 0.35, -s * 2.8);
    g.lineTo(-s * 1.7, -s * 1.4);
    g.lineTo(-s * 0.6, -s * 0.4);
    g.lineTo(-s * 0.25, -s * 2.0);
    g.closePath();
    g.fillPath();

    // Flowing ribbon right
    g.fillStyle(COLORS.SUPPORT_HALO, 0.22);
    g.beginPath();
    g.moveTo(s * 0.35, -s * 2.8);
    g.lineTo(s * 1.5, -s * 1.6);
    g.lineTo(s * 0.5, -s * 0.6);
    g.lineTo(s * 0.25, -s * 2.2);
    g.closePath();
    g.fillPath();

    // Lower trailing cape (floats above ground, not touching)
    g.fillStyle(COLORS.SUPPORT_CORE, 0.12);
    g.beginPath();
    g.moveTo(-s * 0.5, -s * 1.4);
    g.lineTo(-s * 0.7, -s * 0.3);
    g.lineTo(s * 0.7, -s * 0.3);
    g.lineTo(s * 0.5, -s * 1.4);
    g.closePath();
    g.fillPath();

    // Core body (slender, near-white)
    g.fillStyle(COLORS.SUPPORT_CORE, 0.95);
    g.fillRect(-s * 0.27, -s * 2.95, s * 0.54, s * 2.1);

    // Fractured armor bands
    g.fillStyle(COLORS.SUPPORT_VIOLET, 0.38);
    g.fillRect(-s * 0.27, -s * 2.45, s * 0.54, s * 0.24);
    g.fillRect(-s * 0.27, -s * 1.85, s * 0.54, s * 0.18);

    // Head / helmet (circular, faceless)
    g.fillStyle(COLORS.SUPPORT_CORE, 1);
    g.fillCircle(0, -s * 3.4, s * 0.68);

    // Visor slit (dark)
    g.fillStyle(0x020810, 0.92);
    g.fillRect(-s * 0.42, -s * 3.5, s * 0.84, s * 0.18);

    // Cyan eye glow behind visor
    g.fillStyle(COLORS.SUPPORT_HALO, 0.65);
    g.fillCircle(0, -s * 3.42, s * 0.2);

    // Halo ring
    g.lineStyle(1.5, COLORS.SUPPORT_HALO, 0.75);
    g.strokeCircle(0, -s * 3.4, s * 1.05);

    // Inner halo (violet)
    g.lineStyle(0.8, COLORS.SUPPORT_VIOLET, 0.4);
    g.strokeCircle(0, -s * 3.4, s * 0.82);

    // Support sigil — small diamond at chest
    g.fillStyle(COLORS.SUPPORT_VIOLET, 0.72);
    g.beginPath();
    g.moveTo(0, -s * 2.1 - s * 0.2);
    g.lineTo(s * 0.13, -s * 2.1);
    g.lineTo(0, -s * 2.1 + s * 0.2);
    g.lineTo(-s * 0.13, -s * 2.1);
    g.closePath();
    g.fillPath();
  }

  setupKeys() {
    const kb = this.scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      ability1: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      ability2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      ability3: kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      ability4: kb.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
    };

    Phaser.Input.Keyboard.JustDown(this.keys.ability1); // prime
    this.keys.ability1.on('down', () => this.tryHeal());
    this.keys.ability2.on('down', () => this.tryShield());
    this.keys.ability3.on('down', () => this.tryDash());
    this.keys.ability4.on('down', () => this.tryIntercept());
  }

  update(delta: number) {
    if (this.state === 'UPGRADE_MENU') {
      this.setVelocity(0, 0);
      return;
    }

    // Tick cooldowns
    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] = Math.max(0, this.cooldowns[key] - delta);
      }
    }

    this.handleMovement();
  }

  private handleMovement() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = BALANCE.PLAYER_SPEED;
    let vx = 0;
    let vy = 0;

    if (this.keys.left.isDown) vx -= 1;
    if (this.keys.right.isDown) vx += 1;
    if (this.keys.up.isDown) vy -= 1;
    if (this.keys.down.isDown) vy += 1;

    if (vx !== 0 && vy !== 0) {
      const norm = Math.SQRT2;
      vx /= norm;
      vy /= norm;
    }

    body.setVelocity(vx * speed, vy * speed);
  }

  private setVelocity(x: number, y: number) {
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(x, y);
  }

  // --- Abilities ---

  tryHeal() {
    if (this.cooldowns.heal > 0 || this.state !== 'FREE') return;
    this.cooldowns.heal = BALANCE.HEAL_COOLDOWN_MS;
    EventBus.emit(EVENTS.PLAYER_CAST, { ability: 'heal', x: this.x, y: this.y });
    this.castFeedback(COLORS.HEAL_PARTICLE);
  }

  tryShield() {
    if (this.cooldowns.shield > 0 || this.state !== 'FREE') return;
    this.cooldowns.shield = BALANCE.SHIELD_COOLDOWN_MS;
    EventBus.emit(EVENTS.PLAYER_CAST, { ability: 'shield', x: this.x, y: this.y });
    this.castFeedback(COLORS.SHIELD_PARTICLE);
  }

  tryDash() {
    if (this.cooldowns.dash > 0 || this.state !== 'FREE') return;
    this.cooldowns.dash = BALANCE.DASH_COOLDOWN_MS;
    EventBus.emit(EVENTS.PLAYER_CAST, { ability: 'dash', x: this.x, y: this.y });
    this.performDash();
  }

  tryIntercept() {
    if (this.cooldowns.intercept > 0 || this.state !== 'FREE') return;
    this.cooldowns.intercept = BALANCE.INTERCEPT_COOLDOWN_MS;
    EventBus.emit(EVENTS.PLAYER_CAST, { ability: 'intercept', x: this.x, y: this.y });
    this.castFeedback(COLORS.WHITE);
  }

  private performDash() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const len = Math.sqrt(vx * vx + vy * vy) || 1;

    const dashX = this.x + (vx / len) * 120;
    const dashY = this.y + (vy / len) * 120;

    this.scene.tweens.add({
      targets: this,
      x: dashX,
      y: dashY,
      duration: 120,
      ease: 'Cubic.easeOut',
    });

    // Brief i-frame flash
    this.scene.tweens.add({
      targets: this.graphic,
      alpha: 0.4,
      duration: 60,
      yoyo: true,
      repeat: 1,
    });
  }

  private castFeedback(color: number) {
    this.scene.tweens.add({
      targets: this.graphic,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 80,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    // Particle burst from player position
    const emitter = this.scene.add.particles(this.x, this.y, undefined, {
      speed: { min: 60, max: 140 },
      lifespan: 400,
      quantity: 8,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  takeDamage(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    EventBus.emit(EVENTS.PLAYER_DAMAGED, { hp: this.hp, maxHp: this.maxHp });

    this.scene.tweens.add({
      targets: this.graphic,
      alpha: 0.2,
      duration: 60,
      yoyo: true,
      repeat: 2,
    });
  }

  enterUpgradeMenu() {
    this.state = 'UPGRADE_MENU';
    this.setVelocity(0, 0);
  }

  exitUpgradeMenu() {
    this.state = 'FREE';
  }
}
