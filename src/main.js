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
    idx: '01 / 03', title: 'Grape Gambit', volt: '200mg',
    desc: 'Dark, electric and a little bit cursed. Deep grape with a tart violet snap that hits like a power chord.',
    notes: ['Black grape', 'Tart snap', 'Purple haze'],
    acc: '#b026ff', glow: 'rgba(176,38,255,0.55)',
    img: './img/flavor-grape.webp', alt: 'ThunderStix Grape Gambit stick pack',
  },
  coco: {
    idx: '02 / 03', title: 'Pineapple Coco-Loco', volt: '200mg',
    desc: 'Tropical and unhinged. Sweet pineapple crashes into creamy coconut — then the thunder rolls in.',
    notes: ['Sweet pineapple', 'Creamy coconut', 'Tropic thunder'],
    acc: '#ffd002', glow: 'rgba(255,208,2,0.5)',
    img: './img/flavor-pineapple.webp', alt: 'ThunderStix Pineapple Coco-Loco stick pack',
  },
  lime: {
    idx: '03 / 03', title: 'Lime Lazarus', volt: '200mg',
    desc: 'Back-from-the-dead crisp. Cold, clean lime that resurrects you mid-slump — no water, no mercy.',
    notes: ['Crisp lime', 'Ice-cold finish', 'Risen again'],
    acc: '#6eff3d', glow: 'rgba(110,255,61,0.45)',
    img: './img/flavor-lime.webp', alt: 'ThunderStix Lime Lazarus stick pack',
  },
};
// pre-warm all three pack renders so flavor switches never flash
Object.values(FLAVORS).forEach((f) => { const im = new Image(); im.src = f.img; });
const flavorSection = $('#flavors');
const flavorImg = $('#flavorImg');
function setFlavor(key) {
  const f = FLAVORS[key];
  if (!f || !flavorSection) return;
  flavorSection.style.setProperty('--acc', f.acc);
  flavorSection.style.setProperty('--acc-glow', f.glow);
  $('#flavorIdx').textContent = f.idx;
  $('#flavorTitle').textContent = f.title;
  $('#flavorDesc').textContent = f.desc;
  $('#flavorVolt').textContent = f.volt;
  $('#flavorNotes').innerHTML = f.notes.map((n) => `<li>${n}</li>`).join('');
  // image swap pop
  if (flavorImg) {
    flavorImg.src = f.img;
    flavorImg.alt = f.alt;
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
// Click-to-play: the game NEVER boots on scroll. Visitors see the opaque
// poster; only a Tap-to-Play click loads the iframe (behind the branded
// loader, which lifts on the game's own 'hudu:ready' paint signal). This
// both removes any chance of a boot-glitch flash during scrolling and stops
// the game engine from running/rebooting in the background while browsing.
// The game sizes its own canvas (aspect-preserving contain-fit, re-checked
// every frame), so no parent-side sizing hacks are needed in any container.
if (gameFrame) {
  const gameLoader = $('#gameLoader');
  const gamePoster = $('#gamePoster');
  const gameScreen = $('.gaming__screen');
  const GAME_SRC = gameFrame.getAttribute('data-src');
  let revealed = false, safetyTimer = 0, gameStarted = false;

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    clearTimeout(safetyTimer);
    setTimeout(() => gameLoader && gameLoader.classList.add('is-hidden'), 250);
  };
  window.addEventListener('message', (e) => {
    if (e.source === gameFrame.contentWindow && e.data === 'hudu:ready') reveal();
  });

  // Immersive mode: on touch devices the tiny inline band is a bad play
  // surface, so Tap-to-Play expands the screen to a fixed full-viewport
  // overlay (page scroll locked) with its own ✕ — and, where the browser
  // allows it (iOS 16.4+, Android, desktop), we ALSO request native
  // fullscreen on the .gaming__screen CONTAINER, which hides the browser's
  // URL bar/tabs entirely while keeping our ✕ inside the fullscreened
  // subtree. If the request is denied, the CSS overlay stands on its own.
  const wantsImmersive = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 760;
  const goFullscreen = (el) => {
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!fn) return;
    try { const p = fn.call(el); if (p && p.catch) p.catch(() => {}); } catch (e) { /* unsupported — overlay covers it */ }
  };
  const leaveFullscreen = () => {
    if (!(document.fullscreenElement || document.webkitFullscreenElement)) return;
    const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    try { const p = fn.call(document); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
  };
  const enterImmersive = () => {
    gameScreen?.classList.add('is-immersive');
    document.documentElement.classList.add('game-lock');
    if (lenis) lenis.stop();
    if (gameScreen) goFullscreen(gameScreen); // hide browser chrome too, where supported
  };
  const exitImmersive = () => {
    leaveFullscreen();
    gameScreen?.classList.remove('is-immersive');
    document.documentElement.classList.remove('game-lock');
    if (lenis) lenis.start();
  };

  const bootGame = () => {
    if (gameStarted) return;
    gameStarted = true;
    revealed = false;
    gamePoster?.classList.add('is-hidden');
    gameLoader?.classList.remove('is-hidden');
    if (wantsImmersive()) enterImmersive();
    gameFrame.src = GAME_SRC;
    clearTimeout(safetyTimer);
    safetyTimer = setTimeout(reveal, 8000); // last-resort unstick if 'hudu:ready' never arrives
  };
  gamePoster?.addEventListener('click', bootGame);
  // PLAY FULLSCREEN: fullscreen the CONTAINER (loader + ✕ stay visible inside)
  // on every device; touch devices additionally get the immersive overlay as
  // the fallback state if the fullscreen request is denied.
  $('#gameFullscreen')?.addEventListener('click', () => {
    bootGame();
    if (wantsImmersive()) { enterImmersive(); return; } // enterImmersive requests fullscreen itself
    if (gameScreen) goFullscreen(gameScreen);
  });

  // Clean-out: stop the game (audio + loop) on ✕/Exit or when it scrolls out
  // of view — about:blank tears down its audio + RAF, and the poster returns.
  const stopGame = () => {
    if (!gameStarted) return;
    gameStarted = false;
    revealed = false;
    clearTimeout(safetyTimer);
    exitImmersive();
    gameFrame.src = 'about:blank';
    gameLoader?.classList.add('is-hidden');
    gamePoster?.classList.remove('is-hidden');
  };
  new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) stopGame();
  }, { threshold: 0 }).observe(gameFrame);
  $('#gameExit')?.addEventListener('click', stopGame);
  $('#gameClose')?.addEventListener('click', stopGame);
}

