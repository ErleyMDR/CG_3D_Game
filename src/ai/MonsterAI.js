/**
 * MonsterAI — Inteligência Artificial do Monstro (Weeping Angel)
 *
 * Responsabilidades:
 * 1. Detecção de observação pelo frustum da câmera com Raycasting para Linha de Visão (LoS).
 * 2. Máquina de estados finita (FSM): IDLE → CHASING ↔ OBSERVED → ATTACKING.
 * 3. Perseguição direta (Seek Steering) no plano XZ com resolução de colisão.
 * 4. Balanceamento: velocidade progressiva e atraso antes de reiniciar perseguição.
 */

class MonsterAI {
    constructor() {
        // Reutilizáveis para evitar alocações por frame
        this._direction = Vec3.create();
        this._samplePoint = Vec3.create();
    }

    // ─────────────────────────────────────────────────
    //  1. Detecção de observação — Frustum Check + LoS
    // ─────────────────────────────────────────────────

    /**
     * Verifica se um ponto 3D está dentro do frustum da câmera.
     *
     * @param {FPSCamera} camera  - Câmera FPS do jogador.
     * @param {Float32Array|number[]} point - Posição 3D a verificar.
     * @param {number} aspectRatio - Largura / Altura do canvas.
     * @returns {boolean}
     */
    isInsideFrustum(camera, point, aspectRatio) {
        const dx = point[0] - camera.position[0];
        const dy = point[1] - camera.position[1];
        const dz = point[2] - camera.position[2];

        // Profundidade ao longo do eixo forward
        const depth = dx * camera.forward[0] + dy * camera.forward[1] + dz * camera.forward[2];

        // Fora do intervalo [near, far]?
        if (depth < camera.near || depth > camera.far) {
            return false;
        }

        // Projeção horizontal (eixo right) e vertical (eixo up)
        const horizontal = Math.abs(dx * camera.right[0] + dy * camera.right[1] + dz * camera.right[2]);
        const vertical   = Math.abs(dx * camera.up[0]    + dy * camera.up[1]    + dz * camera.up[2]);

        // FOV em radianos (camera.fieldOfView está em graus)
        const halfFovY = (camera.fieldOfView * Math.PI / 180.0) / 2.0;
        const halfFovX = Math.atan(Math.tan(halfFovY) * aspectRatio);

        const maxHorizontal = depth * Math.tan(halfFovX);
        const maxVertical   = depth * Math.tan(halfFovY);

        return horizontal <= maxHorizontal && vertical <= maxVertical;
    }

    /**
     * Verifica se o monstro está sendo observado pelo jogador,
     * testando 3 pontos amostrais (base, tronco, cabeça) contra o frustum
     * e lançando raios (Raycast LoS) para validar se há paredes/pilares ocluindo a visão.
     *
     * @param {Monster} monster
     * @param {FPSCamera} camera
     * @param {number} aspectRatio
     * @param {CollisionManager} [collisionManager=null]
     * @returns {boolean}
     */
    isMonsterObserved(monster, camera, aspectRatio, collisionManager = null) {
        const mx = monster.position[0];
        const my = monster.position[1];
        const mz = monster.position[2];

        // Pontos amostrais ao longo da altura do modelo
        const sampleOffsets = [0.3, 1.4, monster.height]; // base, tronco, cabeça

        for (let i = 0; i < sampleOffsets.length; i++) {
            Vec3.set(this._samplePoint, mx, my + sampleOffsets[i], mz);

            // 1. O ponto está dentro da pirâmide visual (Frustum)?
            if (this.isInsideFrustum(camera, this._samplePoint, aspectRatio)) {
                // 2. Se temos CollisionManager, testa se existe obstáculo bloqueando a visão (Line of Sight)
                if (collisionManager) {
                    const dx = this._samplePoint[0] - camera.position[0];
                    const dy = this._samplePoint[1] - camera.position[1];
                    const dz = this._samplePoint[2] - camera.position[2];
                    const distToPoint = Math.hypot(dx, dy, dz);

                    if (distToPoint > 1e-4) {
                        const ray = new Ray(camera.position, [dx, dy, dz]);
                        // Lança raio procurando obstáculos que bloqueiam visão (ignora o próprio monstro)
                        const hit = collisionManager.raycast(
                            ray,
                            distToPoint - 0.1, // pequena margem antes do ponto
                            c => c.blocksVision && c !== monster.collider
                        );

                        // Se atingiu uma parede/obstáculo antes do ponto, este ponto está oculto
                        if (hit.hit) {
                            continue; // Tenta o próximo ponto amostral
                        }
                    }
                }

                // Ponto está no frustum e possui linha de visão limpa!
                return true;
            }
        }

        return false;
    }

    // ─────────────────────────────────────────────────
    //  2. Seek Steering — Perseguição direta no plano XZ
    // ─────────────────────────────────────────────────

