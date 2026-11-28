/**
 * World (GameWorld)
 * Responsável por instanciar as entidades do cenário, gerenciar seus
 * buffers de renderização, colisores de física, atualizar animações e desenhar o mundo.
 */

class World {
    constructor(renderer, models = {}, environmentConfig = {}, objectivesConfig = {}, monsterConfig = {}) {
        this.renderer = renderer;

        // Gerenciador central de colisões e visibilidade
        this.collisionManager = new CollisionManager();

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
        this.centerCubeConf = cubeConf;
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

        // Colisor AABB para o Cubo central (bloqueia movimento e visão)
        this.centerCubeCollider = AABBCollider.fromCube(
            cubeConf.initialPosition,
            cubeConf.dimensions,
            { parentEntity: this.centerCube, blocksMovement: true, blocksVision: true }
        );
        this.collisionManager.add(this.centerCubeCollider);

        // Objeto animado por transformações geométricas: Retângulo 2D (Página/Slide)
        const collectibleConf = objectivesConfig.collectibles?.[0] ?? {
            id: 1,
            dimensions: [1.25, 1.0],
            initialPosition: [3, 1.5, -5],
            triggerRadius: 0.8,
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

        // Coletável com gatilho esférico (Trigger)
        this.collectible = new Collectible(this.centerRect, collectibleConf);
        this.collisionManager.add(this.collectible.collider);

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

        // Colisores AABB para todos os pilares
        this.pillarColliders = this.pillars.map((pillar, i) => {
            const p = pillarsList[i];
            const aabb = AABBCollider.fromCube(p.position, p.dimensions, {
                parentEntity: pillar,
                blocksMovement: true,
                blocksVision: true
            });
            return this.collisionManager.add(aabb);
        });

        // 1b. Instanciação do Monstro (Modelo OBJ + Entidade + Colisor em Cápsula)
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

            // Adiciona o colisor do monstro ao gerenciador de física
            if (this.monster.collider) {
                this.collisionManager.add(this.monster.collider);
            }
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
        // Atualiza a animação do cubo e reposiciona sua AABB
        this.centerCube.animate(deltaTime);
        if (this.centerCubeCollider) {
            this.centerCubeCollider.setFromCenterAndSize(
                this.centerCube.position,
                this.centerCubeConf.dimensions
            );
        }

        // Atualiza a animação do slide e seu colisor esférico se ainda não foi coletado
        if (this.collectible && !this.collectible.collected) {
            this.centerRect.animate(deltaTime);
            this.collectible.syncCollider();

            // Detecção de gatilho de coleta (Player x Slide)
            if (player && player.collider) {
                if (player.collider.intersects(this.collectible.collider)) {
                    this.collectible.collect();
                    this.collisionManager.remove(this.collectible.collider);
                    player.collectedCount++;
                    console.log(`[SLIDE COLETADO!] Total: ${player.collectedCount}/${player.totalSlides}`);
                }
            }
        }

        // Detecção de colisão física / proximidade letal Player x Monstro (Game Over)
        if (player && player.alive && this.monster) {
            const dx = player.camera.position[0] - this.monster.position[0];
            const dz = player.camera.position[2] - this.monster.position[2];
            const distToMonster = Math.hypot(dx, dz);

            const playerRadius = player.radius ?? 0.4;
            const monsterRadius = this.monster.radius ?? 0.5;
            const contactDistance = playerRadius + monsterRadius + 0.35; // ~1.25m
            const attackDistance = Math.max(contactDistance, this.monster.stopDistance ?? 1.5);

            const isColliding = (player.collider && this.monster.collider && player.collider.intersects(this.monster.collider)) ||
                                (distToMonster <= attackDistance);

            if (isColliding) {
                this.monster.state = "ATTACKING";
                player.kill();
                console.warn(`[WORLD] GAME OVER! Monstro alcançou o jogador a ${distToMonster.toFixed(2)}m!`);
            }
        }

        // Atualiza a IA e posição do monstro com resolução de obstáculos e LoS
        if (this.monster && this.monsterAI) {
            this.monsterAI.update(deltaTime, this.monster, player, camera, aspect, this.collisionManager);
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

        // 3. Desenha o retângulo 2D (Página/Slide) apenas se ainda NÃO foi coletado
        if (this.collectible && !this.collectible.collected) {
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
        }

        // 4. Desenha os pilares estáticos com textura de parede
        for (let i = 0; i < this.pillars.length; i++) {
            renderer.drawMesh(this.pillarBuffers[i], this.pillars[i].modelMatrix, {
                texture: renderer.textures.walls
            });
        }

        // 5. Desenha o monstro (modelo OBJ) com cor sólida e iluminação de Phong
        if (this.monsterModel && this.monsterBuffers) {
            renderer.drawMesh(this.monsterBuffers, this.monsterModel.modelMatrix, {
                // texture: renderer.textures.statue
                color: this.monsterModel.color
            });
        }
    }
}
