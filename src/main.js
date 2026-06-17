import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const lerp = (a, b, n) => (1 - n) * a + n * b;

/* =========================================================
   SMOOTH SCROLL (Lenis ↔ GSAP)
   ========================================================= */
let lenis;
if (!prefersReduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Anchor links → smooth scroll via Lenis
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    document.body.classList.remove('nav-open');
    $('#nav')?.classList.remove('is-open');
    if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.3 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* =========================================================
   PRELOADER
   ========================================================= */
function runLoader() {
  const loader = $('#loader');
  const pctEl = $('#loaderPct');
  const bar = $('.loader__bar i');
  const words = $$('.loader__word span:not(.sp)');

  gsap.to(words, { y: 0, stagger: 0.035, duration: 0.6, ease: 'power3.out', delay: 0.15 });

  let pct = 0;
  const tick = () => {
    pct += Math.random() * 14 + 6;
    if (pct >= 100) pct = 100;
    if (pctEl) pctEl.textContent = Math.floor(pct);
    if (bar) bar.style.width = pct + '%';
    if (pct < 100) setTimeout(tick, 110 + Math.random() * 120);
    else finish();
  };
  const finish = () => {
    gsap.to('.loader__inner', { y: -30, opacity: 0, duration: 0.5, ease: 'power2.in', delay: 0.25 });
    setTimeout(() => {
      document.body.classList.add('loaded');
      heroIntro();
      ScrollTrigger.refresh();
    }, 650);
  };
  if (prefersReduced) {
    if (pctEl) pctEl.textContent = '100';
    if (bar) bar.style.width = '100%';
    document.body.classList.add('loaded');
    gsap.set(words, { y: 0 });
    heroIntro();
  } else {
    setTimeout(tick, 350);
  }
}

/* =========================================================
   HERO — split chars + intro timeline
   ========================================================= */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  const frag = document.createDocumentFragment();
  [...text].forEach((ch) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? ' ' : ch;
    if (ch === ' ') span.style.width = '0.3em';
    frag.appendChild(span);
  });
  el.appendChild(frag);
  return [...el.querySelectorAll('.char')];
}

let heroChars = [];
$$('.hero__title [data-split]').forEach((w) => { heroChars = heroChars.concat(splitChars(w)); });

function heroIntro() {
  if (prefersReduced) {
    gsap.set(heroChars, { y: 0, opacity: 1 });
    $$('.hero .reveal-up').forEach((e) => e.classList.add('in'));
    return;
  }
  const tl = gsap.timeline();
  tl.fromTo(heroChars,
    { yPercent: 120, opacity: 0, rotateX: -40 },
    { yPercent: 0, opacity: 1, rotateX: 0, duration: 1, ease: 'power4.out', stagger: 0.035 }
  );
  // Reveal above-the-fold content via plain timers (decoupled from the RAF
  // ticker) so the hero never stays hidden if animation frames are paused.
  $$('.hero .reveal-up').forEach((e, i) => setTimeout(() => e.classList.add('in'), 400 + i * 90));

  // subtle parallax on hero content while scrolling
  gsap.to('.hero__inner', {
    yPercent: 18, opacity: 0.4, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__video', {
    yPercent: 14, scale: 1.08, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* =========================================================
   REVEAL — .reveal-up via IntersectionObserver
   ========================================================= */
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
$$('.reveal-up').forEach((el) => revealIO.observe(el));

// Failsafe (covers tabs opened in the background, where IO/RAF can stall):
// reveal anything already on screen once the page can actually run.
function revealInView() {
  $$('.reveal-up:not(.in)').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.92 && r.bottom > 0) el.classList.add('in');
  });
}
window.addEventListener('load', () => setTimeout(revealInView, 200));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { ScrollTrigger.refresh(); revealInView(); }
});

/* =========================================================
   MASKED TEXT — [data-reveal] section titles
   ========================================================= */
$$('[data-reveal]').forEach((el) => {
  const inner = document.createElement('span');
  inner.style.display = 'inline-block';
  inner.style.willChange = 'transform';
  while (el.firstChild) inner.appendChild(el.firstChild);
  el.appendChild(inner);
  gsap.set(inner, { yPercent: 115 });
  ScrollTrigger.create({
    trigger: el,
    start: 'top 88%',
    onEnter: () => gsap.to(inner, { yPercent: 0, duration: 1, ease: 'power4.out' }),
  });
});

/* =========================================================
   PARALLAX — [data-parallax]
   ========================================================= */
