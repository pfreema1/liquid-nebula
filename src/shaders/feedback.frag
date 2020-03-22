// https://discourse.threejs.org/t/basic-feedback-and-buffer-implementation-with-glsl-shaders/409/3

uniform vec2 res;//The width and height of our screen
uniform sampler2D bufferTexture;
uniform sampler2D videoTexture;
uniform float time;
uniform vec2 mouse;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
    vec2 st = gl_FragCoord.xy / res;
    vec2 uv = st;

    uv *= 0.998;

    // float mixVal = map(sin(time), -1.0, 1.0, 0.02, 0.2);
    float mixVal = map(abs(mouse.x), 0.0, 1.0, 0.02, 0.2);

    vec4 sum = texture2D(bufferTexture, uv);
    vec4 src = texture2D(videoTexture, uv);
    sum.rgb = mix(sum.rbg, src.rgb, mixVal);
    sum.a = 1.0;
    // gl_FragColor = src;
    gl_FragColor = sum;
    
}