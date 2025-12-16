import Phaser from 'phaser';
import Carrot from '../game/carrot';

export default class Game extends Phaser.Scene {
    private carrotCollected = 0;
    private player!: Phaser.Physics.Arcade.Sprite;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private clouds!: Phaser.GameObjects.Group;
    private carrots!: Phaser.Physics.Arcade.Group;
    private carrotsCollectedText!: Phaser.GameObjects.Text;
    private gameMusic!: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'game' });
    }

    init(): void {
        this.carrotCollected = 0;
    }

    preload(): void {
        this.load.setBaseURL('assets/');
        this.load.image('background', 'Background/bg_layer1.png');
        this.load.image('cloud', 'Enemies/cloud.png');
        this.load.image('platform', 'Environment/ground_grass.png');
        this.load.image('bunny-stand', 'Players/bunny1_stand.png');
        this.load.image('bunny-jump', 'Players/bunny1_jump.png');
        this.load.image('carrot', 'Items/carrot.png');
        this.load.audio('jump', 'Audio/phaseJump2.ogg');
        this.load.audio('collect', 'Audio/powerUp5.ogg');
        this.load.audio('background-music', 'Audio/back-home.wav');

        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    create(): void {
        this.add.image(240, 320, 'background').setScrollFactor(1, 0);

        this.clouds = this.add.group();
        for (let index = 0; index < 3; index++) {
            const x = Phaser.Math.Between(0, 480);
            const y = 250 * index;
            this.clouds.add(this.add.image(x, y, 'cloud'));
        }

        this.platforms = this.physics.add.staticGroup();

        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(80, 400);
            const y = 150 * i;

            const platform = this.platforms.create(x, y, 'platform') as Phaser.Physics.Arcade.Sprite;
            platform.setScale(0.5);

            const body = platform.body as Phaser.Physics.Arcade.StaticBody;
            body.updateFromGameObject();
        }

        this.player = this.physics.add.sprite(240, 320, 'bunny-stand').setScale(0.5);
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.checkCollision.up = false;
        playerBody.checkCollision.left = false;
        playerBody.checkCollision.right = false;

        this.physics.add.collider(this.platforms, this.player);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setDeadzone(this.scale.width * 1.5);

        this.carrots = this.physics.add.group({
            classType: Carrot
        });

        this.physics.add.collider(this.platforms, this.carrots);
        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        const style: Phaser.Types.GameObjects.Text.TextStyle = {
            color: '#000',
            fontSize: '24px',
            fontStyle: 'bold',
            backgroundColor: '#f5a040'
        };
        this.carrotsCollectedText = this.add
            .text(240, 10, 'Carrot: 0', style)
            .setScrollFactor(0)
            .setOrigin(0.5, 0)
            .setDepth(1);

        this.gameMusic = this.sound.add('background-music', { loop: true });
        this.gameMusic.play();
    }

    update(): void {
        this.platforms.children.iterate((child) => {
            const platform = child as Phaser.Physics.Arcade.Sprite;
            const scrollY = this.cameras.main.scrollY;

            if (platform.y >= scrollY + 640) {
                platform.y = scrollY - Phaser.Math.Between(80, 120);
                platform.x = Phaser.Math.Between(40, 440);
                const body = platform.body as Phaser.Physics.Arcade.StaticBody;
                body.updateFromGameObject();
                this.addCarrotAbove(platform);
            }
            return true;
        });

        this.clouds.children.iterate((child) => {
            const cloud = child as Phaser.GameObjects.Image;
            const scrollY = this.cameras.main.scrollY;

            if (cloud.y >= scrollY + 800) {
                cloud.y = scrollY - Phaser.Math.Between(20, 60);
            }
            return true;
        });

        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        const touchingDown = playerBody.touching.down;

        if (touchingDown) {
            this.player.setVelocityY(-600);
            this.player.setTexture('bunny-jump');
            this.sound.play('jump');
        }

        const vy = playerBody.velocity.y;
        if (vy > 0 && this.player.texture.key !== 'bunny-stand') {
            this.player.setTexture('bunny-stand');
        }

        if (this.cursors.left.isDown && !touchingDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown && !touchingDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        this.horizontalWrap(this.player);

        const bottomPlatform = this.findBottomMostPlatform();
        if (this.player.y > bottomPlatform.y + 200) {
            this.registry.set('final-score', this.carrotsCollectedText.text);
            this.gameMusic.stop();
            this.scene.start('game-over');
        }
    }

    private horizontalWrap(sprite: Phaser.GameObjects.Sprite): void {
        const halfWidth = sprite.displayWidth * 0.5;
        const gameWidth = this.scale.width;

        if (sprite.x < -halfWidth) {
            sprite.x = gameWidth + halfWidth;
        } else if (sprite.x > gameWidth + halfWidth) {
            sprite.x = -halfWidth;
        }
    }

    private addCarrotAbove(sprite: Phaser.GameObjects.Sprite): Carrot {
        const y = sprite.y - sprite.displayHeight;
        const carrot = this.carrots.get(sprite.x, y, 'carrot') as Carrot;

        carrot.setActive(true);
        carrot.setVisible(true);

        this.add.existing(carrot);

        const body = carrot.body as Phaser.Physics.Arcade.Body;
        body.setSize(carrot.width, carrot.height);

        this.physics.world.enable(carrot);

        return carrot;
    }

    private handleCollectCarrot(
        _player: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
        carrot: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
    ): void {
        const carrotSprite = carrot as Carrot;
        this.carrots.killAndHide(carrotSprite);
        this.physics.world.disableBody(carrotSprite.body as Phaser.Physics.Arcade.Body);

        this.carrotCollected++;
        this.sound.play('collect');
        this.carrotsCollectedText.text = `Carrots: ${this.carrotCollected}`;
    }

    private findBottomMostPlatform(): Phaser.Physics.Arcade.Sprite {
        const platforms = this.platforms.getChildren() as Phaser.Physics.Arcade.Sprite[];
        let bottomPlatform = platforms[0];

        for (let i = 1; i < platforms.length; i++) {
            const platform = platforms[i];
            if (platform.y > bottomPlatform.y) {
                bottomPlatform = platform;
            }
        }

        return bottomPlatform;
    }
}