if (!prefersReduced) {
  $$('[data-parallax]').forEach((el) => {
    const amt = parseFloat(el.dataset.parallax) || 30;
    gsap.to(el, {
      yPercent: -amt / 10, ease: 'none',
      scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* =========================================================
   COUNT-UP STATS — [data-count]
   ========================================================= */
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const dur = 1500;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(eased * target).toString();
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toString();
  };
  requestAnimationFrame(step);
}
const countIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { countUp(en.target); countIO.unobserve(en.target); }
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => countIO.observe(el));

/* =========================================================
   NAV — stuck state + burger
   ========================================================= */
const nav = $('#nav');
ScrollTrigger.create({
  start: 'top -60', end: 99999,
  onUpdate: (self) => nav.classList.toggle('is-stuck', self.scroll() > 60),
});
// fallback if reduced motion / no scrolltrigger scroll events
window.addEventListener('scroll', () => nav.classList.toggle('is-stuck', window.scrollY > 60), { passive: true });

$('#burger')?.addEventListener('click', () => {
  nav.classList.toggle('is-open');
  document.body.classList.toggle('nav-open');
});

/* =========================================================
   CUSTOM CURSOR + MAGNETIC + HOVER
   ========================================================= */
if (!isTouch && !prefersReduced) {
  const cursor = $('.cursor');
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });
  const renderRing = () => {
    rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(renderRing);
  };
  renderRing();
  window.addEventListener('mousedown', () => cursor.classList.add('is-down'));
  window.addEventListener('mouseup', () => cursor.classList.remove('is-down'));

  $$('a, button, [data-magnetic], input, .fchip, [data-tilt]').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });

  // magnetic
  $$('[data-magnetic]').forEach((el) => {
    const strength = 0.35;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' }));
  });

  // 3D tilt cards
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 800, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power2.out' }));
  });
}

/* =========================================================
   LIGHTNING CANVAS (hero)
   ========================================================= */
