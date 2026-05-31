-- ReceiptAI database schema
-- Run this in the Supabase SQL editor after creating a fresh project.

create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  is_custom boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  image_url text,
  raw_text text,
  merchant text,
  date date,
  time text,
  total numeric,
  tax numeric,
  currency text default 'CAD',
  payment_method text,
  category text,
  summary text,
  flags text[] default '{}',
  confidence numeric,
  created_at timestamptz default now(),
  search_vector tsvector
);

create index if not exists receipts_user_id_idx on public.receipts (user_id);
create index if not exists receipts_date_idx on public.receipts (date desc);
create index if not exists receipts_category_idx on public.receipts (category);
create index if not exists receipts_search_idx on public.receipts using gin (search_vector);

create table if not exists public.line_items (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references public.receipts(id) on delete cascade,
  name text,
  qty numeric,
  price numeric
);

create index if not exists line_items_receipt_id_idx on public.line_items (receipt_id);

create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references public.receipts(id) on delete cascade,
  label text not null
);

create index if not exists tags_receipt_id_idx on public.tags (receipt_id);

-- Stores user corrections so we can prepend few-shot examples to future Claude calls.
create table if not exists public.user_corrections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  merchant text,
  original_category text,
  corrected_category text,
  created_at timestamptz default now()
);

create index if not exists user_corrections_user_idx on public.user_corrections (user_id, created_at desc);

-- ============================================================
-- SEARCH VECTOR TRIGGER
-- Combines merchant + line item names + tag labels.
-- ============================================================

create or replace function public.receipts_refresh_search_vector(p_receipt_id uuid)
returns void
language plpgsql
as $$
declare
  v_merchant text;
  v_items text;
  v_tags text;
  v_category text;
begin
  select coalesce(merchant, ''), coalesce(category, '')
    into v_merchant, v_category
  from public.receipts where id = p_receipt_id;

  select coalesce(string_agg(name, ' '), '')
    into v_items
  from public.line_items where receipt_id = p_receipt_id;

  select coalesce(string_agg(label, ' '), '')
    into v_tags
  from public.tags where receipt_id = p_receipt_id;

  update public.receipts
    set search_vector =
      setweight(to_tsvector('simple', v_merchant), 'A') ||
      setweight(to_tsvector('simple', v_category), 'B') ||
      setweight(to_tsvector('simple', v_items), 'C') ||
      setweight(to_tsvector('simple', v_tags), 'C')
    where id = p_receipt_id;
end;
$$;

create or replace function public.receipts_search_vector_trigger()
returns trigger
language plpgsql
as $$
begin
  perform public.receipts_refresh_search_vector(NEW.id);
  return NEW;
end;
$$;

drop trigger if exists receipts_search_vector_update on public.receipts;
create trigger receipts_search_vector_update
after insert or update of merchant, category on public.receipts
for each row execute function public.receipts_search_vector_trigger();

create or replace function public.line_items_search_vector_trigger()
returns trigger
language plpgsql
as $$
begin
  perform public.receipts_refresh_search_vector(coalesce(NEW.receipt_id, OLD.receipt_id));
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists line_items_search_vector_update on public.line_items;
create trigger line_items_search_vector_update
after insert or update or delete on public.line_items
for each row execute function public.line_items_search_vector_trigger();

drop trigger if exists tags_search_vector_update on public.tags;
create trigger tags_search_vector_update
after insert or update or delete on public.tags
for each row execute function public.line_items_search_vector_trigger();

-- ============================================================
-- USER BOOTSTRAP TRIGGER
-- Creates a row in public.users whenever someone signs up.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.receipts enable row level security;
alter table public.line_items enable row level security;
alter table public.tags enable row level security;
alter table public.categories enable row level security;
alter table public.user_corrections enable row level security;

drop policy if exists "Users can read their own row" on public.users;
create policy "Users can read their own row"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own row" on public.users;
create policy "Users can update their own row"
  on public.users for update
  using (auth.uid() = id);

drop policy if exists "Users can only access their own receipts" on public.receipts;
create policy "Users can only access their own receipts"
  on public.receipts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can only access their own line items" on public.line_items;
create policy "Users can only access their own line items"
  on public.line_items for all
  using (
    exists (
      select 1 from public.receipts r
      where r.id = line_items.receipt_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.receipts r
      where r.id = line_items.receipt_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "Users can only access their own tags" on public.tags;
create policy "Users can only access their own tags"
  on public.tags for all
  using (
    exists (
      select 1 from public.receipts r
      where r.id = tags.receipt_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.receipts r
      where r.id = tags.receipt_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "Users can only access their own categories" on public.categories;
create policy "Users can only access their own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can only access their own corrections" on public.user_corrections;
create policy "Users can only access their own corrections"
  on public.user_corrections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
