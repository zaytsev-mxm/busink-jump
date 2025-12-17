import Phaser from 'phaser';
import Carrot from '../game/carrot';
import {
    SceneKeys,
    ImageAssets,
    AudioAssets,
    RegistryKeys,
    GameConfig,
    PlayerConfig,
    PlatformConfig,
    CloudConfig
} from '../constants';

export default class Game extends Phaser.Scene {
    private carrotCollected = 0;
    private player!: Phaser.Physics.Arcade.Sprite;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private clouds!: Phaser.GameObjects.Group;
    private carrots!: Phaser.Physics.Arcade.Group;
    private carrotsCollectedText!: Phaser.GameObjects.Text;
    private gameMusic!: Phaser.Sound.BaseSound;

    // Touch controls
    private touchDirection: 'left' | 'right' | 'none' = 'none';

    constructor() {
        super({ key: SceneKeys.Game });
    }

    init(): void {
        this.carrotCollected = 0;
        this.touchDirection = 'none';
    }

    preload(): void {
        this.load.setBaseURL(GameConfig.AssetsBasePath);

        // Load images
        Object.values(ImageAssets).forEach(({ key, path }) => {
            this.load.image(key, path);
        });

        // Load audio
        Object.values(AudioAssets).forEach(({ key, path }) => {
            this.load.audio(key, path);
        });

        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    create(): void {
        this.add.image(
            GameConfig.Width / 2,
            GameConfig.Height / 2,
            ImageAssets.Background.key
        ).setScrollFactor(1, 0);

        this.clouds = this.add.group();
        for (let index = 0; index < CloudConfig.Count; index++) {
            const x = Phaser.Math.Between(CloudConfig.SpawnXMin, CloudConfig.SpawnXMax);
            const y = CloudConfig.SpacingY * index;
            this.clouds.add(this.add.image(x, y, ImageAssets.Cloud.key));
        }

        this.platforms = this.physics.add.staticGroup();

        for (let i = 0; i < PlatformConfig.Count; i++) {
            const x = Phaser.Math.Between(PlatformConfig.SpawnXMin, PlatformConfig.SpawnXMax);
            const y = PlatformConfig.SpacingY * i;

            const platform = this.platforms.create(x, y, ImageAssets.Platform.key) as Phaser.Physics.Arcade.Sprite;
            platform.setScale(PlatformConfig.Scale);

            const body = platform.body as Phaser.Physics.Arcade.StaticBody;
            body.updateFromGameObject();
        }

        this.player = this.physics.add
            .sprite(PlayerConfig.StartX, PlayerConfig.StartY, ImageAssets.BunnyStand.key)
            .setScale(PlayerConfig.Scale);
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
            .text(GameConfig.Width / 2, 10, 'Dreamies: 0', style)
            .setScrollFactor(0)
            .setOrigin(0.5, 0)
            .setDepth(1);

        this.gameMusic = this.sound.add(AudioAssets.BackgroundMusic.key, { loop: true });
        this.gameMusic.play();

        // Setup touch controls for mobile - tap left/right side of screen to move
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const screenCenter = this.scale.width / 2;
            this.touchDirection = pointer.x < screenCenter ? 'left' : 'right';
        });

        this.input.on('pointerup', () => {
            this.touchDirection = 'none';
        });
    }

    update(): void {
        this.platforms.children.iterate((child) => {
            const platform = child as Phaser.Physics.Arcade.Sprite;
            const scrollY = this.cameras.main.scrollY;

            if (platform.y >= scrollY + GameConfig.Height) {
                platform.y = scrollY - Phaser.Math.Between(
                    PlatformConfig.RecycleOffsetMin,
                    PlatformConfig.RecycleOffsetMax
                );
                platform.x = Phaser.Math.Between(
                    PlatformConfig.RecycleXMin,
                    PlatformConfig.RecycleXMax
                );
                const body = platform.body as Phaser.Physics.Arcade.StaticBody;
                body.updateFromGameObject();
                this.addCarrotAbove(platform);
            }
            return true;
        });

        this.clouds.children.iterate((child) => {
            const cloud = child as Phaser.GameObjects.Image;
            const scrollY = this.cameras.main.scrollY;

            if (cloud.y >= scrollY + CloudConfig.RecycleThreshold) {
                cloud.y = scrollY - Phaser.Math.Between(
                    CloudConfig.RecycleOffsetMin,
                    CloudConfig.RecycleOffsetMax
                );
            }
            return true;
        });

        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        const touchingDown = playerBody.touching.down;

        if (touchingDown) {
            this.player.setVelocityY(PlayerConfig.JumpVelocity);
            this.player.setTexture(ImageAssets.BunnyJump.key);
            this.sound.play(AudioAssets.Jump.key);
        }

        const vy = playerBody.velocity.y;
        if (vy > 0 && this.player.texture.key !== ImageAssets.BunnyStand.key) {
            this.player.setTexture(ImageAssets.BunnyStand.key);
        }

        // Handle both keyboard and touch controls
        const movingLeft = this.cursors.left.isDown || this.touchDirection === 'left';
        const movingRight = this.cursors.right.isDown || this.touchDirection === 'right';

        if (movingLeft && !touchingDown) {
            this.player.setVelocityX(-PlayerConfig.MoveSpeed);
        } else if (movingRight && !touchingDown) {
            this.player.setVelocityX(PlayerConfig.MoveSpeed);
        } else {
            this.player.setVelocityX(0);
        }

        this.horizontalWrap(this.player);

        const bottomPlatform = this.findBottomMostPlatform();
        if (this.player.y > bottomPlatform.y + 200) {
            this.registry.set(RegistryKeys.FinalScore, this.carrotsCollectedText.text);
            this.gameMusic.stop();
            this.scene.start(SceneKeys.GameOver);
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
        const carrot = this.carrots.get(sprite.x, y, ImageAssets.Carrot.key) as Carrot;

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
        this.sound.play(AudioAssets.Collect.key);
        this.carrotsCollectedText.text = `Dreamies: ${this.carrotCollected}`;
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
