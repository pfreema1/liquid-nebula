// https://discourse.threejs.org/t/basic-feedback-and-buffer-implementation-with-glsl-shaders/409/3

uniform vec2 res;//The width and height of our screen
uniform sampler2D bufferTexture;
uniform sampler2D videoTexture;

void main() {
    vec2 st = gl_FragCoord.xy / res;
    vec2 uv = st;
    uv *= 0.998;

    vec4 sum = texture2D(bufferTexture, uv);
    vec4 src = texture2D(videoTexture, uv);
    sum.rgb = mix(sum.rbg, src.rgb, 0.5);

    gl_FragColor = src;
    // gl_FragColor = sum;
    
}