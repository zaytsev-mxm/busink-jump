import Phaser from 'phaser';
import Game from './scenes/game';
import GameOver from './scenes/gameover';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 480,
    height: 640,
    scene: [Game, GameOver],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 700 },
            debug: false
        }
    }
};

export default new Phaser.Game(config);
