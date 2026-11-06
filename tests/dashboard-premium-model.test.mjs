import test from 'node:test';
import assert from 'node:assert/strict';
import { cents, today, emptyBook, demoBook, mutate, saved, totals, allocate, payoff, MAX_CENTS } from '../site/js/dashboard/model.js';
import { emptyPremium, examplePremium, cleanPremium, validatePremium, mutatePremium as change, portfolio, holdingSummary, portfolioHistory, netWorth, captureSnapshot, premiumLocalStore, PREMIUM_KEY, csv, exportRows, insights } from '../site/js/dashboard/premium-model.js';
const asset=(d=emptyPremium(), props={}) => change(d,'assets',{title:'Fund',category:'Funds / UITF / MP2',opening_cents:100000,date:'2026-01-01',...props});
const event=(d,props={}) => change(d,'events',{asset_id:d.assets[0].id,kind:'valuation',date:'2026-02-01',value_cents:100000,...props});
const mem=() => {const m=new Map();return {getItem:k=>m.get(k) ?? null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),map:m};};

test('premium empty state: actual zero allocation/history and cash unknown versus explicit zero',()=>{
  const d=emptyPremium();assert.equal(portfolio(d).value,0);assert.deepEqual(portfolio(d).allocation,[]);assert.deepEqual(portfolioHistory(d),[]);
  assert.equal(netWorth(emptyBook(),d).value,null);assert.throws(()=>captureSnapshot(emptyBook(),d),/cash first/);
  const zero=change(d,'cash',{amount_cents:0,date:today()});assert.equal(netWorth(emptyBook(),zero).value,0);assert.equal(captureSnapshot(emptyBook(),zero).net_worth_cents,0);
});
test('withdrawals and cash distributions are included in tracked economic gains, not fake ROI',()=>{
  let d=asset();d=event(d,{kind:'contribution',amount_cents:20000,value_cents:125000});
  d=event(d,{kind:'withdrawal',date:'2026-03-01',amount_cents:30000,value_cents:100000});
  const p=portfolio(d);assert.equal(p.opening,100000);assert.equal(p.contributions,20000);assert.equal(p.withdrawals,30000);assert.equal(p.netCapital,90000);assert.equal(p.value,100000);assert.equal(p.gain,10000);
  assert.equal(p.gain,p.value+p.withdrawals-p.opening-p.contributions);assert(!Object.hasOwn(p,'roi'));
});
test('profitable full exit can have negative net capital; gains are not clamped or divided into fake percentages',()=>{
  let d=event(asset(),{kind:'withdrawal',amount_cents:150000,value_cents:0});
  assert.equal(portfolio(d).netCapital,-50000);assert.equal(portfolio(d).gain,50000);assert.deepEqual(portfolio(d).allocation,[]);
});
test('losses, tiny centavos and a zero opening/new contribution reconcile exactly',()=>{
  let d=asset(emptyPremium(),{opening_cents:0});d=event(d,{kind:'contribution',amount_cents:29,value_cents:28});
  assert.equal(portfolio(d).gain,-1);assert.equal(portfolio(d).netCapital,29);
  d=event(d,{kind:'withdrawal',date:'2026-03-01',amount_cents:10,value_cents:17});assert.equal(portfolio(d).gain,-2);
});
test('internal holding-to-holding transfers cancel portfolio flows without creating gain',()=>{
  let d=asset();d=asset(d,{title:'Stock',category:'Stocks',opening_cents:0});
  d=event(d,{kind:'withdrawal',amount_cents:25000,value_cents:75000});
  d=event(d,{asset_id:d.assets[1].id,kind:'contribution',amount_cents:25000,value_cents:25000});
  assert.equal(portfolio(d).value,100000);assert.equal(portfolio(d).netCapital,100000);assert.equal(portfolio(d).gain,0);
});
test('dated history includes only actual opening/events; no daily interpolation or future values',()=>{
  let d=asset();d=event(d,{value_cents:110000});d=event(d,{date:'2026-04-01',value_cents:120000});
  assert.deepEqual(portfolioHistory(d).map(p=>[p.date,p.value]),[['2026-01-01',100000],['2026-02-01',110000],['2026-04-01',120000]]);
  assert.equal(holdingSummary(d,d.assets[0],'2025-12-31').value,0);assert.equal(portfolio(d,'2026-03-01').value,110000);
});
test('same-day sequence is deterministic; edits preserve order; delete/backdate recalculates actual current value',()=>{
  let d=event(asset(),{value_cents:110000});d=event(d,{value_cents:120000});
  assert.equal(portfolio(d).value,120000);const [first,last]=d.events;
  d=change(d,'events',{...first,value_cents:140000},first.id);assert.equal(d.events[0].order,first.order);assert.equal(portfolio(d).value,120000);
  d=change(d,'events',{...last,date:'2026-01-15'},last.id);assert.equal(portfolio(d).value,140000);
  d=change(d,'events',null,first.id,true);assert.equal(portfolio(d).value,120000);
});
test('asset and event edits are immutable; asset delete cascades only its events, not goals or snapshots',()=>{
  let d=event(asset(),{value_cents:110000});d=change(d,'cash',{amount_cents:100,date:today()});d=change(d,'snapshots',captureSnapshot(emptyBook(),d));
  const before=structuredClone(d), next=change(d,'assets',{...d.assets[0],opening_cents:90000},d.assets[0].id);
  assert.deepEqual(d,before);assert.equal(portfolio(next).gain,20000);
  const deleted=change(d,'assets',null,d.assets[0].id,true);assert.equal(deleted.events.length,0);assert.equal(deleted.assets.length,0);assert.equal(deleted.snapshots[0].net_worth_cents,110100);
});
test('asset allocation totals reconcile; unsupported cash category rejected to avoid duplicate cash',()=>{
  let d=asset();d=asset(d,{category:'Stocks',title:'Stocks',opening_cents:50000});
  assert.equal(portfolio(d).allocation.reduce((s,a)=>s+a.value,0),150000);
  assert.throws(()=>asset(d,{category:'Cash'}));assert.throws(()=>asset(d,{category:'<script>'}));
});
test('net worth excludes available-to-budget, income and all goal earmarks; debt paid only once',()=>{
  const book=demoBook();let d=examplePremium();const before=structuredClone(book);
  assert.equal(netWorth(book,d).assets,1860000);assert.equal(netWorth(book,d).debts,2300000);assert.equal(netWorth(book,d).value,3560000);
  assert.equal(totals(book).available,950000);assert.equal(saved(book,book.goals[0]),600000);
  for(let i=0;i<3;i++) d=change(d,'goals',{title:'Earmark '+i,target_cents:1000000,saved_cents:700000,date:today()});
  assert.equal(netWorth(book,d).value,3560000);assert.deepEqual(book,before);
  const paid=mutate(book,'transactions',{kind:'debt_payment',debt_id:book.debts[0].id,note:'Payment',amount_cents:10000,date:today(),category:'Other'});
  assert.equal(netWorth(paid,d).value,3570000,'Cash is manually reconciled; only recorded debt changed');
  assert.equal(netWorth(emptyBook(),change(emptyPremium(),'cash',{amount_cents:0,date:today()})).value,0);
});
test('negative net worth is valid and never silently clamped',()=>{
  const b=mutate(emptyBook(),'debts',{title:'Debt',opening_cents:1000,minimum_cents:0,apr_bps:0});
  assert.equal(netWorth(b,change(emptyPremium(),'cash',{amount_cents:0,date:today()})).value,-1000);
});
test('snapshots are actual capture-date records with source dates, exact signed totals and explicit replacement',()=>{
  let d=examplePremium(), book=demoBook();const snap=captureSnapshot(book,d);d=change(d,'snapshots',snap);
  assert.equal(d.snapshots[0].net_worth_cents,3560000);assert.equal(d.snapshots[0].gain_cents,60000);assert.equal(d.snapshots[0].cash_date,today());
  assert.throws(()=>change(d,'snapshots',snap),/one snapshot/);
  const cash=change(d,'cash',{amount_cents:5000000,date:today()});assert.equal(cash.snapshots[0].net_worth_cents,3560000);
  const replaced=change(cash,'snapshots',captureSnapshot(book,cash),d.snapshots[0].id);assert.equal(replaced.snapshots[0].net_worth_cents,4560000);
  assert.equal(change(replaced,'snapshots',null,replaced.snapshots[0].id,true).snapshots.length,0);
  assert.throws(()=>captureSnapshot(book,d,'2025-01-01'),/today only/);
});
test('multiple manual goal plans do not change free one-goal invariant, free ledger, cash or assets',()=>{
  const book=demoBook(), before=structuredClone(book);let d=examplePremium();
  for(let i=0;i<4;i++)d=change(d,'goals',{title:'Plan '+i,target_cents:100,saved_cents:110,date:today()});
  assert.equal(d.goals.length,6);assert.equal(netWorth(book,d).value,3560000);assert.deepEqual(book,before);
  assert.throws(()=>mutate(book,'goals',{title:'Second linked goal',target_cents:100,opening_cents:0}),/one goal/);
  const g=d.goals.at(-1);d=change(d,'goals',{...g,saved_cents:1},g.id);assert.equal(d.goals.at(-1).saved_cents,1);
  assert.equal(change(d,'goals',null,g.id,true).goals.length,5);
});
test('all premium money fields reject negative, fractional, NaN, Infinity and oversized amounts',()=>{
  for(const value of [-1,.5,NaN,Infinity,MAX_CENTS+1]) {
    assert.throws(()=>asset(emptyPremium(),{opening_cents:value}));
    assert.throws(()=>change(emptyPremium(),'cash',{amount_cents:value,date:today()}));
    assert.throws(()=>change(emptyPremium(),'goals',{title:'Bad',target_cents:100,saved_cents:value,date:today()}));
    assert.throws(()=>event(asset(),{value_cents:value}));assert.throws(()=>event(asset(),{kind:'contribution',amount_cents:value}));
  }
  assert.throws(()=>change(emptyPremium(),'goals',{title:'Zero target',target_cents:0,saved_cents:0,date:today()}));
  assert.throws(()=>event(asset(),{kind:'withdrawal',amount_cents:0}));
});
test('date, name, missing asset, unknown table, forged IDs, duplicate sequences and corrupt snapshot rejected',()=>{
  for(const bad of ['2026-02-30','9999-01-01','not-a-date'])assert.throws(()=>asset(emptyPremium(),{date:bad}));
  assert.throws(()=>asset(emptyPremium(),{title:' '}));assert.throws(()=>asset(emptyPremium(),{title:'x'.repeat(81)}));
  let d=asset();assert.throws(()=>event(d,{asset_id:crypto.randomUUID()}));assert.throws(()=>event(d,{date:'2025-01-01'}));
  d=event(d);assert.throws(()=>change(d,'assets',{...d.assets[0],date:'2026-03-01'},d.assets[0].id));
  assert.throws(()=>change(d,'server-entitlement',{}));assert.throws(()=>change(d,'assets',{},crypto.randomUUID()));
  assert.throws(()=>validatePremium({...d,assets:[{...d.assets[0],id:'"><img src=x>'}]}));
  const e={...d.events[0],id:crypto.randomUUID()};assert.throws(()=>validatePremium({...d,events:[...d.events,e]}));
  d=change(d,'cash',{amount_cents:0,date:today()});assert.throws(()=>change(d,'snapshots',{...captureSnapshot(emptyBook(),d),net_worth_cents:999}));
});
test('premium local store adds separate versioned storage without migrating or mutating existing free v1 records',()=>{
  const storage=mem(), key='piso-wais-local-preview-v1', original=JSON.stringify(demoBook());storage.setItem(key,original);
  const store=premiumLocalStore(storage);assert.equal(storage.getItem(PREMIUM_KEY),null);
  let d=store.save('assets',{title:'Local asset',category:'Gold',opening_cents:29,date:today()});
  d=store.save('goals',{title:'Local plan',target_cents:100,saved_cents:5,date:today()});
  assert.equal(storage.getItem(key),original);assert.equal(d.version,1);assert.equal(premiumLocalStore(storage).load().assets[0].opening_cents,29);
  const copy=store.load();copy.assets[0].opening_cents=999;assert.equal(store.load().assets[0].opening_cents,29);
  store.remove('assets',d.assets[0].id);assert.equal(store.load().assets.length,0);assert.equal(storage.getItem(key),original);
});
test('premium storage write failures leave memory and prior storage intact; demo mode never reads/writes local',()=>{
  const base=examplePremium();let writes=0;const storage={getItem:()=>JSON.stringify(base),setItem:()=>{writes++;throw Error('Quota exceeded');}};
  const store=premiumLocalStore(storage), old=store.load();assert.throws(()=>store.save('cash',{amount_cents:1,date:today()}),/Quota/);assert.deepEqual(store.load(),old);assert.equal(writes,1);
  const demo=premiumLocalStore(null,base);demo.save('cash',{amount_cents:999,date:today()});assert.equal(demo.load().cash.amount_cents,999);assert.equal(base.cash.amount_cents,4000000);
});
test('stale tab cannot overwrite newer premium data; unsupported/damaged versions are never silently reset',()=>{
  const storage=mem(), a=premiumLocalStore(storage), b=premiumLocalStore(storage);
  a.save('cash',{amount_cents:100,date:today()});const raw=storage.getItem(PREMIUM_KEY);
  assert.throws(()=>b.save('cash',{amount_cents:200,date:today()}),/another tab/);assert.equal(storage.getItem(PREMIUM_KEY),raw);assert.equal(b.load().cash,null);
  for(const bad of ['not json',JSON.stringify({...emptyPremium(),version:2}),JSON.stringify({...emptyPremium(),assets:null})]) {
    storage.setItem(PREMIUM_KEY,bad);assert.throws(()=>premiumLocalStore(storage),/not overwritten/);assert.equal(storage.getItem(PREMIUM_KEY),bad);
  }
});
test('CSV quotes cells/newlines, emits actual CRLF/BOM, and neutralizes spreadsheet formulas in user text',()=>{
  const risky=['=HYPERLINK("evil")','+SUM(1,2)','-2+5','@SUM(A1)',' \t=1+1','\ttext','\rtext','\ntext','\u200B=SUM(1)'];
  const output=csv([['Name','Value'],...risky.map(v=>[v,-29]),['Quotes " and , comma\nnewline',29]]);
  assert.equal(output.charCodeAt(0),0xfeff);assert(output.includes('\r\n'));assert(!output.includes('\\r\\n'));
  for(const r of risky)assert(output.includes('"\''+r.replace(/"/g,'""')+'"'),JSON.stringify(r));
  assert(output.includes('"-29"'));assert(output.includes('"Quotes "" and , comma\nnewline"'));
});
test('export tables retain exact centavos, recorded dates and asset-flow provenance; no fake PDF output',()=>{
  const book=demoBook(), data=examplePremium();
  for(const kind of ['transactions','assets','events','goals','snapshots'])assert(exportRows(book,data,kind)[0].length>0);
  assert.equal(exportRows(book,data,'assets')[1][2],1380000);assert.equal(exportRows(book,data,'assets')[1][7],80000);
  assert.equal(exportRows(book,data,'events')[1][4],500000);assert.throws(()=>exportRows(book,data,'pdf'));
});
test('deterministic on-screen rules explain stale values, concentration, bills and zero state without fake health score',()=>{
  let d=asset();const b=mutate(emptyBook(),'bills',{title:'Past bill',amount_cents:1,due_date:'2026-01-01'});
  let notes=insights(b,d);assert(notes.some(n=>n.includes('unpaid bill')));assert(notes.some(n=>n.includes('cash and deposits')));assert(notes.some(n=>n.includes('over 30 days')));assert(notes.some(n=>n.includes('100%')));
  d=change(d,'cash',{amount_cents:0,date:'2026-01-01'});assert(insights(b,d).some(n=>n.includes('seven days old')));
  const fresh=change(emptyPremium(),'cash',{amount_cents:0,date:today()});assert(insights(emptyBook(),fresh).some(n=>n.includes('does not certify')));
});
test('payday cents always sum exactly; payoff rejects bad strategy/input and guards negative/interest-only balances',()=>{
  for(let n=0;n<200;n++)assert.equal(allocate(n,[33,33,33,1]).reduce((a,b)=>a+b,0),n);
  assert.throws(()=>payoff([{balance:-1,minimum_cents:0,apr_bps:0}],1));assert.throws(()=>payoff([],1,'fake'));
  assert.throws(()=>payoff([{balance:10000,minimum_cents:0,apr_bps:1200}],100),/interest-only/);
  assert.throws(()=>payoff([{balance:10000,minimum_cents:0,apr_bps:1200}],99),/negative amortization/);
  assert.deepEqual(payoff([{balance:10000,minimum_cents:0,apr_bps:1200}],10100),{months:1,interest:100,paid:10100});
  // Debt may wait at interest-only minimum while another debt amortizes; no balance can grow.
  assert(payoff([{balance:100000,minimum_cents:1000,apr_bps:1200},{balance:50000,minimum_cents:500,apr_bps:0}],10000,'snowball').months>0);
});
test('APR interest half-cent and maximum-balance rounding use exact integer arithmetic',()=>{
  assert.deepEqual(payoff([{balance:50,minimum_cents:0,apr_bps:1200}],51),{months:1,interest:1,paid:51});
  const balance=9999999999, rate=100000, i=Number((BigInt(balance)*BigInt(rate)+60000n)/120000n);
  const p=payoff([{balance,minimum_cents:0,apr_bps:rate}],balance+i);assert.equal(p.interest,i);assert.equal(p.paid,balance+i);
});
