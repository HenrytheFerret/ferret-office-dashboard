/**
 * Ferret Office Dashboard — Entry Point
 * POC: Dynamic agent rendering from agents.json config
 */
import Phaser from 'phaser';
import OfficeScene from './scenes/OfficeScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: 1280,
  height: 720,
  backgroundColor: '#1e1e2e',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [OfficeScene],
};

const game = new Phaser.Game(config);

// Update the DOM status overlay
document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = 'Dashboard running';
});

export default game;
