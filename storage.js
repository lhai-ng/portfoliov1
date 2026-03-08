  // ================
  // HERO AND MENU ANIMATION 
  // ================
  const tl1 = gsap.timeline();

  const hero = document.querySelector(".hero-section");
  let heroMembrane = null;
  const mainTitle = document.querySelectorAll(".main-title");
  const locationText = document.querySelectorAll(".location-text");
  const scrollReminder = document.querySelectorAll(".scroll-reminder-1");
  const subtitleText = document.querySelectorAll(".subtitle-text");
  const navLink = document.querySelectorAll(".nav-link");
	
  const menu = document.querySelector(".menu");
  const toggleButton = document.querySelector(".toggle-button");
  const iconBars = document.querySelector(".icon-bars");
  const bar1 = document.querySelector(".bar-1");
  const bar2 = document.querySelector(".bar-2");
  const bar3 = document.querySelector(".bar-3");
  const navigationLinkTexts = document.querySelectorAll(".navigation-link-text");
  const socialLinkTexts = document.querySelectorAll(".social-link-text");

  tl1.to(".hero-preloader-container", {
    borderRadius: "10px",
    duration: 1.2,
    ease: "expo.inOut",
    delay: .8
  })
  tl1.to(".pre-slider", {
    top: "0",
    duration: 1.2,
    ease: "expo.inOut"
  }, "<")
  tl1.to(".pre-text-list", {
    yPercent: -50,
    duration: 1,
    ease: "expo.inOut"
  }, "<")
  tl1.to(".pre-text-list", {
    yPercent: -100,
    opacity: "0",
    duration: .8,
    ease: "power4.out"
  })
  tl1.to(".hero-preloader-container", {
    width: "100%",
    duration: .8,
    ease: "expo.in",
  }, "<")
  tl1.to(".hero-preloader-container", {
    height: "100%",
    duration: .8,
    ease: "expo.out",
  })

  function setupSplits(
    timeline,
    elements,
    duration, 
    ease, 
    yPercent, 
    stagger = .1,
    delay = 0,
    scrollTrigger = null
  ) {
    elements.forEach((element) => {
      element.split = new SplitText(element, {
        type: "lines, words, chars",
        linesClass: "split-line",
      })

      document.querySelectorAll(".split-line").forEach(el => {
        const wrapper = Object.assign(document.createElement("div"), { className: "split-parent" });
        el.replaceWith(wrapper);
        wrapper.appendChild(el);
      });

      element.anim = timeline.from(element.split.lines, {
        duration: duration,
        ease: ease,
        yPercent: yPercent,
        stagger: stagger,
        delay: delay,
        scrollTrigger: scrollTrigger,
        overwrite: "auto",
      }, "<");
    });
  }

  function runSplit(element) {
    splitText = new SplitText(element, {
      type: "words, chars",
      charsClass: "char"
    });
  }

  runSplit(mainTitle);

  tl1.from(".main-title .char", {
    yPercent: 100,
    duration: 1,
    ease: "expo.out",
    stagger: .05,
    delay: .4,
  }, "<")
  tl1.to(".logo", {
    rotation: 360,
    scale: 1,
    ease: "expo.out(1.5)",
    duration: 2
  },"<")
  setupSplits(tl1, scrollReminder, 2, "power4.out", 100, .1, .1);
  setupSplits(tl1, subtitleText, 1.5, "expo.out", 100, .1, .1);
  setupSplits(tl1, navLink, 1.8, "power3.out", 100, .1);
  setupSplits(tl1, locationText, 2, "power4.out", 100, .1);
  
  
  tl1.eventCallback("onComplete", () => {
  	lenis.start();
    navLink.forEach(link => {
        link.split.revert();
    });

    const staggerLinks = document.querySelectorAll("[stagger-link]");
    let splitText;
    let isOpeningMenu = true;
    let isAnimating = false;
    let topValue;

    const timelineConfig = {
      paused: true,
      defaults: { overwrite: true },
      onComplete: () => isAnimating = false,
    };

    const tl2 = gsap.timeline(timelineConfig);
    const tl3 = gsap.timeline(timelineConfig);

    runSplit("[stagger-link]");

    staggerLinks.forEach((link) => {
      const letters = link.querySelectorAll("[stagger-link-text] .char");

      link.addEventListener("mouseenter", function() {
        gsap.to(letters, {
          yPercent: -100,
          duration: 0.7,
          ease: "power4.inOut",
          stagger: { each: 0.02 },
          overwrite: true
        });
      });

      link.addEventListener("mouseleave", function() {
        gsap.to(letters, {
          yPercent: 0,
          duration: 0.7,
          ease: "power4.inOut",
          stagger: { each: 0.02 }
        });
      });
    });

    function openMenu() {
      topValue = (iconBars.offsetHeight - bar1.offsetHeight) / 2;

      tl2.clear();
      tl2
        .to(".menu", {
          right: "0",
          duration: 1.2,
          ease: "power4.out"
        }, "<")
        .to(bar1, {
          rotation: 45,
          top: topValue,
          duration: 0.4,
          ease: "power3.inOut"
        }, "<")
        .to(bar2, {
          rotation: 90,
          duration: 0.4,
          ease: "power3.inOut"
        }, "<")
        .to(bar3, {
          rotation: -45,
          bottom: topValue,
          duration: 0.4,
          ease: "power3.inOut"
        }, "<")
        .to(".circle-1", {
          scale: 1,
          duration: .6,
          ease: "back.out(1.8)",  
          delay: .5
        }, "<")
        .to(".circle-2", {
          scale: 1,
          duration: .6,
          ease: "back.out(1.8)",
        }, "<")
        tl2.restart();
    }

    function closeMenu() {
      tl3.clear();
      tl3
        .to(bar1, {
          rotation: 0,
          top: 0,
          duration: 0.4,
          ease: "power3.inOut"
        })
        .to(bar2, {
          rotation: 0,
          duration: 0.4,
          ease: "power3.inOut"
        }, "<")
        .to(bar3, {
          rotation: 0,
          bottom: 0,
          duration: 0.4,
          ease: "power3.inOut"
        }, "<")
        .to(".menu", {
          right: "-100%",
          ease: "power3.in"
        }, "<")
        .to(".circle-1", {
          scale: 0,
          duration: .6,
          ease: "power4.out",
          delay: .4,
        }, "<")
        .to(".circle-2", {
          scale: 0,
          duration: .6,
          ease: "power4.out"
        }, "<")
        tl3.restart();
    }


    function resetOpenMenu() {
      topValue = (iconBars.offsetHeight - bar1.offsetHeight) / 2;

      gsap.set(bar1, {
        rotation: 45,
        top: topValue
      });
      gsap.set(bar2, {
        rotation: 90
      });
      gsap.set(bar3, {
        rotation: -45,
        bottom: topValue
      });
      gsap.set(".menu", {
        right: "0"
      });
    }

    // Toggle button
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

    let heroMembrane = null;
    let screenWidth = window.innerWidth;

    function toggleMenuButton() {
      screenWidth = window.innerWidth; 

      if (screenWidth < 992) {
        gsap.set(toggleButton, {
          scale: 1,
        });

        if (!heroMembrane) {
          heroMembrane = document.createElement('div');
          heroMembrane.className = 'hero-membrane';
          heroMembrane.style.pointerEvents = 'none';
          hero.appendChild(heroMembrane);
        }
      } 
      else if (screenWidth >= 992) {
        gsap.set(toggleButton, {
          scale: 0,
        });

        if (heroMembrane) {
          heroMembrane.remove();
          heroMembrane = null;
        }
      }
    }

    document.addEventListener('DOMContentLoaded', toggleMenuButton);
    window.addEventListener("scroll", toggleMenuButton);
    
    let resizeTimer;
    window.addEventListener("resize", function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(toggleMenuButton, 100);
    });
  });
  
  gsap.set([".hero-section"], {
    willChange: "transform, opacity, filter"
  });

  gsap.to(".hero-section", {
    scrollTrigger: {
      trigger: ".hero-section",
      start: "top top",
      scrub: 1,
    },
    ease: "none",
    scale: 0.9,
    force3D: true,
  });

  console.log("hehe")