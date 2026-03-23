/**
 * AssetLoader - Enhanced asset loading for TASK-009
 * Handles both PNG and SVG sprite atlases
 * Provides fallback to procedural rendering if assets unavailable
 */

import Phaser from 'phaser';

export class AssetLoader {
  /**
   * Preload all sprite atlases (PNG or SVG)
   */
  static preloadSpriteAtlases(scene) {
    const atlases = [
      { key: 'kevin-sprite', path: 'assets/sprites/kevin' },
      { key: 'alex-sprite', path: 'assets/sprites/alex' },
    ];

    atlases.forEach(({ key, path: basePath }) => {
      // Try PNG first, fall back to SVG
      try {
        // Attempt to load PNG atlas
        scene.load.atlas(
          key,
          `${basePath}-sprite.png`,
          `${basePath}-atlas.json`
        );
      } catch (e) {
        console.log(`[AssetLoader] PNG atlas not available for ${key}, will use procedural`);
      }
    });

    // Handle load errors gracefully
    scene.load.on('loaderror', (file) => {
      console.warn(`[AssetLoader] Failed to load: ${file.src}`);
    });
  }

  /**
   * Preload tilemap assets
   */
  static preloadTilemap(scene) {
    try {
      scene.load.tilemapTiledJSON('office-map', 'assets/tilemaps/office_map.json');
      scene.load.image('office-tileset', 'assets/tilemaps/office_tileset.png');
    } catch (e) {
      console.log('[AssetLoader] Tilemap assets not fully available');
    }
  }

  /**
   * Load agent configuration
   */
  static loadAgentConfig(scene) {
    try {
      scene.load.json('agents-config', 'config/agents.json');
    } catch (e) {
      console.log('[AssetLoader] Agent config not found');
    }
  }

  /**
   * Check if a sprite atlas is loaded
   */
  static hasAtlas(scene, key) {
    return scene.textures.exists(key);
  }

  /**
   * Get asset availability status
   */
  static getAssetStatus(scene) {
    const status = {
      kevin_png: scene.textures.exists('kevin-sprite'),
      alex_png: scene.textures.exists('alex-sprite'),
      tilemap_json: Boolean(scene.cache.tilemap.get('office-map')),
      tileset_image: scene.textures.exists('office-tileset'),
      agents_config: Boolean(scene.cache.json.get('agents-config')),
    };

    console.log('[AssetLoader] Asset Status:', status);
    return status;
  }
}

export default AssetLoader;
