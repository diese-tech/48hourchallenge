export interface WaveEntry {
  wave: number;
  grunts: number;
  harassers: number;
  assassins: number;
  spawnIntervalMs: number; // ms between each enemy spawn in this wave
  nightSpeedMultiplier?: number;
}

export const DAY_WAVES: WaveEntry[] = [
  { wave: 1, grunts: 3, harassers: 0, assassins: 0, spawnIntervalMs: 1000 },
  { wave: 2, grunts: 4, harassers: 0, assassins: 0, spawnIntervalMs: 900 },
  { wave: 3, grunts: 4, harassers: 1, assassins: 0, spawnIntervalMs: 850 },
  { wave: 4, grunts: 5, harassers: 1, assassins: 0, spawnIntervalMs: 800 },
  { wave: 5, grunts: 4, harassers: 2, assassins: 1, spawnIntervalMs: 750 },
  { wave: 6, grunts: 5, harassers: 2, assassins: 1, spawnIntervalMs: 700 },
  { wave: 7, grunts: 5, harassers: 3, assassins: 1, spawnIntervalMs: 650 },
  { wave: 8, grunts: 6, harassers: 3, assassins: 2, spawnIntervalMs: 600 },
  { wave: 9, grunts: 7, harassers: 3, assassins: 2, spawnIntervalMs: 550 },
  { wave: 10, grunts: 8, harassers: 4, assassins: 3, spawnIntervalMs: 500 },
];

// Night/endless waves escalate from wave 11+ with steeper scaling.
export function getNightWave(waveNumber: number): WaveEntry {
  const waveOffset = Math.max(0, waveNumber - 11);
  const harassers = Math.min(10, 4 + waveOffset);
  const assassins = Math.min(10, 3 + Math.floor(waveOffset * 1.5));
  const nightSpeedMultiplier = 1 + waveOffset * 0.18;

  return {
    wave: waveNumber,
    grunts: 8 + waveOffset * 3,
    harassers,
    assassins,
    spawnIntervalMs: Math.max(150, 450 - waveOffset * 30),
    nightSpeedMultiplier,
  };
}
