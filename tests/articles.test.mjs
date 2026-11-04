import { amortize, addOn, split503020, emergencyTarget, thirteenth, iponPlan } from '../site/js/money.js';
import assert from 'node:assert/strict';
const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
// Worked example in amortization-simplified: 50,000 at 1.5%/mo, 12 months.
t('amortization payment 4584.00', () => close(amortize({ principal: 50000, monthlyRate: 0.015, months: 12 }).payment, 4584.00, 0.005));
t('amortization totals', () => { const a = amortize({ principal: 50000, monthlyRate: 0.015, months: 12 }); close(a.total, 55008.00, 0.05); close(a.interest, 5008.00, 0.05); });
t('amortization rows 1,2,12', () => { const r = amortize({ principal: 50000, monthlyRate: 0.015, months: 12 }).rows; close(r[0].interest, 750); close(r[0].principal, 3834.00); close(r[0].balance, 46166.00); close(r[1].interest, 692.49); close(r[1].balance, 42274.49); close(r[11].interest, 67.74); assert.equal(r[11].balance, 0); });
t('amortization zero rate', () => close(amortize({ principal: 1200, monthlyRate: 0, months: 12 }).payment, 100));
t('amortization rejects bad input', () => assert.equal(amortize({ principal: 0, monthlyRate: 0.01, months: 12 }), null));
t('principal parts sum to principal', () => { const a = amortize({ principal: 75000, monthlyRate: 0.0125, months: 24 }); close(a.rows.reduce((s, r) => s + r.principal, 0), 75000); });
t('add-on example', () => { const a = addOn({ principal: 50000, monthlyRate: 0.015, months: 12 }); close(a.interest, 9000); close(a.payment, 4916.67); });
t('50-30-20 on 25000', () => assert.deepEqual(split503020(25000), { needs: 12500, wants: 7500, savings: 5000 }));
t('emergency 3 and 6 months', () => { assert.equal(emergencyTarget({ monthlyEssentials: 18000, months: 3 }), 54000); assert.equal(emergencyTarget({ monthlyEssentials: 18000, months: 6 }), 108000); });
t('13th month', () => { close(thirteenth({ basicTotalYear: 240000 }), 20000); close(thirteenth({ basicTotalYear: 140000 }), 11666.67); });
t('52-week ascending total 27560', () => { const p = iponPlan({ base: 20 }); assert.equal(p.total, 27560); assert.equal(p.rows[51].amount, 1040); assert.equal(p.rows[0].date, '2027-01-04'); assert.equal(p.rows[51].date, '2027-12-27'); });
t('reverse same total', () => assert.equal(iponPlan({ base: 20, mode: 'down' }).total, 27560));
t('flat 300 x 52', () => assert.equal(iponPlan({ base: 300, mode: 'flat' }).total, 15600));
console.log(`${n} article tool tests passed`);
