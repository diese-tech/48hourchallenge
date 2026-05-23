import { BALANCE, EVENTS } from '../constants';
import EventBus from '../events';

export default class XPSystem {
  xp: number = 0;
  xpToNext: number = BALANCE.XP_PER_LEVEL;
  level: number = 1;
  blessingCount: number = 0;
  xpMultiplier: number = 1;

  constructor() {
    EventBus.on(EVENTS.ENEMY_DIED, ({ xp }: { xp: number }) => {
      this.addXP(xp);
    });
  }

  addXP(amount: number) {
    this.xp += Math.round(amount * this.xpMultiplier);
    EventBus.emit(EVENTS.XP_GAINED, { xp: this.xp, xpToNext: this.xpToNext, level: this.level });

    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.xpToNext = Math.round(this.xpToNext * 1.3); // scaling cost
      this.level++;
      EventBus.emit(EVENTS.LEVEL_UP, { level: this.level });
    }
  }

  addSupportXP(action: 'heal' | 'shield' | 'intercept') {
    const xpMap = {
      heal: BALANCE.XP_PER_HEAL,
      shield: BALANCE.XP_PER_SHIELD,
      intercept: BALANCE.XP_PER_INTERCEPT,
    };
    this.addXP(xpMap[action]);
  }

  canChooseBlessing(): boolean {
    return this.blessingCount < BALANCE.MAX_BLESSINGS;
  }

  recordBlessingChosen() {
    this.blessingCount++;
  }

  destroy() {
    EventBus.off(EVENTS.ENEMY_DIED);
  }
}
