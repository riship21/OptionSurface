#version 300 es

precision highp float;

in vec3 fragmentPosition;
in vec3 fragmentNormal;
in float fragmentIV;

uniform vec3 uLightPosition;

out vec4 fragColor;


vec3 volatilityColor(float value) {

  value =
    clamp(
      value,
      0.0,
      1.0
    );


  if (value < 0.25) {

    return mix(
      vec3(0.05, 0.20, 0.90),
      vec3(0.00, 0.80, 1.00),
      value / 0.25
    );
  }


  if (value < 0.50) {

    return mix(
      vec3(0.00, 0.80, 1.00),
      vec3(0.10, 0.85, 0.25),
      (value - 0.25) / 0.25
    );
  }


  if (value < 0.75) {

    return mix(
      vec3(0.10, 0.85, 0.25),
      vec3(1.00, 0.85, 0.05),
      (value - 0.50) / 0.25
    );
  }


  return mix(
    vec3(1.00, 0.85, 0.05),
    vec3(0.95, 0.05, 0.05),
    (value - 0.75) / 0.25
  );
}


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
    volatilityColor(
      fragmentIV
    );


  vec3 ambient =
    0.08 *
    baseColor;


  vec3 diffuse =
    0.92 *
    diffuseAmount *
    baseColor;


  vec3 specular =
    0.65 *
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