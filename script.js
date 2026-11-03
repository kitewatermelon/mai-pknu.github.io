document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const toTop = document.getElementById('toTop');

  /* ---------- Header style & top button on scroll ---------- */
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 60);
    toTop.classList.toggle('show', y > 500);
  };
  window.addEventListener('scroll', onScroll);
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Mobile menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  hamburger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
  });

  /* ---------- Hero slider ---------- */
  const slides = document.querySelectorAll('.slide');
  const dotsWrap = document.getElementById('dots');
  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `슬라이드 ${i + 1}`);
    dot.addEventListener('click', () => { goTo(i); restart(); });
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll('button');

  function goTo(i) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }
  function restart() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 6000);
  }
  document.getElementById('prevBtn').addEventListener('click', () => { goTo(current - 1); restart(); });
  document.getElementById('nextBtn').addEventListener('click', () => { goTo(current + 1); restart(); });
  dots[0].classList.add('active');
  restart();

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    io.observe(el);
  });

  /* ---------- Count-up numbers ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      let n = 0;
      const step = () => {
        n += 1;
        el.textContent = n;
        if (n < target) setTimeout(step, 120);
      };
      step();
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
});
