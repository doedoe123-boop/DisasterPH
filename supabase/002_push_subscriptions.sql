-- Run this in Supabase Dashboard > SQL Editor

-- Web Push subscriptions for closed-tab regional alerts.
-- These rows contain browser push endpoints and encryption keys. Keep access
-- restricted to server-side code using SUPABASE_SERVICE_ROLE_KEY.
create table if not exists push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_updated
  on push_subscriptions(updated_at desc);

create index if not exists idx_push_subscriptions_preferences
  on push_subscriptions using gin(preferences);

alter table push_subscriptions enable row level security;

-- No public RLS policies are defined intentionally. Server-side API routes use
-- the Supabase service role key, which bypasses RLS. Do not expose this table
-- directly to browser clients.

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_push_subscriptions_updated_at on push_subscriptions;

create trigger set_push_subscriptions_updated_at
  before update on push_subscriptions
  for each row execute function update_updated_at();
