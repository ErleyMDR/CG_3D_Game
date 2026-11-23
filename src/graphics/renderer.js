/**
 * Renderer WebGL
 * Responsável pela compilação de shaders, gerenciamento de buffers,
 * aplicação do Modelo de Iluminação de Phong (com luz móvel da lanterna),
 * suporte a texturas e renderização de malhas.
 */

const skyboxColor = [0.05, 0.05, 0.10, 1.0];


class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = this._initGL(canvas);
        if (!this.gl) {
            throw new Error("Não foi possível inicializar WebGL.");
        }

        this.program = null;
        this.locations = {};
        this.textures = {};

        this._setupGL();
        this._initShaders();
        this._initTextures();
    }

    _initGL(canvas) {
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) {
            alert("Contexto WebGL inexistente! Use um navegador compatível.");
            return null;
        }

        // Habilita extensões úteis se disponíveis
        gl.getExtension('OES_element_index_uint');
        return gl;
    }

    _setupGL() {
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        // Cor de fundo escura de atmosfera de terror
        gl.clearColor(skyboxColor[0], skyboxColor[1], skyboxColor[2], skyboxColor[3]);
    }

    _createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Erro na compilação do shader: " + info);
        }
        return shader;
    }

    _initShaders() {
        const gl = this.gl;

        const vsSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            attribute vec2 aTexCoord;

            uniform mat4 uModel;
            uniform mat4 uView;
            uniform mat4 uProjection;

            varying vec3 vWorldPos;
            varying vec3 vWorldNormal;
            varying vec2 vTexCoord;

            void main() {
                vec4 worldPos = uModel * vec4(aPosition, 1.0);
                vWorldPos = worldPos.xyz;
                
                // Transformação da normal para o espaço do mundo
                vWorldNormal = normalize((uModel * vec4(aNormal, 0.0)).xyz);
                vTexCoord = aTexCoord;

                gl_Position = uProjection * uView * worldPos;
            }
        `;

        const fsSource = `
            precision mediump float;

            varying vec3 vWorldPos;
            varying vec3 vWorldNormal;
            varying vec2 vTexCoord;

            // Câmera e Luz (Lanterna / Luz Móvel)
            uniform vec3 uCamPos;
            uniform vec3 uLightPos;
            uniform vec3 uLightDir;
            uniform vec3 uLightColor;
            uniform float uLightEnabled;

            uniform vec3 uAmbientColor;

            // Material
            uniform int uUseTexture;
            uniform sampler2D uSampler;
            uniform vec4 uColor;

            void main() {
                vec3 N = normalize(vWorldNormal);
                
                // Cor do material (textura ou cor sólida)
                vec4 baseColor = (uUseTexture == 1) ? texture2D(uSampler, vTexCoord) : uColor;
                
                // 1. Componente Ambiente
                vec3 ambient = uAmbientColor * baseColor.rgb;
                
                // Se a lanterna estiver desligada, apenas iluminação ambiente
                if (uLightEnabled <= 0.0) {
                    gl_FragColor = vec4(ambient, baseColor.a);
                    return;
                }
                
                // 2. Modelo de Phong da Luz Móvel (Lanterna com atenuação e foco)
                vec3 lightVec = uLightPos - vWorldPos;
                float dist = length(lightVec);
                vec3 L = normalize(lightVec);
                vec3 V = normalize(uCamPos - vWorldPos);
                
                // Atenuação quadrática suave com a distância
                // float attenuation = 1.0 / (1.0 + 0.05 * dist + 0.01 * (dist * dist));
                float attenuation = 1.0 / (1.0 + 0.01 * dist);
                
                // Efeito de cone de lanterna (Spotlight)
                float spotEffect = dot(-L, normalize(uLightDir));
                float spotFactor = smoothstep(0.78, 0.92, spotEffect);
                
                // Componente Difusa de Lambert
                float diff = max(dot(N, L), 0.0);
                vec3 diffuse = diff * uLightColor * baseColor.rgb;
                
                // Componente Especular de Blinn-Phong
                vec3 H = normalize(L + V);
                float spec = pow(max(dot(N, H), 0.0), 32.0);
                vec3 specular = spec * uLightColor * 0.4;
                
                vec3 finalColor = ambient + (diffuse + specular) * attenuation * spotFactor;
                gl_FragColor = vec4(finalColor, baseColor.a);
            }
        `;

        const vtxShader = this._createShader(gl.VERTEX_SHADER, vsSource);
        const fragShader = this._createShader(gl.FRAGMENT_SHADER, fsSource);

        const prog = gl.createProgram();
        gl.attachShader(prog, vtxShader);
        gl.attachShader(prog, fragShader);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            throw new Error("Erro na linkagem do programa: " + gl.getProgramInfoLog(prog));
        }

        this.program = prog;
        gl.useProgram(prog);

        // Mapear localizações de atributos e uniforms
        this.locations = {
            attribs: {
                position: gl.getAttribLocation(prog, "aPosition"),
                normal: gl.getAttribLocation(prog, "aNormal"),
                texCoord: gl.getAttribLocation(prog, "aTexCoord")
            },
            uniforms: {
                model: gl.getUniformLocation(prog, "uModel"),
                view: gl.getUniformLocation(prog, "uView"),
                projection: gl.getUniformLocation(prog, "uProjection"),

                camPos: gl.getUniformLocation(prog, "uCamPos"),
                lightPos: gl.getUniformLocation(prog, "uLightPos"),
                lightDir: gl.getUniformLocation(prog, "uLightDir"),
                lightColor: gl.getUniformLocation(prog, "uLightColor"),
                lightEnabled: gl.getUniformLocation(prog, "uLightEnabled"),

                ambientColor: gl.getUniformLocation(prog, "uAmbientColor"),

                useTexture: gl.getUniformLocation(prog, "uUseTexture"),
                sampler: gl.getUniformLocation(prog, "uSampler"),
                color: gl.getUniformLocation(prog, "uColor")
            }
        };

        // Habilitar arrays de atributos
        gl.enableVertexAttribArray(this.locations.attribs.position);
        gl.enableVertexAttribArray(this.locations.attribs.normal);
        gl.enableVertexAttribArray(this.locations.attribs.texCoord);
    }

    _initTextures() {
        // Criar textura de piso procedural (azulejo/grade de terror)
        // Isso funciona nativamente sem problemas de CORS ou servidor local!
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");

        // Fundo cinza escuro
        ctx.fillStyle = "#1c1c22";
        ctx.fillRect(0, 0, 256, 256);

        // Grade de azulejos
        ctx.strokeStyle = "#0d0d12";
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 252, 252);
        ctx.strokeRect(64, 2, 0, 252);
        ctx.strokeRect(128, 2, 0, 252);
        ctx.strokeRect(192, 2, 0, 252);
        ctx.strokeRect(2, 64, 252, 0);
        ctx.strokeRect(2, 128, 252, 0);
        ctx.strokeRect(2, 192, 252, 0);

        // Textura leve de ruído/mancha
        ctx.fillStyle = "rgba(40, 40, 50, 0.15)";
        for (let i = 0; i < 400; i++) {
            const rx = Math.random() * 256;
            const ry = Math.random() * 256;
            ctx.fillRect(rx, ry, 2, 2);
        }

        this.textures.floor = this.createTextureFromSource(canvas);
    }

    createTextureFromSource(source) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);

        return texture;
    }

    loadTextureImage(url) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Placeholder 1x1 enquanto carrega
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([100, 100, 100, 255]));

        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        };
        image.src = url;
        return texture;
    }

    createMeshBuffers(geometry) {
        const gl = this.gl;

        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);

        const normBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);

        const texBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.texCoords, gl.STATIC_DRAW);

        return {
            pos: posBuffer,
            norm: normBuffer,
            tex: texBuffer,
            count: geometry.vertexCount
        };
    }

    beginFrame(camera, projectionMatrix, player) {
        const gl = this.gl;

        // Ajustar viewport ao tamanho do canvas
        if (this.canvas.width !== this.canvas.clientWidth || this.canvas.height !== this.canvas.clientHeight) {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
        }
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.program);

        // Uniforms globais de Câmera e Projeção
        gl.uniformMatrix4fv(this.locations.uniforms.view, false, camera.getViewMatrix());
        gl.uniformMatrix4fv(this.locations.uniforms.projection, false, projectionMatrix);
        gl.uniform3fv(this.locations.uniforms.camPos, camera.position);

        // Uniforms da Iluminação (Luz Ambiente e Lanterna do Jogador)
        gl.uniform3f(this.locations.uniforms.ambientColor, 0.12, 0.14, 0.18);

        const fl = player.flashlight;
        gl.uniform1f(this.locations.uniforms.lightEnabled, fl.enabled ? 1.0 : 0.0);
        gl.uniform3fv(this.locations.uniforms.lightPos, camera.position);
        gl.uniform3fv(this.locations.uniforms.lightDir, camera.forward);
        gl.uniform3fv(this.locations.uniforms.lightColor, fl.color);

        gl.uniform1i(this.locations.uniforms.sampler, 0);
    }

    drawMesh(buffers, modelMatrix, options = {}) {
        const gl = this.gl;

        gl.uniformMatrix4fv(this.locations.uniforms.model, false, modelMatrix);

        if (options.texture) {
            gl.uniform1i(this.locations.uniforms.useTexture, 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, options.texture);
        } else {
            gl.uniform1i(this.locations.uniforms.useTexture, 0);
            const col = options.color || [1, 1, 1, 1];
            gl.uniform4fv(this.locations.uniforms.color, col);
        }

        // Conectar buffers aos atributos
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
        gl.vertexAttribPointer(this.locations.attribs.position, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.norm);
        gl.vertexAttribPointer(this.locations.attribs.normal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.tex);
        gl.vertexAttribPointer(this.locations.attribs.texCoord, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, buffers.count);
    }
}
