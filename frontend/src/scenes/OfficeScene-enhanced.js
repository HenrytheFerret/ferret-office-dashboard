/**
 * OfficeScene Enhanced - TASK-009 Visual Polish Pass
 * 
 * Improvements:
 * - Better UI styling and hierarchy
 * - Enhanced visual theming
 * - Cohesive color palette
 * - Improved status indicators
 * - Polished animations and transitions
 */

import Phaser from 'phaser';
import FerretAgent from '../sprites/FerretAgent.js';
import WebSocketClient from '../websocket/WebSocketClient.js';
import agentsConfig from '../config/agents.json';
import DayNightCycle from '../effects/DayNightCycle.js';
import AssetLoader from '../assets/AssetLoader.js';

const WS_URL = 'ws://localhost:4000';

// Cohesive color palette for enhanced polish
const COLOR_PALETTE = {
  background_dark: '#0f0f1e',
  background_light: '#1e1e2e',
  accent_primary: '#89b4fa',    // Blue
  accent_secondary: '#f5c2e7',  // Pink
  accent_tertiary: '#a6e3a1',   // Green
  text_primary: '#f5e0dc',      // Cream
  text_secondary: '#bac2de',    // Lavender
  border: '#313244',            // Dark border
  border_light: '#45475a',      // Light border
  status_idle: '#a6adc8',       // Gray
  status_working: '#89dceb',    // Cyan
  status_blocked: '#f38ba8',    // Red
  status_celebrating: '#f9e2af', // Yellow
  status_meeting: '#cba6f7',    // Purple
};

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

export default class OfficeSceneEnhanced extends Phaser.Scene {
  constructor() {
    super({ key: 'OfficeScene' });
    this.agents = {};
    this.wsClient = null;
    this.wsConnected = false;
    this.statusText = null;
    this.clockText = null;
    this.dayNightCycle = null;
    this.demoIndex = 0;
    this.demoTimer = 0;
  }

  preload() {
    // Load enhanced assets
    AssetLoader.preloadSpriteAtlases(this);
    AssetLoader.preloadTilemap(this);
    AssetLoader.loadAgentConfig(this);
  }

