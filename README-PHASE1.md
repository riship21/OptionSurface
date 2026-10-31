# OptionSurface — Phase 1 geometry and data validation

## Apply to the existing repository

1. Copy `js/surface-mesh.js` and `js/volatility-data.js` over the corresponding files in OptionSurface.
2. Keep your existing `js/renderer.js`, shaders, camera, HTML, stylesheet and data files as-is.
3. Merge `"type": "module"` and the test script from `package.json` into an existing package.json, if one exists. Otherwise copy this package.json.
4. Copy `tests/surface-mesh.test.js` to `tests/`.
5. Run `npm test` (requires Node.js 18+); then launch the app via `python -m http.server 8000` and open `http://localhost:8000`.

## Changes

- Default `buildSurfaceMesh(data)` now bilinearly interpolates the input grid with five subdivisions per original cell (5×5 -> 21×21, 441 vertices and 800 triangles).
- The original market/sample points are retained exactly to floating-point precision.
- Dataset validation requires a rectangular, positive, finite and strictly increasing strike/expiration grid and positive decimal IVs.
- A constant-IV dataset uses a neutral normalized height/color value (0.5), avoiding division by zero.
- Vertex normals remain area weighted and upward-facing (matching triangle winding in original code).
- Preserves Uint16 index buffers used by current renderer; blocks meshes beyond the 16-bit vertex-count limit.

## Known next tasks

- The current dataset info panel reports **source resolution** (5×5), not interpolated mesh resolution. This is intentional: observed data points and rendered mesh density are distinct. Consider displaying both later.
- The current renderer only allocates buffers at initialization. Before adding dataset changes, implement disposal/reuse of buffers and VAOs.
- Browser visual validation is still needed. Node tests cannot certify GPU appearance.
