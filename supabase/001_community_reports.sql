-- Run this in Supabase Dashboard > SQL Editor

-- Community reports table
create table if not exists community_reports (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'blocked_road', 'flooding', 'landslide', 'power_outage',
    'evacuation', 'damage', 'other'
  )),
  title text not null,
  description text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  location_label text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reporter_name text not null,
  moderated_at timestamptz,
  moderated_by text,
  moderation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for common queries
create index idx_community_reports_status on community_reports(status);
create index idx_community_reports_created on community_reports(created_at desc);

-- Enable Row Level Security
alter table community_reports enable row level security;

-- RLS policies (permissive for internal prototype)
create policy "Anyone can read reports"
  on community_reports for select
  using (true);

create policy "Anyone can insert reports"
  on community_reports for insert
  with check (true);

create policy "Anyone can update reports"
  on community_reports for update
  using (true);

create policy "Anyone can delete reports"
  on community_reports for delete
  using (true);

-- Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on community_reports
  for each row execute function update_updated_at();
