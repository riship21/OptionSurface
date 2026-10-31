#version 300 es
precision highp float;
in vec3 fragmentPosition;
in vec3 fragmentNormal;
in float fragmentIV;
uniform vec3 uLightPosition; // view-space light; fragmentPosition is view-space
uniform int uLightingMode;   // 0: Blinn-Phong; 1: normal visualization
uniform float uLightIntensity;
out vec4 fragColor;
vec3 volatilityColor(float v) {
  v = clamp(v, 0.0, 1.0);
  if (v < .25) return mix(vec3(.05,.20,.90),vec3(.0,.80,1.0),v/.25);
  if (v < .50) return mix(vec3(.0,.80,1.0),vec3(.10,.85,.25),(v-.25)/.25);
  if (v < .75) return mix(vec3(.10,.85,.25),vec3(1.,.85,.05),(v-.50)/.25);
  return mix(vec3(1.,.85,.05),vec3(.95,.05,.05),(v-.75)/.25);
}
void main() {
  vec3 n = normalize(fragmentNormal);
  if (uLightingMode == 1) {
    fragColor = vec4(n * .5 + .5, 1.0);
    return;
  }
  vec3 lightDir = normalize(uLightPosition - fragmentPosition);
  vec3 viewDir = normalize(-fragmentPosition);
  float ndotl = max(dot(n, lightDir), 0.0);
  float spec = 0.0;
  if (ndotl > 0.0) {
    vec3 halfVector = normalize(lightDir + viewDir);
    spec = pow(max(dot(n, halfVector), 0.0), 48.0);
  }
  vec3 base = volatilityColor(fragmentIV);
  vec3 color = .12 * base + uLightIntensity * (.82 * ndotl * base + .45 * spec * vec3(1.0));
  fragColor = vec4(color, 1.0);
}
