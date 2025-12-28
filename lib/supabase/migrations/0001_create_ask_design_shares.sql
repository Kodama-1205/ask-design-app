-- supabase/migrations/0001_create_ask_design_shares.sql
create table if not exists public.ask_design_shares (
  id bigserial primary key,
  token text not null unique,
  title text null,
  generated_prompt text not null,
  explanation text null,
  created_at timestamptz not null default now()
);

create index if not exists ask_design_shares_token_idx
  on public.ask_design_shares (token);
