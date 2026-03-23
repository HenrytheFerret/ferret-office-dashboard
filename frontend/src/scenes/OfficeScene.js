import Phaser from 'phaser';
import FerretAgent from '../sprites/FerretAgent.js';
import WebSocketClient from '../websocket/WebSocketClient.js';
import agentsConfig from '../config/agents.json';
import DayNightCycle from '../effects/DayNightCycle.js';

const WS_URL = 'ws://localhost:4000';

const PALETTES = {
  kevin: { fur: 0x7aa2f7, accent: 0x3d59a1, ear: 0xcdd6f4 },
  alex: { fur: 0xf5a97f, accent: 0xc65d32, ear: 0xf9e2af },
  jordan: { fur: 0xf5bde6, accent: 0xc678dd, ear: 0xf2cdcd },
  milo: { fur: 0x94e2d5, accent: 0x2d8f74, ear: 0xd9f0d8 },
  riley: { fur: 0xcba6f7, accent: 0x8b5cf6, ear: 0xe9d5ff },
  casey: { fur: 0xf9e2af, accent: 0xd4a017, ear: 0xfef3c7 },
  sam: { fur: 0x89dceb, accent: 0x3a86a8, ear: 0xd6f4ff },
  quinn: { fur: 0xf38ba8, accent: 0xbe4b6c, ear: 0xfad3dc },
  default: { fur: 0xcdd6f4, accent: 0x6c7086, ear: 0xffffff },
};

const STATUS_PANEL_COPY = {
  connected: '🟢 Live backend connected',
  offline: '🟡 Demo mode — backend offline',
};

