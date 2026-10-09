#version 300 es

in vec3 aPosition;
in vec3 aColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 lineColor;

void main() {

  lineColor =
    aColor;

  gl_Position =
    uProjectionMatrix *
    uModelViewMatrix *
    vec4(
      aPosition,
      1.0
    );
}