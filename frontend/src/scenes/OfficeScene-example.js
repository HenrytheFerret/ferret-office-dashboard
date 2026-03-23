/**
 * OfficeScene - Example Implementation
 * Demonstrates how to integrate:
 * - Asset loading (sprites, tilemaps)
 * - Day/Night cycle effects
 * - Agent animation system
 */

import DayNightCycle from '../effects/DayNightCycle.js';

export class OfficeScene extends Phaser.Scene {
  constructor() {
    super('OfficeScene');
  }

  preload() {
    // Load sprite atlases
    // Note: Replace with actual PNG files once generated
    this.load.atlas(
      'kevin-sprite',
      'assets/sprites/kevin-sprite.png',
      'assets/sprites/kevin-atlas.json'
    );
    
    this.load.atlas(
      'alex-sprite',
      'assets/sprites/alex-sprite.png',
      'assets/sprites/alex-atlas.json'
    );
    
    // Load tilemap
    this.load.tilemapTiledJSON(
      'office-map',
      'assets/tilemaps/office_map.json'
    );
    
    // Load tileset image
    this.load.image(
      'office-tileset',
      'assets/tilemaps/office_tileset.png'
    );
    
    // Load agent config
    this.load.json('agents-config', 'config/agents.json');
  }

  create() {
    console.log('[OfficeScene] Creating scene...');
    
    // Initialize day/night cycle
    this.dayNightCycle = new DayNightCycle(this, {
      cycleDuration: 120000, // 2 minutes per full day/night cycle for demo
      startTime: 9, // Start at 9am
      ambientLight: { r: 1, g: 1, b: 1 },
      onTimeChange: this.handleTimeChange.bind(this),
      onDayStart: () => console.log('[DayNight] Day started'),
      onNightStart: () => console.log('[DayNight] Night started'),
      onSunrise: () => console.log('[DayNight] Sunrise'),
      onSunset: () => console.log('[DayNight] Sunset'),
    });
    
    // Create tilemap
    this.createTilemap();
    
    // Create agents from config
    this.createAgents();
    
    // Create animations from atlas data
    this.createAnimations();
    
    // Input handling
    this.setupInput();
    
    console.log('[OfficeScene] Scene created successfully');
  }

  createTilemap() {
    try {
      const map = this.make.tilemap({ key: 'office-map' });
      const tileset = map.addTilesetImage('office_tileset', 'office-tileset');
      
      if (!tileset) {
        console.warn('[OfficeScene] Tileset not found, skipping tilemap render');
        return;
      }
      
      const layer = map.createLayer('Floor', tileset, 0, 0);
      this.physics.world.enable(layer);
      layer.setCollisionByProperty({ collides: true });
      
      console.log('[OfficeScene] Tilemap created');
    } catch (e) {
      console.error('[OfficeScene] Error creating tilemap:', e.message);
      // Continue without tilemap
    }
  }

  createAgents() {
    const agentsConfig = this.cache.json.get('agents-config');
    this.agents = {};
    
    // Create sprites for each agent
    ['kevin', 'alex'].forEach(agentId => {
      const config = agentsConfig.find(a => a.id === agentId);
      if (!config) return;
      
      const sprite = this.add.sprite(
        config.initialPosition.x * 16,
        config.initialPosition.y * 16,
        config.spriteSheetKey
      );
      
      sprite.setScale(2); // Scale up for better visibility
      sprite.setOrigin(0.5, 0.5);
      
      this.agents[agentId] = {
        sprite,
        config,
        currentAnimation: 'idle_default',
        isMoving: false
      };
      
      console.log(`[OfficeScene] Created agent: ${agentId}`);
    });
  }

  createAnimations() {
    // Define animations based on atlas data
    const animationDefs = [
      { key: 'idle_default', frames: [0, 1, 2], frameRate: 4 },
      { key: 'idle_dook', frames: [3, 4, 5], frameRate: 6 },
      { key: 'move_walk', frames: [6, 7, 8, 9], frameRate: 8 },
      { key: 'working_desk', frames: [10, 11], frameRate: 2 },
      { key: 'celebrate_dook', frames: [12, 13, 14], frameRate: 8 },
      { key: 'anxious_pace', frames: [15, 16], frameRate: 6 },
    ];
    
    Object.values(this.agents).forEach(agent => {
      animationDefs.forEach(def => {
        this.anims.create({
          key: `${agent.config.id}-${def.key}`,
          frames: this.anims.generateFrameNames(
            agent.config.spriteSheetKey,
            {
              prefix: `${def.key}_`,
              suffix: '',
              start: 0,
              end: def.frames.length - 1,
            }
          ),
          frameRate: def.frameRate,
          repeat: -1,
        });
      });
    });
    
    console.log('[OfficeScene] Animations created');
  }

  setupInput() {
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === ' ') {
        // Toggle day/night cycle
        this.dayNightCycle.setPaused(!this.dayNightCycle.isPaused);
      }
      if (event.key === 'd') {
        // Debug: Jump to different time
        this.dayNightCycle.setTime((this.dayNightCycle.getHour(this.dayNightCycle.timeOfDay) + 1) % 24);
      }
    });
  }

  handleTimeChange(timeOfDay, phase) {
    // Example: Change agent animations based on time
    // (This would normally come from WebSocket updates from backend)
    
    Object.values(this.agents).forEach(agent => {
      if (phase === 'night' && !agent.currentAnimation.includes('anxious')) {
        agent.sprite.play(`${agent.config.id}-anxious_pace`, true);
        agent.currentAnimation = 'anxious_pace';
      } else if (phase !== 'night' && agent.currentAnimation === 'anxious_pace') {
        agent.sprite.play(`${agent.config.id}-idle_default`, true);
        agent.currentAnimation = 'idle_default';
      }
    });
  }

  update() {
    // Update day/night cycle
    this.dayNightCycle.update();
  }

  shutdown() {
    this.dayNightCycle?.destroy();
  }
}

export default OfficeScene;
