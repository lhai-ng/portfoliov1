// ================================================
// GLOBAL STATE & SHARED INSTANCES
// ================================================
const screenWidth = window.innerWidth;
const AppState = {
  canvases: {},
  waveState: { fill: -0.1 },
  tickerAdded: false,
  amplitudeTweens: [],
  isTransitioning: false,
  isHistoryNavigation: false        
};

// ================================================
// UTILS
// ================================================

function getCurrentBreakpoint(width) {
  if (width >= 992) return 'large';
  if (width >= 768) return 'medium';
  if (width >= 480) return 'medium-small';
  return 'small';
}

function getWaveHeight(fill, BOX_H) {
  return BOX_H * (1 - fill);
}

// ================================================
// CANVAS STATE FACTORY
// ================================================

function createCanvasState(selector) {
  return {
    selector,
    waves: [],
    waveInstances: { wave1: null, wave2: null, wave3: null },
    canvas: null,
    context: null,
    BOX_W: 0,
    BOX_H: 0,
    resolution: 1,
  };
}

// ================================================
// WAVE / CANVAS
// ================================================

function initWave(selector) {
  selector = selector || ".canvas";

  if (!AppState.canvases[selector]) {
    AppState.canvases[selector] = createCanvasState(selector);
  }
  const cs = AppState.canvases[selector];

  cs.resolution = window.devicePixelRatio || 1;

  cs.BOX_W = screenWidth > 991 ? 240 : screenWidth > 767 ? 180 : 128;
  cs.BOX_H = screenWidth > 991 ? 72  : screenWidth > 767 ? 56  : 40;

  cs.canvas  = document.querySelector(selector);
  if (!cs.canvas) return;
  cs.context = cs.canvas.getContext("2d");

  const { canvas, context, BOX_W, BOX_H, resolution } = cs;

  canvas.width        = BOX_W * resolution;
  canvas.height       = BOX_H * resolution;
  canvas.style.width  = BOX_W + "px";
  canvas.style.height = BOX_H + "px";
  context.scale(resolution, resolution);

  AppState.amplitudeTweens.forEach(t => {
    if (t._canvasSelector === selector) t.kill();
  });
  AppState.amplitudeTweens = AppState.amplitudeTweens.filter(
    t => t._canvasSelector !== selector
  );

  cs.waves.forEach(w => w.kill());
  cs.waves = [];

  const wave1 = createWave(context, {
    amplitude: 6,   duration: 1,   fillStyle: "rgba(2,135,207,0.8)",
    frequency: 2.5, width: BOX_W,  height: BOX_H, segments: 80,
    waveHeight: getWaveHeight(0.25, BOX_H)
  });
  const wave2 = createWave(context, {
    amplitude: 9,   duration: 2,   fillStyle: "rgba(58,184,253,0.75)",
    frequency: 1.5, width: BOX_W,  height: BOX_H, segments: 80,
    waveHeight: getWaveHeight(0.25, BOX_H)
  });
  const wave3 = createWave(context, {
    amplitude: 14,  duration: 3,   fillStyle: "rgba(159,221,254,0.65)",
    frequency: 0.8, width: BOX_W,  height: BOX_H, segments: 80,
    waveHeight: getWaveHeight(0.25, BOX_H)
  });

  cs.waves = [wave1, wave2, wave3];
  cs.waveInstances = { wave1, wave2, wave3 };

  const t1 = gsap.to(wave1, { duration: 0.5, amplitude: 4,  ease: "sine.inOut", repeat: -1, yoyo: true });
  const t2 = gsap.to(wave2, { duration: 1,   amplitude: 11, ease: "sine.inOut", repeat: -1, yoyo: true });
  const t3 = gsap.to(wave3, { duration: 1.5, amplitude: 20, ease: "sine.inOut", repeat: -1, yoyo: true });
  t1._canvasSelector = selector;
  t2._canvasSelector = selector;
  t3._canvasSelector = selector;
  AppState.amplitudeTweens.push(t1, t2, t3);

  if (!AppState.tickerAdded) {
    gsap.ticker.add(drawAllWaves);
    AppState.tickerAdded = true;
  }
}

function initAllWaves() {
  initWave(".canvas");
  initWave(".transition-canvas");
}

// ================================================
// DRAW
// ================================================

function drawAllWaves() {
  Object.values(AppState.canvases).forEach(cs => {
    if (!cs.context) return;
    cs.context.clearRect(0, 0, cs.BOX_W, cs.BOX_H);
    cs.context.globalCompositeOperation = "soft-light";
    cs.waves.forEach(w => w.draw());
  });
}

