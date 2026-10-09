import { ShaderProgram } from './shader-program.js';
import { buildSurfaceMesh } from './surface-mesh.js';
import { loadVolatilityData } from './volatility-data.js';
import { OrbitCamera } from './camera.js';
import { buildAxisGrid } from './axis-grid.js';


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


    this.surfaceShader = null;

    this.lineShader = null;


    this.surfaceVertexArray = null;

    this.gridVertexArray = null;


    this.surfaceIndexCount = 0;

    this.gridVertexCount = 0;


    this.projectionMatrix =
      glMatrix.mat4.create();


    this.modelViewMatrix =
      glMatrix.mat4.create();


    this.normalMatrix =
      glMatrix.mat3.create();


    this.camera =
      new OrbitCamera(canvas);
  }


  async initialize() {

    const surfaceVertexSource =
      await this.loadText(
        'shaders/surface.vert'
      );


    const surfaceFragmentSource =
      await this.loadText(
        'shaders/surface.frag'
      );


    const lineVertexSource =
      await this.loadText(
        'shaders/line.vert'
      );


    const lineFragmentSource =
      await this.loadText(
        'shaders/line.frag'
      );


    this.surfaceShader =
      new ShaderProgram(
        this.gl,
        surfaceVertexSource,
        surfaceFragmentSource
      );


    this.lineShader =
      new ShaderProgram(
        this.gl,
        lineVertexSource,
        lineFragmentSource
      );


    const volatilityData =
      await loadVolatilityData(
        'data/sample-surface.json'
      );


    const surfaceMesh =
      buildSurfaceMesh(
        volatilityData
      );


    this.createSurface(
      surfaceMesh
    );


    const axisGrid =
      buildAxisGrid();


    this.createAxisGrid(
      axisGrid
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


    this.surfaceVertexArray =
      gl.createVertexArray();


    gl.bindVertexArray(
      this.surfaceVertexArray
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
      this.surfaceShader
        .getAttributeLocation(
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


    const normalBuffer =
      gl.createBuffer();


    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      normalBuffer
    );


    gl.bufferData(
      gl.ARRAY_BUFFER,
      mesh.normals,
      gl.STATIC_DRAW
    );


    const normalLocation =
      this.surfaceShader
        .getAttributeLocation(
          'aNormal'
        );


    gl.enableVertexAttribArray(
      normalLocation
    );


    gl.vertexAttribPointer(
      normalLocation,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );


    const ivBuffer =
      gl.createBuffer();


    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      ivBuffer
    );


    gl.bufferData(
      gl.ARRAY_BUFFER,
      mesh.ivValues,
      gl.STATIC_DRAW
    );


    const ivLocation =
      this.surfaceShader
        .getAttributeLocation(
          'aIV'
        );


    gl.enableVertexAttribArray(
      ivLocation
    );


    gl.vertexAttribPointer(
      ivLocation,
      1,
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


    this.surfaceIndexCount =
      mesh.indices.length;


    gl.bindVertexArray(
      null
    );
  }


  createAxisGrid(grid) {

    const gl =
      this.gl;


    this.gridVertexArray =
      gl.createVertexArray();


    gl.bindVertexArray(
      this.gridVertexArray
    );


    const positionBuffer =
      gl.createBuffer();


    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      positionBuffer
    );


    gl.bufferData(
      gl.ARRAY_BUFFER,
      grid.vertices,
      gl.STATIC_DRAW
    );


    const positionLocation =
      this.lineShader
        .getAttributeLocation(
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


    const colorBuffer =
      gl.createBuffer();


    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      colorBuffer
    );


    gl.bufferData(
      gl.ARRAY_BUFFER,
      grid.colors,
      gl.STATIC_DRAW
    );


    const colorLocation =
      this.lineShader
        .getAttributeLocation(
          'aColor'
        );


    gl.enableVertexAttribArray(
      colorLocation
    );


    gl.vertexAttribPointer(
      colorLocation,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );


    this.gridVertexCount =
      grid.vertexCount;


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


    glMatrix.mat3.normalFromMat4(
      this.normalMatrix,
      this.modelViewMatrix
    );


    this.drawSurface();

    this.drawAxisGrid();
  }


  drawSurface() {

    const gl =
      this.gl;


    this.surfaceShader.use();


    gl.uniformMatrix4fv(

      this.surfaceShader
        .getUniformLocation(
          'uProjectionMatrix'
        ),

      false,

      this.projectionMatrix
    );


    gl.uniformMatrix4fv(

      this.surfaceShader
        .getUniformLocation(
          'uModelViewMatrix'
        ),

      false,

      this.modelViewMatrix
    );


    gl.uniformMatrix3fv(

      this.surfaceShader
        .getUniformLocation(
          'uNormalMatrix'
        ),

      false,

      this.normalMatrix
    );


    gl.uniform3fv(

      this.surfaceShader
        .getUniformLocation(
          'uLightPosition'
        ),

      [
        0.0,
        2.5,
        4.0
      ]
    );


    gl.bindVertexArray(
      this.surfaceVertexArray
    );


    gl.drawElements(
      gl.TRIANGLES,
      this.surfaceIndexCount,
      gl.UNSIGNED_SHORT,
      0
    );


    gl.bindVertexArray(
      null
    );
  }


  drawAxisGrid() {

    const gl =
      this.gl;


    this.lineShader.use();


    gl.uniformMatrix4fv(

      this.lineShader
        .getUniformLocation(
          'uProjectionMatrix'
        ),

      false,

      this.projectionMatrix
    );


    gl.uniformMatrix4fv(

      this.lineShader
        .getUniformLocation(
          'uModelViewMatrix'
        ),

      false,

      this.modelViewMatrix
    );


    gl.bindVertexArray(
      this.gridVertexArray
    );


    gl.drawArrays(
      gl.LINES,
      0,
      this.gridVertexCount
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