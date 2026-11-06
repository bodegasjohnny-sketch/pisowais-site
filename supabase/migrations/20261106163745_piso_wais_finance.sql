-- REVIEW ONLY: apply to a dedicated, approved Piso Wais project after security review.
-- No production database has been selected or changed by this feature branch.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.pw_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  target_cents bigint not null check (target_cents between 1 and 99999999999),
  opening_cents bigint not null default 0 check (opening_cents between 0 and 99999999999),
  unique(owner_id), -- Free launch: one goal, enforced on the server. No paid entitlements yet.
  unique(owner_id, id)
);
create table public.pw_debts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  opening_cents bigint not null check (opening_cents between 1 and 99999999999),
  minimum_cents bigint not null default 0 check (minimum_cents between 0 and 99999999999),
  apr_bps integer not null default 0 check (apr_bps between 0 and 100000),
  unique(owner_id, id)
);
create table public.pw_bills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  amount_cents bigint not null check (amount_cents between 1 and 99999999999),
  due_date date not null,
  unique(owner_id, id)
);
create table public.pw_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('income','expense','savings','withdrawal','debt_payment')),
  amount_cents bigint not null check (amount_cents between 1 and 99999999999),
  date date not null check (date <= (current_timestamp at time zone 'Asia/Manila')::date),
  note text not null check (char_length(btrim(note)) between 1 and 120),
  category text not null default 'Other' check (category in ('Food','Bills','Transport','Shopping','Health','Family','Business','Other')),
  goal_id uuid,
  debt_id uuid,
  bill_id uuid,
  foreign key(owner_id, goal_id) references public.pw_goals(owner_id, id) on delete restrict,
  foreign key(owner_id, debt_id) references public.pw_debts(owner_id, id) on delete restrict,
  foreign key(owner_id, bill_id) references public.pw_bills(owner_id, id) on delete restrict,
  check (
    (kind in ('savings','withdrawal') and goal_id is not null and debt_id is null and bill_id is null)
    or (kind = 'debt_payment' and debt_id is not null and goal_id is null and bill_id is null)
    or (kind = 'income' and goal_id is null and debt_id is null and bill_id is null)
    or (kind = 'expense' and goal_id is null and debt_id is null)
  ),
  check (kind = 'expense' or category = 'Other')
);
create index pw_transactions_owner_date on public.pw_transactions(owner_id, date);
create index pw_transactions_owner_goal on public.pw_transactions(owner_id, goal_id) where goal_id is not null;
create index pw_transactions_owner_debt on public.pw_transactions(owner_id, debt_id) where debt_id is not null;
create unique index pw_one_payment_per_bill on public.pw_transactions(bill_id) where bill_id is not null;
-- Unique(owner_id,id) indexes on parents cover owner-based RLS and composite foreign keys.

-- Serializes writes per account, including parent edits, to prevent concurrent over-withdrawal.
-- Invoker functions only; no privileged RPC or exposed security-definer function.
create function private.pw_lock_book() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (old.owner_id <> new.owner_id or old.id <> new.id) then
    raise exception 'Record ownership and identifier are immutable' using errcode = '23514';
  end if;
  perform pg_advisory_xact_lock(hashtextextended((case when tg_op = 'DELETE' then old.owner_id else new.owner_id end)::text, 0));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create function private.pw_check_book() returns trigger
language plpgsql set search_path = '' as $$
declare who uuid;
begin
  who := case when tg_op = 'DELETE' then old.owner_id else new.owner_id end;
  if exists (
    select 1 from public.pw_goals g where g.owner_id = who and
    g.opening_cents + coalesce((select sum(case when t.kind = 'savings' then t.amount_cents else -t.amount_cents end)
      from public.pw_transactions t where t.owner_id = who and t.goal_id = g.id), 0) < 0
  ) then raise exception 'Withdrawals cannot exceed savings' using errcode = '23514'; end if;
  if exists (
    select 1 from public.pw_debts d where d.owner_id = who and
    d.opening_cents - coalesce((select sum(t.amount_cents) from public.pw_transactions t where t.owner_id = who and t.debt_id = d.id),0) < 0
  ) then raise exception 'Payments cannot exceed debt balance' using errcode = '23514'; end if;
  return null;
end;
$$;
revoke all on function private.pw_lock_book() from public, anon;
revoke all on function private.pw_check_book() from public, anon;
grant execute on function private.pw_lock_book(), private.pw_check_book() to authenticated;

do $$
declare tbl text;
begin
  foreach tbl in array array['pw_goals','pw_debts','pw_bills','pw_transactions'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('revoke all on table public.%I from anon, authenticated', tbl);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', tbl);
    execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', tbl);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', tbl);
    execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', tbl);
    execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)', tbl);
    execute format('create trigger pw_lock before insert or update or delete on public.%I for each row execute function private.pw_lock_book()',tbl);
    execute format('create trigger pw_check after insert or update or delete on public.%I for each row execute function private.pw_check_book()',tbl);
  end loop;
end;
$$;
commit;
