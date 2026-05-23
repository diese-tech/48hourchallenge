export interface WaveEntry {
  wave: number;
  grunts: number;
  harassers: number;
  assassins: number;
  spawnIntervalMs: number; // ms between each enemy spawn in this wave
}

export const DAY_WAVES: WaveEntry[] = [
  { wave: 1, grunts: 4, harassers: 0, assassins: 0, spawnIntervalMs: 600 },
  { wave: 2, grunts: 5, harassers: 0, assassins: 0, spawnIntervalMs: 500 },
  { wave: 3, grunts: 5, harassers: 2, assassins: 0, spawnIntervalMs: 450 },
  { wave: 4, grunts: 6, harassers: 2, assassins: 0, spawnIntervalMs: 400 },
  { wave: 5, grunts: 6, harassers: 3, assassins: 1, spawnIntervalMs: 380 },
  { wave: 6, grunts: 7, harassers: 3, assassins: 2, spawnIntervalMs: 350 },
  { wave: 7, grunts: 8, harassers: 4, assassins: 2, spawnIntervalMs: 320 },
  { wave: 8, grunts: 9, harassers: 4, assassins: 3, spawnIntervalMs: 300 },
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
  const extra = waveNumber - 9;
  return {
    wave: waveNumber,
    grunts: NIGHT_WAVE_BASE.grunts + extra * 2,
    harassers: NIGHT_WAVE_BASE.harassers + extra,
    assassins: NIGHT_WAVE_BASE.assassins + Math.floor(extra * 0.5),
    spawnIntervalMs: Math.max(150, NIGHT_WAVE_BASE.spawnIntervalMs - extra * 10),
  };
}
