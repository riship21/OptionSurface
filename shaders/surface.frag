#version 300 es

precision highp float;

in vec3 fragmentPosition;
in vec3 fragmentNormal;

uniform vec3 uLightPosition;

out vec4 fragColor;

void main() {

  vec3 normal =
    normalize(fragmentNormal);


  vec3 lightDirection =
    normalize(
      uLightPosition -
      fragmentPosition
    );


  vec3 viewDirection =
    normalize(
      -fragmentPosition
    );


  float diffuseAmount =
    max(
      dot(
        normal,
        lightDirection
      ),
      0.0
    );


  vec3 halfwayDirection =
    normalize(
      lightDirection +
      viewDirection
    );


  float specularAmount =
    0.0;


  if (diffuseAmount > 0.0) {

    specularAmount =
      pow(
        max(
          dot(
            normal,
            halfwayDirection
          ),
          0.0
        ),
        48.0
      );
  }


  vec3 baseColor =
    vec3(
      0.10,
      0.60,
      0.95
    );


  vec3 ambient =
    0.18 *
    baseColor;


  vec3 diffuse =
    0.82 *
    diffuseAmount *
    baseColor;


  vec3 specular =
    0.35 *
    specularAmount *
    vec3(1.0);


  vec3 finalColor =
    ambient +
    diffuse +
    specular;


  fragColor =
    vec4(
      finalColor,
      1.0
    );
}