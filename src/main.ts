import Phaser from 'phaser';
import Game from './scenes/game';
import GameOver from './scenes/gameover';
import { GameConfig } from './constants';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GameConfig.Width,
    height: GameConfig.Height,
    scene: [Game, GameOver],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: GameConfig.Gravity },
            debug: false
        }
    }
};

export default new Phaser.Game(config);
