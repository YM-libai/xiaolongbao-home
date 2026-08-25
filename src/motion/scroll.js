// ============================================================
// 滚动驱动动画 —— GSAP ScrollTrigger(健壮版)
// 原则:每个区块进入视口就播放、一次到位不反放;并有兜底
//       保证任何情况下内容都可见(不卡在 opacity:0)。
// ============================================================
export function initScrollMotion({ gsap, ScrollTrigger, lenis, reduceMotion }) {
  // 第一次进入视口即播放,不 reverse(避免内容被重新隐藏)
  const once = 'play none none none';
  // 提前一点触发,让内容"刚露头就浮现",更有电影感
  const startPct = 'top 86%';

  // ----- 把文字拆成字符/词,供逐字入场 -----
  function splitText(el) {
    const text = el.textContent;
    el.textContent = '';
    const parts = text.split(/\s+/);
    parts.forEach((part, i) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'word';
      for (const ch of part) {
        const charEl = document.createElement('span');
        charEl.className = 'char';
        charEl.textContent = ch;
        wordEl.appendChild(charEl);
      }
      el.appendChild(wordEl);
      if (i < parts.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  // 兜底:强制把所有需动画的元素显示出来(全局安全网)
  function forceVisible() {
    document.querySelectorAll('.char, [data-reveal], .section-label').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.transition = 'none';
    });
    document.querySelectorAll('[data-reveal], .project-card').forEach((el) => {
      el.style.visibility = 'visible';
    });
  }

  // 若"减少动效",直接全部显示,不挂动画
  if (reduceMotion) {
    forceVisible();
    return;
  }

  // ----- 逐字入场 [data-split] -----
  document.querySelectorAll('[data-split]').forEach((el) => {
    splitText(el);
    const chars = el.querySelectorAll('.char');
    if (!chars.length) return;
    const isHero = !!el.closest('.hero');
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: isHero ? 'top 78%' : startPct,
        toggleActions: once,
      },
    });
    tl.fromTo(chars,
      { y: 40, opacity: 0, stagger: 0.02 },
      { y: 0, opacity: 1, stagger: 0.02, duration: 0.7, ease: 'power3.out' }
    );
  });

  // ----- 卡片浮现 [data-reveal] -----
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.fromTo(el,
      { y: 44, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.85, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: startPct, toggleActions: once },
      }
    );
  });

  // ----- 区块标签横向入场 -----
  document.querySelectorAll('.section-label').forEach((el) => {
    gsap.fromTo(el, { x: -22, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: startPct, toggleActions: once },
    });
  });

  // ----- 作品卡整体上浮+缩放 -----
  const project = document.querySelector('[data-project]');
  if (project) {
    gsap.fromTo(project, { y: 56, opacity: 0, scale: 0.97 }, {
      y: 0, opacity: 1, scale: 1, duration: 1.0, ease: 'power3.out',
      scrollTrigger: { trigger: project, start: 'top 82%', toggleActions: once },
    });
  }

  // ----- 背景流体强度随滚动微调 -----
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const prog = Math.min(1, self.progress);
      document.body.style.setProperty('--scroll', String(prog));
    },
  });

  // ----- 全网兜底:即使 ScrollTrigger 一切失效,2.5s 后强制全部显示 -----
  // (保证"翻页"任何情况下都不空白)
  setTimeout(forceVisible, 2500);

  // refresh 一次,确保触发点算准
  ScrollTrigger.refresh();
}
