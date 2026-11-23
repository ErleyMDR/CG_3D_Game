/**
 * webgl.js - Utilitários de contexto e compilação WebGL
 */

function getGL(canvas) {
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) return gl;
    alert("Contexto WebGL inexistente! Troque de navegador!");
    return null;
}

function createShader(gl, shaderType, shaderSrc) {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSrc);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }

    alert("Erro de compilação: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}

function createProgram(gl, vtxShader, fragShader) {
    const prog = gl.createProgram();
    gl.attachShader(prog, vtxShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);

    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        return prog;
    }

    alert("Erro de linkagem: " + gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
}
