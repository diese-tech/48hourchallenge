export interface WaveEntry {
  wave: number;
  grunts: number;
  harassers: number;
  assassins: number;
  spawnIntervalMs: number; // ms between each enemy spawn in this wave
  nightSpeedMultiplier?: number;
}

export const DAY_WAVES: WaveEntry[] = [
  { wave: 1, grunts: 4, harassers: 0, assassins: 0, spawnIntervalMs: 950 },
  { wave: 2, grunts: 4, harassers: 0, assassins: 0, spawnIntervalMs: 850 },
  { wave: 3, grunts: 5, harassers: 1, assassins: 0, spawnIntervalMs: 820 },
  { wave: 4, grunts: 5, harassers: 1, assassins: 0, spawnIntervalMs: 760 },
  { wave: 5, grunts: 5, harassers: 2, assassins: 1, spawnIntervalMs: 720 },
  { wave: 6, grunts: 5, harassers: 2, assassins: 1, spawnIntervalMs: 680 },
  { wave: 7, grunts: 6, harassers: 3, assassins: 1, spawnIntervalMs: 660 },
  { wave: 8, grunts: 6, harassers: 2, assassins: 1, spawnIntervalMs: 640 },
  { wave: 9, grunts: 6, harassers: 3, assassins: 1, spawnIntervalMs: 610 },
  { wave: 10, grunts: 7, harassers: 3, assassins: 2, spawnIntervalMs: 580 },
];

// Night/endless waves escalate from wave 11+ with steeper scaling.
export function getNightWave(waveNumber: number): WaveEntry {
  const waveOffset = Math.max(0, waveNumber - 11);
  const harassers = Math.min(12, 5 + waveOffset);
  const assassins = Math.min(12, 3 + Math.floor(waveOffset * 1.7));
  const nightSpeedMultiplier = 1.08 + waveOffset * 0.2;

  return {
    wave: waveNumber,
    grunts: 10 + waveOffset * 4,
    harassers,
    assassins,
    spawnIntervalMs: Math.max(120, 400 - waveOffset * 35),
    nightSpeedMultiplier,
  };
}
