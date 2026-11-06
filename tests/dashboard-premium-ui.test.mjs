// DOM interaction coverage only: no browser rendering, mobile visuals or actual native key behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFile } from 'node:fs/promises';
import { demoBook, today, totals } from '../site/js/dashboard/model.js';
import { PREMIUM_KEY } from '../site/js/dashboard/premium-model.js';
const CORE='piso-wais-local-preview-v1', tick=()=>new Promise(r=>setTimeout(r,12));let serial=0;
async function setup(query='',seed={}) {
  const html=await readFile(new URL('../docs/dashboard/index.html',import.meta.url),'utf8'), dom=new JSDOM(html,{url:'http://localhost:8794/dashboard/'+query}), fetches=[];
  for(const [key,value] of Object.entries(seed))dom.window.localStorage.setItem(key,value);
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location,FormData:dom.window.FormData,fetch:async url=>{fetches.push(url);return {ok:true,json:async()=>({accountsEnabled:false})};}});
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  const click=async selector=>{const el=document.querySelector(selector);assert(el,`Missing ${selector}`);el.click();await tick();};
  const fill=(name,value)=>{const el=document.querySelector(`#editor [name="${name}"]`);assert(el,`Missing ${name}`);el.value=value;};
  const submit=async selector=>{const f=document.querySelector(selector || '#editor form');assert(f);f.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();};
  const view=async name=>{await click(`.side-nav [data-view="${name}"]`);};
  const text=()=>document.getElementById('dashboard').textContent, detail=()=>document.getElementById('editor');
  await import('../site/js/dashboard/app.js?premium-test-'+(++serial));await tick();
  return {dom,click,fill,submit,view,text,detail,fetches};
}
async function local(h) {
  await h.click('[data-action="local"]');assert(document.querySelector('#local-consent input[required]'));document.querySelector('#local-consent input').checked=true;await h.submit();
  await h.click('[data-action="settings"]');await h.click('[data-action="px-toggle"]');assert(document.querySelector('#px-consent input[required]'));document.querySelector('#px-consent input').checked=true;await h.submit();
}
test('planned prices are not checkout; explicit example tools show recorded values without touching storage/cloud',async()=>{
  const h=await setup('?view=premium&premium=1');assert(h.text().includes('₱99'));assert(h.text().includes('₱990'));assert(h.text().includes('Not purchasable'));assert(h.text().includes('Free'));
  assert.equal(h.dom.window.localStorage.length,0);assert(!document.querySelector('input[type=password],input[type=email]'));assert(!document.querySelector('.side-nav [data-view=assets]'));
  await h.click('[data-action="px-start"]');assert(h.detail().textContent.includes('checkout are disabled'));await h.click('#editor [data-action="px-example"]');
  assert(h.text().includes('EXAMPLE DATA'));assert(h.text().includes('₱18,600'));assert(h.text().includes('₱600'));assert(h.text().includes('Not IRR'));assert(h.text().includes('4 dated points'));
  assert.equal(h.dom.window.localStorage.length,0);assert.equal(h.fetches.length,1);assert(h.fetches[0].endsWith('config/dashboard.json'));
  await h.view('networth');assert(h.text().includes('₱35,600'));assert(h.text().includes('No recorded history yet'));assert(h.text().includes('not your available-to-budget'));
  await h.view('goals');assert(h.text().includes('Emergency fund'));assert(h.text().includes('Laptop fund'));assert(h.text().includes('Family trip'));assert(h.text().includes('Manual earmarks'));
  await h.click('[data-action="settings"]');await h.click('[data-action="account"]');assert(!h.detail().querySelector('input'));assert(h.detail().textContent.includes('not connected'));
  h.dom.window.close();
});
test('full asset/event CRUD escapes names, handles withdrawals and confirms deletes; example changes preserve both local namespaces',async()=>{
  const raw=JSON.stringify(demoBook()), premiumRaw='retained local data';const h=await setup('?demo=1&premium=1&view=assets',{[CORE]:raw,[PREMIUM_KEY]:premiumRaw});
  const evil='<img src=x onerror=alert(1)> "&';
  await h.click('[data-action="px-add-asset"]');h.fill('title',evil);h.fill('opening','1000');await h.submit();assert(h.text().includes(evil));assert(!document.querySelector('[onerror]'));
  let card=[...document.querySelectorAll('.holding-card')].find(r=>r.textContent.includes(evil));assert(card);const id=card.querySelector('[data-action=px-asset-detail]').dataset.id;
  await h.click(`[data-action="px-asset-detail"][data-id="${id}"]`);assert(!h.detail().querySelector('form'));assert(!h.detail().querySelector('img[onerror]'));
  await h.click('#editor [data-action="px-add-event"]');h.fill('kind','contribution');document.querySelector('#px-kind').dispatchEvent(new h.dom.window.Event('change',{bubbles:true}));h.fill('amount','200');h.fill('value','1250');await h.submit();
  await h.click(`[data-action="px-asset-detail"][data-id="${id}"]`);assert(h.detail().textContent.includes('₱50'));
  await h.click('#editor [data-action="px-add-event"]');h.fill('kind','withdrawal');document.querySelector('#px-kind').dispatchEvent(new h.dom.window.Event('change',{bubbles:true}));h.fill('amount','300');h.fill('value','1000');await h.submit();
  await h.click(`[data-action="px-asset-detail"][data-id="${id}"]`);assert(h.detail().textContent.includes('₱100'));
  const withdrawal=[...h.detail().querySelectorAll('.event-row')].find(r=>r.textContent.includes('withdrawal'));withdrawal.querySelector('[data-action=px-edit]').click();await tick();h.fill('value','900');await h.submit();
  await h.click(`[data-action="px-asset-detail"][data-id="${id}"]`);const edited=[...h.detail().querySelectorAll('.event-row')].find(r=>r.textContent.includes('withdrawal'));assert(edited.textContent.includes('₱900'));
  edited.querySelector('[data-action=px-delete]').click();await tick();assert(h.detail().textContent.includes('cannot be undone'));await h.click('#editor [data-action="px-confirm-delete"]');
  await h.click(`[data-action="px-asset-detail"][data-id="${id}"]`);assert(!h.detail().textContent.includes('withdrawal ·'));assert(h.detail().textContent.includes('₱1,250'));await h.click('#editor [data-action="close"]');
  await h.click(`[data-action="px-delete"][data-table="assets"][data-id="${id}"]`);assert(h.detail().textContent.includes('All dated events'));await h.click('#editor [data-action="close"]');assert(document.querySelector(`[data-action="px-asset-detail"][data-id="${id}"]`));
  await h.click(`[data-action="px-delete"][data-table="assets"][data-id="${id}"]`);await h.click('#editor [data-action="px-confirm-delete"]');assert(!h.text().includes(evil));assert(h.text().includes('₱18,600'));
  assert.equal(h.dom.window.localStorage.getItem(CORE),raw);assert.equal(h.dom.window.localStorage.getItem(PREMIUM_KEY),premiumRaw);assert.equal(h.fetches.length,1);h.dom.window.close();
});
test('local premium consent is separate; old core bytes preserved; toggle/reopen/clear extra never paywall or erase core',async()=>{
  const original=JSON.stringify(demoBook());const h=await setup('',{[CORE]:original});await local(h);assert(h.text().includes('no purchase'));await h.view('assets');assert(h.text().includes('No non-cash assets'));assert(h.text().includes('₱0'));
  await h.click('[data-action="px-add-asset"]');h.fill('title','Synthetic local gold');h.fill('opening','123.29');await h.submit();
  await h.view('goals');await h.click('[data-action="px-add-goal"]');h.fill('title','Extra plan A');h.fill('target','1000');h.fill('balance','200');await h.submit();
  await h.click('[data-action="px-add-goal"]');h.fill('title','Extra plan B');h.fill('target','2000');h.fill('balance','100');await h.submit();assert(h.text().includes('Extra plan B'));assert(h.text().includes('Emergency fund'));
  assert.equal(h.dom.window.localStorage.getItem(CORE),original);const saved=h.dom.window.localStorage.getItem(PREMIUM_KEY);assert(saved.includes('Synthetic local gold'));assert(!/password|access_token|refresh_token|entitlement|paid_success/.test(saved));
  await h.click('[data-action="settings"]');await h.click('[data-action="px-toggle"]');assert(!document.querySelector('.side-nav [data-view=assets]'));assert.equal(h.dom.window.localStorage.getItem(PREMIUM_KEY),saved);
  await h.view('transactions');assert(h.text().includes('Sweldo + freelance'));await h.click('[data-action="add-entry"]');h.fill('kind','income');document.querySelector('#f-kind').dispatchEvent(new h.dom.window.Event('change',{bubbles:true}));h.fill('note','Free still editable');h.fill('amount','0.29');await h.submit();assert(h.text().includes('Free still editable'));
  const currentCore=h.dom.window.localStorage.getItem(CORE);assert.equal(totals(JSON.parse(currentCore)).available,950029);assert.equal(h.dom.window.localStorage.getItem(PREMIUM_KEY),saved);
  await h.click('[data-action="settings"]');await h.click('[data-action="px-toggle"]');document.querySelector('#px-consent input').checked=true;await h.submit();await h.view('assets');assert(h.text().includes('Synthetic local gold'));
  await h.click('[data-action="settings"]');await h.click('[data-action="px-clear"]');assert(h.detail().textContent.includes('Free entries, bills, debts'));await h.click('#editor [data-action="px-confirm-clear"]');assert.equal(h.dom.window.localStorage.getItem(CORE),currentCore);assert.equal(h.dom.window.localStorage.getItem(PREMIUM_KEY),null);
  await h.click('[data-action="clear"]');assert(h.detail().textContent.includes('AND extra'));await h.click('#editor [data-action="confirm-clear"]');assert.equal(h.dom.window.localStorage.length,0);h.dom.window.close();
});
test('snapshot capture/update/replace/delete confirms source dates and leaves earlier captures unchanged',async()=>{
  const h=await setup('?demo=1&premium=1&view=networth');await h.click('[data-action="px-snapshot"]');assert(h.detail().textContent.includes('₱35,600'));assert(h.detail().textContent.includes('Cash as of'));await h.click('#editor [data-action="px-confirm-snapshot"]');assert(h.text().includes('1 dated points'));
  await h.click('[data-action="px-cash"]');h.fill('amount','50000');await h.submit();assert(h.text().includes('₱45,600'));assert(h.text().includes('₱35,600'));
  await h.click('[data-action="px-snapshot"]');assert(h.detail().textContent.includes('Replace today'));await h.click('#editor [data-action="px-confirm-snapshot"]');assert(h.text().includes('₱45,600'));assert(!h.text().includes('₱35,600'));
  await h.click('[data-action="px-delete"][data-table="snapshots"]');assert(h.detail().textContent.includes('cannot be undone'));await h.click('#editor [data-action="px-confirm-delete"]');assert(h.text().includes('No recorded history yet'));h.dom.window.close();
});
test('local calculators work without posting transactions and reject invalid allocation/non-amortizing payoff',async()=>{
  const h=await setup();await local(h);await h.view('plan');const f=document.querySelector('#payday-form');assert.equal(f.elements.received.value,'');f.elements.received.value='0.29';[33,33,33,1].forEach((v,i)=>f.elements['p'+i].value=v);await h.submit('#payday-form');assert(f.querySelector('.form-result').textContent.includes('₱0.1'));assert.equal(h.dom.window.localStorage.getItem(CORE),null);
  f.elements.p3.value=0;await h.submit('#payday-form');assert(f.querySelector('.form-error').textContent.includes('100'));assert.equal(f.querySelector('.form-result').textContent,'');
  await h.view('debt');await h.click('[data-action="add-debt"]');h.fill('title','Synthetic debt');h.fill('opening','1000');h.fill('apr','12');h.fill('minimum','10');await h.submit();
  let scenario=document.querySelector('#scenario-form');assert.equal(scenario.elements.budget.value,'');scenario.elements.budget.value='10';await h.submit('#scenario-form');assert(scenario.querySelector('.form-result').textContent.includes('No payoff estimate'));assert(scenario.querySelector('.form-result').textContent.includes('interest-only'));
  scenario.elements.budget.value='1010';await h.submit('#scenario-form');assert(scenario.querySelector('.form-result').textContent.includes('1 months'));assert(scenario.querySelector('.form-result').textContent.includes('Total paid ₱1,010'));assert.equal(JSON.parse(h.dom.window.localStorage.getItem(CORE)).transactions.length,0);h.dom.window.close();
});
test('damaged premium local version is not overwritten; user can clear only extra data and keep free book',async()=>{
  const original=JSON.stringify(demoBook()), broken='{"version":9000}';const h=await setup('',{[CORE]:original,[PREMIUM_KEY]:broken});await local(h);
  assert(h.detail().querySelector('.form-error').textContent.includes('not overwritten'));assert(!document.querySelector('.side-nav [data-view=assets]'));assert.equal(h.dom.window.localStorage.getItem(PREMIUM_KEY),broken);await h.click('#editor [data-action="close"]');
  await h.click('[data-action="px-clear"]');await h.click('#editor [data-action="px-confirm-clear"]');assert.equal(h.dom.window.localStorage.getItem(CORE),original);assert.equal(h.dom.window.localStorage.getItem(PREMIUM_KEY),null);h.dom.window.close();
});
test('premium DOM accessibility: named controls, labelled inputs, native details, chart alternatives, focus navigation',async()=>{
  const h=await setup('?demo=1&premium=1&view=assets');
  function check(){
    for(const b of document.querySelectorAll('button'))assert((b.getAttribute('aria-label') || b.textContent).trim());
    for(const input of document.querySelectorAll('input:not([type=hidden]),select'))assert(input.labels.length>0,`Label ${input.name}`);
    for(const svg of document.querySelectorAll('svg'))assert(svg.getAttribute('aria-hidden') === 'true' || svg.getAttribute('role') === 'img' && svg.getAttribute('aria-label'));
    for(const p of document.querySelectorAll('progress'))assert(p.getAttribute('aria-label'));
    assert.equal(document.querySelector('[data-action]:not(button)'),null);assert(!document.querySelector('[tabindex="1"]'));
  }
  check();assert(document.querySelector('.history-chart details summary'));assert(document.querySelector('.history-chart table'));
  await h.click('[data-action="px-add-asset"]');check();await h.click('#editor [data-action="close"]');
  await h.view('networth');assert.equal(document.activeElement.id,'content');check();await h.click('[data-action="px-cash"]');check();await h.click('#editor [data-action="close"]');
  await h.view('goals');await h.click('[data-action="px-add-goal"]');check();await h.click('#editor [data-action="close"]');
  await h.view('insights');check();assert(h.text().includes('No AI risk score, predictions, scheduled alerts'));assert(h.text().includes('not a buy/sell recommendation'));h.dom.window.close();
});
test('actual download handler exports safe CSV/JSON, core export stays free, config is the only request',async()=>{
  const h=await setup('?demo=1&premium=1&view=insights'), blobs=[], origCreate=URL.createObjectURL, origRevoke=URL.revokeObjectURL;
  URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:synthetic-test';};URL.revokeObjectURL=()=>{};h.dom.window.HTMLAnchorElement.prototype.click=function(){};
  try {
    await h.click('[data-action="px-export"][data-kind="assets"]');const csv=await blobs.at(-1).text();assert(csv.includes('1380000'));assert(csv.includes('80000'));
    await h.click('[data-action="px-export"][data-kind="backup"]');const backup=JSON.parse(await blobs.at(-1).text());assert.equal(backup.format,'piso-wais-preview-backup');assert.equal(backup.premium.version,1);assert.equal(backup.free.goals.length,1);assert(!/access_token|refresh_token|password/.test(JSON.stringify(backup)));
    await h.click('[data-action="settings"]');await h.click('[data-action="px-toggle"]');await h.click('[data-action="px-export"][data-kind="transactions"]');assert((await blobs.at(-1).text()).includes('Sweldo + freelance'));assert.equal(h.fetches.length,1);
  } finally {URL.createObjectURL=origCreate;URL.revokeObjectURL=origRevoke;h.dom.window.close();}
});
