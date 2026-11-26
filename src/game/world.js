/**
 * World (GameWorld)
 * Responsável por instanciar as entidades do cenário, gerenciar seus
 * buffers de renderização, atualizar animações e desenhar o mundo.
 */

class World {
    constructor(renderer) {
        this.renderer = renderer;

        // 1. Instanciação das entidades do cenário
        this.floor = new Floor(60, 50);

        // Objeto animado por transformações geométricas: Cubo
        this.centerCube = new Cube(
            1.5, 1.5, 1.5,
            [-3, 1.5, -5],
            [0.85, 0.25, 0.2, 1.0],
            (cube, deltaTime) => {
                cube.rotationY += 1.2 * deltaTime;
                const nowSec = performance.now() / 1000.0;
                cube.position[1] = 1.5 + Math.sin(nowSec * 2.0) * 0.3;
                cube.updateModelMatrix();
            }
        );

        // Objeto animado por transformações geométricas: Retângulo 2D (Página/Slide)
        this.centerRect = new Rectangle2D(
            1.25, 1.0,
            [3, 1.5, -5],
            null, null,
            (rect, deltaTime) => {
                rect.rotationY += 1.2 * deltaTime;
                const nowSec = performance.now() / 1000.0;
                rect.position[1] = 1.5 + Math.sin(nowSec * 2.0) * 0.3;
                rect.updateModelMatrix();
            }
        );

        // Pilares / referências adicionais de profundidade (estáticos)
        this.pillars = [
            new Cube(1, 3, 1, [-8, 1.5, -8], [0.3, 0.5, 0.8, 1.0]),
            new Cube(1, 3, 1, [ 8, 1.5, -8], [0.3, 0.8, 0.4, 1.0]),
            new Cube(1, 3, 1, [-8, 1.5,  8], [0.8, 0.7, 0.2, 1.0]),
            new Cube(1, 3, 1, [ 8, 1.5,  8], [0.7, 0.3, 0.8, 1.0])
        ];

        // 2. Criação dos buffers na GPU
        this.floorBuffers = renderer.createMeshBuffers(this.floor);
        this.cubeBuffers = renderer.createMeshBuffers(this.centerCube);
        this.rectBuffers = renderer.createMeshBuffers(this.centerRect);
        this.pillarBuffers = this.pillars.map(p => renderer.createMeshBuffers(p));
    }

    update(deltaTime) {
        // Atualiza a animação dos objetos com comportamento animado
        this.centerCube.animate(deltaTime);
        this.centerRect.animate(deltaTime);
    }

    render(renderer) {
        // 1. Desenha o piso com textura
        renderer.drawMesh(this.floorBuffers, this.floor.modelMatrix, {
            texture: renderer.textures.floor
        });

        // 2. Desenha o cubo central animado com cor sólida
        renderer.drawMesh(this.cubeBuffers, this.centerCube.modelMatrix, {
            color: this.centerCube.color
        });

        // 3. Desenha o retângulo 2D animado (Frente com textura, verso com cor sólida)
        renderer.drawMesh(this.rectBuffers, this.centerRect.modelMatrix, {
            texture: renderer.textures.pages,
            first: 0,
            count: 6
        });
        renderer.drawMesh(this.rectBuffers, this.centerRect.modelMatrix, {
            color: this.centerRect.backColor,
            first: 6,
            count: 6
        });

        // 4. Desenha os pilares estáticos com textura de parede
        for (let i = 0; i < this.pillars.length; i++) {
            renderer.drawMesh(this.pillarBuffers[i], this.pillars[i].modelMatrix, {
                texture: renderer.textures.walls
            });
        }
    }
}
