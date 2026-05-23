export interface Blessing {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'auto';
  apply: (state: any) => void; // applied to game state
}

export const ALL_BLESSINGS: Blessing[] = [
  {
    id: 'flash_heal',
    name: 'Flash Heal',
    description: 'Heal becomes instant burst.\n-30% cooldown.',
    type: 'passive',
    apply: (state) => {
      state.healAmount = Math.round(state.healAmount * 1.25);
      state.healCooldown = Math.round(state.healCooldown * 0.7);
    },
  },
  {
    id: 'barrier_protocol',
    name: 'Barrier Protocol',
    description: 'Shield absorbs 50% more.',
    type: 'passive',
    apply: (state) => {
      state.shieldAmount = Math.round(state.shieldAmount * 1.5);
    },
  },
  {
    id: 'rally_aura',
    name: 'Rally Aura',
    description: '+15% XP from teammate kills\nwhen near them.',
    type: 'passive',
    apply: (state) => {
      state.xpMultiplier = (state.xpMultiplier || 1) * 1.15;
    },
  },
  {
    id: 'aegis_step',
    name: 'Aegis Step',
    description: 'Dash leaves a brief\ndamage-immune trail.',
    type: 'passive',
    apply: (state) => {
      state.dashImmune = true;
    },
  },
  {
    id: 'triage_rush',
    name: 'Triage Rush',
    description: 'Auto-heal any teammate\nat 20% HP.',
    type: 'auto',
    apply: (state) => {
      state.triageRush = true;
    },
  },
  {
    id: 'shine_sync',
    name: 'Shine Sync',
    description: 'Buffing the Shine State ally\nresets 1 random cooldown.',
    type: 'passive',
    apply: (state) => {
      state.shineSync = true;
    },
  },
  {
    id: 'overclock',
    name: 'Overclock',
    description: 'All cooldowns -20%.',
    type: 'passive',
    apply: (state) => {
      state.healCooldown = Math.round(state.healCooldown * 0.8);
      state.shieldCooldown = Math.round(state.shieldCooldown * 0.8);
      state.dashCooldown = Math.round(state.dashCooldown * 0.8);
      state.interceptCooldown = Math.round(state.interceptCooldown * 0.8);
    },
  },
  {
    id: 'martyrs_grace',
    name: "Martyr's Grace",
    description: 'Taking damage grants\n1 shield charge.',
    type: 'passive',
    apply: (state) => {
      state.martyrsGrace = true;
    },
  },
  {
    id: 'last_light',
    name: 'Last Light',
    description: 'Once per run: revive one\nfallen ally at 50% HP.',
    type: 'auto',
    apply: (state) => {
      state.lastLight = true;
    },
  },
];

export function drawBlessingChoices(pool: Blessing[], count: number = 3): Blessing[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
