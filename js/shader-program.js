export class ShaderProgram {

  constructor(gl, vertexSource, fragmentSource) {
    this.gl = gl;

    const vertexShader = this.compileShader(
      gl.VERTEX_SHADER,
      vertexSource
    );

    const fragmentShader = this.compileShader(
      gl.FRAGMENT_SHADER,
      fragmentSource
    );

    this.program = gl.createProgram();

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);

    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(this.program);

      gl.deleteProgram(this.program);

      throw new Error(`Shader program failed to link:\n${message}`);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }


  compileShader(type, source) {
    const gl = this.gl;

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);

      gl.deleteShader(shader);

      throw new Error(`Shader failed to compile:\n${message}`);
    }

    return shader;
  }


  use() {
    this.gl.useProgram(this.program);
  }


  getAttributeLocation(name) {
    return this.gl.getAttribLocation(this.program, name);
  }


  getUniformLocation(name) {
    return this.gl.getUniformLocation(this.program, name);
  }

}