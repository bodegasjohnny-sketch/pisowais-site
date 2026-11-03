// Shared behaviour for every page. No trackers, no third-party calls.
document.documentElement.classList.remove('no-js');
export const ROOT = document.documentElement.dataset.root || './';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// mobile menu
const btn = document.querySelector('.menu-btn'), links = document.getElementById('nav-links');
if (btn && links) btn.addEventListener('click', () => { const o = links.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });

// scroll reveals
const rev = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  rev.forEach(el => io.observe(el));
} else rev.forEach(el => el.classList.add('in'));

// CSS 3D tilt cards (pointer devices only)
if (!reduce && matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

// animated counters
const counters = document.querySelectorAll('[data-count]');
const runCounter = el => {
  const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
  const fmt = v => pre + v.toLocaleString('en-PH', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
  if (reduce) { el.textContent = fmt(end); return; }
  const t0 = performance.now(), d = 1300;
  const step = t => { const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(end * e); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
};
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { runCounter(e.target); io.unobserve(e.target); } }));
  counters.forEach(c => io.observe(c));
} else counters.forEach(runCounter);

// parallax layers
const par = document.querySelectorAll('[data-parallax]');
if (par.length && !reduce) addEventListener('scroll', () => { const y = scrollY; par.forEach(el => { el.style.transform = `translate3d(0,${y * parseFloat(el.dataset.parallax)}px,0)`; }); }, { passive: true });

// sticky mobile CTA
const sticky = document.querySelector('.sticky-cta');
if (sticky) {
  const target = document.getElementById('cheatsheet');
  const upd = () => {
    const past = scrollY > 500;
    const r = target ? target.getBoundingClientRect() : null;
    const atForm = r && r.top < innerHeight && r.bottom > 0;
    sticky.classList.toggle('show', past && !atForm);

  };
  addEventListener('scroll', upd, { passive: true }); upd();
}

// WebGL hero with poster fallback
function webglOK() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; } }
const hero = document.querySelector('.hero[data-3d]');
if (hero) {
  const stage = hero.querySelector('.hero-stage');
  const mode = new URLSearchParams(location.search).get('hero');
  const ok = mode !== 'poster' && !reduce && webglOK();
  hero.dataset.heroMode = ok ? 'loading' : 'poster';
  if (ok) {
    const go = () => import('./hero3d.js').then(m => m.startHero(stage, () => { hero.classList.add('is-3d'); hero.dataset.heroMode = 'webgl'; }))
      .catch(err => { console.warn('3D hero failed, poster kept', err); hero.dataset.heroMode = 'poster'; });
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1200 }); else setTimeout(go, 300);
  }
}

// referral buttons: any [data-ref] link reads config/referrals.json
export async function loadReferrals() {
  try { const r = await fetch(ROOT + 'config/referrals.json', { cache: 'no-cache' }); return (await r.json()).platforms || {}; } catch { return {}; }
}
export function applyReferral(a, cfg) {
  const id = a.dataset.ref, p = cfg[id]; if (!p) return;
  const url = p.ref_url || p.official_url; a.href = url;
  const isAff = p.ref_url && p.official_url && p.ref_url.replace(/\/$/, '') !== p.official_url.replace(/\/$/, '');
  a.rel = isAff ? 'sponsored noopener' : 'noopener'; a.target = '_blank';
  const tag = a.parentElement.querySelector('.tag.aff');
  if (tag) tag.hidden = !isAff;
  a.dataset.affiliate = isAff ? 'yes' : 'no';
}
const refLinks = document.querySelectorAll('a[data-ref]');
if (refLinks.length) loadReferrals().then(cfg => refLinks.forEach(a => applyReferral(a, cfg)));

// lead form: no backend connected. We never claim an email was saved.
document.querySelectorAll('form.lead-form').forEach(f => {
  f.addEventListener('submit', e => {
    e.preventDefault();
    const status = f.parentElement.querySelector('.form-status');
    if (f.querySelector('.hp input')?.value) return;
    const email = f.querySelector('input[type=email]');
    if (!email.checkValidity()) { status.textContent = 'Please type a valid email, or just tap Download.'; email.focus(); return; }
    const subj = encodeURIComponent('Piso Wais cheat sheet updates');
    const body = encodeURIComponent('Hi Piso Wais, please add me to the update list: ' + email.value);
    status.innerHTML = 'Your download is starting. We do not store emails on this site yet. To get updates, <a href="mailto:info@johnnybodegas.com?subject=' + subj + '&body=' + body + '">send us this email</a> or follow <a href="https://www.facebook.com/pisowaisph" target="_blank" rel="noopener">@pisowaisph on Facebook</a>.';
    const a = document.createElement('a'); a.href = ROOT + 'downloads/piso-wais-cheat-sheet.pdf'; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
  });
});
