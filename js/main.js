import { Renderer } from './renderer.js';


async function main() {

  const canvas =
    document.getElementById('glCanvas');


  const status =
    document.getElementById('status');


  try {

    const renderer =
      new Renderer(canvas);


    await renderer.initialize();


    const surfaceToggle =
      document.getElementById(
        'surfaceToggle'
      );


    const wireframeToggle =
      document.getElementById(
        'wireframeToggle'
      );


    surfaceToggle.addEventListener(
      'change',
      () => {

        renderer.setSurfaceVisible(
          surfaceToggle.checked
        );
      }
    );


    wireframeToggle.addEventListener(
      'change',
      () => {

        renderer.setWireframeVisible(
          wireframeToggle.checked
        );
      }
    );


    const datasetInfo =
      renderer.getDatasetInfo();


    document.getElementById(
      'datasetName'
    ).textContent =
      `Dataset: ${datasetInfo.name}`;


    document.getElementById(
      'strikeRange'
    ).textContent =
      `Strike Range: $${datasetInfo.minStrike} – $${datasetInfo.maxStrike}`;


    document.getElementById(
      'expirationRange'
    ).textContent =
      `Expiration Range: ${datasetInfo.minExpiration} – ${datasetInfo.maxExpiration} days`;


    document.getElementById(
      'gridResolution'
    ).textContent =
      `Grid Resolution: ${datasetInfo.strikeCount} × ${datasetInfo.expirationCount}`;


    document.getElementById(
      'vertexCount'
    ).textContent =
      `Vertices: ${datasetInfo.vertexCount}`;


    document.getElementById(
      'triangleCount'
    ).textContent =
      `Triangles: ${datasetInfo.triangleCount}`;


    status.textContent =
      'Drag to rotate. Scroll to zoom.';


    function render(now) {

      const time =
        now * 0.001;


      renderer.render(time);


      requestAnimationFrame(render);
    }


    requestAnimationFrame(render);

  }
  catch (error) {

    console.error(error);


    status.textContent =
      `Error: ${error.message}`;
  }

}


window.addEventListener(
  'load',
  main
);
