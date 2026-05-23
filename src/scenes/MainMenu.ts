import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants';

export default class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, COLORS.BACKGROUND);

    // Ambient particle field
    const particles = this.add.particles(0, 0, undefined, {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 0, max: GAME_HEIGHT },
      lifespan: { min: 3000, max: 6000 },
      speedX: { min: -20, max: 20 },
      speedY: { min: -15, max: 15 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [COLORS.SHINE_GOLD, COLORS.XP_BAR, COLORS.MID, COLORS.HEAL_PARTICLE],
      frequency: 120,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
    });
    particles.setDepth(0);

    // Grid overlay (brutalist aesthetic)
    const grid = this.add.graphics();
    grid.lineStyle(1, COLORS.UI_BORDER, 0.08);
    for (let x = 0; x < GAME_WIDTH; x += 64) {
      grid.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 64) {
      grid.lineBetween(0, y, GAME_WIDTH, y);
    }
    grid.setDepth(1);

    // Title
    this.add.text(cx, cy - 130, 'I DIED AND WOKE UP A', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#aabbdd',
      letterSpacing: 8,
    }).setOrigin(0.5).setDepth(2);

    this.add.text(cx, cy - 90, 'SUPPORT MAIN', {
      fontFamily: 'monospace',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#f5e642',
      stroke: '#0a0a14',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2);

    this.add.text(cx, cy - 30, 'a moba story', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#6677aa',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(2);

    // Separator
    const sep = this.add.graphics();
    sep.lineStyle(1, COLORS.UI_BORDER, 0.6);
    sep.lineBetween(cx - 300, cy + 10, cx + 300, cy + 10);
    sep.setDepth(2);

    // Instructions brief
    this.add.text(cx, cy + 50, 'WASD  —  Move\n1·2·3·4  —  Abilities\nESC  —  Pause', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8899bb',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5).setDepth(2);

    // Start prompt (pulsing)
    const startText = this.add.text(cx, cy + 160, '[ PRESS ENTER OR CLICK TO BEGIN ]', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#e0e0ff',
      letterSpacing: 3,
    }).setOrigin(0.5).setDepth(2);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Input
    const startGame = () => {
      this.scene.start('Game');
      this.scene.start('UI');
      this.scene.bringToTop('UI');
    };

    this.input.keyboard!.once('keydown-ENTER', startGame);
    this.input.once('pointerdown', startGame);
  }
}
