import { grow, leverage, scoreQuiz, QUIZ_AREAS, peso } from './calc.js';
import { ROOT } from './main.js';

const $ = (s, el = document) => el.querySelector(s);
const pct = r => (r * 100).toFixed(r < 0.01 ? 4 : 2).replace(/\.?0+$/, '') + '%';
const COLORS = ['#8A93B2', '#1F4EA6', '#F36C7A', '#F9B909', '#D6674B', '#0257AD'];

/* ---------- a) Idle Money Compounder ---------- */
async function compounder(root) {
  const data = await fetch(ROOT + 'data/rates.json').then(r => r.json());
  const plats = data.platforms;
  const picks = $('#cmp-picks', root);
  const defaults = ['gcash', 'maribank', 'salmon'];
  picks.innerHTML = '<legend class="small muted" style="margin-bottom:6px">Compare against (base rates, as of ' + data.checked + '):</legend>' + plats.map(p => `<label><input type="checkbox" value="${p.id}" ${defaults.includes(p.id) ? 'checked' : ''}><span>${p.name} ${p.rate_label}</span></label>`).join('');
  const inputs = ['amount', 'monthly', 'years'].map(id => $('#cmp-' + id, root));
  const outs = inputs.map(i => $(`output[for=${i.id}]`, root));
  const svg = $('#cmp-chart', root), cards = $('#cmp-cards', root), notes = $('#cmp-notes', root), legend = $('#cmp-legend', root), live = $('#cmp-live', root);
  function render() {
    const [P, M, Y] = inputs.map(i => +i.value);
    outs[0].textContent = peso(P); outs[1].textContent = peso(M); outs[2].textContent = Y + (Y == 1 ? ' year' : ' years');
    const chosen = [...picks.querySelectorAll('input:checked')].map(i => plats.find(p => p.id === i.value)).slice(0, 5);
    const series = [{ name: 'Traditional bank (' + pct(data.baseline.rate) + ')', rate: data.baseline.rate, p: null }, ...chosen.map(p => ({ name: p.name + ' (' + p.rate_label + ')', rate: p.rate, p }))]
      .map((s, i) => ({ ...s, color: COLORS[i % COLORS.length], res: grow({ principal: P, monthly: M, years: Y, rate: s.rate, tax: data.tax.final_withholding }) }));
    // chart
    const W = 640, H = 300, pad = 52, n = Y * 12;
    const hi = Math.max(...series.map(s => s.res.final)), lo0 = Math.min(...series.map(s => Math.min(...s.res.series)));
    const span = Math.max(hi - lo0, 1), min = Math.max(0, lo0 - span * .08), max = hi + span * .12;
    const x = i => pad + (W - pad - 70) * (i / n), y = v => H - 30 - (H - 50) * ((v - min) / (max - min));
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = min + (max - min) * k / 4; g += `<line x1="${pad}" x2="${W - 12}" y1="${y(v)}" y2="${y(v)}" stroke="#E2E4EE"/><text x="${pad - 6}" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="#4A5375">${v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : (v / 1000).toFixed(v < 1e5 ? 1 : 0) + 'k'}</text>`; }
    for (let yr = 0; yr <= Y; yr += Math.max(1, Math.ceil(Y / 6))) g += `<text x="${x(yr * 12)}" y="${H - 10}" font-size="11" text-anchor="middle" fill="#4A5375">Yr ${yr}</text>`;
    series.forEach(s => { const pts = s.res.series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '); const last = s.res.series[s.res.series.length - 1]; g += `<circle cx="${x(n)}" cy="${y(last)}" r="4" fill="${s.color}"/>`;
      g += `<polyline class="ln" points="${pts}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/>`; });
    svg.innerHTML = g;
    svg.querySelectorAll('.ln').forEach(l => { l.style.strokeDasharray = 1; l.style.strokeDashoffset = 1; l.getBoundingClientRect(); l.style.transition = 'stroke-dashoffset .9s ease'; l.style.strokeDashoffset = 0; });
    legend.innerHTML = series.map(s => `<li><i style="background:${s.color}"></i>${s.name}</li>`).join('');
    const base = series[0].res, best = series.reduce((a, b) => b.res.final > a.res.final ? b : a);
    cards.innerHTML = `<div class="rc"><div class="k">You put in</div><div class="v">${peso(base.contributed)}</div></div>
      <div class="rc"><div class="k">Traditional bank, after tax</div><div class="v">${peso(base.final)}</div></div>
      <div class="rc"><div class="k">${best.p ? best.p.name : 'Best'}, after tax</div><div class="v" style="color:#1E8A4C">${peso(best.res.final)}</div></div>
      <div class="rc" style="grid-column:1/-1;background:#FFF3C9"><div class="k">Extra after tax vs the traditional bank</div><div class="v">+${peso(best.res.final - base.final)}</div></div>`;
    live.textContent = `After ${Y} years, the traditional bank ends at ${peso(base.final)} and ${best.name} ends at ${peso(best.res.final)}, after 20 percent tax.`;
    notes.innerHTML = series.map(s => `<li><strong>${s.name}</strong>: net interest ${peso(s.res.netInterest)} (tax withheld ${peso(s.res.taxPaid)}). ${s.p ? s.p.pdic + ' <span class="asof">Rate as of ' + s.p.as_of + ', <a href="' + s.p.sources[0] + '" target="_blank" rel="noopener">source</a>.</span>' + (s.p.promo ? ' <span class="tag promo">Promo boosts not included</span>' : '') : data.baseline.conditions + ' <span class="asof">As of ' + data.baseline.as_of + ', <a href="' + data.baseline.source + '" target="_blank" rel="noopener">source</a>.</span>'}</li>`).join('');
  }
  root.addEventListener('input', render); render();
}

