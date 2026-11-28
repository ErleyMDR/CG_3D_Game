/**
 * Ray — Representação matemática de um raio paramétrico tridimensional
 * P(t) = origin + direction * t, com t >= 0
 */

class Ray {
    /**
     * @param {number[]|Float32Array} origin
     * @param {number[]|Float32Array} direction - Vetor de direção (será normalizado automaticamente)
     */
    constructor(origin = [0, 0, 0], direction = [0, 0, -1]) {
        this.origin = new Float32Array(origin);
        this.direction = new Float32Array(direction);

        // Normalização garantida da direção
        const len = Math.hypot(this.direction[0], this.direction[1], this.direction[2]);
        if (len > 1e-9) {
            this.direction[0] /= len;
            this.direction[1] /= len;
            this.direction[2] /= len;
        } else {
            this.direction[0] = 0;
            this.direction[1] = 0;
            this.direction[2] = -1;
        }
    }

    /**
     * Retorna o ponto 3D na distância paramétrica t ao longo do raio
     * @param {number} t
     * @returns {Float32Array}
     */
    getPoint(t) {
        return new Float32Array([
            this.origin[0] + this.direction[0] * t,
            this.origin[1] + this.direction[1] * t,
            this.origin[2] + this.direction[2] * t
        ]);
    }
}
