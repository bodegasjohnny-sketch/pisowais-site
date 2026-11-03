// Pure calculation helpers. No DOM. Unit-tested in /tests/calc.test.mjs
export const TAX = 0.20;

/** Month-by-month growth. Interest compounds monthly at rate/12, tax withheld on each credit.
 * Top-up added at the end of each month. Returns array of balances per month (index 0 = start). */
export function grow({ principal, monthly, years, rate, tax = TAX }) {
  const months = Math.round(years * 12);
  const r = rate / 12;
  let bal = principal, gross = 0, taxPaid = 0;
  const series = [bal];
  for (let m = 1; m <= months; m++) {
    const interest = bal * r;
    const t = interest * tax;
    gross += interest; taxPaid += t;
    bal = bal + interest - t + monthly;
    series.push(bal);
  }
  const contributed = principal + monthly * months;
  return { final: bal, series, contributed, grossInterest: gross, taxPaid, netInterest: gross - taxPaid };
}

/** Credit card leverage reality check. monthlyRate e.g. 0.03 (BSP cap 3%/month). */
export function leverage({ purchase, cashBack, daysToCash, floatDays, monthlyRate, limit = 0 }) {
  const daily = (monthlyRate * 12) / 365;
  const carriedDays = Math.max(0, daysToCash - floatDays);
  const interestCost = purchase * daily * carriedDays;
  const profit = cashBack - purchase;
  const net = profit - interestCost;
  const paysBeforeDue = daysToCash <= floatDays && cashBack >= purchase;
  const breakEvenReturn = purchase + interestCost;
  const breakEvenDays = profit > 0 ? floatDays + profit / (purchase * daily) : null;
  const utilization = limit > 0 ? purchase / limit : null;
  let verdict, reasons = [];
  if (cashBack < purchase) { verdict = 'red'; reasons.push('The purchase does not return the money you put in.'); }
  else if (paysBeforeDue) { verdict = 'green'; reasons.push('Cash comes back before the due date, so you can pay in full and pay zero interest.'); }
  else if (net > 0 && carriedDays <= 30) { verdict = 'yellow'; reasons.push('Still profitable, but you carry a balance and pay interest. One slow week turns this red.'); }
  else { verdict = 'red'; reasons.push(net <= 0 ? 'Interest eats the whole profit.' : 'You would carry the balance for more than one cycle. That is how the debt cycle starts.'); }
  if (utilization !== null && utilization > 0.3) {
    reasons.push('This uses more than 30% of your credit limit, which can hurt your credit standing.');
    if (verdict === 'green') verdict = 'yellow';
  }
  return { verdict, reasons, carriedDays, interestCost, profit, net, paysBeforeDue, breakEvenReturn, breakEvenDays, utilization };
}

export const QUIZ_AREAS = {
  cash: { label: 'Cash flow gaps', section: 'Cash flow 30-day plan', actions: ['List every bill due in the next 30 days with dates, today.', 'Ask your two biggest customers for a deposit or shorter payment terms.', 'Keep one month of fixed costs in a separate account and never touch it for stock.'] },
  pricing: { label: 'Pricing', section: 'Business bottleneck fixes', actions: ['Compute true cost per item: materials, labor, delivery, platform fees.', 'Raise prices on your top 3 sellers by a small step and watch volume for 2 weeks.', 'Stop discounting by default; give bonuses instead of price cuts.'] },
  inventory: { label: 'Inventory', section: 'Business bottleneck fixes', actions: ['Find your slow movers (no sale in 60 days) and bundle or clear them.', 'Reorder based on last 30 days of sales, not gut feel.', 'Negotiate smaller, more frequent orders with suppliers.'] },
  tracking: { label: 'Money tracking', section: 'Cash flow 30-day plan', actions: ['Separate business and personal money this week (one account each).', 'Record every peso in and out daily, even in a notebook.', 'Do a 15-minute weekly money review every Sunday.'] },
  followup: { label: 'Customer follow-up', section: 'Business bottleneck fixes', actions: ['Message every customer from the last 90 days with a simple reorder offer.', 'Save all inquiries in one list and follow up within 24 hours.', 'Ask happy customers for a referral, not a discount.'] },
  owner: { label: 'Owner dependence', section: 'Business bottleneck fixes', actions: ['Write down the 3 tasks only you can do; train someone on one this month.', 'Make a one-page checklist for opening, closing and order handling.', 'Set a fixed salary for yourself instead of taking cash from the drawer.'] },
  marketing: { label: 'Marketing consistency', section: 'Business bottleneck fixes', actions: ['Commit to 3 posts a week for 4 weeks, same days, same time.', 'Reuse one customer question as one post.', 'Track which post brought actual inquiries, not just likes.'] },
  debt: { label: 'Debt load', section: 'Debt payoff order', actions: ['List every debt with balance, rate and minimum payment.', 'Stop new card spending until all statements are paid in full.', 'Pick avalanche (highest rate first) or snowball (smallest balance first) and stick to it.'] },
  idle: { label: 'Idle cash', section: 'Idle money ladder', actions: ['Move emergency money from a 0.06% account to a PDIC-insured digital bank savings.', 'Split money into buckets: bills, emergency, growth.', 'Check your rate every month; rates change.'] },
  credit: { label: 'Credit card habits', section: 'Leverage rules with credit cards for business', actions: ['Only charge things that bring cash back before the due date.', 'Turn on auto-pay for the full statement balance.', 'Never use cash advance for business stock.'] }
};

/** answers: { area: score 0..2 } (2 = healthy). Returns weakest 3 areas. */
export function scoreQuiz(answers) {
  const entries = Object.entries(answers);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const max = entries.length * 2;
  const order = Object.keys(QUIZ_AREAS);
  const weakest = entries.sort((a, b) => a[1] - b[1] || order.indexOf(a[0]) - order.indexOf(b[0])).slice(0, 3).map(([k, v]) => ({ area: k, score: v, ...QUIZ_AREAS[k] }));
  const pct = max ? total / max : 0;
  const band = pct >= 0.75 ? 'Strong base' : pct >= 0.45 ? 'Leaking in a few places' : 'Fix the leaks first';
  return { total, max, pct, band, weakest, firstSection: weakest[0] ? weakest[0].section : null };
}

export const peso = (n) => '\u20B1' + Math.round(n).toLocaleString('en-PH');
