// ============================================================
// 入口 —— 装载并协调所有模块
// ============================================================
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initFluid } from './bg/fluid.js';
import { initScrollMotion } from './motion/scroll.js';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 抽象流体背景 ----------
initFluid({ reduceMotion });

// 关闭 Lenis 平滑滚动 —— 一镜到底长页直接用它反而造成"滚动被吞/被反控",
// 且会干扰 ScrollTrigger 的 native scroll 触发。这里改用原生滚动,
// ScrollTrigger 监听原生滚动最可靠,滚轮实时响应。
let lenis = null;

// ---------- 滚动驱动的分屏动画 ----------
initScrollMotion({ gsap, ScrollTrigger, lenis, reduceMotion });

// ---------- 顶部滚动进度条 ----------
const prog = document.querySelector('.scroll-progress span');
const onScrollProgress = () => {
  const st = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (prog) prog.style.width = (max > 0 ? Math.min(100, (st / max) * 100) : 0) + '%';
  document.body.classList.toggle('scrolled', st > 40);
  const hint = document.querySelector('.scroll-hint');
  if (hint) hint.classList.toggle('hidden', st > 80);
};
window.addEventListener('scroll', onScrollProgress, { passive: true });
onScrollProgress();

// ---------- 加载屏 ----------
const pre = document.getElementById('preloader');
function hidePre() {
  if (pre) pre.classList.add('done');
}
// DOMContentLoaded 即注册,确保尽快触发;load 作为兜底
function tryHide() {
  setTimeout(hidePre, reduceMotion ? 0 : 900);
}
if (document.readyState === 'complete') {
  tryHide();
} else {
  window.addEventListener('load', tryHide);
  document.addEventListener('DOMContentLoaded', tryHide);
}
// 兜底:绝不让页面卡在加载屏(加强:2s 必隐)
setTimeout(hidePre, 2000);

// ============================================================
// 光标聚光灯揭示(Lithos):第二张图只在跟随光标的软圆内浮现
// ============================================================
function initSpotlight() {
  const canvas = document.getElementById('spotlightCanvas');
  const reveal = document.getElementById('revealLayer');
  if (!canvas || !reveal || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const SPOTLIGHT_R = 200;

  const mouse = { x: -999, y: -999 };
  const smooth = { x: -999, y: -999 };
  let w = 0, h = 0;
  let raf = null;
  let lastX = -999, lastY = -999;
  let first = true;

  function size() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  }
  size();
  window.addEventListener('resize', size);
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function render() {
    // 平滑插值(lerp)
    smooth.x += (mouse.x - smooth.x) * 0.1;
    smooth.y += (mouse.y - smooth.y) * 0.1;
    const moved = Math.abs(smooth.x - lastX) > 0.4 || Math.abs(smooth.y - lastY) > 0.4;

    if (first || moved) {
      first = false;
      lastX = smooth.x;
      lastY = smooth.y;

      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, SPOTLIGHT_R);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,255,255,1)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.75)');
      g.addColorStop(0.75, 'rgba(255,255,255,0.4)');
      g.addColorStop(0.88, 'rgba(255,255,255,0.12)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(smooth.x, smooth.y, SPOTLIGHT_R, 0, Math.PI * 2);
      ctx.fill();

      const data = canvas.toDataURL();
      reveal.style.webkitMaskImage = 'url("' + data + '")';
      reveal.style.maskImage = 'url("' + data + '")';
    }
    raf = requestAnimationFrame(render);
  }
  raf = requestAnimationFrame(render);
}

// ============================================================
// 移动端导航菜单
// ============================================================
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mobileNav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

initSpotlight();
initMobileNav();
