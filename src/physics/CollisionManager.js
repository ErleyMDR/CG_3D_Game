/**
 * CollisionManager — Gerenciador central de colisões e raycasting
 * Mantém o registro de todos os colliders e executa resolução de física e visibilidade.
 */

class CollisionManager {
    constructor() {
        this.colliders = [];
    }

    /**
     * Adiciona um colisor ao gerenciador
     * @param {Collider} collider
     * @returns {Collider}
     */
    add(collider) {
        if (collider && !this.colliders.includes(collider)) {
            this.colliders.push(collider);
        }
        return collider;
    }

    /**
     * Remove um colisor do gerenciador
     * @param {Collider} collider
     */
    remove(collider) {
        const index = this.colliders.indexOf(collider);
        if (index !== -1) {
            this.colliders.splice(index, 1);
        }
    }

    /**
     * Limpa todos os colisores registrados
     */
    clear() {
        this.colliders = [];
    }

    /**
     * Verifica interseções de um colisor contra a cena
     * @param {Collider} collider
     * @param {Function} [filterFn] - Filtro opcional (ex: c => c.isTrigger)
     * @returns {Collider[]} Lista de colisores que colidiram
     */
    checkCollision(collider, filterFn = null) {
        const hits = [];
        for (let i = 0; i < this.colliders.length; i++) {
            const other = this.colliders[i];
            if (other === collider) continue;

            if (filterFn && !filterFn(other)) continue;

            if (collider.intersects(other)) {
                hits.push(other);
            }
        }
        return hits;
    }

    /**
     * Resolve a movimentação de uma cápsula contra obstáculos sólidos,
     * implementando deslizamento suave de paredes (wall sliding).
     *
     * @param {CapsuleCollider} capsule - Colisor do personagem/monstro
     * @param {number[]|Float32Array} currentPos - Posição atual
     * @param {number[]} movement - Vetor de deslocamento desejado [dx, dy, dz]
     * @param {boolean} [isEyePosition=false] - Se a posição fornecida é da câmera (olhos)
     * @param {number} [eyeHeight=1.7] - Altura dos olhos se isEyePosition for true
     * @param {Function} [filterFn] - Filtro de obstáculos físicos
     * @returns {Float32Array} Nova posição segura após resolução [x, y, z]
     */
    resolveMovement(
        capsule,
        currentPos,
        movement,
        isEyePosition = false,
        eyeHeight = 1.7,
        filterFn = (c => c.blocksMovement && !c.isTrigger)
    ) {
        const dx = movement[0];
        const dy = movement[1] || 0;
        const dz = movement[2];

        // Se não houver movimento pretendido, retorna a posição atual
        if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6 && Math.abs(dz) < 1e-6) {
            return new Float32Array(currentPos);
        }

        const sync = (pos) => {
            if (isEyePosition) {
                capsule.syncWithEye(pos, eyeHeight);
            } else {
                capsule.syncWithBase(pos);
            }
        };

        const hasCollisionAt = (pos) => {
            sync(pos);
            for (let i = 0; i < this.colliders.length; i++) {
                const other = this.colliders[i];
                if (other === capsule) continue;
                if (filterFn && !filterFn(other)) continue;
                if (capsule.intersects(other)) {
                    return true;
                }
            }
            return false;
        };

        const curX = currentPos[0];
        const curY = currentPos[1];
        const curZ = currentPos[2];

        // 1. Tenta o movimento completo (X + Z)
        const targetFull = [curX + dx, curY + dy, curZ + dz];
        if (!hasCollisionAt(targetFull)) {
            sync(targetFull);
            return new Float32Array(targetFull);
        }

        // 2. Colidiu! Tentar deslizar: primeiro testa apenas o eixo X
        const targetX = [curX + dx, curY + dy, curZ];
        const canMoveX = !hasCollisionAt(targetX);

        // Se conseguiu mover em X, testa se a partir da nova posição X consegue mover em Z
        if (canMoveX) {
            const targetXZ = [curX + dx, curY + dy, curZ + dz];
            if (!hasCollisionAt(targetXZ)) {
                sync(targetXZ);
                return new Float32Array(targetXZ);
            }
            // Não deu em Z, mas deu em X: desliza ao longo de X
            sync(targetX);
            return new Float32Array(targetX);
        }

        // 3. Não conseguiu em X: testa apenas o eixo Z
        const targetZ = [curX, curY + dy, curZ + dz];
        const canMoveZ = !hasCollisionAt(targetZ);

        if (canMoveZ) {
            sync(targetZ);
            return new Float32Array(targetZ);
        }

        // 4. Bloqueado em ambos os eixos (canto fechado)
        sync(currentPos);
        return new Float32Array(currentPos);
    }

    /**
     * Lança um raio no cenário e identifica o obstáculo mais próximo
     * @param {Ray} ray
     * @param {number} [maxDistance=Infinity]
     * @param {Function} [filterFn] - Filtro (padrão: c => c.blocksVision)
     * @returns {{ hit: boolean, distance: number, collider: Collider|null, point: Float32Array|null }}
     */
    raycast(ray, maxDistance = Infinity, filterFn = (c => c.blocksVision)) {
        let closestDist = maxDistance;
        let closestCollider = null;

        for (let i = 0; i < this.colliders.length; i++) {
            const collider = this.colliders[i];
            if (filterFn && !filterFn(collider)) continue;

            let hitDist = null;

            if (collider.type === 'AABB') {
                hitDist = CollisionTests.intersectRay_AABB(ray, collider);
            } else if (collider.type === 'Sphere') {
                hitDist = CollisionTests.intersectRay_Sphere(ray, collider);
            }

            if (hitDist !== null && hitDist >= 0 && hitDist < closestDist) {
                closestDist = hitDist;
                closestCollider = collider;
            }
        }

        if (closestCollider !== null) {
            return {
                hit: true,
                distance: closestDist,
                collider: closestCollider,
                point: ray.getPoint(closestDist)
            };
        }

        return {
            hit: false,
            distance: Infinity,
            collider: null,
            point: null
        };
    }
}
