# OptionSurface

**Interactive 3D Options Volatility Surface Explorer**  
COSC 552 — Computer Graphics | Individual Project

OptionSurface is an interactive WebGL2 application that visualizes options **implied volatility (IV)** as a three-dimensional surface over **strike price** and **time to expiration**. It is designed to make volatility-smile, skew, and term-structure patterns easier to explore through real-time rendering, camera navigation, and point inspection.

> **Data notice:** The included datasets are synthetic, reproducible examples for visualization and teaching. They are **not live market quotes** and should not be used for trading decisions.

## Requirements

- A recent desktop browser with **WebGL2** support (for example, Chrome or Edge).
- **Python 3** (or another local HTTP server) for running the application.
- **Node.js** for the automated tests only. No Node packages need to be installed for the current test command.

## Quick start

Clone the repository:

```bash
git clone https://github.com/riship21/OptionSurface.git
cd OptionSurface
```

Start a local server from the repository root:

```bash
python -m http.server 8000
```

Open **http://localhost:8000**. On Windows, `py -m http.server 8000` also works if `python` is unavailable.

The app must be served over HTTP rather than opened directly as a `file://` document because it loads GLSL shaders and JSON datasets using `fetch()`.

## Using the application

| Action | Control |
| --- | --- |
| Orbit the surface | Left mouse drag |
| Pan the camera | Right mouse drag or Shift + left drag |
| Zoom | Mouse wheel |
| Reset view | **Reset camera** |
| Inspect a point | Click once on the colored surface |
| Clear inspected point | **Clear selection** |
| Change volatility example | **Volatility dataset** selector |
| Compare rendering techniques | **Blinn–Phong / Surface normals** selector |
| Adjust brightness | **Light intensity** slider |
| View topology | **Wireframe overlay** checkbox |

The graph uses **X = strike price**, **Y = implied volatility**, and **Z = time to expiration**. Numerical labels show the current dataset's values. Clicking the mesh shows an interpolated estimate of strike, expiration, and IV at the selected position.

## Included datasets

- **Sample volatility smile:** IV rises toward strike extremes.
- **Downside skew:** Lower strikes have higher IV.
- **Flat volatility:** Constant IV; also tests the zero-range case.
- **Term structure:** IV varies primarily with expiration.

All supplied data are synthetic and loaded locally. Switching datasets rebuilds the surface mesh and replaces its GPU buffers without reloading the page.

## Graphics implementation

### Primary depth area 1 — Geometry and transformations

The application constructs an indexed triangle mesh from a strike-by-expiration IV grid. The source 5 × 5 sample grid is interpolated into a **21 × 21 rendered grid**, consisting of **441 vertices and 800 triangles**. It uses bilinear interpolation within each data cell, then computes vertex normals by accumulating adjacent face normals and normalizing the result.

The camera uses model/view/projection transformations and perspective projection. Orbit, pan, and zoom modify the view, while numeric axis labels and point-selection markers are projected into screen coordinates. The actual source observations are preserved at grid nodes; interpolation does not introduce new observed market quotes.

### Primary depth area 2 — Shading and lighting

Custom **GLSL ES 3.00 vertex and fragment shaders** implement per-fragment **Blinn–Phong lighting**. Surface normals provide diffuse and specular shading, and normalized IV determines the surface's color gradient. A separate normal-visualization mode displays the geometric normals for comparison. The light-intensity control allows real-time adjustment.

### Picking and GPU lifecycle

Mouse selection constructs a ray from screen coordinates using the inverse view-projection matrix. A **Möller–Trumbore ray–triangle intersection** finds a point on the rendered surface. Its coordinates are converted back to strike, expiration, and IV values.

Dataset switching validates input, rebuilds the mesh, uploads replacement vertex/index buffers and vertex-array objects, then releases the previous GPU resources. The application includes shader-lifecycle cleanup and handling for lost/restored WebGL contexts.

## Project structure

```text
OptionSurface/
├── index.html                 # Application dashboard and controls
├── css/                       # Dashboard, rendering, and axis-label styles
├── data/                      # Synthetic volatility JSON datasets
├── js/
│   ├── main.js                # Application startup, UI events, render loop
│   ├── renderer.js            # WebGL drawing and scene state
│   ├── surface-mesh.js        # Mesh generation, interpolation, normals
│   ├── volatility-data.js     # Data loading and validation
│   ├── dataset-catalog.js     # Scenario selection
│   ├── camera.js              # Orbit, pan, zoom, reset
│   ├── picking.js             # Ray casting and surface inspection
│   ├── axis-labels.js         # Numerical axis-label placement
│   ├── axis-grid.js           # Grid and colored axes
│   ├── shader-program.js      # Shader compilation and lifecycle
│   └── gpu-resources.js       # GPU buffer and VAO tracking
├── shaders/                   # WebGL2 GLSL shader sources
├── vendor/                    # Bundled gl-matrix
├── tests/                     # Node's built-in test runner
├── package.json
└── PROJECT_PROPOSAL.md
```

## Automated testing

With Node.js installed, run from the repository root:

```bash
npm test
```

The tests cover dataset definitions and validation, mesh topology, original grid-value preservation, flat-IV behavior, ray casting and coordinate recovery, shader resource lifecycle, GPU buffer tracking, and axis-label placement. The most recent locally reported run passed **19 tests**; rerun the command on the final submission before citing a final count.

## Hosting

This application can be deployed as a **static website**. Copy the project root's `index.html` and the required `css/`, `js/`, `data/`, `shaders/`, and `vendor/` directories to a static host. Maintain their relative paths. A backend, paid market-data API, and Node.js server are not required for the current version.

The deployed URL will be added here after publication.

## Limitations and future work

- The supplied IV examples are synthetic, not retrieved from a market-data provider.
- Higher-resolution rendered meshes interpolate the source grid; they do not increase the number of independent observations.
- IV color and height scales are normalized per dataset, so visually similar colors/heights across different datasets do not necessarily imply identical absolute IV values.
- Future extensions could include importing real option-chain CSV/JSON, optional API-based data retrieval, and shared scales for side-by-side comparison.
