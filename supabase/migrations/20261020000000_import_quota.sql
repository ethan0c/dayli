-- Server-side import limits. The app's own counter is a courtesy; this is the one that holds.
-- Guests use anonymous sign-in, so every app import has a user id. Plus is checked by the
-- API route through RevenueCat before it gets here; these functions only count free use.

create table public.import_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null, -- YYYY-MM, UTC
  count int not null default 0,
  primary key (user_id, month)
);
alter table public.import_usage enable row level security;
create policy "Read your own usage" on public.import_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- Take one free import if any are left this month. Atomic, so parallel requests can't overspend.
create or replace function public.claim_import(p_limit int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  m text := to_char(now() at time zone 'utc', 'YYYY-MM');
  used int;
begin
  if auth.uid() is null then return false; end if;
  insert into public.import_usage (user_id, month, count) values (auth.uid(), m, 0)
    on conflict (user_id, month) do nothing;
  update public.import_usage set count = count + 1
    where user_id = auth.uid() and month = m and count < p_limit
    returning count into used;
  return used is not null;
end;
$$;

-- Give one back when the read failed, so a timeout doesn't cost an import.
create or replace function public.refund_import()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.import_usage set count = greatest(count - 1, 0)
    where user_id = auth.uid() and month = to_char(now() at time zone 'utc', 'YYYY-MM');
$$;

revoke execute on function public.claim_import(int) from public, anon;
revoke execute on function public.refund_import() from public, anon;
grant execute on function public.claim_import(int) to authenticated;
grant execute on function public.refund_import() to authenticated;

-- The website demo has no accounts: a few previews a day per hashed IP.
create table public.demo_usage (
  ip_hash text not null,
  day date not null,
  count int not null default 0,
  primary key (ip_hash, day)
);
alter table public.demo_usage enable row level security;

create or replace function public.claim_demo(p_ip_hash text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date := (now() at time zone 'utc')::date;
  used int;
begin
  insert into public.demo_usage (ip_hash, day, count) values (p_ip_hash, d, 0)
    on conflict (ip_hash, day) do nothing;
  update public.demo_usage set count = count + 1
    where ip_hash = p_ip_hash and day = d and count < p_limit
    returning count into used;
  return used is not null;
end;
$$;

revoke execute on function public.claim_demo(text, int) from public;
grant execute on function public.claim_demo(text, int) to anon, authenticated;
