import { PLAYS, score, shuffle } from './plays.js';
const TITLES = { 'loan-interest-terms-101': 'Loan and interest terms 101', 'why-filipinos-borrow': 'Why Filipinos borrow and how loans work', 'amortization-simplified': 'Amortization simplified', 'first-time-borrower-checklist': 'First-time borrower checklist', 'check-your-credit-report': '3 ways to check your credit report', 'petsa-de-peligro-survival': 'Petsa de Peligro survival tips', 'rule-50-30-20': '50-30-20 rule for Filipino salaries', 'emergency-fund-how-much': 'Rainy day emergency fund: how much?', 'ipon-challenges-2027': 'Ipon challenges for 2027', 'online-scams-to-avoid': '12 online scams to avoid', 'thirteenth-month-pay-plan': '13th month pay plan', 'where-to-park-idle-money': 'Where to park idle money' };
const UI = {
  en: { start: 'Start', next: 'Next', back: 'Back', see: 'See my result', q: (i, n) => `Question ${i} of ${n}`, again: 'Start over', steps: 'Your next steps', read: 'Read next', missed: 'Questions to review', pick: 'Pick an answer to continue.', correct: 'Answer' },
  fil: { start: 'Simulan', next: 'Susunod', back: 'Bumalik', see: 'Tingnan ang resulta', q: (i, n) => `Tanong ${i} sa ${n}`, again: 'Ulitin', steps: 'Mga susunod mong hakbang', read: 'Basahin', missed: 'Mga tanong na dapat balikan', pick: 'Pumili ng sagot para magpatuloy.', correct: 'Sagot' },
};
const root = document.getElementById('play'); const play = PLAYS[root.dataset.play]; const base = root.dataset.root || '../../';
const KEY = 'pw-play-' + play.id;
let st = load();
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.order) return s; } catch (e) {} return fresh(); }
function fresh(lang) { const order = {}; play.questions.forEach(q => order[q.id] = shuffle(q.opts.map(o => o.id))); return { idx: -1, answers: {}, order, lang: lang || 'en' }; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const t = () => UI[st.lang];
document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { st.lang = b.dataset.lang; save(); render(); }));
function langButtons() { document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === st.lang ? 'true' : 'false')); document.documentElement.lang = st.lang === 'fil' ? 'fil' : 'en'; }
function render(focus) {
  langButtons(); const n = play.questions.length;
  if (st.idx < 0) { root.innerHTML = `<div class="play-card"><p class="eyebrow">${n} ${st.lang === 'fil' ? 'tanong' : 'questions'}, 2-4 min</p><h2>${esc(play.title[st.lang])}</h2><p class="muted">${st.lang === 'fil' ? 'Walang sign-up. Nasa browser mo lang ang sagot mo.' : 'No sign-up. Your answers stay in this browser only.'}</p><button class="btn btn-gold" id="p-start">${t().start}</button></div>`; root.querySelector('#p-start').onclick = () => { st.idx = 0; save(); render(true); }; return; }
  if (st.idx >= n) return result(focus);
  const q = play.questions[st.idx]; const pct = Math.round(st.idx / n * 100);
  const opts = st.order[q.id].map(id => q.opts.find(o => o.id === id));
  root.innerHTML = `<div class="play-card"><div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${st.idx}" aria-label="${t().q(st.idx + 1, n)}"><span style="width:${pct}%"></span></div>
<form id="p-form"><fieldset><legend><span class="small muted">${t().q(st.idx + 1, n)}</span><span class="qtext" tabindex="-1" id="p-q">${esc(q[st.lang])}</span></legend>
${opts.map(o => `<label class="opt"><input type="radio" name="a" value="${o.id}" ${st.answers[q.id] === o.id ? 'checked' : ''}><span>${esc(o[st.lang])}</span></label>`).join('')}
</fieldset><p class="small err" id="p-err" role="alert"></p><div class="play-nav"><button type="button" class="btn btn-ghost btn-sm" id="p-back" ${st.idx === 0 ? 'disabled' : ''}>${t().back}</button><button class="btn btn-navy btn-sm" type="submit">${st.idx === n - 1 ? t().see : t().next}</button></div></form></div>`;
  const f = root.querySelector('#p-form');
  f.addEventListener('change', () => { st.answers[q.id] = f.elements.a.value; save(); });
  f.addEventListener('submit', e => { e.preventDefault(); if (!f.elements.a.value) { root.querySelector('#p-err').textContent = t().pick; return; } st.answers[q.id] = f.elements.a.value; st.idx++; save(); render(true); });
  root.querySelector('#p-back').onclick = () => { st.idx--; save(); render(true); };
  if (focus) root.querySelector('#p-q').focus();
}
function result(focus) {
  const r = score(play.id, st.answers); const fil = st.lang === 'fil';
  const missed = r.missed.slice(0, play.id === 'financial-fitness' ? 3 : 10).map(m => { const q = play.questions.find(x => x.id === m.id); const best = q.opts.find(o => o.pts === m.best); return `<li><strong>${esc(q[st.lang])}</strong><br><span class="small">${t().correct}: ${esc(best[st.lang])}${q.why ? '. ' + esc(q.why) : ''}</span></li>`; }).join('');
  root.innerHTML = `<div class="play-card result" aria-live="polite"><p class="eyebrow">${fil ? 'Resulta mo' : 'Your result'}</p><h2 tabindex="-1" id="p-res">${esc(r.band.label[st.lang])}</h2>
<div class="pbar big" role="img" aria-label="${r.total} of ${r.max}"><span style="width:${Math.round(r.total / r.max * 100)}%"></span></div>
<p class="score-line"><strong>${esc(r.text)}</strong></p>
<h3>${t().steps}</h3><ol>${r.band.actions.map(a => `<li>${esc(a)}</li>`).join('')}</ol>
<h3>${t().read}</h3><ul class="link-list">${r.band.links.map(s => `<li><a href="${base}guides/${s}/">${esc(TITLES[s] || s)}</a></li>`).join('')}</ul>
${missed ? `<details><summary>${t().missed}</summary><ul>${missed}</ul></details>` : ''}
<div class="play-nav"><button class="btn btn-ghost btn-sm" id="p-again">${t().again}</button><a class="btn btn-gold btn-sm" href="${base}plays/">${fil ? 'Iba pang quiz' : 'More quizzes'}</a></div></div>`;
  root.querySelector('#p-again').onclick = () => { st = fresh(st.lang); st.idx = 0; save(); render(true); };
  if (focus) root.querySelector('#p-res').focus();
}
render(false);
