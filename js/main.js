import { Renderer } from './renderer.js';

async function main() {
  const canvas = document.getElementById('glCanvas');
  const status = document.getElementById('status');

  try {
    const renderer = new Renderer(canvas);
    await renderer.initialize();

    const surfaceToggle = document.getElementById('surfaceToggle');
    const wireframeToggle = document.getElementById('wireframeToggle');

    surfaceToggle.addEventListener('change', () => {
      renderer.setSurfaceVisible(surfaceToggle.checked);
    });

    wireframeToggle.addEventListener('change', () => {
      renderer.setWireframeVisible(wireframeToggle.checked);
    });

    status.textContent = 'Drag to rotate. Scroll to zoom.';

    function render(now) {
      const time = now * 0.001;
      renderer.render(time);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }
  catch (error) {
    console.error(error);
    status.textContent = `Error: ${error.message}`;
  }
}

window.addEventListener('load', main);
