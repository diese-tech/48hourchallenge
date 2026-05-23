import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants';
import type { Blessing } from '../data/upgrades';

interface LevelUpData {
  choices: Blessing[];
  level: number;
  onChoose: (b: Blessing) => void;
}

export default class LevelUp extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelUp' });
  }

  create(data: LevelUpData) {
    const { choices, level, onChoose } = data;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dim overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setDepth(0);

    // Header
    this.add.text(cx, cy - 220, `LEVEL ${level}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#6677aa',
      letterSpacing: 6,
    }).setOrigin(0.5).setDepth(1);

    this.add.text(cx, cy - 190, 'CHOOSE A BLESSING', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffd700',
      fontStyle: 'bold',
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(1);

    // Cards
    const cardW = 240;
    const cardH = 180;
    const cardGap = 28;
    const totalW = choices.length * cardW + (choices.length - 1) * cardGap;
    const startX = cx - totalW / 2;

    choices.forEach((b, i) => {
      const cardX = startX + i * (cardW + cardGap);
      const cardY = cy - cardH / 2;

      this.createCard(cardX, cardY, cardW, cardH, b, i, () => {
        onChoose(b);
        this.scene.stop();
      });
    });
  }

  private createCard(x: number, y: number, w: number, h: number, blessing: Blessing, idx: number, onSelect: () => void) {
    const container = this.add.container(x, y + 40).setDepth(2).setAlpha(0);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.UI_BG, 1);
    bg.lineStyle(2, COLORS.UI_BORDER, 0.8);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.strokeRoundedRect(0, 0, w, h, 8);

    const typeTag = this.add.text(w / 2, 14, blessing.type.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: blessing.type === 'passive' ? '#8877ff' : '#42e87a',
      letterSpacing: 4,
    }).setOrigin(0.5, 0);

    const name = this.add.text(w / 2, 36, blessing.name, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    const sep = this.add.graphics();
    sep.lineStyle(1, COLORS.UI_BORDER, 0.4);
    sep.lineBetween(16, 68, w - 16, 68);

    const desc = this.add.text(w / 2, 84, blessing.description, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#aabbdd',
      align: 'center',
      wordWrap: { width: w - 32 },
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    const selectPrompt = this.add.text(w / 2, h - 24, '[ SELECT ]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#4a8fff',
      letterSpacing: 3,
    }).setOrigin(0.5);

    container.add([bg, typeTag, name, sep, desc, selectPrompt]);

    // Animate in
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: y,
      duration: 300,
      delay: idx * 80,
      ease: 'Back.easeOut',
    });

    // Hover
    const hitArea = this.add.graphics().fillStyle(0xffffff, 0.001).fillRect(x, y, w, h).setDepth(3);
    hitArea.setInteractive(new Phaser.Geom.Rectangle(x, y, w, h), Phaser.Geom.Rectangle.Contains);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1a1a44, 1);
      bg.lineStyle(2, COLORS.SHINE_GOLD, 1);
      bg.fillRoundedRect(0, 0, w, h, 8);
      bg.strokeRoundedRect(0, 0, w, h, 8);
      this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 100 });
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.UI_BG, 1);
      bg.lineStyle(2, COLORS.UI_BORDER, 0.8);
      bg.fillRoundedRect(0, 0, w, h, 8);
      bg.strokeRoundedRect(0, 0, w, h, 8);
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });

    hitArea.on('pointerdown', onSelect);

    // Keyboard shortcut (1, 2, 3)
    const keyCode = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
    ][idx];
    if (keyCode) {
      this.input.keyboard!.addKey(keyCode).once('down', onSelect);
    }
  }
}
