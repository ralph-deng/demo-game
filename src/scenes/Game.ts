import Phaser from 'phaser';
import TextureKeys from '../consts/TextureKeys';
import SceneKeys from '../consts/SceneKeys';
import AnimationKeys from '../consts/AnimationKeys';
import RocketMouse from '../game/RocketMouse';
import LaserObstacle from '../game/LaserObstacle';

export default class Game extends Phaser.Scene {
  private background!: Phaser.GameObjects.TileSprite;
  private mouseHole!: Phaser.GameObjects.Image;
  private window1!: Phaser.GameObjects.Image;
  private window2!: Phaser.GameObjects.Image;
  private bookcase1!: Phaser.GameObjects.Image;
  private bookcase2!: Phaser.GameObjects.Image;
  private windows: Phaser.GameObjects.Image[] = [];
  private bookcases: Phaser.GameObjects.Image[] = [];
  private laserObstacle!: LaserObstacle;
  private mouse!: RocketMouse;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private scoreLabel!: Phaser.GameObjects.Text;
  private score = 0;

  constructor() {
    super(SceneKeys.Game);
  }

  init() {
    this.score = 0;
  }

  create() {
    const width = this.scale.width; 
    const height = this.scale.height; 
    // this.add.image(0, 0, 'background').setOrigin(0, 0);
    this.background = this.add.tileSprite(0, 0, width, height, TextureKeys.Background).setOrigin(0).setScrollFactor(0, 0);
    this.mouseHole = this.add.image(Phaser.Math.Between(500, 1500), 501, TextureKeys.MouseHole);
    this.window1 = this.add.image(Phaser.Math.Between(500, 1500), 200, TextureKeys.Window1);
    this.window2 = this.add.image(Phaser.Math.Between(1700, 2500), 200, TextureKeys.Window2);
    this.windows = [this.window1, this.window2];
    this.bookcase1 = this.add.image(Phaser.Math.Between(2300, 2700), 580, TextureKeys.Bookcase1).setOrigin(0.5, 1);
    this.bookcase2 = this.add.image(Phaser.Math.Between(3000, 3500), 580, TextureKeys.Bookcase2).setOrigin(0.5, 1);
    this.bookcases = [this.bookcase1, this.bookcase2];
    // const mouse = this.physics.add.sprite(width * 0.5, height - 30, TextureKeys.RocketMouse, 'rocketmouse_fly01.png').setOrigin(0.5, 1).play(AnimationKeys.RocketMouseRun);
    this.laserObstacle = new LaserObstacle(this, 900, 100);
    this.add.existing(this.laserObstacle);

    this.coins = this.physics.add.staticGroup();
    this.spawnCoins();

    this.mouse = new RocketMouse(this, width * 0.5, height - 30);
    this.add.existing(this.mouse);
    // const body = mouse.body as Phaser.Physics.Arcade.Body;
    // body.setCollideWorldBounds(true);
    // body.setVelocityX(200);
    // body.setSize(mouse.width, mouse.height);
    // body.setOffset(mouse.width * -0.5, -mouse.height);

    this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, height - 30);
    this.cameras.main.startFollow(this.mouse);
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, height - 55);

    this.physics.add.overlap(this.laserObstacle, this.mouse, this.handleOverlapLaser, undefined, this);

    this.mouse.registerDeadListener(() => {
      if (!this.scene.isActive(SceneKeys.GameOver)) {
        this.scene.run(SceneKeys.GameOver);
        this.input.keyboard.once('keydown-SPACE', () => {
          this.scene.stop(SceneKeys.GameOver);
          this.scene.restart();
        });
      }
    });

    this.physics.add.overlap(this.coins, this.mouse, this.handleCollectCoin, undefined, this);

    this.scoreLabel = this.add.text(10, 10, `Score: ${this.score}`, {
      fontSize: '24px',
      color: '#eeeeee',
      backgroundColor: '#333333',
      shadow: { fill: true, blur: 0, offsetY: 0 },
      padding: { left: 15, right: 15, top: 10, bottom: 10 },
    }).setScrollFactor(0);
  }

  update(t: number, dt: number) {
    this.background.setTilePosition(this.cameras.main.scrollX);
    this.wrapMouseHole();
    this.wrapWindows();
    this.wrapBookcases();
    this.wrapLaserObtacle();
  }

  private wrapMouseHole() {
    const scrollX = this.cameras.main.scrollX;
    const rightEdge = scrollX + this.scale.width;

    if (this.mouseHole.x + this.mouseHole.width < scrollX) {
      this.mouseHole.x = Phaser.Math.Between(rightEdge + 100, rightEdge + 1000);
    }
  }

  private wrapWindows() {
    const scrollX = this.cameras.main.scrollX;
    const rightEdge = scrollX + this.scale.width;

    let width = this.window1.width * 2;
    if (this.window1.x + width < scrollX) {
      this.window1.x = Phaser.Math.Between(rightEdge + width + 100, rightEdge + width + 1000);
      const overlap = this.bookcases.find(bookcase => {
        return Math.abs(this.window1.x - bookcase.x) <= this.window1.width;
      });
      this.window1.visible = !overlap;
    }

    width = this.window2.width;
    if (this.window2.x + width < scrollX) {
      this.window2.x = Phaser.Math.Between(this.window1.x + width, this.window1.x + width + 1000);
      const overlap = this.bookcases.find(bookcase => {
        return Math.abs(this.window2.x - bookcase.x) <= this.window2.width;
      });
      this.window2.visible = !overlap;
    }
  }

  private wrapBookcases() {
    const scrollX = this.cameras.main.scrollX;
    const rightEdge = scrollX + this.scale.width;

    let width = this.bookcase1.width * 2;
    if (this.bookcase1.x + width < scrollX) {
      this.bookcase1.x = Phaser.Math.Between(rightEdge + width + 100, rightEdge + width + 750);
      const overlap = this.windows.find(window => {
        return Math.abs(this.bookcase1.x - window.x) <= window.width;
      });
      this.bookcase1.visible = !overlap;

      this.spawnCoins();
    }

    width = this.bookcase2.width;
    if (this.bookcase2.x + width < scrollX) {
      this.bookcase2.x = Phaser.Math.Between(this.bookcase1.x + width, this.bookcase1.x + width + 750);
      const overlap = this.windows.find(window => {
        return Math.abs(this.bookcase2.x - window.x) <= window.width;
      });
      this.bookcase2.visible = !overlap;
    }
  }

  private wrapLaserObtacle() {
    const scrollX = this.cameras.main.scrollX;
    const rightEdge = scrollX + this.scale.width;
    const body = this.laserObstacle.body as Phaser.Physics.Arcade.StaticBody;

    const width = body.width;
    if (this.laserObstacle.x + width < scrollX) {
      this.laserObstacle.x = Phaser.Math.Between(rightEdge + width, rightEdge + width + 1000);
      this.laserObstacle.y = Phaser.Math.Between(0, 300);
    }
    body.position.x = this.laserObstacle.x + body.offset.x;
    body.position.y = this.laserObstacle.y;
  }

  private handleOverlapLaser(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
    this.mouse.kill();
  }

  private spawnCoins() {
    this.coins.children.each(child => {
      const coin = child as Phaser.Physics.Arcade.Sprite;
      this.coins.killAndHide(coin);
      coin.body.enable = false;
    });

    const scrollX = this.cameras.main.scrollX;
    const rightEdge = scrollX + this.scale.width;

    let x = rightEdge + 100;
    const numCoins = Phaser.Math.Between(15, 30);

    for (let i = 0; i < numCoins; ++i) {
      const coin = this.coins.get(x, Phaser.Math.Between(100, this.scale.height - 100), TextureKeys.Coin) as Phaser.Physics.Arcade.Sprite;

      coin.setVisible(true);
      coin.setActive(true);

      const body = coin.body as Phaser.Physics.Arcade.StaticBody;
      body.setCircle(body.width * 0.5);
      body.enable = true;
      body.updateFromGameObject();

      x += coin.width * 1.5;
    }
  }

  private handleCollectCoin(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
    const coin = obj2 as Phaser.Physics.Arcade.Sprite;
    this.coins.killAndHide(coin);
    coin.body.enable = false;

    this.score += 1;
    this.scoreLabel.text = `Score: ${this.score}`;
  }
};