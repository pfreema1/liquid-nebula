precision highp float;

#pragma glslify: worley3D = require(glsl-worley/worley3D)

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
    vec4 color = texture2D(uScene, uv);
    vec4 mixedColor = vec4(0.0);


    

    uv *= 10.0;

    uv.y += sin(uTime + uv.y) * 0.3;
    vec2 f = worley3D(vec3(uv.x, uv.y, uTime), 1.0, false);
    float f1 = f.x * 0.05;
    
    vec4 worleyCol = vec4(1.0, 1.0, 1.0, 1.0 - f1);

    
    
    // color = mix(color, worleyCol, f1);
    
    gl_FragColor = vec4(color);
}