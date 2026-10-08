import { ShaderProgram } from './shader-program.js';
import { buildSurfaceMesh } from './surface-mesh.js';
import { loadVolatilityData } from './volatility-data.js';
import { OrbitCamera } from './camera.js';


export class Renderer {

  constructor(canvas) {

    this.canvas = canvas;

    this.gl =
      canvas.getContext('webgl2');

    if (this.gl === null) {
      throw new Error(
        'Unable to initialize WebGL2.'
      );
    }


    this.shader = null;

    this.vertexArray = null;

    this.indexCount = 0;


    this.projectionMatrix =
      glMatrix.mat4.create();

    this.modelViewMatrix =
      glMatrix.mat4.create();


    this.camera =
      new OrbitCamera(canvas);
  }


  async initialize() {

    const vertexSource =
      await this.loadText(
        'shaders/surface.vert'
      );


    const fragmentSource =
      await this.loadText(
        'shaders/surface.frag'
      );


    this.shader =
      new ShaderProgram(
        this.gl,
        vertexSource,
        fragmentSource
      );


    const volatilityData =
      await loadVolatilityData(
        'data/sample-surface.json'
      );


    const mesh =
      buildSurfaceMesh(
        volatilityData
      );


    this.createSurface(
      mesh
    );


    const gl =
      this.gl;


    gl.clearColor(
      0.05,
      0.08,
      0.12,
      1.0
    );


    gl.enable(
      gl.DEPTH_TEST
    );


    gl.depthFunc(
      gl.LEQUAL
    );
  }


  createSurface(mesh) {

    const gl =
      this.gl;


    this.vertexArray =
      gl.createVertexArray();


    gl.bindVertexArray(
      this.vertexArray
    );


    const positionBuffer =
      gl.createBuffer();


    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      positionBuffer
    );


    gl.bufferData(
      gl.ARRAY_BUFFER,
      mesh.vertices,
      gl.STATIC_DRAW
    );


    const positionLocation =
      this.shader.getAttributeLocation(
        'aPosition'
      );


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


    const indexBuffer =
      gl.createBuffer();


    gl.bindBuffer(
      gl.ELEMENT_ARRAY_BUFFER,
      indexBuffer
    );


    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      mesh.indices,
      gl.STATIC_DRAW
    );


    this.indexCount =
      mesh.indices.length;


    gl.bindVertexArray(
      null
    );
  }


  render() {

    const gl =
      this.gl;


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


    const viewMatrix =
      this.camera.getViewMatrix();


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


    gl.drawElements(
      gl.TRIANGLES,
      this.indexCount,
      gl.UNSIGNED_SHORT,
      0
    );


    gl.bindVertexArray(
      null
    );
  }


  resizeCanvas() {

    const canvas =
      this.canvas;


    const displayWidth =
      canvas.clientWidth;

    const displayHeight =
      canvas.clientHeight;


    if (
      canvas.width !== displayWidth ||
      canvas.height !== displayHeight
    ) {

      canvas.width =
        displayWidth;

      canvas.height =
        displayHeight;
    }
  }


  async loadText(path) {

    const response =
      await fetch(path);


    if (!response.ok) {

      throw new Error(
        `Unable to load ${path}`
      );
    }


    return await response.text();
  }

}