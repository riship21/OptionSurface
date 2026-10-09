export function buildAxisGrid() {

  const vertices = [];
  const colors = [];

  const gridMin = -2.0;
  const gridMax = 2.0;
  const gridStep = 0.5;

  const floorY = -0.01;

  const gridColor = [
    0.18,
    0.24,
    0.31
  ];

  const xAxisColor = [
    0.95,
    0.30,
    0.30
  ];

  const yAxisColor = [
    0.30,
    0.90,
    0.40
  ];

  const zAxisColor = [
    0.30,
    0.55,
    1.00
  ];


  function addLine(
    start,
    end,
    color
  ) {

    vertices.push(
      start[0],
      start[1],
      start[2],

      end[0],
      end[1],
      end[2]
    );


    colors.push(
      color[0],
      color[1],
      color[2],

      color[0],
      color[1],
      color[2]
    );
  }


  for (
    let value = gridMin;
    value <= gridMax + 0.001;
    value += gridStep
  ) {

    addLine(
      [
        value,
        floorY,
        gridMin
      ],
      [
        value,
        floorY,
        gridMax
      ],
      gridColor
    );


    addLine(
      [
        gridMin,
        floorY,
        value
      ],
      [
        gridMax,
        floorY,
        value
      ],
      gridColor
    );
  }


  const origin = [
    gridMin,
    0.0,
    gridMin
  ];


  addLine(
    origin,
    [
      gridMax,
      0.0,
      gridMin
    ],
    xAxisColor
  );


  addLine(
    origin,
    [
      gridMin,
      1.7,
      gridMin
    ],
    yAxisColor
  );


  addLine(
    origin,
    [
      gridMin,
      0.0,
      gridMax
    ],
    zAxisColor
  );


  for (
    let value = gridMin;
    value <= gridMax + 0.001;
    value += 1.0
  ) {

    addLine(
      [
        value,
        0.0,
        gridMin - 0.07
      ],
      [
        value,
        0.0,
        gridMin + 0.07
      ],
      xAxisColor
    );


    addLine(
      [
        gridMin - 0.07,
        0.0,
        value
      ],
      [
        gridMin + 0.07,
        0.0,
        value
      ],
      zAxisColor
    );
  }


  for (
    let value = 0.0;
    value <= 1.5 + 0.001;
    value += 0.375
  ) {

    addLine(
      [
        gridMin - 0.07,
        value,
        gridMin
      ],
      [
        gridMin + 0.07,
        value,
        gridMin
      ],
      yAxisColor
    );
  }


  return {

    vertices:
      new Float32Array(vertices),

    colors:
      new Float32Array(colors),

    vertexCount:
      vertices.length / 3
  };
}