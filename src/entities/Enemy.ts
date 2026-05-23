import Phaser from 'phaser';
import { AUDIO, EVENTS } from '../constants';
import EventBus from '../events';

export interface EnemyConfig {
  key: string;
  color: number;
  size: number;
  hp: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackRate: number;
  xpValue: number;
}

export type EnemyType = 'grunt' | 'harasser' | 'assassin';

export default class Enemy extends Phaser.GameObjects.Container {
  scene: Phaser.Scene;
  declare body: Phaser.Physics.Arcade.Body;

  config: EnemyConfig;
  hp: number;
  maxHp: number;
  active: boolean = true;
  type: EnemyType;

  protected graphic!: Phaser.GameObjects.Graphics;
  protected hpBar!: Phaser.GameObjects.Graphics;
  protected attackTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig, type: EnemyType) {
    super(scene, x, y);
    this.scene = scene;
    this.config = config;
    this.type = type;
    this.hp = config.hp;
    this.maxHp = config.hp;

    this.createVisual();
    scene.add.existing(this);
    (scene.physics.add.existing as (go: Phaser.GameObjects.Container) => void)(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(config.size, -config.size, -config.size);

    this.setDepth(4);
    this.updateHpBar();
  }

  applyNightModifiers(speedMultiplier: number, tint: number) {
    this.config = {
      ...this.config,
      color: tint,
      speed: Math.round(this.config.speed * speedMultiplier),
    };
    this.drawShape();
    this.updateHpBar();
  }

  createVisual() {
    this.graphic = this.scene.add.graphics();
    this.add(this.graphic);

    this.hpBar = this.scene.add.graphics();
    this.add(this.hpBar);

    this.drawShape();
  }

  drawShape() {
    const g = this.graphic;
    g.setAlpha(1);
    g.clear();
    g.fillStyle(this.config.color, 1);
    g.fillCircle(0, 0, this.config.size);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getTarget(teammates: any[], _shineTarget?: any): any | null {
    return this.findNearest(teammates);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(delta: number, teammates: any[], shineTarget?: any) {
    if (!this.active) return;

    this.attackTimer = Math.max(0, this.attackTimer - delta);

    const target = this.getTarget(teammates, shineTarget);
    if (!target) return;

    const tx = target.x;
    const ty = target.y;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);

    if (dist > this.config.attackRange) {
      const dx = tx - this.x;
      const dy = ty - this.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity((dx / len) * this.config.speed, (dy / len) * this.config.speed);
    } else {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      if (this.attackTimer <= 0) {
        this.attackTarget(target);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected attackTarget(target: any) {
    this.attackTimer = this.config.attackRate;

    if (target.takeDamage) {
      target.takeDamage(this.config.damage);
    }

    // Attack lunge
    this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y,
      duration: 80,
      yoyo: true,
      ease: 'Cubic.easeOut',
    });
  }


  protected updateHpBar(forcedFrac?: number) {
    const g = this.hpBar;
    const width = this.config.size * 2.5;
    const height = 3;
    const x = -(width / 2);
    const y = -(this.config.size * 3.5);

    g.clear();
    g.fillStyle(0x222233, 1);
    g.fillRect(x, y, width, height);

    const frac = Phaser.Math.Clamp(forcedFrac ?? (this.hp / this.maxHp), 0, 1);
    const fillWidth = frac > 0 ? Math.max(2, width * frac) : 0;
    if (fillWidth > 0) {
      g.fillStyle(0xcc2222, 1);
      g.fillRect(x, y, fillWidth, height);
    }
  }

  takeDamage(amount: number) {
    if (!this.active) return;
    this.hp = Math.max(0, this.hp - amount);

    this.scene.tweens.add({
      targets: this.graphic,
      alpha: 0.3,
      duration: 50,
      yoyo: true,
    });

    const txt = this.scene.add.text(this.x, this.y - this.config.size * 3,
      `-${Math.round(amount)}`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffffff',
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

    if (this.hp <= 0) this.die();
  }

  private die() {
    this.active = false;
    this.updateHpBar(0);
    this.hpBar.setAlpha(0);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.playSound(AUDIO.ENEMY_DEATH, 0.45);

    EventBus.emit(EVENTS.ENEMY_DIED, { enemy: this, x: this.x, y: this.y, xp: this.config.xpValue });

    const frags = 5;
    for (let i = 0; i < frags; i++) {
      const frag = this.scene.add.graphics();
      frag.fillStyle(this.config.color, 1);
      frag.fillCircle(0, 0, this.config.size * 0.35);
      frag.setPosition(this.x, this.y);
      frag.setDepth(3);

      const angle = (Math.PI * 2 / frags) * i + Math.random() * 0.5;
      const dist = 30 + Math.random() * 40;

      this.scene.tweens.add({
        targets: frag,
        x: frag.x + Math.cos(angle) * dist,
        y: frag.y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 300,
        ease: 'Cubic.easeOut',
        onComplete: () => frag.destroy(),
      });
    }

    this.setActive(false).setVisible(false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected findNearest(targets: any[]): any | null {
    let nearest = null;
    let minDist = Infinity;

    for (const t of targets) {
      if (!t.active || t.state === 'DEAD') continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = t;
      }
    }

    return nearest;
  }

  private playSound(key: string, volume: number) {
    try {
      this.scene.sound.play(key, { volume });
    } catch {
      // Audio is optional until real assets are supplied.
    }
  }
}
