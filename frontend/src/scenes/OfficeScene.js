import Phaser from 'phaser';
import FerretAgent from '../sprites/FerretAgent.js';
import WebSocketClient from '../websocket/WebSocketClient.js';
import agentsConfig from '../config/agents.json';
import DayNightCycle from '../effects/DayNightCycle.js';

const WS_URL = 'ws://localhost:4000';

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

  preload() {
    // Load all Pokémon-style sprite atlases and their corresponding PNGs
    agentsConfig.forEach(agent => {
      const spriteKey = agent.spriteSheetKey;
      this.load.atlas(spriteKey, `assets/sprites/${agent.id}-sprite-pokemon.png`, `assets/sprites/${agent.id}-atlas-pokemon.json`);
    });

    // Load office tilemap assets
    this.load.tilemapTiledJSON('office-map', 'assets/tilemaps/office_map.json');
    // PNG tileset now available (converted from SVG)
    this.load.image('office-tileset', 'assets/tilemaps/office_tileset.png');
  }

  _createTilemap() {
    try {
      const map = this.make.tilemap({ key: 'office-map' });
      const tileset = map.addTilesetImage('office_tileset', 'office-tileset');
      if (!tileset) {
        console.warn('[OfficeScene] Tileset not found, skipping tilemap render');
        return;
      }
      const layer = map.createLayer('Floor', tileset, 0, 0);
      if (layer) {
        layer.setScale(4); // scale up tilemap
        this.tilemapLayer = layer;
      }
    } catch (e) {
      console.error('[OfficeScene] Error creating tilemap:', e.message);
    }
  }

  create() {
    this._createAgentAnimations(); // Use loaded atlases here
    this._createTilemap();
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

  _createAgentAnimations() {
    agentsConfig.forEach((agent) => {
      const spriteKey = agent.spriteSheetKey; // e.g., 'kevin-sprite-pokemon'

      const animationDefinitions = [
        { key: 'idle_default', frames: ['kevin_frame_0', 'kevin_frame_1', 'kevin_frame_2'], frameRate: 5 },
        { key: 'idle_dook', frames: ['kevin_frame_3', 'kevin_frame_4', 'kevin_frame_5'], frameRate: 5 },
        { key: 'move_walk', frames: ['kevin_frame_6', 'kevin_frame_7', 'kevin_frame_8', 'kevin_frame_9'], frameRate: 8 },
        { key: 'working_desk', frames: ['kevin_frame_10', 'kevin_frame_11'], frameRate: 4 },
        { key: 'celebrate_dook', frames: ['kevin_frame_12', 'kevin_frame_13', 'kevin_frame_14'], frameRate: 6 },
        { key: 'anxious_pace', frames: ['kevin_frame_15', 'kevin_frame_16'], frameRate: 4 },
      ];

      animationDefinitions.forEach(animDef => {
        const animKey = `${spriteKey}-${animDef.key}`;
        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: animDef.frames.map(frame => ({ key: spriteKey, frame: frame.replace("kevin", agent.id) })), // Adjust frame names based on agent ID
            frameRate: animDef.frameRate,
            repeat: -1,
          });
        }
      });
    });
  }

  // Removed _generateFerretFrame as it's no longer needed

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
    floor.fillStyle(0x1f2430, 0.3); // semi-transparent to show tilemap
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
