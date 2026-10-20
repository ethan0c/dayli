-- Accounts are optional: a guest's plan lives only on the phone. Signing in backs it up here,
-- one row per person, so a new phone can restore it.

create table public.plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "Read your own plan" on public.plans
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create your own plan" on public.plans
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update your own plan" on public.plans
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Account deletion from the app, without a server: removes the auth user, and the plan cascades.
create or replace function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
