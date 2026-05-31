create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text,
  raw_text text,
  merchant text,
  date date,
  time text,
  total numeric,
  tax numeric,
  currency text not null default 'CAD',
  payment_method text,
  category text,
  summary text,
  flags text[] not null default '{}',
  confidence numeric not null default 0,
  created_at timestamptz not null default now(),
  search_vector tsvector
);

create table if not exists public.line_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  name text,
  qty numeric,
  price numeric
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  label text
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  is_custom boolean not null default false
);

create table if not exists public.category_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  merchant text,
  original_category text,
  corrected_category text not null,
  created_at timestamptz not null default now()
);

create or replace function public.refresh_receipt_search_vector(target_receipt_id uuid)
returns void
language plpgsql
as $$
declare
  merchant_value text;
  line_item_text text;
  tag_text text;
begin
  select merchant into merchant_value from public.receipts where id = target_receipt_id;

  select coalesce(string_agg(name, ' '), '') into line_item_text
  from public.line_items
  where receipt_id = target_receipt_id;

  select coalesce(string_agg(label, ' '), '') into tag_text
  from public.tags
  where receipt_id = target_receipt_id;

  update public.receipts
  set search_vector =
    setweight(to_tsvector('english', coalesce(merchant_value, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(line_item_text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(tag_text, '')), 'C')
  where id = target_receipt_id;
end;
$$;

create or replace function public.refresh_receipt_search_vector_from_receipt()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_receipt_search_vector(new.id);
  return new;
end;
$$;

create or replace function public.refresh_receipt_search_vector_from_relation()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_receipt_search_vector(coalesce(new.receipt_id, old.receipt_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists receipts_search_vector_trigger on public.receipts;
create trigger receipts_search_vector_trigger
after insert or update of merchant on public.receipts
for each row execute function public.refresh_receipt_search_vector_from_receipt();

drop trigger if exists line_items_search_vector_trigger on public.line_items;
create trigger line_items_search_vector_trigger
after insert or update or delete on public.line_items
for each row execute function public.refresh_receipt_search_vector_from_relation();

drop trigger if exists tags_search_vector_trigger on public.tags;
create trigger tags_search_vector_trigger
after insert or update or delete on public.tags
for each row execute function public.refresh_receipt_search_vector_from_relation();

create index if not exists receipts_user_id_idx on public.receipts(user_id);
create index if not exists receipts_search_vector_idx on public.receipts using gin(search_vector);
create index if not exists receipts_date_idx on public.receipts(date desc);
create index if not exists receipts_merchant_total_idx on public.receipts(merchant, total);
create index if not exists line_items_receipt_id_idx on public.line_items(receipt_id);
create index if not exists tags_receipt_id_idx on public.tags(receipt_id);
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists category_corrections_user_id_idx on public.category_corrections(user_id);

alter table public.users enable row level security;
alter table public.receipts enable row level security;
alter table public.line_items enable row level security;
alter table public.tags enable row level security;
alter table public.categories enable row level security;
alter table public.category_corrections enable row level security;

create policy "Users can manage their own profile"
on public.users
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can only access their own receipts"
on public.receipts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own line items"
on public.line_items
for all
using (
  exists (
    select 1 from public.receipts
    where receipts.id = line_items.receipt_id
      and receipts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.receipts
    where receipts.id = line_items.receipt_id
      and receipts.user_id = auth.uid()
  )
);

create policy "Users can only access their own tags"
on public.tags
for all
using (
  exists (
    select 1 from public.receipts
    where receipts.id = tags.receipt_id
      and receipts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.receipts
    where receipts.id = tags.receipt_id
      and receipts.user_id = auth.uid()
  )
);

create policy "Users can only access their own categories"
on public.categories
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own corrections"
on public.category_corrections
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
