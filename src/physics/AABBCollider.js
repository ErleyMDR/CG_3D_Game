/**
 * AABBCollider — Caixa Alinhada aos Eixos (Axis-Aligned Bounding Box)
 * Utilizada para paredes, pilares, cubos e obstáculos estáticos.
 */

class AABBCollider extends Collider {
    /**
     * @param {number[]|Float32Array} min - Coordenadas mínimas [x, y, z]
     * @param {number[]|Float32Array} max - Coordenadas máximas [x, y, z]
     * @param {object} options - Opções herdadas de Collider
     */
    constructor(min = [-0.5, -0.5, -0.5], max = [0.5, 0.5, 0.5], options = {}) {
        super('AABB', options);
        this.min = new Float32Array(min);
        this.max = new Float32Array(max);
    }

    /**
     * Cria uma AABB a partir do centro e das meias-extensões
     * @param {number[]} center [x, y, z]
     * @param {number[]} halfExtents [hx, hy, hz]
     * @param {object} options
     * @returns {AABBCollider}
     */
    static fromCenterAndHalfExtents(center, halfExtents, options = {}) {
        const min = [
            center[0] - halfExtents[0],
            center[1] - halfExtents[1],
            center[2] - halfExtents[2]
        ];
        const max = [
            center[0] + halfExtents[0],
            center[1] + halfExtents[1],
            center[2] + halfExtents[2]
        ];
        return new AABBCollider(min, max, options);
    }

    /**
     * Cria uma AABB diretamente a partir da posição e dimensões de um Cube
     * @param {number[]} position [x, y, z]
     * @param {number[]} dimensions [width, height, depth]
     * @param {object} options
     * @returns {AABBCollider}
     */
    static fromCube(position, dimensions, options = {}) {
        const hw = dimensions[0] * 0.5;
        const hh = dimensions[1] * 0.5;
        const hd = dimensions[2] * 0.5;
        return this.fromCenterAndHalfExtents(position, [hw, hh, hd], options);
    }

    /**
     * Atualiza os limites da AABB com base em uma nova posição e dimensões
     * @param {number[]} position
     * @param {number[]} dimensions
     */
    setFromCenterAndSize(position, dimensions) {
        const hw = dimensions[0] * 0.5;
        const hh = dimensions[1] * 0.5;
        const hd = dimensions[2] * 0.5;

        this.min[0] = position[0] - hw;
        this.min[1] = position[1] - hh;
        this.min[2] = position[2] - hd;

        this.max[0] = position[0] + hw;
        this.max[1] = position[1] + hh;
        this.max[2] = position[2] + hd;
    }

    /** Retorna o centro da AABB */
    getCenter() {
        return new Float32Array([
            (this.min[0] + this.max[0]) * 0.5,
            (this.min[1] + this.max[1]) * 0.5,
            (this.min[2] + this.max[2]) * 0.5
        ]);
    }

    /** Retorna as dimensões totais [width, height, depth] */
    getSize() {
        return new Float32Array([
            this.max[0] - this.min[0],
            this.max[1] - this.min[1],
            this.max[2] - this.min[2]
        ]);
    }
}
