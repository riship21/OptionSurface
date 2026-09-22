# Project Proposal

## OptionSurface: Interactive 3D Options Volatility Surface Explorer

### Team Roster
**Rishi Patel (Individual Project)**

I will be responsible for the full implementation, testing, documentation, and presentation for this project.

### Project Pitch
OptionSurface is an interactive 3D visualization tool for exploring options implied volatility. The application will display a volatility surface using **strike price**, **time to expiration**, and **implied volatility** as the three dimensions.

The goal is to make patterns such as volatility smile and skew easier to understand than with a traditional table or 2D chart. Users will be able to rotate, zoom, and explore the surface interactively.

### API / Framework
I plan to use:

- **WebGL2**
- **JavaScript**
- **GLSL vertex and fragment shaders**
- **gl-matrix** for vector and matrix operations

WebGL2 is a good fit because it provides direct access to the graphics pipeline and supports custom shaders, vertex/index buffers, lighting, and real-time camera transformations. It also builds on the WebGL2 experience from Lab 1.

### Concept Coverage

#### Primary Depth Area 1: Geometry & Transformations
- Procedurally generate the volatility surface mesh from data
- Create vertices and triangle indices
- Compute surface normals
- Use model/view/projection transformations
- Implement interactive camera rotation, zoom, and pan

#### Primary Depth Area 2: Shading & Lighting
- Custom GLSL vertex and fragment shaders
- Per-pixel lighting using Blinn-Phong or a similar model
- Use surface normals for lighting
- Apply a color map based on implied volatility

### Rough Milestone Plan

#### Mid-Semester
- Working WebGL2 scene
- Interactive camera
- Sample volatility dataset
- Procedurally generated 3D surface
- Basic normals, lighting, and IV-based coloring

#### Final
- Improved lighting and visual quality
- Better axis/grid display
- Surface and wireframe display modes
- Multiple datasets
- Interactive point inspection if time permits

### Risk Assessment
The hardest part will likely be generating and updating the surface mesh correctly while computing usable normals for lighting.

To reduce risk, the core project will use stored or procedurally generated volatility data rather than depending on a live market-data API. Live data, advanced point picking, and surface comparison will be optional features if time allows.
