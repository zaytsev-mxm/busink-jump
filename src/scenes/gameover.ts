import Phaser from 'phaser';
import { SceneKeys, RegistryKeys } from '../constants';

export default class GameOver extends Phaser.Scene {
    constructor() {
        super(SceneKeys.GameOver);
    }

    create(): void {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.text(width * 0.5, height * 0.5, 'Game Over', { fontSize: '48px' }).setOrigin(0.5);

        const finalScore = this.registry.get(RegistryKeys.FinalScore) as string;
        this.add.text(width * 0.5, height * 0.25, finalScore, { fontSize: '48px' }).setOrigin(0.5);

        this.input.keyboard!.once('keydown-SPACE', () => {
            this.scene.start(SceneKeys.Game);
        });
    }
}
