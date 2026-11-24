/**
 * Classes genéricas para geometria do mundo
 * */

class GeometryObject {
    constructor(animateFunc = null) {
        if (new.target === GeometryObject) {
            throw new Error("Cannot instantiate abstract class GeometryObject directly.");
        }

        this.animateFunc = animateFunc;
    }

    _buildGeometry() {
        throw new Error("Abstract method '_buildGeometry()' must be implemented by subclass.");
    }

    changeAnimation(newAnimation) {
        this.animateFunc = newAnimation;
    }

    animate(arg1, ...rest) {
        // Suporta ambas as abordagens:
        // 1) obj.animate(deltaTime) -> delega para this.animateFunc(this, deltaTime)
        // 2) obj.animate((obj, dt) => { ... }, deltaTime) -> executa a função inline passando o objeto como 1º argumento
        if (typeof arg1 === 'function') {
            arg1(this, ...rest);
        } else if (typeof this.animateFunc === 'function') {
            this.animateFunc(this, arg1, ...rest);
        }
    }
}

class Floor extends GeometryObject {
    constructor(size = 50, repeatUV = 25) {
        super();
        this.size = size;
        this.half = size / 2;
        this.repeatUV = repeatUV;
        this.modelMatrix = Mat4.create();

        this._buildGeometry();
    }

    _buildGeometry() {
        const h = this.half;
        const uv = this.repeatUV;

        this.positions = new Float32Array([
            -h, 0, -h,
            h, 0,  h,
            h, 0, -h,

            -h, 0, -h,
            -h, 0,  h,
            h, 0,  h
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
            uv, uv,
            uv, 0,

            0,  0,
            0,  uv,
            uv, uv
        ]);

        this.vertexCount = 6;
    }
}


class Rectangle2D extends GeometryObject {
    constructor(
        width,
        height,
        position,
        color = undefined,
        texture = undefined,
        animateFunc = null
    ) {
        super(animateFunc);

        this.width = width;
        this.height = height;
        this.depth = 0;

        this.position = Vec3.create(...position);
        this.rotationZ = 0;

        this.color = color ?? [1, 1, 1, 1];
        this.texture = texture;

        // Material padrão do verso
        this.backColor = [0.2, 0.2, 0.2, 1.0];

        this.modelMatrix = Mat4.create();

        this._buildGeometry();
        // rotate(this.modelMatrix, this.position, 0, 0, 0);
    }

    _buildGeometry() {
        const hw = this.width / 2;
        const hh = this.height / 2;

        this.positions = new Float32Array([
            // Frente (+Z)
            -hw, -hh, 0,
            hw, -hh, 0,
            hw,  hh, 0,

            -hw, -hh, 0,
            hw,  hh, 0,
            -hw,  hh, 0,

            // Verso (-Z): ordem dos vértices invertida
            hw, -hh, 0,
            -hw, -hh, 0,
            -hw,  hh, 0,

            hw, -hh, 0,
            -hw,  hh, 0,
            hw,  hh, 0
        ]);

        this.normals = new Float32Array([
            // Frente
            0, 0, 1,  0, 0, 1,  0, 0, 1,
            0, 0, 1,  0, 0, 1,  0, 0, 1,

            // Verso
            0, 0, -1,  0, 0, -1,  0, 0, -1,
            0, 0, -1,  0, 0, -1,  0, 0, -1
        ]);

        this.texCoords = new Float32Array([
            // Frente
            0, 0,  1, 0,  1, 1,
            0, 0,  1, 1,  0, 1,

            // Verso
            1, 0,  0, 0,  0, 1,
            1, 0,  0, 1,  1, 1
        ]);

        this.vertexCount = 12;
    }
}


class Cube extends GeometryObject {
    constructor(width = 1, height = 1, depth = 1, position = [0, 0, 0],
                color = [0.8, 0.2, 0.2, 1.0], animateFunc = null) {
        super(animateFunc);
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.position = Vec3.create(...position);
        this.rotationY = 0;
        this.rotationX = 0;
        this.rotationZ = 0;
        this.color = color;
        this.modelMatrix = Mat4.create();

        this._buildGeometry();
        rotate(this.modelMatrix, this.position, this.rotationY, this.rotationX, this.rotationZ);
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
}

class ModelObject extends GeometryObject{
    constructor(object, position, color, animateFunc) {
        super();
        if (object === undefined || object === null) {
            throw Error(`Object coords are undefined: ${object}`);
        }
        this.position = position;
        this.color = color;
        this.animateFunc = animateFunc;

        this._buildGeometry(object);
    }

    _buildGeometry(object) {
        this.positions = object.positions;
        this.normals = object.normals;
        this.texCoords = object.texCoords;
        this.indices = object.indices;
        this.vertexCount = this.positions.length;
    }
}