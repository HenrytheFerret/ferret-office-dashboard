import Phaser from 'phaser';

const STATUS_COLORS = {
  idle: 0xa6adc8,
  working: 0x89dceb,
  blocked: 0xf38ba8,
  celebrating: 0xf9e2af,
  in_meeting: 0xcba6f7,
};

const STATUS_TO_ANIMATION = {
  idle: 'idle_default',
  working: 'working_desk',
  blocked: 'anxious_pace',
  celebrating: 'celebrate_dook',
  in_meeting: 'idle_dook',
};

export default class FerretAgent extends Phaser.GameObjects.Container {
  constructor(scene, config) {
    const spawn = config.initialPosition || config.deskPosition || { x: 0, y: 0 };
    super(scene, spawn.x, spawn.y);

    this.scene = scene;
    this.config = config;
    this.agentId = config.id;
    this.currentStatus = 'idle';
    this.currentTask = '';
    this.currentAnimation = 'idle_default';
    this.moveTween = null;
    this.bobTween = null;

    this.shadow = scene.add.ellipse(0, 20, 32, 12, 0x000000, 0.22); // Adjusted for larger sprite
    this.shadow.setDepth(0);

    // Initialize with the first frame of the default idle animation from the atlas
    this.sprite = scene.add.sprite(0, 0, this.config.spriteSheetKey, `${this.agentId}_frame_0`);
    this.sprite.setOrigin(0.5, 0.75); // Adjusted origin for 64x64 pixel art frames
    this.sprite.setDepth(1);

    this.statusDot = scene.add.circle(20, -28, 6, STATUS_COLORS.idle, 1); // Adjusted position and size
    this.statusDot.setStrokeStyle(2, 0x11111b, 0.8);
    this.statusDot.setDepth(3);

    this.nameplate = scene.add.text(0, 30, config.name, { // Adjusted position
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px', // Adjusted font size
      color: '#f5e0dc',
      backgroundColor: '#313244',
      padding: { x: 8, y: 3 }, // Adjusted padding
      align: 'center',
    }).setOrigin(0.5, 0);
    this.nameplate.setDepth(3);

    this.taskText = scene.add.text(0, -40, '', { // Adjusted position
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px', // Adjusted font size
      color: '#cdd6f4',
      backgroundColor: '#181825',
      padding: { x: 6, y: 3 }, // Adjusted padding
      wordWrap: { width: 150, useAdvancedWrap: true }, // Adjusted width
      align: 'center',
    }).setOrigin(0.5, 1);
    this.taskText.setDepth(3);
    this.taskText.setVisible(false);

    this.add([this.shadow, this.sprite, this.statusDot, this.nameplate, this.taskText]);
    this.setSize(64, 72); // Adjusted container size
    this.setDepth(10 + Math.round(this.y));

    scene.add.existing(this);

    this.playAnimation('idle_default');
    this.startIdleBob();
  }

  getDeskPosition() {
    return this.config.deskPosition || { x: this.x, y: this.y };
  }

  playAnimation(name) {
    const key = `${this.agentId}-${name}`;
    if (!this.scene.anims.exists(key)) {
      console.warn(`Animation key ${key} does not exist for agent ${this.agentId}`);
      return;
    }

    this.currentAnimation = name;
    this.sprite.play(key, true);
  }

  startIdleBob() {
    if (this.bobTween) {
      this.bobTween.stop();
    }

    this.bobTween = this.scene.tweens.add({
      targets: this.sprite,
      y: { from: 0, to: -4 }, // Adjusted bob height for larger sprite
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  stopIdleBob() {
    if (this.bobTween) {
      this.bobTween.stop();
      this.bobTween = null;
    }
    this.sprite.y = 0;
  }

  moveTo(target, speed = 100) {
    if (!target) return;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const duration = Math.max(250, (distance / speed) * 1000);

    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }

    this.stopIdleBob();
    this.playAnimation('move_walk');
    this.sprite.setFlipX(target.x < this.x);

    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y,
      duration,
      ease: 'Sine.Out',
      onUpdate: () => {
        this.setDepth(10 + Math.round(this.y));
      },
      onComplete: () => {
        this.moveTween = null;
        this.applyStatusVisuals();
      },
    });
  }

  setTask(task) {
    this.currentTask = task || '';
    this.taskText.setText(this.currentTask);
    this.taskText.setVisible(Boolean(this.currentTask));
  }

  applyStatusVisuals(explicitAnimation = null) {
    const animation = explicitAnimation || STATUS_TO_ANIMATION[this.currentStatus] || 'idle_default';
    this.statusDot.setFillStyle(STATUS_COLORS[this.currentStatus] || STATUS_COLORS.idle, 1);

    if (!this.moveTween && this.currentStatus === 'idle') {
      this.startIdleBob();
    }

    if (this.currentStatus !== 'idle') {
      this.stopIdleBob();
    }

    this.playAnimation(animation);
  }

  updateStatus(status = 'idle', position = null, animation = null, currentTask = '') {
    this.currentStatus = status || 'idle';
    if (currentTask !== undefined) {
      this.setTask(currentTask);
    }

    const target = position || (this.currentStatus === 'working' ? this.getDeskPosition() : null);
    if (target && (Math.abs(target.x - this.x) > 2 || Math.abs(target.y - this.y) > 2)) {
      this.moveTo(target);
    } else {
      this.applyStatusVisuals(animation);
    }
  }

  pulseCelebrate() {
    this.scene.tweens.add({
      targets: [this.sprite, this.shadow],
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 180,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.Out',
    });
  }

  update() {
    this.setDepth(10 + Math.round(this.y));
    if (this.currentStatus === 'celebrating' && !this.moveTween) {
      this.pulseCelebrate();
      // To prevent celebration loop, reset status after pulse completes
      this.scene.time.delayedCall(180 * 2 * 3 + 100, () => { // duration * yoyo * repeat + buffer
        if (this.currentStatus === 'celebrating') {
          this.currentStatus = 'idle';
          this.applyStatusVisuals();
        }
      });
    }
  }
}
