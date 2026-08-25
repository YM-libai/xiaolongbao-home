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

// ---------- 背景音乐 ----------
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-toggle');
if (bgm && musicBtn) {
  let playing = false;
  // 出错兜底:音频加载失败时不至于报错
  bgm.addEventListener('error', () => { musicBtn.classList.remove('is-playing'); });

  musicBtn.addEventListener('click', () => {
    playing = !playing;
    if (playing) {
      // 浏览器要求用户交互后才能播放(自动播放限制)
      bgm.volume = 0.0;
      const p = bgm.play();
      if (p && p.then) {
        p.then(() => {
          // 淡入到目标音量
          bgm.volume = 0;
          let v = 0;
          const timer = setInterval(() => {
            v += 0.03;
            if (v >= 0.6) { v = 0.6; clearInterval(timer); }
            bgm.volume = v;
          }, 60);
        }).catch(() => { playing = false; musicBtn.classList.remove('is-playing'); });
      }
      musicBtn.classList.add('is-playing');
      musicBtn.setAttribute('aria-pressed', 'true');
      musicBtn.setAttribute('aria-label', '暂停背景音乐');
    } else {
      bgm.pause();
      musicBtn.classList.remove('is-playing');
      musicBtn.setAttribute('aria-pressed', 'false');
      musicBtn.setAttribute('aria-label', '播放背景音乐');
    }
  });
}