/* ---------- b) Credit Card Leverage Reality Check ---------- */
function leverageTool(root) {
  const ids = ['purchase', 'cashback', 'days', 'float', 'rate', 'limit'];
  const el = Object.fromEntries(ids.map(i => [i, $('#lev-' + i, root)]));
  const out = $('#lev-out', root);
  function render() {
    const r = leverage({ purchase: +el.purchase.value, cashBack: +el.cashback.value, daysToCash: +el.days.value, floatDays: +el.float.value, monthlyRate: (+el.rate.value) / 100, limit: +el.limit.value || 0 });
    const title = { green: 'Green: pays back before the due date', yellow: 'Yellow: works only if nothing goes wrong', red: 'Red: do not put this on the card' }[r.verdict];
    out.innerHTML = `<div class="verdict ${r.verdict}" role="status"><h3>${title}</h3><ul>${r.reasons.map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="result-cards">
        <div class="rc"><div class="k">Profit before interest</div><div class="v">${peso(r.profit)}</div></div>
        <div class="rc"><div class="k">Interest if carried ${r.carriedDays} days</div><div class="v">${peso(r.interestCost)}</div></div>
        <div class="rc"><div class="k">Net after interest</div><div class="v" style="color:${r.net > 0 ? '#1E8A4C' : '#C0392B'}">${peso(r.net)}</div></div>
        <div class="rc"><div class="k">Break-even cash return</div><div class="v">${peso(r.breakEvenReturn)}</div></div>
        <div class="rc"><div class="k">Profit gone after day</div><div class="v">${r.breakEvenDays ? Math.floor(r.breakEvenDays) : 'n/a'}</div></div>
        <div class="rc"><div class="k">Credit limit used</div><div class="v">${r.utilization === null ? 'n/a' : Math.round(r.utilization * 100) + '%'}</div></div>
      </div>
      <p class="small muted">Interest here is estimated daily at the monthly rate x 12 / 365 on the full purchase for the days past your due date. Real statements can also add late fees and compute on average daily balance, so the true cost can be higher. Cash advances cost more.</p>`;
  }
  root.addEventListener('input', render); render();
}

/* ---------- c) Business Bottleneck Finder ---------- */
const QUESTIONS = [
  ['cash', 'In the last 3 months, did you ever run short of cash to pay a bill or supplier on time?', ['Often', 'Once or twice', 'Never']],
  ['pricing', 'Do you know your true profit per item after all costs (materials, delivery, fees, your time)?', ['No idea', 'Roughly', 'Yes, written down']],
  ['inventory', 'How much of your stock has not sold in the last 60 days?', ['A lot', 'Some', 'Almost none']],
  ['tracking', 'Are your business and personal money in separate accounts with daily records?', ['Mixed together', 'Separate but no records', 'Separate and recorded']],
  ['followup', 'Do you follow up past customers for repeat orders?', ['Never', 'Sometimes', 'Every month']],
  ['owner', 'If you got sick for 2 weeks, would the business keep selling?', ['It would stop', 'Partly', 'Yes']],
  ['marketing', 'How consistent is your posting or marketing?', ['Only when I remember', 'A few times a month', 'Fixed weekly schedule']],
  ['debt', 'How heavy is your debt (cards, loans, 5-6) compared to monthly income?', ['Payments eat most of it', 'Manageable', 'Little or none']],
  ['idle', 'Where does your spare or emergency cash sit?', ['Wallet or 0% account', 'Regular bank savings', 'High-interest insured savings']],
  ['credit', 'How do you pay your credit card?', ['Minimum or late', 'Partial', 'Full every month, or no card']]
];
function quiz(root) {
  const form = $('#quiz-form', root), bar = $('#quiz-bar', root), out = $('#quiz-out', root);
  form.noValidate = true; form.innerHTML = QUESTIONS.map(([id, q, opts], i) => `<fieldset class="quiz-q"><legend>${i + 1}. ${q}</legend><div class="opts">${opts.map((o, s) => `<label><input type="radio" name="${id}" value="${s}" required><span>${o}</span></label>`).join('')}</div></fieldset>`).join('') + '<button class="btn btn-navy" type="submit">Show my top 3 fixes</button>';
  form.addEventListener('change', () => { const n = new FormData(form); bar.style.width = ([...n.keys()].length / QUESTIONS.length * 100) + '%'; bar.parentElement.setAttribute('aria-valuenow', [...n.keys()].length); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form); const ans = {};
    for (const [id] of QUESTIONS) { if (!fd.has(id)) { out.innerHTML = '<p class="form-status" role="alert">Please answer all 10 questions.</p>'; form.querySelector(`[name=${id}]`).focus(); return; } ans[id] = +fd.get(id); }
    const r = scoreQuiz(ans);
    out.innerHTML = `<div class="card" style="border:2px solid #1F4EA6" tabindex="-1" id="quiz-result"><p class="eyebrow">Your result</p><h3>${r.band}: ${r.total} / ${r.max}</h3>
      <p>Start with the <strong>${r.firstSection}</strong> section of the cheat sheet.</p>
      <ol>${r.weakest.map(w => `<li><strong>${w.label}</strong><ul>${w.actions.map(a => `<li>${a}</li>`).join('')}</ul></li>`).join('')}</ol>
      <p class="small muted">Scored only in your browser. Nothing was sent anywhere.</p>
      <a class="btn btn-gold" href="${ROOT}downloads/piso-wais-cheat-sheet.pdf" download>Download the cheat sheet (PDF)</a></div>`;
    $('#quiz-result').focus();
  });
}

const c = document.getElementById('compounder'); if (c) compounder(c);
const l = document.getElementById('leverage'); if (l) leverageTool(l);
const q = document.getElementById('bottleneck'); if (q) quiz(q);
