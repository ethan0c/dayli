-- Transactional email, queued by the database and sent by the site (apps/web/app/api/emails).
-- The table has no policies: only the service role reads it, and a row is deleted once sent,
-- so an address outlives its account by at most one send.

create table public.email_outbox (
  id bigint generated always as identity primary key,
  email text not null,
  kind text not null check (kind in ('account_deleted')),
  name text,
  created_at timestamptz not null default now()
);
alter table public.email_outbox enable row level security;

-- A deleted account gets one confirmation. Guests (anonymous sign-in) have no address.
create or replace function public.queue_account_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email is not null and old.email <> '' and coalesce(old.is_anonymous, false) = false then
    insert into public.email_outbox (email, kind, name)
      values (old.email, 'account_deleted', nullif(trim(coalesce(old.raw_user_meta_data ->> 'name', old.raw_user_meta_data ->> 'full_name', '')), ''));
  end if;
  return old;
end;
$$;

revoke execute on function public.queue_account_deleted() from public, anon, authenticated;

create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.queue_account_deleted();
