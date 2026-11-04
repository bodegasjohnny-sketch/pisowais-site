// Piso Wais survey plays: question banks, answer keys, bands and scoring.
// Pattern borrowed from a points-key scoring model: answers map to points via a key,
// the total maps to a band, and the result text is built from the numbers.
// Browser-only. Nothing is sent anywhere.
const yes = (en, fil) => ({ en, fil });
const q = (id, en, fil, opts, why) => ({ id, en, fil, opts: opts.map(([oid, pts, oen, ofil]) => ({ id: oid, pts, en: oen, fil: ofil })), why });
const G = p => 'guides/' + p + '/';

const LOAN = {
  id: 'loan-basics', max: 10,
  title: yes('Basic Elements of Loan', 'Mga Batayang Elemento ng Utang'),
  questions: [
    q('l1', 'In a loan, what is the "principal"?', 'Sa utang, ano ang "principal"?', [['a', 1, 'The amount you borrow', 'Ang halagang hiniram mo'], ['b', 0, 'The interest you pay', 'Ang interes na binabayaran mo'], ['c', 0, 'The processing fee', 'Ang processing fee'], ['d', 0, 'Your monthly payment', 'Ang buwanang hulog mo']], 'Principal is the borrowed amount. Interest and fees are on top of it.'),
    q('l2', 'What is "interest"?', 'Ano ang "interes"?', [['a', 1, 'The price you pay for using borrowed money', 'Ang bayad mo sa paggamit ng hiniram na pera'], ['b', 0, 'A discount from the lender', 'Discount mula sa nagpapautang'], ['c', 0, 'Money the lender gives back to you', 'Perang ibinabalik sa iyo ng lender'], ['d', 0, 'A government tax', 'Buwis ng gobyerno']], 'Interest is the cost of borrowing, usually shown as a rate per month or per year.'),
    q('l3', 'What does "term" or "tenor" mean?', 'Ano ang ibig sabihin ng "term" o "tenor"?', [['a', 1, 'How long you have to pay the loan back', 'Gaano katagal mo babayaran ang utang'], ['b', 0, 'The name of the loan product', 'Pangalan ng loan product'], ['c', 0, 'The interest rate', 'Ang interest rate'], ['d', 0, 'The approval date', 'Ang petsa ng approval']], 'Term is the length of the loan, for example 12 or 24 months.'),
    q('l4', 'An "amortization" is...', 'Ang "amortization" ay...', [['a', 1, 'A regular payment that covers interest and part of the principal', 'Regular na hulog na pambayad sa interes at bahagi ng principal'], ['b', 0, 'A one-time fee', 'Isang beses na bayad'], ['c', 0, 'A penalty for paying early', 'Multa sa maagang pagbayad'], ['d', 0, 'Your credit score', 'Ang credit score mo']], 'Each amortization pays some interest and some principal until the balance reaches zero.'),
    q('l5', 'With a "diminishing balance" rate, interest is computed on...', 'Sa "diminishing balance" na rate, ang interes ay kinukuwenta sa...', [['a', 1, 'The remaining balance each month', 'Natitirang balanse kada buwan'], ['b', 0, 'The original amount for the whole term', 'Orihinal na halaga sa buong term'], ['c', 0, 'Your salary', 'Sweldo mo'], ['d', 0, 'Nothing, it is interest-free', 'Wala, libre sa interes']], 'As you pay down the balance, the interest part gets smaller.'),
    q('l6', 'Same stated rate, same term. Which usually costs more?', 'Parehong rate at term. Alin ang kadalasang mas mahal?', [['a', 1, 'Flat add-on rate', 'Flat add-on rate'], ['b', 0, 'Diminishing balance rate', 'Diminishing balance rate'], ['c', 0, 'They always cost the same', 'Laging pareho'], ['d', 0, 'It depends on the color of the form', 'Depende sa kulay ng form']], 'Add-on charges interest on the full original amount every month, even after you have paid part of it.'),
    q('l7', 'What is "collateral"?', 'Ano ang "collateral"?', [['a', 1, 'Something of value you pledge, which the lender can take if you do not pay', 'Ari-ariang isinasangla na puwedeng kunin kung hindi ka makabayad'], ['b', 0, 'A second loan', 'Pangalawang utang'], ['c', 0, 'A free gift', 'Libreng regalo'], ['d', 0, 'The interest rate', 'Ang interest rate']], 'Examples are a car for an auto loan or land for a housing loan.'),
    q('l8', 'A "co-maker" is...', 'Ang "co-maker" ay...', [['a', 1, 'A person who agrees to pay if the borrower cannot', 'Taong papayag magbayad kung hindi makabayad ang umutang'], ['b', 0, 'The bank manager', 'Ang bank manager'], ['c', 0, 'A witness with no responsibility', 'Saksi na walang pananagutan'], ['d', 0, 'Your employer', 'Ang employer mo']], 'Being a co-maker is a real obligation. Only sign if you could actually pay.'),
    q('l9', 'Before you sign, the lender should give you...', 'Bago pumirma, dapat ibigay ng lender ang...', [['a', 1, 'A written disclosure of the finance charges', 'Nakasulat na disclosure ng finance charges'], ['b', 0, 'Nothing, just sign', 'Wala, pirma lang'], ['c', 0, 'A raffle ticket', 'Raffle ticket'], ['d', 0, 'Your credit card', 'Credit card mo']], 'The Truth in Lending Act (RA 3765) requires a clear written statement of charges before the deal is closed.'),
    q('l10', 'A "late payment penalty" is...', 'Ang "late payment penalty" ay...', [['a', 1, 'An extra charge when you pay after the due date', 'Dagdag na singil kapag lampas sa due date ka nagbayad'], ['b', 0, 'A reward for paying early', 'Gantimpala sa maagang bayad'], ['c', 0, 'Part of the principal', 'Bahagi ng principal'], ['d', 0, 'Optional, never charged', 'Optional, hindi sinisingil']], 'Penalties add up fast. Know the amount and the grace period, if any.'),
  ],
  bands: [
    { min: 0, max: 4, key: 'start', label: yes('Just starting', 'Nagsisimula pa lang'), actions: ['Read "Loan and interest terms 101" first, then retake this quiz.', 'Pick one loan you have or are considering, and find its principal, rate, term and total cost on paper.', 'Ask the lender for the disclosure statement before you sign anything.'], links: ['loan-interest-terms-101', 'why-filipinos-borrow'] },
    { min: 5, max: 7, key: 'mid', label: yes('Getting there', 'Malapit na'), actions: ['Review the questions you missed below.', 'Try the amortization mini calculator and compare add-on vs diminishing.', 'Before your next loan, write the total amount you will pay, not just the monthly.'], links: ['amortization-simplified', 'loan-interest-terms-101'] },
    { min: 8, max: 9, key: 'good', label: yes('Solid basics', 'Matibay ang basics'), actions: ['Review the one or two you missed.', 'Use the first-time borrower checklist before applying.', 'Share what you know with someone about to borrow.'], links: ['first-time-borrower-checklist', 'amortization-simplified'] },
    { min: 10, max: 10, key: 'top', label: yes('Loan-wise', 'Wais sa utang'), actions: ['Keep a simple loan log: lender, balance, rate, due date.', 'Check your own credit report once in a while.', 'Try the Basics of Borrowing quiz next.'], links: ['check-your-credit-report', 'first-time-borrower-checklist'] },
  ],
};

