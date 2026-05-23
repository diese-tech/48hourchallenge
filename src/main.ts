import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import Boot from './scenes/Boot';
import MainMenu from './scenes/MainMenu';
import Game from './scenes/Game';
import UI from './scenes/UI';
import LevelUp from './scenes/LevelUp';
import GameOver from './scenes/GameOver';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0a14',
  parent: 'app',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Boot, MainMenu, Game, UI, LevelUp, GameOver],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};

new Phaser.Game(config);
