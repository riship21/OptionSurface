#version 300 es

precision mediump float;

in vec3 lineColor;

out vec4 fragColor;

void main() {

  fragColor =
    vec4(
      lineColor,
      1.0
    );
}