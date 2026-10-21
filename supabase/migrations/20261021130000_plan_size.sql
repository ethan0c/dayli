-- A backup is one person's plan: a few hundred kilobytes at most. A cap keeps a hostile or
-- broken client from filling the table; the app shows its own "couldn't back up" line.
alter table public.plans
  add constraint plans_data_size check (pg_column_size(data) <= 5 * 1024 * 1024);
