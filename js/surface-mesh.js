export function buildSurfaceMesh(data) {

  const strikes = data.strikes;
  const expirations = data.expirations;
  const volatility = data.volatility;

  const vertices = [];
  const ivValues = [];
  const indices = [];

  const minStrike = Math.min(...strikes);
  const maxStrike = Math.max(...strikes);

  const minExpiration = Math.min(...expirations);
  const maxExpiration = Math.max(...expirations);

  const allIVValues = volatility.flat();

  const minIV = Math.min(...allIVValues);
  const maxIV = Math.max(...allIVValues);


  for (
    let strikeIndex = 0;
    strikeIndex < strikes.length;
    strikeIndex++
  ) {

    for (
      let expirationIndex = 0;
      expirationIndex < expirations.length;
      expirationIndex++
    ) {

      const strike =
        strikes[strikeIndex];

      const expiration =
        expirations[expirationIndex];

      const iv =
        volatility[strikeIndex][expirationIndex];


      const normalizedIV =
        (iv - minIV) /
        (maxIV - minIV);


      const x =
        (
          (strike - minStrike) /
          (maxStrike - minStrike) -
          0.5
        ) * 4.0;


      const z =
        (
          (expiration - minExpiration) /
          (maxExpiration - minExpiration) -
          0.5
        ) * 4.0;


      const y =
        normalizedIV *
        1.5;


      vertices.push(
        x,
        y,
        z
      );


      ivValues.push(
        normalizedIV
      );
    }
  }


  const columns =
    expirations.length;


  for (
    let row = 0;
    row < strikes.length - 1;
    row++
  ) {

    for (
      let column = 0;
      column < expirations.length - 1;
      column++
    ) {

      const topLeft =
        row * columns + column;

      const topRight =
        topLeft + 1;

      const bottomLeft =
        (row + 1) * columns + column;

      const bottomRight =
        bottomLeft + 1;


      indices.push(
        topLeft,
        topRight,
        bottomLeft
      );


      indices.push(
        topRight,
        bottomRight,
        bottomLeft
      );
    }
  }


  const normals =
    calculateVertexNormals(
      vertices,
      indices
    );


  return {

    vertices:
      new Float32Array(vertices),

    normals:
      new Float32Array(normals),

    ivValues:
      new Float32Array(ivValues),

    indices:
      new Uint16Array(indices),

    minIV:
      minIV,

    maxIV:
      maxIV

  };
}


function calculateVertexNormals(
  vertices,
  indices
) {

  const normals =
    new Array(vertices.length).fill(0.0);


  for (
    let index = 0;
    index < indices.length;
    index += 3
  ) {

    const vertexIndex0 =
      indices[index];

    const vertexIndex1 =
      indices[index + 1];

    const vertexIndex2 =
      indices[index + 2];


    const offset0 =
      vertexIndex0 * 3;

    const offset1 =
      vertexIndex1 * 3;

    const offset2 =
      vertexIndex2 * 3;


    const p0 = [
      vertices[offset0],
      vertices[offset0 + 1],
      vertices[offset0 + 2]
    ];


    const p1 = [
      vertices[offset1],
      vertices[offset1 + 1],
      vertices[offset1 + 2]
    ];


    const p2 = [
      vertices[offset2],
      vertices[offset2 + 1],
      vertices[offset2 + 2]
    ];


    const edge1 = [
      p1[0] - p0[0],
      p1[1] - p0[1],
      p1[2] - p0[2]
    ];


    const edge2 = [
      p2[0] - p0[0],
      p2[1] - p0[1],
      p2[2] - p0[2]
    ];


    const faceNormal = [

      edge1[1] * edge2[2] -
      edge1[2] * edge2[1],

      edge1[2] * edge2[0] -
      edge1[0] * edge2[2],

      edge1[0] * edge2[1] -
      edge1[1] * edge2[0]

    ];


    addNormal(
      normals,
      vertexIndex0,
      faceNormal
    );


    addNormal(
      normals,
      vertexIndex1,
      faceNormal
    );


    addNormal(
      normals,
      vertexIndex2,
      faceNormal
    );
  }


  for (
    let vertexIndex = 0;
    vertexIndex < vertices.length / 3;
    vertexIndex++
  ) {

    const offset =
      vertexIndex * 3;


    const x =
      normals[offset];

    const y =
      normals[offset + 1];

    const z =
      normals[offset + 2];


    const length =
      Math.sqrt(
        x * x +
        y * y +
        z * z
      );


    if (length > 0.0) {

      normals[offset] =
        x / length;

      normals[offset + 1] =
        y / length;

      normals[offset + 2] =
        z / length;
    }
  }


  return normals;
}


function addNormal(
  normals,
  vertexIndex,
  faceNormal
) {

  const offset =
    vertexIndex * 3;


  normals[offset] +=
    faceNormal[0];

  normals[offset + 1] +=
    faceNormal[1];

  normals[offset + 2] +=
    faceNormal[2];
}