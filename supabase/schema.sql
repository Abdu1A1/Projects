-- ReceiptAI V1 schema
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
  confidence numeric default 0,
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
  name text not null,
  is_custom boolean default false,
  unique (user_id, name)
);

-- V1 helper table for user-specific few-shot correction examples.
create table if not exists public.user_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  merchant text,
  line_items_text text,
  corrected_category text not null,
  created_at timestamptz default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.refresh_receipt_search_vector(receipt_uuid uuid)
returns void
language plpgsql
as $$
declare
  merchant_text text;
  line_items_text text;
  tags_text text;
begin
  select coalesce(r.merchant, '')
  into merchant_text
  from public.receipts r
  where r.id = receipt_uuid;

  select coalesce(string_agg(li.name, ' '), '')
  into line_items_text
  from public.line_items li
  where li.receipt_id = receipt_uuid;

  select coalesce(string_agg(t.label, ' '), '')
  into tags_text
  from public.tags t
  where t.receipt_id = receipt_uuid;

  update public.receipts
  set search_vector =
    setweight(to_tsvector('english', merchant_text), 'A') ||
    setweight(to_tsvector('english', line_items_text), 'B') ||
    setweight(to_tsvector('english', tags_text), 'C')
  where id = receipt_uuid;
end;
$$;

create or replace function public.refresh_receipt_search_vector_from_receipts()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_receipt_search_vector(new.id);
  return new;
end;
$$;

create or replace function public.refresh_receipt_search_vector_from_line_items()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_receipt_search_vector(coalesce(new.receipt_id, old.receipt_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.refresh_receipt_search_vector_from_tags()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_receipt_search_vector(coalesce(new.receipt_id, old.receipt_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists receipts_refresh_search_vector on public.receipts;
create trigger receipts_refresh_search_vector
  after insert or update of merchant on public.receipts
  for each row execute procedure public.refresh_receipt_search_vector_from_receipts();

drop trigger if exists line_items_refresh_search_vector on public.line_items;
create trigger line_items_refresh_search_vector
  after insert or update or delete on public.line_items
  for each row execute procedure public.refresh_receipt_search_vector_from_line_items();

drop trigger if exists tags_refresh_search_vector on public.tags;
create trigger tags_refresh_search_vector
  after insert or update or delete on public.tags
  for each row execute procedure public.refresh_receipt_search_vector_from_tags();

create index if not exists receipts_user_id_idx on public.receipts (user_id);
create index if not exists receipts_date_idx on public.receipts (date desc);
create index if not exists receipts_total_idx on public.receipts (total);
create index if not exists receipts_search_vector_idx on public.receipts using gin (search_vector);
create index if not exists line_items_receipt_id_idx on public.line_items (receipt_id);
create index if not exists tags_receipt_id_idx on public.tags (receipt_id);

alter table public.users enable row level security;
alter table public.receipts enable row level security;
alter table public.line_items enable row level security;
alter table public.tags enable row level security;
alter table public.categories enable row level security;
alter table public.user_corrections enable row level security;

create policy "Users can access their own profile"
on public.users for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can only access their own receipts"
on public.receipts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access line items for their receipts"
on public.line_items for all
using (
  exists (
    select 1 from public.receipts r
    where r.id = line_items.receipt_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.receipts r
    where r.id = line_items.receipt_id
      and r.user_id = auth.uid()
  )
);

create policy "Users can only access tags for their receipts"
on public.tags for all
using (
  exists (
    select 1 from public.receipts r
    where r.id = tags.receipt_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.receipts r
    where r.id = tags.receipt_id
      and r.user_id = auth.uid()
  )
);

create policy "Users can only access their own categories"
on public.categories for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own corrections"
on public.user_corrections for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
