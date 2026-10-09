#version 300 es

in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

out vec3 fragmentPosition;
out vec3 fragmentNormal;

void main() {

  vec4 position =
    uModelViewMatrix *
    vec4(aPosition, 1.0);

  fragmentPosition =
    position.xyz;

  fragmentNormal =
    normalize(
      uNormalMatrix *
      aNormal
    );

  gl_Position =
    uProjectionMatrix *
    position;
}