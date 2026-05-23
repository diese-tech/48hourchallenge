import Phaser from 'phaser';
import { TIMING } from '../constants';
import Teammate from '../entities/Teammate';

export const QUIPS: Record<string, string[]> = {
  arthur: [
    'I DO NOT FALL. I DO NOT YIELD.',
    'FOR THE KINGDOM.',
    'I CANNOT BE STOPPED.',
    'WITNESS MY GLORY.',
    'NONE SHALL PASS.',
    'THEN LET THEM TRY.',
  ],
  lyria: [
    'I MOVE. I FIRE. I DO NOT GET HIT.',
    'I SEE EVERY TARGET.',
    "DON'T LET THEM GET CLOSE.",
    "I'M THE WIN CONDITION.",
    'JUST. STAY. ALIVE.',
    'OVERCLOCKED. UNSTOPPABLE.',
  ],
  vorax: [
    'I BURN. I BREAK. I LEAVE NOTHING BEHIND.',
    'EVERYTHING BURNS.',
    'STAND CLEAR.',
    'IGNITION SEQUENCE.',
    'I AM THE ARTILLERY.',
    'BURN THEM ALL.',
  ],
  nyx: [
    'I AM THE SHADOW. YOU NEVER SAW ME.',
    'STRIKING FROM SHADOWS.',
    'ANOTHER FLANK.',
    "YOU'RE WELCOME.",
    'BLINK. SLASH. GONE.',
    'AMBUSH CHAIN INITIATED.',
  ],
};

export default class ShineSystem {
  private scene: Phaser.Scene;
  private teammates: Teammate[];
  private currentShine?: Teammate;
  private shineTimer: number = 0;
  private shineInterval: number;
  private shineDurationTimer: number = 0;
  private isActive: boolean = false;

  constructor(scene: Phaser.Scene, teammates: Teammate[]) {
    this.scene = scene;
    this.teammates = teammates;
    this.shineInterval = this.randomInterval();
  }

  private randomInterval(): number {
    return TIMING.SHINE_INTERVAL_MIN_MS +
      Math.random() * (TIMING.SHINE_INTERVAL_MAX_MS - TIMING.SHINE_INTERVAL_MIN_MS);
  }

  update(delta: number) {
    if (this.isActive) {
      this.shineDurationTimer += delta;
      if (this.shineDurationTimer >= TIMING.SHINE_DURATION_MS) {
        this.endShine();
      }
      // Keep particles following the shining teammate
      this.currentShine?.updateParticleFollow();
    } else {
      this.shineTimer += delta;
      if (this.shineTimer >= this.shineInterval) {
        this.triggerShine();
      }
    }
  }

  private triggerShine() {
    const alive = this.teammates.filter(t => t.state !== 'DEAD' && t.state !== 'CRITICAL');
    if (alive.length === 0) return;

    // Weighted: avoid recently Shined if possible (simple: pick random from alive)
    const pick = alive[Math.floor(Math.random() * alive.length)];
    this.currentShine = pick;
    this.isActive = true;
    this.shineDurationTimer = 0;
    this.shineTimer = 0;

    pick.activateShine();
    this.showQuipCard(pick);
  }

  private endShine() {
    this.currentShine?.deactivateShine();
    this.currentShine = undefined;
    this.isActive = false;
    this.shineInterval = this.randomInterval();
  }

  private showQuipCard(teammate: Teammate) {
    const quips = QUIPS[teammate.config.key] || ['SHINE!'];
    const quip = quips[Math.floor(Math.random() * quips.length)];
    const name = teammate.config.name.toUpperCase();
    const sc = teammate.config.shineColor;
    const scHex = '#' + sc.toString(16).padStart(6, '0');

    const cx = this.scene.scale.width / 2;
    const cy = this.scene.scale.height / 2;

    // Card background — character-colored border
    const card = this.scene.add.graphics();
    card.fillStyle(0x08081a, 0.92);
    card.lineStyle(2, sc, 1);
    card.fillRoundedRect(cx - 170, cy - 58, 340, 116, 6);
    card.strokeRoundedRect(cx - 170, cy - 58, 340, 116, 6);
    // Inner accent line at top
    card.lineStyle(1, sc, 0.4);
    card.lineBetween(cx - 155, cy - 46, cx + 155, cy - 46);
    card.setDepth(50);
    card.setScrollFactor(0);

    // Shine label — character color
    const shineLabel = this.scene.add.text(cx, cy - 50, '✦  SHINE STATE  ✦', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: scHex,
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    // Name text — character color
    const nameText = this.scene.add.text(cx, cy - 22, name, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: scHex,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    // Quip text — soft white
    const quipText = this.scene.add.text(cx, cy + 18, `"${quip}"`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#c8d4f0',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    const elements = [card, nameText, quipText, shineLabel];

    // Animate in
    elements.forEach(e => {
      (e as any).setAlpha(0);
      this.scene.tweens.add({
        targets: e,
        alpha: 1,
        y: (e as any).y - 8,
        duration: 200,
        ease: 'Back.easeOut',
      });
    });

    // Hold then fade out
    this.scene.time.delayedCall(TIMING.QUIP_CARD_HOLD_MS, () => {
      elements.forEach(e => {
        this.scene.tweens.add({
          targets: e,
          alpha: 0,
          duration: 200,
          onComplete: () => (e as any).destroy(),
        });
      });
    });
  }

  getCurrentShine(): Teammate | undefined {
    return this.currentShine;
  }

  destroy() {
    this.currentShine?.deactivateShine();
  }
}
