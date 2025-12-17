// Scene keys
export const SceneKeys = {
    Game: 'game',
    GameOver: 'game-over'
} as const;

// Image asset keys and paths
export const ImageAssets = {
    Background: { key: 'background', path: 'Background/bg_layer1.png' },
    Cloud: { key: 'cloud', path: 'Enemies/cloud.png' },
    Platform: { key: 'platform', path: 'Environment/ground_grass.png' },
    BunnyStand: { key: 'bunny-stand', path: 'Players/cat1_stand.png' },
    BunnyJump: { key: 'bunny-jump', path: 'Players/cat1_jump.png' },
    Carrot: { key: 'carrot', path: 'Items/dreamies.png' }
} as const;

// Audio asset keys and paths
export const AudioAssets = {
    Jump: { key: 'jump', path: 'Audio/phaseJump2.ogg' },
    Collect: { key: 'collect', path: 'Audio/powerUp5.ogg' },
    BackgroundMusic: { key: 'background-music', path: 'Audio/back-home.wav' }
} as const;

// Registry keys for cross-scene data
export const RegistryKeys = {
    FinalScore: 'final-score'
} as const;

// Game configuration
export const GameConfig = {
    Width: 480,
    Height: 640,
    Gravity: 700,
    AssetsBasePath: 'assets/'
} as const;

// Player configuration
export const PlayerConfig = {
    StartX: 240,
    StartY: 320,
    Scale: 0.5,
    JumpVelocity: -600,
    MoveSpeed: 200
} as const;

// Platform configuration
export const PlatformConfig = {
    Count: 5,
    Scale: 0.5,
    SpawnXMin: 80,
    SpawnXMax: 400,
    RecycleXMin: 40,
    RecycleXMax: 440,
    SpacingY: 150,
    RecycleOffsetMin: 80,
    RecycleOffsetMax: 120
} as const;

// Cloud configuration
export const CloudConfig = {
    Count: 3,
    SpawnXMin: 0,
    SpawnXMax: 480,
    SpacingY: 250,
    RecycleOffsetMin: 20,
    RecycleOffsetMax: 60,
    RecycleThreshold: 800
} as const;
