import { validateVolatilityData } from './volatility-data.js';

// A 5x5 data grid becomes 21x21 sample points with subdivisions=5.
export function buildSurfaceMesh(data, subdivisions = 5) {
  validateVolatilityData(data);
  if (!Number.isInteger(subdivisions) || subdivisions < 1 || subdivisions > 32) {
    throw new Error('subdivisions must be an integer between 1 and 32.');
  }
  const { strikes, expirations, volatility } = data;
  const rows = (strikes.length - 1) * subdivisions + 1;
  const columns = (expirations.length - 1) * subdivisions + 1;
  const vertexCount = rows * columns;
  // Existing renderer draws both meshes with UNSIGNED_SHORT indices.
  if (vertexCount > 65535) throw new Error('Mesh exceeds the 16-bit vertex-index limit.');

  const minStrike = strikes[0], maxStrike = strikes.at(-1);
  const minExpiration = expirations[0], maxExpiration = expirations.at(-1);
  const allIV = volatility.flat();
  const minIV = Math.min(...allIV), maxIV = Math.max(...allIV);
  const ivSpan = maxIV - minIV;
  const vertices = new Float32Array(vertexCount * 3);
  const ivValues = new Float32Array(vertexCount);
  const indices = new Uint16Array((rows - 1) * (columns - 1) * 6);

  // Interpolate within cells in physical strike/expiration coordinates.
  // The interpolation introduces no extra observed market data.
  for (let r = 0; r < rows; r++) {
    const strikeCell = Math.min(Math.floor(r / subdivisions), strikes.length - 2);
    const strikeFraction = r === rows - 1 ? 1 : (r % subdivisions) / subdivisions;
    const strike = strikes[strikeCell] * (1 - strikeFraction) + strikes[strikeCell + 1] * strikeFraction;
    for (let c = 0; c < columns; c++) {
      const expirationCell = Math.min(Math.floor(c / subdivisions), expirations.length - 2);
      const expirationFraction = c === columns - 1 ? 1 : (c % subdivisions) / subdivisions;
      const expiration = expirations[expirationCell] * (1 - expirationFraction) + expirations[expirationCell + 1] * expirationFraction;
      const a = volatility[strikeCell][expirationCell];
      const b = volatility[strikeCell + 1][expirationCell];
      const d = volatility[strikeCell][expirationCell + 1];
      const e = volatility[strikeCell + 1][expirationCell + 1];
      const iv = (1 - strikeFraction) * ((1 - expirationFraction) * a + expirationFraction * d)
        + strikeFraction * ((1 - expirationFraction) * b + expirationFraction * e);
      const normalizedIV = ivSpan > 0 ? (iv - minIV) / ivSpan : 0.5;
      const index = r * columns + c;
      const offset = 3 * index;
      vertices[offset] = ((strike - minStrike) / (maxStrike - minStrike) - 0.5) * 4;
      vertices[offset + 1] = normalizedIV * 1.5;
      vertices[offset + 2] = ((expiration - minExpiration) / (maxExpiration - minExpiration) - 0.5) * 4;
      ivValues[index] = normalizedIV;
    }
  }

  let k = 0;
  for (let row = 0; row < rows - 1; row++) {
    for (let column = 0; column < columns - 1; column++) {
      const tl = row * columns + column, tr = tl + 1;
      const bl = (row + 1) * columns + column, br = bl + 1;
      indices[k++] = tl; indices[k++] = tr; indices[k++] = bl;
      indices[k++] = tr; indices[k++] = br; indices[k++] = bl;
    }
  }

  const normals = calculateVertexNormals(vertices, indices);
  const wireframeIndices = buildWireframeIndices(indices);
  return { vertices, normals, ivValues, indices, wireframeIndices, minIV, maxIV, rows, columns };
}

function calculateVertexNormals(vertices, indices) {
  const normals = new Float32Array(vertices.length);
  for (let i = 0; i < indices.length; i += 3) {
    const a = 3 * indices[i], b = 3 * indices[i + 1], c = 3 * indices[i + 2];
    const abx = vertices[b] - vertices[a], aby = vertices[b + 1] - vertices[a + 1], abz = vertices[b + 2] - vertices[a + 2];
    const acx = vertices[c] - vertices[a], acy = vertices[c + 1] - vertices[a + 1], acz = vertices[c + 2] - vertices[a + 2];
    const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
    for (const o of [a, b, c]) { normals[o] += nx; normals[o + 1] += ny; normals[o + 2] += nz; }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
    if (length > 1e-12) {
      normals[i] /= length; normals[i + 1] /= length; normals[i + 2] /= length;
    } else {
      normals[i] = 0; normals[i + 1] = 1; normals[i + 2] = 0;
    }
  }
  return normals;
}

function buildWireframeIndices(triangleIndices) {
  const edges = new Set();
  const result = [];
  for (let i = 0; i < triangleIndices.length; i += 3) {
    const triangle = [triangleIndices[i], triangleIndices[i + 1], triangleIndices[i + 2]];
    for (const [a, b] of [[triangle[0], triangle[1]], [triangle[1], triangle[2]], [triangle[2], triangle[0]]]) {
      const lo = Math.min(a, b), hi = Math.max(a, b), key = `${lo}-${hi}`;
      if (!edges.has(key)) { edges.add(key); result.push(lo, hi); }
    }
  }
  return new Uint16Array(result);
}
