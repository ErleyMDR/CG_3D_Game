/**
 * Game - Lógica Principal, Loop de Jogo e Gerenciamento de Cena
 */

class Game {
    constructor() {
        this.canvas = document.getElementById("glcanvas1");
        if (!this.canvas) {
            console.error("Canvas glcanvas1 não encontrado.");
            return;
        }

        // Ajustar resolução interna do canvas para alta nitidez
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.renderer = new WebGLRenderer(this.canvas);
        this.camera = new FPSCamera(this.canvas, {
            x: 0,
            y: 1.7,
            z: 5,
            moveSpeed: 6.0
        });

        this.player = new Player(this.camera);

        // Matriz de projeção perspectiva (FOV = 60°, near = 0.1, far = 100)
        this.projectionMatrix = Mat4.create();

        // Entidades do mundo
        this.floor = new Floor(60, 30);
        this.floorBuffers = this.renderer.createMeshBuffers(this.floor);

        // Objeto animado por transformações geométricas (Requisito III)
        // Passamos a função de animação específica para este cubo (Padrão Strategy)
        this.centerCube = new Cube(
            1.5, 1.5, 1.5,
            [0, 1.5, 0],
            [0.85, 0.25, 0.2, 1.0],
            (cube, deltaTime) => {
                cube.rotationY += 1.2 * deltaTime;
                const nowSec = performance.now() / 1000.0;
                cube.position[1] = 1.5 + Math.sin(nowSec * 2.0) * 0.3;
                rotate(cube.modelMatrix, cube.position, cube.rotationY);
            }
        );
        this.cubeBuffers = this.renderer.createMeshBuffers(this.centerCube);

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

        // 3. Desenha os pilares de referência com cor sólida
        for (let i = 0; i < this.pillars.length; i++) {
            this.renderer.drawMesh(this.pillarBuffers[i], this.pillars[i].modelMatrix, {
                color: this.pillars[i].color
            });
        }
    }
}
