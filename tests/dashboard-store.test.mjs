import test from 'node:test';
import assert from 'node:assert/strict';
import {localStore,supabaseStore,accountConfig} from '../site/js/dashboard/store.js';
import {emptyBook,today} from '../site/js/dashboard/model.js';
const income={kind:'income',amount_cents:29,note:'Income',date:today(),category:'Other'};
function storage(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
test('local save/edit/delete/reload/clear persists only with explicit storage',async()=>{
  const disk=storage(),a=localStore(disk);await a.save('transactions',income);const row=(await a.load()).transactions[0];
  const b=localStore(disk);assert.equal((await b.load()).transactions[0].amount_cents,29);
  await b.save('transactions',{...income,amount_cents:50},row.id);assert.equal((await localStore(disk).load()).transactions[0].amount_cents,50);
  await b.remove('transactions',row.id);assert.equal((await localStore(disk).load()).transactions.length,0);
  await b.save('transactions',income);await b.clear();assert.deepEqual(await localStore(disk).load(),emptyBook());
  const demo=localStore(null);await demo.save('transactions',income);assert.equal((await localStore(null).load()).transactions.length,0);
});
test('storage quota failure does not falsely claim save or mutate book',async()=>{
  const s=localStore({getItem:()=>null,setItem:()=>{throw Error('Quota exceeded');}});
  await assert.rejects(()=>s.save('transactions',income));assert.equal((await s.load()).transactions.length,0);
});
test('accounts fail closed; secrets/legacy keys/http/unconfigured rejected',()=>{
  for(const cfg of [{},{accountsEnabled:false},{accountsEnabled:true,supabaseUrl:'https://x.supabase.co',publishableKey:'sb_secret_no'},{accountsEnabled:true,supabaseUrl:'http://x',publishableKey:'sb_publishable_yes'}])assert.equal(accountConfig(cfg),false);
  assert.equal(accountConfig({accountsEnabled:true,supabaseUrl:'https://x.supabase.co',publishableKey:'sb_publishable_example'}),true);
  assert.throws(()=>supabaseStore({},null));
});
test('real adapter scopes all reads/writes by user, ignores payload owner and rejects disposed session',async()=>{
  const calls=[], rows=[];
  const client={from(name){const c={name};calls.push(c);const q={select(){return q;},eq(k,v){(c.filters??=[]).push([k,v]);return q;},order(){return q;},range(start){c.start=start;return Promise.resolve({data:rows,error:null});},insert(payload){c.insert=payload;return q;},update(payload){c.update=payload;return q;},delete(){c.delete=true;return q;},then(resolve){resolve({data:[{id:'id'}],error:null});}};return q;}};
  const s=supabaseStore(client,'user-A');await s.load();await s.save('transactions',{...income,owner_id:'user-B'},'id');await s.remove('transactions','id');
  for(const c of calls) {if(c.update)assert.equal(c.update.owner_id,'user-A');if(c.filters)assert(c.filters.some(([k,v])=>k==='owner_id'&&v==='user-A'));}
  s.dispose();await assert.rejects(()=>s.load());await assert.rejects(()=>s.save('transactions',income));
});
test('adapter paginates past default server cap and checks cross-user results',async()=>{
  let calls=0;
  const client={from(name){const q={select(){return q;},eq(){return q;},order(){return q;},range(start){calls++;return Promise.resolve({data:name==='pw_transactions'&&start===0?Array.from({length:500},()=>({...income,id:crypto.randomUUID(),owner_id:'u',goal_id:null,debt_id:null,bill_id:null})):[],error:null});}};return q;}};
  await supabaseStore(client,'u').load();assert.equal(calls,5);
  const bad={from(){const q={select(){return q;},eq(){return q;},order(){return q;},range(){return Promise.resolve({data:[{owner_id:'another-user'}]});}};return q;}};
  await assert.rejects(()=>supabaseStore(bad,'u').load(),/ownership/);
});
