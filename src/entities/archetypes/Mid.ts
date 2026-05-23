import Phaser from 'phaser';
import Teammate from '../Teammate';
import type { TeammateConfig } from '../Teammate';
import { COLORS, SIZES, GAME_WIDTH, GROUND_Y } from '../../constants';

const CONFIG: TeammateConfig = {
  key: 'vorax',
  name: 'Vorax',
  color: COLORS.MID,
  shineColor: COLORS.MID_EMBER,
  size: SIZES.MID,
  speed: 110,
  attackRange: 250,
  aggroRange: 320,
  damage: 40,
  attackRate: 2200,
  zoneX: GAME_WIDTH * 0.21,
  zoneY: GROUND_Y + 4,
  zoneRadius: 130,
};

export default class Mid extends Teammate {
  private arcTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, CONFIG.zoneX, CONFIG.zoneY, CONFIG);
  }

  drawShape() {
    const g = this.graphic;
    g.clear();
    const s = this.config.size;

    // Outer lava shell — irregular molten form, facing right
    g.fillStyle(COLORS.MID, 0.85);
    g.beginPath();
    g.moveTo(s * 0.2, -s * 3.2);
    g.lineTo(s * 1.0, -s * 2.2);
    g.lineTo(s * 1.2, -s * 0.9);
    g.lineTo(s * 0.8, s * 0.4);
    g.lineTo(-s * 0.3, s * 0.5);
    g.lineTo(-s * 1.1, -s * 0.3);
    g.lineTo(-s * 0.9, -s * 1.8);
    g.lineTo(-s * 0.3, -s * 2.8);
    g.closePath();
    g.fillPath();

    // Magma inner layer
    g.fillStyle(COLORS.MID_MAGMA, 0.7);
    g.beginPath();
    g.moveTo(s * 0.1, -s * 2.3);
    g.lineTo(s * 0.7, -s * 1.5);
    g.lineTo(s * 0.75, -s * 0.5);
    g.lineTo(s * 0.3, s * 0.1);
    g.lineTo(-s * 0.5, s * 0.05);
    g.lineTo(-s * 0.6, -s * 0.9);
    g.lineTo(-s * 0.3, -s * 1.9);
    g.closePath();
    g.fillPath();

    // Glowing ember core
    g.fillStyle(COLORS.MID_EMBER, 1);
    g.fillCircle(s * 0.1, -s * 1.3, s * 0.42);

    // Floating embers
    g.fillStyle(COLORS.MID_EMBER, 0.8);
    g.fillCircle(s * 0.9, -s * 2.9, s * 0.16);
    g.fillCircle(-s * 0.75, -s * 1.0, s * 0.12);
    g.fillCircle(s * 1.1, s * 0.2, s * 0.13);
    g.fillCircle(-s * 0.9, -s * 2.2, s * 0.10);

    g.fillStyle(COLORS.MID_MAGMA, 0.6);
    g.fillCircle(s * 0.5, -s * 3.0, s * 0.09);
    g.fillCircle(-s * 1.0, -s * 0.5, s * 0.10);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(delta: number, enemies: any[], playerX: number, playerY: number) {
    this.arcTimer += delta;
    // Gentle vertical float around ground level
    const arcOffset = Math.sin(this.arcTimer / 1400) * 25;
    this.config.zoneY = GROUND_Y + 4 + arcOffset;

    super.update(delta, enemies, playerX, playerY);
  }
}
