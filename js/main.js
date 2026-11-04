/* =========================================================
   Medical AI Lab. — Home scripts
   ========================================================= */

/* 이미지 경로: 원본 Google Sites 이미지 URL.
   Google Sites 이미지 URL은 만료될 수 있으므로, 실제 배포 시에는
   이미지를 내려받아 images/ 폴더에 넣고 아래 경로를 바꾸는 것을 권장합니다.
   (예: logo: "images/logo.png") */
const IMAGES = {
  virtualDoctor: "https://sites.google.com/sitesv-images-rt/AMxu72upVFDOJUaMFJvXTiDNawXt659c44BCBUt0qCVGVR1Fo3FExn420m95GmqzQQYUA8XjxNXacDlK1DYtKf0OHgjkPUaSwiMI7AyqE4i1RU2yKeUYQurmDoh0k9PPnWeJpmhPPEo2FrzpsIBFXeS59NrnrCsbyNnCw0D3TfzRBiD4p2B2qentfGstHO48g8Wnu6lsUNqpeeSnv4f28KIWDOxxWqYSbatfQL9yj-PbtlQ=w1280",
  neuroGenetics: "https://sites.google.com/sitesv-images-rt/AMxu72s2TXtX8xNlV_vJAlQSX_XTxttkBmQMhkGlyAjGxheFBLWtI4bX0R5kVFyl9GRgoc0vljN6gO4ZNpWb8puUIGuBNsi-ev1Faq9-NI5fcqdUlLf_aTEo1UaE9Sy9jnGqQXmPOuy2xAjeIRen71qrcAaKfMZFjpZLfpy0mwofkIuxfaNf3a2_BRitXHRLPLhclI3LhfjQkzQhxlUhvK_MLDsDA2iyHf-p6hIpXYPB1Gw=w1280",
  mlMedical: "https://sites.google.com/sitesv-images-rt/AMxu72tgVhb4zx3tssPQFCKX6QUadd96wssafx7AzufK7m6UdYNFiIAHjVMo0cN4vRqztEgy7O-JhlMTcXT79g5rG-t3d_37nY61ASiuVBwRZP3YNxQ0gWFkBV-1CPeIzjmG2dp64YXQppUAm0RkERVWFdHOiMCxjXabLz7XeO3CKj4ewQilLiE37Eqz4SicsuycqfO5Jp2KQOjg0CpnxpT9YUa90KfF3TKAuQPuSUO7e_4=w1280",
  koreanIntro: "https://sites.google.com/sitesv-images-rt/AMxu72uxrLePT_pidv8RmWs56vGFQ9JH4e9JPI1fCXu-vO7xMR6zQjz2RFkuaPu2firjxw5i2O9mqMlgZ7zBeYqtF8Sqe-hMmbopuA46kJxblq1EI2q5Ks9Hf_HqRzQDho0C5khkYYX9kGo8B0Rv8Chw1T0SAzz7zr5kv1XyP2q9Jib82ySGIcW2vC3O_GmRTycyikix0fAWrbhwEx13eos5Dy3DwHfy7JWxPA8SIZuh=w1280",
};

document.addEventListener("DOMContentLoaded", () => {
  loadImages();
  initHeader();
  initMobileMenu();
  initSlider();
  initReveal();
  initToTop();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

/* ---------- 이미지 로딩 (실패 시 그라데이션 대체) ---------- */
function loadImages() {
  // <img data-img="...">
  document.querySelectorAll("img[data-img]").forEach((img) => {
    const src = IMAGES[img.dataset.img];
    if (!src) return img.classList.add("is-missing");
    img.onerror = () => img.classList.add("is-missing");
    img.src = src;
  });

  // 배경 이미지 [data-bg="..."]
  document.querySelectorAll("[data-bg]").forEach((el) => {
    const src = IMAGES[el.dataset.bg];
    if (!src) return el.classList.add("no-img");
    const probe = new Image();
    probe.onload = () => (el.style.backgroundImage = `url("${src}")`);
    probe.onerror = () => el.classList.add("no-img");
    probe.src = src;
  });
}

/* ---------- 스크롤 시 헤더 스타일 ---------- */
function initHeader() {
  const header = document.getElementById("header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 60);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- 모바일 메뉴 ---------- */
function initMobileMenu() {
  const header = document.getElementById("header");
  const btn = document.getElementById("hamburger");
  btn.addEventListener("click", () => header.classList.toggle("menu-open"));

  // 모바일에서 MEMBER 드롭다운 토글
  document.querySelectorAll(".nav__item--dropdown > .nav__link").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (window.innerWidth <= 860) {
        e.preventDefault();
        link.parentElement.classList.toggle("is-open");
      }
    });
  });

  // 링크 클릭 시 닫기
  document.querySelectorAll(".dropdown a, .nav__list > li:not(.nav__item--dropdown) > a").forEach((a) =>
    a.addEventListener("click", () => header.classList.remove("menu-open"))
  );
}

/* ---------- 히어로 슬라이더 ---------- */
function initSlider() {
  const slides = [...document.querySelectorAll(".hero__slide")];
  const dotsWrap = document.getElementById("heroDots");
  if (!slides.length || !dotsWrap) return; // 슬라이더가 없는 페이지
  const INTERVAL = 6000;
  let current = 0;
  let timer;

  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `${i + 1}번 슬라이드`);
    b.addEventListener("click", () => go(i, true));
    dotsWrap.appendChild(b);
    return b;
  });

  function go(index, user = false) {
    slides[current].classList.remove("is-active");
    dots[current].classList.remove("is-active");
    current = (index + slides.length) % slides.length;
    // 애니메이션 재시작을 위해 reflow
    void slides[current].offsetWidth;
    slides[current].classList.add("is-active");
    dots[current].classList.add("is-active");
    if (user) restart();
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(current + 1), INTERVAL);
  }

  document.querySelector(".hero__arrow--prev").addEventListener("click", () => go(current - 1, true));
  document.querySelector(".hero__arrow--next").addEventListener("click", () => go(current + 1, true));

  // 터치 스와이프
  let startX = null;
  const hero = document.getElementById("hero");
  hero.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  hero.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1), true);
    startX = null;
  });

  dots[0].classList.add("is-active");
  restart();
}

/* ---------- 스크롤 등장 애니메이션 ---------- */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    // 비율(threshold) 대신 여백 기준: 화면보다 긴 요소(교수 카드 등)도 윗부분이 보이면 바로 나타남
    { threshold: 0, rootMargin: "0px 0px -60px 0px" }
  );
  els.forEach((el, i) => {
    if (el.classList.contains("card")) el.style.transitionDelay = `${(i % 3) * 0.12}s`;
    io.observe(el);
  });
}

/* ---------- 맨 위로 버튼 ---------- */
function initToTop() {
  const btn = document.getElementById("toTop");
  window.addEventListener("scroll", () => btn.classList.toggle("is-visible", window.scrollY > 500), { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}
