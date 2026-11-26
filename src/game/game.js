/**
 * Game - Lógica Principal, Loop de Jogo e Gerenciamento de Cena
 */

let gameTextures = {
    floor: "src/assets/textures/Fabric029_1K-JPG_Color.jpg",
    walls: "src/assets/textures/Bricks073C_1K-JPG_Color.jpg",
    pages: "src/assets/textures/img.png"
};

class Game {
    constructor(canvas, textures) {
        this.canvas = canvas;

        this.renderer = new WebGLRenderer(this.canvas, textures);
        this.camera = new FPSCamera(this.canvas, {
            x: 0,
            y: 1.7,
            z: 8,
            moveSpeed: 6.0
        });

        this.player = new Player(this.camera);

        // Matriz de projeção perspectiva (FOV = 60°, near = 0.1, far = 100)
        this.projectionMatrix = Mat4.create();

        // O Mundo cuida das entidades do cenário, seus buffers e seu desenho!
        this.world = new World(this.renderer);

        this.lastTime = 0;
        this._setupEvents();
    }

    static async create() {
        const canvas = document.getElementById("glcanvas1");
        if (!canvas) {
            console.error("Canvas glcanvas1 não encontrado.");
            return;
        }

        // Ajustar resolução interna do canvas para alta nitidez
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const textures = await this._loadTextures();

        return new Game(canvas, textures);
    }

    static async _loadTextures() {
        const entries = Object.entries(gameTextures);

        const loadedTextures = await Promise.all(
            entries.map(async ([name, src]) => {
                const image = await this._loadImage(src);
                console.info(`Par carregado: ${[name, image]}`);
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

        // Atualiza o mundo e suas animações
        this.world.update(deltaTime);
    }

    render() {
        const aspect = this.canvas.width / this.canvas.height;
        Mat4.perspective(this.projectionMatrix, 60.0, aspect, 0.1, 150.0);

        // Inicia frame configurando câmera, projeção e luz móvel
        this.renderer.beginFrame(this.camera, this.projectionMatrix, this.player);

        // Delega o desenho de todo o cenário para o World
        this.world.render(this.renderer);
    }
}