export default class OfficeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OfficeScene' });
    this.agents = {};
    this.wsClient = null;
    this.wsConnected = false;
    this.statusText = null;
    this.dayNightCycle = null;
    this.demoIndex = 0;
    this.demoTimer = 0;
  }

  preload() {}

  create() {
    this._createAgentTexturesAndAnimations();
    this._drawOfficeLayout();
    this._spawnAgentsFromConfig();
    this._setupUI();
    this._setupWebSocket();
    this._setupDayNightCycle();
    this._startDemoSequence();
  }

  update(_time, delta) {
    if (this.dayNightCycle) {
      this.dayNightCycle.update(delta);
    }

    Object.values(this.agents).forEach((agent) => agent.update(delta));

    if (!this.wsConnected) {
      this._updateDemoSequence(delta);
    }
  }

  _createAgentTexturesAndAnimations() {
    agentsConfig.forEach((agent) => {
      const palette = PALETTES[agent.id] || PALETTES.default;
      const defs = [
        ['idle_default', 3],
        ['idle_dook', 3],
        ['move_walk', 4],
        ['working_desk', 2],
        ['celebrate_dook', 3],
        ['anxious_pace', 2],
      ];

      defs.forEach(([anim, count]) => {
        const frames = [];
        for (let i = 0; i < count; i += 1) {
          const key = `${agent.id}-${anim}-${i}`;
          if (!this.textures.exists(key)) {
            this._generateFerretFrame(key, palette, anim, i);
          }
          frames.push({ key });
        }

        const animKey = `${agent.id}-${anim}`;
        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames,
            frameRate: anim === 'move_walk' ? 8 : 5,
            repeat: -1,
          });
        }
      });
    });
  }

  _generateFerretFrame(textureKey, palette, animation, frameIndex) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const fur = palette.fur;
    const accent = palette.accent;
    const ear = palette.ear;
    const ox = 16;
    const oy = 16;

    const walkShift = animation === 'move_walk' ? [-2, 0, 2, 0][frameIndex] : 0;
    const hopShift = (animation === 'idle_dook' || animation === 'celebrate_dook') ? (frameIndex % 2 === 0 ? -2 : 0) : 0;
    const anxiousShift = animation === 'anxious_pace' ? (frameIndex % 2 === 0 ? -2 : 2) : 0;
    const workShift = animation === 'working_desk' ? 2 : 0;
    const dx = walkShift + anxiousShift;
    const dy = hopShift + workShift;

    const bodyX = ox + dx;
    const bodyY = oy + 2 + dy;

    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(16, 26, 16, 6);

    if (animation === 'working_desk') {
      g.fillStyle(0x6b513d, 1);
      g.fillRoundedRect(5, 21, 22, 5, 2);
      g.fillStyle(0x89b4fa, 0.9);
      g.fillRoundedRect(8, 14, 16, 7, 2);
    }

    g.fillStyle(accent, 1);
    g.fillEllipse(bodyX + 8, bodyY + 2, 10, 5); // tail

    g.fillStyle(fur, 1);
    g.fillEllipse(bodyX, bodyY + 2, 16, 11); // body
    g.fillEllipse(bodyX + 1, bodyY - 7, 12, 10); // head

    g.fillStyle(ear, 1);
    g.fillTriangle(bodyX - 3, bodyY - 10, bodyX - 6, bodyY - 15, bodyX - 1, bodyY - 12);
    g.fillTriangle(bodyX + 4, bodyY - 11, bodyX + 8, bodyY - 15, bodyX + 6, bodyY - 10);

    g.fillStyle(0xf2d5cf, 1);
    g.fillEllipse(bodyX + 2, bodyY + 4, 7, 5); // belly

    g.fillStyle(0x11111b, 1);
    g.fillCircle(bodyX - 1, bodyY - 8, 1.1);
    g.fillCircle(bodyX + 4, bodyY - 8, 1.1);
    g.fillCircle(bodyX + 1.5, bodyY - 5.5, 1);

    g.lineStyle(2, accent, 1);
    g.beginPath();
    g.moveTo(bodyX - 4, bodyY + 8);
    g.lineTo(bodyX - 2 + (walkShift ? 1 : 0), bodyY + 10);
    g.moveTo(bodyX + 1, bodyY + 8);
    g.lineTo(bodyX + 3 - (walkShift ? 1 : 0), bodyY + 10);
    g.strokePath();

    if (animation === 'celebrate_dook') {
      g.lineStyle(1.5, 0xf9e2af, 1);
      g.strokeLineShape(new Phaser.Geom.Line(bodyX - 8, bodyY - 18, bodyX - 10, bodyY - 22));
      g.strokeLineShape(new Phaser.Geom.Line(bodyX + 9, bodyY - 18, bodyX + 11, bodyY - 22));
    }

    if (animation === 'anxious_pace') {
      g.lineStyle(1, 0xcdd6f4, 0.9);
      g.strokeArc(bodyX + 10, bodyY - 11, 3, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
    }

    g.generateTexture(textureKey, 32, 32);
    g.destroy();
  }

  _drawOfficeLayout() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x11111b, 0x11111b, 0x181825, 0x1e1e2e, 1);
    bg.fillRect(0, 0, width, height);

    const glow = this.add.graphics();
    glow.fillStyle(0x89b4fa, 0.06);
    glow.fillEllipse(width * 0.25, 90, 280, 120);
    glow.fillStyle(0xf5c2e7, 0.04);
    glow.fillEllipse(width * 0.75, 110, 300, 140);

    const floor = this.add.graphics();
    floor.fillStyle(0x1f2430, 1);
    floor.fillRoundedRect(36, 72, width - 72, height - 128, 24);
    floor.lineStyle(2, 0x313244, 1);
    floor.strokeRoundedRect(36, 72, width - 72, height - 128, 24);

    for (let x = 56; x < width - 56; x += 48) {
      floor.lineStyle(1, 0x24273a, 0.45);
      floor.lineBetween(x, 88, x, height - 72);
    }
    for (let y = 92; y < height - 72; y += 48) {
      floor.lineStyle(1, 0x24273a, 0.35);
      floor.lineBetween(52, y, width - 52, y);
    }

    this._drawZoneCard(width - 270, 92, 210, 116, 'MEETING ROOM', 0xcba6f7);
    this._drawZoneCard(62, height - 170, 190, 92, 'KITCHEN', 0xa6e3a1);
    this._drawZoneCard(width - 250, height - 170, 190, 92, 'HOARD CORNER', 0xf9e2af);

    this.add.text(width / 2, 28, 'FERRET OFFICE DASHBOARD', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '26px',
      color: '#f5e0dc',
      fontStyle: '700',
      letterSpacing: 2,
    }).setOrigin(0.5, 0);

    this.add.text(width / 2, 56, 'Live ferret activity • polished office view • cohesive status presence', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: '#bac2de',
    }).setOrigin(0.5, 0);

    agentsConfig.forEach((agent) => this._drawDesk(agent));
  }

  _drawZoneCard(x, y, w, h, label, accent) {
    const g = this.add.graphics();
    g.fillStyle(0x181825, 0.88);
    g.fillRoundedRect(x, y, w, h, 18);
    g.lineStyle(2, accent, 0.85);
    g.strokeRoundedRect(x, y, w, h, 18);
    g.fillStyle(accent, 0.08);
    g.fillRoundedRect(x + 8, y + 8, w - 16, h - 16, 14);

    this.add.text(x + 14, y + 12, label, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: '#f5e0dc',
      fontStyle: '700',
    });
  }

  _drawDesk(agent) {
    const { x, y } = agent.deskPosition;
    const desk = this.add.graphics();
    desk.fillStyle(0x6b513d, 1);
    desk.fillRoundedRect(x - 28, y - 14, 56, 28, 8);
    desk.lineStyle(2, 0x8c6d52, 1);
    desk.strokeRoundedRect(x - 28, y - 14, 56, 28, 8);

    desk.fillStyle(0x89b4fa, 0.9);
    desk.fillRoundedRect(x - 10, y - 24, 20, 12, 3);
    desk.fillStyle(0x313244, 1);
    desk.fillRect(x - 2, y - 12, 4, 5);

    desk.fillStyle(0x45475a, 1);
    desk.fillCircle(x - 18, y + 2, 3);
    desk.fillCircle(x + 18, y + 2, 3);
  }

  _spawnAgentsFromConfig() {
    agentsConfig.forEach((cfg) => {
      const agent = new FerretAgent(this, cfg);
      this.agents[cfg.id] = agent;
    });
  }

  _setupUI() {
    const { width, height } = this.scale;

    const panel = this.add.graphics();
    panel.fillStyle(0x181825, 0.9);
    panel.fillRoundedRect(width - 318, height - 126, 286, 86, 18);
    panel.lineStyle(2, 0x313244, 1);
    panel.strokeRoundedRect(width - 318, height - 126, 286, 86, 18);

    this.statusText = this.add.text(width - 300, height - 112, 'Connecting to backend…', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: '#cdd6f4',
      wordWrap: { width: 250 },
    });

    this.clockText = this.add.text(width - 300, height - 78, 'Office time: --:--', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: '#f5e0dc',
    });

    this.add.text(52, height - 42, `Agents loaded: ${agentsConfig.length}`, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: '#a6adc8',
    });
  }

  _setupWebSocket() {
    this.wsClient = new WebSocketClient(WS_URL, this, {
      onOpen: () => {
        this.wsConnected = true;
        this._setStatus(STATUS_PANEL_COPY.connected);
      },
      onClose: () => {
        this.wsConnected = false;
        this._setStatus(STATUS_PANEL_COPY.offline);
      },
      onError: () => {
        this.wsConnected = false;
        this._setStatus(STATUS_PANEL_COPY.offline);
      },
    });

    this.events.on('agentStatusUpdate', this._handleAgentStatusUpdate, this);
    this.events.on('officeEvent', this._handleOfficeEvent, this);
    this.wsClient.connect();
  }

  _setupDayNightCycle() {
    this.dayNightCycle = new DayNightCycle(this, {
      cycleDuration: 120000,
      startTime: 9,
      onTimeChange: (_time, phase) => {
        if (this.clockText) {
          this.clockText.setText(`Office time: ${this.dayNightCycle.getTimeString()} • ${phase}`);
        }
      },
    });
  }

  _handleAgentStatusUpdate(payload) {
    const { agentId, status, currentTask, position, animation } = payload;
    const agent = this.agents[agentId];
    if (!agent) return;
    agent.updateStatus(status, position, animation, currentTask);
  }

  _handleOfficeEvent(payload) {
    const { eventType, details = {} } = payload;

    if (eventType === 'celebration_sync') {
      Object.values(this.agents).forEach((agent) => agent.updateStatus('celebrating'));
      return;
    }

    if (eventType === 'alarm_bell_ring' && details.agentId && this.agents[details.agentId]) {
      this.agents[details.agentId].updateStatus('blocked', null, null, details.message || 'Blocked');
    }
  }

  _startDemoSequence() {
    Object.values(this.agents).forEach((agent) => agent.updateStatus('idle'));
  }

  _updateDemoSequence(delta) {
    const steps = [
      () => {
        this.agents.kevin?.updateStatus('working', this.agents.kevin.getDeskPosition(), null, 'Architecture review');
        this.agents.alex?.updateStatus('working', this.agents.alex.getDeskPosition(), null, 'Frontend logic');
      },
      () => {
        this.agents.jordan?.updateStatus('working', this.agents.jordan.getDeskPosition(), null, 'Visual polish');
        this.agents.milo?.updateStatus('working', this.agents.milo.getDeskPosition(), null, 'WebSocket sync');
      },
      () => {
        this.agents.casey?.updateStatus('blocked', null, null, 'Waiting for fix');
      },
      () => {
        this.agents.casey?.updateStatus('idle', null, null, '');
        this.agents.quinn?.updateStatus('in_meeting', { x: this.scale.width - 170, y: 150 }, null, 'Project review');
      },
      () => {
        Object.values(this.agents).forEach((agent) => agent.updateStatus('celebrating', null, null, ''));
      },
      () => {
        this.agents.quinn?.updateStatus('idle', this.agents.quinn.getDeskPosition(), null, '');
        Object.values(this.agents).forEach((agent) => agent.updateStatus('idle', agent.getDeskPosition(), null, ''));
      },
    ];

    this.demoTimer += delta;
    if (this.demoTimer < 2400) return;

    this.demoTimer = 0;
    steps[this.demoIndex % steps.length]();
    this.demoIndex += 1;
  }

  _setStatus(text) {
    if (this.statusText) {
      this.statusText.setText(text);
    }
  }
}
