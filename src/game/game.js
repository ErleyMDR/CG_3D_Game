/**
 * Game - Lógica Principal, Loop de Jogo e Gerenciamento de Cena
 */

class Game {
    constructor(canvas, textures, models, config = new GameConfig()) {
        this.canvas = canvas;
        this.config = config;

        this.renderer = new WebGLRenderer(this.canvas, textures, models);
        this.renderer.setAmbientLight(this.config.lighting.ambient.color);

        this.camera = new FPSCamera(this.canvas, this.config.player, this.config.camera);
        this.player = new Player(this.camera, this.config.player, this.config.lighting.flashlight);

        // Matriz de projeção perspectiva
        this.projectionMatrix = Mat4.create();

        // O Mundo cuida das entidades do cenário, seus buffers e seu desenho!
        this.world = new World(this.renderer, models, this.config.environment, this.config.objectives, this.config.monster);

        this.lastTime = 0;
        this._setupEvents();
    }

    static async create(config = new GameConfig()) {
        const canvas = document.getElementById(config.general.canvasId);
        if (!canvas) {
            console.error(`Canvas ${config.general.canvasId} não encontrado.`);
            return;
        }

        // Ajustar resolução interna do canvas para alta nitidez
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const textures = await this._loadTextures(config.assets.textures);
        const models = await this._loadModels(config.assets.models);

        return new Game(canvas, textures, models, config);
    }

    static async _loadModels(modelsMap) {
        const entries = Object.entries(modelsMap);

        const loadedObjects = await Promise.all(
            entries.map(async ([name, src]) => {
                const obj = await ObjReader.loadOBJ(src);
                console.info(`Par de OBJ carregado: ${[name, obj]}`)
                return [name, obj];
            })
        );

        return Object.fromEntries(loadedObjects);
    }

    static async _loadTextures(texturesMap = {}) {
        const entries = Object.entries(texturesMap);

        const loadedTextures = await Promise.all(
            entries.map(async ([name, src]) => {
                const image = await this._loadImage(src);
                console.info(`Par de textura carregado: ${[name, image]}`);
                return [name, image];
            })
        );

        return Object.fromEntries(loadedTextures);
    }

    static _loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => resolve(image);
            image.onerror = () => reject(
                new Error(`Falha ao carregar imagem: ${src}`)
            );

            image.src = src;
        });
    }

    _setupEvents() {
        // Redimensionamento de janela
        window.addEventListener("resize", () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

        // Tecla F para ligar/desligar lanterna (fonte de luz móvel)
        window.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === 'f') {
                this.player.toggleFlashlight();
                const hudFlashlight = document.getElementById("hud-flashlight");
                if (hudFlashlight) {
                    hudFlashlight.textContent = this.player.flashlight.enabled ? "LIGADA" : "DESLIGADA";
                    hudFlashlight.style.color = this.player.flashlight.enabled ? "#4caf50" : "#f44336";
                }
            }
        });
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this._loop(time));
    }

    _loop(currentTime) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000.0, 0.1);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this._loop(time));
    }

    update(deltaTime) {
        // Atualiza movimentação da câmera e jogador
        this.camera.update(deltaTime);

        // Atualiza o mundo, animações e IA do monstro
        const aspect = this.canvas.width / this.canvas.height;
        this.world.update(deltaTime, this.player, this.camera, aspect);
    }

    render() {
        const aspect = this.canvas.width / this.canvas.height;
        Mat4.perspective(
            this.projectionMatrix,
            this.config.camera.fieldOfView,
            aspect,
            this.config.camera.near,
            this.config.camera.far
        );

        // Inicia frame configurando câmera, projeção e luz móvel
        this.renderer.beginFrame(this.camera, this.projectionMatrix, this.player);

        // Delega o desenho de todo o cenário para o World
        this.world.render(this.renderer);
    }
}
