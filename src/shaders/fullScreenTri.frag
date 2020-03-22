precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec4 sceneColor = texture2D(uScene, uv);
    // vec2 displacedUv = vec2(
    //     uv.x * 2.2 * (sceneColor.r),
    //     uv.y * 2.2 * (sceneColor.b)
    // );
    vec2 displacedUv = vec2(
        uv.x + (sceneColor.r) * sin(uTime) * 1.0,
        uv.y + (sceneColor.b) * sin(uTime) * 1.0
    );
    vec4 color = vec4(0.0);
    vec4 displacedColor = texture2D(uScene, displacedUv);

    color = displacedColor;
    // color = sceneColor;
    
    gl_FragColor = vec4(color);
}