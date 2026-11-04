// Guides feed: search + category chips. Works without JS (all cards visible).
const q = document.getElementById('feed-q'); const chips = [...document.querySelectorAll('.feed-chips button')]; const cards = [...document.querySelectorAll('.feed-card')]; const empty = document.getElementById('feed-empty');
let cat = 'all';
function apply() {
  const s = (q.value || '').trim().toLowerCase(); let shown = 0;
  cards.forEach(c => { const ok = (cat === 'all' || c.dataset.cat === cat) && (!s || c.textContent.toLowerCase().includes(s)); c.hidden = !ok; if (ok) shown++; });
  empty.hidden = shown > 0;
}
chips.forEach(b => b.addEventListener('click', () => { cat = b.dataset.cat; chips.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); apply(); }));
q && q.addEventListener('input', apply);