function bolts() {
  const canvas = $('#bolts');
  if (!canvas || prefersReduced) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  let sparks = [];
  let strikes = [];
  let running = true;

  const seed = () => {
    const count = Math.min(170, Math.max(40, Math.round((w * h) / (15000 * dpr * dpr))));
    sparks = [];
    for (let i = 0; i < count; i++) {
      sparks.push({ x: Math.random() * w, y: Math.random() * h, vy: -(Math.random() * 0.4 + 0.1) * dpr, r: Math.random() * 1.6 * dpr + 0.4, a: Math.random() * 0.5 + 0.2 });
    }
  };
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width = canvas.offsetWidth * dpr;
    h = canvas.height = canvas.offsetHeight * dpr;
    seed();
  };
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);

  const makeStrike = () => {
    const x = Math.random() * w;
    const pts = [{ x, y: 0 }];
    let cx = x, cy = 0;
    const seg = h / (8 + Math.random() * 6);
    while (cy < h) {
      cy += seg;
      cx += (Math.random() - 0.5) * 120 * dpr;
      pts.push({ x: cx, y: cy });
    }
    strikes.push({ pts, life: 1, hue: Math.random() > 0.5 ? '#b026ff' : '#6eff3d' });
  };

  let last = 0;
  const draw = (t) => {
    ctx.clearRect(0, 0, w, h);
    // drifting electric sparks
    sparks.forEach((s) => {
      s.y += s.vy; s.x += Math.sin(t / 1000 + s.y) * 0.12 * dpr;
      if (s.y < 0) { s.y = h; s.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(176,38,255,${s.a})`;
      ctx.shadowBlur = 8 * dpr; ctx.shadowColor = '#b026ff';
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // occasional lightning
    if (t - last > 2200 + Math.random() * 2600) { makeStrike(); last = t; }
    strikes.forEach((st) => {
      st.life -= 0.05;
      ctx.beginPath();
      ctx.moveTo(st.pts[0].x, st.pts[0].y);
      st.pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = st.hue;
      ctx.globalAlpha = Math.max(st.life, 0) * 0.7;
      ctx.lineWidth = 2 * dpr;
      ctx.shadowBlur = 16 * dpr; ctx.shadowColor = st.hue;
      ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    });
    strikes = strikes.filter((s) => s.life > 0);
    if (running) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);

  // Stop drawing while the hero is off-screen — saves continuous CPU/GPU
  const heroEl = canvas.closest('section') || canvas;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; requestAnimationFrame(draw); }
    else if (!e.isIntersecting) { running = false; }
  }, { threshold: 0 }).observe(heroEl);
}

/* =========================================================
   FLAVORS — theme switcher
   ========================================================= */
const FLAVORS = {
  grape: {
    idx: '01 / 03', title: 'Grape Gambit', volt: 'High',
    desc: 'Dark, electric and a little bit cursed. A deep grape rush with a tart violet snap that hits like a power chord.',
    notes: ['Black grape', 'Tart finish', 'Purple haze'],
    acc: '#b026ff', acc2: '#ff2d9b', glow: 'rgba(176,38,255,0.55)',
  },
  lemon: {
    idx: '02 / 03', title: 'Lemon Hex', volt: 'Max',
    desc: 'A blinding citrus jolt charged with sour lightning. Bright, brash and impossible to ignore — the wake-up curse.',
    notes: ['Sour lemon', 'Electric zest', 'Golden sting'],
    acc: '#ffc83d', acc2: '#ff8a3d', glow: 'rgba(255,200,61,0.5)',
  },
  lime: {
    idx: '03 / 03', title: 'Lime Lizards', volt: 'Toxic',
    desc: 'Reptile-green and ruthlessly crisp. A toxic-lime snap with a cold, clean finish that slithers straight to focus.',
    notes: ['Crisp lime', 'Cold finish', 'Toxic green'],
    acc: '#6eff3d', acc2: '#1dd1a1', glow: 'rgba(110,255,61,0.45)',
  },
};
const flavorSection = $('#flavors');
const flavorImg = $('#flavorImg');
function setFlavor(key) {
  const f = FLAVORS[key];
  if (!f || !flavorSection) return;
  flavorSection.style.setProperty('--acc', f.acc);
  flavorSection.style.setProperty('--acc-2', f.acc2);
  flavorSection.style.setProperty('--acc-glow', f.glow);
  $('#flavorIdx').textContent = f.idx;
  $('#flavorTitle').textContent = f.title;
  $('#flavorDesc').textContent = f.desc;
  $('#flavorVolt').textContent = f.volt;
  $('#flavorNotes').innerHTML = f.notes.map((n) => `<li>${n}</li>`).join('');
  // image swap pop
  if (flavorImg) {
    flavorImg.classList.add('is-swap');
    setTimeout(() => flavorImg.classList.remove('is-swap'), 260);
  }
  $$('.fchip').forEach((c) => {
    const on = c.dataset.flavorPick === key;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}
$$('.fchip').forEach((c) => c.addEventListener('click', () => setFlavor(c.dataset.flavorPick)));

/* =========================================================
   CART TOAST + ENLIST
   ========================================================= */
const toast = $('#toast');
let toastT;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toast.classList.remove('is-show'), 2600);
}
$$('[data-add]').forEach((b) => b.addEventListener('click', () => {
  const card = b.closest('.pcard');
  const name = card?.querySelector('h3')?.textContent || 'ThunderStix';
  showToast(`⚡ ${name} added — fuel incoming`);
}));
$('#enlistForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.querySelector('input').value = '';
  $('#enlistDone').hidden = false;
  showToast('⚡ Enlisted in the Hudu Army');
});

/* =========================================================
   GAME — embedded arcade (fullscreen + keep it scaled to its frame)
   ========================================================= */
const gameFrame = $('#gameFrame');
$('#gameFullscreen')?.addEventListener('click', () => {
  if (!gameFrame) return;
  const req = gameFrame.requestFullscreen || gameFrame.webkitRequestFullscreen || gameFrame.msRequestFullscreen;
  if (req) req.call(gameFrame);
});
// The game sizes its canvas in JS from its own iframe viewport, which races on
// lazy-load (desktop) and can render zoomed/clipped until a reload. The frame
// is always 16:9 and the canvas content is 16:9, so instead of fighting that
// timing we inject a stylesheet into the iframe that forces the canvas to fill
// the frame. A stylesheet !important rule beats the game's inline px sizing, so
// it's immune to the race entirely (overlays are positioned relative to #stage,
// so they follow). Injected from the parent only, so the standalone game is
// untouched.
if (gameFrame) {
  const injectFit = () => {
    try {
      const doc = gameFrame.contentDocument;
      if (!doc || doc.getElementById('__embed-fit')) return;
      const st = doc.createElement('style');
      st.id = '__embed-fit';
      st.textContent =
        'html,body{width:100%!important;height:100%!important}' +
        '#stage{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}' +
        '#game{width:100%!important;height:100%!important;border-radius:0!important}';
      doc.head.appendChild(st);
    } catch (e) { /* ignore */ }
  };
  // Branded loader stays over the game until its title art is actually loaded.
  // The game starts drawing its menu before assets arrive (the cream flash), so
  // we preload the same title assets it uses (shared cache) and reveal once in.
  const gameLoader = $('#gameLoader');
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    setTimeout(() => gameLoader && gameLoader.classList.add('is-hidden'), 300);
  };
  const preloadThenReveal = () => {
    const assets = [
      './game/assets/HuduRX_Thunderstix_Landing_Page_BKGD.png',
      './game/assets/Hudu_Pattern.svg',
      './game/assets/ThunderStix_Game_Logo.svg',
      './game/assets/Doc_Hudu.svg',
    ];
    Promise.allSettled(assets.map((src) => new Promise((res) => {
      const im = new Image();
      im.onload = im.onerror = res;
      im.src = src;
    }))).then(reveal);
    setTimeout(reveal, 6000); // safety net so the loader can never get stuck
  };

  // Only act once the REAL game is in the iframe — a lazy iframe's initial
  // about:blank reports readyState 'complete', which would hide the loader early.
  const gameDocReady = () => {
    try { return !!(gameFrame.contentDocument && gameFrame.contentDocument.querySelector('#game')); }
    catch (e) { return false; }
  };
  const onGameReady = () => { if (!gameDocReady()) return; injectFit(); preloadThenReveal(); };
  gameFrame.addEventListener('load', onGameReady);
  if (gameDocReady()) onGameReady();
}

/* =========================================================
   BOOT
   ========================================================= */
setFlavor('grape');
bolts();
runLoader();
window.lenis = lenis; // debug/scroll hook
window.addEventListener('load', () => ScrollTrigger.refresh());
