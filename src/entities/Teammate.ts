import Phaser from 'phaser';
import { COLORS, BALANCE, EVENTS } from '../constants';
import EventBus from '../events';

export type TeammateState = 'PATROL' | 'ENGAGE' | 'SHINING' | 'CRITICAL' | 'DEAD';
export type ArchetypeKey = 'arthur' | 'lyria' | 'vorax' | 'nyx';

export interface TeammateConfig {
  key: ArchetypeKey;
  name: string;
  color: number;
  shineColor: number;  // character-specific Shine State FX color
  size: number;
  speed: number;
  attackRange: number;
  aggroRange: number;
  damage: number;
  attackRate: number;
  zoneX: number;
  zoneY: number;
  zoneRadius: number;
}

export default class Teammate extends Phaser.GameObjects.Container {
  scene: Phaser.Scene;
  declare body: Phaser.Physics.Arcade.Body;

  config: TeammateConfig;
  state: TeammateState = 'PATROL';
  hp: number = BALANCE.TEAMMATE_MAX_HP;
  maxHp: number = BALANCE.TEAMMATE_MAX_HP;
  shineActive: boolean = false;

  protected graphic!: Phaser.GameObjects.Graphics;
  protected hpBar!: Phaser.GameObjects.Graphics;
  protected glowGraphic!: Phaser.GameObjects.Graphics;
  protected shineParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  protected attackTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: TeammateConfig) {
    super(scene, x, y);
    this.scene = scene;
    this.config = config;

    this.createVisual();
    scene.add.existing(this);
    (scene.physics.add.existing as (go: Phaser.GameObjects.Container) => void)(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const r = config.size;
    body.setCircle(r, -r, -r);
    body.setCollideWorldBounds(true);

    this.setDepth(5);
    this.updateHpBar();
  }

  createVisual() {
    this.glowGraphic = this.scene.add.graphics();
    this.add(this.glowGraphic);

    this.graphic = this.scene.add.graphics();
    this.add(this.graphic);

    this.hpBar = this.scene.add.graphics();
    this.add(this.hpBar);

    this.drawShape();

    this.scene.tweens.add({
      targets: this.graphic,
      y: '-=4',
      duration: 1000 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  drawShape() {
    const g = this.graphic;
    g.clear();
    g.fillStyle(this.config.color, 1);
    g.fillCircle(0, 0, this.config.size);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(delta: number, enemies: any[], playerX: number, playerY: number) {
    if (this.state === 'DEAD') return;
    this.hpBar.setVisible(this.x >= -this.config.size);

    this.attackTimer = Math.max(0, this.attackTimer - delta);

    switch (this.state) {
      case 'PATROL':
      case 'SHINING':
        this.doPatrol(enemies);
        break;
      case 'ENGAGE':
        this.doEngage(enemies);
        break;
      case 'CRITICAL':
        this.doCritical(playerX, playerY);
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private doPatrol(enemies: any[]) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const nearest = this.findNearest(enemies);

    if (nearest) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, nearest.x, nearest.y);
      if (dist < this.config.aggroRange) {
        if (this.state !== 'SHINING') this.transitionTo('ENGAGE');
        this.doEngage(enemies);
        return;
      }
    }

    const dx = this.config.zoneX - this.x;
    const dy = this.config.zoneY - this.y;
    const distToZone = Math.sqrt(dx * dx + dy * dy);

    if (distToZone > 30) {
      const speed = this.config.speed;
      body.setVelocity((dx / distToZone) * speed, (dy / distToZone) * speed);
    } else {
      body.setVelocity(0, 0);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private doEngage(enemies: any[]) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const nearest = this.findNearest(enemies);

    if (!nearest) {
      this.transitionTo(this.shineActive ? 'SHINING' : 'PATROL');
      body.setVelocity(0, 0);
      return;
    }

    const tx = nearest.x;
    const ty = nearest.y;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);

    if (dist > this.config.attackRange) {
      const dx = tx - this.x;
      const dy = ty - this.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const speed = this.config.speed * (this.shineActive ? 1.3 : 1);
      body.setVelocity((dx / len) * speed, (dy / len) * speed);
    } else {
      body.setVelocity(0, 0);
      if (this.attackTimer <= 0) {
        this.doAttack(nearest);
      }
    }
  }

  private doCritical(playerX: number, playerY: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 40) {
      const speed = this.config.speed * 0.8;
      body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
    } else {
      body.setVelocity(0, 0);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private doAttack(target: any) {
    this.attackTimer = this.config.attackRate;
    const dmg = this.config.damage * (this.shineActive ? BALANCE.SHINE_DAMAGE_MULT : 1);

    this.scene.tweens.add({
      targets: this.graphic,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 60,
      yoyo: true,
    });

    EventBus.emit('enemy_attacked', { target, damage: dmg, attacker: this });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private findNearest(enemies: any[]): any | null {
    let nearest = null;
    let minDist = Infinity;

    for (const e of enemies) {
      if (!e.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }

    return nearest;
  }


  protected updateHpBar(forcedFrac?: number) {
    const g = this.hpBar;
    const width = this.config.size * 3;
    const height = 4;
    const x = -(this.config.size * 1.5);
    const y = -(this.config.size * 4.5);

    g.setAlpha(1);
    g.clear();
    g.fillStyle(0x222233, 1);
    g.fillRect(x, y, width, height);

    const frac = Phaser.Math.Clamp(forcedFrac ?? (this.hp / this.maxHp), 0, 1);
    const fillWidth = frac > 0 ? Math.max(2, width * frac) : 0;
    const color = frac > 0.5
      ? COLORS.HEALTH_HIGH
      : frac > BALANCE.CRITICAL_HP_THRESHOLD
        ? COLORS.HEALTH_MID
        : COLORS.HEALTH_LOW;

    if (fillWidth > 0) {
      g.fillStyle(color, 1);
      g.fillRect(x, y, fillWidth, height);
    }
  }

  transitionTo(s: TeammateState) {
    this.state = s;
  }

  takeDamage(amount: number) {
    if (this.state === 'DEAD') return;
    this.hp = Math.max(0, this.hp - amount);

    EventBus.emit(EVENTS.TEAMMATE_DAMAGED, { teammate: this, hp: this.hp, maxHp: this.maxHp });

    this.scene.tweens.add({
      targets: this.graphic,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 80,
      yoyo: true,
    });
    this.scene.tweens.add({
      targets: this.graphic,
      alpha: 0.3,
      duration: 60,
      yoyo: true,
    });

    const txt = this.scene.add.text(this.x, this.y - this.config.size * 3,
      `-${Math.round(amount)}`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ff4444',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });

    this.updateHpBar();

    if (this.hp <= 0) {
      this.die();
    } else if (this.hp / this.maxHp <= BALANCE.CRITICAL_HP_THRESHOLD && this.state !== 'CRITICAL') {
      this.transitionTo('CRITICAL');
    }
  }

  receiveHeal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.updateHpBar();
    EventBus.emit(EVENTS.TEAMMATE_HEALED, { teammate: this, hp: this.hp, maxHp: this.maxHp });

    const emitter = this.scene.add.particles(this.x, this.y, undefined, {
      speed: { min: 30, max: 70 },
      angle: { min: 240, max: 300 },
      lifespan: 600,
      quantity: 10,
      scale: { start: 0.4, end: 0 },
      tint: COLORS.HEAL_PARTICLE,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.scene.time.delayedCall(700, () => emitter.destroy());

    if (this.hp / this.maxHp > BALANCE.CRITICAL_HP_THRESHOLD && this.state === 'CRITICAL') {
      this.transitionTo('PATROL');
    }
  }

  receiveShield(amount: number) {
    EventBus.emit(EVENTS.TEAMMATE_SHIELDED, { teammate: this, amount });

    const ring = this.scene.add.graphics();
    ring.lineStyle(3, COLORS.SHIELD_PARTICLE, 1);
    ring.strokeCircle(this.x, this.y, this.config.size + 8);
    ring.setDepth(6);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  activateShine() {
    if (this.state === 'DEAD') return;
    this.shineActive = true;
    this.transitionTo('SHINING');

    this.scene.tweens.add({
      targets: this.graphic,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
    });

    const sc = this.config.shineColor;

    this.glowGraphic.clear();
    this.glowGraphic.fillStyle(sc, 0.22);
    this.glowGraphic.fillCircle(0, 0, this.config.size * 2.8);

    // Burst ring on entry
    const burst = this.scene.add.graphics();
    burst.lineStyle(3, sc, 1);
    burst.strokeCircle(this.x, this.y, this.config.size + 6);
    burst.setDepth(7);
    this.scene.tweens.add({
      targets: burst,
      scaleX: 3.5, scaleY: 3.5, alpha: 0,
      duration: 500, ease: 'Cubic.easeOut',
      onComplete: () => burst.destroy(),
    });

    this.shineParticles = this.scene.add.particles(this.x, this.y, undefined, {
      speed: { min: 25, max: 70 },
      lifespan: { min: 700, max: 1100 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [sc, COLORS.SHINE_GOLD],
      frequency: 55,
      quantity: 3,
      blendMode: Phaser.BlendModes.ADD,
    });

    EventBus.emit(EVENTS.TEAMMATE_SHINE_START, { teammate: this });
  }

  deactivateShine() {
    this.shineActive = false;
    if (this.state === 'SHINING') this.transitionTo('PATROL');

    this.scene.tweens.add({
      targets: this.graphic,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
    });

    this.glowGraphic.clear();
    this.shineParticles?.destroy();
    this.shineParticles = undefined;

    EventBus.emit(EVENTS.TEAMMATE_SHINE_END, { teammate: this });
  }

  private die() {
    this.transitionTo('DEAD');
    this.updateHpBar(0);
    this.hpBar.setAlpha(0);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.shineParticles?.destroy();

    EventBus.emit(EVENTS.TEAMMATE_DIED, { teammate: this });

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 400,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.setActive(false).setVisible(false);
      },
    });
  }

  updateParticleFollow() {
    if (this.shineParticles) {
      this.shineParticles.setPosition(this.x, this.y);
    }
  }
}
