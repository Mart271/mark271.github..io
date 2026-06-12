/* ============================================================
   PERSONA-INSPIRED PORTFOLIO — OOP ARCHITECTURE
   ------------------------------------------------------------
   Each visual system is its own class with a single
   responsibility. PortfolioApp composes and boots them all.

   Class map:
   ├─ SoundManager       sfx placeholder hooks (hover/confirm/cancel)
   ├─ LoadingScreen      P3-style "Now Loading" bar + dismissal
   ├─ CustomCursor       diamond cursor + eased trailing ring
   ├─ SeaBackground      canvas bubbles + click ripples
   ├─ RevealObserver     scroll-in animations (IntersectionObserver)
   ├─ StatAnimator       skill bar fills + eased number counters
   ├─ NavController      active-section tracking + wipe transition
   ├─ GlitchEffect       random RGB-split pulses on hero text
   ├─ TimelineProgress   scroll-drawn calendar line
   └─ PortfolioApp       composition root / orchestrator
   ============================================================ */

class SoundManager {
    /* Placeholder hooks — wire real audio later, e.g.:
       this.bank = { hover:new Audio('sfx/hover.mp3'),
                     confirm:new Audio('sfx/confirm.mp3'),
                     cancel:new Audio('sfx/cancel.mp3') };          */
    constructor() { this.bank = {}; this.enabled = true; }
    play(name) {
        if (!this.enabled || !this.bank[name]) return;
        this.bank[name].currentTime = 0;
        this.bank[name].play().catch(() => { });
    }
}

class LoadingScreen {
    constructor({ reduceMotion, onComplete }) {
        this.el = document.getElementById('loader');
        this.fill = document.getElementById('l-fill');
        this.reduceMotion = reduceMotion;
        this.onComplete = onComplete;
        this.progress = 0;
    }
    start() {
        this.fill.style.transition = 'width .25s ease';
        this.timer = setInterval(() => this.tick(), this.reduceMotion ? 40 : 180);
    }
    tick() {
        this.progress = Math.min(100, this.progress + Math.random() * 22);
        this.fill.style.width = `${this.progress}%`;
        if (this.progress >= 100) {
            clearInterval(this.timer);
            setTimeout(() => this.dismiss(), 350);
        }
    }
    dismiss() {
        this.el.classList.add('done');
        this.onComplete?.();
    }
}

class CustomCursor {
    constructor({ sound }) {
        this.dot = document.getElementById('cursor');
        this.ring = document.getElementById('cursor-ring');
        this.sound = sound;
        this.mouse = { x: innerWidth / 2, y: innerHeight / 2 };
        this.trail = { ...this.mouse };
        this.easing = 0.16;
    }
    static isSupported(reduceMotion) {
        return matchMedia('(hover:hover) and (pointer:fine)').matches && !reduceMotion;
    }
    enable() {
        addEventListener('mousemove', e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
        document.querySelectorAll('a,button').forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hot');
                this.sound.play('hover');
            });
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hot'));
        });
        this.loop();
    }
    disable() {
        this.dot.style.display = this.ring.style.display = 'none';
        document.body.classList.add('native-cursor');
    }
    loop() {
        this.dot.style.left = `${this.mouse.x}px`;
        this.dot.style.top = `${this.mouse.y}px`;
        this.trail.x += (this.mouse.x - this.trail.x) * this.easing;
        this.trail.y += (this.mouse.y - this.trail.y) * this.easing;
        this.ring.style.left = `${this.trail.x}px`;
        this.ring.style.top = `${this.trail.y}px`;
        requestAnimationFrame(() => this.loop());
    }
}

