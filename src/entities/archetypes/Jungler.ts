import Phaser from 'phaser';
import Teammate from '../Teammate';
import type { TeammateConfig } from '../Teammate';
import { COLORS, SIZES, GAME_WIDTH, GROUND_Y, BALANCE } from '../../constants';
import EventBus from '../../events';

const CONFIG: TeammateConfig = {
  key: 'nyx',
  name: 'Nyx',
  color: COLORS.JUNGLER,
  shineColor: COLORS.JUNGLER_TRAIL,
  size: SIZES.JUNGLER,
  speed: 210,
  attackRange: 80,
  aggroRange: 360,
  damage: 22,
  attackRate: 750,
  zoneX: -60,
  zoneY: GROUND_Y,
  zoneRadius: 300,
};

export default class Jungler extends Teammate {
  private roamTimer: number = 0;
  private roamInterval: number = 3500;
  private targetRoamX: number = -60;
  private targetRoamY: number = GROUND_Y;
  private dashSlashTimer: number = 0;
  private isDashing: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, -60, GROUND_Y, CONFIG);
    this.roamTimer = Math.random() * 2000;
  }

  drawShape() {
    const g = this.graphic;
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
    this.roamTimer += delta;

    if (this.roamTimer >= this.roamInterval) {
      this.roamTimer = 0;
      this.roamInterval = 2500 + Math.random() * 3500;
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

    // Create trail line
    const trail = this.scene.add.graphics();
    trail.setDepth(3);

    // Tween toward enemy
    this.scene.tweens.add({
      targets: this,
      x: nearest.x,
      y: nearest.y,
      duration: 150,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Deal bonus damage
        const bonusDmg = this.config.damage * 0.5;
        EventBus.emit('enemy_attacked', { target: nearest, damage: bonusDmg, attacker: this });

        // Draw trail from start to current
        trail.lineStyle(2, COLORS.JUNGLER_TRAIL, 0.8);
        trail.lineBetween(startX, startY, this.x, this.y);

        // Fade trail
        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          duration: 300,
          onComplete: () => trail.destroy(),
        });

        // Slash arc graphic
        const slash = this.scene.add.graphics();
        slash.lineStyle(3, COLORS.JUNGLER, 0.9);
        slash.beginPath();
        slash.arc(this.x, this.y, this.config.size + 10, 0, Math.PI, false);
        slash.strokePath();
        slash.setDepth(7);
        this.scene.tweens.add({
          targets: slash,
          alpha: 0,
          duration: 300,
          onComplete: () => slash.destroy(),
        });

        // Tween back toward zone
        this.scene.tweens.add({
          targets: this,
          x: this.targetRoamX,
          y: this.targetRoamY,
          duration: 200,
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
      { x: -50, y: gy },
      { x: GAME_WIDTH * 0.08, y: gy + Math.random() * 30 - 15 },
      { x: GAME_WIDTH * 0.22, y: gy + Math.random() * 30 - 15 },
      { x: GAME_WIDTH * 0.35, y: gy + Math.random() * 30 - 15 },
      { x: -50, y: gy + Math.random() * 40 - 20 },
    ];
    const pick = options[Math.floor(Math.random() * options.length)];
    this.targetRoamX = pick.x;
    this.targetRoamY = pick.y;
  }
}
