#pragma glslify: inverse = require(glsl-inverse)
#pragma glslify: transpose = require(glsl-transpose)
#pragma glslify: cnoise3 = require(glsl-noise/classic/3d)

varying vec3 vNormal;
varying vec3 fragPos;
uniform float u_time;
uniform vec2 mouse;
uniform sampler2D faceTexture;
attribute float positionIndex;
varying vec2 vUv;
uniform vec3 index;
varying float distToCamera;


vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
  : vec3(0.0, -v.z, v.y));
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

// Any function can go here to distort p
vec3 distorted(vec3 p) {
  // float noise = cnoise3(vec3(p.x, p.y, u_time));
  // p *= noise * 5.0;
  float time = u_time;
  float angle = (time + p.y - p.x) / 0.5;
  float m = abs(0.5 * sin(angle)) + 0.0;
  m += cos(3.0 * time + (p.y * p.y)) * 0.05;
  p.x += normal.x * m;
  p.y += normal.y * m;
  p.z += normal.z * m;

  return p;
}

void main() {

  //https://observablehq.com/@k9/calculating-normals-for-distorted-vertices

  float tangentFactor = 0.5; // default 0.1
  vec3 distortedPosition = distorted(position);
  vec3 tangent1 = orthogonal(normal);
  vec3 tangent2 = normalize(cross(normal, tangent1));
  vec3 nearby1 = position + tangent1 * tangentFactor;
  vec3 nearby2 = position + tangent2 * tangentFactor;
  vec3 distorted1 = distorted(nearby1);
  vec3 distorted2 = distorted(nearby2);

  fragPos = vec3(modelMatrix * vec4(distortedPosition, 1.0));

  vNormal = normalize(cross(distorted1 - distortedPosition, distorted2 - distortedPosition));

  vUv = uv;

  vec4 cs_position = modelViewMatrix * vec4(position, 1.0);
  distToCamera = -cs_position.z;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(distortedPosition,1.0);
}