const F = (id, en, fil, opts) => q(id, en, fil, opts.map((o, i) => [String.fromCharCode(97 + i), o[0], o[1], o[2]]));
const FIT = {
  id: 'financial-fitness', max: 36,
  title: yes('How Financially Fit Are You?', 'Gaano Ka Ka-Fit sa Pera?'),
  questions: [
    F('f1', 'Do you know where your money went last month?', 'Alam mo ba kung saan napunta ang pera mo noong isang buwan?', [[0, 'No idea', 'Walang ideya'], [1, 'Roughly, from memory', 'Medyo, sa alaala lang'], [2, 'Mostly, I check my app history', 'Halos, tinitingnan ko ang app history'], [3, 'Yes, I track it', 'Oo, nililista ko']]),
    F('f2', 'When salary or income arrives, what happens to savings?', 'Pagdating ng sweldo o kita, paano ang ipon?', [[0, 'I save only if something is left', 'Nag-iipon lang kung may matira'], [1, 'Sometimes I set some aside', 'Minsan nagtatabi'], [2, 'Usually I save first', 'Kadalasan ipon muna'], [3, 'Always, savings first, automatically', 'Laging ipon muna, automatic']]),
    F('f3', 'If income stopped today, how long could your savings cover essentials?', 'Kung tumigil ang kita ngayon, gaano katagal kakayanin ng ipon ang essentials?', [[0, 'Less than a week', 'Kulang isang linggo'], [1, 'Up to a month', 'Hanggang isang buwan'], [2, '1 to 3 months', '1 hanggang 3 buwan'], [3, '3 months or more', '3 buwan o higit pa']]),
    F('f4', 'How do you usually pay your credit card?', 'Paano mo kadalasang binabayaran ang credit card?', [[0, 'Minimum or late', 'Minimum o late'], [1, 'More than minimum, not full', 'Lampas minimum, hindi buo'], [2, 'Full most months', 'Buo sa karamihan ng buwan'], [3, 'Full every month, or I have no card', 'Buo palagi, o wala akong card']]),
    F('f5', 'Bills like power, water, internet and rent?', 'Mga bill gaya ng kuryente, tubig, internet at upa?', [[0, 'Often late', 'Madalas late'], [1, 'Sometimes late', 'Minsan late'], [2, 'Rarely late', 'Bihirang late'], [3, 'Always on time', 'Laging on time']]),
    F('f6', 'How much of your monthly income goes to loan payments?', 'Gaano kalaki ng buwanang kita ang napupunta sa hulog sa utang?', [[0, 'More than half', 'Higit kalahati'], [1, 'About a third to half', 'Mga ikatlo hanggang kalahati'], [2, 'Less than a third', 'Kulang sa ikatlo'], [3, 'None or very little', 'Wala o napakaliit']]),
    F('f7', 'Do you have a plan for each payday?', 'May plano ka ba kada sweldo?', [[0, 'No plan', 'Walang plano'], [1, 'In my head', 'Nasa isip lang'], [2, 'Written, sometimes followed', 'Nakasulat, minsan sinusunod'], [3, 'Written and followed', 'Nakasulat at sinusunod']]),
    F('f8', 'How often do you borrow for daily needs like food or fare?', 'Gaano kadalas kang umuutang para sa pang-araw-araw gaya ng pagkain o pamasahe?', [[0, 'Every month', 'Kada buwan'], [1, 'A few times a year', 'Ilang beses sa isang taon'], [2, 'Rarely', 'Bihira'], [3, 'Never', 'Hindi kailanman']]),
    F('f9', 'Before borrowing, do you compare the total cost of offers?', 'Bago umutang, kinukumpara mo ba ang total cost ng mga alok?', [[0, 'No, I take the first one', 'Hindi, kinukuha ko ang una'], [1, 'I compare the monthly only', 'Monthly lang ang kinukumpara'], [2, 'I compare rate and fees', 'Rate at fees'], [3, 'I compare the total I will pay', 'Ang kabuuang babayaran ko']]),
    F('f10', 'Do you keep goal money separate from spending money?', 'Hiwalay ba ang pera para sa goals sa pang-gastos?', [[0, 'All in one wallet', 'Isang wallet lang lahat'], [1, 'Sometimes separate', 'Minsan hiwalay'], [2, 'One separate account', 'May isang hiwalay na account'], [3, 'Separate pots per goal', 'May hiwalay kada goal']]),
    F('f11', 'Do you check bank and e-wallet history for charges you do not know?', 'Tinitingnan mo ba ang history ng bank at e-wallet para sa di-kilalang singil?', [[0, 'Never', 'Hindi'], [1, 'When something feels off', 'Kapag may kakaiba'], [2, 'Monthly', 'Buwan-buwan'], [3, 'Weekly or with alerts on', 'Lingguhan o naka-alerts']]),
    F('f12', 'Do you talk about money plans with your household?', 'Pinag-uusapan ba ninyo sa bahay ang plano sa pera?', [[0, 'Never', 'Hindi'], [1, 'Only when there is a problem', 'Kapag may problema lang'], [2, 'Sometimes', 'Minsan'], [3, 'Regularly', 'Regular']]),
  ],
  bands: [
    { min: 0, max: 14, key: 'start', label: yes('Starting line', 'Simula pa lang'), actions: ['Track every peso for 7 days, even in a notebook.', 'Set aside a small fixed amount the day income arrives, before spending.', 'List your bills with due dates and put them on your phone calendar.'], links: ['petsa-de-peligro-survival', 'rule-50-30-20'] },
    { min: 15, max: 24, key: 'mid', label: yes('Building up', 'Bumubuo na'), actions: ['Start or grow an emergency fund toward 3 months of essentials.', 'Write a payday plan using 50-30-20 as a starting point.', 'Before your next loan, compare total cost, not monthly payment.'], links: ['emergency-fund-how-much', 'rule-50-30-20'] },
    { min: 25, max: 31, key: 'good', label: yes('Fit', 'Fit'), actions: ['Fix your two lowest-scoring habits below.', 'Split savings into separate goal pots.', 'Turn on transaction alerts for every account.'], links: ['ipon-challenges-2027', 'online-scams-to-avoid'] },
    { min: 32, max: 36, key: 'top', label: yes('Very fit', 'Sobrang fit'), actions: ['Keep the routine, review it every quarter.', 'Plan your 13th month pay before it arrives.', 'Help one family member set up a payday plan.'], links: ['thirteenth-month-pay-plan', 'where-to-park-idle-money'] },
  ],
};

