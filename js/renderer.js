import { ShaderProgram } from './shader-program.js';
import { buildSurfaceMesh } from './surface-mesh.js';
import { loadVolatilityData } from './volatility-data.js';
import { OrbitCamera } from './camera.js';
import { buildAxisGrid } from './axis-grid.js';
import { GPUResources } from './gpu-resources.js';
import { findDataset } from './dataset-catalog.js';
import { pickMesh, rayFromNDC, surfacePointValues } from './picking.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2');
    if (!this.gl) throw new Error('Unable to initialize WebGL2.');
    this.camera = new OrbitCamera(canvas);
    this.projectionMatrix = glMatrix.mat4.create();
    this.modelViewMatrix = glMatrix.mat4.create();
    this.normalMatrix = glMatrix.mat3.create();
    this.showSurface = true;
    this.showWireframe = false;
    this.lightingMode = 0;
    this.lightIntensity = 1.0;
    this.surfaceResources = null;
    this.gridResources = null;
    this.surfaceVertexArray = null;
    this.wireframeVertexArray = null;
    this.gridVertexArray = null;
    this.surfaceIndexCount = 0;
    this.wireframeIndexCount = 0;
    this.gridVertexCount = 0;
    this.datasetInfo = null;
    this.activeDatasetId = null;
    this.datasetRequest = 0;
    this.currentMesh = null;
    this.selectedPoint = null;
  }

  async initialize() {
    const sources = await Promise.all([
      'shaders/surface.vert','shaders/surface.frag',
      'shaders/line.vert','shaders/line.frag'
    ].map(path => this.loadText(path)));
    this.surfaceShader = new ShaderProgram(this.gl, sources[0], sources[1]);
    this.lineShader = new ShaderProgram(this.gl, sources[2], sources[3]);
    const gl = this.gl;
    gl.clearColor(.05,.08,.12,1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    this.createAxisGrid(buildAxisGrid());
    await this.setDataset('sample');
  }

  // Fetch and validate before replacing the running scene. Old scene survives errors.
  async setDataset(id) {
    const entry = findDataset(id);
    const request = ++this.datasetRequest;
    const data = await loadVolatilityData(entry.path);
    const mesh = buildSurfaceMesh(data);
    if (request !== this.datasetRequest) return false; // stale fetch response
    const upload = new GPUResources(this.gl);
    let surface, wireframe;
    try {
      surface = this.createMeshVertexArray(upload, mesh, false);
      wireframe = this.createMeshVertexArray(upload, mesh, true);
    } catch (error) { upload.dispose(); throw error; }
    // Atomically install new mesh, releasing buffers/VAOs from previous dataset.
    const previous = this.surfaceResources;
    this.surfaceResources = upload;
    this.currentMesh = mesh;
    this.selectedPoint = null;
    this.surfaceVertexArray = surface;
    this.wireframeVertexArray = wireframe;
    this.surfaceIndexCount = mesh.indices.length;
    this.wireframeIndexCount = mesh.wireframeIndices.length;
    this.activeDatasetId = id;
    this.datasetInfo = {
      name: entry.name,
      minStrike: data.strikes[0], maxStrike: data.strikes.at(-1),
      minExpiration: data.expirations[0], maxExpiration: data.expirations.at(-1),
      minIV: mesh.minIV, maxIV: mesh.maxIV,
      strikeCount: data.strikes.length, expirationCount: data.expirations.length,
      renderRows: mesh.rows, renderColumns: mesh.columns,
      vertexCount: mesh.vertices.length / 3, triangleCount: mesh.indices.length / 3
    };
    if (previous) previous.dispose();
    return true;
  }

  createMeshVertexArray(owner, mesh, isWireframe) {
    const gl = this.gl;
    const shader = isWireframe ? this.lineShader : this.surfaceShader;
    const vao = owner.createVertexArray();
    gl.bindVertexArray(vao);
    this.attachAttribute(owner, shader, 'aPosition', mesh.vertices, 3);
    if (isWireframe) {
      const colors = new Float32Array((mesh.vertices.length / 3) * 3);
      for (let i=0;i<colors.length;i+=3) { colors[i]=.9; colors[i+1]=.94; colors[i+2]=1; }
      this.attachAttribute(owner, shader, 'aColor', colors, 3);
    } else {
      this.attachAttribute(owner, shader, 'aNormal', mesh.normals, 3);
      this.attachAttribute(owner, shader, 'aIV', mesh.ivValues, 1);
    }
    const indexBuffer = owner.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, isWireframe ? mesh.wireframeIndices : mesh.indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return vao;
  }

  attachAttribute(owner, shader, name, values, size) {
    const gl = this.gl;
    const location = shader.getAttributeLocation(name);
    if (location < 0) throw new Error(`Missing shader attribute ${name}`);
    const buffer = owner.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }

  createAxisGrid(grid) {
    const gl = this.gl;
    const owner = new GPUResources(gl);
    try {
      const vao = owner.createVertexArray();
      gl.bindVertexArray(vao);
      this.attachAttribute(owner, this.lineShader, 'aPosition', grid.vertices, 3);
      this.attachAttribute(owner, this.lineShader, 'aColor', grid.colors, 3);
      gl.bindVertexArray(null);
      if (this.gridResources) this.gridResources.dispose();
      this.gridResources = owner;
      this.gridVertexArray = vao;
      this.gridVertexCount = grid.vertexCount;
    } catch (error) { owner.dispose(); throw error; }
  }

  render() {
    const gl = this.gl;
    this.resizeCanvas();
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!gl.canvas.width || !gl.canvas.height) return;
    glMatrix.mat4.perspective(this.projectionMatrix, Math.PI/3, gl.canvas.width/gl.canvas.height, .1, 100);
    glMatrix.mat4.copy(this.modelViewMatrix, this.camera.getViewMatrix());
    glMatrix.mat3.normalFromMat4(this.normalMatrix, this.modelViewMatrix);
    if (this.showSurface && this.surfaceVertexArray) {
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1,1);
      this.drawSurface();
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    if (this.showWireframe && this.wireframeVertexArray) this.drawLines(this.wireframeVertexArray, this.wireframeIndexCount, true);
    this.drawLines(this.gridVertexArray, this.gridVertexCount, false);
  }

  setMatrixUniforms(shader) {
    const gl = this.gl;
    gl.uniformMatrix4fv(shader.getUniformLocation('uProjectionMatrix'), false, this.projectionMatrix);
    gl.uniformMatrix4fv(shader.getUniformLocation('uModelViewMatrix'), false, this.modelViewMatrix);
  }

  drawSurface() {
    const gl = this.gl;
    this.surfaceShader.use();
    this.setMatrixUniforms(this.surfaceShader);
    gl.uniformMatrix3fv(this.surfaceShader.getUniformLocation('uNormalMatrix'), false, this.normalMatrix);
    // Shader positions are in eye/view space; keep light in the SAME space.
    gl.uniform3fv(this.surfaceShader.getUniformLocation('uLightPosition'), [0,3,5]);
    gl.uniform1i(this.surfaceShader.getUniformLocation('uLightingMode'), this.lightingMode);
    gl.uniform1f(this.surfaceShader.getUniformLocation('uLightIntensity'), this.lightIntensity);
    gl.bindVertexArray(this.surfaceVertexArray);
    gl.drawElements(gl.TRIANGLES, this.surfaceIndexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  drawLines(vao, count, indexed) {
    if (!vao) return;
    const gl = this.gl;
    this.lineShader.use();
    this.setMatrixUniforms(this.lineShader);
    gl.bindVertexArray(vao);
    if (indexed) gl.drawElements(gl.LINES, count, gl.UNSIGNED_SHORT, 0);
    else gl.drawArrays(gl.LINES, 0, count);
    gl.bindVertexArray(null);
  }

  // Click coordinates are in browser CSS pixels. Convert them to NDC
  // using the canvas bounding rectangle (independent of devicePixelRatio).
  inspectAt(clientX,clientY) {
    const rect=this.canvas.getBoundingClientRect();
    if(!rect.width || !rect.height || !this.currentMesh) return null;
    const ndcX=2*(clientX-rect.left)/rect.width-1;
    const ndcY=1-2*(clientY-rect.top)/rect.height;
    const aspect=rect.width/rect.height;
    const projection=glMatrix.mat4.create();
    glMatrix.mat4.perspective(projection, Math.PI/3, aspect, .1, 100);
    const view=this.camera.getViewMatrix();
    const vp=glMatrix.mat4.create();
    glMatrix.mat4.multiply(vp,projection,view);
    const inv=glMatrix.mat4.create();
    if(!glMatrix.mat4.invert(inv,vp)) return null;
    const ray=rayFromNDC(ndcX,ndcY,inv);
    const hit=pickMesh(ray.origin,ray.direction,this.currentMesh);
    this.selectedPoint=hit?.point ?? null;
    return hit ? surfacePointValues(hit.point,this.datasetInfo):null;
  }

  clearInspection() { this.selectedPoint=null; }

  // Project stored selection each frame so marker follows camera motion.
  selectedScreenPosition() {
    if(!this.selectedPoint) return null;
    const rect=this.canvas.getBoundingClientRect();
    const projection=glMatrix.mat4.create();
    glMatrix.mat4.perspective(projection,Math.PI/3,rect.width/rect.height,.1,100);
    const vp=glMatrix.mat4.create();
    glMatrix.mat4.multiply(vp,projection,this.camera.getViewMatrix());
    const p=this.selectedPoint,m=vp;
    const clipX=m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12];
    const clipY=m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13];
    const clipW=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15];
    if(clipW<=0) return null;
    const x=(clipX/clipW*.5+.5)*rect.width;
    const y=(.5-clipY/clipW*.5)*rect.height;
    return x>=0 && x<=rect.width && y>=0 && y<=rect.height ? {x,y}:null;
  }

  setLightingMode(value) { this.lightingMode = value === 'normal' ? 1 : 0; }
  setLightIntensity(value) {
    if (!Number.isFinite(value)) throw new Error('Lighting intensity must be finite');
    this.lightIntensity = Math.max(0, Math.min(2, value));
  }
  setSurfaceVisible(value) { this.showSurface = value; }
  setWireframeVisible(value) { this.showWireframe = value; }
  getDatasetInfo() { return this.datasetInfo; }
  resizeCanvas() {
    const {canvas} = this;
    const width = Math.round(canvas.clientWidth * (window.devicePixelRatio || 1));
    const height = Math.round(canvas.clientHeight * (window.devicePixelRatio || 1));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  }
  async loadText(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return response.text();
  }
  dispose() {
    ++this.datasetRequest;
    this.surfaceResources?.dispose();
    this.gridResources?.dispose();
    this.surfaceResources = null;
    this.gridResources = null;
    this.currentMesh = null;
    this.selectedPoint = null;
  }
}
