# OptionSurface Phase 2 — shading + camera controls

## Install
Merge this package into the current Phase 1B project. Replace `index.html`, `js/main.js`, `js/renderer.js`, `js/camera.js`, and `shaders/surface.frag`. Add `css/phase2.css`. Keep all other files including `css/style.css` and Phase 1B data/tests.

## Test
Run `npm test` (Phase 1B's 7 tests should still pass). Then `python -m http.server 8000` and use `Ctrl+Shift+R` in browser.

## Browser checks
- Drag with left mouse to orbit; right mouse or Shift+left drag to pan; wheel zoom; Reset Camera restores initial view.
- Lighting mode changes between Blinn–Phong and Surface normals (colors represent view-space normal XYZ, not IV).
- Light intensity slider affects the Blinn–Phong mode, not the normals diagnostic.
- Canvas expands to available width; inspect F12 for shader compilation errors; dataset switching and wireframe continue to work.

## Technical notes
- Fragment coordinates, normals, and light position now share **view space**. Earlier code passed a fixed `[0,2.5,4]` vector to a shader using view-space fragment positions, which effectively acted as a camera-relative light; new comments make this explicit.
- Screen-space panning derives from perspective FOV 60 degrees and the canvas displayed height. It translates the camera target along camera right/up vectors.
- `Surface normals` is a debugging visualization demonstrating interpolated normals and the effect of camera transformations; it does not encode IV.
- This package does not claim browser tests have passed; manually verify UI, camera, shader and resizing.