  create() {
    // Check asset availability
    const assetStatus = AssetLoader.getAssetStatus(this);
    
    this._createAgentTexturesAndAnimations();
    this._drawOfficeLayoutEnhanced();
    this._spawnAgentsFromConfig();
    this._setupUIEnhanced();
    this._setupWebSocket();
    this._setupDayNightCycle();
    this._startDemoSequence();
    
    console.log('[OfficeScene] Scene created with enhanced styling');
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

  /**
   * Create procedural ferret textures with improved aesthetics
   */
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
            this._generateFerretFrameEnhanced(key, palette, anim, i);
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

  /**
   * Enhanced ferret frame generation with better detail
   */
  _generateFerretFrameEnhanced(textureKey, palette, animation, frameIndex) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const fur = palette.fur;
    const accent = palette.accent;
    const ear = palette.ear;
    const ox = 16;
    const oy = 16;

    // Animation offsets
    const walkShift = animation === 'move_walk' ? [-2, 0, 2, 0][frameIndex] : 0;
    const hopShift = (animation === 'idle_dook' || animation === 'celebrate_dook') ? (frameIndex % 2 === 0 ? -2 : 0) : 0;
    const anxiousShift = animation === 'anxious_pace' ? (frameIndex % 2 === 0 ? -2 : 2) : 0;
    const workShift = animation === 'working_desk' ? 2 : 0;
    const dx = walkShift + anxiousShift;
    const dy = hopShift + workShift;

    const bodyX = ox + dx;
    const bodyY = oy + 2 + dy;

    // Enhanced shadow with gradient
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(16, 26, 18, 7);

    // Working desk context
    if (animation === 'working_desk') {
      g.fillStyle(0x6b513d, 1);
      g.fillRoundedRect(4, 20, 24, 6, 2);
      g.lineStyle(1, 0x8c6d52, 0.8);
      g.strokeRoundedRect(4, 20, 24, 6, 2);
      
      g.fillStyle(0x89b4fa, 0.95);
      g.fillRoundedRect(7, 13, 18, 8, 2);
      g.lineStyle(1, 0x3d59a1, 0.6);
      g.strokeRoundedRect(7, 13, 18, 8, 2);
    }

    // Tail with gradient effect
    g.fillStyle(accent, 1);
    g.fillEllipse(bodyX + 8, bodyY + 2, 11, 6);
    g.fillStyle(accent, 0.6);
    g.fillEllipse(bodyX + 10, bodyY + 1, 7, 4);

    // Body with enhanced shading
    g.fillStyle(fur, 1);
    g.fillEllipse(bodyX, bodyY + 2, 16, 11);
    g.fillStyle(fur, 0.7);
    g.fillEllipse(bodyX - 2, bodyY + 3, 6, 6); // Left side shadow

    // Head
    g.fillStyle(fur, 1);
    g.fillEllipse(bodyX + 1, bodyY - 7, 12, 10);

    // Ears with detail
    g.fillStyle(ear, 1);
    g.fillTriangle(bodyX - 3, bodyY - 10, bodyX - 6, bodyY - 15, bodyX - 1, bodyY - 12);
    g.fillTriangle(bodyX + 4, bodyY - 11, bodyX + 8, bodyY - 15, bodyX + 6, bodyY - 10);
    g.fillStyle(accent, 0.5);
    g.fillTriangle(bodyX - 4, bodyY - 11, bodyX - 5, bodyY - 13, bodyX - 2, bodyY - 12);

    // Belly with enhanced detail
    g.fillStyle(0xf2d5cf, 1);
    g.fillEllipse(bodyX, bodyY + 4, 7, 5);
    g.fillStyle(0xfae8d9, 0.8);
    g.fillEllipse(bodyX, bodyY + 3, 5, 3);

    // Eyes with shine
    g.fillStyle(0x11111b, 1);
    g.fillCircle(bodyX - 1, bodyY - 8, 1.1);
    g.fillCircle(bodyX + 4, bodyY - 8, 1.1);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(bodyX - 0.5, bodyY - 8.5, 0.4);
    g.fillCircle(bodyX + 4.5, bodyY - 8.5, 0.4);

    // Nose with detail
    g.fillStyle(0xf2d5cf, 1);
    g.fillCircle(bodyX + 1.5, bodyY - 5.5, 1);
    g.fillStyle(0x11111b, 1);
    g.fillCircle(bodyX + 1.5, bodyY - 5.5, 0.6);

    // Paws with animation
    g.lineStyle(2, accent, 1);
    g.beginPath();
    g.moveTo(bodyX - 4, bodyY + 8);
    g.lineTo(bodyX - 2 + (walkShift ? 1 : 0), bodyY + 10);
    g.moveTo(bodyX + 1, bodyY + 8);
    g.lineTo(bodyX + 3 - (walkShift ? 1 : 0), bodyY + 10);
    g.strokePath();

    // Animation-specific details
    if (animation === 'celebrate_dook') {
      g.lineStyle(1.5, 0xf9e2af, 1);
      g.strokeLineShape(new Phaser.Geom.Line(bodyX - 8, bodyY - 18, bodyX - 10, bodyY - 22));
      g.strokeLineShape(new Phaser.Geom.Line(bodyX + 9, bodyY - 18, bodyX + 11, bodyY - 22));
      // Celebration sparkles
      g.fillStyle(0xf9e2af, 0.8);
      g.fillCircle(bodyX - 10, bodyY - 22, 0.5);
      g.fillCircle(bodyX + 11, bodyY - 22, 0.5);
    }

    if (animation === 'anxious_pace') {
      g.lineStyle(1, 0xcdd6f4, 0.9);
      g.strokeArc(bodyX + 10, bodyY - 11, 3, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
      // Anxiety indicator
      g.fillStyle(0xf38ba8, 0.6);
      g.fillCircle(bodyX + 10, bodyY - 14, 1);
    }

    g.generateTexture(textureKey, 32, 32);
    g.destroy();
  }

  /**
   * Enhanced office layout with improved visual hierarchy
   */
  _drawOfficeLayoutEnhanced() {
    const { width, height } = this.scale;

    // Sophisticated background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.background_dark).color,
      Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.background_dark).color,
      Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.background_light).color,
      Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.background_light).color,
      1
    );
    bg.fillRect(0, 0, width, height);

    // Ambient lighting effects
    const glow1 = this.add.graphics();
    glow1.fillStyle(Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.accent_primary).color, 0.06);
    glow1.fillEllipse(width * 0.25, 90, 300, 140);

    const glow2 = this.add.graphics();
    glow2.fillStyle(Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.accent_secondary).color, 0.04);
    glow2.fillEllipse(width * 0.75, 110, 320, 160);

    // Enhanced office floor with grid
    const floor = this.add.graphics();
    floor.fillStyle(0x1f2430, 1);
    floor.fillRoundedRect(36, 72, width - 72, height - 128, 24);
    floor.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.border).color, 1);
    floor.strokeRoundedRect(36, 72, width - 72, height - 128, 24);

    // Grid pattern for visual structure
    for (let x = 56; x < width - 56; x += 48) {
      floor.lineStyle(1, Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.border_light).color, 0.3);
      floor.lineBetween(x, 88, x, height - 72);
    }
    for (let y = 92; y < height - 72; y += 48) {
      floor.lineStyle(1, Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.border_light).color, 0.25);
      floor.lineBetween(52, y, width - 52, y);
    }

    // Zone cards with enhanced styling
    this._drawZoneCardEnhanced(width - 270, 92, 210, 116, 'MEETING ROOM', 0xcba6f7, '🤝');
    this._drawZoneCardEnhanced(62, height - 170, 190, 92, 'KITCHEN', 0xa6e3a1, '☕');
    this._drawZoneCardEnhanced(width - 250, height - 170, 190, 92, 'HOARD CORNER', 0xf9e2af, '✨');

    // Enhanced title
    this.add.text(width / 2, 28, 'FERRET OFFICE DASHBOARD', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '28px',
      color: COLOR_PALETTE.text_primary,
      fontStyle: '700',
      letterSpacing: 2,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 8, fill: true },
    }).setOrigin(0.5, 0);

    // Enhanced subtitle
    this.add.text(width / 2, 58, 'Live ferret activity • polished office view • cohesive status presence', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: COLOR_PALETTE.text_secondary,
    }).setOrigin(0.5, 0);

    // Draw desks
    agentsConfig.forEach((agent) => this._drawDeskEnhanced(agent));
  }

  /**
   * Enhanced zone card with better styling
   */
  _drawZoneCardEnhanced(x, y, w, h, label, accent, emoji) {
    const g = this.add.graphics();
    
    // Outer border with glow
    g.fillStyle(0x181825, 0.6);
    g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 20);
    
    // Main background
    g.fillStyle(0x181825, 0.95);
    g.fillRoundedRect(x, y, w, h, 18);
    
    // Border
    g.lineStyle(2, accent, 0.9);
    g.strokeRoundedRect(x, y, w, h, 18);
    
    // Accent background
    g.fillStyle(accent, 0.1);
    g.fillRoundedRect(x + 8, y + 8, w - 16, h - 16, 14);

    // Label with emoji
    this.add.text(x + 14, y + 16, `${emoji} ${label}`, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
      color: COLOR_PALETTE.text_primary,
      fontStyle: '700',
    });
  }

  /**
   * Enhanced desk with better visual detail
   */
  _drawDeskEnhanced(agent) {
    const { x, y } = agent.deskPosition;
    const desk = this.add.graphics();
    
    // Desk base
    desk.fillStyle(0x6b513d, 1);
    desk.fillRoundedRect(x - 28, y - 14, 56, 28, 8);
    desk.lineStyle(2, 0x8c6d52, 1);
    desk.strokeRoundedRect(x - 28, y - 14, 56, 28, 8);
    
    // Desk top highlight
    desk.fillStyle(0x8b6d5a, 0.4);
    desk.fillRoundedRect(x - 26, y - 12, 52, 4, 4);

    // Computer monitor
    desk.fillStyle(0x89b4fa, 0.95);
    desk.fillRoundedRect(x - 10, y - 24, 20, 12, 3);
    desk.lineStyle(1, 0x3d59a1, 0.8);
    desk.strokeRoundedRect(x - 10, y - 24, 20, 12, 3);
    
    // Screen detail
    desk.fillStyle(0x313244, 1);
    desk.fillRect(x - 2, y - 12, 4, 5);

    // Chair with enhanced detail
    desk.fillStyle(0x45475a, 1);
    desk.fillCircle(x - 18, y + 2, 3);
    desk.fillCircle(x + 18, y + 2, 3);
    desk.lineStyle(1, 0x313244, 0.6);
    desk.strokeCircle(x - 18, y + 2, 3);
    desk.strokeCircle(x + 18, y + 2, 3);
  }

  /**
   * Spawn agents from config
   */
  _spawnAgentsFromConfig() {
    agentsConfig.forEach((cfg) => {
      const agent = new FerretAgent(this, cfg);
      this.agents[cfg.id] = agent;
    });
  }

  /**
   * Enhanced UI with better visual hierarchy
   */
  _setupUIEnhanced() {
    const { width, height } = this.scale;

    // Status panel with enhanced styling
    const panel = this.add.graphics();
    panel.fillStyle(0x181825, 0.95);
    panel.fillRoundedRect(width - 320, height - 130, 290, 90, 20);
    panel.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLOR_PALETTE.border_light).color, 1);
    panel.strokeRoundedRect(width - 320, height - 130, 290, 90, 20);
    
    // Status dot indicator
    const statusDot = this.add.circle(width - 308, height - 115, 5, 0xf9e2af, 1);
    statusDot.setStrokeStyle(2, 0x000000, 0.8);

    this.statusText = this.add.text(width - 295, height - 120, 'Connecting to backend…', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: COLOR_PALETTE.text_secondary,
      wordWrap: { width: 245 },
    });

    this.clockText = this.add.text(width - 295, height - 82, 'Office time: --:--', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
      color: COLOR_PALETTE.text_primary,
      fontStyle: '700',
    });

    // Agent count badge
    this.add.text(62, height - 42, `🐭 ${agentsConfig.length} Agents Active`, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
      color: COLOR_PALETTE.text_secondary,
      backgroundColor: '#313244',
      padding: { x: 8, y: 4 },
    }).setOrigin(0, 0);
  }

  /**
   * Setup WebSocket connection
   */
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

  /**
   * Setup day/night cycle with callbacks
   */
  _setupDayNightCycle() {
    this.dayNightCycle = new DayNightCycle(this, {
      cycleDuration: 120000,
      startTime: 9,
      onTimeChange: (_time, phase) => {
        if (this.clockText) {
          this.clockText.setText(`Office time: ${this.dayNightCycle.getTimeString()} • ${phase.toUpperCase()}`);
        }
      },
      onNightStart: () => {
        console.log('[OfficeScene] Night cycle started');
      },
      onSunrise: () => {
        console.log('[OfficeScene] Day cycle started');
      },
    });
  }

  /**
   * Handle agent status updates from WebSocket
   */
  _handleAgentStatusUpdate(payload) {
    const { agentId, status, currentTask, position, animation } = payload;
    const agent = this.agents[agentId];
    if (!agent) return;
    agent.updateStatus(status, position, animation, currentTask);
  }

  /**
   * Handle office-wide events
   */
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

  /**
   * Start demo sequence
   */
  _startDemoSequence() {
    Object.values(this.agents).forEach((agent) => agent.updateStatus('idle'));
  }

  /**
   * Update demo sequence
   */
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

  /**
   * Set status text
   */
  _setStatus(text) {
    if (this.statusText) {
      this.statusText.setText(text);
    }
  }

  /**
   * Cleanup
   */
  shutdown() {
    this.dayNightCycle?.destroy();
    this.wsClient?.disconnect();
  }
}

export default OfficeSceneEnhanced;
