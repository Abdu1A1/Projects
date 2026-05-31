create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
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
  currency text default 'CAD',
  payment_method text,
  category text,
  summary text,
  flags text[] not null default '{}',
  confidence numeric,
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

create table if not exists public.receipt_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  receipt_id uuid references public.receipts(id) on delete set null,
  merchant text,
  raw_excerpt text,
  previous_category text,
  corrected_category text not null,
  created_at timestamptz not null default now()
);

create index if not exists receipts_user_id_idx on public.receipts(user_id);
create index if not exists receipts_date_idx on public.receipts(date desc);
create index if not exists receipts_merchant_idx on public.receipts(merchant);
create index if not exists receipts_search_vector_idx on public.receipts using gin(search_vector);
create index if not exists line_items_receipt_id_idx on public.line_items(receipt_id);
create index if not exists tags_receipt_id_idx on public.tags(receipt_id);
create unique index if not exists categories_user_name_idx on public.categories(user_id, lower(name));

create or replace function public.refresh_receipt_search_vector(target_receipt_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  line_item_text text;
  tag_text text;
begin
  select coalesce(string_agg(coalesce(name, ''), ' '), '')
    into line_item_text
  from public.line_items
  where receipt_id = target_receipt_id;

  select coalesce(string_agg(coalesce(label, ''), ' '), '')
    into tag_text
  from public.tags
  where receipt_id = target_receipt_id;

  update public.receipts
  set search_vector =
    setweight(to_tsvector('english', coalesce(merchant, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(line_item_text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(tag_text, '')), 'C')
  where id = target_receipt_id;
end;
$$;

create or replace function public.receipts_search_vector_trigger()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_receipt_search_vector(new.id);
  return new;
end;
$$;

create or replace function public.related_receipt_search_vector_trigger()
returns trigger
language plpgsql
as $$
declare
  target_receipt_id uuid;
begin
  target_receipt_id := coalesce(new.receipt_id, old.receipt_id);
  perform public.refresh_receipt_search_vector(target_receipt_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists receipts_search_vector_before_write on public.receipts;
create trigger receipts_search_vector_before_write
after insert or update on public.receipts
for each row execute function public.receipts_search_vector_trigger();

drop trigger if exists line_items_refresh_receipt_search on public.line_items;
create trigger line_items_refresh_receipt_search
after insert or update or delete on public.line_items
for each row execute function public.related_receipt_search_vector_trigger();

drop trigger if exists tags_refresh_receipt_search on public.tags;
create trigger tags_refresh_receipt_search
after insert or update or delete on public.tags
for each row execute function public.related_receipt_search_vector_trigger();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.receipts enable row level security;
alter table public.line_items enable row level security;
alter table public.tags enable row level security;
alter table public.categories enable row level security;
alter table public.receipt_corrections enable row level security;

create policy "Users can only access their own profile"
on public.users for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can only access their own receipts"
on public.receipts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access line items on their own receipts"
on public.line_items for all
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

create policy "Users can only access tags on their own receipts"
on public.tags for all
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
on public.categories for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can only access their own corrections"
on public.receipt_corrections for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
