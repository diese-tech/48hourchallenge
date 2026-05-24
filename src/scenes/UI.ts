import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, EVENTS } from '../constants';
import EventBus from '../events';
import type Teammate from '../entities/Teammate';

interface PortraitCard {
  bg: Phaser.GameObjects.Graphics;
  healthBar: Phaser.GameObjects.Graphics;
  nameText: Phaser.GameObjects.Text;
  teammate: Teammate;
}

export default class UI extends Phaser.Scene {
  private portraits: PortraitCard[] = [];
  private timerText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private abilitySlots: Phaser.GameObjects.Container[] = [];
  private abilityTimers: Phaser.GameObjects.Text[] = [];
  private abilityCooldowns: Record<string, number> = { heal: 0, shield: 0, dash: 0, intercept: 0 };
  private abilityKeys = ['heal', 'shield', 'dash', 'intercept'];
  private abilityLabels = ['1\nHEAL', '2\nSHIELD', '3\nDASH', '4\nINTERCEPT'];
  private abilityColors = [COLORS.HEAL_PARTICLE, COLORS.SHIELD_PARTICLE, COLORS.PLAYER, COLORS.WHITE];

  constructor() {
    super({ key: 'UI', active: false });
  }

  create() {
    this.portraits = [];
    this.abilitySlots = [];
    this.abilityTimers = [];

    this.createTopBar();
    this.createAbilityBar();
    this.bindEvents();
  }

