// Preview-only, integer-centavo manual portfolio. No prices, ROI promises or entitlements.
import { MAX_CENTS, today, validDate, owed, saved, totals, unpaidBills } from './model.js';
export const ASSET_CATEGORIES = ['Stocks', 'Funds / UITF / MP2', 'Bonds', 'Crypto', 'Property', 'Business equity', 'Gold', 'Other non-cash'];
export const PREMIUM_KEY = 'piso-wais-premium-preview-v1';
export const emptyPremium = () => ({ version:1, assets:[], events:[], goals:[], snapshots:[], cash:null });
const idOK = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
const text = (v, max = 80) => { if(typeof v !== 'string' || !v.trim() || v.trim().length > max) throw Error('Enter a name of 1 to '+max+' characters.'); return v.trim(); };
function amount(v, zero = true) { if(!Number.isSafeInteger(v) || v < (zero ? 0 : 1) || v > MAX_CENTS) throw Error('Enter a valid non-negative amount, within the amount limit.'); return v; }
function safe(v) { if(!Number.isSafeInteger(v)) throw Error('Totals exceed safe calculation limits.'); return v; }
const sum = values => values.reduce((a,b) => safe(a+b),0);
function date(v) { if(!validDate(v) || v > today()) throw Error('Use a real date, today or earlier (Asia/Manila).'); return v; }
export function cleanPremium(table, r) {
  if(table === 'assets') { if(!ASSET_CATEGORIES.includes(r.category)) throw Error('Choose an asset category.'); return { title:text(r.title), category:r.category, opening_cents:amount(r.opening_cents), date:date(r.date) }; }
  if(table === 'events') {
    if(!idOK(r.asset_id) || !['contribution','withdrawal','valuation'].includes(r.kind)) throw Error('Choose an asset and event type.');
    return { asset_id:r.asset_id, kind:r.kind, amount_cents:r.kind === 'valuation' ? 0 : amount(r.amount_cents,false), value_cents:amount(r.value_cents), date:date(r.date) };
  }
  if(table === 'goals') return { title:text(r.title), target_cents:amount(r.target_cents,false), saved_cents:amount(r.saved_cents), date:date(r.date) };
  if(table === 'cash') return { amount_cents:amount(r.amount_cents), date:date(r.date) };
  throw Error('Unknown premium record type.');
}
export function holdingSummary(data, asset, asOf = today()) {
  if(asset.date > asOf) return { value:0, opening:0, contributions:0, withdrawals:0, netCapital:0, gain:0, date:null };
  const events = data.events.filter(e => e.asset_id === asset.id && e.date <= asOf).sort((a,b) => a.date.localeCompare(b.date) || a.order-b.order);
  const contributions = sum(events.filter(e => e.kind === 'contribution').map(e => e.amount_cents));
  const withdrawals = sum(events.filter(e => e.kind === 'withdrawal').map(e => e.amount_cents));
  const last = events.at(-1), value = last ? last.value_cents : asset.opening_cents;
  const netCapital = sum([asset.opening_cents,contributions,-withdrawals]);
  return { value, opening:asset.opening_cents, contributions, withdrawals, netCapital, gain:sum([value,-netCapital]), date:last?.date || asset.date };
}
export function portfolio(data, asOf = today()) {
  const holdings = data.assets.map(asset => ({ asset,...holdingSummary(data,asset,asOf) }));
  const fields = ['value','opening','contributions','withdrawals','netCapital','gain'];
  const result = Object.fromEntries(fields.map(k => [k,sum(holdings.map(h => h[k]))]));
  const allocation = ASSET_CATEGORIES.map(category => ({ category, value:sum(holdings.filter(h => h.asset.category === category).map(h => h.value)) })).filter(a => a.value > 0);
  return { ...result, holdings, allocation };
}
export function portfolioHistory(data) {
  const dates = [...new Set([...data.assets.map(a => a.date),...data.events.map(e => e.date)])].sort();
  return dates.map(date => { const p=portfolio(data,date);return {date,value:p.value,netCapital:p.netCapital,gain:p.gain}; });
}
export function netWorth(book, data) {
  const p = portfolio(data), debts = sum(book.debts.map(d => owed(book,d)));
  return { cash:data.cash?.amount_cents ?? null, assets:p.value, debts, value:data.cash ? sum([data.cash.amount_cents,p.value,-debts]) : null, ...Object.fromEntries(['opening','contributions','withdrawals','gain'].map(k => [k,p[k]])) };
}
export function captureSnapshot(book, data, captureDate = today()) {
  if(captureDate !== today()) throw Error('Snapshots capture today only; historical debt is not reconstructed.');
  const n = netWorth(book,data);
  if(n.cash === null) throw Error('Record total cash first. Enter zero explicitly if you have no cash.');
  date(captureDate);
  if(data.cash.date > captureDate || data.assets.some(a => holdingSummary(data,a).date > captureDate)) throw Error('A snapshot cannot predate its source values.');
  return { date:captureDate, cash_cents:n.cash, assets_cents:n.assets, debt_cents:n.debts, net_worth_cents:n.value, opening_cents:n.opening, contributions_cents:n.contributions, withdrawals_cents:n.withdrawals, gain_cents:n.gain, cash_date:data.cash.date, asset_dates:data.assets.map(a => ({id:a.id,date:holdingSummary(data,a).date})) };
}
function validateSnapshot(r) {
  date(r.date); date(r.cash_date);
  for(const k of ['cash_cents','assets_cents','debt_cents','opening_cents','contributions_cents','withdrawals_cents']) { safe(r[k]); if(r[k]<0) throw Error('Invalid snapshot amount.'); }
  safe(r.net_worth_cents);safe(r.gain_cents);
  if(r.net_worth_cents !== sum([r.cash_cents,r.assets_cents,-r.debt_cents]) || r.gain_cents !== sum([r.assets_cents,r.withdrawals_cents,-r.opening_cents,-r.contributions_cents])) throw Error('Snapshot totals do not reconcile.');
  if(r.cash_date > r.date || !Array.isArray(r.asset_dates) || r.asset_dates.some(a => !idOK(a.id) || !validDate(a.date) || a.date > r.date)) throw Error('Invalid snapshot source dates.');
}
export function validatePremium(data) {
  if(!data || data.version !== 1 || ['assets','events','goals','snapshots'].some(k => !Array.isArray(data[k]) || data[k].length > 10000)) throw Error('Unsupported or damaged premium preview. No data has been overwritten.');
  for(const table of ['assets','events','goals','snapshots']) {
    const ids=data[table].map(r => r.id);
    if(ids.some(id => !idOK(id)) || new Set(ids).size !== ids.length) throw Error('Invalid premium record identifier.');
    for(const row of data[table]) {
      if(table === 'snapshots') validateSnapshot(row);
      else { const clean=cleanPremium(table,row); if(Object.entries(clean).some(([k,v]) => row[k] !== v)) throw Error('Invalid premium record fields.'); }
    }
  }
  const orders=data.events.map(e => e.order);
  if(orders.some(o => !Number.isSafeInteger(o) || o < 1) || new Set(orders).size !== orders.length) throw Error('Invalid event sequence.');
  if(data.events.some(e => { const asset=data.assets.find(a => a.id === e.asset_id);return !asset || e.date < asset.date; })) throw Error('An event must belong to an existing asset, on or after its opening date.');
  if(new Set(data.snapshots.map(s => s.date)).size !== data.snapshots.length) throw Error('Only one snapshot per day. Replace it explicitly.');
  if(data.cash !== null) { const clean=cleanPremium('cash',data.cash); if(Object.entries(clean).some(([k,v]) => data.cash[k] !== v)) throw Error('Invalid cash record.'); }
  portfolio(data); // Safe totals, including net withdrawals and gains.
  return data;
}
export function mutatePremium(data, table, input, id = null, remove = false) {
  if(!['assets','events','goals','snapshots','cash'].includes(table)) throw Error('Unknown premium record type.');
  const next=structuredClone(data);
  if(table === 'cash') next.cash=remove ? null : cleanPremium(table,input);
  else {
    const row=id ? next[table].find(r => r.id === id) : null;
    if(id && !row) throw Error('This premium record is no longer available.');
    if(remove) {
      next[table]=next[table].filter(r => r.id !== id);
      if(table === 'assets') next.events=next.events.filter(e => e.asset_id !== id);
    } else {
      const record={ ...(table === 'snapshots' ? input : cleanPremium(table,input)), id:id || crypto.randomUUID() };
      if(table === 'events') record.order=row?.order || safe(Math.max(0,...next.events.map(e => e.order))+1);
      if(row) next[table][next[table].findIndex(r => r.id === id)]=record; else next[table].push(record);
    }
  }
  return validatePremium(next);
}
// A separate, versioned namespace: never migrates, overwrites or uploads the free v1 book.
export function premiumLocalStore(storage, initial = emptyPremium()) {
  let data=validatePremium(structuredClone(initial));
  const raw=storage?.getItem(PREMIUM_KEY);
  let lastRaw=raw ?? null;
  if(raw !== null && raw !== undefined) {
    try { data=validatePremium(JSON.parse(raw)); } catch { throw Error('Premium preview data cannot be read. It was not overwritten. Inspect browser storage or clear ONLY premium data in Your data.'); }
  }
  function persist(next) {
    if(storage) {
      if((storage.getItem(PREMIUM_KEY) ?? null) !== lastRaw) throw Error('Extra preview data changed in another tab. Reload and re-enable preview before saving.');
      const encoded=JSON.stringify(next);storage.setItem(PREMIUM_KEY,encoded);lastRaw=encoded;
    }
    data=next;return structuredClone(data);
  }
  return {
    load() { return structuredClone(data); },
    save(table,input,id = null) { const next=mutatePremium(data,table,input,id);return persist(next); },
    remove(table,id) { const next=mutatePremium(data,table,null,id,true);return persist(next); }
  };
}
const daysOld = (date, now) => Math.floor((Date.parse(now)-Date.parse(date))/86400000);
export function insights(book,data,now = today()) {
  const notes=[], p=portfolio(data,now), t=totals(book);
  if(t.available < 0) notes.push('Recorded outflows exceed income. Review your free entry breakdown before allocating more.');
  const bills=unpaidBills(book).filter(b => daysOld(now,b.due_date) <= 7);
  if(bills.length) notes.push(`${bills.length} unpaid bill(s) are overdue or due within seven days. These are reminders, not automatic payments.`);
  if(!data.cash) notes.push('Record cash and deposits, including savings earmarks, before calculating net worth.');
  else if(daysOld(data.cash.date,now)>7) notes.push('Your cash amount is over seven days old. Reconcile it before saving a snapshot.');
  const stale=p.holdings.filter(h => h.date && daysOld(h.date,now)>30).length;
  if(stale) notes.push(`${stale} asset valuation(s) are over 30 days old. These are manual records, not live prices.`);
  const largest=[...p.allocation].sort((a,b) => b.value-a.value)[0];
  if(largest && largest.value/p.value >= .6) notes.push(`${largest.category} represents ${Math.round(largest.value/p.value*100)}% of recorded non-cash assets. This describes concentration, not a buy/sell recommendation.`);
  const complete=book.goals.filter(g => saved(book,g)>=g.target_cents).length+data.goals.filter(g => g.saved_cents>=g.target_cents).length;
  if(complete) notes.push(`${complete} savings plan(s) have reached their recorded target. Earmarks are not extra net-worth assets.`);
  if(!notes.length) notes.push('No rule was triggered by your current records. This does not certify financial health or predict returns.');
  return notes;
}
export function csv(rows) {
  return '\uFEFF'+rows.map(row => row.map(value => {
    let s=typeof value === 'number' ? String(safe(value)) : String(value ?? '');
    // Quoting alone does not prevent formulas. Prefix risky text, not validated numeric cells.
    if(typeof value !== 'number' && (/^[\s\u0000-\u001f\uFEFF\u200B-\u200D]*[=+@-]/.test(s) || /^[\u0000-\u001f]/.test(s))) s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }).join(',')).join('\r\n');
}
export function exportRows(book,data,kind) {
  if(kind === 'transactions') return [['Date','Type','Description','Category','Amount (centavos)','Goal ID','Debt ID','Bill ID'],...book.transactions.map(t => [t.date,t.kind,t.note,t.category,t.amount_cents,t.goal_id,t.debt_id,t.bill_id])];
  if(kind === 'assets') return [['Asset','Category','Value (centavos)','Opening baseline (centavos)','Contributions (centavos)','Withdrawals (centavos)','Net tracking capital (centavos)','Tracked gain (centavos)','As of'],...portfolio(data).holdings.map(h => [h.asset.title,h.asset.category,h.value,h.opening,h.contributions,h.withdrawals,h.netCapital,h.gain,h.date])];
  if(kind === 'events') return [['Asset','Date','Same-day order','Kind','Flow (centavos)','Post-event value (centavos)'],...data.events.map(e => [data.assets.find(a => a.id === e.asset_id).title,e.date,e.order,e.kind,e.amount_cents,e.value_cents])];
  if(kind === 'snapshots') return [['Capture date','Cash (centavos)','Assets (centavos)','Debt (centavos)','Net worth (centavos)','Tracked gain (centavos)','Cash as of','Asset source dates'],...data.snapshots.map(s => [s.date,s.cash_cents,s.assets_cents,s.debt_cents,s.net_worth_cents,s.gain_cents,s.cash_date,s.asset_dates.map(a => a.id+':'+a.date).join('; ')])];
  if(kind === 'goals') return [['Plan','Target (centavos)','Saved (centavos)','As of','Kind'],...book.goals.map(g => [g.title,g.target_cents,saved(book,g),today(),'Free linked goal']),...data.goals.map(g => [g.title,g.target_cents,g.saved_cents,g.date,'Manual earmark - not extra cash'])];
  throw Error('Unknown export.');
}
export function examplePremium() {
  let d=emptyPremium();
  d=mutatePremium(d,'assets',{title:'Sample MP2 / fund',category:'Funds / UITF / MP2',date:'2026-08-01',opening_cents:1000000});
  const id=d.assets[0].id;
  for(const e of [ {date:'2026-09-01',kind:'contribution',amount_cents:500000,value_cents:1520000}, {date:'2026-10-01',kind:'withdrawal',amount_cents:200000,value_cents:1350000}, {date:today(),kind:'valuation',value_cents:1380000} ]) d=mutatePremium(d,'events',{...e,asset_id:id});
  d=mutatePremium(d,'assets',{title:'Sample stock holding',category:'Stocks',date:'2026-09-01',opening_cents:500000});
  d=mutatePremium(d,'events',{asset_id:d.assets[1].id,date:today(),kind:'valuation',value_cents:480000});
  d=mutatePremium(d,'cash',{amount_cents:4000000,date:today()});
  d=mutatePremium(d,'goals',{title:'Laptop fund',target_cents:5000000,saved_cents:800000,date:today()});
  d=mutatePremium(d,'goals',{title:'Family trip',target_cents:2000000,saved_cents:400000,date:today()});
  return d; // No invented net-worth snapshot history. Save explicitly to begin it.
}
