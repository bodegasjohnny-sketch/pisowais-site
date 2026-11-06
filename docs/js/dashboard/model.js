// Money is integer centavos everywhere. No analytics and no bank connection.
export const MAX_CENTS = 99999999999;
export const TABLES = ['goals', 'debts', 'bills', 'transactions'];
export const KINDS = ['income', 'expense', 'savings', 'withdrawal', 'debt_payment'];
export const CATEGORIES = ['Food', 'Bills', 'Transport', 'Shopping', 'Health', 'Family', 'Business', 'Other'];
export const emptyBook = () => ({ goals: [], debts: [], bills: [], transactions: [] });
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const money = cents => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
export function cents(input) {
  const str = String(input).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(str)) throw Error('Enter a positive amount with no more than two decimal places.');
  const [whole, fraction = ''] = str.split('.');
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(value) || value > MAX_CENTS) throw Error('That amount is too large.');
  return value;
}
export function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function amount(v, allowZero = false) {
  if (!Number.isSafeInteger(v) || v < (allowZero ? 0 : 1) || v > MAX_CENTS) throw Error('Amount must be a valid positive number of centavos.');
}
export function cleanRecord(table, input) {
  if (!TABLES.includes(table)) throw Error('Unknown record type.');
  const text = (v, max, label) => { const s = String(v || '').trim(); if (!s || s.length > max) throw Error(`${label} is required (up to ${max} characters).`); return s; };
  if (table === 'transactions') {
    if (!KINDS.includes(input.kind)) throw Error('Choose an entry type.');
    amount(input.amount_cents);
    if (!validDate(input.date) || input.date > today()) throw Error('Entries need a real date, today or earlier (Asia/Manila).');
    const r = { kind: input.kind, amount_cents: input.amount_cents, date: input.date, note: text(input.note, 120, 'Description'), category: input.kind === 'expense' ? input.category : 'Other', goal_id: null, debt_id: null, bill_id: null };
    if (!CATEGORIES.includes(r.category)) throw Error('Choose a category.');
    if (['savings', 'withdrawal'].includes(r.kind)) { if (!input.goal_id) throw Error('Choose a savings goal.'); r.goal_id = input.goal_id; }
    if (r.kind === 'debt_payment') { if (!input.debt_id) throw Error('Choose a debt.'); r.debt_id = input.debt_id; }
    if (r.kind === 'expense') r.bill_id = input.bill_id || null;
    return r;
  }
  const r = { title: text(input.title, 80, 'Name') };
  if (table === 'goals') { amount(input.target_cents); amount(input.opening_cents, true); Object.assign(r, { target_cents: input.target_cents, opening_cents: input.opening_cents }); }
  if (table === 'debts') {
    amount(input.opening_cents); amount(input.minimum_cents, true);
    if (!Number.isInteger(input.apr_bps) || input.apr_bps < 0 || input.apr_bps > 100000) throw Error('APR must be between 0 and 1000%.');
    Object.assign(r, { opening_cents: input.opening_cents, minimum_cents: input.minimum_cents, apr_bps: input.apr_bps });
  }
  if (table === 'bills') { amount(input.amount_cents); if (!validDate(input.due_date)) throw Error('Choose a real due date.'); Object.assign(r, { amount_cents: input.amount_cents, due_date: input.due_date }); }
  return r;
}
export function totals(book) {
  const t = { income: 0, expense: 0, savings: 0, withdrawal: 0, debt_payment: 0 };
  book.transactions.forEach(e => { t[e.kind] += e.amount_cents; });
  t.available = t.income - t.expense - t.savings + t.withdrawal - t.debt_payment;
  return t;
}
export const saved = (book, goal) => goal.opening_cents + book.transactions.filter(e => e.goal_id === goal.id).reduce((s, e) => s + (e.kind === 'savings' ? e.amount_cents : -e.amount_cents), 0);
export const owed = (book, debt) => debt.opening_cents - book.transactions.filter(e => e.debt_id === debt.id).reduce((s, e) => s + e.amount_cents, 0);
export const unpaidBills = book => book.bills.filter(b => !book.transactions.some(e => e.bill_id === b.id)).sort((a, b) => a.due_date.localeCompare(b.due_date));
export function categoryTotals(book) {
  return CATEGORIES.map(name => ({ name, amount: book.transactions.filter(e => e.kind === 'expense' && e.category === name).reduce((s, e) => s + e.amount_cents, 0) })).filter(c => c.amount).sort((a, b) => b.amount - a.amount);
}
export function validateBook(book, { oneGoal = true } = {}) {
  if (!book || TABLES.some(t => !Array.isArray(book[t]))) throw Error('Invalid record book.');
  for (const table of TABLES) {
    const ids = book[table].map(r => r.id);
    if (ids.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) || new Set(ids).size !== ids.length) throw Error('Invalid record identifier.');
  }
  if (oneGoal && book.goals.length > 1) throw Error('The free account includes one goal. Multiple goals are planned for Premium.');
  for (const table of TABLES) for (const row of book[table]) {
    const clean = cleanRecord(table, row);
    if (Object.entries(clean).some(([key, value]) => (row[key] ?? null) !== value)) throw Error('Record fields do not match their entry type.');
  }
  for (const e of book.transactions) {
    if (e.goal_id && !book.goals.some(g => g.id === e.goal_id)) throw Error('That goal is no longer available.');
    if (e.debt_id && !book.debts.some(d => d.id === e.debt_id)) throw Error('That debt is no longer available.');
    if (e.bill_id && !book.bills.some(b => b.id === e.bill_id)) throw Error('That bill is no longer available.');
  }
  const billIds = book.transactions.filter(e => e.bill_id).map(e => e.bill_id);
  if (new Set(billIds).size !== billIds.length) throw Error('This bill already has a payment. Edit that entry instead.');
  for (const g of book.goals) if (saved(book, g) < 0) throw Error('Withdrawals cannot exceed savings. Check the opening amount and linked entries.');
  for (const d of book.debts) if (owed(book, d) < 0) throw Error('Payments cannot exceed the debt opening balance.');
  if (Object.values(totals(book)).some(n => !Number.isSafeInteger(n))) throw Error('Total exceeds safe calculation limits.');
  return book;
}
export function mutate(book, table, input, id, remove = false) {
  const next = structuredClone(book);
  if (id && !next[table].some(r => r.id === id)) throw Error('This record no longer exists. Refresh before trying again.');
  if (remove) next[table] = next[table].filter(r => r.id !== id);
  else {
    const record = { ...cleanRecord(table, input), id: id || crypto.randomUUID() };
    const i = next[table].findIndex(r => r.id === id);
    if (i < 0) next[table].push(record); else next[table][i] = record;
  }
  return validateBook(next);
}
export function allocate(received, percentages) {
  amount(received, true);
  if (percentages.some(p => !Number.isInteger(p) || p < 0 || p > 100) || percentages.reduce((a, b) => a + b, 0) !== 100) throw Error('Use whole percentages that add up to 100.');
  const parts = percentages.map(p => Math.floor(received * p / 100));
  let remainder = received - parts.reduce((a, b) => a + b, 0);
  // Largest remainder method, deterministic and exact to the centavo.
  percentages.map((p, i) => ({ i, fraction: (received * p) % 100 })).sort((a, b) => b.fraction - a.fraction).forEach(({ i }) => { if (remainder > 0) { parts[i]++; remainder--; } });
  return parts;
}
export function payoff(debts, budget, strategy = 'avalanche') {
  amount(budget);
  if(!['avalanche','snowball'].includes(strategy) || !Array.isArray(debts)) throw Error('Choose a valid payoff strategy.');
  for(const d of debts) {
    amount(d.balance,true);amount(d.minimum_cents,true);
    if(!Number.isInteger(d.apr_bps) || d.apr_bps < 0 || d.apr_bps > 100000) throw Error('APR must be between 0 and 1000%.');
  }
  const ds=debts.filter(d => d.balance > 0).map(d => ({...d}));
  if(!ds.length)return {months:0,interest:0,paid:0};
  if(budget < ds.reduce((s,d) => s+Math.min(d.minimum_cents,d.balance),0)) throw Error('The monthly budget is below the current minimum payments.');
  let interest=0,paid=0;
  for(let month=1;month<=600;month++) {
    let left=budget;
    for(const d of ds) {
      d.startBalance=d.balance;
      // Exact half-up centavo rounding, even at maximum supported balance/APR.
      const i=Number((BigInt(d.balance)*BigInt(d.apr_bps)+60000n)/120000n);
      d.balance+=i;interest+=i;
      if(!Number.isSafeInteger(d.balance) || !Number.isSafeInteger(interest))throw Error('Scenario exceeds safe calculation limits.');
      const payment=Math.min(d.balance,d.minimum_cents,left);d.balance-=payment;left-=payment;paid+=payment;
    }
    ds.sort(strategy === 'snowball' ? (a,b) => a.balance-b.balance : (a,b) => b.apr_bps-a.apr_bps);
    for(const d of ds) { const payment=Math.min(left,d.balance);d.balance-=payment;left-=payment;paid+=payment; }
    if(!Number.isSafeInteger(paid))throw Error('Scenario exceeds safe calculation limits.');
    if(ds.every(d => d.balance === 0))return {months:month,interest,paid};
    if(ds.some(d => d.balance > d.startBalance) || ds.reduce((s,d) => s+d.balance,0) >= ds.reduce((s,d) => s+d.startBalance,0)) throw Error('This strategy grows a debt balance or makes no principal progress (negative amortization or interest-only). Increase the budget or reconcile the minimum payments.');
  }
  throw Error('Not paid off within 50 years at that budget. Increase it or review your rates.');
}
export function demoBook() {
  const date = today();
  const goal = '00000000-0000-4000-8000-000000000001', debt = '00000000-0000-4000-8000-000000000002';
  const book = emptyBook();
  book.goals = [{ id: goal, title: 'Emergency fund', target_cents: 3000000, opening_cents: 400000 }];
  book.debts = [{ id: debt, title: 'Credit card', opening_cents: 2400000, minimum_cents: 120000, apr_bps: 3600 }];
  book.bills = [{ id: crypto.randomUUID(), title: 'Internet', amount_cents: 150000, due_date: date.slice(0, 8) + '20' }, { id: crypto.randomUUID(), title: 'Electricity', amount_cents: 200000, due_date: date.slice(0, 8) + '25' }];
  book.transactions = [
    { kind: 'income', amount_cents: 3000000, note: 'Sweldo + freelance', category: 'Other' },
    { kind: 'expense', amount_cents: 665000, note: 'Groceries & meals', category: 'Food' },
    { kind: 'expense', amount_cents: 472500, note: 'Rent & utilities', category: 'Bills' },
    { kind: 'expense', amount_cents: 262500, note: 'Commute', category: 'Transport' },
    { kind: 'expense', amount_cents: 350000, note: 'Family essentials', category: 'Family' },
    { kind: 'savings', amount_cents: 200000, note: 'Safety net top-up', category: 'Other', goal_id: goal },
    { kind: 'debt_payment', amount_cents: 100000, note: 'Card payment', category: 'Other', debt_id: debt }
  ].map(e => ({ goal_id: null, debt_id: null, bill_id: null, ...e, date, id: crypto.randomUUID() }));
  return book;
}
