export class ShaderProgram {
  constructor(gl, vertexSource, fragmentSource) {
    this.gl = gl;
    this.program = null;
    let vertex = null;
    let fragment = null;
    let program = null;
    try {
      vertex = this.compileShader(gl.VERTEX_SHADER, vertexSource);
      fragment = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      if (!program) throw new Error('Could not allocate shader program.');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Shader program failed to link:\n${gl.getProgramInfoLog(program)}`);
      }
      this.program = program;
    } catch (error) {
      if (program) gl.deleteProgram(program);
      throw error;
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }
  }
  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Could not allocate shader.');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader failed to compile:\n${message}`);
    }
    return shader;
  }
  use() { this.gl.useProgram(this.program); }
  getAttributeLocation(name) { return this.gl.getAttribLocation(this.program, name); }
  getUniformLocation(name) { return this.gl.getUniformLocation(this.program, name); }
  dispose() {
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }
}
