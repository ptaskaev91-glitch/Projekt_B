create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  horde_api_key text not null default '',
  client_agent text not null default 'HordeChat/1.0',
  model_selection_mode text not null default 'auto' check (model_selection_mode in ('auto', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chats (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Новый чат',
  model text not null default 'aphrodite',
  max_length integer not null default 400,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chats_user_id_updated_at_idx on public.chats (user_id, updated_at desc);

create table if not exists public.messages (
  id text primary key,
  chat_id text not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  status text not null default 'done' check (status in ('done', 'loading', 'error')),
  queue_position integer,
  wait_time integer,
  worker_name text,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_id_created_at_idx on public.messages (chat_id, created_at asc);
create index if not exists messages_user_id_created_at_idx on public.messages (user_id, created_at desc);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  chat_id text references public.chats (id) on delete set null,
  provider text not null default 'horde',
  model text,
  remote_job_id text,
  status text not null default 'pending',
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_created_at_idx on public.jobs (user_id, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'user_settings_set_updated_at'
  ) then
    create trigger user_settings_set_updated_at
    before update on public.user_settings
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'chats_set_updated_at'
  ) then
    create trigger chats_set_updated_at
    before update on public.chats
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'jobs_set_updated_at'
  ) then
    create trigger jobs_set_updated_at
    before update on public.jobs
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.jobs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "user_settings_all_own" on public.user_settings;
create policy "user_settings_all_own"
on public.user_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "chats_all_own" on public.chats;
create policy "chats_all_own"
on public.chats
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "messages_all_own" on public.messages;
create policy "messages_all_own"
on public.messages
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "jobs_all_own" on public.jobs;
create policy "jobs_all_own"
on public.jobs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('chat-assets', 'chat-assets', false)
on conflict (id) do nothing;

drop policy if exists "storage_select_own_chat_assets" on storage.objects;
create policy "storage_select_own_chat_assets"
on storage.objects
for select
using (bucket_id = 'chat-assets' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "storage_insert_own_chat_assets" on storage.objects;
create policy "storage_insert_own_chat_assets"
on storage.objects
for insert
with check (bucket_id = 'chat-assets' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "storage_update_own_chat_assets" on storage.objects;
create policy "storage_update_own_chat_assets"
on storage.objects
for update
using (bucket_id = 'chat-assets' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'chat-assets' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "storage_delete_own_chat_assets" on storage.objects;
create policy "storage_delete_own_chat_assets"
on storage.objects
for delete
using (bucket_id = 'chat-assets' and auth.uid()::text = (storage.foldername(name))[1]);