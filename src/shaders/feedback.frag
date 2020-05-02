// https://discourse.threejs.org/t/basic-feedback-and-buffer-implementation-with-glsl-shaders/409/3

//https://docs.lost.show/blog/feedbackloops/

#pragma glslify: cnoise3 = require(glsl-noise/classic/3d)

uniform vec2 res;//The width and height of our screen
uniform sampler2D bufferTexture;
uniform sampler2D videoTexture;
uniform float time;
uniform vec2 mouse;

uniform float mod1;
uniform float mod2;
uniform float mod3;


float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

vec3 hueShift(vec3 color, float hue)
{
vec3 k = vec3(0.57735, 0.57735, 0.57735);
float cosAngle = cos(hue);
return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

vec3 hue(vec3 c, float s) {
    const vec3 dir = vec3(0.55735);
    const float pi2 = 6.2832;
    vec3 p = dir * dot(dir, c);
    vec3 u = c - p;
    vec3 v = cross(dir, u);
    float spi2 = s * pi2;
    c = u*cos(spi2) + v*sin(spi2) + p;
    return c;
}

void main() {
    vec2 st = gl_FragCoord.xy / res;
    vec2 uv = st;

    
    // uv *= 0.9;
    
    // uv.x += -0.001;
    // float m = sin(time * 2.0) + 0.002;
    // uv.y += 0.001 * m;
    

    float feedbackStrength = 0.075;
    float scaleOffset = 1.01;
    float hueShiftVal = mod1;

    vec4 last = texture2D(videoTexture, (uv-0.5)/(scaleOffset) + 0.5);
    last.rgb = hue(vec3(last.r, last.g, last.b), hueShiftVal);
    // last.a *= mod2;
    vec4 sum = texture2D(bufferTexture, uv) + last * feedbackStrength;
    gl_FragColor = sum;
    
}