export interface WaveEntry {
  wave: number;
  grunts: number;
  harassers: number;
  assassins: number;
  spawnIntervalMs: number; // ms between each enemy spawn in this wave
}

export const DAY_WAVES: WaveEntry[] = [
  { wave: 1, grunts: 4, harassers: 0, assassins: 0, spawnIntervalMs: 900 },
  { wave: 2, grunts: 6, harassers: 0, assassins: 0, spawnIntervalMs: 750 },
  { wave: 3, grunts: 6, harassers: 1, assassins: 0, spawnIntervalMs: 700 },
  { wave: 4, grunts: 7, harassers: 2, assassins: 0, spawnIntervalMs: 650 },
  { wave: 5, grunts: 6, harassers: 2, assassins: 1, spawnIntervalMs: 600 },
  { wave: 6, grunts: 7, harassers: 2, assassins: 2, spawnIntervalMs: 550 },
  { wave: 7, grunts: 8, harassers: 3, assassins: 2, spawnIntervalMs: 500 },
  { wave: 8, grunts: 10, harassers: 3, assassins: 3, spawnIntervalMs: 420 },
  // Wave 9+ = night waves that loop
];

// Night waves — escalate infinitely by applying multipliers to this template
export const NIGHT_WAVE_BASE: Omit<WaveEntry, 'wave'> = {
  grunts: 10,
  harassers: 5,
  assassins: 4,
  spawnIntervalMs: 280,
};

export function getNightWave(waveNumber: number): WaveEntry {
  const waveOffset = Math.max(0, waveNumber - 9);
  const harassers = Math.min(8, 3 + waveOffset);
  const assassins = Math.min(8, 3 + Math.floor(waveOffset * 1.5));

  return {
    wave: waveNumber,
    grunts: 8 + waveOffset * 3,
    harassers,
    assassins,
    spawnIntervalMs: Math.max(150, 400 - waveOffset * 25),
  };
}
