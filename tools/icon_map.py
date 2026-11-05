"""Guide point -> 3D icon (site/assets/icons3d/<name>-160.webp / -320.webp).
Keys are the exact h2 text of each point. One icon per point, no icon repeated inside a guide."""
ICON_MAP = {
'why-filipinos-borrow': {
 'The 4 common reasons people borrow': 'family-heart', 'What a loan really is': 'loan-document',
 'Good debt vs heavy debt, a simple test': 'scale', 'Where people borrow from': 'bank',
 'Before you borrow, try these first': 'lightbulb'},
'amortization-simplified': {
 'Amortization in one sentence': 'lightbulb', 'A worked example, computed step by step': 'calculator',
 'Add-on vs diminishing, same number, different cost': 'scale', 'How to use this when you shop for a loan': 'magnifier',
 'Paying early': 'clock', 'Reading an amortization schedule': 'calendar'},
'loan-interest-terms-101': {
 'Principal, interest, term': 'coin', 'Add-on rate vs diminishing balance': 'scale', 'Effective interest rate': 'chart-up',
 'Fees you might see': 'peso-bill', 'Collateral, co-maker, guarantor': 'handshake', 'Grace period, due date, default': 'calendar',
 'Restructuring and refinancing': 'loan-document'},
'first-time-borrower-checklist': {
 'Know your number and your reason': 'target', 'Do the affordability math at home': 'calculator', 'Check the lender': 'magnifier',
 'Protect your privacy': 'lock', 'Get it in writing': 'loan-document', 'Plan the payments, then set reminders': 'calendar',
 'After you get the money': 'wallet', 'The 10-point checklist': 'checklist'},
'check-your-credit-report': {
 'What is in a CIC credit report': 'loan-document', 'Way 1: Through a CIC-accredited credit bureau app': 'phone-wallet',
 'Way 2: Email CRIF Philippines': 'envelope', 'Way 3: CIC Direct-to-Consumer program through authorized entities': 'bank',
 'So, is there a free option?': 'gift', 'If something is wrong': 'warning', 'How to read it': 'magnifier'},
'how-many-credit-cards': {
 'Start from the job, not the card': 'target', 'The one-card setup': 'credit-card', 'When two cards make sense': 'scale',
 'The hidden cost of more cards': 'peso-bill', 'A simple self-check': 'checklist', 'Card security, the boring but important part': 'lock',
 'If you already have too many': 'warning'},
'rule-50-30-20': {
 'What the three buckets mean': 'pie-chart', 'Use take-home pay, not gross': 'wallet', 'When needs are more than 50%': 'house',
 'Where family support goes': 'family-heart', 'Make it automatic': 'phone-wallet', 'Review every three months': 'calendar',
 'For couples and households': 'handshake'},
'petsa-de-peligro-survival': {
 'Split the payday into "mini paydays"': 'envelope', 'Pay bills on payday, not on due date': 'calendar',
 'Plan meals for the last week first': 'checklist', 'Watch the "maliit lang" leaks': 'magnifier', 'Build a tiny buffer': 'piggy-bank',
 'Make a "no-spend" list for the tight week': 'lightbulb', 'Talk to the household': 'family-heart', 'Track for one cycle': 'chart-up'},
'emergency-fund-how-much': {
 'Count essentials, not your whole spending': 'calculator', 'Choose your months': 'calendar', 'Break it into rungs': 'stairs',
 'Where to keep it': 'bank', 'What counts as an emergency': 'warning', 'Speed it up without stress': 'clock',
 'Insurance and the fund': 'shield'},
'ipon-challenges-2027': {
 'The classic 52-week, ascending': 'chart-up', 'Reverse 52-week, descending': 'coin-stack', 'Flat weekly': 'savings-jar',
 'Make it stick': 'checklist', 'Give the money a job': 'target', 'Choosing the right size': 'scale', 'Do it with a buddy': 'handshake',
 'What to do at the end': 'trophy'},
'thirteenth-month-pay-plan': {
 'The rules, briefly': 'loan-document', 'Compute your estimate': 'calculator', 'The tax part': 'peso-bill',
 'A simple split before it lands': 'pie-chart', 'January is part of the plan': 'calendar', 'If you are an employer': 'bank'},
'online-scams-to-avoid': {
 'The 12 to know': 'warning', 'Rule 1: banks do not ask for your secrets': 'lock', 'Rule 2: be careful with links': 'phone-wallet',
 'Rule 3: "sure-win returns" is the warning': 'chart-up', 'If you are targeted or lost money': 'shield'},
'credit-card-for-business': {
 'The free float, explained': 'clock', 'The one test that matters': 'target', 'What it costs when you miss': 'warning',
 '0% installment: when it makes sense': 'calendar', 'Rewards and cashback: nice, not the reason': 'gift',
 'Balance transfers': 'credit-card', 'Seven rules for responsible leverage': 'checklist', 'A quick example': 'calculator',
 'Bottom line': 'lightbulb'},
'where-to-park-idle-money': {
 'Step 1: Know what is a deposit and what is not': 'bank', 'Step 2: Build the ladder': 'stairs',
 'Step 3: Do the after-tax math': 'calculator', 'Step 4: Check every month': 'calendar', 'Common mistakes': 'warning'},
'cash-flow-gaps': {
 'Where the gap comes from': 'magnifier', 'The 30-day cash flow plan': 'calendar', 'Should you borrow to cover the gap?': 'scale',
 'Three numbers to watch every week': 'chart-up', 'Use a simple tool, not a perfect one': 'calculator', 'Signs you are fixing it': 'trophy'},
'bank-vs-digital-bank-vs-ewallet': {
 '1. Traditional bank savings': 'bank', '2. Digital banks': 'phone-wallet', '3. E-wallets': 'wallet', 'How PDIC insurance works': 'shield',
 'Promo rates vs base rates': 'chart-up', 'Do not forget the tax': 'peso-bill', 'What about transfer fees and access?': 'credit-card',
 'Dormancy and the fine print': 'magnifier', 'A simple way to choose': 'lightbulb'},
'debt-snowball-vs-avalanche': {
 'Step zero: list everything': 'checklist', 'The avalanche method': 'chart-up', 'The snowball method': 'coin-stack',
 'A worked example': 'calculator', 'Rules that apply to both': 'loan-document', 'What about family utang?': 'family-heart',
 'Track progress where you can see it': 'target', 'After the last debt': 'trophy'},
'emergency-fund-daily-income': {
 'Step 1: Find your monthly "must pay" number': 'calculator', 'Step 2: Set three mini-targets': 'target',
 'Step 3: Save daily, by percentage': 'coin', 'Step 4: Separate it from your spending money': 'piggy-bank',
 'Step 5: Make it earn, safely': 'chart-up', 'Step 6: Protect it with rules': 'shield', 'How long will it take?': 'clock',
 'What to do on zero days': 'savings-jar', 'Speed it up': 'stairs'},
}
for s, m in ICON_MAP.items():
    assert len(set(m.values())) == len(m), s
