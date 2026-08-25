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
