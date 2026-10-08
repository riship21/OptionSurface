export class OrbitCamera {

  constructor(canvas) {

    this.canvas = canvas;

    this.target = glMatrix.vec3.fromValues(
      0.0,
      0.5,
      0.0
    );

    this.distance = 6.5;

    this.yaw = 0.0;

    this.pitch = 0.45;

    this.isDragging = false;

    this.lastMouseX = 0;

    this.lastMouseY = 0;

    this.rotationSpeed = 0.008;

    this.zoomSpeed = 0.001;

    this.minimumDistance = 2.5;

    this.maximumDistance = 15.0;

    this.setupControls();
  }


  setupControls() {

    this.canvas.addEventListener(
      'mousedown',
      (event) => {

        if (event.button !== 0) {
          return;
        }

        this.isDragging = true;

        this.lastMouseX =
          event.clientX;

        this.lastMouseY =
          event.clientY;
      }
    );


    window.addEventListener(
      'mouseup',
      () => {

        this.isDragging = false;
      }
    );


    window.addEventListener(
      'mousemove',
      (event) => {

        if (!this.isDragging) {
          return;
        }


        const deltaX =
          event.clientX -
          this.lastMouseX;

        const deltaY =
          event.clientY -
          this.lastMouseY;


        this.lastMouseX =
          event.clientX;

        this.lastMouseY =
          event.clientY;


        this.yaw -=
          deltaX *
          this.rotationSpeed;


        this.pitch -=
          deltaY *
          this.rotationSpeed;


        const pitchLimit =
          Math.PI / 2.0 -
          0.05;


        this.pitch =
          Math.max(
            -pitchLimit,
            Math.min(
              pitchLimit,
              this.pitch
            )
          );
      }
    );


    this.canvas.addEventListener(
      'wheel',
      (event) => {

        event.preventDefault();


        this.distance *=
          Math.exp(
            event.deltaY *
            this.zoomSpeed
          );


        this.distance =
          Math.max(
            this.minimumDistance,
            Math.min(
              this.maximumDistance,
              this.distance
            )
          );

      },
      {
        passive: false
      }
    );
  }


  getViewMatrix() {

    const viewMatrix =
      glMatrix.mat4.create();


    const horizontalDistance =
      this.distance *
      Math.cos(this.pitch);


    const cameraX =
      this.target[0] +
      horizontalDistance *
      Math.sin(this.yaw);


    const cameraY =
      this.target[1] +
      this.distance *
      Math.sin(this.pitch);


    const cameraZ =
      this.target[2] +
      horizontalDistance *
      Math.cos(this.yaw);


    const cameraPosition =
      glMatrix.vec3.fromValues(
        cameraX,
        cameraY,
        cameraZ
      );


    glMatrix.mat4.lookAt(
      viewMatrix,
      cameraPosition,
      this.target,
      [0.0, 1.0, 0.0]
    );


    return viewMatrix;
  }

}