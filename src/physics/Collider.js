/**
 * Collider — Classe base abstrata para todos os volumes geométricos de colisão
 */

class Collider {
    /**
     * @param {string} type - 'AABB' | 'Sphere' | 'Capsule'
     * @param {object} options
     * @param {boolean} [options.isTrigger=false] - Se verdadeiro, não bloqueia movimento físico (gera evento de gatilho)
     * @param {boolean} [options.blocksMovement=true] - Se bloqueia movimentação física do jogador/monstro
     * @param {boolean} [options.blocksVision=true] - Se bloqueia a linha de visão no raycasting
     * @param {object} [options.parentEntity=null] - Referência à entidade dona deste colisor
     */
    constructor(type, options = {}) {
        this.type = type;
        this.isTrigger = options.isTrigger ?? false;
        this.blocksMovement = options.blocksMovement ?? (!this.isTrigger);
        this.blocksVision = options.blocksVision ?? true;
        this.parentEntity = options.parentEntity ?? null;
    }

    /**
     * Testa colisão com outro colisor, despachando para a função correta em CollisionTests
     * @param {Collider} other
     * @returns {boolean}
     */
    intersects(other) {
        if (!other) return false;

        // AABB x ...
        if (this.type === 'AABB') {
            if (other.type === 'AABB') return CollisionTests.intersectsAABB_AABB(this, other);
            if (other.type === 'Sphere') return CollisionTests.intersectsSphere_AABB(other, this);
            if (other.type === 'Capsule') return CollisionTests.intersectsCapsule_AABB(other, this);
        }

        // Sphere x ...
        if (this.type === 'Sphere') {
            if (other.type === 'Sphere') return CollisionTests.intersectsSphere_Sphere(this, other);
            if (other.type === 'AABB') return CollisionTests.intersectsSphere_AABB(this, other);
            if (other.type === 'Capsule') return CollisionTests.intersectsCapsule_Sphere(other, this);
        }

        // Capsule x ...
        if (this.type === 'Capsule') {
            if (other.type === 'Capsule') return CollisionTests.intersectsCapsule_Capsule(this, other);
            if (other.type === 'Sphere') return CollisionTests.intersectsCapsule_Sphere(this, other);
            if (other.type === 'AABB') return CollisionTests.intersectsCapsule_AABB(this, other);
        }

        return false;
    }
}
