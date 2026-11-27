/**
 * World (GameWorld)
 * Responsável por instanciar as entidades do cenário, gerenciar seus
 * buffers de renderização, atualizar animações e desenhar o mundo.
 */

class World {
    constructor(renderer, models = {}, environmentConfig = {}, objectivesConfig = {}, monsterConfig = {}) {
        this.renderer = renderer;

        // 1. Instanciação das entidades do cenário
        const floorConf = environmentConfig.floor ?? { size: 60, repeatUV: 50 };
        this.floor = new Floor(floorConf.size, floorConf.repeatUV);

        // Objeto animado por transformações geométricas: Cubo
        const cubeConf = environmentConfig.centerCube ?? {
            dimensions: [1.5, 1.5, 1.5],
            initialPosition: [-3, 1.5, -5],
            color: [0.85, 0.25, 0.2, 1.0],
            rotationSpeed: 1.2,
            floatSpeed: 2.0,
            floatAmplitude: 0.3
        };
        this.centerCube = new Cube(
            cubeConf.dimensions[0], cubeConf.dimensions[1], cubeConf.dimensions[2],
            cubeConf.initialPosition,
            cubeConf.color,
            (cube, deltaTime) => {
                cube.rotationY += cubeConf.rotationSpeed * deltaTime;
                const nowSec = performance.now() / 1000.0;
                cube.position[1] = cubeConf.initialPosition[1] + Math.sin(nowSec * cubeConf.floatSpeed) * cubeConf.floatAmplitude;
                cube.updateModelMatrix();
            }
        );

        // Objeto animado por transformações geométricas: Retângulo 2D (Página/Slide)
        // Possui emissão própria (brilho no escuro) para se destacar no cenário
        const collectibleConf = objectivesConfig.collectibles?.[0] ?? {
            dimensions: [1.25, 1.0],
            initialPosition: [3, 1.5, -5],
            emissiveColor: [0.7, 0.85, 1.0],
            emissiveIntensity: 0.6,
            rotationSpeed: 1.2,
            floatSpeed: 2.0,
            floatAmplitude: 0.3
        };
        this.centerRect = new Rectangle2D(
            collectibleConf.dimensions[0], collectibleConf.dimensions[1],
            collectibleConf.initialPosition,
            null, null,
            (rect, deltaTime) => {
                rect.rotationY += collectibleConf.rotationSpeed * deltaTime;
                const nowSec = performance.now() / 1000.0;
                rect.position[1] = collectibleConf.initialPosition[1] + Math.sin(nowSec * collectibleConf.floatSpeed) * collectibleConf.floatAmplitude;
                rect.updateModelMatrix();
            },
            collectibleConf.emissiveColor,
            collectibleConf.emissiveIntensity
        );

        // Pilares / referências adicionais de profundidade (estáticos)
        const pillarsList = environmentConfig.pillars ?? [
            { dimensions: [1, 3, 1], position: [-8, 1.5, -8], color: [0.3, 0.5, 0.8, 1.0] },
            { dimensions: [1, 3, 1], position: [ 8, 1.5, -8], color: [0.3, 0.8, 0.4, 1.0] },
            { dimensions: [1, 3, 1], position: [-8, 1.5,  8], color: [0.8, 0.7, 0.2, 1.0] },
            { dimensions: [1, 3, 1], position: [ 8, 1.5,  8], color: [0.7, 0.3, 0.8, 1.0] }
        ];
        this.pillars = pillarsList.map(p =>
            new Cube(p.dimensions[0], p.dimensions[1], p.dimensions[2], p.position, p.color)
        );

        // 1b. Instanciação do Monstro (Modelo OBJ + Entidade)
        this.monsterModel = null;
        this.monster = null;
        this.monsterBuffers = null;
        this.monsterAI = null;

        if (models.angel) {
            this.monsterModel = new ModelObject(
                models.angel,
                monsterConfig.initialPosition ?? [0, 0, -12],
                monsterConfig.color ?? [0.8, 0.8, 0.85, 1.0],
                null,
                monsterConfig.scale ?? [1, 1, 1]
            );
            this.monster = new Monster(this.monsterModel, monsterConfig);
            this.monsterBuffers = renderer.createMeshBuffers(this.monsterModel);
            this.monsterAI = new MonsterAI();
        } else {
            console.warn("World: Modelo 'angel' não encontrado em models. Monstro não será renderizado.");
        }

        // 2. Criação dos buffers na GPU
        this.floorBuffers = renderer.createMeshBuffers(this.floor);
        this.cubeBuffers = renderer.createMeshBuffers(this.centerCube);
        this.rectBuffers = renderer.createMeshBuffers(this.centerRect);
        this.pillarBuffers = this.pillars.map(p => renderer.createMeshBuffers(p));
    }

    update(deltaTime, player, camera, aspect) {
        // Atualiza a animação dos objetos com comportamento animado
        this.centerCube.animate(deltaTime);
        this.centerRect.animate(deltaTime);

        // Atualiza a IA e posição do monstro
        if (this.monster && this.monsterAI) {
            this.monsterAI.update(deltaTime, this.monster, player, camera, aspect);
        }
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

        // 3. Desenha o retângulo 2D animado (Frente com textura e emissão, verso com cor sólida)
        renderer.drawMesh(this.rectBuffers, this.centerRect.modelMatrix, {
            texture: renderer.textures.pages,
            first: 0,
            count: 6,
            emissiveColor: this.centerRect.emissiveColor,
            emissiveIntensity: this.centerRect.emissiveIntensity
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

        // 5. Desenha o monstro (modelo OBJ) com cor sólida e iluminação de Phong
        if (this.monsterModel && this.monsterBuffers) {
            renderer.drawMesh(this.monsterBuffers, this.monsterModel.modelMatrix, {
                color: this.monsterModel.color
            });
        }
    }
}
