-- supabase/migrations/2025122201_template_shares.sql
-- 共有リンク用テーブル（トークン方式）

create extension if not exists "pgcrypto";

create table if not exists public.template_shares (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create index if not exists template_shares_template_id_idx on public.template_shares(template_id);
create index if not exists template_shares_user_id_idx on public.template_shares(user_id);
create index if not exists template_shares_token_idx on public.template_shares(token);

alter table public.template_shares enable row level security;

-- 所有者は自分のshare行を操作できる
create policy "template_shares_select_own"
on public.template_shares
for select
to authenticated
using (auth.uid() = user_id);

create policy "template_shares_insert_own"
on public.template_shares
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "template_shares_update_own"
on public.template_shares
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "template_shares_delete_own"
on public.template_shares
for delete
to authenticated
using (auth.uid() = user_id);

-- 公開閲覧（anon含む）：revokedでなく、紐づくテンプレの本体取得は API 側で行う想定
-- ここでは share行自体を公開にしない方が安全なので、template_shares には anon select を付けない
-- 公開ページは Next.js API Route（server）からトークンでテンプレを取得して返す