    /**
     * Move o monstro em direção ao jogador no plano XZ com suporte a resolução de colisão.
     *
     * @param {Monster} monster
     * @param {Player} player
     * @param {number} deltaTime
     * @param {CollisionManager} [collisionManager=null]
     */
    seek(monster, player, deltaTime, collisionManager = null) {
        const targetPos = player.camera.position;

        const dx = targetPos[0] - monster.position[0];
        const dz = targetPos[2] - monster.position[2];
        const distance = Math.hypot(dx, dz);

        const playerRadius = player.radius ?? 0.4;
        const monsterRadius = monster.radius ?? 0.5;
        const contactDistance = playerRadius + monsterRadius + 0.35;
        const attackDistance = Math.max(contactDistance, monster.stopDistance ?? 1.5);

        if (distance <= attackDistance) {
            monster.state = "ATTACKING";
            player.kill();
            return;
        }

        // Velocidade progressiva: mais rápido quando próximo
        const speed = distance > 10.0 ? monster.speed : monster.chaseSpeed;

        const dirX = dx / distance;
        const dirZ = dz / distance;
        const movement = [dirX * speed * deltaTime, 0, dirZ * speed * deltaTime];

        if (collisionManager && monster.collider) {
            const resolved = collisionManager.resolveMovement(
                monster.collider,
                monster.position,
                movement,
                false, // isEyePosition = false
                0,
                c => c.blocksMovement && !c.isTrigger && c !== player.collider
            );
            monster.position[0] = resolved[0];
            monster.position[1] = resolved[1];
            monster.position[2] = resolved[2];
        } else {
            monster.position[0] += movement[0];
            monster.position[2] += movement[2];
        }

        // Rotaciona o modelo para encarar o jogador
        monster.faceTarget(targetPos);

        // Sincroniza o ModelObject com a nova posição
        monster._syncModel();
    }

    // ─────────────────────────────────────────────────
    //  3. FSM — Máquina de Estados
    // ─────────────────────────────────────────────────

    /**
     * Atualiza a IA do monstro a cada frame.
     *
     * @param {number} deltaTime
     * @param {Monster} monster
     * @param {Player} player
     * @param {FPSCamera} camera
     * @param {number} aspectRatio
     * @param {CollisionManager} [collisionManager=null]
     */
    update(deltaTime, monster, player, camera, aspectRatio, collisionManager = null) {
        if (!player || !player.alive) return;

        // 1. Distância ao jogador no plano XZ
        const dx = camera.position[0] - monster.position[0];
        const dz = camera.position[2] - monster.position[2];
        const distanceToPlayer = Math.hypot(dx, dz);

        // 2. Verificação de Ataque / Colisão Letal Imediata
        // Se o monstro já alcançou o jogador (dentro da distância de ataque ou colisão física),
        // ele ataca imediatamente, mesmo que o jogador esteja olhando ou tente congelá-lo à queima-roupa!
        const playerRadius = player.radius ?? 0.4;
        const monsterRadius = monster.radius ?? 0.5;
        const contactDistance = playerRadius + monsterRadius + 0.35; // ~1.25m
        const attackDistance = Math.max(contactDistance, monster.stopDistance ?? 1.5);

        const isColliding = (player.collider && monster.collider && player.collider.intersects(monster.collider)) ||
                            (distanceToPlayer <= attackDistance);

        if (isColliding || monster.state === "ATTACKING") {
            monster.state = "ATTACKING";
            player.kill();
            console.warn(`[MONSTER AI] GAME OVER! O monstro te pegou a ${distanceToPlayer.toFixed(2)}m!`);
            return;
        }

        // 3. Verificar observação (Frustum + Line of Sight)
        const observed = this.isMonsterObserved(monster, camera, aspectRatio, collisionManager);
        monster.isObserved = observed;

        // 4. Transições de estado
        if (observed) {
            // Jogador está olhando para o monstro → congelar!
            monster.state = "OBSERVED";
            monster.timeSinceUnobserved = 0;
            return; // Nenhum movimento permitido
        }

        // Não está sendo observado:
        switch (monster.state) {
            case "IDLE":
                // Detectou o jogador dentro do raio?
                if (distanceToPlayer <= monster.detectionDistance) {
                    monster.state = "CHASING";
                }
                break;

            case "OBSERVED":
                // Acabou de deixar de ser observado — atraso antes de reiniciar perseguição
                monster.timeSinceUnobserved += deltaTime;
                if (monster.timeSinceUnobserved >= monster.unfreezeDelay) {
                    monster.state = "CHASING";
                }
                break;

            case "CHASING":
                // Perseguir o jogador!
                if (distanceToPlayer <= monster.detectionDistance) {
                    this.seek(monster, player, deltaTime, collisionManager);
                } else {
                    monster.state = "IDLE";
                }
                break;
        }
    }
}
