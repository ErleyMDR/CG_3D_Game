/**
 * Game - Lógica Principal, Loop de Jogo e Gerenciamento de Cena
 */

let gameTextures = {
    floor: "src/assets/textures/Bricks073C_1K-JPG_Color.jpg",
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

        // Entidades do mundo
        this.floor = new Floor(60, 50);
        this.floorBuffers = this.renderer.createMeshBuffers(this.floor);

        // Objeto animado por transformações geométricas (Requisito III)
        // Passamos a função de animação específica para este cubo (Padrão Strategy)
        this.centerCube = new Cube(
            1.5, 1.5, 1.5,
            [-3, 1.5, -5],
            [0.85, 0.25, 0.2, 1.0],
            (cube, deltaTime) => {
                cube.rotationY += 1.2 * deltaTime;
                const nowSec = performance.now() / 1000.0;
                cube.position[1] = 1.5 + Math.sin(nowSec * 2.0) * 0.3;
                rotate(cube.modelMatrix, cube.position, cube.rotationY);
            }
        );
        this.cubeBuffers = this.renderer.createMeshBuffers(this.centerCube);

        // Retângulo Bidimensional animado por transformações geométricas
        // Função de animação igual à do cubo
        this.centerRect = new Rectangle2D(
            1.25, 1.0,
            [3, 1.125, -5],
            null, null,
            (rect, deltaTime) => {
                rect.rotationY += 1.2 * deltaTime;
                const nowSec = performance.now() / 1000.0;
                rect.position[1] = 1.5 + Math.sin(nowSec * 2.0) * 0.3;
                rotate(rect.modelMatrix, rect.position, rect.rotationY);
            }
        );
        this.rectBuffers = this.renderer.createMeshBuffers(this.centerRect);

        // Pilares / referências adicionais de profundidade (sem animação, estáticos)
        this.pillars = [
            new Cube(1, 3, 1, [-8, 1.5, -8], [0.3, 0.5, 0.8, 1.0]),
            new Cube(1, 3, 1, [ 8, 1.5, -8], [0.3, 0.8, 0.4, 1.0]),
            new Cube(1, 3, 1, [-8, 1.5,  8], [0.8, 0.7, 0.2, 1.0]),
            new Cube(1, 3, 1, [ 8, 1.5,  8], [0.7, 0.3, 0.8, 1.0])
        ];
        this.pillarBuffers = this.pillars.map(p => this.renderer.createMeshBuffers(p));

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
                console.info(`Par carregado: ${[name, image]}`)
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

        // Executa a animação do cubo central (passando deltaTime para a animação)
        this.centerCube.animate(deltaTime);
        this.centerRect.animate(deltaTime);
    }

    render() {
        const aspect = this.canvas.width / this.canvas.height;
        Mat4.perspective(this.projectionMatrix, 60.0, aspect, 0.1, 150.0);

        // Inicia frame configurando câmera, projeção e luz móvel
        this.renderer.beginFrame(this.camera, this.projectionMatrix, this.player);

        // 1. Desenha o piso com textura (Requisito IV)
        this.renderer.drawMesh(this.floorBuffers, this.floor.modelMatrix, {
            texture: this.renderer.textures.floor
        });

        // 2. Desenha o cubo animado com cor sólida (Requisitos III e V)
        this.renderer.drawMesh(this.cubeBuffers, this.centerCube.modelMatrix, {
            color: this.centerCube.color
        });

        // Frente: textura
        this.renderer.drawMesh(this.rectBuffers, this.centerRect.modelMatrix, {
                texture: this.renderer.textures.pages,
                first: 0,
                count: 6
        });

        // Verso: cor sólida
        this.renderer.drawMesh(this.rectBuffers, this.centerRect.modelMatrix, {
                color: this.centerRect.backColor,
                first: 6,
                count: 6
        });

        // 3. Desenha os pilares de referência com cor sólida
        for (let i = 0; i < this.pillars.length; i++) {
            this.renderer.drawMesh(this.pillarBuffers[i], this.pillars[i].modelMatrix, {
                texture: this.renderer.textures.walls
            });
        }
    }
}
