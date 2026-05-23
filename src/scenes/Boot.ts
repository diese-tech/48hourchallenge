import Phaser from 'phaser';
import { AUDIO } from '../constants';

const SILENT_WAV_DATA_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

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
