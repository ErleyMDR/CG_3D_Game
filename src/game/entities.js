/**
 * Entidades do Jogo: Iluminação e Jogador, Monstro (Em breve)
 */


class Player {
    constructor(camera, playerConfig = {}, flashlightConfig = {}) {
        this.camera = camera;
        this.collectedCount = 0;
        this.totalSlides = playerConfig.totalSlides ?? 8;

        // Lanterna (Fonte de luz móvel que acompanha o jogador)
        this.flashlight = {
            enabled: flashlightConfig.enabled ?? true,
            color: flashlightConfig.color ?? [1.0, 0.95, 0.8], // Luz quente de lanterna
            intensity: flashlightConfig.intensity ?? 1.2
        };
    }

    toggleFlashlight() {
        this.flashlight.enabled = !this.flashlight.enabled;
    }
}

class Monster {
    constructor(model, monsterConfig = {}) {
        this.model = model; // ModelObject (geometria + modelMatrix)

        // Posição do monstro no mundo (fonte de verdade)
        this.position = Vec3.create(
            ...(monsterConfig.initialPosition ?? [0, 0, -12])
        );

        // Velocidades
        this.speed = monsterConfig.speed ?? 2.8;
        this.chaseSpeed = monsterConfig.chaseSpeed ?? 4.8;
        this.stopDistance = monsterConfig.stopDistance ?? 1.8;
        this.detectionDistance = monsterConfig.detectionDistance ?? 35.0;
        this.unfreezeDelay = monsterConfig.unfreezeDelay ?? 0.35;

        // Estado da máquina de estados finita (FSM)
        this.state = "IDLE"; // IDLE | CHASING | OBSERVED | ATTACKING
        this.isObserved = false;
        this.timeSinceUnobserved = 0;

        // Altura aproximada do modelo para amostragem de pontos no frustum
        // (calculada a partir da bounding box do OBJ angel_statue_2: minY ≈ 0.01, maxY ≈ 2.87)
        this.height = 2.85;

        // Sincroniza a posição do ModelObject com a posição do Monster
        this._syncModel();
    }

    /** Sincroniza posição e rotação do Monster -> ModelObject, atualizando a matriz do modelo */
    _syncModel() {
        if (this.model) {
            Vec3.set(this.model.position, this.position[0], this.position[1], this.position[2]);
            this.model.updateModelMatrix();
        }
    }

    /** Rotaciona o modelo para encarar uma posição alvo (plano XZ) */
    faceTarget(targetPosition) {
        const dx = targetPosition[0] - this.position[0];
        const dz = targetPosition[2] - this.position[2];
        this.model.rotationY = Math.atan2(dx, dz);
    }
}
