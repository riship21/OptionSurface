import { ShaderProgram } from './shader-program.js';


export class Renderer {

  constructor(canvas) {

    this.canvas = canvas;

    this.gl = canvas.getContext('webgl2');

    if (this.gl === null) {
      throw new Error('Unable to initialize WebGL2.');
    }

    this.shader = null;

    this.vertexArray = null;

    this.projectionMatrix = glMatrix.mat4.create();

    this.modelViewMatrix = glMatrix.mat4.create();
  }


  async initialize() {

    const vertexSource = await this.loadText(
      'shaders/surface.vert'
    );

    const fragmentSource = await this.loadText(
      'shaders/surface.frag'
    );

    this.shader = new ShaderProgram(
      this.gl,
      vertexSource,
      fragmentSource
    );

    this.createTestTriangle();

    const gl = this.gl;

    gl.clearColor(
      0.05,
      0.08,
      0.12,
      1.0
    );

    gl.enable(gl.DEPTH_TEST);

    gl.depthFunc(gl.LEQUAL);
  }


  createTestTriangle() {

    const gl = this.gl;

    const vertices = new Float32Array([
       0.0,  1.0, 0.0,
      -1.0, -1.0, 0.0,
       1.0, -1.0, 0.0
    ]);

    this.vertexArray = gl.createVertexArray();

    gl.bindVertexArray(this.vertexArray);

    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      positionBuffer
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      vertices,
      gl.STATIC_DRAW
    );

    const positionLocation =
      this.shader.getAttributeLocation('aPosition');

    gl.enableVertexAttribArray(
      positionLocation
    );

    gl.vertexAttribPointer(
      positionLocation,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindVertexArray(null);
  }


  render(time) {

    const gl = this.gl;

    this.resizeCanvas();

    gl.viewport(
      0,
      0,
      gl.canvas.width,
      gl.canvas.height
    );

    gl.clear(
      gl.COLOR_BUFFER_BIT |
      gl.DEPTH_BUFFER_BIT
    );

    const aspect =
      gl.canvas.width /
      gl.canvas.height;

    glMatrix.mat4.perspective(
      this.projectionMatrix,
      Math.PI / 3.0,
      aspect,
      0.1,
      100.0
    );


    const modelMatrix =
      glMatrix.mat4.create();

    glMatrix.mat4.rotateZ(
      modelMatrix,
      modelMatrix,
      time * 0.5
    );


    const viewMatrix =
      glMatrix.mat4.create();

    glMatrix.mat4.lookAt(
      viewMatrix,
      [0.0, 0.0, 4.0],
      [0.0, 0.0, 0.0],
      [0.0, 1.0, 0.0]
    );


    glMatrix.mat4.multiply(
      this.modelViewMatrix,
      viewMatrix,
      modelMatrix
    );


    this.shader.use();

    gl.uniformMatrix4fv(
      this.shader.getUniformLocation(
        'uProjectionMatrix'
      ),
      false,
      this.projectionMatrix
    );

    gl.uniformMatrix4fv(
      this.shader.getUniformLocation(
        'uModelViewMatrix'
      ),
      false,
      this.modelViewMatrix
    );


    gl.bindVertexArray(
      this.vertexArray
    );

    gl.drawArrays(
      gl.TRIANGLES,
      0,
      3
    );

    gl.bindVertexArray(null);
  }


  resizeCanvas() {

    const canvas = this.canvas;

    const displayWidth =
      canvas.clientWidth;

    const displayHeight =
      canvas.clientHeight;

    if (
      canvas.width !== displayWidth ||
      canvas.height !== displayHeight
    ) {

      canvas.width = displayWidth;

      canvas.height = displayHeight;
    }
  }


  async loadText(path) {

    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(
        `Unable to load ${path}`
      );
    }

    return await response.text();
  }

}