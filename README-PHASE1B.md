# OptionSurface — Phase 1B: dataset switching and GPU cleanup

## Install

1. Keep a backup or Git commit of your current working Phase 1A project.
2. Merge this ZIP into the **root** of your existing OptionSurface folder. **Replace** duplicate files: `index.html`, `js/main.js`, and `js/renderer.js`. It also bundles the Phase 1A mesh/validation modules and tests, which should match your current versions.
3. Preserve your existing `css/`, `shaders/`, `vendor/`, `js/camera.js`, `js/axis-grid.js`, and `js/shader-program.js`.
4. From the project root run `npm test`.
5. Run `python -m http.server 8000` and refresh `http://localhost:8000` (Ctrl+F5 if cached).

## Browser checks

- All four datasets switch without reloading the page.
- Wireframe and surface toggles still work after multiple switches.
- Orbit and zoom continue to work.
- Dataset info reads `Source Grid: 5 × 5` and `Rendered Mesh: 21 × 21`, `Vertices: 441`, `Triangles: 800`.
- The flat-volatility dataset produces an even horizontal surface.
- Open F12 Console: no WebGL or JavaScript errors.

## Engineering notes

- Dataset JSON files are synthetic illustrations, not actual options-market observations.
- Each dataset's IV range is normalized independently to fill the 3D height and color range. The flat scenario is displayed at a neutral height. Therefore **absolute heights/colors across different datasets are not directly comparable**. Cross-dataset normalization is a later comparison feature.
- The renderer uploads the replacement surface into fresh VAOs/buffers, commits the new surface, then releases old GPU buffers and VAOs. An upload failure retains the previous surface.
- The grid buffers persist across dataset changes. `pagehide` releases both groups; the orbit camera does not currently expose event-listener disposal, which is a later robustness improvement.
- Shader programs also are not explicitly freed in this phase. They are initialized once per page and do not accumulate during dataset switches.
- Node tests use fake GPU handles; test success does NOT verify live WebGL behavior. Please perform the browser checks.
