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

    this.shadow = scene.add.ellipse(0, 13, 22, 8, 0x000000, 0.22);
    this.shadow.setDepth(0);

    this.sprite = scene.add.sprite(0, 0, `${this.agentId}-idle_default-0`);
    this.sprite.setOrigin(0.5, 0.72);
    this.sprite.setDepth(1);

    this.statusDot = scene.add.circle(14, -16, 4, STATUS_COLORS.idle, 1);
    this.statusDot.setStrokeStyle(2, 0x11111b, 0.8);
    this.statusDot.setDepth(3);

    this.nameplate = scene.add.text(0, 20, config.name, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '11px',
      color: '#f5e0dc',
      backgroundColor: '#313244',
      padding: { x: 6, y: 2 },
      align: 'center',
    }).setOrigin(0.5, 0);
    this.nameplate.setDepth(3);

    this.taskText = scene.add.text(0, -28, '', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '9px',
      color: '#cdd6f4',
      backgroundColor: '#181825',
      padding: { x: 5, y: 2 },
      wordWrap: { width: 120, useAdvancedWrap: true },
      align: 'center',
    }).setOrigin(0.5, 1);
    this.taskText.setDepth(3);
    this.taskText.setVisible(false);

    this.add([this.shadow, this.sprite, this.statusDot, this.nameplate, this.taskText]);
    this.setSize(48, 56);
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
      y: { from: 0, to: -2 },
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
      scaleX: 1.08,
      scaleY: 1.08,
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
      this.currentStatus = 'idle';
      this.applyStatusVisuals();
    }
  }
}
