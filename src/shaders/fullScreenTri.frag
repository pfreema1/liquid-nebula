precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec4 color = vec4(0.0);
    vec4 sceneColor = texture2D(uScene, uv);


    color = sceneColor;
    
    gl_FragColor = vec4(color);
}