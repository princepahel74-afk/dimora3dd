/* DIMORA app bundle — engine, model, AI, 3D, 2D editor, tour, auth, marketing hero */
(function(){'use strict';
/* ===================== DIMORA 3D ENGINE (WebGL2, zero-dependency) ===================== */
const V3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
const M4 = {
  id() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s;
    }
    return o;
  },
  persp(fovy, asp, n, f) { const t = 1 / Math.tan(fovy / 2), o = new Float32Array(16); o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o; },
  ortho(l, r, b, t, n, f) { const o = M4.id(); o[0] = 2 / (r - l); o[5] = 2 / (t - b); o[10] = -2 / (f - n); o[12] = -(r + l) / (r - l); o[13] = -(t + b) / (t - b); o[14] = -(f + n) / (f - n); return o; },
  lookAt(e, c, u) {
    const z = V3.norm(V3.sub(e, c)); let x = V3.cross(u, z);
    if (V3.len(x) < 1e-6) x = V3.cross([0, 0, 1], z);
    x = V3.norm(x); const y = V3.cross(z, x);
    const o = new Float32Array(16);
    o[0] = x[0]; o[4] = x[1]; o[8] = x[2]; o[12] = -V3.dot(x, e);
    o[1] = y[0]; o[5] = y[1]; o[9] = y[2]; o[13] = -V3.dot(y, e);
    o[2] = z[0]; o[6] = z[1]; o[10] = z[2]; o[14] = -V3.dot(z, e);
    o[15] = 1; return o;
  },
  inv(m) {
    const a = m, o = new Float32Array(16);
    const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
    const b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; if (!det) return M4.id(); det = 1 / det;
    o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * det; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * det; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * det; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * det;
    o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * det; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * det; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * det; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * det;
    o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * det; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * det; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * det; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * det;
    o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * det; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * det; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * det; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * det;
    return o;
  },
  // T * Ry * Rx * Rz * S(1,sy,1)
  trs(tx, ty, tz, ry = 0, sy = 1, rx = 0, rz = 0) {
    let m = M4.id();
    m[12] = tx; m[13] = ty; m[14] = tz;
    if (ry) { const c = Math.cos(ry), s = Math.sin(ry), r = M4.id(); r[0] = c; r[2] = -s; r[8] = s; r[10] = c; m = M4.mul(m, r); }
    if (rx) { const c = Math.cos(rx), s = Math.sin(rx), r = M4.id(); r[5] = c; r[6] = s; r[9] = -s; r[10] = c; m = M4.mul(m, r); }
    if (rz) { const c = Math.cos(rz), s = Math.sin(rz), r = M4.id(); r[0] = c; r[1] = s; r[4] = -s; r[5] = c; m = M4.mul(m, r); }
    if (sy !== 1) { const r = M4.id(); r[5] = sy; m = M4.mul(m, r); }
    return m;
  },
};
function hexToRgb(h) {
  h = (h || '#888888').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0')).join(''); }

/* ---------- shaders: physically-based look, procedural materials with relief, sky, soft shadows ---------- */
// Shared sky model (linear colour): gradient + sun disc/glow + soft clouds + stars at night.
const SKY_GLSL = `
uniform vec3 uZenith, uHorizon, uGroundCol, uSunCol, uSunDir; uniform float uNight, uClouds;
float sh21(vec2 p){ p=fract(p*vec2(233.34,851.73)); p+=dot(p,p+23.45); return fract(p.x*p.y); }
float snoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(sh21(i),sh21(i+vec2(1,0)),f.x), mix(sh21(i+vec2(0,1)),sh21(i+vec2(1,1)),f.x), f.y); }
float sfbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*snoise(p); p=p*2.07+vec2(1.7,9.2); a*=0.5;} return s; }
vec3 skyCol(vec3 d, bool detail){
  float y = d.y;
  vec3 c = y >= 0.0 ? mix(uHorizon, uZenith, pow(clamp(y,0.0,1.0), 0.42)) : mix(uHorizon, uGroundCol, clamp(-y*2.5,0.0,1.0));
  float sd = max(dot(d,uSunDir),0.0);
  float above = smoothstep(-0.02, 0.02, y);
  c += uSunCol*(pow(sd,64.0)*0.18 + pow(sd,6.0)*0.05)*above;
  if(detail){
    c += uSunCol*smoothstep(0.9993,0.9997,sd)*6.0*above;
    if(y>0.0 && uClouds>0.0){
      vec2 cp = d.xz/(y+0.12)*0.9;
      float n = sfbm(cp*1.3 + vec2(3.0,1.0));
      float cl = smoothstep(0.52, 0.78, n)*smoothstep(0.0, 0.25, y)*uClouds;
      vec3 cc = mix(uHorizon*1.05, vec3(1.0)*(0.25+0.75*(1.0-uNight)), 0.75) + uSunCol*0.06*pow(sd,4.0);
      c = mix(c, cc, cl*0.85);
    }
    if(uNight>0.0 && y>0.0){ vec2 sp = floor(d.xz/(y+0.3)*420.0); float st = step(0.9965, sh21(sp)); c += vec3(st)*uNight*0.9*smoothstep(0.05,0.3,y); }
  }
  return c;
}
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
`;
const LEAF_GLSL = `
// one cluster of ~20 leaves on a round card (uv 0..1): 1 where there is a leaf, 0 between leaves (cut away)
float lh(vec2 p){ p=fract(p*vec2(127.1,311.7)); p+=dot(p,p+19.19); return fract(p.x*p.y); }
float leafMask(vec2 uv, out float tone){
  float m = 0.0; tone = 0.5; vec2 g = uv*4.5;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 c = floor(g)+vec2(float(i),float(j));
    vec2 p = c + 0.5 + (vec2(lh(c), lh(c+17.3))-0.5)*0.8;
    float a = lh(c+5.1)*6.2832; vec2 d = g - p; d = vec2(cos(a)*d.x - sin(a)*d.y, sin(a)*d.x + cos(a)*d.y);
    float e = d.x*d.x/0.2 + d.y*d.y/0.033;
    if(e < 1.0){ m = 1.0; tone = lh(c+9.7); }
  }
  float r = length(uv-0.5)*2.0;
  return r > 0.98 - 0.25*lh(floor(g)) ? 0.0 : m;
}
`;
const VS_MAIN = `#version 300 es
in vec3 aPos; in vec3 aNor; in vec2 aUV;
uniform mat4 uModel, uVP, uLVP;
out vec3 vW; out vec3 vN; out vec4 vL; out vec2 vUV;
void main(){ vec4 w = uModel*vec4(aPos,1.0); vW=w.xyz; vN=mat3(uModel)*aNor; vL=uLVP*w; vUV=aUV; gl_Position=uVP*w; }`;
const FS_MAIN = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vW; in vec3 vN; in vec4 vL; in vec2 vUV;
uniform vec3 uColor, uColor2, uEmissive, uCam;
uniform float uAlpha, uPatScale, uAmb, uFog, uHL, uRough, uMetal, uExposure, uShadowTexel, uBump, uWarm;
uniform int uPattern, uShadowOn, uNL;
uniform sampler2DShadow uShadow;
uniform vec3 uLP[16]; uniform vec3 uLC[16]; uniform float uLR[16];
// image-based PBR (GLB models + DIMORA's own textures): bit 1 base colour, 2 metal/rough, 4 normal, 8 occlusion, 16 world-space uv, 32 alpha cut, 64 alpha blend
uniform sampler2D uTB, uTM, uTN, uTO; uniform int uTex; uniform vec3 uUVX; uniform float uNS, uSheen, uGlassIn; uniform vec3 uSheenC;
// showcase room lighting: the room's windows are rectangular area lights (exact Lambert form factor), the rest of the sky is
// blocked by walls and ceiling; a little bounced light fills the room; analytic occlusion darkens corners and junctions
uniform int uRoomOn, uNW; uniform vec3 uRMin, uRMax, uBounceC; uniform vec3 uWC[4], uWU[4], uWV[4], uWL[4]; uniform float uAmbIn, uOutK, uTransl;
vec3 eF(vec3 a, vec3 b){ float c = clamp(dot(a,b), -0.9999, 0.9999); vec3 x = cross(a,b); float l = length(x); return l > 1e-6 ? x/l*acos(c) : vec3(0.0); }
float rectFF(vec3 p, vec3 n, vec3 c, vec3 u, vec3 v){
  vec3 q0 = normalize(c-u-v-p), q1 = normalize(c+u-v-p), q2 = normalize(c+u+v-p), q3 = normalize(c-u+v-p);
  return max(0.0, -dot(eF(q0,q1)+eF(q1,q2)+eF(q2,q3)+eF(q3,q0), n))/6.2831853;
}
${SKY_GLSL}
${LEAF_GLSL}
out vec4 outColor;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5;} return s; }
vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
const vec2 PD[12] = vec2[12](vec2(-0.326,-0.406),vec2(-0.840,-0.074),vec2(-0.696,0.457),vec2(-0.203,0.621),vec2(0.962,-0.195),vec2(0.473,-0.480),
  vec2(0.519,0.767),vec2(0.185,-0.893),vec2(0.507,0.064),vec2(0.896,0.412),vec2(-0.322,-0.933),vec2(-0.792,-0.598));
float shadowF(vec3 N){
  if(uShadowOn==0) return 1.0;
  vec3 p = vL.xyz/vL.w*0.5+0.5;
  if(p.z>1.0||p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0) return 1.0;
  float bias = max(0.0018*(1.0-dot(N,uSunDir)), 0.0005);
  float a = h21(gl_FragCoord.xy)*6.2832; mat2 R = mat2(cos(a),sin(a),-sin(a),cos(a));
  float s=0.0; for(int i=0;i<12;i++) s += texture(uShadow, vec3(p.xy + R*PD[i]*uShadowTexel*2.6, p.z-bias));
  return s/12.0;
}
// bump mapping from a procedural height field (Mikkelsen, surface gradient via screen derivatives)
vec3 bumpN(vec3 N, float h, float k){
  vec3 dpx=dFdx(vW), dpy=dFdy(vW); float dhx=dFdx(h), dhy=dFdy(h);
  vec3 r1=cross(dpy,N), r2=cross(N,dpx); float det=dot(dpx,r1);
  if(abs(det)<1e-12) return N;
  vec3 g=sign(det)*(dhx*r1+dhy*r2);
  return normalize(abs(det)*N - k*g);
}
float gD(float NdH, float a){ float a2=a*a; float d=NdH*NdH*(a2-1.0)+1.0; return a2/(3.14159*d*d); }
float gV(float NdV, float NdL, float a){ float k=(a+1.0)*(a+1.0)/8.0; return 1.0/((NdV*(1.0-k)+k)*(NdL*(1.0-k)+k)); }
void main(){
  if(uPattern==25){ vec2 q = abs(vUV-0.5)*2.0; float r = length(max(q-0.5, 0.0))/0.5; outColor = vec4(0.0, 0.0, 0.0, (1.0-smoothstep(0.0, 1.0, r))*uAlpha); return; }
  if(uPattern==26){ vec2 q = abs(vUV-0.5)*2.0, m = vec2(uPatScale, uColor2.x); float r = length(max(q-(1.0-m), 0.0)/m); outColor = vec4(0.0, 0.0, 0.0, pow(1.0-smoothstep(0.0, 1.0, r), 1.6)*uAlpha); return; }
  vec3 N = normalize(vN); if(!gl_FrontFacing && uPattern!=24) N=-N;
  vec3 base = uColor; vec3 c2 = uColor2;
  vec3 an = abs(N);
  bool flat_ = an.y > max(an.x, an.z);
  vec2 uv = flat_ ? vW.xz : (an.x > an.z ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y));
  uv /= max(uPatScale,0.001);
  float h = 0.0, rough = 0.82, bk = 1.0;
  float af = clamp(1.0 - length(fwidth(uv))*2.5, 0.0, 1.0);   // 1 = close-up, 0 = detail smaller than a pixel
  float wa = clamp(1.0 - length(fwidth(vW.xz))*12.0, 0.0, 1.0);
  bool glass = false; bool leafy = false;
  float metal = uMetal, ao = 1.0, texA = 1.0; bool texR = false;
  if(uTex > 0){
    bool wmap = (uTex & 16) != 0; float cr = cos(uUVX.z), sr = sin(uUVX.z);
    vec2 tuv = wmap ? mat2(cr, sr, -sr, cr)*(uv*uUVX.xy) : vUV;
    if((uTex & 1) != 0){ vec4 t = texture(uTB, tuv);
      if((uTex & 128) != 0) t.rgb = mix(t.rgb, texture(uTB, tuv*0.27 + vec2(0.37, 0.11)).rgb, 0.38); // two scales: no visible repeat across a lawn
      base = t.rgb*uColor; texA = t.a; if((uTex & 32) != 0 && texA < 0.5) discard;
      if(wmap) base *= 0.95 + 0.1*fbm(vW.xz*0.09 + vec2(vW.y*0.05)); }
    if((uTex & 256) != 0 && wmap && !flat_){
      float rain = fbm(vec2(uv.x*8.0, uv.y*0.45));
      float mottling = fbm(uv*1.3);
      float splash = (1.0-smoothstep(0.02, 0.60, max(vW.y,0.0))) * smoothstep(0.26,0.77,rain);
      base *= 0.94 + 0.10*mottling - 0.13*splash - 0.055*rain;
    }
    if((uTex & 2) != 0){ vec3 m = texture(uTM, tuv).rgb; rough = clamp(m.g*(uRough >= 0.0 ? uRough : 1.0), 0.03, 1.0); metal = m.b*uMetal; texR = true; }
    if((uTex & 8) != 0){ ao = mix(1.0, texture(uTO, vUV).r, 0.85); }
    if((uTex & 4) != 0){ // tangent frame from screen-space derivatives (no tangents needed)
      vec2 nuv = wmap ? tuv : mat2(cr, sr, -sr, cr)*(tuv*uUVX.xy);
      vec3 tn = texture(uTN, nuv).xyz*2.0 - 1.0; tn.xy *= uNS;
      vec3 dp1 = dFdx(vW), dp2 = dFdy(vW); vec2 du1 = dFdx(nuv), du2 = dFdy(nuv);
      vec3 a1 = cross(dp2, N), a2 = cross(N, dp1); vec3 T = a1*du1.x + a2*du2.x, B = a1*du1.y + a2*du2.y;
      float iv = inversesqrt(max(max(dot(T,T), dot(B,B)), 1e-24));
      N = normalize(T*iv*tn.x + B*iv*tn.y + N*max(tn.z, 0.2));
    }
  }
  if(uPattern==24){ // leaf cards (trees, shrubs): alpha-cut clusters with per-leaf tone
    if((uTex & 1) == 0){
      float tone; if(leafMask(vUV, tone) < 0.5) discard;
      base = mix(base, c2, tone*0.75) * (0.8 + 0.35*lh(floor(vUV*9.0)));
    }
    leafy = true; rough = 0.73; bk = 0.0;
  } else if(uPattern==1){ // wood planks
    float row=floor(uv.y); float along=uv.x+h21(vec2(row,7.0))*6.0; float seg=floor(along/6.0);
    float t=h21(vec2(row,seg)); base*=0.91+0.15*t; base=mix(base, c2, 0.12*h21(vec2(seg,row*3.1)));
    float grain=fbm(vec2(along*0.6, uv.y*14.0)+t*10.0); base*=0.9+0.17*grain;
    float fy=fract(uv.y), fx=fract(along/6.0);
    float gap = (fy<0.03||fy>0.988||fx<0.004) ? 1.0 : 0.0; base*=1.0-0.28*gap;
    h = -gap*0.0015*uPatScale + grain*0.00025; rough = 0.42 + 0.2*grain;
  } else if(uPattern==2){ // tiles with grout
    vec2 g=fract(uv); float e=min(min(g.x,1.0-g.x),min(g.y,1.0-g.y));
    base*=0.94+0.08*h21(floor(uv)); base*=0.96+0.06*fbm(uv*3.0);
    float gr = (1.0-smoothstep(0.012,0.024,e))*af; base=mix(base, mix(base,c2,0.06), 1.0-af); base=mix(base, c2, gr);
    h = -gr*0.0025*uPatScale; rough = mix(0.22, 0.85, gr);
  } else if(uPattern==3){ // marble
    float n=fbm(uv*1.6); float v=abs(sin(uv.x*2.2+uv.y*1.3+n*7.0));
    base=mix(c2, base, smoothstep(0.0,0.12,v)); base*=0.97+0.05*fbm(uv*9.0);
    vec2 g=fract(uv*0.5); float e=min(min(g.x,1.0-g.x),min(g.y,1.0-g.y)); float j = e<0.004 ? 1.0 : 0.0; base*=1.0-0.1*j;
    h = -j*0.001; rough = 0.14;
  } else if(uPattern==4){ // carpet / fabric
    float f1=h21(floor(vW.xz*160.0)+floor(vW.y*160.0)); base*=0.9+0.2*f1; float f2=fbm((flat_?vW.xz:vec2(vW.x+vW.z,vW.y))*6.0); base*=0.93+0.1*f2;
    h = f2*0.0012; rough = 0.95;
  } else if(uPattern==5){ // herringbone
    vec2 cell=floor(uv); vec2 f=fract(uv); float k=mod(cell.x+cell.y,2.0);
    float l = k<0.5? f.x: f.y; float stripe=floor(l*3.0);
    base*=0.84+0.28*h21(cell*3.1+stripe); float gp = fract(l*3.0)<0.06 ? 1.0 : 0.0; base*=1.0-0.35*gp;
    float ed = min(min(f.x,1.0-f.x),min(f.y,1.0-f.y))<0.02 ? 1.0 : 0.0; base*=1.0-0.3*ed;
    h = -(gp+ed)*0.0008; rough = 0.45;
  } else if(uPattern==6){ // kota / granite / stone slabs
    vec2 g=fract(uv); float e=min(min(g.x,1.0-g.x),min(g.y,1.0-g.y));
    float n = fbm(uv*2.5+h21(floor(uv))*7.0); base=mix(base, c2, n*0.7);
    base *= 0.94 + 0.1*h21(floor(vW.xz*220.0));
    float j = 1.0-smoothstep(0.006,0.012,e); base*=1.0-0.3*j; h = -j*0.0015 + n*0.0002; rough = 0.3;
  } else if(uPattern==7){ // stripes / wallpaper / curtain folds
    float s=step(0.5, fract(uv.x)); base=mix(base, c2, s*0.55); h = sin(uv.x*6.2832)*0.002; rough = 0.9;
  } else if(uPattern==8){ // polished concrete
    float n = fbm(uv*1.5); base*=0.86+0.22*n; base*=0.95+0.08*h21(floor(vW.xz*90.0)); h = n*0.0003; rough = 0.35;
  } else if(uPattern==9){ // brick
    vec2 b = uv*vec2(1.0/0.23, 1.0/0.075); float row=floor(b.y); b.x += mod(row,2.0)*0.5;
    vec2 f = fract(b); vec2 id = floor(b);
    float m = 1.0 - smoothstep(0.04,0.08, min(min(f.x,1.0-f.x)*0.23, min(f.y,1.0-f.y)*0.075)/0.012);
    vec3 bc = base*(0.78+0.35*h21(id)) * (0.9+0.2*fbm(uv*40.0));
    base = mix(bc, c2, m); h = -m*0.006 + fbm(uv*30.0)*0.0006; rough = 0.92;
  } else if(uPattern==10){ // exterior plaster / textured render
    float n1 = fbm(uv*3.0), n2 = vnoise(uv*90.0), n3 = fbm(uv*0.35);
    base *= 0.93 + 0.07*n1 + 0.04*n2; base *= 0.95 + 0.08*n3;
    // grime: slightly darker near the base of the wall
    h = n2*0.0007 + n1*0.0006; rough = 0.93; bk = 1.3;
  } else if(uPattern==11){ // lawn grass
    vec2 p = vW.xz; float n1 = fbm(p*0.35), n2 = mix(0.5, fbm(p*2.2), wa), bl = mix(0.5, h21(floor(p*55.0)), wa*wa);
    base = mix(base, c2, smoothstep(0.35,0.7,n1)*0.45); base *= 0.84 + 0.2*n2 + 0.14*bl;
    base = mix(base, base*vec3(1.06,1.03,0.86), smoothstep(0.62,0.8,n1)*0.18);
    h = bl*0.004 + n2*0.002; rough = 0.95; bk = 1.0;
  } else if(uPattern==12){ // paving stones (running bond)
    vec2 b = uv*vec2(1.0/0.6, 1.0/0.3); b.x += mod(floor(b.y),2.0)*0.5; vec2 f=fract(b); vec2 id=floor(b);
    float e = min(min(f.x,1.0-f.x)*0.6, min(f.y,1.0-f.y)*0.3);
    float j = (1.0-smoothstep(0.006,0.014,e))*af;
    base *= 0.84+0.24*mix(0.5,h21(id),af); base *= 0.92+0.12*fbm(uv*6.0); base = mix(base, c2, j);
    h = -j*0.006 + fbm(uv*12.0)*0.0008; rough = 0.82;
  } else if(uPattern==13){ // stacked ledgestone: thin courses, stones of random length, mixed warm and grey tones, deep dark joints
    float rh = 0.072; float course = floor(uv.y/rh); float ry = fract(uv.y/rh);
    float len = 0.16 + 0.44*h21(vec2(course,1.7)); float sx = (uv.x + h21(vec2(course,9.1))*3.0)/len; vec2 id = vec2(floor(sx), course); float fx = fract(sx);
    float e = min(min(fx,1.0-fx)*len, min(ry,1.0-ry)*rh);
    float j = (1.0 - smoothstep(0.002,0.008,e))*af;
    float tone = h21(id); vec3 warm = base*vec3(1.03,0.88,0.72);
    base = tone < 0.38 ? mix(base, c2, tone*1.6) : (tone < 0.72 ? mix(base, warm, 0.85) : mix(c2, warm*0.75, 0.5));
    base *= 0.74 + 0.36*fbm(uv*vec2(9.0,20.0)+id*3.1); base *= 1.0-0.8*j;
    h = (h21(id+7.0)*0.009 + fbm(uv*30.0+id)*0.002)*af - j*0.009; rough = 0.9; bk = 1.0;
  } else if(uPattern==14){ // terrace / roof tiles
    vec2 g=fract(uv); float e=min(min(g.x,1.0-g.x),min(g.y,1.0-g.y)); float j = 1.0-smoothstep(0.015,0.03,e);
    base *= 0.88+0.16*h21(floor(uv)); base *= 0.9+0.15*fbm(uv*4.0); base = mix(base, c2, j); h = -j*0.003; rough = 0.85;
  } else if(uPattern==15){ glass = true; rough = 0.04;
  } else if(uPattern==16){ // foliage (leaf clumps)
    vec3 q = vW*4.0; float n = fbm(q.xz+q.y*1.7); float n2 = fbm(vec2(vW.x+vW.y*0.7, vW.z-vW.y*0.6)*7.0);
    base = mix(base, c2, smoothstep(0.3,0.8,n)); base *= 0.72+0.4*n2; h = n2*0.02; rough = 0.8; bk = 0.6;
  } else if(uPattern==18){ // cobblestone setts (driveways)
    vec2 b = uv/0.13; b.x += mod(floor(b.y),2.0)*0.5; vec2 f = fract(b), id = floor(b);
    vec2 q = abs(f-0.5); float edge = smoothstep(0.37,0.47,max(q.x,q.y))*af;
    base *= 0.78+0.34*h21(id); base *= 0.9+0.16*fbm(uv*22.0+id); base = mix(base, c2, edge);
    float dome = 1.0 - dot(f-0.5,f-0.5)*2.2; h = (dome*0.006 - edge*0.006)*af; rough = 0.78;
  } else if(uPattern==19){ // vertical timber battens
    float sx = uv.x/0.065; float id = floor(sx), f = fract(sx); float gap = smoothstep(0.76,0.84,f)*af;
    base *= 0.82+0.3*h21(vec2(id,3.0)); base *= 0.84+0.26*fbm(vec2(uv.x*28.0, uv.y*1.6)+id);
    base = mix(base, base*0.22, gap); h = -gap*0.01 + (1.0-gap)*0.002; rough = 0.55;
  } else if(uPattern==20){ // Indian block-print fabric: small five-petal flowers on a staggered grid
    vec2 q = uv/0.07; q.x += 0.5*mod(floor(q.y),2.0); vec2 f = fract(q)-0.5; float r = length(f); float a = atan(f.y,f.x);
    float pr = 0.2 + 0.07*cos(a*5.0); float m = (1.0-smoothstep(pr-0.025, pr+0.02, r))*af; float ctr = (1.0-smoothstep(0.045,0.07,r))*af;
    vec2 g = fract(q+0.5)-0.5; float dt = (1.0-smoothstep(0.03,0.05,length(g)))*af;
    base *= 0.93+0.1*fbm(vW.xz*40.0+vW.y*40.0); base = mix(base, c2, max(m*0.85, dt*0.6)); base = mix(base, mix(c2, vec3(0.97,0.92,0.8), 0.55), ctr);
    h = m*0.0004; rough = 0.92;
  } else if(uPattern==21){ // carved wood: rosettes in a diamond lattice, as on Indian doors, jhoolas and bed heads
    vec2 q = uv/0.12; vec2 f = fract(q)-0.5; float r = length(f); float a = atan(f.y,f.x);
    float pr = 0.27 + 0.09*cos(a*8.0); float ros = (1.0-smoothstep(pr-0.03, pr+0.03, r)) * (0.55+0.45*smoothstep(0.06,0.1,r));
    float lat = 1.0-smoothstep(0.0, 0.035, abs(abs(f.x)+abs(f.y)-0.5));
    float carve = clamp(max(ros, lat), 0.0, 1.0)*af;
    base *= 0.84+0.22*fbm(vec2(uv.x*3.0, uv.y*18.0)); base = mix(base*0.62, base*1.05, carve);
    h = carve*0.004; rough = 0.5; bk = 2.0;
  } else if(uPattern==22){ // Athangudi-style patterned cement tiles: flower medallion, corner rings, fine grout
    vec2 g = fract(uv/0.25); vec2 f = g-0.5; float e = min(min(g.x,1.0-g.x),min(g.y,1.0-g.y)); float r = length(f); float a = atan(f.y,f.x);
    float pet = 1.0-smoothstep(-0.008, 0.008, r - (0.15+0.1*abs(cos(a*2.0))));
    float ctr = 1.0-smoothstep(0.045,0.06,r); float d = length(abs(f)-0.5);
    float ring = (1.0-smoothstep(0.17,0.185,d))*smoothstep(0.105,0.12,d);
    vec3 c3 = mix(c2, vec3(0.08,0.22,0.26), 0.75);
    base = mix(base, c2, pet*af); base = mix(base, c3, max(ctr, ring)*af);
    float gr = (1.0-smoothstep(0.003,0.008,e))*af; base = mix(base, base*0.62, gr); base *= 0.95+0.06*fbm(uv*4.0);
    h = -gr*0.001; rough = 0.32;
  } else if(uPattern==23){ // hand-painted Indian floral stencil on an accent wall
    vec2 q = uv/0.42; q.x += 0.5*mod(floor(q.y),2.0); vec2 f = fract(q)-0.5; float r = length(f); float a = atan(f.y,f.x);
    float l1 = 1.0-smoothstep(0.006,0.015, abs(r-(0.27+0.07*cos(a*8.0))));
    float l2 = 1.0-smoothstep(0.006,0.015, abs(r-(0.13+0.04*cos(a*6.0+1.0))));
    float dc = 1.0-smoothstep(0.028,0.04,r); float m = max(max(l1,l2),dc)*af;
    base = mix(base, c2, m*0.8); base *= 0.97+0.04*fbm(uv*6.0); rough = 0.8;
  } else if(uPattern==27){ // longitudinal fissures in bark and a rough relief across each ridge
    vec2 wood = uv*vec2(11.0, 1.5);
    float bands = fbm(wood + vec2(vnoise(uv*3.0)*1.9, 0.0));
    float fissures = smoothstep(0.42,0.73,bands);
    base = mix(base, c2, fissures*0.82) * (0.83 + 0.32*vnoise(wood*vec2(0.75, 3.1)));
    h = (1.0 - fissures) * 0.012; rough = 0.96;
  } else if(uPattern==17){ // water
    float n = fbm(vW.xz*3.0); h = n*0.004; rough = 0.05;
  }
  if(uRough >= 0.0 && !texR) rough = uRough;
  if(uBump > 0.0 && h != 0.0) N = bumpN(N, h*af, uBump*bk);
  vec3 albedo = lin(base);
  vec3 V = normalize(uCam - vW); float NdV = max(dot(N,V), 1e-3);
  vec3 F0 = mix(vec3(0.04), albedo, metal);
  float a = max(rough*rough, 0.002);
  // ambient: hemisphere sky/ground light, scaled
  float hemi = N.y*0.5+0.5;
  vec3 bounce = mix(uGroundCol, uHorizon*0.8, 0.6);  // light bounced up from ground/floors (kept neutral so ceilings stay white)
  vec3 ambL = mix(bounce, mix(uHorizon, uZenith, 0.5)*1.05, hemi)*uAmb;
  // indoors light arrives bounced off warm floors, walls and curtains: neutral-warm, not sky-blue
  ambL = mix(ambL, dot(ambL, vec3(0.2126,0.7152,0.0722))*vec3(1.07,0.99,0.88)*1.06, uWarm);
  vec3 Fa = F0 + (max(vec3(1.0-rough), F0) - F0)*pow(1.0-NdV, 5.0);
  vec3 col = albedo*(1.0-metal)*ambL*(1.0-Fa*0.5)*ao;
  bool inRoom = false; vec3 Ewin = vec3(0.0); float envK = 1.0;
  if(uRoomOn > 0){
    inRoom = all(greaterThan(vW, uRMin - 0.03)) && all(lessThan(vW, uRMax + 0.03));
    if(inRoom){
      vec3 dl = max(vW - uRMin, 0.0), dh = max(uRMax - vW, 0.0); float o = 1.0;
      o *= 1.0 - 0.34*exp(-dl.x/0.22)*(1.0-abs(N.x)); o *= 1.0 - 0.34*exp(-dh.x/0.22)*(1.0-abs(N.x));
      o *= 1.0 - 0.34*exp(-dl.z/0.22)*(1.0-abs(N.z)); o *= 1.0 - 0.34*exp(-dh.z/0.22)*(1.0-abs(N.z));
      o *= 1.0 - 0.32*exp(-dl.y/0.10)*(1.0-abs(N.y)); o *= 1.0 - 0.25*exp(-dh.y/0.30)*(1.0-abs(N.y));
      o *= ao;
      col *= uAmbIn; envK = uAmbIn*0.6;
      vec3 Eb = vec3(0.0), Rr = reflect(-V, N);
      for(int i=0;i<4;i++){ if(i>=uNW) break;
        Ewin += uWL[i]*rectFF(vW + N*0.003, N, uWC[i], uWU[i], uWV[i]);
        if(uTransl > 0.0) Eb += uWL[i]*rectFF(vW - N*0.003, -N, uWC[i], uWU[i], uWV[i]);
        vec3 wn = normalize(cross(uWU[i], uWV[i])); float dn = dot(Rr, wn); // glossy reflection of the bright opening
        if(dn < -0.02){ float t = dot(uWC[i] - vW, wn)/dn; vec3 hp = vW + Rr*t - uWC[i];
          float e = max(abs(dot(hp, uWU[i]))/dot(uWU[i],uWU[i]), abs(dot(hp, uWV[i]))/dot(uWV[i],uWV[i]));
          float soft = 1.0 - smoothstep(1.0 - 0.02 - rough*1.5, 1.0 + rough*4.0, e);
          col += uWL[i]*Fa*soft*pow(1.0 - rough, 2.0)*0.85*step(0.0, t); }
      }
      col += albedo*(1.0-metal)*((Ewin + uBounceC)*o) + albedo*Eb*uTransl*o;
    }
  }
  // sun
  float NdL = max(dot(N,uSunDir),0.0);
  if(NdL > 0.0){
    float sh = shadowF(N);
    vec3 H = normalize(uSunDir+V); float NdH = max(dot(N,H),0.0), VdH = max(dot(V,H),0.0);
    vec3 F = F0 + (1.0-F0)*pow(1.0-VdH, 5.0);
    vec3 spec = gD(NdH,a)*gV(NdV,NdL,a)*F*0.25*3.14159;
    col += (albedo*(1.0-metal)*(1.0-F) + spec)*uSunCol*NdL*sh;
  }
  if(uSheen > 0.0){ // velvet / wool: soft grazing-angle sheen (cheap Charlie-style lobe)
    float sg = pow(1.0 - NdV, 3.0)*uSheen; col += lin(uSheenC)*sg*((inRoom ? (Ewin + uBounceC)*0.6 : ambL*0.7) + uSunCol*NdL*0.3)*ao;
  }
  if(leafy){ float back = max(dot(-N, uSunDir), 0.0); col += albedo*vec3(1.1,1.2,0.75)*uSunCol*back*0.22*shadowF(N); }
  // reflections of the sky (rougher = blurrier, i.e. closer to the average sky colour)
  vec3 R = reflect(-V, N);
  vec3 env = mix(skyCol(R, false), ambL/max(uAmb,0.01), clamp(rough*1.1,0.0,1.0));
  col += env*Fa*(1.0-rough*0.85)*(glass ? 1.0 : 0.55)*envK;
  for(int i=0;i<16;i++){ if(i>=uNL) break;
    vec3 L=uLP[i]-vW; float d=length(L); float att=clamp(1.0-d/uLR[i],0.0,1.0); att*=att;
    vec3 Ln = L/max(d,0.001); float nl = max(dot(N,Ln),0.0);
    vec3 Hl = normalize(Ln+V); float sp = gD(max(dot(N,Hl),0.0), max(a,0.05))*0.25*nl;
    col += (albedo*(1.0-metal)*(0.3+0.7*nl)*ao + F0*sp)*uLC[i]*att;
  }
  float alpha = uAlpha; if((uTex & 64) != 0) alpha *= texA;
  if(glass){
    // tinted glass: what you see is mostly reflection at grazing angles, transmission straight on
    float Fg = 0.04 + 0.96*pow(1.0-NdV, 5.0);
    vec3 refl = skyCol(R, true);
    col = albedo*ambL*0.25 + refl*(0.12+0.88*Fg) + (NdL>0.0 ? uSunCol*gD(max(dot(N,normalize(uSunDir+V)),0.0),0.02)*0.02 : vec3(0.0));
    alpha = clamp(uAlpha + 0.55*Fg + 0.12, 0.0, 0.92);
    if(uGlassIn > 0.0){ col = mix(col, albedo*ambL*0.3 + refl*Fg*0.5, uGlassIn); alpha = mix(alpha, clamp(0.05 + 0.6*Fg, 0.0, 0.7), uGlassIn); }
  }
  col += lin(uEmissive)*1.6;
  col += vec3(uHL)*vec3(1.0,0.75,0.35)*0.35;
  float dist=length(vW-uCam); float fog=1.0-exp(-pow(dist*uFog,2.0));
  col = mix(col, skyCol(-V, false), clamp(fog,0.0,1.0));
  if(uRoomOn > 0 && !inRoom) col *= uOutK; // the bright view outside is held back so room and view both keep detail
  col = aces(col*uExposure);
  outColor = vec4(pow(col, vec3(1.0/2.2)), alpha);
}`;
const VS_DEPTH = `#version 300 es
in vec3 aPos; in vec3 aNor; in vec2 aUV; uniform mat4 uModel, uLVP; out vec2 vUV; void main(){ vUV = aUV; gl_Position = uLVP*uModel*vec4(aPos,1.0); }`;
const FS_DEPTH = `#version 300 es
precision highp float; in vec2 vUV; uniform int uPattern, uLeafImage; uniform sampler2D uLeafTex; out vec4 o;
${LEAF_GLSL}
void main(){
  if(uPattern==24){
    if(uLeafImage==1){ if(texture(uLeafTex,vUV).a < 0.5) discard; }
    else { float t; if(leafMask(vUV, t) < 0.5) discard; }
  }
  o=vec4(1.0);
}`;
const VS_FULL = `#version 300 es
out vec2 vUV; void main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); vUV = p; gl_Position = vec4(p*2.0-1.0, 0.0, 1.0); }`;
const FS_SKY = `#version 300 es
precision highp float; in vec2 vUV; uniform mat4 uInvVP; uniform float uExposure;
${SKY_GLSL}
out vec4 o;
void main(){ vec2 p = vUV*2.0-1.0; vec4 a = uInvVP*vec4(p,-1.0,1.0), b = uInvVP*vec4(p,1.0,1.0);
  vec3 d = normalize(b.xyz/b.w - a.xyz/a.w); vec3 c = aces(skyCol(d, true)*uExposure); o = vec4(pow(c, vec3(1.0/2.2)), 1.0); }`;
// Screen-space ambient occlusion from the depth buffer (half resolution)
const FS_SSAO = `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uDepth; uniform mat4 uProj, uInvProj; uniform vec2 uTexel; uniform float uRadius;
uniform vec3 uKernel[14]; out vec4 o;
vec3 vpos(vec2 uv){ float z = texture(uDepth, uv).r*2.0-1.0; vec4 p = uInvProj*vec4(uv*2.0-1.0, z, 1.0); return p.xyz/p.w; }
float hh(vec2 p){ p=fract(p*vec2(443.897,441.423)); p+=dot(p,p.yx+19.19); return fract((p.x+p.y)*p.x); }
void main(){
  float d0 = texture(uDepth, vUV).r; if(d0 >= 0.99999){ o = vec4(1.0); return; }
  vec3 P = vpos(vUV); if(d0 > 0.9996 || P.z > -0.01 || -P.z > 70.0){ o = vec4(1.0); return; }  // far away depth precision is too low
  vec3 pr = vpos(vUV+vec2(uTexel.x,0.0)), pl = vpos(vUV-vec2(uTexel.x,0.0)), pu = vpos(vUV+vec2(0.0,uTexel.y)), pd = vpos(vUV-vec2(0.0,uTexel.y));
  vec3 dx = abs(pr.z-P.z) < abs(P.z-pl.z) ? pr-P : P-pl; vec3 dy = abs(pu.z-P.z) < abs(P.z-pd.z) ? pu-P : P-pd;
  vec3 N = normalize(cross(dx, dy)); if(dot(N, -P) < 0.0) N = -N;
  float an = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))))*6.2832; // interleaved gradient noise: averages out cleanly in the blur vec3 rv = vec3(cos(an), sin(an), 0.0);
  vec3 T = normalize(rv - N*dot(rv,N)); vec3 B = cross(N,T);
  float rad = uRadius; float occ = 0.0;
  for(int i=0;i<14;i++){
    vec3 S = P + (T*uKernel[i].x + B*uKernel[i].y + N*uKernel[i].z)*rad;
    vec4 q = uProj*vec4(S,1.0); vec2 suv = q.xy/q.w*0.5+0.5;
    if(suv.x<0.0||suv.x>1.0||suv.y<0.0||suv.y>1.0) continue;
    float sz = vpos(suv).z;
    float range = smoothstep(0.0, 1.0, rad*0.6/abs(P.z-sz));
    occ += (sz >= S.z + 0.025*rad ? 1.0 : 0.0)*range;
  }
  float ao = 1.0 - occ/14.0*(1.0 - smoothstep(35.0, 70.0, -P.z));
  o = vec4(pow(clamp(ao,0.0,1.0), 1.25), 0.0, 0.0, 1.0);
}`;
const FS_COMPOSITE = `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uColor, uAO, uDepth; uniform vec2 uAOTexel; uniform int uUseAO; uniform float uAOStrength, uVignette;
uniform mat4 uInvProj; out vec4 o;
float vz(vec2 uv){ float z = texture(uDepth, uv).r*2.0-1.0; vec4 p = uInvProj*vec4(uv*2.0-1.0, z, 1.0); return p.z/p.w; }
void main(){
  vec3 c = texture(uColor, vUV).rgb;
  if(uUseAO==1){
    if(texture(uDepth, vUV).r < 0.9996){
      float z0 = vz(vUV); float tol = 0.04*abs(z0) + 0.03; float s = 0.0, w = 0.0;
      for(int x=-2;x<=1;x++) for(int y=-2;y<=1;y++){ vec2 uv = vUV + (vec2(x,y)+0.5)*uAOTexel; float wz = exp(-abs(vz(uv)-z0)/tol); s += texture(uAO, uv).r*wz; w += wz; }
      float ao = w > 1e-3 ? s/w : texture(uAO, vUV).r;
      c *= mix(1.0, ao, uAOStrength);
    }
  }
  vec2 q = vUV-0.5; c *= 1.0 - uVignette*dot(q,q)*1.6;
  o = vec4(c, 1.0);
}`;

const QUALITY = {
  ultra: { msaa: 4, ssao: true, shadow: 4096, bump: 1, dpr: 2 },
  high: { msaa: 4, ssao: true, shadow: 4096, bump: 1, dpr: 1.5 },
  balanced: { msaa: 0, ssao: false, shadow: 2048, bump: 1, dpr: 1.25 },
  low: { msaa: 0, ssao: false, shadow: 1024, bump: 0, dpr: 1 },
};
const lin3 = hex => hexToRgb(hex).map(v => Math.pow(v, 2.2));

class Engine {
  constructor(canvas, opts = {}) {
    this.canvas = canvas; this.fixed = !!opts.fixed;
    const gl = canvas.getContext('webgl2', { antialias: true, preserveDrawingBuffer: true, alpha: false });
    if (!gl) throw new Error('WebGL2 is not available in this browser');
    this.gl = gl;
    this.geoCache = new Map();
    this.groups = new Map();
    this.lights = [];
    this.env = { sunDir: V3.norm([0.4, 0.8, 0.3]), sunCol: [2.2, 2.05, 1.85], zenith: '#5f8fc6', horizon: '#d6e3ec', groundCol: '#6f7a5a', amb: 0.9, fog: 0.006, shadows: true, night: 0, clouds: 0.7, exposure: 0.9 };
    this.bounds = { c: [0, 0, 0], r: 15 };
    this.cam = { pos: [10, 12, 14], target: [0, 0, 0], fov: 50 * Math.PI / 180, near: 0.05, far: 400 };
    this.progMain = this._prog(VS_MAIN, FS_MAIN);
    this.progDepth = this._prog(VS_DEPTH, FS_DEPTH);
    this.progSky = this._prog(VS_FULL, FS_SKY);
    const skyU = ['uZenith', 'uHorizon', 'uGroundCol', 'uSunCol', 'uSunDir', 'uNight', 'uClouds', 'uExposure'];
    this.uMain = this._uniforms(this.progMain, ['uModel', 'uVP', 'uLVP', 'uColor', 'uColor2', 'uEmissive', 'uCam', 'uAlpha', 'uPatScale', 'uAmb', 'uFog', 'uHL', 'uRough', 'uMetal', 'uShadowTexel', 'uBump', 'uWarm', 'uPattern', 'uShadowOn', 'uNL', 'uShadow', 'uLP[0]', 'uLC[0]', 'uLR[0]', 'uTB', 'uTM', 'uTN', 'uTO', 'uTex', 'uUVX', 'uNS', 'uSheen', 'uSheenC', 'uGlassIn', 'uRoomOn', 'uNW', 'uRMin', 'uRMax', 'uBounceC', 'uWC[0]', 'uWU[0]', 'uWV[0]', 'uWL[0]', 'uAmbIn', 'uOutK', 'uTransl', ...skyU]);
    this.uDepth = this._uniforms(this.progDepth, ['uModel', 'uLVP', 'uPattern', 'uLeafImage', 'uLeafTex']);
    this.uSky = this._uniforms(this.progSky, ['uInvVP', ...skyU]);
    try {
      this.progSSAO = this._prog(VS_FULL, FS_SSAO); this.uSSAO = this._uniforms(this.progSSAO, ['uDepth', 'uProj', 'uInvProj', 'uTexel', 'uRadius', 'uKernel[0]']);
      this.progComp = this._prog(VS_FULL, FS_COMPOSITE); this.uComp = this._uniforms(this.progComp, ['uColor', 'uAO', 'uDepth', 'uAOTexel', 'uUseAO', 'uAOStrength', 'uVignette', 'uInvProj']);
      this.postOK = true;
    } catch (e) { this.postOK = false; }
    this.kernel = new Float32Array(42);
    for (let i = 0; i < 14; i++) { // hemisphere samples, denser near the centre
      const u = (i + 0.5) / 14, a = i * 2.39996, r = Math.sqrt(1 - u * u * 0.85);
      let v = [Math.cos(a) * r, Math.sin(a) * r, 0.15 + u * 0.85]; v = V3.norm(v); const s = 0.25 + 0.75 * ((i + 1) / 14) ** 2;
      this.kernel.set(V3.scale(v, s), i * 3);
    }
    this.emptyVAO = gl.createVertexArray();
    this.texCache = new Map(); this.models = new Map();
    this.anisoExt = gl.getExtension('EXT_texture_filter_anisotropic');
    const px = c => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(c)); return t; };
    this.whiteTex = px([255, 255, 255, 255]); this.flatNTex = px([128, 128, 255, 255]);
    this.setQuality(opts.quality || Engine.defaultQuality());
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    this.dirty = true;
  }
  static defaultQuality() {
    try { const q = localStorage.getItem('dimora_gfx'); if (q && QUALITY[q]) return q; } catch (e) { }
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    return coarse ? 'balanced' : 'high';
  }
  setQuality(q) {
    const gl = this.gl; this.quality = QUALITY[q] ? q : 'high'; this.Q = QUALITY[this.quality];
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const size = Math.min(this.Q.shadow, maxTex);
    if (size !== this.shadowSize) { this.shadowSize = size; this._initShadow(); }
    this.samples = this.Q.msaa ? Math.min(this.Q.msaa, gl.getParameter(gl.MAX_SAMPLES) || 0) : 0;
    this.usePost = this.postOK && (this.Q.ssao || this.samples > 0);
    this._freePost(); this.dirty = true;
  }
  _prog(vs, fs) {
    const gl = this.gl;
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.bindAttribLocation(p, 1, 'aNor'); gl.bindAttribLocation(p, 2, 'aUV');
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  _uniforms(p, names) { const o = {}; names.forEach(n => o[n.replace('[0]', '')] = this.gl.getUniformLocation(p, n)); return o; }
  _initShadow() {
    const gl = this.gl, s = this.shadowSize;
    if (this.shadowTex) { gl.deleteTexture(this.shadowTex); gl.deleteFramebuffer(this.shadowFB); }
    this.shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, s, s, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.shadowFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowTex, 0);
    gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  /* ---- offscreen targets for anti-aliasing + ambient occlusion ---- */
  _freePost() {
    const gl = this.gl, P = this.post; if (!P) return;
    [P.msFB, P.resFB, P.aoFB].forEach(f => f && gl.deleteFramebuffer(f));
    [P.msColor, P.msDepth].forEach(r => r && gl.deleteRenderbuffer(r));
    [P.color, P.depth, P.ao].forEach(t => t && gl.deleteTexture(t));
    this.post = null;
  }
  _tex(w, h, ifmt, fmt, type, filter) {
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  _ensurePost(w, h) {
    if (!this.usePost) return false;
    if (this.post && this.post.w === w && this.post.h === h) return true;
    this._freePost();
    const gl = this.gl, P = { w, h };
    try {
      P.color = this._tex(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
      P.depth = this._tex(w, h, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, gl.NEAREST);
      P.resFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, P.resFB);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, P.color, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, P.depth, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('resolve FB');
      if (this.samples > 0) {
        P.msColor = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, P.msColor); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.RGBA8, w, h);
        P.msDepth = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, P.msDepth); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.samples, gl.DEPTH_COMPONENT24, w, h);
        P.msFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, P.msFB);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, P.msColor);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, P.msDepth);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('msaa FB');
      }
      if (this.Q.ssao) {
        P.aw = Math.max(1, w >> 1); P.ah = Math.max(1, h >> 1);
        P.ao = this._tex(P.aw, P.ah, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
        P.aoFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, P.aoFB);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, P.ao, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('ao FB');
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); this.post = P; return true;
    } catch (e) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); this.post = P; this._freePost(); this.usePost = false; return false;
    }
  }
  _upload(pos, nor, uv) {
    const gl = this.gl, vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const n = pos.length / 3, data = new Float32Array(n * 8);
    for (let i = 0; i < n; i++) {
      data[i * 8] = pos[i * 3]; data[i * 8 + 1] = pos[i * 3 + 1]; data[i * 8 + 2] = pos[i * 3 + 2];
      data[i * 8 + 3] = nor[i * 3]; data[i * 8 + 4] = nor[i * 3 + 1]; data[i * 8 + 5] = nor[i * 3 + 2];
      if (uv) { data[i * 8 + 6] = uv[i * 2]; data[i * 8 + 7] = uv[i * 2 + 1]; }
    }
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
    gl.bindVertexArray(null);
    return { vao, count: n, cpu: { pos, nor } }; // CPU copy kept for the GLB export
  }
  /* a geometry built by the caller (e.g. a tree's leaf cards), cached under its key */
  custom(key, build) {
    if (this.geoCache.has(key)) return this.geoCache.get(key);
    const { pos, nor, uv } = build(); const g = this._upload(pos, nor, uv); g.key = key; this.geoCache.set(key, g); return g;
  }
  geo(kind, a = 1, b = 1, c = 1, seg = 18) {
    const key = kind + ':' + [a, b, c, seg].map(v => (+v).toFixed(3)).join(':');
    if (this.geoCache.has(key)) return this.geoCache.get(key);
    let g;
    if (kind === 'box') g = this._box(a, b, c);
    else if (kind === 'rbox') g = this._rbox(a, b, c, seg);
    else if (kind === 'cyl') g = this._cyl(a, b, seg, c);
    else if (kind === 'sph') g = this._sph(a, seg);
    g.key = key; this.geoCache.set(key, g); return g;
  }
  // box: width a (x), height b (y, from 0), depth c (z), centered on x/z
  _box(w, h, d) {
    const x = w / 2, z = d / 2, P = [], N = [];
    const f = (v, n) => { [0, 1, 2, 0, 2, 3].forEach(i => { P.push(...v[i]); N.push(...n); }); };
    f([[-x, 0, z], [x, 0, z], [x, h, z], [-x, h, z]], [0, 0, 1]);
    f([[x, 0, -z], [-x, 0, -z], [-x, h, -z], [x, h, -z]], [0, 0, -1]);
    f([[x, 0, z], [x, 0, -z], [x, h, -z], [x, h, z]], [1, 0, 0]);
    f([[-x, 0, -z], [-x, 0, z], [-x, h, z], [-x, h, -z]], [-1, 0, 0]);
    f([[-x, h, z], [x, h, z], [x, h, -z], [-x, h, -z]], [0, 1, 0]);
    f([[-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z]], [0, -1, 0]);
    return this._upload(P, N);
  }
  // rounded box: like box, but every edge and corner is rounded with radius r (smooth normals) — furniture,
  // cushions and mattresses read as real objects instead of hard-edged blocks
  _rbox(w, h, d, r) {
    const H = [w / 2, h / 2, d / 2]; r = Math.max(0.001, Math.min(r, H[0] * 0.98, H[1] * 0.98, H[2] * 0.98));
    const K = 3, samp = hh => { const a = []; for (let k = 0; k <= K; k++) a.push(-hh + r * (1 - Math.cos(k / K * Math.PI / 2))); const b = a.slice().reverse().map(v => -v); return a.concat(b); };
    const faces = [[[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]];
    const ax = v => v[0] ? 0 : v[1] ? 1 : 2, P = [], N = [];
    faces.forEach(([n, u, v]) => {
      const an = ax(n), au = ax(u), av = ax(v), su = samp(H[au]), sv = samp(H[av]);
      const vert = (i, j) => { const p = [0, 0, 0]; p[an] = n[an] * H[an]; p[au] = su[i] * Math.sign(u[au]); p[av] = sv[j] * Math.sign(v[av]);
        const inner = p.map((c, k) => clamp(c, -H[k] + r, H[k] - r)); let d = p.map((c, k) => c - inner[k]); const L = Math.hypot(...d);
        d = L > 1e-9 ? d.map(c => c / L) : n.slice(); return [[inner[0] + d[0] * r, inner[1] + d[1] * r + H[1], inner[2] + d[2] * r], d]; };
      for (let i = 0; i < su.length - 1; i++) for (let j = 0; j < sv.length - 1; j++) {
        const q = [vert(i, j), vert(i + 1, j), vert(i + 1, j + 1), vert(i, j + 1)];
        [0, 1, 2, 0, 2, 3].forEach(k => { P.push(...q[k][0]); N.push(...q[k][1]); });
      }
    });
    return this._upload(P, N);
  }
  // cylinder: radius r, height h from 0; r2 = top radius ratio (c)
  _cyl(r, h, seg, topRatio = 1) {
    const P = [], N = [], rt = r * (topRatio || 1);
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const slope = (r - rt) / h;
      const n0 = V3.norm([c0, slope, s0]), n1 = V3.norm([c1, slope, s1]);
      // CCW seen from outside
      const A = [c0 * r, 0, s0 * r], B = [c1 * r, 0, s1 * r], C = [c1 * rt, h, s1 * rt], D = [c0 * rt, h, s0 * rt];
      [[A, n0], [C, n1], [B, n1], [A, n0], [D, n0], [C, n1]].forEach(([p, n]) => { P.push(...p); N.push(...n); });
      P.push(0, h, 0, ...D, ...C); N.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      P.push(0, 0, 0, ...B, ...A); N.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
    }
    return this._upload(P, N);
  }
  _sph(r, seg) {
    const P = [], N = [], st = Math.max(6, seg >> 1);
    const pt = (i, j) => { const th = i / st * Math.PI, ph = j / seg * Math.PI * 2; const n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]; return [n.map(v => v * r), n]; };
    for (let i = 0; i < st; i++) for (let j = 0; j < seg; j++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      [a, d, c, a, c, b].forEach(([p, n]) => { P.push(...p); N.push(...n); });
    }
    return this._upload(P, N);
  }
  // ---------- image textures + GLB models ----------
  // upload a decoded image as a mip-mapped, repeating texture (anisotropic where available)
  _imgTex(img) {
    const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    if (this.anisoExt) gl.texParameterf(gl.TEXTURE_2D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    return t;
  }
  static async decode(blob) {
    if (typeof createImageBitmap === 'function') { try { return await createImageBitmap(blob, { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }); } catch (e) { } }
    return await new Promise((res, rej) => { const im = new Image(), u = URL.createObjectURL(blob); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = rej; im.src = u; });
  }
  // texture from a URL: returns a handle at once ({t: null} until loaded); redraws when it arrives
  texture(url) {
    if (this.texCache.has(url)) return this.texCache.get(url);
    const h = { t: null, url, err: null }; this.texCache.set(url, h);
    fetch(url).then(r => { if (!r.ok) throw new Error(r.status + ' ' + url); return r.blob(); }).then(Engine.decode)
      .then(img => { h.t = this._imgTex(img); this.dirty = true; if (this.onAsset) this.onAsset(url); })
      .catch(e => { h.err = e; console.warn('[DIMORA] texture failed', url, e); });
    return h;
  }
  // load a .glb (binary glTF 2.0): meshes with node transforms baked in, materials with their textures.
  // Supported: TRS/matrix nodes, indexed or plain triangles, POSITION/NORMAL/TEXCOORD_0, metallic-roughness PBR,
  // normal/occlusion/emissive maps, KHR_texture_transform on the normal map, KHR_materials_sheen, alpha modes.
  loadGLB(url) {
    if (this.models.has(url)) return this.models.get(url);
    const p = (async () => {
      const r = await fetch(url); if (!r.ok) throw new Error(r.status + ' ' + url);
      const ab = await r.arrayBuffer(), dv = new DataView(ab);
      if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('not a GLB: ' + url);
      const jl = dv.getUint32(12, true), J = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 20, jl)));
      const bin = 20 + jl + 8;
      const view = i => { const bv = J.bufferViews[i]; return { off: bin + (bv.byteOffset || 0), len: bv.byteLength, stride: bv.byteStride || 0 }; };
      const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
      const acc = i => { const a = J.accessors[i], v = view(a.bufferView), n = NC[a.type], out = new Float32Array(a.count * n);
        const T = { 5126: [4, 'getFloat32'], 5123: [2, 'getUint16'], 5125: [4, 'getUint32'], 5121: [1, 'getUint8'] }[a.componentType];
        const st = v.stride || T[0] * n, o0 = v.off + (a.byteOffset || 0);
        for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = dv[T[1]](o0 + k * st + c * T[0], true);
        if (a.normalized && a.componentType !== 5126) { const d = a.componentType === 5121 ? 255 : 65535; for (let k = 0; k < out.length; k++) out[k] /= d; }
        return out; };
      const imgs = await Promise.all((J.images || []).map(async im => { const v = view(im.bufferView); if (!v.len) return null;
        try { return this._imgTex(await Engine.decode(new Blob([new Uint8Array(ab, v.off, v.len)], { type: im.mimeType }))); } catch (e) { console.warn('[DIMORA] texture in model failed', url, e); return null; } }));
      const texOf = ti => ti && J.textures[ti.index] ? imgs[J.textures[ti.index].source] : null;
      const mats = (J.materials || []).map(m => { const pb = m.pbrMetallicRoughness || {}, sh = m.extensions?.KHR_materials_sheen, tt = m.normalTexture?.extensions?.KHR_texture_transform;
        return { name: m.name || '', base: pb.baseColorFactor || [1, 1, 1, 1], metal: pb.metallicFactor ?? 1, rough: pb.roughnessFactor ?? 1, tB: texOf(pb.baseColorTexture), tM: texOf(pb.metallicRoughnessTexture),
          tN: texOf(m.normalTexture), nScale: m.normalTexture?.scale ?? 1, uvx: [tt?.scale?.[0] ?? 1, tt?.scale?.[1] ?? 1, tt?.rotation ?? 0], tO: (m.occlusionTexture?.texCoord ?? 0) === 0 ? texOf(m.occlusionTexture) : null, tE: texOf(m.emissiveTexture),
          emissive: m.emissiveFactor || [0, 0, 0], alphaMode: m.alphaMode || 'OPAQUE', doubleSided: !!m.doubleSided, sheen: sh ? sh.sheenColorFactor || [1, 1, 1] : null, transmission: !!m.extensions?.KHR_materials_transmission }; });
      const comp = n => { if (n.matrix) return Float32Array.from(n.matrix); const [x, y, z, w] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], t = n.translation || [0, 0, 0];
        return Float32Array.from([(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0, 2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
          2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, t[0], t[1], t[2], 1]); };
      const meshes = [], lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      const walk = (ni, parent) => { const n = J.nodes[ni], m = M4.mul(parent, comp(n));
        if (n.mesh != null) J.meshes[n.mesh].primitives.forEach(pr => { if ((pr.mode ?? 4) !== 4) return;
          const P = acc(pr.attributes.POSITION), Nn = pr.attributes.NORMAL != null ? acc(pr.attributes.NORMAL) : null, UV = pr.attributes.TEXCOORD_0 != null ? acc(pr.attributes.TEXCOORD_0) : null;
          const I = pr.indices != null ? acc(pr.indices) : null, cnt = I ? I.length : P.length / 3, pos = new Float32Array(cnt * 3), nor = new Float32Array(cnt * 3), uv = new Float32Array(cnt * 2);
          for (let k = 0; k < cnt; k++) { const v = I ? I[k] : k, x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
            for (let c = 0; c < 3; c++) { pos[k * 3 + c] = m[c] * x + m[4 + c] * y + m[8 + c] * z + m[12 + c]; lo[c] = Math.min(lo[c], pos[k * 3 + c]); hi[c] = Math.max(hi[c], pos[k * 3 + c]); }
            if (Nn) { const a = Nn[v * 3], b = Nn[v * 3 + 1], cc = Nn[v * 3 + 2]; const q = [0, 1, 2].map(c => m[c] * a + m[4 + c] * b + m[8 + c] * cc), L = Math.hypot(...q) || 1; for (let c = 0; c < 3; c++) nor[k * 3 + c] = q[c] / L; } else nor[k * 3 + 1] = 1;
            if (UV) { uv[k * 2] = UV[v * 2]; uv[k * 2 + 1] = UV[v * 2 + 1]; } }
          meshes.push({ pos, nor, uv, mat: mats[pr.material] || { base: [0.8, 0.8, 0.8, 1], metal: 0, rough: 0.6, alphaMode: 'OPAQUE' }, name: J.meshes[n.mesh].name || '' }); });
        (n.children || []).forEach(c => walk(c, m)); };
      (J.scenes?.[J.scene || 0]?.nodes || J.nodes.map((_, i) => i)).forEach(ni => walk(ni, M4.id()));
      const model = { url, meshes, min: lo, max: hi, size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]] };
      this.dirty = true; return model;
    })();
    p.model = null; p.then(m => { p.model = m; if (this.onAsset) this.onAsset(url); }).catch(e => { p.err = e; console.warn('[DIMORA] model failed', url, e); });
    this.models.set(url, p); return p;
  }
  // add a loaded model to a group, scaled to fit W×H×D (centred on x/z, standing on y = 0). Geometry is cached per size.
  // opt: {rot (y rotation baked in), uniform (keep proportions), mat(m) → per-material overrides, skip(mesh) → true to leave out}
  modelParts(g, model, W, H, D, opt = {}) {
    const rot = opt.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot);
    const rs = [Math.abs(cr) * model.size[0] + Math.abs(sr) * model.size[2], model.size[1], Math.abs(sr) * model.size[0] + Math.abs(cr) * model.size[2]];
    let k = [W / rs[0], H / rs[1], D / rs[2]]; if (opt.uniform) { const u = Math.min(...k); k = [u, u, u]; }
    const cx = (model.min[0] + model.max[0]) / 2, cz = (model.min[2] + model.max[2]) / 2, y0 = model.min[1];
    const out = [];
    model.meshes.forEach((me, mi) => {
      if (opt.skip && opt.skip(me)) return;
      const key = `glb:${model.url}:${mi}:${k.map(v => v.toFixed(4)).join(':')}:${rot.toFixed(3)}`;
      const geo = this.custom(key, () => { const n = me.pos.length / 3, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const x = me.pos[i * 3] - cx, y = me.pos[i * 3 + 1] - y0, z = me.pos[i * 3 + 2] - cz;
          pos[i * 3] = (cr * x + sr * z) * k[0]; pos[i * 3 + 1] = y * k[1]; pos[i * 3 + 2] = (-sr * x + cr * z) * k[2];
          const a = me.nor[i * 3], b = me.nor[i * 3 + 1], c = me.nor[i * 3 + 2]; const q = [(cr * a + sr * c) / k[0], b / k[1], (-sr * a + cr * c) / k[2]], L = Math.hypot(...q) || 1;
          nor[i * 3] = q[0] / L; nor[i * 3 + 1] = q[1] / L; nor[i * 3 + 2] = q[2] / L; }
        return { pos, nor, uv: me.uv }; });
      const m = me.mat, o = Object.assign({}, opt.mat ? opt.mat(m, me) : null);
      const toHex = c => '#' + c.slice(0, 3).map(v => Math.round(255 * Math.pow(clamp(v, 0, 1), 1 / 2.2)).toString(16).padStart(2, '0')).join('');
      const blend = m.alphaMode === 'BLEND' || m.transmission;
      out.push(this.part(g, Object.assign({ geo, color: toHex(m.base), metal: m.metal, rough: m.tM ? m.rough : m.rough, alpha: blend ? 0.999 : 1, noCull: m.doubleSided,
        emissive: m.tE ? '#000000' : toHex(m.emissive), tex: { B: m.tB, M: m.tM, N: m.tN, O: m.tO, E: m.tE, ns: m.nScale ?? 1, uvx: m.uvx || [1, 1, 0], blend: m.alphaMode === 'BLEND', cut: m.alphaMode === 'MASK' },
        sheen: m.sheen ? 0.9 : 0, sheenC: m.sheen ? toHex(m.sheen) : '#000000', cast: !blend }, o)));
    });
    return out;
  }
  // ---------- scene graph ----------
  clear() { this.groups.clear(); this.lights = []; this.dirty = true; }
  addGroup(id, opts = {}) {
    const g = Object.assign({ id, x: 0, y: 0, z: 0, rot: 0, sy: 1, visible: true, items: [], kind: 'misc', hl: 0, mat: null, pick: null }, opts);
    this.groups.set(id, g); g.dirtyM = true; this.dirty = true; return g;
  }
  removeGroup(id) { this.groups.delete(id); this.dirty = true; }
  // add drawable to group. p: {geo,x,y,z,ry,rx,rz,color,color2,pattern,patScale,emissive,alpha,rough,metal,shadowOnly,cast,hideWhen}
  part(g, p) {
    const d = Object.assign({ x: 0, y: 0, z: 0, ry: 0, rx: 0, rz: 0, sy: 1, color: '#cccccc', color2: '#999999', pattern: 0, patScale: 1, emissive: '#000000', alpha: 1, rough: -1, metal: 0, cast: true, shadowOnly: false }, p);
    if (this.matHook) this.matHook(d);
    d.local = M4.trs(d.x, d.y, d.z, d.ry, d.sy, d.rx, d.rz);
    d.rgb = hexToRgb(d.color); d.rgb2 = hexToRgb(d.color2); d.erg = hexToRgb(d.emissive); if (d.sheenC) d.shrgb = hexToRgb(d.sheenC);
    g.items.push(d); g.dirtyM = true; this.dirty = true; return d;
  }
  _groupMat(g) {
    if (g.dirtyM || !g.mat) {
      g.mat = M4.trs(g.x, g.y, g.z, g.rot, g.sy);
      g.items.forEach(d => d.world = M4.mul(g.mat, d.local));
      g.dirtyM = false;
    }
  }
  setLights(list) { this.lights = list.slice(0, 16); this.dirty = true; }
  proj() { const c = this.cam, asp = this.canvas.width / Math.max(1, this.canvas.height); return M4.persp(c.fov, asp, c.near, c.far); }
  viewProj() { return M4.mul(this.proj(), M4.lookAt(this.cam.pos, this.cam.target, [0, 1, 0])); }
  resize() {
    if (this.fixed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.Q.dpr);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr)), h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; this.dirty = true; }
  }
  _skyUniforms(U) {
    const gl = this.gl, env = this.env;
    gl.uniform3fv(U.uZenith, lin3(env.zenith)); gl.uniform3fv(U.uHorizon, lin3(env.horizon)); gl.uniform3fv(U.uGroundCol, lin3(env.groundCol));
    gl.uniform3fv(U.uSunCol, env.sunCol); gl.uniform3fv(U.uSunDir, env.sunDir); gl.uniform1f(U.uNight, env.night || 0);
    gl.uniform1f(U.uClouds, env.clouds ?? 0.7); gl.uniform1f(U.uExposure, (env.exposure || 0.9) * (U === this.uSky && env.room ? env.room.outK : 1));
  }
  render() {
    const gl = this.gl, env = this.env;
    this.resize();
    const W = this.canvas.width, H = this.canvas.height;
    this.groups.forEach(g => this._groupMat(g));
    const camY = this.cam.pos[1];
    const cp = this.cam.pos, far = d => d.maxDist && ((d.world[12] - cp[0]) ** 2 + (d.world[14] - cp[2]) ** 2 > d.maxDist * d.maxDist);
    const visible = (g, d) => g.visible && !(d.hideAbove != null && camY > d.hideAbove) && !(d.showBelow != null && camY > d.showBelow) && !far(d);
    // shadow pass
    const bc = this.bounds.c, R = this.bounds.r;
    const sd = env.sunDir;
    const up = Math.abs(sd[1]) > 0.98 ? [0, 0, 1] : [0, 1, 0];
    const lvp = M4.mul(M4.ortho(-R, R, -R, R, 0.1, R * 4), M4.lookAt(V3.add(bc, V3.scale(sd, R * 2)), bc, up));
    const shadowsOn = env.shadows && sd[1] > 0.02;
    if (shadowsOn) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFB);
      gl.viewport(0, 0, this.shadowSize, this.shadowSize);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.progDepth);
      gl.uniformMatrix4fv(this.uDepth.uLVP, false, lvp);
      gl.uniform1i(this.uDepth.uLeafTex, 3);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.whiteTex);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 2.0);
      this.groups.forEach(g => { if (!g.visible) return; g.items.forEach(d => {
        if (!d.cast || d.alpha < 0.6 || d.pattern === 15 || far(d)) return;
        if (d.hideAbove != null && !d.shadowOnly) return;
        gl.uniformMatrix4fv(this.uDepth.uModel, false, d.world);
        gl.uniform1i(this.uDepth.uPattern, d.pattern === 24 ? 24 : 0);
        if (d.pattern === 24) {
          const leafImage = d.tex?.B?.t;
          gl.uniform1i(this.uDepth.uLeafImage, leafImage ? 1 : 0);
          gl.bindTexture(gl.TEXTURE_2D, leafImage || this.whiteTex);
        }
        gl.bindVertexArray(d.geo.vao); gl.drawArrays(gl.TRIANGLES, 0, d.geo.count);
      }); });
      gl.activeTexture(gl.TEXTURE0);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.enable(gl.CULL_FACE);
    }
    const post = this._ensurePost(W, H) ? this.post : null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, post ? (post.msFB || post.resFB) : null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const proj = this.proj(), view = M4.lookAt(this.cam.pos, this.cam.target, [0, 1, 0]), vp = M4.mul(proj, view);
    // sky
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    gl.useProgram(this.progSky); this._skyUniforms(this.uSky);
    gl.uniformMatrix4fv(this.uSky.uInvVP, false, M4.inv(vp));
    gl.bindVertexArray(this.emptyVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    // scene
    gl.useProgram(this.progMain);
    const U = this.uMain;
    this._skyUniforms(U);
    gl.uniformMatrix4fv(U.uVP, false, vp);
    gl.uniformMatrix4fv(U.uLVP, false, lvp);
    gl.uniform3fv(U.uSunCol, shadowsOn || sd[1] > 0 ? env.sunCol : [0, 0, 0]);
    gl.uniform1f(U.uFog, env.fog);
    gl.uniform3fv(U.uCam, this.cam.pos); gl.uniform1f(U.uAmb, env.amb);
    gl.uniform1i(U.uShadowOn, shadowsOn ? 1 : 0); gl.uniform1f(U.uShadowTexel, 1 / this.shadowSize);
    gl.uniform1f(U.uBump, this.Q.bump); gl.uniform1f(U.uWarm, env.warm || 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.shadowTex); gl.uniform1i(U.uShadow, 0);
    gl.uniform1i(U.uTB, 3); gl.uniform1i(U.uTM, 4); gl.uniform1i(U.uTN, 5); gl.uniform1i(U.uTO, 6); gl.uniform1f(U.uGlassIn, env.glassIn || 0);
    const rm = env.room; gl.uniform1i(U.uRoomOn, rm ? 1 : 0); gl.uniform1i(U.uNW, rm ? rm.wins.length : 0);
    if (rm) { const fl = k => { const a = new Float32Array(12); rm.wins.forEach((w, i) => a.set(w[k], i * 3)); return a; };
      gl.uniform3fv(U.uRMin, rm.min); gl.uniform3fv(U.uRMax, rm.max); gl.uniform3fv(U.uBounceC, rm.bounce); gl.uniform1f(U.uAmbIn, rm.ambIn); gl.uniform1f(U.uOutK, rm.outK);
      gl.uniform3fv(U.uWC, fl('c')); gl.uniform3fv(U.uWU, fl('u')); gl.uniform3fv(U.uWV, fl('v')); gl.uniform3fv(U.uWL, fl('L')); }
    gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, this.flatNTex); [3, 4, 6].forEach(u => { gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, this.whiteTex); }); gl.activeTexture(gl.TEXTURE0);
    const L = this.lights, lp = new Float32Array(48), lc = new Float32Array(48), lr = new Float32Array(16);
    L.forEach((l, i) => { lp.set(l.p, i * 3); lc.set(l.c, i * 3); lr[i] = l.r; });
    gl.uniform1i(U.uNL, L.length); gl.uniform3fv(U.uLP, lp); gl.uniform3fv(U.uLC, lc); gl.uniform1fv(U.uLR, lr);
    const trans = [];
    const draw = (g, d) => {
      gl.uniformMatrix4fv(U.uModel, false, d.world);
      gl.uniform3fv(U.uColor, d.rgb); gl.uniform3fv(U.uColor2, d.rgb2); gl.uniform3fv(U.uEmissive, d.erg);
      gl.uniform1f(U.uAlpha, d.alpha); gl.uniform1i(U.uPattern, d.pattern); gl.uniform1f(U.uPatScale, d.patScale);
      gl.uniform1f(U.uRough, d.rough); gl.uniform1f(U.uMetal, d.metal);
      gl.uniform1f(U.uHL, g.hl || 0);
      const tx = d.tex; let bits = 0;
      if (tx) { const T = h => h && (h.t !== undefined ? h.t : h); const B = T(tx.B), Mr = T(tx.M), Nm = T(tx.N), O = T(tx.O);
        bits = (B ? 1 : 0) | (Mr ? 2 : 0) | (Nm ? 4 : 0) | (O ? 8 : 0) | (tx.world ? 16 : 0) | (tx.cut ? 32 : 0) | (tx.blend ? 64 : 0) | (tx.dual ? 128 : 0) | (tx.weather ? 256 : 0);
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, B || this.whiteTex); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, Mr || this.whiteTex);
        gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, Nm || this.flatNTex); gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, O || this.whiteTex);
        gl.uniform3fv(U.uUVX, tx.uvx || [1, 1, 0]); gl.uniform1f(U.uNS, tx.ns ?? 1); gl.activeTexture(gl.TEXTURE0); }
      gl.uniform1i(U.uTex, bits); gl.uniform1f(U.uTransl, d.transl || 0); gl.uniform1f(U.uSheen, d.sheen || 0); if (d.sheen) gl.uniform3fv(U.uSheenC, d.shrgb || [1, 1, 1]);
      gl.bindVertexArray(d.geo.vao); gl.drawArrays(gl.TRIANGLES, 0, d.geo.count);
    };
    this.groups.forEach(g => g.items.forEach(d => {
      if (d.shadowOnly || !visible(g, d)) return;
      if (d.alpha < 1 || d.pattern === 15) { trans.push([g, d]); return; }
      if (d.noCull) gl.disable(gl.CULL_FACE);
      draw(g, d);
      if (d.noCull) gl.enable(gl.CULL_FACE);
    }));
    if (trans.length) {
      const cp = this.cam.pos;
      trans.forEach(t => t[2] = V3.len(V3.sub([t[1].world[12], t[1].world[13], t[1].world[14]], cp)));
      trans.sort((a, b) => b[2] - a[2]);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE);
      trans.forEach(([g, d]) => draw(g, d));
      gl.depthMask(true); gl.disable(gl.BLEND); gl.enable(gl.CULL_FACE);
    }
    gl.bindVertexArray(null);
    if (post) this._post(post, proj);
    this.dirty = false;
  }
  _post(P, proj) {
    const gl = this.gl, W = P.w, H = P.h;
    if (P.msFB) { // resolve MSAA colour + depth into textures
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, P.msFB); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, P.resFB);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    }
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.BLEND); gl.bindVertexArray(this.emptyVAO);
    const inv = M4.inv(proj);
    if (P.ao) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, P.aoFB); gl.viewport(0, 0, P.aw, P.ah);
      gl.useProgram(this.progSSAO); const S = this.uSSAO;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, P.depth); gl.uniform1i(S.uDepth, 0);
      gl.uniformMatrix4fv(S.uProj, false, proj); gl.uniformMatrix4fv(S.uInvProj, false, inv);
      gl.uniform2f(S.uTexel, 1 / P.aw, 1 / P.ah); gl.uniform1f(S.uRadius, this.env.aoRadius || this.aoRadius || 0.32); gl.uniform3fv(S.uKernel, this.kernel);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(this.progComp); const C = this.uComp;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, P.color); gl.uniform1i(C.uColor, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, P.ao || P.color); gl.uniform1i(C.uAO, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, P.depth); gl.uniform1i(C.uDepth, 2);
    gl.uniform2f(C.uAOTexel, 1 / (P.aw || W), 1 / (P.ah || H)); gl.uniform1i(C.uUseAO, P.ao ? 1 : 0);
    gl.uniform1f(C.uAOStrength, this.env.aoStrength ?? 0.6); gl.uniform1f(C.uVignette, this.env.vignette ?? 0.22); gl.uniformMatrix4fv(C.uInvProj, false, inv);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.bindVertexArray(null);
  }
  // world point -> screen px (css)
  project(p) {
    const m = this.viewProj();
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    if (w <= 0.01) return null;
    return [(x / w * 0.5 + 0.5) * this.canvas.clientWidth, (1 - (y / w * 0.5 + 0.5)) * this.canvas.clientHeight, w];
  }
  ray(px, py) {
    const c = this.cam, W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    const nx = px / W * 2 - 1, ny = 1 - py / H * 2;
    const f = V3.norm(V3.sub(c.target, c.pos)); let r = V3.cross(f, [0, 1, 0]); if (V3.len(r) < 1e-6) r = [1, 0, 0]; r = V3.norm(r);
    const u = V3.cross(r, f), t = Math.tan(c.fov / 2), asp = W / H;
    return { o: c.pos.slice(), d: V3.norm(V3.add(f, V3.add(V3.scale(r, nx * t * asp), V3.scale(u, ny * t)))) };
  }
  // ray vs oriented box (center x,z, base y0, height h, half w/d, rot)
  static rayOBB(ray, b) {
    const ca = Math.cos(b.rot || 0), sa = Math.sin(b.rot || 0);
    const ox = ray.o[0] - b.x, oy = ray.o[1] - (b.y0 + b.h / 2), oz = ray.o[2] - b.z;
    const o = [ox * ca - oz * sa, oy, ox * sa + oz * ca];
    const d = [ray.d[0] * ca - ray.d[2] * sa, ray.d[1], ray.d[0] * sa + ray.d[2] * ca];
    const hx = [b.w / 2, b.h / 2, b.d / 2]; let tmin = -1e9, tmax = 1e9;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-9) { if (Math.abs(o[i]) > hx[i]) return null; continue; }
      let t1 = (-hx[i] - o[i]) / d[i], t2 = (hx[i] - o[i]) / d[i]; if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return null;
    }
    return tmax < 0 ? null : Math.max(tmin, 0);
  }
  snapshot(w = 480, h = 300) {
    this.render();
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); const sw = this.canvas.width, sh = this.canvas.height;
    const s = Math.max(w / sw, h / sh); const dw = sw * s, dh = sh * s;
    ctx.drawImage(this.canvas, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return c.toDataURL('image/jpeg', 0.85);
  }
}

/* ---------- camera controllers ---------- */
class Controls {
  constructor(engine, el) {
    this.e = engine; this.el = el; this.mode = 'orbit';
    this.orbit = { theta: -0.75, phi: 0.95, r: 22, target: [0, 0, 0] };
    this.walk = { pos: [0, 1.6, 0], yaw: 0, pitch: -0.05 };
    this.keys = {}; this.enabled = true; this.anim = null; this.collide = null;
    this.onClick = null; this.onDragStart = null; this.onDrag = null; this.onDragEnd = null; this.onChange = null;
    let down = null, pinch = null;
    const pts = new Map();
    el.addEventListener('pointerdown', e => {
      if (!this.enabled) return;
      el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      const r = el.getBoundingClientRect();
      down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, btn: e.button, shift: e.shiftKey, moved: false, custom: false, px: e.clientX - r.left, py: e.clientY - r.top };
      if (pts.size === 2) { const a = [...pts.values()]; pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), r: this.orbit.r }; }
      if (this.onDragStart && e.button === 0 && pts.size === 1 && this.onDragStart(down.px, down.py)) down.custom = true;
    });
    el.addEventListener('pointermove', e => {
      if (!down || !this.enabled) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      const dx = e.clientX - down.lx, dy = e.clientY - down.ly; down.lx = e.clientX; down.ly = e.clientY;
      if (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 4) down.moved = true;
      if (!down.moved) return;
      const r = el.getBoundingClientRect();
      if (down.custom) { this.onDrag && this.onDrag(e.clientX - r.left, e.clientY - r.top); return; }
      if (pinch && pts.size === 2) { const a = [...pts.values()]; const d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); this.orbit.r = Math.max(2, Math.min(80, pinch.r * pinch.d / d)); this.apply(); return; }
      this.stopAnim();
      if (this.mode === 'orbit') {
        if (down.btn === 2 || down.shift || down.btn === 1) this.pan(dx, dy);
        else { this.orbit.theta -= dx * 0.006; this.orbit.phi = Math.max(0.05, Math.min(1.52, this.orbit.phi - dy * 0.005)); }
      } else { this.walk.yaw -= dx * 0.004; this.walk.pitch = Math.max(-1.2, Math.min(1.2, this.walk.pitch - dy * 0.004)); }
      this.apply();
    });
    const up = e => {
      if (!down) return; pts.delete(e.pointerId);
      const r = el.getBoundingClientRect();
      if (down.custom && down.moved) this.onDragEnd && this.onDragEnd();
      else if (!down.moved && this.onClick) this.onClick(e.clientX - r.left, e.clientY - r.top, e);
      else if (down.custom) this.onDragEnd && this.onDragEnd(true);
      if (pts.size < 2) pinch = null;
      if (!pts.size) down = null;
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('wheel', e => {
      if (!this.enabled) return; e.preventDefault(); this.stopAnim();
      if (this.mode === 'orbit') { this.orbit.r = Math.max(2, Math.min(90, this.orbit.r * (1 + Math.sign(e.deltaY) * 0.1))); }
      else { this.move(-Math.sign(e.deltaY) * 0.4, 0); }
      this.apply();
    }, { passive: false });
    window.addEventListener('keydown', e => { if (e.target.closest && e.target.closest('input,textarea,select')) return; if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase(); this.keys[k] = true;
      if (this.kbd && this.kbd() && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault(); });
    window.addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
  }
  pan(dx, dy) {
    const o = this.orbit, s = o.r * 0.0016, c = Math.cos(o.theta), n = Math.sin(o.theta);
    o.target[0] += -c * dx * s - n * dy * s;
    o.target[2] += n * dx * s - c * dy * s;
    this.apply();
  }
  move(fwd, side) {
    const w = this.walk; const f = [-Math.sin(w.yaw), 0, -Math.cos(w.yaw)], r = [Math.cos(w.yaw), 0, -Math.sin(w.yaw)];
    const np = [w.pos[0] + f[0] * fwd + r[0] * side, w.pos[1], w.pos[2] + f[2] * fwd + r[2] * side];
    if (this.collide) { const ok = this.collide(w.pos, np); if (!ok) { const nx = [np[0], w.pos[1], w.pos[2]], nz = [w.pos[0], w.pos[1], np[2]]; if (this.collide(w.pos, nx)) w.pos = nx; else if (this.collide(w.pos, nz)) w.pos = nz; this.onMoved && this.onMoved(w.pos); return; } }
    w.pos = np; this.onMoved && this.onMoved(w.pos);
  }
  tick(dt) {
    if (this.anim) {
      const a = this.anim; a.t += dt / a.dur; const t = Math.min(1, a.t); const k = a.ease ? a.ease(t) : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      a.step(k); this.e.dirty = true; if (t >= 1) { this.anim = null; a.done && a.done(); }
      return true;
    }
    if (this.mode === 'walk' && this.enabled) {
      // a calm walking pace (≈1.3 m/s, 2.2 m/s hurrying) that eases in and out, and an unhurried turn
      const k = this.keys, top = k.shift ? 2.2 : 1.3, v = this.vel || (this.vel = { f: 0, s: 0, t: 0 });
      const tf = ((k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0)) * top, ts = ((k.d ? 1 : 0) - (k.a ? 1 : 0)) * top * 0.8, tt = ((k.arrowleft ? 1 : 0) - (k.arrowright ? 1 : 0)) * 1.25;
      const ease = Math.min(1, dt * 7); v.f += (tf - v.f) * ease; v.s += (ts - v.s) * ease; v.t += (tt - v.t) * Math.min(1, dt * 9);
      if (Math.abs(v.f) < 0.01 && !tf) v.f = 0; if (Math.abs(v.s) < 0.01 && !ts) v.s = 0; if (Math.abs(v.t) < 0.01 && !tt) v.t = 0;
      if (v.t) this.walk.yaw += v.t * dt;
      if (v.f || v.s || v.t) { if (v.f || v.s) this.move(v.f * dt, v.s * dt); this.apply(); return true; }
    }
    if (this.mode === 'orbit' && this.enabled && (!this.kbd || this.kbd())) {
      // keyboard flying around the house: W A S D / arrows glide, Q E circle, Z X zoom, T G tilt, Shift = faster
      const k = this.keys, o = this.orbit, boost = k.shift ? 2.6 : 1;
      const f = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0), sd = (k.d ? 1 : 0) - (k.a ? 1 : 0);
      const rot = (k.q || k.arrowleft ? 1 : 0) - (k.e || k.arrowright ? 1 : 0), zoom = (k.x ? 1 : 0) - (k.z ? 1 : 0), tilt = (k.g ? 1 : 0) - (k.t ? 1 : 0);
      if (f || sd || rot || zoom || tilt) {
        this.stopAnim();
        const sp = Math.max(1.8, o.r * 0.22) * boost * dt, c = Math.cos(o.theta), n = Math.sin(o.theta);
        o.target[0] += (-n * f + c * sd) * sp; o.target[2] += (-c * f - n * sd) * sp;
        const b = this.e.bounds, lim = b.r * 1.6; // don't wander off into the fog
        o.target[0] = Math.max(b.c[0] - lim, Math.min(b.c[0] + lim, o.target[0])); o.target[2] = Math.max(b.c[2] - lim, Math.min(b.c[2] + lim, o.target[2]));
        o.theta += rot * 0.9 * boost * dt;
        o.r = Math.max(2, Math.min(90, o.r * (1 + zoom * 0.6 * boost * dt)));
        o.phi = Math.max(0.08, Math.min(1.5, o.phi + tilt * 0.7 * dt));
        this.apply(); return true;
      }
    }
    return false;
  }
  stopAnim() { if (this.anim && !this.anim.locked) this.anim = null; }
  apply() {
    const c = this.e.cam;
    if (this.mode === 'orbit') {
      const o = this.orbit;
      c.pos = [o.target[0] + o.r * Math.sin(o.phi) * Math.sin(o.theta), o.target[1] + o.r * Math.cos(o.phi), o.target[2] + o.r * Math.sin(o.phi) * Math.cos(o.theta)];
      c.target = o.target.slice();
    } else {
      const w = this.walk;
      c.pos = w.pos.slice();
      c.target = [w.pos[0] - Math.sin(w.yaw) * Math.cos(w.pitch), w.pos[1] + Math.sin(w.pitch), w.pos[2] - Math.cos(w.yaw) * Math.cos(w.pitch)];
    }
    this.e.dirty = true; this.onChange && this.onChange();
  }
  // animate camera from current pos/target to given pos/target (free camera), then set controller state
  flyTo(pos, target, dur = 1.4, opts = {}) {
    const c = this.e.cam, p0 = c.pos.slice(), t0 = c.target.slice(), f0 = c.fov;
    return new Promise(res => {
      this.anim = {
        t: 0, dur, locked: !!opts.locked, ease: opts.ease,
        step: k => { c.pos = V3.lerp(p0, pos, k); c.target = V3.lerp(t0, target, k); if (opts.fov) c.fov = f0 + (opts.fov - f0) * k; if (opts.onStep) opts.onStep(k); this.onChange && this.onChange(); },
        done: () => { this.syncFromCam(opts.mode); res(); }
      };
    });
  }
  flyPath(points, targets, dur, opts = {}) { // smooth catmull-rom through positions
    const c = this.e.cam; const P = [c.pos.slice(), ...points], T = [c.target.slice(), ...targets];
    const cr = (arr, k) => {
      const n = arr.length - 1, f = k * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
      const p0 = arr[Math.max(0, i - 1)], p1 = arr[i], p2 = arr[i + 1], p3 = arr[Math.min(n, i + 2)];
      return [0, 1, 2].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t * t * t));
    };
    return new Promise(res => {
      this.anim = { t: 0, dur, locked: true, ease: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        step: k => { c.pos = cr(P, k); c.target = cr(T, k); this.onChange && this.onChange(); },
        done: () => { this.syncFromCam(opts.mode); res(); } };
    });
  }
  syncFromCam(mode) {
    const c = this.e.cam;
    if (mode) this.mode = mode;
    if (this.mode === 'orbit') {
      const d = V3.sub(c.pos, c.target), r = V3.len(d);
      this.orbit = { target: c.target.slice(), r, phi: Math.acos(Math.max(-1, Math.min(1, d[1] / r))), theta: Math.atan2(d[0], d[2]) };
    } else {
      const d = V3.norm(V3.sub(c.target, c.pos));
      this.walk = { pos: c.pos.slice(), yaw: Math.atan2(-d[0], -d[2]), pitch: Math.asin(Math.max(-1, Math.min(1, d[1]))) };
    }
  }
}

/* ===================== DIMORA DATA MODEL, CATALOGS & COSTS ===================== */
const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r2 = v => Math.round(v * 100) / 100;
const snap = (v, s = 0.05) => Math.round(v / s) * s;
const deep = o => JSON.parse(JSON.stringify(o));
const inr = v => '₹' + Math.round(v).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WALL_T = 0.12, DOOR_H = 2.1, FLOOR_TOP = 0.04;

const ROOM_TYPES = {
  living: { label: 'Living Room', tint: '#f3d9b1', min: 9.5, icon: '🛋️' },
  bedroom: { label: 'Bedroom', tint: '#c9dccb', min: 9.5, icon: '🛏️' },
  master: { label: 'Master Bedroom', tint: '#b9d3c0', min: 12, icon: '🛏️' },
  kitchen: { label: 'Kitchen', tint: '#f2c6a7', min: 5, icon: '🍳' },
  dining: { label: 'Dining', tint: '#ead1b8', min: 7.5, icon: '🍽️' },
  bathroom: { label: 'Bathroom', tint: '#bcd7e6', min: 1.8, icon: '🚿' },
  balcony: { label: 'Balcony', tint: '#d4e5c2', min: 2.5, icon: '🌿' },
  study: { label: 'Study', tint: '#d9cfe8', min: 6, icon: '📚' },
  office: { label: 'Home Office', tint: '#cfd6ea', min: 6.5, icon: '💼' },
  gaming: { label: 'Gaming Room', tint: '#cbc4ea', min: 8, icon: '🎮' },
  reading: { label: 'Reading Corner', tint: '#e8dcc0', min: 4, icon: '📖' },
  closet: { label: 'Walk-in Closet', tint: '#e6d3dc', min: 3.5, icon: '👗' },
  nursery: { label: 'Nursery', tint: '#f3d3d8', min: 7, icon: '🧸' },
  gym: { label: 'Home Gym', tint: '#d2e0dc', min: 8, icon: '🏋️' },
  guest: { label: 'Guest Room', tint: '#d8e2c8', min: 9, icon: '🛏️' },
  pooja: { label: 'Pooja Room', tint: '#f5dfb0', min: 1.5, icon: '🪔' },
  utility: { label: 'Utility', tint: '#d6d6d6', min: 2, icon: '🧺' },
  hall: { label: 'Passage', tint: '#e5e1da', min: 2, icon: '🚪' },
  empty: { label: 'Empty Room', tint: '#e8e8e8', min: 4, icon: '⬜' },
  parking: { label: 'Car Parking', tint: '#cfd4d8', min: 12.5, icon: '🚗' },
  garden: { label: 'Garden', tint: '#bfe0a8', min: 4, icon: '🌳' },
  store: { label: 'Store Room', tint: '#d9d4cc', min: 1.5, icon: '📦' },
  porch: { label: 'Porch / Sit-out', tint: '#e9dcc4', min: 2, icon: '🪴' },
  garage: { label: 'Garage', tint: '#d3d7dc', min: 15, icon: '🚘' },
};
/* open-air spaces: no full walls to the outside and no ceiling; a balcony gets a railing */
const OPEN_AIR = new Set(['balcony', 'parking', 'garden', 'porch']);
const isOpenAir = r => !!r && OPEN_AIR.has(r.type);
const isYard = r => !!r && (r.type === 'parking' || r.type === 'garden');
const TRANSFORMS = [
  { to: 'office', label: 'Home Office' }, { to: 'gaming', label: 'Gaming Room' }, { to: 'reading', label: 'Reading Corner' },
  { to: 'study', label: 'Study Room' }, { to: 'closet', label: 'Walk-in Closet' }, { to: 'nursery', label: 'Nursery' },
  { to: 'gym', label: 'Home Gym' }, { to: 'guest', label: 'Guest Room' }, { to: 'pooja', label: 'Pooja Room' }, { to: 'bedroom', label: 'Bedroom' }, { to: 'garage', label: 'Garage (car + bike)' },
];

/* Floor materials: ₹ per sq ft incl. laying (illustrative) */
const FLOORS = {
  vitrified: { label: 'Vitrified Tiles', color: '#e7e3dc', c2: '#cdc7bd', pattern: 2, scale: 0.6, rate: 85, fam: 'tile' },
  ceramic: { label: 'Ceramic Matte Tiles', color: '#cdbba5', c2: '#a8998a', pattern: 2, scale: 0.45, rate: 55, fam: 'tile' },
  antiskid: { label: 'Anti-skid Tiles', color: '#d6cdbf', c2: '#ada291', pattern: 2, scale: 0.3, rate: 60, fam: 'tile' },
  sandstone: { label: 'Sandstone Slabs', color: '#cdbb9c', c2: '#a28f72', pattern: 6, scale: 0.6, rate: 85, fam: 'stone' },
  marble: { label: 'Italian Marble', color: '#f0ede7', c2: '#a9a49b', pattern: 3, scale: 0.9, rate: 380, fam: 'stone' },
  indian_marble: { label: 'Indian Marble (Makrana)', color: '#ece8e0', c2: '#b9b2a4', pattern: 3, scale: 0.8, rate: 180, fam: 'stone' },
  granite: { label: 'Black Granite', color: '#38383a', c2: '#56565a', pattern: 6, scale: 0.6, rate: 150, fam: 'stone' },
  athangudi: { label: 'Athangudi Patterned Tiles', color: '#efe2c4', c2: '#a8442a', pattern: 22, scale: 1, rate: 220, fam: 'stone' },
  kota: { label: 'Kota Stone', color: '#7f8b74', c2: '#66705c', pattern: 6, scale: 0.6, rate: 60, fam: 'stone' },
  oak: { label: 'Oak Laminate', color: '#c39a6b', c2: '#8a6644', pattern: 1, scale: 0.19, rate: 110, fam: 'wood' },
  walnut: { label: 'Walnut Engineered Wood', color: '#6f4c35', c2: '#4a3020', pattern: 1, scale: 0.19, rate: 260, fam: 'wood' },
  herringbone: { label: 'Herringbone Oak', color: '#b8895a', c2: '#7d5a3a', pattern: 5, scale: 0.42, rate: 340, fam: 'wood' },
  vinyl: { label: 'Wood-look Vinyl (LVT)', color: '#b79471', c2: '#8a6d50', pattern: 1, scale: 0.18, rate: 75, fam: 'wood' },
  carpet: { label: 'Carpet Tiles', color: '#8d9198', c2: '#6f737a', pattern: 4, scale: 1, rate: 90, fam: 'soft' },
  concrete: { label: 'Polished Concrete', color: '#a7a6a2', c2: '#8a8985', pattern: 8, scale: 1.2, rate: 95, fam: 'stone' },
  deck: { label: 'Outdoor Deck (WPC)', color: '#8d6a4c', c2: '#5c4330', pattern: 1, scale: 0.14, rate: 160, fam: 'wood' },
  pavers: { label: 'Interlocking Pavers', color: '#b2a593', c2: '#7f7466', pattern: 12, scale: 0.42, rate: 70, fam: 'stone' },
  cobble: { label: 'Cobblestone Setts', color: '#a3a09a', c2: '#5d5a55', pattern: 18, scale: 1, rate: 95, fam: 'stone' },
  lawn: { label: 'Lawn (natural grass)', color: '#4f7034', c2: '#6b7c3d', pattern: 11, scale: 1, rate: 35, fam: 'soft' },
};
const FLOOR_CHEAPER = { marble: 'indian_marble', indian_marble: 'vitrified', herringbone: 'oak', walnut: 'oak', oak: 'vinyl', granite: 'kota', vitrified: 'ceramic', carpet: 'vinyl', concrete: 'kota', deck: 'ceramic', antiskid: 'ceramic' };
/* Paint tiers ₹ per sq ft of wall */
const PAINT = { budget: { label: 'Economy emulsion', rate: 14 }, standard: { label: 'Premium emulsion', rate: 26 }, premium: { label: 'Luxury / texture finish', rate: 48 } };
const CEILINGS = {
  flat: { label: 'Plain ceiling', rate: 0 }, peripheral: { label: 'Peripheral false ceiling', rate: 95 },
  cove: { label: 'Cove-lit false ceiling', rate: 125 }, tray: { label: 'Tray ceiling with downlights', rate: 150 },
};
const LIGHT_COST = { ambient: 220 /* per m² */, task: 3500, accent: 5000 };
const SQFT = 10.7639;

/* Themes */
const THEMES = {
  Modern: { walls: ['#e9e6e1', '#d8d3cb', '#cfd6d8'], accent: '#2f4858', wood: '#4a4440', fabric: '#8e9aaf', metal: '#2a2a2a', rug: '#6b7a8f', curtain: '#c9c3b8', floor: 'vitrified', wet: 'antiskid', ceiling: 'peripheral', desc: 'Clean lines, neutral greys and a slate accent.' },
  Minimalist: { walls: ['#f4f2ee', '#ebe8e2'], accent: '#9a9187', wood: '#d6c2a6', fabric: '#e2ddd5', metal: '#bdbdbd', rug: '#d9d3c9', curtain: '#efebe4', floor: 'concrete', wet: 'antiskid', ceiling: 'flat', desc: 'Less, but better — airy whites and pale timber.' },
  Japandi: { walls: ['#e7ddcf', '#ddd2c1', '#d3cbbb'], accent: '#5b6650', wood: '#a47e5a', fabric: '#c8bba6', metal: '#3b3631', rug: '#b7a78e', curtain: '#e0d6c6', floor: 'oak', wet: 'ceramic', ceiling: 'cove', desc: 'Japanese calm meets Nordic warmth: oak, linen, olive.' },
  Scandinavian: { walls: ['#f3f3ef', '#e6ebea', '#eef0ea'], accent: '#7f9c96', wood: '#d9b98f', fabric: '#b9c4c2', metal: '#555', rug: '#c8cdc9', curtain: '#f2f1ec', floor: 'oak', wet: 'antiskid', ceiling: 'flat', desc: 'Bright, cosy and practical with light woods.' },
  Industrial: { walls: ['#a29d97', '#8f8a84', '#b9b2a8'], accent: '#b5651d', wood: '#5a3e2b', fabric: '#6b4f3a', metal: '#1e1e1e', rug: '#5d5650', curtain: '#7d756c', floor: 'concrete', wet: 'granite', ceiling: 'flat', desc: 'Raw concrete, dark metal and leather tones.' },
  'Indian Contemporary': { walls: ['#f3e7d3', '#ecdcc2', '#e7d9c6'], accent: '#a3402b', wood: '#5d3a24', fabric: '#b5523a', metal: '#b08a3e', rug: '#8c2f22', curtain: '#d4a03c', floor: 'indian_marble', wet: 'antiskid', ceiling: 'cove', indian: true, print: '#e2b04a', stencil: '#b5523a', desc: 'Walnut & sheesham wood, terracotta and mustard block prints, brass on Makrana marble — with a jhoola, pooja unit and urli.' },
  'Modern Traditional Indian': { walls: ['#efe4cf', '#e6d2b0', '#e3e4d4'], accent: '#1f5a4a', wood: '#6b3f22', fabric: '#7a2331', metal: '#b8903a', rug: '#6e2230', curtain: '#c99a3c', floor: 'athangudi', wet: 'antiskid', ceiling: 'tray', indian: true, carved: true, print: '#d9a441', stencil: '#1f5a4a', desc: 'Carved teak, Athangudi tiles, maroon and peacock green with brass — a diwan, a jaali screen and a carved bed.' },
  Luxury: { walls: ['#ede6da', '#e3d9c9', '#d9d2c7'], accent: '#1f2a44', wood: '#4a3426', fabric: '#2c3a5c', metal: '#b8975a', rug: '#3a4562', curtain: '#cdbfa6', floor: 'marble', wet: 'marble', ceiling: 'tray', desc: 'Italian marble, deep navy velvet and brushed gold.' },
  Bohemian: { walls: ['#f0d9c0', '#e8c9a8', '#efe0c9'], accent: '#c86b4a', wood: '#8b5e3c', fabric: '#d08a5e', metal: '#7a6a4a', rug: '#b0503a', curtain: '#e3b77c', floor: 'walnut', wet: 'ceramic', ceiling: 'flat', desc: 'Layered textures, warm earth tones and plants.' },
};
const WOOD_FINISHES = { 'Light Oak': '#d2b48c', 'Teak': '#9a6a3a', 'Walnut': '#5d4030', 'Sheesham': '#7a4a2a', 'White Laminate': '#efeeea', 'Matte Black': '#262626', 'Grey Ash': '#9b958c' };
const NAMED_COLORS = {
  white: '#f4f3ef', 'off white': '#efe9de', ivory: '#f2ecd9', cream: '#efe4cc', beige: '#e3d4b8', sand: '#d9c4a0', taupe: '#b5a593', grey: '#bfbfbb', gray: '#bfbfbb', 'light grey': '#d8d8d4', charcoal: '#4a4a4a',
  black: '#2a2a2a', blue: '#9fb8d4', 'sky blue': '#b8d6ea', 'powder blue': '#c4d6e4', navy: '#2e3f5c', teal: '#4f8a8b', turquoise: '#7cc6c0', green: '#a9c4a0', 'sage green': '#b5c4a8', sage: '#b5c4a8', mint: '#c6e3d1', olive: '#8a8f5c', 'emerald': '#3f7d5f', 'forest green': '#3f5e46',
  yellow: '#f1dc8f', mustard: '#d4a73a', peach: '#f3c8a8', coral: '#ee9a85', pink: '#efc2c8', 'blush': '#efd1cf', 'dusty pink': '#d9a7a7', red: '#c75a4a', maroon: '#7a2e2e', terracotta: '#c56c4b', orange: '#e59a5b',
  lavender: '#cfc3e3', lilac: '#d6c7e3', purple: '#8e6fae', brown: '#8b6447', 'warm white': '#f3eee3', greige: '#cdc5b8', 'pastel green': '#cfe5c9', 'pastel blue': '#cfe0ee',
};

/* ---------- furniture catalog ---------- */
const B = (w, h, d, x, y, z, role, o = {}) => Object.assign({ k: 'box', w, h, d, x, y, z, role }, o);
const C = (r, h, x, y, z, role, o = {}) => Object.assign({ k: 'cyl', r, h, x, y, z, role }, o);
const SP = (r, x, y, z, role, o = {}) => Object.assign({ k: 'sph', r, x, y, z, role }, o);
const legs4 = (W, D, h, t = 0.04, inset = 0.04, role = 'wood') => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => B(t, h, t, a * (W / 2 - inset), 0, b * (D / 2 - inset), role));
const chairParts = (x, z, ry, role = 'wood', seat = 'fabric') => {
  const rot = (px, pz) => [x + px * Math.cos(ry) + pz * Math.sin(ry), z - px * Math.sin(ry) + pz * Math.cos(ry)];
  const P = []; const add = (p, lx, lz) => { const [a, b] = rot(lx, lz); p.x = a; p.z = b; p.ry = ry; P.push(p); };
  [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => add(B(0.035, 0.45, 0.035, 0, 0, 0, role), a, b));
  add(B(0.44, 0.05, 0.44, 0, 0.45, 0, seat), 0, 0); add(B(0.42, 0.42, 0.04, 0, 0.5, 0, role), 0, -0.2);
  return P;
};
const CATALOG = {
  bed_double: { label: 'Double Bed', icon: '🛏️', w: 1.6, d: 2.05, h: 1.0, cat: 'Bedroom', price: [11000, 32000, 78000], tall: false,
    build: (W, D) => [B(W, 0.32, D, 0, 0.06, 0, 'wood'), ...legs4(W, D, 0.06, 0.06, 0.06), B(W - 0.06, 0.22, D - 0.12, 0, 0.36, 0.04, 'mattress'),
      B(W + 0.04, 1.0, 0.08, 0, 0, -D / 2 + 0.04, 'headboard'), B(W * 0.38, 0.12, 0.34, -W * 0.24, 0.58, -D / 2 + 0.3, 'white'), B(W * 0.38, 0.12, 0.34, W * 0.24, 0.58, -D / 2 + 0.3, 'white'),
      B(W - 0.02, 0.06, D * 0.52, 0, 0.56, D * 0.22, 'fabric')] },
  bed_single: { label: 'Single Bed', icon: '🛏️', w: 1.0, d: 2.0, h: 0.9, cat: 'Bedroom', price: [9000, 19000, 42000],
    build: (W, D) => [B(W, 0.3, D, 0, 0.06, 0, 'wood'), ...legs4(W, D, 0.06, 0.06, 0.06), B(W - 0.05, 0.2, D - 0.1, 0, 0.34, 0.03, 'mattress'), B(W + 0.02, 0.9, 0.07, 0, 0, -D / 2 + 0.035, 'headboard'),
      B(W * 0.6, 0.11, 0.32, 0, 0.54, -D / 2 + 0.28, 'white'), B(W - 0.02, 0.05, D * 0.5, 0, 0.54, D * 0.22, 'fabric')] },
  bunk_bed: { label: 'Bunk Bed', icon: '🪜', w: 1.0, d: 2.0, h: 1.75, cat: 'Kids', price: [18000, 32000, 60000],
    build: (W, D) => [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => B(0.06, 1.75, 0.06, a * (W / 2 - 0.03), 0, b * (D / 2 - 0.03), 'wood')),
      B(W - 0.04, 0.08, D - 0.04, 0, 0.2, 0, 'wood'), B(W - 0.1, 0.16, D - 0.12, 0, 0.28, 0, 'mattress'), B(W - 0.04, 0.08, D - 0.04, 0, 1.05, 0, 'wood'), B(W - 0.1, 0.15, D - 0.12, 0, 1.13, 0, 'fabric'),
      B(W - 0.04, 0.05, 0.04, 0, 1.45, D / 2 - 0.03, 'wood'), ...[0.4, 0.65, 0.9].map(y => B(0.04, 0.04, 0.4, W / 2 - 0.02, y, D / 2 - 0.35, 'accent'))] },
  wardrobe: { label: 'Wardrobe', icon: '🚪', w: 1.8, d: 0.6, h: 2.1, cat: 'Storage', price: [12000, 40000, 98000], tall: true, storage: 2.2, perW: true,
    build: (W, D, H) => { const n = Math.max(2, Math.round(W / 0.6)); const P = [B(W, H, D, 0, 0, 0, 'wood')];
      for (let i = 1; i < n; i++) P.push(B(0.008, H - 0.06, 0.01, -W / 2 + W * i / n, 0.03, D / 2, 'metal'));
      for (let i = 0; i < n; i++) P.push(B(0.02, 0.22, 0.02, -W / 2 + W * (i + 0.5) / n + (i % 2 ? -1 : 1) * (W / n / 2 - 0.06), H * 0.45, D / 2 + 0.012, 'metal'));
      P.push(B(W, 0.04, D + 0.01, 0, H - 0.04, 0, 'accent')); return P; } },
  side_table: { label: 'Bedside Table', icon: '◻️', w: 0.45, d: 0.4, h: 0.55, cat: 'Bedroom', price: [2500, 6500, 16000],
    build: (W, D, H) => [B(W, H - 0.06, D, 0, 0.06, 0, 'wood'), ...legs4(W, D, 0.06, 0.03, 0.03, 'metal'), B(W * 0.7, 0.02, 0.02, 0, H * 0.55, D / 2 + 0.01, 'metal'), C(0.07, 0.03, 0.08, H, -0.05, 'metal'), C(0.015, 0.25, 0.08, H + 0.03, -0.05, 'metal'), C(0.11, 0.16, 0.08, H + 0.26, -0.05, 'lamp', { c: 0.7 })] },
  dresser: { label: 'Dresser + Mirror', icon: '🪞', w: 1.0, d: 0.45, h: 1.7, cat: 'Bedroom', price: [8000, 18000, 45000], storage: 0.4,
    build: (W, D) => [B(W, 0.78, D, 0, 0, 0, 'wood'), B(W - 0.04, 0.008, 0.01, 0, 0.4, D / 2, 'metal'), B(W * 0.62, 0.8, 0.03, 0, 0.82, -D / 2 + 0.05, 'mirror'), B(W * 0.66, 0.84, 0.02, 0, 0.8, -D / 2 + 0.03, 'wood')] },
  desk: { label: 'Work Desk', icon: '🖥️', w: 1.2, d: 0.6, h: 0.75, cat: 'Office', price: [5000, 14000, 38000],
    build: (W, D) => [B(W, 0.04, D, 0, 0.71, 0, 'wood'), ...legs4(W, D, 0.71, 0.04, 0.04, 'metal'), B(0.4, 0.5, D - 0.06, W / 2 - 0.24, 0.2, 0, 'wood'),
      B(0.55, 0.32, 0.03, 0, 0.9, -D / 2 + 0.12, 'screen'), B(0.05, 0.15, 0.05, 0, 0.75, -D / 2 + 0.12, 'metal'), B(0.4, 0.015, 0.14, 0, 0.75, 0.06, 'metal')] },
  office_chair: { label: 'Ergonomic Chair', icon: '🪑', w: 0.6, d: 0.6, h: 1.1, cat: 'Office', price: [4500, 12000, 32000],
    build: () => [C(0.3, 0.05, 0, 0.03, 0, 'metal'), C(0.03, 0.42, 0, 0.05, 0, 'metal'), B(0.5, 0.08, 0.48, 0, 0.46, 0.02, 'seat'), B(0.46, 0.55, 0.06, 0, 0.56, -0.22, 'seat', { rx: -0.12 }), B(0.06, 0.2, 0.3, -0.26, 0.5, 0, 'metal'), B(0.06, 0.2, 0.3, 0.26, 0.5, 0, 'metal')] },
  sofa_3: { label: '3-Seater Sofa', icon: '🛋️', w: 2.1, d: 0.92, h: 0.85, cat: 'Living', price: [18000, 46000, 125000],
    build: (W, D) => [B(W, 0.08, D, 0, 0.06, 0, 'wood'), B(W - 0.36, 0.2, D - 0.24, 0, 0.14, 0.08, 'fabric'), ...[0, 1, 2].map(i => B((W - 0.4) / 3 - 0.02, 0.14, D - 0.28, -W / 2 + 0.2 + (W - 0.4) / 6 * (2 * i + 1), 0.34, 0.09, 'fabric2')),
      B(W, 0.5, 0.22, 0, 0.14, -D / 2 + 0.11, 'fabric'), B(0.18, 0.46, D, -W / 2 + 0.09, 0.14, 0, 'fabric'), B(0.18, 0.46, D, W / 2 - 0.09, 0.14, 0, 'fabric'),
      B(0.4, 0.36, 0.12, -W / 2 + 0.45, 0.46, -D / 2 + 0.28, 'accent', { rx: -0.25 }), B(0.4, 0.36, 0.12, W / 2 - 0.45, 0.46, -D / 2 + 0.28, 'accent', { rx: -0.25 }), ...legs4(W, D, 0.06, 0.04, 0.08, 'metal')] },
  sofa_l: { label: 'L-shaped Sofa', icon: '🛋️', w: 2.5, d: 1.65, h: 0.85, cat: 'Living', price: [32000, 72000, 185000],
    build: (W, D) => [B(W, 0.2, 0.92, 0, 0.06, -D / 2 + 0.46, 'fabric'), B(0.92, 0.2, D - 0.92, W / 2 - 0.46, 0.06, 0.46, 'fabric'), B(W - 0.2, 0.13, 0.66, 0, 0.26, -D / 2 + 0.55, 'fabric2'), B(0.7, 0.13, D - 0.92, W / 2 - 0.46, 0.26, 0.46, 'fabric2'),
      B(W, 0.55, 0.22, 0, 0.06, -D / 2 + 0.11, 'fabric'), B(0.2, 0.42, 0.92, -W / 2 + 0.1, 0.06, -D / 2 + 0.46, 'fabric'), B(0.22, 0.55, D, W / 2 - 0.11, 0.06, 0, 'fabric'), B(0.4, 0.36, 0.12, -W / 2 + 0.5, 0.4, -D / 2 + 0.3, 'accent', { rx: -0.25 })] },
  armchair: { label: 'Armchair', icon: '💺', w: 0.85, d: 0.85, h: 0.85, cat: 'Living', price: [7000, 18000, 52000],
    build: (W, D) => [...legs4(W, D, 0.12, 0.035, 0.08, 'wood'), B(W, 0.18, D, 0, 0.12, 0, 'fabric'), B(W - 0.3, 0.12, D - 0.24, 0, 0.3, 0.06, 'fabric2'), B(W, 0.5, 0.18, 0, 0.3, -D / 2 + 0.09, 'fabric'), B(0.15, 0.3, D, -W / 2 + 0.075, 0.3, 0, 'fabric'), B(0.15, 0.3, D, W / 2 - 0.075, 0.3, 0, 'fabric')] },
  coffee_table: { label: 'Coffee Table', icon: '☕', w: 1.1, d: 0.6, h: 0.42, cat: 'Living', price: [4000, 11000, 34000],
    build: (W, D, H = 0.42) => E && E.quality !== 'low' ? [{ k: 'rslab', w: W, d: D, h: 0.05, r: Math.min(W, D) / 2, x: 0, y: H - 0.05, z: 0, role: 'stone', tex: 'travertine' },
      { k: 'rslab', w: W * 0.62, d: D * 0.52, h: H - 0.05, r: D * 0.26, bev: 0.006, x: 0, y: 0, z: 0, role: 'stone', tex: 'travertine', tint: '#e6dccb' },
      B(0.24, 0.035, 0.17, -0.22, H, 0.04, 'white'), B(0.2, 0.025, 0.15, -0.21, H + 0.035, 0.03, 'accent'), C(0.05, 0.14, 0.24, H, -0.02, 'ceramic')] : [B(W, 0.045, D, 0, H - 0.045, 0, 'wood', { tex: 'oak' }), B(W - 0.12, 0.025, D - 0.12, 0, 0.11, 0, 'wood', { tex: 'oak' }), ...legs4(W, D, H - 0.045, 0.045, 0.06, 'wood').map(l => Object.assign(l, { tex: 'oak' })),
      C(0.055, 0.16, 0.26, H, -0.04, 'ceramic'), B(0.24, 0.035, 0.17, -0.24, H, 0.06, 'white'), B(0.2, 0.025, 0.15, -0.23, H + 0.035, 0.05, 'accent')] },
  tv_unit: { label: 'TV Unit + TV', icon: '📺', w: 1.8, d: 0.42, h: 1.4, cat: 'Living', price: [9000, 24000, 70000],
    build: (W, D) => [B(W, 0.45, D, 0, 0.08, 0, 'wood'), B(W, 0.08, D - 0.04, 0, 0, 0, 'metal'), B(Math.min(1.4, W * 0.75), 0.78, 0.05, 0, 0.75, -D / 2 + 0.05, 'screen'), B(W * 0.32, 0.12, 0.25, -W * 0.3, 0.53, -0.02, 'accent'), SP(0.08, W * 0.38, 0.62, 0, 'plant')] },
  dining_set: { label: 'Dining Set (6)', icon: '🍽️', w: 1.7, d: 1.9, h: 0.9, cat: 'Dining', price: [22000, 52000, 140000],
    build: (W, D) => { const tw = W - 0.1, td = D - 1.0; const P = [B(tw, 0.05, td, 0, 0.71, 0, 'wood'), ...legs4(tw, td, 0.71, 0.06, 0.08, 'wood'), C(0.08, 0.2, 0, 0.76, 0, 'accent', { c: 0.6 })];
      [-1, 0, 1].forEach(i => { P.push(...chairParts(i * tw / 3.2, -td / 2 - 0.22, 0)); P.push(...chairParts(i * tw / 3.2, td / 2 + 0.22, Math.PI)); }); return P; } },
  dining_4: { label: 'Dining Set (4)', icon: '🍽️', w: 1.25, d: 1.75, h: 0.9, cat: 'Dining', price: [14000, 32000, 85000],
    build: (W, D) => { const tw = W - 0.05, td = D - 0.95; const P = [B(tw, 0.05, td, 0, 0.71, 0, 'wood'), ...legs4(tw, td, 0.71, 0.05, 0.06, 'wood')];
      [-1, 1].forEach(i => { P.push(...chairParts(i * tw / 4.5, -td / 2 - 0.22, 0)); P.push(...chairParts(i * tw / 4.5, td / 2 + 0.22, Math.PI)); }); return P; } },
  kitchen_counter: { label: 'Kitchen Counter', icon: '🍳', w: 2.4, d: 0.62, h: 2.2, cat: 'Kitchen', price: [45000, 110000, 260000], tall: true, storage: 1.2, perW: true,
    build: (W, D) => { const P = [B(W, 0.1, D - 0.06, 0, 0, -0.03, 'metal'), B(W, 0.76, D - 0.02, 0, 0.1, 0, 'cabinet'), B(W + 0.02, 0.04, D + 0.02, 0, 0.86, 0, 'stone'),
      B(W, 0.7, 0.34, 0, 1.45, -D / 2 + 0.17, 'cabinet'), B(0.6, 0.45, 0.42, -W / 2 + 0.6, 1.5, -D / 2 + 0.21, 'metal'), B(0.55, 0.04, 0.4, W * 0.18, 0.88, 0, 'metal'), B(0.5, 0.02, 0.36, W * 0.18, 0.9, 0, 'dark'),
      C(0.08, 0.02, -W / 2 + 0.45, 0.9, -0.08, 'dark'), C(0.08, 0.02, -W / 2 + 0.75, 0.9, -0.08, 'dark'), C(0.07, 0.02, -W / 2 + 0.45, 0.9, 0.14, 'dark'), C(0.07, 0.02, -W / 2 + 0.75, 0.9, 0.14, 'dark'), B(0.02, 0.3, 0.02, W * 0.18, 0.9, -D / 2 + 0.08, 'metal')];
      const n = Math.max(2, Math.round(W / 0.6)); for (let i = 1; i < n; i++) { P.push(B(0.006, 0.7, 0.01, -W / 2 + W * i / n, 0.12, D / 2 - 0.01, 'dark')); P.push(B(0.006, 0.66, 0.01, -W / 2 + W * i / n, 1.47, -D / 2 + 0.345, 'dark')); }
      return P; } },
  fridge: { label: 'Refrigerator', icon: '🧊', w: 0.72, d: 0.72, h: 1.8, cat: 'Kitchen', price: [22000, 38000, 95000], tall: true,
    build: (W, D, H) => [B(W, H, D, 0, 0, 0, 'appliance'), B(W - 0.02, 0.006, 0.01, 0, H * 0.62, D / 2, 'dark'), B(0.025, 0.4, 0.03, -W / 2 + 0.07, H * 0.68, D / 2 + 0.015, 'metal'), B(0.025, 0.3, 0.03, -W / 2 + 0.07, H * 0.25, D / 2 + 0.015, 'metal')] },
  toilet: { label: 'Western Toilet', icon: '🚽', w: 0.42, d: 0.68, h: 0.8, cat: 'Bath', price: [6000, 14000, 38000],
    build: () => [B(0.26, 0.32, 0.4, 0, 0, 0.08, 'ceramic'), C(0.19, 0.08, 0, 0.32, 0.12, 'ceramic'), B(0.4, 0.4, 0.18, 0, 0.38, -0.25, 'ceramic'), B(0.38, 0.02, 0.4, 0, 0.405, 0.1, 'white')] },
  wash_basin: { label: 'Wash Basin + Mirror', icon: '🚰', w: 0.6, d: 0.45, h: 1.7, cat: 'Bath', price: [4000, 11000, 30000],
    build: (W, D) => [B(W, 0.5, D - 0.05, 0, 0.3, -0.02, 'cabinet'), B(W, 0.08, D, 0, 0.8, 0, 'ceramic'), B(0.04, 0.12, 0.04, 0, 0.88, -D / 2 + 0.08, 'metal'), B(W * 0.9, 0.7, 0.03, 0, 1.05, -D / 2 + 0.02, 'mirror')] },
  shower: { label: 'Shower Enclosure', icon: '🚿', w: 0.95, d: 0.95, h: 2.0, cat: 'Bath', price: [9000, 24000, 65000], tall: true,
    build: (W, D) => [B(W, 0.05, D, 0, 0, 0, 'ceramic'), B(W, 1.95, 0.01, 0, 0.05, D / 2 - 0.01, 'glass'), B(0.01, 1.95, D, W / 2 - 0.01, 0.05, 0, 'glass'), C(0.1, 0.02, 0, 1.95, -D / 2 + 0.25, 'metal'), B(0.03, 0.03, 0.25, 0, 1.97, -D / 2 + 0.12, 'metal')] },
  bookshelf: { label: 'Bookshelf', icon: '📚', w: 0.9, d: 0.35, h: 1.9, cat: 'Storage', price: [4500, 12000, 36000], tall: true, storage: 0.5,
    build: (W, D, H) => { const P = [B(0.03, H, D, -W / 2 + 0.015, 0, 0, 'wood'), B(0.03, H, D, W / 2 - 0.015, 0, 0, 'wood'), B(W, H, 0.02, 0, 0, -D / 2 + 0.01, 'wood')];
      const cols = ['#8c5a42', '#5b6b74', '#b89a63', '#6b7560', '#7d6a62', '#e6dcc8', '#4a4744', '#c9bba4'];
      for (let i = 0; i <= 4; i++) { const y = i * (H - 0.03) / 4; P.push(B(W - 0.04, 0.025, D, 0, y, 0, 'wood'));
        if (i < 4) { let x = -W / 2 + 0.05; let k = i * 3; while (x < W / 2 - 0.12) { const bw = 0.03 + ((k * 7) % 5) * 0.008, bh = 0.2 + ((k * 13) % 7) * 0.015; P.push(B(bw, bh, D * 0.75, x + bw / 2, y + 0.025, 0.01, 'c:' + cols[k % cols.length])); x += bw + 0.004; k++; if (k % 9 === 0) x += 0.12; } } }
      return P; } },
  plant: { label: 'Indoor Plant', icon: '🪴', w: 0.45, d: 0.45, h: 1.15, cat: 'Decor', price: [800, 2500, 7500], decor: true,
    build: () => [C(0.16, 0.34, 0, 0, 0, 'pot', { c: 1.25 }), C(0.012, 0.4, 0, 0.3, 0, 'wood'), SP(0.24, 0, 0.75, 0, 'plant'), SP(0.18, 0.11, 0.92, 0.05, 'plant2'), SP(0.16, -0.1, 0.62, -0.06, 'plant')] },
  rug: { label: 'Area Rug', icon: '🟫', w: 2.0, d: 1.4, h: 0.012, cat: 'Decor', price: [3000, 9000, 32000], flat: true, decor: true,
    build: (W, D) => [B(W - 0.01, 0.01, D - 0.01, 0, 0.001, 0, 'rug'), { k: 'plane', w: W, d: D, x: 0, y: 0.0115, z: 0, role: 'rug', tex: 'rug' }] },
  floor_lamp: { label: 'Floor Lamp', icon: '💡', w: 0.4, d: 0.4, h: 1.65, cat: 'Lighting', price: [2200, 6500, 22000], decor: true,
    build: () => [C(0.16, 0.03, 0, 0, 0, 'metal'), C(0.015, 1.35, 0, 0.03, 0, 'metal'), C(0.2, 0.3, 0, 1.33, 0, 'lamp', { c: 0.65 })] },
  gaming_desk: { label: 'Gaming Setup', icon: '🎮', w: 1.5, d: 0.72, h: 1.2, cat: 'Gaming', price: [35000, 85000, 220000],
    build: (W, D) => [B(W, 0.045, D, 0, 0.72, 0, 'dark'), B(0.06, 0.72, D - 0.1, -W / 2 + 0.05, 0, 0, 'dark'), B(0.06, 0.72, D - 0.1, W / 2 - 0.05, 0, 0, 'dark'), B(W, 0.012, 0.012, 0, 0.71, D / 2 - 0.006, 'led'),
      B(0.62, 0.36, 0.03, -0.33, 0.92, -D / 2 + 0.16, 'screen', { ry: 0.25 }), B(0.62, 0.36, 0.03, 0.33, 0.92, -D / 2 + 0.16, 'screen', { ry: -0.25 }), B(0.06, 0.18, 0.06, -0.3, 0.765, -D / 2 + 0.16, 'metal'), B(0.06, 0.18, 0.06, 0.3, 0.765, -D / 2 + 0.16, 'metal'),
      B(0.22, 0.48, 0.45, W / 2 - 0.25, 0.765, -0.05, 'dark'), B(0.012, 0.44, 0.4, W / 2 - 0.36, 0.785, -0.05, 'led'), B(0.45, 0.02, 0.15, 0, 0.765, 0.12, 'dark')] },
  gaming_chair: { label: 'Gaming Chair', icon: '🪑', w: 0.65, d: 0.65, h: 1.3, cat: 'Gaming', price: [9000, 22000, 48000],
    build: () => [C(0.32, 0.05, 0, 0.03, 0, 'metal'), C(0.035, 0.42, 0, 0.05, 0, 'metal'), B(0.52, 0.1, 0.5, 0, 0.46, 0.02, 'dark'), B(0.5, 0.8, 0.08, 0, 0.56, -0.24, 'dark', { rx: -0.14 }), B(0.3, 0.6, 0.085, 0, 0.62, -0.235, 'accent', { rx: -0.14 }), B(0.06, 0.18, 0.32, -0.28, 0.52, 0, 'dark'), B(0.06, 0.18, 0.32, 0.28, 0.52, 0, 'dark')] },
  beanbag: { label: 'Bean Bag', icon: '🫘', w: 0.85, d: 0.85, h: 0.6, cat: 'Living', price: [2500, 5500, 14000], decor: true,
    build: () => [SP(0.42, 0, 0.27, 0, 'accent', { sy: 0.65 }), SP(0.3, 0, 0.42, -0.18, 'accent', { sy: 0.8 })] },
  shoe_rack: { label: 'Shoe Rack', icon: '👟', w: 0.9, d: 0.35, h: 0.95, cat: 'Storage', price: [2500, 7000, 18000], storage: 0.25,
    build: (W, D, H) => [B(W, H, D, 0, 0, 0, 'wood'), B(W - 0.02, 0.006, 0.01, 0, H / 2, D / 2, 'dark'), B(W, 0.03, D + 0.01, 0, H - 0.03, 0, 'accent')] },
  storage_cabinet: { label: 'Storage Cabinet', icon: '🗄️', w: 0.9, d: 0.45, h: 1.85, cat: 'Storage', price: [6000, 15000, 42000], tall: true, storage: 0.7,
    build: (W, D, H) => [B(W, H, D, 0, 0, 0, 'wood'), B(0.006, H - 0.04, 0.01, 0, 0.02, D / 2, 'dark'), B(0.02, 0.18, 0.02, -0.05, H * 0.5, D / 2 + 0.01, 'metal'), B(0.02, 0.18, 0.02, 0.05, H * 0.5, D / 2 + 0.01, 'metal')] },
  closet_rack: { label: 'Open Closet System', icon: '👔', w: 1.6, d: 0.55, h: 2.1, cat: 'Storage', price: [12000, 30000, 85000], tall: true, storage: 1.8, perW: true,
    build: (W, D, H) => { const P = [B(0.03, H, D, -W / 2 + 0.015, 0, 0, 'wood'), B(0.03, H, D, W / 2 - 0.015, 0, 0, 'wood'), B(0.03, H, D, 0, 0, 0, 'wood'), B(W, 0.03, D, 0, H - 0.03, 0, 'wood'), B(W, 0.03, D, 0, 0.35, 0, 'wood'), B(W, 0.02, D, 0, H - 0.4, 0, 'wood'), C(0.012, W - 0.06, -W / 2 + 0.03, 1.6, 0, 'metal', { rz: -Math.PI / 2 })];
      const cols = ['#c9b79c', '#5d6d7e', '#e8e2d6', '#9e3d2b', '#2f3e46', '#d4a73a', '#7f9c96'];
      for (let i = 0; i < Math.floor((W - 0.1) / 0.09); i++) { const x = -W / 2 + 0.08 + i * 0.09; if (Math.abs(x) < 0.05) continue; P.push(B(0.03, 0.75 + (i % 3) * 0.12, D * 0.8, x, 1.55 - 0.75 - (i % 3) * 0.12, 0, 'c:' + cols[i % cols.length])); }
      for (let i = 0; i < 5; i++) P.push(B(0.12, 0.1, 0.25, -W / 2 + 0.15 + i * (W - 0.3) / 4, 0.03, 0.05, 'dark'));
      return P; } },
  washing_machine: { label: 'Washing Machine', icon: '🧺', w: 0.62, d: 0.62, h: 0.86, cat: 'Utility', price: [16000, 28000, 60000],
    build: (W, D, H) => [B(W, H, D, 0, 0, 0, 'appliance'), C(0.2, 0.02, 0, H * 0.45, D / 2, 'dark', { rx: Math.PI / 2 }), C(0.14, 0.025, 0, H * 0.45, D / 2, 'glass2', { rx: Math.PI / 2 }), B(W - 0.04, 0.08, 0.01, 0, H - 0.12, D / 2, 'dark')] },
  crib: { label: 'Baby Crib', icon: '🧸', w: 0.75, d: 1.3, h: 1.0, cat: 'Kids', price: [7000, 16000, 40000],
    build: (W, D) => { const P = [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => B(0.05, 1.0, 0.05, a * (W / 2 - 0.025), 0, b * (D / 2 - 0.025), 'white')), B(W - 0.04, 0.05, D - 0.04, 0, 0.3, 0, 'white'), B(W - 0.08, 0.1, D - 0.08, 0, 0.35, 0, 'mattress'), B(W, 0.04, 0.04, 0, 0.92, -D / 2 + 0.02, 'white'), B(W, 0.04, 0.04, 0, 0.92, D / 2 - 0.02, 'white'), B(0.04, 0.04, D, -W / 2 + 0.02, 0.92, 0, 'white'), B(0.04, 0.04, D, W / 2 - 0.02, 0.92, 0, 'white')];
      for (let i = 1; i < 9; i++) { P.push(B(0.02, 0.58, 0.02, -W / 2 + 0.02, 0.35, -D / 2 + D * i / 9, 'white')); P.push(B(0.02, 0.58, 0.02, W / 2 - 0.02, 0.35, -D / 2 + D * i / 9, 'white')); }
      return P; } },
  treadmill: { label: 'Treadmill', icon: '🏃', w: 0.8, d: 1.85, h: 1.35, cat: 'Gym', price: [28000, 55000, 140000],
    build: (W, D) => [B(W, 0.18, D, 0, 0, 0.05, 'dark'), B(W - 0.24, 0.02, D - 0.3, 0, 0.18, 0.1, 'rubber'), B(0.05, 1.2, 0.06, -W / 2 + 0.06, 0.1, -D / 2 + 0.2, 'metal', { rx: 0.12 }), B(0.05, 1.2, 0.06, W / 2 - 0.06, 0.1, -D / 2 + 0.2, 'metal', { rx: 0.12 }), B(W - 0.05, 0.2, 0.3, 0, 1.2, -D / 2 + 0.22, 'dark', { rx: -0.4 }), B(0.3, 0.14, 0.01, 0, 1.28, -D / 2 + 0.32, 'led', { rx: -0.4 })] },
  pet_bed: { label: 'Pet Bed', icon: '🐾', w: 0.75, d: 0.6, h: 0.22, cat: 'Pets', price: [1500, 3500, 9000], decor: true,
    build: () => [C(0.34, 0.2, 0, 0, 0, 'fabric', { sy: 1 }), C(0.27, 0.12, 0, 0.06, 0, 'mattress')] },
  pooja_unit: { label: 'Pooja Mandir', icon: '🪔', w: 0.75, d: 0.45, h: 1.6, cat: 'Living', price: [8000, 22000, 65000],
    build: (W, D) => [B(W, 0.75, D, 0, 0, 0, 'wood'), B(W, 0.05, D, 0, 0.75, 0, 'metal'), B(0.05, 0.7, 0.05, -W / 2 + 0.05, 0.8, D / 2 - 0.05, 'wood'), B(0.05, 0.7, 0.05, W / 2 - 0.05, 0.8, D / 2 - 0.05, 'wood'), B(W, 0.18, D, 0, 1.42, 0, 'wood'), B(W * 0.5, 0.12, D * 0.6, 0, 1.6, 0, 'metal'), B(W - 0.1, 0.65, 0.02, 0, 0.8, -D / 2 + 0.02, 'accent'), SP(0.035, 0, 0.83, 0.1, 'diya'), SP(0.035, -0.18, 0.83, 0.1, 'diya'), SP(0.035, 0.18, 0.83, 0.1, 'diya')] },
  // ---- Indian furniture & decor (added automatically by the Indian themes, or from the "Indian" tab) ----
  jhoola: { label: 'Wooden Jhoola (swing)', icon: '🪢', w: 1.3, d: 0.65, h: 0.95, cat: 'Indian', price: [14000, 32000, 85000],
    build: (W, D) => [B(W, 0.06, D, 0, 0.42, 0, 'wood'), B(W, 0.1, 0.035, 0, 0.32, D / 2 - 0.018, 'carve'), B(W, 0.42, 0.05, 0, 0.48, -D / 2 + 0.025, 'carve'),
      B(0.05, 0.22, D, -W / 2 + 0.025, 0.48, 0, 'wood'), B(0.05, 0.22, D, W / 2 - 0.025, 0.48, 0, 'wood'), B(W - 0.14, 0.07, D - 0.12, 0, 0.48, 0.03, 'fabric'),
      C(0.075, D - 0.2, -W / 2 + 0.14, 0.6, -(D - 0.2) / 2, 'fabric2', { rx: Math.PI / 2 }), C(0.075, D - 0.2, W / 2 - 0.14, 0.6, -(D - 0.2) / 2, 'fabric2', { rx: Math.PI / 2 }),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => B(0.022, 2.5, 0.022, a * (W / 2 - 0.05), 0.48, b * (D / 2 - 0.06), 'brass')),
      ...[-1, 1].map(a => SP(0.035, a * (W / 2 - 0.05), 0.5, D / 2 - 0.06, 'brass'))] },
  diwan: { label: 'Diwan with Bolsters', icon: '🛋️', w: 1.9, d: 0.85, h: 0.8, cat: 'Indian', price: [16000, 38000, 95000],
    build: (W, D) => [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => C(0.045, 0.2, a * (W / 2 - 0.07), 0, b * (D / 2 - 0.07), 'wood', { c: 0.75 })),
      B(W, 0.12, D, 0, 0.2, 0, 'carve'), B(W - 0.04, 0.15, D - 0.04, 0, 0.32, 0, 'fabric'),
      C(0.11, D - 0.25, -W / 2 + 0.17, 0.58, -(D - 0.25) / 2, 'fabric2', { rx: Math.PI / 2 }), C(0.11, D - 0.25, W / 2 - 0.17, 0.58, -(D - 0.25) / 2, 'fabric2', { rx: Math.PI / 2 }),
      ...[-0.52, 0, 0.52].map((x, i) => B(0.5, 0.38, 0.14, x, 0.47, -D / 2 + 0.1, i === 1 ? 'fabric2' : 'accent', { rx: -0.12 }))] },
  jaali_partition: { label: 'Wooden Jaali Screen', icon: '🪟', w: 1.5, d: 0.06, h: 2.2, cat: 'Indian', price: [18000, 42000, 110000],
    build: (W, D) => { const P = [B(W, 0.08, D, 0, 0, 0, 'wood'), B(W, 0.08, D, 0, 2.12, 0, 'wood'), B(0.07, 2.2, D, -W / 2 + 0.035, 0, 0, 'wood'), B(0.07, 2.2, D, W / 2 - 0.035, 0, 0, 'wood')];
      const cw = 0.15, nx = Math.max(1, Math.floor((W - 0.14) / cw)), ny = Math.floor(2.04 / cw), x0 = -(nx * cw) / 2, y0 = 0.08 + (2.04 - ny * cw) / 2;
      for (let i = 0; i <= nx; i++) P.push(B(0.02, ny * cw, D * 0.6, x0 + i * cw, y0, 0, 'wood'));
      for (let j = 0; j <= ny; j++) P.push(B(nx * cw, 0.02, D * 0.6, 0, y0 + j * cw - 0.01, 0, 'wood'));
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) P.push(B(0.06, 0.06, D * 0.5, x0 + (i + 0.5) * cw + 0.0212, y0 + (j + 0.5) * cw - 0.0212, 0, 'wood', { rz: Math.PI / 4 }));
      return P; } },
  urli: { label: 'Brass Urli with Flowers', icon: '🌼', w: 0.6, d: 0.6, h: 0.42, cat: 'Indian', price: [3500, 9000, 26000], decor: true,
    build: () => [C(0.15, 0.22, 0, 0, 0, 'carve'), C(0.2, 0.03, 0, 0.21, 0, 'brass'), C(0.18, 0.13, 0, 0.24, 0, 'brass', { c: 1.6 }), C(0.27, 0.006, 0, 0.368, 0, 'water'),
      ...[[0.12, 0.05, '#ff9a1a'], [-0.1, 0.09, '#ffb72e'], [0.02, -0.13, '#d6304f'], [-0.08, -0.06, '#ff9a1a'], [0.14, -0.1, '#f5f0e6'], [-0.15, 0.0, '#d6304f']].map(([x, z, c]) => SP(0.035, x, 0.38, z, 'c:' + c, { sy: 0.6 })), SP(0.022, 0.02, 0.385, 0.03, 'diya')] },
  brass_lamp: { label: 'Brass Deepstambh (lamp)', icon: '🪔', w: 0.4, d: 0.4, h: 1.3, cat: 'Indian', price: [4500, 12000, 38000], decor: true,
    build: () => [C(0.17, 0.04, 0, 0, 0, 'brass', { c: 0.8 }), C(0.1, 0.06, 0, 0.04, 0, 'brass', { c: 0.4 }), C(0.025, 1.05, 0, 0.1, 0, 'brass'), C(0.14, 0.025, 0, 0.55, 0, 'brass', { c: 1.15 }),
      C(0.1, 0.025, 0, 0.85, 0, 'brass', { c: 1.15 }), C(0.07, 0.03, 0, 1.13, 0, 'brass', { c: 1.2 }), SP(0.035, 0, 1.22, 0, 'brass'),
      ...[0, 1, 2, 3, 4].map(k => SP(0.018, Math.cos(k * 1.2566) * 0.13, 0.59, Math.sin(k * 1.2566) * 0.13, 'diya')), ...[0, 1, 2].map(k => SP(0.018, Math.cos(k * 2.094) * 0.09, 0.89, Math.sin(k * 2.094) * 0.09, 'diya'))] },
  bed_carved: { label: 'Carved Teak Bed', icon: '🛏️', w: 1.8, d: 2.1, h: 1.5, cat: 'Indian', price: [38000, 85000, 220000],
    build: (W, D) => [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => C(0.05, 0.25, a * (W / 2 - 0.06), 0, b * (D / 2 - 0.06), 'wood', { c: 0.8 })),
      B(W, 0.25, D, 0, 0.1, 0, 'carve'), B(W - 0.06, 0.22, D - 0.14, 0, 0.35, 0.05, 'mattress'),
      B(W * 0.4, 0.12, 0.34, -W * 0.24, 0.57, -D / 2 + 0.32, 'white'), B(W * 0.4, 0.12, 0.34, W * 0.24, 0.57, -D / 2 + 0.32, 'white'), B(W - 0.02, 0.06, D * 0.55, 0, 0.55, D * 0.2, 'fabric2'),
      B(W - 0.1, 0.95, 0.06, 0, 0.35, -D / 2 + 0.04, 'carve'), B(W + 0.04, 0.1, 0.1, 0, 1.3, -D / 2 + 0.05, 'wood'),
      ...[-1, 1].map(a => C(0.06, 1.45, a * (W / 2 - 0.02), 0, -D / 2 + 0.05, 'wood')), ...[-1, 1].map(a => SP(0.07, a * (W / 2 - 0.02), 1.5, -D / 2 + 0.05, 'brass')),
      B(W - 0.1, 0.3, 0.05, 0, 0.3, D / 2 - 0.03, 'carve'), ...[-1, 1].map(a => C(0.05, 0.75, a * (W / 2 - 0.02), 0, D / 2 - 0.04, 'wood')), ...[-1, 1].map(a => SP(0.055, a * (W / 2 - 0.02), 0.8, D / 2 - 0.04, 'brass'))] },
  outdoor_chair: { label: 'Rattan Chair', icon: '🪑', w: 0.65, d: 0.65, h: 0.8, cat: 'Outdoor', price: [3500, 8500, 22000],
    build: (W, D) => [B(W, 0.08, D, 0, 0.35, 0, 'rattan'), B(W, 0.4, 0.06, 0, 0.42, -D / 2 + 0.03, 'rattan', { rx: -0.15 }), ...legs4(W, D, 0.35, 0.04, 0.04, 'rattan'), B(W - 0.1, 0.08, D - 0.15, 0, 0.43, 0.05, 'fabric2')] },
  side_table_round: { label: 'Round Side Table', icon: '⚪', w: 0.55, d: 0.55, h: 0.55, cat: 'Outdoor', price: [1800, 4500, 12000], decor: true,
    build: () => [C(0.27, 0.035, 0, 0.5, 0, 'wood'), C(0.025, 0.5, 0, 0, 0, 'metal'), C(0.16, 0.02, 0, 0, 0, 'metal')] },
  bathtub: { label: 'Bathtub', icon: '🛁', w: 0.8, d: 1.7, h: 0.6, cat: 'Bath', price: [18000, 45000, 140000],
    build: (W, D) => [B(W, 0.5, D, 0, 0, 0, 'ceramic'), B(W - 0.14, 0.03, D - 0.14, 0, 0.49, 0, 'water'), C(0.025, 0.2, 0, 0.5, -D / 2 + 0.05, 'metal')] },
};
const CAT_ORDER = ['Bedroom', 'Living', 'Indian', 'Dining', 'Kitchen', 'Bath', 'Office', 'Storage', 'Gaming', 'Kids', 'Gym', 'Outdoor', 'Utility', 'Decor', 'Lighting', 'Pets'];
const TIER_IX = { budget: 0, standard: 1, premium: 2 };
const TIERS = ['budget', 'standard', 'premium'];

/* ---------- application state ---------- */
const S = {
  prefs: { style: 'Japandi', budget: 1000000, colors: ['#b5c4a8', '#e3d4b8'], family: 4, pets: false, kids: false, wfh: true, storage: 'medium', furniture: 'standard', onboarded: false },
  backendUrl: '', aiProvider: 'auto', cfToken: '', cfAccount: '', cfModel: '', orKey: '', orModel: 'qwen/qwen3.5-27b', ollamaModel: 'qwen3.5:9b', backend: null, backendOK: false, backendAt: 0,
  project: null, sel: null, view: '3d', panel: 'design', history: [], future: [], variants: [], original: null,
  hour: 10, cutaway: false, roof: false, labels: true, overlay: 'none', projects: [], structuralLog: [],
};
const store = {
  get(k, d) { try { const v = localStorage.getItem('dimora_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('dimora_' + k, JSON.stringify(v)); } catch (e) { } },
};

/* ---------- cloud accounts & sync ----------
   Two kinds of account:
   • "google": real Google Sign-In through Firebase Auth; homes and preferences live in Cloud Firestore under
     users/{uid}/… (security rules let each user read and write only their own documents).
   • "cloud":  email + password accounts on the DIMORA server (REST API) — used when Firebase isn't configured. */
const CLOUD = { token: store.get('token', null), list: null, timers: new Map(), warned: false };
const cloudKind = () => { const u = currentUser(); if (!u) return null; if (u.method === 'google' && AUTH_CONFIG.firebase) return 'fs'; if (u.method === 'cloud' && CLOUD.token) return 'server'; return null; };
const isCloud = () => !!cloudKind();
const projOwner = () => { const u = currentUser(); return !u ? 'device' : u.method === 'cloud' ? u.id : u.method === 'google' ? 'g:' + u.uid : 'device'; };
function cloudSummary(pj, thumb) { return { thumb: thumb && thumb.length < 200000 ? thumb : null, rooms: pj.floors.reduce((s, f) => s + f.rooms.length, 0), cost: (() => { try { return withProjectSync(pj, () => homeCost().total); } catch (e) { return 0; } })(), theme: pj.theme, floors: pj.floors.length }; }
function withProjectSync(p, fn) { const keep = S.project; S.project = p; try { return fn(); } finally { S.project = keep; } }

/* Firestore driver. A document holds at most 1 MiB, so a home is stored as a small metadata document
   (name, date, summary for the dashboard) plus its JSON split into ~700 KB chunk documents. */
const FS = { db: null, user: null, wait: null };
const FS_CHUNK = 700000;
async function fsReady() {
  if (FS.db && FS.user) return FS;
  const fb = await initFirebase(); if (!fb) throw new Error('Google sign-in is not available');
  if (!window.firebase.firestore) await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore-compat.js`);
  FS.db = FS.db || window.firebase.firestore();
  FS.user = fb.currentUser || await (FS.wait = FS.wait || new Promise(res => { const off = fb.onAuthStateChanged(u => { off(); FS.wait = null; res(u); }); }));
  if (!FS.user) { const e = new Error('Your Google session ended — please sign in again.'); e.code = 'auth'; throw e; }
  return FS;
}
const fsUserDoc = () => FS.db.collection('users').doc(FS.user.uid);
const fsProj = id => fsUserDoc().collection('projects').doc(id);
async function fsPut(pj, summary) {
  await fsReady(); const json = JSON.stringify(pj), n = Math.max(1, Math.ceil(json.length / FS_CHUNK));
  if (json.length > 9 * 1024 * 1024) throw new Error('this home is too large to save online (over 9 MB) — remove the plan image to save it');
  const ref = fsProj(pj.id), old = await ref.get(), oldN = old.exists ? (old.data().n || 0) : 0, batch = FS.db.batch();
  for (let i = 0; i < n; i++) batch.set(ref.collection('chunks').doc(String(i)), { d: json.slice(i * FS_CHUNK, (i + 1) * FS_CHUNK) });
  for (let i = n; i < oldN; i++) batch.delete(ref.collection('chunks').doc(String(i)));
  batch.set(ref, { id: pj.id, name: String(pj.name || 'My Home').slice(0, 120), updated: pj.updated || Date.now(), n, size: json.length, summary: summary || {} });
  await batch.commit();
}
async function fsList() { await fsReady(); const q = await fsUserDoc().collection('projects').get(); return q.docs.map(d => { const x = d.data(); return Object.assign({}, x.summary || {}, { id: x.id || d.id, name: x.name, updated: x.updated }); }).sort((a, b) => b.updated - a.updated); }
async function fsGet(id) {
  await fsReady(); const ref = fsProj(id), meta = await ref.get(); if (!meta.exists) throw new Error('Project not found.');
  const n = meta.data().n || 1, parts = await Promise.all(Array.from({ length: n }, (_, i) => ref.collection('chunks').doc(String(i)).get()));
  return JSON.parse(parts.map(p => (p.exists ? p.data().d : '')).join(''));
}
async function fsDel(id) { await fsReady(); const ref = fsProj(id), meta = await ref.get(), n = meta.exists ? (meta.data().n || 0) : 0, batch = FS.db.batch(); for (let i = 0; i < Math.max(n, 1); i++) batch.delete(ref.collection('chunks').doc(String(i))); batch.delete(ref); await batch.commit(); }
async function fsLoadProfile() { await fsReady(); const d = await fsUserDoc().get(); return d.exists ? d.data() : null; }
async function fsSaveProfile(data) { await fsReady(); await fsUserDoc().set(data, { merge: true }); }
async function fsDeleteAll() { const list = await fsList(); for (const p of list) await fsDel(p.id); await fsUserDoc().delete(); }

/* one interface for both kinds of account */
const cloudPut = (pj, summary) => cloudKind() === 'fs' ? fsPut(pj, summary) : API.req('/api/projects/' + encodeURIComponent(pj.id), { method: 'PUT', body: { project: pj, summary }, timeout: 60000 });
const cloudDel = id => cloudKind() === 'fs' ? fsDel(id) : API.req('/api/projects/' + encodeURIComponent(id), { method: 'DELETE', timeout: 20000 });
function cloudPush(pj, thumb) { // debounced upload of one project
  if (!isCloud()) return; clearTimeout(CLOUD.timers.get(pj.id)); setSyncChip('busy');
  CLOUD.timers.set(pj.id, setTimeout(async () => {
    CLOUD.timers.delete(pj.id); if (!store.get('projects', []).some(p => p.id === pj.id)) return; // deleted meanwhile: don't bring it back
    try { await cloudPut(pj, cloudSummary(pj, thumb)); S.cloudSaved = Date.now(); setSyncChip('ok'); }
    catch (e) { if (e.code === 'auth') return fbSessionEnded(); setSyncChip('err', e.message); if (!CLOUD.warned) { CLOUD.warned = true; toast('Couldn\'t save to your account (' + e.message + ') — it\'s kept on this device and will retry.', 5000); } }
  }, 1200));
}
function setSyncChip(st, msg) { const el = document.getElementById('sync-chip'); if (!el) return; el.hidden = !isCloud(); el.className = 'sync-chip ' + st; el.textContent = st === 'ok' ? '☁ Saved' : st === 'err' ? '☁ Offline' : '☁ Saving…'; el.title = st === 'err' ? 'Not saved to your account yet: ' + (msg || '') : cloudKind() === 'fs' ? 'Saved to your Google account (Cloud Firestore)' : 'Saved to your DIMORA account'; }
async function cloudList() { if (!isCloud()) return null; try { CLOUD.list = cloudKind() === 'fs' ? await fsList() : (await API.req('/api/projects', { timeout: 20000 })).projects; } catch (e) { CLOUD.list = null; if (e.code === 'auth') fbSessionEnded(); } return CLOUD.list; }
async function cloudFetch(id) { if (cloudKind() === 'fs') return fsGet(id); const j = await API.req('/api/projects/' + encodeURIComponent(id), { timeout: 60000 }); return j.project; }
async function cloudSavePrefs() { if (!isCloud()) return; const u = currentUser(); const prefs = { answers: u.answers || null, prefs: S.prefs };
  try { if (cloudKind() === 'fs') await fsSaveProfile({ name: u.name || '', email: u.email || '', prefs, updated: Date.now() }); else await API.req('/api/auth/me', { method: 'PATCH', body: { name: u.name, prefs }, timeout: 20000 }); } catch (e) { } }
async function syncDeviceProjectsUp() { // projects made on this device before signing in move into the account
  const mine = store.get('projects', []).filter(p => !p.owner || p.owner === 'device'); let n = 0;
  for (const meta of mine) { const pj = store.get('proj_' + meta.id); if (!pj) continue; try { await cloudPut(pj, cloudSummary(pj, meta.thumb)); meta.owner = projOwner(); n++; } catch (e) { break; } }
  if (n) { const all = store.get('projects', []).map(p => mine.find(m => m.id === p.id) || p); store.set('projects', all); toast(`Saved ${n} project${n > 1 ? 's' : ''} from this device to your account`); if ($('#app').dataset.screen === 'dash') renderDash(); }
}
function cloudExpired() { if (!CLOUD.token) return; CLOUD.token = null; store.set('token', null); const u = store.get('user', null); if (u && u.method === 'cloud') { u.loggedIn = false; store.set('user', u); } AUTH.err = 'Your session expired — please sign in again.'; AUTH.mode = 'login'; show('login'); renderAuth(); }
function fbSessionEnded() { const u = store.get('user', null); if (!u || u.method !== 'google') return; u.loggedIn = false; store.set('user', u); FS.user = null; AUTH.err = 'Your Google session ended — please sign in again.'; show('login'); renderAuth(); }

function newProject(name = 'My Home') {
  return { id: uid('p'), name, created: Date.now(), updated: Date.now(), north: 0, theme: S.prefs.style || 'Japandi', scaleNote: '', wallThickness: null, floors: [newFloor('Ground Floor', 0)], activeFloor: 0, planImage: null };
}
function newFloor(name, level) { return { id: uid('f'), name, level, height: 2.9, rooms: [], doors: [], windows: [], stairs: [] }; }
const P = () => S.project;
async function withProject(p, fn) { const keep = S.project; S.project = p; try { return await fn(); } finally { S.project = keep; } }
const FL = () => S.project.floors[S.project.activeFloor];
const allRooms = () => S.project ? S.project.floors.flatMap(f => f.rooms) : [];
function findRoom(id) { for (const f of S.project.floors) { const r = f.rooms.find(r => r.id === id); if (r) return r; } return null; }
function floorOfRoom(room) { return S.project.floors.find(f => f.rooms.includes(room)) || FL(); }
function findItem(id) { for (const f of S.project.floors) for (const r of f.rooms) { const it = r.furniture.find(i => i.id === id); if (it) return { it, room: r, floor: f }; } return null; }
function makeRoom(o) {
  const t = ROOM_TYPES[o.type] ? o.type : 'empty';
  const th = THEMES[S.project?.theme || 'Japandi'];
  return Object.assign({ id: uid('r'), name: ROOM_TYPES[t].label, type: t, x: 0, y: 0, w: 3, d: 3, wall: null, floor: null, tier: S.prefs.furniture || 'standard', ceiling: null, lights: { ambient: true, task: t !== 'hall', accent: false }, curtains: true, theme: null, furniture: [] }, o, { type: t });
}
function roomTheme(room) { return THEMES[room.theme || S.project.theme] || THEMES.Japandi; }
const WOODY = new Set(['oak', 'walnut', 'herringbone', 'vinyl']), STONY = new Set(['marble', 'indian_marble', 'vitrified', 'athangudi', 'kota', 'granite']);
function roomFloorKey(room) { if (room.floor) return room.floor;
  { const th = roomTheme(room), t = room.type;
    if (['bedroom', 'master', 'guest', 'nursery', 'study', 'office', 'reading', 'gaming'].includes(t)) return WOODY.has(th.floor) ? th.floor : 'oak';
    if (['living', 'dining', 'hall', 'pooja'].includes(t)) return STONY.has(th.floor) ? th.floor : 'vitrified';
    if (['kitchen', 'bathroom', 'utility'].includes(t)) return 'antiskid';
    if (t === 'store') return 'concrete'; if (t === 'porch') return 'sandstone'; } if (room.type === 'parking') return facade().drive || 'pavers'; if (room.type === 'garage') return 'concrete'; if (room.type === 'garden') return 'lawn'; const th = roomTheme(room); if (['bathroom', 'utility'].includes(room.type)) return th.wet; if (room.type === 'balcony') return 'deck'; if (room.type === 'kitchen') return th.floor === 'oak' || th.floor === 'walnut' || th.floor === 'carpet' ? 'vitrified' : th.floor; return th.floor; }
function roomWall(room) { if (room.wall) return room.wall; if (room.type === 'garage') return '#e8e7e3'; const th = roomTheme(room); const i = Object.keys(ROOM_TYPES).indexOf(room.type); return th.walls[i % th.walls.length]; }
function roomCeiling(room) { return room.ceiling || (['bathroom', 'balcony', 'utility', 'hall'].includes(room.type) ? 'flat' : roomTheme(room).ceiling); }
const area = r => r.w * r.d;
const inRoom = (r, x, y, m = 0) => x >= r.x - m && x <= r.x + r.w + m && y >= r.y - m && y <= r.y + r.d + m;
function roomAt(x, y, floor = FL()) { let best = null; floor.rooms.forEach(r => { if (inRoom(r, x, y) && (!best || area(r) < area(best))) best = r; }); return best; }
function itemFootprint(it) { const a = ((it.rot % 360) + 360) % 360; const sw = (a === 90 || a === 270); const w = sw ? it.d : it.w, d = sw ? it.w : it.d; return { x: it.x - w / 2, y: it.y - d / 2, w, d }; }
function rectOverlap(a, b) { const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y); return ox > 0 && oy > 0 ? ox * oy : 0; }
function homeBounds(floor) {
  const rooms = floor ? floor.rooms : allRooms(); if (!rooms.length) return { x: 0, y: 0, w: 10, d: 8 };
  const x0 = Math.min(...rooms.map(r => r.x)), y0 = Math.min(...rooms.map(r => r.y)), x1 = Math.max(...rooms.map(r => r.x + r.w)), y1 = Math.max(...rooms.map(r => r.y + r.d));
  return { x: x0, y: y0, w: x1 - x0, d: y1 - y0 };
}
function makeItem(type, room, extra = {}) {
  const c = CATALOG[type]; if (!c) return null;
  return Object.assign({ id: uid('i'), type, x: room.x + room.w / 2, y: room.y + room.d / 2, rot: 0, w: c.w, d: c.d, h: c.h, tier: room.tier || 'standard', color: null, finish: null }, extra);
}

/* ---------- walls & openings ---------- */
function wallLines(floor) {
  const map = new Map();
  const add = (o, c, a, b) => { const k = o + ':' + Math.round(c * 20); if (!map.has(k)) map.set(k, { o, c, iv: [] }); map.get(k).iv.push([Math.min(a, b), Math.max(a, b)]); };
  floor.rooms.forEach(r => { add('h', r.y, r.x, r.x + r.w); add('h', r.y + r.d, r.x, r.x + r.w); add('v', r.x, r.y, r.y + r.d); add('v', r.x + r.w, r.y, r.y + r.d); });
  const lines = [];
  map.forEach(L => {
    L.iv.sort((a, b) => a[0] - b[0]); const m = [];
    L.iv.forEach(iv => { if (m.length && iv[0] <= m[m.length - 1][1] + 0.02) m[m.length - 1][1] = Math.max(m[m.length - 1][1], iv[1]); else m.push(iv.slice()); });
    m.forEach(([a, b]) => lines.push({ o: L.o, c: L.c, a, b }));
  });
  const open = openSpans(floor); if (!open.length) return lines;
  const out = [];
  lines.forEach(L => { let segs = [[L.a, L.b]];
    open.forEach(e => { if (e.o !== L.o || Math.abs(e.c - L.c) > 0.1) return;
      segs = segs.flatMap(([a, b]) => { const lo = Math.max(a, e.lo), hi = Math.min(b, e.hi); if (hi - lo < 0.05) return [[a, b]]; const o = []; if (lo - a > 0.05) o.push([a, lo]); if (b - hi > 0.05) o.push([hi, b]); return o; }); });
    segs.forEach(([a, b]) => out.push({ o: L.o, c: L.c, a, b })); });
  return out;
}
const sameGroup = (a, b) => !!(a.group && a.group === b.group);
/* edges shared by two parts of one open-plan space (same group): drawn without a wall */
function openSpans(floor) { const out = [], R = floor.rooms; for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) if (sameGroup(R[i], R[j])) { const e = sharedEdge(R[i], R[j]); if (e) out.push(e); } return out; }
function isExteriorPoint(floor, o, c, t) { // point on wall line; exterior if one side is outside all rooms
  const e = 0.12; const p1 = o === 'h' ? [t, c - e] : [c - e, t], p2 = o === 'h' ? [t, c + e] : [c + e, t];
  const in1 = floor.rooms.some(r => !isOpenAir(r) && inRoom(r, p1[0], p1[1])), in2 = floor.rooms.some(r => !isOpenAir(r) && inRoom(r, p2[0], p2[1]));
  return in1 !== in2;
}
function openingsOn(floor, L) {
  const res = [];
  floor.doors.concat(garageDoors(floor)).forEach(d => { if (d.o === L.o && Math.abs((L.o === 'h' ? d.y : d.x) - L.c) < 0.2) { const t = L.o === 'h' ? d.x : d.y; if (t > L.a - 0.05 && t < L.b + 0.05) res.push({ kind: 'door', ref: d, a: Math.max(L.a, t - d.w / 2), b: Math.min(L.b, t + d.w / 2) }); } });
  floor.windows.forEach(d => { if (d.o === L.o && Math.abs((L.o === 'h' ? d.y : d.x) - L.c) < 0.2) { const t = L.o === 'h' ? d.x : d.y; if (t > L.a - 0.05 && t < L.b + 0.05) res.push({ kind: 'window', ref: d, a: Math.max(L.a, t - d.w / 2), b: Math.min(L.b, t + d.w / 2) }); } });
  return res.sort((p, q) => p.a - q.a);
}
// pieces: [{o,c,a,b,y0,y1,kind}]
/* split a wall line by what lies on each side: indoor room → wall, balcony edge to the open → railing,
   yard / open air on both sides → nothing at all */
function edgeKinds(floor, L) {
  const e = 0.12, side = (t, sg) => { const p = L.o === 'h' ? [t, L.c + sg * e] : [L.c + sg * e, t]; let best = null; floor.rooms.forEach(r => { if (inRoom(r, p[0], p[1]) && (!best || area(r) < area(best))) best = r; }); return best; };
  const cuts = new Set([L.a, L.b]); floor.rooms.forEach(r => { (L.o === 'h' ? [r.x, r.x + r.w] : [r.y, r.y + r.d]).forEach(v => { if (v > L.a + 0.01 && v < L.b - 0.01) cuts.add(v); }); });
  const ts = [...cuts].sort((a, b) => a - b), out = [];
  for (let i = 0; i < ts.length - 1; i++) {
    const m = (ts[i] + ts[i + 1]) / 2, A = side(m, -1), B = side(m, 1);
    const balA = !!A && A.type === 'balcony', balB = !!B && B.type === 'balcony';
    const kind = (A && !isOpenAir(A)) || (B && !isOpenAir(B)) ? 'wall' : balA !== balB ? 'rail' : 'none';
    const last = out[out.length - 1]; if (last && last.kind === kind) last.b = ts[i + 1]; else out.push({ kind, a: ts[i], b: ts[i + 1] });
  }
  return out;
}
function wallPieces(floor) {
  const H = floor.height, out = [];
  wallLines(floor).flatMap(L0 => edgeKinds(floor, L0).filter(sg => sg.kind !== 'none' && sg.b - sg.a > 0.02).map(sg => ({ o: L0.o, c: L0.c, a: sg.a, b: sg.b, rail: sg.kind === 'rail' }))).forEach(L => {
    if (L.rail) { out.push({ o: L.o, c: L.c, a: L.a, b: L.b, y0: 0, y1: 1.05, kind: 'rail', ext: true }); return; }
    const ext = isExteriorPoint(floor, L.o, L.c, (L.a + L.b) / 2);
    let cur = L.a;
    openingsOn(floor, L).forEach(op => {
      if (op.a > cur + 0.01) out.push({ o: L.o, c: L.c, a: cur, b: op.a, y0: 0, y1: H, kind: 'solid', ext });
      if (op.kind === 'door') out.push({ o: L.o, c: L.c, a: op.a, b: op.b, y0: Math.min(H - 0.15, op.ref.h || DOOR_H), y1: H, kind: 'lintel', ext, ref: op.ref });
      else { const w = op.ref; out.push({ o: L.o, c: L.c, a: op.a, b: op.b, y0: 0, y1: w.sill, kind: 'sill', ext, ref: w }); out.push({ o: L.o, c: L.c, a: op.a, b: op.b, y0: Math.min(H, w.sill + w.h), y1: H, kind: 'head', ext, ref: w }); }
      cur = Math.max(cur, op.b);
    });
    if (L.b > cur + 0.01) out.push({ o: L.o, c: L.c, a: cur, b: L.b, y0: 0, y1: H, kind: 'solid', ext });
  });
  return out;
}
// which side of room an opening lies on
function roomSideOf(room, o, x, y) {
  if (o === 'h') { if (Math.abs(y - room.y) < 0.2 && x >= room.x - 0.05 && x <= room.x + room.w + 0.05) return 'N'; if (Math.abs(y - room.y - room.d) < 0.2 && x >= room.x - 0.05 && x <= room.x + room.w + 0.05) return 'S'; }
  else { if (Math.abs(x - room.x) < 0.2 && y >= room.y - 0.05 && y <= room.y + room.d + 0.05) return 'W'; if (Math.abs(x - room.x - room.w) < 0.2 && y >= room.y - 0.05 && y <= room.y + room.d + 0.05) return 'E'; }
  return null;
}
function roomOpenings(room, floor) {
  const res = [];
  floor.doors.forEach(d => { const s = roomSideOf(room, d.o, d.x, d.y); if (s) res.push({ kind: 'door', side: s, t: d.o === 'h' ? d.x : d.y, w: d.w, ref: d }); });
  floor.windows.forEach(d => { const s = roomSideOf(room, d.o, d.x, d.y); if (s) res.push({ kind: 'window', side: s, t: d.o === 'h' ? d.x : d.y, w: d.w, ref: d, ext: isExteriorPoint(floor, d.o, d.o === 'h' ? d.y : d.x, d.o === 'h' ? d.x : d.y) }); });
  return res;
}
function doorSwingRect(room, op) {
  const s = Math.min(op.w, 1.0);
  if (op.side === 'N') return { x: op.t - op.w / 2, y: room.y, w: op.w, d: s };
  if (op.side === 'S') return { x: op.t - op.w / 2, y: room.y + room.d - s, w: op.w, d: s };
  if (op.side === 'W') return { x: room.x, y: op.t - op.w / 2, w: s, d: op.w };
  return { x: room.x + room.w - s, y: op.t - op.w / 2, w: s, d: op.w };
}
function sharedEdge(a, b) {
  const t = 0.15;
  if (Math.abs(a.x + a.w - b.x) < t || Math.abs(b.x + b.w - a.x) < t) { const c = Math.abs(a.x + a.w - b.x) < t ? (a.x + a.w + b.x) / 2 : (b.x + b.w + a.x) / 2; const lo = Math.max(a.y, b.y), hi = Math.min(a.y + a.d, b.y + b.d); if (hi - lo > 0.6) return { o: 'v', c, lo, hi }; }
  if (Math.abs(a.y + a.d - b.y) < t || Math.abs(b.y + b.d - a.y) < t) { const c = Math.abs(a.y + a.d - b.y) < t ? (a.y + a.d + b.y) / 2 : (b.y + b.d + a.y) / 2; const lo = Math.max(a.x, b.x), hi = Math.min(a.x + a.w, b.x + b.w); if (hi - lo > 0.6) return { o: 'h', c, lo, hi }; }
  return null;
}
function doorBetween(a, b, floor) {
  const e = sharedEdge(a, b); if (!e) return null;
  return floor.doors.find(d => d.o === e.o && Math.abs((e.o === 'h' ? d.y : d.x) - e.c) < 0.2 && (e.o === 'h' ? d.x : d.y) > e.lo - 0.05 && (e.o === 'h' ? d.x : d.y) < e.hi + 0.05) || null;
}
function connectivity(floor) {
  const R = floor.rooms, adj = new Map(R.map(r => [r.id, []]));
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { if (doorBetween(R[i], R[j], floor) || (sameGroup(R[i], R[j]) && sharedEdge(R[i], R[j]))) { adj.get(R[i].id).push(R[j].id); adj.get(R[j].id).push(R[i].id); } }
  const entryDoor = floor.doors.find(d => d.main) || floor.doors.find(d => isExteriorPoint(floor, d.o, d.o === 'h' ? d.y : d.x, d.o === 'h' ? d.x : d.y));
  let start = null;
  const arr = S.project && S.project.floors.includes(floor) ? stairsBelow(floor)[0] : null;
  if (arr) start = roomAt(...stairEnd(arr, 'high', 0.5), floor);
  if (!start && entryDoor) start = R.find(r => roomSideOf(r, entryDoor.o, entryDoor.x, entryDoor.y));
  if (!start) start = R.find(r => r.type === 'living') || R[0];
  const order = [], seen = new Set(); const q = start ? [start.id] : [];
  if (start) seen.add(start.id);
  while (q.length) { const id = q.shift(); order.push(id); (adj.get(id) || []).forEach(n => { if (!seen.has(n)) { seen.add(n); q.push(n); } }); }
  return { adj, order, start, entryDoor, unreachable: R.filter(r => !seen.has(r.id)) };
}
// ensure doors & windows exist (used after detection)
function autoOpenings(floor, { doors = true, windows = true, main = true } = {}) {
  const R = floor.rooms; const hubs = ['living', 'dining', 'hall'];
  const pri = r => hubs.includes(r.type) ? 0 : r.type === 'kitchen' ? 1 : 2;
  const addDoor = (a, b) => { if (sameGroup(a, b)) return false; const e = sharedEdge(a, b); if (!e || doorBetween(a, b, floor)) return false; const w = (a.type === 'bathroom' || b.type === 'bathroom') ? 0.75 : 0.9; const t = clamp((e.lo + e.hi) / 2, e.lo + w / 2 + 0.1, e.hi - w / 2 - 0.1); floor.doors.push({ id: uid('d'), o: e.o, x: e.o === 'h' ? t : e.c, y: e.o === 'h' ? e.c : t, w }); return true; };
  if (doors) {
    R.forEach(a => R.forEach(b => { if (a !== b && pri(a) === 0 && pri(b) <= 1 && a.id < b.id) addDoor(a, b); }));
    const PREF = { bathroom: ['master', 'bedroom', 'hall', 'living'], utility: ['kitchen', 'hall', 'dining'], balcony: ['living', 'master', 'bedroom'], closet: ['master', 'bedroom'], pooja: ['living', 'hall', 'dining'] };
    const score = (r, o) => { const l = PREF[r.type]; if (l && l.includes(o.type)) return l.indexOf(o.type); return 10 + pri(o) + (o.type === 'bathroom' ? 20 : 0); };
    const order = R.slice().sort((a, b) => (a.type === 'bathroom') - (b.type === 'bathroom'));
    order.forEach(r => { if (pri(r) < 2) return; if (connectivity(floor).adj.get(r.id).length) return; const nb = R.filter(o => o !== r && sharedEdge(r, o)).sort((p, q) => score(r, p) - score(r, q)); if (nb.length) addDoor(r, nb[0]); });
    for (let k = 0; k < 6; k++) { const c = connectivity(floor); if (!c.unreachable.length) break; const u = c.unreachable[0]; const nb = R.filter(o => o !== u && sharedEdge(u, o) && !c.unreachable.includes(o)); if (nb.length) addDoor(u, nb.sort((p, q) => pri(p) - pri(q))[0]); else break; }
    if (main && !floor.doors.some(d => d.main)) {
      const lv = R.find(r => r.type === 'living') || R.slice().sort((a, b) => area(b) - area(a))[0];
      if (lv) { const sides = [['h', lv.y, lv.x, lv.x + lv.w], ['h', lv.y + lv.d, lv.x, lv.x + lv.w], ['v', lv.x, lv.y, lv.y + lv.d], ['v', lv.x + lv.w, lv.y, lv.y + lv.d]];
        let best = null; sides.forEach(([o, c, a, b]) => { const t = (a + b) / 2; if (isExteriorPoint(floor, o, c, t)) { const len = b - a; if (!best || len > best.len) best = { o, c, t: a + Math.min(1.0, len / 3), len }; } });
        if (best) floor.doors.push({ id: uid('d'), o: best.o, x: best.o === 'h' ? best.t : best.c, y: best.o === 'h' ? best.c : best.t, w: 1.0, main: true }); }
    }
  }
  if (windows) R.forEach(r => {
    const sides = [['h', r.y, r.x, r.x + r.w], ['h', r.y + r.d, r.x, r.x + r.w], ['v', r.x, r.y, r.y + r.d], ['v', r.x + r.w, r.y, r.y + r.d]];
    let n = 0;
    sides.sort((p, q) => (q[3] - q[2]) - (p[3] - p[2])).forEach(([o, c, a, b]) => {
      if (n >= (r.type === 'living' || r.type === 'master' ? 2 : 1)) return;
      const len = b - a; const t = (a + b) / 2; if (len < 1.2 || !isExteriorPoint(floor, o, c, t)) return;
      const blocked = floor.doors.some(d => d.o === o && Math.abs((o === 'h' ? d.y : d.x) - c) < 0.2 && Math.abs((o === 'h' ? d.x : d.y) - t) < (d.w / 2 + 0.8));
      const wt = blocked ? (a + len * 0.75) : t;
      if (floor.windows.some(w => w.o === o && Math.abs((o === 'h' ? w.y : w.x) - c) < 0.2 && Math.abs((o === 'h' ? w.x : w.y) - wt) < 1)) { n++; return; }
      const bath = r.type === 'bathroom'; const ww = bath ? 0.6 : r.type === 'balcony' ? Math.min(2.4, len - 0.6) : Math.min(r.type === 'living' ? 1.8 : 1.4, len - 0.6);
      floor.windows.push({ id: uid('w'), o, x: o === 'h' ? wt : c, y: o === 'h' ? c : wt, w: r2(ww), sill: bath ? 1.5 : r.type === 'balcony' ? 0.15 : 0.9, h: bath ? 0.6 : r.type === 'balcony' ? 2.0 : 1.25 });
      n++;
    });
  });
}
function snapRooms(floor, tol = 0.25) {
  const xs = [], ys = [];
  floor.rooms.forEach(r => { xs.push(r.x, r.x + r.w); ys.push(r.y, r.y + r.d); });
  const cluster = arr => { const s = [...arr].sort((a, b) => a - b), groups = []; s.forEach(v => { const g = groups[groups.length - 1]; if (g && v - g[g.length - 1] < tol) g.push(v); else groups.push([v]); }); return v => { const g = groups.find(g => v >= g[0] - 1e-9 && v <= g[g.length - 1] + 1e-9); return g ? snap(g.reduce((a, b) => a + b, 0) / g.length, 0.05) : v; }; };
  const fx = cluster(xs), fy = cluster(ys);
  floor.rooms.forEach(r => { const x0 = fx(r.x), x1 = fx(r.x + r.w), y0 = fy(r.y), y1 = fy(r.y + r.d); r.x = r2(x0); r.w = r2(Math.max(0.6, x1 - x0)); r.y = r2(y0); r.d = r2(Math.max(0.6, y1 - y0)); });
}

/* ---------- sample home (2BHK, Indian layout) ---------- */
function sampleHome() {
  const p = newProject('Sample 2BHK Apartment');
  const f = p.floors[0]; S.project = p;
  const R = (name, type, x, y, w, d) => f.rooms.push(makeRoom({ name, type, x, y, w, d }));
  R('Living Room', 'living', 0, 0, 5.2, 4.6); R('Dining', 'dining', 5.2, 0, 3.4, 3.2); R('Kitchen', 'kitchen', 8.6, 0, 3.0, 3.2);
  R('Passage', 'hall', 5.2, 3.2, 3.4, 1.4); R('Utility', 'utility', 8.6, 3.2, 3.0, 1.4);
  R('Master Bedroom', 'master', 0, 4.6, 4.4, 4.2); R('Common Bath', 'bathroom', 4.4, 4.6, 1.8, 2.1); R('Attached Bath', 'bathroom', 4.4, 6.7, 1.8, 2.1);
  R('Bedroom 2', 'bedroom', 6.2, 4.6, 3.6, 4.2); R('Study', 'study', 9.8, 4.6, 1.8, 2.8); R('Store', 'closet', 9.8, 7.4, 1.8, 1.4); R('Balcony', 'balcony', 0, 8.8, 4.4, 1.4);
  const by = n => f.rooms.find(r => r.name === n);
  const D = (a, b, w = 0.9, at = 0.5) => { const e = sharedEdge(by(a), by(b)); const t = r2(e.lo + (e.hi - e.lo) * at); f.doors.push({ id: uid('d'), o: e.o, x: e.o === 'h' ? t : e.c, y: e.o === 'h' ? e.c : t, w }); };
  f.doors.push({ id: uid('d'), o: 'h', x: 1.1, y: 0, w: 1.0, main: true });
  D('Living Room', 'Dining', 1.4, 0.55); D('Living Room', 'Passage', 0.9); D('Dining', 'Kitchen', 0.9, 0.7); D('Passage', 'Common Bath', 0.75);
  D('Passage', 'Bedroom 2', 0.9, 0.6); D('Living Room', 'Master Bedroom', 0.9, 0.8); D('Master Bedroom', 'Attached Bath', 0.75); D('Kitchen', 'Utility', 0.8);
  D('Bedroom 2', 'Study', 0.8, 0.3); D('Bedroom 2', 'Store', 0.75); D('Master Bedroom', 'Balcony', 0.9, 0.3);
  autoOpenings(f, { doors: false });
  return p;
}

/* ===================== FURNISHING, COSTS & ANALYZERS ===================== */
const SIDES = ['N', 'E', 'S', 'W'];
const SIDE_ROT = { N: 0, S: 180, W: 90, E: 270 };
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
const frontVec = rot => { const a = rot * Math.PI / 180; return [Math.sin(a), Math.cos(a)]; };
const rightVec = rot => { const a = rot * Math.PI / 180; return [Math.cos(a), -Math.sin(a)]; };

function occupancy(room, floor, except = []) {
  const occ = [];
  room.furniture.forEach(it => { if (except.includes(it) || CATALOG[it.type]?.flat) return; occ.push(itemFootprint(it)); });
  roomOpenings(room, floor).filter(o => o.kind === 'door').forEach(o => occ.push(Object.assign(doorSwingRect(room, o), { door: true })));
  return occ;
}
function rectInRoom(rc, room, tol = 0.02) { return rc.x >= room.x - tol && rc.y >= room.y - tol && rc.x + rc.w <= room.x + room.w + tol && rc.y + rc.d <= room.y + room.d + tol; }
function rectFree(rc, occ) { return !occ.some(o => rectOverlap(rc, o) > 0.0015); }
function sideSpan(room, side) { return side === 'N' || side === 'S' ? [room.x, room.x + room.w] : [room.y, room.y + room.d]; }
function sideOpenings(room, floor, side) { return roomOpenings(room, floor).filter(o => o.side === side); }

function placeOnWall(room, floor, type, side, opt = {}) {
  const c = CATALOG[type]; const W = opt.w || c.w, D = opt.d || c.d, gap = opt.gap ?? 0.02;
  const occ = opt.occ || occupancy(room, floor);
  const [lo, hi] = sideSpan(room, side); const mid = (lo + hi) / 2;
  if (hi - lo < W + 0.02) return null;
  const tall = (opt.h || c.h) > 0.85 && !c.flat;
  const wins = sideOpenings(room, floor, side).filter(o => o.kind === 'window');
  const doorsHere = sideOpenings(room, floor, side).filter(o => o.kind === 'door');
  const cands = [];
  for (let t = lo + W / 2 + 0.01; t <= hi - W / 2 - 0.01 + 1e-9; t += 0.05) cands.push(r2(t));
  const al = opt.align || 'center';
  cands.sort((a, b) => al === 'start' ? a - b : al === 'end' ? b - a : al === 'near' ? Math.abs(a - opt.t0) - Math.abs(b - opt.t0) : Math.abs(a - mid) - Math.abs(b - mid));
  for (const t of cands) {
    let rc;
    if (side === 'N') rc = { x: t - W / 2, y: room.y + gap, w: W, d: D };
    else if (side === 'S') rc = { x: t - W / 2, y: room.y + room.d - gap - D, w: W, d: D };
    else if (side === 'W') rc = { x: room.x + gap, y: t - W / 2, w: D, d: W };
    else rc = { x: room.x + room.w - gap - D, y: t - W / 2, w: D, d: W };
    if (!rectInRoom(rc, room) || !rectFree(rc, occ)) continue;
    if (tall && wins.some(o => Math.abs(o.t - t) < (o.w / 2 + W / 2) && o.ref.sill < (opt.h || c.h))) continue;
    if (doorsHere.some(o => Math.abs(o.t - t) < (o.w / 2 + W / 2 + 0.05))) continue;
    return makeItem(type, room, { x: r2(rc.x + rc.w / 2), y: r2(rc.y + rc.d / 2), rot: SIDE_ROT[side], w: W, d: D, h: opt.h || c.h });
  }
  return null;
}
function placeFree(room, floor, type, opt = {}) {
  const c = CATALOG[type]; const occ = opt.occ || occupancy(room, floor);
  const near = opt.near || [room.x + room.w / 2, room.y + room.d / 2];
  let best = null;
  const rots = opt.rots || [0, 90];
  rots.forEach(rot => {
    const sw = rot % 180 !== 0; const fw = sw ? c.d : c.w, fd = sw ? c.w : c.d;
    for (let x = room.x + fw / 2 + 0.05; x <= room.x + room.w - fw / 2 - 0.05 + 1e-9; x += 0.1) for (let y = room.y + fd / 2 + 0.05; y <= room.y + room.d - fd / 2 - 0.05 + 1e-9; y += 0.1) {
      const rc = { x: x - fw / 2, y: y - fd / 2, w: fw, d: fd };
      if (!rectFree(rc, occ)) continue;
      const dist = Math.hypot(x - near[0], y - near[1]);
      if (!best || dist < best.dist) best = { dist, x, y, rot };
    }
  });
  return best ? makeItem(type, room, { x: r2(best.x), y: r2(best.y), rot: best.rot }) : null;
}
function addItem(room, it) { if (it) room.furniture.push(it); return it; }
function sideScores(room, floor, prefer = {}) {
  return SIDES.map(s => {
    const ops = sideOpenings(room, floor, s); const [lo, hi] = sideSpan(room, s);
    let sc = (hi - lo); if (ops.some(o => o.kind === 'door')) sc -= 3; if (ops.some(o => o.kind === 'window')) sc += prefer.window ? 2 : -0.8;
    const doorSides = roomOpenings(room, floor).filter(o => o.kind === 'door').map(o => o.side);
    if (doorSides.includes(OPP[s])) sc += prefer.faceDoor ? 1.5 : 0.6;
    return { s, sc };
  }).sort((a, b) => b.sc - a.sc).map(o => o.s);
}
function tryWalls(room, floor, type, sides, opt = {}) { for (const s of sides) { const it = placeOnWall(room, floor, type, s, opt); if (it) return addItem(room, it); } return null; }
function placeRel(room, floor, type, cx, cy, rot, skipOcc = []) {
  const it = makeItem(type, room, { x: r2(cx), y: r2(cy), rot }); const fp = itemFootprint(it);
  if (!rectInRoom(fp, room)) return null; const occ = occupancy(room, floor).filter(o => !skipOcc.some(s => s && rectOverlap(o, itemFootprint(s)) > 0 && !o.door));
  if (!rectFree(fp, occ)) return null; return addItem(room, it);
}
function addChairFor(room, floor, desk, type = 'office_chair') {
  const f = frontVec(desk.rot); const c = CATALOG[type];
  const it = makeItem(type, room, { x: r2(desk.x + f[0] * (desk.d / 2 + c.d / 2 - 0.12)), y: r2(desk.y + f[1] * (desk.d / 2 + c.d / 2 - 0.12)), rot: (desk.rot + 180) % 360 });
  if (rectInRoom(itemFootprint(it), room, 0.05)) room.furniture.push(it);
}
function cornerPlant(room, floor) {
  const c = CATALOG.plant; const occ = occupancy(room, floor);
  const corners = [[room.x + 0.3, room.y + 0.3], [room.x + room.w - 0.3, room.y + 0.3], [room.x + 0.3, room.y + room.d - 0.3], [room.x + room.w - 0.3, room.y + room.d - 0.3]];
  for (const [x, y] of corners) { const rc = { x: x - c.w / 2, y: y - c.d / 2, w: c.w, d: c.d }; if (rectFree(rc, occ)) return addItem(room, makeItem('plant', room, { x: r2(x), y: r2(y) })); }
  return null;
}
function rugUnder(room, floor, anchor, w = 2.0, d = 1.4, off = 0) {
  const f = frontVec(anchor.rot); const sw = anchor.rot % 180 !== 0;
  let cx = anchor.x + f[0] * off, cy = anchor.y + f[1] * off;
  let rw = Math.min(w, (sw ? room.d : room.w) - 0.6), rd = Math.min(d, (sw ? room.w : room.d) - 0.6);
  if (rw < 1 || rd < 0.8) return null;
  const it = makeItem('rug', room, { x: r2(cx), y: r2(cy), rot: anchor.rot, w: r2(rw), d: r2(rd) });
  const fp = itemFootprint(it); it.x = r2(clamp(it.x, room.x + fp.w / 2 + 0.1, room.x + room.w - fp.w / 2 - 0.1)); it.y = r2(clamp(it.y, room.y + fp.d / 2 + 0.1, room.y + room.d - fp.d / 2 - 0.1));
  return addItem(room, it);
}

function autoFurnish(room, floor = floorOfRoom(room), variant = 0) {
  autoFurnishBase(room, floor, variant); if (!isYard(room) && room.type !== 'garage') syncThemeDecor(room);
}
function autoFurnishBase(room, floor = floorOfRoom(room), variant = 0) {
  room.furniture = [];
  if (isYard(room) || room.type === 'garage') return; // parking, gardens and garages are built in 3D, not furnished
  const t = room.type, pf = S.prefs, A = area(room);
  const rot = arr => arr.slice(variant % arr.length).concat(arr.slice(0, variant % arr.length));
  const sides = rot(sideScores(room, floor));
  if (t === 'bedroom' || t === 'master' || t === 'guest') {
    const kidsRoom = pf.kids && t === 'bedroom' && !allRooms().some(r => r !== room && r.furniture.some(i => i.type === 'bunk_bed'));
    const bedType = kidsRoom ? 'bunk_bed' : (Math.min(room.w, room.d) < 2.9 ? 'bed_single' : 'bed_double');
    const bed = tryWalls(room, floor, bedType, sides);
    if (bed) {
      const st = CATALOG.side_table, r = rightVec(bed.rot), b = frontVec(bed.rot);
      [-1, 1].forEach(s => placeRel(room, floor, 'side_table', bed.x + r[0] * s * (bed.w / 2 + st.w / 2 + 0.04) - b[0] * (bed.d / 2 - st.d / 2 - 0.02), bed.y + r[1] * s * (bed.w / 2 + st.w / 2 + 0.04) - b[1] * (bed.d / 2 - st.d / 2 - 0.02), bed.rot));
      if (bedType !== 'bunk_bed' && A > 10) rugUnder(room, floor, bed, Math.min(bed.w + 0.9, 2.4), 1.2, bed.d / 2 - 0.2);
    }
    const wardW = A > 14 ? 2.1 : A > 10 ? 1.8 : 1.2;
    const wSides = sides.filter(s => !bed || s !== Object.keys(SIDE_ROT).find(k => SIDE_ROT[k] === bed.rot)).concat(sides);
    for (const s of wSides) { const it = placeOnWall(room, floor, 'wardrobe', s, { w: wardW, align: 'end' }) || placeOnWall(room, floor, 'wardrobe', s, { w: 1.2, align: 'start' }); if (it) { addItem(room, it); break; } }
    if (pf.storage === 'high') tryWalls(room, floor, 'storage_cabinet', sides.slice().reverse());
    if ((pf.wfh && (t === 'master' || (t === 'bedroom' && !allRooms().some(r => ['office', 'study'].includes(r.type))))) || kidsRoom) {
      const ws = rot(sideScores(room, floor, { window: true }));
      const d = tryWalls(room, floor, 'desk', ws, { align: 'start' }); if (d) addChairFor(room, floor, d);
    }
    if (A > 13) tryWalls(room, floor, 'dresser', sides.slice().reverse());
    if (pf.kids && t === 'master' && A > 14 && !allRooms().some(r => r.type === 'nursery')) tryWalls(room, floor, 'crib', sides.slice().reverse());
    cornerPlant(room, floor);
  } else if (t === 'living') {
    const sofaType = A > 18 ? 'sofa_l' : 'sofa_3';
    const ls = rot(sideScores(room, floor, { faceDoor: false }));
    const sofa = tryWalls(room, floor, sofaType, ls) || tryWalls(room, floor, 'sofa_3', ls);
    if (sofa) {
      const f = frontVec(sofa.rot), ct = CATALOG.coffee_table; const off = (sofaType === 'sofa_l' && sofa.type === 'sofa_l' ? 0.92 : sofa.d) / 2 + 0.45 + ct.d / 2;
      const by = sofa.type === 'sofa_l' ? -sofa.d / 2 + 0.46 : 0;
      const cx = sofa.x + f[0] * (off + by) - (sofa.type === 'sofa_l' ? rightVec(sofa.rot)[0] * 0.3 : 0), cy = sofa.y + f[1] * (off + by) - (sofa.type === 'sofa_l' ? rightVec(sofa.rot)[1] * 0.3 : 0);
      const table = placeRel(room, floor, 'coffee_table', cx, cy, sofa.rot);
      const sSide = Object.keys(SIDE_ROT).find(k => SIDE_ROT[k] === sofa.rot);
      const tvSide = OPP[sSide]; const t0 = sSide === 'N' || sSide === 'S' ? sofa.x : sofa.y;
      const tv = addItem(room, placeOnWall(room, floor, 'tv_unit', tvSide, { align: 'near', t0 })) || tryWalls(room, floor, 'tv_unit', sides.filter(s => s !== sSide));
      if (table) {
        rugUnder(room, floor, table, 2.2, 1.6, 0);
        const r = rightVec(sofa.rot);
        for (const s of [1, -1]) { const a = placeRel(room, floor, 'armchair', table.x + r[0] * s * (table.w / 2 + 0.75), table.y + r[1] * s * (table.w / 2 + 0.75), (sofa.rot + (s > 0 ? 270 : 90)) % 360); if (a) break; }
      }
    }
    const pooja = S.prefs.style === 'Indian Contemporary' || /indian/i.test(P().theme);
    if (pooja && !allRooms().some(r => r.type === 'pooja')) tryWalls(room, floor, 'pooja_unit', sides.slice().reverse(), { align: 'end' });
    tryWalls(room, floor, 'bookshelf', sides.slice().reverse(), { align: 'start' });
    const main = roomOpenings(room, floor).find(o => o.kind === 'door' && o.ref.main);
    if (main) { const it = placeOnWall(room, floor, 'shoe_rack', main.side, { align: 'near', t0: main.t + 1.0 }) || tryWalls(room, floor, 'shoe_rack', sides); if (it && !room.furniture.includes(it)) addItem(room, it); }
    if (S.prefs.pets) { const pb = placeFree(room, floor, 'pet_bed', { near: [room.x + 0.5, room.y + room.d - 0.5] }); addItem(room, pb); }
    if (A > 14) { const fl = placeFree(room, floor, 'floor_lamp', { near: [room.x + 0.3, room.y + 0.3] }); addItem(room, fl); }
    cornerPlant(room, floor); cornerPlant(room, floor);
  } else if (t === 'kitchen') {
    const ks = rot(sideScores(room, floor, { window: true }));
    let placed = null;
    for (const s of ks) { const [lo, hi] = sideSpan(room, s); const w = Math.min(3.2, r2(hi - lo - 0.1)); if (w < 1.2) continue; placed = placeOnWall(room, floor, 'kitchen_counter', s, { w, align: 'start', h: 2.2 }) || placeOnWall(room, floor, 'kitchen_counter', s, { w: Math.max(1.2, w - 0.8), align: 'start', h: 2.2 }); if (placed) { addItem(room, placed); break; } }
    if (placed && A > 7) { const ps = Object.keys(SIDE_ROT).find(k => SIDE_ROT[k] === placed.rot); const adj = ['N', 'S'].includes(ps) ? ['E', 'W'] : ['N', 'S']; for (const s of adj) { const [lo, hi] = sideSpan(room, s); const it = placeOnWall(room, floor, 'kitchen_counter', s, { w: Math.min(2.0, r2(hi - lo - 0.8)), align: 'start', h: 2.2 }); if (it) { addItem(room, it); break; } } }
    tryWalls(room, floor, 'fridge', ks.slice().reverse(), { align: 'end' });
  } else if (t === 'dining') {
    const big = A > 9.5 && Math.min(room.w, room.d) > 2.9;
    const type = big ? 'dining_set' : 'dining_4';
    const r0 = room.w > room.d ? 90 : 0;
    const it = placeFree(room, floor, type, { rots: [r0, (r0 + 90) % 180] }); addItem(room, it);
    tryWalls(room, floor, 'storage_cabinet', sides);
    cornerPlant(room, floor);
  } else if (t === 'bathroom') {
    const ds = roomOpenings(room, floor).find(o => o.kind === 'door');
    const corners = [[room.x, room.y], [room.x + room.w, room.y], [room.x, room.y + room.d], [room.x + room.w, room.y + room.d]];
    const dp = ds ? (ds.side === 'N' || ds.side === 'S' ? [ds.t, ds.side === 'N' ? room.y : room.y + room.d] : [ds.side === 'W' ? room.x : room.x + room.w, ds.t]) : [room.x, room.y];
    corners.sort((a, b) => Math.hypot(b[0] - dp[0], b[1] - dp[1]) - Math.hypot(a[0] - dp[0], a[1] - dp[1]));
    const sh = CATALOG.shower; const occ = occupancy(room, floor);
    if (A > 3.2) for (const [cx, cy] of corners) { const x = cx === room.x ? cx + sh.w / 2 : cx - sh.w / 2, y = cy === room.y ? cy + sh.d / 2 : cy - sh.d / 2; const rc = { x: x - sh.w / 2, y: y - sh.d / 2, w: sh.w, d: sh.d }; if (rectFree(rc, occ)) { const it = makeItem('shower', room, { x: r2(x), y: r2(y), rot: cy === room.y ? (cx === room.x ? 0 : 270) : (cx === room.x ? 90 : 180) }); addItem(room, it); break; } }
    tryWalls(room, floor, 'toilet', sides, { align: 'end' });
    tryWalls(room, floor, 'wash_basin', sides.slice().reverse(), { align: 'start' });
  } else if (t === 'balcony') {
    const s = sides[0]; const a = placeOnWall(room, floor, 'outdoor_chair', s, { align: 'start' }); addItem(room, a);
    if (a) { const r = rightVec(a.rot); placeRel(room, floor, 'side_table_round', a.x + r[0] * 0.65, a.y + r[1] * 0.65, a.rot); placeRel(room, floor, 'outdoor_chair', a.x + r[0] * 1.3, a.y + r[1] * 1.3, a.rot); }
    cornerPlant(room, floor); cornerPlant(room, floor);
    if (!allRooms().some(r => r.furniture.some(i => i.type === 'washing_machine'))) tryWalls(room, floor, 'washing_machine', sides.slice().reverse(), { align: 'end' });
  } else if (t === 'study' || t === 'office') {
    const ws = rot(sideScores(room, floor, { window: true }));
    const d = tryWalls(room, floor, 'desk', ws, { w: t === 'office' && A > 7 ? 1.5 : 1.2 }); if (d) addChairFor(room, floor, d);
    tryWalls(room, floor, 'bookshelf', ws.slice().reverse()); if (A > 8) tryWalls(room, floor, 'storage_cabinet', ws.slice().reverse());
    if (A > 7) { const a = placeFree(room, floor, 'armchair', { near: [room.x + room.w - 0.6, room.y + room.d - 0.6] }); addItem(room, a); }
    cornerPlant(room, floor);
  } else if (t === 'gaming') {
    const ws = rot(sideScores(room, floor, { window: false }));
    const d = tryWalls(room, floor, 'gaming_desk', ws); if (d) addChairFor(room, floor, d, 'gaming_chair');
    const bb = placeFree(room, floor, 'beanbag', { near: [room.x + room.w - 0.6, room.y + room.d - 0.6] }); addItem(room, bb);
    if (A > 10) { tryWalls(room, floor, 'tv_unit', ws.slice(1)); }
    tryWalls(room, floor, 'bookshelf', ws.slice().reverse());
    if (A > 8) { const r = placeFree(room, floor, 'rug'); if (r) { r.w = 1.6; r.d = 1.2; addItem(room, r); } }
  } else if (t === 'reading') {
    const ws = rot(sideScores(room, floor, { window: true }));
    const a = placeOnWall(room, floor, 'armchair', ws[0], { align: 'start', gap: 0.15 }) || placeFree(room, floor, 'armchair'); addItem(room, a);
    if (a) { const r = rightVec(a.rot); placeRel(room, floor, 'floor_lamp', a.x + r[0] * 0.65, a.y + r[1] * 0.65, a.rot); placeRel(room, floor, 'side_table', a.x - r[0] * 0.65, a.y - r[1] * 0.65, a.rot); }
    tryWalls(room, floor, 'bookshelf', ws.slice(1)); tryWalls(room, floor, 'bookshelf', ws.slice(1));
    if (A > 6) rugUnder(room, floor, a || { x: room.x + room.w / 2, y: room.y + room.d / 2, rot: 0 }, 1.6, 1.2, 0.5);
    cornerPlant(room, floor);
  } else if (t === 'closet') {
    sides.forEach(s => { const [lo, hi] = sideSpan(room, s); const w = Math.min(2.4, r2(hi - lo - 0.2)); if (w >= 0.9) addItem(room, placeOnWall(room, floor, 'closet_rack', s, { w, align: 'center' })); });
    if (room.furniture.length < 2) tryWalls(room, floor, 'storage_cabinet', sides);
    if (A > 5) tryWalls(room, floor, 'dresser', sides);
  } else if (t === 'nursery') {
    tryWalls(room, floor, 'crib', sides); tryWalls(room, floor, 'dresser', sides.slice().reverse()); tryWalls(room, floor, 'armchair', sides.slice(1));
    const r = placeFree(room, floor, 'rug'); if (r) { r.w = 1.6; r.d = 1.2; addItem(room, r); } cornerPlant(room, floor);
  } else if (t === 'gym') {
    tryWalls(room, floor, 'treadmill', sides); const r = placeFree(room, floor, 'rug'); if (r) { r.w = 1.8; r.d = 0.9; r.color = '#3a3a3a'; addItem(room, r); }
    tryWalls(room, floor, 'storage_cabinet', sides.slice().reverse()); cornerPlant(room, floor);
  } else if (t === 'pooja') {
    tryWalls(room, floor, 'pooja_unit', sides); cornerPlant(room, floor);
  } else if (t === 'store') { // shelves along the walls
    tryWalls(room, floor, 'bookshelf', sides); tryWalls(room, floor, 'storage_cabinet', sides.slice(1)); tryWalls(room, floor, 'closet_rack', sides.slice(2));
  } else if (t === 'porch') { // a sit-out: two chairs, a small table and a plant
    const c1 = placeFree(room, floor, 'outdoor_chair'); if (c1) addItem(room, c1); const c2 = placeFree(room, floor, 'outdoor_chair'); if (c2) addItem(room, c2);
    const tb = placeFree(room, floor, 'side_table_round'); if (tb) addItem(room, tb); cornerPlant(room, floor);
  } else if (t === 'utility') {
    tryWalls(room, floor, 'washing_machine', sides, { align: 'start' }); tryWalls(room, floor, 'storage_cabinet', sides.slice(1));
  } else if (t === 'hall') {
    if (Math.min(room.w, room.d) > 1.3) tryWalls(room, floor, 'shoe_rack', sides); cornerPlant(room, floor);
  }
  room.furniture.forEach(i => { i.tier = room.tier || i.tier; });
  return room.furniture;
}
function furnishAll() { S.project.floors.forEach(f => f.rooms.forEach(r => { autoFurnish(r, f); stageLiving(r, f); })); }

/* ---------- cost model ---------- */
function roomCost(room, floor = floorOfRoom(room)) {
  const H = floor.height, ops = roomOpenings(room, floor), tier = room.tier || 'standard', ti = TIER_IX[tier];
  const openA = ops.reduce((s, o) => s + (o.kind === 'door' ? o.w * DOOR_H : o.w * o.ref.h), 0);
  const wallA = isYard(room) ? 0 : Math.max(0, 2 * (room.w + room.d) * H - openA);
  const paint = wallA * SQFT * PAINT[tier].rate;
  const fk = roomFloorKey(room), flooring = room.floorKeep ? 0 : area(room) * SQFT * FLOORS[fk].rate;
  let furniture = 0, decor = 0; const items = [];
  room.furniture.forEach(it => { const c = CATALOG[it.type]; const p = c.price[TIER_IX[it.tier || tier]] * (c.perW ? it.w / c.w : 1); items.push({ it, p }); if (c.decor) decor += p; else furniture += p; });
  const nWin = ops.filter(o => o.kind === 'window').length;
  const curtains = room.curtains && !['bathroom', 'kitchen', 'utility'].includes(room.type) ? nWin * [3500, 7500, 16000][ti] : 0;
  decor += curtains;
  const L = room.lights || {}; const mult = [0.8, 1, 1.7][ti];
  const lighting = ((L.ambient ? area(room) * LIGHT_COST.ambient : 0) + (L.task ? LIGHT_COST.task : 0) + (L.accent ? LIGHT_COST.accent : 0)) * mult;
  const ck = roomCeiling(room), ceiling = area(room) * SQFT * CEILINGS[ck].rate;
  const total = paint + flooring + furniture + decor + lighting + ceiling;
  return { paint, flooring, furniture, decor, lighting, ceiling, total, items, curtains,
    explain: {
      paint: `${r2(wallA)} m² wall (${Math.round(wallA * SQFT)} sq ft, openings deducted) × ₹${PAINT[tier].rate}/sq ft · ${PAINT[tier].label}`,
      flooring: room.floorKeep ? 'Keeping the existing flooring (no new flooring cost)' : `${r2(area(room))} m² (${Math.round(area(room) * SQFT)} sq ft) × ₹${FLOORS[fk].rate}/sq ft · ${FLOORS[fk].label}`,
      furniture: items.filter(x => !CATALOG[x.it.type].decor).map(x => `${CATALOG[x.it.type].label} (${x.it.tier || tier}) ${inr(x.p)}`).join(' · ') || 'No furniture',
      decor: (items.filter(x => CATALOG[x.it.type].decor).map(x => `${CATALOG[x.it.type].label} ${inr(x.p)}`).concat(curtains ? [`Curtains ×${nWin} ${inr(curtains)}`] : [])).join(' · ') || '—',
      lighting: [L.ambient ? `Ambient LED ${inr(area(room) * LIGHT_COST.ambient * mult)}` : null, L.task ? `Task lights ${inr(LIGHT_COST.task * mult)}` : null, L.accent ? `Accent lights ${inr(LIGHT_COST.accent * mult)}` : null].filter(Boolean).join(' · ') || 'None',
      ceiling: CEILINGS[ck].rate ? `${Math.round(area(room) * SQFT)} sq ft × ₹${CEILINGS[ck].rate} · ${CEILINGS[ck].label}` : 'Plain ceiling (no false ceiling)',
    } };
}
function homeCost() { const rooms = allRooms().map(r => ({ r, c: roomCost(r) })); const sum = k => rooms.reduce((s, x) => s + x.c[k], 0); return { rooms, paint: sum('paint'), flooring: sum('flooring'), furniture: sum('furniture'), decor: sum('decor'), lighting: sum('lighting'), ceiling: sum('ceiling'), total: sum('total') }; }
function cheaperAlternatives(room) {
  const out = [], c = roomCost(room), tier = room.tier || 'standard';
  const fk = roomFloorKey(room), alt = FLOOR_CHEAPER[fk];
  if (alt && !room.floorKeep) out.push({ what: `Flooring: ${FLOORS[fk].label} → ${FLOORS[alt].label}`, save: area(room) * SQFT * (FLOORS[fk].rate - FLOORS[alt].rate), apply: () => { room.floor = alt; } });
  if (tier !== 'budget') { const lower = TIERS[TIER_IX[tier] - 1]; out.push({ what: `Paint: ${PAINT[tier].label} → ${PAINT[lower].label}`, save: c.paint * (1 - PAINT[lower].rate / PAINT[tier].rate), apply: () => { room.tier = lower; } }); }
  c.items.filter(x => (x.it.tier || tier) !== 'budget').sort((a, b) => b.p - a.p).slice(0, 4).forEach(x => { const lower = TIERS[TIER_IX[x.it.tier || tier] - 1]; const cc = CATALOG[x.it.type]; const np = cc.price[TIER_IX[lower]] * (cc.perW ? x.it.w / cc.w : 1); out.push({ what: `${CATALOG[x.it.type].label}: ${x.it.tier || tier} → ${lower}`, save: x.p - np, apply: () => { x.it.tier = lower; } }); });
  const ck = roomCeiling(room); if (CEILINGS[ck].rate > 95) out.push({ what: `Ceiling: ${CEILINGS[ck].label} → Peripheral false ceiling`, save: c.ceiling - area(room) * SQFT * 95, apply: () => { room.ceiling = 'peripheral'; } });
  if (room.lights?.accent) out.push({ what: 'Skip accent lighting', save: LIGHT_COST.accent * [0.8, 1, 1.7][TIER_IX[tier]], apply: () => { room.lights.accent = false; } });
  return out.filter(o => o.save > 50).sort((a, b) => b.save - a.save);
}
const ESSENTIAL = new Set(['bed_double', 'bed_single', 'bunk_bed', 'wardrobe', 'sofa_3', 'sofa_l', 'kitchen_counter', 'fridge', 'dining_set', 'dining_4', 'toilet', 'wash_basin', 'shower', 'desk', 'office_chair', 'gaming_desk', 'gaming_chair', 'crib', 'treadmill', 'pooja_unit', 'closet_rack', 'washing_machine', 'tv_unit']);
function deeperCuts(room) {
  const out = [], c = roomCost(room);
  c.items.filter(x => !ESSENTIAL.has(x.it.type)).forEach(x => out.push({ what: `Skip ${CATALOG[x.it.type].label.toLowerCase()} for now`, save: x.p, apply: () => { room.furniture.splice(room.furniture.indexOf(x.it), 1); } }));
  if (!room.floorKeep && c.flooring > 0) out.push({ what: 'Keep the existing flooring', save: c.flooring, apply: () => { room.floorKeep = true; } });
  room.furniture.filter(i => CATALOG[i.type].perW && i.w > 1.25).forEach(i => { const cc = CATALOG[i.type]; const p = cc.price[TIER_IX[i.tier]]; out.push({ what: `Smaller ${cc.label.toLowerCase()} (${i.w} → 1.2 m)`, save: p * (i.w - 1.2) / cc.w, apply: () => { i.w = 1.2; } }); });
  if (c.curtains) out.push({ what: 'Postpone curtains', save: c.curtains, apply: () => { room.curtains = false; } });
  if (room.lights?.task) out.push({ what: 'Skip task lighting', save: LIGHT_COST.task * [0.8, 1, 1.7][TIER_IX[room.tier || 'standard']], apply: () => { room.lights.task = false; } });
  if (roomCeiling(room) !== 'flat') out.push({ what: 'No false ceiling', save: c.ceiling, apply: () => { room.ceiling = 'flat'; } });
  return out.filter(o => o.save > 50);
}
function optimizeBudget(rooms, amount) {
  const steps = []; const cost = () => rooms.reduce((s, r) => s + roomCost(r).total, 0);
  const start = cost(); let guard = 0;
  while (cost() > amount && guard++ < 120) {
    const gap = cost() - amount;
    let alts = rooms.flatMap(r => cheaperAlternatives(r).map(a => Object.assign(a, { room: r })));
    if (!alts.length) alts = rooms.flatMap(r => deeperCuts(r).map(a => Object.assign(a, { room: r })));
    if (!alts.length) break;
    // prefer the smallest single change that closes the gap, else the biggest saving
    const closing = alts.filter(a => a.save >= gap).sort((a, b) => a.save - b.save);
    const a = closing[0] || alts.sort((x, y) => y.save - x.save)[0];
    a.apply(); steps.push(`${a.room.name}: ${a.what} (saves ${inr(a.save)})`);
  }
  return { start, end: cost(), steps, ok: cost() <= amount };
}

/* ---------- space analyzer ---------- */
const CLEAR_REQ = { bed_double: 0.6, bed_single: 0.6, bunk_bed: 0.6, wardrobe: 0.75, desk: 0.75, dresser: 0.7, kitchen_counter: 1.0, fridge: 0.9, toilet: 0.55, wash_basin: 0.7, bookshelf: 0.6, storage_cabinet: 0.7, closet_rack: 0.75, tv_unit: 1.5, sofa_3: 0.35, sofa_l: 0.35, gaming_desk: 0.75, shoe_rack: 0.6, washing_machine: 0.7, treadmill: 0.6 };
function analyzeSpace(room, floor = floorOfRoom(room)) {
  const cs = 0.1, nx = Math.max(1, Math.round(room.w / cs)), ny = Math.max(1, Math.round(room.d / cs));
  const g = new Uint8Array(nx * ny); const cellRect = (i, j) => ({ x: room.x + i * cs, y: room.y + j * cs, w: cs, d: cs });
  const mark = (rc, v) => { const i0 = Math.max(0, Math.floor((rc.x - room.x) / cs)), i1 = Math.min(nx, Math.ceil((rc.x + rc.w - room.x) / cs)), j0 = Math.max(0, Math.floor((rc.y - room.y) / cs)), j1 = Math.min(ny, Math.ceil((rc.y + rc.d - room.y) / cs)); for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) if (!g[j * nx + i] || v === 1) g[j * nx + i] = v; };
  const solid = room.furniture.filter(it => !CATALOG[it.type]?.flat);
  solid.forEach(it => mark(itemFootprint(it), 1));
  const doors = roomOpenings(room, floor).filter(o => o.kind === 'door');
  doors.forEach(o => mark(doorSwingRect(room, o), 2));
  const fpArea = solid.reduce((s, it) => s + Math.min(area(room), it.w * it.d), 0);
  const coverage = fpArea / area(room);
  // clearance per item
  const issues = [], clear = [];
  solid.forEach(it => {
    const req = CLEAR_REQ[it.type]; if (!req) return;
    const f = frontVec(it.rot); const r = rightVec(it.rot); let dist = 0, blocked = null;
    for (let s = 0.05; s < 3; s += 0.05) {
      const pts = [-0.35, 0, 0.35].map(k => [it.x + f[0] * (it.d / 2 + s) + r[0] * k * it.w, it.y + f[1] * (it.d / 2 + s) + r[1] * k * it.w]);
      if (pts.some(p => !inRoom(room, p[0], p[1], -0.01))) { blocked = 'wall'; break; }
      const hit = solid.find(o => o !== it && !(it.type.includes('desk') && /chair/.test(o.type)) && pts.some(p => { const fp = itemFootprint(o); return p[0] > fp.x && p[0] < fp.x + fp.w && p[1] > fp.y && p[1] < fp.y + fp.d; }));
      if (hit) { blocked = CATALOG[hit.type].label; break; }
      dist = s;
    }
    clear.push({ it, dist: r2(dist), req, ok: dist + 0.001 >= req, blocked });
    if (dist + 0.001 < req) issues.push(`${CATALOG[it.type].label} has only ${dist.toFixed(2)} m in front (needs ${req} m${blocked ? ', blocked by ' + blocked.toLowerCase() : ''}).`);
  });
  // door swing conflicts
  doors.forEach(o => { const sw = doorSwingRect(room, o); solid.forEach(it => { if (rectOverlap(sw, itemFootprint(it)) > 0.02) issues.push(`${CATALOG[it.type].label} blocks the door swing.`); }); });
  // overlapping furniture
  for (let a = 0; a < solid.length; a++) for (let b = a + 1; b < solid.length; b++) { const A = solid[a], Bq = solid[b]; if (/chair/.test(A.type + Bq.type) && /desk|dining/.test(A.type + Bq.type)) continue; if (rectOverlap(itemFootprint(A), itemFootprint(Bq)) > 0.03) issues.push(`${CATALOG[A.type].label} overlaps ${CATALOG[Bq.type].label}.`); }
  solid.forEach(it => { if (!rectInRoom(itemFootprint(it), room, 0.05)) issues.push(`${CATALOG[it.type].label} sticks out of the room.`); });
  // walkable area: free cells with distance >= 0.3 from obstacles/walls
  const dist = new Float32Array(nx * ny).fill(1e9); const q = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (g[k] === 1) { dist[k] = 0; q.push(k); } else if (i === 0 || j === 0 || i === nx - 1 || j === ny - 1) { dist[k] = 1; q.push(k); } }
  for (let h = 0; h < q.length; h++) { const k = q[h], i = k % nx, j = (k / nx) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) return; const kk = jj * nx + ii; if (dist[kk] > dist[k] + 1) { dist[kk] = dist[k] + 1; q.push(kk); } }); }
  let free = 0, walk = 0; for (let k = 0; k < g.length; k++) if (g[k] !== 1) { free++; if (dist[k] * cs >= 0.3) walk++; }
  const walkable = free ? walk / g.length : 0;
  // unused corner detection
  const zone = new Uint8Array(nx * ny); for (let k = 0; k < g.length; k++) zone[k] = g[k] ? 1 : 0;
  solid.forEach(it => { const req = Math.min(0.7, CLEAR_REQ[it.type] || 0.5); const f = frontVec(it.rot), fp = itemFootprint(it); const ex = { x: fp.x + Math.min(0, f[0]) * req, y: fp.y + Math.min(0, f[1]) * req, w: fp.w + Math.abs(f[0]) * req, d: fp.d + Math.abs(f[1]) * req }; const i0 = Math.max(0, Math.floor((ex.x - room.x) / cs)), i1 = Math.min(nx, Math.ceil((ex.x + ex.w - room.x) / cs)), j0 = Math.max(0, Math.floor((ex.y - room.y) / cs)), j1 = Math.min(ny, Math.ceil((ex.y + ex.d - room.y) / cs)); for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) zone[j * nx + i] = 1; });
  const freeRect = (i0, j0, w, h) => { if (i0 < 0 || j0 < 0 || i0 + w > nx || j0 + h > ny) return false; for (let j = j0; j < j0 + h; j++) for (let i = i0; i < i0 + w; i++) if (zone[j * nx + i]) return false; return true; };
  let corner = null;
  if (!['bathroom', 'hall', 'utility', 'kitchen'].includes(room.type) && area(room) > 5) {
    [[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      for (let w = 8; w <= Math.min(22, nx); w++) for (let h = 8; h <= Math.min(22, ny); h++) {
        const i0 = cx ? nx - w : 0, j0 = cy ? ny - h : 0;
        if (freeRect(i0, j0, w, h)) { const a = w * h * cs * cs; if (!corner || a > corner.area) corner = { x: room.x + i0 * cs, y: room.y + j0 * cs, w: w * cs, d: h * cs, area: a, cx, cy }; }
      }
    });
    if (corner && corner.area < 1.0) corner = null;
  }
  const type = ROOM_TYPES[room.type]; const minA = type.min;
  const status = room.type === 'bathroom' || room.type === 'kitchen' || room.type === 'closet' ? (coverage > 0.7 ? 'Overcrowded' : 'Balanced') : coverage < 0.16 ? 'Underused' : coverage > 0.52 ? 'Overcrowded' : 'Balanced';
  let score = 100 - issues.length * 10 - (status === 'Overcrowded' ? 15 : status === 'Underused' ? 8 : 0) - (area(room) < minA ? 10 : 0) - (corner ? 5 : 0) - (walkable < 0.25 && room.type !== 'bathroom' ? 8 : 0);
  score = clamp(Math.round(score), 5, 100);
  const sizeNote = area(room) < minA ? `Below the recommended ${minA} m² for a ${type.label.toLowerCase()} — keep furniture compact.` : `Meets the recommended minimum of ${minA} m² for a ${type.label.toLowerCase()}.`;
  const purpose = suggestPurposes(room);
  return { coverage, walkable, issues: [...new Set(issues)], clear, corner, status, score, sizeNote, purpose, grid: { nx, ny, cs, g, zone } };
}
function suggestPurposes(room) {
  const A = area(room);
  if (A < 3) return ['pooja', 'closet', 'utility'];
  if (A < 6.5) return ['closet', 'reading', 'study', 'pooja'];
  if (A < 9.5) return ['study', 'office', 'nursery', 'reading'];
  return ['guest', 'office', 'gaming', 'gym'];
}
function storageReport() {
  const have = allRooms().reduce((s, r) => s + r.furniture.reduce((a, it) => a + (CATALOG[it.type].storage || 0) * (it.w / CATALOG[it.type].w), 0), 0);
  const need = S.prefs.family * 0.9 + ({ low: 0, medium: 0.8, high: 2 }[S.prefs.storage] || 0.8) + (S.prefs.kids ? 1 : 0);
  const tips = [];
  if (have < need) tips.push(`Add about ${r2(need - have)} m³ of storage: loft cabinets above wardrobes, hydraulic storage beds, or a ceiling-high shoe cabinet near the entrance.`);
  else tips.push('Storage capacity matches your household. Use loft space for seasonal items.');
  if (S.prefs.kids) tips.push('Use low open shelves in kids’ rooms so toys are reachable.');
  return { have: r2(have), need: r2(need), tips };
}
function fitCheck(type, room, floor = floorOfRoom(room), dims) {
  const c = CATALOG[type]; const w = dims?.w || c.w, d = dims?.d || c.d;
  const save = room.furniture.slice();
  let it = null;
  for (const s of SIDES) { it = placeOnWall(room, floor, type, s, { w, d }); if (it) break; }
  if (!it) { it = placeFree(room, floor, type); if (it) { it.w = w; it.d = d; } }
  room.furniture = save;
  if (!it) return { ok: false, msg: `${c.label} (${w}×${d} m) does not fit in ${room.name} with current furniture and door clearances.` };
  const longest = Math.max(room.w, room.d);
  return { ok: true, item: it, msg: `${c.label} (${w}×${d} m) fits in ${room.name}. Best spot: against the ${['north', 'east', 'south', 'west'][[0, 270, 180, 90].indexOf(it.rot)] || 'centre'} wall, keeping ${CLEAR_REQ[type] || 0.6} m clearance.${w > longest ? ' (diagonal fit only)' : ''}` };
}

/* ---------- light & ventilation ---------- */
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
function sideCompass(side) { const ang = { N: 0, E: 90, S: 180, W: 270 }[side]; const a = ((ang + (S.project.north || 0)) % 360 + 360) % 360; return { deg: a, label: COMPASS[Math.round(a / 45) % 8] }; }
function sunAz(hour) { return 90 + (hour - 6) * 15; } // 6h → E(90) 12h → S(180) 18h → W(270)
function analyzeLight(room, floor = floorOfRoom(room)) {
  const ops = roomOpenings(room, floor); const wins = ops.filter(o => o.kind === 'window' && o.ext);
  const winA = wins.reduce((s, o) => s + o.w * o.ref.h, 0); const wfr = winA / area(room);
  const rating = wfr >= 0.15 ? 'Excellent' : wfr >= 0.1 ? 'Good' : wfr >= 0.05 ? 'Limited' : wfr > 0 ? 'Poor' : 'No daylight';
  const dirs = [...new Set(wins.map(o => sideCompass(o.side).label))];
  const notes = [];
  dirs.forEach(d => {
    if (d.includes('E')) notes.push(`${d}-facing window: soft morning sun — good for waking up and breakfast spaces.`);
    if (d.includes('W')) notes.push(`${d}-facing window: harsh afternoon sun and heat — use blackout or thermal curtains and cooler wall colours.`);
    if (d === 'S' || d === 'SE' || d === 'SW') notes.push(`${d}-facing: bright, strong light for most of the day (India); add a chajja/overhang or sheers to cut glare.`);
    if (d === 'N' || d === 'NE' || d === 'NW') notes.push(`${d}-facing: steady, diffused daylight — ideal for a study or studio, little heat gain.`);
  });
  const sides = [...new Set(wins.map(o => o.side))];
  const opposite = sides.some(s => sides.includes(OPP[s]));
  const ventDoorExt = ops.some(o => o.kind === 'door' && isExteriorPoint(floor, o.ref.o, o.ref.o === 'h' ? o.ref.y : o.ref.x, o.ref.o === 'h' ? o.ref.x : o.ref.y));
  const vent = opposite ? 'Excellent cross-ventilation' : sides.length >= 2 ? 'Good (adjacent walls)' : (sides.length === 1 && (ops.some(o => o.kind === 'door') || ventDoorExt)) ? 'Fair (single-sided)' : 'Poor';
  const sugg = [];
  if (['bathroom', 'kitchen', 'utility'].includes(room.type) && !wins.length) sugg.push('No exterior window — install an exhaust fan or duct to vent moisture and cooking fumes.');
  if (room.type === 'kitchen' && wins.length) sugg.push('Place the hob near the window and add a chimney for smoke extraction.');
  if (vent === 'Poor' || vent.startsWith('Fair')) sugg.push('Keep internal doors open or add a ventilator above the door to improve airflow.');
  if (rating === 'Limited' || rating === 'Poor' || rating === 'No daylight') sugg.push('Use light, reflective wall colours and mirrors opposite windows to bounce daylight deeper.');
  // window suggestion
  let suggestWindow = null;
  if (['Limited', 'Poor', 'No daylight'].includes(rating) || (!opposite && sides.length < 2 && !['bathroom', 'hall', 'closet', 'utility'].includes(room.type))) {
    const cand = [['h', room.y, room.x, room.x + room.w, 'N'], ['h', room.y + room.d, room.x, room.x + room.w, 'S'], ['v', room.x, room.y, room.y + room.d, 'W'], ['v', room.x + room.w, room.y, room.y + room.d, 'E']]
      .filter(([o, c, a, b, s]) => b - a >= 1.3 && !sides.includes(s) && isExteriorPoint(floor, o, c, (a + b) / 2) && !ops.some(op => op.side === s && op.kind === 'door' && Math.abs(op.t - (a + b) / 2) < 1))
      .sort((p, q) => (sides.includes(OPP[q[4]]) ? 1 : 0) - (sides.includes(OPP[p[4]]) ? 1 : 0));
    if (cand.length) { const [o, c, a, b, s] = cand[0]; const t = (a + b) / 2; suggestWindow = { side: s, compass: sideCompass(s).label, w: { o, x: o === 'h' ? t : c, y: o === 'h' ? c : t, w: r2(Math.min(1.5, b - a - 0.6)), sill: room.type === 'bathroom' ? 1.5 : 0.9, h: room.type === 'bathroom' ? 0.6 : 1.25 } }; sugg.push(`Add a window on the ${suggestWindow.compass} wall for ${sides.includes(OPP[s]) ? 'cross-ventilation' : 'more daylight'}.`); }
  }
  const score = clamp(Math.round((Math.min(wfr, 0.2) / 0.2) * 70 + (opposite ? 30 : sides.length >= 2 ? 22 : sides.length ? 10 : 0)), 0, 100);
  return { wins, winA: r2(winA), wfr, rating, dirs, notes, vent, sugg, suggestWindow, score };
}
function lightAt(floor, x, y, hour) {
  const room = roomAt(x, y, floor); if (!room) return 0;
  const az = sunAz(hour); const up = hour > 6 && hour < 18.5;
  let I = 0.05;
  roomOpenings(room, floor).filter(o => o.kind === 'window' && o.ext).forEach(o => {
    const wp = o.side === 'N' || o.side === 'S' ? [o.t, o.side === 'N' ? room.y : room.y + room.d] : [o.side === 'W' ? room.x : room.x + room.w, o.t];
    const d = Math.hypot(x - wp[0], y - wp[1]);
    const sd = sideCompass(o.side).deg; let diff = Math.abs(((az - sd) % 360 + 540) % 360 - 180);
    const sunF = up ? (diff < 90 ? 0.6 + 0.9 * Math.cos(diff * Math.PI / 180) : 0.55) : 0.1;
    I += (o.w * o.ref.h) * sunF / (1 + d * d * 0.55);
  });
  return Math.min(1, I / 1.6);
}

/* ---------- architecture checks ---------- */
function archChecks(floor = FL()) {
  const out = [], R = floor.rooms;
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const o = rectOverlap(R[i], R[j]); if (o > 0.05) out.push({ lv: 'warn', t: 'Overlapping rooms', d: `${R[i].name} and ${R[j].name} overlap by ${r2(o)} m².`, fix: 'snap' }); }
  let mis = 0; for (let i = 0; i < R.length; i++) for (let j = 0; j < R.length; j++) { if (i === j) continue; const a = R[i], b = R[j]; const gx = b.x - (a.x + a.w), gy = b.y - (a.y + a.d); const oy = Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y), ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x); if ((gx > 0.03 && gx < 0.3 && oy > 0.5) || (gy > 0.03 && gy < 0.3 && ox > 0.5)) mis++; }
  if (mis) out.push({ lv: 'warn', t: 'Misaligned walls', d: `${mis} wall pair(s) have small gaps (3–30 cm) — likely detection noise or drafting errors.`, fix: 'snap' });
  const con = connectivity(floor);
  con.unreachable.filter(r => !isYard(r) && r.type !== 'garage').forEach(r => out.push({ lv: 'warn', t: 'Unreachable room', d: `${r.name} has no door connecting it to the rest of the home.`, fix: 'doors' }));
  const bedT = ['bedroom', 'master', 'guest'];
  if (con.start) R.forEach(r => {
    if (bedT.includes(r.type) || ['bathroom', 'balcony', 'closet', 'study', 'parking', 'garden'].includes(r.type) || con.unreachable.includes(r)) return;
    const seen = new Set([con.start.id]), q = [con.start.id]; while (q.length) { const id = q.shift(); const rr = findRoom(id); if (rr !== con.start && bedT.includes(rr.type)) continue; (con.adj.get(id) || []).forEach(n => { if (!seen.has(n)) { seen.add(n); q.push(n); } }); }
    if (!seen.has(r.id)) out.push({ lv: 'warn', t: 'Circulation through a bedroom', d: `${r.name} can only be reached by walking through a bedroom — consider a passage door.` });
  });
  R.forEach(r => roomOpenings(r, floor).filter(o => o.kind === 'door').forEach(o => { const sw = doorSwingRect(r, o); r.furniture.filter(it => !CATALOG[it.type].flat).forEach(it => { if (rectOverlap(sw, itemFootprint(it)) > 0.02) out.push({ lv: 'warn', t: 'Door clearance', d: `In ${r.name}, the ${CATALOG[it.type].label.toLowerCase()} blocks the ${o.w} m door swing.` }); }); }));
  floor.doors.forEach(d => { if (d.main && d.w < 0.95) out.push({ lv: 'info', t: 'Narrow main door', d: `Main door is ${d.w} m; 1.0 m+ is recommended for moving furniture.` }); });
  R.forEach(r => { const m = Math.min(r.w, r.d); if (['bedroom', 'master', 'living', 'guest'].includes(r.type) && (area(r) < 9.5 || m < 2.4)) out.push({ lv: 'info', t: 'Habitable room size', d: `${r.name} is ${r2(area(r))} m² (min side ${r2(m)} m). Many Indian building bye-laws expect ≥ 9.5 m² with a 2.4 m minimum width for habitable rooms.` }); });
  R.forEach(r => { if (r.type === 'kitchen' && area(r) < 5) out.push({ lv: 'info', t: 'Kitchen size', d: `${r.name} is under the commonly required 5 m².` }); if (r.type === 'bathroom' && area(r) < 1.8) out.push({ lv: 'info', t: 'Bathroom size', d: `${r.name} is under 1.8 m².` }); });
  const wt = S.project.wallThickness; out.push({ lv: 'info', t: 'Wall thickness estimate', d: wt ? `Detected ≈ ${wt.ext} m on outer walls (${wt.ext >= 0.2 ? '9-inch brick, likely load-bearing' : '4.5-inch / block'}) and ≈ ${wt.int} m on partitions, from the plan's scale.` : 'No scale data from the plan; DIMORA assumes 230 mm external and 115 mm internal walls.' });
  S.structuralLog.slice(-4).forEach(s => out.push({ lv: 'warn', t: 'Structural review', d: s }));
  if (S.project.floors.length > 1) {
    const pj = S.project, missing = pj.floors.filter(f => floorAbove(f) && !(f.stairs && f.stairs.length));
    out.push({ lv: missing.length ? 'warn' : 'ok', t: 'Multi-storey', d: `${pj.floors.length} floors (${pj.floors.map(f => f.name).join(', ')}). ${missing.length ? 'No staircase going up from ' + missing.map(f => f.name).join(', ') + ' yet.' : 'Every floor is connected by a staircase.'}` });
    if (floorAbove(floor)) (floor.stairs || []).forEach(st => { const w = stairWidth(st), L = stairLen(st), ff = floor.height + 0.25, n = stairRisers(floor), rise = ff / n, tread = L / n; const steep = rise > 0.19 || tread < 0.25;
      out.push({ lv: w < 0.9 ? 'warn' : 'ok', t: 'Stair width', d: `The flight up to the ${floorAbove(floor).name} is ${w} m wide${w < 0.9 ? ' — narrower than the 0.9–1.0 m usually expected in homes' : ''}.` });
      out.push({ lv: steep ? 'info' : 'ok', t: 'Stair steepness', d: `${n} risers of ${Math.round(rise * 1000)} mm on ${Math.round(tread * 1000)} mm treads over a ${r2(L)} m run${steep ? '. That is steep for a straight flight (about 190 mm risers and 250 mm treads are typical comfort limits); a dog-leg stair or a longer run would be easier to climb' : ''}.` }); });
    if (floorBelow(floor) && !stairsBelow(floor).length) out.push({ lv: 'warn', t: 'No stair arrival', d: `Nothing connects the ${floor.name} to the floor below.` });
  }
  if (!out.some(o => o.lv === 'warn')) out.unshift({ lv: 'ok', t: 'Layout validated', d: 'No overlapping rooms, unreachable spaces or blocked doors found.' });
  return out;
}

/* ---------- AI interior designer helpers ---------- */
function mixHex(a, b, t) { const A = hexToRgb(a), Bc = hexToRgb(b); return rgbToHex(A[0] + (Bc[0] - A[0]) * t, A[1] + (Bc[1] - A[1]) * t, A[2] + (Bc[2] - A[2]) * t); }
function paintSuggestions(room) {
  const L = analyzeLight(room); const hot = L.dirs.some(d => d.includes('W') || d === 'S' || d === 'SW'); const dim = ['Limited', 'Poor', 'No daylight'].includes(L.rating);
  const base = {
    bedroom: [['Sage Mist', '#b9c7ae', 'Calming green lowers visual noise before sleep'], ['Powder Blue', '#c5d6e3', 'Cool and restful'], ['Greige', '#d2c9bb', 'Warm neutral that suits any bedding'], ['Lavender Haze', '#d4cbe2', 'Soft and relaxing']],
    living: [['Warm Linen', '#e9dfcc', 'Versatile neutral that flatters wood and fabrics'], ['Terracotta Blush', '#e2b9a2', 'Earthy warmth for gatherings'], ['Stone Grey', '#cfccc5', 'Modern backdrop for art'], ['Olive Accent', '#a9ad86', 'Great as a single feature wall']],
    kitchen: [['Butter Cream', '#f1e3bd', 'Cheerful and hides stains'], ['Mint Fresh', '#cfe5d6', 'Clean, hygienic feel'], ['Soft White', '#f2efe8', 'Maximises brightness'], ['Mustard Pop', '#e1bf6a', 'Energetic accent for a backsplash wall']],
    bathroom: [['Aqua Spa', '#cfe6e6', 'Spa-like and fresh'], ['Bright White', '#f5f5f2', 'Crisp and clean'], ['Pebble Grey', '#d3d3cf', 'Hides water marks'], ['Sea Glass', '#b9d6cf', 'Calm, watery tone']],
  };
  const fam = { master: 'bedroom', guest: 'bedroom', nursery: 'bedroom', dining: 'living', hall: 'living', study: 'study', office: 'study', reading: 'study', utility: 'bathroom', balcony: 'living', closet: 'bedroom', gym: 'study', pooja: 'living' };
  base.study = [['Focus Blue', '#b8c9da', 'Blue tones support concentration'], ['Sage Study', '#c3cfb5', 'Easy on the eyes for long hours'], ['Chalk White', '#f1efea', 'Maximum brightness on screens'], ['Deep Teal', '#4f7f80', 'Bold feature wall behind the desk']];
  base.gaming = [['Midnight Navy', '#2f3d5a', 'Reduces screen glare and makes RGB pop'], ['Charcoal', '#4a4b4f', 'Immersive, cinema-like'], ['Deep Plum', '#5a3d5c', 'Moody and dramatic'], ['Slate', '#6e7a86', 'Softer dark option']];
  let list = (base[room.type] || base[fam[room.type]] || base.living).map(([n, h, w]) => ({ name: n, hex: h, why: w }));
  if (hot) list.sort((a, b) => coolness(b.hex) - coolness(a.hex)), list[0].why += ' — cool tone offsets hot afternoon/south sun';
  if (dim) list = list.map(s => ({ ...s, hex: mixHex(s.hex, '#ffffff', 0.25) })), list[0].why += ' — lightened because this room gets limited daylight';
  (S.prefs.colors || []).slice(0, 1).forEach(c => list.splice(1, 0, { name: 'Your favourite (wall-ready)', hex: mixHex(c, '#f5f2ec', 0.55), why: 'Your preferred colour softened for full-wall use' }));
  return list.slice(0, 4);
}
function coolness(h) { const [r, g, b] = hexToRgb(h); return b - r; }
function lightingAdvice(room) {
  const t = room.type; const A = area(room);
  const ambient = `${Math.max(2, Math.round(A / 2.5))} × 12W LED panels/downlights (≈${Math.round(A * 150)} lumens for ${r2(A)} m²)`;
  const task = { kitchen: 'Under-cabinet LED strips over the counter', study: 'Adjustable desk lamp (4000K)', office: 'Adjustable desk lamp + bias light behind monitor', bedroom: 'Bedside reading lamps', master: 'Bedside reading lamps + wardrobe sensor lights', living: 'Floor lamp beside the sofa for reading', bathroom: 'Mirror light above the basin', dining: 'Pendant over the dining table', gaming: 'RGB bias lighting behind the setup', reading: 'Floor lamp angled over the armchair' }[t] || 'Wall-mounted task light';
  const accent = { living: 'Cove LEDs + spotlights on art', master: 'Warm cove light in the false ceiling', dining: 'Statement pendant / chandelier', pooja: 'Warm backlight behind the mandir', gaming: 'RGB strips along shelves', bathroom: 'Niche lighting in shower' }[t] || 'Warm 2700K accent strip';
  return { ambient, task, accent, temp: ['kitchen', 'study', 'office', 'bathroom'].includes(t) ? '4000K neutral white' : '2700–3000K warm white' };
}
function ceilingAdvice(room, floor = floorOfRoom(room)) {
  const A = area(room), H = floor.height;
  if (['bathroom', 'utility', 'balcony', 'hall'].includes(room.type)) return { type: 'flat', why: 'Keep plain; use moisture-resistant grid/PVC panels if a false ceiling is needed.' };
  if (H < 2.8) return { type: 'peripheral', why: `Ceiling height ${H} m is low — a slim peripheral band preserves headroom.` };
  if (A > 14) return { type: 'tray', why: 'Large room with good height — a tray ceiling adds depth and hides AC ducts.' };
  return { type: 'cove', why: 'Cove lighting gives soft indirect glow without dropping the whole ceiling.' };
}
function decorAdvice(room) {
  const th = roomTheme(room), name = room.theme || P().theme;
  const m = { Japandi: ['Linen curtains in oat', 'Jute or wool flat-weave rug', 'Ceramic vases, bonsai, paper lantern'], Scandinavian: ['Sheer white curtains', 'Geometric wool rug', 'Pothos, sheepskin throw, line art'], Modern: ['Grey blackout curtains', 'Low-pile solid rug', 'Abstract canvas, sculptural lamp'], Minimalist: ['White roller blinds', 'Single neutral rug', 'One statement plant, no clutter'], Industrial: ['Charcoal canvas curtains', 'Distressed vintage rug', 'Edison bulbs, metal frames'], 'Indian Contemporary': ['Mustard silk-blend curtains', 'Dhurrie or kilim rug', 'Brass urli, Madhubani art, diyas'], Luxury: ['Velvet drapes with sheers', 'Hand-tufted silk rug', 'Gold mirror, crystal decor'], Bohemian: ['Printed cotton curtains', 'Layered kilim rugs', 'Macramé, rattan, trailing plants'] }[name] || ['Linen curtains', 'Neutral rug', 'Plants and art'];
  return { curtains: m[0], rug: m[1], decor: m[2], palette: [th.walls[0], th.wood, th.fabric, th.accent] };
}
function applyTheme(name, rooms) {
  if (!THEMES[name]) return false; const th = THEMES[name];
  if (!rooms) { S.project.theme = name; allRooms().forEach(r => { r.theme = null; r.wall = null; r.floor = null; r.ceiling = null; r.furniture.forEach(i => { i.color = null; i.finish = null; }); }); }
  else rooms.forEach(r => { r.theme = name; r.wall = null; r.floor = null; r.ceiling = null; r.furniture.forEach(i => { i.color = null; i.finish = null; }); });
  (rooms || allRooms()).forEach(r => syncThemeDecor(r));
  return true;
}
/* Indian themes change more than colours: they bring the things an Indian home actually has.
   Items added this way carry themeDecor so they leave again when the theme changes. */
function syncThemeDecor(room) {
  if (isYard(room) || !room.furniture) return; const th = roomTheme(room), floor = floorOfRoom(room);
  room.furniture = room.furniture.filter(i => !i.themeDecor || th.indian);
  room.furniture.forEach(i => { // carved teak bed in the heritage theme; back to the regular bed otherwise
    if (th.carved && i.type === 'bed_double') { i.wasType = 'bed_double'; i.type = 'bed_carved'; i.h = CATALOG.bed_carved.h; }
    else if (!th.carved && i.type === 'bed_carved' && i.wasType) { i.type = i.wasType; i.h = CATALOG[i.type].h; delete i.wasType; }
  });
  if (!th.indian || room.type !== 'living') return;
  const has = t => room.furniture.some(i => i.type === t), sides = sideScores(room, floor), A = area(room);
  const add = it => { if (it) { it.themeDecor = true; if (!room.furniture.includes(it)) room.furniture.push(it); } return it; };
  const wall = (t, list, opt) => { const it = tryWalls(room, floor, t, list, opt); if (it) it.themeDecor = true; return it; };
  if (!has('pooja_unit') && !allRooms().some(r => r.type === 'pooja')) wall('pooja_unit', sides.slice().reverse(), { align: 'end' });
  // the corner farthest from the TV and the sofa, so new pieces don't block the view
  const busy = room.furniture.filter(i => ['tv_unit', 'sofa_3', 'sofa_l', 'coffee_table'].includes(i.type));
  const corners = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].map(([a, b]) => [room.x + room.w * a, room.y + room.d * b]);
  const far = corners.sort((p, q) => Math.min(...busy.map(i => Math.hypot(q[0] - i.x, q[1] - i.y)), 99) - Math.min(...busy.map(i => Math.hypot(p[0] - i.x, p[1] - i.y)), 99))[0];
  if (th.carved) {
    if (!has('diwan') && A >= 12) { // a diwan takes the armchair's place if the walls are full
      if (!wall('diwan', sides.slice().reverse(), { align: 'start' }) && !add(placeFree(room, floor, 'diwan', { near: far }))) {
        const ac = room.furniture.find(i => i.type === 'armchair'); if (ac) { room.furniture = room.furniture.filter(i => i !== ac); if (!add(placeFree(room, floor, 'diwan', { near: [ac.x, ac.y] }))) room.furniture.push(ac); }
      }
    }
    if (!has('jaali_partition') && A >= 16) wall('jaali_partition', sides, { align: 'end' }) || add(placeFree(room, floor, 'jaali_partition', { near: far }));
  } else if (!has('jhoola') && A >= 15) add(placeFree(room, floor, 'jhoola', { near: far }));
  if (!has('urli')) { const main = roomOpenings(room, floor).find(o => o.kind === 'door' && o.ref.main); add(placeFree(room, floor, 'urli', { near: main ? [main.ref.x, main.ref.y] : [room.x + room.w / 2, room.y + room.d / 2] })); }
  if (!has('brass_lamp')) add(placeFree(room, floor, 'brass_lamp', { near: [room.x + room.w - 0.4, room.y + 0.4] }));
}
/* the wall behind the TV (living) or the bed (bedrooms) gets a hand-painted floral stencil in Indian themes */
function accentWallOf(room) {
  const th = roomTheme(room); if (!th.stencil || !room.furniture) return null;
  const it = room.type === 'living' ? room.furniture.find(i => i.type === 'tv_unit') : /bed|master|guest/.test(room.type) ? room.furniture.find(i => /^bed_/.test(i.type)) : null; if (!it) return null;
  const side = Object.keys(SIDE_ROT).find(k => SIDE_ROT[k] === it.rot); if (!side) return null;
  return { o: side === 'N' || side === 'S' ? 'h' : 'v', c: { N: room.y, S: room.y + room.d, W: room.x, E: room.x + room.w }[side], color: th.stencil };
}
function transformRoom(room, to) {
  const before = roomCost(room).total; const oldType = room.type;
  if (!ROOM_TYPES[to]) return { before, after: before, kept: [], added: [] }; // unknown type: leave the room untouched
  room.type = to; const keepName = /bed ?room|room \d|empty/i.test(room.name) || ROOM_TYPES[oldType]?.label === room.name;
  if (keepName || true) room.name = ROOM_TYPES[to].label + (allRooms().filter(r => r.type === to && r !== room).length ? ' ' + (allRooms().filter(r => r.type === to).length) : '');
  room.wall = paintSuggestions(room)[0].hex; room.floor = null; room.ceiling = null;
  if (to === 'gym') room.floor = 'carpet';
  autoFurnish(room);
  return { before, after: roomCost(room).total, from: oldType };
}

/* ===================== FLOOR PLAN INPUT & DETECTION ===================== */
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); }); }
async function ensurePdfJs() {
  if (window.pdfjsLib) return;
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; } catch (e) { }
}
async function fileToImageURL(file) {
  if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
    await ensurePdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1); const vp = page.getViewport({ scale: 2 });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return c.toDataURL('image/png');
  }
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
}
function loadImage(url) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Image could not be decoded')); i.src = url; }); }

/* Draw a realistic black-line floor plan image of a model (used for the sample plan) */
function drawPlanImage(project, fi = 0) {
  const f = project.floors[fi], ppm = 48, m = 70; const b = homeBounds(f);
  const c = document.createElement('canvas'); c.width = Math.round(b.w * ppm + m * 2); c.height = Math.round(b.d * ppm + m * 2);
  const x = c.getContext('2d'); x.fillStyle = '#fbfaf7'; x.fillRect(0, 0, c.width, c.height);
  const X = v => m + (v - b.x) * ppm, Y = v => m + (v - b.y) * ppm;
  x.fillStyle = '#1b1b1b';
  wallPieces(f).forEach(p => {
    const t = (p.ext ? 0.23 : 0.12) * ppm;
    if (p.kind === 'lintel') return;
    if (p.kind === 'head') return;
    if (p.kind === 'rail') { x.strokeStyle = '#1b1b1b'; x.lineWidth = 1.2; [-t / 4, t / 4].forEach(o => { x.beginPath(); if (p.o === 'h') { x.moveTo(X(p.a), Y(p.c) + o); x.lineTo(X(p.b), Y(p.c) + o); } else { x.moveTo(X(p.c) + o, Y(p.a)); x.lineTo(X(p.c) + o, Y(p.b)); } x.stroke(); }); return; }
    if (p.kind === 'sill') { // window symbol: thin double line
      x.strokeStyle = '#1b1b1b'; x.lineWidth = 1.4;
      [-t / 2, 0, t / 2].forEach(o => { x.beginPath(); if (p.o === 'h') { x.moveTo(X(p.a), Y(p.c) + o); x.lineTo(X(p.b), Y(p.c) + o); } else { x.moveTo(X(p.c) + o, Y(p.a)); x.lineTo(X(p.c) + o, Y(p.b)); } x.stroke(); });
      return;
    }
    if (p.o === 'h') x.fillRect(X(p.a) - t / 2, Y(p.c) - t / 2, (p.b - p.a) * ppm + t, t); else x.fillRect(X(p.c) - t / 2, Y(p.a) - t / 2, t, (p.b - p.a) * ppm + t);
  });
  // doors: arcs
  x.strokeStyle = '#333'; x.lineWidth = 1.2;
  f.doors.forEach(d => {
    const w = d.w * ppm; x.beginPath();
    if (d.o === 'h') { const hx = X(d.x - d.w / 2), hy = Y(d.y); x.moveTo(hx, hy); x.lineTo(hx, hy + w); x.arc(hx, hy, w, Math.PI / 2, 0, true); }
    else { const hx = X(d.x), hy = Y(d.y - d.w / 2); x.moveTo(hx, hy); x.lineTo(hx + w, hy); x.arc(hx, hy, w, 0, Math.PI / 2); }
    x.stroke();
  });
  x.fillStyle = '#222'; x.textAlign = 'center';
  f.rooms.forEach(r => {
    const cx = X(r.x + r.w / 2), cy = Y(r.y + r.d / 2);
    x.font = `600 ${Math.max(9, Math.min(14, r.w * 4))}px Arial`; x.fillText(r.name.toUpperCase(), cx, cy - 3);
    x.font = `${Math.max(8, Math.min(12, r.w * 3.4))}px Arial`; x.fillText(`${r.w.toFixed(1)} x ${r.d.toFixed(1)} m`, cx, cy + 13);
  });
  // staircases: light tread lines (this flight going up, and the flight arriving from below)
  const below = project.floors.filter(o => o.level < f.level).sort((p, q) => q.level - p.level)[0];
  [...(f.stairs || []).map(st => [st, 'UP']), ...((below && below.stairs) || []).map(st => [st, 'DN'])].forEach(([st, tag]) => {
    const ft = { x: st.x - st.w / 2, y: st.y - st.d / 2 }; const runZ = (st.run || 'z') === 'z', L = runZ ? st.d : st.w, n = 14;
    x.strokeStyle = '#c4c4c4'; x.lineWidth = 1; x.strokeRect(X(ft.x), Y(ft.y), st.w * ppm, st.d * ppm);
    for (let i = 1; i < n; i++) { x.beginPath(); if (runZ) { const yy = Y(ft.y + L * i / n); x.moveTo(X(ft.x), yy); x.lineTo(X(ft.x + st.w), yy); } else { const xx = X(ft.x + L * i / n); x.moveTo(xx, Y(ft.y)); x.lineTo(xx, Y(ft.y + st.d)); } x.stroke(); }
    x.fillStyle = '#9a9a9a'; x.font = '600 10px Arial'; x.textAlign = 'center'; x.fillText(tag, X(st.x), Y(st.y) + 4); x.fillStyle = '#222';
  });
  // overall dimension
  x.strokeStyle = '#555'; x.lineWidth = 1; x.beginPath(); x.moveTo(X(b.x), m - 34); x.lineTo(X(b.x + b.w), m - 34); x.stroke();
  [X(b.x), X(b.x + b.w)].forEach(px => { x.beginPath(); x.moveTo(px, m - 42); x.lineTo(px, m - 26); x.stroke(); });
  x.font = '600 13px Arial'; x.fillText(`${b.w.toFixed(2)} m`, (X(b.x) + X(b.x + b.w)) / 2, m - 40);
  x.save(); x.translate(m - 40, (Y(b.y) + Y(b.y + b.d)) / 2); x.rotate(-Math.PI / 2); x.fillText(`${b.d.toFixed(2)} m`, 0, 0); x.restore();
  x.beginPath(); x.moveTo(m - 32, Y(b.y)); x.lineTo(m - 32, Y(b.y + b.d)); x.stroke();
  x.font = '600 12px Arial'; x.textAlign = 'left'; x.fillText('N ↑', c.width - 50, 30);
  return { url: c.toDataURL('image/png'), widthM: b.w };
}

/* -------- classical computer-vision room detection -------- */
function cvDetect(img) {
  const maxD = 760, sc = Math.min(1, maxD / Math.max(img.width, img.height));
  const W = Math.max(8, Math.round(img.width * sc)), H = Math.max(8, Math.round(img.height * sc));
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.drawImage(img, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data; const N = W * H; const gray = new Uint8Array(N);
  const hist = new Array(256).fill(0);
  for (let i = 0; i < N; i++) { const v = (px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11) | 0; gray[i] = v; hist[v]++; }
  // Otsu
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sB = 0, wB = 0, best = 0, thr = 128;
  for (let t = 0; t < 256; t++) { wB += hist[t]; if (!wB) continue; const wF = N - wB; if (!wF) break; sB += t * hist[t]; const mB = sB / wB, mF = (sum - sB) / wF; const v = wB * wF * (mB - mF) ** 2; if (v > best) { best = v; thr = t; } }
  thr = clamp(Math.max(thr, 175), 120, 215);
  const wall = new Uint8Array(N); let dark = 0; for (let i = 0; i < N; i++) if (gray[i] < thr) { wall[i] = 1; dark++; }
  // drop small dark blobs (text, dimension numbers, symbols) so they don't split rooms
  { const seen = new Uint8Array(N), st = new Int32Array(N), lim = Math.max(W, H) * 0.035; const tmp = [];
    for (let s0 = 0; s0 < N; s0++) { if (!wall[s0] || seen[s0]) continue; let sp = 0; st[sp++] = s0; seen[s0] = 1; let x0 = W, y0 = H, x1 = 0, y1 = 0; tmp.length = 0;
      while (sp) { const k = st[--sp]; tmp.push(k); const x = k % W, y = (k / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const kk = yy * W + xx; if (wall[kk] && !seen[kk]) { seen[kk] = 1; st[sp++] = kk; } } }
      if (Math.max(x1 - x0, y1 - y0) < lim) tmp.forEach(k => wall[k] = 0); } }
  // thick-stroke mask (opening) for wall thickness estimate
  const runs = [];
  for (let y = 0; y < H; y += 2) { let run = 0; for (let x = 0; x < W; x++) { if (wall[y * W + x]) run++; else { if (run >= 2 && run < 40) runs.push(run); run = 0; } } }
  runs.sort((a, b) => a - b);
  const thick = runs.filter(r => r >= 3);
  const intPx = thick.length ? thick[Math.floor(thick.length * 0.5)] : 3, extPx = thick.length ? thick[Math.floor(thick.length * 0.9)] : 6;
  // dilate to close door gaps
  const r = Math.max(2, Math.round(Math.max(W, H) * (+S.cvGap || 0.012)));
  const dil = (src) => { const t = new Uint8Array(N), o = new Uint8Array(N);
    for (let y = 0; y < H; y++) { let cnt = 0; for (let x = -r; x < W + r; x++) { if (x + r < W && x + r >= 0 && src[y * W + x + r]) cnt++; if (x - r - 1 >= 0 && x - r - 1 < W && src[y * W + x - r - 1]) cnt--; if (x >= 0 && x < W) t[y * W + x] = cnt > 0 ? 1 : 0; } }
    for (let x = 0; x < W; x++) { let cnt = 0; for (let y = -r; y < H + r; y++) { if (y + r < H && y + r >= 0 && t[(y + r) * W + x]) cnt++; if (y - r - 1 >= 0 && y - r - 1 < H && t[(y - r - 1) * W + x]) cnt--; if (y >= 0 && y < H) o[y * W + x] = cnt > 0 ? 1 : 0; } }
    return o; };
  const closed = dil(wall);
  // label free regions
  const lab = new Int32Array(N).fill(-1); const comps = [];
  const stack = new Int32Array(N);
  for (let s = 0; s < N; s++) {
    if (closed[s] || lab[s] !== -1) continue;
    const id = comps.length; let sp = 0; stack[sp++] = s; lab[s] = id;
    let x0 = W, y0 = H, x1 = 0, y1 = 0, cnt = 0, border = false;
    while (sp) { const k = stack[--sp]; const x = k % W, y = (k / W) | 0; cnt++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
      if (x > 0 && !closed[k - 1] && lab[k - 1] === -1) { lab[k - 1] = id; stack[sp++] = k - 1; }
      if (x < W - 1 && !closed[k + 1] && lab[k + 1] === -1) { lab[k + 1] = id; stack[sp++] = k + 1; }
      if (y > 0 && !closed[k - W] && lab[k - W] === -1) { lab[k - W] = id; stack[sp++] = k - W; }
      if (y < H - 1 && !closed[k + W] && lab[k + W] === -1) { lab[k + W] = id; stack[sp++] = k + W; } }
    comps.push({ id, x0, y0, x1, y1, cnt, border });
  }
  const minA = N * 0.0025;
  const grow = r + Math.round(intPx / 2);
  let rooms = comps.filter(c => !c.border && c.cnt > minA).map(c => {
    // robust rectangle: rows/columns where the region is dense (ignores door-swing protrusions)
    const cw = c.x1 - c.x0 + 1, ch = c.y1 - c.y0 + 1, colC = new Int32Array(cw), rowC = new Int32Array(ch);
    for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (lab[y * W + x] === c.id) { colC[x - c.x0]++; rowC[y - c.y0]++; }
    const mc = Math.max(...colC), mr = Math.max(...rowC); let a = 0, b2 = cw - 1, t = 0, u = ch - 1;
    while (a < b2 && colC[a] < mc * 0.3) a++; while (b2 > a && colC[b2] < mc * 0.3) b2--; while (t < u && rowC[t] < mr * 0.3) t++; while (u > t && rowC[u] < mr * 0.3) u--;
    return { x0: Math.max(0, c.x0 + a - grow), y0: Math.max(0, c.y0 + t - grow), x1: Math.min(W, c.x0 + b2 + grow + 1), y1: Math.min(H, c.y0 + u + grow + 1), fill: c.cnt / (cw * ch) };
  });
  // drop nested components (furniture outlines inside rooms)
  rooms = rooms.filter(a => !rooms.some(b => b !== a && a.x0 >= b.x0 - 2 && a.y0 >= b.y0 - 2 && a.x1 <= b.x1 + 2 && a.y1 <= b.y1 + 2 && (b.x1 - b.x0) * (b.y1 - b.y0) > (a.x1 - a.x0) * (a.y1 - a.y0) * 1.2));
  // snap the dilation-expanded box edges to centre of walls (expansion r ≈ wall centre)
  return { W, H, rooms, intPx, extPx, dark: dark / N };
}
function heuristicTypes(rooms, all = rooms) {
  const count = {}; const nm = t => { count[t] = (count[t] || 0) + 1; return ROOM_TYPES[t].label + (['bedroom', 'bathroom'].includes(t) ? ' ' + count[t] : ''); };
  const bb = { x0: Math.min(...all.map(r => r.x)), y0: Math.min(...all.map(r => r.y)), x1: Math.max(...all.map(r => r.x + r.w)), y1: Math.max(...all.map(r => r.y + r.d)) };
  const onEdge = r => r.x - bb.x0 < 0.3 || r.y - bb.y0 < 0.3 || bb.x1 - (r.x + r.w) < 0.3 || bb.y1 - (r.y + r.d) < 0.3;
  const left = rooms.slice().sort((a, b) => area(b) - area(a)); const set = (r, t) => { r.type = t; left.splice(left.indexOf(r), 1); };
  const living = all.find(r => r.type === 'living' && !rooms.includes(r)) || left.find(r => area(r) > 8); if (living && rooms.includes(living)) set(living, 'living');
  left.slice().forEach(r => { const asp = Math.max(r.w, r.d) / Math.min(r.w, r.d); if (asp > 2.05 && Math.min(r.w, r.d) < 1.9) set(r, onEdge(r) && area(r) < 9 ? 'balcony' : 'hall'); });
  if (living) {
    const biggest = left[0];
    const din = left.filter(r => r !== biggest && area(r) >= 6 && area(r) <= 14 && Math.max(r.w, r.d) / Math.min(r.w, r.d) < 1.7 && sharedEdge(r, living)).sort((a, b) => area(b) - area(a))[0];
    if (din) { set(din, 'dining'); const kit = left.filter(r => area(r) >= 4.4 && area(r) <= 12.5 && sharedEdge(r, din)).sort((a, b) => area(b) - area(a))[0]; if (kit) set(kit, 'kitchen'); }
  }
  let master = false;
  left.slice().forEach(r => { const A = area(r); if (A >= 8.5) { set(r, master ? 'bedroom' : 'master'); master = true; } });
  if (!all.some(r => r.type === 'kitchen')) { const k = left.filter(r => area(r) >= 4.4).sort((a, b) => area(b) - area(a))[0]; if (k) set(k, 'kitchen'); }
  left.slice().forEach(r => { const A = area(r); set(r, A < 2.4 ? 'utility' : A < 4.6 ? 'bathroom' : 'study'); });
  rooms.forEach(r => r.name = nm(r.type));
}
/* Read one floor-plan image: computer vision + (optionally) AI. Returns pixel-space data; no scale applied yet. */
async function readPlan(url, opts = {}) {
  const log = opts.log || (() => { }); const tag = opts.tag ? opts.tag + ' — ' : '';
  const img = await loadImage(url);
  log(tag + 'analysing line work, walls and enclosed spaces…');
  const cv = cvDetect(img);
  log(`${tag}computer vision found ${cv.rooms.length} enclosed regions.`);
  let gem = null, source = 'Computer vision';
  if (opts.useAI !== false) log(tag + 'backend offline — reading the plan with in-browser computer vision only (no AI).');
  const pct = (b, i, pre) => Array.isArray(b) && b.length === 4 && b.every(v => isFinite(+v)) && +b[2] > +b[0] && +b[3] > +b[1] ? { id: pre + i, x0: b[0] / 100 * cv.W, y0: b[1] / 100 * cv.H, x1: b[2] / 100 * cv.W, y1: b[3] / 100 * cv.H } : null;
  let pxRooms = cv.rooms.map((r, i) => ({ id: 'R' + (i + 1), x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 }));
  if (gem) {
    if (cv.rooms.length < 2 && gem.rooms_full?.length) pxRooms = gem.rooms_full.map((r, i) => { const b = pct(r.bbox, i + 1, 'R'); return b && Object.assign(b, { name: r.name, type: r.type }); }).filter(Boolean);
    else {
      (gem.rooms || []).forEach(g => { const pr = pxRooms.find(p => p.id === g.id); if (pr) { pr.name = g.name; pr.type = g.type; } });
      (gem.extra_rooms || []).forEach((g, i) => { const b = pct(g.bbox, i, 'X'); if (b) pxRooms.push(Object.assign(b, { name: g.name, type: g.type })); });
    }
  }
  if (!pxRooms.length) throw new Error('No rooms could be detected. Try a cleaner, high-contrast plan (dark walls on white) or start the DIMORA backend with Cloudflare AI.');
  // a room labelled "staircase" is circulation space
  pxRooms.forEach(r => { if (/stair/i.test(r.name || '')) r.type = 'hall'; });
  const pxStairs = gem && Array.isArray(gem.stairs) ? gem.stairs.map((b, i) => pct(b, i, 'S')).filter(Boolean) : [];
  const bx0 = Math.min(...pxRooms.map(r => r.x0)), by0 = Math.min(...pxRooms.map(r => r.y0)), bx1 = Math.max(...pxRooms.map(r => r.x1)), by1 = Math.max(...pxRooms.map(r => r.y1));
  const gw = gem ? +gem.plan_width_m : 0;
  const lvl = gem && gem.level != null && isFinite(+gem.level) ? Math.round(+gem.level) : null;
  return { img, cv, gem, source, pxRooms, pxStairs, bx0, by0, bx1, by1, pxW: bx1 - bx0, nat: img.width / cv.W, widthM: gw > 2 && gw < 80 ? gw : 0, label: gem && typeof gem.floor_label === 'string' ? gem.floor_label.trim() : '', level: lvl, off: [0, 0] };
}
/* Turn a reading into rooms / doors / windows on `floor`. mpp = metres per computer-vision pixel. */
function buildFloorFromReading(rd, floor, mpp, opts = {}) {
  const { cv, gem, bx0, by0 } = rd;
  floor.rooms = []; floor.doors = []; floor.windows = []; floor.stairs = [];
  rd.pxRooms.forEach(pr => {
    const room = makeRoom({ x: r2((pr.x0 - bx0) * mpp), y: r2((pr.y0 - by0) * mpp), w: r2((pr.x1 - pr.x0) * mpp), d: r2((pr.y1 - pr.y0) * mpp), type: ROOM_TYPES[pr.type] ? pr.type : 'empty' });
    if (pr.name) room.name = String(pr.name).toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).slice(0, 28);
    room._typed = !!ROOM_TYPES[pr.type];
    floor.rooms.push(room);
  });
  snapRooms(floor, 0.35);
  if (!floor.rooms.every(r => r._typed)) { const untyped = floor.rooms.filter(r => !r._typed); heuristicTypes(untyped, floor.rooms); }
  floor.rooms.forEach(r => delete r._typed);
  floor.rooms = floor.rooms.filter(r => area(r) > 0.8);
  floor.rooms.sort((a, b) => area(b) - area(a));
  for (let i = floor.rooms.length - 1; i >= 0; i--) { const a = floor.rooms[i]; if (floor.rooms.some((b, j) => j < i && rectOverlap(a, b) > area(a) * 0.6)) floor.rooms.splice(i, 1); }
  if (gem) {
    const lines = wallLines(floor);
    const snapTo = (nx, ny, isDoor) => { const x = (nx / 100 * cv.W - bx0) * mpp, y = (ny / 100 * cv.H - by0) * mpp; let best = null;
      lines.forEach(L => { const t = clamp(L.o === 'h' ? x : y, L.a, L.b); const d = L.o === 'h' ? Math.hypot(x - t, y - L.c) : Math.hypot(x - L.c, y - t); if (d < 0.6 && (!best || d < best.d)) best = { d, L, t }; });
      if (!best) return null; const L = best.L, w = isDoor ? 0.9 : 1.2; const t = clamp(best.t, L.a + w / 2 + 0.05, L.b - w / 2 - 0.05);
      return { o: L.o, x: r2(L.o === 'h' ? t : L.c), y: r2(L.o === 'h' ? L.c : t), w }; };
    (gem.doors || []).slice(0, 30).forEach(p => { const s = Array.isArray(p) && snapTo(p[0], p[1], true); if (s && !floor.doors.some(d => Math.hypot(d.x - s.x, d.y - s.y) < 0.8)) floor.doors.push(Object.assign({ id: uid('d') }, s)); });
    (gem.windows || []).slice(0, 40).forEach(p => { const s = Array.isArray(p) && snapTo(p[0], p[1], false); if (s && isExteriorPoint(floor, s.o, s.o === 'h' ? s.y : s.x, s.o === 'h' ? s.x : s.y) && !floor.windows.some(d => Math.hypot(d.x - s.x, d.y - s.y) < 0.8)) floor.windows.push(Object.assign({ id: uid('w'), sill: 0.9, h: 1.25 }, s)); });
  }
  autoOpenings(floor, { main: opts.main !== false });
  // staircase candidates (metres): AI stair boxes + rooms labelled "staircase"
  floor._stairRects = rd.pxStairs.map(s => ({ x: r2((s.x0 - bx0) * mpp), y: r2((s.y0 - by0) * mpp), w: r2((s.x1 - s.x0) * mpp), d: r2((s.y1 - s.y0) * mpp), src: 'ai' })).filter(s => Math.min(s.w, s.d) >= 0.6 && Math.max(s.w, s.d) >= 1.5 && Math.max(s.w, s.d) <= 9);
  floor.rooms.filter(r => /stair/i.test(r.name)).forEach(r => { if (!floor._stairRects.some(s => rectOverlap(s, r) > area(s) * 0.3)) floor._stairRects.push({ x: r.x, y: r.y, w: r.w, d: r.d, src: 'label' }); });
  rd.mpp = mpp;
}
function setThicknessFrom(rd) { P().wallThickness = { ext: r2(Math.max(0.15, Math.min(0.35, rd.cv.extPx * rd.mpp))), int: r2(Math.max(0.08, Math.min(0.25, rd.cv.intPx * rd.mpp))) }; }
async function detectPlan(url, opts = {}) { // single floor
  const rd = await readPlan(url, opts);
  let widthM = +opts.widthM || rd.widthM || opts.defaultWidth || 12;
  buildFloorFromReading(rd, FL(), widthM / rd.pxW);
  delete FL()._stairRects;
  setThicknessFrom(rd);
  P().scaleNote = `${rd.source} · scale ${r2(rd.mpp * 100)} cm/px · plan width ${r2(widthM)} m`;
  return rd;
}

/* ===================== MULTI-FLOOR: sheet splitting, floor ordering, alignment & stairs ===================== */
const FLOOR_NAMES = ['Ground', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth'].map(w => w + ' Floor');
const floorName = k => FLOOR_NAMES[k] || `${k}${k % 100 >= 10 && k % 100 <= 20 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] || 'th')} Floor`;
async function fileToSheets(file) {
  const base = file.name.replace(/\.\w+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 40);
  if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
    await ensurePdfJs();
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise; const out = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 8); i++) {
      const page = await pdf.getPage(i); const vp = page.getViewport({ scale: 2 });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise; out.push({ url: c.toDataURL('image/png'), name: pdf.numPages > 1 ? `${base} · page ${i}` : base });
    }
    return out;
  }
  return [{ url: await fileToImageURL(file), name: base }];
}
async function filesToSheets(files) { const out = []; for (const f of Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) out.push(...await fileToSheets(f)); return out; }
/* Find separate floor-plan drawings on one sheet: big clusters of line work separated by white space. Returns fractional boxes. */
/* A drawing border (often joined to the title block) spans the whole sheet but is nearly empty
   inside. Left in, it glues every floor plan on the sheet into one. Remove such ink components. */
function removeSheetFrame(dark, W, H) {
  const N = W * H, lab = new Int32Array(N).fill(-1), st = new Int32Array(N); let id = 0;
  for (let s0 = 0; s0 < N; s0++) {
    if (!dark[s0] || lab[s0] !== -1) continue; let sp = 0; st[sp++] = s0; lab[s0] = id; let x0 = W, y0 = H, x1 = 0, y1 = 0, a = 0; const members = [];
    while (sp) { const k = st[--sp]; members.push(k); a++; const x = k % W, y = (k / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const n of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1, x > 0 && y > 0 ? k - W - 1 : -1, x < W - 1 && y < H - 1 ? k + W + 1 : -1, x < W - 1 && y > 0 ? k - W + 1 : -1, x > 0 && y < H - 1 ? k + W - 1 : -1])
        if (n >= 0 && dark[n] && lab[n] === -1) { lab[n] = id; st[sp++] = n; } }
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (w >= 0.85 * W && h >= 0.85 * H && a < 0.045 * w * h) members.forEach(k => { dark[k] = 0; });
    id++;
  }
}
function splitSheet(img) {
  const mx = 640, sc = Math.min(1, mx / Math.max(img.width, img.height)); const W = Math.max(8, Math.round(img.width * sc)), H = Math.max(8, Math.round(img.height * sc)), N = W * H;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H);
  const px = x.getImageData(0, 0, W, H).data; const dark = new Uint8Array(N);
  for (let i = 0; i < N; i++) dark[i] = (px[i * 4] * 0.3 + px[i * 4 + 1] * 0.59 + px[i * 4 + 2] * 0.11) < 170 ? 1 : 0;
  removeSheetFrame(dark, W, H);
  const r = Math.max(2, Math.round(Math.max(W, H) * 0.018)); const t = new Uint8Array(N), m = new Uint8Array(N);
  for (let y = 0; y < H; y++) { let cnt = 0; for (let xx = -r; xx < W + r; xx++) { if (xx + r < W && xx + r >= 0 && dark[y * W + xx + r]) cnt++; if (xx - r - 1 >= 0 && xx - r - 1 < W && dark[y * W + xx - r - 1]) cnt--; if (xx >= 0 && xx < W) t[y * W + xx] = cnt > 0 ? 1 : 0; } }
  for (let xx = 0; xx < W; xx++) { let cnt = 0; for (let y = -r; y < H + r; y++) { if (y + r < H && y + r >= 0 && t[(y + r) * W + xx]) cnt++; if (y - r - 1 >= 0 && y - r - 1 < H && t[(y - r - 1) * W + xx]) cnt--; if (y >= 0 && y < H) m[y * W + xx] = cnt > 0 ? 1 : 0; } }
  const lab = new Int32Array(N).fill(-1), st = new Int32Array(N), comps = [];
  for (let s0 = 0; s0 < N; s0++) {
    if (!m[s0] || lab[s0] !== -1) continue; const id = comps.length; let sp = 0; st[sp++] = s0; lab[s0] = id; let x0 = W, y0 = H, x1 = 0, y1 = 0, ink = 0;
    while (sp) { const k = st[--sp]; const xx = k % W, y = (k / W) | 0; if (dark[k]) ink++; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (xx > 0 && m[k - 1] && lab[k - 1] === -1) { lab[k - 1] = id; st[sp++] = k - 1; } if (xx < W - 1 && m[k + 1] && lab[k + 1] === -1) { lab[k + 1] = id; st[sp++] = k + 1; }
      if (y > 0 && m[k - W] && lab[k - W] === -1) { lab[k - W] = id; st[sp++] = k - W; } if (y < H - 1 && m[k + W] && lab[k + W] === -1) { lab[k + W] = id; st[sp++] = k + W; } }
    comps.push({ x0: Math.max(0, x0 - r), y0: Math.max(0, y0 - r), x1: Math.min(W, x1 + r + 1), y1: Math.min(H, y1 + r + 1), ink });
  }
  const ba = b => (b.x1 - b.x0) * (b.y1 - b.y0); const big = Math.max(1, ...comps.map(ba));
  // a floor plan has walls: long straight runs of ink. Title blocks, notes and legends (text) don't.
  const longRun = b => { let best = 0; for (let y = b.y0; y < b.y1; y++) { let run = 0; for (let xx = b.x0; xx < b.x1; xx++) { run = dark[y * W + xx] ? run + 1 : 0; if (run > best) best = run; } }
    let bestV = 0; for (let xx = b.x0; xx < b.x1; xx++) { let run = 0; for (let y = b.y0; y < b.y1; y++) { run = dark[y * W + xx] ? run + 1 : 0; if (run > bestV) bestV = run; } }
    return Math.max(best / Math.max(1, b.x1 - b.x0), bestV / Math.max(1, b.y1 - b.y0)); };
  let plans = comps.filter(b => ba(b) >= big * 0.16 && Math.min(b.x1 - b.x0, b.y1 - b.y0) >= Math.min(W, H) * 0.14 && b.ink > 40 && longRun(b) >= 0.2);
  plans = plans.filter(a => !plans.some(b => b !== a && a.x0 >= b.x0 && a.y0 >= b.y0 && a.x1 <= b.x1 && a.y1 <= b.y1));
  plans = plans.sort((a, b) => ba(b) - ba(a)).slice(0, 6);
  const rowTol = H * 0.2; plans.sort((a, b) => Math.abs(a.y0 - b.y0) < rowTol ? a.x0 - b.x0 : a.y0 - b.y0);
  if (!plans.length) return [{ x0: 0, y0: 0, x1: 1, y1: 1 }];
  return plans.map(b => ({ x0: b.x0 / W, y0: b.y0 / H, x1: b.x1 / W, y1: b.y1 / H }));
}
/* Pad each plan box (so its printed title stays in the crop) without running into a neighbouring plan. */
function padBoxes(boxes, pad = 0.05) {
  return boxes.map((b, i) => {
    const e = { x0: Math.max(0, b.x0 - pad), y0: Math.max(0, b.y0 - pad * 1.6), x1: Math.min(1, b.x1 + pad), y1: Math.min(1, b.y1 + pad * 1.6) };
    boxes.forEach((o, j) => { if (j === i) return;
      if (b.x1 <= o.x0) e.x1 = Math.min(e.x1, (b.x1 + o.x0) / 2); else if (o.x1 <= b.x0) e.x0 = Math.max(e.x0, (o.x1 + b.x0) / 2);
      else if (b.y1 <= o.y0) e.y1 = Math.min(e.y1, (b.y1 + o.y0) / 2); else if (o.y1 <= b.y0) e.y0 = Math.max(e.y0, (o.y1 + b.y0) / 2); });
    return e;
  });
}
function evenSplit(n, img) {
  const wide = img.width >= img.height; const cols = n === 4 ? 2 : wide ? n : 1, rows = n === 4 ? 2 : wide ? 1 : n; const out = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ x0: i / cols, y0: j / rows, x1: (i + 1) / cols, y1: (j + 1) / rows });
  return out;
}
function cropToURL(img, b) {
  const x = Math.round(b.x0 * img.width), y = Math.round(b.y0 * img.height), w = Math.max(8, Math.round((b.x1 - b.x0) * img.width)), h = Math.max(8, Math.round((b.y1 - b.y0) * img.height));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  return c.toDataURL('image/png');
}
function parseLevel(s) {
  s = String(s || '').toLowerCase(); if (!s) return null;
  if (/basement|cellar|lower ground/.test(s)) return -1;
  if (/ground|\bg\.?\s?f\b|stilt|\bgf\b|\bg\s*floor/.test(s)) return 0;
  if (/terrace|roof/.test(s)) return 50;
  const words = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
  for (let i = 0; i < words.length; i++) if (new RegExp('\\b' + words[i] + '\\b').test(s)) return i + 1;
  const m = /\b(\d)\s*(st|nd|rd|th)\b/.exec(s) || /\bfloor\s*(\d)\b/.exec(s) || /\b(\d)\s*f\b/.exec(s); if (m) return +m[1];
  if (/\bf\.?\s?f\b|\bff\b/.test(s)) return 1; if (/\bs\.?\s?f\b|\bsf\b/.test(s)) return 2;
  return null;
}
function cleanFloorName(label, k) {
  const t = String(label || '').replace(/\b(plan|layout|drawing|proposed|scale.*$)\b/gi, '').replace(/[^\w\s+-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t || t.length > 24 || !/floor|level|storey|terrace|basement|stilt|roof/i.test(t)) return floorName(k);
  return t.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
function shiftFloor(f, dx, dy) {
  if (!dx && !dy) return;
  const mv = o => { o.x = r2(o.x + dx); o.y = r2(o.y + dy); };
  f.rooms.forEach(r => { mv(r); r.furniture.forEach(mv); }); f.doors.forEach(mv); f.windows.forEach(mv); (f.stairs || []).forEach(mv); (f._stairRects || []).forEach(mv);
}
const footOverlap = (a, b, dx = 0, dy = 0) => { let s = 0; a.rooms.forEach(r => b.rooms.forEach(q => { s += rectOverlap(r, { x: q.x + dx, y: q.y + dy, w: q.w, d: q.d }); })); return s; };
/* Best offset that places floor b over floor a: match staircases if both have one, else maximise footprint overlap. */
function bestOffset(a, b) {
  const A = homeBounds(a), B = homeBounds(b); const cands = [];
  (a._stairRects || []).forEach(s => (b._stairRects || []).forEach(t => { if (Math.abs(Math.max(s.w, s.d) - Math.max(t.w, t.d)) < 1.5 && Math.abs(Math.min(s.w, s.d) - Math.min(t.w, t.d)) < 1.0) cands.push({ dx: s.x + s.w / 2 - (t.x + t.w / 2), dy: s.y + s.d / 2 - (t.y + t.d / 2), bonus: 0.12 }); }));
  [A.x - B.x, A.x + A.w - (B.x + B.w), A.x + A.w / 2 - (B.x + B.w / 2)].forEach(dx => [A.y - B.y, A.y + A.d - (B.y + B.d), A.y + A.d / 2 - (B.y + B.d / 2)].forEach(dy => cands.push({ dx, dy, bonus: 0 })));
  let best = null; cands.forEach(c => { const v = footOverlap(a, b, c.dx, c.dy) * (1 + c.bonus); if (!best || v > best.v + 1e-6) best = Object.assign({ v }, c); });
  let dx = best ? best.dx : 0, dy = best ? best.dy : 0;
  // snap outer edges that nearly line up
  const sn = (v, opts) => { let bst = null; opts.forEach(o => { const d = o - v; if (Math.abs(d) < 0.45 && (!bst || Math.abs(d) < Math.abs(bst))) bst = d; }); return bst || 0; };
  dx += sn(B.x + dx, [A.x, A.x + A.w - B.w]); dy += sn(B.y + dy, [A.y, A.y + A.d - B.d]);
  return [r2(dx), r2(dy)];
}
const stairRun = st => st.run || 'z', stairDir = st => st.dir || 1;
const stairRisers = f => Math.max(12, Math.ceil((f.height + 0.25) / 0.18));
const stairLen = st => stairRun(st) === 'z' ? st.d : st.w, stairWidth = st => stairRun(st) === 'z' ? st.w : st.d;
const stairFoot = st => ({ x: st.x - st.w / 2, y: st.y - st.d / 2, w: st.w, d: st.d });
/* point (plan x,y) at the low or high end of a flight, `beyond` metres outside it */
function stairEnd(st, which, beyond = 0) { const s = (which === 'high' ? 1 : -1) * stairDir(st), L = stairLen(st) / 2 + beyond; return stairRun(st) === 'z' ? [st.x, st.y + s * L] : [st.x + s * L, st.y]; }
function floorBelow(f) { const pj = P(); return pj.floors.filter(x => x.level < f.level).sort((a, b) => b.level - a.level)[0] || null; }
function floorAbove(f) { const pj = P(); return pj.floors.filter(x => x.level > f.level).sort((a, b) => a.level - b.level)[0] || null; }
const stairsBelow = f => { const lo = floorBelow(f); return lo ? (lo.stairs || []) : []; };
/* Fit a straight flight inside rect `rc` on floor lo, rising to floor up; choose the direction that lands inside a room upstairs. */
function makeStair(rc, lo, up) {
  const runZ = rc.d >= rc.w, L = runZ ? rc.d : rc.w, Wd = runZ ? rc.w : rc.d;
  const want = clamp(stairRisers(lo) * 0.25, 2.6, 4.6);
  const len = r2(L - want >= 0.9 ? want : L - 0.9 >= 2.4 ? L - 0.9 : Math.min(L, Math.max(2.2, want))), sw = r2(clamp(Math.min(Wd, 1.2), 0.75, 1.5));
  const c0 = runZ ? rc.y : rc.x, cAcross = runZ ? rc.x + rc.w / 2 : rc.y + rc.d / 2;
  let best = null;
  [1, -1].forEach(dir => [c0 + len / 2, c0 + L - len / 2].forEach(cAlong => {
    const st = runZ ? { x: r2(cAcross), y: r2(cAlong), w: sw, d: len, run: 'z', dir } : { x: r2(cAlong), y: r2(cAcross), w: len, d: sw, run: 'x', dir };
    const hi = stairEnd(st, 'high', 0.45), lw = stairEnd(st, 'low', 0.45);
    let sc = 0; if (up && roomAt(hi[0], hi[1], up)) sc += 3; if (roomAt(lw[0], lw[1], lo)) sc += 2;
    if (lo.doors.some(d => Math.hypot(d.x - lw[0], d.y - lw[1]) < 1.3)) sc += 1;
    if (up && inRoom(rc, hi[0], hi[1])) sc += 0.5; // leftover landing at the top
    if (!best || sc > best.sc) best = { sc, st };
  }));
  return Object.assign({ id: uid('s') }, best.st);
}
function placeStairs(lo, up) {
  if (lo.stairs && lo.stairs.length) return lo.stairs[0];
  const A = lo._stairRects || [], B = up._stairRects || [];
  const cand = [...A.map(s => ({ s, sc: (s.src === 'ai' ? 3 : 2) + (B.some(t => rectOverlap(s, t) > area(s) * 0.3) ? 2 : 0) })), ...B.map(s => ({ s, sc: 1 }))].sort((a, b) => b.sc - a.sc);
  let rc = cand[0] && cand[0].s;
  if (!rc) { // corridor-like halls that sit under a hall upstairs
    const halls = lo.rooms.filter(r => r.type === 'hall' && Math.min(r.w, r.d) >= 0.9 && Math.max(r.w, r.d) >= 2.4).map(r => ({ r, sc: (up.rooms.some(q => q.type === 'hall' && rectOverlap(r, q) > area(r) * 0.5) ? 2 : 0) + Math.max(r.w, r.d) / 10 })).sort((a, b) => b.sc - a.sc);
    if (halls[0]) rc = halls[0].r;
  }
  if (!rc) { // last resort: along the inner edge of the main living space
    const hub = lo.rooms.find(r => r.type === 'living') || lo.rooms.slice().sort((a, b) => area(b) - area(a))[0]; if (!hub) return null;
    const vert = hub.d >= hub.w; rc = vert ? { x: hub.x + hub.w - 1.1, y: hub.y + Math.max(0.2, hub.d - 3.6), w: 1.0, d: Math.min(3.4, hub.d - 0.4) } : { x: hub.x + Math.max(0.2, hub.w - 3.6), y: hub.y + hub.d - 1.1, w: Math.min(3.4, hub.w - 0.4), d: 1.0 };
  }
  const st = makeStair(rc, lo, up); lo.stairs = [st]; return st;
}
/* Align every floor over the one below it, then connect consecutive floors with a staircase. */
function alignAndConnectFloors(floors, offsets) {
  for (let k = 1; k < floors.length; k++) { const [dx, dy] = bestOffset(floors[k - 1], floors[k]); shiftFloor(floors[k], dx, dy); if (offsets) { offsets[k][0] += dx; offsets[k][1] += dy; } }
  floors.forEach(f => f.stairs = []);
  for (let k = 0; k < floors.length - 1; k++) placeStairs(floors[k], floors[k + 1]);
}
/* Keep every staircase inside walls. A flight stays within the room it starts in (shorter or turned if that room
   got smaller), leaves room to step on at the bottom, and slides so no wall upstairs runs across the opening. */
function stairWallCross(st, up, lines = up ? wallLines(up) : []) { // metres of upstairs wall running through the opening a flight climbs into
  const ft = stairFoot(st), m = 0.06; let n = 0;
  lines.forEach(L => { if (L.o === 'h' && L.c > ft.y + m && L.c < ft.y + ft.d - m) n += Math.max(0, Math.min(L.b, ft.x + ft.w) - Math.max(L.a, ft.x));
    if (L.o === 'v' && L.c > ft.x + m && L.c < ft.x + ft.w - m) n += Math.max(0, Math.min(L.b, ft.y + ft.d) - Math.max(L.a, ft.y)); });
  return n;
}
function fitStairs(f) {
  if (!f || !f.stairs || !f.stairs.length) return; const up = floorAbove(f), inset = WALL_T / 2 + 0.02, UL = up ? wallLines(up) : [];
  f.stairs.forEach(st => {
    const ft0 = stairFoot(st), cen = r => Math.hypot(r.x + r.w / 2 - st.x, r.y + r.d / 2 - st.y);
    // the room(s) the flight mostly stands in, best first; it must end up wholly inside one of them
    const hosts = f.rooms.filter(r => !isOpenAir(r) && (rectOverlap(r, ft0) > 0.01 || inRoom(r, st.x, st.y))).sort((a, b) => (rectOverlap(b, ft0) - rectOverlap(a, ft0)) || (cen(a) - cen(b)));
    if (!hosts.length) return;
    const fits = (s, host) => { const ft = stairFoot(s), x0 = host.x + inset - 0.01, y0 = host.y + inset - 0.01; return ft.x >= x0 && ft.y >= y0 && ft.x + ft.w <= host.x + host.w - inset + 0.01 && ft.y + ft.d <= host.y + host.d - inset + 0.01; };
    const stepOn = (s, host) => { const p = stairEnd(s, 'low', 0.45); return inRoom(host, p[0], p[1]); };
    if (hosts.some(h => fits(st, h) && stepOn(st, h)) && stairWallCross(st, up, UL) < 0.05) return; // already fine: leave it alone
    const want = stairLen(st), wid = stairWidth(st); let best = null;
    hosts.slice(0, 3).forEach((host, hi) => {
      const box = { x: host.x + inset, y: host.y + inset, w: host.w - 2 * inset, d: host.d - 2 * inset }; if (box.w < 0.75 || box.d < 0.75) return;
      [stairRun(st), stairRun(st) === 'z' ? 'x' : 'z'].forEach((run, ri) => {
        const along = run === 'z' ? box.d : box.w, across = run === 'z' ? box.w : box.d; const W = r2(Math.min(wid, across)); if (W < 0.75) return;
        for (let L = r2(Math.min(want, along)); L >= 2.2 - 1e-6; L = r2(L - 0.2)) {
          const w = run === 'z' ? W : L, d = run === 'z' ? L : W, nx = Math.max(1, Math.round((box.w - w) / 0.1)), ny = Math.max(1, Math.round((box.d - d) / 0.1));
          for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) [st.dir || 1, -(st.dir || 1)].forEach((dir, di) => {
            const s2 = { id: st.id, x: r2(box.x + w / 2 + (box.w - w) * i / nx), y: r2(box.y + d / 2 + (box.d - d) * j / ny), w, d, run, dir }; const top = stairEnd(s2, 'high', 0.45);
            const sc = stairWallCross(s2, up, UL) * 10 + (stepOn(s2, host) ? 0 : 4) + (up && !roomAt(top[0], top[1], up) ? 3 : 0) + (want - L) * 1.5 + hi * 0.7 + ri * 0.8 + di * 0.6 + Math.hypot(s2.x - st.x, s2.y - st.y) * 0.15;
            if (!best || sc < best.sc) best = { sc, s2 };
          });
        }
      });
    });
    if (best) { const b = best.s2; Object.assign(st, { x: b.x, y: b.y, w: b.w, d: b.d, run: b.run, dir: b.dir }); }
  });
}
function clearStairFurniture() {
  P().floors.forEach(f => { const holes = [...(f.stairs || []), ...stairsBelow(f)].map(st => { const ft = stairFoot(st); const lw = stairEnd(st, 'low', 0.6), hi = stairEnd(st, 'high', 0.6); return { x: Math.min(ft.x, lw[0], hi[0]) - 0.05, y: Math.min(ft.y, lw[1], hi[1]) - 0.05, w: 0, d: 0, ft, lw, hi }; });
    if (!holes.length) return;
    f.rooms.forEach(r => { r.furniture = r.furniture.filter(it => { const fp = itemFootprint(it); return !holes.some(h => rectOverlap(fp, h.ft) > 0.02 || inRoom(fp, h.lw[0], h.lw[1], 0.25) || inRoom(fp, h.hi[0], h.hi[1], 0.25)); }); });
  });
}
/* Sample duplex (G+1) used for "Try a sample duplex" */
function sampleDuplex() {
  const p = newProject('Sample Duplex — G+1'); p.example = 'duplex'; p.facade = 'courtyard'; S.project = p;
  const g = p.floors[0]; const up = newFloor('First Floor', 1); p.floors.push(up);
  const R = (f, name, type, x, y, w, d) => f.rooms.push(makeRoom({ name, type, x, y, w, d }));
  R(g, 'Living Room', 'living', 0, 0, 5.0, 4.8); R(g, 'Dining', 'dining', 5.0, 0, 3.4, 3.4); R(g, 'Kitchen', 'kitchen', 8.4, 0, 3.2, 3.4);
  R(g, 'Staircase', 'hall', 5.0, 3.4, 1.2, 4.2); R(g, 'Passage', 'hall', 6.2, 3.4, 2.2, 1.4); R(g, 'Utility', 'utility', 8.4, 3.4, 3.2, 1.4);
  R(g, 'Guest Room', 'guest', 0, 4.8, 3.4, 4.6); R(g, 'Common Bath', 'bathroom', 3.4, 4.8, 1.6, 2.2); R(g, 'Pooja', 'pooja', 3.4, 7.0, 1.6, 2.4); R(g, 'Store', 'closet', 5.0, 7.6, 1.2, 1.8);
  R(g, 'Bedroom 2', 'bedroom', 6.2, 4.8, 3.4, 4.6); R(g, 'Bath 2', 'bathroom', 9.6, 4.8, 2.0, 2.2); R(g, 'Study', 'study', 9.6, 7.0, 2.0, 2.4);
  R(up, 'Family Lounge', 'living', 0, 4.8, 5.0, 4.6); R(up, 'Bedroom 3', 'bedroom', 0, 0, 3.4, 4.8); R(up, 'Bath 3', 'bathroom', 3.4, 0, 1.6, 2.4); R(up, 'Wardrobe', 'closet', 3.4, 2.4, 1.6, 2.4);
  R(up, 'Sit-out', 'balcony', 5.0, 0, 1.2, 3.4); R(up, 'Landing', 'hall', 5.0, 3.4, 1.2, 6.0); R(up, 'Home Office', 'office', 6.2, 0, 3.6, 4.8); R(up, 'Bath 4', 'bathroom', 9.8, 0, 1.8, 2.4); R(up, 'Laundry', 'utility', 9.8, 2.4, 1.8, 2.4);
  R(up, 'Master Bedroom', 'master', 6.2, 4.8, 3.4, 4.6); R(up, 'Master Bath', 'bathroom', 9.6, 4.8, 2.0, 2.2); R(up, 'Dressing', 'closet', 9.6, 7.0, 2.0, 2.4);
  R(g, 'Garage', 'garage', -4.2, 0, 4.2, 6.0); R(up, 'Terrace', 'balcony', -4.2, 0, 4.2, 4.8);
  const D = (f, a, b, w = 0.9, at = 0.5) => { const ra = f.rooms.find(r => r.name === a), rb = f.rooms.find(r => r.name === b); const e = sharedEdge(ra, rb); if (!e) return; const t = r2(clamp(e.lo + (e.hi - e.lo) * at, e.lo + w / 2 + 0.05, e.hi - w / 2 - 0.05)); f.doors.push({ id: uid('d'), o: e.o, x: e.o === 'h' ? t : e.c, y: e.o === 'h' ? e.c : t, w }); };
  g.doors.push({ id: uid('d'), o: 'h', x: 1.2, y: 0, w: 1.0, main: true });
  D(g, 'Living Room', 'Dining', 1.4, 0.5); D(g, 'Dining', 'Kitchen', 0.9, 0.5); D(g, 'Living Room', 'Staircase', 0.9, 0.5); D(g, 'Staircase', 'Passage', 0.9, 0.5); D(g, 'Dining', 'Passage', 0.9, 0.5); D(g, 'Passage', 'Utility', 0.8);
  D(g, 'Living Room', 'Guest Room', 0.9, 0.5); D(g, 'Living Room', 'Common Bath', 0.75); D(g, 'Guest Room', 'Pooja', 0.75, 0.6); D(g, 'Passage', 'Bedroom 2', 0.9, 0.5); D(g, 'Bedroom 2', 'Bath 2', 0.75, 0.5); D(g, 'Bedroom 2', 'Study', 0.8, 0.5); D(g, 'Staircase', 'Store', 0.75);
  D(up, 'Landing', 'Family Lounge', 0.9, 0.82); D(up, 'Landing', 'Master Bedroom', 0.9, 0.82); D(up, 'Family Lounge', 'Bedroom 3', 0.9, 0.5); D(up, 'Bedroom 3', 'Bath 3', 0.75, 0.5); D(up, 'Bedroom 3', 'Wardrobe', 0.75, 0.5);
  D(up, 'Master Bedroom', 'Home Office', 0.9, 0.5); D(up, 'Home Office', 'Sit-out', 0.8, 0.5); D(up, 'Home Office', 'Bath 4', 0.75, 0.5); D(up, 'Home Office', 'Laundry', 0.75, 0.5); D(up, 'Master Bedroom', 'Master Bath', 0.75, 0.5); D(up, 'Master Bedroom', 'Dressing', 0.8, 0.5); D(g, 'Garage', 'Living Room', 0.9, 0.75); D(up, 'Bedroom 3', 'Terrace', 0.9, 0.5);
  g.stairs = [{ id: uid('s'), x: 5.6, y: 5.9, w: 1.0, d: 3.0, run: 'z', dir: 1 }];
  autoOpenings(g, { doors: false }); autoOpenings(up, { doors: false });
  for (const [roomName, width] of [['Bedroom 3', 2.25], ['Home Office', 2.55]]) {
    const room = up.rooms.find(r => r.name === roomName);
    const x = room.x + room.w / 2, y = room.y;
    const opening = { o: 'h', x, y, w: width, sill: 0.7, h: 1.78 };
    const existing = up.windows.find(w => w.o === 'h' && Math.abs(w.y - y) < 0.05 && Math.abs(w.x - x) < room.w / 2);
    if (existing) Object.assign(existing, opening);
    else up.windows.push({ id: uid('w'), ...opening });
  }
  return p;
}
/* One drawing sheet with every floor side by side and a printed title under each (like a real architect's sheet). */
function drawSheetImage(project) {
  const parts = project.floors.map((f, i) => ({ f, img: drawPlanImage(project, i) }));
  return Promise.all(parts.map(p => loadImage(p.img.url))).then(imgs => {
    const gap = 110, band = 80; const W = imgs.reduce((s, im) => s + im.width, 0) + gap * (imgs.length - 1), H = Math.max(...imgs.map(im => im.height)) + band;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#fbfaf7'; x.fillRect(0, 0, W, H);
    let ox = 0; imgs.forEach((im, i) => { x.drawImage(im, ox, 0); x.fillStyle = '#1b1b1b'; x.textAlign = 'center'; x.font = '700 22px Arial'; x.fillText(parts[i].f.name.toUpperCase() + ' PLAN', ox + im.width / 2, im.height + 34); x.fillRect(ox + im.width / 2 - 120, im.height + 44, 240, 2); ox += im.width + gap; });
    return { url: c.toDataURL('image/png'), widthM: parts[0].img.widthM };
  });
}

/* ===================== GEMMA 4 CLIENT + ARIA ASSISTANT ===================== */
/* The DIMORA engine lives in a Python backend (backend/app.py). The AI is Cloudflare Workers AI (account ID +
   API token from the Cloudflare dashboard); local Qwen through Ollama and OpenRouter remain as fallbacks. The backend picks. */
const CF_MODELS = { '@cf/qwen/qwen3.8-27b': 'Qwen3.8 27B — recommended', '@cf/meta/llama-4-scout-17b-16e-instruct': 'Llama 4 Scout — fastest', '@cf/mistralai/mistral-small-3.1-24b-instruct': 'Mistral Small 3.1 24B' };
const OR_MODELS = { 'qwen/qwen3.5-27b': 'Qwen3.5 27B', 'qwen/qwen3.5-9b': 'Qwen3.5 9B — cheapest', 'qwen/qwen3-vl-235b-a22b-instruct': 'Qwen3-VL 235B — most accurate' };
const PRIVATE_HOST = document.querySelector('meta[name="dimora-hosting"]')?.content === 'private';
const SAME_ORIGIN_API = document.querySelector('meta[name="dimora-api"]')?.content === 'same-origin';
const PRIVATE_PROFILE = { loggedIn: true, name: 'Private workspace', method: 'local', answers: { done: true } };
const API = {
  base() { const b = (S.backendUrl || '').trim().replace(/\/+$/, ''); if (b) return b; return /^https?:$/.test(location.protocol) && !/claude|claudeusercontent/.test(location.hostname) ? location.origin : 'http://127.0.0.1:8000'; },
  headers(extra = {}) { const h = Object.assign({}, extra); if (CLOUD.token) h.Authorization = 'Bearer ' + CLOUD.token; if (S.aiProvider && S.aiProvider !== 'auto') h['X-AI-Provider'] = S.aiProvider; if (S.cfToken) h['X-Cloudflare-Token'] = S.cfToken; if (S.cfAccount) h['X-Cloudflare-Account'] = S.cfAccount; if (S.cfModel) h['X-Cloudflare-Model'] = S.cfModel; if (S.orKey) h['X-OpenRouter-Key'] = S.orKey; if (S.orModel) h['X-OpenRouter-Model'] = S.orModel; if (S.ollamaModel) h['X-Ollama-Model'] = S.ollamaModel; return h; },
  async req(path, { body, form, method, timeout = 120000 } = {}) {
    if (PRIVATE_HOST && !SAME_ORIGIN_API && !S.backendUrl?.trim()) {
      const error = new Error('Set a DIMORA backend URL in Settings to use this feature.');
      error.code = 'offline'; throw error;
    }
    const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(API.base() + path, { method: method || (body || form ? 'POST' : 'GET'), signal: ctrl.signal, headers: API.headers(body ? { 'Content-Type': 'application/json' } : {}), body: form || (body ? JSON.stringify(body) : undefined) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(j.message || 'HTTP ' + r.status); e.code = j.error || 'http_' + r.status; e.status = r.status; if (r.status === 401 && CLOUD.token && !/\/api\/auth\/(login|signup|password)/.test(path) && method !== 'DELETE') cloudExpired(); throw e; }
      return j;
    } catch (e) {
      if (e.name === 'AbortError') { const x = new Error('The backend took too long to answer'); x.code = 'timeout'; throw x; }
      if (!e.code) { e.code = 'offline'; e.message = 'Backend not reachable at ' + API.base(); S.backendOK = false; updateAIBadge(); }
      throw e;
    } finally { clearTimeout(tm); }
  },
  async health(force) {
    if (!force && S.backendAt && Date.now() - S.backendAt < 15000) return S.backend;
    try { S.backend = await API.req('/api/health', { timeout: 4000 }); S.backendOK = S.backend.ok === true; } catch (e) { S.backend = null; S.backendOK = false; }
    S.backendAt = Date.now(); updateAIBadge(); return S.backend;
  },
};
const aiOn = () => !!(S.backendOK && S.backend && S.backend.ai && S.backend.ai.active);
function modelLabel() { if (!S.backendOK) return 'in-browser engine (backend offline)'; const a = S.backend && S.backend.ai; if (!a || !a.active) return 'rule-based engine (no AI connected)'; return a.active === 'cloudflare' ? `Cloudflare Workers AI · ${String(a.cloudflare.model).split('/').pop()}` : a.active === 'ollama' ? `Qwen · ${a.ollama.model} (local)` : `OpenRouter · ${a.openrouter.model}`; }
function projectGeometry(pj = P()) { return { floors: pj.floors.map(f => ({ id: f.id, name: f.name, level: f.level, height: f.height, rooms: f.rooms.map(r => ({ id: r.id, name: r.name, type: r.type, x: r.x, y: r.y, w: r.w, d: r.d, group: r.group || null })), doors: f.doors, windows: f.windows, stairs: f.stairs || [], stair_rects: f._stairRects || [] })) }; }
function dataURLtoBlob(url) { const [h, b] = url.split(','); const mime = (/data:([^;]+)/.exec(h) || [])[1] || 'image/png'; const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: mime }); }
function extractJSON(t) {
  t = String(t).replace(/```(?:json)?/gi, '').trim();
  const s = Math.min(...['{', '['].map(c => { const i = t.indexOf(c); return i < 0 ? 1e9 : i; }));
  if (s === 1e9) throw new Error('No JSON in response');
  for (let e = t.length; e > s; e--) { const ch = t[e - 1]; if (ch !== '}' && ch !== ']') continue; try { return JSON.parse(t.slice(s, e)); } catch (err) { } }
  throw new Error('Could not parse JSON from the AI reply');
}
const imgPart = url => { const m = /^data:([^;]+);base64,(.*)$/.exec(url); return { inline_data: { mime_type: m[1], data: m[2] } }; };
async function shrinkImage(url, max = 1280) { const img = await loadImage(url); const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.9); }

/* ---------- vocabulary for on-device understanding ---------- */
const FURN_WORDS = [['jhoola', 'jhoola'], ['jhula', 'jhoola'], ['swing', 'jhoola'], ['diwan', 'diwan'], ['divan', 'diwan'], ['daybed', 'diwan'], ['jaali', 'jaali_partition'], ['jali', 'jaali_partition'], ['urli', 'urli'], ['uruli', 'urli'], ['deepstambh', 'brass_lamp'], ['diya stand', 'brass_lamp'], ['brass lamp', 'brass_lamp'], ['carved bed', 'bed_carved'], ['teak bed', 'bed_carved'], ['single bed', 'bed_single'], ['bunk', 'bunk_bed'], ['king bed', 'bed_double'], ['queen bed', 'bed_double'], ['double bed', 'bed_double'], ['bed', 'bed_double'], ['wardrobe', 'wardrobe'], ['almirah', 'wardrobe'], ['nightstand', 'side_table'], ['side table', 'side_table'], ['bedside', 'side_table'], ['dresser', 'dresser'], ['vanity', 'dresser'],
  ['gaming', 'gaming_desk'], ['gaming chair', 'gaming_chair'], ['study table', 'desk'], ['work desk', 'desk'], ['desk', 'desk'], ['office chair', 'office_chair'], ['chair', 'office_chair'], ['l-shaped sofa', 'sofa_l'], ['l shaped sofa', 'sofa_l'], ['sectional', 'sofa_l'], ['sofa', 'sofa_3'], ['couch', 'sofa_3'], ['armchair', 'armchair'], ['accent chair', 'armchair'],
  ['coffee table', 'coffee_table'], ['tv', 'tv_unit'], ['television', 'tv_unit'], ['dining table', 'dining_set'], ['dining set', 'dining_set'], ['fridge', 'fridge'], ['refrigerator', 'fridge'], ['bookshelf', 'bookshelf'], ['bookcase', 'bookshelf'], ['shelf', 'bookshelf'], ['plant', 'plant'], ['rug', 'rug'], ['floor lamp', 'floor_lamp'], ['lamp', 'floor_lamp'],
  ['bean bag', 'beanbag'], ['beanbag', 'beanbag'], ['shoe rack', 'shoe_rack'], ['cabinet', 'storage_cabinet'], ['storage', 'storage_cabinet'], ['mandir', 'pooja_unit'], ['pooja', 'pooja_unit'], ['crib', 'crib'], ['treadmill', 'treadmill'], ['pet bed', 'pet_bed'], ['dog bed', 'pet_bed'], ['washing machine', 'washing_machine'], ['bathtub', 'bathtub'], ['tub', 'bathtub'], ['shower', 'shower'], ['toilet', 'toilet'], ['basin', 'wash_basin'], ['counter', 'kitchen_counter'], ['closet system', 'closet_rack']];
const FLOOR_WORDS = [['italian marble', 'marble'], ['indian marble', 'indian_marble'], ['makrana', 'indian_marble'], ['marble', 'marble'], ['herringbone', 'herringbone'], ['walnut', 'walnut'], ['vinyl', 'vinyl'], ['lvt', 'vinyl'], ['oak', 'oak'], ['wooden', 'oak'], ['wood', 'oak'], ['laminate', 'oak'], ['granite', 'granite'], ['kota', 'kota'], ['anti-skid', 'antiskid'], ['antiskid', 'antiskid'], ['ceramic', 'ceramic'], ['vitrified', 'vitrified'], ['tile', 'vitrified'], ['carpet', 'carpet'], ['concrete', 'concrete'], ['deck', 'deck'], ['wpc', 'deck']];
const TRANSFORM_WORDS = [['home office', 'office'], ['work from home', 'office'], ['wfh', 'office'], ['office', 'office'], ['gaming', 'gaming'], ['reading', 'reading'], ['library', 'reading'], ['study', 'study'], ['walk-in', 'closet'], ['walk in', 'closet'], ['dressing', 'closet'], ['closet', 'closet'], ['nursery', 'nursery'], ['baby', 'nursery'], ['gym', 'gym'], ['workout', 'gym'], ['guest', 'guest'], ['pooja', 'pooja'], ['prayer', 'pooja'], ['mandir', 'pooja'], ['bedroom', 'bedroom']];
const THEME_WORDS = [['modern traditional', 'Modern Traditional Indian'], ['chettinad', 'Modern Traditional Indian'], ['heritage', 'Modern Traditional Indian'], ['traditional indian', 'Modern Traditional Indian'], ['carved', 'Modern Traditional Indian'], ['indian contemporary', 'Indian Contemporary'], ['desi', 'Indian Contemporary'], ['japandi', 'Japandi'], ['scandinavian', 'Scandinavian'], ['scandi', 'Scandinavian'], ['nordic', 'Scandinavian'], ['minimalist', 'Minimalist'], ['minimal', 'Minimalist'], ['industrial', 'Industrial'], ['indian', 'Indian Contemporary'], ['traditional', 'Modern Traditional Indian'], ['luxury', 'Luxury'], ['luxurious', 'Luxury'], ['premium look', 'Luxury'], ['bohemian', 'Bohemian'], ['boho', 'Bohemian'], ['modern', 'Modern'], ['contemporary', 'Modern']];
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const findWord = (t, list) => { let best = null; list.forEach(([w, v]) => { const m = new RegExp('(^|[^a-z])' + reEsc(w) + '(e?s)?(?![a-z])').exec(t); if (m && (!best || w.length > best.w.length)) best = { w, v, i: m.index }; }); return best; };
function findColor(t) {
  const hx = /#([0-9a-f]{6}|[0-9a-f]{3})\b/i.exec(t); if (hx) return { hex: '#' + hx[1], name: '#' + hx[1] };
  let best = null; Object.keys(NAMED_COLORS).forEach(n => { const re = new RegExp('\\b' + n.replace(' ', '\\s*') + '\\b'); if (re.test(t) && (!best || n.length > best.length)) best = n; });
  return best ? { hex: NAMED_COLORS[best], name: best } : null;
}
function parseAmount(t) {
  const re = /(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|l|lakh|lakhs|lac|cr|crore)?(?![a-z])/gi; let m, best = null;
  while ((m = re.exec(t))) { let v = parseFloat(m[1].replace(/,/g, '')); const u = (m[2] || '').toLowerCase(); if (u === 'k' || u === 'thousand') v *= 1e3; else if (/^l/.test(u)) v *= 1e5; else if (/^c/.test(u)) v *= 1e7; if (v >= 1000 && (!best || v > best)) best = v; }
  return best;
}
function resolveRoom(ref, focus) {
  if (!ref && focus) return [focus];
  const t = String(ref || '').toLowerCase().trim();
  if (!t) return focus ? [focus] : [];
  if (['all', 'every', 'whole', 'house', 'home', 'everywhere'].some(w => t === w || t.includes('all room') || t.includes('whole house') || t.includes('every room') || t.includes('entire'))) return allRooms();
  const byId = allRooms().find(r => r.id === ref); if (byId) return [byId];
  const exact = allRooms().find(r => r.name.toLowerCase() === t); if (exact) return [exact];
  const named = allRooms().filter(r => t.includes(r.name.toLowerCase())).sort((a, b) => b.name.length - a.name.length);
  if (named.length) return [named[0]];
  const typeMatch = Object.keys(ROOM_TYPES).find(k => t.includes(k) || t.includes(ROOM_TYPES[k].label.toLowerCase()));
  if (/master/.test(t)) { const m = allRooms().find(r => r.type === 'master'); if (m) return [m]; }
  if (/bed ?room/.test(t)) { const m = allRooms().filter(r => ['master', 'bedroom', 'guest'].includes(r.type)); const n = /(\d)/.exec(t); if (m.length) return [n ? (m.find(r => r.name.includes(n[1])) || m[0]) : m[0]]; }
  if (/bath|toilet|washroom/.test(t)) { const m = allRooms().filter(r => r.type === 'bathroom'); if (m.length) return [m[0]]; }
  if (/lounge|hall\b|drawing/.test(t)) { const m = allRooms().find(r => r.type === 'living'); if (m) return [m]; }
  if (typeMatch) { const m = allRooms().find(r => r.type === typeMatch); if (m) return [m]; }
  if (/\b(this|here|current|it)\b/.test(t) && focus) return [focus];
  return [];
}
function mentionRoom(t, focus) {
  if (/\b(all rooms|every room|whole (house|home)|entire (house|home)|everywhere|all the rooms)\b/.test(t)) return 'all';
  // "turn bedroom 3 into a home office": the room being changed is named before "into", not after it
  const pre = t.split(/\b(?:into|as an?|to become)\b/)[0]; if (pre !== t) { const r = mentionRoom(pre, null); if (r) return r; }
  const named = allRooms().filter(r => t.includes(r.name.toLowerCase())).sort((a, b) => b.name.length - a.name.length);
  if (named.length) return named[0].id;
  for (const w of ['master bedroom', 'master', 'bedroom 2', 'second bedroom', 'kids room', 'bedroom', 'living room', 'living', 'lounge', 'hall', 'kitchen', 'dining', 'bathroom', 'washroom', 'toilet', 'balcony', 'study', 'office', 'utility', 'store', 'passage', 'guest room']) {
    if (new RegExp('\\b' + w + '\\b').test(t)) { if (w === 'second bedroom' || w === 'kids room') { const b = allRooms().filter(r => r.type === 'bedroom'); if (b.length) return b[0].id; } const r = resolveRoom(w, null); if (r.length) return r[0].id; }
  }
  return focus ? focus.id : null;
}

const ROOM_ALIASES = ['master bedroom', 'master', 'bedroom 2', 'second bedroom', 'kids room', 'bedroom', 'living room', 'living', 'lounge', 'hall', 'kitchen', 'dining', 'bathroom', 'washroom', 'toilet', 'balcony', 'study', 'office', 'utility', 'store', 'passage', 'guest room'];
function stripRoom(c, roomId) {
  const r = roomId && roomId !== 'all' ? findRoom(roomId) : null; if (!r) return c;
  let out = c.split(r.name.toLowerCase()).join(' ');
  ROOM_ALIASES.forEach(a => { if (new RegExp('\\b' + a + '\\b').test(out)) { const rr = resolveRoom(a, null); if (rr[0] === r) out = out.replace(new RegExp('\\b' + a + '\\b'), ' '); } });
  return out;
}
/* ---------- on-device intent parser ---------- */
function localParse(text, focus) {
  const T = text.toLowerCase().replace(/colour/g, 'color'); const actions = [];
  if (/^\s*(undo|go back|revert)/.test(T)) return { actions: [{ do: 'undo' }] };
  if (/\b(tour|show me around|walk me through|guide me|walkthrough)\b/.test(T)) return { actions: [{ do: 'tour' }] };
  if (P() && P().floors.length > 1) { const m = /\b(?:show(?: me)?|go to|go|take me to|take me|head|switch to|view|open|move)\s+(?:the\s+)?((?:ground|first|second|third|fourth|top|1st|2nd|3rd)\s+floor|all floors|whole (?:house|building)|every floor|upstairs|downstairs|explode\w*)/.exec(T) || /^\s*(upstairs|downstairs|explode\w*(?: view)?)\s*$/.exec(T);
    if (m) { let f = m[1]; if (/top/.test(f)) f = P().floors.slice().sort((a, b) => b.level - a.level)[0].name; return { actions: [{ do: 'show_floor', floor: /upstairs/.test(f) ? 'up' : /downstairs/.test(f) ? 'down' : /all|whole|every/.test(f) ? 'all' : f }] }; } }
  if (/(suggest|recommend|which|what).*(color|paint)|(color|paint).*(suggest|idea|recommend)/.test(T)) { const rid = mentionRoom(T, focus); return { actions: [{ do: 'suggest_paint', room: rid || allRooms()[0]?.id }] }; }
  const clauses = T.split(/\s*(?:,(?!\d)|;|\band then\b|\bthen\b|\balso\b|\band\b(?=\s+(?:add|paint|make|change|put|place|remove|use|set|convert|turn|apply|give|design|furnish)))\s*/).filter(Boolean);
  let ctxRoom = mentionRoom(T, focus);
  clauses.forEach(c => {
    const room = mentionRoom(c, null) || ctxRoom; const a = parseClause(c, room);
    if (a) actions.push(...(Array.isArray(a) ? a : [a]));
  });
  return { actions };
}
function parseClause(c, room) {
  const amt = parseAmount(c);
  if (amt && /(under|below|within|budget|cost|less than|max)/.test(c)) return { do: 'budget', room: room || 'all', amount: amt };
  const intoPart = c.split(/\b(?:into|as an?|to become)\b/).slice(1).join(' ');
  const tr = (intoPart && findWord(intoPart, TRANSFORM_WORDS)) || findWord(stripRoom(c, room), TRANSFORM_WORDS);
  if (tr && /(convert|turn|transform|repurpose|change|make|into|become|use .* as)/.test(c) && !/(color|paint|floor|light)/.test(c)) return { do: 'transform', room, to: tr.v };
  if (/(villa|facade|façade|exterior|elevation|outside)/.test(c) && /(modern|contemporary|villa|stone|classic|traditional|indian|brick|planner)/.test(c) && !/(paint|colou?r)/.test(c)) return { do: 'facade', style: /brick/.test(c) ? 'brick' : /(classic|traditional|indian)/.test(c) ? 'classic' : 'modern' };
  const th = findWord(c, THEME_WORDS);
  if (th && /(style|theme|look|design|vibe|feel|make|apply|go|switch|change|redesign|turn|interior|decor)/.test(c)) return { do: 'theme', name: th.v, room: room && !/(whole|entire|house|home|everything|all)/.test(c) ? room : 'all' };
  if (/(false ceiling|cove|tray ceiling|peripheral ceiling|ceiling)/.test(c)) { const tp = /cove/.test(c) ? 'cove' : /tray/.test(c) ? 'tray' : /peripheral/.test(c) ? 'peripheral' : /(plain|flat|remove|no )/.test(c) ? 'flat' : 'cove'; return { do: 'ceiling', room: room || 'all', type: tp }; }
  const col = findColor(c);
  if (col && /(exterior|outside|outer wall|facade|façade|elevation|outside of the house)/.test(c)) return { do: 'exterior', color: col.hex, name: col.name };
  if (/\broof\b/.test(c) && /(show|see|view|add|put|on)/.test(c)) return { do: 'roof', on: !/(hide|remove|off|without)/.test(c) };
  if (col && /(paint|color|wall|make|change|turn|want|shade|tone|repaint|give)/.test(c) && !/\bfloor/.test(c) && !findWord(c, FURN_WORDS.filter(f => !['shelf', 'storage'].includes(f[0])))) return { do: 'wall_color', room: room || 'all', color: col.hex, name: col.name };
  const fl = findWord(c, FLOOR_WORDS);
  if (fl && /(floor|flooring|tiles|tile|marble|wood|carpet)/.test(c) && !(/(add|place|put)\b/.test(c) && findWord(c, FURN_WORDS))) return { do: 'floor', room: room || 'all', material: fl.v };
  if (/(remove|delete|get rid|take out|clear|empty)/.test(c)) { const f = findWord(c, FURN_WORDS); if (f) return { do: 'remove', room, item: f.v }; if (/(furniture|everything|all)/.test(c)) return { do: 'remove', room, item: 'all' }; }
  if (/(add|place|put|include|need|want|bring|get me|insert)/.test(c)) { const f = findWord(c, FURN_WORDS); if (f) { const n = /\b(two|2)\b/.test(c) ? 2 : /\b(three|3)\b/.test(c) ? 3 : 1; return { do: 'add', room, item: f.v, count: n, color: col?.hex }; } }
  if (/(rearrange|re-arrange|another layout|different layout|alternative layout|shuffle)/.test(c)) return { do: 'furnish', room: room || 'all', variant: 1 + Math.floor(Math.random() * 3) };
  if (/(furnish|furniture|fill|arrange|auto ?place|set ?up)/.test(c)) return { do: 'furnish', room: room || 'all' };
  const dm = /(\d+(?:\.\d+)?)\s*(?:m\s*)?(?:x|by|×|\*)\s*(\d+(?:\.\d+)?)/.exec(c);
  if (dm && /(resize|size|make|change|dimension|extend|enlarge|shrink)/.test(c)) return { do: 'resize', room, w: +dm[1], d: +dm[2] };
  if (/(bigger|larger|enlarge|extend)/.test(c) && room) return { do: 'resize_rel', room, f: 1.15 };
  if (/(smaller|shrink|reduce)/.test(c) && room) return { do: 'resize_rel', room, f: 0.88 };
  const rn = /rename (?:the )?(.+?) (?:to|as) (.+)/.exec(c); if (rn) { const rr = resolveRoom(rn[1]); if (rr.length) return { do: 'rename', room: rr[0].id, name: rn[2].replace(/\b\w/g, x => x.toUpperCase()) }; }
  const hr = /(\d{1,2})(?::(\d\d))?\s*(am|pm)/.exec(c);
  if (hr || /(sunrise|morning|noon|midday|afternoon|evening|sunset|night|dusk|dawn)/.test(c)) { let h = hr ? (+hr[1] % 12) + (hr[3] === 'pm' ? 12 : 0) + (+hr[2] || 0) / 60 : /sunrise|dawn/.test(c) ? 6.3 : /morning/.test(c) ? 8.5 : /noon|midday/.test(c) ? 12.5 : /afternoon/.test(c) ? 15.5 : /sunset|dusk|evening/.test(c) ? 18 : 21; return { do: 'time', hour: h }; }
  if (/\blight(s|ing)?\b/.test(c)) { const on = !/(off|remove|no )/.test(c); const o = { do: 'lights', room: room || 'all' }; if (/accent|mood/.test(c)) o.accent = on; else if (/task|reading/.test(c)) o.task = on; else { o.ambient = on; if (/(more|brighter|all)/.test(c)) { o.task = on; o.accent = on; } } return o; }
  if (/\b(walk|first.person|walk ?through mode)\b/.test(c)) return { do: 'view', mode: 'walk' };
  if (/\b2d\b|floor ?plan|plan view/.test(c)) return { do: 'view', mode: '2d' };
  if (/\b3d\b|dollhouse|overview/.test(c)) return { do: 'view', mode: '3d' };
  if (/(wasted|unused|clearance|space|crowd|fit|walking)/.test(c)) return [{ do: 'open', panel: 'space' }, ...(room ? [{ do: 'goto', room }] : [])];
  if (/(cost|price|estimate|expens|how much|budget)/.test(c)) return { do: 'open', panel: 'budget' };
  if (/(sun|daylight|ventilat|airflow|breeze|natural light)/.test(c)) return { do: 'open', panel: 'light' };
  if (/(structur|validat|load.bearing|check (my )?plan|connectivity)/.test(c)) return { do: 'open', panel: 'arch' };
  if (/report/.test(c)) return { do: 'open', panel: 'report' };
  if (/compar/.test(c)) return { do: 'open', panel: 'compare' };
  if (/(go to|show|take me|visit|view|look at|zoom)/.test(c) && room) return { do: 'goto', room };
  return null;
}

/* ---------- action executor ---------- */
function execActions(actions, focus) {
  const done = [], fail = []; let needBuild = false, structural = false;
  if (!actions.length) return { done, fail };
  const mutating = actions.some(a => !['tour', 'goto', 'view', 'open', 'time', 'suggest_paint', 'undo', 'show_floor', 'roof', 'cutaway', 'save_variant'].includes(a.do));
  if (mutating) commit('AI: ' + actions.map(a => a.do).join(', '));
  const roomsOf = a => a.room === 'all' ? allRooms() : resolveRoom(a.room, focus);
  actions.forEach(a => {
    try {
      const rooms = roomsOf(a);
      const rn = rooms.length === allRooms().length && rooms.length > 1 ? 'every room' : rooms.map(r => r.name).join(', ');
      switch (a.do) {
        case 'undo': undo(); done.push('Undid the last change.'); break;
        case 'wall_color': { const hex = /^#/.test(a.color) ? a.color : (NAMED_COLORS[String(a.color).toLowerCase()] || findColor(String(a.color).toLowerCase())?.hex); if (!hex || !rooms.length) { fail.push('wall colour'); break; } rooms.forEach(r => r.wall = hex); done.push(`Painted ${rn} ${a.name || hex}.`); needBuild = true; break; }
        case 'floor': { const k = FLOORS[a.material] ? a.material : findWord(String(a.material).toLowerCase(), FLOOR_WORDS)?.v; if (!k || !rooms.length) { fail.push('flooring'); break; } rooms.forEach(r => r.floor = k); done.push(`Changed flooring in ${rn} to ${FLOORS[k].label}.`); needBuild = true; break; }
        case 'add': { const type = CATALOG[a.item] ? a.item : findWord(String(a.item).toLowerCase(), FURN_WORDS)?.v; const r = rooms[0]; if (!type || !r) { fail.push('add ' + a.item); break; } let n = 0; for (let i = 0; i < (a.count || 1); i++) { const fr = floorOfRoom(r); let it = null; for (const s of sideScores(r, fr)) { it = placeOnWall(r, fr, type, s); if (it) break; } if (!it) it = placeFree(r, fr, type); if (it) { if (a.color) it.color = a.color; r.furniture.push(it); n++; if (/desk/.test(type)) addChairFor(r, fr, it, type === 'gaming_desk' ? 'gaming_chair' : 'office_chair'); } } if (n) { done.push(`Added ${n > 1 ? n + ' × ' : 'a '}${CATALOG[type].label.toLowerCase()} to ${r.name}.`); needBuild = true; } else fail.push(`There is no free spot for a ${CATALOG[type].label.toLowerCase()} in ${r.name} (try the Fit Checker in Space Analyzer)`); break; }
        case 'remove': { const r = rooms[0]; if (!r) { fail.push('remove'); break; } const before = r.furniture.length; if (a.item === 'all') r.furniture = []; else { const type = CATALOG[a.item] ? a.item : findWord(String(a.item).toLowerCase(), FURN_WORDS)?.v; const i = r.furniture.findIndex(f => f.type === type || f.type.startsWith(String(type).split('_')[0])); if (i >= 0) r.furniture.splice(i, 1); } if (r.furniture.length < before) { done.push(`Removed ${a.item === 'all' ? 'all furniture' : CATALOG[a.item]?.label.toLowerCase() || a.item} from ${r.name}.`); needBuild = true; } else fail.push(`no ${a.item} in ${r.name}`); break; }
        case 'furnish': { rooms.forEach(r => autoFurnish(r, floorOfRoom(r), a.variant || 0)); done.push(`${a.variant ? 'Re-arranged' : 'Furnished'} ${rn} with ${rooms.reduce((s, r) => s + r.furniture.length, 0)} pieces, keeping door swings and walkways clear.`); needBuild = true; break; }
        case 'theme': { const nm = THEMES[a.name] ? a.name : findWord(String(a.name).toLowerCase(), THEME_WORDS)?.v; if (!nm) { fail.push('theme'); break; } applyTheme(nm, a.room === 'all' || !rooms.length || rooms.length === allRooms().length ? null : rooms); done.push(`Applied the ${nm} theme to ${a.room === 'all' || rooms.length === allRooms().length ? 'the whole home' : rn} — ${THEMES[nm].desc}`); needBuild = true; break; }
        case 'transform': { const r = rooms[0]; const to = ROOM_TYPES[a.to] ? a.to : findWord(String(a.to).toLowerCase(), TRANSFORM_WORDS)?.v; if (!r || !to) { fail.push('transform'); break; } const oldName = r.name; const res = transformRoom(r, to); done.push(`Transformed ${oldName} into a ${ROOM_TYPES[to].label} (${r.furniture.length} new pieces). Estimated cost ${inr(res.before)} → ${inr(res.after)}.`); needBuild = true; break; }
        case 'rename': { const r = rooms[0]; if (!r || !a.name) { fail.push('rename'); break; } r.name = String(a.name).slice(0, 30); done.push(`Renamed to ${r.name}.`); needBuild = true; break; }
        case 'resize': case 'resize_rel': { const r = rooms[0]; if (!r) { fail.push('resize'); break; } const w = a.do === 'resize' ? +a.w : r2(r.w * a.f), d = a.do === 'resize' ? +a.d : r2(r.d * a.f); if (!(w > 0.8 && d > 0.8 && w < 30 && d < 30)) { fail.push('resize'); break; } const ext = isExteriorPoint(floorOfRoom(r), 'v', r.x + r.w, r.y + r.d / 2) || isExteriorPoint(floorOfRoom(r), 'h', r.y + r.d, r.x + r.w / 2); const lim = resizeRoomTo(r, snap(w), snap(d)); done.push(lim ? `Resized ${r.name} to ${r.w} × ${r.d} m — that's as far as it goes before it would overlap ${lim.name}.` : `Resized ${r.name} to ${r.w} × ${r.d} m.`); if (ext) { structural = true; S.structuralLog.push(`${r.name} was resized through an outer wall — external walls are usually load-bearing; get a structural engineer to review before construction.`); } needBuild = true; break; }
        case 'budget': { const rs = rooms.length ? rooms : allRooms(); const res = optimizeBudget(rs, +a.amount); done.push(res.ok ? `Optimised ${rs.length === allRooms().length ? 'the home' : rn} to ${inr(res.end)} (from ${inr(res.start)}), within your ${inr(a.amount)} budget. ${res.steps.length} swaps made — see Budget panel.` : `Brought ${rn} down from ${inr(res.start)} to ${inr(res.end)} — the leanest version still exceeds ${inr(a.amount)}.`); S.lastOptimize = res; needBuild = true; break; }
        case 'ceiling': { const tp = CEILINGS[a.type] ? a.type : 'cove'; rooms.forEach(r => r.ceiling = tp); done.push(`Set ${CEILINGS[tp].label.toLowerCase()} in ${rn}.`); needBuild = true; break; }
        case 'lights': { rooms.forEach(r => { r.lights = r.lights || {}; ['ambient', 'task', 'accent'].forEach(k => { if (typeof a[k] === 'boolean') r.lights[k] = a[k]; }); }); done.push(`Updated lighting in ${rn}. Slide the time to evening to see it.`); needBuild = true; break; }
        case 'time': setHour(+a.hour); done.push(`Simulating sunlight at ${fmtHour(+a.hour)}.`); break;
        case 'tour': setTimeout(() => startTour(), 300); done.push('Starting your animated home tour…'); break;
        case 'goto': { const r = rooms[0]; if (r) { setTimeout(() => walkInto(r), 100); done.push(`Taking you inside ${r.name}.`); } break; }
        case 'view': setView(a.mode); done.push(`Switched to ${a.mode === 'walk' ? 'walk-through' : a.mode.toUpperCase()} view.`); break;
        case 'show_floor': { const pj = P(); const q = String(a.floor || '').toLowerCase(); if (/all|whole|every|building/.test(q) || /explode/.test(q)) { S.showAllFloors = true; S.explode = /explode/.test(q); rebuild(); renderFloorSeg(); fitView(true); done.push(S.explode ? 'Pulled the floors apart so you can see every level.' : 'Showing the whole building.'); break; }
          const lv = parseLevel(q); const f = pj.floors.find(x => x.name.toLowerCase() === q) || pj.floors.find(x => q && x.name.toLowerCase().includes(q.replace(/ floor$/, ''))) || (lv != null ? pj.floors.find(x => x.level === lv) : null) || (/up/.test(q) ? floorAbove(FL()) : /down/.test(q) ? floorBelow(FL()) : null);
          if (!f) { fail.push('floor "' + a.floor + '"'); break; } pj.activeFloor = pj.floors.indexOf(f); S.showAllFloors = false; S.sel = null; rebuild(); renderFloorSeg(); if (S.view !== '2d') fitView(true); done.push(`Showing the ${f.name}.`); break; }
        case 'open': openPanel(a.panel); done.push(`Opened ${({ space: 'Space Analyzer', budget: 'Budget Estimator', light: 'Light & Ventilation', arch: 'Architectural checks', report: 'Home Decision Report', compare: 'Design Comparison', design: 'Interior Designer' })[a.panel] || a.panel}.`); break;
        case 'facade': { const k = String(a.style || '').toLowerCase(), key = FACADES[k] ? k : /brick/.test(k) ? 'brick' : /(classic|indian|traditional)/.test(k) ? 'classic' : 'modern'; P().facade = key; P().exterior = null; done.push(`Exterior changed to ${FACADES[key].label} — ${FACADES[key].desc.toLowerCase()}.`); needBuild = true; break; }
        case 'exterior': { const hex = /^#/.test(a.color) ? a.color : (NAMED_COLORS[String(a.color).toLowerCase()] || findColor(String(a.color).toLowerCase())?.hex); if (!hex) { fail.push('exterior colour'); break; } P().exterior = hex; done.push(`Painted the outside of the house ${a.name || hex}.`); needBuild = true; break; }
        case 'roof': { S.roof = a.on !== false; if (S.roof) S.cutaway = false; $('#t-roof')?.classList.toggle('on', S.roof); $('#t-cut')?.classList.toggle('on', S.cutaway); rebuild(); done.push(S.roof ? 'Showing the finished roof terrace.' : 'Roof hidden so you can see inside.'); break; }
        case 'cutaway': { S.cutaway = a.on !== false; if (S.cutaway) S.roof = false; $('#t-cut')?.classList.toggle('on', S.cutaway); $('#t-roof')?.classList.toggle('on', S.roof); rebuild(); done.push(S.cutaway ? 'Cut the walls down so you can see every room.' : 'Walls back to full height.'); break; }
        case 'save_variant': { setTimeout(() => { const i = $('#var-name'); if (i) i.value = a.name || ''; ACT['save-variant'](); }, 50); done.push(`Saved this design as a variant${a.name ? ' “' + a.name + '”' : ''} — compare it in the Compare panel.`); break; }
        case 'suggest_paint': { const r = rooms[0] || allRooms()[0]; S.paintChips = { room: r.id, list: paintSuggestions(r) }; done.push(`Here are paint ideas for ${r.name} — tap one to apply:`); break; }
        default: fail.push(a.do);
      }
    } catch (e) { console.error(e); fail.push(a.do); }
  });
  if (needBuild) { rebuild(); save(); }
  return { done, fail, structural };
}

function homeSummaryForAI(focus) {
  const pj = P(), mf = pj.floors.length > 1, cost = homeCost(), built = allRooms().filter(r => !isYard(r));
  const rooms = allRooms().map(r => { let L = null, c = null; try { L = analyzeLight(r); } catch (e) { } try { c = roomCost(r); } catch (e) { }
    return { id: r.id, name: r.name, type: r.type, ...(mf ? { floor: floorOfRoom(r).name } : {}), size: `${r.w}x${r.d}m`, area_m2: r2(area(r)), wall: roomWall(r), flooring: roomFloorKey(r), ceiling: roomCeiling(r),
      ...(L && !isYard(r) ? { daylight: L.rating, windows: L.wins.length, facing: (L.dirs || []).join('/') || null } : {}), cost_inr: c ? Math.round(c.total) : null, items: r.furniture.map(i => i.type).join(',') }; });
  let checks = []; try { checks = archChecks(FL()).slice(0, 5).map(c => `${c.t}: ${c.d}`); } catch (e) { }
  const A = built.reduce((s, r) => s + area(r), 0);
  return JSON.stringify({ name: pj.name, theme: pj.theme,
    totals: { rooms: built.length, built_area_m2: r2(A), built_area_sqft: Math.round(A * SQFT), estimate_inr: Math.round(cost.total), breakdown_inr: { furniture: Math.round(cost.furniture), flooring: Math.round(cost.flooring), paint: Math.round(cost.paint), lighting: Math.round(cost.lighting), false_ceiling: Math.round(cost.ceiling), decor: Math.round(cost.decor) } },
    budget_inr: S.prefs.budget, over_budget_by_inr: Math.max(0, Math.round(cost.total - S.prefs.budget)),
    ...(mf ? { floors: pj.floors.map(f => ({ name: f.name, level: f.level, rooms: f.rooms.length, stairs_up: !!(f.stairs && f.stairs.length && floorAbove(f)) })), viewing_floor: FL().name } : {}),
    view: S.view, time_of_day: fmtHour(S.hour), exterior_colour: extColor(), roof_shown: !!S.roof, cutaway: !!S.cutaway,
    prefs: { family: S.prefs.family, pets: S.prefs.pets, kids: S.prefs.kids, wfh: S.prefs.wfh, colors: S.prefs.colors, style: S.prefs.style },
    focus_room: focus ? focus.id : null, design_checks: checks, rooms });
}
const ACTION_DOC = `Actions you can return (use exact keys; "room" is a room id from the state, or "all"):
{"do":"wall_color","room":"..","color":"#hex","name":"colour name"}
{"do":"floor","room":"..","material":"${Object.keys(FLOORS).join('|')}"}
{"do":"add","room":"..","item":"${Object.keys(CATALOG).join('|')}","count":1}
{"do":"remove","room":"..","item":"<catalog item>|all"}
{"do":"furnish","room":"..","variant":0}
{"do":"theme","name":"${Object.keys(THEMES).join('|')}","room":"..|all"}
{"do":"transform","room":"..","to":"${Object.keys(ROOM_TYPES).join('|')}"}
{"do":"rename","room":"..","name":".."}
{"do":"resize","room":"..","w":metres,"d":metres}
{"do":"budget","room":"..|all","amount":rupees}
{"do":"ceiling","room":"..|all","type":"flat|peripheral|cove|tray"}
{"do":"lights","room":"..|all","ambient":true,"task":true,"accent":true}
{"do":"time","hour":0-24}
{"do":"tour"} {"do":"goto","room":".."} {"do":"view","mode":"3d|2d|walk"} {"do":"show_floor","floor":"<floor name>|all|explode"}
{"do":"open","panel":"design|space|budget|light|transform|arch|compare|report"}
{"do":"suggest_paint","room":".."}
{"do":"exterior","color":"#hex","name":"colour name"} (outside walls of the house)
{"do":"facade","style":"modern|classic|brick"} (exterior style: modern villa = white + stacked stone + timber + dark roof overhang; classic Indian = plaster, plinth, chajjas, parapet; brick & white)
{"do":"roof","on":true|false} {"do":"cutaway","on":true|false}
{"do":"save_variant","name":".."} (snapshot the current design for comparison)`;
const chatHistory = []; // kept for compatibility; the real memory lives in the project (S.project.chat)
function chatMemory() { const pj = P(); if (!pj) return chatHistory; if (!Array.isArray(pj.chat)) pj.chat = []; return pj.chat; }
function remember(role, text) { const m = chatMemory(); m.push({ role, text: String(text).slice(0, 1200), at: Date.now() }); if (m.length > 40) m.splice(0, m.length - 40); }
async function askAria(text, focus) {
  let parsed = null, via = 'on-device';
  const history = chatMemory().slice(-12).map(m => ({ role: m.role === 'aria' ? 'model' : 'user', text: m.text }));
  if (aiOn()) {
    try {
      const j = await API.req('/api/assistant', { body: { text, home: homeSummaryForAI(focus), action_doc: ACTION_DOC, history }, timeout: 90000 });
      parsed = j; via = j.via || modelLabel();
    } catch (e) { console.warn('AI failed', e); parsed = null; S.lastAIError = e.message; }
  }
  let qa = '';
  if (!parsed) { parsed = localParse(text, focus); qa = answerQuestion(text, focus);
    // a question ("how much does the kitchen cost?") gets an answer; opening the matching panel is just a bonus
    if (qa && (parsed.actions || []).every(a => ['open', 'goto'].includes(a.do))) parsed.reply = qa + ((parsed.actions || []).some(a => a.do === 'open') ? ' (I\'ve opened the matching panel too.)' : ''); }
  const actions = Array.isArray(parsed.actions) ? parsed.actions.filter(a => a && a.do).slice(0, 10) : [];
  const res = execActions(actions, focus);
  let reply = parsed.reply || '';
  if (!reply) {
    if (res.done.length) reply = res.done.join(' ');
    else reply = answerQuestion(text, focus) || helpReply(text);
  } else if (res.done.length && via === 'on-device' && !qa) reply += ' ' + res.done.join(' ');
  if (res.fail.length && !res.done.length && actions.length) reply += ` (I couldn't do: ${res.fail.join('; ')}.)`;
  if (res.structural) reply += ' ⚠️ That change touches an outer wall — flagged for structural review.';
  remember('user', text); remember('aria', reply); save();
  return { reply, via, actions, res };
}
/* on-device answers to questions about the home, from the same numbers the panels show */
function answerQuestion(text, focus) {
  const T = text.toLowerCase(); const rs = allRooms(), built = rs.filter(r => !isYard(r)); if (!rs.length) return '';
  const room = (() => { const id = mentionRoom(T, focus); return id ? findRoom(id) : null; })();
  const count = t => built.filter(r => t.includes(r.type)).length;
  if (/how many|number of|count/.test(T)) {
    if (/bed ?room/.test(T)) { const n = count(['bedroom', 'master', 'guest']); return `There ${n === 1 ? 'is' : 'are'} ${n} bedroom${n === 1 ? '' : 's'}${n ? ': ' + built.filter(r => ['bedroom', 'master', 'guest'].includes(r.type)).map(r => r.name).join(', ') : ''}.`; }
    if (/bath|toilet|washroom/.test(T)) { const n = count(['bathroom']); return `There ${n === 1 ? 'is' : 'are'} ${n} bathroom${n === 1 ? '' : 's'}.`; }
    if (/floor|storey|stor(y|ies)|level/.test(T)) return `The home has ${P().floors.length} floor${P().floors.length > 1 ? 's' : ''}: ${P().floors.map(f => `${f.name} (${f.rooms.length} rooms)`).join(', ')}.`;
    if (/window/.test(T)) { const n = P().floors.reduce((s, f) => s + f.windows.length, 0); return `There are ${n} windows in total.`; }
    if (/door/.test(T)) { const n = P().floors.reduce((s, f) => s + f.doors.length, 0); return `There are ${n} doors in total.`; }
    if (/room/.test(T)) return `${built.length} rooms: ${built.map(r => r.name).join(', ')}.`;
  }
  if (/(area|size|big|sq|square|carpet)/.test(T) && room) return `${room.name} is ${room.w} × ${room.d} m — ${r2(area(room))} m² (${Math.round(area(room) * SQFT)} sq ft).`;
  if (/(total|whole|overall|built).*(area|size|sq)|(area|size).*(home|house|flat)/.test(T)) { const A = built.reduce((s, r) => s + area(r), 0); return `The built-up area is ${r2(A)} m² (${Math.round(A * SQFT).toLocaleString('en-IN')} sq ft) across ${built.length} rooms${P().floors.length > 1 ? ' on ' + P().floors.length + ' floors' : ''}.`; }
  if (/(biggest|largest)/.test(T)) { const r = built.slice().sort((a, b) => area(b) - area(a))[0]; return `The largest room is ${r.name}: ${r.w} × ${r.d} m (${r2(area(r))} m²).`; }
  if (/smallest/.test(T)) { const r = built.slice().sort((a, b) => area(a) - area(b))[0]; return `The smallest room is ${r.name}: ${r.w} × ${r.d} m (${r2(area(r))} m²).`; }
  if (/(cost|price|expens|how much|budget|spend|₹|rupee)/.test(T)) {
    if (room) { const c = roomCost(room); return `${room.name} is estimated at ${inr(c.total)}: furniture ${inr(c.furniture)}, flooring ${inr(c.flooring)}, paint ${inr(c.paint)}, lighting ${inr(c.lighting)}, ceiling ${inr(c.ceiling)}, decor ${inr(c.decor)} (illustrative).`; }
    const c = homeCost(), b = S.prefs.budget; const top = c.rooms.slice().sort((x, y) => y.c.total - x.c.total).slice(0, 3).map(x => `${x.r.name} ${inr(x.c.total)}`).join(', ');
    return `The design is estimated at ${inr(c.total)} (illustrative) — ${c.total > b ? `${inr(c.total - b)} over` : `${inr(b - c.total)} under`} your ${inr(b)} budget. Biggest items: ${top}. Say “fit the home under ₹${b >= 100000 ? r2(b / 100000) + ' lakh' : Math.round(b / 1000) + 'k'}” and I'll trim it.`;
  }
  if (/(light|sun|bright|dark|daylight)/.test(T)) {
    const L = built.map(r => ({ r, L: analyzeLight(r) }));
    if (room) { const x = analyzeLight(room); return `${room.name} gets ${x.rating.toLowerCase()} daylight from ${x.wins.length} window${x.wins.length === 1 ? '' : 's'}${x.dirs.length ? ' facing ' + x.dirs.join(' and ') : ''}. ${x.sugg[0] || ''}`; }
    const best = L.slice().sort((a, b) => b.L.score - a.L.score)[0], dark = L.filter(x => ['Limited', 'Poor', 'No daylight'].includes(x.L.rating) && !['hall', 'closet', 'utility'].includes(x.r.type));
    return `${best.r.name} is the brightest room. ${dark.length ? `Rooms short on daylight: ${dark.map(x => x.r.name).join(', ')} — open the Light panel for fixes.` : 'Every main room gets reasonable daylight.'}`;
  }
  if (/(parking|car|garden|lawn|park)/.test(T)) { const y = rs.filter(isYard); return y.length ? `Outside, the plan has ${y.map(r => `${r.name} (${r.w} × ${r.d} m)`).join(' and ')}.` : 'The plan doesn\'t show a parking area or garden. You can draw one in the 2D editor and set its type to Car Parking or Garden.'; }
  if (/(theme|style)/.test(T) && /(what|which|current)/.test(T)) return `The home is styled ${P().theme}. Try “make it Scandinavian” to switch.`;
  if (/(problem|issue|wrong|check|mistake)/.test(T)) { const c = archChecks(FL()); return c.length ? `I found ${c.length} thing${c.length > 1 ? 's' : ''} to look at: ${c.slice(0, 3).map(x => x.t.toLowerCase()).join('; ')}. Open Structure for details.` : 'No layout problems found on this floor.'; }
  return '';
}
function helpReply(text) {
  if (/(hi|hello|hey|namaste)\b/i.test(text)) return `Namaste! I'm Aria. I can redesign your home for you — try “paint the master bedroom sage green”, “convert the study into a gaming room”, “design my bedroom under ₹30,000” or “give me a tour”.`;
  if (/how much|cost|price/i.test(text)) { const c = homeCost(); return `Your current design is estimated at ${inr(c.total)} (illustrative): furniture ${inr(c.furniture)}, flooring ${inr(c.flooring)}, painting ${inr(c.paint)}, lighting ${inr(c.lighting)}, false ceiling ${inr(c.ceiling)}, decor ${inr(c.decor)}.`; }
  if (/(biggest|largest|area|size)/i.test(text)) { const rs = allRooms().slice().sort((a, b) => area(b) - area(a)); return `Total carpet area is ${r2(rs.reduce((s, r) => s + area(r), 0))} m². Largest: ${rs[0].name} (${rs[0].w} × ${rs[0].d} m, ${r2(area(rs[0]))} m²).`; }
  return `I can change colours, flooring, furniture, themes, room purposes, lighting, ceilings and budgets — or take you on a tour. Try: “make the living room Japandi”, “add a bookshelf to the study”, “Italian marble floor in the living room”, or “show me sunset light”.${aiOn() ? '' : ' Connect Cloudflare AI in Settings for free-form conversation.'}`;
}

/* ---------- tour narration ---------- */
function roomFacts(r) {
  const L = analyzeLight(r), Sx = analyzeSpace(r), c = roomCost(r);
  return { L, Sx, c, line: `${r.name}: ${r.w}×${r.d} m (${r2(area(r))} m²), ${ROOM_TYPES[r.type].label}; walls ${roomWall(r)}, floor ${FLOORS[roomFloorKey(r)].label}; furniture: ${r.furniture.map(i => CATALOG[i.type].label).join(', ') || 'none'}; daylight ${L.rating}${L.dirs.length ? ' (' + L.dirs.join('/') + '-facing)' : ''}, ventilation ${L.vent}; space ${Sx.status}, ${Sx.issues[0] || 'no clearance issues'}${Sx.corner ? `; unused corner ${r2(Sx.corner.w)}×${r2(Sx.corner.d)} m` : ''}; est. cost ${inr(c.total)}` };
}
function templateNarration(r) {
  const { L, Sx, c } = roomFacts(r); const t = ROOM_TYPES[r.type].label.toLowerCase();
  const open = { living: `Welcome to the ${r.name} — the social heart of your home.`, master: `This is the ${r.name}, your private retreat.`, bedroom: `Here's ${r.name}.`, kitchen: `Now the ${r.name}, where the action happens.`, dining: `This is the ${r.name}.`, bathroom: `The ${r.name}.`, balcony: `Step out to the ${r.name} for some fresh air.`, study: `This is the ${r.name}, set up for focus.`, office: `Your ${r.name}, built for productive work-from-home days.`, gaming: `Welcome to the ${r.name}!` }[r.type] || `This is the ${r.name}.`;
  const size = `It measures ${r.w} by ${r.d} metres — about ${Math.round(area(r) * SQFT)} square feet.`;
  const light = L.wins.length ? `It gets ${L.rating.toLowerCase()} daylight from the ${L.dirs.join(' and ')}${L.dirs.some(d => d.includes('E')) ? ', lovely in the mornings' : L.dirs.some(d => d.includes('W')) ? ', so afternoons run warm' : ''}.` : `There's no outside window here, so good artificial lighting and an exhaust matter.`;
  const furn = r.furniture.length ? `I've placed ${r.furniture.slice(0, 3).map(i => 'a ' + CATALOG[i.type].label.toLowerCase()).join(', ')}${r.furniture.length > 3 ? ` and ${r.furniture.length - 3} more pieces` : ''}, on ${FLOORS[roomFloorKey(r)].label.toLowerCase()}.` : `It's empty right now — ask me to furnish it.`;
  const tip = Sx.corner ? `Tip: the ${r2(Sx.corner.w)} by ${r2(Sx.corner.d)} metre corner is unused — it would make a great reading nook or study corner.` : Sx.issues[0] ? `One thing to watch: ${Sx.issues[0]}` : L.sugg[0] ? L.sugg[0] : `Walking clearance looks comfortable.`;
  return `${open} ${size} ${light} ${furn} ${tip} Estimated interior cost: ${inr(c.total)}.`;
}
async function serverNarrations(order) {
  const household = `${S.prefs.family} people${S.prefs.kids ? ', kids' : ''}${S.prefs.pets ? ', pets' : ''}${S.prefs.wfh ? ', works from home' : ''}`;
  return API.req('/api/narration', { body: { theme: P().theme, household, floors: P().floors.map(f => f.name), rooms: order.map(r => ({ id: r.id, floor: floorOfRoom(r).name, facts: roomFacts(r).line })) }, timeout: 120000 });
}
async function serverTourOrder() {
  if (!S.backendOK) return null;
  try { const j = await API.req('/api/tour', { body: { project: projectGeometry() }, timeout: 3000 }); const rs = (j.order || []).map(findRoom).filter(Boolean); return rs.length ? rs : null; } catch (e) { return null; }
}

/* ---------- inspiration image → style ---------- */
function extractPalette(img, k = 5) {
  const c = document.createElement('canvas'); const s = 64 / Math.max(img.width, img.height); c.width = Math.max(1, img.width * s | 0); c.height = Math.max(1, img.height * s | 0);
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height); const d = x.getImageData(0, 0, c.width, c.height).data; const px = [];
  for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
  let cents = px.filter((_, i) => i % Math.floor(px.length / k) === 0).slice(0, k).map(p => p.slice());
  for (let it = 0; it < 8; it++) { const acc = cents.map(() => [0, 0, 0, 0]); px.forEach(p => { let bi = 0, bd = 1e9; cents.forEach((c, i) => { const dd = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2; if (dd < bd) { bd = dd; bi = i; } }); const a = acc[bi]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++; }); cents = acc.map((a, i) => a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3], a[3]] : cents[i]); }
  return cents.sort((a, b) => (b[3] || 0) - (a[3] || 0)).map(c => rgbToHex(c[0] / 255, c[1] / 255, c[2] / 255));
}
function closestTheme(pal) {
  let best = null; Object.entries(THEMES).forEach(([n, t]) => { const tp = [t.walls[0], t.wood, t.fabric, t.accent].map(hexToRgb); let d = 0; pal.slice(0, 4).map(hexToRgb).forEach(p => { d += Math.min(...tp.map(q => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2)); }); if (!best || d < best.d) best = { n, d }; });
  return best.n;
}
async function analyzeInspiration(url) {
  const img = await loadImage(url); const pal = extractPalette(img);
  let res = { style: closestTheme(pal), palette: pal, via: 'on-device colour analysis' };
  const light = pal.slice().sort((a, b) => hexToRgb(b).reduce((s, v) => s + v, 0) - hexToRgb(a).reduce((s, v) => s + v, 0));
  res.wall = mixHex(light[0], '#f4f1ea', 0.35); res.accent = pal.find(h => { const [r, g, b] = hexToRgb(h); return Math.max(r, g, b) - Math.min(r, g, b) > 0.18; }) || pal[1];
  if (aiOn()) {
    try {
      const j = await API.req('/api/inspiration', { body: { image: await shrinkImage(url, 900), styles: Object.keys(THEMES), floors: Object.keys(FLOORS), finishes: Object.keys(WOOD_FINISHES) }, timeout: 90000 });
      ['style', 'wall', 'accent', 'floor', 'finish', 'description'].forEach(k => { if (j[k]) res[k] = j[k]; }); res.via = j.via || modelLabel();
    } catch (e) { res.via += ` (${modelLabel()} unavailable)`; }
  }
  return res;
}

/* ===================== 3D SCENE BUILDER & INTERACTION ===================== */
let E = null, CTL = null, lastT = 0, buildAnim = null;
const floorGap = () => (S.explode && !S.touring && !(CTL && CTL.mode === 'walk')) ? 4.2 : 0;
const floorY = f => { const pj = S.project; let y = 0; if (pj) pj.floors.forEach(o => { if (o.level < f.level) y += o.height + 0.25; }); return y + Math.max(0, f.level) * floorGap(); };
const showFloorIn3D = (f, act) => f.level <= act.level || ((S.showAllFloors || S.touring || (CTL && CTL.mode === 'walk')) && !S.cutaway);
/* rectangle minus holes → list of rectangles */
function rectMinus(r, holes) {
  let out = [r];
  holes.forEach(h => { const nx = []; out.forEach(p => { const ox0 = Math.max(p.x, h.x), oy0 = Math.max(p.y, h.y), ox1 = Math.min(p.x + p.w, h.x + h.w), oy1 = Math.min(p.y + p.d, h.y + h.d);
    if (ox1 - ox0 <= 0.01 || oy1 - oy0 <= 0.01) { nx.push(p); return; }
    if (oy0 > p.y) nx.push({ x: p.x, y: p.y, w: p.w, d: oy0 - p.y }); if (oy1 < p.y + p.d) nx.push({ x: p.x, y: oy1, w: p.w, d: p.y + p.d - oy1 });
    if (ox0 > p.x) nx.push({ x: p.x, y: oy0, w: ox0 - p.x, d: oy1 - oy0 }); if (ox1 < p.x + p.w) nx.push({ x: ox1, y: oy0, w: p.x + p.w - ox1, d: oy1 - oy0 }); }); out = nx.filter(q => q.w > 0.01 && q.d > 0.01); });
  return out;
}
const edgeOnWall = (f, o, c, a, b) => wallLines(f).some(L => L.o === o && Math.abs(L.c - c) < 0.16 && Math.min(L.b, b) - Math.max(L.a, a) > (b - a) * 0.6);
function buildStairs(st, f, yOff) {
  const ff = f.height + 0.25, n = stairRisers(f), rise = ff / n, runZ = stairRun(st) === 'z', dir = stairDir(st), L = stairLen(st), Wd = stairWidth(st), step = L / n;
  const g = E.addGroup('stairs:' + st.id, { kind: 'misc', x: st.x, y: yOff + FLOOR_TOP, z: st.y });
  for (let i = 0; i < n; i++) {
    const u = (-L / 2 + step * (i + 0.5)) * dir, h = rise * (i + 1);
    E.part(g, Object.assign({ geo: runZ ? E.geo('box', Wd, h - 0.03, step) : E.geo('box', step, h - 0.03, Wd), color: '#d8cdbb', pattern: 1, patScale: 0.2, color2: '#b9a88e' }, runZ ? { z: u } : { x: u }));
    E.part(g, Object.assign({ geo: runZ ? E.geo('box', Wd, 0.03, step + 0.02) : E.geo('box', step + 0.02, 0.03, Wd), y: h - 0.03, color: '#9b7652', pattern: 1, patScale: 0.3, color2: '#7d5c3d' }, runZ ? { z: u } : { x: u }));
  }
  const hyp = Math.hypot(L, ff), ang = Math.atan2(ff, L) * dir;
  [-1, 1].forEach(sd => {
    const edge = runZ ? st.x + sd * Wd / 2 : st.y + sd * Wd / 2; const ft = stairFoot(st);
    if (edgeOnWall(f, runZ ? 'v' : 'h', edge, runZ ? ft.y : ft.x, runZ ? ft.y + ft.d : ft.x + ft.w)) return;
    const o = sd * (Wd / 2 - 0.04);
    E.part(g, runZ ? { geo: E.geo('box', 0.045, 0.05, hyp), x: o, y: ff / 2 + 0.88, rx: -ang, color: '#3b2f25', cast: false } : { geo: E.geo('box', hyp, 0.05, 0.045), z: o, y: ff / 2 + 0.88, rz: ang, color: '#3b2f25', cast: false });
    for (let i = 1; i < n; i += 2) { const u = (-L / 2 + step * (i + 0.5)) * dir; E.part(g, Object.assign({ geo: E.geo('box', 0.022, 0.9, 0.022), y: rise * (i + 1), color: '#4a4a4a', cast: false }, runZ ? { x: o, z: u } : { z: o, x: u })); }
  });
}
/* glass balustrade around the stair opening on the floor above (open on the arrival side) */
function buildStairwell(st, f, yOff) {
  const ft = stairFoot(st), runZ = stairRun(st) === 'z', dir = stairDir(st); const g = E.addGroup('well:' + st.id, { kind: 'misc', x: 0, y: yOff + FLOOR_TOP, z: 0 });
  const edges = [['h', ft.y, ft.x, ft.x + ft.w, runZ && dir < 0], ['h', ft.y + ft.d, ft.x, ft.x + ft.w, runZ && dir > 0], ['v', ft.x, ft.y, ft.y + ft.d, !runZ && dir < 0], ['v', ft.x + ft.w, ft.y, ft.y + ft.d, !runZ && dir > 0]];
  edges.forEach(([o, c, a, b, arrival]) => {
    if (arrival || edgeOnWall(f, o, c, a, b)) return; const len = b - a, mid = (a + b) / 2;
    const at = (w, h, d, y, extra) => Object.assign(o === 'h' ? { geo: E.geo('box', w, h, d), x: mid, z: c } : { geo: E.geo('box', d, h, w), x: c, z: mid }, { y }, extra);
    E.part(g, at(len, 0.86, 0.02, 0.06, { color: '#bfe0ee', alpha: 0.25, cast: false }));
    E.part(g, at(len + 0.04, 0.05, 0.06, 0.92, { color: '#3b2f25' }));
    [a + 0.02, b - 0.02].forEach(t => E.part(g, Object.assign(o === 'h' ? { x: t, z: c } : { x: c, z: t }, { geo: E.geo('box', 0.04, 0.95, 0.04), y: 0, color: '#3b2f25' })));
  });
  // slab edge band inside the opening
  E.part(g, { geo: E.geo('box', ft.w, 0.02, 0.02), x: ft.x + ft.w / 2, y: -0.02, z: ft.y, color: '#bdb5a8', cast: false });
}
function palette(room, it) {
  const th = roomTheme(room);
  const wood = it && it.finish ? WOOD_FINISHES[it.finish] : th.wood;
  return {
    wood, headboard: (it && it.color) || mixHex(th.fabric, th.wood, 0.25), fabric: (it && it.color) || th.fabric, fabric2: mixHex((it && it.color) || th.fabric, '#ffffff', 0.18), seat: (it && it.color) || mixHex(th.fabric, '#333333', 0.35),
    accent: th.accent, metal: th.metal, white: '#f3f2ee', mattress: '#f4f1ea', glass: '#c9e6f0', glass2: '#9fc3cf', screen: '#121418', plant: '#4f7d3c', plant2: '#6a9a48', pot: '#b56a45',
    stone: room.type === 'kitchen' ? (th.floor === 'marble' ? '#ece8e0' : '#2e2d2c') : '#3a3836', mirror: '#d7e6ec', rug: (it && it.color) || th.rug, rug2: mixHex((it && it.color) || th.rug, '#ffffff', 0.2), lamp: '#f6e7c8', dark: '#2b2b2d', ceramic: '#f6f6f4',
    brass: '#b8903a', carve: mixHex(wood, '#3a1d0c', 0.15),
    cabinet: th.name === 'Luxury' ? '#efe9df' : mixHex(wood, '#f2efe9', 0.35), appliance: '#d9dcdf', rattan: '#b08a5b', led: th.accent, diya: '#ffb347', rubber: '#1d1d1d', water: '#9fd3e6',
  };
}
function init3D() {
  const cv = document.getElementById('gl');
  try { E = new Engine(cv); } catch (e) { console.warn('[DIMORA] 3D unavailable:', e.message); document.getElementById('gl-fallback').style.display = 'flex'; document.getElementById('gl-fallback').querySelector('p').textContent = e.message; return false; }
  CTL = new Controls(E, cv);
  E.matHook = upgradeMaterial;
  let assetT = 0; E.onAsset = url => { if (/\.glb$|neem-foliage\.webp$/i.test(url)) { clearTimeout(assetT); assetT = setTimeout(() => { if (S.project) rebuild(); }, 60); } };
  CTL.onClick = (x, y) => pick3D(x, y);
  CTL.onDragStart = (x, y) => dragStart3D(x, y);
  CTL.onDrag = (x, y) => drag3D(x, y);
  CTL.onDragEnd = (cancel) => dragEnd3D(cancel);
  CTL.onChange = () => { E.dirty = true; };
  CTL.collide = walkCollide; CTL.onMoved = walkStairs;
  // on-screen walk pad: holding a button is the same as holding the arrow key
  $$('#walk-pad button').forEach(bt => { const k = bt.dataset.k, on = v => e => { e.preventDefault(); CTL.keys[k] = v; bt.classList.toggle('on', v); E.dirty = true; };
    bt.addEventListener('pointerdown', e => { bt.setPointerCapture(e.pointerId); on(true)(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => bt.addEventListener(t, on(false))); });
  CTL.kbd = () => S.view !== '2d' && !S.touring && $('#app').dataset.screen === 'work' && !document.querySelector('#modal.on');
  const loop = t => {
    if (!S.project || $('#app').dataset.screen !== 'work') { lastT = t; requestAnimationFrame(loop); return; } // signed out / no home open: nothing to draw
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    let moving = CTL.tick(dt);
    const fovT = (S.touring || CTL.mode === 'walk' ? 60 : 50) * Math.PI / 180; if (Math.abs(E.cam.fov - fovT) > 0.002) { E.cam.fov += (fovT - E.cam.fov) * 0.12; moving = true; }
    { const rr = (S.touring || CTL.mode === 'walk') && S.project ? roomAt(E.cam.pos[0], E.cam.pos[2]) : null, inside = !!rr && !isOpenAir(rr), wT = isNight() ? 0.3 : inside ? 0.6 : 0.4, w0 = E.env.warm || 0; // warm indoor light while walking inside
      const lid = inside ? rr.id : null; if (lid !== (S._litRoom || null)) { S._litRoom = lid; applyEnv(); moving = true; } // relight for the room you walked into
      if (Math.abs(wT - w0) > 0.005) { E.env.warm = w0 + (wT - w0) * 0.1; moving = true; }
      const gT = inside ? 1 : 0, g0 = E.env.glassIn || 0; if (Math.abs(gT - g0) > 0.005) { E.env.glassIn = g0 + (gT - g0) * 0.15; moving = true; } else E.env.glassIn = gT; }
    if (buildAnim) { stepBuildAnim(t); moving = true; }
    if (S.view !== '2d' && (E.dirty || moving)) { E.render(); updateLabels(); updateCompass(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.addEventListener('resize', () => { if (E) E.dirty = true; });
  return true;
}
function rebuild(opts = {}) {
  if (!E || !S.project) { if (S.view === '2d') render2D(); return; }
  const keepSel = S.sel;
  E.clear();
  const pj = S.project; const act = pj.floors[pj.activeFloor];
  pj.floors.forEach(f => { if (floorAbove(f)) fitStairs(f); }); // stairs never poke through walls, whatever was edited
  const site = buildSite(homeBounds());
  if (!opts.compact && E !== HERO.E) buildNeighbourhood();
  if (E.quality !== 'low') buildGrass(site);
  buildDeck();
  pj.floors.forEach(f => {
    if (!showFloorIn3D(f, act)) return;
    buildFloor(f, f === act); buildPlinth(f);
  });
  applyEnv();
  selectApply(keepSel);
  E.dirty = true;
  if (S.view === '2d') render2D();
  refreshSidePanel && refreshSidePanel();
  updateTopStats && updateTopStats();
}
/* ---------- the plot around the house: lawn, paving, path, boundary wall, garden ---------- */
/* exterior styles: what the outside of the house is made of */
const FACADES = {
  courtyard: { label: 'Courtyard villa', desc: 'Warm mineral plaster, charcoal stone, oak soffits and black frames', wall: '#f1e1c9', stone: ['#696861', '#413e38'], accent: 'stone', band: 'timber', plinth: true, chajja: false, frame: '#211e1a', roof: 'overhang', drive: 'pavers', sw: ['#f1e1c9', '#696861', '#87613c', '#292928'] },
  modern: { label: 'Modern villa', desc: 'White render, stacked-stone feature walls, timber battens, dark roof overhangs', wall: '#efeeea', stone: ['#c9bba6', '#7f7466'], accent: 'stone', band: 'timber', plinth: false, chajja: false, frame: '#1c1e21', roof: 'overhang', drive: 'cobble', sw: ['#efeeea', '#d8d1c5', '#6b4429', '#2b2c2f'] },
  classic: { label: 'Classic Indian', desc: 'Warm plaster, stone plinth, moulded bands and window sunshades (chajjas)', wall: '#dacbb2', accent: null, band: 'cornice', plinth: true, chajja: true, frame: '#34383c', roof: 'parapet', drive: 'pavers', sw: ['#dacbb2', '#7d7166', '#e7dccb', '#34383c'] },
  brick: { label: 'Brick & white', desc: 'Exposed red-brick volumes, white render, slim black frames', wall: '#f1eee8', brick: ['#a5573c', '#d9d1c6'], accent: 'brick', band: 'cornice', plinth: true, chajja: false, frame: '#232426', roof: 'overhang', drive: 'cobble', sw: ['#f1eee8', '#a5573c', '#d9d1c6', '#232426'] },
};
const facade = () => FACADES[(S.project && S.project.facade) || 'modern'] || FACADES.modern;
const courtyardFacade = () => P()?.facade === 'courtyard';
const extColor = () => (S.project && S.project.exterior) || facade().wall;
const TIMBER = { color: '#6b4429', color2: '#3b2416', pattern: 19, patScale: 1, rough: 0.55 };
const hashId = id => [...String(id)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);
function featureWall(room, f) { // the outside walls that get the accent material (stone / brick)
  const fc = facade(); if (courtyardFacade() || !fc.accent || !room || isOpenAir(room) || S.project.exterior) return null;
  const ground = !floorBelow(f), h = hashId(room.id);
  if (!(ground ? ['living', 'dining', 'garage'].includes(room.type) || (fc.accent === 'brick' && h % 4 === 0) : fc.accent === 'brick' && h % 3 === 0)) return null;
  return fc.accent === 'stone' ? { color: fc.stone[0], color2: fc.stone[1], pattern: 13, patScale: 1 } : { color: fc.brick[0], color2: fc.brick[1], pattern: 9, patScale: 1 };
}
/* garages get a roll-up door on their outside wall (unless the plan already shows a wide door there) */
function garageDoors(floor) {
  const out = [];
  floor.rooms.filter(r => r.type === 'garage').forEach(r => {
    const sides = [['h', r.y, r.x, r.x + r.w, 'N'], ['h', r.y + r.d, r.x, r.x + r.w, 'S'], ['v', r.x, r.y, r.y + r.d, 'W'], ['v', r.x + r.w, r.y, r.y + r.d, 'E']]
      .filter(([o, c, a, b]) => isExteriorPoint(floor, o, c, (a + b) / 2) && b - a > 2.6);
    if (!sides.length || floor.doors.some(d => d.w >= 2.2 && sides.some(([o, c, a, b]) => d.o === o && Math.abs((o === 'h' ? d.y : d.x) - c) < 0.2))) return;
    const pref = (() => { try { return siteSide(); } catch (e) { return null; } })();
    sides.sort((A, B) => ((B[4] === pref) - (A[4] === pref)) || ((B[3] - B[2]) - (A[3] - A[2])));
    const [o, c, a, b, face] = sides[0], len = b - a, w = Math.min(len - 0.5, len >= 6 ? 5.0 : 2.9), t = (a + b) / 2;
    out.push({ id: 'gd_' + r.id, o, x: o === 'h' ? t : c, y: o === 'h' ? c : t, w: r2(w), h: 2.4, garage: true, room: r.id, face });
  });
  return out;
}
function siteSide() { const g = P().floors.slice().sort((x, y) => x.level - y.level)[0]; const md = g ? mainDoorSide(g) : null; return md && md.side || 'S'; }
const SITE = { M: 3.6, front: 6.2 };
function streetFrame(site) {
  const horizontal = site.side === 'N' || site.side === 'S';
  const sign = ['N', 'W'].includes(site.side) ? -1 : 1;
  const center = horizontal ? (site.x0 + site.x1) / 2 : (site.z0 + site.z1) / 2;
  const edge = { N: site.z0, S: site.z1, W: site.x0, E: site.x1 }[site.side];
  const width = horizontal ? site.x1 - site.x0 : site.z1 - site.z0;
  const depth = horizontal ? site.z1 - site.z0 : site.x1 - site.x0;
  const toWorld = (u, v) => horizontal ? [center + u, edge + sign * v] : [edge + sign * v, center + u];
  const fromWorld = (x, z) => horizontal ? [x - center, (z - edge) * sign] : [z - center, (x - edge) * sign];
  return { horizontal, center, width, depth, toWorld, fromWorld };
}
function mainDoorSide(f) { // which side of the house the main door faces, by checking which side is outdoors
  const d = f.doors.find(x => x.main) || f.doors[0]; if (!d) return null;
  if (d.o === 'h') return { d, side: !roomAt(d.x, d.y - 0.3, f) ? 'N' : !roomAt(d.x, d.y + 0.3, f) ? 'S' : null };
  return { d, side: !roomAt(d.x - 0.3, d.y, f) ? 'W' : !roomAt(d.x + 0.3, d.y, f) ? 'E' : null };
}
function siteRect(b) {
  const ground = P().floors.slice().sort((x, y) => x.level - y.level)[0]; const md = ground ? mainDoorSide(ground) : null; let side = md && md.side || 'S';
  const st = P().site; // the plot as drawn on the plan (AI reading): boundary wall on the plot line, road and gate where drawn
  if (st && st.plot && st.plot.w > 2 && st.plot.d > 2) { const pl = st.plot, sd = st.road || side, gt = st.gate;
    return { x0: pl.x, x1: pl.x + pl.w, z0: pl.y, z1: pl.y + pl.d, side: sd, door: md && md.side === sd ? md.d : null, gate: gt ? (sd === 'N' || sd === 'S' ? gt.x : gt.y) : null, gateW: gt ? gt.w : null, yards: true }; }
  const yards = ground ? ground.rooms.filter(isYard) : [];
  if (yards.length) { // the plan already shows the plot (parking, garden): the boundary wall hugs it, the gate opens onto the parking
    const pk = yards.filter(r => r.type === 'parking').sort((a, c) => area(c) - area(a))[0]; let gate = null;
    if (pk) { const t = { N: pk.y - b.y < 0.3, S: b.y + b.d - pk.y - pk.d < 0.3, W: pk.x - b.x < 0.3, E: b.x + b.w - pk.x - pk.w < 0.3 };
      const sd = t[side] ? side : ['S', 'N', 'E', 'W'].find(k => t[k]); if (sd) { side = sd; gate = sd === 'N' || sd === 'S' ? pk.x + pk.w / 2 : pk.y + pk.d / 2; } }
    const m = 0.3; return { x0: b.x - m, x1: b.x + b.w + m, z0: b.y - m, z1: b.y + b.d + m, side, door: md && md.side === side ? md.d : null, gate, yards: true };
  }
  const m = { N: SITE.M, S: SITE.M, E: SITE.M, W: SITE.M }; m[side] = SITE.front;
  return { x0: b.x - m.W, x1: b.x + b.w + m.E, z0: b.y - m.N, z1: b.y + b.d + m.S, side, door: md && md.side ? md.d : null };
}
/* foliage: a crown of alpha-cut leaf cards (pattern 24) spread over ellipsoid clumps, normals pointing out of the crown,
   so the light wraps round it and the leaves cast leafy shadows. Built in code, cached per variant: no downloaded assets. */
function leafCards(key, clumps, centre, size) {
  return E.custom(key, () => {
    const rnd = seeded(key), pos = [], nor = [], uv = [];
    const unit = () => { const t = rnd() * 6.2832, z = rnd() * 2 - 1, r = Math.sqrt(1 - z * z); return [r * Math.cos(t), z, r * Math.sin(t)]; };
    clumps.forEach(cl => { for (let i = 0; i < cl.n; i++) {
      const u = rnd() * 6.2832, w = Math.acos(2 * rnd() - 1), rad = Math.pow(rnd(), 0.35);
      const p = [cl.c[0] + Math.sin(w) * Math.cos(u) * cl.r[0] * rad, cl.c[1] + Math.cos(w) * cl.r[1] * rad, cl.c[2] + Math.sin(w) * Math.sin(u) * cl.r[2] * rad];
      const n = V3.norm(V3.add(V3.norm(V3.sub(p, centre)), [0, 0.3, 0]));
      const t1 = unit(), t2 = V3.norm(V3.cross(t1, unit())), h = size * (0.75 + rnd() * 0.5) / 2;
      const c = (sa, sb) => V3.add(p, V3.add(V3.scale(t1, sa * h), V3.scale(t2, sb * h)));
      const q = [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], quv = [[0, 0], [1, 0], [1, 1], [0, 1]];
      [0, 1, 2, 0, 2, 3].forEach(k => { pos.push(...q[k]); nor.push(...n); uv.push(...quv[k]); });
    } });
    return { pos, nor, uv };
  });
}
const LEAF_TONES = [['#3f6230', '#86a356'], ['#35552a', '#7a9a4a'], ['#4a6a2e', '#9aae5a'], ['#2f4d26', '#6f9a45']];
/* a tree about h metres tall on the ground at (x, z): flared bark trunk, a few limbs, and a leafy crown */
// soft contact shadow on the ground under a plant (so trunks and shrubs sit in the lawn instead of floating on it)
function groundBlob(g, x, z, w, y = 0, a = 0.38) { if (E.quality === 'low') return; E.part(g, { geo: planeGeo(w, w), x, y: y + 0.012, z, pattern: 25, alpha: a, cast: false, maxDist: 70 }); }
/* species common in Indian residential streets: 'neem' (broad round crown, the default), 'ashoka' (tall narrow column),
   'palm' (areca: slim ringed stem, arching feathery fronds) */
function tree(g, x, z, k, i, H, sp = 'neem') {
  if (sp === 'ashoka' || sp === 'palm') return treeSp(g, x, z, k, i, sp);
  const rnd = seeded('tree' + i + ':' + k.toFixed(2)), h = H || 5.4 + 2.6 * k, trunkH = h * 0.42, rb = 0.07 + h * 0.013;
  groundBlob(g, x, z, h * 0.75, -0.04, 0.32);
  const bark = { color: '#5a4636', color2: '#3a2c22', pattern: 1, patScale: 3, rough: 0.95 };
  E.part(g, Object.assign({ geo: E.geo('cyl', rb * 1.45, 0.35, 0.68, 12), x, y: -0.02, z }, bark));
  E.part(g, Object.assign({ geo: E.geo('cyl', rb, trunkH, 0.62, 12), x, y: 0, z }, bark));
  const limbs = 5;
  for (let b = 0; b < limbs; b++) { const a = b * 6.2832 / limbs + rnd() * 0.7, tilt = 0.55 + rnd() * 0.35;
    E.part(g, Object.assign({ geo: E.geo('cyl', rb * 0.55, h * 0.3, 0.45, 8), x: x + Math.cos(a) * rb * 0.5, y: trunkH * 0.82, z: z + Math.sin(a) * rb * 0.5, rx: Math.sin(a) * tilt, rz: -Math.cos(a) * tilt }, bark)); }
  const v = i % 6, R = h * 0.33, RH = h * 0.27, cy = trunkH + RH * 1.05, key = 'tree:' + v + ':' + h.toFixed(1);
  const clumps = [];
  for (let c = 0; c < 7; c++) { const a = c * 0.8976 + rnd() * 0.18, up = rnd();
    clumps.push({ c: [Math.cos(a) * R * (0.58 + rnd() * 0.27), cy - RH * 0.42 + up * RH * 1.1, Math.sin(a) * R * (0.62 + rnd() * 0.21)], r: [h * 0.13, h * 0.10, h * 0.14], n: 32 }); }
  clumps.push({ c: [0, cy + RH * 0.35, 0], r: [R * 0.6, RH * 0.6, R * 0.6], n: 64 }, { c: [0, cy, 0], r: [R * 0.85, RH * 0.85, R * 0.85], n: 56 });
  const [c1, c2] = LEAF_TONES[i % LEAF_TONES.length];
  const leaves = E.quality === 'low' ? null : E.texture('assets/textures/neem-foliage.webp');
  const textured = leaves?.t;
  E.part(g, {
    geo: leafCards(key, clumps, [0, cy, 0], h * 0.17), x, y: 0, z, ry: rnd() * 6.28,
    color: textured ? ['#e9efd4', '#ddeacb', '#f3efd2', '#d3e1c1'][i % 4] : c1,
    color2: c2, pattern: 24, tex: leaves ? { B: leaves, cut: true } : null, noCull: true, rough: 0.73
  });
}
function treeSp(g, x, z, k, i, sp) {
  const rnd = seeded(sp + i + ':' + k.toFixed(2)), bark = { color: '#6a5a48', color2: '#463a2e', pattern: 1, patScale: 3, rough: 0.95 };
  if (sp === 'ashoka') { const h = 7 + 3 * k, rb = 0.09; groundBlob(g, x, z, 2.2, -0.04, 0.35);
    E.part(g, Object.assign({ geo: E.geo('cyl', rb, h * 0.5, 0.7, 10), x, y: 0, z }, bark));
    const clumps = []; for (let c = 0; c < 9; c++) { const t = c / 8, a = c * 2.4; clumps.push({ c: [Math.cos(a) * 0.18, h * (0.2 + 0.78 * t), Math.sin(a) * 0.18], r: [0.75 * (1.1 - t * 0.7), 0.7, 0.75 * (1.1 - t * 0.7)], n: 28 }); }
    E.part(g, { geo: leafCards('ashoka:' + (i % 3), clumps, [0, h * 0.55, 0], 0.55), x, y: 0, z, ry: rnd() * 6.28, color: '#2d4a22', color2: '#5f8a3a', pattern: 24, noCull: true, rough: 0.6 }); return; }
  // areca palm: 3-4 slim stems, each with a crown of arching fronds (leaflet cards along curved lines)
  const n = 3 + (i % 2); groundBlob(g, x, z, 2.0, -0.04, 0.3);
  for (let s2 = 0; s2 < n; s2++) { const a0 = s2 * 6.28 / n + rnd(), lean = 0.06 + rnd() * 0.08, h = 4.2 + k * 2.4 + rnd() * 1.2, bx = x + Math.cos(a0) * 0.18, bz = z + Math.sin(a0) * 0.18;
    E.part(g, { geo: E.geo('cyl', 0.06, h, 0.85, 8), x: bx, y: 0, z: bz, rx: Math.sin(a0) * lean, rz: -Math.cos(a0) * lean, color: '#8a8a72', color2: '#6a6a55', pattern: 1, patScale: 6, rough: 0.8 });
    const tx = bx + Math.cos(a0) * lean * h, tz = bz + Math.sin(a0) * lean * h, clumps = [];
    for (let f = 0; f < 8; f++) { const fa = f * 0.785 + rnd() * 0.3; for (let t = 1; t <= 6; t++) { const r = t * 0.32, dy = 0.25 * t - 0.05 * t * t; clumps.push({ c: [Math.cos(fa) * r, dy, Math.sin(fa) * r], r: [0.22, 0.08, 0.22], n: 6 }); } }
    E.part(g, { geo: leafCards('palm:' + s2 + ':' + (i % 3), clumps, [0, 0, 0], 0.2), x: tx, y: h, z: tz, ry: rnd() * 6.28, color: '#3f6a2a', color2: '#88a84e', pattern: 24, noCull: true, rough: 0.6 }); }
}
/* a rounded shrub s metres across */
function bush(g, x, z, s, seed, y = 0) {
  groundBlob(g, x, z, s * 1.25, y - 0.02, 0.3);
  const v = Math.abs(Math.round(seed)) % 5, sz = Math.round(s * 10) / 10, key = 'bush:' + v + ':' + sz;
  const [c1, c2] = LEAF_TONES[(v + 1) % LEAF_TONES.length];
  E.part(g, { geo: leafCards(key, [{ c: [0, sz * 0.42, 0], r: [sz * 0.55, sz * 0.42, sz * 0.55], n: Math.round(40 + sz * 50) }], [0, 0, 0], sz * 0.42), x, y, z, ry: v * 1.3, color: c1, color2: c2, pattern: 24, noCull: true, rough: 0.7 });
}
/* The street view a house opens with when it is shown with its roof: a slightly pulled-back, near-eye-level three-quarter
   view from the road that shows the front and the driveway side, framed from this house's own size and plot. */
function exteriorFrame() {
  const hb = houseBounds() || homeBounds(), st = siteRect(homeBounds()), pj = P();
  const top = pj.floors.slice().sort((a, b) => b.level - a.level)[0], hgt = floorY(top) + top.height + 1.1;
  const f = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[st.side] || [0, 1], sd = [-f[1], f[0]];
  const cx = hb.x + hb.w / 2, cz = hb.y + hb.d / 2, ground = pj.floors.slice().sort((a, b) => a.level - b.level)[0];
  const pk = ground.rooms.filter(r => r.type === 'parking' || r.type === 'garage').sort((a, b) => area(b) - area(a))[0];
  const sg = pk ? Math.sign((pk.x + pk.w / 2 - cx) * sd[0] + (pk.y + pk.d / 2 - cz) * sd[1]) || 1 : 1;
  const courtyard = courtyardFacade();
  const ang = (courtyard ? 13 : 34) * Math.PI / 180, dir = V3.norm([f[0] * Math.cos(ang) + sd[0] * Math.sin(ang) * sg, 0, f[1] * Math.cos(ang) + sd[1] * Math.sin(ang) * sg]);
  // fit the house together with the front yard (out to the plot edge on the road side)
  let x0 = hb.x, x1 = hb.x + hb.w, z0 = hb.y, z1 = hb.y + hb.d;
  if (st.side === 'S') z1 = st.z1; else if (st.side === 'N') z0 = st.z0; else if (st.side === 'E') x1 = st.x1; else if (st.side === 'W') x0 = st.x0;
  const tx = cx * 0.7 + (x0 + x1) / 2 * 0.3, tz = cz * 0.7 + (z0 + z1) / 2 * 0.3;
  const asp = E.canvas.clientWidth / Math.max(1, E.canvas.clientHeight), vf = E.cam.fov, hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
  const radius = Math.hypot(x1 - x0, z1 - z0, hgt) / 2;
  const frontage = st.side === 'N' || st.side === 'S' ? hb.w : hb.d;
  const fitRadius = courtyard ? Math.hypot(frontage, hgt * 0.62) / 2 : radius;
  const field = Math.min(vf, Math.max(hf, vf * (courtyard ? 0.42 : 0.72)));
  const dist = fitRadius / Math.sin(field / 2) * (courtyard ? 0.95 : 0.86);
  const eye = (courtyard ? 2.25 : Math.min(2.0 + dist * 0.07, 4.4)) - plinthH();
  const ty = courtyard ? hgt * 0.44 : Math.min(hgt * 0.42, eye - 0.15);
  return { pos: [tx + dir[0] * dist, eye, tz + dir[2] * dist], target: [tx, ty, tz] };
}
/* true if something at (x, z) would hide part of the house from the street view */
function blocksFacade(x, z, rad = 2) {
  if (!E || !E.canvas) return false;
  const fr = exteriorFrame(), hb = houseBounds() || homeBounds(), ex = fr.pos[0], ez = fr.pos[2];
  const dx = fr.target[0] - ex, dz = fr.target[2] - ez, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
  const ang = (px, pz) => { const vx = px - ex, vz = pz - ez; return Math.atan2(ux * vz - uz * vx, ux * vx + uz * vz); };
  const cs = [[hb.x, hb.y], [hb.x + hb.w, hb.y], [hb.x, hb.y + hb.d], [hb.x + hb.w, hb.y + hb.d]], as = cs.map(([px, pz]) => ang(px, pz)), ds = cs.map(([px, pz]) => Math.hypot(px - ex, pz - ez));
  const d = Math.hypot(x - ex, z - ez), half = Math.atan2(rad, Math.max(d, 0.1)), a = ang(x, z);
  return d < Math.max(...ds) && a + half > Math.min(...as) && a - half < Math.max(...as);
}
function houseBounds() { // footprint of the built rooms only (yards excluded), all floors
  const rs = allRooms().filter(r => !isYard(r)); if (!rs.length) return null;
  const x0 = Math.min(...rs.map(r => r.x)), y0 = Math.min(...rs.map(r => r.y)), x1 = Math.max(...rs.map(r => r.x + r.w)), y1 = Math.max(...rs.map(r => r.y + r.d));
  return { x: x0, y: y0, w: x1 - x0, d: y1 - y0 };
}
function buildSite(b) {
  const r = siteRect(b), cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, W = r.x1 - r.x0, D = r.z1 - r.z0;
  E.siteWalk = { frame: streetFrame(r), openings: [], obstacles: [] };
  E.facadeLights = [];
  E.bounds = { c: [cx, 1.5, cz], r: Math.max(W, D) / 2 + 3.5 };
  const g = E.addGroup('ground', { kind: 'ground', y: -plinthH() });
  const courtyard = courtyardFacade();
  const ext = extColor(), wallCol = mixHex(ext, '#8a7a66', 0.18), cap = courtyard ? '#e8d9c0' : '#d6cdbf', pave = { color: '#c2b8a8', color2: '#8f8678', pattern: 12, patScale: 1, cast: false };
  // lawn (the whole world) and a street in front of the gate
  E.part(g, { geo: E.geo('box', 260, 0.05, 260), x: cx, y: -0.1, z: cz, color: '#4d6236', color2: '#68714a', pattern: 11, cast: false });
  const front = r.side, horiz = front === 'N' || front === 'S';
  const roadAt = front === 'N' ? r.z0 - 4.2 : front === 'S' ? r.z1 + 4.2 : front === 'W' ? r.x0 - 4.2 : r.x1 + 4.2;
  const asph = E.quality !== 'low' ? { color: '#ffffff', tex: texSet('asphalt'), patScale: 3, rough: 0.92 } : { color: '#4a4c4f', pattern: 8, patScale: 2, rough: 0.8 };
  E.part(g, horiz ? Object.assign({ geo: E.geo('box', 260, 0.05, 6), x: cx, y: -0.085, z: roadAt, cast: false }, asph) : Object.assign({ geo: E.geo('box', 6, 0.05, 260), x: roadAt, y: -0.085, z: cz, cast: false }, asph));
  const kerb = front === 'N' || front === 'W' ? 3 : -3;
  if (E.quality === 'low') E.part(g, horiz ? { geo: E.geo('box', 260, 0.14, 0.18), x: cx, y: -0.1, z: roadAt + kerb, color: '#bfb9ae', cast: false } : { geo: E.geo('box', 0.18, 0.14, 260), x: roadAt + kerb, y: -0.1, z: cz, color: '#bfb9ae', cast: false });
  // paved apron hugging the house (not the yards)
  const hb = houseBounds() || b;
  E.part(g, Object.assign({ geo: E.geo('box', hb.w + 1.8, 0.06, hb.d + 1.8), x: hb.x + hb.w / 2, y: -0.075, z: hb.y + hb.d / 2 }, pave));
  // path from the main door to the gate
  const d = r.door; let gate = r.gate ?? null; b = hb;
  if (d) {
    const t = d.o === 'h' ? d.x : d.y, pw = Math.max(1.4, d.w + 0.5);
    if (front === 'S') { const z0 = b.y + b.d + 0.9, z1 = r.z1; E.part(g, Object.assign({ geo: E.geo('box', pw, 0.06, z1 - z0 + 0.2), x: t, y: -0.074, z: (z0 + z1) / 2 }, pave)); gate = gate ?? t; }
    if (front === 'N') { const z0 = r.z0, z1 = b.y - 0.9; E.part(g, Object.assign({ geo: E.geo('box', pw, 0.06, z1 - z0 + 0.2), x: t, y: -0.074, z: (z0 + z1) / 2 }, pave)); gate = gate ?? t; }
    if (front === 'E') { const x0 = b.x + b.w + 0.9, x1 = r.x1; E.part(g, Object.assign({ geo: E.geo('box', x1 - x0 + 0.2, 0.06, pw), x: (x0 + x1) / 2, y: -0.074, z: t }, pave)); gate = gate ?? t; }
    if (front === 'W') { const x0 = r.x0, x1 = b.x - 0.9; E.part(g, Object.assign({ geo: E.geo('box', x1 - x0 + 0.2, 0.06, pw), x: (x0 + x1) / 2, y: -0.074, z: t }, pave)); gate = gate ?? t; }
  }
  // driveway: from a garage door on the front straight out to the street, in the style's drive material
  const ground = P().floors.slice().sort((x, y) => x.level - y.level)[0], gds = ground ? garageDoors(ground).concat(ground.doors.filter(x => x.w >= 2.2 && !x.main)) : [];
  const gdF = gds.map(x => Object.assign({}, x, { face: x.face || (() => { const p = x.o === 'h' ? x.y : x.x; return x.o === 'h' ? (Math.abs(p - hb.y) < 0.2 ? 'N' : Math.abs(p - hb.y - hb.d) < 0.2 ? 'S' : null) : (Math.abs(p - hb.x) < 0.2 ? 'W' : Math.abs(p - hb.x - hb.w) < 0.2 ? 'E' : null); })() })).find(x => x.face === front);
  let walkGate = null;
  if (gdF && !r.yards) { const fm = FLOORS[facade().drive] || FLOORS.pavers, dm = { color: fm.color, color2: fm.c2, pattern: fm.pattern, patScale: 1, cast: false, rough: 0.8 };
    const t = gdF.o === 'h' ? gdF.x : gdF.y, dw = gdF.w + 0.9, face = gdF.o === 'h' ? gdF.y : gdF.x;
    const [a0, a1] = front === 'S' ? [face, r.z1] : front === 'N' ? [r.z0, face] : front === 'E' ? [face, r.x1] : [r.x0, face];
    E.part(g, Object.assign(horiz ? { geo: E.geo('box', dw, 0.07, a1 - a0 + 0.2), x: t, y: -0.072, z: (a0 + a1) / 2 } : { geo: E.geo('box', a1 - a0 + 0.2, 0.07, dw), x: (a0 + a1) / 2, y: -0.072, z: t }, dm));
    [-1, 1].forEach(sd => E.part(g, horiz ? { geo: E.geo('box', 0.1, 0.1, a1 - a0), x: t + sd * (dw / 2 + 0.05), y: -0.07, z: (a0 + a1) / 2, color: '#d9d6cf', cast: false } : { geo: E.geo('box', a1 - a0, 0.1, 0.1), x: (a0 + a1) / 2, y: -0.07, z: t + sd * (dw / 2 + 0.05), color: '#d9d6cf', cast: false })); // kerb edging
    if (gate != null && Math.abs(gate - t) > dw / 2 + 1.0) walkGate = gate; gate = t; }
  // boundary wall with a gateway on the front side
  if (gate == null) gate = horiz ? cx : cz;
  const wh = courtyard ? 0.95 : 1.15, wt = 0.2, gw = r.gateW ? clamp(r.gateW * 0.6, 3.2, 5.5) : gdF && !r.yards ? Math.max(3.2, gdF.w + 1.0) : 3.2;
  const wallRun = (o, c, a0, a1) => { if (a1 - a0 < 0.05) return; const len = a1 - a0, m = (a0 + a1) / 2;
    E.part(g, o === 'h' ? { geo: E.geo('box', len, wh, wt), x: m, y: -0.06, z: c, color: wallCol, pattern: 10 } : { geo: E.geo('box', wt, wh, len), x: c, y: -0.06, z: m, color: wallCol, pattern: 10 });
    if (courtyard) {
      const cladding = { color: '#ac9373', color2: '#7c6853', pattern: 13, rough: 0.91 };
      const thickness = wt + 0.07;
      E.part(g, Object.assign(o === 'h'
        ? { geo: E.geo('box', len, wh - 0.23, thickness), x: m, z: c }
        : { geo: E.geo('box', thickness, wh - 0.23, len), x: c, z: m }, { y: -0.058 }, cladding));
    }
    const cg = (w, d) => E.quality === 'low' ? E.geo('box', w, 0.06, d) : E.geo('rbox', w, 0.06, d, 0.012); // eased coping edges
    E.part(g, o === 'h' ? { geo: cg(len + 0.02, wt + 0.08), x: m, y: wh - 0.06, z: c, color: cap, pattern: 6, color2: '#b9b0a2', patScale: 0.8 } : { geo: cg(wt + 0.08, len + 0.02), x: c, y: wh - 0.06, z: m, color: cap, pattern: 6, color2: '#b9b0a2', patScale: 0.8 }); };
  const pillar = (px, pz) => {
    if (courtyard) {
      E.part(g, { geo: E.geo('box', 0.48, 1.3, 0.46), x: px, y: -0.055, z: pz, color: cap, pattern: 10 });
      E.part(g, { geo: E.geo('box', 0.51, 0.045, 0.49), x: px, y: 1.24, z: pz, color: '#e9ddc9', rough: 0.9 });
      return;
    }
    E.part(g, { geo: E.geo('box', 0.42, 1.55, 0.42), x: px, y: -0.06, z: pz, color: '#6e655b', color2: '#4f4840', pattern: 13, patScale: 1 });
    E.part(g, { geo: E.quality === 'low' ? E.geo('box', 0.5, 0.07, 0.5) : E.geo('rbox', 0.5, 0.07, 0.5, 0.015), x: px, y: 1.49, z: pz, color: cap, rough: 0.6 });
    E.part(g, { geo: E.quality === 'low' ? E.geo('box', 0.2, 0.26, 0.2) : E.geo('rbox', 0.2, 0.26, 0.2, 0.02), x: px, y: 1.56, z: pz, color: '#2c2c2e', rough: 0.45, emissive: isNight() ? '#ffcf8a' : '#000000', cast: false }); };
  const side = (o, c, a0, a1, isFront) => {
    if (!isFront || gate == null) { wallRun(o, c, a0, a1); return; }
    const gaps = [{ s: clamp(gate - gw / 2, a0 + 0.5, a1 - gw - 0.5), w: gw, slide: true }];
    if (walkGate != null) { const s0 = clamp(walkGate - 0.65, a0 + 0.5, a1 - 1.8), g0 = gaps[0];
      if (s0 + 1.3 < g0.s - 1.6 || s0 > g0.s + gw + 1.6) gaps.push({ s: s0, w: 1.3 }); // its own pedestrian gate
      else { const lo = Math.min(g0.s, s0), hi = Math.max(g0.s + gw, s0 + 1.3); g0.s = lo; g0.w = hi - lo; } } // close by: one wide opening
    gaps.sort((p, q) => p.s - q.s);
    const center = E.siteWalk.frame.center;
    E.siteWalk.openings = gaps.map(({ s, w }) => [s - center, s + w - center]);
    let at = a0;
    gaps.forEach(gp => { wallRun(o, c, at, gp.s); at = gp.s + gp.w; [gp.s, gp.s + gp.w].forEach(t => pillar(o === 'h' ? t : c, o === 'h' ? c : t)); });
    wallRun(o, c, at, a1);
    if (courtyard) {
      for (const gap of gaps) buildCourtyardGate(g, E.siteWalk.frame, gap.s - center, gap.w);
      return;
    }
    const sg = gaps.find(x => x.slide), free = (lo, hi) => lo >= a0 && hi <= a1 && !gaps.some(x => x !== sg && x.s < hi && x.s + x.w > lo), slideL = free(sg.s + sg.w, sg.s + sg.w + gw + 0.2) ? 1 : free(sg.s - gw - 0.2, sg.s) ? -1 : 0; if (!slideL) return; // sliding gate parked behind the wall
    const gc = slideL > 0 ? sg.s + sg.w + gw / 2 + 0.1 : sg.s - gw / 2 - 0.1, off = o === 'h' ? (front === 'S' ? -0.3 : 0.3) : (front === 'E' ? -0.3 : 0.3);
    const gx = o === 'h' ? gc : c + off, gz = o === 'h' ? c + off : gc, n = Math.round(gw / 0.2), steel = POWDER_COAT;
    const bar = E.quality === 'low' ? E.geo('box', 0.035, 1.3, 0.035) : E.geo('rbox', 0.035, 1.3, 0.035, 0.007); // eased edges catch a soft highlight
    for (let i = 0; i <= n; i++) { const t = -gw / 2 + i * gw / n; E.part(g, Object.assign(o === 'h' ? { geo: bar, x: gx + t, y: -0.05, z: gz } : { geo: bar, x: gx, y: -0.05, z: gz + t }, steel)); }
    [0.05, 1.2].forEach(y => E.part(g, Object.assign(o === 'h' ? { geo: E.geo('rbox', gw, 0.06, 0.05, 0.008), x: gx, y, z: gz } : { geo: E.geo('rbox', 0.05, 0.06, gw, 0.008), x: gx, y, z: gz }, steel)));
    const hs = (o === 'h' ? (front === 'S' ? 1 : -1) : (front === 'E' ? 1 : -1)) * 0.045, he = -slideL * (gw / 2 - 0.12); // pull handle on the leading edge, street side
    E.part(g, Object.assign(o === 'h' ? { x: gx + he, z: gz + hs } : { x: gx + hs, z: gz + he }, { geo: E.geo('rbox', 0.022, 0.32, 0.022, 0.008), y: 0.55, color: '#b9bcbf', metal: 0.9, rough: 0.28 }));
  };
  side('h', r.z0, r.x0, r.x1, front === 'N'); side('h', r.z1, r.x0, r.x1, front === 'S'); side('v', r.x0, r.z0, r.z1, front === 'W'); side('v', r.x1, r.z0, r.z1, front === 'E');
  if (r.yards) return r; // the drawn garden / parking are landscaped by buildYard
  const frame = E.siteWalk.frame;
  const canopyU = frame.width / 2 - 4.0;
  if (courtyard) {
    const [x, z] = frame.toWorld(canopyU, -1.65);
    buildCourtyardTree(x, -plinthH(), z);
    E.siteWalk.obstacles.push({ u: canopyU, v: -1.65, w: 0.33, d: 0.33 });
    const gardenRng = seeded('courtyard planting');
    for (let u = -frame.width / 2 + 0.6; u < frame.width / 2 - 0.5; u += 0.8 + gardenRng() * 0.55) {
      if (E.siteWalk.openings.some(([a, b]) => u > a - 0.7 && u < b + 0.7)) continue;
      const [px, pz] = frame.toWorld(u, -0.55 - gardenRng() * 0.43);
      bush(g, px, pz, 0.55 + gardenRng() * 0.64, u * 31, -0.055);
    }
    const [left, right] = E.siteWalk.openings.reduce((wide, next) => next[1] - next[0] > wide[1] - wide[0] ? next : wide, [0, 0]);
    for (const u of [left - 0.48, right + 0.48]) {
      const [px, pz] = frame.toWorld(u, -1.02);
      E.part(g, { geo: E.geo('cyl', 0.21, 0.32, 1.2, 14), x: px, y: -0.052, z: pz, color: '#a48362', rough: 0.88 });
      bush(g, px, pz, 0.64, u * 7, 0.25);
    }
  }
  // garden: hedges along the back and sides, trees in the corners, shrubs by the door
  const hedge = (o, c, a0, a1) => { const len = a1 - a0; if (len < 1) return; const n = Math.max(1, Math.round(len / 0.7));
    for (let i = 0; i < n; i++) { const t = a0 + (i + 0.5) * len / n; bush(g, o === 'h' ? t : c, o === 'h' ? c : t, 0.95 + (i % 3) * 0.08, i, -0.06); } };
  const back = { N: 'S', S: 'N', E: 'W', W: 'E' }[front];
  if (back === 'N') hedge('h', r.z0 + 0.55, r.x0 + 2.4, r.x1 - 2.4); if (back === 'S') hedge('h', r.z1 - 0.55, r.x0 + 2.4, r.x1 - 2.4);
  if (back === 'W') hedge('v', r.x0 + 0.55, r.z0 + 2.4, r.z1 - 2.4); if (back === 'E') hedge('v', r.x1 - 0.55, r.z0 + 2.4, r.z1 - 2.4);
  const inset = 1.35; let ti = 0;
  [[r.x0 + inset, r.z0 + inset], [r.x1 - inset, r.z0 + inset], [r.x0 + inset, r.z1 - inset], [r.x1 - inset, r.z1 - inset]].forEach(([x, z]) => {
    const nearPath = gate != null && (horiz ? Math.abs(x - gate) < 2.4 : Math.abs(z - gate) < 2.4); if (nearPath) return;
    const [u, v] = frame.fromWorld(x, z);
    if (courtyard && Math.abs(u - canopyU) < 2.6 && v > -3.6) return;
    if (blocksFacade(x, z, 2.2)) return;
    tree(g, x, z, (ti * 0.37) % 1, ti); ti++; });
  if (d) { const t = d.o === 'h' ? d.x : d.y; const pw = Math.max(1.4, d.w + 0.5);
    [-1, 1].forEach(sd => { for (let i = 0; i < 3; i++) { const u = t + sd * (pw / 2 + 0.45), v = i * 1.3 + 1.6; const pos = front === 'S' ? [u, b.y + b.d + v] : front === 'N' ? [u, b.y - v] : front === 'E' ? [b.x + b.w + v, u] : [b.x - v, u];
      if ((horiz && (pos[1] < r.z0 + 0.4 || pos[1] > r.z1 - 0.4)) || (!horiz && (pos[0] < r.x0 + 0.4 || pos[0] > r.x1 - 0.4))) continue;
      bush(g, pos[0], pos[1], 0.75 + 0.12 * i, i, -0.06); } }); }
  // foundation planting along the front wall, clear of the path and the driveway
  const fz = front === 'S' ? hb.y + hb.d + 0.95 : front === 'N' ? hb.y - 0.95 : null, fx = front === 'E' ? hb.x + hb.w + 0.95 : front === 'W' ? hb.x - 0.95 : null;
  const [u0, u1] = horiz ? [hb.x + 0.5, hb.x + hb.w - 0.5] : [hb.y + 0.5, hb.y + hb.d - 0.5], dT = d ? (d.o === 'h' ? d.x : d.y) : null, gT = gdF ? (gdF.o === 'h' ? gdF.x : gdF.y) : null;
  for (let u = u0; u <= u1; u += 1.25) { if (dT != null && Math.abs(u - dT) < 1.6) continue; if (gT != null && Math.abs(u - gT) < gdF.w / 2 + 1.0) continue;
    bush(g, horiz ? u : fx, horiz ? fz : u, 0.55, Math.round(u * 10), -0.06); }
  return r;
}
/* ---------- open-air spaces: balcony railings, car parking, gardens ---------- */
// powder-coated mild steel (gates, grilles): a dielectric satin paint, not bare metal
const POWDER_COAT = { color: '#25272a', metal: 0, rough: 0.42 };
function buildCourtyardGate(ground, frame, edge, width) {
  const leaf = width * 0.46;
  for (const end of [0, 1]) {
    const u = edge + end * width;
    const [x, z] = frame.toWorld(u, -0.10 - leaf / 2);
    const g = E.addGroup(`courtyard-gate:${edge}:${end}`, { kind: 'site', x, y: ground.y, z, rot: frame.horizontal ? Math.PI / 2 : 0 });
    const rail = (w, height, atX, y) => E.part(g, { geo: E.geo('box', w, height, 0.046), x: atX, y, ...POWDER_COAT });
    for (let slat = 0; slat < 10; slat++) rail(leaf, 0.066, 0, 0.16 + slat * 0.095);
    rail(leaf, 0.045, 0, 0.08);
    rail(leaf, 0.055, 0, 1.12);
    for (const xEdge of [-1, 1]) rail(0.05, 1.09, xEdge * leaf / 2, 0.075);
  }
}
function buildCourtyardTree(x, y, z) {
  const g = E.addGroup('courtyard-tree', { kind: 'site', x, y, z });
  const limbs = [
    [[0, -0.055, 0], [-0.14, 1.35, 0.07], 0.37, 0.22],
    [[-0.14, 1.35, 0.07], [0.03, 2.85, 0.04], 0.22, 0.17],
    [[0.03, 2.85, 0.04], [0.68, 4.55, 0.20], 0.17, 0.11],
    [[0.68, 4.55, 0.2], [1.02, 6.6, -0.12], 0.11, 0.04],
    [[-0.03, 2.23, 0.07], [-1.05, 3.55, -0.36], 0.135, 0.085],
    [[-1.05, 3.55, -0.36], [-2.32, 4.7, -0.62], 0.085, 0.035],
    [[-2.32, 4.7, -0.62], [-3.17, 5.62, -1.14], 0.035, 0.014],
    [[-1.05, 3.55, -0.36], [-1.54, 5.6, 0.94], 0.07, 0.027],
    [[0.68, 4.55, 0.2], [2.37, 5.68, 1.05], 0.086, 0.025],
    [[0.68, 4.48, 0.2], [1.18, 5.58, -1.97], 0.07, 0.02],
    [[0.1, 3.12, 0.04], [-0.64, 4.62, 2.11], 0.083, 0.024]
  ];
  const bark = E.custom('courtyard-trunk', () => {
    const pos = [], nor = [], count = 10;
    for (const [start, end, lower, upper] of limbs) {
      const axis = V3.norm(V3.sub(end, start));
      const right = V3.norm(V3.cross(axis, [0, 0, 1])), forward = V3.cross(right, axis);
      const ring = (center, radius, i) => {
        const angle = i * Math.PI * 2 / count;
        const normal = V3.add(V3.scale(right, Math.cos(angle)), V3.scale(forward, Math.sin(angle)));
        return [V3.add(center, V3.scale(normal, radius * (1 + Math.sin(i * 3.2) * 0.08))), normal];
      };
      for (let i = 0; i < count; i++) {
        const quad = [ring(start, lower, i), ring(end, upper, i), ring(end, upper, i + 1), ring(start, lower, i + 1)];
        for (const j of [0, 1, 2, 0, 2, 3]) { pos.push(...quad[j][0]); nor.push(...quad[j][1]); }
      }
    }
    return { pos, nor };
  });
  E.part(g, { geo: bark, color: '#5c4732', color2: '#31291f', pattern: 27, patScale: 1, rough: 0.96, noCull: true });
  groundBlob(g, 0, 0, 2.05, -0.045, 0.45);
  const clusters = [
    [[-2.72, 5.65, -0.88], [1.35, 0.67, 1.03]],
    [[-1.98, 6.17, 0.65], [1.43, 0.63, 1.31]],
    [[-0.69, 5.34, 1.82], [1.53, 0.66, 1.12]],
    [[0.47, 6.75, 0.34], [1.58, 0.82, 1.37]],
    [[1.45, 6.35, -1.73], [1.22, 0.73, 1.19]],
    [[2.37, 6.2, 1.21], [1.39, 0.71, 1.48]],
    [[0.95, 7.27, -0.43], [1.62, 0.72, 1.32]],
    [[-1.27, 6.95, -0.43], [1.45, 0.71, 1.12]]
  ];
  const count = E.quality === 'high' ? 47 : E.quality === 'balanced' ? 33 : 22;
  const leaves = E.quality === 'low' ? null : E.texture('assets/textures/neem-foliage.webp');
  E.part(g, {
    geo: leafCards('courtyard-tree:' + count, clusters.map(([c, r], i) => ({ c, r, n: count - i % 3 * 5 })), [0, 5.8, 0], 1.15),
    color: leaves?.t ? '#ebebd0' : '#36532b', color2: '#7c9350',
    pattern: 24, noCull: true, rough: 0.74, tex: leaves ? { B: leaves, cut: true } : null
  });
}
function buildRail(box, p, extCol) { // modern balcony railing: low upstand, frameless glass, steel posts and handrail
  const len = p.b - p.a, mid = (p.a + p.b) / 2, steel = courtyardFacade() ? POWDER_COAT : { color: '#c3c7cc', metal: 0.9, rough: 0.3 };
  box(p.o, len + 0.04, 0.12, 0.14, mid, 0, p.c, { color: mixHex(extCol, '#ffffff', 0.2), pattern: 10 });
  box(p.o, Math.max(0.05, len - 0.04), 0.86, 0.014, mid, 0.13, p.c, { color: '#6f8790', pattern: 15, alpha: 0.1, cast: false });
  box(p.o, len + 0.04, 0.05, 0.07, mid, 1.0, p.c, steel);
  const n = Math.max(1, Math.ceil(len / 1.3)); for (let i = 0; i <= n; i++) box(p.o, 0.045, 0.9, 0.05, p.a + 0.03 + (len - 0.06) * i / n, 0.12, p.c, steel);
}
// deterministic pseudo-random numbers per room, so the landscaping doesn't jump around on every rebuild
function seeded(seed) { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function buildYard(r, f, yOff) { if (r.type === 'parking') buildParking(r, f, yOff); else buildGarden(r, f, yOff); }
function buildCar(id, x, z, ang, col, y) { // a compact SUV (4.5 × 1.85 m): length along local z, nose at +z, tyres on the ground
  const g = E.addGroup('car:' + id, { kind: 'misc', x, y, z, rot: ang }), night = isNight();
  const paint = { color: col, metal: 0.65, rough: 0.16 }, trim = { color: '#17181a', rough: 0.6 }, chrome = { color: '#cfd3d8', metal: 1, rough: 0.15 }, glass = { color: '#18222a', metal: 0.5, rough: 0.03 };
  const P = (geo, o, m) => E.part(g, Object.assign({ geo }, o, m)), B = (w, h, d) => E.geo('box', w, h, d), RB = (w, h, d, r) => E.geo('rbox', w, h, d, r);
  const L = 4.5, W = 1.85, WR = 0.36, axle = 1.38;
  // wheels: rounded tyre, five-spoke alloy, hub; arches cut darker into the body
  [-1, 1].forEach(sx => [-axle, axle].forEach(zz => {
    // a cylinder turned on its side runs from x towards x − width: place each so its outer face is flush with the body side
    const at = wdt => (sx > 0 ? W / 2 + 0.01 : -W / 2 + wdt - 0.01);
    P(E.geo('cyl', WR, 0.24, 1, 28), { x: at(0.24), y: WR, z: zz, rz: Math.PI / 2 }, { color: '#151515', rough: 0.88 });
    P(E.geo('cyl', 0.24, 0.02, 1, 24), { x: sx > 0 ? W / 2 + 0.02 : -W / 2, y: WR, z: zz, rz: Math.PI / 2 }, { color: '#b9bec4', metal: 0.95, rough: 0.22 });
    for (let k = 0; k < 5; k++) P(B(0.022, 0.21, 0.055), { x: sx * (W / 2 + 0.022), y: WR, z: zz, rx: k * 1.2566 }, { color: '#9aa1a8', metal: 0.9, rough: 0.28, cast: false });
    P(E.geo('cyl', 0.05, 0.03, 1, 12), { x: sx > 0 ? W / 2 + 0.04 : -W / 2 - 0.01, y: WR, z: zz, rz: Math.PI / 2 }, chrome);
  }));
  // body: a rounded lower body, a sloping bonnet, a glass cabin with a body-coloured roof
  P(RB(W, 0.6, L, 0.16), { y: 0.3 }, paint);
  P(RB(W + 0.02, 0.16, L - 0.5, 0.06), { y: 0.26 }, trim);                    // sill cladding
  P(RB(W - 0.06, 0.16, 1.25, 0.08), { y: 0.78, z: L / 2 - 0.72, rx: 0.07 }, paint); // bonnet
  P(RB(W - 0.2, 0.56, 2.55, 0.1), { y: 0.84, z: -0.42 }, glass);              // cabin glass
  P(RB(W - 0.16, 0.08, 2.35, 0.05), { y: 1.38, z: -0.48 }, paint);            // roof
  [-1, 1].forEach(sx => { P(B(0.06, 0.56, 0.12), { x: sx * (W / 2 - 0.12), y: 0.84, z: -0.2 }, paint);    // B-pillar
    P(B(0.07, 0.5, 0.42), { x: sx * (W / 2 - 0.12), y: 0.86, z: -1.5 }, paint);                        // C-pillar
    P(RB(0.16, 0.1, 0.12, 0.03), { x: sx * (W / 2 + 0.04), y: 0.98, z: 0.78 }, paint);                 // mirrors
    P(B(0.03, 0.04, 2.0), { x: sx * 0.66, y: 1.46, z: -0.5 }, chrome);                                  // roof rails
    P(B(0.012, 0.03, 0.15), { x: sx * (W / 2 + 0.005), y: 0.74, z: 0.1 }, chrome);                      // door handles
    P(RB(0.36, 0.1, 0.05, 0.02), { x: sx * 0.62, y: 0.74, z: L / 2 - 0.02 }, { color: '#e9eef2', metal: 0.3, rough: 0.05, emissive: night ? '#fff6dc' : '#202326', cast: false });
    P(RB(0.38, 0.12, 0.05, 0.02), { x: sx * 0.62, y: 0.76, z: -L / 2 + 0.02 }, { color: '#7d0f12', rough: 0.2, emissive: night ? '#8c0b0b' : '#2a0303', cast: false }); });
  P(RB(1.0, 0.24, 0.05, 0.03), { y: 0.5, z: L / 2 }, { color: '#111214', rough: 0.4 });            // grille
  P(RB(W - 0.06, 0.18, 0.12, 0.05), { y: 0.2, z: L / 2 - 0.03 }, trim); P(RB(W - 0.06, 0.18, 0.12, 0.05), { y: 0.2, z: -L / 2 + 0.03 }, trim); // bumpers
  P(B(0.52, 0.11, 0.012), { y: 0.36, z: L / 2 + 0.03 }, { color: '#f4f4f0', rough: 0.4, cast: false });
  P(B(0.52, 0.11, 0.012), { y: 0.46, z: -L / 2 - 0.01 }, { color: '#f4f4f0', rough: 0.4, cast: false });
}
function buildBike(id, x, z, ang, col, y) { // a sport motorbike, length along local z, leaning on its stand
  const g = E.addGroup('bike:' + id, { kind: 'misc', x, y, z, rot: ang }), night = isNight();
  const P = (geo, o, m) => E.part(g, Object.assign({ geo }, o, m)), B = (w, h, d) => E.geo('box', w, h, d);
  [-0.72, 0.68].forEach(zz => { P(E.geo('cyl', 0.31, 0.13, 1, 20), { x: 0.065, y: 0.31, z: zz, rz: Math.PI / 2 }, { color: '#121212', rough: 0.9 }); P(E.geo('cyl', 0.2, 0.135, 1, 16), { x: 0.0675, y: 0.31, z: zz, rz: Math.PI / 2 }, { color: '#2b2d30', metal: 0.8, rough: 0.3 }); });
  P(B(0.04, 0.32, 0.04), { x: -0.16, y: 0, z: -0.1, rz: -0.35 }, { color: '#222' }); // side stand
  P(B(0.28, 0.3, 1.0), { y: 0.52, z: 0.05 }, { color: col, metal: 0.5, rough: 0.25 });          // fairing / body
  P(B(0.3, 0.2, 0.5), { y: 0.82, z: 0.18 }, { color: col, metal: 0.5, rough: 0.25 });           // tank
  P(B(0.24, 0.08, 0.5), { y: 0.86, z: -0.38 }, { color: '#151515', rough: 0.7 });                // seat
  P(B(0.2, 0.12, 0.45), { y: 0.86, z: -0.75, rx: -0.3 }, { color: col, metal: 0.5, rough: 0.25 }); // tail
  P(B(0.26, 0.3, 0.12), { y: 0.86, z: 0.68, rx: 0.5 }, { color: col, metal: 0.5, rough: 0.25 });  // nose
  P(B(0.2, 0.12, 0.02), { y: 1.06, z: 0.74, rx: 0.5 }, { color: '#1d262c', rough: 0.05 });         // screen
  P(B(0.6, 0.03, 0.03), { y: 1.0, z: 0.5 }, { color: '#222', metal: 0.6 });                        // handlebar
  [-0.08, 0.08].forEach(xx => P(B(0.03, 0.6, 0.03), { x: xx, y: 0.32, z: 0.62, rx: 0.42 }, { color: '#c9a227', metal: 0.9, rough: 0.2 })); // forks
  P(E.geo('cyl', 0.05, 0.5, 1, 10), { x: 0.14, y: 0.36, z: -0.55, rx: Math.PI / 2 - 0.25 }, { color: '#c4c8cc', metal: 1, rough: 0.2 }); // exhaust
  P(B(0.12, 0.06, 0.03), { y: 0.86, z: 0.75 }, { color: '#eef3f6', emissive: night ? '#fff1c8' : '#202326', cast: false });
}
const DEFENDER_MODEL = 'assets/models/defender-110.glb';
function buildGarage(r, f, yOff) { // car + motorbike inside, nose to the door, LED strip lights
  const gd = garageDoors(f).find(d => d.room === r.id) || f.doors.find(d => d.w >= 2.2 && Math.abs((d.o === 'h' ? d.y : d.x) - (d.o === 'h' ? (Math.abs(d.y - r.y) < 0.2 ? r.y : r.y + r.d) : (Math.abs(d.x - r.x) < 0.2 ? r.x : r.x + r.w))) < 0.2);
  const y = yOff + FLOOR_TOP, cx = r.x + r.w / 2, cz = r.y + r.d / 2;
  let ang = r.d >= r.w ? 0 : Math.PI / 2, carX = cx, carZ = cz, bikeX, bikeZ;
  if (gd) { const face = gd.o === 'h' ? (Math.abs(gd.y - r.y) < 0.2 ? 'N' : 'S') : (Math.abs(gd.x - r.x) < 0.2 ? 'W' : 'E'); ang = { S: 0, N: Math.PI, E: Math.PI / 2, W: -Math.PI / 2 }[face];
    if (gd.o === 'h') carX = gd.x; else carZ = gd.y; }
  const alongZ = ang === 0 || ang === Math.PI, across = alongZ ? r.w : r.d;
  const defender = P().example === 'duplex' ? E.loadGLB(DEFENDER_MODEL).model : null;
  if (across >= 3.6) {
    const offset = defender ? 0 : Math.min(1.2, across / 2 - 1.1) * 0.6;
    if (alongZ) {
      carX = clamp(carX + offset, r.x + 1.15, r.x + r.w - 1.15);
      bikeX = clamp(carX - 1.75, r.x + 0.5, r.x + r.w - 0.5); bikeZ = cz;
    } else {
      carZ = clamp(carZ + offset, r.y + 1.15, r.y + r.d - 1.15);
      bikeZ = clamp(carZ - 1.75, r.y + 0.5, r.y + r.d - 0.5); bikeX = cx;
    }
  }
  if (defender && r.w > 0.45 && r.d > 0.45) {
    const car = E.addGroup('defender:' + r.id, { kind: 'misc', x: carX, y, z: carZ, rot: ang });
    const depth = alongZ ? r.d : r.w;
    E.modelParts(car, defender, Math.min(2.15, across - 0.3), 1.96, Math.min(5, depth - 0.45), { uniform: true });
  } else buildCar(r.id, carX, carZ, ang, '#f2f2f0', y);
  if (bikeX != null) buildBike(r.id, bikeX, bikeZ, ang, '#2f7d3a', y);
  const g = E.addGroup('garage:' + r.id, { kind: 'misc', y: yOff });
  E.part(g, { geo: E.geo('box', Math.min(r.w, r.d) * 0.6, 0.03, 0.08), x: cx, y: f.height - 0.05, z: cz, ry: r.d >= r.w ? Math.PI / 2 : 0, color: '#ffffff', emissive: '#d8d4c8', cast: false, showBelow: yOff + f.height - 0.1 });
}
function buildGarageDoor(gd, f, yOff, box) { // timber portal, roll-up door parked at the top, LED strip
  const out = (() => { const pa = gd.o === 'h' ? roomAt(gd.x, gd.y - 0.3, f) : roomAt(gd.x - 0.3, gd.y, f); return pa && pa.id === gd.room ? 1 : -1; })();
  const t = gd.o === 'h' ? gd.x : gd.y, a = t - gd.w / 2, b = t + gd.w / 2, h = gd.h || 2.4, face = (gd.o === 'h' ? gd.y : gd.x) + out * (WALL_T / 2 + 0.06);
  box(gd.o, 0.22, h + 0.22, 0.12, a - 0.11, 0, face, TIMBER); box(gd.o, 0.22, h + 0.22, 0.12, b + 0.11, 0, face, TIMBER);
  box(gd.o, gd.w + 0.44, 0.22, 0.12, t, h, face, TIMBER);
  const inner = (gd.o === 'h' ? gd.y : gd.x) - out * 0.02;
  box(gd.o, gd.w, 0.34, 0.06, t, h - 0.34, inner, { color: '#e9e9e6', color2: '#cfcfcb', pattern: 7, patScale: 0.08, rough: 0.4, metal: 0.3 }); // rolled-up door
  box(gd.o, gd.w - 0.1, 0.02, 0.05, t, h - 0.37, inner - out * 0.08, { color: '#ffffff', emissive: '#efe6cf', cast: false }); // LED strip
}
function buildParking(r, f, yOff) {
  const rnd = seeded(r.id), y = yOff + FLOOR_TOP, g = E.addGroup('yard:' + r.id, { kind: 'misc', x: 0, y, z: 0 });
  const long = Math.max(r.w, r.d), short = Math.min(r.w, r.d), alongX = r.w >= r.d;
  // bays: cars side by side (bay 2.7 × 5 m) if the yard is deep enough, else end to end
  const perp = short >= 4.9, n = Math.max(0, Math.min(r.cars != null ? r.cars : 3, Math.floor(long / (perp ? 2.7 : 5.3))));
  const cols = ['#c0c3c8', '#20304f', '#efefec', '#6d1a1d', '#2a2b2e'];
  const bayLen = perp ? 2.7 : 5.3, start = (long - n * bayLen) / 2;
  const line = (ax, az, lx, lz) => E.part(g, { geo: E.geo('box', lx, 0.006, lz), x: ax, y: 0.002, z: az, color: '#f2f2ee', rough: 0.7, cast: false });
  for (let i = 0; i <= n && n > 0; i++) { // white bay lines
    const t = start + i * bayLen;
    if (perp) alongX ? line(r.x + t, r.y + r.d / 2, 0.08, Math.min(5.0, short - 0.3)) : line(r.x + r.w / 2, r.y + t, Math.min(5.0, short - 0.3), 0.08);
  }
  const cars = [];
  for (let i = 0; i < n; i++) {
    const t = start + (i + 0.5) * bayLen; const cx = alongX ? r.x + t : r.x + r.w / 2, cz = alongX ? r.y + r.d / 2 : r.y + t;
    const ang = perp ? (alongX ? 0 : Math.PI / 2) : (alongX ? Math.PI / 2 : 0);
    if (i < 2 || rnd() < 0.5) { buildCar(r.id + i, cx, cz, ang + (rnd() < 0.5 ? Math.PI : 0), cols[Math.floor(rnd() * cols.length)], y); cars.push([cx, cz]); }
  }
  // car porch: a slim canopy on steel columns, unless a floor above already covers the parking
  const above = floorAbove(f), covered = above && above.rooms.some(q => !isOpenAir(q) && rectOverlap(q, r) > area(r) * 0.3);
  if (!floorBelow(f) && !covered && n > 0) {
    const pad = 0.25, x0 = alongX ? r.x + start - pad : r.x + 0.15, x1 = alongX ? r.x + start + n * bayLen + pad : r.x + r.w - 0.15;
    const z0 = alongX ? r.y + 0.15 : r.y + start - pad, z1 = alongX ? r.y + r.d - 0.15 : r.y + start + n * bayLen + pad, hgt = Math.min(2.75, f.height - 0.1);
    E.part(g, { geo: E.geo('box', x1 - x0, 0.14, z1 - z0), x: (x0 + x1) / 2, y: hgt, z: (z0 + z1) / 2, color: mixHex(extColor(), '#ffffff', 0.25), pattern: 10 });
    E.part(g, { geo: E.geo('box', x1 - x0 + 0.04, 0.06, z1 - z0 + 0.04), x: (x0 + x1) / 2, y: hgt + 0.14, z: (z0 + z1) / 2, color: '#a39d93', color2: '#88827a', pattern: 8, patScale: 1.5, rough: 0.7 });
    const indoorNear = (px, pz) => f.rooms.some(q => !isOpenAir(q) && px > q.x - 0.35 && px < q.x + q.w + 0.35 && pz > q.y - 0.35 && pz < q.y + q.d + 0.35);
    [[x0 + 0.12, z0 + 0.12], [x1 - 0.12, z0 + 0.12], [x0 + 0.12, z1 - 0.12], [x1 - 0.12, z1 - 0.12]].forEach(([px, pz]) => { if (!indoorNear(px, pz)) E.part(g, { geo: E.geo('box', 0.14, hgt, 0.14), x: px, y: 0, z: pz, color: '#2d2f32', metal: 0.6, rough: 0.35 }); });
    if (isNight()) cars.forEach(([cx, cz]) => E.part(g, { geo: E.geo('cyl', 0.09, 0.02, 1, 12), x: cx, y: hgt - 0.02, z: cz, color: '#ffffff', emissive: '#ffe2b0', cast: false }));
  }
}
function buildGarden(r, f, yOff) {
  const rnd = seeded(r.id), g = E.addGroup('yard:' + r.id, { kind: 'misc', x: 0, y: yOff + FLOOR_TOP, z: 0 });
  const long = Math.max(r.w, r.d), short = Math.min(r.w, r.d), alongX = r.w >= r.d, A = area(r);
  const at = (u, v) => alongX ? [r.x + u, r.y + v] : [r.x + v, r.y + u]; // u along the long side, v across
  // stepping-stone path down the middle
  if (short >= 1.6) for (let u = 0.5; u < long - 0.3; u += 0.62) { const [px, pz] = at(u, short / 2 + (rnd() - 0.5) * 0.12); E.part(g, { geo: E.geo('cyl', 0.27, 0.035, 1, 14), x: px, y: 0, z: pz, color: '#b3a894', color2: '#8c8270', pattern: 6, patScale: 0.4, rough: 0.9, cast: false }); }
  // trees in a staggered row, clear of the path and the walls
  const plant = (px, pz, k, i) => blocksFacade(px, pz, 2.0) ? bush(g, px, pz, 1.1, i) : tree(g, px, pz, k, i, 4.2 + 2.2 * k);
  if (r.trees && r.trees.length) r.trees.forEach(([tx, tz], i) => plant(tx, tz, 0.35 + rnd() * 0.4, i)); // trees exactly where the plan draws them
  else if (short >= 2.2) {
    const nT = clamp(Math.round(A / 16), 1, 6);
    for (let i = 0; i < nT; i++) { const u = long * (i + 0.5) / nT, v = short >= 3.4 ? (i % 2 ? short * 0.78 : short * 0.22) : short / 2; if (short < 3.4 && short >= 1.6) continue;
      const [px, pz] = at(u + (rnd() - 0.5) * 0.4, v); plant(px, pz, 0.1 + rnd() * 0.5, i); }
    if (short < 3.4) for (let i = 0; i < Math.max(1, Math.floor(long / 3.5)); i++) { const [px, pz] = at(long * (i + 0.5) / Math.max(1, Math.floor(long / 3.5)), short * 0.22);
      bush(g, px, pz, 0.9, i); }
  }
  // flower beds along the edges: green clumps with blooms
  const blooms = ['#d6455d', '#f2c14e', '#e98bb5', '#f6f3ea', '#9b59d0', '#f08a3c'];
  const keepOff = entranceSteps(f).concat(f.rooms.filter(q => !isYard(q))); // no shrubs on the steps or against the plinth
  [[0.32, 'u'], [short - 0.32, 'u']].forEach(([v]) => { for (let u = 0.45; u < long - 0.3; u += 0.85 + rnd() * 0.3) {
    const [px, pz] = at(u, v); const c = blooms[Math.floor(rnd() * blooms.length)]; if (keepOff.some(q => inRoom(q, px, pz, 0.4))) continue;
    for (let k = 0; k < 3; k++) E.part(g, { geo: E.geo('sph', 0.15 + rnd() * 0.06, 8), x: px + (rnd() - 0.5) * 0.28, y: 0.08 + rnd() * 0.08, z: pz + (rnd() - 0.5) * 0.28, sy: 0.8, color: mixHex('#3a5a2a', '#5f7f3c', rnd()), color2: '#6f9a45', pattern: 16, cast: false });
    for (let k = 0; k < 4; k++) E.part(g, { geo: E.geo('sph', 0.035, 6), x: px + (rnd() - 0.5) * 0.36, y: 0.2 + rnd() * 0.08, z: pz + (rnd() - 0.5) * 0.36, color: c, rough: 0.7, cast: false });
  } });
  // a bench and two garden lights
  if (A >= 9 && short >= 2.4) {
    const [bx, bz] = at(long * 0.5, short - 0.75), ry = alongX ? 0 : Math.PI / 2, bg = E.addGroup('bench:' + r.id, { kind: 'misc', x: bx, y: yOff + FLOOR_TOP, z: bz, rot: ry });
    const wood = { color: '#8a5f3c', pattern: 1, patScale: 3, color2: '#5d3d24', rough: 0.55 }, iron = { color: '#26282b', metal: 0.6, rough: 0.4 };
    E.part(bg, Object.assign({ geo: E.geo('box', 1.5, 0.05, 0.42), y: 0.43 }, wood)); E.part(bg, Object.assign({ geo: E.geo('box', 1.5, 0.32, 0.04), y: 0.52, z: 0.21 }, wood));
    [-0.65, 0.65].forEach(xx => E.part(bg, Object.assign({ geo: E.geo('box', 0.05, 0.86, 0.46), x: xx, y: 0 }, iron)));
  }
  [[0.4, 0.4], [long - 0.4, short - 0.4]].forEach(([u, v]) => { if (short < 1.6) return; const [px, pz] = at(u, v);
    E.part(g, { geo: E.geo('cyl', 0.06, 0.6, 1, 10), x: px, y: 0, z: pz, color: '#2a2c2f', metal: 0.5, rough: 0.4 });
    E.part(g, { geo: E.geo('cyl', 0.08, 0.1, 1, 10), x: px, y: 0.6, z: pz, color: '#f2efe6', emissive: isNight() ? '#ffd79a' : '#2e2b25', cast: false }); });
}
/* ceiling fan — every Indian home has one in the living room and bedrooms */
const FAN_ROOMS = ['living', 'bedroom', 'master', 'guest', 'dining', 'study', 'office', 'reading', 'nursery', 'gaming', 'gym'];
function buildFan(g, H, yOff, room, lit) {
  const th = roomTheme(room), tn = THEMES[room.theme] ? room.theme : S.project.theme, warm = ['Japandi', 'Indian Contemporary', 'Modern Traditional Indian', 'Bohemian', 'Luxury'].includes(tn), body = tn === 'Industrial' ? '#2e2e30' : '#ecebe7';
  const blade = warm ? th.wood : tn === 'Industrial' ? '#3a3a3c' : '#e4e2dd', vis = { showBelow: yOff + H - 0.06, cast: false };
  E.part(g, Object.assign({ geo: E.geo('cyl', 0.075, 0.05, 1, 14), y: H - 0.05, color: body, rough: 0.4 }, vis));        // ceiling canopy
  E.part(g, Object.assign({ geo: E.geo('cyl', 0.013, 0.3, 1, 8), y: H - 0.35, color: body, metal: 0.4, rough: 0.35 }, vis)); // down-rod
  E.part(g, Object.assign({ geo: E.geo('cyl', 0.13, 0.085, 1, 20), y: H - 0.43, color: body, metal: 0.25, rough: 0.35 }, vis)); // motor housing
  E.part(g, Object.assign({ geo: E.geo('cyl', 0.085, 0.03, 1, 16), y: H - 0.46, color: '#f7f3ea', emissive: lit ? '#ffe7bf' : '#000000' }, vis)); // light kit
  for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3 + 0.4, R = 0.46;
    E.part(g, Object.assign({ geo: E.geo('box', 0.62, 0.012, 0.115), x: Math.cos(a) * R, z: -Math.sin(a) * R, y: H - 0.395, ry: a, rx: 0.08, color: blade, color2: mixHex(blade, '#000000', 0.2), pattern: warm ? 1 : 0, patScale: 2, rough: 0.45 }, vis));
    E.part(g, Object.assign({ geo: E.geo('box', 0.18, 0.02, 0.05), x: Math.cos(a) * 0.17, z: -Math.sin(a) * 0.17, y: H - 0.4, ry: a, color: body, metal: 0.4, rough: 0.35 }, vis)); }
}
/* ---------- plinth: a real Indian house stands ~45 cm above its garden, with steps up at the entrance ---------- */
const plinthH = () => (S.project && S.project.plinth) || 0;
const raisedAt = (f, x, z) => f.rooms.some(r => !isYard(r) && inRoom(r, x, z)); // on the house / porch / balcony level
/* steps from the garden up to the house: down the open side of each porch, or outside the main door if there is no porch */
function entranceSteps(f) {
  const ph = plinthH(); if (!ph || floorBelow(f)) return [];
  const out = [], T = 0.3, built = f.rooms.filter(q => !isOpenAir(q));
  const touches = (r, side) => built.some(q => { const e = sharedEdge(r, q); if (!e) return false; const c = { N: r.y, S: r.y + r.d, W: r.x, E: r.x + r.w }[side]; return e.o === (side === 'N' || side === 'S' ? 'h' : 'v') && Math.abs(e.c - c) < 0.05 && e.hi - e.lo > 0.3; });
  const opp = { N: 'S', S: 'N', E: 'W', W: 'E' }, road = P().site && P().site.road;
  const rectOn = (r, side, n, w0 = null, t0 = null) => { const dep = (n - 1) * T, w = w0 || ((side === 'N' || side === 'S' ? r.w : r.d) - 0.1), t = t0 != null ? t0 : side === 'N' || side === 'S' ? r.x + r.w / 2 : r.y + r.d / 2;
    if (side === 'S') return { x: t - w / 2, y: r.y + r.d, w, d: dep, side, n }; if (side === 'N') return { x: t - w / 2, y: r.y - dep, w, d: dep, side, n };
    if (side === 'E') return { x: r.x + r.w, y: t - w / 2, w: dep, d: w, side, n }; return { x: r.x - dep, y: t - w / 2, w: dep, d: w, side, n }; };
  f.rooms.filter(r => r.type === 'porch').forEach(r => { const n = clamp(r.steps || 3, 2, 8);
    const free = ['N', 'S', 'E', 'W'].filter(sd => !touches(r, sd) && touches(r, opp[sd])); const sd = free.find(x => x === road) || free[0]; if (sd) out.push(rectOn(r, sd, n)); });
  const md = f.doors.find(d => d.main);
  if (md && !f.rooms.some(r => r.type === 'porch' && inRoom(r, md.x, md.y, 0.3))) { const b = houseBounds() || homeBounds();
    const side = md.o === 'h' ? (Math.abs(md.y - b.y) < Math.abs(md.y - b.y - b.d) ? 'N' : 'S') : (Math.abs(md.x - b.x) < Math.abs(md.x - b.x - b.w) ? 'W' : 'E');
    const host = { x: md.o === 'v' ? md.x : md.x - md.w / 2, y: md.o === 'h' ? md.y : md.y - md.w / 2, w: md.o === 'h' ? md.w : 0, d: md.o === 'v' ? md.w : 0 };
    out.push(rectOn(host, side, 3, md.w + 0.6, md.o === 'h' ? md.x : md.y)); }
  return out;
}
/* height of the ground under a point on the ground floor, relative to the house floor (0 indoors, -plinth in the garden) */
function groundAt(f, x, z) {
  const ph = plinthH(); if (!ph || floorBelow(f) || raisedAt(f, x, z)) return 0;
  for (const st of entranceSteps(f)) if (inRoom(st, x, z)) { const u = st.side === 'S' ? z - st.y : st.side === 'N' ? st.y + st.d - z : st.side === 'E' ? x - st.x : st.x + st.w - x; return -ph * clamp(u / ((st.side === 'N' || st.side === 'S' ? st.d : st.w) + 0.3), 0, 1); }
  return -ph;
}
function buildPlinth(f) {
  const ph = plinthH(); if (!ph || floorBelow(f)) return; const g = E.addGroup('plinth:' + f.id, { kind: 'misc', x: 0, y: -ph, z: 0 });
  const mat = facade().plinth ? { color: '#7d7166', color2: '#5b524a', pattern: 13, patScale: 1 } : { color: mixHex(extColor(), '#6b6259', 0.45), pattern: 10, patScale: 1 };
  f.rooms.filter(r => !isYard(r)).forEach(r => { const m = r.type === 'porch' ? 0 : WALL_T / 2;
    E.part(g, Object.assign({ geo: E.geo('box', r.w + 2 * m, ph, r.d + 2 * m), x: r.x + r.w / 2, y: 0, z: r.y + r.d / 2 }, mat)); });
  entranceSteps(f).forEach(st => { const T = 0.3, horiz = st.side === 'N' || st.side === 'S';
    for (let k = 0; k < st.n - 1; k++) { const top = ph * (st.n - 1 - k) / st.n; // tread k: k = 0 is the one next to the house
      const u0 = k * T, cx = horiz ? st.x + st.w / 2 : st.side === 'E' ? st.x + u0 + T / 2 : st.x + st.w - u0 - T / 2, cz = !horiz ? st.y + st.d / 2 : st.side === 'S' ? st.y + u0 + T / 2 : st.y + st.d - u0 - T / 2;
      E.part(g, { geo: E.geo('box', horiz ? st.w : T, top, horiz ? T : st.d), x: cx, y: 0, z: cz, color: '#9a958c', color2: '#6f6b64', pattern: 6, patScale: 0.6, rough: 0.7 });
      E.part(g, { geo: E.geo('box', horiz ? st.w + 0.02 : 0.04, 0.03, horiz ? 0.04 : st.d + 0.02), x: horiz ? cx : st.side === 'E' ? st.x + u0 + T - 0.02 : st.x + st.w - u0 - T + 0.02, y: top - 0.03, z: !horiz ? cz : st.side === 'S' ? st.y + u0 + T - 0.02 : st.y + st.d - u0 - T + 0.02, color: '#55524d', rough: 0.6, cast: false }); // nosing
    } });
}
function buildFloor(f, active) {
  const yOff = floorY(f), H = f.height;
  const cut = S.cutaway ? 1.15 : null;
  const holesBelow = stairsBelow(f).map(stairFoot), holesUp = floorAbove(f) ? (f.stairs || []).map(stairFoot) : [];
  // floors
  f.rooms.forEach(r => {
    const fm = FLOORS[roomFloorKey(r)];
    const low = isYard(r) && !floorBelow(f) ? plinthH() : 0; // gardens and parking are down at garden level
    const g = E.addGroup('room:' + r.id, { kind: 'room', ref: r.id, x: r.x + r.w / 2, y: yOff - low, z: r.y + r.d / 2 });
    const cx = r.x + r.w / 2, cz = r.y + r.d / 2;
    const fk = roomFloorKey(r), fin = E.quality === 'low' || (isYard(r) && fk !== 'deck') ? null : FLOOR_FINISH[fk];
    // texture tiles hold 2 x 2 tiles (stone, ceramic) or 8 planks (wood); rough multiplies the finish's own roughness map
    const fmat = fin ? { color: fin.set === 'planks' ? texTint(fm.color, '#c39a6b') : fin.set === 'ceramic' || fin.set === 'vitrified' ? texTint(fm.color, '#e6e5e1') : mixHex(fm.color, '#ffffff', 0.25),
      tex: texSet(fin.set), patScale: fin.set === 'planks' ? 1.52 * (fm.scale / 0.19) : fm.scale * 2, rough: fin.rough }
      : { color: fm.color, color2: fm.c2, pattern: fm.pattern, patScale: fm.scale };
    rectMinus({ x: r.x, y: r.y, w: r.w, d: r.d }, holesBelow).forEach(q => E.part(g, Object.assign({ geo: E.geo('box', q.w, FLOOR_TOP, q.d), x: q.x + q.w / 2 - cx, z: q.y + q.d / 2 - cz, cast: false }, fmat)));
    if (holesBelow.length || floorBelow(f)) { // structural slab between storeys
      const e = (o, c, t) => isExteriorPoint(f, o, c, t) ? WALL_T / 2 : 0; const n = e('h', r.y, cx), so = e('h', r.y + r.d, cx), w = e('v', r.x, cz), ea = e('v', r.x + r.w, cz);
      rectMinus({ x: r.x - w, y: r.y - n, w: r.w + w + ea, d: r.d + n + so }, holesBelow).forEach(q => E.part(g, { geo: E.geo('box', q.w, 0.22, q.d), x: q.x + q.w / 2 - cx, y: -0.225, z: q.y + q.d / 2 - cz, color: '#d3ccc0' }));
    }
    if (isYard(r)) { buildYard(r, f, yOff - low); return; }
    if (r.type === 'garage') buildGarage(r, f, yOff);
    // roof/ceiling slab (casts sunlight shadows; visible only from inside) — open above a staircase
    rectMinus({ x: r.x - 0.06, y: r.y - 0.06, w: r.w + 0.12, d: r.d + 0.12 }, holesUp).forEach(q => E.part(g, { geo: E.geo('box', q.w, 0.12, q.d), x: q.x + q.w / 2 - cx, z: q.y + q.d / 2 - cz, y: H, color: '#f4f2ee', cast: roofCasts(), showBelow: yOff + H - 0.05, noCull: true }));
    // false ceiling
    const ck = roomCeiling(r); const lightsOn = isNight() && r.lights?.ambient;
    if (ck !== 'flat') {
      const bw = ck === 'tray' ? 0.6 : ck === 'cove' ? 0.45 : 0.32, th = 0.1, y = H - (ck === 'tray' ? 0.3 : 0.22);
      const vis = { showBelow: yOff + y - 0.02, cast: false, color: '#f7f5f1' };
      E.part(g, Object.assign({ geo: E.geo('box', r.w, th, bw), y, z: -r.d / 2 + bw / 2 }, vis)); E.part(g, Object.assign({ geo: E.geo('box', r.w, th, bw), y, z: r.d / 2 - bw / 2 }, vis));
      E.part(g, Object.assign({ geo: E.geo('box', bw, th, r.d - 2 * bw), y, x: -r.w / 2 + bw / 2 }, vis)); E.part(g, Object.assign({ geo: E.geo('box', bw, th, r.d - 2 * bw), y, x: r.w / 2 - bw / 2 }, vis));
      if (ck !== 'peripheral') { const em = lightsOn || r.lights?.accent && isNight() ? '#ffcf8a' : '#000000'; const es = { showBelow: yOff + y - 0.02, cast: false, color: '#fff4dc', emissive: em };
        E.part(g, Object.assign({ geo: E.geo('box', r.w - 2 * bw, 0.025, 0.03), y: y + th, z: -r.d / 2 + bw }, es)); E.part(g, Object.assign({ geo: E.geo('box', r.w - 2 * bw, 0.025, 0.03), y: y + th, z: r.d / 2 - bw }, es)); }
      if (ck === 'tray') for (let i = -1; i <= 1; i += 2) for (let j = -1; j <= 1; j += 2) E.part(g, { geo: E.geo('cyl', 0.06, 0.02, 1, 10), x: i * (r.w / 2 - bw / 2), y: y - 0.015, z: j * (r.d / 2 - bw / 2), color: '#ffffff', emissive: lightsOn ? '#ffe2b0' : '#222222', showBelow: yOff + y, cast: false });
    }
    const fan = FAN_ROOMS.includes(r.type) && area(r) >= 6 && Math.min(r.w, r.d) >= 2.2 && !holesUp.some(h => inRoom(h, cx, cz, 0.7));
    if (fan) buildFan(g, H, yOff, r, lightsOn);
    else if ((ck === 'flat' || ck === 'peripheral') && r.type !== 'balcony') E.part(g, { geo: E.geo('cyl', 0.18, 0.03, 1, 16), y: H - 0.03, color: '#ffffff', emissive: lightsOn ? '#fff0d0' : '#1a1a1a', showBelow: yOff + H - 0.1, cast: false });
    if (S.overlay === 'heat' && active) { /* handled in 2D */ }
  });
  // walls: two half-slabs per piece, each finished for the room (paint) or the outside (textured plaster)
  const wg = E.addGroup('walls:' + f.id, { kind: 'wall', y: yOff });
  const extCol = extColor(), ground = !floorBelow(f);
  const fc = facade(), courtyard = courtyardFacade();
  const FRAME = { color: fc.frame, metal: courtyard ? 0.18 : 0.55, rough: courtyard ? 0.32 : 0.38 };
  const entry = courtyard && P().floors.find(x => !floorBelow(x))?.doors.find(d => d.main);
  const front = entry && siteSide();
  const frontage = front === 'N' || front === 'W' ? -1 : 1;
  const junctions = courtyard ? wallLines(f) : [];
  const box = (o, len, h, th, along, y, across, extra) => E.part(wg, Object.assign(o === 'h' ? { geo: E.geo('box', len, h, th), x: along, y, z: across } : { geo: E.geo('box', th, h, len), x: across, y, z: along }, extra));
  const isOut = r => !r || isOpenAir(r);
  // a wall can't stand over a stair opening: cut any stretch that runs across a flight coming up from below
  const cutHoles = pcs => !holesBelow.length ? pcs : pcs.flatMap(p => { let segs = [[p.a, p.b]];
    holesBelow.forEach(h => { const [c0, c1, a0, a1] = p.o === 'h' ? [h.y, h.y + h.d, h.x, h.x + h.w] : [h.x, h.x + h.w, h.y, h.y + h.d]; if (p.c <= c0 + 0.06 || p.c >= c1 - 0.06) return;
      segs = segs.flatMap(([a, b]) => { const lo = Math.max(a, a0), hi = Math.min(b, a1); if (hi - lo < 0.02) return [[a, b]]; const o = []; if (lo - a > 0.05) o.push([a, lo]); if (b - hi > 0.05) o.push([hi, b]); return o; }); });
    return segs.map(([a, b]) => Object.assign({}, p, { a, b })); });
  cutHoles(wallPieces(f)).forEach(p => {
    if (p.kind === 'rail') { buildRail(box, p, extCol); return; }
    let y0 = p.y0, y1 = p.y1; if (cut != null) { if (y0 >= cut) return; y1 = Math.min(y1, cut); }
    if (y1 - y0 < 0.01) return;
    // outer walls run past the line ends to close the corners; partitions stop just inside the outer face
    const len = p.b - p.a, solid = p.kind === 'solid', ext = solid ? (p.ext ? WALL_T / 2 : WALL_T / 2 - 0.018) : 0;
    const mid = (p.a + p.b) / 2;
    const sideRoom = side => { const pt = p.o === 'h' ? [mid, p.c + side * 0.2] : [p.c + side * 0.2, mid]; return roomAt(pt[0], pt[1], f); };
    const rooms = [sideRoom(-1), sideRoom(1)];
    [-1, 1].forEach((side, si) => {
      const rm = rooms[si], outside = isOut(rm);
      const col = outside ? extCol : roomWall(rm);
      const off = side * WALL_T / 4;
      const junctionAt = t => junctions.some(line => line.o !== p.o && Math.abs(line.c - t) < 0.03 && line.a - 0.03 <= p.c && line.b + 0.03 >= p.c);
      const cleanJoint = courtyard && outside;
      const aPad = cleanJoint && !junctionAt(p.a) ? 0 : ext, bPad = cleanJoint && !junctionAt(p.b) ? 0 : ext;
      const wallLen = len + aPad + bPad, wallMid = mid + (bPad - aPad) / 2;
      const aw = !outside && !rm.wallpaper && accentWallOf(rm), stencil = aw && aw.o === p.o && Math.abs(aw.c - p.c) < 0.06;
      box(p.o, wallLen, y1 - y0, WALL_T / 2, wallMid, y0, p.c + off, outside ? (featureWall(rooms[1 - si], f) || { color: col, pattern: 10, patScale: 1 }) : stencil ? { color: col, pattern: 23, color2: aw.color, patScale: 1, rough: 0.8 } : { color: col, pattern: rm.wallpaper ? 7 : 0, color2: mixHex(col, '#ffffff', 0.25), patScale: 0.08, rough: 0.88 });
      const face = p.c + side * WALL_T / 2;
      if (outside && cut == null && !isOut(rooms[1 - si])) {
        if (entry && ['N', 'S', 'E', 'W'].includes(front) && side === frontage && entry.o === p.o &&
            Math.abs(p.c - (p.o === 'h' ? entry.y : entry.x)) < 0.075) {
          const center = p.o === 'h' ? entry.x : entry.y;
          const start = center - (ground ? entry.w / 2 + 0.37 : 1.15), end = center + (ground ? entry.w / 2 + 0.73 : 0.2);
          const a = Math.max(start, p.a), b = Math.min(end, p.b);
          if (b - a > 0.03) {
            box(p.o, b - a, y1 - y0, 0.052, (a + b) / 2, y0, face + side * 0.024,
              { color: fc.stone[0], color2: fc.stone[1], pattern: 13, rough: 0.9 });
          }
        }
        // stone-clad plinth at the foot of the house, and a moulded band at each floor's top (slab edge)
        if (ground && y0 < 0.01 && !plinthH()) { if (fc.plinth) box(p.o, len + ext * 2 + 0.06, 0.5, 0.05, mid, -0.06, face + side * 0.02, { color: '#7d7166', color2: '#5b524a', pattern: 13 });
          else box(p.o, len + ext * 2 + 0.02, 0.1, 0.02, mid, -0.06, face + side * 0.01, { color: '#3a3b3e', rough: 0.6 }); }
        if (y1 > f.height - 0.01) {
          if (fc.band === 'timber') {
            if (floorAbove(f)) {
              if (courtyard) {
                box(p.o, wallLen, 0.18, 0.19, wallMid, f.height + 0.015, face + side * 0.087, { color: extCol, pattern: 10 });
                box(p.o, wallLen, 0.065, 0.21, wallMid, f.height - 0.05, face + side * 0.088, exteriorOak());
              } else box(p.o, len + ext * 2 + 0.04, 0.36, 0.05, mid, f.height - 0.2, face + side * 0.025, TIMBER);
            }
          }
          else box(p.o, len + ext * 2 + 0.08, 0.2, 0.07, mid, f.height - 0.08, face + side * 0.03, { color: mixHex(extCol, '#ffffff', 0.35), pattern: 10 });
        }
      }
      if (!outside && y0 < 0.01 && (p.kind === 'solid' || p.kind === 'sill') && len > 0.25) { // skirting board
        const fm = FLOORS[roomFloorKey(rm)]; box(p.o, len + ext * 2 - 0.02, 0.1, 0.016, mid, FLOOR_TOP, face + side * 0.008, { color: E.quality !== 'low' ? '#f1eee8' : mixHex(fm.color, '#000000', 0.12), rough: 0.45, cast: false });
      }
    });
    if (p.kind === 'sill' && cut == null) {
      const w = p.ref, gy = w.sill, gh = w.h, outSide = isOut(rooms[0]) && !isOut(rooms[1]) ? -1 : isOut(rooms[1]) && !isOut(rooms[0]) ? 1 : 0, along = mid;
      const fd = 0.07, prof = 0.055; // frame depth and profile
      // glass, frame (outer + mullion + transom)
      box(p.o, len - 0.02, gh, 0.012, along, gy, p.c, { color: '#5d7480', pattern: 15, alpha: 0.18, cast: false });
      box(p.o, len, prof, fd, along, gy, p.c, FRAME); box(p.o, len, prof, fd, along, gy + gh - prof, p.c, FRAME);
      [p.a + prof / 2, p.b - prof / 2].forEach(t => box(p.o, prof, gh, fd, t, gy, p.c, FRAME));
      const tall = gh > 2.2, panes = tall ? Math.max(2, Math.round(len / 1.1)) : len > 1.9 ? 3 : len > 0.8 ? 2 : 1;
      for (let i = 1; i < panes; i++) box(p.o, 0.045, gh, fd * 0.8, p.a + len * i / panes, gy, p.c, FRAME);
      if (gh > 1.15 && !tall) box(p.o, len, 0.045, fd * 0.8, along, gy + gh * 0.72, p.c, FRAME);
      // reveal linings so the wall thickness reads at the opening
      box(p.o, len, 0.012, WALL_T, along, gy + gh, p.c, { color: '#efebe4', cast: false });
      [p.a + 0.006, p.b - 0.006].forEach(t => box(p.o, 0.012, gh, WALL_T, t, gy, p.c, { color: '#efebe4', cast: false }));
      if (outSide) {
        // projecting stone sill and a concrete sunshade (chajja) over the window
        box(p.o, len + 0.16, 0.045, WALL_T / 2 + 0.08, along, gy - 0.045, p.c + outSide * (WALL_T / 4 + 0.04), fc.chajja ? { color: '#8a8580', color2: '#6c6863', pattern: 6, patScale: 0.5 } : { color: '#2a2b2e', metal: 0.5, rough: 0.4 });
        if (fc.chajja && gy + gh + 0.2 < f.height - 0.15) box(p.o, len + 0.36, 0.07, 0.5, along, gy + gh + 0.16, p.c + outSide * (WALL_T / 2 + 0.25), { color: mixHex(extCol, '#ffffff', 0.2), pattern: 10 });
        // interior marble ledge
        box(p.o, len, 0.025, WALL_T / 2 + 0.04, along, gy - 0.025, p.c - outSide * (WALL_T / 4 + 0.02), { color: '#ece7de', color2: '#c4bcae', pattern: 3, patScale: 0.4, cast: false });
      }
      // curtains on room side(s)
      [-1, 1].forEach(side => {
        const pt = p.o === 'h' ? [mid, p.c + side * 0.25] : [p.c + side * 0.25, mid]; const rm = roomAt(pt[0], pt[1], f);
        if (!rm || !rm.curtains || isOpenAir(rm) || ['bathroom', 'kitchen', 'utility'].includes(rm.type)) return;
        const col = roomTheme(rm).curtain; const top = Math.min(f.height - 0.08, w.sill + w.h + 0.25), hh = top - FLOOR_TOP - 0.01; const o = side * (WALL_T / 2 + 0.07);
        if (E.quality !== 'low') { const pw = clamp(len * 0.28, 0.32, 0.6), tex = texSet('linen', { uvx: [2.2, 2.2, 0] });
          [p.a - 0.1 + pw / 2 - 0.16, p.b + 0.1 - pw / 2 + 0.16].forEach((t, k) => E.part(wg, { geo: pleatGeo(pw, hh - 0.005, 0.04, k + 1), x: p.o === 'h' ? t : p.c + o, y: FLOOR_TOP + 0.005, z: p.o === 'h' ? p.c + o : t, ry: p.o === 'h' ? 0 : Math.PI / 2,
            color: mixHex('#ffffff', col, 0.6), tex, rough: 0.95, sheen: 0.25, sheenC: '#ffffff', noCull: true, transl: 0.55 }));
        } else [p.a - 0.12, p.b + 0.12].forEach(t => box(p.o, 0.32, hh, 0.06, t, 0.08, p.c + o, { color: col, pattern: 7, patScale: 0.06, color2: mixHex(col, '#000000', 0.12) }));
        box(p.o, len + 0.6, 0.03, 0.03, mid, top, p.c + o, { color: '#777777', metal: 0.8, rough: 0.35 });
      });
    }
  });
  // doors
  f.doors.forEach(d => {
    if (cut != null) return;
    const hinge = d.o === 'h' ? [d.x - d.w / 2, d.y] : [d.x, d.y - d.w / 2];
    // a door swings INTO the room it closes off (bedroom, bathroom, store…), never out into the passage or the garden
    const rA = d.o === 'h' ? roomAt(d.x, d.y - 0.3, f) : roomAt(d.x - 0.3, d.y, f), rB = d.o === 'h' ? roomAt(d.x, d.y + 0.3, f) : roomAt(d.x + 0.3, d.y, f);
    const priv = rm => isOut(rm) ? -10 : ['hall', 'living', 'dining'].includes(rm.type) ? 0 : 1, intoA = priv(rA) > priv(rB);
    const swing = (d.main ? 1.1 : 1.48) * ((d.o === 'h') !== intoA ? -1 : 1); // h-doors: −angle swings to +z (B); v-doors: −angle swings to −x (A)
    const base = d.o === 'h' ? 0 : -Math.PI / 2, open = swing;
    if (d.sliding || d.open) { buildDoorway(d, f, yOff); return; }
    const g = E.addGroup('door:' + d.id, { kind: 'door', ref: d.id, x: hinge[0], y: yOff, z: hinge[1], rot: base + open });
    const col = d.main ? '#5a3a24' : '#b08b66', lw = d.w - 0.04, lh = DOOR_H - 0.03;
    E.part(g, { geo: E.geo('box', lw, lh, 0.045), x: lw / 2 + 0.02, y: 0.01, z: 0, color: col, color2: mixHex(col, '#000000', 0.25), pattern: 1, patScale: 2.4, rough: 0.45 });
    // raised panels on both faces (four on the main door, two on others)
    const rows = d.main ? [[0.18, 0.78], [1.05, 0.85]] : [[0.2, 0.75], [1.1, 0.75]];
    [-1, 1].forEach(sd => rows.forEach(([py, ph]) => [0.25, 0.75].forEach((fx, k) => { if (!d.main && k) return; const pw = d.main ? lw * 0.36 : lw * 0.7; E.part(g, { geo: E.geo('box', pw, ph, 0.012), x: d.main ? lw * fx + 0.02 : lw / 2 + 0.02, y: py, z: sd * 0.027, color: mixHex(col, '#000000', 0.08), color2: mixHex(col, '#000000', 0.3), pattern: 1, patScale: 2.4, rough: 0.45, cast: false }); })));
    [-1, 1].forEach(sd => E.part(g, { geo: E.geo('box', d.main ? 0.03 : 0.12, d.main ? 0.4 : 0.025, 0.03), x: lw - 0.06, y: d.main ? 0.85 : 1.0, z: sd * 0.045, color: d.main ? '#2a2a2a' : '#c9a45c', metal: 0.9, rough: 0.3 }));
    const fg = E.addGroup('doorframe:' + d.id, { kind: 'misc', x: d.x, y: yOff, z: d.y });
    const fcol = d.main ? '#3e2a1c' : '#7a5a3f', fx = { color: fcol, pattern: 1, patScale: 2, color2: mixHex(fcol, '#000000', 0.3), rough: 0.5 };
    if (d.o === 'h') { E.part(fg, Object.assign({ geo: E.geo('box', 0.06, DOOR_H, WALL_T + 0.03), x: -d.w / 2 + 0.03 }, fx)); E.part(fg, Object.assign({ geo: E.geo('box', 0.06, DOOR_H, WALL_T + 0.03), x: d.w / 2 - 0.03 }, fx)); E.part(fg, Object.assign({ geo: E.geo('box', d.w, 0.06, WALL_T + 0.03), y: DOOR_H - 0.06 }, fx)); }
    else { E.part(fg, Object.assign({ geo: E.geo('box', WALL_T + 0.03, DOOR_H, 0.06), z: -d.w / 2 + 0.03 }, fx)); E.part(fg, Object.assign({ geo: E.geo('box', WALL_T + 0.03, DOOR_H, 0.06), z: d.w / 2 - 0.03 }, fx)); E.part(fg, Object.assign({ geo: E.geo('box', WALL_T + 0.03, 0.06, d.w), y: DOOR_H - 0.06 }, fx)); }
    // main entrance: canopy, granite step and a wall light on the outside
    const ra = d.o === 'h' ? roomAt(d.x, d.y - 0.3, f) : roomAt(d.x - 0.3, d.y, f), rb = d.o === 'h' ? roomAt(d.x, d.y + 0.3, f) : roomAt(d.x + 0.3, d.y, f);
    // a modular switch board on the latch side, inside each room (bathroom switches sit outside, as in Indian homes)
    [[ra, -1], [rb, 1]].forEach(([rm, sg]) => { if (isOut(rm) || rm.type === 'bathroom') return;
      const lo = d.o === 'h' ? rm.x : rm.y, hi = d.o === 'h' ? rm.x + rm.w : rm.y + rm.d, c0 = d.o === 'h' ? d.x : d.y;
      const t = [d.w / 2 + 0.17, -(d.w / 2 + 0.17)].find(o => c0 + o > lo + 0.16 && c0 + o < hi - 0.16); if (t == null) return;
      const across = sg * (WALL_T / 2 + 0.006), pl = (wa, h, dc) => d.o === 'h' ? E.geo('box', wa, h, dc) : E.geo('box', dc, h, wa), at = (al, ac, extra) => Object.assign(d.o === 'h' ? { x: al, z: ac } : { x: ac, z: al }, extra);
      E.part(fg, at(t, across, { geo: pl(0.2, 0.12, 0.012), y: 1.14, color: '#f3f2ee', rough: 0.35, cast: false }));
      for (let i = 0; i < 4; i++) E.part(fg, at(t - 0.069 + i * 0.046, across + sg * 0.007, { geo: pl(0.032, 0.052, 0.006), y: 1.174, color: i === 3 ? '#e6e3dc' : '#fbfaf7', rough: 0.3, cast: false }));
    });
    const outS = isOut(ra) && !isOut(rb) ? -1 : isOut(rb) && !isOut(ra) ? 1 : 0;
    if (outS && (d.main || ground)) {
      const at = (along, across, extra) => Object.assign(d.o === 'h' ? { x: along, z: across } : { x: across, z: along }, extra);
      const geo = (wa, h, dc) => d.o === 'h' ? E.geo('box', wa, h, dc) : E.geo('box', dc, h, wa);
      if (d.main) {
        E.part(fg, at(0, outS * (WALL_T / 2 + 0.55), { geo: geo(d.w + 0.9, 0.09, 1.1), y: DOOR_H + 0.28, color: mixHex(extColor(), '#ffffff', 0.25), pattern: 10 }));
        E.part(fg, at(0, outS * (WALL_T / 2 + 0.55), { geo: geo(d.w + 0.92, 0.12, 1.12), y: DOOR_H + 0.37, color: '#3a3532', rough: 0.6 }));
        if (!courtyard) E.part(fg, at(d.w / 2 + 0.3, outS * (WALL_T / 2 + 0.05), { geo: geo(0.12, 0.22, 0.08), y: 1.75, color: '#222222', emissive: isNight() ? '#ffcf8a' : '#3a342a', cast: false }));
      }
      if (ground && !plinthH()) E.part(fg, at(0, outS * (WALL_T / 2 + 0.3), { geo: geo(d.w + 0.5, 0.1, 0.6), y: -0.07, color: '#3c3b3d', color2: '#5a595c', pattern: 6, patScale: 0.6 }));
    }
  });
  if (cut == null) garageDoors(f).forEach(gd => buildGarageDoor(gd, f, yOff, box));
  if (cut == null) {
    buildEaves(f, yOff);
    if (ground && entry) buildEntrySconce(entry, f, yOff, frontage);
  }
  if (S.roof && cut == null) buildRoof(f, yOff);
  // furniture
  f.rooms.forEach(r => r.furniture.forEach(it => buildItem(it, r, yOff)));
  // stairs going up from this floor, and the balustrade around the opening from the floor below
  (f.stairs || []).forEach(st => buildStairs(st, f, yOff));
  if (cut == null) stairsBelow(f).forEach(st => buildStairwell(st, f, yOff));
}
/* sliding glass door (balcony / garden) in a slim aluminium frame, or a plain open doorway with just a frame */
function buildDoorway(d, f, yOff) {
  const fg = E.addGroup('doorframe:' + d.id, { kind: 'misc', x: d.x, y: yOff, z: d.y }), H = DOOR_H, w = d.w;
  const at = (al, ac, extra) => Object.assign(d.o === 'h' ? { x: al, z: ac } : { x: ac, z: al }, extra), geo = (wa, h, dc) => d.o === 'h' ? E.geo('box', wa, h, dc) : E.geo('box', dc, h, wa);
  const AL = { color: '#3b3d40', metal: 0.6, rough: 0.35 };
  if (d.open) { const wood = { color: '#7a5a3f', color2: '#4f3a29', pattern: 1, patScale: 2, rough: 0.5 };
    E.part(fg, at(-w / 2 + 0.03, 0, Object.assign({ geo: geo(0.06, H, WALL_T + 0.03) }, wood))); E.part(fg, at(w / 2 - 0.03, 0, Object.assign({ geo: geo(0.06, H, WALL_T + 0.03) }, wood)));
    E.part(fg, at(0, 0, Object.assign({ geo: geo(w, 0.06, WALL_T + 0.03), y: H - 0.06 }, wood))); return; }
  // outer frame
  E.part(fg, at(-w / 2 + 0.025, 0, Object.assign({ geo: geo(0.05, H, 0.1) }, AL))); E.part(fg, at(w / 2 - 0.025, 0, Object.assign({ geo: geo(0.05, H, 0.1) }, AL)));
  E.part(fg, at(0, 0, Object.assign({ geo: geo(w, 0.05, 0.1), y: H - 0.05 }, AL))); E.part(fg, at(0, 0, Object.assign({ geo: geo(w, 0.03, 0.1), y: 0.0 }, AL)));
  // two glass panels on two tracks: one closed, one slid half open
  const pw = w / 2 + 0.03;
  [[-w / 4, -0.022], [w / 4 - pw * 0.45, 0.022]].forEach(([c, tr]) => {
    E.part(fg, at(c, tr, { geo: geo(pw - 0.08, H - 0.16, 0.008), y: 0.07, color: '#6f8790', pattern: 15, alpha: 0.2, cast: false }));
    [[-pw / 2 + 0.025, 0.05, H - 0.08, 0.04], [pw / 2 - 0.025, 0.05, H - 0.08, 0.04]].forEach(([dx, ww, hh, y0]) => E.part(fg, at(c + dx, tr, Object.assign({ geo: geo(ww, hh, 0.04), y: y0 }, AL))));
    E.part(fg, at(c, tr, Object.assign({ geo: geo(pw, 0.05, 0.04), y: 0.04 }, AL))); E.part(fg, at(c, tr, Object.assign({ geo: geo(pw, 0.05, 0.04), y: H - 0.1 }, AL)));
  });
}
/* a parapet goes where the built area really ends: indoor on one side, and nothing built for a good
   way out on the other (small gaps between detected rooms are not the edge of the roof) */
/* under the roof: built rooms, plus (modern flat roofs) a recessed balcony walled in on 2+ sides */
function roofed(f, r) {
  if (!isOpenAir(r)) return true; if (r.type !== 'balcony' || facade().roof !== 'overhang') return false;
  const built = f.rooms.filter(q => !isOpenAir(q)), touch = (o, c, a, b) => built.some(q => { const e = sharedEdge(r, q); return e && e.o === o && Math.abs(e.c - c) < 0.05 && e.hi - e.lo > 0.5 * (b - a); });
  return [touch('h', r.y, r.x, r.x + r.w), touch('h', r.y + r.d, r.x, r.x + r.w), touch('v', r.x, r.y, r.y + r.d), touch('v', r.x + r.w, r.y, r.y + r.d)].filter(Boolean).length >= 2;
}
/* small gaps the plan leaves between rooms (ducts, shafts, unlabelled bits) that are walled in on every side: the roof covers them */
const _holes = new WeakMap();
function roofHoles(f) {
  const sig = f.rooms.map(r => [r.x, r.y, r.w, r.d].join(',')).join(';'), c = _holes.get(f); if (c && c.sig === sig) return c.holes;
  const rs = f.rooms; let holes = [];
  if (rs.length) { const x0 = Math.min(...rs.map(r => r.x)), y0 = Math.min(...rs.map(r => r.y)), x1 = Math.max(...rs.map(r => r.x + r.w)), y1 = Math.max(...rs.map(r => r.y + r.d));
    holes = rectMinus({ x: x0, y: y0, w: x1 - x0, d: y1 - y0 }, rs).filter(q => q.x > x0 + 0.05 && q.y > y0 + 0.05 && q.x + q.w < x1 - 0.05 && q.y + q.d < y1 - 0.05 && q.w * q.d < 12); }
  _holes.set(f, { sig, holes }); return holes;
}
function roofEdge(f, o, c, t) {
  const inside = (d) => { const p = o === 'h' ? [t, c + d] : [c + d, t]; return f.rooms.some(r => roofed(f, r) && inRoom(r, p[0], p[1])) || roofHoles(f).some(q => inRoom(q, p[0], p[1])); };
  const a = inside(-0.12), b = inside(0.12); if (a === b) return 0;
  return a ? (!inside(0.45) && !inside(0.8) ? 1 : 0) : (!inside(-0.45) && !inside(-0.8) ? -1 : 0);
}
function roofRunsOf(f, L0, extra = []) { // stretches of a wall line that are the edge of the roof, with their outward side
  const cuts = new Set([L0.a, L0.b]); f.rooms.concat(extra).forEach(r => (L0.o === 'h' ? [r.x, r.x + r.w] : [r.y, r.y + r.d]).forEach(v => { if (v > L0.a + 0.01 && v < L0.b - 0.01) cuts.add(v); }));
  const ts = [...cuts].sort((a, b) => a - b), out = [];
  for (let i = 0; i < ts.length - 1; i++) { const sg = roofEdge(f, L0.o, L0.c, (ts[i] + ts[i + 1]) / 2); if (!sg) continue; const last = out[out.length - 1]; if (last && last.sign === sg && Math.abs(last.b - ts[i]) < 1e-6) last.b = ts[i + 1]; else out.push({ a: ts[i], b: ts[i + 1], sign: sg }); }
  return out;
}
function exteriorOak() {
  return E.quality === 'low' ? { color: '#76502f', color2: '#4c351e', pattern: 1, patScale: 0.12, rough: 0.69 }
    : { color: '#af9579', tex: texSet('planks', { ns: 0.4 }), patScale: 0.85, rough: 0.87 };
}
function buildEntrySconce(entry, floor, yOff, side) {
  const along = entry.o === 'h' ? entry.x : entry.y;
  const wall = entry.o === 'h' ? entry.y : entry.x;
  const t = along + entry.w / 2 + 0.39;
  const adjacentWindow = floor.windows.some(w => w.o === entry.o && Math.abs((w.o === 'h' ? w.y : w.x) - wall) < 0.06 &&
    Math.abs((w.o === 'h' ? w.x : w.y) - t) < w.w / 2 + 0.12);
  if (adjacentWindow) return;
  const c = wall + side * (WALL_T / 2 + 0.115), [x, z] = entry.o === 'h' ? [t, c] : [c, t];
  const y = yOff + 1.58;
  const g = E.addGroup('courtyard-entry-light', { kind: 'site', x, y, z, rot: entry.o === 'h' ? 0 : Math.PI / 2 });
  E.part(g, { geo: E.geo('box', 0.14, 0.28, 0.10), ...POWDER_COAT });
  E.part(g, { geo: E.geo('box', 0.085, 0.16, 0.016), y: 0.06, z: side * 0.055, color: '#ffe3b0', emissive: '#c9833f', cast: false });
  E.facadeLights.push({ p: [x + (entry.o === 'v' ? side * 0.17 : 0), y + 0.14, z + (entry.o === 'h' ? side * 0.17 : 0)], c: [1.38, 0.77, 0.28], r: 1.9 });
}
/* modern styles: a flat roof that overhangs the walls, with a dark edge */
function buildEaves(f, yOff) {
  if (facade().roof !== 'overhang') return; const pj = P(), act = pj.floors[pj.activeFloor], ab = floorAbove(f), up = ab && showFloorIn3D(ab, act) ? ab.rooms : [];
  const g = E.addGroup('eaves:' + f.id, { kind: 'misc', y: yOff }), H = f.height, courtyard = courtyardFacade(), ov = courtyard ? 0.73 : 0.6;
  const front = courtyard ? siteSide() : null;
  const roofTop = !floorAbove(f);
  const walledAbove = (o, c, t, sign) => { const p = o === 'h' ? [t, c - sign * 0.3] : [c - sign * 0.3, t]; return up.some(r => !isOpenAir(r) && inRoom(r, p[0], p[1])); };
  wallLines(f).forEach(L0 => roofRunsOf(f, L0, up).forEach(sg => {
    if (walledAbove(L0.o, L0.c, (sg.a + sg.b) / 2, sg.sign)) return; // the wall carries on up: no eave here
    const len = sg.b - sg.a + 2 * ov, m = (sg.a + sg.b) / 2, w = WALL_T + ov, c = L0.c + sg.sign * ov / 2;
    if (courtyard) {
      const span = sg.b - sg.a, facing = L0.o === 'h' ? (sg.sign < 0 ? 'N' : 'S') : (sg.sign < 0 ? 'W' : 'E');
      const isFront = front === facing;
      const trim = (L, y, height, depth, material) => E.part(g, {
        geo: E.geo('box', L0.o === 'h' ? L : depth, height, L0.o === 'h' ? depth : L),
        x: L0.o === 'h' ? m : c, z: L0.o === 'h' ? c : m, y, ...material
      });
      trim(len, H - 0.035, 0.27, w, { color: extColor(), pattern: 10, rough: 0.9 });
      trim(len + 0.025, H + 0.22, isFront && roofTop ? 0.45 : 0.17, w + 0.03, { color: '#393735', pattern: 10, rough: 0.86 });
      trim(len + 0.015, H - 0.09, 0.058, w + 0.015, exteriorOak());
      if (isFront && span > 1.25) {
        const lights = Math.max(1, Math.floor(span / 2.15));
        for (let i = 0; i < lights; i++) {
          const t = sg.a + span * (i + 0.5) / lights;
          const x = L0.o === 'h' ? t : c, z = L0.o === 'h' ? c : t;
          E.part(g, { geo: E.geo('cyl', 0.046, 0.018, 1, 12), x, y: H - 0.104, z, color: '#fff0c7', emissive: '#dca368', cast: false });
          E.facadeLights.push({ p: [x, yOff + H - 0.18, z], c: [0.54, 0.32, 0.12], r: 1.3 });
        }
      }
      return;
    }
    E.part(g, L0.o === 'h' ? { geo: E.geo('box', len, 0.26, w), x: m, y: H - 0.04, z: c, color: '#2a2b2e', rough: 0.55 } : { geo: E.geo('box', w, 0.26, len), x: c, y: H - 0.04, z: m, color: '#2a2b2e', rough: 0.55 });
    E.part(g, L0.o === 'h' ? { geo: E.geo('box', len - 0.02, 0.02, w - 0.02), x: m, y: H - 0.06, z: c, color: '#f2f1ee', cast: false } : { geo: E.geo('box', w - 0.02, 0.02, len - 0.02), x: c, y: H - 0.06, z: m, color: '#f2f1ee', cast: false }); // light soffit
  }));
}
/* the part of a lower floor's roof that sticks out past the floor above (e.g. a garage) */
function buildLowRoof(f, yOff, above) {
  if (facade().roof !== 'overhang') return; const H = f.height, g = E.addGroup('roof:' + f.id, { kind: 'misc', y: yOff });
  f.rooms.filter(r => roofed(f, r)).forEach(r => rectMinus({ x: r.x, y: r.y, w: r.w, d: r.d }, above.rooms).forEach(q => {
    if (q.w < 0.3 || q.d < 0.3) return;
    E.part(g, { geo: E.geo('box', q.w + 0.02, 0.18, q.d + 0.02), x: q.x + q.w / 2, y: H, z: q.y + q.d / 2, color: '#d4d0c9', showBelow: yOff + H - 0.05 });
    E.part(g, { geo: E.geo('box', q.w, 0.02, q.d), x: q.x + q.w / 2, y: H + 0.18, z: q.y + q.d / 2, color: '#8d8a85', color2: '#6f6c68', pattern: 8, cast: false });
  }));
}
/* roof terrace: slab, tiles, parapet with coping and a water tank — shown with the "Roof" toggle */
function buildRoof(f, yOff) {
  const pj = P(), act = pj.floors[pj.activeFloor], above = floorAbove(f);
  if (above && showFloorIn3D(above, act)) { buildLowRoof(f, yOff, above); return; }
  const H = f.height, g = E.addGroup('roof:' + f.id, { kind: 'misc', y: yOff }), ext = extColor();
  f.rooms.filter(r => roofed(f, r)).forEach(r => {
    const e = (o, c, t) => isExteriorPoint(f, o, c, t) ? WALL_T / 2 : 0; const cx = r.x + r.w / 2, cz = r.y + r.d / 2;
    const n = e('h', r.y, cx), so = e('h', r.y + r.d, cx), w = e('v', r.x, cz), ea = e('v', r.x + r.w, cz);
    E.part(g, { geo: E.geo('box', r.w + w + ea + 0.01, 0.16, r.d + n + so + 0.01), x: r.x - w + (r.w + w + ea) / 2, y: H, z: r.y - n + (r.d + n + so) / 2, color: '#cfc7ba' });
    E.part(g, { geo: E.geo('box', r.w + w + ea, 0.025, r.d + n + so), x: r.x - w + (r.w + w + ea) / 2, y: H + 0.16, z: r.y - n + (r.d + n + so) / 2, color: '#b49a80', color2: '#8c7a68', pattern: 14, patScale: 0.6, cast: false });
  });
  roofHoles(f).forEach(q => { E.part(g, { geo: E.geo('box', q.w + 0.02, 0.16, q.d + 0.02), x: q.x + q.w / 2, y: H, z: q.y + q.d / 2, color: '#cfc7ba' });
    E.part(g, { geo: E.geo('box', q.w, 0.025, q.d), x: q.x + q.w / 2, y: H + 0.16, z: q.y + q.d / 2, color: '#b49a80', color2: '#8c7a68', pattern: 14, patScale: 0.6, cast: false }); });
  if (facade().roof !== 'overhang')
  wallLines(f).forEach(L0 => roofRunsOf(f, L0).forEach(sg => {
    const L = { o: L0.o, c: L0.c, a: sg.a, b: sg.b };
    const len = L.b - L.a + WALL_T, m = (L.a + L.b) / 2;
    E.part(g, L.o === 'h' ? { geo: E.geo('box', len, 0.92, WALL_T), x: m, y: H + 0.16, z: L.c, color: ext, pattern: 10 } : { geo: E.geo('box', WALL_T, 0.92, len), x: L.c, y: H + 0.16, z: m, color: ext, pattern: 10 });
    E.part(g, L.o === 'h' ? { geo: E.geo('box', len + 0.06, 0.06, WALL_T + 0.08), x: m, y: H + 1.08, z: L.c, color: '#d9d1c4', color2: '#b8b0a3', pattern: 6, patScale: 0.8 } : { geo: E.geo('box', WALL_T + 0.08, 0.06, len + 0.06), x: L.c, y: H + 1.08, z: m, color: '#d9d1c4', color2: '#b8b0a3', pattern: 6, patScale: 0.8 });
  }));
  const fSide = siteSide();
  const away = r => fSide === 'N' ? r.y + r.d / 2 : fSide === 'S' ? -r.y - r.d / 2 : fSide === 'W' ? r.x + r.w / 2 : -r.x - r.w / 2;
  const big = f.rooms.filter(r => !isOpenAir(r)).sort((a, b) => courtyardFacade() ? away(b) - away(a) : area(b) - area(a))[0];
  if (big) { const tx = big.x + Math.min(1.1, big.w / 3), tz = big.y + Math.min(1.1, big.d / 3);
    E.part(g, { geo: E.geo('box', 1.3, 0.35, 1.3), x: tx, y: H + 0.18, z: tz, color: '#bdb5a8' });
    E.part(g, { geo: E.geo('cyl', 0.55, 1.15, 1, 20), x: tx, y: H + 0.53, z: tz, color: '#1f2224', rough: 0.55 });
    E.part(g, { geo: E.geo('cyl', 0.2, 0.06, 1, 14), x: tx, y: H + 1.68, z: tz, color: '#2a2d30' }); }
}
const ROLE_MAT = { brass: { rough: 0.28, metal: 0.95 }, carve: { pattern: 21, rough: 0.5 }, metal: { rough: 0.35, metal: 0.85 }, appliance: { rough: 0.25, metal: 0.4 }, screen: { rough: 0.1 }, glass: { pattern: 15 }, glass2: { rough: 0.08 }, mirror: { rough: 0.02, metal: 1 }, stone: { rough: 0.22 }, ceramic: { rough: 0.12 }, white: { rough: 0.55 }, water: { pattern: 17 }, rubber: { rough: 0.9 }, wood: { rough: 0.5 }, cabinet: { rough: 0.4 }, mattress: { pattern: 4 }, plant: { pattern: 16 }, plant2: { pattern: 16 }, pot: { rough: 0.7 }, rattan: { pattern: 4, rough: 0.8 }, dark: { rough: 0.5 } };
const PRINTED = { fabric2: ['diwan', 'jhoola', 'bed_double', 'bed_single', 'bed_carved', 'guest_bed'], accent: ['sofa_3', 'sofa_l', 'diwan'], fabric: ['jhoola'] };
/* how round each kind of furniture surface is: soft things (mattress, cushions, upholstery) are clearly rounded,
   wood and cabinets get a small bevel, thin panels, glass and screens stay crisp */
const SOFT_R = { brass: 0.004, carve: 0.006, mattress: 0.06, fabric: 0.045, fabric2: 0.045, seat: 0.05, headboard: 0.03, white: 0.035, rattan: 0.02, wood: 0.012, cabinet: 0.01, accent: 0.035, dark: 0.01, ceramic: 0.03, appliance: 0.012, metal: 0.004, stone: 0.006 };
function boxGeo(p) {
  const r = SOFT_R[p.role.startsWith('c:') ? 'wood' : p.role] || 0, m = Math.min(p.w, p.h, p.d);
  if (!r || m < 0.025 || E.quality === 'low') return E.geo('box', p.w, p.h, p.d);
  return E.geo('rbox', p.w, p.h, p.d, Math.min(r, m * 0.45));
}
/* ---- image textures (DIMORA's own, assets/textures) and licensed GLB models (assets/models, see assets/CREDITS.md) ---- */
const TEXSETS = {
  oak: { B: 'assets/textures/oak_1k.jpg', M: 'assets/textures/oak_mr_1k.jpg', N: 'assets/textures/oak_n_1k.jpg', world: true, scale: 0.85, tint: '#ffffff' },
  linen: { B: 'assets/textures/linen_1k.jpg', N: 'assets/textures/linen_n_1k.jpg', ns: 0.8 },
  rug: { B: 'assets/textures/rug_wool_2k.jpg', N: 'assets/textures/wool_n_1k.jpg', ns: 0.9 },
  travertine: { B: 'assets/textures/travertine_1k.jpg', N: 'assets/textures/travertine_n_1k.jpg', world: true, scale: 0.7, ns: 0.6, rough: 0.42 },
  stone_tile: { B: 'assets/textures/stone_tile_2k.jpg', M: 'assets/textures/stone_tile_mr_2k.jpg', N: 'assets/textures/stone_tile_n_2k.jpg', world: true, ns: 0.8 },
  planks: { B: 'assets/textures/oak_planks_2k.jpg', M: 'assets/textures/oak_planks_mr_2k.jpg', N: 'assets/textures/oak_planks_n_2k.jpg', world: true, ns: 0.7 },
  weave: { N: 'assets/textures/weave_n_512.jpg', world: true, scale: 0.08, ns: 0.45 },
  // v3.6 materials pass (all generated by tools/gen_textures.py, real-world scale in metres per tile)
  brick: { B: 'assets/textures/brick_1k.jpg', M: 'assets/textures/brick_mr_1k.jpg', N: 'assets/textures/brick_n_1k.jpg', world: true, scale: 0.96, ns: 0.7, ref: '#8f5139' },
  ledgestone: { B: 'assets/textures/ledgestone_2k.jpg', M: 'assets/textures/ledgestone_mr_2k.jpg', N: 'assets/textures/ledgestone_n_2k.jpg', world: true, scale: 1.2, ns: 1.1, ref: '#878074' },
  plaster: { B: 'assets/textures/plaster_1k.jpg', N: 'assets/textures/plaster_n_1k.jpg', world: true, scale: 2.0, ns: 0.45, ref: '#e6e6e6' },
  pavers: { B: 'assets/textures/pavers_1k.jpg', M: 'assets/textures/pavers_mr_1k.jpg', N: 'assets/textures/pavers_n_1k.jpg', world: true, scale: 1.2, ns: 0.8, ref: '#a19c93' },
  ceramic: { B: 'assets/textures/ceramic_1k.jpg', M: 'assets/textures/ceramic_mr_1k.jpg', N: 'assets/textures/ceramic_n_1k.jpg', world: true, ns: 0.8, ref: '#e3e2df' },
  granite: { B: 'assets/textures/granite_1k.jpg', world: true, scale: 0.6, ref: '#8c8c8c' },
  laminate: { B: 'assets/textures/laminate_1k.jpg', N: 'assets/textures/laminate_n_1k.jpg', world: true, scale: 0.8, ns: 0.4, ref: '#b18f6a' },
  brushed: { N: 'assets/textures/brushed_n_512.jpg', world: true, scale: 0.35, ns: 0.5 },
  grass: { B: 'assets/textures/lawn_2k.jpg', M: 'assets/textures/lawn_mr_1k.jpg', N: 'assets/textures/lawn_n_2k.jpg', world: true, scale: 1.2, ns: 0.9, ref: '#3e5a22', dual: true },
  asphalt: { B: 'assets/textures/asphalt_1k.jpg', N: 'assets/textures/asphalt_n_1k.jpg', world: true, scale: 3.0, ns: 0.4, ref: '#3e3e3e' },
  vitrified: { B: 'assets/textures/vitrified_2k.jpg', M: 'assets/textures/vitrified_mr_2k.jpg', N: 'assets/textures/stone_tile_n_2k.jpg', world: true, ns: 0.6 },
};
/* The shared material pass: every part the engine draws goes through upgradeMaterial(). Procedural finishes that read as
   flat or over-dense patterns at eye level become real-scale image PBR sets, tinted so the chosen paint / cladding /
   paving colour is kept: brick (9), ledgestone cladding (13), exterior plaster (10), pavers (12) and setts (18). */
const PATTERN_TEX = { 11: { set: 'grass', tint: '#b9bfa8' }, 9: { set: 'brick' }, 13: { set: 'ledgestone' }, 10: { set: 'plaster', rough: 0.95 }, 12: { set: 'pavers' }, 18: { set: 'pavers', scale: 0.6 } };
function upgradeMaterial(d) {
  if (d.tex || !E || E.quality === 'low') return; const m = PATTERN_TEX[d.pattern]; if (!m) return; const t = TEXSETS[m.set];
  d.tex = texSet(m.set); d.tex.weather = m.set === 'plaster'; d.patScale = m.scale || t.scale; d.color = m.tint || texTint(d.color, t.ref); d.pattern = 0; d.rough = m.rough ?? 1; if (!(d.metal > 0)) d.metal = 0;
}
// tint that turns a neutral texture into a material colour (ref = the texture's own average colour)
// floor finishes: polished vitrified and marble are glossy, matte ceramic is satin, bathroom anti-skid is the least glossy
const FLOOR_FINISH = { vitrified: { set: 'vitrified', rough: 0.8 }, marble: { set: 'stone_tile', rough: 0.55 }, indian_marble: { set: 'stone_tile', rough: 0.7 },
  ceramic: { set: 'ceramic', rough: 1 }, antiskid: { set: 'ceramic', rough: 1.4 }, oak: { set: 'planks', rough: 1 }, walnut: { set: 'planks', rough: 0.9 }, vinyl: { set: 'planks', rough: 1.1 }, deck: { set: 'planks', rough: 1.2 } };
// which bundled texture a furniture surface uses, by its material role (ref = the texture's average colour, for tinting)
const SURFACE_TEX = { wood: { set: 'oak', ref: '#b38760', rough: 1 }, carve: { set: 'oak', ref: '#b38760', rough: 1 }, stone: { set: 'granite', ref: '#8c8c8c', rough: 0.25 } };
// a wood-toned colour (cabinet laminates get grain; white / painted shutters stay a smooth matte paint)
const woody = hex => { const [r, g, b] = hexToRgb(hex); return r > g && g > b && r - b > 0.14; };
function texTint(hex, ref) { const a = hexToRgb(hex), b = hexToRgb(ref); return '#' + a.map((v, i) => Math.round(255 * clamp(v / b[i], 0, 1)).toString(16).padStart(2, '0')).join(''); }
function texSet(name, o = {}) { const t = TEXSETS[name]; if (!t || !E) return null; const h = u => u ? E.texture(u) : null;
  return { B: h(t.B), M: h(t.M), N: h(t.N), world: !!t.world, dual: !!t.dual, ns: o.ns ?? t.ns ?? 1, uvx: o.uvx || [1, 1, 0] }; }
const MODEL3D = {
  // Glam Velvet Sofa — Wayfair LLC, CC-BY-4.0 (Khronos glTF-Sample-Assets). Fabric takes the room theme's colour.
  sofa_3: { url: 'assets/models/glam_velvet_sofa.glb', fit: 'stretch' },
  // Lamp with punctual lights — Khronos glTF-Sample-Assets, CC-BY-4.0. Kept in proportion, scaled to the item height.
  // A tripod lamp with a 0.6 m drum shade: footprint (fp, metres, at h) is wider than the old 0.4 m placeholder; the shade sits towards −x.
  floor_lamp: { url: 'assets/models/floor_lamp.glb', fit: 'uniform', h: 1.6, fp: [0.8, 0.6], shade: [-0.25, 0.65] },
  // Sheen Chair — Wayfair LLC, CC-BY-4.0 (Khronos glTF-Sample-Assets): a velvet lounge chair with a timber frame.
  armchair: { url: 'assets/models/sheen_chair.glb', fit: 'uniform' },
};
const modelFor = it => (S.gfxModels !== false && E && E.quality !== 'low') ? MODEL3D[it.type] : null;
function modelReady(spec) { const p = E.loadGLB(spec.url); return p.model || null; }
// build an item from its GLB model; false while the model is still downloading (or failed), so the procedural one is used meanwhile
function buildModelItem(g, it, room, pal, night) {
  const spec = modelFor(it); if (!spec) return false; const m = modelReady(spec); if (!m) return false;
  if (it.type === 'sofa_3') {
    const kx = it.w / m.size[0], kz = it.d / m.size[2], H = m.size[1] * (kx + kz) / 2;
    const fab = mixHex(pal.fabric, '#efe6d6', 0.55), shc = mixHex(fab, '#ffffff', 0.4); // a warm cream bouclé reads best in daylight
    E.modelParts(g, m, it.w, H, it.d, { mat: (mt, me) => /fabric/i.test(me.name) ? { color: fab, rough: 0.9, metal: 0, sheen: 0.28, sheenC: shc, tex: { N: mt.tN, O: mt.tO, ns: 0.35, uvx: [9, 9, 0.4] } }
      : /feet/i.test(me.name) ? { color: '#c9a46a', metal: 0.9, rough: 0.32 } : { color: '#2a241f', metal: 0, rough: 0.45 } });
    g.modelH = H; return true;
  }
  if (it.type === 'armchair') {
    const fab = mixHex(pal.fabric, '#d9c7ad', 0.5);
    E.modelParts(g, m, it.w * 0.98, 99, it.d * 0.98, { uniform: true, skip: me => /label/i.test(me.name),
      mat: (mt, me) => /fabric/i.test(me.name) ? { color: fab, rough: 0.9, metal: 0, sheen: 0.3, sheenC: mixHex(fab, '#ffffff', 0.4), tex: { N: mt.tN, O: mt.tO, ns: 0.4, uvx: mt.uvx || [1, 1, 0] } }
        : /wood/i.test(me.name) ? { color: '#c79a6a', rough: 0.55, metal: 0 } : { color: '#2b2a28', metal: 0.8, rough: 0.4 } });
    return true;
  }
  if (it.type === 'floor_lamp') {
    const fp = spec.fp || [0, 0]; if (Math.min(it.w, it.d) < Math.min(...fp) - 0.01 || Math.max(it.w, it.d) < Math.max(...fp) - 0.01) return false;
    const on = room.lights?.ambient !== false;
    E.modelParts(g, m, 99, it.h, 99, { uniform: true, skip: me => me.mat.alphaMode === 'BLEND',
      mat: mt => mt.transmission ? { color: '#fbf1dc', alpha: 0.96, rough: 0.8, emissive: on ? (night ? '#ffd8a0' : '#b88d5a') : '#000000', cast: false, tex: { N: null } }
        : { emissive: '#000000' } });
    return true;
  }
  return false;
}
function roundSlabGeo(w, d, h, r, bev = 0.01) { return E.custom(`rslab:${[w, d, h, r, bev].map(v => v.toFixed(3)).join(':')}`, () => {
  r = Math.min(r, w / 2 - 1e-4, d / 2 - 1e-4); bev = Math.min(bev, h / 3); const seg = 10, O = [];
  [[w / 2 - r, d / 2 - r, 0], [-(w / 2 - r), d / 2 - r, Math.PI / 2], [-(w / 2 - r), -(d / 2 - r), Math.PI], [w / 2 - r, -(d / 2 - r), 1.5 * Math.PI]]
    .forEach(([cx, cz, a0]) => { for (let i = 0; i <= seg; i++) { const a = a0 + i / seg * Math.PI / 2; O.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r, Math.cos(a), Math.sin(a)]); } });
  const rings = [[h, bev, 0.75], [h - bev, 0, 0], [bev, 0, 0], [0, bev, -0.75]], P = [], N = [], U = [];
  const vtx = (o, rg) => { const [y, ins, ny] = rings[rg]; const n = V3.norm([o[2] * (1 - Math.abs(ny)), ny, o[3] * (1 - Math.abs(ny))]); return [[o[0] - o[2] * ins, y, o[1] - o[3] * ins], n]; };
  const tri = (a, b, c) => [a, b, c].forEach(([q, n]) => { P.push(...q); N.push(...n); U.push(0, 0); });
  for (let i = 0; i < O.length; i++) { const A = O[i], B = O[(i + 1) % O.length];
    tri([[0, h, 0], [0, 1, 0]], [vtx(B, 0)[0], [0, 1, 0]], [vtx(A, 0)[0], [0, 1, 0]]); tri([[0, 0, 0], [0, -1, 0]], [vtx(A, 3)[0], [0, -1, 0]], [vtx(B, 3)[0], [0, -1, 0]]);
    for (let k = 0; k < 3; k++) { const a0 = vtx(A, k), b0 = vtx(B, k), a1 = vtx(A, k + 1), b1 = vtx(B, k + 1); tri(a0, b0, b1); tri(a0, b1, a1); } }
  return { pos: P, nor: N, uv: U }; }); }
// a flat quad with 0..1 uvs (rugs, mats), top face only
function planeGeo(w, d) { return E.custom(`plane:${w.toFixed(3)}:${d.toFixed(3)}`, () => { const x = w / 2, z = d / 2;
  return { pos: [-x, 0, z, x, 0, z, x, 0, -z, -x, 0, z, x, 0, -z, -x, 0, -z], nor: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], uv: [0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0] }; }); }
// a pleated curtain panel: soft vertical folds, uv in metres/0.4 so the linen weave keeps its real scale
function pleatGeo(w, h, amp = 0.035, seed = 1) { return E.custom(`pleat:${w.toFixed(3)}:${h.toFixed(3)}:${amp}:${seed}`, () => {
  const n = Math.max(16, Math.round(w / 0.012)), rows = 14, rnd = seeded('pleat' + seed + w.toFixed(2)), folds = Math.max(3, Math.round(w / 0.1));
  const ph = Array.from({ length: 4 }, () => rnd() * 6.28), fq = [1, 1.9 + rnd() * 0.4, 3.3 + rnd() * 0.6], wt = [1, 0.35 + rnd() * 0.2, 0.15];
  // fold depth along the width: a main wave plus two irregular ones; folds open out slightly towards the hem
  const z = (x, y) => { const t = x / w, k = 1 + 0.35 * (1 - y / h); let v = 0; for (let j = 0; j < 3; j++) v += Math.sin(t * folds * Math.PI * 2 * fq[j] / fq[0] + ph[j] * (j ? 1 : 0)) * wt[j]; return v * amp * k / 1.3; };
  const P = [], N = [], U = [], at = (i, r) => { const x = (i / n - 0.5) * w, y = r / rows * h, e = 0.004; const zz = z(x + w / 2, y), dx = (z(x + w / 2 + e, y) - z(x + w / 2 - e, y)) / (2 * e), dy = (z(x + w / 2, y + e) - z(x + w / 2, y - e)) / (2 * e);
    const L = Math.hypot(dx, dy, 1); return [[x, y, zz], [-dx / L, -dy / L, 1 / L], [(i / n) * w / 0.4, y / 0.4]]; };
  for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) { const a = at(i, r), b = at(i + 1, r), c = at(i + 1, r + 1), d = at(i, r + 1);
    [a, b, c, a, c, d].forEach(q => { P.push(...q[0]); N.push(...q[1]); U.push(...q[2]); }); }
  return { pos: P, nor: N, uv: U }; }); }
// living rooms: size the rug to the room and seat it under the sofa's front legs; stand the floor lamp at a sofa end,
// clear of doors, walls and other furniture
function stageLiving(room, floor = floorOfRoom(room)) {
  if (room.type !== 'living') return; const F = room.furniture, sofa = F.find(i => /^sofa/.test(i.type)); if (!sofa) return;
  const a = ((sofa.rot % 360) + 360) % 360, r = a * Math.PI / 180, fw = [Math.sin(r), Math.cos(r)], side = [Math.cos(r), -Math.sin(r)];
  const swings = roomOpenings(room, floor).filter(o => o.kind === 'door').map(o => doorSwingRect(room, o));
  const inRoom = (fp, m = 0.12) => fp.x >= room.x + m && fp.y >= room.y + m && fp.x + fp.w <= room.x + room.w - m && fp.y + fp.d <= room.y + room.d - m;
  const free = (fp, skip) => !swings.some(s => rectOverlap(s, fp) > 0.0001) && !F.some(o => o !== skip && !CATALOG[o.type].flat && rectOverlap(itemFootprint(o), fp) > 0.0001);
  const rug = F.find(i => i.type === 'rug'), table = F.find(i => i.type === 'coffee_table');
  if (rug) {
    const along = a === 90 || a === 270 ? room.d : room.w, across = a === 90 || a === 270 ? room.w : room.d;
    const front = 0.18, reach = table ? Math.hypot(table.x - sofa.x, table.y - sofa.y) + table.d / 2 + 0.55 : 1.6;
    const W = r2(clamp(sofa.w + 0.5, 1.6, along - 0.8)), D = r2(clamp(reach - sofa.d / 2 + front, 1.2, Math.min(2.2, across - sofa.d - 0.3)));
    const c = sofa.d / 2 - front + D / 2;
    const cand = Object.assign({}, rug, { w: W, d: D, rot: a === 90 || a === 270 ? 90 : 0, x: r2(sofa.x + fw[0] * c), y: r2(sofa.y + fw[1] * c) });
    if (inRoom(itemFootprint(cand), 0.25)) Object.assign(rug, cand);
  }
  const lamp = F.find(i => i.type === 'floor_lamp');
  const was = lamp && { w: lamp.w, d: lamp.d, h: lamp.h };
  // the full-size lamp only where the room has space for it
  if (lamp && S.gfxModels !== false && MODEL3D.floor_lamp.fp && Math.min(room.w, room.d) >= 3.2) { lamp.w = MODEL3D.floor_lamp.fp[0]; lamp.d = MODEL3D.floor_lamp.fp[1]; lamp.h = MODEL3D.floor_lamp.h; }
  if (lamp) { // nearest free spot beside either end of the sofa, preferring the back corner (reading-lamp position)
    const back = -sofa.d / 2 + lamp.d / 2 + 0.14; let best = null;
    for (const sg of [-1, 1]) for (let so = 0; so <= 0.61; so += 0.05) for (let fo = 0; fo <= sofa.d + 0.2; fo += 0.02) {
      const off = sofa.w / 2 + lamp.w / 2 + 0.06 + so, along = back + fo;
      const cand = Object.assign({}, lamp, { x: r2(sofa.x + side[0] * off * sg + fw[0] * along), y: r2(sofa.y + side[1] * off * sg + fw[1] * along), rot: (a + (sg > 0 ? 0 : 180)) % 360 }); // shade leans over the sofa
      const fp = itemFootprint(cand); if (!inRoom(fp) || !free(fp, lamp)) continue;
      const cost = so + fo * 1.4; if (!best || cost < best.cost) best = { cost, cand }; }
    if (best) Object.assign(lamp, best.cand); else Object.assign(lamp, was); // no room for the full-size lamp: keep the original item
  }
}
/* The duplex showcase living room: the window behind the sofa becomes a floor-to-ceiling glass wall (same wall, same
   position, kept clear of the main door) opening onto a timber deck with a frameless glass balustrade. */
function stageShowcase() {
  const f = P().floors.find(x => (x.level || 0) === 0) || P().floors[0], lr = f.rooms.find(r => r.type === 'living'); if (!lr) return;
  const sofa = lr.furniture.find(i => /^sofa/.test(i.type)); if (!sofa) return;
  const a0 = ((sofa.rot % 360) + 360) % 360, side = a0 === 0 ? 'N' : a0 === 180 ? 'S' : a0 === 90 ? 'W' : 'E'; if (side !== 'N' && side !== 'S') return;
  const wy = side === 'N' ? lr.y : lr.y + lr.d, onWall = o => o.o === 'h' && Math.abs(o.y - wy) < 0.05 && o.x > lr.x && o.x < lr.x + lr.w;
  const w = f.windows.find(onWall); if (!w) return;
  let a = lr.x + 0.4, b = lr.x + lr.w - 0.4;
  f.doors.filter(onWall).forEach(d => { if (d.x < w.x) a = Math.max(a, d.x + d.w / 2 + 0.2); else b = Math.min(b, d.x - d.w / 2 - 0.2); });
  b = Math.min(b, sofa.x + sofa.w / 2 + 0.12); a = Math.max(a, Math.min(a + 0.01, sofa.x - sofa.w / 2 - 0.12));
  if (b - a < 1.2) return;
  Object.assign(w, { x: r2((a + b) / 2), w: r2(b - a), sill: 0.06, h: r2(f.height - 0.06 - 0.3) });
  P().deck = { floor: f.id, side, a: r2(a - 0.15), b: r2(Math.min(lr.x + lr.w - 0.1, b + 0.9)), depth: 1.5, y: wy };
}
// timber deck + glass balustrade outside the showcase glass wall (drawn with the site)
function buildDeck() {
  const dk = P().deck; if (!dk) return; const f = P().floors.find(x => x.id === dk.floor); if (!f || !showFloorIn3D(f, FL())) return;
  const g = E.addGroup('deck', { kind: 'site', y: floorY(f) }); const s = dk.side === 'N' ? -1 : 1, z0 = dk.y + s * WALL_T / 2, zc = z0 + s * dk.depth / 2, len = dk.b - dk.a, xc = (dk.a + dk.b) / 2, ground = -plinthH() - 0.05;
  const pl = E.quality !== 'low' ? { color: '#a98463', tex: texSet('planks'), patScale: 1.2, rough: 1 } : { color: '#8d6a4c', color2: '#5c4330', pattern: 1, patScale: 0.14 };
  E.part(g, Object.assign({ geo: E.geo('box', len, 0.05, dk.depth), x: xc, y: FLOOR_TOP - 0.06, z: zc }, pl));
  E.part(g, { geo: E.geo('box', len - 0.1, FLOOR_TOP - 0.06 - ground, dk.depth - 0.1), x: xc, y: ground, z: zc - s * 0.02, color: '#8f8a83', color2: '#77726b', pattern: 6, patScale: 0.5 });
  const rail = (x, z, L, along) => { const gw = along ? L : 0.012, gd = along ? 0.012 : L;
    E.part(g, { geo: E.geo('box', gw, 0.95, gd), x, y: FLOOR_TOP - 0.01, z, color: '#9fb4b8', pattern: 15, alpha: 0.16, cast: false });             // frameless glass
    E.part(g, { geo: E.geo('rbox', along ? L : 0.045, 0.04, along ? 0.045 : L, 0.012), x, y: FLOOR_TOP + 0.94, z, color: '#2b2c2e', metal: 0.85, rough: 0.35 }); // steel cap rail
    E.part(g, { geo: E.geo('box', along ? L : 0.06, 0.06, along ? 0.06 : L), x, y: FLOOR_TOP - 0.02, z, color: '#2b2c2e', metal: 0.7, rough: 0.4 }); };       // base shoe
  rail(xc, z0 + s * (dk.depth - 0.05), len, true); rail(dk.a + 0.03, zc, dk.depth - 0.1, false); rail(dk.b - 0.03, zc, dk.depth - 0.1, false);
  if (E.quality !== 'low') { const pot = (x) => { E.part(g, { geo: roundSlabGeo(0.42, 0.42, 0.5, 0.21, 0.01), x, y: FLOOR_TOP - 0.01, z: z0 + s * (dk.depth - 0.35), color: '#d9d2c6', rough: 0.6, noCull: true }); bush(g, x, z0 + s * (dk.depth - 0.35), 0.55, 7 + x, FLOOR_TOP + 0.45); };
    pot(dk.a + 0.35); pot(dk.b - 0.35); }
}
/* ---- the city block around the plot (v3.7) ----------------------------------------------------------------------------
   Laid out in the plot's own street frame: u runs along the road, v outwards from the plot's front edge (the road side).
   Street section: own footpath 0–1.2 m, kerb, 6 m asphalt carriageway, kerb, far footpath 7.2–9.0 m, then the plots
   across the road. Neighbour plots continue on both sides of this one and behind it; a cross street closes the block,
   low-rise apartments and a small shopping centre sit farther out. Everything is seeded from the project id, so it is
   identical on every rebuild, and kept out of the street-view camera's line of sight. */
function buildNeighbourhood() {
  const g = E.addGroup('neighbourhood', { kind: 'site', y: -plinthH() }), rnd = seeded('nbh' + (P().example === 'duplex' ? 'dimora-duplex' : P().id || P().name || ''));
  const frame = E.siteWalk.frame;
  const { horizontal: horiz, width: Wu, depth: Dv, toWorld: toW } = frame;
  const G0 = -0.05, compact = E.quality === 'low' || matchMedia('(pointer: coarse)').matches;
  const B = (u, v, y, du, dv, h, m) => { const [x, z] = toW(u, v); return E.part(g, Object.assign({ geo: E.geo('box', horiz ? du : dv, h, horiz ? dv : du), x, y, z }, m)); };
  let fr = null; try { fr = exteriorFrame(); } catch (e) { }
  const blocks = (u, v, rad) => { if (!fr) return false; const [x, z] = toW(u, v), a = [fr.pos[0], fr.pos[2]], b = [fr.target[0], fr.target[2]], ab = [b[0] - a[0], b[1] - a[1]], L2 = ab[0] ** 2 + ab[1] ** 2 || 1;
    const t = clamp(((x - a[0]) * ab[0] + (z - a[1]) * ab[1]) / L2, -0.25, 1); return Math.hypot(x - a[0] - ab[0] * t, z - a[1] - ab[1] * t) < rad + 1.5 || Math.hypot(x - a[0], z - a[1]) < rad + 4; };
  const openings = E.siteWalk.openings;
  const mainOpening = openings.reduce((wide, next) => next[1] - next[0] > wide[1] - wide[0] ? next : wide, [0, 0]);
  const gateU = (mainOpening[0] + mainOpening[1]) / 2;
  const paint = c => ({ color: c, pattern: 10, rough: 0.92 }), PAL = ['#f1e3c6', '#f2d8bb', '#ece6da', '#dfe5d3', '#efe3ad', '#e9d4c8', '#d8e2e7', '#f3efe9', '#e8d4ab', '#e2d9ea'];
  const pave = { color: '#b9b2a6', pattern: 12, cast: false }, kerbM = { color: '#c9c5bc', rough: 0.8, cast: false };
  // --- street edge: footpaths, kerbs (dropped at the gate for the driveway), a concrete crossover
  B(0, 0.6, G0 - 0.03, 260, 1.2, 0.1, pave); B(0, 8.1, G0 - 0.03, 260, 1.8, 0.1, pave);
  const kerbRun = (v, a0, a1) => { if (a1 - a0 > 0.1) B((a0 + a1) / 2, v, G0 - 0.04, a1 - a0, 0.16, 0.16, kerbM); };
  let kerbStart = -130;
  for (const [a, b] of openings) {
    kerbRun(1.28, kerbStart, a - 0.16);
    kerbStart = b + 0.16;
    B((a + b) / 2, 0.70, G0 - 0.025, b - a + 0.30, 1.28, 0.08, { color: '#a9a49b', pattern: 8, patScale: 1.5, rough: 0.85, cast: false });
  }
  kerbRun(1.28, kerbStart, 130); kerbRun(7.12, -130, 130);
  const streetPaint = { color: '#c6c5b6', rough: 0.9, cast: false, maxDist: 90 };
  for (let u = -125; u < 128; u += 7.5) B(u, 4.2, G0 + 0.018, 2.5, 0.085, 0.005, streetPaint);
  for (let u = -74; u < 75; u += 14) {
    if (Math.abs(u - gateU) < 3.1) continue;
    B(u, 1.48, G0 + 0.018, 0.55, 0.27, 0.009, { color: '#3c3c38', rough: 0.9, cast: false, maxDist: 55 });
    if (!compact) for (let slot = -2; slot <= 2; slot++) B(u + slot * 0.083, 1.48, G0 + 0.028, 0.029, 0.20, 0.003, { color: '#68665e', cast: false, maxDist: 36 });
  }
  // --- cross streets closing the block on both sides
  const blockHalf = Wu / 2 + 3 * 12.5 + 1;
  E.siteWalk.streetLimit = Math.min(blockHalf + 9, 120);
  const mallU = Math.min(blockHalf + 39, 94), mallV = 33;
  E.siteWalk.mall = { u: mallU, v: mallV };
  [-1, 1].forEach(sg => { const uc = sg * (blockHalf + 3.5); B(uc, 20, G0 - 0.035, 7, 140, 0.05, { color: '#ffffff', tex: texSet('asphalt'), patScale: 3, rough: 0.92, cast: false });
    B(uc - sg * 4.4, 20, G0 - 0.03, 1.8, 140, 0.1, pave); B(uc + sg * 4.4, 20, G0 - 0.03, 1.8, 140, 0.1, pave); });
  // --- a house or apartment block, facade on the street side (f = +1: faces +v, f = -1: faces -v); far ones are simplified
  const building = (u, vFront, w, d, floors, f, opt = {}) => {
    const far = opt.far, H = floors * 3.1 + 0.5, vc = vFront - f * d / 2, col = opt.col || PAL[Math.floor(rnd() * PAL.length)], dark = mixHex(col, '#000000', 0.16);
    B(u, vc, G0, w, d, H, paint(col));
    for (let k = 1; k <= floors; k++) B(u, vc, G0 + k * 3.1 - 0.12, w + 0.08, d + 0.08, 0.16, { color: dark, rough: 0.8, cast: false, maxDist: far ? 0 : 160 });
    // terrace: parapet, stair head-room, water tank
    const pr = (du, dv, uo, vo) => B(u + uo, vc + vo, G0 + H, du, dv, 0.9, paint(col));
    pr(w, 0.18, 0, d / 2 - 0.09); pr(w, 0.18, 0, -d / 2 + 0.09); pr(0.18, d, w / 2 - 0.09, 0); pr(0.18, d, -w / 2 + 0.09, 0);
    if (!far) { B(u - w / 2 + 1.8, vc + f * d * 0.15, G0 + H, 2.6, 3.0, 2.5, paint(col)); const [tx, tz] = toW(u + w / 2 - 1.2, vc - f * d * 0.25);
      E.part(g, { geo: E.geo('cyl', 0.55, 1.15, 1, 14), x: tx, y: G0 + H + 0.05, z: tz, color: '#1c1d1f', rough: 0.55, maxDist: 140 }); }
    // street façade: windows with frames and sunshades per floor; balconies on the upper floors
    const nW = Math.max(2, Math.floor(w / (opt.apt ? 2.2 : 2.8))), fv = vFront + f * 0.03;
    const lintel = { color: mixHex(col, '#60605c', 0.16), pattern: 10, cast: false, maxDist: 90 };
    const glazing = { color: '#596c74', rough: 0.26, metal: 0.22, cast: false, maxDist: 135 };
    B(u, fv + f * 0.02, G0, w, 0.07, 0.38, { color: '#716a5e', pattern: 13, cast: false });
    if (!far) {
      const doorU = u + (opt.apt ? 0 : w * 0.13);
      B(doorU, vFront + f * 0.09, G0 + 0.15, 1.43, 0.13, 2.32, { color: '#4a3c32', pattern: 19, rough: 0.65, cast: false });
      B(doorU, vFront + f * 0.28, G0 + 0.02, 1.78, 0.64, 0.16, lintel);
      B(doorU, vFront + f * 0.31, G0 + 2.5, 1.9, 0.67, 0.10, lintel);
      const panelU = u - w * 0.33;
      B(panelU, fv + f * 0.05, G0 + 0.42, w * 0.16, 0.12, H - 0.7, { color: dark, pattern: opt.apt ? 10 : 13, cast: false });
    }
    for (let k = 0; k < floors; k++) { const y = G0 + k * 3.1 + 0.9;
      if (far) { B(u, fv, y, w - 1.2, 0.05, 1.3, { color: '#33404a', rough: 0.15, metal: 0.3, cast: false }); continue; }
      for (let i = 0; i < nW; i++) { const uu = u - w / 2 + (i + 0.5) * w / nW;
        B(uu, fv, y - 0.06, 1.42, 0.06, 1.42, { color: '#f4f2ee', rough: 0.6, cast: false, maxDist: 120 });
        B(uu, fv + f * 0.02, y, 1.3, 0.05, 1.3, glazing);
        if (!compact) {
          const warm = isNight() && (i + k + Math.round(u)) % 3 === 0;
          B(uu + 0.25, fv + f * 0.052, y + 0.04, 0.39, 0.016, 1.21, { color: warm ? '#e7cfa8' : '#8a8c80', emissive: warm ? '#85663f' : '#000000', rough: 0.9, cast: false, maxDist: 76 });
          B(uu, fv + f * 0.07, y, 0.043, 0.042, 1.3, { color: '#555853', cast: false, maxDist: 90 });
          B(uu, fv + f * 0.096, y - 0.09, 1.55, 0.24, 0.07, lintel);
        }
        B(uu, vFront + f * 0.3, y + 1.55, 1.7, 0.6, 0.08, { color: '#e9e5dd', rough: 0.7, maxDist: 120 });
        if (!opt.apt) B(uu, vFront - f * (d + 0.03), y, 1.1, 0.05, 1.2, { color: '#2f3b44', rough: 0.08, metal: 0.35, cast: false, maxDist: 120 }); }   // rear windows
      const nS = Math.max(1, Math.floor(d / (compact ? 5.5 : 3.6))); for (let j = 0; j < nS; j++) { const vv = vFront - f * (j + 0.5) * d / nS; [-1, 1].forEach(sd => {   // side windows (Indian plots see each other's sides)
        B(u + sd * (w / 2 + 0.03), vv, y - 0.06, 0.06, 1.12, 1.32, { color: '#f4f2ee', rough: 0.6, cast: false, maxDist: 110 });
        B(u + sd * (w / 2 + 0.05), vv, y, 0.05, 1.0, 1.2, { color: '#2f3b44', rough: 0.08, metal: 0.35, cast: false, maxDist: 110 }); }); }
      if (k >= 1 && (opt.apt || k === 1)) { const bw = opt.apt ? w * 0.9 : w * 0.42, bu = opt.apt ? u : u + w * 0.22, by = G0 + k * 3.1 - 0.1;
        B(bu, vFront + f * 0.65, by, bw, 1.3, 0.16, { color: '#e2ded6', rough: 0.7, maxDist: 160 });
        B(bu, vFront + f * 1.28, by + 0.16, bw, 0.05, 0.9, { color: '#25272a', alpha: 0.55, rough: 0.5, cast: false, maxDist: 110 });          // perforated metal screen
        B(bu, vFront + f * 1.28, by + 1.04, bw + 0.04, 0.06, 0.05, Object.assign({ maxDist: 110 }, POWDER_COAT)); } }
    if (opt.wall) { const wv = opt.wall; B(u - opt.pw / 4 - 0.9, wv, G0, opt.pw / 2 - 1.8, 0.2, 1.45, paint('#e4ddd0')); B(u + opt.pw / 4 + 0.9, wv, G0, opt.pw / 2 - 1.8, 0.2, 1.45, paint('#e4ddd0'));
      B(u, wv, G0, 3.4, 0.06, 1.35, Object.assign({ maxDist: 100 }, POWDER_COAT)); }
  };
  const lot = (u, v, rad) => !blocks(u, v, rad);
  // same side: three plots on each side of this one, same depth, houses set back 3 m behind their compound walls
  [-1, 1].forEach(sg => { let u0 = sg * Wu / 2;
    for (let k = 0; k < 3; k++) { const pw = 11 + rnd() * 2.5, uc = u0 + sg * pw / 2, hw = pw - 3, hd = clamp(Dv - 6, 4.8, 14), fl = rnd() < 0.55 ? 2 : 3;
      B(u0 + sg * pw, -Dv / 2, G0, 0.2, Dv, 1.8, paint('#e4ddd0'));                                                            // party wall between plots
      if (lot(uc, -3 - hd / 2, Math.max(hw, hd) * 0.6)) building(uc, -3, hw, hd, fl, 1, { wall: -0.1, pw });
      else B(uc, -0.1, G0, pw - 0.4, 0.2, 1.45, paint('#e4ddd0'));
      if (k === 0 && rnd() < 0.7) tree(g, uc + sg * (pw / 2 - 1.6), -1.6, 0.35, 70 + k, null, rnd() < 0.5 ? 'palm' : 'ashoka');
      u0 += sg * pw; } });
  // across the road: houses, one low-rise apartment block, street trees on the far footpath, parked cars
  { let u = -Wu / 2 - 30, slot = 0; const aptAt = Math.floor(rnd() * 2) + 3;
    while (u < Wu / 2 + 30) { const apt = slot === aptAt, pw = apt ? 26 : 11 + rnd() * 3, hw = pw - 3, hd = apt ? 15 : 12, fl = apt ? 5 : (rnd() < 0.5 ? 2 : 3), uc = u + pw / 2;
      if (lot(uc, 12 + hd / 2, Math.max(hw, hd) * 0.6)) building(uc, 12, hw, hd, fl, -1, { apt, wall: 9.2, pw }); else B(uc, 9.2, G0, pw - 0.4, 0.2, 1.45, paint('#e4ddd0'));
      B(u, 18, G0, 0.2, 17, 1.8, paint('#e4ddd0')); u += pw; slot++; } }
  // behind: the next row of houses, facing the back lane
  { let u = -Wu / 2 - 18; while (u < Wu / 2 + 18) { const pw = 11 + rnd() * 3, uc = u + pw / 2; if (lot(uc, -Dv - 9, 7)) building(uc, -Dv - 15, pw - 3, 12, rnd() < 0.5 ? 2 : 3, -1, { wall: -Dv - 17.7, pw }); B(u, -Dv - 9, G0, 0.2, 17, 1.8, paint('#e4ddd0')); u += pw; } }
  // the wider city: low-rise apartments, a small shopping centre with its parking, kept simple (they sit in the haze)
  [[-1, 52, 24, 16, 7], [1, 58, 30, 18, 8], [-1, -Dv - 46, 26, 16, 6], [1, -Dv - 52, 22, 16, 7], [-1, 96, 28, 18, 9]].forEach(([sg, v, w, d, fl], i) => {
    const u = sg * (blockHalf * 0.6 + 18 + i * 9); if (lot(u, v, w)) building(u, v + (v > 0 ? 0 : d), w, d, fl, v > 0 ? -1 : 1, { apt: true, far: true }); });
  { const mu = mallU, mv = mallV, mw = 42, md = 25;
    B(mu, mv + md / 2, G0, mw, md, 13.5, { color: '#dfe2e4', rough: 0.6 });
    const mallGlass = { color: '#42545b', rough: 0.18, metal: 0.3, cast: false };
    B(mu, mv - 0.04, G0 + 0.4, mw - 4, 0.08, 8.1, mallGlass);
    B(mu, mv - 0.10, G0 + 8.65, mw - 4, 0.22, 2.6, { color: '#a88f74', pattern: 13, cast: false });
    for (let bay = -5; bay <= 5; bay++) {
      const u = mu + bay * 3.45;
      B(u, mv - 0.17, G0 + 0.15, 0.15, 0.35, 8.4, { color: '#2f3333', cast: false });
      B(u + 1.65, mv - 0.15, G0 + 0.45, 2.68, 0.04, 2.7, { color: bay % 2 === 0 ? '#a99172' : '#7f8377', rough: 0.5, cast: false });
      B(u + 1.65, mv - 0.16, G0 + 3.26, 2.65, 0.06, 0.57, { color: bay % 2 === 0 ? '#c6b58d' : '#333b38', cast: false });
    }                       // glazed shopfronts / atrium
    B(mu, mv - 1.5, G0 + 4.2, mw + 1, 3.0, 0.4, { color: '#f2f2f0', rough: 0.5 });                                                  // entrance canopy
    B(mu, mv + md / 2, G0 + 13.5, mw * 0.4, md * 0.4, 2.2, { color: '#b9bcbf', rough: 0.7 });                                     // plant room
    B(mu, mv - 10, G0 - 0.03, mw, 18, 0.06, { color: '#ffffff', tex: texSet('asphalt'), patScale: 3, rough: 0.92, cast: false });
    B(mu, mv - 1.6, G0 - 0.015, mw, 3.2, 0.09, pave);
    for (let i = -5; i <= 5; i++) B(mu + i * 3, mv - 11, G0 + 0.031, 0.075, 5, 0.004, streetPaint);
    for (let i = 0; i < (compact ? 2 : 4); i++) {
      const [x, z] = toW(mu - 13.5 + i * 9, mv - 11);
      buildCar('mall' + i, x, z, horiz ? 0 : Math.PI / 2, ['#c8ccd0', '#7d1f22', '#2a2d33', '#43566b'][i], -plinthH() - 0.03);
    }
  }
  // street lights on both footpaths (lamps glow after dusk), trees on the far footpath, a few parked cars
  const night = isNight();
  for (let u = -60; u <= 60; u += 24) [[1.0, 1], [7.7, -1]].forEach(([v, dir]) => { const uu = u + (dir < 0 ? 12 : 0); if (dir > 0 && Math.abs(uu - gateU) < 4) return; if (blocks(uu, v, 1)) return;
    const [x, z] = toW(uu, v); E.part(g, { geo: E.geo('cyl', 0.07, 7.2, 0.6, 10), x, y: G0, z, color: '#55595d', rough: 0.5, metal: 0.4, maxDist: 150 });
    B(uu, v + dir * 0.75, G0 + 7.05, 0.07, 1.5, 0.07, { color: '#55595d', rough: 0.5, metal: 0.4, maxDist: 150 });
    const [hx, hz] = toW(uu, v + dir * 1.45); E.part(g, { geo: E.geo('rbox', horiz ? 0.28 : 0.55, 0.12, horiz ? 0.55 : 0.28, 0.04), x: hx, y: G0 + 6.95, z: hz, color: night ? '#fff1d6' : '#d9dadb', emissive: night ? '#ffd9a0' : '#000000', rough: 0.3, maxDist: 150 }); });
  for (let u = -58, i = 0; u <= 58; u += 13, i++) {
    if (blocks(u, 8.5, 3)) continue;
    B(u, 8.5, G0 + 0.047, 1.10, 0.95, 0.045, { color: '#6b573d', pattern: 8, rough: 0.98, cast: false });
    tree(g, ...toW(u, 8.5), 0.32 + rnd() * 0.42, 90 + i, null, i % 3 === 1 ? 'ashoka' : 'neem');
    E.siteWalk.obstacles.push({ u, v: 8.5, w: 0.34, d: 0.34 });
  }
  [[-Wu / 2 - 9, '#b8bcc0'], [Wu / 2 + 14, '#7c1d20'], [Wu / 2 + 31, '#ece9e3']].forEach(([u, col], i) => {
    if (blocks(u, 6.1, 3) || Math.abs(u - gateU) < 5) return;
    const [x, z] = toW(u, 6.1);
    buildCar('park' + i, x, z, horiz ? Math.PI / 2 : 0, col, -plinthH() - 0.035);
    E.siteWalk.obstacles.push({ u, v: 6.1, w: 2.3, d: 0.94 });
  });
}
/* lawn: instanced-style grass blades in the plot's planted areas, built in 4 m chunks that are only drawn near the
   camera (the textured lawn carries the distance). Paving, the house, yards, paths and the gate drive stay clear. */
function buildGrass(r) {
  if (E.quality === 'low') return; const hb = houseBounds(); if (!hb) return;
  const f0 = P().floors.find(f => (f.level || 0) === 0) || P().floors[0], hard = [{ x: hb.x - 1.0, y: hb.y - 1.0, w: hb.w + 2.0, d: hb.d + 2.0 }];
  f0.rooms.filter(x => isYard(x) && x.type !== 'garden').forEach(x => hard.push({ x: x.x - 0.2, y: x.y - 0.2, w: x.w + 0.4, d: x.d + 0.4 }));
  const front = r.side, d = r.door, gate = r.gate;
  if (d) { const t = d.o === 'h' ? d.x : d.y; hard.push(front === 'N' || front === 'S' ? { x: t - 1.0, y: r.z0 - 1, w: 2.0, d: r.z1 - r.z0 + 2 } : { x: r.x0 - 1, y: t - 1.0, w: r.x1 - r.x0 + 2, d: 2.0 }); }
  if (gate != null) hard.push(front === 'N' || front === 'S' ? { x: gate - 2.2, y: front === 'N' ? r.z0 - 1 : r.z1 - 4, w: 4.4, d: 5 } : { x: front === 'W' ? r.x0 - 1 : r.x1 - 4, y: gate - 2.2, w: 5, d: 4.4 });
  const dk = P().deck; if (dk) hard.push({ x: dk.a - 0.3, y: Math.min(dk.y, dk.y + (dk.side === 'N' ? -1 : 1) * (dk.depth + 0.3)), w: dk.b - dk.a + 0.6, d: dk.depth + 0.6 });
  const ok = (x, z) => x > r.x0 + 0.3 && x < r.x1 - 0.3 && z > r.z0 + 0.3 && z < r.z1 - 0.3 && !hard.some(q => x > q.x && x < q.x + q.w && z > q.y && z < q.y + q.d);
  const g = E.addGroup('grass', { kind: 'site', y: -plinthH() }), C = 4, tones = ['#5b7237', '#697f43', '#849052', '#4d6635'];
  const density = E.quality === 'high' ? 14 : 8;
  const revision = hashId(JSON.stringify(hard));
  for (let x0 = r.x0; x0 < r.x1; x0 += C) for (let z0 = r.z0; z0 < r.z1; z0 += C) {
    const rnd = seeded('grass' + x0.toFixed(1) + ':' + z0.toFixed(1)), parts = tones.map(() => ({ P: [], N: [], U: [] }));
    for (let i = 0; i < C * C * density; i++) { const x = x0 + rnd() * C, z = z0 + rnd() * C; if (!ok(x, z)) continue;
      for (let b2 = 0; b2 < 5; b2++) { const a = rnd() * 6.28, h = 0.035 + rnd() * rnd() * 0.12, w = 0.005 + rnd() * 0.006, lean = 0.02 + rnd() * 0.06, la = rnd() * 6.28;
        const bx = x + (rnd() - 0.5) * 0.08, bz = z + (rnd() - 0.5) * 0.08, px = Math.cos(a) * w, pz = Math.sin(a) * w, T = parts[Math.floor(rnd() * tones.length)];
        const n = V3.norm([Math.cos(la) * 0.35, 1, Math.sin(la) * 0.35]), cl = Math.cos(la), sl = Math.sin(la), y0 = -0.05;
        // a blade in two segments: straight lower half, tip bending away (tapers to a point)
        const m0 = [bx - px * 0.75 + cl * lean * 0.3, y0 + h * 0.55, bz - pz * 0.75 + sl * lean * 0.3], m1 = [bx + px * 0.75 + cl * lean * 0.3, y0 + h * 0.55, bz + pz * 0.75 + sl * lean * 0.3], tip = [bx + cl * lean, y0 + h, bz + sl * lean];
        [[bx - px, y0, bz - pz], [bx + px, y0, bz + pz], m1, [bx - px, y0, bz - pz], m1, m0, m0, m1, tip].forEach(q => { T.P.push(...q); T.N.push(...n); T.U.push(0, 0); }); } }
    const ccx = x0 + C / 2, ccz = z0 + C / 2;
    parts.forEach((T, k) => { if (!T.P.length) return; const key = `grass:${revision}:${density}:${x0.toFixed(1)}:${z0.toFixed(1)}:${k}`;
      for (let q = 0; q < T.P.length; q += 3) { T.P[q] -= ccx; T.P[q + 2] -= ccz; }
      E.part(g, { geo: E.custom(key, () => ({ pos: T.P, nor: T.N, uv: T.U })), x: ccx, y: 0, z: ccz, color: tones[k], rough: 0.8, noCull: true, cast: false, maxDist: E.quality === 'high' ? 32 : 23 }); });
  }
  // soft contact shadow where the house meets the ground (wall bases, under the plinth projection)
  const m = 0.9; E.part(g, { geo: planeGeo(hb.w + 2 * m, hb.d + 2 * m), x: hb.x + hb.w / 2, y: -0.012, z: hb.y + hb.d / 2, pattern: 26, patScale: m / (hb.w / 2 + m), color2: '#' + Math.round(255 * m / (hb.d / 2 + m)).toString(16).padStart(2, '0') + '0000', alpha: 0.42, cast: false });
}
function buildItem(it, room, yOff = floorY(floorOfRoom(room))) {
  const c = CATALOG[it.type]; if (!c) return;
  const g = E.addGroup('item:' + it.id, { kind: 'item', ref: it.id, x: it.x, y: yOff + FLOOR_TOP, z: it.y, rot: it.rot * Math.PI / 180 });
  const pal = palette(room, it), th = roomTheme(room); const night = isNight() && room.lights?.ambient !== false;
  if (!c.flat && it.h > 0.3 && !c.mount && E.quality !== 'low') // soft contact shadow under free-standing furniture
    E.part(g, { geo: planeGeo(it.w + 0.3, it.d + 0.3), y: 0.014, pattern: 25, alpha: it.type === 'floor_lamp' ? 0.3 : 0.42, cast: false });
  if (buildModelItem(g, it, room, pal, night)) { g.pick = { w: it.w, d: it.d, h: Math.max(0.05, g.modelH || it.h) }; return g; }
  c.build(it.w, it.d, it.h).forEach(p => {
    if (th.print && !it.color && (PRINTED[p.role] || []).includes(it.type)) p = Object.assign({}, p, { pattern: 20, c2: th.print });
    if (p.role === 'carve') p = Object.assign({}, p, { c2: mixHex(pal.carve, '#000000', 0.45) });
    let col = p.role.startsWith('c:') ? p.role.slice(2) : (pal[p.role] || '#999999');
    const geo = p.k === 'rslab' ? roundSlabGeo(p.w, p.d, p.h, p.r, p.bev ?? 0.012) : p.k === 'plane' ? planeGeo(p.w, p.d) : p.k === 'box' ? boxGeo(p) : p.k === 'cyl' ? E.geo('cyl', p.r, p.h, p.c || 1, 16) : E.geo('sph', p.r, 14);
    if (p.tex && E.quality !== 'low') { const ts = TEXSETS[p.tex]; // image-textured surface (oak, wool rug…)
      const tex = texSet(p.tex, { uvx: p.tex === 'rug' ? [p.w * 5, p.d * 5, 0] : [1, 1, 0] });
      E.part(g, { geo, x: p.x, y: p.y, z: p.z, ry: p.ry || 0, sy: p.sy || 1, color: p.tint || (p.tex === 'oak' ? mixHex('#ffffff', col, 0.18) : p.tex === 'rug' ? mixHex('#ffffff', col, 0.22) : '#ffffff'), tex, patScale: ts.scale || 1,
        rough: ts.rough ?? (p.tex === 'oak' ? 1 : 0.95), metal: 0, cast: !c.flat, sheen: p.tex === 'rug' ? 0.5 : 0, sheenC: '#fff4e6', noCull: p.k === 'rslab' });
      return; }
    const em = p.role === 'lamp' ? (night ? '#ffd9a0' : '#3a3428') : p.role === 'led' ? mixHex(pal.accent, '#ffffff', 0.2) : p.role === 'diya' ? '#ff9a2e' : p.role === 'screen' ? '#0a0e14' : '#000000';
    const m = ROLE_MAT[p.role] || {};
    if (p.k === 'plane') return;
    const bedding = /bed|diwan/.test(it.type) && (p.role === 'white' || p.role === 'fabric2'); // pillows, duvets: woven cotton, not plastic
    let pat = p.pattern || m.pattern || (p.role === 'fabric' || p.role === 'rug2' || p.role === 'seat' || p.role === 'headboard' || bedding ? 4 : 0), weave = null;
    if (pat === 4 && E.quality !== 'low') { pat = 0; weave = texSet('weave'); } // upholstery: a fine woven normal map (smooth at a distance) instead of the noisy procedural speckle
    const hi = E.quality !== 'low', big = Math.max(p.w || 0, p.d || 0, p.h || 0) > 0.06;
    // timber, laminate and stone surfaces: real-scale grain / veining tinted to the theme colour; grain runs vertically on
    // door and carcass panels that stand taller than they are wide (wardrobes, tall units, cabinet shutters)
    let sm = !pat && hi ? SURFACE_TEX[p.role] : null;
    if (!pat && hi && p.role === 'cabinet' && woody(col)) sm = { set: 'laminate', ref: TEXSETS.laminate.ref, rough: 0.9 };
    if (sm && big) { const vert = (p.h || 0) > Math.max(p.w || 0, p.d || 0) * 1.15 && sm.set !== 'granite';
      E.part(g, { geo, x: p.x, y: p.y, z: p.z, ry: p.ry || 0, rx: p.rx || 0, rz: p.rz || 0, sy: p.sy || 1, color: texTint(col, sm.ref), tex: texSet(sm.set, { uvx: [1, 1, vert ? Math.PI / 2 : 0] }), patScale: TEXSETS[sm.set].scale || 1, rough: sm.rough, metal: 0, cast: !c.flat });
      return; }
    // appliance steel and exposed metal: a fine brushed grain so highlights stretch along it; handles stay polished
    if (!pat && hi && big && (p.role === 'appliance' || p.role === 'metal')) { const [r0, g0, b0] = hexToRgb(col), grey = Math.abs(r0 - g0) < 0.05 && Math.abs(g0 - b0) < 0.06, L = (r0 + g0 + b0) / 3;
      if (grey && L > 0.45 && L < 0.9 && (p.role === 'metal' || L < 0.82)) { E.part(g, { geo, x: p.x, y: p.y, z: p.z, ry: p.ry || 0, rx: p.rx || 0, rz: p.rz || 0, sy: p.sy || 1, color: col, tex: texSet('brushed'), patScale: TEXSETS.brushed.scale, rough: 0.34, metal: 0.85, cast: !c.flat }); return; } }
    E.part(g, { geo, x: p.x, y: p.y, z: p.z, ry: p.ry || 0, rx: p.rx || 0, rz: p.rz || 0, sy: p.sy || 1, color: col, color2: p.c2 ? p.c2 : p.role === 'rug' ? mixHex(col, '#000000', 0.15) : p.role === 'plant' || p.role === 'plant2' ? mixHex(col, '#9cc25a', 0.4) : col, pattern: pat, patScale: weave ? TEXSETS.weave.scale : p.patScale || 1, tex: weave, alpha: p.role === 'glass' ? 0.12 : 1, rough: weave ? 0.88 : m.rough ?? -1, metal: m.metal || 0, emissive: em, cast: p.role !== 'glass' && !c.flat });
  });
  g.pick = { w: it.w, d: it.d, h: Math.max(0.05, it.h) };
  return g;
}
const GOLDEN_HOUR = 17.2;
const isNight = () => S.hour < 6.4 || S.hour > 18.4;
const roofCasts = () => !!(S.daylightSim || S.touring || (CTL && CTL.mode === 'walk'));
function fmtHour(h) { const hh = Math.floor(h) % 24, mm = Math.round((h - Math.floor(h)) * 60); return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`; }
function applyEnv() {
  if (!E) return; const h = S.hour; const env = E.env;
  const t = (h - 6) / 12.6; const el = Math.max(-0.2, Math.sin(Math.PI * t)) * 1.22; // radians, peak ~70°
  const az = sunAz(h) * Math.PI / 180 + (S.project?.north || 0) * Math.PI / 180;
  const ce = Math.cos(el); env.sunDir = V3.norm([ce * Math.sin(az), Math.max(0.03, Math.sin(el)), -ce * Math.cos(az)]);
  const k = clamp(Math.sin(el) * 1.6, 0, 1); const day = clamp((Math.sin(el) + 0.1) * 3, 0, 1);
  const warm = [2.6, 1.45, 0.7], noon = [2.5, 2.38, 2.2];
  const zen = mixHex('#0a1022', mixHex('#4c5f92', '#3c7ccc', k), day), hor = mixHex('#1c2540', mixHex('#f0b088', '#d3e3ef', k), day);
  env.zenith = zen; env.horizon = hor; env.groundCol = mixHex('#141820', '#6d7652', day);
  env.night = 1 - day; env.clouds = 0.65; env.vignette = 0.22;
  if (day > 0) {
    env.sunCol = noon.map((v, i) => (warm[i] + (v - warm[i]) * k) * day);
    env.amb = 0.55 + 0.45 * day; env.exposure = 0.82; env.shadows = day > 0.05;
  } else { // moonlight: a cool, dim key light from high in the opposite sky, so the house still reads at night
    env.sunDir = V3.norm([-0.35, 0.75, 0.45]); env.sunCol = [0.11, 0.15, 0.26];
    env.amb = 1.0; env.exposure = 1.25; env.shadows = true;
  }
  const golden = courtyardFacade() && E.siteWalk && !S.daylightSim && !S.touring
    ? Math.max(0, 1 - Math.abs(h - GOLDEN_HOUR) / 1.05) : 0;
  if (golden) {
    const frame = E.siteWalk.frame, [x0, z0] = frame.toWorld(0, 0), [x1, z1] = frame.toWorld(1.0, 1.05);
    const direction = V3.norm([x1 - x0, 0.64, z1 - z0]);
    env.sunDir = V3.norm(V3.lerp(env.sunDir, direction, golden));
    env.sunCol = V3.lerp(env.sunCol, [2.75, 1.89, 1.12], golden);
    env.horizon = mixHex(env.horizon, '#debda3', golden);
    env.zenith = mixHex(env.zenith, '#6e95c2', golden);
    env.amb = env.amb * (1 - golden * 0.24);
    env.exposure = env.exposure * (1 + golden * 0.05);
  }
  env.fog = 0.0052; // lighter haze: the neighbourhood keeps its depth without washing out
  if (FLOW.step === 'room') env.vignette = 0.3;
  // interior lights at night (closest 16 to camera target)
  const lights = [];
  // the room the viewer stands in: the guided room view, or wherever the camera is while walking / touring
  const walkRoom = S._litRoom && (CTL?.mode === 'walk' || S.touring) ? findRoom(S._litRoom) : null;
  const inRoom = FLOW.step === 'room' && FLOW.room ? FLOW.room : walkRoom && !isOpenAir(walkRoom) ? walkRoom : null;
  env.room = null; env.aoStrength = 0.6; env.aoRadius = 0;
  if (inRoom) { // room view: the windows are the light source (area lights), walls and ceiling block the rest of the sky
    const f = floorOfRoom(inRoom), fy = floorY(f), dayK = clamp((Math.sin(Math.PI * (h - 6) / 12.6) + 0.08) * 1.3, 0, 1);
    const sky = [0.97, 1.0, 1.05].map(v => v * dayK * (S.roomLightK || 5.0)); let flux = [0, 0, 0];
    // openings that let daylight in: every window, then doorways (bright if they open outdoors, dim if onto another room)
    const ops = roomOpenings(inRoom, f), srcs = ops.filter(o => o.kind === 'window').map(o => ({ o, h: o.ref.h, sill: o.ref.sill, k: 1 }))
      .concat(ops.filter(o => o.kind === 'door').map(o => { const n = { N: [0, -0.3], S: [0, 0.3], W: [-0.3, 0], E: [0.3, 0] }[o.side], at = { N: [o.t, inRoom.y], S: [o.t, inRoom.y + inRoom.d], W: [inRoom.x, o.t], E: [inRoom.x + inRoom.w, o.t] }[o.side];
        const nb = roomAt(at[0] + n[0], at[1] + n[1], f); return { o, h: DOOR_H, sill: 0, k: !nb || isOpenAir(nb) ? 0.55 : 0.16 }; })).slice(0, 4);
    const wins = srcs.map(({ o, h: oh, sill, k }) => { const hw = o.w / 2, hh = oh / 2, my = fy + FLOOR_TOP + sill + hh;
      const at = { N: [o.t, inRoom.y + WALL_T / 2], S: [o.t, inRoom.y + inRoom.d - WALL_T / 2], W: [inRoom.x + WALL_T / 2, o.t], E: [inRoom.x + inRoom.w - WALL_T / 2, o.t] }[o.side];
      const u = { N: [hw, 0, 0], S: [-hw, 0, 0], W: [0, 0, -hw], E: [0, 0, hw] }[o.side], out = { N: [0, 0, -1], S: [0, 0, 1], W: [-1, 0, 0], E: [1, 0, 0] }[o.side];
      const sunIn = Math.max(0, V3.dot(env.sunDir, out)) * (env.sunCol ? 1 : 0); // a sunlit façade bounces extra light in through its glass
      const L = sky.map((v, i) => (v + (env.sunCol ? env.sunCol[i] : 0) * sunIn * 0.18 * dayK) * k);
      flux = flux.map((v, i) => v + L[i] * o.w * oh);
      return { c: [at[0], my, at[1]], u, v: [0, hh, 0], L }; });
    const H = f.height, Aroom = 2 * (inRoom.w * inRoom.d + (inRoom.w + inRoom.d) * H);
    env.room = { min: [inRoom.x + WALL_T / 2, fy + FLOOR_TOP, inRoom.y + WALL_T / 2], max: [inRoom.x + inRoom.w - WALL_T / 2, fy + H, inRoom.y + inRoom.d - WALL_T / 2], wins,
      bounce: flux.map(v => v / Aroom * 0.55 * (S.roomBounceK || 0.45)), ambIn: 0.04, outK: S.roomOutK || 0.36 };
    // exposure follows the daylight the room actually gets (as a camera would); dim rooms get a soft overhead light
    const Eavg = (flux[0] + flux[1] + flux[2]) / 3 / Aroom;
    if (dayK > 0.15) {
      if (Eavg < 0.17 && inRoom.lights?.ambient !== false) { const k = clamp((0.17 - Eavg) / 0.17, 0, 1);
        lights.push({ p: [inRoom.x + inRoom.w / 2, fy + H - 0.25, inRoom.y + inRoom.d / 2], c: [1.0, 0.93, 0.8].map(v => v * (0.35 + 0.5 * k)), r: Math.max(inRoom.w, inRoom.d) * 1.25 + 0.6 });
        env.room.ambIn = 0.04 + 0.06 * k; env.room.bounce = env.room.bounce.map(v => v + 0.025 * k); }
      env.exposure = S.roomExposure || clamp(0.36 / Math.max(Eavg, 0.07), 1.2, 2.1);
    }
    env.aoStrength = 0.85; env.aoRadius = 0.5;
    inRoom.furniture.forEach(it => { if (it.type !== 'floor_lamp' || inRoom.lights?.ambient === false) return; const sh = MODEL3D.floor_lamp.shade || [0, 0.72], ra = it.rot * Math.PI / 180;
      lights.push({ p: [it.x + sh[0] * Math.cos(ra), fy + FLOOR_TOP + it.h * sh[1], it.y - sh[0] * Math.sin(ra)], c: [0.9, 0.56, 0.26], r: 3.0 }); });
  }
  if (!inRoom && E.facadeLights?.length && (golden || isNight())) {
    const target = E.cam.target;
    const nearest = E.facadeLights.slice().sort((a, b) => V3.len(V3.sub(a.p, target)) - V3.len(V3.sub(b.p, target))).slice(0, 5);
    lights.push(...nearest.map(light => ({ ...light, c: V3.scale(light.c, Math.max(golden * 0.8, isNight() ? 1 : 0)) })));
  }
  if (isNight() || S.lightsAlways) {
    const tgt = E.cam.target; const act = S.project.floors[S.project.activeFloor];
    const rooms = act.rooms.filter(r => r.lights?.ambient !== false && !isYard(r)).map(r => ({ r, d: Math.hypot(r.x + r.w / 2 - tgt[0], r.y + r.d / 2 - tgt[2]) })).sort((a, b) => a.d - b.d).slice(0, 14);
    rooms.forEach(({ r }) => lights.push({ p: [r.x + r.w / 2, floorY(act) + act.height - 0.4, r.y + r.d / 2], c: r.lights.accent ? [2.4, 1.9, 1.3] : [1.9, 1.6, 1.15], r: Math.max(r.w, r.d) * 1.1 + 1 }));
    act.rooms.forEach(r => r.furniture.forEach(it => { if (it.type === 'floor_lamp' && lights.length < 16) lights.push({ p: [it.x, floorY(act) + 1.4, it.y], c: [1.3, 0.95, 0.55], r: 2.6 }); }));
  }
  E.setLights(lights);
  E.dirty = true;
  const el2 = document.getElementById('time-label'); if (el2) el2.textContent = fmtHour(h);
  renderExteriorControls();
}
function setHour(h) { const wasNight = isNight(); S.hour = clamp(h, 0, 23.99); const ts = document.getElementById('time-slider'); if (ts) ts.value = S.hour; if (wasNight !== isNight()) rebuild(); else applyEnv(); if (S.view === '2d' && S.overlay === 'heat') render2D(); }

/* labels */
function updateLabels() {
  const box = document.getElementById('labels'); if (!box) return;
  if (!S.labels || (FLOW.step && FLOW.step in EXTERIOR_VIEWS) || CTL.mode === 'walk' || S.touring || S.view === '2d') { box.innerHTML = ''; box._k = ''; return; }
  const pj = P(); const act = pj.floors.length > 1 && S.showAllFloors && !S.cutaway ? pj.floors.slice().sort((a, b) => b.level - a.level)[0] : FL(); const yOff = floorY(act);
  const key = act.id + act.rooms.map(r => r.id + r.name).join('|');
  if (box._k !== key) { box.innerHTML = act.rooms.map(r => `<div class="lbl" data-act="select-room" data-id="${r.id}"><b>${esc(r.name)}</b><span>${r.w} × ${r.d} m</span></div>`).join(''); box._k = key; }
  [...box.children].forEach((el, i) => { const r = act.rooms[i]; if (!r) return; const p = E.project([r.x + r.w / 2, yOff + (S.cutaway ? 1.4 : act.height + 0.25), r.y + r.d / 2]); if (!p) { el.style.display = 'none'; return; } el.style.display = ''; el.style.transform = `translate(${p[0]}px, ${p[1]}px) translate(-50%,-50%)`; el.classList.toggle('sel', S.sel && S.sel.kind === 'room' && S.sel.id === r.id); el.style.opacity = p[2] > 60 ? 0.4 : 1; });
}
function updateCompass() { const el = document.getElementById('compass-needle'); if (!el || !CTL) return; const c = E.cam; const ang = Math.atan2(c.target[0] - c.pos[0], -(c.target[2] - c.pos[2])) * 180 / Math.PI; el.style.transform = `rotate(${-(ang) - (S.project?.north || 0)}deg)`; }

/* picking & dragging */
function hitItems(px, py) {
  const ray = E.ray(px, py); let best = null;
  E.groups.forEach(g => { if (g.kind !== 'item' || !g.visible || !g.pick) return; const t = Engine.rayOBB(ray, { x: g.x, z: g.z, y0: g.y, h: g.pick.h, w: g.pick.w, d: g.pick.d, rot: g.rot }); if (t != null && (!best || t < best.t)) best = { t, g }; });
  return { best, ray };
}
function floorHit(ray, y) { if (Math.abs(ray.d[1]) < 1e-6) return null; const t = (y - ray.o[1]) / ray.d[1]; if (t < 0) return null; return [ray.o[0] + ray.d[0] * t, ray.o[2] + ray.d[2] * t]; }
function pick3D(px, py) {
  if (S.touring) return;
  const { best, ray } = hitItems(px, py);
  if (best) { select({ kind: 'item', id: best.g.ref }); return; }
  const f = FL(); const p = floorHit(ray, floorY(f) + FLOOR_TOP);
  if (p) { const r = roomAt(p[0], p[1], f); if (r) { select({ kind: 'room', id: r.id }); return; } }
  select(null);
}
let drag = null;
function dragStart3D(px, py) {
  if (S.touring || CTL.mode === 'walk') return false;
  const { best, ray } = hitItems(px, py);
  if (!best) return false;
  const f = FL(); const p = floorHit(ray, floorY(f) + FLOOR_TOP); if (!p) return false;
  const found = findItem(best.g.ref); if (!found) return false;
  drag = { g: best.g, it: found.it, room: found.room, off: [found.it.x - p[0], found.it.y - p[1]], start: [found.it.x, found.it.y], committed: false };
  select({ kind: 'item', id: found.it.id }, true);
  return true;
}
function drag3D(px, py) {
  if (!drag) return; const ray = E.ray(px, py); const p = floorHit(ray, floorY(FL()) + FLOOR_TOP); if (!p) return;
  if (!drag.committed) { commit('Move ' + CATALOG[drag.it.type].label); drag.committed = true; }
  drag.it.x = r2(snap(p[0] + drag.off[0])); drag.it.y = r2(snap(p[1] + drag.off[1]));
  drag.g.x = drag.it.x; drag.g.z = drag.it.y; drag.g.dirtyM = true; E.dirty = true;
  document.getElementById('viewport').classList.add('dragging');
}
function dragEnd3D() {
  if (!drag) return; document.getElementById('viewport').classList.remove('dragging');
  if (drag.committed) {
    const nr = roomAt(drag.it.x, drag.it.y, FL());
    if (nr && nr !== drag.room) { drag.room.furniture.splice(drag.room.furniture.indexOf(drag.it), 1); nr.furniture.push(drag.it); toast(`Moved ${CATALOG[drag.it.type].label} to ${nr.name}`); }
    else if (!nr) { drag.it.x = drag.start[0]; drag.it.y = drag.start[1]; toast('Furniture must stay inside a room'); }
    rebuild(); save();
  }
  drag = null;
}
function selectApply(sel) {
  if (!E) return; E.groups.forEach(g => g.hl = 0);
  if (!sel) return;
  const g = E.groups.get((sel.kind === 'item' ? 'item:' : 'room:') + sel.id); if (g) g.hl = sel.kind === 'item' ? 0.55 : 0.35;
}
function select(sel, silent) {
  if (FLOW.step === 'floor' && !FLOW.busy && sel && sel.kind === 'room' && !silent) { const r = findRoom(sel.id); if (r && !isOpenAir(r)) setTimeout(() => flowRoom(r), 30); }
  S.sel = sel; selectApply(sel); if (E) E.dirty = true;
  if (S.view === '2d') render2D();
  renderInspector();
  if (sel && sel.kind === 'room' && !silent) { const r = findRoom(sel.id); if (r && ['space', 'light', 'transform', 'design'].includes(S.panel)) refreshSidePanel(); }
}

/* camera helpers */
function viewFrame() {
  const pj = P(); const whole = pj.floors.length > 1 && S.showAllFloors && !S.cutaway; const b = homeBounds(whole ? null : FL());
  if (!whole) return { b, c: [b.x + b.w / 2, floorY(FL()), b.y + b.d / 2], hgt: 0 };
  const top = pj.floors.slice().sort((x, y) => y.level - x.level)[0]; const hgt = floorY(top) + top.height;
  return { b, c: [b.x + b.w / 2, hgt * 0.42, b.y + b.d / 2], hgt };
}
function fitView(animate = true, top = false) {
  if (!CTL) return;
  if (S.roof && !S.cutaway && !top && CTL.mode !== 'walk' && houseBounds()) { // the finished house: the street view
    const fr = exteriorFrame(); CTL.mode = 'orbit';
    if (animate) return CTL.flyTo(fr.pos, fr.target, 1.3, { mode: 'orbit' });
    E.cam.pos = fr.pos; E.cam.target = fr.target; CTL.syncFromCam('orbit'); E.dirty = true; return Promise.resolve();
  }
  const { b, c, hgt } = viewFrame(); const R = Math.max(b.w, b.d);
  const asp = E.canvas.clientWidth / Math.max(1, E.canvas.clientHeight); const half = Math.min(E.cam.fov / 2, Math.atan(Math.tan(E.cam.fov / 2) * asp));
  const rad = Math.hypot(b.w, b.d, top ? 0 : hgt) / 2 + 0.8; const r = rad / Math.sin(half) * (top ? 0.95 : 1.02); const theta = -0.62, phi = top ? 0.02 : (S.explode && hgt ? 1.02 : 0.8);
  const pos = [c[0] + r * Math.sin(phi) * Math.sin(theta), c[1] + r * Math.cos(phi), c[2] + r * Math.sin(phi) * Math.cos(theta)];
  CTL.mode = 'orbit';
  if (animate) return CTL.flyTo(pos, c, 1.3, { mode: 'orbit' });
  E.cam.pos = pos; E.cam.target = c; CTL.syncFromCam('orbit'); E.dirty = true; return Promise.resolve();
}
function presetView(v) {
  if (!CTL) return; const { b, c, hgt } = viewFrame(); const R = Math.max(b.w, b.d, hgt) * 1.3 + 4;
  const P = { top: [c[0], c[1] + R * 1.25, c[2] + 0.01], front: [c[0], c[1] + R * 0.45, c[2] + R], side: [c[0] + R, c[1] + R * 0.45, c[2]], iso: null }[v];
  if (v === 'iso' || !P) return fitView(true);
  if (CTL.mode === 'walk') setView('3d');
  CTL.flyTo(P, c, 1.1, { mode: 'orbit' });
}
function focusRoom(r) {
  if (!CTL) return; if (S.view === '2d') setView('3d');
  const f = floorOfRoom(r); if (S.project.floors.indexOf(f) !== S.project.activeFloor) { S.project.activeFloor = S.project.floors.indexOf(f); rebuild(); }
  const c = [r.x + r.w / 2, floorY(f) + 0.6, r.y + r.d / 2]; const R = Math.max(r.w, r.d) * 1.25 + 2.5;
  CTL.mode = 'orbit'; CTL.flyTo([c[0] - R * 0.32, c[1] + R * 1.25, c[2] + R * 0.5], c, 1.2, { mode: 'orbit' });
  select({ kind: 'room', id: r.id });
}
/* ---- guided views: Exterior → Ground-floor cutaway → Living room (eye level) → back to the floor ----
   One scene throughout: the cutaway and the room view show the same walls, windows and furniture; only the walls' cut
   height and the camera change. */
const FLOW = { step: null, room: null, floorCam: null, busy: false, fi: null };
const FOV_DEF = 50 * Math.PI / 180, FOV_ROOM = 62 * Math.PI / 180;
// the room a floor's tour starts in: living room first, then the largest furnished, enclosed room
const ROOM_PRI = ['living', 'family', 'master', 'bedroom', 'guest', 'kids', 'dining', 'kitchen', 'office', 'study'];
const flowLiving = (fi = 0) => { const f = P().floors[fi] || FL(); const rs = f.rooms.filter(r => !isOpenAir(r) && r.furniture.length);
  return rs.sort((a, b) => ((ROOM_PRI.indexOf(a.type) + 99) % 99 - (ROOM_PRI.indexOf(b.type) + 99) % 99) || area(b) - area(a))[0] || null; };
function flowFloorIndex() { const pj = P(); if (FLOW.fi != null && pj.floors[FLOW.fi]) return FLOW.fi; const g = pj.floors.findIndex(f => (f.level || 0) === 0); return g >= 0 ? g : 0; }
const floorShort = f => f.name.replace(/ Floor$/, '').replace(/^Ground$/, 'Ground floor');
function setFlowStep(step, room = null) {
  FLOW.step = step; FLOW.room = room;
  $('#app')?.classList.remove('studio-tools-open');
  $('.studio-tools-toggle')?.setAttribute('aria-expanded', 'false');
  renderFlowNav(); applyEnv();
}
const EXTERIOR_VIEWS = {
  ext: 'House exterior', garage: 'Defender 110 · Garage', garden: 'Front garden', street: 'Residential street',
  area: 'Neighbourhood overview', shops: 'Shopping centre'
};
function garagePreviewDoor() {
  if (P()?.example !== 'duplex') return null;
  const floor = P().floors.find(f => (f.level || 0) === 0);
  const door = floor && garageDoors(floor)[0];
  return door ? { floor, door } : null;
}
function garagePreviewFrame() {
  const garage = garagePreviewDoor();
  if (!garage) return null;
  const { floor, door } = garage;
  const [dx, dz] = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[door.face];
  const aspect = E.canvas.clientWidth / Math.max(1, E.canvas.clientHeight);
  const distance = clamp(3.9 + (1 - aspect) * 1.3, 3.5, 4.9), y = floorY(floor);
  return {
    pos: [door.x + dx * distance - dz * 0.42, y + 1.63, door.y + dz * distance + dx * 0.42],
    target: [door.x - dx * 1.12, y + 1.06, door.y - dz * 1.12]
  };
}
function openRenderedView(stop = 'ext') {
  if (E || !PRIVATE_HOST || P()?.example !== 'duplex') return;
  const loc = { ...EXTERIOR_VIEWS, room: 'Living Room' }[stop];
  if (!loc) return;
  FLOW.step = stop;
  S.view = 'photos';
  const app = $('#app');
  app.dataset.view = 'photos';
  $$('#view-seg button').forEach(button => button.classList.toggle('on', button.dataset.v === '3d'));
  const image = $('#rendered-view img');
  image.src = `assets/preview/${stop}.webp`;
  image.alt = loc + ' render of the DIMORA duplex';
  $('#rendered-caption').textContent = loc;
  $('#rendered-room').setAttribute('aria-pressed', String(stop === 'room'));
  renderFlowNav();
  renderInspector();
}
function renderExteriorControls() {
  const panel = $('#exterior-controls');
  if (!panel) return;
  const step = FLOW.step;
  const visible = S.view === 'photos' || (!!E && S.view !== '2d' && (!step || step in EXTERIOR_VIEWS));
  panel.hidden = !visible;
  $('#app').classList.toggle('exterior-active', visible);
  if (!visible) return;
  panel.querySelector('[data-stop="garage"]').hidden = !garagePreviewDoor();
  panel.querySelectorAll('[data-stop]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stop === step)));
  panel.querySelectorAll('[data-hour]').forEach(button => button.setAttribute('aria-pressed', String(Math.abs(S.hour - +button.dataset.hour) < 0.2)));
  $('#exterior-caption').textContent = EXTERIOR_VIEWS[step] || 'Exterior views';
}
async function exteriorStop(stop) {
  if (!E) return openRenderedView(stop);
  if (FLOW.busy) return;
  if (stop === 'ext') return flowExterior();
  if (stop === 'garden' || stop === 'street') return setView('walk', { outside: stop });
  const garage = stop === 'garage' ? garagePreviewFrame() : null;
  if (!garage && stop !== 'area' && stop !== 'shops') return;
  FLOW.busy = true;
  try {
    if (S.touring) stopTour();
    exitWalkUI();
    $('#app').classList.remove('side-open', 'chat-open');
    S.roof = true; S.cutaway = false; S.showAllFloors = true; S.explode = false;
    $('#t-roof').classList.add('on'); $('#t-cut').classList.remove('on');
    CTL.mode = 'orbit'; rebuild(); renderFloorSeg(); setFlowStep(stop);
    if (garage) return await CTL.flyTo(garage.pos, garage.target, 1.2, { mode: 'orbit', fov: FOV_DEF });
    const { frame, mall } = E.siteWalk;
    const point = (u, v, h) => { const [x, z] = frame.toWorld(u, v); return [x, h - plinthH(), z]; };
    const pos = stop === 'shops' ? point(mall.u - 21, mall.v - 23, 9.5) : point(-frame.width * 0.9 - 14, 24, 25);
    const target = stop === 'shops' ? point(mall.u, mall.v, 4.8) : point(0, 1, 3.5);
    await CTL.flyTo(pos, target, 1.35, { mode: 'orbit', fov: FOV_DEF });
  } finally { FLOW.busy = false; }
}
function renderFlowNav() {
  renderExteriorControls();
  const el = document.getElementById('flow-nav'); if (!el) return; const lr = S.project ? flowLiving(flowFloorIndex()) : null;
  el.hidden = !S.project || !E || S.view === '2d'; if (el.hidden) return;
  const st = FLOW.step, b = (act, lbl, on, dis) => `<button data-act="${act}" aria-pressed="${!!on}" class="${on ? 'on' : ''}" ${dis ? 'disabled' : ''}>${lbl}</button>`;
  el.innerHTML = st === 'room'
    ? `<button data-act="flow-back" class="back">← Back to floor</button><span class="fl-here">${esc(FLOW.room?.name || 'Room')} · eye level</span>`
    : b('flow-ext', 'Exterior', st === 'ext') + '<i>›</i>' + P().floors.map((f, i) => `<button data-act="flow-floor" data-i="${i}" class="${st === 'floor' && flowFloorIndex() === i ? 'on' : ''}">${esc(floorShort(f))}</button>`).join('')
      + '<i>›</i>' + b('flow-room', lr ? esc(lr.name) : 'Room', false, !lr);
}
function exitWalkUI() { if (S.view === 'walk') { S.view = '3d'; $('#app').dataset.view = '3d'; $$('#view-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === '3d')); renderFloorSeg(); } }
async function flowExterior() {
  if (!E || FLOW.busy) return; FLOW.busy = true; if (S.touring) stopTour(); exitWalkUI();
  $('#app').classList.remove('side-open', 'chat-open');
  S.roof = true; S.cutaway = false; S.showAllFloors = true; S.explode = false; $('#t-roof')?.classList.add('on'); $('#t-cut')?.classList.remove('on');
  CTL.mode = 'orbit'; rebuild(); renderFloorSeg(); setFlowStep('ext'); const fr = exteriorFrame();
  await CTL.flyTo(fr.pos, fr.target, 1.5, { mode: 'orbit', fov: FOV_DEF }); FLOW.busy = false;
}
// a three-quarter view down into the ground floor, framed on the living room so its layout reads clearly
function floorCam(fi) {
  const f = P().floors[fi], b = homeBounds(f), lr = flowLiving(fi), y0 = floorY(f);
  const c = lr ? V3.lerp([b.x + b.w / 2, y0, b.y + b.d / 2], [lr.x + lr.w / 2, y0, lr.y + lr.d / 2], 0.45) : [b.x + b.w / 2, y0, b.y + b.d / 2];
  const asp = E.canvas.clientWidth / Math.max(1, E.canvas.clientHeight), half = Math.min(FOV_DEF / 2, Math.atan(Math.tan(FOV_DEF / 2) * asp));
  const r = (Math.hypot(b.w, b.d) / 2 + 0.6) / Math.sin(half) * 0.98, theta = lr ? Math.atan2((lr.x + lr.w / 2) - (b.x + b.w / 2), (lr.y + lr.d / 2) - (b.y + b.d / 2)) * 0.35 - 0.5 : -0.62, phi = 0.72;
  return { pos: [c[0] + r * Math.sin(phi) * Math.sin(theta), c[1] + r * Math.cos(phi), c[2] + r * Math.sin(phi) * Math.cos(theta)], target: c };
}
async function flowFloor(fromRoom = false, fiIn = null) {
  if (!E || FLOW.busy) return; FLOW.busy = true; if (S.touring) stopTour();
  $('#app').classList.remove('side-open', 'chat-open');
  if (fiIn != null && P().floors[fiIn]) { if (fiIn !== FLOW.fi) FLOW.floorCam = null; FLOW.fi = fiIn; } const fi = flowFloorIndex(); exitWalkUI();
  S.roof = false; S.cutaway = true; S.showAllFloors = false; S.project.activeFloor = fi; $('#t-roof')?.classList.remove('on'); $('#t-cut')?.classList.add('on');
  const cam = fromRoom && FLOW.floorCam ? FLOW.floorCam : floorCam(fi);
  if (fromRoom) { // rise out of the room first (still at full wall height), then drop the walls to the cutaway and pull back
    const c = E.cam, up = [c.pos[0], floorY(FL()) + 2.35, c.pos[2]], look = V3.lerp(c.target, cam.target, 0.3);
    await CTL.flyTo(up, look, 0.5, { mode: 'orbit', fov: FOV_DEF });
  }
  CTL.mode = 'orbit'; rebuild(); renderFloorSeg(); setFlowStep('floor');
  await CTL.flyTo(cam.pos, cam.target, fromRoom ? 1.2 : 1.5, { mode: 'orbit', fov: FOV_DEF });
  FLOW.floorCam = { pos: E.cam.pos.slice(), target: E.cam.target.slice() }; FLOW.busy = false;
}
// eye-level corner view that frames the sofa, a window and the depth of the room
function livingShot(r) {
  const f = floorOfRoom(r), fy = floorY(f) + FLOOR_TOP, eye = fy + 1.5;
  // the room's hero piece: sofa, bed, dining table, kitchen counter, vanity… else its largest free-standing item
  const HERO = [/^sofa/, /^bed|_bed$|^bed_/, /dining_table|^table_/, /counter|^kitchen/, /vanity|basin|wash/, /desk/, /diwan|armchair/];
  const big = r.furniture.filter(i => !CATALOG[i.type].flat).sort((a, b) => b.w * b.d - a.w * a.d);
  const sofa = HERO.map(re => big.find(i => re.test(i.type))).find(Boolean) || big[0];
  const wins = roomOpenings(r, f).filter(o => o.kind === 'window').map(o => { const at = o.side === 'N' || o.side === 'S' ? [o.t, o.side === 'N' ? r.y : r.y + r.d] : [o.side === 'W' ? r.x : r.x + r.w, o.t]; return { p: [at[0], fy + o.ref.sill + o.ref.h / 2, at[1]], w: o.w }; });
  const sp = sofa ? [sofa.x, fy + 0.6, sofa.y] : [r.x + r.w / 2, fy + 0.6, r.y + r.d / 2];
  const win = wins.slice().sort((a, b) => Math.hypot(a.p[0] - sp[0], a.p[2] - sp[2]) - Math.hypot(b.p[0] - sp[0], b.p[2] - sp[2]))[0];
  const swings = roomOpenings(r, f).filter(o => o.kind === 'door').map(o => doorSwingRect(r, o)), ins = Math.min(0.5, Math.min(r.w, r.d) * 0.15);
  const hfov = 2 * Math.atan(Math.tan(FOV_ROOM / 2) * Math.max(1, E.canvas.clientWidth / Math.max(1, E.canvas.clientHeight)));
  const best = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.d], [r.x + r.w, r.y + r.d]].map(k => {
    const p = [k[0] + (k[0] === r.x ? ins : -ins), eye, k[1] + (k[1] === r.y ? ins : -ins)];
    const aim = win ? V3.lerp(sp, win.p, 0.3) : sp, tgt = [aim[0], fy + 0.95, aim[2]];
    const dir = V3.norm(V3.sub(tgt, p)), ang = q => { const v = V3.norm([q[0] - p[0], 0, q[2] - p[2]]), d2 = V3.norm([dir[0], 0, dir[2]]); return Math.acos(clamp(v[0] * d2[0] + v[2] * d2[2], -1, 1)); };
    let sc = Math.hypot(sp[0] - p[0], sp[2] - p[2]);                       // depth: stand far from the sofa
    if (win && ang(win.p) > hfov / 2 * 0.85) sc -= 6;                       // the window must be in frame
    if (swings.some(s => p[0] > s.x - 0.2 && p[0] < s.x + s.w + 0.2 && p[2] > s.y - 0.2 && p[2] < s.y + s.d + 0.2)) sc -= 20; // not in a door swing
    if (r.furniture.some(it => { if (CATALOG[it.type].flat) return false; const fp = itemFootprint(it); return p[0] > fp.x - 0.3 && p[0] < fp.x + fp.w + 0.3 && p[2] > fp.y - 0.3 && p[2] < fp.y + fp.d + 0.3; })) sc -= 10; // not inside furniture
    swings.forEach(s => { const q = [s.x + s.w / 2, 0, s.y + s.d / 2]; if (ang(q) < hfov / 2 && Math.hypot(q[0] - p[0], q[2] - p[2]) < 4.5) sc -= 1.2; }); // an open door leaf in frame clutters the shot
    r.furniture.forEach(it => { if (it.h < 1.0 || CATALOG[it.type].flat || it === sofa) return; const q = [it.x, 0, it.y], dd = Math.hypot(q[0] - p[0], q[2] - p[2]);
      if (dd < 2.8 && ang(q) < hfov / 2) sc -= 6 * (2.8 - dd) * (1 - 0.6 * ang(q) / (hfov / 2)); }); // a tall piece (lamp, wardrobe, plant) right in front of the lens blocks the view
    return { pos: p, target: tgt, sc };
  }).sort((a, b) => b.sc - a.sc)[0];
  // compact rooms (baths, small kitchens, utility): shoot from the doorway, like a property photographer, so the
  // camera is not pressed into a corner behind the door leaf
  if (area(r) < 6.5 || Math.min(r.w, r.d) < 1.9) { const dr = roomOpenings(r, f).find(o => o.kind === 'door');
    if (dr) { const n = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[dr.side], at = { N: [dr.t, r.y], S: [dr.t, r.y + r.d], W: [r.x, dr.t], E: [r.x + r.w, dr.t] }[dr.side];
      const pos = [at[0] - n[0] * 0.55, eye, at[1] - n[1] * 0.55], hero = sofa ? [sofa.x, sofa.y] : [r.x + r.w / 2, r.y + r.d / 2];
      return { pos, target: [(hero[0] + r.x + r.w / 2) / 2, fy + 0.85, (hero[1] + r.y + r.d / 2) / 2], sc: 0, doorway: true }; } }
  return best;
}
async function flowRoom(r) {
  if (!E || FLOW.busy) return; r = r || flowLiving(flowFloorIndex()); if (!r) return toast('No furnished room on this floor yet');
  const rfi = P().floors.indexOf(floorOfRoom(r));
  if (FLOW.step !== 'floor' || rfi !== flowFloorIndex()) { await flowFloor(false, rfi); }
  FLOW.busy = true; FLOW.floorCam = { pos: E.cam.pos.slice(), target: E.cam.target.slice() };
  const sh = livingShot(r), c = [r.x + r.w / 2, sh.pos[1], r.y + r.d / 2];
  // 1) glide over the room (cutaway still on), 2) raise the walls and settle at eye level in the corner
  const over = V3.lerp(sh.pos, c, 0.15); over[1] = floorY(floorOfRoom(r)) + 2.3;
  await CTL.flyTo(over, V3.lerp(sh.target, c, 0.25), 1.2, { mode: 'orbit', fov: (FOV_DEF + FOV_ROOM) / 2 });
  S.cutaway = false; $('#t-cut')?.classList.remove('on');
  S.view = 'walk'; $('#app').dataset.view = 'walk'; $$('#view-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === 'walk'));
  CTL.mode = 'walk'; setFlowStep('room', r); rebuild(); select({ kind: 'room', id: r.id }, true);
  await CTL.flyTo(sh.pos, sh.target, 1.1, { mode: 'walk', fov: FOV_ROOM });
  FLOW.busy = false; toast(`${r.name} — drag to look around, arrow keys to walk · “Back to floor” to return`, 3200);
}
/* "take me to bedroom 2": walk-through view, standing inside that room at eye level */
function walkInto(r) {
  if (!CTL || !E) return; if (S.touring) stopTour();
  const f = floorOfRoom(r), fi = S.project.floors.indexOf(f); if (fi !== S.project.activeFloor) S.project.activeFloor = fi;
  S.view = 'walk'; $('#app').dataset.view = 'walk'; $$('#view-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === 'walk')); renderFloorSeg();
  const sh = roomShot(r); CTL.mode = 'walk'; rebuild(); select({ kind: 'room', id: r.id });
  CTL.flyTo(sh.pos, sh.target, 1.4, { mode: 'walk' }).then(() => toast(`You're in ${r.name} — use the arrow keys to walk around, drag to look`)); E.dirty = true;
}
function roomShot(r, from) {
  const f = floorOfRoom(r), y = floorY(f) + 1.6; const c = [r.x + r.w / 2, floorY(f) + 1.0, r.y + r.d / 2];
  const ops = roomOpenings(r, f).filter(o => o.kind === 'door');
  let entry = null;
  if (from) entry = ops.find(o => roomSideOf(from, o.ref.o, o.ref.x, o.ref.y)) || null;
  if (!entry) entry = ops.find(o => o.ref.main) || ops[0] || null;
  const doorPt = entry ? (entry.side === 'N' || entry.side === 'S' ? [entry.t, y, entry.side === 'N' ? r.y : r.y + r.d] : [entry.side === 'W' ? r.x : r.x + r.w, y, entry.t]) : [r.x, y, r.y];
  // stand in a corner near the entry (away from the door leaf and tall furniture), looking across the room
  const small = area(r) < 6.5; const camY = small ? floorY(f) + 2.3 : y;
  const hinges = f.doors.map(d => d.o === 'h' ? [d.x - d.w / 2, d.y] : [d.x, d.y - d.w / 2]);
  const ins = small ? 0.28 : Math.min(0.55, Math.min(r.w, r.d) * 0.22);
  const cand = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.d], [r.x + r.w, r.y + r.d]].map(k => {
    const p = [k[0] + (k[0] === r.x ? ins : -ins), k[1] + (k[1] === r.y ? ins : -ins)];
    let pen = Math.hypot(k[0] - doorPt[0], k[1] - doorPt[2]);
    if (hinges.some(h => Math.hypot(h[0] - k[0], h[1] - k[1]) < 1.25)) pen += 50;
    if (!small && r.furniture.some(it => { if (CATALOG[it.type].flat || it.h < 1.1) return false; const fp = itemFootprint(it); return p[0] > fp.x - 0.35 && p[0] < fp.x + fp.w + 0.35 && p[1] > fp.y - 0.35 && p[1] < fp.y + fp.d + 0.35; })) pen += 20;
    return { k, p, pen };
  }).sort((a, b) => a.pen - b.pen);
  const k = cand[0].k; const pos = [cand[0].p[0], camY, cand[0].p[1]];
  const far = [r.x + r.w - (k[0] - r.x), floorY(f) + (small ? 0.4 : 0.9), r.y + r.d - (k[1] - r.y)];
  const target = V3.lerp([c[0], small ? floorY(f) + 0.5 : c[1], c[2]], far, 0.35);
  return { pos, target, door: entry ? doorPt : null };
}
/* stairs in walk mode: eye height follows the flight; reaching the top/bottom moves you to that floor */
function walkStairs(pos) {
  const pj = P(); const f = FL(); if (!f) return;
  const tOn = st => { if (!inRoom(stairFoot(st), pos[0], pos[2])) return null; const u = stairRun(st) === 'z' ? pos[2] - st.y : pos[0] - st.x; return clamp(u * stairDir(st) / stairLen(st) + 0.5, 0, 1); };
  const go = nf => { pj.activeFloor = pj.floors.indexOf(nf); rebuild(); renderFloorSeg(); toast(nf.name, 1400); };
  const up = floorAbove(f), lo = floorBelow(f);
  if (up) for (const st of f.stairs || []) { const t = tOn(st); if (t == null) continue; pos[1] = floorY(f) + 1.6 + t * (f.height + 0.25); if (t > 0.97) go(up); return; }
  if (lo) for (const st of stairsBelow(f)) { const t = tOn(st); if (t == null) continue; pos[1] = floorY(lo) + 1.6 + t * (lo.height + 0.25); if (t < 0.03) go(lo); return; }
  pos[1] = floorY(f) + 1.6 + groundAt(f, pos[0], pos[2]);
}
function walkCollide(p, np) {
  if (S.touring) return true; const f = FL(); const yOff = floorY(f);
  const flights = [...(floorAbove(f) ? (f.stairs || []).map(st => [st, 'low']) : []), ...stairsBelow(f).map(st => [st, 'high'])];
  for (const [st, end] of flights) { // you can only step onto / off a flight at its walkable end (railings elsewhere)
    const ft = stairFoot(st), inN = inRoom(ft, np[0], np[2]), inP = inRoom(ft, p[0], p[2]); if (inN === inP) continue;
    const runZ = stairRun(st) === 'z', outer = inP ? np : p; const along = (runZ ? outer[2] - st.y : outer[0] - st.x) * (end === 'high' ? 1 : -1) * stairDir(st);
    const across = runZ ? Math.abs(np[0] - st.x) : Math.abs(np[2] - st.y);
    if (along < stairLen(st) / 2 - 0.08 || across > stairWidth(st) / 2) return false;
  }
  if (!f.rooms.some(r => inRoom(r, np[0], np[2], 0.6)) && !flights.some(([st]) => inRoom(stairFoot(st), np[0], np[2], 0.1))) {
    if (floorBelow(f)) return false; // upper floors: stay indoors (balcony railings stop you)
    const street = E?.siteWalk;
    if (street) {
      const { frame, openings, obstacles, streetLimit = 32 } = street;
      const [u, v] = frame.fromWorld(np[0], np[2]), [pu, pv] = frame.fromWorld(p[0], p[2]);
      const m = 0.25;
      if (v < -frame.depth + m) return false;
      if (v < -m && Math.abs(u) > frame.width / 2 - m) return false;
      if (v > 9.0 - m || Math.abs(u) > streetLimit) return false;
      if ((Math.abs(v) <= m || (pv < 0) !== (v < 0)) && Math.abs(u) < frame.width / 2 + m) {
        const crossing = (pv < 0) !== (v < 0) ? pu + (u - pu) * pv / (pv - v) : u;
        if (!openings.some(([a, b]) => crossing > a + m && crossing < b - m)) return false;
      }
      if (obstacles.some(o => Math.abs(u - o.u) < o.w + m && Math.abs(v - o.v) < o.d + m)) return false;
    }
  }
  if (flights.some(([st]) => inRoom(stairFoot(st), np[0], np[2]))) return true; // on the flight: side rails already enforced above
  if (plinthH() && !floorBelow(f) && raisedAt(f, p[0], p[2]) !== raisedAt(f, np[0], np[2])) { // up or down the plinth: only on the steps
    const steps = entranceSteps(f); if (!steps.some(st => inRoom(st, np[0], np[2], 0.05) || inRoom(st, p[0], p[2], 0.05))) return false; }
  // furniture is solid: you walk around the bed and the sofa, not through them
  for (const r of f.rooms) for (const it of r.furniture) { const c = CATALOG[it.type]; if (!c || c.flat || (it.h || c.h) < 0.25) continue; const fp = itemFootprint(it);
    if (inRoom(fp, np[0], np[2], 0.17) && !inRoom(fp, p[0], p[2], 0.17)) return false; }
  const m = 0.22;
  for (const pc of wallPieces(f)) {
    if (pc.kind === 'lintel' || pc.kind === 'head') continue;
    if (pc.o === 'h') { if (Math.abs(np[2] - pc.c) < WALL_T / 2 + m && np[0] > pc.a - 0.02 && np[0] < pc.b + 0.02) return false; }
    else { if (Math.abs(np[0] - pc.c) < WALL_T / 2 + m && np[2] > pc.a - 0.02 && np[2] < pc.b + 0.02) return false; }
  }
  return true;
}
function startBuildAnim() { buildAnim = { t0: performance.now() }; }
function stepBuildAnim(t) {
  const k = clamp((t - buildAnim.t0) / 1800, 0, 1); const e = 1 - Math.pow(1 - k, 3);
  E.groups.forEach(g => {
    if (g.kind === 'wall') { g.sy = Math.max(0.001, e); g.dirtyM = true; }
    if (g.kind === 'door' || g.id.startsWith('doorframe')) g.visible = k > 0.7;
    if (g.kind === 'item') { if (g.baseY == null) g.baseY = g.y; const kk = clamp((k - 0.45 - (g.x * 0.013 % 0.2)) / 0.4, 0, 1); g.y = g.baseY + Math.pow(1 - kk, 3) * 0.25; g.visible = kk > 0; g.dirtyM = true; }
  });
  E.dirty = true;
  if (k >= 1) { E.groups.forEach(g => { if (g.baseY != null) { g.y = g.baseY; delete g.baseY; } g.visible = true; g.sy = 1; g.dirtyM = true; }); buildAnim = null; }
}

/* ===================== 2D PLAN EDITOR (SVG) ===================== */
const V2 = { x: -1, y: -1, s: 50, w: 800, h: 600, init: false };
let tool2d = 'select', pendingType = null, drag2 = null;
function fit2D() {
  const el = document.getElementById('plan2d'); if (!el) return; const b = homeBounds(FL());
  V2.w = el.clientWidth || 800; V2.h = el.clientHeight || 600;
  V2.s = Math.min((V2.w - 80) / (b.w + 1), (V2.h - 80) / (b.d + 1)); V2.x = b.x + b.w / 2 - V2.w / 2 / V2.s; V2.y = b.y + b.d / 2 - V2.h / 2 / V2.s; V2.init = true;
}
const toPlan = (px, py) => [V2.x + px / V2.s, V2.y + py / V2.s];
function setTool(t, type) { tool2d = t; pendingType = type || null; document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t)); const el = document.getElementById('plan2d'); if (el) el.dataset.tool = t; const hint = { select: 'Drag rooms, edges and furniture. Del deletes · R rotates.', room: 'Drag to draw a new room.', door: 'Click on a wall to add a door.', window: 'Click on an outside wall to add a window.', place: `Click inside a room to place: ${pendingType ? CATALOG[pendingType].label : ''}` }[t]; const h = document.getElementById('tool-hint'); if (h) h.textContent = hint || ''; }
function render2D() {
  const el = document.getElementById('plan2d'); if (!el || !S.project) return;
  if (!V2.init || el.clientWidth !== V2.w) { const keep = V2.init; const ow = V2.w, oh = V2.h; if (!keep) fit2D(); else { V2.w = el.clientWidth; V2.h = el.clientHeight; } }
  const f = FL(), s = V2.s; const X = x => (x - V2.x) * s, Y = y => (y - V2.y) * s;
  const out = [];
  const gs = 0.5 * s; const ox = -V2.x * s % gs, oy = -V2.y * s % gs;
  out.push(`<defs><pattern id="g" width="${gs}" height="${gs}" patternUnits="userSpaceOnUse" x="${ox}" y="${oy}"><path d="M ${gs} 0 L 0 0 0 ${gs}" fill="none" stroke="rgba(148,163,184,.07)" stroke-width="1"/></pattern>
  <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#ec4899" stroke-width="3" opacity=".5"/></pattern>
  <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#22d3ee"/></marker></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>`);
  // rooms
  f.rooms.forEach(r => {
    const sel = S.sel && S.sel.kind === 'room' && S.sel.id === r.id;
    out.push(`<rect x="${X(r.x)}" y="${Y(r.y)}" width="${r.w * s}" height="${r.d * s}" fill="${ROOM_TYPES[r.type].tint}" fill-opacity="${sel ? 0.3 : 0.13}" ${sel ? 'stroke="#a78bfa" stroke-width="2" stroke-dasharray="6 4"' : ''}/>`);
  });
  // heat overlay
  if (S.overlay === 'heat') { const cs = 0.25; f.rooms.forEach(r => { for (let x = r.x; x < r.x + r.w - 0.01; x += cs) for (let y = r.y; y < r.y + r.d - 0.01; y += cs) { const I = lightAt(f, x + cs / 2, y + cs / 2, S.hour); out.push(`<rect x="${X(x)}" y="${Y(y)}" width="${cs * s + 0.5}" height="${cs * s + 0.5}" fill="${I > 0.5 ? '#ffb300' : I > 0.25 ? '#ffd166' : '#5b6a8a'}" fill-opacity="${0.15 + I * 0.55}"/>`); } }); }
  // space overlay: unused corners & walkable
  if (S.overlay === 'space') f.rooms.forEach(r => { const a = analyzeSpace(r, f); if (a.corner) out.push(`<rect x="${X(a.corner.x)}" y="${Y(a.corner.y)}" width="${a.corner.w * s}" height="${a.corner.d * s}" fill="url(#hatch)" stroke="#ec4899" stroke-width="1.5"/><text x="${X(a.corner.x + a.corner.w / 2)}" y="${Y(a.corner.y + a.corner.d / 2)}" class="t-s" text-anchor="middle" fill="#f9a8d4">unused ${r2(a.corner.area)} m²</text>`); a.clear.filter(c => !c.ok).forEach(c => { const fp = itemFootprint(c.it); out.push(`<rect x="${X(fp.x)}" y="${Y(fp.y)}" width="${fp.w * s}" height="${fp.d * s}" fill="none" stroke="#ec4899" stroke-width="2.5"/>`); }); });
  // walls
  wallPieces(f).forEach(p => {
    const t = (p.ext ? 0.2 : 0.12) * s;
    if (p.kind === 'rail') { out.push(p.o === 'h' ? `<line x1="${X(p.a)}" y1="${Y(p.c)}" x2="${X(p.b)}" y2="${Y(p.c)}" stroke="#94a3b8" stroke-width="3" stroke-dasharray="2 3"/>` : `<line x1="${X(p.c)}" y1="${Y(p.a)}" x2="${X(p.c)}" y2="${Y(p.b)}" stroke="#94a3b8" stroke-width="3" stroke-dasharray="2 3"/>`); return; }
    if (p.kind === 'solid') { out.push(p.o === 'h' ? `<rect x="${X(p.a) - t / 2}" y="${Y(p.c) - t / 2}" width="${(p.b - p.a) * s + t}" height="${t}" fill="#cbd5e1"/>` : `<rect x="${X(p.c) - t / 2}" y="${Y(p.a) - t / 2}" width="${t}" height="${(p.b - p.a) * s + t}" fill="#cbd5e1"/>`); }
    else if (p.kind === 'sill') { const sel = S.sel && S.sel.kind === 'window' && S.sel.id === p.ref.id; const c = sel ? '#a78bfa' : '#22d3ee'; out.push(p.o === 'h' ? `<rect x="${X(p.a)}" y="${Y(p.c) - t / 2}" width="${(p.b - p.a) * s}" height="${t}" fill="rgba(6,182,212,.18)" stroke="${c}" stroke-width="1.5" data-win="${p.ref.id}"/><line x1="${X(p.a)}" y1="${Y(p.c)}" x2="${X(p.b)}" y2="${Y(p.c)}" stroke="${c}" stroke-width="1.5"/>` : `<rect x="${X(p.c) - t / 2}" y="${Y(p.a)}" width="${t}" height="${(p.b - p.a) * s}" fill="rgba(6,182,212,.18)" stroke="${c}" stroke-width="1.5"/><line x1="${X(p.c)}" y1="${Y(p.a)}" x2="${X(p.c)}" y2="${Y(p.b)}" stroke="${c}" stroke-width="1.5"/>`); }
  });
  f.doors.forEach(d => {
    const w = d.w * s, sel = S.sel && S.sel.kind === 'door' && S.sel.id === d.id; const c = sel ? '#a78bfa' : d.main ? '#f472b6' : '#94a3b8';
    if (d.o === 'h') { const hx = X(d.x - d.w / 2), hy = Y(d.y); out.push(`<path d="M ${hx} ${hy} L ${hx} ${hy + w} A ${w} ${w} 0 0 0 ${hx + w} ${hy}" fill="${sel ? 'rgba(124,58,237,.15)' : 'rgba(255,255,255,.03)'}" stroke="${c}" stroke-width="${d.main ? 2.2 : 1.4}"/>`); }
    else { const hx = X(d.x), hy = Y(d.y - d.w / 2); out.push(`<path d="M ${hx} ${hy} L ${hx + w} ${hy} A ${w} ${w} 0 0 1 ${hx} ${hy + w}" fill="${sel ? 'rgba(124,58,237,.15)' : 'rgba(255,255,255,.03)'}" stroke="${c}" stroke-width="${d.main ? 2.2 : 1.4}"/>`); }
    if (d.main) out.push(`<text x="${X(d.x)}" y="${Y(d.y) - (d.o === 'h' ? 8 : 0)}" class="t-s" text-anchor="middle" fill="#f472b6">ENTRY</text>`);
  });
  // furniture
  f.rooms.forEach(r => r.furniture.forEach(it => {
    const c = CATALOG[it.type]; const pal = palette(r, it); const sel = S.sel && S.sel.kind === 'item' && S.sel.id === it.id;
    const fill = c.flat ? pal.rug : '#1e293b';
    const W = it.w * s, D = it.d * s;
    out.push(`<g transform="translate(${X(it.x)} ${Y(it.y)}) rotate(${-it.rot})" class="furn${sel ? ' sel' : ''}">
      <rect x="${-W / 2}" y="${-D / 2}" width="${W}" height="${D}" rx="${Math.min(4, W / 6)}" fill="${fill}" fill-opacity="${c.flat ? 0.35 : 0.92}" stroke="${sel ? '#a78bfa' : '#64748b'}" stroke-width="${sel ? 2.2 : 1}"/>
      ${c.flat ? '' : `<rect x="${-W / 2}" y="${-D / 2}" width="${W}" height="${Math.max(2, D * 0.12)}" fill="${pal.wood}" opacity=".6"/>`}
      ${Math.min(W, D) > 16 ? `<text x="0" y="${Math.min(W, D) * 0.16}" text-anchor="middle" font-size="${Math.min(W, D) * 0.42}" transform="rotate(${it.rot})">${c.icon}</text>` : ''}</g>`);
  }));
  // stairs
  const st2d = (st, tag) => { const ft = stairFoot(st), runZ = stairRun(st) === 'z', L = stairLen(st), n = 12; const lines = Array.from({ length: n - 1 }, (_, i) => { const u = L * (i + 1) / n; return runZ ? `<line x1="${X(ft.x)}" x2="${X(ft.x + ft.w)}" y1="${Y(ft.y + u)}" y2="${Y(ft.y + u)}"/>` : `<line y1="${Y(ft.y)}" y2="${Y(ft.y + ft.d)}" x1="${X(ft.x + u)}" x2="${X(ft.x + u)}"/>`; }).join('');
    const lw = stairEnd(st, 'low', -0.15), hi = stairEnd(st, 'high', -0.15); const up = tag === 'UP'; const tp = stairEnd(st, up ? 'low' : 'high', -0.45);
    return `<g class="stair2d"><rect x="${X(ft.x)}" y="${Y(ft.y)}" width="${ft.w * s}" height="${ft.d * s}" fill="${up ? '#1e293b' : 'rgba(30,41,59,.35)'}" stroke="#f59e0b" stroke-width="1.2" ${up ? '' : 'stroke-dasharray="5 4"'}/><g stroke="#64748b" stroke-width=".7">${up ? lines : ''}</g><line x1="${X(lw[0])}" y1="${Y(lw[1])}" x2="${X(hi[0])}" y2="${Y(hi[1])}" stroke="#f59e0b" stroke-width="1.4" marker-end="url(#ar2d)"/><text x="${X(tp[0])}" y="${Y(tp[1]) + 4}" text-anchor="middle" class="t-s" fill="#f59e0b">${up ? 'UP' : 'DN'}</text></g>`; };
  out.push(`<defs><marker id="ar2d" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#f59e0b"/></marker></defs>`);
  if (floorAbove(f)) (f.stairs || []).forEach(st => out.push(st2d(st, 'UP'))); stairsBelow(f).forEach(st => out.push(st2d(st, 'DN')));
  // airflow overlay
  if (S.overlay === 'air') f.rooms.forEach(r => { const ops = roomOpenings(r, f).filter(o => (o.kind === 'window' && o.ext) || o.kind === 'door'); const pt = o => o.side === 'N' || o.side === 'S' ? [o.t, o.side === 'N' ? r.y : r.y + r.d] : [o.side === 'W' ? r.x : r.x + r.w, o.t]; const wins = ops.filter(o => o.kind === 'window'); wins.forEach(w => { const targets = ops.filter(o => o !== w && o.side !== w.side); targets.slice(0, 2).forEach(o => { const a = pt(w), b = pt(o); const mx = (a[0] + b[0]) / 2 + (r.x + r.w / 2 - (a[0] + b[0]) / 2) * 0.5, my = (a[1] + b[1]) / 2 + (r.y + r.d / 2 - (a[1] + b[1]) / 2) * 0.5; out.push(`<path class="flow" d="M ${X(a[0])} ${Y(a[1])} Q ${X(mx)} ${Y(my)} ${X(b[0])} ${Y(b[1])}" fill="none" stroke="#22d3ee" stroke-width="${o.kind === 'window' ? 3 : 1.8}" stroke-dasharray="8 6" marker-end="url(#arr)" opacity=".85"/>`); }); if (!targets.length) out.push(`<circle cx="${X(pt(w)[0])}" cy="${Y(pt(w)[1])}" r="10" fill="none" stroke="#ec4899" stroke-width="2" stroke-dasharray="3 3"/>`); }); });
  // connectivity overlay
  if (S.overlay === 'graph') { const con = connectivity(f); f.rooms.forEach(a => (con.adj.get(a.id) || []).forEach(bid => { const b = findRoom(bid); if (a.id < bid) out.push(`<line x1="${X(a.x + a.w / 2)}" y1="${Y(a.y + a.d / 2)}" x2="${X(b.x + b.w / 2)}" y2="${Y(b.y + b.d / 2)}" stroke="#10b981" stroke-width="3" opacity=".7"/>`); })); f.rooms.forEach(a => out.push(`<circle cx="${X(a.x + a.w / 2)}" cy="${Y(a.y + a.d / 2)}" r="9" fill="${con.unreachable.includes(a) ? '#ec4899' : a === con.start ? '#8b5cf6' : '#10b981'}" stroke="#0b0f19" stroke-width="2"/>`)); }
  // labels
  f.rooms.forEach(r => { const fs = clamp(Math.min(r.w, r.d) * s * 0.14, 9, 15); out.push(`<g class="rlabel" transform="translate(${X(r.x + r.w / 2)} ${Y(r.y + r.d / 2)})"><text text-anchor="middle" font-size="${fs}" font-weight="700" fill="#f8fafc" y="${-fs * 0.2}">${esc(r.name)}</text><text text-anchor="middle" font-size="${fs * 0.78}" fill="#94a3b8" y="${fs}">${r.w} × ${r.d} m · ${r2(area(r))} m²</text></g>`); });
  // selection extras
  if (S.sel && S.sel.kind === 'room') { const r = findRoom(S.sel.id); if (r && f.rooms.includes(r)) {
    const hs = 7; [['n', r.x + r.w / 2, r.y], ['s', r.x + r.w / 2, r.y + r.d], ['w', r.x, r.y + r.d / 2], ['e', r.x + r.w, r.y + r.d / 2]].forEach(([k, x, y]) => out.push(`<rect class="handle" data-h="${k}" x="${X(x) - hs}" y="${Y(y) - hs}" width="${hs * 2}" height="${hs * 2}" rx="3"/>`));
    out.push(`<g class="dim"><line x1="${X(r.x)}" y1="${Y(r.y) - 18}" x2="${X(r.x + r.w)}" y2="${Y(r.y) - 18}"/><text x="${X(r.x + r.w / 2)}" y="${Y(r.y) - 23}" text-anchor="middle">${r.w} m</text><line x1="${X(r.x) - 18}" y1="${Y(r.y)}" x2="${X(r.x) - 18}" y2="${Y(r.y + r.d)}"/><text transform="translate(${X(r.x) - 23} ${Y(r.y + r.d / 2)}) rotate(-90)" text-anchor="middle">${r.d} m</text></g>`);
  } }
  if (drag2 && drag2.kind === 'moveroom' && drag2.bad) { const r = drag2.room; out.push(`<rect x="${X(r.x)}" y="${Y(r.y)}" width="${r.w * s}" height="${r.d * s}" fill="rgba(239,68,68,.18)" stroke="#ef4444" stroke-width="2.5"/><text x="${X(r.x + r.w / 2)}" y="${Y(r.y + r.d / 2) + 38}" text-anchor="middle" font-size="13" font-weight="700" fill="#fca5a5">⚠ Overlaps ${esc(drag2.bad.name)}</text>`); }
  if (drag2 && drag2.kind === 'resize' && drag2.limit) { const r = drag2.room; out.push(`<text x="${X(r.x + r.w / 2)}" y="${Y(r.y + r.d) + 16}" text-anchor="middle" class="t-s" fill="#fbbf24">Stopped by ${esc(drag2.limit.name)}</text>`); }
  if (drag2 && drag2.kind === 'draw') { const a = drag2.a, b = drag2.b; out.push(`<rect x="${X(Math.min(a[0], b[0]))}" y="${Y(Math.min(a[1], b[1]))}" width="${Math.abs(b[0] - a[0]) * s}" height="${Math.abs(b[1] - a[1]) * s}" fill="rgba(124,58,237,.15)" stroke="#a78bfa" stroke-width="2" stroke-dasharray="6 4"/><text x="${X((a[0] + b[0]) / 2)}" y="${Y((a[1] + b[1]) / 2)}" text-anchor="middle" class="t-s">${r2(Math.abs(b[0] - a[0]))} × ${r2(Math.abs(b[1] - a[1]))} m</text>`); }
  // north arrow & scale bar
  out.push(`<g transform="translate(${V2.w - 46} 46) rotate(${S.project.north || 0})"><circle r="20" fill="#111827" stroke="rgba(255,255,255,.15)"/><path d="M0,-15 L6,6 L0,2 L-6,6 z" fill="#a78bfa"/><text y="-22" text-anchor="middle" class="t-s" font-weight="700">N</text></g>`);
  out.push(`<g transform="translate(20 ${V2.h - 22})"><rect width="${s}" height="5" fill="#cbd5e1"/><rect x="${s}" width="${s}" height="5" fill="#0b0f19" stroke="#cbd5e1"/><text y="-5" class="t-s">0</text><text x="${s * 2}" y="-5" class="t-s" text-anchor="end">2 m</text></g>`);
  el.innerHTML = `<svg width="${V2.w}" height="${V2.h}" xmlns="http://www.w3.org/2000/svg">${out.join('')}</svg>`;
}
function hit2D(p) {
  const f = FL();
  if (S.sel && S.sel.kind === 'room') { const r = findRoom(S.sel.id); if (r) { const hs = 10 / V2.s; for (const [k, x, y] of [['n', r.x + r.w / 2, r.y], ['s', r.x + r.w / 2, r.y + r.d], ['w', r.x, r.y + r.d / 2], ['e', r.x + r.w, r.y + r.d / 2]]) if (Math.abs(p[0] - x) < hs && Math.abs(p[1] - y) < hs) return { kind: 'handle', h: k, room: r }; } }
  let items = []; f.rooms.forEach(r => r.furniture.forEach(it => { const fp = itemFootprint(it); if (p[0] >= fp.x && p[0] <= fp.x + fp.w && p[1] >= fp.y && p[1] <= fp.y + fp.d) items.push({ it, r, a: fp.w * fp.d, flat: CATALOG[it.type].flat }); }));
  items.sort((a, b) => (a.flat - b.flat) || a.a - b.a); if (items.length) return { kind: 'item', it: items[0].it, room: items[0].r };
  const tol = 0.25;
  for (const d of f.doors) { if ((d.o === 'h' && Math.abs(p[1] - d.y) < tol && Math.abs(p[0] - d.x) < d.w / 2) || (d.o === 'v' && Math.abs(p[0] - d.x) < tol && Math.abs(p[1] - d.y) < d.w / 2)) return { kind: 'door', d }; }
  for (const w of f.windows) { if ((w.o === 'h' && Math.abs(p[1] - w.y) < tol && Math.abs(p[0] - w.x) < w.w / 2) || (w.o === 'v' && Math.abs(p[0] - w.x) < tol && Math.abs(p[1] - w.y) < w.w / 2)) return { kind: 'window', w }; }
  const r = roomAt(p[0], p[1], f); if (r) return { kind: 'room', room: r };
  return null;
}
function nearestWall(p, f = FL()) { let best = null; wallLines(f).forEach(L => { const t = clamp(L.o === 'h' ? p[0] : p[1], L.a, L.b); const d = L.o === 'h' ? Math.hypot(p[0] - t, p[1] - L.c) : Math.hypot(p[0] - L.c, p[1] - t); if (d < 0.45 && (!best || d < best.d)) best = { d, L, t }; }); return best; }
/* ---------- room edits that behave like real walls: rooms never end up on top of each other ---------- */
const ROOM_MIN = 0.8;
function overlapping(r, f = FL()) { return f.rooms.find(q => q !== r && rectOverlap(q, r) > 0.04) || null; }
/* Moving one edge of room r. A room flush against that edge whose side fits within it (a partition you share)
   moves with the wall; any other room beside the edge is a hard stop. Doors and windows in the wall travel along. */
function roomMin(q, V, f) { // a room holding a staircase can't get too small for a (shortened) flight
  return (floorAbove(f) ? (f.stairs || []) : []).filter(st => inRoom(q, st.x, st.y)).reduce((m, st) => Math.max(m, ((stairRun(st) === 'x') === V ? 2.65 : 0.75) + WALL_T + 0.04), ROOM_MIN);
}
function edgePlan(r, side, f = floorOfRoom(r) || FL()) {
  const V = side === 'e' || side === 'w', out = side === 'e' || side === 's' ? 1 : -1, tol = 0.06;
  const lo = V ? r.y : r.x, hi = V ? r.y + r.d : r.x + r.w;
  const E0 = side === 'e' ? r.x + r.w : side === 'w' ? r.x : side === 's' ? r.y + r.d : r.y;
  const far = side === 'e' ? r.x : side === 'w' ? r.x + r.w : side === 's' ? r.y : r.y + r.d; // the opposite wall stays put
  const own = roomMin(r, V, f); let min = out > 0 ? far + own : -1e9, max = out > 0 ? 1e9 : far - own; const comove = [], block = [];
  f.rooms.forEach(q => { if (q === r) return;
    const s0 = V ? q.y : q.x, s1 = V ? q.y + q.d : q.x + q.w, a = V ? q.x : q.y, b = V ? q.x + q.w : q.y + q.d;
    if (Math.min(hi, s1) - Math.max(lo, s0) <= tol) return; // not beside this wall
    const flush = out > 0 ? Math.abs(a - E0) < tol : Math.abs(b - E0) < tol, within = s0 >= lo - tol && s1 <= hi + tol;
    if (flush && within) { comove.push(q); const qm = roomMin(q, V, f); if (out > 0) max = Math.min(max, b - qm); else min = Math.max(min, a + qm); }
    else if (out > 0 && a >= E0 - tol) { max = Math.min(max, a); block.push({ q, at: a }); }
    else if (out < 0 && b <= E0 + tol) { min = Math.max(min, b); block.push({ q, at: b }); }
  });
  const ops = [...f.doors, ...f.windows].filter(o => o.o === (V ? 'v' : 'h') && Math.abs((V ? o.x : o.y) - E0) < 0.12 && (V ? o.y : o.x) > lo - 0.05 && (V ? o.y : o.x) < hi + 0.05);
  const touch = [...f.doors, ...f.windows].filter(o => [r, ...comove].some(q => roomSideOf(q, o.o, o.x, o.y)));
  return { r, f, side, V, out, E0, far, own, min: Math.min(min, max), max, comove, block, ops, touch };
}
function applyEdge(pl, v) {
  const { r, side, V, out } = pl; v = r2(clamp(v, pl.min, pl.max));
  if (side === 'e') r.w = r2(v - r.x); else if (side === 's') r.d = r2(v - r.y);
  else if (side === 'w') { r.w = r2(r.x + r.w - v); r.x = v; } else { r.d = r2(r.y + r.d - v); r.y = v; }
  pl.comove.forEach(q => { if (out > 0) { if (V) { q.w = r2(q.x + q.w - v); q.x = v; } else { q.d = r2(q.y + q.d - v); q.y = v; } } else { if (V) q.w = r2(v - q.x); else q.d = r2(v - q.y); } });
  pl.ops.forEach(o => { if (V) o.x = v; else o.y = v; });
  return v;
}
function edgeBlocker(pl, v) { if (Math.abs(v - (pl.far + pl.out * pl.own)) < 0.07) return pl.own > ROOM_MIN + 0.01 ? { name: 'the staircase' } : null; const b = pl.block.find(x => Math.abs(x.at - v) < 0.07); return b ? b.q : pl.comove[0] ? { name: pl.comove[0].name, min: true } : null; }
/* after a wall moves: furniture stays inside its room, staircases stay inside walls, doors stay on a wall */
function tidyRooms(rooms, f = FL(), ops = null) {
  rooms.forEach(r => r.furniture.forEach(it => { const fp = itemFootprint(it), hw = Math.min(fp.w, r.w) / 2, hd = Math.min(fp.d, r.d) / 2; it.x = r2(clamp(it.x, r.x + hw + 0.02, r.x + r.w - hw - 0.02)); it.y = r2(clamp(it.y, r.y + hd + 0.02, r.y + r.d - hd - 0.02)); }));
  fixOpenings(f, ops || [...f.doors, ...f.windows].filter(o => rooms.some(q => roomSideOf(q, o.o, o.x, o.y)))); fitStairs(f);
}
/* doors / windows in `list` that no longer sit on a wall slide back onto the nearest stretch of the same wall line */
function fixOpenings(f, list) {
  const lines = wallLines(f), only = new Set(list);
  const keep = o => { if (!only.has(o)) return true; const c = o.o === 'h' ? o.y : o.x, t = o.o === 'h' ? o.x : o.y, half = o.w / 2 + 0.05;
    const cand = lines.filter(L => L.o === o.o && Math.abs(L.c - c) < 0.12 && L.b - L.a >= o.w + 0.1);
    if (!cand.length) return false;
    const L = cand.find(L => t >= L.a + half - 0.01 && t <= L.b - half + 0.01) || cand.sort((p, q) => Math.min(Math.abs(t - p.a), Math.abs(t - p.b)) - Math.min(Math.abs(t - q.a), Math.abs(t - q.b)))[0];
    const nt = r2(clamp(t, L.a + half, L.b - half)); if (o.o === 'h') { o.x = nt; o.y = L.c; } else { o.y = nt; o.x = L.c; } return true; };
  f.doors = f.doors.filter(keep); f.windows = f.windows.filter(keep);
}
/* set a room's size from numbers (inspector, Aria): grow east/south first, then west/north if that side is blocked */
function resizeRoomTo(r, w, d) {
  const f = floorOfRoom(r) || FL(), rooms = [r], touch = []; let lim = null;
  const step = (side, val) => { const pl = edgePlan(r, side, f); touch.push(...pl.touch); const got = applyEdge(pl, val); rooms.push(...pl.comove); return Math.abs(got - val) > 0.08 ? (edgeBlocker(pl, got) || { name: 'the wall' }) : null; };
  if (w != null) { const b = step('e', r.x + w); if (b && w > r.w + 0.05) { const b2 = step('w', r.x + r.w - w); if (b2) lim = b; } else if (b) lim = b; }
  if (d != null) { const b = step('s', r.y + d); if (b && d > r.d + 0.05) { const b2 = step('n', r.y + r.d - d); if (b2) lim = lim || b; } else if (b) lim = lim || b; }
  tidyRooms([...new Set(rooms)], f, touch); return lim;
}
function edgeSnap(v, axis, except) { let best = null; FL().rooms.forEach(r => { if (r === except) return; (axis === 'x' ? [r.x, r.x + r.w] : [r.y, r.y + r.d]).forEach(e => { if (Math.abs(e - v) < 0.2 && (!best || Math.abs(e - v) < Math.abs(best - v))) best = e; }); }); return best != null ? best : snap(v); }
function init2D() {
  const el = document.getElementById('plan2d');
  el.addEventListener('pointerdown', e => {
    if (S.view !== '2d') return; el.setPointerCapture(e.pointerId);
    const rc = el.getBoundingClientRect(); const px = e.clientX - rc.left, py = e.clientY - rc.top; const p = toPlan(px, py);
    if (tool2d === 'room') { drag2 = { kind: 'draw', a: [snap(p[0]), snap(p[1])], b: [snap(p[0]), snap(p[1])] }; return; }
    if (tool2d === 'door' || tool2d === 'window') {
      const nw = nearestWall(p); if (!nw) { toast('Click closer to a wall'); return; }
      const L = nw.L; const w = tool2d === 'door' ? 0.9 : 1.2; if (L.b - L.a < w + 0.1) { toast('That wall segment is too short'); return; }
      const t = clamp(snap(nw.t), L.a + w / 2 + 0.05, L.b - w / 2 - 0.05);
      if (tool2d === 'window' && !isExteriorPoint(FL(), L.o, L.c, t)) { toast('Windows go on outside walls'); return; }
      commit('Add ' + tool2d);
      const o = { id: uid(tool2d[0]), o: L.o, x: L.o === 'h' ? t : L.c, y: L.o === 'h' ? L.c : t, w };
      if (tool2d === 'door') FL().doors.push(o); else FL().windows.push(Object.assign(o, { sill: 0.9, h: 1.25 }));
      S.sel = { kind: tool2d, id: o.id }; setTool('select'); rebuild(); renderInspector(); save(); return;
    }
    if (tool2d === 'place' && pendingType) {
      const r = roomAt(p[0], p[1]); if (!r) { toast('Click inside a room'); return; }
      commit('Place ' + CATALOG[pendingType].label); const it = makeItem(pendingType, r, { x: r2(snap(p[0])), y: r2(snap(p[1])) }); r.furniture.push(it);
      S.sel = { kind: 'item', id: it.id }; setTool('select'); rebuild(); renderInspector(); save(); return;
    }
    const h = hit2D(p);
    if (h && h.kind === 'handle') drag2 = { kind: 'resize', h: h.h, room: h.room, p0: p, r0: { ...h.room }, committed: false };
    else if (h && h.kind === 'item') { S.sel = { kind: 'item', id: h.it.id }; drag2 = { kind: 'item', it: h.it, room: h.room, off: [h.it.x - p[0], h.it.y - p[1]], committed: false, start: [h.it.x, h.it.y] }; }
    else if (h && h.kind === 'door') { S.sel = { kind: 'door', id: h.d.id }; drag2 = { kind: 'opening', o: h.d, committed: false }; }
    else if (h && h.kind === 'window') { S.sel = { kind: 'window', id: h.w.id }; drag2 = { kind: 'opening', o: h.w, committed: false }; }
    else if (h && h.kind === 'room') { S.sel = { kind: 'room', id: h.room.id }; drag2 = { kind: 'moveroom', room: h.room, p0: p, r0: { x: h.room.x, y: h.room.y }, committed: false }; }
    else { S.sel = null; drag2 = { kind: 'pan', px, py, x: V2.x, y: V2.y }; }
    selectApply(S.sel); renderInspector(); render2D();
  });
  el.addEventListener('pointermove', e => {
    if (!drag2) return; const rc = el.getBoundingClientRect(); const px = e.clientX - rc.left, py = e.clientY - rc.top; const p = toPlan(px, py);
    const once = label => { if (!drag2.committed) { commit(label); drag2.committed = true; } };
    if (drag2.kind === 'pan') { V2.x = drag2.x - (px - drag2.px) / V2.s; V2.y = drag2.y - (py - drag2.py) / V2.s; render2D(); return; }
    if (drag2.kind === 'draw') { drag2.b = [snap(p[0]), snap(p[1])]; render2D(); return; }
    if (drag2.kind === 'item') { once('Move furniture'); drag2.it.x = r2(snap(p[0] + drag2.off[0])); drag2.it.y = r2(snap(p[1] + drag2.off[1])); render2D(); return; }
    if (drag2.kind === 'opening') { const o = drag2.o; const nw = nearestWall(p); if (!nw) return; once('Move opening'); const L = nw.L; const t = clamp(snap(nw.t), L.a + o.w / 2 + 0.05, L.b - o.w / 2 - 0.05); o.o = L.o; o.x = L.o === 'h' ? t : L.c; o.y = L.o === 'h' ? L.c : t; render2D(); return; }
    if (drag2.kind === 'moveroom') {
      const r = drag2.room; const dx = snap(p[0] - drag2.p0[0]), dy = snap(p[1] - drag2.p0[1]); if (!drag2.committed && Math.abs(dx) + Math.abs(dy) < 0.05) return; once('Move room');
      const nx = edgeSnap(drag2.r0.x + dx, 'x', r), ny = edgeSnap(drag2.r0.y + dy, 'y', r); const mx = nx - r.x, my = ny - r.y;
      if (!drag2.ops) { const f = FL(); drag2.ops = [...f.doors, ...f.windows].filter(o => roomSideOf(r, o.o, o.x, o.y) && isExteriorPoint(f, o.o, o.o === 'h' ? o.y : o.x, o.o === 'h' ? o.x : o.y)); }
      if (!drag2.stairs) drag2.stairs = (FL().stairs || []).filter(st => inRoom(r, st.x, st.y));
      r.x = r2(nx); r.y = r2(ny); r.furniture.forEach(it => { it.x = r2(it.x + mx); it.y = r2(it.y + my); }); drag2.ops.forEach(o => { o.x = r2(o.x + mx); o.y = r2(o.y + my); }); drag2.stairs.forEach(st => { st.x = r2(st.x + mx); st.y = r2(st.y + my); });
      drag2.bad = overlapping(r); render2D(); return;
    }
    if (drag2.kind === 'resize') {
      const r = drag2.room, r0 = drag2.r0; once('Resize ' + r.name);
      if (!drag2.warned) { const f = FL(); const mid = drag2.h === 'n' ? ['h', r0.y, r0.x + r0.w / 2] : drag2.h === 's' ? ['h', r0.y + r0.d, r0.x + r0.w / 2] : drag2.h === 'w' ? ['v', r0.x, r0.y + r0.d / 2] : ['v', r0.x + r0.w, r0.y + r0.d / 2]; drag2.ext = isExteriorPoint(f, mid[0], mid[1], mid[2]); drag2.warned = true; }
      // the edge behaves like a real wall: a partition shared with a smaller neighbour moves both rooms; anything else stops it
      if (!drag2.plan) drag2.plan = edgePlan(r, drag2.h);
      const want = drag2.h === 'e' || drag2.h === 'w' ? edgeSnap(p[0], 'x', r) : edgeSnap(p[1], 'y', r);
      const got = applyEdge(drag2.plan, want); drag2.limit = Math.abs(got - want) > 0.08 ? edgeBlocker(drag2.plan, got) : null;
      render2D(); renderInspector(); return;
    }
  });
  el.addEventListener('pointerup', () => {
    if (!drag2) return; const d = drag2; drag2 = null;
    if (d.kind === 'draw') { const a = d.a, b = d.b; const w = r2(Math.abs(b[0] - a[0])), dd = r2(Math.abs(b[1] - a[1]));
      const hit = w >= 0.8 && dd >= 0.8 && overlapping({ x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w, d: dd });
      if (hit) { render2D(); toast(`That overlaps ${hit.name}. Draw the new room in empty space, or shrink ${hit.name} first.`, 4200); return; }
      if (w >= 0.8 && dd >= 0.8) { commit('Add room'); const r = makeRoom({ name: 'New Room', type: 'empty', x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w, d: dd }); FL().rooms.push(r); S.sel = { kind: 'room', id: r.id }; setTool('select'); rebuild(); renderInspector(); save(); toast('Room added — set its type in the inspector'); } else render2D(); return; }
    if (d.kind === 'item' && d.committed) { const nr = roomAt(d.it.x, d.it.y); if (nr && nr !== d.room) { d.room.furniture.splice(d.room.furniture.indexOf(d.it), 1); nr.furniture.push(d.it); } else if (!nr) { d.it.x = d.start[0]; d.it.y = d.start[1]; } }
    if (d.kind === 'moveroom' && d.committed && d.bad) { // never leave two rooms on top of each other
      const r = d.room, mx = d.r0.x - r.x, my = d.r0.y - r.y; r.x = d.r0.x; r.y = d.r0.y;
      r.furniture.forEach(it => { it.x = r2(it.x + mx); it.y = r2(it.y + my); }); (d.ops || []).forEach(o => { o.x = r2(o.x + mx); o.y = r2(o.y + my); }); (d.stairs || []).forEach(st => { st.x = r2(st.x + mx); st.y = r2(st.y + my); });
      toast(`${r.name} can't sit on top of ${d.bad.name} — moved it back. Drop it in empty space or next to a wall.`, 4200);
    } else if (d.kind === 'moveroom' && d.committed) fitStairs(FL());
    if (d.kind === 'resize' && d.committed) { tidyRooms([d.room, ...(d.plan ? d.plan.comove : [])], FL(), d.plan && d.plan.touch); if (d.limit) toast(d.limit.name === 'the staircase' ? `${d.room.name} can't get any smaller — the staircase inside needs this space.` : d.limit.min ? `${d.limit.name} is already as small as a room can be, so the wall stops here.` : `Stopped at ${d.limit.name}'s wall so the rooms don't overlap. Shrink or move ${d.limit.name} to go further.`, 4200); }
    if (d.kind === 'resize' && d.committed && d.ext) { const msg = `${d.room.name}: an outer wall was moved. External walls are typically load-bearing — have a structural engineer review this change.`; S.structuralLog.push(msg); toast('⚠️ Structural warning: outer wall moved — flagged for professional review', 4200); }
    if (d.kind === 'resize' && d.committed && !d.ext && !d.limit) toast(d.plan && d.plan.comove.length ? `Partition wall moved — ${d.plan.comove.map(q => q.name).join(', ')} resized with it.` : 'Partition wall moved. Check adjoining room sizes.');
    if (d.committed) { rebuild(); save(); }
  });
  el.addEventListener('wheel', e => { if (S.view !== '2d') return; e.preventDefault(); const rc = el.getBoundingClientRect(); const px = e.clientX - rc.left, py = e.clientY - rc.top; const p = toPlan(px, py); V2.s = clamp(V2.s * (e.deltaY > 0 ? 0.9 : 1.1), 8, 300); V2.x = p[0] - px / V2.s; V2.y = p[1] - py / V2.s; render2D(); }, { passive: false });
  window.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea,select')) return; if (!S.project || document.getElementById('app').dataset.screen !== 'work') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); deleteSelected(); }
    if (e.key.toLowerCase() === 'r' && S.sel && S.sel.kind === 'item' && CTL?.mode !== 'walk') rotateSelected();
    if (e.key === 'Escape') { setTool('select'); if (S.touring) stopTour(); else if (CTL && CTL.mode === 'walk' && S.view === 'walk') setView('3d'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  });
}
function deleteSelected() {
  const s = S.sel; if (!s) return; commit('Delete');
  if (s.kind === 'item') { const f = findItem(s.id); if (f) f.room.furniture.splice(f.room.furniture.indexOf(f.it), 1); }
  else if (s.kind === 'room') { const r = findRoom(s.id); const f = floorOfRoom(r); f.rooms.splice(f.rooms.indexOf(r), 1); }
  else if (s.kind === 'door') { const f = FL(); f.doors = f.doors.filter(d => d.id !== s.id); }
  else if (s.kind === 'window') { const f = FL(); f.windows = f.windows.filter(d => d.id !== s.id); }
  S.sel = null; rebuild(); renderInspector(); save();
}
function rotateSelected(deg = 90) { const f = S.sel && findItem(S.sel.id); if (!f) return; commit('Rotate'); f.it.rot = (f.it.rot + deg + 360) % 360; rebuild(); renderInspector(); save(); }

/* ===================== ARIA'S ANIMATED HOME TOUR ===================== */
const TOUR = { order: [], i: -1, token: 0, paused: false, voice: true, narr: {}, speaking: false };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function pickVoice() { try { const vs = speechSynthesis.getVoices(); return vs.find(v => /en-IN/i.test(v.lang) && /female|veena|heera|neerja/i.test(v.name)) || vs.find(v => /en-IN/i.test(v.lang)) || vs.find(v => /en-GB/i.test(v.lang) && /female/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)); } catch (e) { return null; } }
function speak(text, tok) {
  setCaption(text); setTalking(true);
  const words = text.split(/\s+/).length; const est = Math.max(3500, words / 2.6 * 1000);
  return new Promise(res => {
    let finished = false; const done = () => { if (finished) return; finished = true; setTalking(false); res(); };
    if (TOUR.voice && 'speechSynthesis' in window) {
      try {
        speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); const v = pickVoice(); if (v) u.voice = v; u.rate = 1.0; u.pitch = 1.05;
        u.onend = done; u.onerror = () => setTimeout(done, est); speechSynthesis.speak(u);
        setTimeout(() => { if (!finished && !speechSynthesis.speaking && !speechSynthesis.pending && !TOUR.paused) { (async () => { let t = 1200; while (t < est && !finished) { await sleep(200); if (tok !== TOUR.token) break; if (!TOUR.paused) t += 200; } done(); })(); } }, 1200);
        // safety: some browsers never fire onend
        const guard = async () => { const t0 = Date.now(); while (!finished) { await sleep(250); if (tok !== TOUR.token) return done(); if (TOUR.paused) continue; if (Date.now() - t0 > est * 1.6 + 3000) return done(); } }; guard();
        return;
      } catch (e) { }
    }
    (async () => { let t = 0; while (t < est) { await sleep(200); if (tok !== TOUR.token) break; if (!TOUR.paused) t += 200; } done(); })();
  });
}
function setCaption(t) { const el = document.getElementById('tour-caption'); if (el) { el.classList.remove('in'); void el.offsetWidth; el.textContent = t; el.classList.add('in'); } }
function setTalking(on) { TOUR.speaking = on; document.querySelectorAll('.aria-avatar').forEach(a => a.classList.toggle('talking', on)); }
async function waitPaused(tok) { while (TOUR.paused && tok === TOUR.token) await sleep(150); return tok === TOUR.token; }
function tourOrder() {
  const out = []; const floors = P().floors.slice().sort((a, b) => a.level - b.level);
  floors.forEach((f, k) => {
    const con = connectivity(f); let start = con.start;
    if (k > 0) { const st = stairsBelow(f)[0]; if (st) start = roomAt(...stairEnd(st, 'high', 0.5), f) || start; }
    const ids = [], seen = new Set(); const q = start ? [start.id] : []; if (start) seen.add(start.id);
    while (q.length) { const id = q.shift(); ids.push(id); (con.adj.get(id) || []).forEach(n => { if (!seen.has(n)) { seen.add(n); q.push(n); } }); }
    f.rooms.forEach(r => { if (!seen.has(r.id)) ids.push(r.id); });
    const wells = [...(f.stairs || []), ...stairsBelow(f)].map(stairFoot);
    out.push(...ids.map(findRoom).filter(r => r && !(r.type === 'hall' && (area(r) < 3 || /stair|landing/i.test(r.name) || wells.some(w => rectOverlap(w, r) > area(r) * 0.35)))));
  });
  return out;
}
/* camera path up (or down) the staircase between two floors */
function stairPath(fromF, toF) {
  const goingUp = toF.level > fromF.level; const lo = goingUp ? fromF : toF, up = goingUp ? toF : fromF; const st = (lo.stairs || [])[0]; if (!st || Math.abs(toF.level - fromF.level) !== 1) return null;
  const yl = floorY(lo) + 1.6, yu = floorY(up) + 1.6; const lw0 = stairEnd(st, 'low', 0.9), lw = stairEnd(st, 'low', 0), hi = stairEnd(st, 'high', 0.15), hi1 = stairEnd(st, 'high', 1.0);
  const pts = [[lw0[0], yl, lw0[1]], [lw[0], yl + 0.1, lw[1]], [hi[0], yu, hi[1]], [hi1[0], yu, hi1[1]]];
  const look = (a, b) => { const d = V3.sub(b, a); return V3.add(b, V3.scale(V3.norm(d), 2)); };
  if (!goingUp) pts.reverse();
  return { pos: pts, tgt: pts.map((p, i) => look(pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)])), arrive: goingUp ? roomAt(hi1[0], hi1[1], up) : roomAt(lw0[0], lw0[1], lo) };
}
async function startTour(fromIndex = 0) {
  if (!S.project || !E) return;
  if (S.view === '2d') setView('3d');
  if (CTL.mode === 'walk') { CTL.mode = 'orbit'; }
  stopSpeech();
  const tok = ++TOUR.token; TOUR.paused = false; S.touring = true; select(null);
  TOUR.order = (await serverTourOrder()) || tourOrder(); TOUR.i = fromIndex - 1;
  if (TOUR.order[0]) P().activeFloor = P().floors.indexOf(floorOfRoom(TOUR.order[Math.max(0, fromIndex)] || TOUR.order[0]));
  TOUR.narr = {}; TOUR.order.forEach(r => TOUR.narr[r.id] = templateNarration(r));
  TOUR.intro = `Hi, I'm Aria, your DIMORA guide! Welcome to ${P().name}: ${P().floors.length > 1 ? P().floors.length + ' floors, ' : ''}${allRooms().length} rooms and about ${Math.round(allRooms().reduce((s, r) => s + area(r), 0) * SQFT)} square feet, styled ${P().theme}. Let's walk through it together — you can pause anytime and ask me to change things.`;
  TOUR.outro = `That's the tour! The complete interior is estimated at ${inr(homeCost().total)}. Ask me to tweak anything, or open the Home Decision Report for the full breakdown.`;
  document.getElementById('app').classList.add('touring'); CTL.enabled = false;
  renderTourUI(); rebuild();
  if (aiOn()) { setTourStatus(`${modelLabel()} is writing your personalised narration…`); serverNarrations(TOUR.order).then(j => { if (tok !== TOUR.token) return; if (j.intro) TOUR.intro = j.intro; if (j.outro) TOUR.outro = j.outro; Object.entries(j.rooms || {}).forEach(([k, v]) => { if (TOUR.narr[k] && v) TOUR.narr[k] = v; }); setTourStatus('Narration by ' + (j.via ? 'Qwen' : modelLabel())); }).catch(e => setTourStatus('Narration: on-device (' + modelLabel() + ' unavailable)')); }
  else setTourStatus(S.backendOK ? 'Narration: on-device · connect Cloudflare AI in ⚙ for AI-written narration' : 'Narration: on-device · start the DIMORA backend for AI narration');
  const b = homeBounds(FL()), c = [b.x + b.w / 2, floorY(FL()), b.y + b.d / 2], R = Math.max(b.w, b.d);
  if (fromIndex === 0) {
    const ring = [0, 1, 2].map(i => { const a = -0.6 + i * 0.75; return [c[0] + Math.sin(a) * R * 1.15, c[1] + R * 0.75, c[2] + Math.cos(a) * R * 1.15]; });
    const sp = speak(TOUR.intro, tok);
    await CTL.flyPath(ring, ring.map(() => c), 7.5);
    await sp; if (!(await waitPaused(tok))) return;
  }
  await tourLoop(tok);
}
async function tourLoop(tok) {
  while (tok === TOUR.token) {
    TOUR.i++;
    if (TOUR.i >= TOUR.order.length) break;
    const r = TOUR.order[TOUR.i]; let prev = TOUR.order[TOUR.i - 1];
    const fr = floorOfRoom(r), pj = P();
    if (pj.floors.indexOf(fr) !== pj.activeFloor) { // change floor: ride the staircase
      const fromF = pj.floors[pj.activeFloor]; pj.activeFloor = pj.floors.indexOf(fr); rebuild(); renderTourUI();
      const sp = prev ? stairPath(fromF, fr) : null;
      if (sp) { const say = speak(fr.level > fromF.level ? `Let's head up the stairs to the ${fr.name}.` : `Now back down to the ${fr.name}.`, tok);
        // walk through the door of the room the flight starts in, then ride the stairs
        const p0 = sp.pos[0], sr = roomAt(p0[0], p0[2], fromF); const via = [], vt = [];
        if (sr && prev && sr !== prev) { const sh = roomShot(sr, prev); if (sh.door) { const out = V3.add(sh.door, V3.scale(V3.norm(V3.sub(sh.door, p0)), 0.8)); via.push(out, sh.door); vt.push(sh.door, p0); } }
        await CTL.flyPath([...via, ...sp.pos], [...vt, ...sp.tgt], 3.2 + via.length * 0.8); await say; if (tok !== TOUR.token) return; prev = sp.arrive || null; }
      else prev = null;
    }
    renderTourUI();
    const shot = roomShot(r, prev);
    const via = [];
    if (shot.door) { const tc = [shot.target[0], shot.door[1], shot.target[2]]; const out = V3.add(shot.door, V3.scale(V3.norm(V3.sub(shot.door, tc)), 0.9)); const inn = V3.add(shot.door, V3.scale(V3.norm(V3.sub(tc, shot.door)), 0.5)); if (!prev) via.push([out[0], out[1] + 2.5, out[2]]); via.push(out, shot.door, inn); }
    const targets = via.map(() => shot.target);
    await CTL.flyPath([...via, shot.pos], [...targets, shot.target], prev ? 2.6 : 3.4);
    if (tok !== TOUR.token) return;
    // slow cinematic drift while narrating
    const drift = V3.lerp(shot.pos, [shot.target[0], shot.pos[1], shot.target[2]], 0.12); const side = [shot.target[0] + (shot.target[2] - shot.pos[2]) * 0.3, shot.target[1], shot.target[2] - (shot.target[0] - shot.pos[0]) * 0.3];
    const narr = TOUR.narr[r.id] || templateNarration(r);
    CTL.flyTo(drift, side, Math.max(6, narr.split(/\s+/).length / 2.6), { locked: true, ease: t => t });
    await speak(narr, tok);
    if (!(await waitPaused(tok))) return;
    await sleep(350);
  }
  if (tok !== TOUR.token) return;
  TOUR.i = TOUR.order.length; renderTourUI();
  const b = homeBounds(FL()), c = [b.x + b.w / 2, floorY(FL()), b.y + b.d / 2], R = Math.max(b.w, b.d);
  CTL.flyTo([c[0] - R * 0.6, c[1] + R * 1.1, c[2] + R * 0.9], c, 3, { locked: true });
  await speak(TOUR.outro, tok);
  if (tok === TOUR.token) { setTourStatus('Tour complete — ask Aria for changes or replay.'); document.getElementById('tour-play').innerHTML = '↻'; TOUR.ended = true; }
}
function stopSpeech() { try { speechSynthesis.cancel(); } catch (e) { } setTalking(false); }
function stopTour() {
  TOUR.token++; stopSpeech(); S.touring = false; TOUR.ended = false;
  document.getElementById('app').classList.remove('touring'); if (CTL) { CTL.enabled = true; CTL.anim = null; CTL.syncFromCam('orbit'); }
  rebuild(); fitView(true);
}
function tourJump(delta) {
  if (!S.touring) return; const tok = ++TOUR.token; stopSpeech(); TOUR.paused = false; TOUR.ended = false;
  TOUR.i = clamp(TOUR.i + delta, 0, TOUR.order.length - 1) - 1; if (CTL) CTL.anim = null;
  tourLoop(tok);
}
function tourGo(idx) { if (!S.touring) return; const tok = ++TOUR.token; stopSpeech(); TOUR.paused = false; TOUR.i = idx - 1; if (CTL) CTL.anim = null; tourLoop(tok); }
function tourTogglePause() {
  if (TOUR.ended) { TOUR.ended = false; startTour(0); return; }
  TOUR.paused = !TOUR.paused;
  try { TOUR.paused ? speechSynthesis.pause() : speechSynthesis.resume(); } catch (e) { }
  renderTourUI();
}
function setTourStatus(t) { const el = document.getElementById('tour-status'); if (el) el.textContent = t; }
function tourRoom() { return S.touring && TOUR.order[TOUR.i] ? TOUR.order[TOUR.i] : null; }
function renderTourUI() {
  const el = document.getElementById('tour'); if (!el) return;
  const r = tourRoom();
  document.getElementById('tour-play').innerHTML = TOUR.paused ? '▶' : '❚❚';
  document.getElementById('tour-voice').classList.toggle('off', !TOUR.voice);
  const mf = P().floors.length > 1; document.getElementById('tour-chips').innerHTML = TOUR.order.map((x, i) => `${mf && (i === 0 || floorOfRoom(x) !== floorOfRoom(TOUR.order[i - 1])) ? `<span class="tour-floor">${esc(floorOfRoom(x).name)}</span>` : ''}<button class="chip ${i === TOUR.i ? 'on' : i < TOUR.i ? 'done' : ''}" data-act="tour-go" data-i="${i}">${ROOM_TYPES[x.type].icon} ${esc(x.name)}</button>`).join('');
  document.getElementById('tour-room').innerHTML = r ? `<b>${esc(r.name)}</b><span>${r.w} × ${r.d} m · ${r2(area(r))} m² · ${inr(roomCost(r).total)}</span>` : `<b>${esc(P().name)}</b><span>${P().theme} · ${allRooms().length} rooms</span>`;
  renderTourEdit();
  renderMinimap();
}
function renderTourEdit() {
  const box = document.getElementById('tour-edit'); if (!box) return; const r = tourRoom();
  if (!r) { box.innerHTML = `<p class="muted">Changes apply to the room you're in. Wait for the first room, or type below to change the whole home.</p>`; return; }
  const sug = paintSuggestions(r);
  box.innerHTML = `
    <div class="te-row"><label>Wall colour</label><div class="swatches">${sug.map(s => `<button class="sw" title="${esc(s.name)} — ${esc(s.why)}" style="background:${s.hex}" data-act="tour-wall" data-c="${s.hex}" data-n="${esc(s.name)}"></button>`).join('')}<input type="color" value="${roomWall(r)}" data-act-input="tour-wall-custom"></div></div>
    <div class="te-row"><label>Flooring</label><select data-act-change="tour-floor">${Object.entries(FLOORS).map(([k, v]) => `<option value="${k}" ${roomFloorKey(r) === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div>
    <div class="te-row"><label>Style</label><div class="mini-chips">${Object.keys(THEMES).map(t => `<button class="chip ${(r.theme || P().theme) === t ? 'on' : ''}" data-act="tour-theme" data-t="${t}">${t}</button>`).join('')}</div></div>
    <div class="te-row"><label>Transform</label><div class="mini-chips">${TRANSFORMS.filter(t => t.to !== r.type).slice(0, 6).map(t => `<button class="chip" data-act="tour-transform" data-t="${t.to}">${ROOM_TYPES[t.to].icon} ${t.label}</button>`).join('')}</div></div>
    <div class="te-row"><button class="btn sm" data-act="tour-refurnish">↻ Re-arrange furniture</button><button class="btn sm" data-act="tour-budget">💸 Make it cheaper</button></div>`;
}
function renderMinimap() {
  const el = document.getElementById('tour-map'); if (!el) return; const f = FL(), b = homeBounds(f); const s = Math.min(170 / b.w, 120 / b.d); const r = tourRoom();
  el.innerHTML = `<svg width="${b.w * s + 10}" height="${b.d * s + 10}"><g transform="translate(5 5)">${f.rooms.map(x => `<rect x="${(x.x - b.x) * s}" y="${(x.y - b.y) * s}" width="${x.w * s}" height="${x.d * s}" fill="${x === r ? '#8b5cf6' : TOUR.order.indexOf(x) < TOUR.i && TOUR.order.includes(x) ? '#0e7490' : '#1e293b'}" stroke="#05050a" stroke-width="1.5"/>`).join('')}${TOUR.order.slice(0, Math.max(0, TOUR.i + 1)).map((x, i, a) => i ? `<line x1="${(a[i - 1].x + a[i - 1].w / 2 - b.x) * s}" y1="${(a[i - 1].y + a[i - 1].d / 2 - b.y) * s}" x2="${(x.x + x.w / 2 - b.x) * s}" y2="${(x.y + x.d / 2 - b.y) * s}" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 2"/>` : '').join('')}${r ? `<circle cx="${(r.x + r.w / 2 - b.x) * s}" cy="${(r.y + r.d / 2 - b.y) * s}" r="5" fill="#fff" class="pulse"/>` : ''}</g></svg>`;
}
async function tourApply(actions, msg) {
  const r = tourRoom(); TOUR.paused = true; try { speechSynthesis.cancel(); } catch (e) { } setTalking(false);
  const res = execActions(actions, r);
  const line = msg || res.done.join(' ') || 'Done.';
  renderTourUI(); if (r) { TOUR.narr[r.id] = templateNarration(r); }
  addChat('aria', line);
  const tok = TOUR.token; TOUR.paused = false; await speak(line, tok); if (tok === TOUR.token) { TOUR.paused = true; renderTourUI(); setTourStatus('Paused after your change — press ▶ to continue the tour.'); }
}
async function tourAsk(text) {
  const r = tourRoom(); TOUR.paused = true; try { speechSynthesis.cancel(); } catch (e) { }
  addChat('user', text); setTourStatus('Aria is thinking…');
  const out = await askAria(text, r);
  addChat('aria', out.reply, out.via);
  renderTourUI(); const tok = TOUR.token; TOUR.paused = false; await speak(out.reply, tok);
  if (tok === TOUR.token && S.touring) { TOUR.paused = true; renderTourUI(); setTourStatus('Paused — press ▶ to continue the tour.'); }
}

/* ===================== APP SHELL, PANELS & INTERACTIONS ===================== */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
function toast(msg, ms = 2600) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), ms); }
function show(screen) { if (!['login', 'intro', 'landing', 'private-home'].includes(screen) && !currentUser()) { screen = 'login'; renderAuth(); } else if (!['login', 'intro', 'landing', 'private-home'].includes(screen) && !currentUser().answers?.done) { screen = 'intro'; renderIntro(); } $('#app').dataset.screen = screen; window.scrollTo(0, 0); if (screen === 'dash') renderDash(); try { updateUserChips(); } catch (e) { } }
function commit(label) { if (!S.project) return; S.history.push(JSON.stringify(S.project)); if (S.history.length > 40) S.history.shift(); S.future = []; }
function undo() { if (!S.history.length) return toast('Nothing to undo'); S.future.push(JSON.stringify(S.project)); S.project = JSON.parse(S.history.pop()); S.sel = null; rebuild(); renderInspector(); save(); toast('Undone'); }
function redo() { if (!S.future.length) return toast('Nothing to redo'); S.history.push(JSON.stringify(S.project)); S.project = JSON.parse(S.future.pop()); S.sel = null; rebuild(); renderInspector(); save(); }
let saveT = null;
function save(withThumb) {
  if (!S.project || S.viewOnly) return; S.project.updated = Date.now();
  clearTimeout(saveT); saveT = setTimeout(() => {
    const pj = Object.assign({}, S.project, { planImage: null });
    store.set('proj_' + pj.id, pj);
    const list = store.get('projects', []).filter(p => p.id !== pj.id);
    let thumb = (store.get('projects', []).find(p => p.id === pj.id) || {}).thumb;
    if ((withThumb || !thumb) && E && S.view !== '2d' && !S.touring) { try { thumb = E.snapshot(360, 220); } catch (e) { } }
    list.unshift({ id: pj.id, name: pj.name, updated: pj.updated, thumb, rooms: allRooms().length, cost: homeCost().total, theme: pj.theme, owner: projOwner() });
    store.set('projects', list.slice(0, 40));
    if (isCloud()) { setSyncChip('busy'); cloudPush(pj, thumb); }
  }, 500);
}
function updateAIBadge() {
  if (PRIVATE_HOST) $('#app').dataset.backend = aiOn() ? 'ai' : S.backendOK ? 'connected' : 'local';
  const a = S.backend && S.backend.ai;
  const st = !S.backendOK ? ['key', 'Browser mode'] : !a || !a.active ? ['key', 'AI · not connected'] : a.active === 'cloudflare' ? ['ok', 'Cloudflare AI'] : a.active === 'ollama' ? ['ok', 'Qwen · local'] : ['ok', 'AI · OpenRouter'];
  $$('.gbadge').forEach(b => { b.className = 'gbadge ' + st[0]; b.textContent = st[1]; b.title = S.backendOK ? modelLabel() : 'Running the in-browser engine. For the accurate detector and Cloudflare AI, run the DIMORA backend (run.bat) and open http://127.0.0.1:8000'; });
  const ce = $('#chat-engine'); if (ce) ce.textContent = aiOn() ? modelLabel() : S.backendOK ? 'Rule-based engine · connect Cloudflare AI in ⚙' : 'In-browser engine · backend offline';
}
function updateTopStats() {
  const el = $('#top-stats'); if (!el || !S.project) return; const c = homeCost(); const built = allRooms().filter(r => !isYard(r)); const A = built.reduce((s, r) => s + area(r), 0);
  el.innerHTML = `${P().floors.length > 1 ? `<span><b>${P().floors.length}</b> floors</span>` : ''}<span><b>${built.length}</b> rooms</span><span title="Built-up area (parking and garden not included)"><b>${Math.round(A * SQFT).toLocaleString('en-IN')}</b> sq ft</span><span><b>${inr(c.total)}</b> est.</span><span>${P().theme}</span>`;
}

/* ---------- views ---------- */
function setView(v, opts = {}) {
  if (!E && v === '3d') return openRenderedView();
  if (!FLOW.busy && FLOW.step) { FLOW.step = null; FLOW.room = null; setTimeout(renderFlowNav, 0); } else setTimeout(renderFlowNav, 0);
  if (S.touring && v !== '3d') stopTour();
  const prev = S.view; S.view = v; $('#app').dataset.view = v; renderFloorSeg();
  $$('#view-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if (v === '2d') { V2.init = false; render2D(); setTool('select'); renderInspector(); return; }
  if (!E) return;
  if (v === 'walk' && opts.outside) { walkOutside(prev, opts.outside === 'street' ? 'street' : 'garden'); E.dirty = true; renderInspector(); return; }
  if (v === 'walk') {
    const f = FL(); const con = connectivity(f); const r = con.start || f.rooms[0]; const sh = roomShot(r);
    CTL.mode = 'walk'; rebuild();
    CTL.flyTo(sh.pos, sh.target, prev === '2d' ? 0.01 : 1.4, { mode: 'walk' }).then(() => toast('Walking — arrow keys (or W A S D) to move, drag to look around'));
  } else {
    const wasWalk = CTL.mode === 'walk'; CTL.mode = 'orbit'; rebuild();
    if (prev === '2d') { fitView(false, true); setTimeout(() => fitView(true), 60); }
    else if (wasWalk) fitView(true);
  }
  E.dirty = true; renderInspector();
}

/* start a walk outside: at the gate (or in front of the house), at eye level, facing the house */
function walkOutside(prev, stop) {
  const pj = P(), ground = pj.floors.slice().sort((a, b) => a.level - b.level)[0];
  pj.activeFloor = pj.floors.indexOf(ground);
  $('#app').classList.remove('side-open', 'chat-open');
  S.showAllFloors = true; S.cutaway = false; S.roof = true; S.explode = false;
  $('#t-cut').classList.remove('on'); $('#t-roof').classList.add('on');
  CTL.mode = 'walk'; rebuild(); renderFloorSeg(); setFlowStep(stop);
  const { frame, openings } = E.siteWalk;
  const hb = houseBounds() || homeBounds(), cx = hb.x + hb.w / 2, cz = hb.y + hb.d / 2;
  const widest = openings.reduce((wide, next) => next[1] - next[0] > wide[1] - wide[0] ? next : wide, [0, 0]);
  const doorU = (widest[0] + widest[1]) / 2;
  const [x, z] = frame.toWorld(doorU, stop === 'street' ? 8.0 : -0.8);
  const y = floorY(ground) + 1.6 + groundAt(ground, x, z);
  const [dx, dz] = [cx - x, cz - z], length = Math.hypot(dx, dz) || 1;
  CTL.flyTo([x, y, z], [x + dx / length, y - 0.04, z + dz / length], prev === '2d' ? 0.01 : 1.2, { mode: 'walk' });
}

/* ---------- side panels ---------- */
function openPanel(p) {
  S.panel = p; $$('#rail button').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  $('#app').classList.add('side-open'); refreshSidePanel();
  if (p === 'light' && !S.daylightSim) { /* keep user choice */ }
}
function selRoom() { if (S.sel && S.sel.kind === 'room') return findRoom(S.sel.id); if (S.sel && S.sel.kind === 'item') { const f = findItem(S.sel.id); return f && f.room; } return null; }
function roomPicker(label = 'Pick a room') { return `<div class="card"><p class="muted" style="margin:0 0 8px">${label} — click it in the 3D/2D view, or:</p><div class="mini-chips">${FL().rooms.map(r => `<button class="chip" data-act="select-room" data-id="${r.id}">${ROOM_TYPES[r.type].icon} ${esc(r.name)}</button>`).join('')}</div></div>`; }
function scoreRing(v) { const c = v >= 75 ? '#10b981' : v >= 50 ? '#f59e0b' : '#ec4899'; return `<div class="score" style="background:conic-gradient(${c} ${v * 3.6}deg, #1e293b 0);box-shadow:0 0 18px ${c}33"><div style="width:46px;height:46px;border-radius:50%;background:var(--panel2);display:grid;place-items:center">${v}</div></div>`; }
function refreshSidePanel() {
  const el = $('#side-body'); if (!el || !S.project) return;
  const fn = { design: panelDesign, furniture: panelFurniture, space: panelSpace, budget: panelBudget, light: panelLight, transform: panelTransform, arch: panelArch, compare: panelCompare, report: panelReport }[S.panel] || panelDesign;
  const st = el.parentElement.scrollTop; el.innerHTML = fn(); el.parentElement.scrollTop = st;
}
function panelDesign() {
  const r = selRoom(); const th = P().theme;
  let h = `<h2>AI Interior Designer</h2><p class="muted">Themes, paint, materials, ceilings, lighting &amp; decor — applied live to your 3D home.</p>
  <h3>Theme for the whole home</h3><div class="theme-grid">${Object.entries(THEMES).map(([n, t]) => `<button class="theme ${th === n ? 'on' : ''}" data-act="theme" data-t="${n}"><b>${n}</b><div class="dots">${[t.walls[0], t.wood, t.fabric, t.accent].map(c => `<i style="background:${c}"></i>`).join('')}</div></button>`).join('')}</div>
  <div class="row" style="margin-top:10px"><button class="btn sm" data-act="furnish-all">🪄 Auto-furnish every room</button><button class="btn sm ghost" data-act="furnish-all" data-v="1">↻ Alternative layouts</button></div>`;
  const fk0 = P().facade || 'modern', exc = P().exterior;
  h += `<h3>Exterior style</h3><div class="theme-grid">${Object.entries(FACADES).map(([k, v]) => `<button class="theme ${fk0 === k ? 'on' : ''}" data-act="facade" data-k="${k}" title="${esc(v.desc)}"><b>${v.label}</b><div class="dots">${v.sw.map(c => `<i style="background:${c}"></i>`).join('')}</div></button>`).join('')}</div>
  <div class="row" style="margin-top:8px;flex-wrap:wrap"><span class="muted">Outside paint</span>${['#efeeea', '#e9e2d4', '#dacbb2', '#c9c6bf', '#8d8f8c', '#3b3d40'].map(c => `<button class="sw ${exc === c ? 'on' : ''}" style="background:${c};width:22px;height:22px" data-act="ext-color" data-c="${c}" title="${c}"></button>`).join('')}<input type="color" value="${extColor()}" data-act-input="ext-custom">${exc ? `<button class="btn sm ghost" data-act="ext-color" data-c="">Style default</button>` : ''}</div>
  <p class="muted" style="margin:6px 0 0;font-size:12px">Mark a ground-floor room as a garage (Space panel → Transform) and it gets a roll-up door, an SUV, a motorbike and a cobbled driveway.</p>`;
  if (!r) h += `<h3>Room design</h3>` + roomPicker('Select a room to get paint, material, ceiling & lighting suggestions');
  else {
    const sug = paintSuggestions(r), la = lightingAdvice(r), ca = ceilingAdvice(r), da = decorAdvice(r); const fk = roomFloorKey(r), ck = roomCeiling(r);
    h += `<h3>${ROOM_TYPES[r.type].icon} ${esc(r.name)} — AI paint suggestions</h3><div class="card">${sug.map(s => `<div class="sugg"><button class="sw" style="background:${s.hex}" data-act="wall" data-c="${s.hex}"></button><div><b>${esc(s.name)}</b><small>${esc(s.why)}</small></div><button class="btn sm ghost" data-act="wall" data-c="${s.hex}">Apply</button></div>`).join('')}
      <div class="row" style="margin-top:8px"><span class="muted">Custom</span><input type="color" value="${roomWall(r)}" data-act-input="wall-custom"><label class="row muted"><input type="checkbox" ${r.wallpaper ? 'checked' : ''} data-act-change="wallpaper"> Striped wallpaper</label></div></div>
    <h3>Flooring material</h3><div class="mini-chips">${Object.entries(FLOORS).map(([k, v]) => `<button class="chip ${fk === k ? 'on' : ''}" data-act="floor" data-k="${k}"><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${v.color};vertical-align:middle"></i> ${v.label}</button>`).join('')}</div>
    <h3>Ceiling designer</h3><div class="card"><p style="margin-top:0">${esc(ca.why)}</p><div class="seg sm">${Object.entries(CEILINGS).map(([k, v]) => `<button class="${ck === k ? 'on' : ''}" data-act="ceiling" data-k="${k}">${v.label.split(' ')[0]}</button>`).join('')}</div>${ca.type !== ck ? `<button class="btn sm" style="margin-top:8px" data-act="ceiling" data-k="${ca.type}">Use AI pick: ${CEILINGS[ca.type].label}</button>` : ''}</div>
    <h3>Lighting designer</h3><div class="card"><div class="kv"><span>Ambient</span><b style="font-weight:600">${la.ambient}</b><span>Task</span><b style="font-weight:600">${la.task}</b><span>Accent</span><b style="font-weight:600">${la.accent}</b><span>Colour temp.</span><b style="font-weight:600">${la.temp}</b></div>
      <div class="row" style="margin-top:8px">${['ambient', 'task', 'accent'].map(k => `<label class="row muted"><input type="checkbox" ${r.lights?.[k] ? 'checked' : ''} data-act-change="light-tog" data-k="${k}"> ${k}</label>`).join('')}</div><button class="btn sm ghost" data-act="time-eve">See it at 8 PM →</button></div>
    <h3>Curtains &amp; decor</h3><div class="card"><div class="kv"><span>Curtains</span><b style="font-weight:600">${da.curtains}</b><span>Rug</span><b style="font-weight:600">${da.rug}</b><span>Decor</span><b style="font-weight:600">${da.decor}</b></div><label class="row muted" style="margin-top:8px"><input type="checkbox" ${r.curtains ? 'checked' : ''} data-act-change="curtains"> Show curtains in 3D</label></div>
    <h3>Furniture style</h3><div class="two"><label class="field">Wood finish<select data-act-change="finish"><option value="">Theme default</option>${Object.keys(WOOD_FINISHES).map(k => `<option ${r.furniture[0]?.finish === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label><label class="field">Quality tier<select data-act-change="tier">${TIERS.map(t => `<option ${r.tier === t ? 'selected' : ''} value="${t}">${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}</select></label></div>
    <label class="field">Room-only theme<select data-act-change="room-theme"><option value="">Same as home (${th})</option>${Object.keys(THEMES).map(k => `<option ${r.theme === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>`;
  }
  h += `<h3>Recreate an inspiration photo</h3><div class="card"><p style="margin-top:0" class="muted">Upload a Pinterest / Instagram interior and Aria recreates the style in ${r ? esc(r.name) : 'your home'}.</p><input type="file" id="insp-in" accept="image/*" hidden><button class="btn sm" data-act="pick-insp">📌 Upload inspiration</button><div id="insp-out">${S.insp ? inspHTML(S.insp) : ''}</div></div>`;
  return h;
}
function inspHTML(x) { return `<div style="margin-top:10px"><div class="row">${x.url ? `<img src="${x.url}" style="width:70px;height:70px;object-fit:cover;border-radius:10px">` : ''}<div><b>${x.style}</b><div class="dots" style="margin:5px 0">${x.palette.slice(0, 5).map(c => `<i style="background:${c}"></i>`).join('')}</div><small class="muted">via ${esc(x.via)}</small></div></div>${x.description ? `<p>${esc(x.description)}</p>` : ''}<button class="btn sm primary" data-act="apply-insp">Apply this look</button></div>`; }
function panelFurniture() {
  const r = selRoom(); S.cat = S.cat || 'Bedroom';
  const cats = CAT_ORDER.filter(c => Object.values(CATALOG).some(i => i.cat === c));
  let h = `<h2>Furniture</h2><p class="muted">${r ? `Click to add to <b>${esc(r.name)}</b> — DIMORA finds a spot that keeps walkways and doors clear.` : 'Select a room first, or use 2D view to click-place anywhere.'}</p>
  <div class="cat-tabs">${cats.map(c => `<button class="${S.cat === c ? 'on' : ''}" data-act="cat" data-c="${c}">${c}</button>`).join('')}</div>
  <div class="fgrid">${Object.entries(CATALOG).filter(([, v]) => v.cat === S.cat).map(([k, v]) => `<button class="fitem" data-act="add-item" data-t="${k}"><i>${v.icon}</i><b>${v.label}</b><small>${v.w}×${v.d} m · from ${inr(v.price[0])}</small></button>`).join('')}</div>`;
  if (r) h += `<h3>In ${esc(r.name)} (${r.furniture.length})</h3>${r.furniture.map(it => `<div class="sugg"><span style="font-size:18px">${CATALOG[it.type].icon}</span><div><b>${CATALOG[it.type].label}</b><small>${it.w}×${it.d} m · ${it.tier} · ${inr(CATALOG[it.type].price[TIER_IX[it.tier]])}</small></div><div class="row"><button class="btn sm ghost" data-act="select-item" data-id="${it.id}">Edit</button><button class="btn sm ghost" data-act="del-item" data-id="${it.id}">✕</button></div></div>`).join('') || '<p class="muted">Empty.</p>'}<div class="row" style="margin-top:8px"><button class="btn sm" data-act="furnish-room">🪄 Auto-furnish</button><button class="btn sm ghost" data-act="furnish-room" data-v="1">↻ Another layout</button><button class="btn sm ghost" data-act="clear-room">Clear</button></div>`;
  return h;
}
function panelSpace() {
  const r = selRoom(); const f = FL();
  const all = f.rooms.map(x => ({ x, a: analyzeSpace(x, f) }));
  let h = `<h2>Intelligent Space Analyzer</h2><p class="muted">Dimensions, utilisation, walking clearance, door swings and wasted space.</p>
  <button class="btn sm ghost" data-act="overlay-plan" data-o="space">Show unused space on plan</button>
  <table class="t" style="margin-top:10px"><tr><th>Room</th><th class="r">m²</th><th>Status</th><th class="r">Score</th></tr>${all.map(({ x, a }) => `<tr class="click" data-act="select-room" data-id="${x.id}"><td>${esc(x.name)}</td><td class="r">${r2(area(x))}</td><td><span class="tag ${a.status === 'Balanced' ? 'ok' : a.status === 'Overcrowded' ? 'warn' : 'mid'}">${a.status}</span></td><td class="r">${a.score}</td></tr>`).join('')}</table>`;
  const st = storageReport();
  if (r) {
    const a = analyzeSpace(r, floorOfRoom(r));
    h += `<h3>${esc(r.name)}</h3><div class="card"><div class="row">${scoreRing(a.score)}<div class="kv" style="flex:1"><span>Size</span><b>${r.w} × ${r.d} m</b><span>Area</span><b>${r2(area(r))} m² · ${Math.round(area(r) * SQFT)} sq ft</b><span>Furniture cover</span><b>${Math.round(a.coverage * 100)}%</b><span>Walkable floor</span><b>${Math.round(a.walkable * 100)}%</b></div></div><p class="muted">${a.sizeNote}</p></div>
    ${a.issues.length ? a.issues.map(i => `<div class="issue">${esc(i)}</div>`).join('') : '<div class="issue ok">Walking clearances and door swings are comfortable.</div>'}
    ${a.clear.length ? `<h3>Clearance in front of furniture</h3><table class="t"><tr><th>Item</th><th class="r">Has</th><th class="r">Needs</th></tr>${a.clear.map(c => `<tr><td>${CATALOG[c.it.type].label}</td><td class="r" style="color:${c.ok ? '#7fd9a4' : '#ff9a8a'}">${c.dist} m</td><td class="r">${c.req} m</td></tr>`).join('')}</table>` : ''}
    ${a.corner ? `<h3>Unused space found</h3><div class="card"><p style="margin-top:0">A <b>${r2(a.corner.w)} × ${r2(a.corner.d)} m</b> corner (${r2(a.corner.area)} m²) isn't doing anything. Convert it into:</p><div class="row"><button class="btn sm" data-act="corner" data-k="study">💻 Study corner</button><button class="btn sm" data-act="corner" data-k="reading">📖 Reading nook</button><button class="btn sm" data-act="corner" data-k="storage">🗄️ Storage</button></div></div>` : ''}
    <h3>Layout improvement</h3><div class="row"><button class="btn sm" data-act="furnish-room" data-v="1">↻ Try an alternative arrangement</button><button class="btn sm ghost" data-act="furnish-room">Reset to AI layout</button></div>
    <h3>Room purpose ideas</h3><div class="mini-chips">${a.purpose.map(p => `<button class="chip" data-act="transform" data-t="${p}">${ROOM_TYPES[p].icon} ${ROOM_TYPES[p].label}</button>`).join('')}</div>
    <h3>Furniture fit checker</h3><div class="card"><div class="two"><label class="field">Item<select id="fit-type">${Object.entries(CATALOG).map(([k, v]) => `<option value="${k}" ${S.fitType === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label><div class="two"><label class="field">W m<input id="fit-w" type="number" step="0.05" placeholder="auto"></label><label class="field">D m<input id="fit-d" type="number" step="0.05" placeholder="auto"></label></div></div><button class="btn sm" data-act="fit-check">Check fit</button><div id="fit-out">${S.fitOut || ''}</div></div>`;
  } else h += `<h3>Room detail</h3>` + roomPicker('Pick a room for clearance, wasted space and fit checks');
  h += `<h3>Storage optimisation</h3><div class="card"><div class="kv"><span>Storage you have</span><b>${st.have} m³</b><span>Recommended for ${S.prefs.family} people</span><b>${st.need} m³</b></div><div class="bar" style="margin:8px 0"><i style="width:${Math.min(100, st.have / st.need * 100)}%;background:${st.have >= st.need ? 'var(--sage)' : 'var(--acc)'}"></i></div>${st.tips.map(t => `<p class="muted">${t}</p>`).join('')}</div>`;
  return h;
}
function costIfTier(tier) { const saved = S.project; S.project = deep(saved); allRooms().forEach(r => { r.tier = tier; r.furniture.forEach(i => i.tier = tier); if (tier === 'premium') { if (FLOORS[roomFloorKey(r)].rate < 150 && !['bathroom', 'utility', 'balcony'].includes(r.type)) r.floor = 'marble'; r.lights.accent = true; } if (tier === 'budget') { const fk = roomFloorKey(r); if (FLOOR_CHEAPER[fk]) r.floor = FLOOR_CHEAPER[fk]; r.ceiling = 'flat'; r.lights.accent = false; } }); const c = homeCost(); S.project = saved; return c; }
function panelBudget() {
  const c = homeCost(), B = S.prefs.budget, over = c.total > B; const r = selRoom();
  const cats = [['Furniture', c.furniture], ['Flooring', c.flooring], ['Wall painting', c.paint], ['Lighting', c.lighting], ['False ceiling', c.ceiling], ['Decor & curtains', c.decor]];
  const mx = Math.max(...cats.map(x => x[1]), 1);
  const tb = ['budget', 'standard', 'premium'].map(t => [t, costIfTier(t).total]);
  let h = `<h2>Budget &amp; Cost Estimator</h2><p class="muted">India-focused, room-wise and explainable. Illustrative figures only, not market quotations.</p>
  <div class="card"><label class="field">Your total budget<div class="inline"><span>₹</span><input type="number" step="10000" value="${B}" data-act-change="budget" style="flex:1"></div></label>
  <div class="row" style="justify-content:space-between"><div><small class="muted">Current design</small><div style="font-family:var(--disp);font-size:28px">${inr(c.total)}</div></div><span class="tag ${over ? 'warn' : 'ok'}">${over ? inr(c.total - B) + ' over' : inr(B - c.total) + ' to spare'}</span></div>
  <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, c.total / B * 100)}%;background:${over ? 'var(--red)' : 'var(--sage)'}"></i></div>${over ? `<button class="btn sm primary" style="margin-top:10px;width:100%" data-act="optimize-all">💸 Fit the whole home into ${inr(B)}</button>` : ''}</div>
  <h3>Where the money goes</h3>${cats.map(([n, v]) => `<div style="margin:7px 0"><div class="row" style="justify-content:space-between"><span>${n}</span><b>${inr(v)}</b></div><div class="bar"><i style="width:${v / mx * 100}%"></i></div></div>`).join('')}
  <h3>Room-wise costs</h3><table class="t"><tr><th>Room</th><th class="r">Furniture</th><th class="r">Total</th></tr>${c.rooms.map(({ r: x, c: cc }) => `<tr class="click" data-act="select-room" data-id="${x.id}"><td>${esc(x.name)}</td><td class="r">${inr(cc.furniture)}</td><td class="r"><b>${inr(cc.total)}</b></td></tr>`).join('')}</table>
  <h3>Budget vs Premium design</h3><div class="two" style="grid-template-columns:1fr 1fr 1fr">${tb.map(([t, v]) => `<div class="card" style="text-align:center;margin:0"><small class="muted">${t[0].toUpperCase() + t.slice(1)}</small><div style="font-weight:800">${inr(v)}</div><button class="btn sm ghost" style="margin-top:6px" data-act="set-tier-all" data-t="${t}">Use</button></div>`).join('')}</div>
  <h3>Budget optimiser</h3><div class="card"><p style="margin-top:0" class="muted">e.g. “Design my bedroom under ₹30,000.”</p><div class="two"><label class="field">Room<select id="opt-room"><option value="all">Whole home</option>${allRooms().map(x => `<option value="${x.id}" ${r === x ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label><label class="field">Max ₹<input id="opt-amt" type="number" step="1000" value="${r ? Math.round(roomCost(r).total * 0.7 / 1000) * 1000 : Math.round(B / 1000) * 1000}"></label></div><button class="btn sm primary" data-act="optimize">Optimise</button>
  ${S.lastOptimize ? `<div style="margin-top:10px"><b>${S.lastOptimize.ok ? '✓ Within budget' : '⚠ Closest possible'}:</b> ${inr(S.lastOptimize.start)} → ${inr(S.lastOptimize.end)}<ul style="padding-left:18px;margin:6px 0;color:var(--muted);font-size:12.5px">${S.lastOptimize.steps.slice(0, 10).map(s => `<li>${esc(s)}</li>`).join('')}${S.lastOptimize.steps.length > 10 ? `<li>…and ${S.lastOptimize.steps.length - 10} more</li>` : ''}</ul></div>` : ''}</div>`;
  if (r) { const rc = roomCost(r); const alts = cheaperAlternatives(r);
    h += `<h3>Why ${esc(r.name)} costs ${inr(rc.total)}</h3><div class="card">${[['Painting', 'paint'], ['Flooring', 'flooring'], ['Furniture', 'furniture'], ['Decor', 'decor'], ['Lighting', 'lighting'], ['Ceiling', 'ceiling']].map(([n, k]) => `<div style="margin:6px 0"><div class="row" style="justify-content:space-between"><b>${n}</b><b>${inr(rc[k])}</b></div><small class="muted">${esc(rc.explain[k])}</small></div>`).join('')}</div>
    <h3>Cheaper alternatives</h3>${alts.length ? alts.slice(0, 6).map((a, i) => `<div class="sugg"><span>💡</span><div><b style="font-weight:600">${esc(a.what)}</b><small>saves ${inr(a.save)}</small></div><button class="btn sm ghost" data-act="alt" data-i="${i}">Apply</button></div>`).join('') : '<p class="muted">Already the leanest choices.</p>'}`; }
  else h += `<h3>Explain a room's estimate</h3>` + roomPicker('Pick a room to see the line-by-line explanation');
  return h;
}
function panelLight() {
  const f = FL(); const r = selRoom(); const all = f.rooms.map(x => ({ x, L: analyzeLight(x, f) }));
  let h = `<h2>Natural Light &amp; Ventilation</h2><p class="muted">Window-to-floor ratio, orientation, sun path and airflow.</p>
  <div class="card"><label class="row"><input type="checkbox" ${S.daylightSim ? 'checked' : ''} data-act-change="daylight"> <b>Daylight simulation</b> — sun enters only through windows</label>
  <label class="field">Time of day: <b id="lt-h">${fmtHour(S.hour)}</b><input type="range" min="5" max="21" step="0.1" value="${S.hour}" data-act-input="hour"></label>
  <label class="field">Plan orientation — where is North? (${P().north || 0}° from plan-up)<input type="range" min="0" max="359" step="1" value="${P().north || 0}" data-act-input="north"></label>
  <div class="row"><button class="btn sm" data-act="play-day">▶ Simulate a full day</button><button class="btn sm ghost" data-act="overlay-plan" data-o="heat">Light heatmap</button><button class="btn sm ghost" data-act="overlay-plan" data-o="air">Airflow paths</button></div></div>
  <table class="t"><tr><th>Room</th><th>Daylight</th><th>Faces</th><th class="r">Score</th></tr>${all.map(({ x, L }) => `<tr class="click" data-act="select-room" data-id="${x.id}"><td>${esc(x.name)}</td><td><span class="tag ${L.rating === 'Excellent' || L.rating === 'Good' ? 'ok' : L.rating === 'Limited' ? 'mid' : 'warn'}">${L.rating}</span></td><td>${L.dirs.join(', ') || '—'}</td><td class="r">${L.score}</td></tr>`).join('')}</table>
  <h3>Rooms with limited windows</h3>${all.filter(a => ['Limited', 'Poor', 'No daylight'].includes(a.L.rating) && !['hall', 'closet', 'utility'].includes(a.x.type)).map(a => `<div class="issue">${esc(a.x.name)}: ${a.L.rating.toLowerCase()} (window/floor ratio ${Math.round(a.L.wfr * 100)}%).</div>`).join('') || '<div class="issue ok">Every habitable room gets reasonable daylight.</div>'}`;
  if (r) { const L = analyzeLight(r, floorOfRoom(r));
    h += `<h3>${esc(r.name)}</h3><div class="card"><div class="row">${scoreRing(L.score)}<div class="kv" style="flex:1"><span>Window area</span><b>${L.winA} m²</b><span>Window : floor</span><b>${Math.round(L.wfr * 100)}% <small class="muted">(aim ≥ 10%)</small></b><span>Ventilation</span><b>${L.vent}</b></div></div></div>
    ${L.notes.map(n => `<div class="issue info">${esc(n)}</div>`).join('')}${L.sugg.map(n => `<div class="issue">${esc(n)}</div>`).join('')}
    ${L.suggestWindow ? `<button class="btn sm primary" data-act="add-window-sugg">＋ Add the suggested ${L.suggestWindow.compass} window</button>` : ''}`; }
  else h += `<h3>Room detail</h3>` + roomPicker('Pick a room for orientation and airflow advice');
  return h;
}
function panelTransform() {
  const r = selRoom();
  let h = `<h2>Smart Room Transformation</h2><p class="muted">Change what a room is for. DIMORA re-plans furniture, paint and cost.</p>`;
  if (!r) return h + roomPicker('Pick a room to transform');
  h += `<div class="card"><b>${ROOM_TYPES[r.type].icon} ${esc(r.name)}</b> <span class="muted">· ${r.w} × ${r.d} m · ${ROOM_TYPES[r.type].label}</span></div><div class="tgrid">${TRANSFORMS.filter(t => t.to !== r.type).map(t => { const ok = area(r) >= ROOM_TYPES[t.to].min * 0.8; return `<button class="tcard" data-act="transform" data-t="${t.to}" ${ok ? '' : 'title="Room is smaller than ideal"'}><i>${ROOM_TYPES[t.to].icon}</i><b>${esc(r.type === 'balcony' && t.to === 'reading' ? 'Balcony reading corner' : t.label)}</b><br><small class="muted">${ok ? 'Good fit' : 'Tight fit'} · min ${ROOM_TYPES[t.to].min} m²</small></button>`; }).join('')}</div>`;
  if (S.lastTransform && S.lastTransform.room === r.id) { const t = S.lastTransform; h += `<h3>Before → After</h3><div class="ba"><figure><img src="${t.before}"><figcaption>${esc(ROOM_TYPES[t.from].label)} · ${inr(t.c0)}</figcaption></figure><figure><img src="${t.after}"><figcaption>${esc(ROOM_TYPES[t.to].label)} · ${inr(t.c1)}</figcaption></figure></div><button class="btn sm ghost" style="margin-top:8px" data-act="undo">↶ Undo transformation</button>`; }
  return h;
}
const GA = { key: '', data: null, busy: false };
async function loadGraphAnalysis() {
  const el = document.getElementById('graph-ana'); if (!el || !S.project) return;
  const geo = projectGeometry(); const key = JSON.stringify(geo);
  if (GA.key === key && GA.data) { el.innerHTML = graphHTML(GA.data); return; }
  await API.health(); if (!S.backendOK) { el.innerHTML = `<p class="muted" style="margin:0">Start the DIMORA backend to see graph analytics (BFS order, chokepoint rooms, walking distances).</p>`; return; }
  if (GA.busy) return; GA.busy = true;
  try { GA.data = await API.req('/api/analyze', { body: { project: geo }, timeout: 15000 }); GA.key = key; const e2 = document.getElementById('graph-ana'); if (e2) e2.innerHTML = graphHTML(GA.data); }
  catch (e) { const e2 = document.getElementById('graph-ana'); if (e2) e2.innerHTML = `<p class="muted" style="margin:0">Graph analysis failed: ${esc(e.message)}</p>`; }
  GA.busy = false;
}
function graphHTML(a) {
  const pj = P(), fl = a.floors.find(x => x.floor === FL().name) || a.floors[pj.activeFloor] || a.floors[0]; if (!fl) return '';
  const nm = id => { const r = findRoom(id); return r ? esc(r.name) : '?'; };
  const dist = Object.entries(fl.distances || {}).filter(([id]) => id !== fl.start).sort((x, y) => y[1] - x[1]);
  const max = dist.length ? dist[0][1] : 1;
  return `<p class="muted" style="margin:0 0 8px;font-size:12.5px">${fl.rooms} rooms joined by ${fl.doors} doors on the ${esc(fl.floor)}${fl.components > 1 ? ` · <b style="color:#f9a8d4">${fl.components} separate groups</b>` : ' · fully connected'}. Start: <b>${nm(fl.start)}</b>.</p>
  ${fl.articulation.length ? `<p style="margin:6px 0;font-size:13px"><b>Chokepoint rooms</b> <span class="muted">(articulation points: every route passes through them)</span><br>${fl.articulation.map(nm).join(', ')}</p>` : `<p style="margin:6px 0;font-size:13px"><b>No chokepoints</b> <span class="muted">— every room can be reached by more than one route.</span></p>`}
  ${fl.through_bedroom.length ? `<p style="margin:6px 0;font-size:13px;color:#fbbf24">Reachable only through a bedroom: ${fl.through_bedroom.map(nm).join(', ')}</p>` : ''}
  ${dist.length ? `<p style="margin:10px 0 4px;font-size:13px"><b>Walking distance from ${nm(fl.start)}</b> <span class="muted">(Dijkstra, metres via doors)</span></p>${dist.slice(0, 6).map(([id, m]) => `<div style="display:flex;align-items:center;gap:8px;font-size:12px;margin:3px 0"><span style="width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nm(id)}</span><i style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.08)"><i style="display:block;height:100%;width:${Math.round(m / max * 100)}%;border-radius:3px;background:var(--acc)"></i></i><b>${m.toFixed(1)} m</b></div>`).join('')}` : ''}
  ${(fl.stairs || []).map(st => `<p style="margin:8px 0 0;font-size:12.5px"><b>Staircase</b> ${st.width} m wide · ${st.risers} risers of ${st.riser_mm} mm · ${st.tread_mm} mm treads</p>`).join('')}
  ${pj.floors.length > 1 && a.house ? `<p class="muted" style="margin:8px 0 0;font-size:12.5px">Whole house: ${a.house.rooms} rooms across ${pj.floors.length} floors, ${a.house.connected ? 'all connected via the stairs' : '<b style="color:#f9a8d4">not fully connected</b>'}${a.house.farthest_from_entrance ? ` · farthest from the main door: ${esc(a.house.farthest_from_entrance.name)} (${esc(a.house.farthest_from_entrance.floor)}, ${a.house.farthest_from_entrance.metres} m)` : ''}.</p>` : ''}
  <p class="muted" style="margin:8px 0 0;font-size:11px">Algorithms: sweep-line adjacency · BFS · Tarjan articulation points · Dijkstra (NetworkX)</p>`;
}
function panelArch() {
  setTimeout(loadGraphAnalysis, 0);
  const checks = archChecks(FL()); const pj = P();
  let h = `<h2>Architectural Intelligence</h2><p class="muted">Plan validation, circulation, clearances, structure and floors.</p>
  ${checks.map(c => `<div class="issue ${c.lv === 'ok' ? 'ok' : c.lv === 'info' ? 'info' : ''}"><div><b>${esc(c.t)}</b><br><span class="muted">${esc(c.d)}</span>${c.fix ? `<br><button class="btn sm ghost" style="margin-top:5px" data-act="fix" data-k="${c.fix}">${c.fix === 'snap' ? 'Auto-align walls' : 'Add missing doors'}</button>` : ''}</div></div>`).join('')}
  <h3>Room graph <small class="muted" style="font-weight:500">· computed on the backend</small></h3><div id="graph-ana" class="card"><p class="muted" style="margin:0">Analysing the room graph…</p></div>
  <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="overlay-plan" data-o="graph">Show room connectivity</button><button class="btn sm ghost" data-act="view" data-v="2d">Edit walls, doors &amp; windows</button></div>
  <h3>Floors</h3>${pj.floors.map((f, i) => `<div class="sugg"><span>${i === pj.activeFloor ? '●' : '○'}</span><div><b>${esc(f.name)}</b><small>${f.rooms.length} rooms · ceiling ${f.height} m${f.stairs?.length ? ' · staircase' : ''}</small></div><button class="btn sm ghost" data-act="floor-switch" data-i="${i}">${i === pj.activeFloor ? 'Active' : 'View'}</button></div>`).join('')}
  <div class="row" style="margin-top:8px"><button class="btn sm" data-act="add-floor">＋ Add floor above</button><label class="row muted"><input type="checkbox" ${S.showAllFloors ? 'checked' : ''} data-act-change="all-floors"> Show all floors stacked</label></div>
  <label class="field">Ceiling height of ${esc(FL().name)} (m)<input type="number" step="0.05" min="2.4" max="4.5" value="${FL().height}" data-act-change="floor-h"></label>
  <h3>Doors</h3><table class="t"><tr><th>Door</th><th class="r">Width</th><th></th></tr>${FL().doors.map(d => { const rs = FL().rooms.filter(r => roomSideOf(r, d.o, d.x, d.y)).map(r => r.name); return `<tr><td>${d.main ? '<b>Main entry</b> · ' : ''}${esc(rs.join(' ↔ ') || 'exterior')}</td><td class="r">${d.w} m</td><td class="r"><button class="btn sm ghost" data-act="select-door" data-id="${d.id}">Edit</button></td></tr>`; }).join('')}</table>`;
  return h;
}
function panelCompare() {
  const r = selRoom();
  let h = `<h2>Smart Design Comparison</h2><p class="muted">Save variants, compare them side by side, and see before vs after.</p>
  <div class="row"><input id="var-name" placeholder="Variant name" value="Design ${S.variants.length + 1}" style="flex:1"><button class="btn sm primary" data-act="save-variant">Save current</button></div>`;
  if (S.variants.length) {
    h += `<h3>Saved variants</h3>${S.variants.map((v, i) => `<div class="card var"><img src="${v.thumb}"><div><b>${esc(v.name)}</b><br><small class="muted">${v.theme} · ${inr(v.cost)}</small></div><div class="row" style="flex-direction:column;gap:4px"><label class="muted"><input type="checkbox" ${v.cmp ? 'checked' : ''} data-act-change="var-cmp" data-i="${i}"> compare</label><button class="btn sm ghost" data-act="var-restore" data-i="${i}">Restore</button></div></div>`).join('')}`;
    const sel = S.variants.filter(v => v.cmp).slice(0, 3);
    if (sel.length >= 2) h += `<h3>Side by side</h3><div style="overflow:auto"><table class="t"><tr><th></th>${sel.map(v => `<th>${esc(v.name)}</th>`).join('')}</tr>${[['Theme', v => v.theme], ['Total cost', v => inr(v.cost)], ['Furniture', v => inr(v.furniture)], ['Pieces', v => v.pieces], ['Space score', v => v.space], ['Light score', v => v.light], ['Within budget', v => v.cost <= S.prefs.budget ? '✓' : '✗']].map(([n, f]) => `<tr><td class="muted">${n}</td>${sel.map(v => `<td>${f(v)}</td>`).join('')}</tr>`).join('')}</table></div>`;
    else h += `<p class="muted">Tick two or three variants to compare.</p>`;
  } else h += `<div class="card muted">No variants yet. Save one, change the theme or layout, then save another.</div>`;
  h += `<h3>Before / After</h3><button class="btn sm" data-act="before-after">Compare original vs current</button><div id="ba-out">${S.baHTML || ''}</div>
  <h3>Multi-theme comparison</h3>${r ? `<p class="muted">The same ${esc(r.name)} in three styles.</p><button class="btn sm" data-act="multi-theme">Render ${esc(r.name)} in 3 themes</button><div id="mt-out">${S.mtHTML || ''}</div>` : roomPicker('Pick a room to preview in multiple themes')}`;
  return h;
}
function panelReport() {
  const c = homeCost();
  return `<h2>Home Decision Report</h2><p class="muted">One document with dimensions, furniture fit, space utilisation, materials, light and the estimated budget.</p>
  <div class="card"><div class="kv"><span>Rooms</span><b>${allRooms().length}</b><span>Carpet area</span><b>${r2(allRooms().reduce((s, r) => s + area(r), 0))} m²</b><span>Estimated interior</span><b>${inr(c.total)}</b><span>Your budget</span><b>${inr(S.prefs.budget)}</b></div></div>
  <button class="btn primary" data-act="report">📄 Generate report</button>`;
}

/* ---------- inspector ---------- */
function renderInspector() {
  const el = $('#inspector'); if (!el) return; const s = S.sel;
  if (!s || S.touring || (S.view === 'walk' && s.kind !== 'item')) { el.classList.remove('on'); return; }
  let h = '<button class="x" data-act="deselect">✕</button>';
  if (s.kind === 'item') { const f = findItem(s.id); if (!f) { el.classList.remove('on'); return; } const it = f.it, c = CATALOG[it.type];
    h += `<h4>${c.icon} ${c.label}</h4><small class="muted">in ${esc(f.room.name)} · ${inr(c.price[TIER_IX[it.tier]])}</small>
    <div class="two"><label class="field">Width (m)<input type="number" step="0.05" min="0.2" value="${it.w}" data-act-change="it-dim" data-k="w"></label><label class="field">Depth (m)<input type="number" step="0.05" min="0.2" value="${it.d}" data-act-change="it-dim" data-k="d"></label></div>
    <div class="two"><label class="field">Tier<select data-act-change="it-tier">${TIERS.map(t => `<option ${it.tier === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label class="field">Wood finish<select data-act-change="it-finish"><option value="">Theme</option>${Object.keys(WOOD_FINISHES).map(k => `<option ${it.finish === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
    <label class="field">Upholstery / colour<div class="row"><input type="color" value="${it.color || palette(f.room, it).fabric}" data-act-input="it-color"><button class="btn sm ghost" data-act="it-color-reset">Theme colour</button></div></label>
    <div class="row"><button class="btn sm" data-act="rot" data-d="-90">⟲ 90°</button><button class="btn sm" data-act="rot" data-d="90">⟳ 90°</button><button class="btn sm ghost" data-act="dup">Duplicate</button><button class="btn sm ghost" data-act="del">Delete</button></div><p class="muted" style="font-size:11.5px">Drag it in 3D or 2D to move. R rotates.</p>`; }
  else if (s.kind === 'room') { const r = findRoom(s.id); if (!r) { el.classList.remove('on'); return; } const c = roomCost(r);
    h += `<h4>${ROOM_TYPES[r.type].icon} <input value="${esc(r.name)}" data-act-change="r-name" style="width:180px"></h4>
    <div class="two"><label class="field">Type<select data-act-change="r-type">${Object.entries(ROOM_TYPES).map(([k, v]) => `<option value="${k}" ${r.type === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label><label class="field">Wall<input type="color" value="${roomWall(r)}" data-act-input="wall-custom"></label></div>
    <div class="two"><label class="field">Width (m)<input type="number" step="0.05" value="${r.w}" data-act-change="r-dim" data-k="w"></label><label class="field">Depth (m)<input type="number" step="0.05" value="${r.d}" data-act-change="r-dim" data-k="d"></label></div>
    <label class="field">Floor<select data-act-change="r-floor">${Object.entries(FLOORS).map(([k, v]) => `<option value="${k}" ${roomFloorKey(r) === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
    <div class="kv" style="margin:6px 0"><span>Area</span><b>${r2(area(r))} m² · ${Math.round(area(r) * SQFT)} sq ft</b><span>Estimate</span><b>${inr(c.total)}</b></div>
    <div class="row"><button class="btn sm" data-act="furnish-room">🪄 Furnish</button><button class="btn sm ghost" data-act="focus-room">Focus</button><button class="btn sm ghost" data-act="ask-room">Ask Aria</button><button class="btn sm ghost" data-act="del">Delete</button></div>`; }
  else if (s.kind === 'door' || s.kind === 'window') { const f = FL(); const o = (s.kind === 'door' ? f.doors : f.windows).find(x => x.id === s.id); if (!o) { el.classList.remove('on'); return; }
    h += `<h4>${s.kind === 'door' ? '🚪 Door' : '🪟 Window'}</h4><label class="field">Width (m)<input type="number" step="0.05" min="0.5" max="4" value="${o.w}" data-act-change="op-w"></label>
    ${s.kind === 'window' ? `<div class="two"><label class="field">Sill (m)<input type="number" step="0.05" value="${o.sill}" data-act-change="op-k" data-k="sill"></label><label class="field">Height (m)<input type="number" step="0.05" value="${o.h}" data-act-change="op-k" data-k="h"></label></div>` : `<label class="row muted"><input type="checkbox" ${o.main ? 'checked' : ''} data-act-change="op-main"> Main entrance</label>`}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="del">Delete</button></div><p class="muted" style="font-size:11.5px">Drag it along walls in 2D view.</p>`; }
  el.innerHTML = h; el.classList.add('on');
}

/* ---------- chat ---------- */
function addChat(role, text, via) {
  const log = $('#chat-log'); if (!log) return; const m = document.createElement('div'); m.className = 'msg ' + role; m.textContent = text;
  if (role === 'aria' && via) { const s = document.createElement('small'); s.textContent = via === 'on-device' ? 'on-device engine' : 'via ' + via; m.appendChild(s); }
  if (role === 'aria' && S.paintChips) { const w = document.createElement('div'); w.className = 'swatches'; w.innerHTML = S.paintChips.list.map(s => `<button class="sw" title="${esc(s.name)}: ${esc(s.why)}" style="background:${s.hex}" data-act="chat-paint" data-r="${S.paintChips.room}" data-c="${s.hex}" data-n="${esc(s.name)}"></button>`).join(''); m.appendChild(w); S.paintChips = null; }
  log.appendChild(m); log.scrollTop = log.scrollHeight;
}
function chatSuggestions() {
  const r = selRoom(); const rs = allRooms(); const bed = rs.find(x => ['master', 'bedroom'].includes(x.type)), study = rs.find(x => ['study', 'empty', 'guest'].includes(x.type)) || rs.find(x => x.type === 'bedroom');
  const list = [r ? `Paint ${r.name} sage green` : 'Give me a tour', bed ? `Design ${bed.name} under ₹30,000` : null, study ? `Convert ${study.name} into a home office` : null, 'Make the whole home Japandi', 'Italian marble in the living room', 'Show me sunset light', r ? `Suggest colours for ${r.name}` : 'Which room has the least daylight?'].filter(Boolean);
  $('#chat-sugg').innerHTML = list.slice(0, 5).map(t => `<button data-act="chat-sugg" data-t="${esc(t)}">${esc(t)}</button>`).join('');
}
async function sendChat(text) {
  if (!text.trim()) return; addChat('user', text); chatSuggestions();
  const log = $('#chat-log'); const ty = document.createElement('div'); ty.className = 'msg aria'; ty.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>'; log.appendChild(ty); log.scrollTop = log.scrollHeight;
  const out = await askAria(text, tourRoom() || selRoom());
  ty.remove(); addChat('aria', out.reply, out.via); refreshSidePanel(); renderInspector();
  if (out.via === 'on-device' && aiOn() && S.lastAIError) { toast(modelLabel() + ': ' + S.lastAIError.slice(0, 110), 4500); S.lastAIError = null; }
}

/* ---------- dashboard / onboarding / settings ---------- */
function confirmDel(id) { const t = Date.now(); if (confirmDel.id === id && t - confirmDel.t < 4000) { confirmDel.id = null; return true; } confirmDel.id = id; confirmDel.t = t; toast('Click delete again to remove this project'); return false; }
function renderDash() {
  const pf = S.prefs; const cu = currentUser(); $('#dash-hello').textContent = cu ? `Welcome, ${firstName(cu)}` : 'Welcome to DIMORA'; updateUserChips();
  $('#dash-prefs').innerHTML = `<span>Style <b>${pf.style}</b></span><span>Budget <b>${inr(pf.budget)}</b></span><span>Family <b>${pf.family}</b></span>${pf.kids ? '<span><b>Kids</b></span>' : ''}${pf.pets ? '<span><b>Pets</b></span>' : ''}${pf.wfh ? '<span><b>Works from home</b></span>' : ''}<span>Storage <b>${pf.storage}</b></span><span>Furniture <b>${pf.furniture}</b></span>`;
  const own = projOwner(); const local = store.get('projects', []).filter(p => (p.owner || 'device') === own);
  const merged = local.slice(); (CLOUD.list || []).forEach(c => { const i = merged.findIndex(p => p.id === c.id); if (i < 0) merged.push(Object.assign({ cloud: true }, c)); else if (c.updated > merged[i].updated) merged[i] = Object.assign({}, merged[i], c, { cloud: true }); });
  const list = merged.sort((a, b) => b.updated - a.updated);
  if (isCloud() && !renderDash.fetching) { renderDash.fetching = true; cloudList().then(l => { renderDash.fetching = false; if (l && $('#app').dataset.screen === 'dash' && JSON.stringify(l.map(x => [x.id, x.updated])) !== renderDash.lastSig) { renderDash.lastSig = JSON.stringify(l.map(x => [x.id, x.updated])); renderDash(); } }); }
  API.health().then(() => { if (aiOn() || !$('#dash-prefs') || $('#dash-ai')) return; $('#dash-prefs').insertAdjacentHTML('beforeend', `<div id="dash-ai" class="card" style="width:100%;display:flex;gap:14px;align-items:center;margin-top:10px"><span style="font-size:24px">✦</span><div style="flex:1"><b>${S.backendOK ? 'Connect Cloudflare AI' : 'Start the DIMORA backend'}</b><div class="muted" style="font-size:13px">${S.backendOK ? 'The backend is running but no AI is connected. Add your Cloudflare account ID and a Workers AI API token in ⚙ Settings, or as CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in backend/.env, so AI can read room labels, power Aria and write your tour narration.' : 'Plan detection, room graphs and the Cloudflare AI run on the Python backend. Start it with <code>python backend/app.py</code> and open http://127.0.0.1:8000. Until then DIMORA runs a simpler in-browser engine.'}</div></div><button class="btn primary sm" data-act="settings">Settings</button></div>`); });
  $('#proj-grid').innerHTML = `<div class="pcard new" data-act="new-upload"><div><div>＋</div><b>New from floor plan</b><small>JPG · PNG · PDF</small></div></div>` + list.map(p => `<div class="pcard" data-act="open-proj" data-id="${p.id}"><div class="th" style="${p.thumb ? `background-image:url(${p.thumb})` : ''}">${p.thumb ? '' : '◇'}</div><div class="pb"><b>${esc(p.name)}</b><small>${p.rooms} rooms · ${esc(p.theme || '')} · ${inr(p.cost || 0)} · ${new Date(p.updated).toLocaleDateString('en-IN')}</small></div><button class="del" data-act="del-proj" data-id="${p.id}">🗑</button></div>`).join('');
  updateAIBadge();
}
let ob = null;
function openOnboarding() {
  ob = { step: 0, p: deep(S.prefs) }; renderOnboarding(); $('#modal').classList.add('on');
}
function renderOnboarding() {
  const p = ob.p; const sw = ['#b5c4a8', '#c5d6e3', '#e3d4b8', '#efc2c8', '#cfc3e3', '#f1dc8f', '#c56c4b', '#4f8a8b', '#2e3f5c', '#f4f3ef', '#8a8f5c', '#d4a73a'];
  let body = '';
  if (ob.step === 0) body = `<h3 style="margin:0 0 10px">Preferred interior style</h3><div class="style-grid">${Object.entries(THEMES).map(([n, t]) => `<button class="opt ${p.style === n ? 'on' : ''}" data-act="ob-set" data-k="style" data-v="${n}"><b>${n}</b><div class="dots" style="margin-top:6px">${[t.walls[0], t.wood, t.fabric, t.accent].map(c => `<i style="background:${c}"></i>`).join('')}</div></button>`).join('')}</div>`;
  if (ob.step === 1) body = `<label class="field">Total interior budget: <b style="color:var(--text)">${inr(p.budget)}</b><input type="range" min="100000" max="5000000" step="50000" value="${p.budget}" data-act-input="ob-budget"></label>
    <h3 style="margin:14px 0 8px">Favourite colours <small class="muted">(pick up to 3)</small></h3><div class="swatches">${sw.map(c => `<button class="sw" style="background:${c};${p.colors.includes(c) ? 'outline:3px solid var(--acc);outline-offset:2px' : ''}" data-act="ob-color" data-c="${c}"></button>`).join('')}</div>
    <label class="field" style="margin-top:14px">Furniture preference<div class="seg">${TIERS.map(t => `<button class="${p.furniture === t ? 'on' : ''}" data-act="ob-set" data-k="furniture" data-v="${t}">${{ budget: 'Budget-friendly', standard: 'Mid-range', premium: 'Premium' }[t]}</button>`).join('')}</div></label>`;
  if (ob.step === 2) body = `<div class="two"><label class="field">Family members<input type="number" min="1" max="15" value="${p.family}" data-act-change="ob-num" data-k="family"></label><label class="field">Storage needs<select data-act-change="ob-sel" data-k="storage">${['low', 'medium', 'high'].map(s => `<option ${p.storage === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
    ${[['kids', '👶 Children at home'], ['pets', '🐾 Pets'], ['wfh', '💻 Work from home — needs a desk setup']].map(([k, l]) => `<label class="row" style="margin:10px 0"><input type="checkbox" ${p[k] ? 'checked' : ''} data-act-change="ob-chk" data-k="${k}"> ${l}</label>`).join('')}`;
  $('#modal-card').innerHTML = `<button class="x" data-act="modal-close">✕</button><p class="eyebrow">Personalise DIMORA</p><h2>${['How should your home feel?', 'Budget & colours', 'Who lives here?'][ob.step]}</h2><div class="ob-steps">${[0, 1, 2].map(i => `<i class="${i <= ob.step ? 'on' : ''}"></i>`).join('')}</div>${body}
  <div class="row end" style="margin-top:20px">${ob.step ? '<button class="btn ghost" data-act="ob-back">Back</button>' : ''}<button class="btn primary" data-act="ob-next">${ob.step < 2 ? 'Next' : 'Save preferences'}</button></div>`;
}
function aiStatusHTML() {
  if (!S.backendOK) return `<div class="tag err">Backend offline</div><p class="muted" style="font-size:13px;margin:6px 0 0">Nothing answered at <code>${esc(API.base())}</code>. Start it with <code>python backend/app.py</code>.</p>`;
  const a = S.backend.ai, o = a.ollama, r = a.openrouter, g = a.cloudflare || {};
  return `<div class="tag ok">Backend v${esc(S.backend.version)} connected</div>
  <ul class="muted" style="font-size:13px;line-height:1.7;padding-left:18px;margin:8px 0 0">
  <li>Cloudflare Workers AI: ${g.configured ? `✓ connected · <b>${esc(g.model)}</b>` : g.account_set || g.token_set ? `needs both an account ID and an API token (${g.account_set ? 'token' : 'account ID'} missing)` : 'not connected — create a Workers AI API token at <a href="https://dash.cloudflare.com/?to=/:account/ai/workers-ai" target="_blank" rel="noopener">dash.cloudflare.com → AI → Workers AI</a>'}</li>
  <li>Ollama (local): ${o.running ? (o.model_installed ? `✓ running with <b>${esc(o.model)}</b>` : `running, but <b>${esc(o.model)}</b> isn't installed — run <code>ollama pull ${esc(o.model)}</code>`) : 'not running'}</li>
  <li>OpenRouter (hosted): ${r.configured ? `✓ key set · <b>${esc(r.model)}</b>` : 'no key'}</li>
  <li>Active AI: <b>${a.active ? esc(modelLabel()) : 'none — Aria uses the rule-based engine'}</b></li></ul>`;
}
function openSettings() {
  $('#modal-card').innerHTML = `<button class="x" data-act="modal-close">✕</button><p class="eyebrow">Settings</p><h2>Backend &amp; AI</h2>
  <p class="muted">DIMORA's engine runs on a Python server: plan detection (OpenCV), room graphs (NetworkX) and the AI. The AI is <b>Cloudflare Workers AI</b>: it reads your plan's labels, powers Aria's chat and writes tour narration. Local <b>Ollama</b> (Qwen) and <b>OpenRouter</b> still work as fallbacks.</p>
  <div id="set-status" class="card" style="margin:10px 0">${aiStatusHTML()}</div>
  <label class="field">Backend URL<input id="set-url" value="${esc(S.backendUrl)}" placeholder="${esc(API.base())} (automatic)"></label>
  <label class="field">AI provider<select id="set-prov">${[['auto', 'Automatic: Cloudflare first, then local Ollama, then OpenRouter'], ['cloudflare', 'Cloudflare Workers AI only'], ['ollama', 'Local only (Ollama)'], ['openrouter', 'OpenRouter only']].map(([k, v]) => `<option value="${k}" ${S.aiProvider === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  <label class="field">Cloudflare model<select id="set-cf-model">${Object.entries(Object.assign({ '': `Server default${((S.backend && S.backend.ai && S.backend.ai.cloudflare) || {}).model ? ' (' + S.backend.ai.cloudflare.model + ')' : ''}` }, CF_MODELS, S.cfModel && !CF_MODELS[S.cfModel] ? { [S.cfModel]: 'Custom' } : {})).map(([k, v]) => `<option value="${esc(k)}" ${S.cfModel === k ? 'selected' : ''}>${esc(v)}${k ? ' — ' + esc(k) : ''}</option>`).join('')}</select></label>
  <label class="field">Cloudflare account ID <small class="muted">(optional — or set CLOUDFLARE_ACCOUNT_ID in backend/.env)</small><input id="set-cf-account" value="${esc(S.cfAccount)}" placeholder="32-character account ID" autocomplete="off" spellcheck="false"></label>
  <label class="field">Cloudflare API token <small class="muted">(optional — or set CLOUDFLARE_API_TOKEN in backend/.env)</small><input type="password" id="set-cf-token" value="${esc(S.cfToken)}" placeholder="Workers AI token" autocomplete="off"></label>
  <label class="field">Ollama model<input id="set-ollama" value="${esc(S.ollamaModel)}" placeholder="qwen3.5:9b"></label>
  <label class="field">OpenRouter model<select id="set-or-model">${Object.entries(OR_MODELS).map(([k, v]) => `<option value="${k}" ${S.orModel === k ? 'selected' : ''}>${v} — ${k}</option>`).join('')}</select></label>
  <label class="field">OpenRouter API key <small class="muted">(optional — or set OPENROUTER_API_KEY in backend/.env)</small><input type="password" id="set-or-key" value="${esc(S.orKey)}" placeholder="sk-or-…" autocomplete="off"></label>
  <div class="row"><button class="btn primary" data-act="set-save">Save</button><button class="btn ghost" data-act="set-test">Test AI</button><span id="set-msg" class="muted"></span></div>
  <p class="muted" style="font-size:12px;margin-top:16px">Settings are stored only in this browser. API keys are sent only to your own DIMORA backend, which forwards them to Cloudflare or openrouter.ai. Better: keep it in <code>backend/.env</code> so it never touches the browser.</p>
  <h3 style="margin-top:20px">Graphics</h3>
  <label class="field">3D quality <small class="muted">(applies instantly)</small><select data-act-change="gfx">${[['ultra', 'Ultra: sharpest, full resolution'], ['high', 'High: realistic (recommended)'], ['balanced', 'Balanced: for laptops and phones'], ['low', 'Low: fastest']].map(([k, v]) => `<option value="${k}" ${(E ? E.quality : Engine.defaultQuality()) === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
  <h3 style="margin-top:20px">Data</h3><button class="btn sm ghost" data-act="clear-data">Clear all saved projects &amp; settings</button>`;
  $('#modal').classList.add('on');
  API.health(true).then(() => { const el = $('#set-status'); if (el) el.innerHTML = aiStatusHTML(); });
}
function readSettingsForm() {
  S.backendUrl = $('#set-url').value.trim(); S.aiProvider = $('#set-prov').value; S.ollamaModel = $('#set-ollama').value.trim() || 'qwen3.5:9b'; S.orModel = $('#set-or-model').value; S.orKey = $('#set-or-key').value.trim(); S.cfModel = $('#set-cf-model').value; S.cfAccount = $('#set-cf-account').value.trim(); S.cfToken = $('#set-cf-token').value.trim();
  store.set('ai', { backendUrl: S.backendUrl, aiProvider: S.aiProvider, ollamaModel: S.ollamaModel, orModel: S.orModel, orKey: S.orKey, cfModel: S.cfModel, cfAccount: S.cfAccount, cfToken: S.cfToken });
}
/* ---------- upload & detection flow ---------- */
let detectRes = null;
function resetUpload() { $('#up-drop').hidden = false; $('#up-result').hidden = true; $('#det-tools').hidden = true; DET.sel = null; $('#file-in').value = ''; $('#st-detect').className = ''; const n = $('#ai-note');
  const paint = () => { $('#use-ai').checked = aiOn(); $('#use-ai').disabled = !aiOn(); if (n) n.innerHTML = aiOn() ? `Using <b>${esc(modelLabel())}</b> on the backend` : S.backendOK ? `No AI connected — <a data-act="settings" style="color:var(--acc);cursor:pointer">connect Cloudflare AI</a> so it can read labels, dimensions, stairs &amp; floor names. The backend's computer vision still finds walls, rooms and floors.` : `Backend offline — DIMORA will use its simpler in-browser engine. Start it with <code>python backend/app.py</code>.`; };
  paint(); API.health().then(paint); }
/* input: a data URL, or a list of sheets [{url, name}] (one per file / PDF page). Every sheet may hold one or several floor plans. */
/* Server path: the Python backend detects, scales, orders, aligns and connects every floor. */
function applyServerFloors(list) {
  const pj = P();
  pj.floors = list.map(fl => { const f = newFloor(fl.name, fl.level); f.height = fl.height || 2.9;
    f.rooms = fl.rooms.map(r => makeRoom(Object.assign({ id: r.id, name: r.name, type: ROOM_TYPES[r.type] ? r.type : 'empty', x: r.x, y: r.y, w: r.w, d: r.d, group: r.group || null },
      ...['steps', 'cars', 'trees', 'railing'].filter(k => r[k] != null).map(k => ({ [k]: r[k] }))))); // porch steps, cars, trees as drawn
    f.doors = (fl.doors || []).map(d => Object.assign({}, d)); f.windows = (fl.windows || []).map(w => Object.assign({ sill: 0.9, h: 1.25 }, w));
    f.stairs = (fl.stairs || []).map(st => Object.assign({}, st)); f._stairRects = fl.stair_rects || []; return f; });
  pj.activeFloor = 0;
}
/* open a ready-made reading (examples gallery): same path as an upload, without calling the AI */
async function openExample(url, name) {
  const res = await (await fetch(url)).json();
  S.project = newProject(name || 'Example Home'); S.history = []; S.future = []; S.variants = []; S.structuralLog = []; S.sel = null; S.showAllFloors = false; S.explode = false;
  applyServerFloors(res.floors); P().wallThickness = res.wall_thickness; P().scaleNote = res.scale_note;
  if (res.north != null) P().north = res.north; P().site = res.site || null; if (res.built_up_sqft) P().builtUpSqft = res.built_up_sqft;
  if (/structured/i.test(res.source || '')) P().facade = 'classic';
  P().planImage = res.floors[0].overlay && res.floors[0].overlay.image || null;
  await generate3D();
}
async function runServerDetection(input, opts = {}) {
  const files = input.files ? input.files : typeof input === 'string' ? [new File([dataURLtoBlob(input)], (opts.name || 'plan').replace(/[^\w -]+/g, '') + '.png', { type: 'image/png' })] : input.map((sh, i) => new File([dataURLtoBlob(sh.url)], (sh.name || 'sheet ' + (i + 1)).replace(/[^\w -]+/g, '') + '.png', { type: 'image/png' }));
  $('#up-drop').hidden = true; $('#up-result').hidden = false; $('#btn-gen').disabled = true;
  const first = files[0]; $('#up-img').src = typeof input === 'string' ? input : /^image\//.test(first.type) ? URL.createObjectURL(first) : '';
  $('#up-ov').innerHTML = ''; $$('#up-stage .ovl').forEach(x => x.remove()); $('#det-log').innerHTML = ''; $('#det-rooms').innerHTML = ''; $('#det-counts').innerHTML = ''; $('#det-floors').innerHTML = '';
  $('#up-stage').classList.add('scanning'); $('#st-detect').className = 'on';
  const log = m => { const li = document.createElement('li'); li.textContent = m; $('#det-log').appendChild(li); $('#det-log').scrollTop = 1e6; };
  S.project = newProject(opts.name || 'My Home'); S.history = []; S.future = []; S.variants = []; S.structuralLog = []; S.sel = null; S.showAllFloors = false; S.explode = false;
  DET.sel = null; detSetTool('select');
  const fd = new FormData(); files.forEach(f => fd.append('files', f, f.name));
  fd.append('use_ai', $('#use-ai').checked ? '1' : '0'); fd.append('width_m', String(+(opts.widthM ?? $('#plan-width').value) || 0));
  fd.append('floors', String(+(opts.floors ?? ($('#floor-count') && $('#floor-count').value)) || 0)); if (opts.defaultWidth) fd.append('default_width', String(opts.defaultWidth));
  log(`Sending ${files.length} file${files.length > 1 ? 's' : ''} to the DIMORA backend (${API.base()})…`);
  try {
    const res = await API.req('/api/plans/detect', { form: fd, timeout: 600000 });
    (res.log || []).forEach(log);
    applyServerFloors(res.floors);
    P().wallThickness = res.wall_thickness; P().scaleNote = res.scale_note;
    if (res.north != null) P().north = res.north; P().site = res.site || null; if (res.built_up_sqft) P().builtUpSqft = res.built_up_sqft;
    if (/structured/i.test(res.source || '')) { P().facade = P().facade || 'classic'; } // an Indian plan read by the AI: plastered walls, parapet roof P().planImage = res.floors[0].overlay.image || (typeof input === 'string' ? input : null);
    detectRes = { server: true, cur: 0, floors: res.floors.map(fl => ({ url: fl.overlay.image || $('#up-img').src, rd: { cv: { W: fl.overlay.W, H: fl.overlay.H }, mpp: fl.overlay.mpp, bx0: fl.overlay.bx0, by0: fl.overlay.by0, off: fl.overlay.off, source: res.source + ' (backend)' } })) };
    renderDetection(); $('#btn-gen').disabled = false;
  } catch (e) {
    console.error(e); log('⚠ ' + e.message);
    if (e.code === 'offline') { log('Switching to the in-browser engine…'); $('#up-stage').classList.remove('scanning'); const sheets = input.files ? await filesToSheets(input.files) : input; return runDetection(sheets, Object.assign({}, opts, { local: true })); }
    toast(e.message, 5000);
  }
  $('#up-stage').classList.remove('scanning');
}
async function runDetection(input, opts = {}) {
  if (!opts.local) { await API.health(); if (S.backendOK) return runServerDetection(input, opts); }
  if (input && input.files) input = await filesToSheets(input.files);
  const sheets = typeof input === 'string' ? [{ url: input, name: opts.name || '' }] : input;
  $('#up-drop').hidden = true; $('#up-result').hidden = false; $('#btn-gen').disabled = true;
  $('#up-img').src = sheets[0].url; $('#up-ov').innerHTML = ''; $$('#up-stage .ovl').forEach(x => x.remove()); $('#det-log').innerHTML = ''; $('#det-rooms').innerHTML = ''; $('#det-counts').innerHTML = ''; $('#det-floors').innerHTML = '';
  $('#up-stage').classList.add('scanning'); $('#st-detect').className = 'on';
  const log = m => { const li = document.createElement('li'); li.textContent = m; $('#det-log').appendChild(li); $('#det-log').scrollTop = 1e6; };
  S.project = newProject(opts.name || 'My Home'); S.project.planImage = sheets[0].url; S.history = []; S.future = []; S.variants = []; S.structuralLog = []; S.sel = null; S.showAllFloors = false; S.explode = false;
  const useAI = $('#use-ai').checked, widthM = +(opts.widthM ?? $('#plan-width').value) || 0;
  const forced = sheets.length === 1 ? (+(opts.floors ?? ($('#floor-count') && $('#floor-count').value)) || 0) : 0;
  try {
    await sleep(350);
    // 1) find every floor plan on every sheet
    const plans = [];
    for (let si = 0; si < sheets.length; si++) {
      const sh = sheets[si]; const img = await loadImage(sh.url);
      let boxes = splitSheet(img), how = 'computer vision', repeat = 0;
      if (forced && boxes.length !== forced) {
        if (forced === 1) boxes = [{ x0: 0, y0: 0, x1: 1, y1: 1 }];
        else if (boxes.length < forced) repeat = forced - boxes.length; // fewer plans than storeys: typical floor
        else boxes = boxes.slice(0, forced);
      }
      const padded = boxes.length > 1 ? padBoxes(boxes) : boxes;
      if (boxes.length > 1) log(`${sheets.length > 1 ? (sh.name || 'Sheet ' + (si + 1)) + ': ' : ''}found ${boxes.length} separate floor plans on the sheet (${how}).`);
      padded.forEach((b, i) => plans.push({ url: boxes.length > 1 ? cropToURL(img, b) : sh.url, sheet: si, name: sh.name || '', hint: boxes[i].label || '', hintLevel: boxes[i].level, idx: plans.length }));
      if (repeat) { const last = plans[plans.length - 1]; log(`${boxes.length} plan${boxes.length === 1 ? '' : 's'} drawn for ${forced} storeys — repeating the top plan as a typical floor for the ${repeat} floor${repeat === 1 ? '' : 's'} above.`);
        for (let k = 0; k < repeat; k++) plans.push(Object.assign({}, last, { idx: plans.length, hint: '', hintLevel: null, typicalOf: last.idx })); }
    }
    const multi = plans.length > 1;
    if (!multi) {
      const rd = await detectPlan(plans[0].url, { log, widthM, useAI, defaultWidth: opts.defaultWidth });
      detectRes = { floors: [{ rd, url: plans[0].url }], cur: 0 };
      log(`Built ${FL().rooms.length} rooms, ${FL().doors.length} doors and ${FL().windows.length} windows · ${P().scaleNote}`);
    } else {
      log(`Reading ${plans.length} floors one by one…`);
      // 2) read each floor
      for (const p of plans) { if (p.typicalOf != null) { const src = plans.find(q => q.idx === p.typicalOf); p.rd = Object.assign({}, src.rd, { level: null, label: '' }); continue; } p.rd = await readPlan(p.url, { log, useAI, multi: true, tag: `Plan ${p.idx + 1}` }); }
      // 3) order floors: AI level → printed title → file name → position on the sheet
      plans.forEach(p => { const lv = p.rd.level ?? (p.hintLevel != null && isFinite(+p.hintLevel) ? +p.hintLevel : null) ?? parseLevel(p.rd.label) ?? parseLevel(p.hint) ?? (sheets.length > 1 ? parseLevel(p.name) : null); p.sortKey = lv == null ? 1000 + p.idx : lv * 100 + p.idx; p.title = p.rd.label || p.hint || ''; });
      plans.sort((a, b) => a.sortKey - b.sortKey);
      // 4) scale: one sheet = one drawing scale (metres per native pixel)
      const natW = p => p.rd.pxW * p.rd.nat; const sheetMpp = {};
      if (widthM) sheetMpp[plans[0].sheet] = widthM / natW(plans[0]);
      [...new Set(plans.map(p => p.sheet))].forEach(si => { if (sheetMpp[si]) return; const v = plans.filter(p => p.sheet === si && p.rd.widthM).map(p => p.rd.widthM / natW(p)).sort((a, b) => a - b); if (v.length) sheetMpp[si] = v[Math.floor(v.length / 2)]; });
      if (!Object.keys(sheetMpp).length) sheetMpp[plans[0].sheet] = (opts.defaultWidth || 12) / natW(plans[0]);
      const g0 = plans[0], gWidth = sheetMpp[g0.sheet] ? natW(g0) * sheetMpp[g0.sheet] : null;
      plans.forEach(p => { if (!sheetMpp[p.sheet]) sheetMpp[p.sheet] = (gWidth || plans.map(q => sheetMpp[q.sheet] && natW(q) * sheetMpp[q.sheet]).find(Boolean) || 12) / natW(p); });
      // 5) build floors
      const pj = P(); pj.floors = plans.map((p, k) => { const f = newFloor(cleanFloorName(p.title, k), k); buildFloorFromReading(p.rd, f, sheetMpp[p.sheet] * p.rd.nat, { main: k === 0 }); return f; });
      // make floor names unique
      pj.floors.forEach((f, k) => { if (pj.floors.some((o, j) => j < k && o.name === f.name)) f.name = floorName(k); });
      const offs = plans.map(() => [0, 0]); alignAndConnectFloors(pj.floors, offs); plans.forEach((p, k) => p.rd.off = offs[k]);
      pj.activeFloor = 0; setThicknessFrom(plans[0].rd);
      const srcs = [...new Set(plans.map(p => p.rd.source))].join(' / ');
      pj.scaleNote = `${srcs} · ${pj.floors.length} floors · scale ${r2(plans[0].rd.mpp * 100)} cm/px · ground floor width ${r2(homeBounds(pj.floors[0]).w)} m`;
      detectRes = { floors: plans.map(p => ({ rd: p.rd, url: p.url })), cur: 0 };
      pj.floors.forEach(f => log(`${f.name}: ${f.rooms.length} rooms, ${f.doors.length} doors, ${f.windows.length} windows${f.stairs.length ? ', staircase going up' : ''}`));
      const st = pj.floors.filter(f => f.stairs.length).length; log(`Stacked ${pj.floors.length} floors and connected them with ${st} staircase${st === 1 ? '' : 's'} · ${pj.scaleNote}`);
    }
    renderDetection();
    $('#btn-gen').disabled = false;
  } catch (e) { console.error(e); log('⚠ ' + e.message); toast(e.message, 5000); }
  $('#up-stage').classList.remove('scanning');
}
/* ---------- detection-screen editor: fix rooms, doors and windows before generating ---------- */
const DET = { tool: 'select', sel: null, drag: null, ghost: null };
function detGeo() {
  const D = detectRes; if (!D || !S.project) return null; const fi = clamp(D.cur, 0, P().floors.length - 1); const res = D.floors[fi].rd, off = res.off || [0, 0];
  return { f: P().floors[fi], fi, toM: (px, py) => [r2(((px / 100 * res.cv.W) - res.bx0) * res.mpp + off[0]), r2(((py / 100 * res.cv.H) - res.by0) * res.mpp + off[1])] };
}
function detPointer(e) { const r = $('#up-img').getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100]; }
function detSetTool(t) {
  DET.tool = t; DET.ghost = null; $$('[data-act=det-tool]').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $('#up-stage').dataset.tool = t;
  $('#det-hint').textContent = { select: 'Click a room, door or window to select it. Drag a room to move it.', room: 'Drag on the plan to draw a room.', door: 'Click on a wall to add a door.', window: 'Click on an outside wall to add a window.' }[t];
}
function detSnapEdge(v, f, axis, except) { let best = null; f.rooms.forEach(r => { if (r === except) return; (axis === 'x' ? [r.x, r.x + r.w] : [r.y, r.y + r.d]).forEach(e => { if (Math.abs(e - v) < 0.25 && (best == null || Math.abs(e - v) < Math.abs(best - v))) best = e; }); }); return best != null ? best : r2(snap(v, 0.05)); }
function detDelete(sel = DET.sel) {
  const g = detGeo(); if (!g || !sel) return; const f = g.f, id = sel.id;
  if (sel.kind === 'room') f.rooms = f.rooms.filter(r => r.id !== id); else if (sel.kind === 'door') f.doors = f.doors.filter(d => d.id !== id);
  else if (sel.kind === 'window') f.windows = f.windows.filter(d => d.id !== id); else if (sel.kind === 'stair') f.stairs = (f.stairs || []).filter(d => d.id !== id);
  DET.sel = null; renderDetection();
}
function initDetEditor() {
  const st = $('#up-stage'); if (!st || st._det) return; st._det = true;
  st.addEventListener('pointerdown', e => {
    const g = detGeo(); if (!g || $('#up-result').hidden || $('#btn-gen').disabled) return; const m = g.toM(...detPointer(e)), f = g.f; P().activeFloor = g.fi;
    if (DET.tool === 'room') { DET.drag = { kind: 'draw', a: m }; DET.ghost = { a: m, b: m }; st.setPointerCapture(e.pointerId); e.preventDefault(); return; }
    if (DET.tool === 'door' || DET.tool === 'window') {
      const nw = nearestWall(m, f); if (!nw) { toast('Click closer to a wall'); return; }
      const L = nw.L, w = Math.min(DET.tool === 'door' ? 0.9 : 1.2, L.b - L.a - 0.1); const t = clamp(nw.t, L.a + w / 2 + 0.05, L.b - w / 2 - 0.05);
      if (DET.tool === 'window' && !isExteriorPoint(f, L.o, L.c, t)) { toast('Windows go on outside walls'); return; }
      const o = { id: uid(DET.tool === 'door' ? 'd' : 'w'), o: L.o, x: r2(L.o === 'h' ? t : L.c), y: r2(L.o === 'h' ? L.c : t), w: r2(w) };
      if (DET.tool === 'door') f.doors.push(o); else f.windows.push(Object.assign(o, { sill: 0.9, h: 1.25 }));
      DET.sel = { kind: DET.tool, id: o.id }; renderDetection(); return;
    }
    const el = e.target.closest('[data-k]');
    if (el) { DET.sel = { kind: el.dataset.k, id: el.dataset.id }; if (el.dataset.k === 'room') { const r = f.rooms.find(x => x.id === el.dataset.id); if (r) { DET.drag = { kind: 'move', r, start: m, x: r.x, y: r.y }; st.setPointerCapture(e.pointerId); } } }
    else DET.sel = null;
    renderDetection();
  });
  st.addEventListener('pointermove', e => { const d = DET.drag; if (!d) return; const g = detGeo(); if (!g) return; const m = g.toM(...detPointer(e));
    if (d.kind === 'draw') { DET.ghost.b = m; renderDetection(); }
    else if (d.kind === 'move') { d.r.x = r2(d.x + m[0] - d.start[0]); d.r.y = r2(d.y + m[1] - d.start[1]); d.moved = true; renderDetection(); } });
  st.addEventListener('pointerup', () => { const d = DET.drag; DET.drag = null; if (!d) return; const g = detGeo(); if (!g) return; const f = g.f;
    if (d.kind === 'draw') { const a = DET.ghost.a, b = DET.ghost.b; DET.ghost = null;
      let x0 = detSnapEdge(Math.min(a[0], b[0]), f, 'x'), x1 = detSnapEdge(Math.max(a[0], b[0]), f, 'x'), y0 = detSnapEdge(Math.min(a[1], b[1]), f, 'y'), y1 = detSnapEdge(Math.max(a[1], b[1]), f, 'y');
      if (x1 - x0 >= 0.8 && y1 - y0 >= 0.8) { const r = makeRoom({ name: 'New Room', type: 'empty', x: r2(x0), y: r2(y0), w: r2(x1 - x0), d: r2(y1 - y0) }); f.rooms.push(r); DET.sel = { kind: 'room', id: r.id }; detSetTool('select'); toast('Room added — name it and pick its type in the list'); }
      else toast('Drag a bigger rectangle (at least 0.8 × 0.8 m)');
      renderDetection(); }
    if (d.kind === 'move' && d.moved) { const r = d.r; const nx = detSnapEdge(r.x, f, 'x', r), nx1 = detSnapEdge(r.x + r.w, f, 'x', r), ny = detSnapEdge(r.y, f, 'y', r), ny1 = detSnapEdge(r.y + r.d, f, 'y', r);
      const dx = Math.abs(nx - r.x) <= Math.abs(nx1 - r.x - r.w) ? nx - r.x : nx1 - r.x - r.w, dy = Math.abs(ny - r.y) <= Math.abs(ny1 - r.y - r.d) ? ny - r.y : ny1 - r.y - r.d;
      r.x = r2(r.x + dx); r.y = r2(r.y + dy); renderDetection(); } });
  document.addEventListener('keydown', e => { if ((e.key === 'Delete' || e.key === 'Backspace') && DET.sel && !$('#up-result').hidden && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); detDelete(); } });
}
function renderDetection() {
  const D = detectRes; if (!D) return; const pj = P(); const fi = clamp(D.cur, 0, pj.floors.length - 1); const e = D.floors[fi]; const res = e.rd, f = pj.floors[fi]; const cv = res.cv; const off = res.off || [0, 0];
  if ($('#up-img').getAttribute('src') !== e.url) $('#up-img').src = e.url;
  const toPct = (mx, my) => [(((mx - off[0]) / res.mpp) + res.bx0) / cv.W * 100, (((my - off[1]) / res.mpp) + res.by0) / cv.H * 100];
  const ov = []; $$('#up-stage .ovl').forEach(x => x.remove());
  const isSel = (k, id) => DET.sel && DET.sel.kind === k && DET.sel.id === id;
  f.rooms.forEach((r, i) => { const [x0, y0] = toPct(r.x, r.y), [x1, y1] = toPct(r.x + r.w, r.y + r.d); const sel = isSel('room', r.id); ov.push(`<rect data-k="room" data-id="${r.id}" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${ROOM_TYPES[r.type].tint}" fill-opacity="${sel ? 0.7 : 0.45}" stroke="${sel ? '#f59e0b' : '#7c3aed'}" stroke-width="${sel ? 3 : 1.2}" ${r.group ? 'stroke-dasharray="6 4"' : ''} vector-effect="non-scaling-stroke" ${D.animated ? '' : `style="animation:pop .4s ease ${i * 0.08}s both"`}/>`);
    const lb = document.createElement('div'); lb.className = 'ovl'; lb.style.cssText = `position:absolute;left:${(x0 + x1) / 2}%;top:${(y0 + y1) / 2}%;transform:translate(-50%,-50%);background:rgba(11,15,25,.85);color:#fff;border-radius:6px;padding:2px 6px;font-size:11px;font-weight:700;white-space:nowrap;pointer-events:none`; lb.textContent = `${r.name} · ${r.w}×${r.d}`; $('#up-stage').appendChild(lb); });
  const seg = (o, k, col) => { const a = o.o === 'h' ? toPct(o.x - o.w / 2, o.y) : toPct(o.x, o.y - o.w / 2), b = o.o === 'h' ? toPct(o.x + o.w / 2, o.y) : toPct(o.x, o.y + o.w / 2); const sel = isSel(k, o.id);
    ov.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${sel ? '#f59e0b' : col}" stroke-width="${sel ? 7 : 4}" stroke-linecap="round" vector-effect="non-scaling-stroke"/><line data-k="${k}" data-id="${o.id}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="transparent" stroke-width="16" vector-effect="non-scaling-stroke"/>`); };
  f.doors.forEach(d => seg(d, 'door', d.main ? '#ef4444' : '#ec4899')); f.windows.forEach(w => seg(w, 'window', '#2f8fd0'));
  if (DET.ghost) { const [x0, y0] = toPct(Math.min(DET.ghost.a[0], DET.ghost.b[0]), Math.min(DET.ghost.a[1], DET.ghost.b[1])), [x1, y1] = toPct(Math.max(DET.ghost.a[0], DET.ghost.b[0]), Math.max(DET.ghost.a[1], DET.ghost.b[1])); ov.push(`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="rgba(124,58,237,.18)" stroke="#a78bfa" stroke-width="2" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>`); }
  const stairBox = (st, dash) => { const ft = stairFoot(st); const [x0, y0] = toPct(ft.x, ft.y), [x1, y1] = toPct(ft.x + ft.w, ft.y + ft.d); const lw = toPct(...stairEnd(st, 'low')), hi = toPct(...stairEnd(st, 'high')); ov.push(`<rect ${dash ? '' : `data-k="stair" data-id="${st.id}"`} x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#f59e0b" fill-opacity="${dash ? 0.12 : 0.35}" stroke="#f59e0b" stroke-width="2" ${dash ? 'stroke-dasharray="4 3"' : ''} vector-effect="non-scaling-stroke"/>`); if (!dash) ov.push(`<line x1="${lw[0]}" y1="${lw[1]}" x2="${hi[0]}" y2="${hi[1]}" stroke="#b45309" stroke-width="2" marker-end="url(#det-arrow)" vector-effect="non-scaling-stroke"/>`); };
  (f.stairs || []).forEach(st => stairBox(st, false)); stairsBelow(f).forEach(st => stairBox(st, true));
  $('#up-ov').setAttribute('viewBox', '0 0 100 100'); $('#up-ov').setAttribute('preserveAspectRatio', 'none'); $('#up-ov').innerHTML = `<defs><marker id="det-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#b45309"/></marker></defs>` + ov.join('');
  const multi = pj.floors.length > 1;
  $('#det-floors').innerHTML = multi ? `<div class="det-floor-tabs">${pj.floors.map((x, i) => `<button class="chip ${i === fi ? 'on' : ''}" data-act="det-floor" data-i="${i}">${esc(x.name)} <small>${x.rooms.length}</small></button>`).join('')}</div>
    <div class="det-floor-row"><input value="${esc(f.name)}" data-act-change="det-floor-name" title="Floor name"><button class="icon-btn" data-act="det-floor-move" data-d="-1" title="Move this floor down a level" ${fi === 0 ? 'disabled' : ''}>↓</button><button class="icon-btn" data-act="det-floor-move" data-d="1" title="Move this floor up a level" ${fi === pj.floors.length - 1 ? 'disabled' : ''}>↑</button></div>
    <small class="muted">${f.stairs?.length ? `Staircase ${stairWidth(f.stairs[0])} m wide rises to ${esc(floorAbove(f)?.name || 'the floor above')} (orange, arrow = up).` : stairsBelow(f).length ? 'Dashed orange = stair opening from the floor below.' : ''}</small>` : `<div class="det-floor-row"><small class="muted" style="flex:1">One floor found. Is the building taller (a typical floor plan)?</small></div>`;
  $('#det-floors').insertAdjacentHTML('beforeend', `<button class="btn sm ghost" data-act="det-floor-add" title="Copy this floor as a new storey on top, with a staircase up to it">＋ Add floor above (copy of ${esc(f.name)})</button>`);
  const walls = wallLines(f).length;
  $('#det-counts').innerHTML = [['Walls', walls], ['Rooms', f.rooms.length], ['Doors', f.doors.length], ['Windows', f.windows.length]].concat(multi ? [['Floors', pj.floors.length]] : []).map(([n, v]) => `<div><b>${v}</b><span>${n}</span></div>`).join('');
  $('#det-rooms').innerHTML = `<small class="muted">${esc(res.source)} · check names &amp; types before generating</small>` + f.rooms.map(r => `<div class="det-room ${DET.sel && DET.sel.id === r.id ? 'sel' : ''}"><i style="background:${ROOM_TYPES[r.type].tint}"></i><input value="${esc(r.name)}" data-act-change="det-name" data-id="${r.id}"><select data-act-change="det-type" data-id="${r.id}">${Object.entries(ROOM_TYPES).map(([k, v]) => `<option value="${k}" ${k === r.type ? 'selected' : ''}>${v.label}</option>`).join('')}</select><small>${r.w}×${r.d} m</small><button class="x" data-act="det-del-room" data-id="${r.id}" title="Delete room">✕</button></div>`).join('');
  $('#det-tools').hidden = false; D.animated = true;
  $('#btn-gen').textContent = multi ? `Generate ${pj.floors.length}-floor 3D model →` : 'Generate 3D model →';
}
/* swap two floors' levels (user says "this is actually the first floor"), then re-align and re-connect the stairs */
async function detMoveFloor(d) {
  const D = detectRes, pj = P(); const i = D.cur, j = i + d; if (j < 0 || j >= pj.floors.length) return;
  if (D.server) {
    const geo = projectGeometry(pj).floors, offs = D.floors.map(e => e.rd.off);
    [geo[i], geo[j]] = [geo[j], geo[i]]; [offs[i], offs[j]] = [offs[j], offs[i]];
    try { const r = await API.req('/api/plans/restack', { body: { floors: geo, offsets: offs }, timeout: 30000 }); [D.floors[i], D.floors[j]] = [D.floors[j], D.floors[i]]; applyServerFloors(r.floors); D.floors.forEach((e, k) => e.rd.off = r.offsets[k]); }
    catch (e) { toast('Could not re-stack: ' + e.message, 4000); return; }
    D.cur = j; pj.activeFloor = j; renderDetection(); return;
  }
  pj.floors.forEach((f, k) => shiftFloor(f, -D.floors[k].rd.off[0], -D.floors[k].rd.off[1]));
  [pj.floors[i], pj.floors[j]] = [pj.floors[j], pj.floors[i]]; [D.floors[i], D.floors[j]] = [D.floors[j], D.floors[i]];
  pj.floors.forEach((f, k) => { f.level = k; if (FLOOR_NAMES.includes(f.name) || /^\d+(st|nd|rd|th) Floor$/.test(f.name)) f.name = floorName(k); f.doors = f.doors.filter(x => !x.main); });
  autoOpenings(pj.floors[0], { windows: false });
  const offs = pj.floors.map(() => [0, 0]); alignAndConnectFloors(pj.floors, offs); D.floors.forEach((e, k) => e.rd.off = offs[k]);
  D.cur = j; pj.activeFloor = j; renderDetection();
}
/* add a storey on top: a copy of the floor being viewed (typical floor), then re-align and add the stairs */
async function detAddFloor() {
  const D = detectRes, pj = P(); if (!D || !pj) return; const i = D.cur, src = pj.floors[i];
  if (pj.floors.length >= 30) { toast('That is a lot of floors — 30 is the limit'); return; }
  const c = deep(src); const n = pj.floors.length;
  c.id = uid('f'); c.level = n; c.name = floorName(n); c.stairs = [];
  c.rooms.forEach(r => { r.id = uid('r'); r.furniture = []; }); c.doors = c.doors.filter(d => !d.main).map(d => Object.assign(d, { id: uid('d') })); c.windows.forEach(w => { w.id = uid('w'); });
  const e = D.floors[i]; const entry = { rd: Object.assign({}, e.rd, { off: (e.rd.off || [0, 0]).slice() }), url: e.url };
  if (D.server) {
    const geo = projectGeometry(pj).floors.concat([projectGeometry({ floors: [c] }).floors[0]]), offs = D.floors.map(x => x.rd.off || [0, 0]).concat([entry.rd.off]);
    try { const r = await API.req('/api/plans/restack', { body: { floors: geo, offsets: offs }, timeout: 30000 }); D.floors.push(entry); applyServerFloors(r.floors); D.floors.forEach((x, k) => x.rd.off = r.offsets[k]); }
    catch (err) { toast('Could not add the floor: ' + err.message, 4000); return; }
  } else {
    pj.floors.push(c); D.floors.push(entry);
    pj.floors.forEach((f, k) => shiftFloor(f, -(D.floors[k].rd.off || [0, 0])[0], -(D.floors[k].rd.off || [0, 0])[1]));
    pj.floors.forEach(f => { f.stairs = []; });
    const offs = pj.floors.map(() => [0, 0]); alignAndConnectFloors(pj.floors, offs); D.floors.forEach((x, k) => x.rd.off = offs[k]);
  }
  D.cur = pj.floors.length - 1; pj.activeFloor = D.cur; DET.sel = null; renderDetection(); toast(`Added ${pj.floors[D.cur].name}`);
}
async function generate3D() {
  const pj = P(); if (!allRooms().length) return;
  const beds = allRooms().filter(r => ['bedroom', 'master', 'guest'].includes(r.type)).length || 1;
  if (pj.name === 'My Home') pj.name = pj.floors.length === 2 ? `${beds}BHK Duplex` : pj.floors.length > 2 ? `${beds}BHK G+${pj.floors.length - 1} Home` : `${beds}BHK Home`;
  pj.floors.forEach(f => delete f._stairRects);
  if (pj.plinth == null) pj.plinth = allRooms().some(r => r.type === 'garage') ? 0 : 0.45; // raised plinth (18 in) with entrance steps
  pj.theme = S.prefs.style; furnishAll(); clearStairFurniture();
  pj.activeFloor = 0; S.showAllFloors = pj.floors.length > 1; S.explode = false;
  S.original = deep(S.project);
  openWorkspace(true);
}
let workspacePlanReady = false;
function openWorkspace(fresh) {
  show('work');
  if (!E) init3D();
  if (!workspacePlanReady) { init2D(); workspacePlanReady = true; }
  $('#proj-name').value = P().name;
  $('#app').classList.remove('studio-tools-open');
  S.sel = null; S.view = '3d'; $('#app').dataset.view = '3d'; $$('#view-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === '3d'));
  if (!S.original) S.original = deep(S.project);
  FLOW.step = null; FLOW.room = null; FLOW.floorCam = null; FLOW.fi = null;
  const explore = !!S.exploreOnOpen;
  const preview = S.exploreOnOpen === 'garage' && garagePreviewDoor() ? 'garage' : 'ext';
  S.exploreOnOpen = false;
  if (explore) {
    if (courtyardFacade()) {
      S.hour = GOLDEN_HOUR;
      $('#time-slider').value = GOLDEN_HOUR;
    }
    S.cutaway = false; S.roof = true; S.showAllFloors = true; S.labels = false;
    $('#t-roof').classList.add('on'); $('#t-cut').classList.remove('on'); $('#t-lab').classList.remove('on');
    $('#app').classList.remove('side-open', 'chat-open');
  }
  const app = $('#app');
  const canPreview = !E && PRIVATE_HOST && P().example === 'duplex';
  app.dataset.renderer = E ? 'webgl' : canPreview ? 'photos' : 'plan';
  const threeD = $('#view-seg [data-v="3d"]'), walk = $('#view-seg [data-v="walk"]');
  threeD.textContent = canPreview ? 'Views' : '3D';
  threeD.disabled = !E && !canPreview;
  threeD.title = !E && !canPreview ? 'This browser could not start WebGL2' : '';
  walk.disabled = !E;
  if (!E) {
    if (canPreview) openRenderedView(preview);
    else {
      setView('2d');
      toast('3D is unavailable in this browser. The 2D floor plan is ready to explore.', 6000);
    }
  } else {
    $('#gl-fallback').style.display = '';
    rebuild(); renderFloorSeg();
    if (explore) setFlowStep(preview); else renderFlowNav();
    if (preview === 'garage') {
      const { pos, target } = garagePreviewFrame();
      E.cam.pos = pos; E.cam.target = target; CTL.syncFromCam('orbit'); E.dirty = true;
    } else fitView(false);
    if (fresh && !explore) { CTL.orbit.r *= 1.25; CTL.apply(); fitView(true); startBuildAnim(); }
  }
  if (!explore && (!PRIVATE_HOST || window.innerWidth > 820)) openPanel(S.panel || 'design');
  renderInspector(); updateAIBadge(); chatSuggestions();
  if (S.chatFor !== P().id) { S.chatFor = P().id; $('#chat-log').innerHTML = ''; const pc = S.paintChips; S.paintChips = null; (P().chat || []).slice(-20).forEach(m => addChat(m.role === 'aria' ? 'aria' : 'user', m.text)); S.paintChips = pc; }
  if (!$('#chat-log').children.length) addChat('aria', `Hi${currentUser() ? ' ' + firstName(currentUser()) : ''}! I'm Aria. ${ariaGoalLine()}Your ${P().name} is ready in 3D with ${allRooms().length} rooms, furnished in ${P().theme} style. Ask me to change anything — or press “AI Home Tour” and I'll walk you through it.`);
  if (fresh && !explore && window.innerWidth > 1480) $('#app').classList.add('chat-open');
  if (!explore) setTimeout(() => save(!!E), 2600);
}
function renderFloorSeg() {
  const pj = P(); if (!pj) return; const multi = pj.floors.length > 1;
  const btns = pj.floors.map((f, i) => `<button class="${i === pj.activeFloor && !(S.showAllFloors && S.view !== '2d') ? 'on' : ''}" data-act="floor-switch" data-i="${i}" title="${esc(f.name)}">${esc(f.name.replace(/ Floor$/, ''))}</button>`).join('');
  $$('.floor-seg').forEach(el => { el.style.display = multi ? '' : 'none'; el.innerHTML = btns + (el.id === 'floor-seg' ? `<button class="${S.showAllFloors ? 'on' : ''}" data-act="floor-all" title="Show the whole building">All</button><button class="${S.explode ? 'on' : ''}" data-act="floor-explode" title="Pull the floors apart">⇕ Explode</button>` : ''); });
}

/* ---------- compare helpers ---------- */
function renderWith(project, pos, target, w = 420, h = 270) {
  const saved = S.project, cam = { p: E.cam.pos.slice(), t: E.cam.target.slice() };
  S.project = project; rebuild(); E.cam.pos = pos; E.cam.target = target; const img = E.snapshot(w, h);
  S.project = saved; rebuild(); E.cam.pos = cam.p; E.cam.target = cam.t; E.dirty = true; return img;
}
function roomCam(r) { const f = floorOfRoom(r); const c = [r.x + r.w / 2, floorY(f) + 0.5, r.y + r.d / 2]; const R = Math.max(r.w, r.d) * 1.1 + 2; return { pos: [c[0] - R * 0.5, c[1] + R * 0.95, c[2] + R * 0.75], target: c }; }
function homeCam() { const { b, c, hgt } = viewFrame(); const R = Math.max(b.w, b.d, hgt) * 1.25 + 4; return { pos: [c[0] - R * 0.5, c[1] + R * 0.85, c[2] + R * 0.7], target: c }; }

/* ---------- report ---------- */
function planSVGStatic(f, W = 760) {
  const b = homeBounds(f), s = (W - 40) / b.w, H = b.d * s + 40; const X = x => 20 + (x - b.x) * s, Y = y => 20 + (y - b.y) * s; const o = [];
  f.rooms.forEach(r => o.push(`<rect x="${X(r.x)}" y="${Y(r.y)}" width="${r.w * s}" height="${r.d * s}" fill="${ROOM_TYPES[r.type].tint}"/>`));
  f.rooms.forEach(r => r.furniture.forEach(it => o.push(`<g transform="translate(${X(it.x)} ${Y(it.y)}) rotate(${-it.rot})"><rect x="${-it.w * s / 2}" y="${-it.d * s / 2}" width="${it.w * s}" height="${it.d * s}" fill="#fff" fill-opacity=".7" stroke="#8a7f70" stroke-width=".8"/></g>`)));
  wallPieces(f).forEach(p => { const t = (p.ext ? 0.2 : 0.12) * s; if (p.kind === 'rail') o.push(p.o === 'h' ? `<line x1="${X(p.a)}" y1="${Y(p.c)}" x2="${X(p.b)}" y2="${Y(p.c)}" stroke="#6b7280" stroke-width="2" stroke-dasharray="3 2"/>` : `<line x1="${X(p.c)}" y1="${Y(p.a)}" x2="${X(p.c)}" y2="${Y(p.b)}" stroke="#6b7280" stroke-width="2" stroke-dasharray="3 2"/>`); else if (p.kind === 'solid') o.push(p.o === 'h' ? `<rect x="${X(p.a) - t / 2}" y="${Y(p.c) - t / 2}" width="${(p.b - p.a) * s + t}" height="${t}" fill="#2c2924"/>` : `<rect x="${X(p.c) - t / 2}" y="${Y(p.a) - t / 2}" width="${t}" height="${(p.b - p.a) * s + t}" fill="#2c2924"/>`); else if (p.kind === 'sill') o.push(p.o === 'h' ? `<line x1="${X(p.a)}" y1="${Y(p.c)}" x2="${X(p.b)}" y2="${Y(p.c)}" stroke="#2f8fd0" stroke-width="${t * 0.6}"/>` : `<line x1="${X(p.c)}" y1="${Y(p.a)}" x2="${X(p.c)}" y2="${Y(p.b)}" stroke="#2f8fd0" stroke-width="${t * 0.6}"/>`); });
  f.rooms.forEach(r => o.push(`<text x="${X(r.x + r.w / 2)}" y="${Y(r.y + r.d / 2)}" text-anchor="middle" font-size="11" font-weight="700" font-family="Manrope,Arial">${esc(r.name)}</text><text x="${X(r.x + r.w / 2)}" y="${Y(r.y + r.d / 2) + 13}" text-anchor="middle" font-size="9.5" fill="#5f5649" font-family="Manrope,Arial">${r.w} × ${r.d} m</text>`));
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">${o.join('')}</svg>`;
}
async function openReport() {
  const pj = P(), c = homeCost(), f = FL(); const rooms = allRooms(); const A = rooms.reduce((s, r) => s + area(r), 0);
  let img = ''; try { const hc = homeCam(); img = renderWith(S.project, hc.pos, hc.target, 900, 520); } catch (e) { }
  const sp = rooms.map(r => ({ r, a: analyzeSpace(r), L: analyzeLight(r), c: roomCost(r) }));
  const avgS = Math.round(sp.reduce((s, x) => s + x.a.score, 0) / sp.length), avgL = Math.round(sp.reduce((s, x) => s + x.L.score, 0) / sp.length);
  const checks = archChecks(f); const saves = rooms.flatMap(r => cheaperAlternatives(r).slice(0, 2).map(a => ({ r, a }))).sort((x, y) => y.a.save - x.a.save).slice(0, 6);
  const recs = [...sp.filter(x => x.a.corner).map(x => `${x.r.name}: convert the unused ${r2(x.a.corner.w)}×${r2(x.a.corner.d)} m corner into a study/reading corner or storage.`), ...sp.filter(x => x.L.suggestWindow).map(x => `${x.r.name}: add a ${x.L.suggestWindow.compass}-facing window for ${['Limited', 'Poor', 'No daylight'].includes(x.L.rating) ? 'daylight' : 'cross-ventilation'}.`), ...sp.flatMap(x => x.a.issues.slice(0, 1).map(i => `${x.r.name}: ${i}`))].slice(0, 10);
  const summaryId = 'rep-sum';
  const localSum = `${pj.name} offers ${r2(A)} m² (${Math.round(A * SQFT)} sq ft) across ${rooms.length} rooms in a ${pj.theme} scheme. The full interior is estimated at ${inr(c.total)} against a budget of ${inr(S.prefs.budget)} (${c.total <= S.prefs.budget ? 'within budget' : inr(c.total - S.prefs.budget) + ' over'}). Average space-utilisation score is ${avgS}/100 and daylight score ${avgL}/100. ${recs[0] ? 'Top opportunity — ' + recs[0] : ''}`;
  const html = `<div class="rep-bar"><b>Home Decision Report</b><button class="btn sm" data-act="rep-print">🖨 Print / PDF</button><button class="btn sm" data-act="rep-download">⬇ Download HTML</button><button class="btn sm" data-act="rep-copy">Copy summary</button><button class="btn sm primary" data-act="rep-close">Close</button></div>
  <div class="rep" id="rep-doc"><p style="letter-spacing:.2em;font-size:11px;font-weight:800;color:#9a4d12;margin:0">DIMORA · HOME DECISION REPORT</p><h1>${esc(pj.name)}</h1><p class="note">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · Theme: ${esc(pj.theme)} · Household of ${S.prefs.family}${S.prefs.kids ? ' with children' : ''}${S.prefs.pets ? ' and pets' : ''}${S.prefs.wfh ? ', works from home' : ''} · ${esc(pj.scaleNote || '')}</p>
  <div class="kpis"><div><b>${r2(A)} m²</b><span>carpet area · ${Math.round(A * SQFT)} sq ft</span></div><div><b>${inr(c.total)}</b><span>estimated interior</span></div><div><b>${avgS}/100</b><span>space utilisation</span></div><div><b>${avgL}/100</b><span>daylight &amp; airflow</span></div></div>
  <h2>Executive summary</h2><p id="${summaryId}">${esc(localSum)}</p>
  ${img ? `<img src="${img}" alt="3D view">` : ''}<h2>Floor plan — ${esc(f.name)}</h2>${planSVGStatic(f)}
  <h2>Room schedule</h2><table><tr><th>Room</th><th>Size</th><th class="r">Area</th><th>Walls</th><th>Floor</th><th>Space</th><th>Daylight</th><th class="r">Estimate</th></tr>${sp.map(x => `<tr><td><b>${esc(x.r.name)}</b><br><span class="note">${ROOM_TYPES[x.r.type].label}</span></td><td>${x.r.w} × ${x.r.d} m</td><td class="r">${r2(area(x.r))} m²</td><td><span class="sw" style="background:${roomWall(x.r)}"></span> ${roomWall(x.r)}</td><td>${FLOORS[roomFloorKey(x.r)].label}</td><td>${x.a.status} (${x.a.score})</td><td>${x.L.rating}${x.L.dirs.length ? ' · ' + x.L.dirs.join('/') : ''}</td><td class="r">${inr(x.c.total)}</td></tr>`).join('')}</table>
  <h2>Budget breakdown</h2><table><tr><th>Category</th><th class="r">Estimate</th><th class="r">Share</th></tr>${[['Furniture', c.furniture], ['Flooring', c.flooring], ['Wall painting', c.paint], ['Lighting', c.lighting], ['False ceiling', c.ceiling], ['Decor & curtains', c.decor]].map(([n, v]) => `<tr><td>${n}</td><td class="r">${inr(v)}</td><td class="r">${Math.round(v / c.total * 100)}%</td></tr>`).join('')}<tr><td><b>Total</b></td><td class="r"><b>${inr(c.total)}</b></td><td class="r">Budget ${inr(S.prefs.budget)}</td></tr></table>
  ${saves.length ? `<h3>Ways to save</h3><ul>${saves.map(x => `<li>${esc(x.r.name)} — ${esc(x.a.what)}: save ${inr(x.a.save)}</li>`).join('')}</ul>` : ''}
  <h2>Furniture fit &amp; space utilisation</h2><table><tr><th>Room</th><th>Furniture</th><th class="r">Cover</th><th>Findings</th></tr>${sp.map(x => `<tr><td>${esc(x.r.name)}</td><td>${x.r.furniture.map(i => CATALOG[i.type].label).join(', ') || '—'}</td><td class="r">${Math.round(x.a.coverage * 100)}%</td><td>${esc(x.a.issues[0] || (x.a.corner ? `Unused ${r2(x.a.corner.area)} m² corner` : 'Comfortable clearances'))}</td></tr>`).join('')}</table>
  <h2>Selected materials &amp; finishes</h2><table><tr><th>Room</th><th>Flooring</th><th>Paint tier</th><th>Ceiling</th><th>Lighting</th></tr>${rooms.map(r => `<tr><td>${esc(r.name)}</td><td>${FLOORS[roomFloorKey(r)].label}</td><td>${PAINT[r.tier].label}</td><td>${CEILINGS[roomCeiling(r)].label}</td><td>${['ambient', 'task', 'accent'].filter(k => r.lights?.[k]).join(', ') || '—'}</td></tr>`).join('')}</table>
  <h2>Light &amp; ventilation</h2><ul>${sp.map(x => `<li><b>${esc(x.r.name)}</b>: ${x.L.rating} daylight (window/floor ${Math.round(x.L.wfr * 100)}%), ${x.L.vent.toLowerCase()}.${x.L.sugg[0] ? ' ' + esc(x.L.sugg[0]) : ''}</li>`).join('')}</ul>
  <h2>Architectural checks</h2><ul>${checks.map(ch => `<li><b>${esc(ch.t)}</b> — ${esc(ch.d)}</li>`).join('')}</ul>
  <h2>Recommendations</h2><ul>${recs.map(r => `<li>${esc(r)}</li>`).join('') || '<li>The layout is well balanced.</li>'}</ul>
  <p class="note" style="margin-top:30px">Cost figures are illustrative estimates for Indian metro markets, not market quotations. Structural observations are indicative only — consult a licensed architect or structural engineer before construction.</p></div>`;
  $('#report').innerHTML = html; $('#report').classList.add('on'); $('#report').scrollTop = 0;
  if (aiOn()) { const el = document.getElementById(summaryId); el.innerHTML = esc(localSum) + ` <span class="note">(${esc(modelLabel())} is writing a sharper summary…)</span>`;
    try { const j = await API.req('/api/report-summary', { body: { facts: localSum + ' Recommendations: ' + recs.join(' '), room_facts: rooms.map(r => roomFacts(r).line).join(' | ') }, timeout: 90000 }); el.textContent = (j.summary || localSum).trim(); } catch (e) { el.textContent = localSum; } }
}

/* ---------- action dispatcher ---------- */
const ACT = {
  'go-landing': () => show('landing'), 'go-dash': () => { if (S.touring) stopTour(); show('dash'); }, scroll: el => document.getElementById(el.dataset.to)?.scrollIntoView({ behavior: 'smooth' }),
  start: () => { if (!S.prefs.onboarded) { show('dash'); openOnboarding(); } else show('dash'); },
  onboard: () => openOnboarding(), settings: () => openSettings(), 'modal-close': () => { $('#modal').classList.remove('on'); $('#modal-card').classList.remove('wide'); },
  sample: () => { sampleHome(); P().theme = S.prefs.style; S.history = []; S.future = []; S.variants = []; S.structuralLog = []; furnishAll(); S.original = deep(S.project); openWorkspace(true); },
  'new-upload': () => { show('upload'); resetUpload(); }, 'pick-file': () => $('#file-in').click(),
  'sample-plan': () => { const keep = S.project; sampleHome(); const { url, widthM } = drawPlanImage(S.project); S.project = keep; runDetection(url, { widthM, name: 'Sample Plan — 2BHK' }); },
  'sample-duplex': async () => { const keep = S.project; const sp = sampleDuplex(); S.project = keep; const { url, widthM } = await withProject(sp, () => drawSheetImage(sp)); runDetection(url, { widthM, name: 'Sample Duplex — G+1', floors: 0 }); },
  'det-floor': el => { detectRes.cur = +el.dataset.i; P().activeFloor = detectRes.cur; DET.sel = null; renderDetection(); },
  'det-floor-move': el => detMoveFloor(+el.dataset.d),
  'det-floor-add': () => detAddFloor(),
  'det-tool': el => { detSetTool(el.dataset.t); renderDetection(); }, 'det-del': () => { if (DET.sel) detDelete(); else toast('Select a room, door or window first'); },
  'det-del-room': el => detDelete({ kind: 'room', id: el.dataset.id }),
  generate: () => generate3D(),
  'make-real': () => makeReal(),
  showcase: () => openShowcase(), 'sc-photos-all': () => scMakeAll(), 'sc-close': () => SC.viewer ? (location.href = './') : closeShowcase(), 'sc-go': el => scGo(+el.dataset.i), 'sc-share': () => scShare(), 'sc-photo': () => scPhoto(),
  'sc-visit': () => { const n = SC.proj ? SC.proj.name : 'this home'; location.href = `mailto:${SITE_CONFIG.contactEmail}?subject=${encodeURIComponent('Site visit: ' + n)}&body=${encodeURIComponent('Hi, I would like to visit ' + n + '. My phone number: ')}`; },
  summary: () => openSummary(), ideas: () => openIdeas(), 'ideas-go': () => ideasGo(), 'idea-apply': el => applyIdea(+el.dataset.i),
  'export-glb': () => { try { const r = exportGLB(); download(r.blob, fileSafe(P().name) + '.glb'); toast(`3D model saved (${r.nodes} parts, ${(r.bytes / 1048576).toFixed(1)} MB) — opens in Blender, SketchUp or any glTF viewer.`, 4500); } catch (e) { toast('GLB export failed: ' + e.message); } },
  'export-pdf': () => exportPDF().catch(e => toast('PDF export failed: ' + e.message)), 'share-link': () => shareLink(),
  'open-proj': async el => { const id = el.dataset.id; let p = store.get('proj_' + id); const c = (CLOUD.list || []).find(x => x.id === id);
    if (isCloud() && c && (!p || c.updated > (p.updated || 0))) { toast('Opening from your account…'); try { p = await cloudFetch(id); store.set('proj_' + id, p); } catch (e) { if (!p) return toast('Could not open: ' + e.message, 4000); } }
    if (!p) return toast('Project not found'); S.project = p; S.history = []; S.future = []; S.variants = []; S.original = deep(p); S.structuralLog = []; openWorkspace(false); },
  'del-proj': async (el, e) => { e.stopPropagation(); const id = el.dataset.id; if (!confirmDel(id)) return; clearTimeout(CLOUD.timers.get(id)); CLOUD.timers.delete(id); if (S.project && S.project.id === id) S.project = null;
    try { localStorage.removeItem('dimora_proj_' + id); } catch (x) { } store.set('projects', store.get('projects', []).filter(p => p.id !== id));
    if (isCloud()) { try { await cloudDel(id); } catch (x) { toast('Removed here, but the copy in your account could not be deleted: ' + x.message, 5000); } CLOUD.list = (CLOUD.list || []).filter(p => p.id !== id); }
    renderDash(); },
  'ob-set': el => { ob.p[el.dataset.k] = el.dataset.v; renderOnboarding(); }, 'ob-color': el => { const c = el.dataset.c, a = ob.p.colors; const i = a.indexOf(c); if (i >= 0) a.splice(i, 1); else { a.push(c); if (a.length > 3) a.shift(); } renderOnboarding(); },
  'ob-back': () => { ob.step--; renderOnboarding(); }, 'ob-next': () => { if (ob.step < 2) { ob.step++; renderOnboarding(); } else { ob.p.onboarded = true; setTimeout(cloudSavePrefs, 50); S.prefs = ob.p; store.set('prefs', S.prefs); $('#modal').classList.remove('on'); toast('Preferences saved — DIMORA will design around them'); renderDash(); if (S.project) { refreshSidePanel(); } } },
  'set-save': async () => { readSettingsForm(); const m = $('#set-msg'); m.textContent = 'Checking…'; await API.health(true); $('#set-status').innerHTML = aiStatusHTML(); m.textContent = ''; $('#modal').classList.remove('on'); toast(!S.backendOK ? 'Saved — but the backend is not reachable' : aiOn() ? 'Connected · ' + modelLabel() : 'Backend connected · no AI yet (rule-based engine)', 4500); },
  'set-test': async () => { readSettingsForm(); const m = $('#set-msg'); m.textContent = 'Testing…'; m.style.color = ''; await API.health(true); $('#set-status').innerHTML = aiStatusHTML();
    try { const j = await API.req('/api/ai/test', { body: {}, timeout: 90000 }); m.textContent = j.ok ? `✓ ${j.model} answered in ${(j.ms / 1000).toFixed(1)} s` : `? ${j.model} replied oddly`; m.style.color = j.ok ? '#34d399' : '#fbbf24'; } catch (e) { m.textContent = '✗ ' + e.message.slice(0, 160); m.style.color = '#f9a8d4'; } },
  'clear-data': () => { try { Object.keys(localStorage).filter(k => k.startsWith('dimora_')).forEach(k => localStorage.removeItem(k)); } catch (e) { } location.reload(); },
  view: el => setView(el.dataset.v), preset: el => presetView(el.dataset.v),
  panel: el => { if (S.panel === el.dataset.p && $('#app').classList.contains('side-open') && window.innerWidth < 820) { $('#app').classList.remove('side-open'); return; } openPanel(el.dataset.p); },
  'toggle-chat': () => { $('#app').classList.toggle('chat-open'); if (E) E.dirty = true; if (S.view === '2d') { V2.init = false; render2D(); } },
  undo: () => undo(), redo: () => redo(),
  'flow-ext': () => flowExterior(), 'flow-floor': el => flowFloor(false, el && el.dataset.i != null ? +el.dataset.i : null), 'flow-room': () => flowRoom(), 'flow-back': () => flowFloor(true),
  'toggle-cut': () => { FLOW.step = null; renderFlowNav(); S.cutaway = !S.cutaway; $('#t-cut').classList.toggle('on', S.cutaway); if (S.cutaway && S.roof) { S.roof = false; $('#t-roof').classList.remove('on'); } rebuild(); },
  'toggle-labels': () => { S.labels = !S.labels; $('#t-lab').classList.toggle('on', S.labels); E.dirty = true; },
  'walk-outside': () => setView('walk', { outside: 'garden' }),
  'walk-street': () => setView('walk', { outside: 'street' }),
  'studio-tools': el => {
    const open = $('#app').classList.toggle('studio-tools-open');
    el.setAttribute('aria-expanded', String(open));
  },
  'exterior-stop': el => exteriorStop(el.dataset.stop),
  'rendered-room': () => openRenderedView('room'),
  'exterior-light': el => setHour(+el.dataset.hour),
  'kbd-help': () => toast(S.view === 'walk' ? 'Walk: arrow keys (or W A S D) to move · drag to look around · hold Shift to walk faster' : 'Fly around: W A S D / arrows to glide · Q E to circle · Z X to zoom · T G to tilt · Shift = faster · drag to orbit', 6000),
  'toggle-roof': () => { FLOW.step = null; renderFlowNav(); S.roof = !S.roof; if (S.roof && S.cutaway) { S.cutaway = false; $('#t-cut').classList.remove('on'); } $('#t-roof').classList.toggle('on', S.roof); rebuild(); if (S.view === '3d') fitView(true); },
  'toggle-sun': () => { S.daylightSim = !S.daylightSim; $('#t-sun').classList.toggle('on', S.daylightSim); rebuild(); if (S.daylightSim) toast('Sunlight now enters only through windows & doors — move the time slider'); },
  'play-day': () => { if (S.dayTimer) { clearInterval(S.dayTimer); S.dayTimer = null; return; } if (!S.daylightSim) { S.daylightSim = true; $('#t-sun').classList.add('on'); rebuild(); } let h = 6; S.dayTimer = setInterval(() => { h += 0.08; setHour(h); const lh = $('#lt-h'); if (lh) lh.textContent = fmtHour(h); if (h >= 19.2) { clearInterval(S.dayTimer); S.dayTimer = null; } }, 50); },
  tool: el => setTool(el.dataset.t), overlay: el => { S.overlay = el.dataset.o; $$('[data-act=overlay]').forEach(b => b.classList.toggle('on', b.dataset.o === S.overlay)); render2D(); },
  'overlay-plan': el => { setView('2d'); S.overlay = el.dataset.o; $$('[data-act=overlay]').forEach(b => b.classList.toggle('on', b.dataset.o === S.overlay)); render2D(); },
  'select-room': el => { const r = findRoom(el.dataset.id); if (!r) return; select({ kind: 'room', id: r.id }); if (S.view !== '2d') focusRoom(r); refreshSidePanel(); },
  'select-item': el => { select({ kind: 'item', id: el.dataset.id }); }, 'select-door': el => { setView('2d'); select({ kind: 'door', id: el.dataset.id }); },
  deselect: () => select(null), 'focus-room': () => { const r = selRoom(); if (r) focusRoom(r); },
  'ask-room': () => { const r = selRoom(); $('#app').classList.add('chat-open'); $('#chat-input').value = r ? `Make ${r.name} ` : ''; $('#chat-input').focus(); },
  facade: el => { commit('Exterior style'); P().facade = el.dataset.k; P().exterior = null; rebuild(); save(true); refreshSidePanel(); toast(`${FACADES[el.dataset.k].label}: ${FACADES[el.dataset.k].desc}`); },
  'ext-color': el => { commit('Exterior colour'); P().exterior = el.dataset.c || null; rebuild(); save(true); refreshSidePanel(); },
  theme: el => { commit('Theme'); applyTheme(el.dataset.t); rebuild(); save(true); toast(`${el.dataset.t}: ${THEMES[el.dataset.t].desc}`); },
  'furnish-all': el => { commit('Furnish all'); S.project.floors.forEach(f => f.rooms.forEach(r => autoFurnish(r, f, el.dataset.v ? 1 + Math.floor(Math.random() * 3) : 0))); rebuild(); save(); toast('Furnished every room with clearances respected'); },
  'furnish-room': el => { const r = selRoom(); if (!r) return; commit('Furnish'); autoFurnish(r, floorOfRoom(r), el.dataset.v ? 1 + Math.floor(Math.random() * 3) : 0); rebuild(); save(); toast(`${el.dataset.v ? 'New arrangement for' : 'Furnished'} ${r.name}`); },
  'clear-room': () => { const r = selRoom(); if (!r) return; commit('Clear'); r.furniture = []; rebuild(); save(); },
  wall: el => { const r = selRoom(); if (!r) return; commit('Paint'); r.wall = el.dataset.c; rebuild(); save(); },
  floor: el => { const r = selRoom(); if (!r) return; commit('Floor'); r.floor = el.dataset.k; rebuild(); save(); },
  ceiling: el => { const r = selRoom(); if (!r) return; commit('Ceiling'); r.ceiling = el.dataset.k; rebuild(); save(); toast('Ceilings are visible from inside — try Walk mode'); },
  'time-eve': () => setHour(20),
  cat: el => { S.cat = el.dataset.c; refreshSidePanel(); },
  'add-item': el => { const r = selRoom(); const t = el.dataset.t; if (!r) { if (S.view !== '2d') setView('2d'); setTool('place', t); return; } const res = execActions([{ do: 'add', room: r.id, item: t }], r); toast(res.done[0] || res.fail[0] || 'Could not place'); refreshSidePanel(); },
  'del-item': el => { const f = findItem(el.dataset.id); if (!f) return; commit('Delete'); f.room.furniture.splice(f.room.furniture.indexOf(f.it), 1); rebuild(); save(); },
  rot: el => rotateSelected(+el.dataset.d), del: () => deleteSelected(),
  dup: () => { const f = S.sel && findItem(S.sel.id); if (!f) return; commit('Duplicate'); const it = deep(f.it); it.id = uid('i'); it.x = r2(it.x + 0.3); it.y = r2(it.y + 0.3); f.room.furniture.push(it); S.sel = { kind: 'item', id: it.id }; rebuild(); renderInspector(); save(); },
  'it-color-reset': () => { const f = S.sel && findItem(S.sel.id); if (!f) return; commit('Colour'); f.it.color = null; rebuild(); renderInspector(); },
  corner: el => { const r = selRoom(); if (!r) return; const a = analyzeSpace(r); if (!a.corner) return; commit('Use corner'); const k = el.dataset.k; const f = floorOfRoom(r); const cc = [a.corner.x + a.corner.w / 2, a.corner.y + a.corner.d / 2];
    const sides = [a.corner.cy ? 'S' : 'N', a.corner.cx ? 'E' : 'W']; const tAlong = s => s === 'N' || s === 'S' ? cc[0] : cc[1];
    const wallPlace = (type) => { for (const s of sides) { const it = placeOnWall(r, f, type, s, { align: 'near', t0: tAlong(s) }); if (it && rectOverlap(itemFootprint(it), { x: a.corner.x - 0.3, y: a.corner.y - 0.3, w: a.corner.w + 0.6, d: a.corner.d + 0.6 }) > 0.05) { r.furniture.push(it); return it; } } const it = placeFree(r, f, type, { near: cc }); if (it) r.furniture.push(it); return it; };
    if (k === 'study') { const d = wallPlace('desk'); if (d) addChairFor(r, f, d); } else if (k === 'reading') { const ac = placeFree(r, f, 'armchair', { near: cc }); if (ac) { r.furniture.push(ac); const l = placeFree(r, f, 'floor_lamp', { near: cc }); if (l) r.furniture.push(l); } wallPlace('bookshelf'); } else { wallPlace('storage_cabinet'); wallPlace('bookshelf'); }
    rebuild(); save(); toast(`Converted the unused corner into a ${k === 'study' ? 'study corner' : k === 'reading' ? 'reading nook' : 'storage zone'}`); },
  transform: async el => { const r = selRoom(); if (!r || !ROOM_TYPES[el.dataset.t]) return; const cam = roomCam(r); let before = ''; try { before = renderWith(S.project, cam.pos, cam.target); } catch (e) { } const c0 = roomCost(r).total, from = r.type; commit('Transform'); const res = transformRoom(r, el.dataset.t); rebuild(); let after = ''; try { after = renderWith(S.project, cam.pos, cam.target); } catch (e) { } S.lastTransform = { room: r.id, before, after, from, to: el.dataset.t, c0, c1: res.after }; if (S.panel !== 'transform') openPanel('transform'); else refreshSidePanel(); save(); toast(`${ROOM_TYPES[from].label} → ${ROOM_TYPES[el.dataset.t].label}`); focusRoom(r); },
  'fit-check': () => { const r = selRoom(); if (!r) return; const t = $('#fit-type').value; S.fitType = t; const w = +$('#fit-w').value || null, d = +$('#fit-d').value || null; const res = fitCheck(t, r, floorOfRoom(r), w || d ? { w: w || CATALOG[t].w, d: d || CATALOG[t].d } : null); S.fitRes = res; S.fitOut = `<div class="issue ${res.ok ? 'ok' : ''}" style="margin-top:8px">${esc(res.msg)}</div>${res.ok ? '<button class="btn sm primary" data-act="fit-place">Place it there</button>' : ''}`; refreshSidePanel(); },
  'fit-place': () => { const r = selRoom(); if (!r || !S.fitRes?.item) return; commit('Place'); r.furniture.push(S.fitRes.item); S.fitOut = ''; S.fitRes = null; rebuild(); save(); },
  'optimize-all': () => { commit('Optimise'); S.lastOptimize = optimizeBudget(allRooms(), S.prefs.budget); rebuild(); save(); toast(S.lastOptimize.ok ? 'Design now fits your budget' : 'Got as close as possible'); },
  optimize: () => { const id = $('#opt-room').value, amt = +$('#opt-amt').value; if (!amt) return; commit('Optimise'); const rs = id === 'all' ? allRooms() : [findRoom(id)]; S.lastOptimize = optimizeBudget(rs, amt); rebuild(); save(); toast(S.lastOptimize.ok ? `Done — ${inr(S.lastOptimize.end)}` : `Closest possible: ${inr(S.lastOptimize.end)}`); },
  alt: el => { const r = selRoom(); if (!r) return; const a = cheaperAlternatives(r)[+el.dataset.i]; if (!a) return; commit('Cheaper'); a.apply(); rebuild(); save(); toast(`Saved ${inr(a.save)}`); },
  'set-tier-all': el => { commit('Tier'); const t = el.dataset.t; allRooms().forEach(r => { r.tier = t; r.furniture.forEach(i => i.tier = t); }); rebuild(); save(); },
  'add-window-sugg': () => { const r = selRoom(); if (!r) return; const L = analyzeLight(r); if (!L.suggestWindow) return; commit('Window'); floorOfRoom(r).windows.push(Object.assign({ id: uid('w') }, L.suggestWindow.w)); rebuild(); save(); toast(`Added a ${L.suggestWindow.compass}-facing window to ${r.name}`); },
  fix: el => { commit('Fix'); if (el.dataset.k === 'snap') snapRooms(FL(), 0.3); else autoOpenings(FL(), { windows: false }); rebuild(); save(); toast('Plan corrected'); },
  'floor-switch': el => { const i = +el.dataset.i, pj = P(); const prev = pj.floors[pj.activeFloor]; pj.activeFloor = i; S.showAllFloors = false; S.explode = false; S.sel = null; rebuild(); renderFloorSeg(); refreshSidePanel();
    if (CTL && CTL.mode === 'walk') { const f = pj.floors[i]; const st = (floorBelow(f) === prev ? stairsBelow(f)[0] : null) || (f.stairs || [])[0]; const r = st ? roomAt(...stairEnd(st, floorBelow(f) === prev ? 'high' : 'low', 0.6), f) : null; const sh = roomShot(r || connectivity(f).start || f.rooms[0]); CTL.flyTo(sh.pos, sh.target, 1.2, { mode: 'walk' }); toast(`Walking on the ${f.name}`); }
    else if (S.view !== '2d') fitView(true); },
  'floor-all': () => { S.showAllFloors = !S.showAllFloors; if (!S.showAllFloors) S.explode = false; rebuild(); renderFloorSeg(); fitView(true); },
  'floor-explode': () => { S.explode = !S.explode; if (S.explode) S.showAllFloors = true; rebuild(); renderFloorSeg(); fitView(true); },
  'add-floor': () => { commit('Add floor'); const pj = P(); const top = pj.floors[pj.floors.length - 1]; const nf = newFloor(floorName(pj.floors.length), top.level + 1); nf.height = top.height;
    const map = {}; top.rooms.filter(r => !isYard(r)).forEach(r => { const nr = makeRoom({ name: r.name.replace(/\d+$/, '') + (r.type === 'living' ? ' (Upper)' : ''), type: r.type === 'living' ? 'living' : r.type, x: r.x, y: r.y, w: r.w, d: r.d }); map[r.id] = nr; nf.rooms.push(nr); });
    nf.doors = top.doors.filter(d => !d.main).map(d => Object.assign({}, d, { id: uid('d') })); nf.windows = top.windows.map(w => Object.assign({}, w, { id: uid('w') }));
    pj.floors.push(nf); top.stairs = []; placeStairs(top, nf); pj.floors.pop();
    const hub = top.stairs && top.stairs.length ? null : (top.rooms.find(r => r.type === 'living') || top.rooms.filter(r => !isYard(r)).sort((a, b) => area(b) - area(a))[0]); // automatic placement failed: put a flight in the main room
    if (hub) { const vert = hub.d >= hub.w; const st = { id: uid('s'), w: vert ? 1.0 : 3.0, d: vert ? 3.0 : 1.0, x: hub.x + hub.w - (vert ? 0.6 : 1.7), y: hub.y + hub.d - (vert ? 1.7 : 0.6) }; if (!vert) { st.w = 1.0; st.d = 3.0; st.x = hub.x + 0.6; st.y = clamp(hub.y + hub.d / 2, hub.y + 1.5, hub.y + hub.d - 1.5); } top.stairs = [st]; }
    pj.floors.push(nf); nf.rooms.forEach(r => autoFurnish(r, nf)); clearStairFurniture(); pj.activeFloor = pj.floors.length - 1; S.showAllFloors = false; rebuild(); renderFloorSeg(); refreshSidePanel(); fitView(true); save(); toast(`${nf.name} added with a staircase`); },
  'save-variant': () => { if (!E) return; const name = ($('#var-name') && $('#var-name').value) || `Design ${S.variants.length + 1}`; const hc = homeCam(); const thumb = renderWith(S.project, hc.pos, hc.target, 300, 190); const c = homeCost(); const rooms = allRooms(); S.variants.push({ name, thumb, project: deep(S.project), cost: c.total, furniture: c.furniture, theme: P().theme, pieces: rooms.reduce((s, r) => s + r.furniture.length, 0), space: Math.round(rooms.reduce((s, r) => s + analyzeSpace(r).score, 0) / rooms.length), light: Math.round(rooms.reduce((s, r) => s + analyzeLight(r).score, 0) / rooms.length), cmp: S.variants.filter(v => v.cmp).length < 3 }); toast(`Saved “${name}”`); openPanel('compare'); },
  'var-restore': el => { commit('Restore'); S.project = deep(S.variants[+el.dataset.i].project); S.sel = null; rebuild(); save(); toast('Variant restored'); },
  'before-after': () => { if (!S.original) return; const hc = homeCam(); const a = renderWith(S.original, hc.pos, hc.target, 640, 400), b = renderWith(S.project, hc.pos, hc.target, 640, 400); const c0 = (() => { const sv = S.project; S.project = S.original; const v = homeCost().total; S.project = sv; return v; })(); S.baHTML = `<div class="cmp" style="margin-top:8px"><img src="${b}"><div class="after" id="ba-after"><img src="${a}" style="width:${$('#side').clientWidth - 32}px"></div><span class="lb" style="left:8px">Original · ${inr(c0)}</span><span class="lb" style="right:8px">Current · ${inr(homeCost().total)}</span><input type="range" min="0" max="100" value="50" data-act-input="ba-slide"></div>`; refreshSidePanel(); },
  'multi-theme': () => { const r = selRoom(); if (!r) return; const cam = roomCam(r); const cur = r.theme || P().theme; const picks = [cur, ...Object.keys(THEMES).filter(t => t !== cur).sort(() => Math.random() - 0.5).slice(0, 2)]; const out = picks.map(t => { const pj = deep(S.project); const saved = S.project; S.project = pj; const rr = findRoom(r.id); applyTheme(t, [rr]); const cost = roomCost(rr).total; S.project = saved; return { t, img: renderWith(pj, cam.pos, cam.target, 300, 200), cost }; }); S.mtHTML = out.map(o => `<div class="card"><img src="${o.img}" style="width:100%;border-radius:8px"><div class="row" style="justify-content:space-between;margin-top:6px"><b>${o.t}</b><span class="muted">${inr(o.cost)}</span><button class="btn sm ghost" data-act="room-theme-apply" data-t="${o.t}">Apply</button></div></div>`).join(''); refreshSidePanel(); },
  'room-theme-apply': el => { const r = selRoom(); if (!r) return; commit('Room theme'); applyTheme(el.dataset.t, [r]); rebuild(); save(); },
  'pick-insp': () => $('#insp-in').click(), 'apply-insp': () => { const x = S.insp; if (!x) return; commit('Inspiration'); const r = selRoom(); const rooms = r ? [r] : allRooms(); if (r) applyTheme(x.style, [r]); else applyTheme(x.style); rooms.forEach(rr => { if (!['bathroom', 'utility'].includes(rr.type)) rr.wall = x.wall; if (x.floor && !['bathroom', 'utility', 'balcony'].includes(rr.type)) rr.floor = x.floor; if (x.finish) rr.furniture.forEach(i => i.finish = x.finish); }); rebuild(); save(); toast(`Recreated the ${x.style} look`); },
  report: () => openReport(), 'rep-close': () => $('#report').classList.remove('on'),
  'rep-print': () => { try { window.print(); } catch (e) { toast('Printing is blocked here — use Download HTML'); } },
  'rep-download': () => { const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(P().name)} — DIMORA report</title><style>body{font-family:Manrope,Arial,sans-serif;background:#eee;margin:0}.rep{max-width:900px;margin:20px auto;background:#fff;padding:48px;line-height:1.55;color:#2c2924}h1,h2{font-family:Georgia,serif}table{width:100%;border-collapse:collapse;font-size:12.5px}th{text-align:left;background:#f3eee5;padding:7px}td{padding:7px;border-bottom:1px solid #ece6db}.r{text-align:right}img{max-width:100%}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.kpis div{background:#f6f1e8;padding:12px;border-radius:8px}.kpis b{display:block;font-size:20px}.sw{display:inline-block;width:14px;height:14px;border-radius:4px}.note{font-size:11.5px;color:#6b6356}</style></head><body>${$('#rep-doc').outerHTML}</body></html>`; try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([doc], { type: 'text/html' })); a.download = P().name.replace(/\W+/g, '_') + '_DIMORA_report.html'; document.body.appendChild(a); a.click(); a.remove(); toast('Report downloaded'); } catch (e) { toast('Download blocked here — use Copy summary'); } },
  'rep-copy': () => { const t = $('#rep-doc').innerText; navigator.clipboard?.writeText(t).then(() => toast('Report text copied'), () => toast('Clipboard blocked')); },
  tour: () => { if (S.touring) stopTour(); else startTour(); }, 'tour-stop': () => stopTour(), 'tour-play': () => tourTogglePause(), 'tour-next': () => tourJump(1), 'tour-prev': () => tourJump(-1), 'tour-go': el => tourGo(+el.dataset.i),
  'tour-voice': () => { TOUR.voice = !TOUR.voice; if (!TOUR.voice) stopSpeech(); renderTourUI(); },
  'tour-wall': el => tourApply([{ do: 'wall_color', room: tourRoom()?.id, color: el.dataset.c, name: el.dataset.n }], `Done — ${tourRoom()?.name} is now ${el.dataset.n}. ${['Lovely choice', 'That really opens it up', 'Much calmer'][Math.floor(Math.random() * 3)]}!`),
  'tour-theme': el => tourApply([{ do: 'theme', name: el.dataset.t, room: tourRoom()?.id }]),
  'tour-transform': el => tourApply([{ do: 'transform', room: tourRoom()?.id, to: el.dataset.t }]),
  'tour-refurnish': () => tourApply([{ do: 'furnish', room: tourRoom()?.id, variant: 1 + Math.floor(Math.random() * 3) }]),
  'tour-budget': () => { const r = tourRoom(); if (!r) return; tourApply([{ do: 'budget', room: r.id, amount: Math.round(roomCost(r).total * 0.7) }]); },
  'chat-sugg': el => sendChat(el.dataset.t),
  'chat-paint': el => { const r = findRoom(el.dataset.r); if (!r) return; commit('Paint'); r.wall = el.dataset.c; rebuild(); save(); addChat('aria', `Painted ${r.name} ${el.dataset.n}.`); },
  'det-noop': () => { },
};
const CHANGE = {
  'rename-project': el => { P().name = el.value || 'My Home'; save(); },
  'det-name': el => { const r = findRoom(el.dataset.id); if (r) { r.name = el.value; renderDetection(); } }, 'det-type': el => { const r = findRoom(el.dataset.id); if (r) { r.type = el.value; renderDetection(); } },
  'ob-num': el => { ob.p[el.dataset.k] = clamp(+el.value || 1, 1, 15); }, 'ob-sel': el => { ob.p[el.dataset.k] = el.value; }, 'ob-chk': el => { ob.p[el.dataset.k] = el.checked; },
  gfx: el => { try { localStorage.setItem('dimora_gfx', el.value); } catch (e) { } [E, HERO.E, HERO.G].forEach(x => x && x.setQuality(el.value)); toast('3D quality: ' + el.value); },
  wallpaper: el => { const r = selRoom(); if (!r) return; commit('Wallpaper'); r.wallpaper = el.checked; rebuild(); },
  'light-tog': el => { const r = selRoom(); if (!r) return; commit('Lights'); r.lights[el.dataset.k] = el.checked; rebuild(); save(); },
  curtains: el => { const r = selRoom(); if (!r) return; commit('Curtains'); r.curtains = el.checked; rebuild(); save(); },
  finish: el => { const r = selRoom(); if (!r) return; commit('Finish'); r.furniture.forEach(i => i.finish = el.value || null); rebuild(); save(); },
  tier: el => { const r = selRoom(); if (!r) return; commit('Tier'); r.tier = el.value; r.furniture.forEach(i => i.tier = el.value); rebuild(); save(); },
  'room-theme': el => { const r = selRoom(); if (!r) return; commit('Room theme'); applyTheme(el.value || P().theme, [r]); if (!el.value) r.theme = null; rebuild(); save(); },
  budget: el => { S.prefs.budget = Math.max(10000, +el.value || S.prefs.budget); store.set('prefs', S.prefs); refreshSidePanel(); },
  daylight: el => { S.daylightSim = el.checked; $('#t-sun').classList.toggle('on', S.daylightSim); rebuild(); },
  'all-floors': el => { S.showAllFloors = el.checked; rebuild(); renderFloorSeg(); },
  'det-floor-name': el => { const f = P().floors[detectRes.cur]; if (f) { f.name = el.value.trim().slice(0, 24) || f.name; renderDetection(); } },
  'floor-h': el => { commit('Height'); FL().height = clamp(+el.value || 2.9, 2.4, 4.5); rebuild(); save(); },
  'var-cmp': el => { S.variants[+el.dataset.i].cmp = el.checked; refreshSidePanel(); },
  'it-dim': el => { const f = S.sel && findItem(S.sel.id); if (!f) return; commit('Resize'); f.it[el.dataset.k] = clamp(+el.value || 0.3, 0.2, 6); rebuild(); save(); },
  'it-tier': el => { const f = S.sel && findItem(S.sel.id); if (!f) return; commit('Tier'); f.it.tier = el.value; rebuild(); renderInspector(); save(); },
  'it-finish': el => { const f = S.sel && findItem(S.sel.id); if (!f) return; commit('Finish'); f.it.finish = el.value || null; rebuild(); save(); },
  'r-name': el => { const r = selRoom(); if (!r) return; commit('Rename'); r.name = el.value; rebuild(); save(); },
  'r-type': el => { const r = selRoom(); if (!r) return; commit('Type'); r.type = el.value; rebuild(); renderInspector(); save(); toast('Type changed — press Furnish to re-plan furniture'); },
  'r-dim': el => { const r = selRoom(); if (!r) return; const v = clamp(snap(+el.value || 1), 0.8, 30); const ext = el.dataset.k === 'w' ? isExteriorPoint(floorOfRoom(r), 'v', r.x + r.w, r.y + r.d / 2) : isExteriorPoint(floorOfRoom(r), 'h', r.y + r.d, r.x + r.w / 2); commit('Resize'); const lim = resizeRoomTo(r, el.dataset.k === 'w' ? r2(v) : null, el.dataset.k === 'd' ? r2(v) : null); if (lim) toast(`${r.name} stopped at ${r.w} × ${r.d} m — any bigger would overlap ${lim.name}.`, 4200); if (ext) { S.structuralLog.push(`${r.name}: outer wall moved via dimension edit — external walls are usually load-bearing; get a structural review.`); toast('⚠️ Outer wall moved — flagged for structural review', 3800); } rebuild(); renderInspector(); save(); },
  'r-floor': el => { const r = selRoom(); if (!r) return; commit('Floor'); r.floor = el.value; rebuild(); save(); },
  'op-w': el => { const f = FL(); const o = [...f.doors, ...f.windows].find(x => x.id === S.sel?.id); if (!o) return; commit('Opening'); o.w = clamp(+el.value || 0.9, 0.5, 4); rebuild(); save(); },
  'op-k': el => { const o = FL().windows.find(x => x.id === S.sel?.id); if (!o) return; commit('Window'); o[el.dataset.k] = clamp(+el.value || 0.5, 0, 2.6); rebuild(); save(); },
  'op-main': el => { const o = FL().doors.find(x => x.id === S.sel?.id); if (!o) return; commit('Main'); FL().doors.forEach(d => d.main = false); o.main = el.checked; rebuild(); save(); },
  'tour-floor': el => tourApply([{ do: 'floor', room: tourRoom()?.id, material: el.value }]),
};
const INPUT = {
  'ext-custom': el => { if (!S._painting) { commit('Exterior colour'); S._painting = true; setTimeout(() => S._painting = false, 1200); } P().exterior = el.value; rebuild(); save(); },
  'wall-custom': el => { const r = selRoom(); if (!r) return; if (!S._painting) { commit('Paint'); S._painting = true; setTimeout(() => S._painting = false, 1200); } r.wall = el.value; rebuild(); save(); },
  'it-color': el => { const f = S.sel && findItem(S.sel.id); if (!f) return; if (!S._painting) { commit('Colour'); S._painting = true; setTimeout(() => S._painting = false, 1200); } f.it.color = el.value; rebuild(); save(); },
  hour: el => { setHour(+el.value); const l = $('#lt-h'); if (l) l.textContent = fmtHour(+el.value); },
  north: el => { P().north = +el.value; applyEnv(); if (S.view === '2d') render2D(); const lbl = el.closest('label'); if (lbl) lbl.firstChild.textContent = `Plan orientation — where is North? (${el.value}° from plan-up)`; },
  'ob-budget': el => { ob.p.budget = +el.value; const b = el.closest('label').querySelector('b'); if (b) b.textContent = inr(ob.p.budget); },
  'ba-slide': el => { const a = $('#ba-after'); if (a) a.style.width = el.value + '%'; },
  'tour-wall-custom': el => { clearTimeout(S._tw); S._tw = setTimeout(() => tourApply([{ do: 'wall_color', room: tourRoom()?.id, color: el.value, name: 'your custom colour' }]), 400); },
};

/* ---------- installable app (PWA) ---------- */
const PWA = { prompt: null };
function initPWA() {
  const ok = 'serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/claude|claudeusercontent/.test(location.hostname);
  if (ok && !PRIVATE_HOST) navigator.serviceWorker.register('sw.js').catch(e => console.warn('service worker', e));
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  const showBtns = on => $$('.install-btn').forEach(b => { b.hidden = !on; });
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.prompt = e; showBtns(true); });
  window.addEventListener('appinstalled', () => { PWA.prompt = null; showBtns(false); toast('DIMORA is installed — open it from your home screen or apps'); });
  if (ok && !PRIVATE_HOST && ios && !standalone) { PWA.ios = true; showBtns(true); }
  // app shortcuts: ?go=upload opens the floor-plan upload
  const go = new URLSearchParams(location.search).get('go'); if (go === 'upload') setTimeout(() => { if (currentUser()?.answers?.done) { show('upload'); resetUpload(); } }, 400);
}
ACT['install-app'] = async () => {
  if (PWA.prompt) { PWA.prompt.prompt(); const r = await PWA.prompt.userChoice.catch(() => null); PWA.prompt = null; if (r && r.outcome === 'accepted') $$('.install-btn').forEach(b => { b.hidden = true; }); return; }
  if (PWA.ios) return toast('On iPhone/iPad: tap the Share button, then “Add to Home Screen”.', 6000);
  toast('Use your browser menu → “Install app” (or “Add to Home screen”).', 5000);
};
function boot() {
  S.prefs = Object.assign(S.prefs, store.get('prefs', {})); { const a = store.get('ai', {}); ['backendUrl', 'aiProvider', 'ollamaModel', 'orModel', 'orKey', 'cfModel', 'cfAccount', 'cfToken'].forEach(k => { if (a[k] != null && a[k] !== '') S[k] = a[k]; }); if (S.aiProvider === 'gemini') S.aiProvider = 'cloudflare'; if (!OR_MODELS[S.orModel]) S.orModel = 'qwen/qwen3.5-27b'; } API.health(true);
  document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el) return; if (el.tagName === 'A' && !el.getAttribute('href')?.startsWith('http')) e.preventDefault(); const f = ACT[el.dataset.act]; if (f) { f(el, e); } });
  document.addEventListener('change', e => { const el = e.target.closest('[data-act-change]'); if (el && CHANGE[el.dataset.actChange]) CHANGE[el.dataset.actChange](el, e); });
  document.addEventListener('input', e => { const el = e.target.closest('[data-act-input]'); if (el && INPUT[el.dataset.actInput]) INPUT[el.dataset.actInput](el, e); });
  document.addEventListener('submit', e => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); if (f.dataset.form === 'chat') { const i = $('#chat-input'); const t = i.value; i.value = ''; sendChat(t); } if (f.dataset.form === 'tour-ask') { const i = $('#tour-ask-in'); const t = i.value; i.value = ''; if (t.trim()) tourAsk(t); } });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').classList.remove('on'); });
  $('#time-slider').addEventListener('input', e => setHour(+e.target.value));
  initDetEditor();
  const takeFiles = async files => { if (!files || !files.length) return; try { await API.health(); if (S.backendOK) { const nm0 = files.length === 1 ? files[0].name.replace(/\.\w+$/, '').replace(/[_-]+/g, ' ').slice(0, 30) : 'My Home'; return runDetection({ files: Array.from(files) }, { name: nm0 || 'My Home' }); } const sheets = await filesToSheets(files); const nm = files.length === 1 ? files[0].name.replace(/\.\w+$/, '').replace(/[_-]+/g, ' ').slice(0, 30) : 'My Home'; runDetection(sheets.length === 1 ? sheets[0].url : sheets, { name: nm || 'My Home' }); } catch (err) { toast('Could not read file: ' + err.message, 4500); } };
  $('#file-in').addEventListener('change', e => takeFiles(e.target.files));
  const dz = $('.drop-in'); ['dragenter', 'dragover'].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.add('over'); })); ['dragleave', 'drop'].forEach(t => dz.addEventListener(t, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => takeFiles(e.dataTransfer.files));
  document.addEventListener('change', async e => { if (e.target.id !== 'insp-in') return; const f = e.target.files[0]; if (!f) return; const url = await fileToImageURL(f); $('#insp-out').innerHTML = '<p class="muted">Analysing style…</p>'; try { const x = await analyzeInspiration(url); x.url = await shrinkImage(url, 200); S.insp = x; $('#insp-out').innerHTML = inspHTML(x); } catch (err) { $('#insp-out').innerHTML = `<p class="muted">${esc(err.message)}</p>`; } });
  try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => { }; } catch (e) { }
  updateAIBadge(); initPWA();
  if (store.get('g_redirect', 0)) { store.set('g_redirect', 0); initFirebase().then(fb => fb && fb.getRedirectResult()).then(r => { if (r && r.user) finishGoogleSignIn(r.user); }).catch(e => { AUTH.err = fbErr(e); show('login'); renderAuth(); }); }
  else if (currentUser()?.method === 'google') restoreGoogleSession();
  if (CLOUD.token && currentUser()?.method === 'cloud') API.req('/api/auth/me', { timeout: 10000 }).then(j => { const u = store.get('user', null); if (u && j.user) { u.name = j.user.name || u.name; if (j.user.prefs && j.user.prefs.answers) u.answers = j.user.prefs.answers; store.set('user', u); updateUserChips(); } setSyncChip('ok'); }).catch(() => { });
  { const q = new URLSearchParams(location.search), vid = q.get('view'), sid = q.get('show'); if (vid) setTimeout(() => openShared(vid), 50); if (sid) setTimeout(() => openSharedShowcase(sid), 50); } // view-only share links
  window.DIMORA = { ACT, CHANGE, CLOUD, isCloud, openWorkspace, S, E: () => E, CTL: () => CTL, rebuild, askAria, localParse, analyzeSpace, analyzeLight, homeCost, archChecks, sampleHome, startTour, stopTour, setView, TOUR, show, resetUpload, execActions, floorY, stairEnd, stairFoot, sampleDuplex, FLOW, flowExterior, flowFloor, flowRoom, livingShot, stageLiving, tourOrder, drawPlanImage, withProject, renderAuth, save, transformRoom, _fs: { fsPut, fsGet, fsDel, fsList }, edgePlan, applyEdge, resizeRoomTo, fitStairs, stairWallCross, overlapping, tidyRooms, wallLines, walkCollide, openExample, entranceSteps, groundAt, roomSchedule, sunVastu, exportGLB, ideaFallback, applyIdea, openShared, makeReal, openShowcase, closeShowcase, SC, scGo, startExample, findRoom, itemFootprint, siteRect, houseBounds, homeBounds, fitView, applyEnv };
}

/* ===================== LOGIN PORTAL (Gmail) & INTRO QUESTIONS ===================== */
/*
  REAL GOOGLE SIGN-IN (optional): paste your Firebase web-app config below to switch from Gmail-address
  sign-in to a verified "Continue with Google" button.
  Firebase Console → Authentication → Sign-in method: enable "Google".
  Authentication → Settings → Authorized domains: add the domain you serve DIMORA from (e.g. localhost).
  Serve the file over http(s) (e.g. `npx serve .`) — Google sign-in does not work from file://.
*/
const AUTH_CONFIG = {
  // Firebase project "dimora-e5001". This web config is public by design (it identifies the project, it is not a
  // secret); access to data is controlled by Firestore security rules — see firestore.rules.
  firebase: {
    apiKey: 'AIzaSyBqRXlbVf2jD4XBcsTIqvd8BcoXyJTkdxg',
    authDomain: 'dimora-e5001.firebaseapp.com',
    projectId: 'dimora-e5001',
    storageBucket: 'dimora-e5001.firebasestorage.app',
    messagingSenderId: '284954477705',
    appId: '1:284954477705:web:32e57bb7d180dd8e8ff258',
  },
};
const FB_VER = '10.12.2';
const AUTH = { email: '', name: '', err: '', fb: null, guser: null, busy: false };
const isGmail = e => /^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i.test(String(e).trim());
function currentUser() { const u = store.get('user', null); return u?.loggedIn ? u : PRIVATE_HOST ? PRIVATE_PROFILE : null; }
function firstName(u) { const n = (u.name || (u.email || 'guest').split('@')[0].replace(/[._\d]+/g, ' ')).trim().split(/\s+/)[0] || 'there'; return n[0].toUpperCase() + n.slice(1); }
function initials(u) { const n = (u.name || (u.email || 'guest').split('@')[0]).replace(/[._\d]+/g, ' ').trim().split(/\s+/); return ((n[0] || '?')[0] + (n[1] ? n[1][0] : '')).toUpperCase(); }
function updateUserChips() { const u = currentUser(); $$('.uchip').forEach(b => { b.textContent = u ? initials(u) : ''; b.title = u ? `${u.name || u.email} · account` : ''; }); }

/* ---------- optional Firebase ---------- */
async function initFirebase() {
  if (!AUTH_CONFIG.firebase || AUTH.fb) return AUTH.fb;
  try {
    if (location.protocol === 'file:') throw new Error('Google sign-in needs http(s) — serve the folder, e.g. `npx serve .`');
    if (!window.firebase || !window.firebase.auth) {
      if (!window.firebase) await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-auth-compat.js`);
    }
    if (!window.firebase.apps.length) window.firebase.initializeApp(AUTH_CONFIG.firebase);
    AUTH.fb = window.firebase.auth();
  } catch (e) { AUTH.err = 'Google sign-in is unavailable right now (' + e.message + ').'; AUTH.fb = null; }
  return AUTH.fb;
}
const fbErr = e => ({ 'auth/too-many-requests': 'Too many attempts — please wait a few minutes.', 'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.', 'auth/cancelled-popup-request': 'Google sign-in was closed before finishing.',
  'auth/unauthorized-domain': `This website (${location.hostname}) isn't on the Firebase project's list of authorised domains yet. Add it under Firebase → Authentication → Settings → Authorized domains.`,
  'auth/network-request-failed': 'No connection to Google — check your internet and try again.', 'auth/operation-not-allowed': 'Google sign-in is not switched on in the Firebase project (Authentication → Sign-in method → Google).' }[e.code] || e.message || 'Something went wrong.');
/* after Google sign-in: restore this person's answers and preferences from Firestore, then carry on */
async function finishGoogleSignIn(fu) {
  FS.user = fu; let prof = null; try { prof = await fsLoadProfile(); } catch (e) { }
  const pr = prof && prof.prefs && prof.prefs.prefs; if (pr) { Object.assign(S.prefs, pr); store.set('prefs', S.prefs); }
  signIn((fu.email || '').toLowerCase(), fu.displayName || (prof && prof.name) || '', 'google', fu.uid, prof && prof.prefs ? prof.prefs.answers || null : undefined);
  if (!prof) cloudSavePrefs();
  syncDeviceProjectsUp();
}
/* a Google user from an earlier visit: Firebase keeps the session in the browser — confirm it is still valid */
async function restoreGoogleSession() {
  const u = currentUser(); if (!u || u.method !== 'google') return;
  try { await fsReady(); setSyncChip('ok'); if ($('#app').dataset.screen === 'dash') { await cloudList(); renderDash(); } } catch (e) { if (e.code === 'auth') fbSessionEnded(); }
}

/* ---------- rendering ---------- */
function renderAuth() {
  const el = $('#auth-card'); if (!el) return;
  if (!S.backendAt) { API.health().then(() => { if ($('#app').dataset.screen === 'login') renderAuth(); }); }
  const server = S.backendOK && S.backend && S.backend.accounts;
  let mode = AUTH.mode || 'login'; if (!server && mode !== 'local') mode = 'local';
  const prev = store.get('user', null); const err = AUTH.err ? `<div class="auth-err">${esc(AUTH.err)}</div>` : '';
  const busy = AUTH.busy ? 'disabled' : '';
  const email = esc(AUTH.email || (prev && prev.method === 'cloud' ? prev.email : '') || '');
  const head = mode === 'signup' ? ['Create your DIMORA account', 'Your homes are saved to your account and open on any device.'] : mode === 'login' ? [prev && prev.method === 'cloud' ? 'Welcome back' : 'Sign in to DIMORA', 'Sign in to open your saved homes on any device.'] : (!server && AUTH_CONFIG.firebase ? ['Sign in to DIMORA', 'Continue with Google to save your homes to your account — or just start designing on this device below.'] : ['Use DIMORA on this device', server ? 'No account needed — your homes are saved in this browser only.' : 'The DIMORA server can\'t be reached right now, so accounts are unavailable. You can still design — your work is saved in this browser.']);
  const google = AUTH_CONFIG.firebase && !(server && mode === 'local') ? `<button class="btn block gbtn" data-act="auth-google" ${busy}><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> ${AUTH.busy ? 'Opening Google…' : 'Continue with Google'}</button>
    <p class="muted" style="font-size:12.5px;margin:6px 0 12px;text-align:center">Your homes are saved to your Google account (Firebase) and open on any device.</p>${server ? '<div class="auth-or"><span>or use email</span></div>' : ''}` : '';
  el.innerHTML = `<h2>${head[0]}</h2><p>${head[1]}</p>${err}${google}
    ${server ? `<div class="auth-tabs"><button class="${mode === 'login' ? 'on' : ''}" data-act="auth-mode" data-m="login">Sign in</button><button class="${mode === 'signup' ? 'on' : ''}" data-act="auth-mode" data-m="signup">Create account</button></div>` : ''}
    <form data-form="auth-details" novalidate>
      ${mode !== 'login' ? `<label class="auth-field">Your name <small>${mode === 'local' ? '(optional)' : ''}</small><input id="au-name" autocomplete="name" placeholder="e.g. Priya Sharma" maxlength="60" value="${esc(AUTH.name || (prev && prev.name) || '')}"></label>` : ''}
      ${mode !== 'local' ? `<label class="auth-field">Email<div class="inp-ico"><i>✉️</i><input id="au-email" type="email" autocomplete="email" placeholder="you@example.com" value="${email}"></div></label>
      <label class="auth-field">Password ${mode === 'signup' ? '<small>(at least 8 characters)</small>' : ''}<input id="au-pw" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" placeholder="••••••••"></label>` : ''}
      <button id="au-send" class="btn primary block" ${busy}>${AUTH.busy ? 'Please wait…' : mode === 'signup' ? 'Create account →' : mode === 'login' ? 'Sign in →' : 'Start designing →'}</button>
    </form>
    ${server ? (mode === 'local' ? `<p class="auth-alt"><a data-act="auth-mode" data-m="login">← Sign in or create an account instead</a></p>` : `<p class="auth-alt"><a data-act="auth-mode" data-m="local">Continue without an account (this device only)</a></p>`) : `<p class="auth-alt"><a data-act="auth-retry">Try connecting to the server again</a></p>`}
    <div class="auth-foot"><a data-act="go-landing">← Back to home</a><span>By continuing you agree to the <a data-act="legal" data-k="terms">terms</a> &amp; <a data-act="legal" data-k="privacy">privacy</a>.</span></div>`;
  setTimeout(() => (document.getElementById(mode === 'local' ? 'au-name' : 'au-email') || {}).focus?.(), 50);
}
function signIn(email, name, method, uidv, answers) {
  const prev = store.get('user', null); const same = prev && prev.email === email && prev.method === method;
  const user = Object.assign({}, same ? prev : {}, { email, name: name || (same ? prev.name : ''), method, uid: uidv || (same && prev.uid) || uid('u'), id: method === 'cloud' ? uidv : undefined, loggedIn: true, lastLogin: Date.now(), created: same && prev.created ? prev.created : Date.now() });
  if (answers !== undefined) user.answers = answers || undefined;
  delete user.phone; delete user.cc; delete user.phoneVerified;
  store.set('user', user); AUTH.err = ''; AUTH.busy = false; CLOUD.list = null; CLOUD.warned = false;
  toast(method === 'cloud' ? `Signed in as ${user.email}` : `Welcome${user.name ? ', ' + firstName(user) : ''} — your work is saved on this device`);
  if (user.answers?.done) runAfterLogin(); else { INTRO.i = 0; INTRO.a = {}; show('intro'); renderIntro(); }
}
async function submitAuth() {
  const mode = (S.backendOK && S.backend && S.backend.accounts) ? (AUTH.mode || 'login') : 'local';
  AUTH.name = ($('#au-name')?.value || '').trim().slice(0, 60); AUTH.email = ($('#au-email')?.value || '').trim().toLowerCase(); const pw = $('#au-pw')?.value || '';
  if (mode === 'local') { CLOUD.token = null; store.set('token', null); return signIn('', AUTH.name || 'Guest', 'local'); }
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(AUTH.email)) { AUTH.err = 'Please enter a valid email address.'; return renderAuth(); }
  if (mode === 'signup' && pw.length < 8) { AUTH.err = 'Use a password of at least 8 characters.'; return renderAuth(); }
  if (!pw) { AUTH.err = 'Please enter your password.'; return renderAuth(); }
  AUTH.busy = true; AUTH.err = ''; renderAuth();
  try {
    const j = await API.req(mode === 'signup' ? '/api/auth/signup' : '/api/auth/login', { body: { email: AUTH.email, password: pw, name: AUTH.name }, timeout: 25000 });
    CLOUD.token = j.token; store.set('token', j.token);
    const pr = (j.user.prefs && j.user.prefs.prefs) || null; if (pr) { Object.assign(S.prefs, pr); store.set('prefs', S.prefs); }
    signIn(j.user.email, j.user.name, 'cloud', j.user.id, (j.user.prefs && j.user.prefs.answers) || null);
    syncDeviceProjectsUp();
  } catch (e) { AUTH.busy = false; AUTH.err = e.code === 'offline' || e.code === 'timeout' ? 'The DIMORA server is not reachable right now — try again, or continue without an account.' : e.message; renderAuth(); }
}

/* ---------- intro questions ---------- */
const INTRO_QS = [
  { k: 'goal', q: 'What are you looking to do with DIMORA?', sub: 'Pick everything that applies — we\'ll tailor your workspace.', multi: true, opts: [['design', '🏡', 'Design my new home'], ['renovate', '🛠️', 'Renovate or redecorate'], ['visualise', '👀', 'Visualise a property before buying'], ['furniture', '🛋️', 'Plan furniture & layout'], ['budget', '₹', 'Estimate my interior budget'], ['study', '🎓', 'Architecture / design project'], ['showcase', '🏢', 'Showcase homes to clients'], ['explore', '✨', 'Just exploring']] },
  { k: 'passion', q: 'What are you by passion?', sub: 'Tell us what drives you — Aria will speak your language.', multi: false, opts: [['homeowner', '🏠', 'Home lover / homeowner'], ['interior', '🎨', 'Interior designer'], ['architect', '📐', 'Architect'], ['student', '📚', 'Architecture / design student'], ['builder', '🏗️', 'Builder / developer'], ['realestate', '🤝', 'Real estate professional'], ['creative', '🖌️', 'Artist / creative'], ['tech', '💻', 'Engineer / techie']] },
  { k: 'stage', q: 'Where are you in your home journey?', sub: 'Helps Aria give the right advice at the right moment.', multi: false, opts: [['possession', '🔑', 'Getting possession soon'], ['buying', '🔍', 'Planning to buy'], ['renting', '📦', 'Renting & want a refresh'], ['renovating', '🧱', 'Renovating my current home'], ['building', '🏗️', 'Building from scratch'], ['pro', '💼', 'Professional use — not my own home']] },
];
const INTRO = { i: 0, a: {} };
function renderIntro() {
  const el = $('#intro-card'); if (!el) return; const u = currentUser(); if (!u) return;
  if (!Object.keys(INTRO.a).length && u.answers) INTRO.a = deep(u.answers);
  const Q = INTRO_QS[INTRO.i]; const cur = INTRO.a[Q.k] || { v: [], other: '' };
  el.innerHTML = `<div class="intro-top"><div class="logo"><span class="mark">◇</span>DIMORA</div><div class="row"><span class="muted" style="font-size:12.5px">Question ${INTRO.i + 1} of ${INTRO_QS.length}</span><div class="intro-prog">${INTRO_QS.map((_, k) => `<i class="${k <= INTRO.i ? 'on' : ''}"></i>`).join('')}</div></div></div>
    ${INTRO.i === 0 ? `<p class="eyebrow">Hi ${esc(firstName(u))} — three quick questions</p>` : '<p class="eyebrow">&nbsp;</p>'}
    <h1 class="intro-q">${esc(Q.q)}</h1><p class="intro-sub">${esc(Q.sub)}</p>
    <div class="intro-opts">${Q.opts.map(([v, ic, l], k) => `<button class="iopt ${cur.v.includes(v) ? 'on' : ''}" style="animation-delay:${k * 0.035}s" data-act="intro-pick" data-v="${v}"><i>${ic}</i><b>${esc(l)}</b></button>`).join('')}</div>
    <input class="intro-other" id="intro-other" placeholder="Something else? Tell us in your own words (optional)" value="${esc(cur.other || '')}" maxlength="120">
    <div class="intro-nav">${INTRO.i ? '<button class="btn ghost" data-act="intro-back">← Back</button>' : '<button class="btn ghost" data-act="logout">Sign out</button>'}<button class="btn primary lg" data-act="intro-next">${INTRO.i < INTRO_QS.length - 1 ? 'Next →' : 'Enter DIMORA →'}</button></div>`;
}
function introSaveOther() { const Q = INTRO_QS[INTRO.i]; const o = $('#intro-other'); if (!o) return; INTRO.a[Q.k] = INTRO.a[Q.k] || { v: [], other: '' }; INTRO.a[Q.k].other = o.value.trim(); }
function labelOf(k, v) { const Q = INTRO_QS.find(q => q.k === k); return Q.opts.find(o => o[0] === v)?.[2] || v; }
function answerText(k, u = currentUser()) { const a = u?.answers?.[k]; if (!a) return '—'; return [...a.v.map(v => labelOf(k, v)), a.other].filter(Boolean).join(', ') || '—'; }
function ariaGoalLine() {
  const u = currentUser(); const a = u?.answers; if (!a) return '';
  const g = a.goal?.v || [], p = a.passion?.v?.[0], s = a.stage?.v?.[0];
  if (['architect', 'student'].includes(p)) return 'As a fellow design mind, you\'ll love the Structure panel — plan validation, circulation and multi-storey stacking. ';
  if (p === 'builder' || g.includes('showcase')) return 'Tip for showcasing: save variants in Compare and generate a Home Decision Report for your clients. ';
  if (p === 'interior') return 'The Design panel has themes, materials, ceilings and lighting ready for your clients. ';
  if (g.includes('budget')) return 'Since budget matters to you, the ₹ panel explains every estimate and can fit any room into your number. ';
  if (s === 'buying' || g.includes('visualise')) return 'Since you\'re evaluating a property, check daylight and space scores before you decide. ';
  if (s === 'renting') return 'For a rental refresh, try “make it cheaper” — paint, rugs and lighting go a long way. ';
  return '';
}
function personaliseFromAnswers(a) {
  const g = a.goal?.v || [], p = a.passion?.v?.[0];
  S.panel = ['architect', 'student'].includes(p) || g.includes('study') ? 'arch' : g.includes('budget') ? 'budget' : g.includes('furniture') ? 'furniture' : 'design';
}

/* ---------- account ---------- */
function openAccount() {
  const u = currentUser(); if (!u) return; const cloud = isCloud(), gacct = cloudKind() === 'fs';
  $('#modal-card').innerHTML = `<button class="x" data-act="modal-close">✕</button><div class="row" style="gap:14px"><span class="uchip" style="width:54px;height:54px;font-size:20px;display:grid">${esc(initials(u))}</span><div><h2 style="margin:0">${esc(u.name || firstName(u))}</h2><div class="muted">${cloud ? esc(u.email) : 'Saved on this device only'}</div></div></div>
    <div class="card" style="margin:14px 0">${gacct ? `<b>☁ Google account</b><div class="muted" style="font-size:13px">Signed in with Google. Your homes and preferences are saved in Cloud Firestore and open on any device where you sign in with this Google account.</div>` : cloud ? `<b>☁ DIMORA account</b><div class="muted" style="font-size:13px">Your homes and preferences are saved to your account${S.backend?.accounts === 'sqlite' ? ' on this server' : ''} and open on any device where you sign in.</div>` : `<b>📱 This device only</b><div class="muted" style="font-size:13px">Your homes are stored in this browser. ${AUTH_CONFIG.firebase || (S.backendOK && S.backend?.accounts) ? 'Sign in to keep them safe and use them on other devices — they move into your account automatically.' : 'Accounts need the DIMORA server.'}</div>${AUTH_CONFIG.firebase || (S.backendOK && S.backend?.accounts) ? '<button class="btn sm primary" style="margin-top:8px" data-act="acct-upgrade">Sign in / create an account</button>' : ''}`}</div>
    <div class="acct-ans">${INTRO_QS.map(q => `<div><small>${esc(q.q)}</small>${esc(answerText(q.k, u))}</div>`).join('')}</div>
    ${gacct ? `<details class="acct-sec"><summary>Delete my saved data</summary><p class="muted" style="font-size:13px">This permanently deletes every home and preference saved in your Google account's DIMORA storage. Your Google account itself is not affected.</p><button class="btn sm danger" data-act="acct-delete-g">Delete my DIMORA data</button></details>` : ''}
    ${cloud && !gacct ? `<details class="acct-sec"><summary>Change password</summary><div class="two"><input type="password" id="pw-old" placeholder="Current password" autocomplete="current-password"><input type="password" id="pw-new" placeholder="New password (8+ characters)" autocomplete="new-password"></div><button class="btn sm" data-act="acct-pw">Update password</button></details>
    <details class="acct-sec"><summary>Delete account</summary><p class="muted" style="font-size:13px">This permanently deletes your account and every home saved in it.</p><input type="password" id="del-pw" placeholder="Type your password to confirm" autocomplete="current-password"><button class="btn sm danger" data-act="acct-delete">Delete my account</button></details>` : ''}
    <p class="muted" style="font-size:12px">Member since ${new Date(u.created).toLocaleDateString('en-IN')}</p>
    <div class="row end"><button class="btn ghost" data-act="intro-edit">Edit answers</button><button class="btn primary" data-act="logout">Sign out</button></div>`;
  $('#modal').classList.add('on');
}
Object.assign(ACT, {
  account: () => openAccount(),
  'auth-mode': el => { AUTH.mode = el.dataset.m; AUTH.err = ''; renderAuth(); },
  'auth-retry': async () => { await API.health(true); AUTH.mode = 'login'; renderAuth(); },
  'acct-delete-g': async () => { if (!confirm('Delete all your DIMORA homes and preferences saved in your Google account? This cannot be undone.')) return;
    try { await fsDeleteAll(); toast('Your saved DIMORA data was deleted'); ACT.logout(); } catch (e) { toast('Could not delete: ' + e.message, 5000); } },
  'acct-upgrade': () => { $('#modal').classList.remove('on'); AUTH.mode = AUTH_CONFIG.firebase ? 'login' : 'signup'; const u = store.get('user', null); if (u) { u.loggedIn = false; store.set('user', u); } show('login'); renderAuth(); },
  'acct-pw': async () => { const o = $('#pw-old').value, n = $('#pw-new').value; if (n.length < 8) return toast('Use a new password of at least 8 characters');
    try { const j = await API.req('/api/auth/password', { body: { old: o, new: n }, timeout: 20000 }); CLOUD.token = j.token; store.set('token', j.token); toast('Password updated — other devices were signed out'); $('#modal').classList.remove('on'); } catch (e) { toast(e.message, 4000); } },
  'acct-delete': async () => { const pw = $('#del-pw').value; if (!pw) return toast('Type your password to confirm');
    try { await API.req('/api/auth/me', { method: 'DELETE', body: { password: pw }, timeout: 20000 }); toast('Your account and its homes were deleted'); ACT.logout(); } catch (e) { toast(e.message, 4000); } },
  'auth-google': async () => {
    AUTH.err = ''; AUTH.busy = true; renderAuth(); const fb = await initFirebase(); if (!fb) { AUTH.busy = false; return renderAuth(); }
    const provider = new window.firebase.auth.GoogleAuthProvider(); provider.setCustomParameters({ prompt: 'select_account' });
    try { const res = await fb.signInWithPopup(provider); CLOUD.token = null; store.set('token', null); await finishGoogleSignIn(res.user); }
    catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') { store.set('g_redirect', 1); try { return await fb.signInWithRedirect(provider); } catch (x) { e = x; } }
      AUTH.busy = false; AUTH.err = fbErr(e); renderAuth();
    }
  },
  'intro-pick': el => { const Q = INTRO_QS[INTRO.i]; introSaveOther(); const a = INTRO.a[Q.k] = INTRO.a[Q.k] || { v: [], other: '' }; const v = el.dataset.v; if (Q.multi) { const i = a.v.indexOf(v); i >= 0 ? a.v.splice(i, 1) : a.v.push(v); } else a.v = [v]; renderIntro(); },
  'intro-back': () => { introSaveOther(); INTRO.i = Math.max(0, INTRO.i - 1); renderIntro(); },
  'intro-next': () => {
    introSaveOther(); const Q = INTRO_QS[INTRO.i]; const a = INTRO.a[Q.k];
    if (!a || (!a.v.length && !a.other)) { toast('Pick an option (or type your own) to continue'); return; }
    if (INTRO.i < INTRO_QS.length - 1) { INTRO.i++; renderIntro(); return; }
    const u = store.get('user', null); u.answers = Object.assign(deep(INTRO.a), { done: true, at: Date.now() }); store.set('user', u);
    personaliseFromAnswers(u.answers); store.set('panel', S.panel); cloudSavePrefs();
    runAfterLogin(); toast(`Welcome to DIMORA, ${firstName(u)}!`);
  },
  'intro-edit': () => { $('#modal').classList.remove('on'); if (S.touring) stopTour(); const u = store.get('user', null); INTRO.i = 0; INTRO.a = deep(u.answers || {}); delete INTRO.a.done; delete INTRO.a.at; u.answers = Object.assign(u.answers || {}, { done: false }); store.set('user', u); show('intro'); renderIntro(); },
  logout: async () => { $('#modal').classList.remove('on'); if (S.touring) stopTour(); const u = store.get('user', null);
    const owner = isCloud() ? projOwner() : null;
    if (CLOUD.token) { try { await API.req('/api/auth/logout', { method: 'POST', body: {}, timeout: 8000 }); } catch (e) { } }
    if (owner && owner !== 'device') { // this browser may be shared: drop the cached copies of the account's projects
      const keep = []; store.get('projects', []).forEach(p => { if (p.owner === owner) { try { localStorage.removeItem('dimora_proj_' + p.id); } catch (e) { } } else keep.push(p); }); store.set('projects', keep); }
    FS.user = null;
    CLOUD.token = null; CLOUD.list = null; store.set('token', null); S.project = null;
    if (u) { u.loggedIn = false; store.set('user', u); } try { await AUTH.fb?.signOut(); } catch (e) { } AUTH.err = ''; $('#app').classList.remove('chat-open'); show('landing'); setTimeout(initHero, 50); toast('Signed out'); },
});
document.addEventListener('submit', e => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); if (f.dataset.form === 'auth-details') submitAuth(); });

/* ===================== MARKETING SITE: live 3D hero, rendered showcase & before/after ===================== */
const SITE_CONFIG = {
  contactEmail: 'hello@dimora.app', // ← replace with your real contact address before launch
};
const HERO = { E: null, proj: null, mode: 'furnished', ready: false, inView: true, drag: null, theta: -0.7, phi: 0.92, r: 20, c: [0, 0, 0], last: 0, imgs: {}, gen: false };
function withHero(fn, o = {}) {
  const keep = { E, P: S.project, cut: S.cutaway, hour: S.hour, sel: S.sel, view: S.view, ds: S.daylightSim, tour: S.touring, labels: S.labels };
  E = HERO.E; S.project = HERO.proj; S.cutaway = o.cut ?? HERO.mode === 'cutaway'; S.hour = o.hour ?? (HERO.mode === 'night' ? 20.6 : 10.5); S.sel = null; S.view = '3d'; S.daylightSim = !!o.sun; S.touring = !!o.tour;
  try { return fn(); } finally { E = keep.E; S.project = keep.P; S.cutaway = keep.cut; S.hour = keep.hour; S.sel = keep.sel; S.view = keep.view; S.daylightSim = keep.ds; S.touring = keep.tour; S.labels = keep.labels; }
}
function heroBuild(o) { withHero(() => rebuild(), o); HERO.E.dirty = true; }
function heroCam() {
  const cv = HERO.E.canvas, a = cv.clientWidth / Math.max(1, cv.clientHeight), b = homeBounds(HERO.proj.floors[0]);
  HERO.c = [b.x + b.w / 2, 0.4, b.y + b.d / 2];
  const half = Math.min(HERO.E.cam.fov / 2, Math.atan(Math.tan(HERO.E.cam.fov / 2) * a)); HERO.r = (Math.hypot(b.w, b.d) / 2 + 0.6) / Math.sin(half) * 0.92;
}
function heroApplyCam() { const e = HERO.E, h = HERO; e.cam.pos = [h.c[0] + h.r * Math.sin(h.phi) * Math.sin(h.theta), h.c[1] + h.r * Math.cos(h.phi), h.c[2] + h.r * Math.sin(h.phi) * Math.cos(h.theta)]; e.cam.target = h.c.slice(); e.dirty = true; }
function initHero() {
  if (HERO.E || HERO.failed) return; const cv = document.getElementById('hero-gl'); if (!cv) return;
  try { HERO.E = new Engine(cv); } catch (e) { HERO.failed = true; document.getElementById('hero-fallback').style.display = 'flex'; genLandingImages(); return; }
  const keepP = S.project; HERO.proj = sampleHome(); S.project = HERO.proj; HERO.proj.theme = 'Japandi'; furnishAll(); S.project = keepP;
  heroBuild(); heroCam(); heroApplyCam();
  withHero(() => { const c = homeCost(); const el = document.getElementById('hero-cost'); if (el) el.innerHTML = `<b class="c-violet">${inr(c.total)}</b> est. interior`; });
  cv.addEventListener('pointerdown', e => { HERO.drag = { x: e.clientX, y: e.clientY, t: HERO.theta, p: HERO.phi }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!HERO.drag) return; HERO.theta = HERO.drag.t - (e.clientX - HERO.drag.x) * 0.006; HERO.phi = clamp(HERO.drag.p - (e.clientY - HERO.drag.y) * 0.004, 0.35, 1.35); heroApplyCam(); });
  const up = () => { HERO.drag = null; HERO.idleAt = performance.now(); }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  try { new IntersectionObserver(es => es.forEach(x => HERO.inView = x.isIntersecting)).observe(cv); } catch (e) { }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loop = t => {
    const dt = Math.min(0.05, (t - HERO.last) / 1000 || 0.016); HERO.last = t;
    if ($('#app').dataset.screen === 'landing' && HERO.inView && !HERO.busy) {
      if (!reduce && !HERO.drag && (!HERO.idleAt || t - HERO.idleAt > 2500)) { HERO.theta += dt * 0.12; heroApplyCam(); }
      if (HERO.E.dirty) { HERO.E.render(); }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.addEventListener('resize', () => { if (HERO.E) { heroCam(); heroApplyCam(); } });
  HERO.ready = true;
  // the showcase renders are made only when someone scrolls near them (keeps the first load light on phones)
  const sc = document.getElementById('showcase');
  try { const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); setTimeout(genLandingImages, 200); } }, { rootMargin: '600px 0px' }); sc ? io.observe(sc) : setTimeout(genLandingImages, 900); } catch (e) { setTimeout(genLandingImages, 900); }
}
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
// renders happen on a separate off-screen engine so the live hero never flickers
function genEngine(w, h) { if (!HERO.G) { const c = document.createElement('canvas'); c.width = w; c.height = h; HERO.G = new Engine(c, { fixed: true }); } HERO.G.canvas.width = w; HERO.G.canvas.height = h; return HERO.G; }
function genBuild(o) { const keep = HERO.E; HERO.E = HERO.G; try { withHero(() => rebuild(), o); } finally { HERO.E = keep; } }
async function shotFrom(pos, target, fov, w, h) { const g = genEngine(w, h); g.cam.pos = pos; g.cam.target = target; g.cam.fov = fov; const url = g.snapshot(w, h); await nextFrame(); return url; }
async function genLandingImages() {
  if (HERO.gen) return; HERO.gen = true;
  const proj = HERO.proj || (() => { const k = S.project; const p = sampleHome(); S.project = p; furnishAll(); S.project = k; HERO.proj = p; return p; })();
  // (the before / after slider shows fixed images of the 2BHK test plan: assets/landing/)
  const room = proj.floors[0].rooms.find(r => r.type === 'living'), room2 = proj.floors[0].rooms.find(r => r.type === 'master');
  withHero(() => { const c = roomCost(room); $('#sc-room').textContent = `${room.name} · ${room.w} × ${room.d} m`; $('#sc-cap').textContent = templateNarration(room).split(/(?<=[.!?])\s+/).slice(0, 2).join(' '); $('#sc-badge2').innerHTML = `<b class="c-cyan">${r2(area(room))} m²</b> · ${inr(c.total)}`; });
  if (!HERO.E && HERO.failed) { $('#sc-loading').textContent = '3D preview needs WebGL2'; return; }
  try {
    // SHOWCASE: interior renders from Aria's tour cameras
    const shots = {};
    for (const [k, rm, hour] of [['tour', room, 10.5], ['walk', room2, 9.2], ['night', room, 20.6]]) {
      genEngine(1280, 720); genBuild({ hour, tour: true, cut: false });
      const sh = withHero(() => roomShot(rm)); shots[k] = await shotFrom(sh.pos, sh.target, 68 * Math.PI / 180, 1280, 720);
    }
    HERO.imgs = shots; scShow('tour');
  } catch (e) { console.warn('landing renders failed', e); }
}
function scShow(k) {
  const img = $('#sc-img'); if (!HERO.imgs[k]) return; img.hidden = false; img.src = HERO.imgs[k]; $('#sc-loading').style.display = 'none';
  const proj = HERO.proj; const rm = proj.floors[0].rooms.find(r => r.type === (k === 'walk' ? 'master' : 'living'));
  withHero(() => { $('#sc-room').textContent = `${rm.name} · ${rm.w} × ${rm.d} m${k === 'night' ? ' · 8:36 PM' : ''}`; const n = templateNarration(rm).split(/(?<=[.!?])\s+/); $('#sc-cap').textContent = k === 'night' ? `Evening in the ${rm.name}: warm 2700K ambient light from the ${CEILINGS[roomCeiling(rm)].label.toLowerCase()} plus a reading lamp beside the sofa. Want brighter task lighting here?` : n.slice(0, 2).join(' '); $('#sc-badge2').innerHTML = `<b class="c-cyan">${r2(area(rm))} m²</b> · ${inr(roomCost(rm).total)}`; });
  $$('[data-sc]').forEach(b => { const on = b.dataset.sc === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
document.addEventListener('click', e => {
  const h = e.target.closest('[data-hero]'); if (h && HERO.E && !HERO.busy) { HERO.mode = h.dataset.hero; $$('[data-hero]').forEach(b => { const on = b === h; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); heroBuild(); }
  const s = e.target.closest('[data-sc]'); if (s) scShow(s.dataset.sc);
});
/* ---------- "Make it Real": a Cloudflare Workers AI image model turns the current 3D view into a photo ---------- */
async function makeReal() {
  if (!E || S.view === '2d') { toast('Switch to the 3D view first — the photo is made from what you see.'); return; }
  const ins = (() => { const r = roomAt(E.cam.pos[0], E.cam.pos[2]); return !!r && !isOpenAir(r) && E.cam.pos[1] < floorY(FL()) + FL().height; })();
  const shotURL = E.snapshot(1280, 720), stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  $('#modal-card').innerHTML = `<button class="x" data-act="modal-close" aria-label="Close">✕</button><p class="eyebrow">Powered by Cloudflare Workers AI</p><h2>✨ Make it Real</h2>
    <div class="mr-wrap"><div class="mr-stage mr-loading" id="mr-stage"><img src="${shotURL}" alt="Your 3D view"></div>
    <div class="mr-status" id="mr-status"><span class="mr-spin"></span><span>Cloudflare AI is turning this view into a photo — this takes about 10–30 seconds…</span></div></div>`;
  $('#modal').classList.add('on'); $('#modal-card').classList.add('wide');
  try {
    const res = await API.req('/api/ai/make-real', { body: { image: shotURL, view: ins ? 'interior' : 'exterior' }, timeout: 150000 });
    if (!$('#mr-stage')) return; // closed meanwhile
    S.lastPhoto = res.image;
    $('#mr-stage').classList.remove('mr-loading'); $('#mr-stage').style.setProperty('--cut', '50%');
    $('#mr-stage').innerHTML = `<img src="${shotURL}" alt="3D view"><img class="mr-after" src="${res.image}" alt="Photorealistic photo by Cloudflare AI"><div class="mr-line"></div><span class="mr-tag l">3D view</span><span class="mr-tag r">Photo</span>
      <input type="range" min="0" max="100" value="50" aria-label="Compare 3D view and photo" oninput="this.parentNode.style.setProperty('--cut', this.value + '%')">`;
    $('#mr-status').outerHTML = `<div class="mr-actions"><a class="btn primary" href="${res.image}" download="DIMORA-photo-${stamp}.png">⬇ Download photo</a>
      <button class="btn ghost" data-act="make-real">Try again</button><span class="muted">${res.left != null ? `${res.left} of ${res.limit} free photos left today · ` : ''}AI-generated image — layout follows your 3D view, details are artistic.</span></div>`;
  } catch (e) {
    if (!$('#mr-stage')) return; $('#mr-stage').classList.remove('mr-loading');
    const msg = e.status === 429 ? e.message : e.code === 'offline' ? 'The DIMORA server is not reachable, so the photo could not be made. Check your internet connection and try again.'
      : /token|account ID|configured|No Cloudflare|ai_unavailable/i.test(e.message + e.code) ? 'The photo feature needs Cloudflare Workers AI on the server (CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN), or your own account ID and token in Settings → AI.'
      : `Cloudflare AI could not make the photo this time (${esc(e.message).slice(0, 160)}). Please try again in a minute.`;
    $('#mr-status').outerHTML = `<div class="mr-err" role="alert">${msg}</div><div class="mr-actions"><button class="btn ghost" data-act="make-real">Try again</button></div>`;
  }
}
/* ===================== PLAN SUMMARY, SUN & VASTU, EXPORTS, SHARING, LAYOUT IDEAS (Revit-inspired) ===================== */
const toFt = m => Math.round(m / 0.3048 * 2) / 2; // half-foot rounding: 5.49 m reads as 18'-0"
const ftTxt = m => { const f = toFt(m), i = Math.round((f % 1) * 12); return `${Math.floor(f)}'-${i}"`; };
/* every room with its size in feet and area in sq ft, and the built-up area (roofed rooms only) */
function roomSchedule() {
  const rows = []; P().floors.forEach(f => f.rooms.forEach(r => { const sq = toFt(r.w) * toFt(r.d);
    rows.push({ r, f, name: r.name, type: ROOM_TYPES[r.type].label, size: `${ftTxt(r.w)} × ${ftTxt(r.d)}`, sqft: Math.round(sq), m2: Math.round(area(r) * 10) / 10, built: !isOpenAir(r) }); }));
  const built = rows.filter(x => x.built).reduce((s, x) => s + x.sqft, 0), open = rows.filter(x => !x.built).reduce((s, x) => s + x.sqft, 0);
  return { rows, built, open };
}
/* compass zone of a room (8 directions + centre) from the north arrow */
function zoneOf(r, f) {
  const b = houseBounds() || homeBounds(), cx = b.x + b.w / 2, cy = b.y + b.d / 2, dx = r.x + r.w / 2 - cx, dy = r.y + r.d / 2 - cy;
  if (Math.abs(dx) < b.w * 0.17 && Math.abs(dy) < b.d * 0.17) return 'Centre';
  const brg = ((Math.atan2(dx, -dy) * 180 / Math.PI + (P().north || 0)) % 360 + 360) % 360; return COMPASS[Math.round(brg / 45) % 8];
}
const VASTU = { // general traditional guidance: ideal zones, acceptable zones, zones to avoid
  kitchen: [['SE'], ['NW', 'E'], ['NE', 'SW', 'Centre'], 'Kitchen: south-east (fire corner) is traditional; north-west also works.'],
  master: [['SW'], ['S', 'W'], ['NE', 'Centre'], 'Master bedroom: south-west is traditional for stability.'],
  bedroom: [['S', 'W', 'SW'], ['NW', 'E', 'N'], ['NE'], 'Bedrooms: south or west are traditional; keep the north-east light.'],
  guest: [['NW'], ['W', 'N'], ['SW', 'NE'], 'Guest room: north-west is traditional.'],
  pooja: [['NE'], ['E', 'N'], ['S', 'SW', 'SE'], 'Pooja: north-east (Ishanya) is the traditional corner.'],
  living: [['N', 'NE', 'E'], ['NW', 'W'], [], 'Living room: north or east, open and bright, is traditional.'],
  dining: [['W', 'E'], ['N', 'S', 'Centre'], [], 'Dining: west or east of the home is traditional.'],
  bathroom: [['W', 'NW'], ['S', 'SE'], ['NE', 'Centre', 'SW'], 'Bathrooms / toilets: west or north-west; avoid the north-east corner.'],
  store: [['SW', 'W'], ['S', 'NW'], ['NE'], 'Store: south-west or west (heavy storage) is traditional.'],
  utility: [['NW', 'W'], ['SE', 'S'], ['NE'], 'Utility / wash area: north-west is traditional.'],
};
function sunVastu() {
  const out = [], g = P().floors.slice().sort((a, b) => a.level - b.level)[0];
  P().floors.forEach(f => f.rooms.filter(r => !isYard(r)).forEach(r => {
    const L = analyzeLight(r, f), morning = L.dirs.filter(d => d.includes('E')), z = zoneOf(r, f), rule = VASTU[r.type];
    const v = rule ? (rule[0].includes(z) ? 'good' : rule[1].includes(z) ? 'ok' : rule[2].includes(z) ? 'consider' : 'ok') : null;
    out.push({ r, zone: z, morning: morning.length ? `Morning sun (${morning.join('/')} window)` : L.dirs.length ? `Light from ${L.dirs.join('/')}` : 'No outside window', v, note: rule ? rule[3] : '' });
  }));
  const md = g && g.doors.find(d => d.main), hb = houseBounds(); let facing = null;
  if (md && hb) { const side = md.o === 'h' ? (Math.abs(md.y - hb.y) < Math.abs(md.y - hb.y - hb.d) ? 'N' : 'S') : (Math.abs(md.x - hb.x) < Math.abs(md.x - hb.x - hb.w) ? 'W' : 'E'); facing = sideCompass(side).label; }
  return { rooms: out, door: facing ? { facing, v: ['N', 'NE', 'E'].includes(facing) ? 'good' : 'ok', note: `Main door opens to the ${facing}. North, north-east and east entrances are the most traditional; others are common in modern plots.` } : null };
}
const VMARK = { good: '✅ Ideal', ok: '🟡 Acceptable', consider: '⚠️ Consider' };
function openSummary() {
  if (!S.project) return; const sch = roomSchedule(), sv = sunVastu(), mf = P().floors.length > 1;
  const rows = sch.rows.map(x => `<tr><td>${esc(x.name)}${mf ? `<small class="muted"> · ${esc(x.f.name)}</small>` : ''}</td><td>${esc(x.type)}</td><td>${x.size}</td><td class="num">${x.sqft.toLocaleString('en-IN')}</td></tr>`).join('');
  const vr = sv.rooms.map(x => `<tr><td>${esc(x.r.name)}</td><td>${x.zone}</td><td>${esc(x.morning)}</td><td>${x.v ? VMARK[x.v] : '—'}</td></tr>`).join('');
  $('#modal-card').innerHTML = `<button class="x" data-act="modal-close" aria-label="Close">✕</button><p class="eyebrow">Plan summary</p><h2>${esc(P().name)}</h2>
  <div class="sum-kpis"><div><b>${sch.built.toLocaleString('en-IN')}</b><span>sq ft built-up</span></div><div><b>${sch.rows.filter(x => x.built).length}</b><span>rooms</span></div><div><b>${sch.open.toLocaleString('en-IN')}</b><span>sq ft balcony, porch, parking &amp; garden</span></div></div>
  <div class="sum-actions"><button class="btn primary" data-act="export-pdf">⬇ PDF summary</button><button class="btn ghost" data-act="export-glb">⬇ 3D model (GLB)</button><button class="btn ghost" data-act="share-link">🔗 Share view-only link</button></div>
  <div id="share-out"></div>
  <h3>Rooms and areas</h3><div class="sum-scroll"><table class="sum-t"><thead><tr><th>Room</th><th>Type</th><th>Size (ft)</th><th class="num">Area (sq ft)</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td colspan="3">Total built-up area</td><td class="num">${sch.built.toLocaleString('en-IN')}</td></tr></tfoot></table></div>
  <h3>Sunlight &amp; Vastu hints</h3><p class="muted">From the north arrow (${P().north || 0}° from plan-up; change it in Settings). <b>General guidance only</b> — traditional Vastu ideas and simple sun paths, not a structural or religious ruling.</p>
  ${sv.door ? `<p>🚪 ${VMARK[sv.door.v]} — ${esc(sv.door.note)}</p>` : ''}
  <div class="sum-scroll"><table class="sum-t"><thead><tr><th>Room</th><th>Zone</th><th>Sunlight</th><th>Vastu</th></tr></thead><tbody>${vr}</tbody></table></div>
  <ul class="sum-notes">${[...new Set(sv.rooms.filter(x => x.v === 'consider').map(x => x.note))].map(n => `<li>${esc(n)}</li>`).join('') || '<li>No rooms in zones that traditional Vastu would ask you to reconsider.</li>'}</ul>`;
  $('#modal-card').classList.add('wide'); $('#modal').classList.add('on');
}

/* ---- GLB export: every visible part of the 3D scene as plain glTF 2.0 (colours and materials, no procedural textures) ---- */
function exportGLB() {
  const groups = [...E.groups.values()].filter(g => g.visible !== false), geos = new Map(), mats = new Map(), nodes = [], meshes = new Map(), bin = [];
  let off = 0; const views = [], accs = [];
  const lin = c => c.map(v => Math.pow(v, 2.2));
  const addBuf = arr => { const b = new Uint8Array(arr.buffer.slice(0)); const pad = (4 - b.length % 4) % 4; const v = { buffer: 0, byteOffset: off, byteLength: b.length }; bin.push(b); if (pad) bin.push(new Uint8Array(pad)); off += b.length + pad; views.push(v); return views.length - 1; };
  groups.forEach(g => { E._groupMat(g); g.items.forEach(d => {
    if (d.shadowOnly || d.alpha <= 0.02 || !d.geo || !d.geo.cpu || d.pattern === 24 || d.pattern === 25 || d.pattern === 26) return; // leaf cards are cut out in the shader: skip them in the GLB const gk = d.geo.key || '';
    if (/^box:/.test(gk) && gk.split(':').slice(1, 4).some(v => +v >= 100)) return; // the endless lawn / road planes
    let gi = geos.get(d.geo); if (gi == null) { const { pos, nor } = d.geo.cpu, P3 = new Float32Array(pos), N3 = new Float32Array(nor), mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      for (let i = 0; i < P3.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P3[i + k]); mx[k] = Math.max(mx[k], P3[i + k]); }
      accs.push({ bufferView: addBuf(P3), componentType: 5126, count: P3.length / 3, type: 'VEC3', min: mn, max: mx }); accs.push({ bufferView: addBuf(N3), componentType: 5126, count: N3.length / 3, type: 'VEC3' });
      gi = accs.length - 2; geos.set(d.geo, gi); }
    const mk = [d.color, d.alpha, d.metal, d.rough, d.emissive].join('|'); let mi = mats.get(mk);
    if (mi == null) { const m = { pbrMetallicRoughness: { baseColorFactor: [...lin(d.rgb), d.alpha], metallicFactor: d.metal || 0, roughnessFactor: d.rough >= 0 ? d.rough : 0.6 } };
      if (d.alpha < 1) m.alphaMode = 'BLEND'; if (d.erg.some(v => v > 0.05)) m.emissiveFactor = lin(d.erg); mi = mats.size; mats.set(mk, mi); }
    const key = gi + ':' + mi; let me = meshes.get(key); if (me == null) { me = meshes.size; meshes.set(key, { primitives: [{ attributes: { POSITION: gi, NORMAL: gi + 1 }, material: mi }] }); }
    nodes.push({ mesh: me, matrix: Array.from(d.world) });
  }); });
  const matsArr = [...mats.keys()].map(() => null); [...mats.entries()].forEach(([k, i]) => { const [color, alpha, metal, rough, em] = k.split('|'); const rgb = lin(hexToRgb(color)), m = { pbrMetallicRoughness: { baseColorFactor: [...rgb, +alpha], metallicFactor: +metal || 0, roughnessFactor: +rough >= 0 ? +rough : 0.6 } }; if (+alpha < 1) m.alphaMode = 'BLEND'; const e = lin(hexToRgb(em)); if (e.some(v => v > 0.05)) m.emissiveFactor = e; matsArr[i] = m; });
  const json = { asset: { version: '2.0', generator: 'DIMORA' }, scene: 0, scenes: [{ name: P().name, nodes: nodes.map((_, i) => i) }], nodes, meshes: [...meshes.values()], materials: matsArr, accessors: accs, bufferViews: views, buffers: [{ byteLength: off }] };
  let jt = new TextEncoder().encode(JSON.stringify(json)); const jp = (4 - jt.length % 4) % 4; if (jp) { const t = new Uint8Array(jt.length + jp); t.set(jt); t.fill(0x20, jt.length); jt = t; }
  const total = 12 + 8 + jt.length + 8 + off, out = new Uint8Array(total), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true); dv.setUint32(12, jt.length, true); dv.setUint32(16, 0x4E4F534A, true); out.set(jt, 20);
  let o = 20 + jt.length; dv.setUint32(o, off, true); dv.setUint32(o + 4, 0x004E4942, true); o += 8; bin.forEach(b => { out.set(b, o); o += b.length; });
  return { blob: new Blob([out], { type: 'model/gltf-binary' }), nodes: nodes.length, meshes: meshes.size, bytes: total };
}
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
const fileSafe = s => String(s || 'DIMORA').replace(/[^\w -]+/g, '').trim().replace(/\s+/g, '-') || 'DIMORA';

/* ---- a tiny PDF writer (no library needed, works offline): Helvetica text + JPEG pictures, A4, mm from the top-left ---- */
class MiniPDF {
  constructor() { this.pages = []; this.imgs = []; this.addPage(); }
  addPage() { this.cur = []; this.pages.push(this.cur); }
  static enc(t) { // text → WinAnsi bytes, PDF-escaped
    const map = { '₹': 'Rs ', '–': '\x96', '—': '\x97', '’': "'", '‘': "'", '“': '"', '”': '"', '…': '...', '·': '\xb7', '×': '\xd7', '°': '\xb0', '→': '->', '✅': '', '🟡': '', '⚠️': '', '⚠': '' };
    let o = ''; for (const ch of String(t)) { let c = map[ch] != null ? map[ch] : ch; for (const cc of c) { const code = cc.charCodeAt(0); o += code < 256 ? (cc === '(' || cc === ')' || cc === '\\' ? '\\' + cc : cc) : '?'; } } return o; }
  text(x, y, t, size = 10, bold = false, rgb = [0.12, 0.12, 0.16], align = 'left') {
    const w = MiniPDF.width(t, size), X = align === 'right' ? x - w * 25.4 / 72 : x;
    this.cur.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${rgb.join(' ')} rg ${(X * 72 / 25.4).toFixed(2)} ${(842 - y * 72 / 25.4).toFixed(2)} Td (${MiniPDF.enc(t)}) Tj ET`); }
  static width(t, size) { return String(t).length * size * 0.5; } // ≈ Helvetica average advance (pt)
  wrap(t, size, maxMm) { const words = String(t).split(/\s+/), lines = []; let l = ''; words.forEach(w => { const n = l ? l + ' ' + w : w; if (MiniPDF.width(n, size) * 25.4 / 72 > maxMm && l) { lines.push(l); l = w; } else l = n; }); if (l) lines.push(l); return lines; }
  rect(x, y, w, h, rgb) { const k = 72 / 25.4; this.cur.push(`${rgb.join(' ')} rg ${(x * k).toFixed(2)} ${(842 - (y + h) * k).toFixed(2)} ${(w * k).toFixed(2)} ${(h * k).toFixed(2)} re f`); }
  image(jpegBytes, pw, ph, x, y, w, h) { const n = this.imgs.length; this.imgs.push({ b: jpegBytes, pw, ph }); const k = 72 / 25.4;
    this.cur.push(`q ${(w * k).toFixed(2)} 0 0 ${(h * k).toFixed(2)} ${(x * k).toFixed(2)} ${(842 - (y + h) * k).toFixed(2)} cm /Im${n} Do Q`); }
  blob() {
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0; const put = x => { const b = typeof x === 'string' ? Uint8Array.from(x, c => c.charCodeAt(0) & 255) : x; parts.push(b); len += b.length; };
    const objs = []; const obj = body => { objs.push(body); return objs.length; };
    const F1 = obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'), F2 = obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const imgIds = this.imgs.map(im => obj({ head: `<< /Type /XObject /Subtype /Image /Width ${im.pw} /Height ${im.ph} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.b.length} >>`, data: im.b }));
    const res = `<< /Font << /F1 ${F1} 0 R /F2 ${F2} 0 R >> /XObject << ${imgIds.map((id, i) => `/Im${i} ${id} 0 R`).join(' ')} >> >>`;
    const pagesId = objs.length + 1 + this.pages.length * 2; const kids = [];
    this.pages.forEach(pg => { const c = pg.join('\n'); const cid = obj({ head: `<< /Length ${c.length} >>`, data: c }); kids.push(obj(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources ${res} /Contents ${cid} 0 R >>`)); });
    obj(`<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`); const cat = obj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    put('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n');
    objs.forEach((o, i) => { offs.push(len); put(`${i + 1} 0 obj\n`); if (typeof o === 'string') put(o); else { put(o.head + '\nstream\n'); put(o.data); put('\nendstream'); } put('\nendobj\n'); });
    const xref = len; put(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
    put(`trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, { type: 'application/pdf' });
  }
}
async function toJpeg(url, maxW = 1600) { const im = await loadImage(url), k = Math.min(1, maxW / im.width), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
  const b64 = c.toDataURL('image/jpeg', 0.88).split(',')[1], bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return { bytes, w: c.width, h: c.height }; }
/* ---- PDF summary: cover render, room schedule, 2D plan, sun & Vastu hints ---- */
async function exportPDF() {
  const doc = new MiniPDF(), W = 210, M = 14, sch = roomSchedule(), sv = sunVastu(); let y = 20;
  const brk = h => { if (y + h > 284) { doc.addPage(); y = 18; } };
  const para = (t, size = 10, bold = false, rgb) => doc.wrap(t, size, W - 2 * M).forEach(l => { brk(size * 0.5); doc.text(M, y, l, size, bold, rgb); y += size * 0.47; });
  doc.rect(0, 0, W, 6, [0.36, 0.24, 1]); para('DIMORA — Home summary', 20, true, [0.36, 0.24, 1]); y += 1;
  para(`${P().name} · ${new Date().toLocaleDateString('en-IN')} · built-up area ${sch.built.toLocaleString('en-IN')} sq ft`, 10.5, false, [0.4, 0.4, 0.45]); y += 3;
  try { const hc = homeCam(); const j = await toJpeg(renderWith(S.project, hc.pos, hc.target, 1400, 790)); const h = (W - 2 * M) * j.h / j.w; doc.image(j.bytes, j.w, j.h, M, y, W - 2 * M, h); y += h + 7; } catch (e) { }
  para('Rooms and areas', 13, true); y += 1; const cx = [M, 82, 132, W - M];
  [['Room', 0], ['Type', 1], ['Size (ft)', 2]].forEach(([t, i]) => doc.text(cx[i], y, t, 9.5, true)); doc.text(cx[3], y, 'Area (sq ft)', 9.5, true, undefined, 'right'); y += 2; doc.rect(M, y, W - 2 * M, 0.3, [0.7, 0.7, 0.75]); y += 4.5;
  sch.rows.forEach(x => { brk(5); doc.text(cx[0], y, x.name.slice(0, 32), 9.5); doc.text(cx[1], y, x.type.slice(0, 24), 9.5, false, [0.35, 0.35, 0.4]); doc.text(cx[2], y, x.size, 9.5); doc.text(cx[3], y, x.sqft.toLocaleString('en-IN'), 9.5, false, undefined, 'right'); y += 5; });
  doc.rect(M, y - 3.6, W - 2 * M, 5.4, [0.93, 0.91, 1]); doc.text(cx[0] + 1, y, 'Total built-up area', 10, true); doc.text(cx[3], y, `${sch.built.toLocaleString('en-IN')} sq ft`, 10, true, undefined, 'right'); y += 9;
  try { const g0 = P().floors.findIndex(f => f.level === Math.min(...P().floors.map(q => q.level))); const j = await toJpeg(drawPlanImage(P(), g0).url, 1400);
    doc.addPage(); y = 18; para('2D plan', 13, true); y += 2; const maxH = 200, w0 = W - 2 * M, h0 = Math.min(maxH, w0 * j.h / j.w), w1 = h0 * j.w / j.h; doc.image(j.bytes, j.w, j.h, M + (w0 - w1) / 2, y, w1, h0); y += h0 + 8; } catch (e) { }
  brk(30); para('Sunlight & Vastu hints — general guidance only', 13, true); y += 1;
  if (sv.door) para('Main door: ' + sv.door.note, 9.5);
  sv.rooms.forEach(x => para(`• ${x.r.name}: ${x.zone} zone · ${x.morning}${x.v ? ' · Vastu: ' + { good: 'ideal', ok: 'acceptable', consider: 'consider' }[x.v] : ''}`, 9.5));
  y += 2; para('These are traditional rules of thumb and simple sun paths from the north arrow — not professional, structural or religious advice.', 8.5, false, [0.45, 0.45, 0.5]);
  para('Made with DIMORA · Powered by Cloudflare Workers AI', 8.5, false, [0.45, 0.45, 0.5]);
  download(doc.blob(), `${fileSafe(P().name)}-summary.pdf`);
}
/* ---- view-only share link ---- */
async function shareLink() {
  const out = $('#share-out'); if (out) out.innerHTML = '<p class="muted">Creating a view-only link…</p>';
  try { const pj = deep(P()); delete pj.planImage; delete pj.chat; const r = await API.req('/api/share', { body: { project: pj, name: pj.name } });
    const url = (/^https?:$/.test(location.protocol) ? location.origin + location.pathname : API.base() + '/') + '?view=' + r.id;
    try { await navigator.clipboard.writeText(url); } catch (e) { }
    if (out) out.innerHTML = `<div class="share-box"><input readonly value="${esc(url)}" onclick="this.select()"><a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">Open</a></div><p class="muted">Copied. Anyone with this link can look around the home in 3D (they can't edit it).</p>`;
  } catch (e) { if (out) out.innerHTML = `<div class="mr-err">Could not create the link: ${esc(e.message)}</div>`; }
}
async function openShared(id) {
  try { const r = await API.req('/api/share/' + encodeURIComponent(id), { timeout: 20000 });
    S.project = r.project; S.viewOnly = true; S.history = []; S.future = []; S.variants = []; $('#app').classList.add('view-only');
    openWorkspace(false); $('#app').classList.remove('chat-open');
    const bn = document.createElement('div'); bn.className = 'view-banner'; bn.innerHTML = `👁 View-only home shared with DIMORA · <a href="${location.pathname}">Make your own 3D home free →</a>`; document.body.appendChild(bn);
  } catch (e) { toast('This share link could not be opened: ' + e.message, 5000); }
}

/* ---- "Give me 3 layout ideas" ---- */
function ideaFallback(budget, family, style) { // works without the AI: three clearly different, previewable options
  const th = Object.keys(THEMES), pick = n => th.includes(n) ? n : th[0], kids = /kid|child|4|5|6|joint/i.test(family);
  const store = allRooms().find(r => r.type === 'store' || r.type === 'utility'), spare = allRooms().filter(r => ['bedroom', 'guest'].includes(r.type)).slice(-1)[0];
  return [
    { title: 'Budget smart', summary: 'Durable, easy-care finishes and essential furniture — the most home for the money.', theme: pick('Modern'), tier: 'budget', changes: [], cost_note: budget || 'lowest cost' },
    { title: kids ? 'Family friendly' : 'Work from home', summary: kids ? 'Soft corners, more storage and a study corner for children.' : 'A quiet room becomes a home office with good daylight.', theme: pick(style && THEMES[style] ? style : 'Japandi'), tier: 'standard',
      changes: kids && store ? [{ room: store.name, to: 'study' }] : !kids && spare ? [{ room: spare.name, to: 'office' }] : [], cost_note: 'mid-range' },
    { title: 'Indian premium', summary: 'Carved teak, brass and patterned tiles with premium furniture for a warm heritage feel.', theme: pick('Modern Traditional Indian'), tier: 'premium', changes: [], cost_note: 'premium' },
  ];
}
function openIdeas() {
  $('#modal-card').innerHTML = `<button class="x" data-act="modal-close" aria-label="Close">✕</button><p class="eyebrow">Powered by Cloudflare Workers AI</p><h2>💡 Give me 3 layout ideas</h2>
  <div class="idea-form"><label class="field">Budget<select id="idea-budget"><option>Under ₹5 lakh</option><option selected>₹5–10 lakh</option><option>₹10–20 lakh</option><option>₹20 lakh +</option></select></label>
  <label class="field">Family<select id="idea-family"><option>Couple</option><option selected>Couple + 1–2 kids</option><option>Joint family (5–6)</option><option>Working professionals</option><option>Senior parents at home</option></select></label>
  <label class="field">Style<select id="idea-style">${Object.keys(THEMES).map(t => `<option ${t === P().theme ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
  <button class="btn primary" data-act="ideas-go">Get ideas</button></div><div id="idea-out" class="idea-grid"></div>`;
  $('#modal-card').classList.add('wide'); $('#modal').classList.add('on');
}
async function ideasGo() {
  const budget = $('#idea-budget').value, family = $('#idea-family').value, style = $('#idea-style').value, out = $('#idea-out');
  out.innerHTML = '<div class="mr-status"><span class="mr-spin"></span><span>Thinking of three different ideas for your home…</span></div>';
  let ideas, via = 'Cloudflare AI';
  try { ideas = (await API.req('/api/ai/ideas', { body: { budget, family, style, styles: Object.keys(THEMES), rooms: allRooms().map(r => ({ name: r.name, type: r.type, w: r.w, d: r.d })) }, timeout: 60000 })).ideas; }
  catch (e) { ideas = ideaFallback(budget, family, style); via = 'DIMORA (offline)'; }
  S.ideas = ideas;
  out.innerHTML = ideas.map((x, i) => `<div class="idea-card"><b>${esc(x.title)}</b><p>${esc(x.summary)}</p><p class="muted">${esc(x.theme)} · ${esc(x.tier)} furniture${x.cost_note ? ' · ' + esc(x.cost_note) : ''}</p>
    ${x.changes.length ? `<ul>${x.changes.map(c => `<li>${esc(c.room)} → ${esc((ROOM_TYPES[c.to] || {}).label || c.to)}</li>`).join('')}</ul>` : ''}<button class="btn primary" data-act="idea-apply" data-i="${i}">Preview in 3D</button></div>`).join('') + `<p class="muted idea-via">Ideas by ${via}. Preview changes the home — press Undo to go back.</p>`;
}
function applyIdea(i) {
  const x = (S.ideas || [])[i]; if (!x) return; commit('Layout idea: ' + x.title);
  x.changes.forEach(c => { const r = allRooms().find(q => q.name.toLowerCase() === String(c.room).toLowerCase()); if (r && ROOM_TYPES[c.to] && !isOpenAir(r)) transformRoom(r, c.to); });
  if (THEMES[x.theme]) applyTheme(x.theme); allRooms().forEach(r => { r.tier = x.tier; r.furniture.forEach(it => it.tier = x.tier); });
  rebuild(); save(); $('#modal').classList.remove('on'); $('#modal-card').classList.remove('wide'); toast(`Previewing “${x.title}” — press Undo to go back.`, 4500);
}
/* ===================== PROPERTY SHOWCASE: a cinematic scroll story of the home (for buyers, builders, judges) =====================
   Its own full-screen 3D engine; scrolling moves the camera through keyframes: street view at dusk → the plot from above →
   the roof lifts (upper floors rise) → dollhouse → room by room at eye level → night finale. Nothing in the project changes. */
const SC = { duskHour: 18.0, E: null, on: false, proj: null, secs: [], t: 0, tt: 0, built: null, floorGroups: new Map(), roofGroups: [], photos: {}, viewer: false, raf: 0 };
const scEase = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, scLerp = (a, b, t) => a + (b - a) * t, scL3 = (a, b, t) => [scLerp(a[0], b[0], t), scLerp(a[1], b[1], t), scLerp(a[2], b[2], t)];
function withSC(fn, o = {}) {
  const keep = { E, P: S.project, cut: S.cutaway, roof: S.roof, hour: S.hour, sel: S.sel, view: S.view, ds: S.daylightSim, tour: S.touring, labels: S.labels, all: S.showAllFloors, ex: S.explode };
  E = SC.E; S.project = SC.proj; S.cutaway = false; S.roof = true; S.hour = o.hour ?? 11; S.sel = null; S.view = '3d'; S.daylightSim = false; S.touring = false; S.labels = false; S.showAllFloors = true; S.explode = false;
  try { return fn(); } finally { E = keep.E; S.project = keep.P; S.cutaway = keep.cut; S.roof = keep.roof; S.hour = keep.hour; S.sel = keep.sel; S.view = keep.view; S.daylightSim = keep.ds; S.touring = keep.tour; S.labels = keep.labels; S.showAllFloors = keep.all; S.explode = keep.ex; }
}
/* build the whole home once for a light ('dusk' = warm lit windows, 'day' = bright interiors), remembering which parts belong to which floor */
function scBuild(light) {
  if (SC.built === light) return; SC.built = light;
  withSC(() => {
    E.clear(); const pj = S.project, b = homeBounds(); SC.floorGroups = new Map(); SC.roofGroups = [];
    pj.floors.forEach(f => { if (floorAbove(f)) fitStairs(f); });
    const site = buildSite(b);
    buildNeighbourhood();
    if (E.quality !== 'low') buildGrass(site);
    buildDeck();
    pj.floors.slice().sort((a, c) => a.level - c.level).forEach(f => { const before = new Set(E.groups.keys()); buildFloor(f, false); buildPlinth(f);
      const mine = [...E.groups.values()].filter(g => !before.has(g.id)); mine.forEach(g => { g.baseY = g.y; });
      SC.floorGroups.set(f.id, mine.filter(g => !/^roof:/.test(g.id))); SC.roofGroups.push(...mine.filter(g => /^roof:/.test(g.id))); });
    applyEnv(); E.dirty = true;
  }, { hour: light === 'dusk' ? (SC.proj.facade === 'courtyard' ? GOLDEN_HOUR : SC.duskHour) : 10.8 });
}
/* lift the roof (0..1) and the floors above `focus` (0..1) — moves groups, no rebuild */
function scLift(roof, floors, focusLevel) {
  const pj = SC.proj, top = Math.max(...pj.floors.map(f => f.level));
  SC.roofGroups.forEach(g => { g.y = g.baseY + roof * 9; g.visible = roof < 0.98; g.dirtyM = true; });
  pj.floors.forEach(f => { const up = f.level > focusLevel ? floors * (4.5 + (f.level - focusLevel) * 1.5) : 0;
    (SC.floorGroups.get(f.id) || []).forEach(g => { g.y = g.baseY + up; g.visible = !(f.level > focusLevel && floors > 0.98 && f.level === top && false); g.dirtyM = true; }); });
  SC.E.dirty = true;
}
function scRooms(pj) {
  const order = ['living', 'dining', 'kitchen', 'master', 'bedroom', 'guest', 'study', 'office', 'pooja', 'bathroom'], out = [];
  order.forEach(t => pj.floors.slice().sort((a, b) => a.level - b.level).forEach(f => f.rooms.filter(r => r.type === t && !isOpenAir(r) && area(r) > 3).forEach(r => out.push({ r, f }))));
  const seenBath = []; return out.filter(x => x.r.type !== 'bathroom' || (seenBath.push(1) <= 1)).slice(0, 7);
}
/* the story: sections with camera keyframes; built from the home's size, its front side and its rooms */
function scPlan() {
  const pj = SC.proj; let secs = [];
  withSC(() => {
    const hb = houseBounds() || homeBounds(), b = homeBounds(), c = [hb.x + hb.w / 2, 0, hb.y + hb.d / 2], ground = pj.floors.slice().sort((a, q) => a.level - q.level)[0];
    const totH = pj.floors.reduce((s, f) => s + f.height + 0.25, 0), md = ground && ground.doors.find(d => d.main);
    let side = (P().site && P().site.road) || (md ? (md.o === 'h' ? (Math.abs(md.y - hb.y) < Math.abs(md.y - hb.y - hb.d) ? 'N' : 'S') : (Math.abs(md.x - hb.x) < Math.abs(md.x - hb.x - hb.w) ? 'W' : 'E')) : 'S');
    const fwd = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[side] || [0, 1], rt = [-fwd[1], fwd[0]];
    const span = Math.max(hb.w, hb.d), at = (u, v, y) => [c[0] + fwd[0] * u + rt[0] * v, y, c[2] + fwd[1] * u + rt[1] * v];
    const D = span * 0.55 + 9, ph = plinthH();
    const park = allRooms().find(r => r.type === 'parking' || r.type === 'garage'), sv = park ? Math.sign(((park.x + park.w / 2) - c[0]) * rt[0] + ((park.y + park.d / 2) - c[2]) * rt[1]) || 1 : 1;
    const tgtH = [c[0], totH * 0.45, c[2]];
    // a low drone shot from the open side of the plot, gently pushing in
    const street0 = { pos: at(D * 1.25, sv * span * 0.75, totH + 4.2), target: at(span * 0.1, sv * span * 0.05, totH * 0.3), fov: 42 }, street1 = { pos: at(D * 0.95, sv * span * 0.45, totH + 2.6), target: at(span * 0.05, 0, totH * 0.3), fov: 42 };
    const air0 = { pos: at(D * 1.5, -span * 0.9, span * 1.05 + totH), target: [c[0], 0, c[2]], fov: 45 }, air1 = { pos: at(D * 1.15, span * 0.75, span * 0.95 + totH), target: [c[0], 0.3, c[2]], fov: 45 };
    const doll0 = { pos: at(span * 0.95, span * 0.8, span * 1.05 + 3), target: [c[0], 0.6, c[2]], fov: 45 }, doll1 = { pos: at(-span * 0.2, span * 1.15, span * 1.15 + 3), target: [c[0], 0.6, c[2]], fov: 45 };
    const sch = roomSchedule(), beds = allRooms().filter(r => ['bedroom', 'master', 'guest', 'nursery'].includes(r.type)).length, baths = allRooms().filter(r => r.type === 'bathroom').length;
    const plot = P().site && P().site.plot, outs = allRooms().filter(r => isYard(r) || ['porch', 'balcony'].includes(r.type));
    const wide = innerWidth > 860, slide = (k, m) => { if (!wide) return k; const d = V3.norm(V3.sub(k.target, k.pos)), r2v = V3.norm([-d[2], 0, d[0]]); return { pos: V3.add(k.pos, V3.scale(r2v, m)), target: V3.add(k.target, V3.scale(r2v, m)), fov: k.fov }; };
    const heroA = slide(street0, -span * 0.38), heroB = slide(street1, -span * 0.3); // house on the right, title on the left
    secs.push({ id: 'hero', h: 1.25, light: 'dusk', k: [heroA, heroB], ui: 'hero', beds, baths, sqft: sch.built, side });
    secs.push({ id: 'site', h: 1.1, light: 'dusk', k: [heroB, air0], ui: 'site', plot, outs, fade: [0.45, 0.6] });
    secs.push({ id: 'reveal', h: 1.3, light: 'day', k: [air0, air1], ui: 'reveal', roof: [0.25, 0.85], floors: [0.45, 0.95] });
    const dollA = slide(air1, span * 0.32), dollB = slide(doll1, span * 0.32);
    secs.push({ id: 'doll', h: 1.5, light: 'day', k: [air1, dollA, dollB], three: true, ui: 'doll', roof: [1, 1], floors: [1, 1], sch, beds, baths });
    scRooms(pj).forEach(({ r, f }, i) => { const sh = roomShot(r); const dir = V3.norm(V3.sub(sh.target, sh.pos));
      const k0 = { pos: sh.pos, target: sh.target, fov: 62 }, k1 = { pos: V3.add(sh.pos, V3.scale([dir[0], 0, dir[2]], Math.min(0.9, Math.min(r.w, r.d) * 0.18))), target: sh.target, fov: 58 };
      secs.push({ id: 'room:' + r.id, h: 1.15, light: 'day', k: i === 0 ? [dollB, k0, k1] : [k0, k1], swoop: i === 0, ui: 'room', r, f, level: f.level, roof: [1, 1], floors: [1, 1], cut: i > 0 }); });
    if (!SC.viewer || Object.keys(SC.photos).length) secs.push({ id: 'gallery', h: 1.7, light: 'dusk', k: [air1, air1], ui: 'gallery', cut: true });
    secs.push({ id: 'finale', h: 1.2, light: 'dusk', k: [air1, { pos: at(D * 1.6, -span * 0.5, span * 0.7 + totH), target: tgtH, fov: 44 }], ui: 'finale', cut: true });
  });
  let acc = 0; secs.forEach(x => { x.y0 = acc; acc += x.h; x.y1 = acc; }); secs.forEach(x => { x.p0 = x.y0 / acc; x.p1 = x.y1 / acc; }); SC.total = acc; return secs;
}
function scCamAt(sec, u) { // camera within a section (u = 0..1), through its keyframes
  const k = sec.k, n = k.length - 1; let a, b, t;
  if (sec.swoop) { if (u < 0.45) { a = k[0]; b = k[1]; t = scEase(u / 0.45); } else { a = k[1]; b = k[2]; t = (u - 0.45) / 0.55; } }
  else if (sec.three) { if (u < 0.25) { a = k[0]; b = k[1]; t = scEase(u / 0.25); } else { a = k[1]; b = k[2]; t = scEase((u - 0.25) / 0.75); } }
  else { a = k[0]; b = k[n]; t = n === 1 ? scEase(u) : u; }
  return { pos: scL3(a.pos, b.pos, t), target: scL3(a.target, b.target, t), fov: scLerp(a.fov, b.fov, t) };
}
const scBand = (u, [a, b]) => clamp((u - a) / Math.max(1e-6, b - a), 0, 1);
function scFrame() {
  if (!SC.on) return; const e = SC.E, secs = SC.secs; SC.t += (SC.tt - SC.t) * 0.14; if (Math.abs(SC.tt - SC.t) < 1e-4) SC.t = SC.tt;
  const p = SC.t, i = Math.max(0, secs.findIndex(x => p >= x.p0 && p <= x.p1)), sec = secs[i] || secs[0], u = clamp((p - sec.p0) / (sec.p1 - sec.p0), 0, 1);
  // light: switch builds at a dark moment
  const wantLight = sec.light; let veil = 0;
  if (sec.id === 'site') veil = Math.max(0, 1 - Math.abs(u - 0.82) / 0.18) * (u > 0.64 ? 1 : 0), SC.built !== (u > 0.82 ? 'day' : 'dusk') && scBuild(u > 0.82 ? 'day' : 'dusk');
  else if (sec.id === 'finale') { veil = Math.max(0, 1 - u / 0.14); if (SC.built !== 'dusk' && u > 0.02) scBuild('dusk'); }
  else if (SC.built !== wantLight) scBuild(wantLight);
  if (sec.ui === 'gallery') veil = 1;
  if (sec.ui === 'room' && sec.cut) veil = Math.max(veil, Math.max(0, 1 - u / 0.12)); // a soft dip to black between rooms
  const nx = secs[i + 1]; if (nx && nx.ui === 'room' && nx.cut && u > 0.9) veil = Math.max(veil, (u - 0.9) / 0.1);
  if (sec.id === 'site') { const cam = scCamAt(sec, scEase(u)); Object.assign(e.cam, { pos: cam.pos, target: cam.target }); e.cam.fov = cam.fov * Math.PI / 180; }
  else { const cam = scCamAt(sec, u); e.cam.pos = cam.pos; e.cam.target = cam.target; e.cam.fov = cam.fov * Math.PI / 180; }
  const focus = sec.level != null ? sec.level : Math.min(...SC.proj.floors.map(f => f.level));
  const roof = sec.roof ? (sec.id === 'reveal' ? scEase(scBand(u, sec.roof)) : 1) : 0, fl = sec.floors ? (sec.id === 'reveal' ? scEase(scBand(u, sec.floors)) : 1) : 0;
  scLift(roof, SC.proj.floors.length > 1 ? fl : 0, focus);
  e.dirty = true; e.render(); e.dirty = false;
  $('#sc-veil').style.opacity = veil.toFixed(3);
  scUI(sec, u, i);
}
/* text and cards for the current section, faded by progress */
function scUI(sec, u, i) {
  const fade = (a, b, c, d) => u < a ? 0 : u < b ? (u - a) / (b - a) : u < c ? 1 : u < d ? 1 - (u - c) / (d - c) : 0;
  const op = { hero: fade(-1, 0, 0.62, 0.86), site: fade(0.12, 0.26, 0.5, 0.62), reveal: fade(0.5, 0.7, 0.92, 1.01), doll: fade(0, 0.12, 0.86, 0.98), room: fade(0.14, 0.3, 0.8, 0.92), gallery: fade(0.02, 0.1, 0.9, 0.99), finale: fade(0.35, 0.6, 2, 3) };
  $$('#sc-root [data-sc]').forEach(el => { const on = el.dataset.sc === sec.id || (el.dataset.sc === 'room' && sec.ui === 'room'); el.style.opacity = on ? (op[sec.ui] ?? 1).toFixed(3) : 0; el.style.pointerEvents = on && (op[sec.ui] ?? 1) > 0.5 ? 'auto' : 'none'; });
  if (sec.ui === 'room' && SC.roomShown !== sec.id) { SC.roomShown = sec.id; const r = sec.r, ft = toFt(r.w), fd = toFt(r.d), L = analyzeLight(r, sec.f);
    $('#sc-room-name').textContent = r.name; $('#sc-room-meta').textContent = `${ftTxt(r.w)} × ${ftTxt(r.d)} · ${Math.round(ft * fd).toLocaleString('en-IN')} sq ft${SC.proj.floors.length > 1 ? ' · ' + sec.f.name : ''}`;
    $('#sc-room-note').textContent = L.dirs.length ? `Daylight from the ${L.dirs.join(' & ')} window${L.dirs.length > 1 ? 's' : ''} · ${ROOM_TYPES[r.type].label}` : ROOM_TYPES[r.type].label;
  }
  // photoreal layer (AI photos made for this showcase): the exterior over the opening shot, each room once the camera has arrived
  const key = sec.ui === 'room' ? sec.r.id : sec.ui === 'hero' ? 'exterior' : null, ph = key && SC.photos[key], pl = $('#sc-photo');
  if (pl.dataset.key !== (ph ? key : '')) { pl.dataset.key = ph ? key : ''; pl.style.backgroundImage = ph ? `url(${ph})` : 'none'; }
  const pin = sec.swoop ? 0.4 : 0.05, pa = !ph ? 0 : sec.ui === 'hero' ? 1 - clamp((u - 0.55) / 0.3, 0, 1) : clamp((u - pin) / 0.12, 0, 1) * (u > 0.95 ? 1 - (u - 0.95) / 0.05 : 1);
  pl.style.opacity = pa.toFixed(3); pl.style.transform = `scale(${(1.0 + 0.08 * (sec.ui === 'hero' ? u : clamp((u - pin) / (1 - pin), 0, 1))).toFixed(4)})`;
  $('#sc-root').classList.toggle('sc-photo-on', pa > 0.6); $('#sc-root').classList.toggle('sc-in-gallery', sec.ui === 'gallery');
  if (sec.ui === 'gallery') scGallery(u);
  const pill = $('#sc-real'); if (pill) pill.style.display = SC.viewer || Object.keys(SC.photos).length ? 'none' : '';
  // hotspot on the house in the hero: a dot on the facade with its card
  const hs = $('#sc-hot'); if (sec.ui === 'hero' || sec.ui === 'site') { const hb = SC.hb; const q = SC.E.project([hb.c[0], hb.h * 0.55, hb.c[2]]);
    if (q) { hs.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px)`; } }
  $$('#sc-rail button').forEach((b2, k) => b2.classList.toggle('on', +b2.dataset.i === SC.secs.indexOf(sec) || (b2.dataset.grp === 'rooms' && sec.ui === 'room')));
  $('#sc-progress').style.transform = `scaleX(${SC.t.toFixed(4)})`;
}
function scHTML() {
  const pj = SC.proj, sch = roomSchedule(), hero = SC.secs[0], doll = SC.secs.find(x => x.id === 'doll'), plot = SC.secs[1].plot, outs = SC.secs[1].outs;
  const bhk = `${hero.beds}BHK`, multi = pj.floors.length > 1, floorsTxt = multi ? `G+${pj.floors.length - 1}` : 'Single storey';
  const roomsList = sch.rows.filter(x => x.built).slice(0, 14).map(x => `<li><span>${esc(x.name)}</span><b>${x.size}</b></li>`).join('');
  const roomSecs = SC.secs.filter(x => x.ui === 'room');
  const rail = [['Home', 0], ['Plot', 1], ['Floor plan', SC.secs.indexOf(doll)], ['Rooms', SC.secs.indexOf(roomSecs[0]), 'rooms'], ['Gallery', SC.secs.findIndex(x => x.id === 'gallery')], ['Visit', SC.secs.length - 1]].filter(x => x[1] >= 0);
  const fl = SC.proj.floors.slice().sort((a, b) => a.level - b.level).map(f => { const rs = f.rooms.filter(r => !isOpenAir(r)); const sq = rs.reduce((s2, r) => s2 + toFt(r.w) * toFt(r.d), 0);
    return `<li><b>${esc(f.name)}</b><span>${rs.length} rooms · ${Math.round(sq).toLocaleString('en-IN')} sq ft</span></li>`; }).join('');
  return `<div class="sc-stage"><canvas id="sc-gl"></canvas><div id="sc-photo" class="sc-photo"></div><div id="sc-veil" class="sc-veil"></div></div>
  <header class="sc-top"><div class="sc-brand"><span class="sc-mark">◇</span><b>${esc(pj.name)}</b><i>Presented with DIMORA</i></div>
    <nav>${rail.map(([n, i, g]) => `<button data-act="sc-go" data-i="${i}">${n}</button>`).join('')}</nav>
    <div class="sc-top-r">${SC.viewer ? '' : `<button class="sc-ghost sc-mk" data-act="sc-photos-all" title="Cloudflare AI makes a photoreal picture of the outside and of every room">✨ ${Object.keys(SC.photos).length ? 'Remake photos' : 'Make it photoreal'}</button>`}<button class="sc-gold" data-act="sc-visit">Book a visit</button><button class="sc-x" data-act="sc-close" aria-label="Close showcase">✕</button></div></header>
  <div id="sc-progress" class="sc-progress"></div>
  <div id="sc-rail" class="sc-rail">${rail.map(([n, i, g]) => `<button data-act="sc-go" data-i="${i}" ${g ? `data-grp="${g}"` : ''} aria-label="${n}"><i></i><span>${n}</span></button>`).join('')}</div>
  <section class="sc-ui sc-hero" data-sc="hero"><p class="sc-eyebrow">${esc(floorsTxt)} · ${esc(bhk)} residence</p><h1>${esc(pj.name)}</h1>
    <p class="sc-sub">${sch.built.toLocaleString('en-IN')} sq ft built-up · ${hero.beds} bedroom${hero.beds === 1 ? '' : 's'} · ${hero.baths} bath${hero.baths === 1 ? '' : 's'}${plot ? ` · plot ${Math.round(toFt(plot.w))} × ${Math.round(toFt(plot.d))} ft` : ''}</p>
    <p class="sc-scroll">Scroll to step inside <span>↓</span></p>
    ${SC.viewer ? '' : `<button id="sc-real" class="sc-real" data-act="sc-photos-all"><b>✨ Make it photoreal</b><span>Cloudflare AI turns the outside and every room into a real-looking photo, like an architect's render — about ${SC.secs.filter(x => x.ui === 'room').length + 1} photos, a minute or two.</span></button>`}</section>
  <div id="sc-status" class="sc-status" role="status" aria-live="polite"></div>
  <div id="sc-hot" class="sc-hot" data-sc="hero"><i></i><div class="sc-card"><small>${multi ? 'Floors' : 'Residence'}</small><b>${esc(bhk)} · ${sch.built.toLocaleString('en-IN')} sq ft</b><span>${hero.beds} bed · ${hero.baths} bath · ${esc(floorsTxt)}</span><button data-act="sc-go" data-i="${SC.secs.indexOf(doll)}">View the floor plan →</button></div></div>
  <section class="sc-ui sc-side" data-sc="site"><p class="sc-eyebrow">The plot</p><h2>${plot ? `${Math.round(toFt(plot.w))} × ${Math.round(toFt(plot.d))} ft` : 'Room to breathe'}</h2>
    <ul class="sc-list">${outs.slice(0, 6).map(r => `<li><span>${esc(r.name)}</span><b>${ftTxt(r.w)} × ${ftTxt(r.d)}</b></li>`).join('')}</ul></section>
  <section class="sc-ui sc-side" data-sc="reveal"><p class="sc-eyebrow">Inside</p><h2>Every room, true to the plan.</h2><p class="sc-p">Read from the drawing by AI and built to scale — walls, doors, windows and furniture.</p></section>
  <section class="sc-ui sc-panel" data-sc="doll"><p class="sc-eyebrow">${multi ? 'Floors' : 'Floor plan'}</p><h2>${esc(bhk)} · ${sch.built.toLocaleString('en-IN')} sq ft</h2>
    ${multi ? `<ul class="sc-list">${fl}</ul>` : ''}<ul class="sc-list sc-rooms">${roomsList}</ul><p class="sc-fine">Sizes in feet. Built-up area excludes balcony, porch, parking and garden.</p></section>
  <section class="sc-ui sc-caption" data-sc="room"><p class="sc-eyebrow" id="sc-room-note"></p><h2 id="sc-room-name"></h2><p class="sc-sub" id="sc-room-meta"></p>
    ${SC.viewer ? '' : '<button class="sc-ghost" data-act="sc-photo">✨ Make it Real</button>'}</section>
  <section class="sc-ui sc-gallery" data-sc="gallery"><div class="sc-gal-head"><p class="sc-eyebrow">The residence</p><h2>Every room, as it will feel.</h2></div><div id="sc-strip" class="sc-strip"></div></section>
  <section class="sc-ui sc-finale" data-sc="finale"><p class="sc-eyebrow">${esc(pj.name)}</p><h2>Like what you see?</h2>
    <div class="sc-cta"><button class="sc-gold" data-act="sc-visit">Book a visit</button><button class="sc-ghost" data-act="sc-share">Share this showcase</button>${SC.viewer ? '<a class="sc-ghost" href="./">Make your own with DIMORA</a>' : '<button class="sc-ghost" data-act="sc-close">Back to editing</button>'}</div>
    <p class="sc-fine" id="sc-share-out">3D home made from a 2D floor plan with DIMORA · Powered by Cloudflare Workers AI</p></section>
  <div class="sc-scroll-space" style="height:${(SC.total * 100).toFixed(1)}vh"></div>`;
}
async function openShowcase(opts = {}) {
  if (!S.project) return; const el = $('#sc-root') || Object.assign(document.createElement('div'), { id: 'sc-root' }); document.body.appendChild(el);
  SC.proj = S.project; SC.viewer = !!opts.viewer; SC.built = null; SC.roomShown = null; SC.photos = Object.assign({}, SC.proj.showcasePhotos || {}); SC.busy = false; SC.galKey = null;
  SC.secs = scPlan(); el.innerHTML = scHTML(); el.classList.add('on'); document.body.classList.add('sc-open'); el.scrollTop = 0; SC.t = SC.tt = 0;
  try { SC.E = new Engine($('#sc-gl')); } catch (e) { el.classList.remove('on'); document.body.classList.remove('sc-open'); toast('The showcase needs WebGL2 (a recent Chrome, Edge, Safari or Firefox).'); return; }
  withSC(() => { const hb = houseBounds() || homeBounds(), tot = SC.proj.floors.reduce((s2, f) => s2 + f.height + 0.25, 0); SC.hb = { c: [hb.x + hb.w / 2, 0, hb.y + hb.d / 2], h: tot }; });
  SC.E.matHook = upgradeMaterial;
  SC.E.onAsset = url => {
    if (url !== DEFENDER_MODEL || !SC.on || SC.E !== engine) return;
    const light = SC.built;
    SC.built = null;
    scBuild(light);
  };
  const engine = SC.E;
  SC.on = true; scBuild('dusk');
  el.onscroll = () => { SC.tt = clamp(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight), 0, 1); };
  const loop = () => { if (!SC.on) return; if (Math.abs(SC.tt - SC.t) > 1e-4 || SC.E.dirty || !SC.drawn) { scFrame(); SC.drawn = true; } SC.raf = requestAnimationFrame(loop); };
  SC.drawn = false; cancelAnimationFrame(SC.raf); SC.raf = requestAnimationFrame(loop);
  SC.onKey = e => { if (e.key === 'Escape' && !SC.viewer) closeShowcase(); }; document.addEventListener('keydown', SC.onKey);
  SC.onResize = () => { if (SC.E) SC.E.dirty = true; }; window.addEventListener('resize', SC.onResize);
}
function closeShowcase() {
  SC.on = false; cancelAnimationFrame(SC.raf); document.removeEventListener('keydown', SC.onKey); window.removeEventListener('resize', SC.onResize);
  const el = $('#sc-root'); if (el) { el.classList.remove('on'); el.innerHTML = ''; } document.body.classList.remove('sc-open');
  if (SC.E && SC.E.gl) { try { SC.E.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch (e) { } } SC.E = null; SC.built = null; if (E) E.dirty = true;
}
function scGo(i) { const el = $('#sc-root'), sec = SC.secs[i]; if (!el || !sec) return; const p = sec.p0 + (sec.p1 - sec.p0) * (sec.ui === 'room' ? 0.4 : sec.ui === 'doll' ? 0.3 : 0.02);
  el.scrollTo({ top: p * (el.scrollHeight - el.clientHeight), behavior: 'smooth' }); }
async function scShare() {
  const out = $('#sc-share-out'); if (out) out.textContent = 'Creating a link…';
  try { const pj = deep(SC.proj); delete pj.planImage; delete pj.chat; const r = await API.req('/api/share', { body: { project: pj, name: pj.name } });
    const url = (/^https?:$/.test(location.protocol) ? location.origin + location.pathname : API.base() + '/') + '?show=' + r.id; try { await navigator.clipboard.writeText(url); } catch (e) { }
    if (out) out.innerHTML = `Link copied: <a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`; }
  catch (e) { if (out) out.textContent = 'Could not create the link: ' + e.message; }
}
async function scPhoto() { // AI photo of the current room shot, shown over the 3D and kept for this showcase
  const sec = SC.secs.find(x => x.ui === 'room' && SC.t >= x.p0 && SC.t <= x.p1); if (!sec) return; const btn = $('#sc-root [data-act="sc-photo"]');
  if (btn) { btn.disabled = true; btn.textContent = '✨ Making the photo…'; }
  try { const shot = SC.E.snapshot(1280, 720); const res = await API.req('/api/ai/make-real', { body: { image: shot, view: 'interior', room: sec.r.name, style: (THEMES[SC.proj.theme] ? SC.proj.theme : 'modern') + ' interior', look: 'showcase' }, timeout: 150000 });
    SC.photos[sec.r.id] = await scDataUrl(res.image, 1600); if (!SC.viewer && S.project === SC.proj) { P().showcasePhotos = Object.assign({}, P().showcasePhotos || {}, { [sec.r.id]: SC.photos[sec.r.id] }); save(); }
    SC.roomShown = null; scFrame(); toast(res.left != null ? `Photo ready · ${res.left} left today` : 'Photo ready'); }
  catch (e) { toast(e.status === 429 ? e.message : 'Could not make the photo: ' + e.message, 5000); }
  finally { if (btn) { btn.disabled = false; btn.textContent = '✨ Make it Real'; } }
}
/* "Make it photoreal": one AI photo per shot — the opening exterior and every room — kept with the project */
async function scDataUrl(url, maxW = 1600) { const j = await toJpeg(url, maxW); let bin = ''; for (let i = 0; i < j.bytes.length; i += 32768) bin += String.fromCharCode(...j.bytes.subarray(i, i + 32768)); return 'data:image/jpeg;base64,' + btoa(bin); }
function scGalleryCards() { // big photo cards: the outside, then every room, each with its name and size
  const strip = $('#sc-strip'); if (!strip) return; const rooms = SC.secs.filter(x => x.ui === 'room');
  const items = [{ key: 'exterior', name: 'The house', meta: 'At dusk' }].concat(rooms.map(x => ({ key: x.r.id, name: x.r.name, meta: `${ftTxt(x.r.w)} × ${ftTxt(x.r.d)}` })));
  const have = items.filter(it => SC.photos[it.key]);
  strip.innerHTML = have.length ? have.map(it => `<figure class="sc-shot"><div style="background-image:url(${SC.photos[it.key]})"></div><figcaption><b>${esc(it.name)}</b><span>${esc(it.meta)}</span></figcaption></figure>`).join('')
    : `<button class="sc-real sc-gal-empty" data-act="sc-photos-all"><b>✨ Make it photoreal</b><span>Cloudflare AI makes a real-looking photo of the outside and of every room. They appear here, like a property brochure.</span></button>`;
  SC.galKey = Object.keys(SC.photos).sort().join();
}
function scGallery(u) {
  const strip = $('#sc-strip'); if (!strip) return; if (SC.galKey !== Object.keys(SC.photos).sort().join()) scGalleryCards();
  const over = Math.max(0, strip.scrollWidth - innerWidth + 2 * Math.min(80, innerWidth * 0.06)); strip.style.transform = `translateX(${(-over * scEase(clamp((u - 0.08) / 0.84, 0, 1))).toFixed(1)}px)`;
}
async function scMakeAll() {
  if (SC.busy || SC.viewer) return; SC.busy = true; const st = $('#sc-status'), say = (t, err) => { if (st) { st.innerHTML = t; st.classList.toggle('err', !!err); st.classList.add('on'); } };
  const style = (THEMES[SC.proj.theme] ? SC.proj.theme : 'modern') + ' interior', hero = SC.secs[0];
  const shots = [{ key: 'exterior', light: 'dusk', cam: scCamAt(hero, 0.15), view: 'exterior', room: 'front of the house at dusk', label: 'Outside' }]
    .concat(SC.secs.filter(x => x.ui === 'room').map(x => ({ key: x.r.id, light: 'day', cam: scCamAt(x, 0.5), view: 'interior', room: x.r.name, label: x.r.name })));
  const keepT = SC.t; let made = 0;
  try {
    for (let i = 0; i < shots.length; i++) { const sh = shots[i]; say(`<span class="mr-spin"></span> Making photo ${i + 1} of ${shots.length}: <b>${esc(sh.label)}</b>…`);
      scBuild(sh.light); scLift(sh.view === 'exterior' ? 0 : 1, sh.view === 'exterior' ? 0 : 1, Math.min(...SC.proj.floors.map(f => f.level)));
      SC.E.cam.pos = sh.cam.pos; SC.E.cam.target = sh.cam.target; SC.E.cam.fov = sh.cam.fov * Math.PI / 180;
      const shot = SC.E.snapshot(1280, 720); SC.E.dirty = true;
      const res = await API.req('/api/ai/make-real', { body: { image: shot, view: sh.view, room: sh.room, style, look: 'showcase' }, timeout: 150000 });
      SC.photos[sh.key] = await scDataUrl(res.image, 1600); made++;
      if (S.project === SC.proj) { P().showcasePhotos = Object.assign({}, P().showcasePhotos || {}, { [sh.key]: SC.photos[sh.key] }); }
    }
    say(`✅ ${made} photos ready — scroll through the showcase.`); setTimeout(() => st && st.classList.remove('on'), 5000);
  } catch (e) {
    say(e.status === 429 ? `${esc(e.message)}${made ? ` (${made} photos were made and kept.)` : ''}` : /token|account ID|No Cloudflare|ai_unavailable|offline/i.test(e.message + e.code)
      ? 'Photos need Cloudflare Workers AI: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN on the server (or add your own in Settings → AI).' : `Cloudflare AI could not make a photo (${esc(e.message).slice(0, 140)}). ${made ? made + ' photos were kept. ' : ''}Try again in a minute.`, true);
  } finally { SC.busy = false; if (made && S.project === SC.proj) save(); SC.built = null; SC.roomShown = null; SC.t = keepT; SC.E.dirty = true; scFrame();
    const mk = $('#sc-root .sc-mk'); if (mk && Object.keys(SC.photos).length) mk.textContent = '✨ Remake photos'; }
}
async function openSharedShowcase(id) {
  try { const r = await API.req('/api/share/' + encodeURIComponent(id), { timeout: 20000 }); S.project = r.project; S.viewOnly = true; await openShowcase({ viewer: true }); }
  catch (e) { toast('This showcase link could not be opened: ' + e.message, 5000); }
}
function siteModal(html) { $('#modal-card').innerHTML = `<button class="x" data-act="modal-close" aria-label="Close">✕</button>${html}`; $('#modal').classList.add('on'); }
function goApp(intent) {
  const u = currentUser();
  if (!u) { S.afterLogin = intent || null; show('login'); renderAuth(); return; }
  if (!u.answers?.done) { S.afterLogin = intent || null; show('intro'); renderIntro(); return; }
  if (intent === 'sample') return startSample(); if (/^example:/.test(intent || '')) return startExample(intent.slice(8)); show('dash');
}
function runAfterLogin() { const i = S.afterLogin; S.afterLogin = null; if (i === 'sample') startSample(); else if (/^example:/.test(i || '')) startExample(i.slice(8)); else show('dash'); }
/* examples gallery on the landing page: open a ready-made home in 3D, no upload */
function startExample(id) {
  if (id === '2bhk') return openExample('samples/test-plan-2bhk.json', '2BHK House — 36 × 40 ft').catch(e => toast('Could not open the example: ' + e.message));
  if (id === '2bhk-show') return openExample('samples/test-plan-2bhk.json', 'Green Court Residence').then(() => E ? openShowcase() : undefined).catch(e => toast('Could not open the showcase: ' + e.message));
  if (id === 'duplex') { S.project = sampleDuplex(); P().theme = S.prefs.style; S.history = []; S.future = []; S.variants = []; S.structuralLog = []; furnishAll(); clearStairFurniture(); stageShowcase(); S.showAllFloors = true; S.original = deep(S.project); return openWorkspace(true); }
  return startSample();
}
function startSample() { sampleHome(); P().theme = S.prefs.style; S.history = []; S.future = []; S.variants = []; S.structuralLog = []; furnishAll(); S.original = deep(S.project); openWorkspace(true); }
Object.assign(ACT, {
  start: () => goApp(), 'go-login': () => goApp(), sample: () => goApp('sample'), example: el => goApp('example:' + el.dataset.id),
  'go-landing': () => { show(PRIVATE_HOST ? 'private-home' : 'landing'); if (!PRIVATE_HOST) setTimeout(initHero, 50); },
  'explore-duplex': () => { S.exploreOnOpen = true; goApp('example:duplex'); },
  contact: (el, e) => { e && e.preventDefault(); siteModal(`<p class="eyebrow">Talk to us</p><h2>Enterprise &amp; partnerships</h2><p class="muted">Builders, architects and agencies: we'd love to set up branded showcases, team workspaces and private deployments for you.</p><p>Write to <a href="mailto:${SITE_CONFIG.contactEmail}" style="color:#22d3ee">${SITE_CONFIG.contactEmail}</a> with your team size and use case.</p><div class="row end"><button class="btn primary" data-act="modal-close">Got it</button></div>`); },
  legal: (el, e) => { e && e.preventDefault(); siteModal(el.dataset.k === 'terms' ? `<p class="eyebrow">Terms</p><h2>Terms of use</h2><p class="muted">DIMORA is a design-visualisation tool. Cost figures are illustrative estimates for Indian metro markets, not quotations. Structural and bye-law observations are indicative only. Consult a licensed architect or structural engineer before construction. AI output can be wrong; review it before acting on it.</p>` : `<p class="eyebrow">Privacy</p><h2>Your data stays with you</h2><p class="muted">Projects, preferences, your profile and your intro answers are stored in this browser's local storage. Floor plans and prompts are processed by your own DIMORA backend; they are sent to Cloudflare Workers AI when the AI is connected (or to OpenRouter / a local Ollama model if you choose those instead). With Firebase sign-in enabled, Google and Firebase process your Google account email to verify it. DIMORA has no ads and no tracking.</p>`); },
});

/* ===================== START ===================== */
boot(); window.DIMORA.HERO = HERO;
(function authStart() {
  S.panel = store.get('panel', 'design');
  const u = currentUser();
  if (PRIVATE_HOST) {
    if (new URLSearchParams(location.search).get('preview') === 'garage') {
      S.exploreOnOpen = 'garage';
      startExample('duplex');
    } else show('private-home');
    return;
  }
  if (!u) { show('landing'); setTimeout(initHero, 30); }
  else if (!u.answers?.done) { show('intro'); renderIntro(); }
  else show('dash');
  updateUserChips();
  if (AUTH_CONFIG.firebase) initFirebase().then(() => { if (AUTH.err) renderAuth(); });
})();

})();