class Bubble {
    constructor(w, h) { this.reset(w, h, true); }
    reset(w, h, randomY = false) {
        this.x = Math.random() * w;
        this.y = randomY ? Math.random() * h : h + 10;
        this.r = Math.random() * 2.4 + 0.6;
        this.vy = -(Math.random() * 0.5 + 0.15);
        this.vx = (Math.random() - 0.5) * 0.18;
        this.alpha = Math.random() * 0.5 + 0.15;
        this.rgb = Math.random() < 0.25 ? '207,238,255' : '39,227,255';
    }
    update(t, w, h) {
        this.y += this.vy;
        this.x += this.vx + Math.sin(t * 2 + this.y * 0.01) * 0.2;
        if (this.y < -10) this.reset(w, h);
        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb},${this.alpha})`;
        ctx.fill();
    }
}

class Ripple {
    constructor(x, y) { this.x = x; this.y = y; this.r = 0; this.alpha = 0.5; }
    update() { this.r += 3.4; this.alpha *= 0.96; }
    get dead() { return this.alpha < 0.02; }
    draw(ctx) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(39,227,255,${this.alpha})`;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(31,123,255,${this.alpha * 0.7})`;
        ctx.stroke();
    }
}

class SeaBackground {
    constructor({ sound }) {
        this.canvas = document.getElementById('sea');
        this.ctx = this.canvas.getContext('2d');
        this.sound = sound;
        this.bubbles = [];
        this.ripples = [];
        this.t = 0;
        this.maxRipples = 6;
    }
    start() {
        this.resize();
        addEventListener('resize', () => this.resize());
        addEventListener('click', e => this.spawnRipple(e.clientX, e.clientY));
        this.loop();
    }
    resize() {
        this.w = this.canvas.width = innerWidth;
        this.h = this.canvas.height = innerHeight;
        const count = Math.min(90, Math.floor(this.w * this.h / 22000));
        this.bubbles = Array.from({ length: count }, () => new Bubble(this.w, this.h));
    }
    spawnRipple(x, y) {
        if (this.ripples.length < this.maxRipples) this.ripples.push(new Ripple(x, y));
        this.sound.play('confirm');
    }
    loop() {
        const { ctx } = this;
        ctx.clearRect(0, 0, this.w, this.h);
        this.t += 0.008;
        for (const b of this.bubbles) { b.update(this.t, this.w, this.h); b.draw(ctx); }
        this.ripples = this.ripples.filter(r => (r.update(), r.draw(ctx), !r.dead));
        requestAnimationFrame(() => this.loop());
    }
}

class RevealObserver {
    constructor({ onReveal }) {
        this.onReveal = onReveal;
        this.io = new IntersectionObserver(
            entries => entries.forEach(en => this.handle(en)),
            { threshold: 0.18 }
        );
    }
    observeAll(selector = '.rv') {
        document.querySelectorAll(selector).forEach(el => this.io.observe(el));
    }
    revealNow(selector) {
        document.querySelectorAll(selector).forEach(el => el.classList.add('in'));
    }
    handle(entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        this.onReveal?.(entry.target);
        this.io.unobserve(entry.target);
    }
}

class StatAnimator {
    constructor({ reduceMotion }) {
        this.duration = reduceMotion ? 1 : 900;
        this.done = new WeakSet();
    }
    animate(el) {
        if (!el.classList.contains('tstat') || this.done.has(el)) return;
        this.done.add(el);
        const value = Number(el.dataset.lv);
        this.count(el.querySelector('.stat-count'), value);
    }
    count(el, target) {
        const t0 = performance.now();
        const step = now => {
            const k = Math.min(1, (now - t0) / this.duration);
            el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); // ease-out cubic
            if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
}

class NavController {
    constructor({ sound, reduceMotion }) {
        this.sound = sound;
        this.reduceMotion = reduceMotion;
        this.wipe = document.getElementById('wipe');
        this.links = [...document.querySelectorAll('#game-nav a')];
    }
    init() {
        this.links.forEach(a => a.addEventListener('click', e => {
            e.preventDefault();
            this.goTo(a.getAttribute('href'));
        }));
        this.trackActiveSection();
        document.getElementById('press-start')
            .addEventListener('click', () => this.goTo('#profile'));
    }
    goTo(hash) {
        const target = document.querySelector(hash);
        if (!target) return;
        this.sound.play('confirm');
        if (this.reduceMotion) { target.scrollIntoView(); return; }
        this.wipe.classList.add('go');
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'instant', block: 'start' });
            target.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
        }, 340);
        setTimeout(() => this.resetWipe(), 760);
    }
    resetWipe() {
        this.wipe.classList.remove('go');
        this.wipe.querySelectorAll('.w').forEach(w => {
            w.style.transition = 'none';
            w.style.transform = 'skew(-14deg) translateX(-160%)';
            requestAnimationFrame(() => (w.style.transition = ''));
        });
    }
    trackActiveSection() {
        const io = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (!en.isIntersecting) return;
                this.links.forEach(a =>
                    a.classList.toggle('active', a.getAttribute('href') === `#${en.target.id}`));
            });
        }, { rootMargin: '-40% 0px -50% 0px' });
        document.querySelectorAll('main section[id]').forEach(s => io.observe(s));
    }
}

