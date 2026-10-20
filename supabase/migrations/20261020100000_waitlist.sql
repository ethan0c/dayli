-- The beta waitlist on semli.app and clicks on the semli.app/beta link. Both are written
-- through security-definer functions with the publishable key; nothing reads them from the
-- site, and the tables have no policies, so only the dashboard and SQL see the rows.

create table public.waitlist (
  email text primary key,
  ref text,
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;

create table public.beta_clicks (
  id bigint generated always as identity primary key,
  ref text,
  at timestamptz not null default now()
);
alter table public.beta_clicks enable row level security;

-- One row per address, lowercased; joining twice is a no-op. The first referral wins.
create or replace function public.join_waitlist(p_email text, p_ref text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e text := lower(trim(p_email));
begin
  if e !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(e) > 254 then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  insert into public.waitlist (email, ref) values (e, nullif(left(trim(p_ref), 64), ''))
    on conflict (email) do nothing;
end;
$$;

create or replace function public.log_beta_click(p_ref text default null)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.beta_clicks (ref) values (nullif(left(trim(p_ref), 64), ''));
$$;

revoke execute on function public.join_waitlist(text, text) from public;
revoke execute on function public.log_beta_click(text) from public;
grant execute on function public.join_waitlist(text, text) to anon, authenticated;
grant execute on function public.log_beta_click(text) to anon, authenticated;
