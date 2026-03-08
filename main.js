
  // ===============
  // SERVICE SECTION
  // ===============
  const processImage = document.querySelector(".process-image");
  const serviceText = document.querySelectorAll(".service-text");
  processImage.src = `https://cdn.jsdelivr.net/gh/lhai-ng/portfoliov1-assets@main/process1.webp`;

  setupSplits(
    gsap,
    serviceText,
    1,
    "power3.inOut",
    -100,
    0.05, 
    0,
    {
      trigger: ".service-text",
      start: "top bottom",
      end: "center center"
    }
  );

  const tl4 = gsap.timeline({
    scrollTrigger: {
      trigger: ".process",
      start: "top top",
      end: "+=8000",      
      scrub: 1,
      pin: true,
      anticipatePin: 1,
    },
  });

  tl4
    .set([".direction", ".design", ".development"], {
      top: "120%",
      scale: .7
    })
  
  tl4.to(".direction", {
    top: "-60%",
    duration: 4,
    ease: "sine.inOut",
    onUpdate: () => {
      processImage.src = "https://cdn.jsdelivr.net/gh/lhai-ng/portfoliov1-assets@main/process1.webp";
    }
  })
  tl4.to(".direction", {
    transform: screenWidth <= 479 ? "translate(-50%, 0%)" : "rotate(0deg)",
    scale: 1,
    duration: 2.5,
    ease: "sine.inOut",
  },"<")
  tl4.to(".design", {
    top: "-60%",
    duration: 4,
    ease: "sine.inOut",
    onUpdate: () => {
      processImage.src = "https://cdn.jsdelivr.net/gh/lhai-ng/portfoliov1-assets@main/process2.webp";
    }
  })
  tl4.to(".design", {
    transform: screenWidth <= 479 ? "translate(-50%, 0%)" : "rotate(0deg)",
    scale: 1,
    duration: 2.5,
    ease: "sine.inOut",
  }, "<")
  tl4.to(".development", {
    top: "-60%",
    duration: 4,
    ease: "sine.inOut",
    onUpdate: () => {
      processImage.src = "https://cdn.jsdelivr.net/gh/lhai-ng/portfoliov1-assets@main/process3.webp";
    },
  })
  tl4.to(".development", {
    transform: screenWidth <= 479 ? "translate(-50%, 0%)" : "rotate(0deg)",
    scale: 1,
    duration: 2.5,
    ease: "sine.inOut"
  }, "<")
 
  document.addEventListener("scroll", () => {
    if (window.scrollY > 1200) {
      gsap.set(".about-contact", {
        bottom: "-120vh",
      })
    } else {
      gsap.set(".about-contact", {
        bottom: "Auto",
      })
    }
  })








  // ===============
  // WORKS SECTION
  // ===============
  const projects = [...document.querySelectorAll(".project")];

  let projectHeight, projectOldHeight;

  if (screenWidth > 991) {
    projectHeight = "96px";
    projectOldHeight = "56px";
  } else if (screenWidth > 767) {
    projectHeight = "72px";
    projectOldHeight = "44px";
  } else {
    projectHeight = "160px";
    projectOldHeight = "30px";
  }

  gsap.set(".project-link", {
    x: screenWidth > 767 ? 280 : 0,
    y: screenWidth > 767 ? 0 : 360,
  });

  gsap.set(".project-info", {
    x: screenWidth > 767 ? -320 : 0,
    y: screenWidth > 767 ? 0 : -360,
  });
  gsap.set(".project-name", { scale: 1, opacity: 0.2 });
  gsap.set(".project-preview", { scale: 0 });

  gsap.to(".works-quantity", {
    scrollTrigger: {
      trigger: ".works-title-container",
      start: "top bottom",
      end: "bottom center",
    },
    right: "0",
    ease: "sine.inOut",
  })

  const projectTimelines = projects.map((project) => {
    return gsap.timeline({
      paused: true,
      defaults: { ease: "power2.out" }
    })
    .to(project, {
      height: projectHeight,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0)
    .to(project.querySelector(".project-link"), {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "power2.inOut"
    }, 0)
    .to(project.querySelector(".project-info"), {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "power2.inOut"
    }, 0)
    .to(project.querySelector(".project-slider"), {
      yPercent: -100,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0)
    .to(project.querySelector(".project-name"), {
      scale: 1.1,
      opacity: 1,
      duration: 0.6,
      ease: "power4.inOut"
    }, 0)
    .to(project.querySelector(".project-preview"), {
      scale: 1,
      duration: 0.5,
      ease: "power4.inOut",
    }, 0)
  });

  projects.forEach((project, index) => {
    if (screenWidth > 991) {
      project.addEventListener("mouseenter", () => {
        projectTimelines.forEach((tl, i) => {
          if (i !== index) tl.reverse();
        });
        projectTimelines[index].play();
      });

      project.addEventListener("mouseleave", () => {
        projectTimelines[index].reverse();
      });
    } else {
      project.addEventListener("click", () => {
        const isThisProjectOpen = projectTimelines[index].progress() > 0;
        
        if (isThisProjectOpen) {
          projectTimelines[index].reverse();
        } else {
          projectTimelines.forEach((tl, i) => {
            if (i !== index) tl.reverse();
          });
          projectTimelines[index].play();
        }
      });
    }
    
  });

    
  
  
  
  
  
  
  // ===============
  // ABOUT SECTION 
  // ===============
	
  const aboutCurrentlyImage = document.querySelector(".about-currently-image");
  aboutCurrentlyImage.src = "https://cdn.jsdelivr.net/gh/lhai-ng/portfoliov1-assets@main/about1.jpg";
  gsap.to(".about-video-container", {
    scrollTrigger: {
      trigger: ".about-section",
      start: "-500px top",
      end: screenWidth > 767 ? "none" : "+=150%",
      scrub: 1,
    },
    ease: "none",
    scale: 1,
    force3D: true,
  });


  const frameCount = 30;
  const img = document.querySelector(".about-video");

  const images = [];
  let loaded = 0;

  for (let i = 1; i <= frameCount; i++) {
    const image = new Image();
    image.src = `https://cdn.jsdelivr.net/gh/lhai-ng/portfoliov1-assets@main/about-sequence/about_${String(i).padStart(2, "0")}.webp`;
    images.push(image);

    image.onload = () => {
      loaded++;
      if (loaded === 1) img.src = image.src;
    };
  }

  const playhead = { frame: 0 };

  const tl6 = gsap.timeline({
    scrollTrigger: {
      trigger: ".about-section",
      start: "top top",
      end: screenWidth > 767 ? "+=1000%" : "+=150%",
      pin: true,
      scrub: 0.5,
      anticipatePin: 1,
      fastScrollEnd: true
    }
  });

  tl6
    .to(playhead, {
      frame: 29,
      ease: "none",
      duration: 2.5,
      onUpdate: () => {
        const frame = Math.round(playhead.frame);
        if (images[frame] && images[frame].complete) {
          img.src = images[frame].src;
        }
      }
    })
    .to(".about-video", {
      width: screenWidth > 767 ? "32%" : "60%",
      objectPosition: "35% 0%",
      ease: "power2.inOut",
      duration: 3,
    }, "<")

  if(screenWidth > 767) {
    tl6
      .to(".about-section", {
        x: "-300vw", 
        duration: 10,
        ease: "none",
        force3D: true
      })
  }
  
  
  
  
  
  // ===============
  // CONTACT SECTION
  // ===============

  const timeEl = document.getElementById("vn-time");
  const clockEl = timeEl.querySelector(".clock");

  function updateVietnamTime() {
    const now = new Date();

    timeEl.dateTime = now.toISOString();

    clockEl.textContent = now.toLocaleTimeString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  updateVietnamTime();
  setInterval(updateVietnamTime, 1000);

  const submitButton = document.querySelector(".submit-button");
  submitButton.type = "submit";
  const submitText = submitButton.querySelector(".submit-text-wrapper");

  const bookACall = document.querySelector(".book-a-call");
  const bacSlide = document.querySelector(".bac-slide");
  const backToTop = document.querySelector(".back-to-top");

  function animateContactButton(button, text) {
    gsap.to(button, {
      borderRadius: "5px",
      duration: .8,
      ease: "expo.out",
      overwrite: "auto",
    })
    gsap.to(text, {
      yPercent: -50,
      duration: 1,
      ease: "expo.out",
      overwrite: "auto",
    })
  }

  function resetContactButton(button, text) {
    gsap.to(button, {
      borderRadius: "50px",
      duration: 3,
      ease: "expo.out",
      overwrite: "auto",
    })
    gsap.to(text, {
      yPercent: 0,
      duration: .8,
      ease: "expo.out",
      overwrite: "auto",
    })
  }

  submitButton.addEventListener("mouseenter", () => {
    animateContactButton(submitButton, submitText)
  });
  submitButton.addEventListener("mouseleave", () => {
    resetContactButton(submitButton, submitText)
  });
  bookACall.addEventListener("mouseenter", () => {
    animateContactButton(bookACall, bacSlide)
  });
  bookACall.addEventListener("mouseleave", () => {
    resetContactButton(bookACall, bacSlide)
  });

  gsap.set(".back-to-top", {
    yPercent: 150
  })

  gsap.to(".back-to-top", {
    scrollTrigger: {
      trigger: ".back-to-top",
      start: "top bottom",
    },
    yPercent: 0,
    ease: "power4.out",
    duration: 1.2
  })

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    })
  })
  backToTop.addEventListener("mouseenter", () => {
    gsap.to(".btt-text-container", {
      yPercent: -50,
      duration: 1,
      ease: "expo.out",
      overwrite: "auto",
    })
  })
  backToTop.addEventListener("mouseleave", () => {
    gsap.to(".btt-text-container", {
      yPercent: 0,
      duration: 1,
      ease: "expo.out",
      overwrite: "auto",
    })
  })


  
  // ===============
  // OTHERS
  // ===============
	function getCurrentBreakpoint(width) {
    if (width >= 992) return 'large';
    if (width >= 768) return 'medium';
    if (width >= 480) return 'medium-small';
    return 'small';
  }

  let currentBreakpoint = getCurrentBreakpoint(screenWidth);

  window.addEventListener('resize', function() {
    const newWidth = window.innerWidth;
    const newBreakpoint = getCurrentBreakpoint(newWidth);
    if (newBreakpoint !== currentBreakpoint) {
      location.reload();
  	}
  });