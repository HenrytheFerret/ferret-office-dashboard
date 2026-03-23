#!/usr/bin/env node
/**
 * TASK-009: Final Art Integration - Polished Asset Generation
 * Creates PNG sprite sheets and tilesets to replace procedural visuals
 * 
 * Uses Node canvas to generate pixel-perfect ferret sprites and office tiles
 */

const fs = require('fs');
const path = require('path');

// Try to load canvas, fallback to a simpler approach if not available
let canvasAvailable = false;
try {
  const { createCanvas } = require('canvas');
  canvasAvailable = true;
  console.log('✓ Canvas library available');
} catch (e) {
  console.log('⚠ Canvas not available, will use SVG-based approach');
}

const ASSETS_DIR = '/data/.openclaw/workspace/ferret-dashboard/frontend/src/assets';
const SPRITES_DIR = path.join(ASSETS_DIR, 'sprites');
const TILEMAPS_DIR = path.join(ASSETS_DIR, 'tilemaps');

// Ensure directories exist
[SPRITES_DIR, TILEMAPS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Ferret color palettes - consistent with OfficeScene PALETTES
 */
const FERRET_PALETTES = {
  kevin: {
    fur: '#7aa2f7',      // Blue
    accent: '#3d59a1',   // Dark blue
    ear: '#cdd6f4',      // Light lavender
    belly: '#f2d5cf',    // Cream
    eye: '#11111b',      // Black
    nose: '#f9e2af',     // Yellow accent
  },
  alex: {
    fur: '#f5a97f',      // Orange
    accent: '#c65d32',   // Dark orange
    ear: '#f9e2af',      // Yellow
    belly: '#fde4d3',    // Light cream
    eye: '#11111b',      // Black
    nose: '#f38ba8',     // Pink accent
  },
};

/**
 * Generate SVG-based pixel art ferret sprite sheet
 */
function generateFerretSVG(agentId, palette) {
  const frameSize = 32;
  const cols = 6;
  const rows = 3;
  const width = frameSize * cols;
  const height = frameSize * rows;

  // Animation frame definitions
  const animations = [
    // idle_default (frames 0-2)
    { name: 'idle_default', frames: [0, 1, 2], poses: ['neutral', 'slight_bob', 'neutral'] },
    // idle_dook (frames 3-5)
    { name: 'idle_dook', frames: [3, 4, 5], poses: ['hop_up', 'hop_down', 'hop_up'] },
    // move_walk (frames 6-9)
    { name: 'move_walk', frames: [6, 7, 8, 9], poses: ['walk_0', 'walk_1', 'walk_2', 'walk_1'] },
    // working_desk (frames 10-11)
    { name: 'working_desk', frames: [10, 11], poses: ['working', 'working'] },
    // celebrate_dook (frames 12-14)
    { name: 'celebrate_dook', frames: [12, 13, 14], poses: ['celebrate_0', 'celebrate_1', 'celebrate_2'] },
    // anxious_pace (frames 15-16)
    { name: 'anxious_pace', frames: [15, 16], poses: ['pace_0', 'pace_1'] },
  ];

  let frameIndex = 0;
  const frameSVGs = [];

  animations.forEach(anim => {
    anim.poses.forEach((pose, poseIndex) => {
      const col = frameIndex % cols;
      const row = Math.floor(frameIndex / cols);
      const x = col * frameSize;
      const y = row * frameSize;

      const frameSVG = generateFerretFrame(x, y, frameSize, palette, pose, agentId);
      frameSVGs.push(frameSVG);
      frameIndex++;
    });
  });

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .frame-bg { fill: #1e1e2e; }
        .ferret-body { fill: ${palette.fur}; stroke: ${palette.accent}; stroke-width: 0.8; }
        .ferret-belly { fill: ${palette.belly}; stroke: none; }
        .ferret-ear { fill: ${palette.ear}; stroke: ${palette.accent}; stroke-width: 0.8; }
        .ferret-eye { fill: ${palette.eye}; }
        .ferret-nose { fill: ${palette.nose}; }
      </style>
    </defs>
    ${frameSVGs.join('')}
  </svg>`;

  return svg;
}

/**
 * Generate a single ferret frame
 */
function generateFerretFrame(frameX, frameY, frameSize, palette, pose, agentId) {
  const ox = frameX + frameSize / 2;
  const oy = frameY + frameSize / 2;
  const centerX = frameX + frameSize / 2;
  const centerY = frameY + frameSize / 2 + 2;

  let bodyShapeGroup = '';

  // Pose-specific rendering
  if (pose === 'neutral' || pose === 'working') {
    bodyShapeGroup = `
      <!-- Body -->
      <ellipse cx="${centerX}" cy="${centerY}" rx="7" ry="5" class="ferret-body" />
      <!-- Head -->
      <circle cx="${centerX}" cy="${centerY - 8}" r="5" class="ferret-body" />
      <!-- Ears -->
      <ellipse cx="${centerX - 3}" cy="${centerY - 13}" rx="1.5" ry="3" class="ferret-ear" />
      <ellipse cx="${centerX + 3}" cy="${centerY - 13}" rx="1.5" ry="3" class="ferret-ear" />
      <!-- Belly -->
      <ellipse cx="${centerX}" cy="${centerY + 1}" rx="4" ry="3" class="ferret-belly" />
      <!-- Eyes -->
      <circle cx="${centerX - 2}" cy="${centerY - 9}" r="0.8" class="ferret-eye" />
      <circle cx="${centerX + 2}" cy="${centerY - 9}" r="0.8" class="ferret-eye" />
      <!-- Nose -->
      <circle cx="${centerX}" cy="${centerY - 7}" r="0.4" class="ferret-nose" />
      <!-- Tail -->
      <path d="M ${centerX + 7} ${centerY} Q ${centerX + 10} ${centerY - 2} ${centerX + 12} ${centerY}" 
            stroke="${palette.accent}" stroke-width="1" fill="none" stroke-linecap="round" />
      <!-- Front paws -->
      <rect x="${centerX - 4}" y="${centerY + 5}" width="1.5" height="2.5" fill="${palette.accent}" />
      <rect x="${centerX + 2.5}" y="${centerY + 5}" width="1.5" height="2.5" fill="${palette.accent}" />
    `;
  } else if (pose === 'slight_bob') {
    bodyShapeGroup = `
      <!-- Body (lifted) -->
      <ellipse cx="${centerX}" cy="${centerY - 0.5}" rx="7" ry="5" class="ferret-body" />
      <!-- Head (lifted) -->
      <circle cx="${centerX}" cy="${centerY - 8.5}" r="5" class="ferret-body" />
      <!-- Ears -->
      <ellipse cx="${centerX - 3}" cy="${centerY - 13.5}" rx="1.5" ry="3" class="ferret-ear" />
      <ellipse cx="${centerX + 3}" cy="${centerY - 13.5}" rx="1.5" ry="3" class="ferret-ear" />
      <!-- Belly -->
      <ellipse cx="${centerX}" cy="${centerY + 0.5}" rx="4" ry="3" class="ferret-belly" />
      <!-- Eyes -->
      <circle cx="${centerX - 2}" cy="${centerY - 9.5}" r="0.8" class="ferret-eye" />
      <circle cx="${centerX + 2}" cy="${centerY - 9.5}" r="0.8" class="ferret-eye" />
      <!-- Nose -->
      <circle cx="${centerX}" cy="${centerY - 7.5}" r="0.4" class="ferret-nose" />
      <!-- Tail -->
      <path d="M ${centerX + 7} ${centerY - 1} Q ${centerX + 10} ${centerY - 3} ${centerX + 12} ${centerY - 1}" 
            stroke="${palette.accent}" stroke-width="1" fill="none" stroke-linecap="round" />
      <!-- Front paws -->
      <rect x="${centerX - 4}" y="${centerY + 4.5}" width="1.5" height="2.5" fill="${palette.accent}" />
      <rect x="${centerX + 2.5}" y="${centerY + 4.5}" width="1.5" height="2.5" fill="${palette.accent}" />
    `;
  } else if (pose === 'hop_up') {
    bodyShapeGroup = `
      <!-- Body (hopping) -->
      <ellipse cx="${centerX}" cy="${centerY - 2}" rx="7" ry="5" class="ferret-body" />
      <!-- Head (up) -->
      <circle cx="${centerX}" cy="${centerY - 10}" r="5" class="ferret-body" />
      <!-- Ears (forward) -->
      <ellipse cx="${centerX - 2}" cy="${centerY - 15}" rx="2" ry="3" class="ferret-ear" />
      <ellipse cx="${centerX + 2}" cy="${centerY - 15}" rx="2" ry="3" class="ferret-ear" />
      <!-- Belly -->
      <ellipse cx="${centerX}" cy="${centerY - 1}" rx="4" ry="3" class="ferret-belly" />
      <!-- Eyes (bright) -->
      <circle cx="${centerX - 2}" cy="${centerY - 11}" r="1" class="ferret-eye" />
      <circle cx="${centerX + 2}" cy="${centerY - 11}" r="1" class="ferret-eye" />
      <!-- Nose -->
      <circle cx="${centerX}" cy="${centerY - 9}" r="0.4" class="ferret-nose" />
      <!-- Tail (up) -->
      <path d="M ${centerX + 7} ${centerY - 2} Q ${centerX + 10} ${centerY - 5} ${centerX + 10} ${centerY - 8}" 
            stroke="${palette.accent}" stroke-width="1" fill="none" stroke-linecap="round" />
      <!-- Front paws (up) -->
      <rect x="${centerX - 4}" y="${centerY + 3}" width="1.5" height="1.5" fill="${palette.accent}" />
      <rect x="${centerX + 2.5}" y="${centerY + 3}" width="1.5" height="1.5" fill="${palette.accent}" />
    `;
  } else if (pose.startsWith('walk')) {
    const walkFrame = parseInt(pose.split('_')[1]);
    const legOffset = walkFrame % 2 === 0 ? 1 : -1;
    bodyShapeGroup = `
      <!-- Body (walking) -->
      <ellipse cx="${centerX + legOffset * 0.5}" cy="${centerY}" rx="7" ry="5" class="ferret-body" />
      <!-- Head (forward) -->
      <circle cx="${centerX + legOffset}" cy="${centerY - 8}" r="5" class="ferret-body" />
      <!-- Ears (side) -->
      <ellipse cx="${centerX + legOffset - 3}" cy="${centerY - 13}" rx="1.5" ry="3" class="ferret-ear" />
      <ellipse cx="${centerX + legOffset + 3}" cy="${centerY - 13}" rx="1.5" ry="3" class="ferret-ear" />
      <!-- Belly -->
      <ellipse cx="${centerX + legOffset * 0.5}" cy="${centerY + 1}" rx="4" ry="3" class="ferret-belly" />
      <!-- Eyes (looking forward) -->
      <circle cx="${centerX + legOffset - 2}" cy="${centerY - 9}" r="0.8" class="ferret-eye" />
      <circle cx="${centerX + legOffset + 2}" cy="${centerY - 9}" r="0.8" class="ferret-eye" />
      <!-- Nose -->
      <circle cx="${centerX + legOffset}" cy="${centerY - 7}" r="0.4" class="ferret-nose" />
      <!-- Tail (curved) -->
      <path d="M ${centerX + legOffset + 7} ${centerY} Q ${centerX + legOffset + 10} ${centerY + legOffset} ${centerX + legOffset + 12} ${centerY}" 
            stroke="${palette.accent}" stroke-width="1" fill="none" stroke-linecap="round" />
      <!-- Front paws (alternating) -->
      <rect x="${centerX + legOffset - 4}" y="${centerY + 5 + legOffset}" width="1.5" height="2.5" fill="${palette.accent}" />
      <rect x="${centerX + legOffset + 2.5}" y="${centerY + 5 - legOffset}" width="1.5" height="2.5" fill="${palette.accent}" />
    `;
  } else if (pose.startsWith('celebrate')) {
    bodyShapeGroup = `
      <!-- Body (celebrating) -->
      <ellipse cx="${centerX}" cy="${centerY}" rx="7" ry="5" class="ferret-body" />
      <!-- Head (up) -->
      <circle cx="${centerX}" cy="${centerY - 10}" r="5" class="ferret-body" />
      <!-- Ears (bouncy) -->
      <ellipse cx="${centerX - 4}" cy="${centerY - 16}" rx="2" ry="4" class="ferret-ear" />
      <ellipse cx="${centerX + 4}" cy="${centerY - 16}" rx="2" ry="4" class="ferret-ear" />
      <!-- Belly -->
      <ellipse cx="${centerX}" cy="${centerY + 1}" rx="4" ry="3" class="ferret-belly" />
      <!-- Eyes (happy) -->
      <circle cx="${centerX - 2}" cy="${centerY - 10}" r="1" class="ferret-eye" />
      <circle cx="${centerX + 2}" cy="${centerY - 10}" r="1" class="ferret-eye" />
      <!-- Nose -->
      <circle cx="${centerX}" cy="${centerY - 8}" r="0.5" class="ferret-nose" />
      <!-- Tail (celebratory spiral) -->
      <path d="M ${centerX + 7} ${centerY} Q ${centerX + 12} ${centerY - 6} ${centerX + 10} ${centerY - 10}" 
            stroke="${palette.accent}" stroke-width="1.2" fill="none" stroke-linecap="round" />
      <!-- Celebration lines -->
      <line x1="${centerX - 8}" y1="${centerY - 6}" x2="${centerX - 10}" y2="${centerY - 10}" stroke="${palette.nose}" stroke-width="0.5" />
      <line x1="${centerX + 8}" y1="${centerY - 6}" x2="${centerX + 10}" y2="${centerY - 10}" stroke="${palette.nose}" stroke-width="0.5" />
    `;
  } else if (pose.startsWith('pace')) {
    const paceShift = parseInt(pose.split('_')[1]) === 0 ? -1 : 1;
    bodyShapeGroup = `
      <!-- Body (anxious) -->
      <ellipse cx="${centerX + paceShift * 1}" cy="${centerY}" rx="7" ry="5" class="ferret-body" />
      <!-- Head (forward, tense) -->
      <circle cx="${centerX + paceShift * 1.5}" cy="${centerY - 8}" r="5" class="ferret-body" />
      <!-- Ears (back, pinned) -->
      <ellipse cx="${centerX + paceShift * 1.5 - 2}" cy="${centerY - 12}" rx="1.5" ry="2.5" class="ferret-ear" />
      <ellipse cx="${centerX + paceShift * 1.5 + 2}" cy="${centerY - 12}" rx="1.5" ry="2.5" class="ferret-ear" />
      <!-- Belly -->
      <ellipse cx="${centerX + paceShift * 1}" cy="${centerY + 1}" rx="4" ry="3" class="ferret-belly" />
      <!-- Eyes (worried) -->
      <circle cx="${centerX + paceShift * 1.5 - 2}" cy="${centerY - 8.5}" r="0.7" class="ferret-eye" />
      <circle cx="${centerX + paceShift * 1.5 + 2}" cy="${centerY - 8.5}" r="0.7" class="ferret-eye" />
      <!-- Nose -->
      <circle cx="${centerX + paceShift * 1.5}" cy="${centerY - 6.5}" r="0.4" class="ferret-nose" />
      <!-- Tail (twitchy) -->
      <path d="M ${centerX + paceShift * 1 + 7} ${centerY} Q ${centerX + paceShift * 3 + 10} ${centerY + paceShift * 2} ${centerX + paceShift * 1 + 12} ${centerY + paceShift}" 
            stroke="${palette.accent}" stroke-width="1" fill="none" stroke-linecap="round" />
      <!-- Anxiety marks -->
      <text x="${centerX + paceShift * 0.5}" y="${centerY - 12}" font-size="2" fill="${palette.nose}">!</text>
    `;
  }

  return `
    <!-- Frame at (${frameX}, ${frameY}) -->
    <g>
      <rect x="${frameX}" y="${frameY}" width="${frameSize}" height="${frameSize}" class="frame-bg" />
      ${bodyShapeGroup}
    </g>
  `;
}

/**
 * Generate office tileset SVG
 */
function generateOfficeTilesetSVG() {
  const tileSize = 16;
  const tileCount = 16;
  const width = tileSize * tileCount;
  const height = tileSize;

  const tiles = [
    // 0: Wall
    `<g><rect x="0" y="0" width="${tileSize}" height="${tileSize}" fill="#646f8a" stroke="#4a5169" stroke-width="0.5" />
     <line x1="4" y1="0" x2="4" y2="${tileSize}" stroke="#7a8aa8" stroke-width="0.3" opacity="0.5" />
     </g>`,
    
    // 1: Floor
    `<g><rect x="${tileSize}" y="0" width="${tileSize}" height="${tileSize}" fill="#2a2a3e" stroke="#1a1a2e" stroke-width="0.5" />
     <rect x="${tileSize + 1}" y="1" width="${tileSize - 2}" height="${tileSize - 2}" fill="#323244" opacity="0.6" />
     </g>`,
    
    // 2-4: Desk variants
    `<g><rect x="${tileSize * 2}" y="0" width="${tileSize}" height="${tileSize}" fill="#6b513d" stroke="#8c6d52" stroke-width="0.5" />
     <rect x="${tileSize * 2 + 2}" y="4" width="${tileSize - 4}" height="6" fill="#8b6d5a" />
     </g>`,
    
    `<g><rect x="${tileSize * 3}" y="0" width="${tileSize}" height="${tileSize}" fill="#7a5d48" stroke="#9a7d68" stroke-width="0.5" />
     <circle cx="${tileSize * 3 + 8}" cy="8" r="2" fill="#89b4fa" opacity="0.7" />
     </g>`,
    
    `<g><rect x="${tileSize * 4}" y="0" width="${tileSize}" height="${tileSize}" fill="#6b513d" stroke="#8c6d52" stroke-width="0.5" />
     <line x1="${tileSize * 4 + 2}" y1="6" x2="${tileSize * 4 + 14}" y2="6" stroke="#8c6d52" stroke-width="0.5" />
     </g>`,
    
    // 5-6: Chair variants
    `<g><rect x="${tileSize * 5}" y="0" width="${tileSize}" height="${tileSize}" fill="#45475a" stroke="#313244" stroke-width="0.5" />
     <circle cx="${tileSize * 5 + 8}" cy="8" r="3" fill="#313244" stroke="#45475a" stroke-width="0.5" />
     <line x1="${tileSize * 5 + 6}" y1="11" x2="${tileSize * 5 + 10}" y2="11" stroke="#313244" stroke-width="0.5" />
     </g>`,
    
    `<g><rect x="${tileSize * 6}" y="0" width="${tileSize}" height="${tileSize}" fill="#363847" stroke="#2a2a3a" stroke-width="0.5" />
     <circle cx="${tileSize * 6 + 8}" cy="8" r="2.5" fill="#2a2a3a" />
     </g>`,
    
    // 7-8: Kitchen
    `<g><rect x="${tileSize * 7}" y="0" width="${tileSize}" height="${tileSize}" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="0.5" />
     <rect x="${tileSize * 7 + 3}" y="3" width="${tileSize - 6}" height="${tileSize - 6}" fill="#d0d0d0" />
     </g>`,
    
    `<g><rect x="${tileSize * 8}" y="0" width="${tileSize}" height="${tileSize}" fill="#c85a17" stroke="#a83d00" stroke-width="0.5" />
     <rect x="${tileSize * 8 + 2}" y="2" width="${tileSize - 4}" height="${tileSize - 4}" fill="#e87722" opacity="0.7" />
     </g>`,
    
    // 9-10: Meeting room
    `<g><rect x="${tileSize * 9}" y="0" width="${tileSize}" height="${tileSize}" fill="#a6e3a1" stroke="#7ec76d" stroke-width="0.5" />
     <rect x="${tileSize * 9 + 2}" y="4" width="${tileSize - 4}" height="8" fill="#7ec76d" />
     </g>`,
    
    `<g><rect x="${tileSize * 10}" y="0" width="${tileSize}" height="${tileSize}" fill="#f9e2af" stroke="#d4a017" stroke-width="0.5" />
     <circle cx="${tileSize * 10 + 5}" cy="5" r="2" fill="#d4a017" />
     <circle cx="${tileSize * 10 + 11}" cy="11" r="2" fill="#d4a017" />
     </g>`,
    
    // 11: Storage
    `<g><rect x="${tileSize * 11}" y="0" width="${tileSize}" height="${tileSize}" fill="#8b5a3c" stroke="#6b3d1f" stroke-width="0.5" />
     <line x1="${tileSize * 11 + 3}" y1="3" x2="${tileSize * 11 + 13}" y2="3" stroke="#6b3d1f" stroke-width="0.3" />
     <line x1="${tileSize * 11 + 3}" y1="8" x2="${tileSize * 11 + 13}" y2="8" stroke="#6b3d1f" stroke-width="0.3" />
     <line x1="${tileSize * 11 + 3}" y1="13" x2="${tileSize * 11 + 13}" y2="13" stroke="#6b3d1f" stroke-width="0.3" />
     </g>`,
    
    // 12: Door
    `<g><rect x="${tileSize * 12}" y="0" width="${tileSize}" height="${tileSize}" fill="#8b4048" stroke="#b84c54" stroke-width="0.5" />
     <rect x="${tileSize * 12 + 3}" y="2" width="${tileSize - 6}" height="${tileSize - 4}" fill="#b84c54" />
     <circle cx="${tileSize * 12 + 12}" cy="8" r="1" fill="#ffd700" />
     </g>`,
    
    // 13-14: Plant
    `<g><rect x="${tileSize * 13}" y="0" width="${tileSize}" height="${tileSize}" fill="#2a2a3e" />
     <ellipse cx="${tileSize * 13 + 8}" cy="10" rx="3" ry="4" fill="#52b788" />
     <ellipse cx="${tileSize * 13 + 5}" cy="7" rx="2" ry="3" fill="#6cc24a" />
     <ellipse cx="${tileSize * 13 + 11}" cy="8" rx="2" ry="3" fill="#6cc24a" />
     <rect x="${tileSize * 13 + 7}" y="14" width="2" height="2" fill="#8b6d5a" />
     </g>`,
    
    `<g><rect x="${tileSize * 14}" y="0" width="${tileSize}" height="${tileSize}" fill="#2a2a3e" />
     <circle cx="${tileSize * 14 + 8}" cy="8" r="4" fill="#f4d03f" />
     <line x1="${tileSize * 14 + 8}" y1="2" x2="${tileSize * 14 + 8}" y2="4" stroke="#d4a017" stroke-width="0.5" />
     </g>`,
    
    // 15: Light
    `<g><rect x="${tileSize * 15}" y="0" width="${tileSize}" height="${tileSize}" fill="#2a2a3e" />
     <circle cx="${tileSize * 15 + 8}" cy="8" r="3" fill="#fffacd" stroke="#f4d03f" stroke-width="0.5" />
     <line x1="${tileSize * 15 + 8}" y1="11" x2="${tileSize * 15 + 8}" y2="14" stroke="#8b6d5a" stroke-width="0.5" />
     </g>`,
  ];

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${tiles.join('')}
  </svg>`;

  return svg;
}

/**
 * Save SVG file
 */
function saveSVG(filename, svgContent) {
  fs.writeFileSync(filename, svgContent, 'utf8');
  console.log(`✓ Created ${filename}`);
}

/**
 * Main execution
 */
console.log('='.repeat(60));
console.log('TASK-009: Final Art Integration - Asset Generation');
console.log('='.repeat(60));
console.log();

// Generate ferret sprite atlases
console.log('📊 Generating ferret sprite atlases...');
const kevinSVG = generateFerretSVG('kevin', FERRET_PALETTES.kevin);
saveSVG(path.join(SPRITES_DIR, 'kevin-sprite.svg'), kevinSVG);

const alexSVG = generateFerretSVG('alex', FERRET_PALETTES.alex);
saveSVG(path.join(SPRITES_DIR, 'alex-sprite.svg'), alexSVG);

// Generate office tileset
console.log('📊 Generating office tileset...');
const tilesetSVG = generateOfficeTilesetSVG();
saveSVG(path.join(TILEMAPS_DIR, 'office_tileset.svg'), tilesetSVG);

console.log();
console.log('='.repeat(60));
console.log('✅ All assets generated as SVG prototypes');
console.log('='.repeat(60));
console.log();
console.log('Next step: Convert SVGs to PNG for production use');
console.log('  - Use: inkscape, ImageMagick, or browser SVG rendering');
console.log(`  - Output: ${SPRITES_DIR}/kevin-sprite.png (192x192)`);
console.log(`  - Output: ${SPRITES_DIR}/alex-sprite.png (192x192)`);
console.log(`  - Output: ${TILEMAPS_DIR}/office_tileset.png (256x16)`);
console.log();
