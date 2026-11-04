// Pure money helpers for the Piso Wais article mini tools. No network, no storage.
export function amortize({ principal, monthlyRate, months }) {
  const P = +principal, r = +monthlyRate, n = Math.round(+months);
  if (!(P > 0) || !(n > 0) || r < 0) return null;
  const payment = r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n));
  let bal = P; const rows = [];
  for (let i = 1; i <= n; i++) {
    const interest = bal * r; const princ = payment - interest; bal -= princ;
    rows.push({ month: i, interest, principal: princ, balance: Math.abs(bal) < 0.005 ? 0 : bal });
  }
  return { payment, total: payment * n, interest: payment * n - P, rows };
}
// Flat add-on: interest computed on the original principal for every month.
export function addOn({ principal, monthlyRate, months }) {
  const interest = principal * monthlyRate * months;
  return { interest, total: principal + interest, payment: (principal + interest) / months };
}
export function split503020(takeHome) {
  const t = Math.max(0, +takeHome || 0);
  return { needs: t * 0.5, wants: t * 0.3, savings: t * 0.2 };
}
export function emergencyTarget({ monthlyEssentials, months }) { return Math.max(0, +monthlyEssentials || 0) * (+months || 0); }
export function thirteenth({ basicTotalYear }) { return Math.max(0, +basicTotalYear || 0) / 12; }
// Ipon challenge: mode 'up' (week n saves n*base), 'down' (reverse), 'flat'.
export function iponPlan({ base, weeks = 52, mode = 'up', startISO = '2027-01-04' }) {
  const b = Math.max(0, +base || 0); const out = []; let total = 0;
  const start = new Date(startISO + 'T00:00:00Z');
  for (let i = 1; i <= weeks; i++) {
    const amt = mode === 'flat' ? b : mode === 'down' ? (weeks - i + 1) * b : i * b;
    total += amt;
    const d = new Date(start.getTime() + (i - 1) * 7 * 864e5);
    out.push({ week: i, date: d.toISOString().slice(0, 10), amount: amt, running: total });
  }
  return { rows: out, total };
}
export const peso = (x, dec = 2) => '\u20B1' + Number(x).toLocaleString('en-PH', { minimumFractionDigits: dec, maximumFractionDigits: dec });
