varying vec3 vNormal;
uniform float u_time;
uniform vec3 u_lightColor;
uniform vec3 u_lightPos;

varying vec3 fragPos;
varying float distToCamera;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
  vec3 color = vec3(0.0);
  vec3 outsideColor = vec3(0.0);

  vec3 norm = normalize(vNormal);
  vec3 lightDir = normalize(u_lightPos - fragPos);
  float diff = max(dot(norm, lightDir), 0.0);

  color = mix(u_lightColor, outsideColor, 1.0 - diff);

  float a = 1.0 - map(distToCamera, 0.0, 4.0, 0.0, 1.0);
  gl_FragColor = vec4(color, a);
}