import { useEffect, useRef } from "react";

// A slow, flowing field of color behind everything. Rendered small and scaled up,
// so it costs almost nothing; frozen when the tab is hidden or motion is reduced.

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `
precision mediump float;
uniform vec2 r;
uniform float t;
vec2 h(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1. + 2. * fract(sin(p) * 43758.5453); }
float n(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(dot(h(i), f), dot(h(i + vec2(1., 0.)), f - vec2(1., 0.)), u.x),
             mix(dot(h(i + vec2(0., 1.)), f - vec2(0., 1.)), dot(h(i + vec2(1.)), f - vec2(1.)), u.x), u.y);
}
float fbm(vec2 p){ float f = 0., a = .5; for (int i = 0; i < 5; i++) { f += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return f; }
vec3 stop(float i){
  i = mod(i, 5.);
  return i < 1. ? vec3(1., .36, .8) : i < 2. ? vec3(.52, .3, .98) : i < 3. ? vec3(.16, .36, .95) : i < 4. ? vec3(.1, .82, .92) : vec3(.99, .78, .32);
}
vec3 pal(float x){ float y = fract(x) * 5.; float i = floor(y); return mix(stop(i), stop(i + 1.), smoothstep(0., 1., fract(y))); }
void main(){
  vec2 uv = gl_FragCoord.xy / r.y * .72;
  float T = t * .022;
  vec2 q = vec2(fbm(uv * 1.3 + T), fbm(uv * 1.3 + vec2(5.2, 1.3) - T));
  vec2 w = vec2(fbm(uv * 1.5 + 3.2 * q + vec2(1.7, 9.2) + T * 1.4), fbm(uv * 1.5 + 3.2 * q + vec2(8.3, 2.8) - T));
  float f = fbm(uv * 1.1 + 2.6 * w);
  vec3 col = pal(f * 1.6 + length(w) * .8 + T * .6);
  col += .035 * sin(f * 30. + length(w) * 10. - T * 7.);
  float glow = .3 + .7 * smoothstep(-.4, .5, f + .35 * length(q));
  col = mix(vec3(.04, .015, .09), col, glow * .6);
  vec2 c = gl_FragCoord.xy / r - .5;
  col *= 1. - .7 * dot(c, c);
  gl_FragColor = vec4(col, 1.);
}`;

export function Background() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");

    const scale = 0.16;
    const size = () => {
      cv.width = Math.max(64, Math.round(innerWidth * scale));
      cv.height = Math.max(64, Math.round(innerHeight * scale));
      gl.viewport(0, 0, cv.width, cv.height);
    };
    size();
    addEventListener("resize", size);

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now() - Math.random() * 60_000;
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - last < 33) return;
      last = now;
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (reduce) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
    };
  }, []);
  return <canvas ref={ref} className="bg" aria-hidden="true" />;
}
