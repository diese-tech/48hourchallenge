import Phaser from 'phaser';
import { ASSETS, AUDIO } from '../constants';

const SILENT_WAV_DATA_URI = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==';

export default class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    // Phase 1: no external assets — everything is drawn programmatically.
    // In Phase 2, load sprite sheets and audio here using asset key constants.
    // Example:
    //   this.load.spritesheet(ASSETS.SOLO_SHEET, 'assets/solo.png', { frameWidth: 64, frameHeight: 64 });
    //   this.load.audio(ASSETS.SHINE_QUIP_SOLO, 'assets/audio/solo_shine.mp3');

    this.load.image(ASSETS.SUPPORT, 'assets/sprites/support.png');
    this.load.image(ASSETS.SOLO, 'assets/sprites/arthur.png');
    this.load.image(ASSETS.ADC, 'assets/sprites/lyria.png');
    this.load.image(ASSETS.MID, 'assets/sprites/vorax.png');
    this.load.image(ASSETS.JUNGLER, 'assets/sprites/nyx.png');
    this.load.image(ASSETS.GRUNT, 'assets/sprites/grunt.png');
    this.load.image(ASSETS.HARASSER, 'assets/sprites/harasser.png');
    this.load.image(ASSETS.ASSASSIN, 'assets/sprites/assassin.png');

    for (const key of Object.values(AUDIO)) {
      this.load.audio(key, SILENT_WAV_DATA_URI);
    }

    // Create a minimal loading bar in case future assets are heavy
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    bar.fillStyle(0x3344aa, 1);
    bar.fillRect(width * 0.3, height * 0.5 - 4, width * 0.4, 8);

    this.load.on('progress', (v: number) => {
      bar.clear();
      bar.fillStyle(0x3344aa, 1);
      bar.fillRect(width * 0.3, height * 0.5 - 4, width * 0.4 * v, 8);
    });
  }

  create() {
    this.scene.start('MainMenu');
  }
}
