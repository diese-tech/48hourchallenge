import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants';

interface GameOverData {
  wave: number;
  level: number;
  isNight: boolean;
  blessings: string[];
  victory?: boolean;
}

export default class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(data: GameOverData) {
    const { wave, level, isNight, blessings, victory } = data;
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
    const titleText = victory
      ? 'ENDLESS MODE COMPLETE'
      : isNight ? 'THE NIGHT CLAIMS ALL' : 'YOUR TEAM FELL';
    const titleColor = victory ? '#ffd700' : '#cc2244';
    this.add.text(cx, cy - 170, titleText, {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: titleColor,
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
      victory
        ? 'You achieved victory and survived endless mode!'
        : isNight ? 'You faced the night.' : 'The day was not enough.',
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
    const restartZone = this.add.zone(cx - 100, cy + 100, 190, 48).setDepth(10).setInteractive({ useHandCursor: true });
    const menuZone = this.add.zone(cx + 120, cy + 100, 180, 48).setDepth(10).setInteractive({ useHandCursor: true });

    const restart = this.add.text(cx - 100, cy + 100, '[ PLAY AGAIN ]', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#4a8fff',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0).setDepth(11);

    const menu = this.add.text(cx + 120, cy + 100, '[ MAIN MENU ]', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#6677aa',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0).setDepth(11);

    [restart, menu].forEach(t => {
      this.tweens.add({ targets: t, alpha: 1, delay: 1600, duration: 400 });
    });

    const playAgain = () => {
      this.scene.stop('UI');
      this.scene.stop('Game');
      this.scene.start('Game');
      this.scene.start('UI');
      this.scene.bringToTop('UI');
    };

    const mainMenu = () => {
      this.scene.stop('UI');
      this.scene.stop('Game');
      this.scene.start('MainMenu');
    };

    restartZone.on('pointerover', () => restart.setStyle({ color: '#ffd700' }));
    restartZone.on('pointerout', () => restart.setStyle({ color: '#4a8fff' }));
    restartZone.on('pointerdown', playAgain);

    menuZone.on('pointerover', () => menu.setStyle({ color: '#ffd700' }));
    menuZone.on('pointerout', () => menu.setStyle({ color: '#6677aa' }));
    menuZone.on('pointerdown', mainMenu);

    restart.setInteractive({ useHandCursor: true }).on('pointerdown', playAgain);
    menu.setInteractive({ useHandCursor: true }).on('pointerdown', mainMenu);

    // ENTER to restart
    this.input.keyboard!.once('keydown-ENTER', playAgain);

    // Title subtitle
    this.add.text(cx, cy - 120, 'a moba story', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#334455',
      fontStyle: 'italic',
    }).setOrigin(0.5);
  }
}
