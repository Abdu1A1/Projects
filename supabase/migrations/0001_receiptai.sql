create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
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
  currency text default 'CAD',
  payment_method text,
  category text,
  summary text,
  flags text[] default '{}',
  confidence numeric,
  created_at timestamptz default now(),
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
  name text,
  is_custom boolean default false
);

create table if not exists public.category_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  merchant text,
  previous_category text,
  corrected_category text not null,
  created_at timestamptz default now()
);

create or replace function public.build_receipt_search_vector(receipt_uuid uuid)
returns tsvector
language sql
stable
as $$
  select to_tsvector(
    'english',
    trim(
      both ' ' from
      concat_ws(
        ' ',
        coalesce(r.merchant, ''),
        coalesce((
          select string_agg(li.name, ' ')
          from public.line_items li
          where li.receipt_id = r.id
        ), ''),
        coalesce((
          select string_agg(t.label, ' ')
          from public.tags t
          where t.receipt_id = r.id
        ), '')
      )
    )
  )
  from public.receipts r
  where r.id = receipt_uuid;
$$;

create or replace function public.set_receipt_search_vector_on_receipt()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.merchant, ''));
  return new;
end;
$$;

create or replace function public.refresh_receipt_search_vector()
returns trigger
language plpgsql
as $$
declare
  target_receipt_id uuid;
begin
  target_receipt_id := coalesce(new.receipt_id, old.receipt_id, new.id, old.id);

  if target_receipt_id is null then
    return coalesce(new, old);
  end if;

  update public.receipts
  set search_vector = public.build_receipt_search_vector(target_receipt_id)
  where id = target_receipt_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists receipts_search_vector_before on public.receipts;
create trigger receipts_search_vector_before
before insert or update on public.receipts
for each row
execute function public.set_receipt_search_vector_on_receipt();

drop trigger if exists receipts_search_vector_after on public.receipts;
create trigger receipts_search_vector_after
after insert or update of merchant on public.receipts
for each row
execute function public.refresh_receipt_search_vector();

drop trigger if exists line_items_search_vector_after on public.line_items;
create trigger line_items_search_vector_after
after insert or update or delete on public.line_items
for each row
execute function public.refresh_receipt_search_vector();

drop trigger if exists tags_search_vector_after on public.tags;
create trigger tags_search_vector_after
after insert or update or delete on public.tags
for each row
execute function public.refresh_receipt_search_vector();

create index if not exists receipts_user_id_idx on public.receipts(user_id);
create index if not exists receipts_date_idx on public.receipts(date);
create index if not exists receipts_total_idx on public.receipts(total);
create index if not exists receipts_search_vector_idx on public.receipts using gin(search_vector);
create index if not exists line_items_receipt_id_idx on public.line_items(receipt_id);
create index if not exists tags_receipt_id_idx on public.tags(receipt_id);

alter table public.users enable row level security;
alter table public.receipts enable row level security;
alter table public.line_items enable row level security;
alter table public.tags enable row level security;
alter table public.categories enable row level security;
alter table public.category_corrections enable row level security;

drop policy if exists "Users can access only their own user row" on public.users;
create policy "Users can access only their own user row"
on public.users
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can only access their own receipts" on public.receipts;
create policy "Users can only access their own receipts"
on public.receipts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can only access their own line items" on public.line_items;
create policy "Users can only access their own line items"
on public.line_items
for all
using (
  exists (
    select 1
    from public.receipts r
    where r.id = line_items.receipt_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.receipts r
    where r.id = line_items.receipt_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists "Users can only access their own tags" on public.tags;
create policy "Users can only access their own tags"
on public.tags
for all
using (
  exists (
    select 1
    from public.receipts r
    where r.id = tags.receipt_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.receipts r
    where r.id = tags.receipt_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists "Users can only access their own categories" on public.categories;
create policy "Users can only access their own categories"
on public.categories
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can only access their own category corrections" on public.category_corrections;
create policy "Users can only access their own category corrections"
on public.category_corrections
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