// ================================================
// FILL HELPERS
// ================================================

function setWaveFill(fill) {
  AppState.waveState.fill = fill;
  Object.values(AppState.canvases).forEach(cs => {
    const wh = getWaveHeight(fill, cs.BOX_H);
    cs.waves.forEach(w => { w.waveHeight = wh; });
  });
}

function setWaveFillFor(selector, fill) {
  const cs = AppState.canvases[selector];
  if (!cs) return;
  const wh = getWaveHeight(fill, cs.BOX_H);
  cs.waves.forEach(w => { w.waveHeight = wh; });
}

// ================================================
// WAVE FACTORY
// ================================================

function createWave(ctx, options = {}) {
  let wave = {
    amplitude:  options.amplitude  || 10,
    context:    ctx,
    duration:   options.duration   || 2,
    fillStyle:  options.fillStyle  || "rgba(2,135,207,1)",
    frequency:  options.frequency  || 4,
    height:     options.height     || 240,
    points:     [],
    segments:   options.segments   || 50,
    tweens:     [],
    waveHeight: options.waveHeight || 240,
    width:      options.width      || 72,
    x:          options.x         || 0,
    y:          options.y         || 0,
    draw, kill
  };

  init();

  function kill() {
    wave.tweens.forEach(t => t.kill());
    wave.tweens.length  = 0;
    wave.points.length  = 0;
  }

  function init() {
    kill();
    const interval = wave.width / wave.segments;
    for (let i = 0; i <= wave.segments; i++) {
      const norm  = i / wave.segments;
      const point = { x: wave.x + i * interval, y: 1 };
      const tween = gsap.to(point, {
        duration: wave.duration,
        y: -1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      }).progress(norm * wave.frequency);
      wave.tweens.push(tween);
      wave.points.push(point);
    }
  }

  function draw() {
    const { points, waveHeight, amplitude, x, y, width, height, fillStyle } = wave;
    const h = amplitude / 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, waveHeight + points[0].y * h);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, waveHeight + points[i].y * h);
    }
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  return wave;
}

// ================================================
// NAV
// ================================================
function initStagger() {
  const staggerLinks = document.querySelectorAll("[stagger-link]");

  staggerLinks.forEach(el => {
    if (el._splitInstance) el._splitInstance.revert();
    el._splitInstance = new SplitText(el, {
      type: "words, chars",
      charsClass: "char"
    });
  });

  staggerLinks.forEach((link) => {
    const letters = link.querySelectorAll("[stagger-link-text] .char");
    link.addEventListener("mouseenter", () => {
      gsap.to(letters, { yPercent: -100, duration: 0.7, ease: "power4.inOut", stagger: { each: 0.02 }, overwrite: true });
    });
    link.addEventListener("mouseleave", () => {
      gsap.to(letters, { yPercent: 0, duration: 0.7, ease: "power4.inOut", stagger: { each: 0.02 } });
    });
  });
}

