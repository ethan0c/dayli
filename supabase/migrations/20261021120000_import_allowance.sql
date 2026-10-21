-- The free allowance the app shows: five imports in the thirty days after the account appeared
-- (a guest's anonymous account is created at the first import), then the monthly count.
-- Replaces claim_import(int); the route passes all three numbers so the two sides cannot drift.

drop function if exists public.claim_import(int);

create or replace function public.claim_import(p_limit int, p_start_limit int, p_start_days int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  m text := to_char(now() at time zone 'utc', 'YYYY-MM');
  since timestamptz;
  used int;
begin
  if auth.uid() is null then return false; end if;
  insert into public.import_usage (user_id, month, count) values (auth.uid(), m, 0)
    on conflict (user_id, month) do nothing;
  select created_at into since from auth.users where id = auth.uid();
  if since is not null and since > now() - make_interval(days => p_start_days) then
    -- Starting out: the whole window shares one allowance, whatever the month.
    update public.import_usage set count = count + 1
      where user_id = auth.uid() and month = m
        and (select coalesce(sum(count), 0) from public.import_usage where user_id = auth.uid()) < p_start_limit
      returning count into used;
  else
    update public.import_usage set count = count + 1
      where user_id = auth.uid() and month = m and count < p_limit
      returning count into used;
  end if;
  return used is not null;
end;
$$;

revoke execute on function public.claim_import(int, int, int) from public, anon;
grant execute on function public.claim_import(int, int, int) to authenticated;