const BOR = {
  id: 'borrowing-basics', max: 10,
  title: yes('Basics of Borrowing', 'Basics ng Pag-utang'),
  questions: [
    q('b1', 'What should you know before you even apply?', 'Ano ang dapat alam mo bago pa mag-apply?', [['a', 1, 'The exact purpose and amount you need', 'Ang eksaktong layunin at halagang kailangan'], ['b', 0, 'The biggest amount they will approve', 'Ang pinakamalaking ia-approve nila'], ['c', 0, 'Which app has the nicest logo', 'Aling app ang may magandang logo'], ['d', 0, 'Nothing, just apply', 'Wala, apply lang']], 'Borrow for a clear purpose and only the amount you need.'),
    q('b2', 'A loan is affordable when...', 'Kaya mo ang utang kapag...', [['a', 1, 'All your monthly payments fit after essentials and some savings', 'Kasya lahat ng hulog pagkatapos ng essentials at kaunting ipon'], ['b', 0, 'The lender approves you', 'Na-approve ka ng lender'], ['c', 0, 'A friend has the same loan', 'May kaibigang ganoon din'], ['d', 0, 'The first month is free', 'Libre ang unang buwan']], 'Approval is not the same as affordability. Check your own budget.'),
    q('b3', 'Best way to compare two loan offers?', 'Pinakamainam na paraan para ikumpara ang dalawang alok?', [['a', 1, 'Total amount you will pay, including fees', 'Kabuuang babayaran, kasama ang fees'], ['b', 0, 'Lowest monthly payment only', 'Pinakamababang monthly lang'], ['c', 0, 'Fastest approval', 'Pinakamabilis ma-approve'], ['d', 0, 'Most followers online', 'Pinakamaraming followers']], 'A longer term can lower the monthly but raise the total.'),
    q('b4', 'A lending company in the Philippines must have...', 'Ang lending company sa Pilipinas ay dapat may...', [['a', 1, 'Authority to operate from the SEC', 'Authority to operate mula sa SEC'], ['b', 0, 'A Facebook page only', 'Facebook page lang'], ['c', 0, 'A celebrity endorser', 'Celebrity endorser'], ['d', 0, 'Nothing, anyone can lend', 'Wala, kahit sino puwede']], 'RA 9474 says no lending company shall conduct business without an SEC authority to operate.'),
    q('b5', 'A loan app asks to access all your phone contacts. What do you do?', 'Humihingi ang loan app ng access sa lahat ng contacts mo. Ano gagawin mo?', [['a', 1, 'Stop and look for another option', 'Huminto at maghanap ng ibang option'], ['b', 0, 'Allow it, it is normal', 'Payagan, normal lang'], ['c', 0, 'Allow it but delete contacts later', 'Payagan pero burahin ang contacts mamaya'], ['d', 0, 'Give a friend\u2019s phone instead', 'Gamitin ang phone ng kaibigan']], 'Contact access can be used to shame borrowers. Protect your contacts and your privacy.'),
    q('b6', 'Before signing, ask for...', 'Bago pumirma, hingin ang...', [['a', 1, 'The written disclosure statement and the full schedule', 'Nakasulat na disclosure statement at buong schedule'], ['b', 0, 'A verbal promise', 'Pangako sa salita'], ['c', 0, 'A free load', 'Libreng load'], ['d', 0, 'Nothing', 'Wala']], 'Truth in Lending (RA 3765) requires charges in writing before the deal closes.'),
    q('b7', 'A fee is deducted upfront from your loan. This means...', 'May fee na ibinawas agad sa loan mo. Ibig sabihin...', [['a', 1, 'You receive less cash, so the real cost is higher', 'Mas kaunti ang matatanggap mo, kaya mas mataas ang tunay na cost'], ['b', 0, 'Nothing changes', 'Walang nagbago'], ['c', 0, 'The loan is cheaper', 'Mas mura ang utang'], ['d', 0, 'You pay less interest', 'Mas kaunti ang interes']], 'You pay back the full principal but only get the net amount.'),
    q('b8', 'Can you see your own credit report?', 'Puwede mo bang makita ang sarili mong credit report?', [['a', 1, 'Yes, you can request your CIC credit report', 'Oo, puwede kang humiling ng CIC credit report'], ['b', 0, 'No, only banks can', 'Hindi, bangko lang'], ['c', 0, 'Only with a lawyer', 'Kung may abogado lang'], ['d', 0, 'Only after 10 years', 'Pagkatapos ng 10 taon lang']], 'CIC lists ways for borrowers to get their own report, some with a fee.'),
    q('b9', 'You know you will miss a payment. Best move?', 'Alam mong hindi ka makakabayad. Ano ang pinakamainam?', [['a', 1, 'Contact the lender early and ask about options', 'Kontakin agad ang lender at magtanong ng options'], ['b', 0, 'Ignore calls', 'Huwag sagutin ang tawag'], ['c', 0, 'Borrow from a new app to pay', 'Umutang sa bagong app para ipambayad'], ['d', 0, 'Change your number', 'Magpalit ng numero']], 'Early contact usually gives you more options than silence.'),
    q('b10', 'Someone says pay a fee first so your loan can be released. This is...', 'May nagsabing magbayad muna ng fee para ma-release ang loan mo. Ito ay...', [['a', 1, 'A common scam sign, stop', 'Karaniwang palatandaan ng scam, huminto'], ['b', 0, 'Normal for all loans', 'Normal sa lahat ng loan'], ['c', 0, 'A good deal', 'Magandang deal'], ['d', 0, 'Required by law', 'Kailangan ayon sa batas']], 'Pay-first-to-release requests are a classic advance-fee pattern. Verify with the lender\u2019s official channel.'),
  ],
  bands: [
    { min: 0, max: 4, key: 'start', label: yes('Pause before applying', 'Huminto muna bago mag-apply'), actions: ['Read the first-time borrower checklist before you apply anywhere.', 'Check that any lending company has SEC authority to operate.', 'Never pay a fee to "release" a loan.'], links: ['first-time-borrower-checklist', 'online-scams-to-avoid'] },
    { min: 5, max: 7, key: 'mid', label: yes('Almost ready', 'Halos handa na'), actions: ['Review the questions you missed below.', 'Compute the total cost of your offer with the amortization calculator.', 'Ask for the disclosure statement and read it at home.'], links: ['amortization-simplified', 'loan-interest-terms-101'] },
    { min: 8, max: 9, key: 'good', label: yes('Ready, with care', 'Handa, maingat'), actions: ['Fix the one or two you missed.', 'Check your credit report before a big application.', 'Keep proof of every payment.'], links: ['check-your-credit-report', 'first-time-borrower-checklist'] },
    { min: 10, max: 10, key: 'top', label: yes('Borrow-wise', 'Wais umutang'), actions: ['Keep using the total-cost rule.', 'Build an emergency fund so you borrow less often.', 'Try the Financial Fitness check next.'], links: ['emergency-fund-how-much', 'why-filipinos-borrow'] },
  ],
};

