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
  isHistoryNavigation: false,
  isPreloading: false,
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
  if (screenWidth < 992) return;
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
  const toggleButton = document.querySelector(".toggle-button");
  const menu         = document.querySelector(".menu");
  const iconBars     = document.querySelector(".icon-bars");
  const bar1         = document.querySelector(".bar-1");
  const bar2         = document.querySelector(".bar-2");
  const bar3         = document.querySelector(".bar-3");
  const hero         = document.querySelector(".hero-section");

  if (!toggleButton) return;

  initStagger();

  let isOpeningMenu = true;
  const tl2 = gsap.timeline({ paused: true, defaults: { overwrite: true } });
  const tl3 = gsap.timeline({ paused: true, defaults: { overwrite: true } });

  function openMenu() {
    const topValue = (iconBars.offsetHeight - bar1.offsetHeight) / 2;
    tl2.clear()
      .to(".menu",     { right: "0", duration: 1.2, ease: "power4.out" }, "<")
      .to(bar1,        { rotation: 45,  top: topValue,    duration: 0.4, ease: "power3.inOut" }, "<")
      .to(bar2,        { rotation: 90,                    duration: 0.4, ease: "power3.inOut" }, "<")
      .to(bar3,        { rotation: -45, bottom: topValue, duration: 0.4, ease: "power3.inOut" }, "<")
      .to(".circle-1", { scale: 1, duration: .6, ease: "back.out(1.8)", delay: .3 }, "<")
      .to(".circle-2", { scale: 1, duration: .6, ease: "back.out(1.8)" }, "<")
      .restart();
  }

  function closeMenu() {
    tl3.clear()
      .to(bar1,        { rotation: 0, top: 0,    duration: 0.4, ease: "power3.inOut" })
      .to(bar2,        { rotation: 0,             duration: 0.4, ease: "power3.inOut" }, "<")
      .to(bar3,        { rotation: 0, bottom: 0,  duration: 0.4, ease: "power3.inOut" }, "<")
      .to(".menu",     { right: "-100%", ease: "power3.in" }, "<")
      .to(".circle-1", { scale: 0, duration: .6, ease: "power4.out", delay: .2 }, "<")
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
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(toggleMenuButton, 100);
  });

  function toggleMenuButton() {
    const w = window.innerWidth;
    let heroMembrane = hero ? hero.querySelector(".hero-membrane") : null;

    if (w < 992 && AppState.isPreloading === false) {
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
// HOME ANIMATION
// ================================================

CustomEase.create("hop", ".8, 0, 0.1, 1");

function initHomeAnimation() {
  AppState.isPreloading = true;
  gsap.set(".h1-text", { top: "150%" });
  gsap.set(".toggle-button", { scale: 0 });

  const tl1 = gsap.timeline();

  tl1
    .to(AppState.waveState, {
      fill: 0.1,
      duration: 1.5,
      ease: "expo.inOut",
      onUpdate: () => setWaveFillFor(".canvas", AppState.waveState.fill)
    })
    .to(".text", { bottom: "0",    duration: 1.5, ease: "expo.inOut" }, "<")
    .to(".text", { bottom: "100%", duration: 1.5, delay: .4, ease: "expo.inOut" })
    .to(AppState.waveState, {
      fill: 1.2,
      duration: 1.8,
      ease: "expo.inOut",
      onUpdate: () => setWaveFillFor(".canvas", AppState.waveState.fill)
    }, "<")
    .to(".preloader-box",   { height: "103vh", width: "103vw", borderRadius: "0px", duration: 1.3, delay: .88, ease: "hop" }, "<")
    .to(".canvas",          { scale: 50, duration: 1.3, ease: "hop" }, "<")
    .to(".preloader-box",   { clipPath: "inset(0% 0 100% 0)", duration: 1.5, ease: "hop" }, "<.88")
    .to(".toggle-button",   { scale: screenWidth < 992 ? 1 : 0, duration: .1, onComplete: () => { AppState.isPreloading = false; } }, "<")
    .to(".nav-bar",         { pointerEvents: "auto", scale: 1, duration: .3, ease: "expo.in" }, "<.2")
    .to(".round-intro", {
      scale: 1, rotate: 360, delay: .3, duration: 1.2, ease: "circle.inOut",
      onComplete: () => gsap.to(".round-intro", { rotate: "-=360", duration: 16, ease: "none", repeat: -1 })
    }, "<")
    .to(".round-logo", {
      scale: 1, rotate: -360, duration: 1.2, ease: "circle.inOut",
      onComplete: () => gsap.to(".round-logo", { rotate: "+=360", duration: 90, ease: "none", repeat: -1 })
    }, "<")
    .to(".h1-text", {
      top: screenWidth > 991 ? "40%" : screenWidth > 500 ? "22%" : "20%",
      delay: .1, duration: 1.2, ease: "expo.out",
      stagger: { each: 0.05, from: "center" }
    }, "<")
    .to(".bac-link-text", { top: "0%", duration: 1,  delay: .5, ease: "power2.out" }, "<")
    .to(".bac-text",      { top: "0%", duration: .8, delay: .1, ease: "power4.out" }, "<")
    .to(".location-text", { top: "0%", duration: .8, delay: .1, ease: "power4.out" }, "<");
}

function setHomeEndState(container) {
  if (screenWidth < 992) {
    gsap.set(container, { opacity: 0 });
  }
  gsap.set(".h1-text", {
    top: screenWidth > 991 ? "40%" : screenWidth > 500 ? "22%" : "20%"
  });
  gsap.set(".bac-link-text", { top: "0%" });
  gsap.set(".bac-text",      { top: "0%" });
  gsap.set(".location-text", { top: "0%" });
  gsap.set(".nav-bar",       { scale: 1 });
  gsap.set(".round-intro",   { scale: 1 });
  gsap.set(".round-logo",    { scale: 1, transform: "translate(-50%,-50%)" });

  gsap.to(".round-intro", { rotate: "-=360", duration: 16, ease: "none", repeat: -1 });
  gsap.to(".round-logo",  { rotate: "+=360", duration: 90, ease: "none", repeat: -1 });
  initStagger();
}

// ================================================
// SERVICE ANIMATION
// ================================================

let _serviceRafId = null;
let imageLinks = [
  "https://cdn.prod.website-files.com/6919398f2c0874354a666361/69b2d965589829976aafe344_process1%20(1).png",
  "https://cdn.prod.website-files.com/6919398f2c0874354a666361/69b2d9dfcabcec4037988781_process2%20(1).png",
  "https://cdn.prod.website-files.com/6919398f2c0874354a666361/69b2d9e2d9de01bcee2f6d07_process3%20(1).png"
];

function preloadImages(urls) {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

preloadImages(imageLinks);
 
function destroyServiceAnimation() {
  if (_serviceRafId) {
    cancelAnimationFrame(_serviceRafId);
    _serviceRafId = null;
  }
  if (window._serviceAbortController) {
    window._serviceAbortController.abort();
    window._serviceAbortController = null;
  }
}
 
function initServiceAnimation() {
  const hoverCursorStart    = document.querySelector(".hover-cursor-start");
  const hoverCursorImages   = document.querySelector(".hover-cursor-images");
  const navBar              = document.querySelector(".nav-bar");
  const hoverImage          = document.querySelector(".hover-image");
  const serviceTitles       = document.querySelectorAll(".service-title");
  const serviceDescriptions = document.querySelectorAll(".service-description");
 
  if (!hoverCursorStart || !navBar) return;
 
  destroyServiceAnimation();
  
  if (screenWidth >= 992) {
    window._serviceAbortController = new AbortController();
    const signal = window._serviceAbortController.signal;
  
    let mouseX = 0, mouseY = 0;
    let curX   = 0, curY   = 0;
  
    document.addEventListener('pointermove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { signal });
    
    navBar.addEventListener('mouseenter', () => {
      gsap.to(".service-container", { cursor: "auto", duration: .5, ease: "expo.out", overwrite: true });
      gsap.to(hoverCursorStart,     { scale: 0,       duration: .5, ease: "expo.out", overwrite: true });
    }, { signal });
  
    navBar.addEventListener('mouseleave', () => {
      gsap.to(".service-container", { cursor: "none", duration: .5, ease: "expo.out", overwrite: true });
      gsap.to(hoverCursorStart,     { scale: 1,       duration: .5, ease: "expo.out", overwrite: true });
    }, { signal });
  
    serviceTitles.forEach((title, index) => {
      title.addEventListener("mouseenter", () => {
        hoverImage.src = imageLinks[index];
        gsap.to(hoverImage,           { scale: 1,   duration: .8, ease: "expo.out", overwrite: true });
        gsap.to(".hover-cursor-text", { scale: 0,   duration: .8, ease: "expo.out", overwrite: true });
        gsap.to(title.querySelector(".service-number"), { opacity: .3, duration: .8, ease: "expo.out", overwrite: true });
        if (serviceDescriptions[index]) {
          gsap.to(serviceDescriptions[index], { opacity: 1, duration: .8, ease: "expo.out", overwrite: true });
        }
      }, { signal });
  
      title.addEventListener("mouseleave", () => {
        gsap.to(hoverImage,           { scale: 0,   duration: .8, ease: "expo.out", overwrite: true });
        gsap.to(".hover-cursor-text", { scale: 1,   duration: .8, ease: "expo.out", overwrite: true });
        gsap.to(title.querySelector(".service-number"), { opacity: .05, duration: .8, ease: "expo.out", overwrite: true });
        if (serviceDescriptions[index]) {
          gsap.to(serviceDescriptions[index], { opacity: .4, duration: .8, ease: "expo.out", overwrite: true });
        }
      }, { signal });
    });
  
    function animate() {
      curX += (mouseX - curX) * 0.15;
      curY += (mouseY - curY) * 0.15;
      hoverCursorStart.style.left = curX + 'px';
      hoverCursorStart.style.top  = curY + 'px';
      if (hoverCursorImages) {
        hoverCursorImages.style.left = (screenWidth >= 1356 ? curX - 600 : curX - 300) + 'px';
        hoverCursorImages.style.top  = curY + 'px';
      }
      _serviceRafId = requestAnimationFrame(animate);
    }
    animate();
  } else {
    window._serviceAbortController = new AbortController();
    const signal = window._serviceAbortController.signal;

    if (serviceTitles.length > 0) {
      hoverImage.src = imageLinks[0];
      gsap.set(hoverImage, { scale: 1 });
      gsap.set(".hover-cursor-text", { scale: 0 });
      gsap.set(serviceTitles[0].querySelector(".service-number"), { opacity: .3 });
      if (serviceDescriptions[0]) {
        gsap.set(serviceDescriptions[0], { opacity: 1 });
      }
    }

    let activeIndex = 0;

    serviceTitles.forEach((title, index) => {
      title.addEventListener("click", () => {
        if (activeIndex === index) return;

        gsap.to(serviceTitles[activeIndex].querySelector(".service-number"), { opacity: .05, duration: .8, ease: "expo.out", overwrite: true });
        if (serviceDescriptions[activeIndex]) {
          gsap.to(serviceDescriptions[activeIndex], { opacity: .4, duration: .8, ease: "expo.out", overwrite: true });
        }

        activeIndex = index;
        hoverImage.src = imageLinks[index];
        gsap.to(hoverImage,           { scale: 1,   duration: .8, ease: "expo.out", overwrite: true });
        gsap.to(".hover-cursor-text", { scale: 0,   duration: .8, ease: "expo.out", overwrite: true });
        gsap.to(title.querySelector(".service-number"), { opacity: .3, duration: .8, ease: "expo.out", overwrite: true });
        if (serviceDescriptions[index]) {
          gsap.to(serviceDescriptions[index], { opacity: 1, duration: .8, ease: "expo.out", overwrite: true });
        }
      }, { signal });
    });
  }
  
}


// ================================================
// WORKS ANIMATION
// ================================================

let _worksAbortController = null;

function destroyWorksAnimation() {
  if (_worksAbortController) {
    _worksAbortController.abort();
    _worksAbortController = null;
  }
}

function initWorksAnimation () {
  const container = document.querySelector(".works-container");
  const items = document.querySelector(".items");
  const indicator = document.querySelector(".indicator");
  const itemElements = document.querySelectorAll(".item");
  const preview = document.querySelector(".img-preview")
  const previewImage = document.querySelector(".img-preview img");
  const itemImages = document.querySelectorAll(".item img");

  const projectName = document.querySelector(".project-name");
  const clientInfo = document.querySelector(".client-container .info-content");
  const roleInfo = document.querySelector(".role-container .info-content");
  const categoryInfo = document.querySelector(".category-container .info-content");
  const descriptionInfo = document.querySelector(".description .info-content");

  const viewCursor = document.querySelector(".view-cursor");
  const worksCanvas = document.querySelector(".works-canvas");

  let isHorizontal = true;
  let dimensions = {
    itemSize: 0,
    containerSize: 0,
    indicatorSize: 0,
  }

  let maxTranslate = 0;
  let currentTranslate = 0;
  let targetTranslate = 0;
  let isClickMove = false;
  let currentImageIndex = 0;
  let isHoveringPreview = false;
  const activeItemOpacity = 1;

  let previousVideo = null;
  let videoTimeline = null;
  let resetTimeline = null;
  let imageTimeline = null;

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function updateDimensions() {
    isHorizontal = true;
    if (isHorizontal) {
      dimensions = {
        itemSize: itemElements[0].getBoundingClientRect().width,
        containerSize: items.scrollWidth,
        indicatorSize: indicator.getBoundingClientRect().width,
      };
    } else {
      dimensions = {
        itemSize: itemElements[0].getBoundingClientRect().height,
        containerSize: items.getBoundingClientRect().height,
        indicatorSize: indicator.getBoundingClientRect().height,
      }
    }
    return dimensions;
  }
  

  dimensions = updateDimensions();
  maxTranslate = dimensions.containerSize - dimensions.indicatorSize;

  function getItemInIndicator() {
    itemImages.forEach((img) => (img.style.opacity = .3));

    const indicatorStart = -currentTranslate;
    const indicatorEnd = indicatorStart + dimensions.indicatorSize;

    let maxOverlap = 0;
    let selectedIndex = 0;

    itemElements.forEach((item, index) => {
      const itemStart = index * dimensions.itemSize;
      const itemEnd = itemStart + dimensions.itemSize;

      const overlapStart = Math.max(indicatorStart, itemStart);
      const overlapEnd = Math.min(indicatorEnd, itemEnd);
      const overlap = Math.max(0, overlapEnd - overlapStart);

      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        selectedIndex = index;
      }
    });

    itemImages[selectedIndex].style.opacity = activeItemOpacity;
    return selectedIndex;
  }

  function updateYearCount(year, shouldAnimate = true) {
    const yearStr = String(year);
    const tens = parseInt(yearStr[2]);
    const units = parseInt(yearStr[3]);

    const tensList = document.querySelector(".tens .list");
    const unitsList = document.querySelector(".units .list");

    const tensOffset = (9 - tens) * (screenWidth > 991 ? 96 : screenWidth > 767 ? 80 : 72);
    const unitsOffset = (9 - units) * (screenWidth > 991 ? 96 : screenWidth > 767 ? 80 : 72);

    if (shouldAnimate) {
      gsap.killTweensOf(tensList);
      gsap.killTweensOf(unitsList);

      gsap.to(tensList, { y: -tensOffset, duration: 0.6, ease: "power3.out" });
      gsap.to(unitsList, { y: -unitsOffset, duration: 0.6, ease: "power3.out" });
    } else {
      gsap.set(tensList, { y: -tensOffset });
      gsap.set(unitsList, { y: -unitsOffset });
    }
  }


  function animate() {
    const lerpFactor = isClickMove ? 0.05 : 0.075;
    currentTranslate = lerp(currentTranslate, targetTranslate, lerpFactor);

    if (Math.abs(currentTranslate - targetTranslate) > 0.01) {
      const transform = isHorizontal
        ? `translateX(${currentTranslate}px)`
        : `translateY(${currentTranslate}px)`
      items.style.transform = transform;

      const activeIndex = getItemInIndicator();
      updatePreviewImage(activeIndex);
    } else {
      isClickMove = false;
    }

    requestAnimationFrame(animate);
  }

  container.addEventListener("wheel", (e) => {
      e.preventDefault();
      isClickMove = false;
      
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

      const scrollVelocity = Math.min(Math.max(delta * .2, -20), 20);

      targetTranslate = Math.min(
        Math.max(targetTranslate - scrollVelocity, -maxTranslate),
        0
      );
  }, {passive: false});

  let touchStartY = 0;
  let touchStartX = 0;

  container.addEventListener("touchstart", (e) => {
      if (isHorizontal) {
          touchStartY = e.touches[0].clientY;
          touchStartX = e.touches[0].clientX;
      }
  });

  container.addEventListener("touchmove", (e) => {
      if (isHorizontal) {
          const touchY = e.touches[0].clientY;
          const touchX = e.touches[0].clientX;
          const deltaY = touchStartY - touchY;
          const deltaX = touchStartX - touchX;

          const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

          const scrollVelocity = Math.min(Math.max(delta * 0.02, -20), 20);

          targetTranslate = Math.min(
              Math.max(targetTranslate - scrollVelocity, -maxTranslate),
              0
          );

          touchStartY = touchY;
          touchStartX = touchX;
          e.preventDefault();
      }
  }, { passive: false });

  itemElements.forEach((item,index) => {
    item.addEventListener("click", () => {
      isClickMove = true;
      targetTranslate =
        -index * dimensions.itemSize +
        (dimensions.indicatorSize - dimensions.itemSize) / 2;
    });

    targetTranslate = Math.max(Math.min(targetTranslate, 0), -maxTranslate);
  });

  _worksAbortController = new AbortController();
  const signal = _worksAbortController.signal;

  window.addEventListener("resize", () => {
    dimensions = updateDimensions();
    const newMaxTranslate = dimensions.containerSize - dimensions.indicatorSize;

    targetTranslate = Math.min(Math.max(targetTranslate, -newMaxTranslate), 0);
    currentTranslate = targetTranslate;

    items.style.transform = `translateX(${currentTranslate}px)`;
  }, {signal});

  itemImages[0].style.opacity = activeItemOpacity;

  const firstYear = parseInt(itemElements[0].getAttribute("data-year"));
  updateYearCount(firstYear, false);

  animate();

  currentImageIndex = -1; 
  updatePreviewImage(0);

  CustomEase.create("hop", ".8, 0, 0.1, 1");

  function getActiveVideo() {
    const activeItem = itemElements[currentImageIndex];
    const vid = activeItem.getAttribute("data-vid");
    if (!vid) return null;
    return document.querySelector(`div[data-vid="${vid}"]`);
  }

  function resetVideo(video) {
    gsap.killTweensOf(video);
    if (resetTimeline) resetTimeline.kill();

    resetTimeline = gsap.timeline();
    resetTimeline
      .to(video, {
        width: "120px",
        height: "80px",
        top: "300px",
        duration: 1,
        ease: "hop",
      })
      .to(video, {
        clipPath: "inset(100% 0 0 0)",
        duration: 0.8,
        ease: "hop",
      }, "<");
  }

  function showVideo(video) {
    gsap.killTweensOf(video);
    if (videoTimeline) videoTimeline.kill();

    videoTimeline = gsap.timeline();
    videoTimeline
      .to(video, {
        width: "500px",
        height: "240px",
        top: 0,
        duration: 1,
        ease: "hop",
      })
      .to(video, {
        clipPath: "inset(0% 0 0 0)",
        duration: 1.2,
        ease: "hop",
      }, "<");
  }

  function hideImageBlur() {
    gsap.killTweensOf(previewImage);

    if (imageTimeline) imageTimeline.kill();
    imageTimeline = gsap.timeline();
    imageTimeline.to(previewImage, {
      filter: "blur(0px)",
      scale: 1,
      duration: 1,
      ease: "hop",
    });
  }

  function blurImage() {
    gsap.killTweensOf(previewImage);

    if (imageTimeline) imageTimeline.kill();
    imageTimeline = gsap.timeline();
    imageTimeline.to(previewImage, {
      filter: "blur(4px)",
      scale: 1.1,
      duration: 1.3,
      ease: "hop",
    });
  }

  function onActiveItemChange() {
    const isMobile = window.matchMedia("(hover: none)").matches;
    if (!isHoveringPreview && !isMobile) return;

    const activeVideo = getActiveVideo();

    if (previousVideo && previousVideo !== activeVideo) {
      gsap.killTweensOf(previousVideo);
      resetVideo(previousVideo);
    }

    if (activeVideo) {
      showVideo(activeVideo);
      blurImage();
    } else {
      gsap.killTweensOf(previewImage);
      hideImageBlur();
    }

    previousVideo = activeVideo;
  }

  function updatePreviewImage(index) {
    if (currentImageIndex !== index) {
      currentImageIndex = index;
      const targetItem = itemElements[index];
      const targetSrc = targetItem.querySelector("img").getAttribute("src");

      const targetName = projects[index].name;
      const targetClient = projects[index].client;
      const targetRole = projects[index].role;
      const targetCategory = projects[index].category;
      const targetDescription = projects[index].description;
      const targetLink = projects[index].link;

      projectName.textContent = targetName;
      clientInfo.textContent = targetClient;
      roleInfo.textContent = targetRole;
      categoryInfo.textContent = targetCategory;
      descriptionInfo.textContent = targetDescription;

      preview.href = targetLink;

      previewImage.setAttribute("src", targetSrc);
      gsap.killTweensOf(previewImage);
      gsap.fromTo(previewImage,
        { scale: 1.2 },
        { scale: 1, duration: 0.4, ease: "power2.out" }
      );

      const year = targetItem.getAttribute("data-year");
      updateYearCount(parseInt(year));

      onActiveItemChange();
    }
  }

  preview.addEventListener("click", (e) => {
    e.preventDefault();
    const href = preview.getAttribute("href");
    if (!href || href === "#") return;

    window.open(href, "_blank");
  })

  preview.addEventListener("mouseenter", () => {
    isHoveringPreview = true;
    const activeVideo = getActiveVideo();

    if (activeVideo) {
      gsap.killTweensOf(activeVideo);
      gsap.killTweensOf(previewImage);
      showVideo(activeVideo);
      blurImage();
      previousVideo = activeVideo;
    }
  });

  preview.addEventListener("mouseleave", () => {
    isHoveringPreview = false;
    const activeVideo = getActiveVideo();

    if (activeVideo) {
      gsap.killTweensOf(activeVideo);
      resetVideo(activeVideo);
    }

    gsap.killTweensOf(previewImage);
    hideImageBlur();
    previousVideo = null;
  });

  const isMobileInit = window.matchMedia("(hover: none)").matches;
  if (isMobileInit) {
    const initVideo = getActiveVideo();
    if (initVideo) {
      showVideo(initVideo);
      previousVideo = initVideo;
    }
  }

  function resize() {
    const w = window.innerWidth; 
    const h = window.innerHeight;
    if (w <= 1280 && w >= 992) {
      gsap.set(".main-content", { left: "8vw" });
      gsap.set(".info-container", { paddingLeft: "40px" });
    } else if (w > 1280) {
      gsap.set(".main-content", { left: "28vw" });
      gsap.set(".info-container", { paddingLeft: "48px" });
    } else if (w > 767 && w <= 991 && h >= 1024) {
      gsap.set(".year-count-container", { left: "12vw" });
      gsap.set(".minimap", { left: "calc(12vw + 260px)" })
      gsap.set(".main-content", { left: "28vw", bottom: "10vh", flexDirection: "column", gap: "40px" });
      gsap.set(".info-container", { paddingLeft: "0px" });
      gsap.set(".project-name", { marginTop: "0px" })
    }
  }

  window.addEventListener("resize", resize, { signal });

  resize();
}


// ================================================
// PAGE-SPECIFIC ANIMATION DISPATCHER
// ================================================

function runPageAnimation(namespace) {
  const handlerName = `init${capitalize(namespace)}Animation`;
  if (typeof window[handlerName] === 'function') {
    window[handlerName]();
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ================================================
// RESIZE
// ================================================

let _currentBreakpoint = getCurrentBreakpoint(window.innerWidth);

window.addEventListener('resize', function () {
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
      .to(".nav-bar",           { pointerEvents: "none", duration: .1 }, "<")
      .to(".page-transition",   {
        clipPath: "inset(0% 0 100% 0)",
        duration: 1.5,
        ease: "hop",
        onComplete: () => { gsap.set(".nav-bar", { pointerEvents: "auto" }); }
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
      .set(".transition-canvas", { scale: 1, borderRadius: "" })
      .set(".page-name", { top: "" });

    setWaveFillFor(".transition-canvas", AppState.waveState.fill);
  }
}

// ================================================
// CONTENT ANIMATION
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

// ================================================
// BARBA.JS — chỉ init một lần duy nhất
// ================================================

window.addEventListener("popstate",    () => { AppState.isHistoryNavigation = true; });
window.addEventListener("beforeunload",() => { AppState.isHistoryNavigation = true; });

barba.init({
  sync: true,

  transitions: [
    {
      name: 'default-transition',

      async leave(data) {
        if (data.current.namespace === 'service') destroyServiceAnimation();
        if (data.current.namespace === 'works') destroyWorksAnimation();
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

barba.hooks.after((data) => {
  setTimeout(() => {
    AppState.isTransitioning  = false;
    AppState.isHistoryNavigation = false;

    const ns = data.next.namespace;
    if (ns !== 'home') runPageAnimation(ns);
  }, 200);
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
        opacity: 0.7,
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

window.addEventListener("load", () => {
  const navEntry = performance.getEntriesByType("navigation")[0];
  const currentContainer = document.querySelector('[data-barba="container"]');
  const namespace = currentContainer?.dataset.barbaNamespace;

  if (namespace === 'home') {
    gsap.set(".nav-bar",    { scale: 0 });
    initHomeAnimation();
  } else {
    gsap.set(".nav-bar", { scale: 1, pointerEvents: "auto" });
    initStagger();
    if (namespace) runPageAnimation(namespace);
  }

  initNav();
  initHoverPreview();

  if (navEntry.type === "reload") {
    initAllWaves();
  }

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