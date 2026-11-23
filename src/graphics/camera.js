/**
 * Câmera em Primeira Pessoa (FPS Camera)
 * Suporte a movimentação WASD, rotação suave via Mouse Pointer Lock,
 * e cálculo da Matriz de Visualização (View Matrix).
 */

class FPSCamera {
    constructor(canvas, options = {}) {
        this.canvas = canvas;

        // Posição no mundo (X, Y = altura dos olhos, Z)
        this.position = Vec3.create(
            options.x ?? 0,
            options.y ?? 1.7,
            options.z ?? 5
        );

        // Orientação em graus
        // yaw = -90° aponta inicialmente para o eixo -Z (para dentro do cenário)
        this.yaw = options.yaw ?? -90.0;
        this.pitch = options.pitch ?? 0.0;

        // Parâmetros de controle
        this.moveSpeed = options.moveSpeed ?? 6.0; // unidades por segundo
        this.mouseSensitivity = options.mouseSensitivity ?? 0.15;

        // Vetores de orientação calculados
        this.forward = Vec3.create(0, 0, -1);
        this.right = Vec3.create(1, 0, 0);
        this.up = Vec3.create(0, 1, 0);

        // Matriz de visualização
        this.viewMatrix = Mat4.create();

        // Estado do teclado
        this.keys = {};

        // Estado do Pointer Lock
        this.isLocked = false;

        this._setupListeners();
        this._updateVectors();
    }

    _setupListeners() {
        // Captura de teclado
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Clique no canvas para travar o cursor do mouse (Pointer Lock)
        this.canvas.addEventListener('click', () => {
            if (!this.isLocked) {
                this.canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = (document.pointerLockElement === this.canvas);
        });

        // Movimentação do mouse
        document.addEventListener('mousemove', (e) => {
            if (!this.isLocked) return;

            const dx = e.movementX || 0;
            const dy = e.movementY || 0;

            this.yaw += dx * this.mouseSensitivity;
            this.pitch -= dy * this.mouseSensitivity;

            // Restringir pitch para evitar rotação completa (gimbal flip)
            if (this.pitch > 89.0) this.pitch = 89.0;
            if (this.pitch < -89.0) this.pitch = -89.0;

            this._updateVectors();
        });
    }

    _updateVectors() {
        const yawRad = (this.yaw * Math.PI) / 180.0;
        const pitchRad = (this.pitch * Math.PI) / 180.0;

        // Direção tridimensional da visão
        const fx = Math.cos(yawRad) * Math.cos(pitchRad);
        const fy = Math.sin(pitchRad);
        const fz = Math.sin(yawRad) * Math.cos(pitchRad);

        Vec3.set(this.forward, fx, fy, fz);
        Vec3.normalize(this.forward, this.forward);

        // Vetor Right perpendicular a Forward e ao Up do mundo (0, 1, 0)
        Vec3.cross(this.right, this.forward, [0, 1, 0]);
        Vec3.normalize(this.right, this.right);

        // Vetor Up real da câmera
        Vec3.cross(this.up, this.right, this.forward);
        Vec3.normalize(this.up, this.up);
    }

    update(deltaTime) {
        if (deltaTime <= 0) return;

        // Movimentação horizontal no plano XZ
        const yawRad = (this.yaw * Math.PI) / 180.0;
        const forwardXZ = Vec3.create(Math.cos(yawRad), 0, Math.sin(yawRad));
        Vec3.normalize(forwardXZ, forwardXZ);

        const rightXZ = Vec3.create(-Math.sin(yawRad), 0, Math.cos(yawRad));
        Vec3.normalize(rightXZ, rightXZ);

        const velocity = Vec3.create(0, 0, 0);

        if (this.keys['w'] || this.keys['arrowup']) {
            Vec3.add(velocity, velocity, forwardXZ);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            Vec3.subtract(velocity, velocity, forwardXZ);
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            Vec3.add(velocity, velocity, rightXZ);
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            Vec3.subtract(velocity, velocity, rightXZ);
        }

        // Normalizar velocidade para não correr mais rápido na diagonal
        const len = Math.hypot(velocity[0], velocity[2]);
        if (len > 0.0001) {
            velocity[0] /= len;
            velocity[2] /= len;

            const dist = this.moveSpeed * deltaTime;
            this.position[0] += velocity[0] * dist;
            this.position[2] += velocity[2] * dist;
        }

        // Atualizar matriz de visualização lookAt
        const target = Vec3.create();
        Vec3.add(target, this.position, this.forward);
        Mat4.lookAt(this.viewMatrix, this.position, target, [0, 1, 0]);
    }

    getViewMatrix() {
        return this.viewMatrix;
    }
}
