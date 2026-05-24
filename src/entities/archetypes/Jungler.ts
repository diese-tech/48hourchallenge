import Phaser from 'phaser';
import Teammate from '../Teammate';
import type { TeammateConfig } from '../Teammate';
import { ASSETS, COLORS, SIZES, GAME_WIDTH, GROUND_Y, BALANCE } from '../../constants';

const CONFIG: TeammateConfig = {
  key: 'nyx',
  name: 'Nyx',
  color: COLORS.JUNGLER,
  shineColor: COLORS.JUNGLER_TRAIL,
  size: SIZES.JUNGLER,
  speed: 235,
  attackRange: 90,
  aggroRange: 760,
  damage: 24,
  attackRate: 680,
  zoneX: GAME_WIDTH * 0.12,
  zoneY: GROUND_Y,
  zoneRadius: 300,
};

export default class Jungler extends Teammate {
  private roamTimer: number = 0;
  private roamInterval: number = 2200;
  private targetRoamX: number = GAME_WIDTH * 0.12;
  private targetRoamY: number = GROUND_Y;
  private dashSlashTimer: number = BALANCE.JUNGLER_DASH_INTERVAL_MS - 900;
  private isDashing: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, CONFIG.zoneX, GROUND_Y, CONFIG);
    this.roamTimer = this.roamInterval - 700;
  }

  drawShape() {
    if (this.useSpriteVisual(ASSETS.JUNGLER, this.config.size * 4.8, this.config.size * 0.3)) {
      return;
    }

    const g = this.graphic as Phaser.GameObjects.Graphics;
    g.clear();
    const s = this.config.size;

    // Asymmetric cloak (wide behind = left)
    g.fillStyle(COLORS.JUNGLER, 0.3);
    g.beginPath();
    g.moveTo(-s * 0.4, -s * 2.4);
    g.lineTo(-s * 2.3, -s * 0.5);
    g.lineTo(-s * 1.9, s * 0.5);
    g.lineTo(-s * 0.4, s * 0.5);
    g.closePath();
    g.fillPath();

    // Main crouched body (low, facing right)
    g.fillStyle(COLORS.JUNGLER, 1);
    g.beginPath();
    g.moveTo(s * 0.1, -s * 2.8);
    g.lineTo(s * 0.7, -s * 1.8);
    g.lineTo(s * 0.65, -s * 0.4);
    g.lineTo(s * 0.15, s * 0.5);
    g.lineTo(-s * 0.6, s * 0.3);
    g.lineTo(-s * 0.8, -s * 0.8);
    g.lineTo(-s * 0.5, -s * 2.0);
    g.closePath();
    g.fillPath();

    // Hood (pointed, tilted forward toward right)
    g.fillStyle(COLORS.JUNGLER, 0.85);
    g.beginPath();
    g.moveTo(s * 0.1, -s * 3.1);
    g.lineTo(s * 0.65, -s * 2.2);
    g.lineTo(-s * 0.45, -s * 2.2);
    g.closePath();
    g.fillPath();

    // Forward dagger (right / leading, angled up-forward)
    g.fillStyle(COLORS.JUNGLER_TRAIL, 0.9);
    g.beginPath();
    g.moveTo(s * 0.6, -s * 1.4);
    g.lineTo(s * 2.2, -s * 2.0);
    g.lineTo(s * 2.15, -s * 1.78);
    g.lineTo(s * 0.65, -s * 1.15);
    g.closePath();
    g.fillPath();

    // Secondary dagger (lower, forward)
    g.fillStyle(COLORS.JUNGLER_TRAIL, 0.7);
    g.beginPath();
    g.moveTo(s * 0.5, -s * 0.6);
    g.lineTo(s * 1.95, -s * 0.05);
    g.lineTo(s * 1.9, s * 0.18);
    g.lineTo(s * 0.45, -s * 0.38);
    g.closePath();
    g.fillPath();

    // Eye — single spectral green glint
    g.fillStyle(COLORS.JUNGLER_TRAIL, 1);
    g.fillCircle(s * 0.22, -s * 2.3, s * 0.18);

    // Shadow core
    g.fillStyle(COLORS.JUNGLER_SHADOW, 0.6);
    g.fillCircle(-s * 0.1, -s * 0.5, s * 0.35);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(delta: number, enemies: any[], playerX: number, playerY: number) {
    if (this.isDashing) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      return;
    }

    this.roamTimer += delta;

    if (this.roamTimer >= this.roamInterval) {
      this.roamTimer = 0;
      this.roamInterval = 1600 + Math.random() * 2200;
      this.pickNewRoamTarget();
    }

    this.config.zoneX = this.targetRoamX;
    this.config.zoneY = this.targetRoamY;

    // Dash-slash logic
    this.dashSlashTimer += delta;
    if (
      this.dashSlashTimer >= BALANCE.JUNGLER_DASH_INTERVAL_MS &&
      !this.isDashing &&
      this.state !== 'DEAD'
    ) {
      const inRange = enemies.filter((e: any) => {
        if (!e.active) return false;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
        return dist < this.config.aggroRange;
      });

      if (inRange.length > 0) {
        this.dashSlashTimer = 0;
        this.performDashSlash(inRange);
        return;
      }
    }

    super.update(delta, enemies, playerX, playerY);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private performDashSlash(enemies: any[]) {
    this.isDashing = true;

    // Pick nearest enemy
    let nearest = enemies[0];
    let minDist = Infinity;
    for (const e of enemies) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }

    const startX = this.x;
    const startY = this.y;
    const maxDiveX = GAME_WIDTH * 0.78;
    const dashTargetX = Phaser.Math.Clamp(
      Math.min(nearest.x - 35, this.x + BALANCE.JUNGLER_DASH_DISTANCE),
      GAME_WIDTH * 0.24,
      maxDiveX
    );
    const dashTargetY = Phaser.Math.Clamp(nearest.y, GROUND_Y - 36, GROUND_Y + 28);

    const trail = this.scene.add.graphics();
    trail.lineStyle(4, COLORS.JUNGLER_TRAIL, 0.85);
    trail.lineBetween(startX, startY - this.config.size * 1.8, dashTargetX, dashTargetY - this.config.size * 1.8);
    trail.fillStyle(COLORS.JUNGLER_SHADOW, 0.35);
    trail.fillCircle(startX, startY - this.config.size * 1.5, this.config.size * 1.8);
    trail.setDepth(7);
    trail.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: this,
      x: dashTargetX,
      y: dashTargetY,
      duration: 130,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        const hitDist = Phaser.Math.Distance.Between(this.x, this.y, nearest.x, nearest.y);
        if (nearest.active && hitDist <= this.config.attackRange + 70) {
          nearest.takeDamage(this.config.damage * 0.75);
        }

        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          duration: 360,
          onComplete: () => trail.destroy(),
        });

        const slash = this.scene.add.graphics();
        slash.lineStyle(4, COLORS.JUNGLER_TRAIL, 1);
        slash.beginPath();
        slash.arc(this.x, this.y - this.config.size * 1.4, this.config.size + 22, -0.3, Math.PI + 0.7, false);
        slash.strokePath();
        slash.setDepth(10);
        slash.setBlendMode(Phaser.BlendModes.ADD);
        this.scene.tweens.add({
          targets: slash,
          scaleX: 1.8,
          scaleY: 1.8,
          alpha: 0,
          duration: 260,
          onComplete: () => slash.destroy(),
        });

        this.targetRoamX = Phaser.Math.Clamp(this.x - 160, GAME_WIDTH * 0.12, GAME_WIDTH * 0.42);
        this.targetRoamY = GROUND_Y + Phaser.Math.Between(-22, 18);
        this.config.zoneX = this.targetRoamX;
        this.config.zoneY = this.targetRoamY;

        this.scene.tweens.add({
          targets: this,
          x: this.targetRoamX,
          y: this.targetRoamY,
          duration: 230,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.isDashing = false;
          },
        });
      },
    });
  }

  private pickNewRoamTarget() {
    const gy = GROUND_Y;
    const options = [
      { x: GAME_WIDTH * 0.10, y: gy + Math.random() * 30 - 15 },
      { x: GAME_WIDTH * 0.18, y: gy + Math.random() * 34 - 17 },
      { x: GAME_WIDTH * 0.28, y: gy + Math.random() * 36 - 18 },
      { x: GAME_WIDTH * 0.38, y: gy + Math.random() * 34 - 17 },
      { x: GAME_WIDTH * 0.46, y: gy + Math.random() * 30 - 15 },
    ];
    const pick = options[Math.floor(Math.random() * options.length)];
    this.targetRoamX = pick.x;
    this.targetRoamY = pick.y;
  }
}
