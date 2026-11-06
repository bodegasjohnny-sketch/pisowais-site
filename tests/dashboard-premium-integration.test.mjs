import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url), read=p=>readFile(new URL(p,root),'utf8');
test('premium release guard: accounts disabled, no remote calls/entitlement/payment storage in extra tool modules',async()=>{
  for(const dir of ['site','docs'])assert.deepEqual(JSON.parse(await read(dir+'/config/dashboard.json')),{supabaseUrl:'',publishableKey:'',accountsEnabled:false});
  for(const file of ['premium-model.js','premium-ui.js']) {
    const source=await read('site/js/dashboard/'+file);assert.equal(source,await read('docs/js/dashboard/'+file));
    assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|eval)\s*\(/.test(source));assert(!/service_role|sb_secret_|access_token|refresh_token/.test(source));
  }
  const ui=await read('site/js/dashboard/premium-ui.js');assert(ui.includes('Not purchasable'));assert(ui.includes('No paid entitlement'));assert(ui.includes('no secure premium access') || ui.includes('secure premium access'));assert(!/type="(?:password|email)"/.test(ui));
});
test('brand uses actual 3D art and all locally hosted Poppins font faces; build mirrors changed sources',async()=>{
  const ui=await read('site/js/dashboard/premium-ui.js'), css=await read('site/css/dashboard.css'), fonts=await read('site/css/fonts.css');
  for(const [,name] of ui.matchAll(/art\('([^']+)'\)/g))await access(new URL('docs/assets/icons3d/'+name+'-160.webp',root));
  for(const [,path] of fonts.matchAll(/url\(([^)]+)\)/g))await access(new URL(path,new URL('docs/css/fonts.css',root)));
  for(const color of ['#FCFBF7','#121F47','#FDAFB0','#F9B909'])assert(css.includes(color));assert(css.includes('Poppins'));assert(css.includes('@media(max-width:640px)'));assert(!/font-size:(?:9|10|11)px/.test(css));
  for(const file of ['js/dashboard/app.js','js/dashboard/model.js','css/dashboard.css'])assert.equal(await read('site/'+file),await read('docs/'+file));
});
test('free PDF bytes and stable links remain unchanged, dashboard stays a real standalone route',async()=>{
  const expected='f3a6f423a47a33ddcf95b2cbb46acc78aee1ff6829517e274f76a04ccba3fdf5';
  for(const dir of ['site','docs'])assert.equal(createHash('sha256').update(await readFile(new URL(dir+'/downloads/piso-wais-cheat-sheet.pdf',root))).digest('hex'),expected);
  const home=await read('docs/index.html');assert(home.includes('downloads/piso-wais-cheat-sheet.pdf'));assert(/href="(?:\.\/)?dashboard\/"/.test(home));assert(home.includes('cheat sheet remains free'));
  const dash=await read('docs/dashboard/index.html');assert(dash.includes('js/dashboard/app.js'));assert(dash.includes('noindex,nofollow'));
});
