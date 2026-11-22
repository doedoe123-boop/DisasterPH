-- 003: Lock down community_reports
-- Run after 001_community_reports.sql (Supabase Dashboard > SQL Editor, or psql).
--
-- Replaces the prototype RLS policies from 001 with server-side-only access.
--
-- After this migration:
--   * anon and authenticated roles have no privileges on the table and no
--     RLS policies apply to them, so the Data API cannot read or write it.
--   * All access goes through the Next.js routes using SUPABASE_SERVICE_ROLE_KEY
--     (server-only): public reads are limited to approved reports and public
--     columns; submissions always start pending; moderation requires a
--     server-verified moderator session.
--   * Every inserted row is forced to pending with empty moderation fields,
--     regardless of the caller.
--
-- Safe to re-run.

begin;

-- 1. Remove the permissive prototype policies.
drop policy if exists "Anyone can read reports" on public.community_reports;
drop policy if exists "Anyone can insert reports" on public.community_reports;
drop policy if exists "Anyone can update reports" on public.community_reports;
drop policy if exists "Anyone can delete reports" on public.community_reports;

-- 2. Keep RLS enabled. With no policies, every role without BYPASSRLS is denied.
alter table public.community_reports enable row level security;

-- 3. Revoke direct table privileges from the Data API roles (Supabase grants
--    these by default) and keep the server role's access explicit.
revoke all on table public.community_reports from public, anon, authenticated;
grant select, insert, update, delete on table public.community_reports to service_role;

-- 4. New reports always enter moderation as pending.
create or replace function public.community_reports_force_pending()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status := 'pending';
  new.moderated_at := null;
  new.moderated_by := null;
  new.moderation_reason := null;
  return new;
end;
$$;

revoke execute on function public.community_reports_force_pending() from public, anon, authenticated;

drop trigger if exists community_reports_force_pending on public.community_reports;
create trigger community_reports_force_pending
  before insert on public.community_reports
  for each row execute function public.community_reports_force_pending();

commit;

-- Post-migration check (expect no rows for anon/authenticated):
--   select grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'community_reports'
--     and grantee in ('anon', 'authenticated');
--   select policyname from pg_policies where tablename = 'community_reports';
