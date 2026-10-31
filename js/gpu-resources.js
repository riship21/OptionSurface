// Tracks GPU handles owned by one uploaded mesh; release when replacing it.
export class GPUResources {
  constructor(gl) { this.gl = gl; this.buffers = []; this.vertexArrays = []; }
  createBuffer() {
    const handle = this.gl.createBuffer();
    if (!handle) throw new Error('Could not allocate GPU buffer.');
    this.buffers.push(handle); return handle;
  }
  createVertexArray() {
    const handle = this.gl.createVertexArray();
    if (!handle) throw new Error('Could not allocate GPU vertex array.');
    this.vertexArrays.push(handle); return handle;
  }
  dispose() {
    const gl = this.gl;
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    for (const vao of this.vertexArrays) gl.deleteVertexArray(vao);
    for (const buffer of this.buffers) gl.deleteBuffer(buffer);
    this.vertexArrays.length = 0;
    this.buffers.length = 0;
  }
}
