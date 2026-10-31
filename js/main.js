import { Renderer } from './renderer.js';
import { DATASETS } from './dataset-catalog.js';

async function main() {
  const canvas = document.getElementById('glCanvas');
  const status = document.getElementById('status');
  let renderer;
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
        status.textContent = 'Drag to rotate. Scroll to zoom.';
      } catch (error) {
        console.error(error);
        selector.value = renderer.activeDatasetId;
        status.textContent = `Dataset error: ${error.message}`;
      } finally { busy = false; selector.disabled = false; }
    });
    status.textContent = 'Drag to rotate. Scroll to zoom.';
    let running = true;
    function frame() { if (!running) return; renderer.render(); requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
    window.addEventListener('pagehide', () => { running = false; renderer.dispose(); }, {once:true});
  } catch (error) {
    console.error(error);
    status.textContent = `Error: ${error.message}`;
    renderer?.dispose();
  }
}
window.addEventListener('load', main);
