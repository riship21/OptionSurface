// Orbit camera with orbit, pan and zoom; all positions are in world space.
export class OrbitCamera {
  constructor(canvas) {
    this.canvas = canvas;
    this.rotationSpeed = 0.008;
    this.zoomSpeed = 0.001;
    this.minDistance = 2.5;
    this.maxDistance = 20;
    this.reset();
    this.drag = null;
    this.setupControls();
  }
  reset() {
    // Center the camera on the volatility surface
    this.target = glMatrix.vec3.fromValues(0, 0.65, 0);

    // Move the camera closer to enlarge the graph
    this.distance = 4.35;

    // Default viewing direction
    this.yaw = 0;
    this.pitch = 0.55;
}
  setupControls() {
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    this.canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0 && e.button !== 2) return;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: (e.button === 2 || e.shiftKey) ? 'pan' : 'orbit' };
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove', e => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      this.drag.x = e.clientX; this.drag.y = e.clientY;
      if (this.drag.mode === 'orbit') {
        this.yaw -= dx * this.rotationSpeed;
        this.pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, this.pitch - dy*this.rotationSpeed));
      } else {
        // Pan parallel to camera image plane, accounting for distance and FOV.
        const scale = 2 * this.distance * Math.tan(Math.PI / 6) / Math.max(1, this.canvas.clientHeight);
        const right = [Math.cos(this.yaw), 0, -Math.sin(this.yaw)];
        const up = [-Math.sin(this.pitch)*Math.sin(this.yaw), Math.cos(this.pitch), -Math.sin(this.pitch)*Math.cos(this.yaw)];
        for (let i=0;i<3;i++) this.target[i] += (-dx*right[i] + dy*up[i]) * scale;
      }
    });
    const stop = e => { if (this.drag?.id === e.pointerId) this.drag = null; };
    this.canvas.addEventListener('pointerup', stop);
    this.canvas.addEventListener('pointercancel', stop);
    this.canvas.addEventListener('lostpointercapture', () => { this.drag = null; });
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance * Math.exp(e.deltaY*this.zoomSpeed)));
    }, {passive:false});
  }
  getViewMatrix() {
    const horizontal = this.distance * Math.cos(this.pitch);
    const eye = [this.target[0]+horizontal*Math.sin(this.yaw), this.target[1]+this.distance*Math.sin(this.pitch), this.target[2]+horizontal*Math.cos(this.yaw)];
    const out = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(out, eye, this.target, [0,1,0]);
    return out;
  }
}
