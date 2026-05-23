import Phaser from 'phaser';
import Teammate from '../Teammate';
import type { TeammateConfig } from '../Teammate';
import { COLORS, SIZES, GAME_WIDTH, GROUND_Y } from '../../constants';

const CONFIG: TeammateConfig = {
  key: 'lyria',
  name: 'Lyria',
  color: COLORS.ADC,
  shineColor: COLORS.ADC_BOLT,
  size: SIZES.ADC,
  speed: 140,
  attackRange: 210,
  aggroRange: 290,
  damage: 14,
  attackRate: 650,
  zoneX: GAME_WIDTH * 0.29,
  zoneY: GROUND_Y - 8,
  zoneRadius: 110,
};

export default class ADC extends Teammate {
  constructor(scene: Phaser.Scene) {
    super(scene, CONFIG.zoneX, CONFIG.zoneY, CONFIG);
  }

  drawShape() {
    const g = this.graphic;
    g.clear();
    const s = this.config.size;

    // Cloak trailing behind (left side)
    g.fillStyle(COLORS.ADC, 0.4);
    g.beginPath();
    g.moveTo(-s * 0.4, -s * 2.4);
    g.lineTo(-s * 1.9, -s * 1.1);
    g.lineTo(-s * 1.5, s * 0.5);
    g.lineTo(-s * 0.4, s * 0.5);
    g.closePath();
    g.fillPath();

    // Slim body
    g.fillStyle(COLORS.ADC, 1);
    g.fillRect(-s * 0.45, -s * 2.6, s * 0.9, s * 3.1);

    // Head (hooded circle)
    g.fillStyle(COLORS.ADC, 1);
    g.fillCircle(-s * 0.05, -s * 2.85, s * 0.72);

    // Hood point
    g.fillStyle(COLORS.ADC, 0.85);
    g.beginPath();
    g.moveTo(-s * 0.3, -s * 3.45);
    g.lineTo(s * 0.32, -s * 2.5);
    g.lineTo(-s * 0.8, -s * 2.5);
    g.closePath();
    g.fillPath();

    // Crossbow stock
    g.fillStyle(COLORS.ADC_SILVER, 1);
    g.fillRect(s * 0.3, -s * 1.95, s * 0.55, s * 0.28);

    // Upper bow limb
    g.fillRect(s * 0.72, -s * 2.38, s * 0.18, s * 0.5);
    // Lower bow limb
    g.fillRect(s * 0.72, -s * 1.9, s * 0.18, s * 0.55);

    // Barrel extending right
    g.fillRect(s * 0.9, -s * 1.87, s * 1.7, s * 0.18);

    // Eye glint (silver, forward-facing)
    g.fillStyle(COLORS.ADC_SILVER, 0.9);
    g.fillCircle(s * 0.1, -s * 2.88, s * 0.22);

    // Bolt glow at barrel tip
    g.fillStyle(COLORS.ADC_BOLT, 0.65);
    g.fillCircle(s * 2.45, -s * 1.78, s * 0.18);

    // Quiver on back
    g.fillStyle(COLORS.ADC, 0.6);
    g.fillRect(-s * 0.6, -s * 2.15, s * 0.22, s * 1.0);
  }
}
