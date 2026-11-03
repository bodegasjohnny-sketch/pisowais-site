import { ROOT, loadReferrals, applyReferral } from './main.js';
const grid = document.getElementById('plat-grid'), table = document.getElementById('plat-table');
(async () => {
  const [data, cfg] = await Promise.all([fetch(ROOT + 'data/rates.json').then(r => r.json()), loadReferrals()]);
  const sorted = [...data.platforms].sort((a, b) => b.rate - a.rate);
  if (grid) {
    grid.innerHTML = sorted.map(p => `<article class="card plat tilt reveal in" id="p-${p.id}">
      <div class="logo-tile ${p.logo_tile === 'dark' ? 'dark' : ''}"><img src="${ROOT}assets/logos/${p.logo}" alt="${p.name} logo" loading="lazy" width="180" height="48"></div>
      <div><h3 style="margin:0">${p.name}</h3><div class="small muted">${p.product}</div></div>
      <div><span class="rate">${p.rate_label}</span><div class="asof">Base rate, as of ${p.as_of}. Rates change, check the app.</div></div>
      ${p.promo ? `<div><span class="tag promo">Promo</span> <span class="small">${p.promo_label}</span></div>` : ''}
      <div><span class="tag">Best for: ${p.best_for}</span></div>
      <p class="small" style="margin:0">${p.conditions}</p>
      <p class="con" style="margin:0"><strong>Honest con:</strong> ${p.cons}</p>
      <p class="small" style="margin:0"><strong>Insurance:</strong> ${p.pdic}</p>
      <div class="actions"><a class="btn btn-navy btn-sm" data-ref="${p.id}" href="${p.official}" target="_blank" rel="noopener">Open account at ${p.name}</a><span class="tag aff" hidden>Affiliate link</span></div>
      <p class="asof" style="margin:0">Source: ${p.sources.map((s, i) => `<a href="${s}" target="_blank" rel="noopener">[${i + 1}]</a>`).join(' ')}</p>
    </article>`).join('');
    grid.querySelectorAll('a[data-ref]').forEach(a => applyReferral(a, cfg));
  }
  if (table) {
    table.innerHTML = `<thead><tr><th scope="col">Platform</th><th scope="col">Product</th><th scope="col">Base rate p.a.</th><th scope="col">Key condition</th><th scope="col">As of</th></tr></thead><tbody>` +
      `<tr><td>Traditional bank (example)</td><td>BPI Regular Savings</td><td>0.0625%</td><td>${data.baseline.conditions}</td><td>${data.baseline.as_of}</td></tr>` +
      sorted.map(p => `<tr><td><strong>${p.name}</strong></td><td>${p.product}</td><td>${p.rate_label}</td><td>${p.conditions.split('. ')[0]}.</td><td>${p.as_of}</td></tr>`).join('') + '</tbody>';
  }
})();
