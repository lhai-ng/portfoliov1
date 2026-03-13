// function initServiceAnimation() {
//     const hoverCursorStart = document.querySelector(".hover-cursor-start");
//     const navBar = document.querySelector(".nav-bar");
//     const hoverCursorImage = document.querySelector(".hover-cursor-image");
//     const hoverImage = document.querySelector(".hover-image");
//     const serviceTitles = document.querySelectorAll(".service-title");

//     let mouseX = 0, mouseY = 0;
//     let curX = 0, curY = 0;

//     document.addEventListener('mousemove', (e) => {
//         mouseX = e.clientX;
//         mouseY = e.clientY;
//     });

//     navBar.addEventListener('mouseenter', (e) => {
//         gsap.to(".service-container", {
//             cursor: "auto",
//             duration: .5,
//             ease: "expo.out",
//             overwrite: true,
//         })
//         gsap.to(hoverCursorStart, {
//             scale: 0,
//             duration: .5,
//             ease: "expo.out",
//             overwrite: true,
//         })
//     })
//     navBar.addEventListener('mouseleave', (e) => {
//         gsap.to(".service-container", {
//             cursor: "none",
//             duration: .5,
//             ease: "expo.out",
//             overwrite: true,
//         })
//         gsap.to(hoverCursorStart, {
//             scale: 1,
//             duration: .5,
//             ease: "expo.out",
//             overwrite: true,
//         })
//     })

//     serviceTitles.forEach((title, index) => {
//         title.addEventListener("mouseenter", () => {
//             hoverImage.src = `https://cdn.jsdelivr.net/gh/lhai-ng/portfoliov1-assets@main/process${index + 1}.webp`
//             gsap.to(".hover-cursor-text", {
//                 scale: 0,
//                 duration: .5,
//                 ease: "expo.out",
//                 overwrite: true,
//             })
//             gsap.to(hoverImage, {
//                 scale: 1,
//                 duration: .5,
//                 ease: "expo.out",
//                 overwrite: true,
//             })
//             gsap.to(title.querySelector(".service-number"), {
//                 opacity: .20,
//                 duration: .5,
//                 ease: "expo.out",
//                 overwrite: true,
//             })
//         })
//         title.addEventListener("mouseleave", () => {
//             gsap.to(".hover-cursor-text", {
//                 scale: 1,
//                 duration: .5,
//                 ease: "expo.out",
//                 overwrite: true,
//             })
//             gsap.to(hoverImage, {
//                 scale: 0,
//                 duration: .5,
//                 ease: "expo.out",
//                 overwrite: true,
//             })
//             gsap.to(title.querySelector(".service-number"), {
//                 opacity: .05,
//                 duration: .5,
//                 ease: "expo.out",
//                 overwrite: true,
//             })
//         })
//     })

//     function animate() {
//         curX += (mouseX - curX) * 0.15;
//         curY += (mouseY - curY) * 0.15;
        
//         hoverCursorStart.style.left = curX + 'px';
//         hoverCursorStart.style.top  = curY + 'px';
        
//         requestAnimationFrame(animate);
//     }
//     animate();
// }