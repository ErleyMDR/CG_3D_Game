/**
 * MonsterAI — Inteligência Artificial do Monstro (Weeping Angel)
 *
 * Responsabilidades:
 * 1. Detecção de observação pelo frustum da câmera (amostragem multiponto).
 * 2. Máquina de estados finita (FSM): IDLE → CHASING ↔ OBSERVED → ATTACKING.
 * 3. Perseguição direta (Seek Steering) no plano XZ.
 * 4. Balanceamento: velocidade progressiva e atraso antes de reiniciar perseguição.
 */

class MonsterAI {
    constructor() {
        // Reutilizáveis para evitar alocações por frame
        this._direction = Vec3.create();
        this._samplePoint = Vec3.create();
    }

    // ─────────────────────────────────────────────────
    //  1. Detecção de observação — Frustum Check
    // ─────────────────────────────────────────────────

    /**
     * Verifica se um ponto 3D está dentro do frustum da câmera.
     *
     * Projeta o vetor (ponto - câmera) nos eixos ortogonais
     * forward, right e up, e compara com os limites angulares
     * definidos pelo FOV e aspect ratio.
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
     * testando 3 pontos amostrais (base, tronco, cabeça) contra o frustum.
     *
     * @param {Monster} monster
     * @param {FPSCamera} camera
     * @param {number} aspectRatio
     * @returns {boolean}
     */
    isMonsterObserved(monster, camera, aspectRatio) {
        const mx = monster.position[0];
        const my = monster.position[1];
        const mz = monster.position[2];

        // Pontos amostrais ao longo da altura do modelo
        const sampleOffsets = [0.3, 1.4, monster.height]; // base, tronco, cabeça

        for (let i = 0; i < sampleOffsets.length; i++) {
            Vec3.set(this._samplePoint, mx, my + sampleOffsets[i], mz);
            if (this.isInsideFrustum(camera, this._samplePoint, aspectRatio)) {
                return true;
            }
        }

        return false;
    }

    // ─────────────────────────────────────────────────
    //  2. Seek Steering — Perseguição direta no plano XZ
    // ─────────────────────────────────────────────────

    /**
     * Move o monstro em direção ao jogador no plano XZ.
     * Aplica velocidade proporcional ao deltaTime e ajusta
     * o modelo para encarar a direção de movimento.
     *
     * @param {Monster} monster
     * @param {Player} player
     * @param {number} deltaTime
     */
    seek(monster, player, deltaTime) {
        const targetPos = player.camera.position;

        const dx = targetPos[0] - monster.position[0];
        const dz = targetPos[2] - monster.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < monster.stopDistance) {
            monster.state = "ATTACKING";
            return;
        }

        // Velocidade progressiva: mais rápido quando próximo
        const speed = distance > 10.0 ? monster.speed : monster.chaseSpeed;

        const dirX = dx / distance;
        const dirZ = dz / distance;
        const movement = speed * deltaTime;

        monster.position[0] += dirX * movement;
        monster.position[2] += dirZ * movement;

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
     */
    update(deltaTime, monster, player, camera, aspectRatio) {
        // 1. Verificar observação
        const observed = this.isMonsterObserved(monster, camera, aspectRatio);
        monster.isObserved = observed;

        // 2. Distância ao jogador (plano XZ)
        const dx = camera.position[0] - monster.position[0];
        const dz = camera.position[2] - monster.position[2];
        const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

        // 3. Transições de estado
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
                // Acabou de deixar de ser observado — atraso antes de perseguir
                monster.timeSinceUnobserved += deltaTime;
                if (monster.timeSinceUnobserved >= monster.unfreezeDelay) {
                    monster.state = "CHASING";
                }
                break;

            case "CHASING":
                // Perseguir o jogador!
                this.seek(monster, player, deltaTime);
                break;

            case "ATTACKING":
                // Monstro alcançou o jogador — Game Over!
                // TODO: Disparar evento de Game Over / Jumpscare
                console.warn("GAME OVER! O monstro te pegou!");
                break;
        }
    }
}