function initNav() {
  const toggleButton      = document.querySelector(".toggle-button");
  const menu              = document.querySelector(".menu");
  const iconBars          = document.querySelector(".icon-bars");
  const bar1              = document.querySelector(".bar-1");
  const bar2              = document.querySelector(".bar-2");
  const bar3              = document.querySelector(".bar-3");
  const hero              = document.querySelector(".hero-section");

  if (!toggleButton) return;

  initStagger();

  let isOpeningMenu = true;
  const tl2 = gsap.timeline({ paused: true, defaults: { overwrite: true } });
  const tl3 = gsap.timeline({ paused: true, defaults: { overwrite: true } });

  function openMenu() {
    const topValue = (iconBars.offsetHeight - bar1.offsetHeight) / 2;
    tl2.clear()
      .to(".menu",    { right: "0", duration: 1.2, ease: "power4.out" }, "<")
      .to(bar1,       { rotation: 45,  top: topValue,    duration: 0.4, ease: "power3.inOut" }, "<")
      .to(bar2,       { rotation: 90,                    duration: 0.4, ease: "power3.inOut" }, "<")
      .to(bar3,       { rotation: -45, bottom: topValue, duration: 0.4, ease: "power3.inOut" }, "<")
      .to(".circle-1",{ scale: 1, duration: .6, ease: "back.out(1.8)", delay: .5 }, "<")
      .to(".circle-2",{ scale: 1, duration: .6, ease: "back.out(1.8)" }, "<")
      .restart();
  }

  function closeMenu() {
    tl3.clear()
      .to(bar1,        { rotation: 0, top: 0,    duration: 0.4, ease: "power3.inOut" })
      .to(bar2,        { rotation: 0,             duration: 0.4, ease: "power3.inOut" }, "<")
      .to(bar3,        { rotation: 0, bottom: 0,  duration: 0.4, ease: "power3.inOut" }, "<")
      .to(".menu",     { right: "-100%", ease: "power3.in" }, "<")
      .to(".circle-1", { scale: 0, duration: .6, ease: "power4.out", delay: .4 }, "<")
      .to(".circle-2", { scale: 0, duration: .6, ease: "power4.out" }, "<")
      .restart();
  }

  function resetOpenMenu() {
    const topValue = (iconBars.offsetHeight - bar1.offsetHeight) / 2;
    gsap.set(bar1,    { rotation: 45,  top: topValue });
    gsap.set(bar2,    { rotation: 90 });
    gsap.set(bar3,    { rotation: -45, bottom: topValue });
    gsap.set(".menu", { right: "0" });
  }

  toggleButton.addEventListener("click", () => {
    if (isOpeningMenu) {
      tl3.kill();
      openMenu();
      window.addEventListener("resize", resetOpenMenu);
      isOpeningMenu = false;
    } else {
      tl2.kill();
      closeMenu();
      window.removeEventListener("resize", resetOpenMenu);
      isOpeningMenu = true;
    }
  });

  menu.addEventListener("click", (e) => {
    if (e.target === menu) {
      closeMenu();
      window.removeEventListener("resize", resetOpenMenu);
      isOpeningMenu = true;
    }
  });

  toggleMenuButton();

  let resizeTimer;
  window.addEventListener("resize", function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(toggleMenuButton, 100);
  });

  function toggleMenuButton() {
    const w = window.innerWidth;
    let heroMembrane = hero ? hero.querySelector(".hero-membrane") : null;

    if (w < 992) {
      gsap.to(toggleButton, { scale: 1, duration: .5, ease: "expo.out" });
      if (hero && !heroMembrane) {
        heroMembrane = document.createElement('div');
        heroMembrane.className = 'hero-membrane';
        heroMembrane.style.pointerEvents = 'none';
        hero.appendChild(heroMembrane);
      }
    } else {
      gsap.set(toggleButton, { scale: 0 });
      if (heroMembrane) { heroMembrane.remove(); }
    }
  }
}

// ================================================
// HOME ENTRANCE ANIMATION
// ================================================

CustomEase.create("hop", ".8, 0, 0.1, 1");

function setHomeEndState(container) {
  if (screenWidth < 992) {
    gsap.set(container, { opacity: 0 })
  }
  gsap.set(".h1-text", {
    top: screenWidth > 991 ? "40%" : screenWidth > 500 ? "22%" : "20%"
  });
  gsap.set(".bac-link-text", { top: "0%" });
  gsap.set(".bac-text",      { top: "0%" });
  gsap.set(".location-text", { top: "0%" });
  gsap.set(".nav-bar",       { scale: 1 });
  gsap.set(".round-intro",   { scale: 1 });
  gsap.set(".round-logo",    { scale: 1 });

  // Restart rotate animations nếu chưa chạy
  gsap.to(".round-intro", { rotate: "-=360", duration: 16, ease: "none", repeat: -1 });
  gsap.to(".round-logo",  { rotate: "+=360", duration: 90, ease: "none", repeat: -1 });
  initStagger();
}

// ================================================
// RESIZE
// ================================================

let _currentBreakpoint = getCurrentBreakpoint(window.innerWidth);

window.addEventListener('resize', function() {
  const newBreakpoint = getCurrentBreakpoint(window.innerWidth);
  if (newBreakpoint !== _currentBreakpoint) {
    _currentBreakpoint = newBreakpoint;
    if (!window.__barbaTransitioning) {
      location.reload();
    }
  }
});

// ================================================
// PAGE TRANSITION                   
// ================================================

