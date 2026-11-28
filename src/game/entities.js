/**
 * Entidades do Jogo: Jogador, Monstro e Coletáveis (Slides/Páginas)
 */

class Player {
    constructor(camera, playerConfig = {}, flashlightConfig = {}) {
        this.alive = true;
        this.camera = camera;
        this.collectedCount = 0;
        this.totalSlides = playerConfig.totalSlides ?? 8;

        // Configurações do colisor em cápsula
        const colConf = playerConfig.collider ?? {};
        this.radius = colConf.radius ?? 0.4;
        this.height = colConf.height ?? 1.8;
        this.eyeHeight = colConf.eyeHeight ?? 1.7;

        this.collider = new CapsuleCollider(this.radius, this.height, [0, 0, 0], {
            parentEntity: this,
            blocksMovement: true,
            blocksVision: false
        });
        this.collider.syncWithEye(this.camera.position, this.eyeHeight);

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

    /**
     * Sincroniza o colisor com a posição atual da câmera
     */
    syncCollider() {
        this.collider.syncWithEye(this.camera.position, this.eyeHeight);
    }

    /**
     * Mata o jogador
     * */
    kill() {
        console.log("Player foi pego e assassinado!")
        this.alive = false;
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

        // Altura aproximada do modelo para amostragem de pontos no frustum e colisor
        this.height = 2.85;

        // Colisor em cápsula do monstro
        const colConf = monsterConfig.collider ?? {};
        this.radius = colConf.radius ?? 0.5;
        this.collider = new CapsuleCollider(this.radius, this.height, this.position, {
            parentEntity: this,
            blocksMovement: true,
            blocksVision: true
        });

        // Sincroniza a posição do ModelObject e do Collider
        this._syncModel();
    }

    /** Sincroniza posição e rotação do Monster -> ModelObject e Collider */
    _syncModel() {
        if (this.model) {
            Vec3.set(this.model.position, this.position[0], this.position[1], this.position[2]);
            this.model.updateModelMatrix();
        }
        if (this.collider) {
            this.collider.syncWithBase(this.position);
        }
    }

    /** Rotaciona o modelo para encarar uma posição alvo (plano XZ) */
    faceTarget(targetPosition) {
        const dx = targetPosition[0] - this.position[0];
        const dz = targetPosition[2] - this.position[2];
        this.model.rotationY = Math.atan2(dx, dz);
    }
}

class Collectible {
    /**
     * @param {GeometryObject} geometry - Objeto visual renderizável (ex: Rectangle2D)
     * @param {object} config - Configurações do item
     */
    constructor(geometry, config = {}) {
        this.geometry = geometry;
        this.id = config.id ?? 1;
        this.collected = false;
        this.soundEffect = new Audio("src/assets/sound/651515__1bob__grab-item.wav")

        const triggerRadius = config.triggerRadius ?? 0.8;
        this.collider = new SphereCollider(geometry.position, triggerRadius, {
            isTrigger: true,
            blocksMovement: false,
            blocksVision: false,
            parentEntity: this
        });
    }

    /**
     * Marca o item como coletado
     */
    collect() {
        this.collected = true;
        this.soundEffect.play().then(r => r);
    }

    /**
     * Atualiza a posição do trigger se o objeto flutuar/animar
     */
    syncCollider() {
        if (this.geometry && this.collider) {
            this.collider.setPosition(this.geometry.position);
        }
    }
}
