import Phaser from 'phaser';
import Enemy from '../Enemy';
import type { EnemyConfig } from '../Enemy';
import { COLORS, SIZES, BALANCE } from '../../constants';

const CONFIG: EnemyConfig = {
  key: 'harasser',
  color: COLORS.HARASSER,
  size: SIZES.HARASSER,
  hp: BALANCE.HARASSER_HP,
  damage: BALANCE.HARASSER_DMG,
  speed: BALANCE.HARASSER_SPEED,
  attackRange: 180,
  attackRate: 1000,
  xpValue: 8,
};

export default class Harasser extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG, 'harasser');
  }

  drawShape() {
    const g = this.graphic;
    g.clear();
    const s = this.config.size;

    // Slim body (facing left)
    g.fillStyle(this.config.color, 1);
    g.fillRect(-s * 0.45, -s * 2.6, s * 0.9, s * 2.6);

    // Head
    g.fillCircle(-s * 0.05, -s * 2.85, s * 0.58);

    // Bow arm extending LEFT (forward, toward team)
    g.lineStyle(2, COLORS.WHITE, 0.6);
    g.lineBetween(-s * 0.5, -s * 2.2, -s * 1.7, -s * 1.4);
    g.lineBetween(-s * 0.5, -s * 0.9, -s * 1.7, -s * 1.4);

    // Bowstring
    g.lineStyle(1, COLORS.WHITE, 0.35);
    g.lineBetween(-s * 0.5, -s * 2.2, -s * 0.5, -s * 0.9);

    // Eye glint
    g.fillStyle(COLORS.WHITE, 0.5);
    g.fillCircle(-s * 0.15, -s * 2.9, s * 0.16);
  }

  // Targets lowest HP teammate instead of nearest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getTarget(teammates: any[]): any | null {
    let lowestHp = Infinity;
    let target: Phaser.GameObjects.GameObject | null = null;

    for (const t of teammates) {
      const tm = t as any;
      if (!tm.active || tm.state === 'DEAD') continue;
      if (tm.hp < lowestHp) {
        lowestHp = tm.hp;
        target = t;
      }
    }

    return target;
  }

  // Harasser kites: if target is too close, back away
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(delta: number, teammates: any[], _shineTarget?: any) {
    this.attackTimer = Math.max(0, this.attackTimer - delta);
    const target = this.getTarget(teammates);
    if (!target) return;

    const tx = (target as any).x;
    const ty = (target as any).y;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    const body = this.body as Phaser.Physics.Arcade.Body;

    const kiteRange = 80; // too close = back away

    if (dist < kiteRange) {
      // Back away
      const dx = this.x - tx;
      const dy = this.y - ty;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      body.setVelocity((dx / len) * this.config.speed, (dy / len) * this.config.speed);
    } else if (dist > this.config.attackRange) {
      // Move closer
      const dx = tx - this.x;
      const dy = ty - this.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      body.setVelocity((dx / len) * this.config.speed * 0.7, (dy / len) * this.config.speed * 0.7);
    } else {
      body.setVelocity(0, 0);
      if (this.attackTimer <= 0) {
        this.attackTarget(target);
      }
    }
  }
}