export const PLAYS = { 'loan-basics': LOAN, 'financial-fitness': FIT, 'borrowing-basics': BOR };

export function bandFor(play, total) {
  const b = play.bands.find(b => total >= b.min && total <= b.max);
  if (!b) throw new Error('No band for ' + total);
  return b;
}

// answers: { questionId: optionId }
export function score(playId, answers) {
  const play = PLAYS[playId]; if (!play) throw new Error('Unknown play ' + playId);
  let total = 0; const missed = [];
  for (const qq of play.questions) {
    const opt = qq.opts.find(o => o.id === answers[qq.id]);
    const pts = opt ? opt.pts : 0; total += pts;
    const best = Math.max(...qq.opts.map(o => o.pts));
    if (pts < best) missed.push({ id: qq.id, pts, best });
  }
  const band = bandFor(play, total);
  const text = `Score ${total} of ${play.max}, between ${band.min} and ${band.max}. ` + (band.max === play.max && band.min === play.max ? 'Perfect score. Here is how to keep it.' : 'Here is what to work on.');
  // For the habit check, weakest = lowest points first.
  missed.sort((a, b) => (a.pts - a.best) - (b.pts - b.best));
  return { total, max: play.max, band, text, missed };
}

export function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Sanity: bands cover 0..max with no gaps or overlaps.
export function checkBands(play) {
  const b = play.bands.slice().sort((x, y) => x.min - y.min);
  if (b[0].min !== 0 || b[b.length - 1].max !== play.max) return false;
  for (let i = 1; i < b.length; i++) if (b[i].min !== b[i - 1].max + 1) return false;
  return true;
}
