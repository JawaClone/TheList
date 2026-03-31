/* ══════════════════════════════════════════
   THE LIST — Main JavaScript
   ══════════════════════════════════════════ */

// ── LOADER ──
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('out');
    initHeroAnimations();
  }, 2000);
});

// ══════════════════════════════════════════
// CUSTOM CURSOR (lagged follow)
// ══════════════════════════════════════════
const cur  = document.getElementById('cur');
const cdot = document.getElementById('cdot');
let mx = 0, my = 0, cx = 0, cy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cdot.style.cssText = `left:${mx}px;top:${my}px`;
});

(function curLoop() {
  cx += (mx - cx) * .12;
  cy += (my - cy) * .12;
  cur.style.cssText = `left:${cx}px;top:${cy}px`;
  requestAnimationFrame(curLoop);
})();

document.querySelectorAll('a, button, .cta').forEach(el => {
  el.addEventListener('mouseenter', () => cur.classList.add('hover'));
  el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
});

// ══════════════════════════════════════════
// PARTICLES (dust in hero)
// ══════════════════════════════════════════
const canvas = document.getElementById('pc');
const ctx    = canvas.getContext('2d');

function resize() {
  canvas.width  = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener('resize', resize);

function newPt() {
  return {
    x:    Math.random() * innerWidth,
    y:    Math.random() * innerHeight,
    r:    Math.random() * .8 + .1,
    vx:   (Math.random() - .5) * .1,
    vy:   -Math.random() * .18 - .04,
    a:    Math.random() * .18 + .03,
    life: Math.random() * 400 + 120,
    max:  0,
  };
}

const pts = Array.from({ length: 38 }, () => newPt());
pts.forEach(p => { p.max = p.life; p.life = Math.random() * p.max; });

function tickParts() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pts.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0 || p.y < -5) {
      Object.assign(p, newPt());
      p.max = p.life;
      p.y   = canvas.height + 5;
    }
    const alpha = (p.life / p.max) * p.a;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  requestAnimationFrame(tickParts);
}
tickParts();

// ══════════════════════════════════════════
// SCROLL REVEAL (.r elements)
// ══════════════════════════════════════════
const revs = document.querySelectorAll('.r');
const io   = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('on');
  });
}, { threshold: .1 });

revs.forEach(el => io.observe(el));

// ══════════════════════════════════════════
// ANIMATION 1 — HAIRLINES DRAW FROM CENTER
// ANIMATION 2 — CORNER LABELS STAGGERED
// ANIMATION 3 — TAGLINE CHAR-BY-CHAR SCRAMBLE
// ══════════════════════════════════════════
function initHeroAnimations() {

  // 1. Hairlines draw
  setTimeout(() => {
    document.querySelectorAll('.hero-rule').forEach(r => r.classList.add('drawn'));
  }, 200);

  // 2. Corner labels — stagger TL → TR → BL → BR
  const corners = ['hero-corner-tl', 'hero-corner-tr', 'hero-corner-bl', 'hero-corner-br'];
  corners.forEach((cls, i) => {
    setTimeout(() => {
      const el = document.querySelector('.' + cls);
      if (el) el.classList.add('shown');
    }, 600 + i * 220);
  });

  // 3. Tagline char-by-char scramble reveal
  const tag = document.querySelector('.hero-tag');
  if (!tag) return;

  const original = tag.textContent;
  const chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ·';
  const len      = original.length;
  let revealed   = 0;

  tag.textContent  = '';
  tag.style.opacity = '1'; // override CSS animation

  function revealChar() {
    if (revealed >= len) return;
    let scrambles = 0;

    const iv = setInterval(() => {
      let display = '';
      for (let i = 0; i < len; i++) {
        if (i < revealed)       display += original[i];
        else if (i === revealed) display += chars[Math.floor(Math.random() * chars.length)];
        else                     display += '\u00a0';
      }
      tag.textContent = display;
      scrambles++;

      if (scrambles >= 3) {
        clearInterval(iv);
        // Commit real character before moving on
        let committed = '';
        for (let i = 0; i <= revealed; i++) committed += original[i];
        for (let i = revealed + 1; i < len; i++) committed += '\u00a0';
        tag.textContent = committed;
        revealed++;
        setTimeout(revealChar, 12);
      }
    }, 16);
  }

  setTimeout(revealChar, 800);
}

