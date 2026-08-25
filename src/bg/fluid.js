// ============================================================
// 抽象流体背景 —— Three.js 全屏着色器
// 暖色调色板 + fBm 分形噪声 + 鼠标扰动,营造油画般流动质感
// ============================================================
import * as THREE from 'three';

export function initFluid({ reduceMotion = false } = {}) {
  const canvas = document.getElementById('fluid');
  if (!canvas || reduceMotion) return;
  const WebGL = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!WebGL) return;                       // 不支持 WebGL 就留静态底

  // 用 renderer 接管已有 canvas
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  // 用正交相机 + 平面铺满屏幕
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ---------- 片段着色器:暖色流体 ----------
  const vertex = `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // 基于 ashima simplex noise 的 fBm 函数精简版
  const fragment = `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uMouse;       // 鼠标归一化坐标 [-1,1]
    uniform float uMouseOn;
    uniform float uIntensity;

    // 3D simplex noise
    vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
    vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0,0.5,1.0,2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    // fBm 分形叠加,做出"油画笔触"
    float fbm(vec3 p){
      float value = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for(int i = 0; i < 5; i++){
        value += amp * snoise(p * freq);
        amp *= 0.5;
        freq *= 2.02;
      }
      return value;
    }

    void main(){
      // 基于 UV 稍微拉长比例,横向更有流动感
      vec2 uv = vUv * vec2(1.4, 1.0);
      vec2 p = uv * 2.6;
      float t = uTime * 0.16;

      // 叠加 2 层不同频率/速度的噪声,形成"云染"层
      float n1 = fbm(vec3(p, t));
      float n2 = fbm(vec3(p * 1.7 + vec2(3.7, 1.4), t * 1.4 + 2.0));
      float n = 0.5 * n1 + 0.5 * n2;      // 混合 [-1,1] 左右

      // 鼠标扰动:把鼠标坐标加进噪声输入,产生局部"流过"效果
      vec2 m = uMouse * 0.7;
      float mouseNudge = fbm(vec3(p + m * 0.5, t + uMouseOn * 1.2));
      n += mouseNudge * 0.25 * uMouseOn;

      // 归一化到 [0,1]
      n *= 0.5;
      n += 0.5;

      // ---- 暖色三色渐变调色板 ----
      // 金琥珀 #fcd34d → 鲜橙 #fb923c → 珊瑚玫红 #fb7185,再加一点暖白
      vec3 amber = vec3(0.988, 0.827, 0.302);
      vec3 orange = vec3(0.984, 0.573, 0.235);
      vec3 rose = vec3(0.984, 0.443, 0.522);
      vec3 cream = vec3(1.0, 0.94, 0.85);

      // 用纹理值 n 在三种颜色间插值
      vec3 color;
      float nc = smoothstep(0.30, 0.72, n);
      if(nc < 0.4){ color = mix(amber, orange, nc / 0.4); }
      else { color = mix(orange, rose, (nc - 0.4) / 0.6); }

      // 局部提亮:接近 1 的地方浮出奶油白,类似光斑
      float highlight = smoothstep(0.78, 0.98, n);
      color = mix(color, cream, highlight * 0.35);

      // 亮度整体靠 uIntensity 控制(跟随滚动状态微变更生动)
      float alpha = 0.62 * (0.40 + 0.60 * n);

      // 边缘加深,让中心流体更透气(暗角,避免过亮淹没文字)
      float vig = smoothstep(1.15, 0.35, length(vUv - 0.5) * 1.4);
      color *= 0.42 + 0.58 * vig;
      alpha *= (0.40 + 0.60 * vig);

      gl_FragColor = vec4(color * uIntensity, alpha);
    }
  `;

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.0, 0.0) },
    uMouseOn: { value: 0.0 },
    uIntensity: { value: 0.9 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(plane);

  // ---------- 鼠标追踪 ----------
  let mouseTarget = new THREE.Vector2(0, 0);
  let hasMouse = false;
  const tmp = new THREE.Vector2();
  const onMove = (e) => {
    hasMouse = true;
    tmp.x = (e.clientX / window.innerWidth) * 2 - 1;
    tmp.y = - (e.clientY / window.innerHeight) * 2 + 1;
    mouseTarget.copy(tmp);
  };
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    hasMouse = true;
    tmp.x = (t.clientX / window.innerWidth) * 2 - 1;
    tmp.y = - (t.clientY / window.innerHeight) * 2 + 1;
    mouseTarget.copy(tmp);
  }, { passive: true });

  // ---------- 尺寸自适应 ----------
  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    canvas.width = w * renderer.getPixelRatio();
    canvas.height = h * renderer.getPixelRatio();
  };
  window.addEventListener('resize', onResize);

  // ---------- 渲染循环 ----------
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    uniforms.uTime.value = clock.getElapsedTime();

    // 鼠标缓动平滑
    if (hasMouse) {
      uniforms.uMouse.value.lerp(mouseTarget, 0.04);
      uniforms.uMouseOn.value += (1 - uniforms.uMouseOn.value) * 0.02;
    } else {
      uniforms.uMouse.value.lerp(new THREE.Vector2(0, 0), 0.02);
      uniforms.uMouseOn.value += (0 - uniforms.uMouseOn.value) * 0.02;
    }
    renderer.render(scene, camera);
  }
  animate();

  // 暴露一个微调接口(可选)
  return { setIntensity: (v) => { uniforms.uIntensity.value = v; } };
}
