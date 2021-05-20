import Phaser from 'phaser';
import TextureKeys from '../consts/TextureKeys';
import AnimationKeys from '../consts/AnimationKeys';
import SceneKeys from '../consts/SceneKeys';

enum MouseState {
  Running,
  Killed,
  Dead
};

export default class RocketMouse extends Phaser.GameObjects.Container {
  private flames: Phaser.GameObjects.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private mouse: Phaser.GameObjects.Sprite;
  private mouseState = MouseState.Running;
  private emitter: Phaser.Events.EventEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.mouse = scene.add.sprite(0, 0, TextureKeys.RocketMouse).setOrigin(0.5, 1);
    this.flames = scene.add.sprite(-63, -15, TextureKeys.RocketMouse);
    this.createAnimations();
    this.mouse.play(AnimationKeys.RocketMouseRun);
    this.flames.play(AnimationKeys.RocketFlamesOn);

    this.enableJetpack(false);
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.add(this.flames);
    this.add(this.mouse);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setVelocityX(200);
    body.setSize(this.mouse.width * 0.5, this.mouse.height * 0.7);
    body.setOffset(this.mouse.width * -0.3, -this.mouse.height + 15);
    this.emitter = new Phaser.Events.EventEmitter();
  }

  enableJetpack(enabled: boolean) {
    this.flames.setVisible(enabled);
  }

  preUpdate() {
    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (this.mouseState) {
      case MouseState.Running:
        if (this.cursors.space?.isDown) {
          body.setAccelerationY(-600);
          this.enableJetpack(true);
          this.mouse.play(AnimationKeys.RocketMouseFly, true);
        } else {
          body.setAccelerationY(0);
          this.enableJetpack(false);
        }

        if (body.blocked.down) {
          this.mouse.play(AnimationKeys.RocketMouseRun, true);
        } else if (body.velocity.y > 0) {
          this.mouse.play(AnimationKeys.RocketMouseFall, true);
        }
        break;
      case MouseState.Killed:
        body.velocity.x *= 0.97;
        if (body.velocity.x <= 15) {
          this.mouseState = MouseState.Dead;
        }
        break;
      case MouseState.Dead:  
        body.setVelocity(0, 0);
        this.emitter.emit('dead');
        break;
    }
  }

  kill() {
    if (this.mouseState !== MouseState.Running) {
      return;
    }
    this.mouseState = MouseState.Killed;
    this.mouse.play(AnimationKeys.RocketMouseDead);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAccelerationY(0);
    body.setVelocity(1000, 0);
    this.enableJetpack(false);
  }

  registerDeadListener(listener: Function) {
    this.emitter.on('dead', listener);
  }

  private createAnimations() {
    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseRun,
      frames: this.mouse.anims.generateFrameNames(TextureKeys.RocketMouse, {
        start: 1,
        end: 4,
        prefix: 'rocketmouse_run',
        zeroPad: 2,
        suffix: '.png'
      }),
      frameRate: 5,
      repeat: -1
    });

    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseFall,
      frames: [{
        key: TextureKeys.RocketMouse,
        frame: 'rocketmouse_fall01.png'
      }]
    });

    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseFly,
      frames: [{
        key: TextureKeys.RocketMouse,
        frame: 'rocketmouse_fly01.png'
      }]
    });
    
    this.mouse.anims.create({
      key: AnimationKeys.RocketFlamesOn,
      frames: this.mouse.anims.generateFrameNames(TextureKeys.RocketMouse, {
        start: 1,
        end: 2,
        prefix: 'flame',
        suffix: '.png'
      }),
      frameRate: 5,
      repeat: -1
    });

    this.mouse.anims.create({
      key: AnimationKeys.RocketMouseDead,
      frames: this.mouse.anims.generateFrameNames(TextureKeys.RocketMouse, {
        start: 1,
        end: 2,
        prefix: 'rocketmouse_dead',
        zeroPad: 2,
        suffix: '.png'
      }),
      frameRate: 5,
    });
  }
};