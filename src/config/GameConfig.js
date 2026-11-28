/**
 * GameConfig - Centralização de parâmetros e configurações do jogo
 * Não armazena estado de execução (ex: vida atual, posição mutável, slides já coletados),
 * apenas parâmetros estáticos, valores padrão e regras de inicialização.
 */

class GameConfig {
    constructor(overrides = {}) {
        this.general = {
            title: "3D Horror Maze - Slender / Weeping Angel",
            targetFPS: 60,
            canvasId: "glcanvas1",
            ...overrides.general
        };

        this.assets = {
            textures: {
                floor: "src/assets/textures/Fabric029_1K-JPG_Color.jpg",
                walls: "src/assets/textures/Bricks073C_1K-JPG_Color.jpg",
                statue: "src/assets/textures/Rock020_1K-JPG_Color.jpg",
                pages: "src/assets/textures/img.png"
            },
            models: {
                angel: "src/assets/obj/angel_statue_2.obj"
            },
            ...overrides.assets
        };

        this.player = {
            initialPosition: [0, 1.7, 8],
            walkSpeed: 4.5,
            sprintSpeed: 7.0, // walkSpeed * 1.5
            totalSlides: 8,
            collider: {
                radius: 0.4,
                height: 1.8,
                eyeHeight: 1.7
            },
            ...overrides.player
        };

        this.camera = {
            initialYaw: -90.0, // olha para dentro do cenário (-Z)
            initialPitch: 0.0,
            fieldOfView: 60.0,
            near: 0.1,
            far: 150.0,
            mouseSensitivity: 0.15,
            ...overrides.camera
        };

        this.lighting = {
            ambient: {
                color: [0.12, 0.12, 0.16]
            },
            flashlight: {
                enabled: true,
                color: [1.0, 0.95, 0.8],
                intensity: 1.2
            },
            ...overrides.lighting
        };

        this.environment = {
            floor: {
                size: 60,
                repeatUV: 50
            },
            centerCube: {
                dimensions: [1.5, 1.5, 1.5],
                initialPosition: [-3, 1.5, -5],
                color: [0.85, 0.25, 0.2, 1.0],
                rotationSpeed: 1.2,
                floatSpeed: 2.0,
                floatAmplitude: 0.3
            },
            pillars: [
                { dimensions: [1, 3, 1], position: [-8, 1.5, -8], color: [0.3, 0.5, 0.8, 1.0] },
                { dimensions: [1, 3, 1], position: [ 8, 1.5, -8], color: [0.3, 0.8, 0.4, 1.0] },
                { dimensions: [1, 3, 1], position: [-8, 1.5,  8], color: [0.8, 0.7, 0.2, 1.0] },
                { dimensions: [1, 3, 1], position: [ 8, 1.5,  8], color: [0.7, 0.3, 0.8, 1.0] }
            ],
            ...overrides.environment
        };

        this.monster = {
            initialPosition: [0, 0, -12],
            color: [0.8, 0.8, 0.85, 1.0],
            scale: [1.0, 1.0, 1.0],
            speed: 8.0,
            chaseSpeed: 12.5,
            stopDistance: 1.5,
            detectionDistance: 35.0,
            unfreezeDelay: 0.35,
            collider: {
                radius: 0.5,
                height: 2.85
            },
            ...overrides.monster
        };

        this.objectives = {
            totalRequiredSlides: 8,
            collectibles: [
                {
                    id: 1,
                    dimensions: [1.25, 1.0],
                    initialPosition: [3, 1.5, -5],
                    triggerRadius: 0.8,
                    emissiveColor: [0.7, 0.85, 1.0],
                    emissiveIntensity: 0.3,
                    rotationSpeed: 1.2,
                    floatSpeed: 2.0,
                    floatAmplitude: 0.3
                }
            ],
            ...overrides.objectives
        };
    }
}


const defaultDiff = new GameConfig();
const hardDiff = new GameConfig();
