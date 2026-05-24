import Phaser from 'phaser';
import Teammate from '../Teammate';
import type { TeammateConfig } from '../Teammate';
import { ASSETS, COLORS, SIZES, GAME_WIDTH, GROUND_Y, BALANCE } from '../../constants';

const CONFIG: TeammateConfig = {
  key: 'arthur',
  name: 'Arthur',
  color: COLORS.SOLO,
  shineColor: COLORS.SOLO_ACCENT,
  size: SIZES.SOLO,
  speed: 80,
  attackRange: 70,
  aggroRange: 240,
  damage: 35,
  attackRate: 900,
  zoneX: GAME_WIDTH * 0.50,
  zoneY: GROUND_Y,
  zoneRadius: 80,
};

export default class Solo extends Teammate {
  constructor(scene: Phaser.Scene) {
    super(scene, CONFIG.zoneX, CONFIG.zoneY, CONFIG);
    this.maxHp = BALANCE.SOLO_MAX_HP;
    this.hp = BALANCE.SOLO_MAX_HP;
    this.updateHpBar();
  }

  drawShape() {
    if (this.useSpriteVisual(ASSETS.SOLO, this.config.size * 4.9, this.config.size * 0.2)) {
      return;
    }

    const g = this.graphic as Phaser.GameObjects.Graphics;
    g.clear();
    const s = this.config.size;

    // Cape trailing behind (left side)
    g.fillStyle(COLORS.SOLO_STEEL, 0.5);
    g.beginPath();
    g.moveTo(-s * 0.5, -s * 2.2);
    g.lineTo(-s * 2.0, -s * 0.8);
    g.lineTo(-s * 1.5, s * 0.5);
    g.lineTo(-s * 0.5, s * 0.5);
    g.closePath();
    g.fillPath();

    // Greaves / boots (legs at ground level)
    g.fillStyle(COLORS.SOLO_STEEL, 0.9);
    g.fillRect(-s * 0.45, -s * 0.85, s * 0.38, s * 0.85);
    g.fillRect(s * 0.07, -s * 0.85, s * 0.38, s * 0.85);

    // Armored torso / breastplate
    g.fillStyle(COLORS.SOLO, 1);
    g.fillRect(-s * 0.6, -s * 2.65, s * 1.2, s * 1.85);

    // Pauldrons
    g.fillStyle(COLORS.SOLO_STEEL, 1);
    g.fillRect(-s * 0.95, -s * 2.65, s * 0.38, s * 0.5);
    g.fillRect(s * 0.57, -s * 2.65, s * 0.42, s * 0.55);

    // Helmet
    g.fillStyle(COLORS.SOLO, 1);
    g.fillRect(-s * 0.5, -s * 3.75, s * 1.0, s * 1.2);

    // Visor slit
    g.fillStyle(COLORS.SOLO_ACCENT, 1);
    g.fillRect(-s * 0.42, -s * 3.08, s * 0.84, s * 0.22);

    // Sword blade (extends right at torso height)
    g.fillStyle(COLORS.SOLO_STEEL, 1);
    g.fillRect(s * 0.62, -s * 1.65, s * 2.8, s * 0.28);

    // Crossguard (vertical bar)
    g.fillStyle(COLORS.SOLO, 1);
    g.fillRect(s * 0.6, -s * 2.0, s * 0.26, s * 0.8);

    // Armor crack details
    g.lineStyle(1, COLORS.SOLO_ACCENT, 0.3);
    g.lineBetween(-s * 0.3, -s * 2.2, s * 0.15, -s * 1.5);
    g.lineBetween(s * 0.1, -s * 2.4, s * 0.4, -s * 1.8);
  }
}
