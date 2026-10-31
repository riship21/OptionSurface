// Readable HTML labels projected from the same view/projection matrices as WebGL.
// Dataset values are synthetic; Y height is normalized per dataset.
export function axisLabelSpecs(info) {
  if (!info) return [];
  const lerp = (a, b, t) => a + (b - a) * t;
  const labels = [];
  for (const t of [0, 0.5, 1]) {
    labels.push({ axis: 'x', text: `$${lerp(info.minStrike, info.maxStrike, t).toFixed(0)}`, point: [-2 + 4*t, -0.04, 2.28] });
    labels.push({ axis: 'z', text: `${lerp(info.minExpiration, info.maxExpiration, t).toFixed(0)}d`, point: [-2.35, -0.04, -2 + 4*t] });
  }
  // A constant-IV surface has a single meaningful height, not three different IV levels.
  const flat = Math.abs(info.maxIV - info.minIV) < 1e-10;
  for (const t of (flat ? [0.5] : [0, 0.5, 1])) {
    labels.push({ axis: 'y', text: `${(100*lerp(info.minIV, info.maxIV, t)).toFixed(1)}%`, point: [-2.2, 1.5*t, -2.2] });
  }
  return labels;
}

export function projectWorldPoint(point, vp, width, height) {
  const [x, y, z] = point;
  const w = vp[3]*x + vp[7]*y + vp[11]*z + vp[15];
  if (!Number.isFinite(w) || w <= 0 || width <= 0 || height <= 0) return null;
  const clipX = vp[0]*x + vp[4]*y + vp[8]*z + vp[12];
  const clipY = vp[1]*x + vp[5]*y + vp[9]*z + vp[13];
  const clipZ = vp[2]*x + vp[6]*y + vp[10]*z + vp[14];
  const nx = clipX/w, ny = clipY/w, nz = clipZ/w;
  if (![nx,ny,nz].every(Number.isFinite) || nx < -1 || nx > 1 || ny < -1 || ny > 1 || nz < -1 || nz > 1) return null;
  return { x: (nx * 0.5 + 0.5) * width, y: (0.5 - ny * 0.5) * height };
}

// Axis labels may sit just outside the 3D clip rectangle when a surface
// nearly fills the viewport. Keep those labels inside a small screen margin.
// Unlike projectWorldPoint, this is intentionally an annotation placement,
// not a visibility test for scene geometry.
export function projectAxisAnnotation(point, vp, width, height, axis) {
  const [x, y, z] = point;
  if (width <= 0 || height <= 0) return null;
  const w = vp[3]*x + vp[7]*y + vp[11]*z + vp[15];
  if (!Number.isFinite(w) || w <= 0) return null;
  const nx = (vp[0]*x + vp[4]*y + vp[8]*z + vp[12])/w;
  const ny = (vp[1]*x + vp[5]*y + vp[9]*z + vp[13])/w;
  const nz = (vp[2]*x + vp[6]*y + vp[10]*z + vp[14])/w;
  if (![nx,ny,nz].every(Number.isFinite) || nz < -1 || nz > 1) return null;
  const rawX = (nx*.5+.5)*width, rawY = (.5-ny*.5)*height;
  // Avoid pinning labels whose anchor is genuinely far out of view.
  if (rawX < -width*.35 || rawX > width*1.35 || rawY < -height*.35 || rawY > height*1.35) return null;
  const clamp = (n,lo,hi) => Math.max(lo,Math.min(hi,n));
  return {
    x:clamp(rawX,30,width-30),
    y:clamp(rawY + (axis === 'x' ? 14 : axis === 'z' ? -2 : 0),
      18, height - (axis === 'z' ? 42 : 18))
  };
}

// Pure screen-space layout: reject overlapping labels before displaying them.
// Higher-priority endpoint ticks survive when space becomes limited.
export function selectVisibleLabels(candidates, width, height, padding = 6) {
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority || a.index - b.index);
  const accepted = [];
  const result = new Set();
  for (const c of sorted) {
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y) || c.width <= 0 || c.height <= 0) continue;
    const box = { left:c.x-c.width/2-padding, right:c.x+c.width/2+padding,
      top:c.y-c.height/2-padding, bottom:c.y+c.height/2+padding };
    if (box.left < 0 || box.right > width || box.top < 0 || box.bottom > height) continue;
    if (accepted.some(b => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top)) continue;
    accepted.push(box);
    result.add(c.index);
  }
  return result;
}

export class AxisLabels {
  constructor(viewport, renderer) {
    this.viewport = viewport;
    this.renderer = renderer;
    this.overlay = document.createElement('div');
    this.overlay.className = 'axis-label-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');
    viewport.appendChild(this.overlay);
    this.labels = [];
  }

  setDataset(info) {
    this.overlay.replaceChildren();
    this.labels = axisLabelSpecs(info).map(spec => {
      const el = document.createElement('span');
      el.className = `axis-tick axis-tick-${spec.axis}`;
      el.textContent = spec.text;
      el.hidden = true;
      this.overlay.appendChild(el);
      return { ...spec, element: el };
    });
  }

  update() {
    if (!this.labels.length) return;
    const rect = this.renderer.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const projection = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projection, Math.PI/3, rect.width/rect.height, 0.1, 100);
    const vp = glMatrix.mat4.create();
    glMatrix.mat4.multiply(vp, projection, this.renderer.camera.getViewMatrix());
    const candidates = [];
    this.labels.forEach((label, index) => {
      const projected = projectAxisAnnotation(label.point, vp, rect.width, rect.height, label.axis);
      label.element.hidden = !projected;
      if (!projected) return;
      const {x,y} = projected;
      // Screen-space offset keeps ticks visually outside the plotted edges.
      const offsetX = label.axis === 'z' ? -12 : label.axis === 'y' ? -13 : 0;
      const offsetY = 0;
      const px = x + offsetX, py = y + offsetY;
      label.element.style.left = `${px}px`;
      label.element.style.top = `${py}px`;
      const endpoint = index < 6 ? index < 2 || index >= 4 : index === 6 || index === this.labels.length - 1;
      candidates.push({ index, x:px, y:py,
        width:label.element.offsetWidth, height:label.element.offsetHeight,
        priority:(endpoint ? 3 : 1) + (label.axis === 'x' ? 2 : 0) + (label.axis === 'y' ? 1 : 0) });
    });
    const visible = selectVisibleLabels(candidates, rect.width, rect.height);
    this.labels.forEach((label,index) => { label.element.hidden = !visible.has(index); });
  }

  dispose() { this.overlay.remove(); this.labels = []; }
}
