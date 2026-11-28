/**
 * SphereCollider — Esfera de colisão definida por centro e raio
 * Ideal para coletáveis (slides/páginas), projéteis e detecção simplificada.
 */

class SphereCollider extends Collider {
    /**
     * @param {number[]|Float32Array} center - Centro da esfera [x, y, z]
     * @param {number} radius - Raio da esfera
     * @param {object} options - Opções herdadas de Collider
     */
    constructor(center = [0, 0, 0], radius = 0.5, options = {}) {
        super('Sphere', options);
        this.center = new Float32Array(center);
        this.radius = radius;
    }

    /**
     * Atualiza a posição do centro da esfera
     * @param {number[]|Float32Array} pos [x, y, z]
     */
    setPosition(pos) {
        this.center[0] = pos[0];
        this.center[1] = pos[1];
        this.center[2] = pos[2];
    }
}
