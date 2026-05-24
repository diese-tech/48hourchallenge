import Phaser from 'phaser';
import Teammate from '../Teammate';
import type { TeammateConfig } from '../Teammate';
import { ASSETS, COLORS, SIZES, GAME_WIDTH, GROUND_Y, BALANCE } from '../../constants';
import EventBus from '../../events';

const CONFIG: TeammateConfig = {
  key: 'lyria',
  name: 'Lyria',
  color: COLORS.ADC,
  shineColor: COLORS.ADC_BOLT,
  size: SIZES.ADC,
  speed: 115,
  attackRange: 520,
  aggroRange: 640,
  damage: 15,
  attackRate: 460,
  zoneX: GAME_WIDTH * 0.29,
  zoneY: GROUND_Y - 8,
  zoneRadius: 110,
};

export default class ADC extends Teammate {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly onEnemyAttacked = ({ target, attacker }: { target: any; attacker: any }) => {
    if (attacker === this && target?.active) {
      this.spawnProjectile(target);
    }
  };

  constructor(scene: Phaser.Scene) {
    super(scene, CONFIG.zoneX, CONFIG.zoneY, CONFIG);
    this.maxHp = BALANCE.ADC_MAX_HP;
    this.hp = BALANCE.ADC_MAX_HP;
    this.updateHpBar();

    EventBus.on('enemy_attacked', this.onEnemyAttacked);
  }

  override destroy(fromScene?: boolean) {
    EventBus.off('enemy_attacked', this.onEnemyAttacked);
    super.destroy(fromScene);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private spawnProjectile(target: any) {
    const bolt = this.scene.add.graphics();
    bolt.lineStyle(2, COLORS.ADC_BOLT, 0.9);
    bolt.lineBetween(-8, 0, 8, 0);
    bolt.fillStyle(COLORS.ADC_BOLT, 0.95);
    bolt.fillCircle(8, 0, 3);
    bolt.setPosition(this.x, this.y - this.config.size * 1.5);
    bolt.setDepth(8);

    this.scene.tweens.add({
      targets: bolt,
      x: target.x,
      y: target.y - 10,
      duration: 140,
      ease: 'Linear',
      onComplete: () => {
        const pop = this.scene.add.graphics();
        pop.fillStyle(COLORS.ADC_BOLT, 0.7);
        pop.fillCircle(0, 0, 5);
        pop.setPosition(target.x, target.y - 10).setDepth(8);

        this.scene.tweens.add({
          targets: pop,
          scaleX: 2.5,
          scaleY: 2.5,
          alpha: 0,
          duration: 100,
          onComplete: () => pop.destroy(),
        });

        bolt.destroy();
      },
    });
  }

  drawShape() {
    if (this.useSpriteVisual(ASSETS.ADC, this.config.size * 5.0, this.config.size * 0.25)) {
      return;
    }

    const g = this.graphic as Phaser.GameObjects.Graphics;
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
