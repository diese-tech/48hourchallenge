import Phaser from 'phaser';
import { EVENTS, GAME_WIDTH, GROUND_Y } from '../constants';
import EventBus from '../events';
import Grunt from '../entities/enemies/Grunt';
import Harasser from '../entities/enemies/Harasser';
import Assassin from '../entities/enemies/Assassin';
import Enemy from '../entities/Enemy';
import { DAY_WAVES, getNightWave } from '../data/waves';
import type { WaveEntry } from '../data/waves';

export default class WaveSystem {
  private scene: Phaser.Scene;
  private enemies: Enemy[] = [];
  private waveNumber: number = 0;
  private state: 'IDLE' | 'SPAWNING' | 'COMBAT' | 'LULL' = 'IDLE';
  private lullTimer: number = 0;
  private spawnQueue: string[] = [];
  private spawnTimer: number = 0;
  private currentSpawnInterval: number = 500;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    EventBus.on(EVENTS.NIGHT_BEGINS, () => { /* night mode handled externally */ });
  }

  start() {
    this.nextWave();
  }

  nextWave() {
    this.waveNumber++;
    const def = this.getWaveDef(this.waveNumber);
    this.buildSpawnQueue(def);
    this.currentSpawnInterval = def.spawnIntervalMs;
    this.spawnTimer = 0;
    this.state = 'SPAWNING';

    EventBus.emit(EVENTS.WAVE_START, { wave: this.waveNumber });
  }

  private getWaveDef(wave: number): WaveEntry {
    if (wave <= DAY_WAVES.length) return DAY_WAVES[wave - 1];
    return getNightWave(wave);
  }

  private buildSpawnQueue(def: WaveEntry) {
    const q: string[] = [];
    for (let i = 0; i < def.grunts; i++) q.push('grunt');
    for (let i = 0; i < def.harassers; i++) q.push('harasser');
    for (let i = 0; i < def.assassins; i++) q.push('assassin');
    // Shuffle
    this.spawnQueue = q.sort(() => Math.random() - 0.5);
  }

  update(delta: number) {
    // Clean dead enemies
    this.enemies = this.enemies.filter(e => e.active);

    switch (this.state) {
      case 'SPAWNING':
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.currentSpawnInterval && this.spawnQueue.length > 0) {
          this.spawnTimer = 0;
          this.spawnNext();
          if (this.spawnQueue.length === 0) {
            this.state = 'COMBAT';
          }
        }
        break;

      case 'COMBAT':
        if (this.enemies.length === 0) {
          this.state = 'LULL';
          this.lullTimer = 0;
          EventBus.emit(EVENTS.WAVE_CLEAR, { wave: this.waveNumber });
        }
        break;

      case 'LULL':
        this.lullTimer += delta;
        if (this.lullTimer >= 4000) {
          this.nextWave();
        }
        break;
    }
  }

  private spawnNext() {
    const type = this.spawnQueue.shift()!;
    const pos = this.randomSpawnPosition();
    let enemy: Enemy;

    switch (type) {
      case 'grunt':
        enemy = new Grunt(this.scene, pos.x, pos.y);
        break;
      case 'harasser':
        enemy = new Harasser(this.scene, pos.x, pos.y);
        break;
      case 'assassin':
        enemy = new Assassin(this.scene, pos.x, pos.y);
        break;
      default:
        return;
    }

    this.enemies.push(enemy);
  }

  private randomSpawnPosition(): { x: number; y: number } {
    // All enemies march in from the right, staggered along the ground line
    const yVariance = 30;
    return {
      x: GAME_WIDTH + 30 + Math.random() * 60,
      y: GROUND_Y + (Math.random() * yVariance * 2 - yVariance),
    };
  }

  getEnemies(): Enemy[] {
    return this.enemies.filter(e => e.active);
  }

  getWaveNumber(): number {
    return this.waveNumber;
  }

  getState() {
    return this.state;
  }

  destroy() {
    EventBus.off(EVENTS.NIGHT_BEGINS);
  }
}
