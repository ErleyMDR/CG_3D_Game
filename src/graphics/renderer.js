/**
 * Renderer WebGL
 * Responsável pela compilação de shaders, gerenciamento de buffers,
 * aplicação do Modelo de Iluminação de Phong (com luz móvel da lanterna),
 * suporte a texturas e renderização de malhas.
 */

const skyboxColor = [0.05, 0.05, 0.07, 1.0];


class WebGLRenderer {
    constructor(canvas, textures) {
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
        this._initTextures(textures);
    }

    _initGL(canvas) {
        const gl = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl");
        if (!gl) {
            alert("Contexto WebGL inexistente! Use um navegador compatível.");
            return null;
        }

        console.log("WebGL version:", gl.getParameter(gl.VERSION));
        console.log("GLSL version:", gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

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

        const vsSource = `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        in vec2 aTexCoord;
    
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;
    
        out vec3 vWorldPos;
        out vec3 vWorldNormal;
        out vec2 vTexCoord;
    
        void main() {
            vec4 worldPos = uModel * vec4(aPosition, 1.0);
    
            vWorldPos = worldPos.xyz;
            vWorldNormal = normalize((uModel * vec4(aNormal, 0.0)).xyz);
            vTexCoord = aTexCoord;
    
            gl_Position = uProjection * uView * worldPos;
        }`;

        const fsSource = `#version 300 es
        precision mediump float;
    
        in vec3 vWorldPos;
        in vec3 vWorldNormal;
        in vec2 vTexCoord;
    
        uniform vec3 uCamPos;
        uniform vec3 uLightPos;
        uniform vec3 uLightDir;
        uniform vec3 uLightColor;
        uniform float uLightEnabled;
    
        uniform vec3 uAmbientColor;
    
        uniform int uUseTexture;
        uniform sampler2D uSampler;
        uniform vec4 uColor;
    
        out vec4 fragColor;
    
        void main() {
            vec3 N = normalize(vWorldNormal);
    
            vec4 baseColor;
    
            if (uUseTexture == 1) {
                baseColor = texture(uSampler, vTexCoord);
            } else {
                baseColor = uColor;
            }
    
            vec3 ambient = uAmbientColor * baseColor.rgb;
    
            if (uLightEnabled <= 0.0) {
                fragColor = vec4(ambient, baseColor.a);
                return;
            }
    
            vec3 lightVec = uLightPos - vWorldPos;
            float dist = length(lightVec);
    
            vec3 L = normalize(lightVec);
            vec3 V = normalize(uCamPos - vWorldPos);
    
            float attenuation = 1.0 / (1.0 + 0.01 * dist);
    
            float spotEffect = dot(-L, normalize(uLightDir));
            float spotFactor = smoothstep(0.78, 0.92, spotEffect);
    
            float diff = max(dot(N, L), 0.0);
            vec3 diffuse = diff * uLightColor * baseColor.rgb;
    
            vec3 H = normalize(L + V);
            float spec = pow(max(dot(N, H), 0.0), 32.0);
            vec3 specular = spec * uLightColor * 0.4;
    
            vec3 finalColor =
                ambient + (diffuse + specular) * attenuation * spotFactor;
    
            fragColor = vec4(finalColor, baseColor.a);
        }`;

        // Compilação
        const vertexShader = this._createShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this._createShader(gl.FRAGMENT_SHADER, fsSource);

        // Criação e linkagem do programa
        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);

            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);

            throw new Error("Erro na linkagem do programa: " + info);
        }

        // Programa ativo
        this.program = program;
        gl.useProgram(program);

        // Localizações dos atributos
        const attribs = {
            position: gl.getAttribLocation(program, "aPosition"),
            normal: gl.getAttribLocation(program, "aNormal"),
            texCoord: gl.getAttribLocation(program, "aTexCoord")
        };

        // Localizações dos uniforms
        const uniforms = {
            model: gl.getUniformLocation(program, "uModel"),
            view: gl.getUniformLocation(program, "uView"),
            projection: gl.getUniformLocation(program, "uProjection"),

            camPos: gl.getUniformLocation(program, "uCamPos"),
            lightPos: gl.getUniformLocation(program, "uLightPos"),
            lightDir: gl.getUniformLocation(program, "uLightDir"),
            lightColor: gl.getUniformLocation(program, "uLightColor"),
            lightEnabled: gl.getUniformLocation(program, "uLightEnabled"),

            ambientColor: gl.getUniformLocation(program, "uAmbientColor"),

            useTexture: gl.getUniformLocation(program, "uUseTexture"),
            sampler: gl.getUniformLocation(program, "uSampler"),
            color: gl.getUniformLocation(program, "uColor")
        };

        this.locations = { attribs, uniforms };

        // Verificação dos atributos
        for (const [name, location] of Object.entries(attribs)) {
            if (location === -1) {
                throw new Error(`Atributo não encontrado no shader: ${name}`);
            }

            gl.enableVertexAttribArray(location);
        }

        // Verificação dos uniforms
        for (const [name, location] of Object.entries(uniforms)) {
            if (location === null) {
                console.warn(`Uniform não encontrado ou inativo: ${name}`);
            }
        }

        // Unidade de textura padrão
        gl.uniform1i(uniforms.sampler, 0);

        // Liberar shaders após a linkagem
        gl.detachShader(program, vertexShader);
        gl.detachShader(program, fragmentShader);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    }


    _initTextures(images) {
        for (const [name, image] of Object.entries(images)) {
            console.log(`Carregando textura: ${name}`);
            console.log("Imagem:", image);
            console.log("Dimensões:", image.width, image.height);
            console.log("Completa:", image.complete);

            this.textures[name] = this.createTextureFromSource(image);

            console.log("WebGLTexture:", this.textures[name]);
        }
    }

    createTextureFromSource(source) {
        const gl = this.gl;

        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            source
        );

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_WRAP_S,
            gl.REPEAT
        );

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_WRAP_T,
            gl.REPEAT
        );

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR
        );

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MAG_FILTER,
            gl.LINEAR
        );

        gl.generateMipmap(gl.TEXTURE_2D);

        const error = gl.getError();

        if (error !== gl.NO_ERROR) {
            console.error("Erro ao criar textura:", error);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);

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
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, options.texture);
            gl.uniform1i(this.locations.uniforms.sampler, 0);
            gl.uniform1i(this.locations.uniforms.useTexture, 1);
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

        const first = options.first ?? 0;
        const count = options.count ?? buffers.count;

        gl.drawArrays(gl.TRIANGLES, first, count);
    }

    _proceduralTexture() {
        // Criar textura de piso procedural (azulejo/grade de terror)
        // Isso funciona nativamente sem problemas de CORS ou servidor local!
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");

        // Fundo cinza escuro
        ctx.fillStyle = "#000";
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

        return canvas;
    }
}
