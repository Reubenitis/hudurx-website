# HuduRX — ThunderStix · Fuel The Thunder

An immersive, single-page marketing site for **ThunderStix** by **HuduRX** — a
high-voltage, direct-to-mouth caffeinated power powder aimed at gamers and active
young adults.

Built as a fast, animation-rich experience: kinetic hero with the ThunderStix
wordmark over a product video, a full-bleed lightning/particle canvas, smooth
scrolling, a live flavor switcher, the Doc Hudu mascot section, and a shop.

## Tech stack

- [Vite](https://vitejs.dev/) (vanilla JS, no framework)
- [GSAP](https://gsap.com/) + ScrollTrigger — scroll-driven & timeline animation
- [Lenis](https://github.com/darkroomengineering/lenis) — smooth scrolling
- Canvas 2D — hero lightning & particle field

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5180)
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Structure

```
index.html        # markup for the whole single-page experience
src/main.js       # interactions: smooth scroll, reveals, cursor, flavors, canvas
src/style.css     # design system + all section styling
public/img/       # brand logos, mascot, product renders
public/video/     # hero product video
```

## Brand notes

- **Palette:** near-black base, electric purple, toxic green, gold, magenta
- **Mascot:** Doc Hudu, the voodoo physician who "prescribes" thunder
- **Flavors:** Grape Gambit · Lemon Hex · Lime Lizards
- **Tagline:** *Fuel the Thunder*

---

> These statements have not been evaluated by the FDA. ThunderStix is a dietary
> supplement and is not intended to diagnose, treat, cure, or prevent any disease.
