import { Renderer } from './renderer.js';
import { DATASETS } from './dataset-catalog.js';

async function main() {
  const canvas = document.getElementById('glCanvas');
  const status = document.getElementById('status');
  let renderer;
  let running = false;
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    running = false;
    status.textContent = 'WebGL context lost. Waiting for the browser to restore graphics...';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    // Reload is intentional: reconstruct shaders, buffers and camera listeners once.
    window.location.reload();
  });
  try {
    renderer = new Renderer(canvas);
    await renderer.initialize();
    const selector = document.getElementById('datasetSelect');
    for (const entry of DATASETS) {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.name;
      selector.append(option);
    }
    selector.value = renderer.activeDatasetId;
    const updateInfo = () => {
      const d = renderer.getDatasetInfo();
      document.getElementById('datasetName').textContent = `Dataset: ${d.name}`;
      document.getElementById('strikeRange').textContent = `Strike Range: $${d.minStrike} – $${d.maxStrike}`;
      document.getElementById('expirationRange').textContent = `Expiration Range: ${d.minExpiration} – ${d.maxExpiration} days`;
      document.getElementById('gridResolution').textContent = `Source Grid: ${d.strikeCount} × ${d.expirationCount}`;
      document.getElementById('renderResolution').textContent = `Rendered Mesh: ${d.renderRows} × ${d.renderColumns}`;
      document.getElementById('vertexCount').textContent = `Vertices: ${d.vertexCount}`;
      document.getElementById('triangleCount').textContent = `Triangles: ${d.triangleCount}`;
      document.getElementById('ivRange').textContent = `IV Range: ${(100*d.minIV).toFixed(1)}% – ${(100*d.maxIV).toFixed(1)}%`;
    };
    updateInfo();
    const inspectionText = document.getElementById('inspectionText');
    const marker = document.getElementById('selectionMarker');
    const clearInspection = document.getElementById('clearInspection');
    const clearSelection = () => { renderer.clearInspection(); marker.hidden = true; inspectionText.textContent = 'Click the colored surface to inspect strike, expiration and implied volatility. Drag to rotate.'; clearInspection.disabled = true; };
    clearInspection.addEventListener('click', clearSelection);
    let press = null;
    canvas.addEventListener('pointerdown', event => { if(event.button === 0 && !event.shiftKey) press={id:event.pointerId,x:event.clientX,y:event.clientY}; else press=null; });
    canvas.addEventListener('pointercancel', () => { press=null; });
    canvas.addEventListener('pointerup', event => {
      if(!press || press.id !== event.pointerId) return;
      const moved=Math.hypot(event.clientX-press.x,event.clientY-press.y);
      press=null;
      if(moved>5) return; // camera drag, not a click
      const point=renderer.inspectAt(event.clientX,event.clientY);
      if(!point) { clearSelection(); return; }
      inspectionText.textContent = `Strike: $${point.strike.toFixed(2)} · Expiration: ${point.expiration.toFixed(1)} days · Implied volatility: ${(point.iv*100).toFixed(2)}% (interpolated)`;
      clearInspection.disabled=false;
    });
    const surfaceToggle = document.getElementById('surfaceToggle');
    const wireframeToggle = document.getElementById('wireframeToggle');
    surfaceToggle.addEventListener('change', () => renderer.setSurfaceVisible(surfaceToggle.checked));
    wireframeToggle.addEventListener('change', () => renderer.setWireframeVisible(wireframeToggle.checked));
    let busy = false;
    selector.addEventListener('change', async () => {
      if (busy) return;
      busy = true;
      const requested = selector.value;
      selector.disabled = true;
      status.textContent = 'Loading dataset...';
      try {
        await renderer.setDataset(requested);
        updateInfo();
        clearSelection();
        status.textContent = 'Left-drag: orbit · Right/Shift-drag: pan · Scroll: zoom.';
      } catch (error) {
        console.error(error);
        selector.value = renderer.activeDatasetId;
        status.textContent = `Dataset error: ${error.message}`;
      } finally { busy = false; selector.disabled = false; }
    });
    const resetButton = document.getElementById('cameraReset');
    resetButton.addEventListener('click', () => renderer.camera.reset());
    const lightingMode = document.getElementById('lightingMode');
    lightingMode.addEventListener('change', () => renderer.setLightingMode(lightingMode.value));
    const lightIntensity = document.getElementById('lightIntensity');
    const intensityValue = document.getElementById('intensityValue');
    lightIntensity.addEventListener('input', () => {
      renderer.setLightIntensity(Number(lightIntensity.value));
      intensityValue.textContent = Number(lightIntensity.value).toFixed(1);
    });
    status.textContent = 'Left-drag: orbit · Right/Shift-drag: pan · Scroll: zoom.';
    running = true;
    function frame() {
      if (!running) return;
      try {
        renderer.render();
        const p=renderer.selectedScreenPosition();
        marker.hidden=!p;
        if(p) { marker.style.left=`${p.x}px`; marker.style.top=`${p.y}px`; }
        requestAnimationFrame(frame);
      } catch (error) {
        running = false;
        console.error(error);
        status.textContent = `Rendering error: ${error.message}`;
      }
    }
    requestAnimationFrame(frame);
    window.addEventListener('pagehide', () => { running = false; renderer.dispose(); }, {once:true});
  } catch (error) {
    console.error(error);
    status.textContent = `Error: ${error.message}`;
    renderer?.dispose();
  }
}
window.addEventListener('load', main);
