import { PLAYS, score, bandFor, checkBands, shuffle } from '../site/js/plays.js';
import assert from 'node:assert/strict';
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const best = p => Object.fromEntries(p.questions.map(q => [q.id, q.opts.reduce((a, b) => b.pts > a.pts ? b : a).id]));
const worst = p => Object.fromEntries(p.questions.map(q => [q.id, q.opts.reduce((a, b) => b.pts < a.pts ? b : a).id]));
t('question counts', () => { assert.equal(PLAYS['loan-basics'].questions.length, 10); assert.equal(PLAYS['financial-fitness'].questions.length, 12); assert.equal(PLAYS['borrowing-basics'].questions.length, 10); });
for (const p of Object.values(PLAYS)) {
  t(p.id + ' bands cover 0..max', () => assert.ok(checkBands(p)));
  t(p.id + ' max equals sum of best', () => assert.equal(p.questions.reduce((s, q) => s + Math.max(...q.opts.map(o => o.pts)), 0), p.max));
  t(p.id + ' best scores max', () => { const r = score(p.id, best(p)); assert.equal(r.total, p.max); assert.equal(r.missed.length, 0); });
  t(p.id + ' worst scores 0', () => assert.equal(score(p.id, worst(p)).total, 0));
  t(p.id + ' every band has 2-3 actions and guide links', () => p.bands.forEach(b => { assert.ok(b.actions.length >= 2 && b.actions.length <= 3); assert.ok(b.links.length >= 1); assert.ok(b.label.en && b.label.fil); }));
  t(p.id + ' all options bilingual', () => p.questions.forEach(q => { assert.ok(q.en && q.fil); q.opts.forEach(o => assert.ok(o.en && o.fil)); }));
  t(p.id + ' unanswered counts 0', () => assert.equal(score(p.id, {}).total, 0));
}
t('knowledge quiz 1 point each', () => ['loan-basics', 'borrowing-basics'].forEach(id => PLAYS[id].questions.forEach(q => assert.deepEqual(q.opts.map(o => o.pts).sort(), [0, 0, 0, 1]))));
t('fitness 0-3 each', () => PLAYS['financial-fitness'].questions.forEach(q => assert.deepEqual(q.opts.map(o => o.pts).sort(), [0, 1, 2, 3])));
t('fitness 22 -> 15..24 text', () => {
  const p = PLAYS['financial-fitness']; const a = {}; let left = 22;
  p.questions.forEach(q => { const pts = Math.min(2, left); left -= pts; a[q.id] = q.opts.find(o => o.pts === pts).id; });
  const r = score('financial-fitness', a); assert.equal(r.total, 22); assert.equal(r.band.key, 'mid');
  assert.equal(r.text, 'Score 22 of 36, between 15 and 24. Here is what to work on.');
});
t('fitness band edges', () => { const p = PLAYS['financial-fitness']; assert.equal(bandFor(p, 14).key, 'start'); assert.equal(bandFor(p, 15).key, 'mid'); assert.equal(bandFor(p, 24).key, 'mid'); assert.equal(bandFor(p, 25).key, 'good'); assert.equal(bandFor(p, 31).key, 'good'); assert.equal(bandFor(p, 32).key, 'top'); assert.equal(bandFor(p, 36).key, 'top'); });
t('loan band edges', () => { const p = PLAYS['loan-basics']; assert.equal(bandFor(p, 4).key, 'start'); assert.equal(bandFor(p, 5).key, 'mid'); assert.equal(bandFor(p, 7).key, 'mid'); assert.equal(bandFor(p, 8).key, 'good'); assert.equal(bandFor(p, 10).key, 'top'); });
t('perfect text', () => assert.match(score('loan-basics', best(PLAYS['loan-basics'])).text, /^Score 10 of 10, between 10 and 10\. Perfect score/));
t('out of range throws', () => assert.throws(() => bandFor(PLAYS['loan-basics'], 11)));
t('shuffle keeps elements', () => { const a = [1, 2, 3, 4]; assert.deepEqual(shuffle(a).sort(), a); });
t('missed lists wrong ones', () => { const p = PLAYS['loan-basics']; const a = best(p); a.l3 = p.questions[2].opts.find(o => o.pts === 0).id; const r = score('loan-basics', a); assert.equal(r.total, 9); assert.deepEqual(r.missed.map(m => m.id), ['l3']); });
console.log(`${n} play tests passed`);
