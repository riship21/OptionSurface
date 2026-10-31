# OptionSurface — Phase 3: Surface Point Inspection

## Installation

1. Commit your verified Phase 2 code before making changes.
2. Copy the contents of this ZIP **over the root of your working OptionSurface project**. Replace matching files, preserve all Phase 1B and Phase 2 dependency files (`js/surface-mesh.js`, `js/dataset-catalog.js`, `js/gpu-resources.js`, `css/phase2.css`, etc.).
3. Run `npm test` from project root.
4. Run `python -m http.server 8000` and hard-refresh the browser.

## Use

- **Click** on the colored surface: inspect the interpolated strike, expiration, and implied volatility.
- **Drag**: orbit (picking ignores drags of more than 5 CSS px).
- **Right-click drag / Shift-drag**: pan as before.
- **Clear selection**: remove point marker and values.
- **Select a new dataset**: clears the existing selection before inspecting the new surface.
- The selection marker follows camera changes, is drawn as an HTML overlay (not another WebGL buffer), and does not intercept pointer events.

## Technical details

The selection uses inverse projection × view to construct a world-space ray from canvas pixel coordinates, then performs CPU Möller–Trumbore ray/triangle intersection against the **actual 800 rendered triangles**. It picks the closest positive ray hit. This is exact for the displayed triangulated geometry (subject to floating-point precision), and it does not approximate using a nearest grid node.

The selected strike/expiration values are recovered from the mesh's linear world-space mapping. IV is recovered from the rendered height and dataset normalization, including constant-IV handling. Results between original grid observations are **interpolated model values, not observed market prices**.

## Files changed

- `index.html` — canvas wrapper, marker and inspection panel
- `css/phase3.css` — overlay/inspection styling; preserves full-width layout
- `js/picking.js` — ray construction, triangle intersection, value mapping
- `js/renderer.js` — meshes stored for picking and selection projection
- `js/main.js` — click-vs-drag behavior, marker and output integration
- `tests/picking.test.js` — four new picking tests

No change to the camera, original shaders, mesh interpolation or dataset catalog.
