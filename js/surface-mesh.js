export function buildSurfaceMesh(data) {

  const strikes = data.strikes;
  const expirations = data.expirations;
  const volatility = data.volatility;

  const vertices = [];
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
        (
          (iv - minIV) /
          (maxIV - minIV)
        ) * 1.5;


      vertices.push(
        x,
        y,
        z
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
        bottomLeft,
        topRight
      );


      indices.push(
        topRight,
        bottomLeft,
        bottomRight
      );
    }
  }


  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices)
  };
}