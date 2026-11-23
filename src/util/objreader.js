class ObjReader {

    static async loadOBJ(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Erro ao carregar OBJ: ${response.status}`
            );
        }

        const source = await response.text();

        return ObjReader.parseOBJ(source);
    }

    static parseOBJ(source) {
        const positions = [];
        const texCoords = [];
        const normals = [];

        const finalPositions = [];
        const finalTexCoords = [];
        const finalNormals = [];
        const indices = [];

        const vertexMap = new Map();

        const lines = source.split('\n');

        function resolveIndex(index, array) {
            const value = parseInt(index, 10);

            // Índices OBJ começam em 1.
            // Índices negativos são relativos ao final do array.
            return value < 0 ? array.length + value : value - 1;
        }

        function getVertex(reference) {
            if (vertexMap.has(reference)) {
                return vertexMap.get(reference);
            }

            const [v, vt, vn] = reference.split('/');

            const positionIndex = resolveIndex(v, positions);

            const texCoordIndex = vt
                ? resolveIndex(vt, texCoords)
                : null;

            const normalIndex = vn
                ? resolveIndex(vn, normals)
                : null;

            const vertexIndex = finalPositions.length / 3;

            // Posição
            finalPositions.push(
                ...positions[positionIndex]
            );

            // Coordenada UV
            if (texCoordIndex !== null) {
                finalTexCoords.push(
                    ...texCoords[texCoordIndex]
                );
            } else {
                finalTexCoords.push(0, 0);
            }

            // Normal
            if (normalIndex !== null) {
                finalNormals.push(
                    ...normals[normalIndex]
                );
            } else {
                finalNormals.push(0, 0, 0);
            }

            vertexMap.set(reference, vertexIndex);

            return vertexIndex;
        }

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);

            const type = parts[0];

            if (type === 'v') {
                positions.push(parts.slice(1).map(Number));

            } else if (type === 'vt') {
                texCoords.push(parts.slice(1).map(Number));

            } else if (type === 'vn') {
                normals.push(parts.slice(1).map(Number));

            } else if (type === 'f') {
                const face = parts.slice(1).map(getVertex);

                // Triangulação em leque.
                for (let i = 1; i < face.length - 1; i++) {
                    indices.push(
                        face[0],
                        face[i],
                        face[i + 1]
                    );
                }
            }
        }

        return {
            positions: new Float32Array(finalPositions),
            texCoords: new Float32Array(finalTexCoords),
            normals: new Float32Array(finalNormals),
            indices: new Uint32Array(indices) // Suporta mais de 65.535 vértices
        };
    }
}

