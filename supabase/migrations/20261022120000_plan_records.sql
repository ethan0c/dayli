-- Sync, one row per record: an item, a course, a schedule, a planned work date, or the person's
-- profile. Replaces the single `plans` backup row, which made the last device to save the winner
-- of the whole plan. Every write takes the next `seq`, so a device asks for "everything after the
-- last seq I saw"; a deletion is kept as a row with `deleted` set so other devices learn of it.
-- `plans` stays for one release as the fallback a device reads when the account has no records yet.

create sequence public.plan_records_seq;

create table public.plan_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('item', 'course', 'schedule', 'workdate', 'profile')),
  id text not null,
  data jsonb,
  deleted boolean not null default false,
  seq bigint not null default nextval('public.plan_records_seq'),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id),
  constraint plan_records_data_size check (pg_column_size(data) <= 256 * 1024),
  constraint plan_records_deleted_has_no_data check (not deleted or data is null)
);

create index plan_records_user_seq on public.plan_records (user_id, seq);

-- The server stamps every write, so a device can't move its rows ahead of or behind anyone else's.
create or replace function public.stamp_plan_record()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.seq := nextval('public.plan_records_seq');
  new.updated_at := now();
  return new;
end;
$$;

create trigger plan_records_stamp
  before insert or update on public.plan_records
  for each row execute function public.stamp_plan_record();

alter table public.plan_records enable row level security;

create policy "Read your own records" on public.plan_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create your own records" on public.plan_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update your own records" on public.plan_records
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Live changes for the person's other open devices; Realtime applies the select policy above.
alter publication supabase_realtime add table public.plan_records;
