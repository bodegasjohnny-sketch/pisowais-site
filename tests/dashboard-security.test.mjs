// Runs the real migration in an isolated embedded PostgreSQL, never a hosted project.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const ids={goals:'33333333-3333-4333-8333-333333333333',debts:'44444444-4444-4444-8444-444444444444',bills:'55555555-5555-4555-8555-555555555555',transactions:'66666666-6666-4666-8666-666666666666'};
let n=0;
test('Postgres migration: per-table RLS, CRUD, immutable ownership, linked isolation and balance constraints',async t=>{
  const db=await PGlite.create();
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values ('${A}'),('${B}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
  await db.exec(await readFile(new URL('../supabase/migrations/20261106163745_piso_wais_finance.sql',import.meta.url),'utf8'));
  const as=async(role,user)=>{await db.exec(`set role ${role};select set_config('request.jwt.claim.sub','${user||''}',false);`);};
  const sqlValues=(table,owner=A,id=ids[table])=>({goals:`(id,owner_id,title,target_cents,opening_cents) values ('${id}','${owner}','Goal',10000,1000)`,debts:`(id,owner_id,title,opening_cents,minimum_cents,apr_bps) values ('${id}','${owner}','Debt',10000,1000,1200)`,bills:`(id,owner_id,title,amount_cents,due_date) values ('${id}','${owner}','Bill',1000,current_date)`,transactions:`(id,owner_id,kind,amount_cents,date,note,category) values ('${id}','${owner}','income',1000,current_date,'Salary','Other')`}[table]);
  for(const table of Object.keys(ids))await t.test(`${table}: anon denied; owner allowed; other user cannot read/write/delete`,async()=>{
    await as('anon');for(const op of [`select * from pw_${table}`,`insert into pw_${table} ${sqlValues(table)}`,`update pw_${table} set owner_id=owner_id`,`delete from pw_${table}`])await assert.rejects(()=>db.query(op),{code:'42501'});
    await as('authenticated',A);const inserted=await db.query(`insert into pw_${table} ${sqlValues(table)} returning id`);assert.equal(inserted.rows.length,1);
    assert.equal((await db.query(`select * from pw_${table}`)).rows.length,1);
    const col=table==='transactions'?'note':'title';assert.equal((await db.query(`update pw_${table} set ${col}='Edited' returning id`)).rows.length,1);
    await assert.rejects(()=>db.query(`update pw_${table} set owner_id='${B}'`));
    await as('authenticated',B);assert.equal((await db.query(`select * from pw_${table}`)).rows.length,0);
    await assert.rejects(()=>db.query(`insert into pw_${table} ${sqlValues(table,A,crypto.randomUUID())}`));
    assert.equal((await db.query(`update pw_${table} set ${col}='Stolen' returning id`)).rows.length,0);
    assert.equal((await db.query(`delete from pw_${table} returning id`)).rows.length,0);
    await as('authenticated',A);assert.equal((await db.query(`select ${col} from pw_${table}`)).rows[0][col],'Edited');
  });
  const tx=async(kind,amount,link='',linkValue='')=>db.query(`insert into pw_transactions(owner_id,kind,amount_cents,date,note,category${link?','+link:''}) values ('${A}','${kind}',${amount},current_date,'Test ${++n}','Other'${link?",'"+linkValue+"'":''}) returning id`);
  await t.test('server enforces one free goal and rejects negative/zero/fractional invalid entries',async()=>{
    await as('authenticated',A);await assert.rejects(()=>db.query(`insert into pw_goals ${sqlValues('goals',A,crypto.randomUUID())}`),{code:'23505'});
    await assert.rejects(()=>tx('income',0),{code:'23514'});await assert.rejects(()=>tx('income',-1),{code:'23514'});await assert.rejects(()=>tx('income',"'1.4'"),{code:'22P02'});await assert.rejects(()=>tx('unknown',100),{code:'23514'});
  });
  await t.test('cross-user goal/debt/bill links blocked by composite owner FK',async()=>{
    await as('authenticated',B);for(const table of ['goals','debts','bills'])await db.query(`insert into pw_${table} ${sqlValues(table,B,crypto.randomUUID())}`);
    const others={};for(const table of ['goals','debts','bills'])others[table]=(await db.query(`select id from pw_${table}`)).rows[0].id;
    await as('authenticated',A);
    for(const [kind,col,other]of [['savings','goal_id',others.goals],['debt_payment','debt_id',others.debts],['expense','bill_id',others.bills]])await assert.rejects(()=>tx(kind,1,col,other),{code:'23503'});
  });
  await t.test('savings/debt checks protect inserts, edits, deletes and parent edits',async()=>{
    await as('authenticated',A);await assert.rejects(()=>tx('withdrawal',1001,'goal_id',ids.goals),{code:'23514'});
    const deposit=(await tx('savings',500,'goal_id',ids.goals)).rows[0].id;await tx('withdrawal',1500,'goal_id',ids.goals);
    await assert.rejects(()=>db.query(`delete from pw_transactions where id='${deposit}'`),{code:'23514'});
    await assert.rejects(()=>db.query(`update pw_goals set opening_cents=0`),{code:'23514'});
    await tx('debt_payment',9000,'debt_id',ids.debts);await assert.rejects(()=>tx('debt_payment',1001,'debt_id',ids.debts),{code:'23514'});
    await assert.rejects(()=>db.query(`update pw_debts set opening_cents=8000`),{code:'23514'});
    await assert.rejects(()=>db.query(`delete from pw_goals where id='${ids.goals}'`),/RESTRICT|foreign key/);
  });
  await t.test('a bill has at most one linked expense; deleted payment can be recorded again',async()=>{
    const payment=(await tx('expense',1000,'bill_id',ids.bills)).rows[0].id;
    await assert.rejects(()=>tx('expense',1000,'bill_id',ids.bills),{code:'23505'});
    assert.equal((await db.query(`delete from pw_transactions where id='${payment}' returning id`)).rows.length,1);await tx('expense',1000,'bill_id',ids.bills);
  });
  await t.test('owner can delete own unlinked records; authenticated cannot bypass RLS grants',async()=>{
    assert.equal((await db.query(`delete from pw_transactions where id='${ids.transactions}' returning id`)).rows.length,1);
    await assert.rejects(()=>db.exec('truncate pw_transactions'),{code:'42501'});
    await db.exec('reset role');const enabled=await db.query("select relrowsecurity from pg_class where relname in ('pw_goals','pw_debts','pw_bills','pw_transactions')");assert.equal(enabled.rows.length,4);assert(enabled.rows.every(r=>r.relrowsecurity));
  });
  await t.test('approved administrative erasure can delete records before the auth user',async()=>{
    await db.exec('reset role');
    await db.exec(`begin;delete from pw_transactions where owner_id='${A}';delete from pw_goals where owner_id='${A}';delete from pw_debts where owner_id='${A}';delete from pw_bills where owner_id='${A}';delete from auth.users where id='${A}';commit;`);
    for(const table of Object.keys(ids))assert.equal((await db.query(`select * from pw_${table} where owner_id='${A}'`)).rows.length,0);
  });
  await db.close();
});
