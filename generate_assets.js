#!/usr/bin/env node
/**
 * Generate pixel art assets using Canvas
 * Install: npm install canvas
 */

const fs = require('fs');
const path = require('path');

// Create directories
const ASSETS_DIR = '/data/.openclaw/workspace/ferret-dashboard/frontend/src/assets';
const SPRITES_DIR = path.join(ASSETS_DIR, 'sprites');
const TILEMAPS_DIR = path.join(ASSETS_DIR, 'tilemaps');

[SPRITES_DIR, TILEMAPS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Since canvas module is not available, create simple placeholder PNG files
// In production, these would be real pixel art. For now, we'll document the expected output

const ATLAS_DATA = {
  "kevin-sprite.png": {
    description: "Kevin agent sprite sheet (192x192)",
    frames: 17,
    frameSize: "32x32",
    animations: ["idle_default", "idle_dook", "move_walk", "working_desk", "celebrate_dook", "anxious_pace"]
  },
  "alex-sprite.png": {
    description: "Alex agent sprite sheet (192x192)",
    frames: 17,
    frameSize: "32x32",
    animations: ["idle_default", "idle_dook", "move_walk", "working_desk", "celebrate_dook", "anxious_pace"]
  }
};

// Create SVG-based placeholder images
const createPlaceholderPNG = (filename, label) => {
  const svg = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .frame-border { stroke: #999; stroke-width: 1; fill: #f0f0f0; }
        .label { font-family: monospace; font-size: 10px; fill: #333; }
        .ferret { fill: #3c78c8; stroke: #000; stroke-width: 1; }
      </style>
    </defs>
    <rect width="192" height="192" fill="#ff00ff"/>
    <!-- Placeholder grid -->
    <g id="frames">
      ${Array(17).fill(0).map((_, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const x = col * 32;
        const y = row * 32;
        return `
          <rect class="frame-border" x="${x}" y="${y}" width="32" height="32"/>
          <circle class="ferret" cx="${x + 16}" cy="${y + 14}" r="6"/>
          <circle cx="${x + 13}" cy="${y + 12}" r="1" fill="black"/>
          <circle cx="${x + 19}" cy="${y + 12}" r="1" fill="black"/>
          <text class="label" x="${x + 24}" y="${y + 28}">${i}</text>
        `;
      }).join('')}
    </g>
    <text class="label" x="4" y="188">${label}</text>
  </svg>`;
  
  return svg;
};

// Generate SVG placeholders (in real implementation, these would be PNG)
console.log('📦 Generating asset manifests...\n');

// Document expected files
const assetManifest = {
  sprites: ATLAS_DATA,
  tileset: {
    "office_tileset.png": {
      description: "Office environment tileset (256x16)",
      tiles: 16,
      tileSize: "16x16",
      tileTypes: [
        "wall", "floor", "desk_1", "desk_2", "desk_3",
        "chair_1", "chair_2", "kitchen", "kitchen_2", "meeting",
        "meeting_2", "storage", "door", "plant", "plant_2", "light"
      ]
    }
  }
};

// Save manifest
fs.writeFileSync(
  path.join(ASSETS_DIR, 'ASSET_MANIFEST.json'),
  JSON.stringify(assetManifest, null, 2)
);
console.log('✓ Created ASSET_MANIFEST.json');

// Create placeholder SVG files for reference
fs.writeFileSync(
  path.join(SPRITES_DIR, 'kevin-sprite.svg'),
  createPlaceholderPNG('kevin-sprite.svg', 'Kevin Sprite Atlas')
);
console.log('✓ Created kevin-sprite.svg (placeholder)');

fs.writeFileSync(
  path.join(SPRITES_DIR, 'alex-sprite.svg'),
  createPlaceholderPNG('alex-sprite.svg', 'Alex Sprite Atlas')
);
console.log('✓ Created alex-sprite.svg (placeholder)');

console.log('\n✅ Asset generation complete!');
console.log(`
📁 Assets structure:
  ${SPRITES_DIR}/
    ├─ kevin-atlas.json
    ├─ kevin-sprite.svg (placeholder, needs PNG)
    ├─ alex-atlas.json
    └─ alex-sprite.svg (placeholder, needs PNG)
    
  ${TILEMAPS_DIR}/
    ├─ office_map.json
    └─ office_tileset.png (needed)

💡 Next: Create pixel art PNG files to match the JSON definitions.
   Use an image editor or provide real PNG sprite sheets.
`);
