const container = document.querySelector(".container");
  const items = document.querySelector(".items");
  const indicator = document.querySelector(".indicator");
  const itemElements = document.querySelectorAll(".item");
  const preview = document.querySelector(".img-preview")
  const previewImage = document.querySelector(".img-preview img");
  const itemImages = document.querySelectorAll(".item img");

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
  const activeItemOpacity = 1;

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

    const tensOffset = (9 - tens) * 96;
    const unitsOffset = (9 - units) * 96;

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

  function updatePreviewImage(index) {
  if (currentImageIndex !== index) {
    currentImageIndex = index;
    const targetItem = itemElements[index];
    const targetSrc = targetItem.querySelector("img").getAttribute("src");
    
    previewImage.setAttribute("src", targetSrc);
    gsap.killTweensOf(previewImage);
    gsap.fromTo(previewImage,
      { scale: 1.2 },
      { scale: 1, duration: 0.4, ease: "power2.out" }
    );

    const year = targetItem.getAttribute("data-year");
    updateYearCount(parseInt(year));
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

  window.addEventListener("resize", () => {
    dimensions = updateDimensions();
    const newMaxTranslate = dimensions.containerSize - dimensions.indicatorSize;

    targetTranslate = Math.min(Math.max(targetTranslate, -newMaxTranslate), 0);
    currentTranslate = targetTranslate;

    items.style.transform = `translateX(${currentTranslate}px)`;
  });

  itemImages[0].style.opacity = activeItemOpacity;

  const firstYear = parseInt(itemElements[0].getAttribute("data-year"));
  updateYearCount(firstYear, false);

  animate();


 CustomEase.create("hop", ".8, 0, 0.1, 1");

  const videos = document.querySelectorAll("video");
  let isHoveringPreview = false;
  let previousVideo = null;
  let videoTimeline = null;
  let resetTimeline = null;
  let imageTimeline = null;

  function getActiveVideo() {
    const activeItem = itemElements[currentImageIndex];
    const vid = activeItem.getAttribute("data-vid");
    if (!vid) return null;
    return document.querySelector(`video[data-vid="${vid}"]`);
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
        duration: 0.6,
        ease: "hop",
      })
      .to(video, {
        clipPath: "inset(100% 0 0 0)",
        duration: 0.5,
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