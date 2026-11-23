/**
 * Entidades do Jogo: Iluminação e Jogador, Monstro (Em breve)
 */


class Player {
    constructor(camera) {
        this.camera = camera;
        this.collectedCount = 0;
        this.totalSlides = 8;

        // Lanterna (Fonte de luz móvel que acompanha o jogador)
        this.flashlight = {
            enabled: true,
            color: [1.0, 0.95, 0.8], // Luz quente de lanterna
            intensity: 1.2
        };
    }

    toggleFlashlight() {
        this.flashlight.enabled = !this.flashlight.enabled;
    }
}
