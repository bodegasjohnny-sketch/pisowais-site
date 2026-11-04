import { amortize, addOn, split503020, emergencyTarget, thirteenth, iponPlan, peso } from './money.js';
const $ = (s, r = document) => r.querySelector(s);
const val = (f, n) => parseFloat(f.elements[n].value);
function bind(id, fn) { const f = document.getElementById(id); if (!f) return; const run = () => { try { fn(f); } catch (e) {} }; f.addEventListener('input', run); f.addEventListener('submit', e => { e.preventDefault(); run(); }); run(); }
bind('t-amort', f => {
  const P = val(f, 'p'), r = val(f, 'r') / 100, n = val(f, 'n'); const a = amortize({ principal: P, monthlyRate: r, months: n }); const o = $('#t-amort-out');
  if (!a) { o.textContent = 'Enter an amount, a rate and a number of months.'; return; }
  const ad = addOn({ principal: P, monthlyRate: r, months: n });
  o.innerHTML = `<p><strong>Monthly payment (diminishing balance): ${peso(a.payment)}</strong><br>Total paid ${peso(a.total)}, total interest ${peso(a.interest)}.</p><p class="small">Same rate as flat add-on: ${peso(ad.payment)} a month, total interest ${peso(ad.interest)}.</p>` +
    '<div class="table-scroll" tabindex="0" role="region" aria-label="Amortization schedule"><table class="cmp"><thead><tr><th scope="col">Month</th><th scope="col">Interest</th><th scope="col">Principal</th><th scope="col">Balance</th></tr></thead><tbody>' +
    a.rows.slice(0, 60).map(x => `<tr><td>${x.month}</td><td>${peso(x.interest)}</td><td>${peso(x.principal)}</td><td>${peso(x.balance)}</td></tr>`).join('') + '</tbody></table></div>';
});
bind('t-budget', f => { const s = split503020(val(f, 't')); $('#t-budget-out').innerHTML = `<ul class="bars"><li><span>Needs 50%</span><strong>${peso(s.needs, 0)}</strong></li><li><span>Wants 30%</span><strong>${peso(s.wants, 0)}</strong></li><li><span>Savings and debt 20%</span><strong>${peso(s.savings, 0)}</strong></li></ul>`; });
bind('t-efund', f => { const m = val(f, 'm'); $('#t-efund-out').innerHTML = `<p>3 months: <strong>${peso(emergencyTarget({ monthlyEssentials: m, months: 3 }), 0)}</strong><br>6 months: <strong>${peso(emergencyTarget({ monthlyEssentials: m, months: 6 }), 0)}</strong></p>`; });
bind('t-13th', f => { const b = val(f, 'b'), mo = val(f, 'mo'); $('#t-13th-out').innerHTML = `<p>Estimated minimum 13th month pay: <strong>${peso(thirteenth({ basicTotalYear: b * mo }))}</strong></p>`; });
bind('t-ipon', f => {
  const p = iponPlan({ base: val(f, 'b'), weeks: Math.min(52, Math.max(1, val(f, 'w') || 52)), mode: f.elements.mode.value });
  $('#t-ipon-out').innerHTML = `<p><strong>Total by the end: ${peso(p.total, 0)}</strong></p><div class="table-scroll" tabindex="0" role="region" aria-label="Ipon challenge schedule"><table class="cmp"><thead><tr><th scope="col">Week</th><th scope="col">Week of</th><th scope="col">Save</th><th scope="col">Running total</th></tr></thead><tbody>` + p.rows.map(x => `<tr><td>${x.week}</td><td>${x.date}</td><td>${peso(x.amount, 0)}</td><td>${peso(x.running, 0)}</td></tr>`).join('') + '</tbody></table></div>';
});
