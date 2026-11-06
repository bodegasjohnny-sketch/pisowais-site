import { emptyBook, demoBook, today, money, cents, totals, saved, owed, unpaidBills, categoryTotals, CATEGORIES, cleanRecord, mutate, allocate, payoff } from './model.js';
import { localStore, supabaseStore, accountConfig } from './store.js';
const ROOT = document.documentElement.dataset.root;
const app = document.getElementById('dashboard'), dialog = document.getElementById('editor');
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
const paths = {
  home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9', plan:'M4 20V9m5 11V5m5 15v-8m5 8V3', entries:'M6 3h12v18H6zM9 7h6M9 11h6M9 15h4', bills:'M6 5h12v16H6zM9 3v4m6-4v4M9 11h6m-6 4h4', goals:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8', debt:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4v5l3 2', plus:'M12 5v14m-7-7h14', arrow:'m9 5 7 7-7 7', edit:'m4 16 11-11 4 4L8 20H4v-4M13 7l4 4', trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7', close:'m6 6 12 12M6 18 18 6', wallet:'M3 5h16v15H3zM3 5l13-3v3M15 11h6v5h-6z', lock:'M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4m-4 5v2', star:'m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z', user:'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4 21v-3a8 8 0 0 1 16 0v3', menu:'M4 6h16M4 12h16M4 18h16', food:'M5 3v7m3-7v7M3 3v5a3 3 0 0 0 6 0M6 11v10M17 3v18m0-18c-5 3-5 10 0 10', transport:'M5 16h14V6H5zM7 3h10M7 16v4m10-4v4M5 11h14m-10 3h1m5 0h1', chart:'M4 3v18h17M8 16v-4m5 4V7m5 9v-6', check:'m5 12 4 4L19 6', back:'m15 5-7 7 7 7', logout:'M9 4H4v16h5m5-12 4 4-4 4m-5-4h12' };
