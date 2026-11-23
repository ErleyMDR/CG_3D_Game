/**
 * Classes genéricas para geometria do mundo
 * */

class Floor {
    constructor(size = 50, repeatUV = 25) {
        this.size = size;
        this.half = size / 2;
        this.repeatUV = repeatUV;
        this.modelMatrix = Mat4.create();

        this._buildGeometry();
    }

    _buildGeometry() {
        const h = this.half;
        const uv = this.repeatUV;

        // Plano XZ com Y = 0 (2 triângulos, 6 vértices)
        // Posições (X, Y, Z), Normais (NX, NY, NZ), UV (U, V)
        this.positions = new Float32Array([
            -h, 0, -h,
            h, 0, -h,
            h, 0,  h,

            -h, 0, -h,
            h, 0,  h,
            -h, 0,  h
        ]);

        this.normals = new Float32Array([
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            0, 1, 0,
            0, 1, 0,
            0, 1, 0
        ]);

        this.texCoords = new Float32Array([
            0,  0,
            uv, 0,
            uv, uv,

            0,  0,
            uv, uv,
            0,  uv
        ]);

        this.vertexCount = 6;
    }
}

class Cube {
    constructor(width = 1, height = 1, depth = 1, position = [0, 0, 0], color = [0.8, 0.2, 0.2, 1.0]) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.position = Vec3.create(...position);
        this.rotationY = 0;
        this.color = color;
        this.modelMatrix = Mat4.create();

        this._buildGeometry();
        this.updateModelMatrix();
    }

    _buildGeometry() {
        const w = this.width / 2;
        const h = this.height / 2;
        const d = this.depth / 2;

        // 6 faces * 2 triângulos * 3 vértices = 36 vértices
        this.positions = new Float32Array([
            // Frente (+Z)
            -w, -h,  d,   w, -h,  d,   w,  h,  d,
            -w, -h,  d,   w,  h,  d,  -w,  h,  d,
            // Trás (-Z)
            w, -h, -d,  -w, -h, -d,  -w,  h, -d,
            w, -h, -d,  -w,  h, -d,   w,  h, -d,
            // Cima (+Y)
            -w,  h,  d,   w,  h,  d,   w,  h, -d,
            -w,  h,  d,   w,  h, -d,  -w,  h, -d,
            // Baixo (-Y)
            -w, -h, -d,   w, -h, -d,   w, -h,  d,
            -w, -h, -d,   w, -h,  d,  -w, -h,  d,
            // Direita (+X)
            w, -h,  d,   w, -h, -d,   w,  h, -d,
            w, -h,  d,   w,  h, -d,   w,  h,  d,
            // Esquerda (-X)
            -w, -h, -d,  -w, -h,  d,  -w,  h,  d,
            -w, -h, -d,  -w,  h,  d,  -w,  h, -d
        ]);

        this.normals = new Float32Array([
            // Frente
            0,  0,  1,   0,  0,  1,   0,  0,  1,
            0,  0,  1,   0,  0,  1,   0,  0,  1,
            // Trás
            0,  0, -1,   0,  0, -1,   0,  0, -1,
            0,  0, -1,   0,  0, -1,   0,  0, -1,
            // Cima
            0,  1,  0,   0,  1,  0,   0,  1,  0,
            0,  1,  0,   0,  1,  0,   0,  1,  0,
            // Baixo
            0, -1,  0,   0, -1,  0,   0, -1,  0,
            0, -1,  0,   0, -1,  0,   0, -1,  0,
            // Direita
            1,  0,  0,   1,  0,  0,   1,  0,  0,
            1,  0,  0,   1,  0,  0,   1,  0,  0,
            // Esquerda
            -1,  0,  0,  -1,  0,  0,  -1,  0,  0,
            -1,  0,  0,  -1,  0,  0,  -1,  0,  0
        ]);

        const uvFace = [
            0, 0,  1, 0,  1, 1,
            0, 0,  1, 1,  0, 1
        ];
        const texCoords = [];
        for (let i = 0; i < 6; i++) {
            texCoords.push(...uvFace);
        }
        this.texCoords = new Float32Array(texCoords);
        this.vertexCount = 36;
    }

    updateModelMatrix() {
        Mat4.identity(this.modelMatrix);
        Mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
        if (this.rotationY !== 0) {
            Mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotationY);
        }
    }
}