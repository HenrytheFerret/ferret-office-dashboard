#!/usr/bin/env node
/**
 * Convert Pokémon‑style ferret sprite SVGs to PNG sprite sheets.
 * Uses sharp (fast) if available, falls back to Puppeteer or Inkscape.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = '/data/.openclaw/workspace/ferret-dashboard/frontend/src/assets';
const SPRITES_DIR = path.join(ASSETS_DIR, 'sprites');

// Agent names and their primary color (Catppuccin palette)
const AGENTS = [
  { id: 'kevin',  color: '#7aa2f7', name: 'Kevin (Blue)' },
  { id: 'alex',   color: '#f5a97f', name: 'Alex (Orange)' },
  { id: 'jordan', color: '#f5bde6', name: 'Jordan (Pink)' },
  { id: 'milo',   color: '#94e2d5', name: 'Milo (Teal)' },
  { id: 'riley',  color: '#cba6f7', name: 'Riley (Purple)' },
  { id: 'casey',  color: '#f9e2af', name: 'Casey (Yellow)' },
  { id: 'sam',    color: '#89dceb', name: 'Sam (Cyan)' },
  { id: 'quinn',  color: '#f38ba8', name: 'Quinn (Red Pink)' },
];

// Animation frames per agent (same for all)
const FRAMES_LAYOUT = {
  width: 64,      // each frame width
  height: 64,     // each frame height
  columns: 6,     // frames per row (idle 0-2, dook 3-5, walk 6-9, work 10-11, celebrate 12-14, anxious 15-16)
  rows: 3,        // total rows (if needed)
  totalFrames: 17,
};

/**
 * Try to convert SVG to PNG using sharp (preferred)
 */
async function convertWithSharp(svgPath, pngPath) {
  try {
    const sharp = require('sharp');
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer, { density: 72 }) // 72 DPI for pixel art
      .png()
      .toFile(pngPath);
    console.log(`✅ sharp: ${svgPath} → ${pngPath}`);
    return true;
  } catch (err) {
    console.log(`❌ sharp not available: ${err.message}`);
    return false;
  }
}

/**
 * Try to convert using Inkscape (command line)
 */
function convertWithInkscape(svgPath, pngPath) {
  try {
    execSync(`inkscape --export-type=png --export-filename="${pngPath}" "${svgPath}"`, { stdio: 'ignore' });
    console.log(`✅ Inkscape: ${svgPath} → ${pngPath}`);
    return true;
  } catch (err) {
    console.log(`❌ Inkscape not available: ${err.message}`);
    return false;
  }
}

/**
 * Try to convert using Puppeteer (headless Chrome)
 */
async function convertWithPuppeteer(svgPath, pngPath) {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const svgData = fs.readFileSync(svgPath, 'utf8');
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}`;
    await page.goto(dataUrl);
    await page.screenshot({ path: pngPath, omitBackground: true });
    await browser.close();
    console.log(`✅ Puppeteer: ${svgPath} → ${pngPath}`);
    return true;
  } catch (err) {
    console.log(`❌ Puppeteer not available: ${err.message}`);
    return false;
  }
}

/**
 * Convert a single agent's sprite SVG to PNG
 */
async function convertAgentSprite(agentId) {
  const svgPath = path.join(SPRITES_DIR, `${agentId}-sprite-pokemon.svg`);
  const pngPath = path.join(SPRITES_DIR, `${agentId}-sprite-pokemon.png`);

  if (!fs.existsSync(svgPath)) {
    console.log(`⚠ SVG not found: ${svgPath}`);
    return false;
  }

  console.log(`\n🔧 Converting ${agentId}...`);

  // Try conversion methods in order of preference
  if (await convertWithSharp(svgPath, pngPath)) return true;
  if (convertWithInkscape(svgPath, pngPath)) return true;
  if (await convertWithPuppeteer(svgPath, pngPath)) return true;

  // Fallback: create a placeholder marker
  const marker = path.join(SPRITES_DIR, `${agentId}-sprite-pokemon.conversion-needed`);
  fs.writeFileSync(marker, `PNG conversion required for ${agentId}\nSVG: ${svgPath}\n`);
  console.log(`⚠ Created placeholder marker for ${agentId}`);
  return false;
}

/**
 * Generate Phaser‑compatible atlas JSON for an agent
 */
function generateAtlasJSON(agentId) {
  const { width, height, columns, totalFrames } = FRAMES_LAYOUT;
  const atlas = {
    frames: {},
    meta: {
      app: 'Ferret Dashboard',
      version: '1.0',
      image: `${agentId}-sprite-pokemon.png`,
      format: 'RGBA8888',
      size: { w: width * columns, h: height * Math.ceil(totalFrames / columns) },
      scale: '1',
    },
  };

  for (let i = 0; i < totalFrames; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    atlas.frames[`${agentId}_frame_${i}`] = {
      frame: { x: col * width, y: row * height, w: width, h: height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: width, h: height },
      sourceSize: { w: width, h: height },
    };
  }

  const jsonPath = path.join(SPRITES_DIR, `${agentId}-atlas-pokemon.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(atlas, null, 2));
  console.log(`📄 Atlas JSON: ${jsonPath}`);
}

/**
 * Main conversion pipeline
 */
async function main() {
  console.log('🎨 Converting Pokémon‑style ferret sprites to PNG\n');

  // Ensure output directory exists
  if (!fs.existsSync(SPRITES_DIR)) {
    fs.mkdirSync(SPRITES_DIR, { recursive: true });
  }

  // Convert each agent
  const results = [];
  for (const agent of AGENTS) {
    const success = await convertAgentSprite(agent.id);
    results.push({ agent: agent.id, success });
    if (success) {
      generateAtlasJSON(agent.id);
    }
  }

  // Summary
  console.log('\n📊 Conversion Summary:');
  results.forEach(({ agent, success }) => {
    console.log(`  ${success ? '✅' : '❌'} ${agent}`);
  });

  const successful = results.filter(r => r.success).length;
  console.log(`\n🎯 ${successful}/${AGENTS.length} agents converted successfully.`);

  if (successful === AGENTS.length) {
    console.log('\n✨ All Pokémon sprites ready for Phaser integration!');
    console.log('👉 Update FerretAgent.js to use the new atlas files.');
  } else {
    console.log('\n⚠ Some conversions require manual intervention.');
    console.log('  Install one of:');
    console.log('    npm install sharp');
    console.log('    sudo apt install inkscape');
    console.log('    npm install puppeteer');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('💥 Conversion failed:', err);
    process.exit(1);
  });
}

module.exports = { convertAgentSprite, generateAtlasJSON, AGENTS };