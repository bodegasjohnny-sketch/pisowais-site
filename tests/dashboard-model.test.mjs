import test from 'node:test';
import assert from 'node:assert/strict';
import { cents, emptyBook, mutate, totals, saved, owed, unpaidBills, categoryTotals, allocate, payoff, today, validDate, validateBook } from '../site/js/dashboard/model.js';
const entry = (kind, amount, props = {}) => ({ kind, amount_cents:amount, date:today(), category:'Other', note:'Test entry', ...props });
function fixture() {
  let b=mutate(emptyBook(),'goals',{title:'Emergency',target_cents:100000,opening_cents:1000});
  b=mutate(b,'debts',{title:'Card',opening_cents:10000,minimum_cents:1000,apr_bps:0});
  b=mutate(b,'bills',{title:'Internet',amount_cents:2500,due_date:today()});
  return b;
}
test('decimal conversion exact; zero parsing, invalid/negative/fraction/exponent/overflow validation',()=>{
  assert.equal(cents('0.29'),29);assert.equal(cents('123.4'),12340);assert.equal(cents('0'),0);assert.equal(cents('999999999.99'),99999999999);
  for(const v of ['-1','NaN','1e3','1,000','1.001','Infinity','','99999999999999999999'])assert.throws(()=>cents(v));
  assert.throws(()=>mutate(emptyBook(),'transactions',entry('income',0)));
});
test('real dates only and no future ledger dates',()=>{
  assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2024-02-29'),true);
  assert.throws(()=>mutate(emptyBook(),'transactions',entry('income',100,{date:'9999-12-31'})));
});
test('zero state and exact totals do not count opening savings/debt/planned bills',()=>{
  assert.deepEqual(totals(emptyBook()),{income:0,expense:0,savings:0,withdrawal:0,debt_payment:0,available:0});
  assert.equal(totals(fixture()).available,0);assert.equal(categoryTotals(emptyBook()).length,0);
});
test('income, expense, savings, withdrawals, debt do not double count',()=>{
  let b=fixture();const goal=b.goals[0].id,debt=b.debts[0].id;
  for(const e of [entry('income',30000),entry('expense',5000,{category:'Food'}),entry('savings',2000,{goal_id:goal}),entry('withdrawal',500,{goal_id:goal}),entry('debt_payment',1000,{debt_id:debt})])b=mutate(b,'transactions',e);
  assert.equal(totals(b).available,22500);assert.equal(totals(b).expense,5000);assert.equal(saved(b,b.goals[0]),2500);assert.equal(owed(b,b.debts[0]),9000);
  assert.deepEqual(categoryTotals(b),[{name:'Food',amount:5000}]);
});
test('edit, delete recalculate and preserve input immutability',()=>{
  let b=mutate(emptyBook(),'transactions',entry('income',1029));const id=b.transactions[0].id;
  const edited=mutate(b,'transactions',entry('income',2029),id);assert.equal(totals(edited).available,2029);assert.equal(totals(b).available,1029);
  assert.equal(totals(mutate(edited,'transactions',null,id,true)).available,0);
  assert.throws(()=>mutate(edited,'transactions',entry('income',1),'missing'));
});
test('bill payment recorded once; deletion makes bill unpaid again',()=>{
  let b=fixture();const bill=b.bills[0];b=mutate(b,'transactions',entry('expense',2500,{bill_id:bill.id,category:'Bills'}));
  assert.equal(unpaidBills(b).length,0);assert.equal(totals(b).expense,2500);
  assert.throws(()=>mutate(b,'transactions',entry('expense',2500,{bill_id:bill.id,category:'Bills'})));
  assert.throws(()=>mutate(b,'bills',null,bill.id,true));
  b=mutate(b,'transactions',null,b.transactions[0].id,true);assert.equal(unpaidBills(b).length,1);
});
test('cannot over-withdraw, overpay, link missing record or delete referenced parents',()=>{
  let b=fixture(),g=b.goals[0].id,d=b.debts[0].id;
  assert.throws(()=>mutate(b,'transactions',entry('withdrawal',1001,{goal_id:g})));
  assert.throws(()=>mutate(b,'transactions',entry('debt_payment',10001,{debt_id:d})));
  assert.throws(()=>mutate(b,'transactions',entry('savings',1,{goal_id:crypto.randomUUID()})));
  b=mutate(b,'transactions',entry('savings',100,{goal_id:g}));assert.throws(()=>mutate(b,'goals',null,g,true));
  b=mutate(b,'transactions',entry('withdrawal',1100,{goal_id:g}));
  assert.throws(()=>mutate(b,'transactions',null,b.transactions[0].id,true));
});
test('free one-goal invariant, no malformed identifiers, no negative/invalid fields',()=>{
  assert.throws(()=>mutate(fixture(),'goals',{title:'Second',target_cents:100,opening_cents:0}));
  for(const val of [-1,NaN,1.4])assert.throws(()=>mutate(emptyBook(),'transactions',entry('income',val)));
  assert.throws(()=>mutate(emptyBook(),'debts',{title:'Bad APR',opening_cents:100,minimum_cents:0,apr_bps:-1}));
  assert.throws(()=>validateBook({...emptyBook(),bills:[{id:'\"><img onerror=x>',title:'x',due_date:today(),amount_cents:1}]}));
});
test('negative available is valid and not silently clamped',()=>{assert.equal(totals(mutate(emptyBook(),'transactions',entry('expense',10))).available,-10);});
test('allocations exact to centavo for tiny/odd/zero and invalid percentages',()=>{
  assert.deepEqual(allocate(1,[50,50]),[1,0]);assert.deepEqual(allocate(0,[60,20,10,10]),[0,0,0,0]);
  for(const value of [1,2,29,10001,99999999])assert.equal(allocate(value,[53,27,13,7]).reduce((a,b)=>a+b,0),value);
  assert.throws(()=>allocate(100,[50,49]));assert.throws(()=>allocate(100,[-1,101]));assert.throws(()=>allocate(100,[50.5,49.5]));
});
test('payoff zero APR, rounding, no debts, minimums and negative amortization',()=>{
  assert.deepEqual(payoff([],100),{months:0,interest:0,paid:0});
  assert.deepEqual(payoff([{balance:10000,minimum_cents:1000,apr_bps:0}],3000),{months:4,interest:0,paid:10000});
  assert.deepEqual(payoff([{balance:10000,minimum_cents:0,apr_bps:1200}],10100),{months:1,interest:100,paid:10100});
  assert.throws(()=>payoff([{balance:10000,minimum_cents:2000,apr_bps:1200}],1000));
  assert.throws(()=>payoff([{balance:100000,minimum_cents:0,apr_bps:3600}],1));
  const ds=[{balance:100000,minimum_cents:1000,apr_bps:1200},{balance:50000,minimum_cents:500,apr_bps:0}];
  assert(payoff(ds,10000,'avalanche').interest<=payoff(ds,10000,'snowball').interest);
});
