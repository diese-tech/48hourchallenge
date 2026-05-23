import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants';

interface GameOverData {
  wave: number;
  level: number;
  isNight: boolean;
  blessings: string[];
}

export default class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(data: GameOverData) {
    const { wave, level, isNight, blessings } = data;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark overlay
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);

    // Vignette effect
    const vig = this.add.graphics();
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 1, 1, 0, 0);
    vig.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    vig.setAlpha(0.4);
    vig.setDepth(0);

    // Title
    const titleText = isNight ? 'THE NIGHT CLAIMS ALL' : 'YOUR TEAM FELL';
    this.add.text(cx, cy - 170, titleText, {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#cc2244',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      letterSpacing: 3,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.children.list[this.children.list.length - 1],
      alpha: 1,
      duration: 600,
      delay: 200,
    });

    // Stats
    const statsY = cy - 80;
    const stats = [
      `Survived to Wave ${wave}`,
      `Reached Level ${level}`,
      `Blessings chosen: ${blessings.length}`,
      isNight ? 'You faced the night.' : 'The day was not enough.',
    ];

    stats.forEach((s, i) => {
      const t = this.add.text(cx, statsY + i * 36, s, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: i === stats.length - 1 ? '#6677aa' : '#aabbdd',
        fontStyle: i === stats.length - 1 ? 'italic' : 'normal',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: t,
        alpha: 1,
        duration: 400,
        delay: 600 + i * 150,
      });
    });

    // Separator
    const sep = this.add.graphics().setAlpha(0);
    sep.lineStyle(1, COLORS.UI_BORDER, 0.5);
    sep.lineBetween(cx - 200, cy + 60, cx + 200, cy + 60);
    this.tweens.add({ targets: sep, alpha: 1, delay: 1200, duration: 300 });

    // Restart / Main Menu buttons
    const restart = this.add.text(cx - 100, cy + 100, '[ PLAY AGAIN ]', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#4a8fff',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0).setInteractive();

    const menu = this.add.text(cx + 120, cy + 100, '[ MAIN MENU ]', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#6677aa',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0).setInteractive();

    [restart, menu].forEach(t => {
      this.tweens.add({ targets: t, alpha: 1, delay: 1600, duration: 400 });
      t.on('pointerover', () => t.setStyle({ color: '#ffd700' }));
      t.on('pointerout', () => t.setStyle({ color: t === restart ? '#4a8fff' : '#6677aa' }));
    });

    restart.on('pointerdown', () => {
      this.scene.start('Game');
      this.scene.start('UI');
      this.scene.bringToTop('UI');
    });

    menu.on('pointerdown', () => {
      this.scene.start('MainMenu');
    });

    // ENTER to restart
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.start('Game');
      this.scene.start('UI');
      this.scene.bringToTop('UI');
    });

    // Title subtitle
    this.add.text(cx, cy - 120, 'a moba story', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#334455',
      fontStyle: 'italic',
    }).setOrigin(0.5);
  }
}