class IconFallback {
    /* Swaps any tech-stack logo that fails to load (CDN down,
       offline, bad slug) for a themed diamond monogram. */
    init() {
        document.querySelectorAll('.tile-in img').forEach(img => {
            img.addEventListener('error', () => this.swap(img), { once: true });
            if (img.complete && img.naturalWidth === 0) this.swap(img);
        });
    }
    swap(img) {
        const mono = document.createElement('span');
        mono.className = 't-mono';
        const inner = document.createElement('b');
        inner.textContent = img.dataset.mono || '◆';
        mono.appendChild(inner);
        img.replaceWith(mono);
    }
}

class GlitchEffect {
    constructor({ interval = 2600 } = {}) {
        this.targets = [...document.querySelectorAll('.glitchable')];
        this.interval = interval;
    }
    start() {
        if (!this.targets.length) return;
        setInterval(() => this.pulse(), this.interval);
    }
    pulse() {
        const el = this.targets[Math.floor(Math.random() * this.targets.length)];
        el.classList.add('glitch');
        setTimeout(() => el.classList.remove('glitch'), 180 + Math.random() * 160);
    }
}

class TimelineProgress {
    constructor() {
        this.root = document.getElementById('tl');
        this.bar = this.root.querySelector('.tl-progress');
    }
    start() {
        addEventListener('scroll', () => this.draw(), { passive: true });
        this.draw();
    }
    draw() {
        const r = this.root.getBoundingClientRect();
        const visible = Math.min(Math.max(innerHeight * 0.75 - r.top, 0), r.height);
        this.bar.style.height = `${visible}px`;
    }
}

class ContactForm {
    constructor() {
        this.serviceId  = 'service_ov7bips';
        this.templateId = 'template_zak59ca';
        this.publicKey  = 'D6g0ZORmvOjaDXYr9';
        this.cmd    = document.getElementById('email-cmd');
        this.wrap   = document.getElementById('email-form-wrap');
        this.form   = document.getElementById('contact-form');
        this.submit = document.getElementById('ef-submit');
        this.status = document.getElementById('ef-status');
        this.isOpen = false;
    }
    init() {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        s.onload = () => emailjs.init({ publicKey: this.publicKey });
        document.head.appendChild(s);

        this.cmd.addEventListener('click', () => this.toggle());
        this.cmd.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') this.toggle(); });
        this.form.addEventListener('submit', e => this.send(e));
    }
    toggle() {
        this.isOpen = !this.isOpen;
        this.wrap.classList.toggle('open', this.isOpen);
        this.cmd.setAttribute('aria-expanded', this.isOpen);
        if (this.isOpen) setTimeout(() => this.wrap.querySelector('input').focus(), 460);
    }
    async send(e) {
        e.preventDefault();
        if (!this.form.checkValidity()) { this.form.reportValidity(); return; }
        this.submit.disabled = true;
        this.submit.textContent = 'Sending…';
        this.setStatus('', '');
        try {
            await emailjs.sendForm(this.serviceId, this.templateId, this.form);
            this.setStatus('Message sent!', 'success');
            this.form.reset();
            setTimeout(() => this.toggle(), 2200);
        } catch {
            this.setStatus('Failed — please try again.', 'error');
        } finally {
            this.submit.disabled = false;
            this.submit.innerHTML = 'Send Message <span>▸</span>';
        }
    }
    setStatus(text, cls) {
        this.status.textContent = text;
        this.status.className = 'ef-status' + (cls ? ` ${cls}` : '');
    }
}

class PortfolioApp {
    constructor() {
        this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.sound = new SoundManager();
        this.stats = new StatAnimator({ reduceMotion: this.reduceMotion });
        this.reveals = new RevealObserver({ onReveal: el => this.stats.animate(el) });
        this.nav = new NavController({ sound: this.sound, reduceMotion: this.reduceMotion });
        this.cursor = new CustomCursor({ sound: this.sound });
        this.timeline = new TimelineProgress();
        this.loader = new LoadingScreen({
            reduceMotion: this.reduceMotion,
            onComplete: () => this.reveals.revealNow('#hero .rv'),
        });
    }
    boot() {
        this.loader.start();
        this.reveals.observeAll('.rv');
        this.nav.init();
        this.timeline.start();
        new IconFallback().init();

        CustomCursor.isSupported(this.reduceMotion)
            ? this.cursor.enable()
            : this.cursor.disable();

        if (!this.reduceMotion) {
            new SeaBackground({ sound: this.sound }).start();
            new GlitchEffect().start();
        }

        new ContactForm().init();
    }
}

new PortfolioApp().boot();