// https://discourse.threejs.org/t/basic-feedback-and-buffer-implementation-with-glsl-shaders/409/3

//https://docs.lost.show/blog/feedbackloops/

uniform vec2 res;
uniform sampler2D bufferTexture;
uniform sampler2D lastTexture;

uniform float time;
uniform float feedbackStrength;
uniform float scaleOffset;
uniform float hueShift;

vec3 hue(vec3 c, float s)
{
    const vec3 dir = vec3(0.55735);
    const float pi2 = 6.2832;
    vec3 p = dir * dot(dir, c);
    vec3 u = c - p;
    vec3 v = cross(dir,u);

    float spi2 = s * pi2;
    c = u*cos(spi2) + v*sin(spi2) + p;

    return c;
}

void main()
{
  vec2 st = gl_FragCoord.xy / res;
  vec2 uv = st;
  vec4 last = texture2D(lastTexture, (uv-0.5)/(scaleOffset) + 0.5);
  last.rgb = hue(last.rgb, hueShift);
  vec4 sum = texture2D(bufferTexture, uv) + last * feedbackStrength;

  gl_FragColor = sum;
}