/**
 * CollisionTests — Métodos matemáticos puros para testes de colisão e interseção geométrica
 * Opera com vetores e estruturas de dados primitivas para máxima eficiência no loop de renderização.
 */

class CollisionTests {

    /**
     * Teste de sobreposição entre duas caixas alinhadas aos eixos (AABB × AABB)
     * @param {AABBCollider} a
     * @param {AABBCollider} b
     * @returns {boolean}
     */
    static intersectsAABB_AABB(a, b) {
        return (
            a.min[0] <= b.max[0] && a.max[0] >= b.min[0] &&
            a.min[1] <= b.max[1] && a.max[1] >= b.min[1] &&
            a.min[2] <= b.max[2] && a.max[2] >= b.min[2]
        );
    }

    /**
     * Teste de interseção entre duas esferas (Sphere × Sphere)
     * @param {SphereCollider} a
     * @param {SphereCollider} b
     * @returns {boolean}
     */
    static intersectsSphere_Sphere(a, b) {
        const dx = a.center[0] - b.center[0];
        const dy = a.center[1] - b.center[1];
        const dz = a.center[2] - b.center[2];
        const distSq = dx * dx + dy * dy + dz * dz;
        const radiusSum = a.radius + b.radius;
        return distSq <= radiusSum * radiusSum;
    }

    /**
     * Teste de interseção entre Esfera e AABB (Sphere × AABB)
     * Encontra o ponto na caixa mais próximo do centro da esfera
     * @param {SphereCollider} sphere
     * @param {AABBCollider} aabb
     * @returns {boolean}
     */
    static intersectsSphere_AABB(sphere, aabb) {
        const cx = Math.max(aabb.min[0], Math.min(sphere.center[0], aabb.max[0]));
        const cy = Math.max(aabb.min[1], Math.min(sphere.center[1], aabb.max[1]));
        const cz = Math.max(aabb.min[2], Math.min(sphere.center[2], aabb.max[2]));

        const dx = sphere.center[0] - cx;
        const dy = sphere.center[1] - cy;
        const dz = sphere.center[2] - cz;

        return (dx * dx + dy * dy + dz * dz) <= (sphere.radius * sphere.radius);
    }

    /**
     * Ponto mais próximo em um segmento de reta AB em relação a um ponto P
     * @param {number[]} p - Ponto P [x, y, z]
     * @param {number[]} a - Início do segmento [x, y, z]
     * @param {number[]} b - Fim do segmento [x, y, z]
     * @returns {number[]} Ponto mais próximo [x, y, z]
     */
    static closestPointOnSegment(p, a, b) {
        const abX = b[0] - a[0];
        const abY = b[1] - a[1];
        const abZ = b[2] - a[2];

        const abLenSq = abX * abX + abY * abY + abZ * abZ;
        if (abLenSq < 1e-9) {
            return [a[0], a[1], a[2]];
        }

        const apX = p[0] - a[0];
        const apY = p[1] - a[1];
        const apZ = p[2] - a[2];

        const t = Math.max(0, Math.min(1, (apX * abX + apY * abY + apZ * abZ) / abLenSq));

        return [
            a[0] + t * abX,
            a[1] + t * abY,
            a[2] + t * abZ
        ];
    }

    /**
     * Teste de interseção entre Cápsula e Esfera (Capsule × Sphere)
     * @param {CapsuleCollider} capsule
     * @param {SphereCollider} sphere
     * @returns {boolean}
     */
    static intersectsCapsule_Sphere(capsule, sphere) {
        const closest = this.closestPointOnSegment(sphere.center, capsule.start, capsule.end);
        const dx = closest[0] - sphere.center[0];
        const dy = closest[1] - sphere.center[1];
        const dz = closest[2] - sphere.center[2];

        const rSum = capsule.radius + sphere.radius;
        return (dx * dx + dy * dy + dz * dz) <= (rSum * rSum);
    }

