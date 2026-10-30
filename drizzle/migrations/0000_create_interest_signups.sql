create table public.interest_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  trip text not null,
  period text not null,
  name text not null,
  email text not null,
  message text,
  locale text not null default 'en'
);

alter table public.interest_signups enable row level security;

-- Anyone may register interest; rows are readable only by admins via the dashboard.
create policy "anyone can register interest"
  on public.interest_signups for insert
  to anon, authenticated
  with check (true);

grant insert on public.interest_signups to anon, authenticated;