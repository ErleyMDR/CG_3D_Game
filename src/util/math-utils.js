/**
 * Utilitários de Álgebra Linear para WebGL (Matrizes 4x4 e Vetores 3D)
 * Trabalha diretamente com Float32Array em formato Column-Major,
 * garantindo compatibilidade direta com gl.uniformMatrix4fv sem alocações desnecessárias.
 */

const Mat4 = {
    create() {
        const out = new Float32Array(16);
        out[0] = 1;
        out[5] = 1;
        out[10] = 1;
        out[15] = 1;
        return out;
    },

    identity(out) {
        out.fill(0);
        out[0] = 1;
        out[5] = 1;
        out[10] = 1;
        out[15] = 1;
        return out;
    },

    clone(a) {
        const out = new Float32Array(16);
        out.set(a);
        return out;
    },

    multiply(out, a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        return out;
    },

    perspective(out, fovInDegrees, aspect, near, far) {
        const fovRad = (fovInDegrees * Math.PI) / 180.0;
        const f = 1.0 / Math.tan(fovRad / 2.0);
        const rangeInv = 1.0 / (near - far);

        out.fill(0);
        out[0] = f / aspect;
        out[5] = f;
        out[10] = (far + near) * rangeInv;
        out[11] = -1.0;
        out[14] = (2.0 * far * near) * rangeInv;
        return out;
    },

    lookAt(out, eye, target, up) {
        const eyex = eye[0], eyey = eye[1], eyez = eye[2];
        const upx = up[0], upy = up[1], upz = up[2];
        const targetx = target[0], targety = target[1], targetz = target[2];

        let z0 = eyex - targetx;
        let z1 = eyey - targety;
        let z2 = eyez - targetz;
        let len = Math.hypot(z0, z1, z2);
        if (len === 0) {
            z2 = 1;
        } else {
            z0 /= len; z1 /= len; z2 /= len;
        }

        let x0 = upy * z2 - upz * z1;
        let x1 = upz * z0 - upx * z2;
        let x2 = upx * z1 - upy * z0;
        len = Math.hypot(x0, x1, x2);
        if (len === 0) {
            x0 = 0; x1 = 0; x2 = 0;
        } else {
            x0 /= len; x1 /= len; x2 /= len;
        }

        let y0 = z1 * x2 - z2 * x1;
        let y1 = z2 * x0 - z0 * x2;
        let y2 = z0 * x1 - z1 * x0;
        len = Math.hypot(y0, y1, y2);
        if (len === 0) {
            y0 = 0; y1 = 0; y2 = 0;
        } else {
            y0 /= len; y1 /= len; y2 /= len;
        }

        out[0] = x0;
        out[1] = y0;
        out[2] = z0;
        out[3] = 0;
        out[4] = x1;
        out[5] = y1;
        out[6] = z1;
        out[7] = 0;
        out[8] = x2;
        out[9] = y2;
        out[10] = z2;
        out[11] = 0;
        out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        out[15] = 1;
        return out;
    },

    translate(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        if (a === out) {
            out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
            out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
            out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
            out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        } else {
            const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
            const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
            const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
            out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
            out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
            out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
            out[12] = a00 * x + a10 * y + a20 * z + a[12];
            out[13] = a01 * x + a11 * y + a21 * z + a[13];
            out[14] = a02 * x + a12 * y + a22 * z + a[14];
            out[15] = a03 * x + a13 * y + a23 * z + a[15];
        }
        return out;
    },

    rotateY(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];

        if (a !== out) {
            out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
            out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        }
        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;
        return out;
    },

    rotateX(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];

        if (a !== out) {
            out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
            out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        }
        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;
        return out;
    },

    rotateZ(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];

        if (a !== out) {
            out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
            out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        }
        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;
        return out;
    },

    scale(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }
};

const Vec3 = {
    create(x = 0, y = 0, z = 0) {
        return new Float32Array([x, y, z]);
    },

    set(out, x, y, z) {
        out[0] = x; out[1] = y; out[2] = z;
        return out;
    },

    add(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        return out;
    },

    subtract(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        return out;
    },

    scale(out, a, s) {
        out[0] = a[0] * s;
        out[1] = a[1] * s;
        out[2] = a[2] * s;
        return out;
    },

    normalize(out, a) {
        const len = Math.hypot(a[0], a[1], a[2]);
        if (len > 0) {
            out[0] = a[0] / len;
            out[1] = a[1] / len;
            out[2] = a[2] / len;
        } else {
            out[0] = 0; out[1] = 0; out[2] = 0;
        }
        return out;
    },

    dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    },

    cross(out, a, b) {
        const ax = a[0], ay = a[1], az = a[2];
        const bx = b[0], by = b[1], bz = b[2];
        out[0] = ay * bz - az * by;
        out[1] = az * bx - ax * bz;
        out[2] = ax * by - ay * bx;
        return out;
    },

    distance(a, b) {
        return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    }
};