function pageTransition(data) {
  if (screenWidth < 992) {
    gsap.to(`.${data.current.namespace}-container`, { opacity: 0, duration: .8, ease: "expo.inOut" });
  } else {
    AppState.isTransitioning = true;          
  AppState.waveState.fill = 0.1;
  setWaveFillFor(".transition-canvas", 0.1);

  gsap.killTweensOf(".page-transition");   

  const tl = gsap.timeline({
    defaults: { overwrite: "auto" }
  });

  tl
    .to(".page-transition", {
      opacity: 1,
      scale: 1,                           
      duration: 0.3,
      ease: "expo.out"
    })
    .to(".page-name", {
      top: "-100%",
      duration: 1.5,
      ease: "expo.inOut"
    })
    .to(AppState.waveState, {
      fill: 1.2,
      duration: 1.8,
      ease: "expo.inOut",
      onUpdate: () => setWaveFillFor(".transition-canvas", AppState.waveState.fill)
    }, "<")
    .to(".page-transition",   { height: "101vh", width: "101vw", borderRadius: "0px", duration: 1.3, delay: .85, ease: "hop" }, "<")
    .to(".transition-canvas", { scale: 50, duration: 1.3, ease: "hop" }, "<")
    .to(".nav-bar", { pointerEvents: "none", duration: .1 }, "<")
    .to(".page-transition",   { 
      clipPath: "inset(0% 0 100% 0)", 
      duration: 1.5, 
      ease: "hop", 
      onComplete: () => {gsap.set(".nav-bar", { pointerEvents: "auto" })} 
    }, "<1.1")
    .set(".page-transition", {
      top: "50%",
      borderRadius: "",
      width: "",
      height: "",
      opacity: 0,
      scale: 0,
      clipPath: "inset(0% 0)",
    })
    .set(".transition-canvas", {
      scale: 1,
      borderRadius: "",
    })
    .set(".page-name", { top: "" })
    setWaveFillFor(".transition-canvas", AppState.waveState.fill);
  }
}

// ================================================
// BARBA.JS SETUP                    
// ================================================

function contentAnimation(data) {
  if (screenWidth < 992) {
    gsap.to(`.${data.next.namespace}-container`, { opacity: 1, duration: .8, ease: "expo.inOut" });
  } else {
    gsap.to(`.${data.next.namespace}-container`, { opacity: 1, duration: .1, delay: .1, ease: "expo.inOut" });
  }
}

function delay(n) {
  n = n || 0;
  return new Promise(done => {
    setTimeout(() => { done(); }, n);
  });
}

window.addEventListener("popstate", () => {
  AppState.isHistoryNavigation = true;
});

window.addEventListener("beforeunload", () => {
  AppState.isHistoryNavigation = true;
});

barba.init({
  sync: true,

  transitions: [
    {
      name: 'default-transition',

      async leave(data) {
        const done = this.async();

        if (AppState.isHistoryNavigation) {
          done();
          return;
        }

        pageTransition(data);
        await delay(screenWidth < 992 ? 800 : 2200);
        done();
      },

      async beforeEnter(data) {
        if (screenWidth < 992 && data.next.namespace === 'home') {
          setHomeEndState(data.next.container);
          gsap.set(".nav-bar", { pointerEvents: "none" })
        }
      },

      async enter(data) { 
        if (data.next.namespace === 'home' && screenWidth >= 992) {
          setHomeEndState(data.next.container);
        }
        contentAnimation(data);
      },

      async once(data) {
        contentAnimation(data);
      }
    }
  ]
});

barba.hooks.after(() => {
  setTimeout(() => {
    AppState.isTransitioning = false;
    AppState.isHistoryNavigation = false;
  }, 200)
});

// ================================================
// HOVER PREVIEW                     
// ================================================

function initHoverPreview() {
  if (window.innerWidth < 992) return;
  const navLinks = document.querySelectorAll("[data-barba-link]");

  navLinks.forEach(link => {
    const pageName = link.dataset.pageName || "";
    let hoverTl = null;

    link.addEventListener("mouseenter", () => {
      if (AppState.isTransitioning) return;   

      if (hoverTl) hoverTl.kill();

      gsap.set(".page-transition", { scale: 0 });

      const textEl = document.querySelector(".page-name");
      if (textEl) textEl.textContent = pageName;

      setWaveFillFor(".transition-canvas", 0.1);

      hoverTl = gsap.timeline();
      hoverTl.to(".page-transition", {
        opacity: 0.8,
        scale: 1,
        duration: 0.6,
        ease: "expo.out",
      });
    });

    link.addEventListener("mouseleave", () => {
      if (AppState.isTransitioning) return;   

      if (hoverTl) hoverTl.kill();
      hoverTl = gsap.timeline();
      hoverTl.to(".page-transition", {
        opacity: 0,
        scale: 0,
        duration: 0.4,
        ease: "expo.in"
      });
    });
  });
}

// ================================================
// BOOT
// ================================================

initAllWaves();

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHoverPreview();

  document.querySelectorAll("[data-barba-link]").forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const linkPath = new URL(href, window.location.origin).pathname;
      if (window.location.pathname === linkPath) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    });
  });
});