    /**
     * Teste de interseção entre Cápsula e AABB (Capsule × AABB)
     * Otimizado para cápsulas verticais (típicas de humanoides/monstros no jogo)
     * com suporte a segmentos arbitrários.
     * @param {CapsuleCollider} capsule
     * @param {AABBCollider} aabb
     * @returns {boolean}
     */
    static intersectsCapsule_AABB(capsule, aabb) {
        const a = capsule.start;
        const b = capsule.end;

        // Caso vertical perfeito (start e end têm mesmos X e Z)
        if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[2] - b[2]) < 1e-6) {
            const posX = a[0];
            const posZ = a[2];

            const clampX = Math.max(aabb.min[0], Math.min(posX, aabb.max[0]));
            const clampZ = Math.max(aabb.min[2], Math.min(posZ, aabb.max[2]));

            const dx = posX - clampX;
            const dz = posZ - clampZ;
            const distXZSq = dx * dx + dz * dz;

            // Se a distância horizontal já excede o raio, não pode haver colisão
            if (distXZSq > capsule.radius * capsule.radius) {
                return false;
            }

            const yMin = Math.min(a[1], b[1]);
            const yMax = Math.max(a[1], b[1]);

            let dy = 0;
            if (yMin > aabb.max[1]) {
                dy = yMin - aabb.max[1];
            } else if (yMax < aabb.min[1]) {
                dy = aabb.min[1] - yMax;
            }

            return (distXZSq + dy * dy) <= (capsule.radius * capsule.radius);
        }

        // Caso geral: encontra o ponto no AABB mais próximo do segmento e testa distância
        // Aproximação analítica robusta: amostra centro do AABB no segmento
        const aabbCenter = [
            (aabb.min[0] + aabb.max[0]) * 0.5,
            (aabb.min[1] + aabb.max[1]) * 0.5,
            (aabb.min[2] + aabb.max[2]) * 0.5
        ];
        const pSeg = this.closestPointOnSegment(aabbCenter, a, b);
        const pBox = [
            Math.max(aabb.min[0], Math.min(pSeg[0], aabb.max[0])),
            Math.max(aabb.min[1], Math.min(pSeg[1], aabb.max[1])),
            Math.max(aabb.min[2], Math.min(pSeg[2], aabb.max[2]))
        ];

        const pSegFinal = this.closestPointOnSegment(pBox, a, b);
        const dx = pSegFinal[0] - pBox[0];
        const dy = pSegFinal[1] - pBox[1];
        const dz = pSegFinal[2] - pBox[2];

        return (dx * dx + dy * dy + dz * dz) <= (capsule.radius * capsule.radius);
    }

    /**
     * Teste de interseção entre duas Cápsulas (Capsule × Capsule)
     * @param {CapsuleCollider} capA
     * @param {CapsuleCollider} capB
     * @returns {boolean}
     */
    static intersectsCapsule_Capsule(capA, capB) {
        // Para cápsulas verticais
        if (
            Math.abs(capA.start[0] - capA.end[0]) < 1e-6 &&
            Math.abs(capA.start[2] - capA.end[2]) < 1e-6 &&
            Math.abs(capB.start[0] - capB.end[0]) < 1e-6 &&
            Math.abs(capB.start[2] - capB.end[2]) < 1e-6
        ) {
            const dx = capA.start[0] - capB.start[0];
            const dz = capA.start[2] - capB.start[2];
            const distXZSq = dx * dx + dz * dz;

            const rSum = capA.radius + capB.radius;
            if (distXZSq > rSum * rSum) {
                return false;
            }

            const yA0 = Math.min(capA.start[1], capA.end[1]);
            const yA1 = Math.max(capA.start[1], capA.end[1]);
            const yB0 = Math.min(capB.start[1], capB.end[1]);
            const yB1 = Math.max(capB.start[1], capB.end[1]);

            let dy = 0;
            if (yA0 > yB1) {
                dy = yA0 - yB1;
            } else if (yA1 < yB0) {
                dy = yB0 - yA1;
            }

            return (distXZSq + dy * dy) <= (rSum * rSum);
        }

        // Caso geral
        const midA = [
            (capA.start[0] + capA.end[0]) * 0.5,
            (capA.start[1] + capA.end[1]) * 0.5,
            (capA.start[2] + capA.end[2]) * 0.5
        ];
        const pB = this.closestPointOnSegment(midA, capB.start, capB.end);
        const pA = this.closestPointOnSegment(pB, capA.start, capA.end);

        const dx = pA[0] - pB[0];
        const dy = pA[1] - pB[1];
        const dz = pA[2] - pB[2];

        const rSum = capA.radius + capB.radius;
        return (dx * dx + dy * dy + dz * dz) <= (rSum * rSum);
    }

    /**
     * Interseção entre Raio e AABB utilizando o Slab Method
     * @param {Ray} ray
     * @param {AABBCollider} aabb
     * @returns {number|null} Distância t até o impacto ou null se não houver colisão
     */
    static intersectRay_AABB(ray, aabb) {
        let tMin = 0;
        let tMax = Infinity;

        for (let axis = 0; axis < 3; axis++) {
            const origin = ray.origin[axis];
            const direction = ray.direction[axis];

            if (Math.abs(direction) < 1e-8) {
                // Raio é paralelo a este plano de corte
                if (origin < aabb.min[axis] || origin > aabb.max[axis]) {
                    return null;
                }
                continue;
            }

            const invD = 1.0 / direction;
            let t1 = (aabb.min[axis] - origin) * invD;
            let t2 = (aabb.max[axis] - origin) * invD;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }

            tMin = Math.max(tMin, t1);
            tMax = Math.min(tMax, t2);

            if (tMin > tMax) {
                return null;
            }
        }

        return tMin >= 0 ? tMin : (tMax >= 0 ? tMax : null);
    }

    /**
     * Interseção entre Raio e Esfera
     * @param {Ray} ray
     * @param {SphereCollider} sphere
     * @returns {number|null} Distância t até o impacto ou null se não houver colisão
     */
    static intersectRay_Sphere(ray, sphere) {
        const ocX = ray.origin[0] - sphere.center[0];
        const ocY = ray.origin[1] - sphere.center[1];
        const ocZ = ray.origin[2] - sphere.center[2];

        const b = 2.0 * (ocX * ray.direction[0] + ocY * ray.direction[1] + ocZ * ray.direction[2]);
        const c = (ocX * ocX + ocY * ocY + ocZ * ocZ) - (sphere.radius * sphere.radius);
        const discriminant = b * b - 4.0 * c;

        if (discriminant < 0) {
            return null;
        }

        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDisc) * 0.5;
        const t2 = (-b + sqrtDisc) * 0.5;

        if (t1 >= 0) return t1;
        if (t2 >= 0) return t2;
        return null;
    }
}
