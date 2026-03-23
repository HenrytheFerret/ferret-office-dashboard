/**
 * Day/Night Cycle Visual Effects
 * Manages day/night lighting, time progression, and atmospheric effects
 */

export class DayNightCycle {
  constructor(scene, config = {}) {
    this.scene = scene;
    
    // Configuration
    this.cycleDuration = config.cycleDuration || 60000; // 60 seconds per full cycle
    this.startTime = config.startTime || 6; // 6 = morning (6am)
    this.timeOfDay = this.startTime;
    
    // Visual elements
    this.overlayGraphics = null;
    this.ambientLight = config.ambientLight || { r: 1, g: 1, b: 1 };
    this.currentLight = { r: 1, g: 1, b: 1 };
    this.targetLight = { ...this.ambientLight };
    
    // Time tracking
    this.cycleStartTime = Date.now();
    this.isPaused = false;
    
    // Callbacks
    this.onTimeChange = config.onTimeChange || (() => {});
    this.onDayStart = config.onDayStart || (() => {});
    this.onNightStart = config.onNightStart || (() => {});
    this.onSunrise = config.onSunrise || (() => {});
    this.onSunset = config.onSunset || (() => {});
    
    // State tracking
    this.lastHour = this.getHour(this.timeOfDay);
    this.lastPhase = this.getCurrentPhase();
    
    this.init();
  }

  init() {
    // Create overlay graphics for lighting effects
    this.overlayGraphics = this.scene.add.graphics();
    this.overlayGraphics.setDepth(9999);
    
    // Create text display for time (optional debug info)
    if (this.scene.config.debug) {
      this.timeText = this.scene.add.text(10, 10, '', {
        fontSize: '12px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
      });
      this.timeText.setDepth(10000);
    }
  }

  /**
   * Get current hour (0-23)
   */
  getHour(time) {
    return Math.floor(time) % 24;
  }

  /**
   * Get current minute (0-59)
   */
  getMinute(time) {
    return Math.floor((time % 1) * 60);
  }

