# Persona-Inspired Portfolio — Mark Rainier Tagab

A personal portfolio website for a Computer Science student, heavily inspired by the UI/UX of *Persona 3 Reload* — slanted typography, electric blue palette, glassmorphism panels, and game-menu navigation — while staying professional enough for recruiters.

**Live feel:** navigating the site is meant to feel like moving through a stylish game menu, not a traditional website.

---

## Features

- **Loading screen** — P3-style "Now Loading" bar with a sweeping blue wedge
- **Hero** — slanted three-line name display, floating role chips, pulsing PRESS START button, and a blue-toned character illustration over an animated glow-ring backdrop
- **Game-menu navigation** — slanted right-side menu (bottom bar on mobile) with skew/scale hover states, active-section tracking, and a diagonal blue wipe transition between sections
- **Profile** — angled photo frame with layered glass cards (About, Education, Career Goal) sliding in from opposite directions
- **Tech Stack** — logo tile grid (Python, PHP, JavaScript, Flask, scikit-learn, pandas, MySQL, Git, Suricata, React Native, Flutter, Kotlin, HTML/CSS) on skewed glass cards, tinted to the site's blue palette, with domain chips below
- **Projects** — arcana-numbered project cards with tech chips and GitHub / Live Demo buttons
- **Experience** — P3 calendar-style timeline ("2024 / 02 — FRI" date plates) with a glowing progress line that draws as you scroll
- **Certifications** — hex-medal record list
- **Contact** — command-menu links (Email, LinkedIn, GitHub, Resume) with a sliding blue wedge on hover
- **Ambient effects** — underwater bubble particles, click ripples, drifting caustic light, floating shards, scanlines, custom diamond cursor with trailing ring, random glitch pulses on the hero name
- **Accessibility & performance** — respects `prefers-reduced-motion`, restores the native cursor on touch devices, lazy-loads icons, single lightweight canvas

---

## Project Structure

```
persona-portfolio/
├── index.html     # All markup: loader, nav, hero, six sections, footer
├── styles.css     # Design tokens, section styles, animations, responsive rules
├── app.js         # All behavior — OOP architecture (see below)
├── avatar.png     # Hero character illustration (transparent, blue-toned)
├── photo.jpg      # Profile photo (cropped 4:5 for the angled frame)
└── README.md
```

---

## Architecture (app.js)

Every visual system is a single-responsibility class, composed by one orchestrator:

```
PortfolioApp (composition root — wires everything in boot())
├─ SoundManager       sfx placeholder hooks (hover / confirm / cancel)
├─ LoadingScreen      "Now Loading" bar, fires onComplete callback
├─ CustomCursor       diamond dot + eased trailing ring
├─ SeaBackground      canvas loop, composed of:
│   ├─ Bubble         each particle owns update() / draw() / reset()
│   └─ Ripple         click rings with a `dead` getter for cleanup
├─ RevealObserver     IntersectionObserver wrapper with onReveal callback
├─ StatAnimator       eased number counters (legacy hook, currently idle)
├─ NavController      wipe transition, active tracking, Press Start
├─ IconFallback       swaps failed CDN logos for themed monograms
├─ GlitchEffect       random RGB-split pulses on hero text
└─ TimelineProgress   scroll-drawn calendar line
```

Key design choices:

- **Dependency injection** — classes receive collaborators via constructor options (`new NavController({ sound, reduceMotion })`), so implementations can be swapped without touching other classes.
- **Particles as objects** — the canvas loop just iterates `Bubble`/`Ripple` instances; adding a new particle type means one new class.
- **Callback decoupling** — `RevealObserver` doesn't know what reveals do; `PortfolioApp` wires the connections.

---

## Running Locally

No build step. Keep all files in one folder and open `index.html` in a browser — or serve it for nicer URLs:

```bash
npx serve .
# or
python -m http.server 8080
```

> Tech-stack logos load from the Simple Icons CDN (`cdn.simpleicons.org`), so they need an internet connection. If a logo fails to load, `IconFallback` swaps in a themed diamond monogram automatically.

---

## Customization

| What | Where |
|---|---|
| Colors / fonts / skew angle | `:root` design tokens at the top of `styles.css` |
| Name, roles, hero text | `#hero` section in `index.html` |
| About / Education / Goal | `#profile` section |
| Tech stack tiles | `#skills` — duplicate a `.tile`, change the icon slug and `data-mono` fallback |
| Projects & repo links | `#projects` — edit each `.proj-card` |
| Timeline entries | `#experience` — duplicate a `.tl-item` |
| Certifications | `#certifications` — duplicate a `.cert` |
| Contact links | `#contact` command menu |
| Sound effects | Fill `SoundManager.bank` in `app.js` with `Audio` objects |
| Resume download | Point the Resume command's `href` at your PDF |

---

## Tech

Vanilla **HTML + CSS + JavaScript (ES6 classes)** — no frameworks, no build tools.
Fonts: [Anton](https://fonts.google.com/specimen/Anton) + [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) via Google Fonts.
Icons: [Simple Icons](https://simpleicons.org/) CDN.

---

## Credits

Designed and built as an **original tribute** to the menu UI style of *Persona 3 Reload* (ATLUS). No game assets are used; the character illustration and all UI elements are original.

© 2026 Mark Rainier Tagab
