import Phaser from 'phaser';
import Enemy from '../Enemy';
import type { EnemyConfig } from '../Enemy';
import { COLORS, SIZES, BALANCE } from '../../constants';

const CONFIG: EnemyConfig = {
  key: 'assassin',
  color: COLORS.ASSASSIN,
  size: SIZES.ASSASSIN,
  hp: BALANCE.ASSASSIN_HP,
  damage: BALANCE.ASSASSIN_DMG,
  speed: BALANCE.ASSASSIN_SPEED,
  attackRange: 35,
  attackRate: 800,
  xpValue: 12,
};

export default class Assassin extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG, 'assassin');
  }

  drawShape() {
    const g = this.graphic;
    g.clear();
    const s = this.config.size;

    // Low crouched silhouette (facing left, aggressive lean)
    g.fillStyle(this.config.color, 1);
    g.beginPath();
    g.moveTo(-s * 0.2, -s * 2.8);  // hood top (slightly left-leaning)
    g.lineTo(s * 0.4, -s * 1.9);   // right shoulder
    g.lineTo(s * 0.35, -s * 0.4);  // right hip
    g.lineTo(s * 0.0, s * 0.1);    // back foot
    g.lineTo(-s * 0.55, -s * 0.2); // left foot
    g.lineTo(-s * 0.7, -s * 1.2);  // left side
    g.lineTo(-s * 0.5, -s * 2.0);  // upper left
    g.closePath();
    g.fillPath();

    // Hood point (pulled forward-left)
    g.beginPath();
    g.moveTo(-s * 0.5, -s * 3.0);
    g.lineTo(s * 0.1, -s * 2.3);
    g.lineTo(-s * 0.8, -s * 2.3);
    g.closePath();
    g.fillPath();

    // Forward blade (extending left, deadly angle)
    g.fillStyle(COLORS.WHITE, 0.75);
    g.beginPath();
    g.moveTo(-s * 0.6, -s * 1.6);
    g.lineTo(-s * 2.1, -s * 2.3);
    g.lineTo(-s * 2.05, -s * 2.1);
    g.lineTo(-s * 0.55, -s * 1.35);
    g.closePath();
    g.fillPath();

    // Eye (red glint)
    g.fillStyle(COLORS.WHITE, 0.9);
    g.fillCircle(-s * 0.2, -s * 2.4, s * 0.18);
  }

  // Assassins lock onto the Shine State target, ignore all others
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getTarget(teammates: any[], shineTarget?: any): any | null {
    if (shineTarget && (shineTarget as any).active && (shineTarget as any).state !== 'DEAD') {
      return shineTarget;
    }
    // Fallback: nearest alive teammate
    return this.findNearest(teammates);
  }
}
