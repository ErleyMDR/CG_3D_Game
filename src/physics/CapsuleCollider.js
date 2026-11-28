/**
 * CapsuleCollider — Cápsula cilíndrica com extremidades hemisféricas
 * O formato padrão e mais recomendado para personagens e monstros em jogos 3D.
 */

class CapsuleCollider extends Collider {
    /**
     * @param {number} radius - Raio da cápsula
     * @param {number} height - Altura total da cápsula (da base ao topo)
     * @param {number[]|Float32Array} [basePosition=[0, 0, 0]] - Posição da base (pés)
     * @param {object} options - Opções herdadas de Collider
     */
    constructor(radius = 0.4, height = 1.8, basePosition = [0, 0, 0], options = {}) {
        super('Capsule', options);

        this.radius = radius;
        this.height = Math.max(height, radius * 2.0); // Altura não pode ser menor que 2x o raio

        this.start = new Float32Array(3); // Centro do hemisfério inferior
        this.end = new Float32Array(3);   // Centro do hemisfério superior

        this.syncWithBase(basePosition);
    }

    /**
     * Sincroniza a cápsula a partir da posição da base (chão / pés)
     * @param {number[]|Float32Array} basePos [x, y, z]
     */
    syncWithBase(basePos) {
        const x = basePos[0];
        const y = basePos[1];
        const z = basePos[2];

        this.start[0] = x;
        this.start[1] = y + this.radius;
        this.start[2] = z;

        this.end[0] = x;
        this.end[1] = y + this.height - this.radius;
        this.end[2] = z;
    }

    /**
     * Sincroniza a cápsula a partir da posição da câmera (olhos do jogador)
     * @param {number[]|Float32Array} eyePos [x, y, z]
     * @param {number} [eyeHeight=1.7] - Altura dos olhos em relação aos pés
     */
    syncWithEye(eyePos, eyeHeight = 1.7) {
        const baseY = eyePos[1] - eyeHeight;
        this.syncWithBase([eyePos[0], baseY, eyePos[2]]);
    }
}
