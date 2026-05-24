import Phaser from 'phaser';
import Enemy from '../Enemy';
import type { EnemyConfig } from '../Enemy';
import { ASSETS, COLORS, SIZES, BALANCE } from '../../constants';

const CONFIG: EnemyConfig = {
  key: 'grunt',
  color: COLORS.GRUNT,
  size: SIZES.GRUNT,
  hp: BALANCE.GRUNT_HP,
  damage: BALANCE.GRUNT_DMG,
  speed: BALANCE.GRUNT_SPEED,
  attackRange: 40,
  attackRate: 1200,
  xpValue: 5,
};

export default class Grunt extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CONFIG, 'grunt');
  }

  drawShape() {
    if (this.useSpriteVisual(ASSETS.GRUNT, this.config.size * 4.3, this.config.size * 0.2)) {
      return;
    }

    const g = this.graphic as Phaser.GameObjects.Graphics;
    g.clear();
    const s = this.config.size;

    // Legs / boots (at ground level)
    g.fillStyle(this.config.color, 0.8);
    g.fillRect(-s * 0.4, -s * 0.8, s * 0.35, s * 0.8);
    g.fillRect(s * 0.05, -s * 0.8, s * 0.35, s * 0.8);

    // Heavy armored body (facing left)
    g.fillStyle(this.config.color, 1);
    g.fillRect(-s * 0.65, -s * 2.4, s * 1.3, s * 1.65);

    // Helmet (bulky, facing left)
    g.fillRect(-s * 0.55, -s * 3.1, s * 1.1, s * 0.85);

    // Visor slit (dark)
    g.fillStyle(COLORS.BLACK, 0.6);
    g.fillRect(-s * 0.45, -s * 2.75, s * 0.75, s * 0.18);

    // Shield on left arm (facing left = the front arm)
    g.fillStyle(COLORS.WHITE, 0.15);
    g.fillRect(-s * 1.1, -s * 2.2, s * 0.5, s * 1.3);

    // Inner cross detail on body
    g.fillStyle(COLORS.WHITE, 0.1);
    g.fillRect(-s * 0.55, -s * 1.85, s * 1.1, s * 0.22);
  }
}