// ══════════════════════════════════════════
// ANIMATION 4 — LOGO PARALLAX on mouse
// ══════════════════════════════════════════
const logo = document.querySelector('.hero-logo');

document.addEventListener('mousemove', e => {
  if (!logo || window.scrollY > window.innerHeight * 0.6) return;
  const xPct = e.clientX / window.innerWidth  - 0.5;
  const yPct = e.clientY / window.innerHeight - 0.5;
  logo.style.transform = `translate(${xPct * -10}px, ${yPct * -7}px)`;
});

// ══════════════════════════════════════════
// ANIMATION 5 — COUNTDOWN with SCRAMBLE + FLIP
// ══════════════════════════════════════════
const cdIds   = ['cdD', 'cdH', 'cdM', 'cdS'];
const prevVals = { cdD: '', cdH: '', cdM: '', cdS: '' };
const cdChars = '0123456789';

function scrambleNum(el, target) {
  let ticks = 0;
  const iv = setInterval(() => {
    el.textContent =
      cdChars[Math.floor(Math.random() * cdChars.length)] +
      cdChars[Math.floor(Math.random() * cdChars.length)];
    ticks++;
    if (ticks >= 4) {
      clearInterval(iv);
      el.textContent = target;
    }
  }, 40);
}

function flipNum(el) {
  el.classList.remove('flip');
  void el.offsetWidth; // force reflow
  el.classList.add('flip');
}

function tickCountdown() {
  const evt  = new Date('2025-05-29T20:00:00');
  const diff = evt - new Date();
  if (diff <= 0) return;

  const pad  = n => String(n).padStart(2, '0');
  const vals = [
    pad(Math.floor(diff / 864e5)),
    pad(Math.floor(diff % 864e5 / 36e5)),
    pad(Math.floor(diff % 36e5  / 6e4)),
    pad(Math.floor(diff % 6e4   / 1e3)),
  ];

  cdIds.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.textContent === '--') {
      scrambleNum(el, vals[i]);           // first render → scramble in
    } else if (vals[i] !== prevVals[id]) {
      flipNum(el);                        // changed → flip
      setTimeout(() => { el.textContent = vals[i]; }, 175);
    }
    prevVals[id] = vals[i];
  });
}

tickCountdown();
setInterval(tickCountdown, 1000);

// ══════════════════════════════════════════
// ANIMATION 6 — DET-CELL STAGGER on scroll
// ══════════════════════════════════════════
const cells   = document.querySelectorAll('.det-cell');
const cellObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const idx = Array.from(cells).indexOf(e.target);
      setTimeout(() => e.target.classList.add('in'), idx * 110);
      cellObs.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

cells.forEach(c => cellObs.observe(c));

// ══════════════════════════════════════════
// ANIMATION 7 — MAGNETIC CTA BUTTON TILT
// ══════════════════════════════════════════
const ctaBtn = document.getElementById('ctaBtn');

if (ctaBtn) {
  ctaBtn.addEventListener('mousemove', e => {
    const rect = ctaBtn.getBoundingClientRect();
    const xRel = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const yRel = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    ctaBtn.style.transform =
      `perspective(500px) rotateX(${-yRel * 6}deg) rotateY(${xRel * 8}deg) translateY(-2px)`;
  });

  ctaBtn.addEventListener('mouseleave', () => {
    ctaBtn.style.transform = 'perspective(500px) rotateX(0) rotateY(0) translateY(0)';
  });
}