const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${paths[name] || paths.entries}"/></svg>`;
const art = (name, cls = '') => `<img class="${cls}" src="${ROOT}assets/icons3d/${name}-160.webp" alt="" width="80" height="80">`;
const btn = (label, action, cls = 'btn', attrs = '') => `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const dateLabel = value => new Intl.DateTimeFormat('en-PH', { month:'short', day:'numeric', timeZone:'Asia/Manila' }).format(new Date(`${value}T00:00:00+08:00`));
const viewNames = { overview:'Overview', plan:'Payday Plan', transactions:'Transactions', bills:'Bills', goals:'Goals', debt:'Debt', premium:'Explore Premium', settings:'Your data' };
const navIcons = { overview:'home', plan:'plan', transactions:'entries', bills:'bills', goals:'goals', debt:'debt', premium:'star', settings:'user' };
let state = { mode:'welcome', view:'overview', filter:'all', book:emptyBook(), email:null }, store = null, client = null, config = {}, busy = false, authEpoch = 0, noticeTimer;
let authEmail = '';
const colors = ['#121F47','#D5AA43','#ED959A','#7A96C7','#77A58D','#D1B898','#BD8FA9','#9CA6BC'];
function notify(text) { const el = document.getElementById('notice'); el.textContent = text; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { el.textContent = ''; }, 6500); }
function navItem(view, compact = false) { const label = compact ? ({ overview:'Overview', plan:'Plan', transactions:'Entries', goals:'Goals', settings:'More' }[view] || viewNames[view]) : viewNames[view]; return `<button type="button" class="${compact ? '' : 'nav-button'}" data-action="view" data-view="${view}" ${state.view === view ? 'aria-current="page"' : ''}>${icon(navIcons[view])}<span>${label}</span></button>`; }
function shell() {
  app.innerHTML = `<div class="shell"><aside class="sidebar"><a class="side-brand" href="${ROOT}"><img src="${ROOT}assets/brand/mascot-280.webp" alt="" width="49" height="59"><span>Piso Wais</span></a><nav class="side-nav" aria-label="Dashboard">${['overview','plan','transactions','bills','goals','debt'].map(v => navItem(v)).join('')}</nav><div class="plan-card"><strong>Free plan</strong><p>Manual tracking. Your way.</p>${btn(icon('star')+'Explore Premium'+icon('arrow'), 'premium', 'btn pale')}</div><a class="site-link" href="${ROOT}">← Back to Piso Wais</a></aside><div class="mobile-top"><a class="mobile-brand" href="${ROOT}"><img src="${ROOT}assets/brand/logo-header.png" alt="Piso Wais" width="118" height="44"></a>${btn(icon('user'),'settings','icon-button','aria-label="Account and data options"')}</div><main class="main" id="content" tabindex="-1"><header class="topline"><div><h1>${state.view === 'overview' ? 'Your money, made clear.' : viewNames[state.view]}</h1><p>${state.view === 'overview' ? 'Planuhin ang susunod mong sweldo.' : 'Small habits. Wais na desisyon.'}</p></div><div class="top-actions">${state.mode === 'account' ? `<div class="account-badge"><span>${esc(state.email)}</span></div>` : ''}${btn(icon('plus')+'Add entry','add-entry','btn gold','aria-label="Add entry"')}</div></header>${modeBanner()}${state.mode === 'welcome' ? welcome() : ''}<div id="view-content">${viewContent()}</div><footer class="fineprint">${icon('lock')} Manual tracking · No bank connection<br>Educational only, not financial advice. <a href="${ROOT}privacy/">Privacy</a> · ${btn('Your data & account','settings','text-button')}</footer></main><nav class="bottom-nav" aria-label="Dashboard">${['overview','plan','transactions','goals','settings'].map(v => navItem(v,true)).join('')}</nav></div>`;
}
function modeBanner() {
  if (state.mode === 'demo') return `<div class="status-bar"><span><strong>EXAMPLE DATA</strong> · Not your finances. Changes reset when you reload.</span>${btn('Exit example','exit','text-button')}</div>`;
  if (state.mode === 'local') return `<div class="status-bar"><span><strong>LOCAL PREVIEW</strong> · Saved only in this browser, not encrypted or synced. Not an account.</span>${btn('Data options','settings','text-button')}</div>`;
  if (state.mode === 'account') return `<div class="status-bar"><span><strong>Free account</strong> · Your records, protected by account access rules.</span>${btn('Sign out','logout','text-button')}</div>`;
  return `<div class="status-bar"><span><strong>Dashboard preview</strong> · ${accountConfig(config) ? 'Create a free account to save your numbers.' : 'Accounts coming soon. No cloud account storage is connected.'}</span>${btn('Free account','account','text-button')}</div>`;
}
function welcome() { return `<section class="welcome" aria-label="Choose how to try the dashboard"><img src="${ROOT}assets/brand/mascot-280.webp" alt="" width="88" height="96"><div><h2>A little clarity for every piso.</h2><p>Track income, expenses, upcoming bills and one savings goal. Start with examples, or choose a local-only preview. The free cheat sheet stays free - no account required.</p><div class="button-row">${btn('Try example dashboard','demo','btn gold')}${btn('Use local preview','local','btn outline')}${btn(accountConfig(config) ? 'Create free account / Sign in' : 'Free account · Coming soon','account','btn outline')}</div></div></section>`; }
function viewContent() { return ({overview:overview, transactions:transactions, goals:goals, bills:bills, debt:debts, plan:planner, premium:premium, settings:settings}[state.view] || overview)(); }
function summary() {
  const t = totals(state.book);
  return `<p class="eyebrow">Cash-basis recorded totals · All time</p><div class="summary-grid"><button type="button" class="summary-card primary" data-action="breakdown" data-kind="available"><span class="label">Available to budget</span><strong class="amount">${money(t.available)}</strong><span class="hint">Income minus spending & money set aside</span>${art('wallet')}<span class="card-link">View breakdown ${icon('arrow')}</span></button><button type="button" class="summary-card" data-action="breakdown" data-kind="income">${art('coin-stack')}<span class="label">Income</span><strong class="amount">${money(t.income)}</strong><span class="card-link">View entries ${icon('arrow')}</span></button><button type="button" class="summary-card" data-action="breakdown" data-kind="expense">${art('chart-up')}<span class="label">Expenses</span><strong class="amount">${money(t.expense)}</strong><span class="card-link">View entries ${icon('arrow')}</span></button></div>`;
}
function overview() {
  const cats = categoryTotals(state.book), total = totals(state.book).expense, goal = state.book.goals[0], bills = unpaidBills(state.book);
  return summary()+`<div class="content-grid"><section class="panel spend-panel"><div class="panel-head"><h2>Spending by category</h2>${btn('View all','spending','text-button')}</div>${cats.length ? cats.slice(0,4).map((c,i) => `<div class="category-row"><span class="cat-symbol">${icon(c.name === 'Food' ? 'food' : c.name === 'Transport' ? 'transport' : 'bills')}</span><span>${esc(c.name)}</span><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${c.amount/total*100}%;background:${colors[i]}"></div></div><span class="category-number">${Math.round(c.amount/total*100)}% · ${money(c.amount)}</span></div>`).join('') : empty('Your spending story starts here. Record an expense to see the categories.', 'Add expense','add-expense','pie-chart')}</section><section class="panel goals-panel"><div class="panel-head"><h2>${esc(goal?.title || 'Emergency fund')}</h2>${btn(goal ? 'View goal' : 'Set a goal','view','text-button','data-view="goals"')}</div>${goal ? goalProgress(goal) : `<div class="goal-intro">${art('savings-jar')}<div><strong>Build your safety net.</strong><p class="hint">Start with an amount that works for you.</p></div></div><p class="hint">One savings goal is included free.</p>`}</section><section class="panel"><div class="panel-head"><h2>Upcoming bills</h2>${btn('View all','view','text-button','data-view="bills"')}</div>${bills.length ? bills.slice(0,3).map(bill => billRow(bill,true)).join('') : empty('No unpaid bills recorded. Add the next due date so it is easier to plan.','Add bill','add-bill','calendar')}</section><section class="panel next-step"><div class="panel-head"><h2>Your next step</h2></div><p>${totals(state.book).available < 0 ? 'Recorded outflows are above income. Check the breakdown before planning more spending.' : 'Give your next sweldo a purpose. Preview an allocation that fits irregular income, too.'}</p>${btn('Plan my payday '+icon('arrow'),'view','btn gold','data-view="plan"')}<p class="hint" style="margin:12px 0 0">Premium concept · ${state.mode === 'demo' ? 'example preview' : 'not on sale yet'}</p></section></div>`;
}
function empty(copy, label, action, image) { return `<div class="empty">${image ? art(image) : ''}<p>${copy}</p>${label ? btn(label,action,'btn outline') : ''}</div>`; }
function goalProgress(goal) {
  const value = saved(state.book,goal), percent = Math.floor(value/goal.target_cents*100);
  return `<div class="goal-intro">${art('savings-jar')}<div><strong>Building your safety net.</strong><p class="hint">Your entries. Your pace.</p></div></div><progress class="progress" value="${Math.min(value,goal.target_cents)}" max="${goal.target_cents}" aria-label="${esc(goal.title)}: ${percent}%"></progress><div class="goal-caption"><span>${money(value)} of ${money(goal.target_cents)}</span><span>${percent}% of your goal</span></div>`;
}
function billRow(bill, compact = false) {
  const payment = state.book.transactions.find(e => e.bill_id === bill.id), overdue = !payment && bill.due_date < today();
  return `<div class="list-row"><span class="list-symbol">${icon('bills')}</span><div class="list-info"><strong>${esc(bill.title)}</strong><p class="${overdue ? 'bill-overdue' : ''}">${money(bill.amount_cents)} · ${dateLabel(bill.due_date)}${overdue ? ' · Overdue' : ''}${payment ? ' · Paid' : ''}</p></div><div class="row-actions">${compact ? btn(icon('arrow'),'edit-bill','icon-button',`data-id="${bill.id}" aria-label="View ${esc(bill.title)} bill"`) : `${!payment ? btn('Record paid','pay-bill','text-button',`data-id="${bill.id}"`) : '<span class="tag">Paid</span>'}${rowActions('bills',bill.id,bill.title)}`}</div></div>`;
}
function rowActions(table,id,title) { return `${btn(icon('edit'),'edit','icon-button',`data-table="${table}" data-id="${id}" aria-label="Edit ${esc(title)}"`)}${btn(icon('trash'),'delete','icon-button',`data-table="${table}" data-id="${id}" aria-label="Delete ${esc(title)}"`)}`; }
function transactionRows(rows) {
  return rows.length ? `<div class="table-wrap"><table class="ledger"><thead><tr><th scope="col">Entry</th><th scope="col" class="desktop-column">Date</th><th scope="col">Amount</th><th scope="col">Actions</th></tr></thead><tbody>${[...rows].sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).map(e => `<tr><td><strong>${esc(e.note)}</strong><span class="hint">${esc(typeLabel(e.kind))}${e.kind === 'expense' ? ' · '+esc(e.category) : ''}<br>${dateLabel(e.date)} · ${e.date.slice(0,4)}</span></td><td class="desktop-column">${esc(e.date)}</td><td class="${['income','withdrawal'].includes(e.kind) ? 'positive' : ''}">${['income','withdrawal'].includes(e.kind) ? '+' : '−'}${money(e.amount_cents)}</td><td><div class="row-actions">${rowActions('transactions',e.id,e.note)}</div></td></tr>`).join('')}</tbody></table></div>` : empty('No entries here yet. Add your first income or expense.','Add entry','add-entry','envelope');
}
const typeLabel = kind => ({income:'Income',expense:'Expense',savings:'Set aside for savings',withdrawal:'Savings withdrawal',debt_payment:'Debt payment'}[kind]);
function transactions() {
  const rows = state.book.transactions.filter(e => state.filter === 'all' || e.kind === state.filter);
  return `<div class="section-intro"><p>Cash-basis tracking: record cash/debit expenses or debt payments, never both for the same outflow. A credit-card purchase is not a cash expense here; record the later repayment as Debt payment. Planned bills are excluded until paid.</p></div><section class="panel"><div class="toolbar"><label for="entry-filter">Show <select id="entry-filter"><option value="all">All entries</option>${['income','expense','savings','withdrawal','debt_payment'].map(k => `<option value="${k}" ${state.filter === k ? 'selected' : ''}>${typeLabel(k)}</option>`).join('')}</select></label><span class="hint">${rows.length} entries · All time</span></div>${transactionRows(rows)}</section>`;
}
function goals() {
  return `<div class="section-intro"><p>One goal is included free. Existing savings can be entered as an opening amount; they are not added to income.</p></div>${state.book.goals.length ? state.book.goals.map(g => `<section class="panel"><div class="panel-head"><h2>${esc(g.title)}</h2><div class="row-actions">${rowActions('goals',g.id,g.title)}</div></div>${goalProgress(g)}<p class="breakdown-note">Opening savings ${money(g.opening_cents)} + deposits − withdrawals. Setting money aside reduces available-to-budget, not your expense total.</p><div class="button-row" style="margin-top:18px">${btn('Add savings','add-savings','btn gold',`data-id="${g.id}"`)}${btn('Withdraw','withdraw','btn outline',`data-id="${g.id}"`)}${btn('View breakdown','goal-breakdown','text-button',`data-id="${g.id}"`)}</div></section>`).join('') : `<section class="panel">${empty('One small goal. A clearer next step. Choose your target and add any savings you already have.','Create savings goal','add-goal','target')}</section>`}<div class="notice-inline" style="margin-top:18px">Multiple goals are a planned Premium feature. ${btn('See what is planned','premium','text-button')}</div>`;
}
function bills() { return `<div class="section-intro"><p>Bills are reminders, not automatic payments. “Record paid” creates one linked expense. Deleting that expense marks the bill unpaid again.</p></div><section class="panel"><div class="panel-head"><h2>Your bills</h2>${btn(icon('plus')+'Add bill','add-bill','btn outline')}</div>${state.book.bills.length ? [...state.book.bills].sort((a,b)=>a.due_date.localeCompare(b.due_date)).map(b=>billRow(b)).join('') : empty('Add a bill and its next due date. For repeating bills, add each payment date separately.','Add bill','add-bill','calendar')}</section>`; }
function debts() { return `<div class="section-intro"><p>Track opening debt minus recorded payments. Interest and new borrowing are not added automatically. Reconcile the opening balance with your lender’s statement when needed.</p></div><section class="panel"><div class="panel-head"><h2>Debt tracker</h2>${btn(icon('plus')+'Add debt','add-debt','btn outline')}</div>${state.book.debts.length ? state.book.debts.map(d => `<div class="list-row"><span class="list-symbol">${icon('debt')}</span><div class="list-info"><strong>${esc(d.title)}</strong><p>${d.apr_bps/100}% APR · Min ${money(d.minimum_cents)}/month</p><p>Opening ${money(d.opening_cents)} − payments</p></div><div class="list-money">${money(owed(state.book,d))}</div><div class="row-actions">${btn(icon('plus'),'debt-pay','icon-button',`data-id="${d.id}" aria-label="Record payment for ${esc(d.title)}"`)}${rowActions('debts',d.id,d.title)}</div></div>`).join('') : empty('Add a debt to see what is left after each payment.','Add debt','add-debt','credit-card')}</section><div style="margin-top:18px">${state.mode === 'demo' ? scenarioForm() : locked('Debt payoff scenarios','Compare avalanche and snowball with a fixed monthly budget. This planned Premium feature is not available for purchase yet.')}</div>`; }
function planner() { return `<div class="section-intro"><p>Plan from money actually received - not a salary you hope to get. Allocations are a plan only; they do not create transactions.</p></div>${state.mode === 'demo' ? `<section class="panel"><div class="panel-head"><h2>Payday allocation · Example preview</h2><span class="tag">Premium concept</span></div><form id="payday-form"><label class="field">Income received (₱)<input name="received" inputmode="decimal" type="number" step="0.01" min="0" value="15000" required></label><div class="form-grid">${['Essentials','Flexible spending','Savings','Debt'].map((name,i) => `<label class="field">${name} (%)<input name="p${i}" type="number" min="0" max="100" step="1" value="${[60,20,10,10][i]}" required></label>`).join('')}</div><p class="hint">Whole percentages must total 100. Change these to fit your situation.</p><p class="form-error" role="alert"></p><button class="btn gold" type="submit" style="margin-top:14px">Calculate my plan</button><div class="form-result" aria-live="polite"></div></form></section>` : locked('A plan for every payday.','Give each peso a job, even when your income changes. Payday allocation is a planned Premium feature. Free tracking and one savings goal do not require an upgrade.')}`; }
function locked(title,copy) { return `<section class="locked"><div class="lock-icon">${icon('lock')}</div><h2>${title}</h2><p>${copy}</p><div class="button-row">${btn('Explore Premium','premium','btn gold')}${btn('Try an example','demo','btn outline')}</div><p class="hint" style="margin-bottom:0">Coming soon · No price or checkout · You will not be charged.</p></section>`; }
function scenarioForm() { return `<section class="panel"><div class="panel-head"><h2>Payoff scenarios · Example preview</h2><span class="tag">Premium concept</span></div><p class="details-intro">Fixed APR, monthly compounding, no new borrowing or fees. Estimates - not lender payoff quotes.</p><form id="scenario-form"><label class="field">Total monthly debt budget (₱)<input name="budget" type="number" inputmode="decimal" step="0.01" min="0.01" value="3000" required></label><p class="form-error" role="alert"></p><button class="btn gold" type="submit">Compare payoff plans</button><div class="form-result" aria-live="polite"></div></form></section>`; }
function premium() { return `<div class="section-intro"><p>The cheat sheet and basic tracking stay free. Upgrade only if the added tools are valuable to you.</p></div><div class="pricing"><section class="panel"><span class="eyebrow">Start simple</span><h3>Free account</h3><p class="muted small">Your everyday money overview</p><ul><li>Manual income & expense entries</li><li>Clickable number breakdowns</li><li>Spending categories & upcoming bills</li><li>One savings goal</li><li>Basic debt balance tracking</li></ul>${btn(accountConfig(config) ? 'Create account / Sign in' : 'Account setup · Coming soon','account','btn outline')}<p class="hint" style="margin-top:14px">${accountConfig(config) ? 'Free. No card needed.' : 'Cloud accounts are not connected yet. Try the local or example preview instead.'}</p></section><section class="panel premium"><span class="tag">Coming soon · Not on sale</span><h3>Premium</h3><p class="muted small">More ways to plan ahead</p><ul><li>Multiple savings goals</li><li>Payday planning for irregular income</li><li>Debt-payoff scenarios</li><li>Downloadable summaries</li></ul>${btn('Preview with example data','demo','btn gold')}<p class="hint" style="margin-top:14px">Features and pricing are still being reviewed. No checkout, no charges and no paid entitlement is issued.</p></section></div>`; }
function settings() { return `<div class="settings-list"><section class="panel"><div class="panel-head"><h2>Your data, your choice</h2></div><p class="details-intro">${state.mode === 'local' ? 'This preview saves your entries in this browser’s local storage. It is not encrypted, not an account and not backed up. People using this browser can see it. Do not use sensitive real financial data on a shared device.' : state.mode === 'account' ? 'Records are stored in the configured Supabase project under your account. Signing out clears the dashboard from this tab. You can edit or delete each entry; deleting a linked record requires removing its entries first.' : 'Example data stays in this page’s memory. No personal financial data is sent to a server in the example or local preview.'}</p><div class="button-row">${state.mode === 'local' ? btn('Clear local preview data','clear','btn danger') : ''}${state.mode === 'account' ? btn('Sign out','logout','btn outline') : btn('Free account','account','btn outline')}${btn('Use local preview','local','btn outline')}${btn('Try examples','demo','btn pale')}</div></section><section class="panel"><h2>More tools</h2><div class="button-row" style="margin-top:18px">${btn('Bills','view','btn outline','data-view="bills"')}${btn('Debt','view','btn outline','data-view="debt"')}${btn('Premium','premium','btn outline')}<a class="btn outline" href="${ROOT}downloads/piso-wais-cheat-sheet.pdf">Free cheat sheet</a></div></section><section class="panel"><h2>How the numbers work</h2><p class="details-intro" style="margin:12px 0 0">All amounts use integer centavos. Available to budget = recorded income − expenses − savings deposits + withdrawals − debt payments. It is not a bank balance. Opening goal savings and debt balances are tracked separately; planned bills are excluded until paid. All-time totals include only entries you record. No bank sync, automatic interest, automatic bill payments or automated financial advice.</p></section><section class="panel"><h2>Privacy & help</h2><p class="details-intro" style="margin:12px 0 0">No analytics records your amounts. <a href="${ROOT}privacy/">Read the privacy notice</a>. Account deletion and data-access requests: <a href="mailto:info@johnnybodegas.com">info@johnnybodegas.com</a>. Do not email passwords, OTPs or financial records.</p></section></div>`; }
function showDialog(title,body) { dialog.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${title}</h2>${btn(icon('close'),'close','icon-button','aria-label="Close dialog"')}</div>${body}`; if (!dialog.open) dialog.showModal(); }
function field(name,label,value = '',attrs = '',help = '') { return `<label class="field" for="f-${name}">${label}<input id="f-${name}" name="${name}" value="${esc(value)}" ${attrs}>${help ? `<span class="hint">${help}</span>` : ''}</label>`; }
const amountInput = 'type="number" inputmode="decimal" min="0" step="0.01" required';
function canEdit() { if (state.mode !== 'welcome') return true; showDialog('Choose a preview first',`<p class="dialog-copy">Accounts ${accountConfig(config) ? 'are available' : 'are coming soon'}. Try examples without saving, or explicitly choose local-only storage.</p><div class="button-row">${btn('Try examples','demo','btn gold')}${btn('Local preview','local','btn outline')}${btn('Free account','account','btn outline')}</div>`); return false; }
function editor(table,id,defaults = {}) {
  if (!canEdit()) return;
  const row = id ? state.book[table].find(r=>r.id===id) : defaults;
  if (!row) return notify('This record no longer exists.');
  const title = (id ? 'Edit ' : 'Add ') + ({transactions:'entry',goals:'savings goal',bills:'bill',debts:'debt'}[table]);
  let fields = '';
  if (table === 'transactions') {
    const kind = row.kind || 'expense';
    fields = `<label class="field" for="f-kind">Entry type<select id="f-kind" name="kind">${['income','expense','savings','withdrawal','debt_payment'].map(k=>`<option value="${k}" ${kind===k?'selected':''}>${typeLabel(k)}</option>`).join('')}</select></label>${field('note','Description',row.note || '', 'maxlength="120" required autocomplete="off"') }<div class="form-grid">${field('amount','Amount (₱)',row.amount_cents != null ? row.amount_cents/100 : '',amountInput.replace('min="0"','min="0.01"'))}${field('date','Date · Manila',row.date || today(),`type="date" required max="${today()}"`)}</div><div id="entry-links"></div>`;
  } else {
    fields = field('title','Name',row.title || '', 'maxlength="80" required autocomplete="off"');
    if (table === 'goals') fields += `<div class="form-grid">${field('target','Target (₱)',(row.target_cents || '') && row.target_cents/100,amountInput.replace('min="0"','min="0.01"'))}${field('opening','Already saved (₱)',(row.opening_cents || 0)/100,amountInput)}</div><p class="notice-inline">Already-saved money does not increase recorded income or available-to-budget. Add new savings through a savings entry.</p>`;
    if (table === 'bills') fields += `<div class="form-grid">${field('amount','Amount due (₱)',row.amount_cents != null ? row.amount_cents/100 : '',amountInput.replace('min="0"','min="0.01"'))}${field('due_date','Due date',row.due_date || today(),'type="date" required')}</div><p class="notice-inline">This is a reminder only. No money is moved and no expense is recorded until you select “Record paid.”</p>`;
    if (table === 'debts') fields += `${field('opening','Opening debt balance (₱)',row.opening_cents != null ? row.opening_cents/100 : '',amountInput.replace('min="0"','min="0.01"'))}<div class="form-grid">${field('apr','Annual interest rate (%)',(row.apr_bps || 0)/100,amountInput+' max="1000"')}${field('minimum','Minimum monthly payment (₱)',(row.minimum_cents || 0)/100,amountInput)}</div><p class="notice-inline">No automatic interest is added. Balance = opening debt − payments. Check your lender’s statement.</p>`;
  }
  showDialog(title,`<form id="record-form" data-table="${table}" data-id="${id || ''}">${fields}<p class="form-error" role="alert"></p><div class="button-row">${btn('Cancel','close','btn outline')}<button class="btn gold" type="submit">${id ? 'Save changes' : 'Add '+({transactions:'entry',goals:'goal',bills:'bill',debts:'debt'}[table])}</button></div></form>`);
  if (table === 'transactions') updateLinks(row);
}
function updateLinks(row = {}) {
  const kind = dialog.querySelector('[name=kind]').value, el = dialog.querySelector('#entry-links');
  const opts = (rows,selected) => rows.map(r=>`<option value="${r.id}" ${r.id===selected?'selected':''}>${esc(r.title)}</option>`).join('');
  if (kind === 'expense') el.innerHTML = `<label class="field" for="f-category">Category<select id="f-category" name="category">${CATEGORIES.map(c=>`<option ${c === (row.category || 'Other') ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label class="field" for="f-bill_id">Link to a bill (optional)<select id="f-bill_id" name="bill_id"><option value="">No bill</option>${opts(state.book.bills,row.bill_id)}</select><span class="hint">Record cash/debit spending only, not a credit-card purchase that will be repaid later. A linked bill is marked paid once, using this amount.</span></label>`;
  else if (['savings','withdrawal'].includes(kind)) el.innerHTML = `<label class="field" for="f-goal_id">Savings goal<select id="f-goal_id" name="goal_id" required><option value="">Choose a goal</option>${opts(state.book.goals,row.goal_id)}</select></label><p class="hint">${state.book.goals.length ? 'Savings transfers do not count as expenses.' : 'Create a savings goal first under Goals.'}</p>`;
  else if (kind === 'debt_payment') el.innerHTML = `<label class="field" for="f-debt_id">Debt<select id="f-debt_id" name="debt_id" required><option value="">Choose a debt</option>${opts(state.book.debts,row.debt_id)}</select></label><p class="hint">Payments reduce debt and available-to-budget, not expenses. Cash-basis tracking: do not also record the financed purchase or this repayment as an expense.</p>`;
  else el.innerHTML = `<p class="hint">Record money actually received. Do not count transfers between your own accounts as income.</p>`;
}
function breakdown(kind) {
  const t = totals(state.book);
  if (kind !== 'available') { state.view='transactions';state.filter=kind;shell();return; }
  showDialog('Where this number comes from',`<p class="dialog-copy">Recorded entries · All time. Not your bank balance.</p>${[['Income',t.income],['− Expenses',-t.expense],['− Savings set aside',-t.savings],['+ Savings withdrawn',t.withdrawal],['− Debt payments',-t.debt_payment]].map(([name,value])=>`<div class="total-line"><span>${name}</span><strong>${money(value)}</strong></div>`).join('')}<div class="total-line final"><span>Available to budget</span><span>${money(t.available)}</span></div><p class="breakdown-note">Opening savings/debt and unpaid bills are not included. Only actual recorded movements affect this number. A negative total means recorded outflows exceed income, not that your bank account is overdrawn.</p><div class="button-row">${btn('See all entries','all-entries','btn gold')}</div>`);
}
function spending() {
  const cats = categoryTotals(state.book), total = totals(state.book).expense;
  let cursor=0;
  const gradient = cats.map((c,i)=>{const start=cursor;cursor+=c.amount/total*100;return `${colors[i]} ${start}% ${cursor}%`;}).join(',');
  showDialog('Your spending breakdown',`<p class="dialog-copy">Recorded expenses · All time. Savings transfers and debt payments are excluded.</p>${total ? `<div class="donut-layout"><div class="donut" style="background:conic-gradient(${gradient})" role="img" aria-label="Spending total ${money(total)}; category amounts listed beside the chart"><div class="donut-total">${money(total)}<span>Total expenses</span></div></div><div class="legend">${cats.map((c,i)=>`<div><i style="background:${colors[i]}"></i>${esc(c.name)}<br><strong>${money(c.amount)}</strong> · ${Math.round(c.amount/total*100)}%</div>`).join('')}</div></div>` : '<p class="details-intro">No expenses recorded yet. This chart will use your entries, not placeholder data.</p>'}<div class="button-row">${btn('View expense entries','expense-entries','btn gold')}</div>`);
}
function account() {
  if (!accountConfig(config)) { showDialog('Free accounts are coming soon',`<p class="dialog-copy">Cloud account storage is not connected yet. We will not ask for your email, password or financial details before it is ready.</p><p class="notice-inline">Basic tracking and one goal will be free. Premium is planned - not on sale. No payment details are collected.</p><div class="button-row">${btn('Try examples','demo','btn gold')}${btn('Local preview','local','btn outline')}</div>`); return; }
  if(state.mode==='account') {state.view='settings';shell();return;}
  showDialog('Create a free account / Sign in',`<p class="dialog-copy">Use a one-time code sent to your email. No password or card needed. By continuing, you acknowledge the <a href="${ROOT}privacy/">privacy notice</a>. Local preview entries are not uploaded or merged.</p><form id="auth-form">${field('email','Email address','','type="email" autocomplete="email" required maxlength="254"')}<p class="form-error" role="alert"></p><button class="btn gold" type="submit">Send my sign-in code</button></form>`);
}
async function loadAccount(session) {
  const epoch = ++authEpoch;
  store?.dispose?.(); store = null;
  state = {...state,mode:session?'account':'welcome',email:session?.user.email || null,book:emptyBook(),filter:'all'};
  shell();
  if (!session) return;
  const nextStore = supabaseStore(client,session.user.id);
  store = nextStore;
  try { const book = await nextStore.load(); if(epoch===authEpoch) {state.book=book;shell();} }
  catch { if(epoch===authEpoch) {notify('Account connected, but records could not load. Backend setup may be incomplete.');} }
}
async function enterMode(mode) {
  if (state.mode === 'account') { notify('Sign out before entering a preview. Your account records will not be mixed with local data.'); return; }
  if(dialog.open) dialog.close();
  const epoch = ++authEpoch;
  try {
    const next = mode==='local' ? localStore(window.localStorage) : localStore(null,demoBook());
    const book = await next.load();
    if(epoch!==authEpoch) return;
    store=next;state={...state,mode,book,view:'overview',filter:'all',email:null};shell();
  } catch (error) { notify(error.message || 'This browser cannot save local preview data. Try the example instead.'); }
}
function localConsent() { showDialog('Use this browser only?',`<p class="dialog-copy">This is an optional local preview, not a Piso Wais account. Entries are stored unencrypted in this browser. They are not synced, backed up or uploaded. Clearing browser data loses them.</p><p class="notice-inline">Use examples rather than sensitive real numbers on shared devices. Free cloud accounts are ${accountConfig(config)?'available separately':'coming soon'}.</p><form id="local-consent"><label class="field"><input type="checkbox" name="agree" required>I understand and choose local-only storage.</label><div class="button-row">${btn('Cancel','close','btn outline')}<button class="btn gold" type="submit">Start local preview</button></div></form>`); }
function deleteConfirm(table,id) {
  const row=state.book[table].find(r=>r.id===id);if(!row)return;
  showDialog('Delete this record?',`<p class="dialog-copy">Delete <strong>${esc(row.note||row.title)}</strong>? This cannot be undone.${table==='transactions'?' Its amount will be removed from every related total. A linked bill will become unpaid again.':' Linked entries must be deleted first.'}</p><p class="form-error" role="alert"></p><div class="button-row">${btn('Keep record','close','btn outline')}${btn('Delete record','confirm-delete','btn danger',`data-table="${table}" data-id="${id}"`)}</div>`);
}
async function saveRecord(form) {
  const fd = Object.fromEntries(new FormData(form)), table=form.dataset.table, id=form.dataset.id||null;
  let input;
  if(table==='transactions') input={...fd,amount_cents:cents(fd.amount)};
  if(table==='goals') input={...fd,target_cents:cents(fd.target),opening_cents:cents(fd.opening)};
  if(table==='bills') input={...fd,amount_cents:cents(fd.amount)};
  if(table==='debts') input={...fd,opening_cents:cents(fd.opening),minimum_cents:cents(fd.minimum),apr_bps:cents(fd.apr)};
  const cleaned=cleanRecord(table,input);
  mutate(state.book,table,cleaned,id); // Same invariants checked before both persistence paths.
  const epoch=authEpoch, next=await store.save(table,cleaned,id);
  if(epoch!==authEpoch)return;
  state.book=next;dialog.close();shell();notify(id?'Changes saved.':'Entry added.');
}
async function runBusy(container,task) {
  if(busy)return;busy=true;
  const buttons=[...container.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  try { await task(); } catch(error) { const el=container.querySelector('.form-error'); if(el){el.textContent=error.message;el.focus?.();}else notify(error.message||'Something went wrong. Try again.'); }
  finally { busy=false;buttons.forEach(b=>b.disabled=false); }
}
async function action(button) {
  const a=button.dataset.action,id=button.dataset.id,table=button.dataset.table;
  if(a==='close'){dialog.close();return;}
  if(a==='view'){state.view=button.dataset.view;if(dialog.open)dialog.close();shell();document.getElementById('content').focus({preventScroll:true});return;}
  if(a==='premium'||a==='settings'){state.view=a;if(dialog.open)dialog.close();shell();return;}
  if(a==='demo'){await enterMode('demo');return;}
  if(a==='local'){localConsent();return;}
  if(a==='account'){account();return;}
  if(a==='exit'){++authEpoch;store=null;state={...state,mode:'welcome',book:emptyBook(),view:'overview'};shell();return;}
  if(a==='add-entry'){editor('transactions');return;}
  if(a==='add-expense'){editor('transactions',null,{kind:'expense'});return;}
  if(a==='add-bill'){editor('bills');return;}
  if(a==='add-goal'){editor('goals');return;}
  if(a==='add-debt'){editor('debts');return;}
  if(a==='edit-bill'){editor('bills',id);return;}
  if(a==='edit'){editor(table,id);return;}
  if(a==='delete'){deleteConfirm(table,id);return;}
  if(a==='add-savings'||a==='withdraw'){editor('transactions',null,{kind:a==='withdraw'?'withdrawal':'savings',goal_id:id});return;}
  if(a==='debt-pay'){editor('transactions',null,{kind:'debt_payment',debt_id:id});return;}
  if(a==='pay-bill'){const b=state.book.bills.find(b=>b.id===id);if(b)editor('transactions',null,{kind:'expense',bill_id:id,amount_cents:b.amount_cents,note:b.title,category:'Bills'});return;}
  if(a==='breakdown'){breakdown(button.dataset.kind);return;}
  if(a==='spending'){spending();return;}
  if(a==='all-entries'||a==='expense-entries'){state.view='transactions';state.filter=a==='expense-entries'?'expense':'all';dialog.close();shell();return;}
  if(a==='goal-breakdown'){const goal=state.book.goals.find(g=>g.id===id);showDialog('Savings breakdown',`<p class="dialog-copy">${esc(goal.title)}: opening savings ${money(goal.opening_cents)} + deposits − withdrawals = <strong>${money(saved(state.book,goal))}</strong>.</p>${transactionRows(state.book.transactions.filter(e=>e.goal_id===id))}`);return;}
  if(a==='confirm-delete')return runBusy(dialog,async()=>{mutate(state.book,table,null,id,true);const epoch=authEpoch,next=await store.remove(table,id);if(epoch===authEpoch){state.book=next;dialog.close();shell();notify('Record deleted. Totals updated.');}});
  if(a==='clear'){showDialog('Clear this local preview?',`<p class="dialog-copy">Every local preview entry in this browser will be permanently removed. Your cloud account (if any) is not affected.</p><div class="button-row">${btn('Keep my data','close','btn outline')}${btn('Clear local data','confirm-clear','btn danger')}</div>`);return;}
  if(a==='confirm-clear')return runBusy(dialog,async()=>{state.book=await store.clear();dialog.close();shell();notify('Local preview data cleared.');});
  if(a==='logout')return runBusy(app,async()=>{const old=store;old?.dispose?.();++authEpoch;state={...state,mode:'welcome',book:emptyBook(),email:null,view:'overview'};store=null;shell();const {error}=await client.auth.signOut({scope:'local'});if(error)notify('Dashboard cleared, but sign-out could not be confirmed. Close this tab.');else notify('Signed out. This tab’s account data is cleared.');});
}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(b&&!busy) action(b).catch(()=>notify('Could not complete that action. Please try again.'));});
document.addEventListener('change',e=>{if(e.target.id==='f-kind')updateLinks();if(e.target.id==='entry-filter'){state.filter=e.target.value;shell();}});
document.addEventListener('submit',e=>{
  const form=e.target;if(!['record-form','payday-form','scenario-form','local-consent','auth-form','otp-form'].includes(form.id))return;
  e.preventDefault();
  if(form.id==='record-form')return runBusy(form,()=>saveRecord(form));
  if(form.id==='local-consent'){if(form.reportValidity())enterMode('local');return;}
  if(form.id==='payday-form') {
    const fd=new FormData(form),result=form.querySelector('.form-result');
    try { const values=allocate(cents(fd.get('received')),[0,1,2,3].map(i=>Number(fd.get('p'+i))));form.querySelector('.form-error').textContent='';result.innerHTML=['Essentials','Flexible spending','Savings','Debt'].map((name,i)=>`<div class="total-line"><span>${name}</span><strong>${money(values[i])}</strong></div>`).join('')+'<p>Plan only - no entries or transfers created. Recalculate each time income arrives.</p>'; }
    catch(error){result.innerHTML='';form.querySelector('.form-error').textContent=error.message;}return;
  }
  if(form.id==='scenario-form') {
    try { const ds=state.book.debts.map(d=>({...d,balance:owed(state.book,d)})),budget=cents(new FormData(form).get('budget'));const results=['avalanche','snowball'].map(strategy=>({strategy,...payoff(ds,budget,strategy)}));form.querySelector('.form-error').textContent='';form.querySelector('.form-result').innerHTML=`<div class="scenario-columns">${results.map(r=>`<div><h3>${r.strategy==='avalanche'?'Avalanche':'Snowball'}</h3><p><strong>${r.months} months</strong><br>Estimated interest ${money(r.interest)}<br>Total paid ${money(r.paid)}</p></div>`).join('')}</div><p>Fixed APR monthly interest, minimums first, extra to ${'highest APR / lowest balance'}. No future fees or borrowing. Confirm actual terms with your lender.</p>`; }
    catch(error){form.querySelector('.form-result').innerHTML='';form.querySelector('.form-error').textContent=error.message;}return;
  }
  if(form.id==='auth-form')return runBusy(form,async()=>{
    authEmail=new FormData(form).get('email').trim();
    const {error}=await client.auth.signInWithOtp({email:authEmail,options:{shouldCreateUser:true}});
    if(error)throw Error('Could not send a code. Check your email and try again later.');
    showDialog('Check your email',`<p class="dialog-copy">If eligible, a sign-in email has been sent to ${esc(authEmail)}. Enter the code below. Codes expire; never share them.</p><form id="otp-form">${field('token','Email sign-in code','','type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" minlength="6" maxlength="10" required')}<p class="form-error" role="alert"></p><button class="btn gold" type="submit">Verify & open dashboard</button></form>`);
  });
  if(form.id==='otp-form')return runBusy(form,async()=>{const {error}=await client.auth.verifyOtp({email:authEmail,token:new FormData(form).get('token').trim(),type:'email'});if(error)throw Error('The code is invalid or expired. Request a new code.');authEmail='';dialog.close();});
});
async function start() {
  try {const response=await fetch(ROOT+'config/dashboard.json',{cache:'no-store'});if(response.ok)config=await response.json();}catch{/* Fail closed. */}
  shell();
  if(new URLSearchParams(location.search).get('demo')==='1')await enterMode('demo');
  if(accountConfig(config)) {
    try {
      const {createClient}=await import('../../vendor/supabase.js');
      client=createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false},global:{headers:{'X-Client-Info':'piso-wais-dashboard'}}});
      client.auth.onAuthStateChange((event,session)=>{if(event==='INITIAL_SESSION'&&!session)return;setTimeout(()=>{loadAccount(session);},0);});
    } catch {config={};shell();notify('Accounts are unavailable. No financial data has been sent.');}
  }
}
start();
