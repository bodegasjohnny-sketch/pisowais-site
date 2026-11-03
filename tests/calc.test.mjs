import { grow, leverage, scoreQuiz } from '../site/js/calc.js';
import assert from 'node:assert/strict';
const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };
// Hand computed: 100,000 at 3% p.a., monthly comp, 20% tax -> net monthly rate 0.002; 12 months: 100000*1.002^12
t('grow no topup', () => close(grow({ principal: 100000, monthly: 0, years: 1, rate: 0.03 }).final, 100000 * Math.pow(1.002, 12)));
t('grow value hand-computed 102426.58', () => close(grow({ principal: 100000, monthly: 0, years: 1, rate: 0.03 }).final, 102426.58, 0.05));
// Annuity: 1000/month, 0.5% net monthly (7.5% gross, 20% tax => 6%/12), 12 months: 1000*((1.005^12-1)/0.005)=12335.56
t('grow annuity', () => close(grow({ principal: 0, monthly: 1000, years: 1, rate: 0.075 }).final, 12335.56, 0.05));
t('tax = 20% of gross', () => { const r = grow({ principal: 50000, monthly: 500, years: 3, rate: 0.04 }); close(r.taxPaid, r.grossInterest * 0.2); close(r.final, r.contributed + r.netInterest); });
t('zero rate', () => close(grow({ principal: 1000, monthly: 100, years: 2, rate: 0 }).final, 3400));
// Leverage
t('green when cash before due', () => { const r = leverage({ purchase: 20000, cashBack: 26000, daysToCash: 20, floatDays: 45, monthlyRate: 0.03 }); assert.equal(r.verdict, 'green'); close(r.interestCost, 0); });
t('yellow when carried short and profitable', () => { const r = leverage({ purchase: 20000, cashBack: 26000, daysToCash: 60, floatDays: 45, monthlyRate: 0.03 }); assert.equal(r.verdict, 'yellow'); close(r.interestCost, 20000 * 0.36 / 365 * 15); });
t('red when loss', () => assert.equal(leverage({ purchase: 20000, cashBack: 19000, daysToCash: 10, floatDays: 45, monthlyRate: 0.03 }).verdict, 'red'));
t('red when carried > 30 days', () => assert.equal(leverage({ purchase: 20000, cashBack: 30000, daysToCash: 120, floatDays: 45, monthlyRate: 0.03 }).verdict, 'red'));
t('red when interest eats profit', () => assert.equal(leverage({ purchase: 100000, cashBack: 100500, daysToCash: 70, floatDays: 45, monthlyRate: 0.03 }).verdict, 'red'));
t('utilization downgrades green', () => assert.equal(leverage({ purchase: 50000, cashBack: 60000, daysToCash: 10, floatDays: 45, monthlyRate: 0.03, limit: 100000 }).verdict, 'yellow'));
t('break-even days', () => { const r = leverage({ purchase: 36500, cashBack: 37500, daysToCash: 10, floatDays: 30, monthlyRate: 0.03 }); close(r.breakEvenDays, 30 + 1000 / (36500 * 0.36 / 365)); });
t('quiz weakest', () => { const r = scoreQuiz({ cash: 0, pricing: 2, inventory: 1, tracking: 0, followup: 2, owner: 2, marketing: 2, debt: 1, idle: 2, credit: 2 }); assert.deepEqual(r.weakest.map(w => w.area), ['cash', 'tracking', 'inventory']); assert.equal(r.total, 14); assert.equal(r.firstSection, 'Cash flow 30-day plan'); });
console.log(`${n} tests passed`);
