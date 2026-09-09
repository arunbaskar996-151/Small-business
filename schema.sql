-- ============================================================
-- Baskar Traders — Financial Management & Profit Analysis
-- Supabase database schema
-- ============================================================
-- HOW TO USE:
-- 1. Go to your Supabase project → SQL Editor (left sidebar)
-- 2. Click "New query"
-- 3. Paste this entire file in and click "Run"
-- This creates the transactions table and locks it down so
-- every user can only ever see and edit their OWN transactions.
-- ============================================================

-- 1. Create the transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  month text not null,
  month_index int not null,
  type text not null check (type in ('income','expense')),
  category text not null,
  description text not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- 2. Index for faster per-user queries
create index if not exists transactions_user_id_idx on public.transactions(user_id);

-- 3. Enable Row Level Security — this is what makes it multi-user safe.
-- Without this, any logged-in user could read/edit anyone's data.
alter table public.transactions enable row level security;

-- 4. Policies: a user can only see, insert, update, or delete THEIR OWN rows.
drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- That's it. Row Level Security policies above ensure:
--   - User A can never see User B's transactions
--   - Even if someone inspects the network requests in dev tools,
--     Supabase enforces this at the database level, not just in
--     the app's JavaScript.
-- ============================================================