  /**
   * Determine current phase: "morning", "day", "evening", "night"
   */
  getCurrentPhase() {
    const hour = this.getHour(this.timeOfDay);
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'day';
    if (hour >= 18 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Calculate light color/intensity based on time of day
   */
  calculateLighting(timeOfDay) {
    const hour = this.getHour(timeOfDay) + this.getMinute(timeOfDay) / 60;
    
    let r = 1, g = 1, b = 1;
    
    // Sunrise: 6am - 8am (warm yellow)
    if (hour >= 6 && hour < 8) {
      const progress = (hour - 6) / 2;
      r = 0.7 + progress * 0.3;
      g = 0.6 + progress * 0.3;
      b = 0.4 + progress * 0.2;
    }
    // Morning: 8am - 12pm (neutral white)
    else if (hour >= 8 && hour < 12) {
      r = 1.0;
      g = 0.95;
      b = 0.9;
    }
    // Afternoon: 12pm - 5pm (neutral, slightly bright)
    else if (hour >= 12 && hour < 17) {
      r = 1.0;
      g = 1.0;
      b = 1.0;
    }
    // Sunset: 5pm - 7pm (warm orange)
    else if (hour >= 17 && hour < 19) {
      const progress = (hour - 17) / 2;
      r = 1.0 - progress * 0.4;
      g = 1.0 - progress * 0.5;
      b = 1.0 - progress * 0.7;
    }
    // Evening: 7pm - 9pm (darkening blue)
    else if (hour >= 19 && hour < 21) {
      const progress = (hour - 19) / 2;
      r = 0.6 - progress * 0.4;
      g = 0.5 - progress * 0.3;
      b = 0.3 + progress * 0.3;
    }
    // Night: 9pm - 6am (dark blue)
    else {
      r = 0.2;
      g = 0.25;
      b = 0.4;
    }
    
    return { r: Math.max(0, Math.min(1, r)), g: Math.max(0, Math.min(1, g)), b: Math.max(0, Math.min(1, b)) };
  }

  /**
   * Update the day/night cycle (call each frame)
   */
  update(deltaTime) {
    if (this.isPaused) return;
    
    // Calculate elapsed time and new time of day
    const elapsedMs = Date.now() - this.cycleStartTime;
    const cycleProgress = (elapsedMs % this.cycleDuration) / this.cycleDuration;
    const newTime = this.startTime + cycleProgress * 24;
    this.timeOfDay = newTime % 24;
    
    // Check for phase changes
    const currentPhase = this.getCurrentPhase();
    if (currentPhase !== this.lastPhase) {
      this.lastPhase = currentPhase;
      if (currentPhase === 'day') this.onDayStart();
      if (currentPhase === 'night') this.onNightStart();
      if (currentPhase === 'morning') this.onSunrise();
      if (currentPhase === 'evening') this.onSunset();
    }
    
    // Update lighting
    this.targetLight = this.calculateLighting(this.timeOfDay);
    
    // Smooth lighting transition
    const transitionSpeed = 0.05;
    this.currentLight.r += (this.targetLight.r - this.currentLight.r) * transitionSpeed;
    this.currentLight.g += (this.targetLight.g - this.currentLight.g) * transitionSpeed;
    this.currentLight.b += (this.targetLight.b - this.currentLight.b) * transitionSpeed;
    
    // Draw lighting overlay
    this.drawLightingOverlay();
    
    // Update time display
    if (this.timeText) {
      const hour = this.getHour(this.timeOfDay);
      const minute = this.getMinute(this.timeOfDay);
      this.timeText.setText(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} - ${currentPhase.toUpperCase()}`);
    }
    
    // Trigger callback
    this.onTimeChange(this.timeOfDay, currentPhase);
  }

  /**
   * Draw the lighting overlay on top of the scene
   */
  drawLightingOverlay() {
    const { width, height } = this.scene.game.config;
    
    this.overlayGraphics.clear();
    
    // Darken the scene based on lighting
    const darkness = 1 - ((this.currentLight.r + this.currentLight.g + this.currentLight.b) / 3);
    
    // Use a color overlay with alpha based on time of day
    const overlayColor = Phaser.Display.Color.GetColor(
      Math.floor(this.currentLight.r * 255),
      Math.floor(this.currentLight.g * 255),
      Math.floor(this.currentLight.b * 255)
    );
    
    // Create a subtle tint overlay (multiply blend)
    this.overlayGraphics.fillStyle(overlayColor, 0.2 * darkness);
    this.overlayGraphics.fillRect(0, 0, width, height);
    
    // Add subtle vignette during night
    if (darkness > 0.5) {
      this.drawVignette(darkness);
    }
  }

  /**
   * Draw vignette effect for night time
   */
  drawVignette(intensity) {
    const { width, height } = this.scene.game.config;
    const radius = Math.max(width, height) / 2;
    
    this.overlayGraphics.strokeStyle(0x000000, intensity * 0.3);
    
    // Draw concentric circles for vignette
    for (let i = 0; i < 3; i++) {
      const vignetteRadius = radius * (1 - (i / 3) * 0.3);
      this.overlayGraphics.strokeCircle(
        width / 2,
        height / 2,
        vignetteRadius
      );
    }
  }

  /**
   * Get current time of day as formatted string
   */
  getTimeString() {
    const hour = this.getHour(this.timeOfDay);
    const minute = this.getMinute(this.timeOfDay);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  /**
   * Get current light color as RGB object
   */
  getLightColor() {
    return { ...this.currentLight };
  }

  /**
   * Get current phase
   */
  getPhase() {
    return this.lastPhase;
  }

  /**
   * Set time of day (0-23)
   */
  setTime(hour) {
    this.timeOfDay = hour % 24;
    this.cycleStartTime = Date.now() - ((this.timeOfDay - this.startTime) * this.cycleDuration / 24);
  }

  /**
   * Pause/unpause the cycle
   */
  setPaused(paused) {
    this.isPaused = paused;
  }

  /**
   * Destroy the effect
   */
  destroy() {
    this.overlayGraphics?.destroy();
    this.timeText?.destroy();
  }
}

export default DayNightCycle;