/* =========================================================
   DOC HUDU — cursor reaction + magical particle emitter
   Doc leans/drifts toward the pointer and trails green/purple/gold
   sparkles. JS owns the img transform (float bob + tilt); a canvas
   layer draws the particles. Idle unless the section is on-screen.
   ========================================================= */
(() => {
  const media = $('.hudu__media');
  const doc = $('#huduImg');
  const fx = $('.hudu__fx');
  if (!media || !doc || !fx || prefersReduced) return;

  const ctx = fx.getContext('2d');
  const COLORS = ['#6eff3d', '#b026ff', '#ffd002']; // green · purple · gold
  // dpr 1 on purpose: the sparkles are soft glows, and a hi-dpi backing store
  // quadruples the pixels pushed per frame for no visible gain.
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    const r = media.getBoundingClientRect();
    if (!r.width || !r.height) return; // layout not ready yet — retry on IO/resize
    W = r.width; H = r.height;
    fx.width = Math.round(W * dpr); fx.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  let particles = [];
  let hovering = false, visible = false, running = false;
  let mx = W / 2, my = H / 2;      // pointer in media space
  let tx = 0, ty = 0, cx = 0, cy = 0, hov = 0; // tilt targets/current + hover ease
  let t = 0, lastSpawn = 0;

  const setTargets = (e) => {
    const r = media.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
    tx = ((mx / r.width) - 0.5) * 2;   // -1..1
    ty = ((my / r.height) - 0.5) * 2;
  };
  media.addEventListener('pointerenter', () => { hovering = true; });
  media.addEventListener('pointerleave', () => { hovering = false; tx = 0; ty = 0; });
  media.addEventListener('pointermove', setTargets);

  const spawn = (n) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.4 + Math.random() * 1.7;
      particles.push({
        x: mx, y: my,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.7,
        life: 1, decay: 0.010 + Math.random() * 0.012,
        size: 2.5 + Math.random() * 4.5, rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.2,
        col: COLORS[(Math.random() * COLORS.length) | 0],
      });
    }
  };

  const spark = (s) => { // 4-point concave sparkle
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0);
    ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.fill();
  };

  const loop = (now) => {
    if (!visible) { running = false; return; } // stop RAF when off-screen
    t += 0.016;
    cx += (tx - cx) * 0.09; cy += (ty - cy) * 0.09;
    hov += ((hovering ? 1 : 0) - hov) * 0.08;
    const bob = Math.sin(t * 1.1) * 9;
    doc.style.transform =
      `translate3d(${(cx * 22).toFixed(2)}px, ${(bob + cy * 14).toFixed(2)}px, 0) rotate(${(cx * 6).toFixed(2)}deg) scale(${(1 + hov * 0.04).toFixed(3)})`;

    if (hovering && now - lastSpawn > 26) { spawn(2); lastSpawn = now; }

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.vx *= 0.99;
      p.life -= p.decay; p.rot += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      // two-pass glow (big faint halo + bright core) — reads the same as
      // shadowBlur but costs a fraction of it; canvas shadows are a GPU hog
      const s = p.size * (0.6 + p.life * 0.6);
      const a = Math.max(0, p.life);
      ctx.globalAlpha = a * 0.28; spark(s * 2.2);
      ctx.globalAlpha = a; spark(s);
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(loop);
  };
  const kick = () => { if (!running && visible) { running = true; requestAnimationFrame(loop); } };

  new IntersectionObserver((ents) => {
    visible = ents[0].isIntersecting;
    if (visible) { resize(); kick(); }
  }, { threshold: 0.05 }).observe(media);
})();

/* =========================================================
   BOOT
   ========================================================= */
setFlavor('grape');
bolts();
runLoader();
window.lenis = lenis; // debug/scroll hook
window.addEventListener('load', () => ScrollTrigger.refresh());