  private createTopBar() {
    // Top bar background
    const topBg = this.add.graphics();
    topBg.fillStyle(COLORS.UI_BG, 0.88);
    topBg.fillRect(0, 0, GAME_WIDTH, 56);
    topBg.lineStyle(1, COLORS.UI_BORDER, 0.5);
    topBg.lineBetween(0, 56, GAME_WIDTH, 56);
    topBg.setDepth(30);

    // Portraits will be populated once game_ready fires
    // Timer (centered)
    this.timerText = this.add.text(GAME_WIDTH / 2, 16, '6:00', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#e0e0ff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(31);

    this.waveText = this.add.text(GAME_WIDTH / 2, 42, 'WAVE 1', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#6677aa',
      letterSpacing: 3,
    }).setOrigin(0.5, 0).setDepth(31);

    // XP bar (right-aligned)
    this.xpBar = this.add.graphics();
    this.xpBar.setDepth(31);
    this.drawXPBar(0, 100);

    this.xpText = this.add.text(GAME_WIDTH - 12, 8, 'LVL 1', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#8877ff',
    }).setOrigin(1, 0).setDepth(32);
  }

  private buildPortraits(teammates: Teammate[]) {
    const cardW = 110;
    const cardH = 48;
    const margin = 8;
    const startX = 8;
    const startY = 4;

    teammates.forEach((t, i) => {
      const x = startX + i * (cardW + margin);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.UI_BG, 1);
      bg.lineStyle(1, t.config.color, 0.6);
      bg.fillRoundedRect(x, startY, cardW, cardH, 4);
      bg.strokeRoundedRect(x, startY, cardW, cardH, 4);
      bg.setDepth(31);

      const nameText = this.add.text(x + cardW / 2, startY + 6, t.config.name.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: Phaser.Display.Color.IntegerToColor(t.config.color).rgba,
        letterSpacing: 2,
      }).setOrigin(0.5, 0).setDepth(32);

      const hpBar = this.add.graphics();
      hpBar.setDepth(32);
      this.drawPortraitHP(hpBar, x + 8, startY + 28, cardW - 16, 1.0, t.config.color);

      this.portraits.push({ bg, healthBar: hpBar, nameText, teammate: t });
    });
  }

  private drawPortraitHP(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, frac: number, _color: number) {
    g.clear();
    // Track
    g.fillStyle(0x222233, 1);
    g.fillRoundedRect(x, y, width, 10, 3);
    // Fill
    const hpColor = frac > 0.5 ? COLORS.HEALTH_HIGH : frac > 0.25 ? COLORS.HEALTH_MID : COLORS.HEALTH_LOW;
    g.fillStyle(hpColor, 1);
    g.fillRoundedRect(x, y, Math.max(2, width * frac), 10, 3);
  }

  private createAbilityBar() {
    const slotSize = 64;
    const slotGap = 12;
    const totalW = 4 * slotSize + 3 * slotGap;
    const startX = (GAME_WIDTH - totalW) / 2;
    const y = GAME_HEIGHT - slotSize - 12;

    // Bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.UI_BG, 0.88);
    barBg.lineStyle(1, COLORS.UI_BORDER, 0.4);
    barBg.fillRoundedRect(startX - 12, y - 8, totalW + 24, slotSize + 16, 6);
    barBg.strokeRoundedRect(startX - 12, y - 8, totalW + 24, slotSize + 16, 6);
    barBg.setDepth(30);

    for (let i = 0; i < 4; i++) {
      const sx = startX + i * (slotSize + slotGap);
      const container = this.add.container(sx, y);
      container.setDepth(31);

      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x1a1a2e, 1);
      slotBg.lineStyle(1.5, this.abilityColors[i], 0.5);
      slotBg.fillRoundedRect(0, 0, slotSize, slotSize, 5);
      slotBg.strokeRoundedRect(0, 0, slotSize, slotSize, 5);

      const label = this.add.text(slotSize / 2, slotSize / 2, this.abilityLabels[i], {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: Phaser.Display.Color.IntegerToColor(this.abilityColors[i]).rgba,
        align: 'center',
      }).setOrigin(0.5);

      const cooldownOverlay = this.add.graphics();
      const cooldownTimer = this.add.text(slotSize / 2, slotSize / 2 + 14, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(1);

      container.add([slotBg, label, cooldownOverlay, cooldownTimer]);
      this.abilitySlots.push(container);
      this.abilityTimers.push(cooldownTimer);
    }
  }

  private drawXPBar(current: number, total: number) {
    const barW = 200;
    const x = GAME_WIDTH - barW - 12;
    const y = 14;
    const g = this.xpBar;
    g.clear();
    g.fillStyle(0x222233, 1);
    g.fillRoundedRect(x, y, barW, 10, 3);
    g.fillStyle(COLORS.XP_BAR, 1);
    const frac = Math.min(1, current / Math.max(1, total));
    g.fillRoundedRect(x, y, barW * frac, 10, 3);
    g.lineStyle(1, COLORS.XP_BAR, 0.3);
    g.strokeRoundedRect(x, y, barW, 10, 3);
  }

  private bindEvents() {
    EventBus.on('game_ready', ({ teammates }: { teammates: Teammate[] }) => {
      this.buildPortraits(teammates);
    });

    EventBus.on('day_timer', ({ remaining }: { remaining: number; total: number }) => {
      const seconds = Math.ceil(remaining / 1000);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`);

      // Flash red when under 30s
      if (seconds <= 30 && !this.isNight) {
        this.timerText.setColor(seconds % 2 === 0 ? '#ff4444' : '#e0e0ff');
      }
    });

    EventBus.on(EVENTS.WAVE_START, ({ wave }: { wave: number }) => {
      this.waveText.setText(`WAVE ${wave}`);
      this.waveAnnouncement(wave);
    });

    EventBus.on(EVENTS.XP_GAINED, ({ xp, xpToNext, level }: { xp: number; xpToNext: number; level: number }) => {
      this.drawXPBar(xp, xpToNext);
      this.xpText.setText(`LVL ${level}`);
    });

    EventBus.on(EVENTS.TEAMMATE_DAMAGED, ({ teammate }: { teammate: Teammate }) => {
      this.updatePortrait(teammate);
    });

    EventBus.on(EVENTS.TEAMMATE_HEALED, ({ teammate }: { teammate: Teammate }) => {
      this.updatePortrait(teammate);
    });

    EventBus.on(EVENTS.TEAMMATE_DIED, ({ teammate }: { teammate: Teammate }) => {
      this.updatePortrait(teammate);
      this.flashPortraitDead(teammate);
    });

    EventBus.on(EVENTS.TEAMMATE_SHINE_START, ({ teammate }: { teammate: Teammate }) => {
      this.flashPortraitShine(teammate, true);
    });

    EventBus.on(EVENTS.TEAMMATE_SHINE_END, ({ teammate }: { teammate: Teammate }) => {
      this.flashPortraitShine(teammate, false);
    });

    EventBus.on(EVENTS.PLAYER_CAST, ({ ability }: { ability: string }) => {
      this.trackCooldown(ability);
    });

    EventBus.on(EVENTS.NIGHT_BEGINS, () => {
      this.isNight = true;
      this.timerText.setColor('#8888ff');
      this.timerText.setText('NIGHT');
    });

    EventBus.on(EVENTS.VICTORY, () => {
      this.timerText.setColor('#ffd700');
      this.timerText.setText('ENDLESS');
    });
  }

  private isNight: boolean = false;

  private updatePortrait(teammate: Teammate) {
    const p = this.portraits.find(p => p.teammate === teammate);
    if (!p) return;

    const frac = teammate.hp / teammate.maxHp;
    const cardW = 110;
    const i = this.portraits.indexOf(p);
    const x = 8 + i * (cardW + 8);
    this.drawPortraitHP(p.healthBar, x + 8, 4 + 28, cardW - 16, frac, teammate.config.color);
  }

  private flashPortraitDead(teammate: Teammate) {
    const p = this.portraits.find(p => p.teammate === teammate);
    if (!p) return;
    p.nameText.setColor('#444455');
    this.tweens.add({ targets: p.bg, alpha: 0.4, duration: 300 });
  }

  private flashPortraitShine(teammate: Teammate, active: boolean) {
    const p = this.portraits.find(p => p.teammate === teammate);
    if (!p) return;

    if (active) {
      this.tweens.add({ targets: p.bg, alpha: { from: 1, to: 0.6 }, duration: 400, yoyo: true, repeat: -1 });
      p.nameText.setColor('#ffd700');
    } else {
      this.tweens.killTweensOf(p.bg);
      p.bg.setAlpha(1);
      const col = Phaser.Display.Color.IntegerToColor(teammate.config.color).rgba;
      p.nameText.setColor(col);
    }
  }

  private trackCooldown(ability: string) {
    const idx = this.abilityKeys.indexOf(ability);
    if (idx < 0) return;

    const cdMap: Record<string, number> = {
      heal: 3000,
      shield: 4500,
      dash: 3500,
      intercept: 6000,
    };
    this.abilityCooldowns[ability] = cdMap[ability] || 3000;
  }

  private waveAnnouncement(wave: number) {
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `WAVE ${wave}`, {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#e0e0ff',
      fontStyle: 'bold',
      stroke: '#0a0a14',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(35).setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      y: GAME_HEIGHT / 2 - 80,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.tweens.add({ targets: text, alpha: 0, duration: 300, onComplete: () => text.destroy() });
        });
      },
    });
  }

  update(_time: number, delta: number) {
    // Tick cooldown displays
    for (let i = 0; i < this.abilityKeys.length; i++) {
      const key = this.abilityKeys[i];
      if (this.abilityCooldowns[key] > 0) {
        this.abilityCooldowns[key] = Math.max(0, this.abilityCooldowns[key] - delta);
        const secs = (this.abilityCooldowns[key] / 1000).toFixed(1);
        this.abilityTimers[i]?.setText(this.abilityCooldowns[key] > 0 ? secs : '');

        // Dim the slot
        const container = this.abilitySlots[i];
        container?.setAlpha(this.abilityCooldowns[key] > 0 ? 0.45 : 1);
      }
    }
  }

  shutdown() {
    EventBus.removeAllListeners();
  }
}
