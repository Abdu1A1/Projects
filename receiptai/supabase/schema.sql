-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (mirrors Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- Receipts table
create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
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

-- Line items table
create table if not exists public.line_items (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references public.receipts(id) on delete cascade not null,
  name text,
  qty numeric,
  price numeric
);

-- Tags table
create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references public.receipts(id) on delete cascade not null,
  label text
);

-- Categories table
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  is_custom boolean default false
);

-- User corrections for few-shot prompting
create table if not exists public.user_corrections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  merchant text,
  original_category text,
  corrected_category text,
  created_at timestamptz default now()
);

-- Full text search index
create index if not exists receipts_search_idx on public.receipts using gin(search_vector);
create index if not exists receipts_user_id_idx on public.receipts(user_id);
create index if not exists receipts_date_idx on public.receipts(date);
create index if not exists receipts_category_idx on public.receipts(category);
create index if not exists line_items_receipt_id_idx on public.line_items(receipt_id);
create index if not exists tags_receipt_id_idx on public.tags(receipt_id);

-- Function to update search_vector
create or replace function update_receipt_search_vector()
returns trigger as $$
declare
  line_names text;
  tag_labels text;
begin
  -- Get line item names for this receipt
  select coalesce(string_agg(name, ' '), '') into line_names
  from public.line_items
  where receipt_id = NEW.id;

  -- Get tag labels for this receipt
  select coalesce(string_agg(label, ' '), '') into tag_labels
  from public.tags
  where receipt_id = NEW.id;

  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.merchant, '') || ' ' ||
    coalesce(NEW.category, '') || ' ' ||
    coalesce(NEW.summary, '') || ' ' ||
    coalesce(line_names, '') || ' ' ||
    coalesce(tag_labels, '')
  );

  return NEW;
end;
$$ language plpgsql;

-- Trigger to auto-update search_vector on receipts
create or replace trigger receipts_search_vector_update
before insert or update on public.receipts
for each row execute function update_receipt_search_vector();

-- Function to update search vector when line_items change
create or replace function update_receipt_search_on_line_item_change()
returns trigger as $$
declare
  receipt_id_val uuid;
begin
  if TG_OP = 'DELETE' then
    receipt_id_val := OLD.receipt_id;
  else
    receipt_id_val := NEW.receipt_id;
  end if;

  update public.receipts
  set updated_at = now()
  where id = receipt_id_val;

  return NEW;
end;
$$ language plpgsql;

-- Add updated_at to receipts if not exists
alter table public.receipts add column if not exists updated_at timestamptz default now();

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.users enable row level security;
alter table public.receipts enable row level security;
alter table public.line_items enable row level security;
alter table public.tags enable row level security;
alter table public.categories enable row level security;
alter table public.user_corrections enable row level security;

-- Users policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Receipts policies
create policy "Users can only access their own receipts"
  on public.receipts for all
  using (auth.uid() = user_id);

-- Line items policies
create policy "Users can access line items for their receipts"
  on public.line_items for all
  using (
    exists (
      select 1 from public.receipts
      where receipts.id = line_items.receipt_id
      and receipts.user_id = auth.uid()
    )
  );

-- Tags policies
create policy "Users can access tags for their receipts"
  on public.tags for all
  using (
    exists (
      select 1 from public.receipts
      where receipts.id = tags.receipt_id
      and receipts.user_id = auth.uid()
    )
  );

-- Categories policies
create policy "Users can only access their own categories"
  on public.categories for all
  using (auth.uid() = user_id);

-- User corrections policies
create policy "Users can only access their own corrections"
  on public.user_corrections for all
  using (auth.uid() = user_id);

-- Insert default categories for new users (via function)
create or replace function public.seed_default_categories(user_id_param uuid)
returns void as $$
begin
  insert into public.categories (user_id, name, is_custom) values
    (user_id_param, 'Grocery', false),
    (user_id_param, 'Restaurant', false),
    (user_id_param, 'Gas', false),
    (user_id_param, 'Shopping', false),
    (user_id_param, 'Bills', false),
    (user_id_param, 'Subscriptions', false),
    (user_id_param, 'Electronics', false),
    (user_id_param, 'Home', false),
    (user_id_param, 'Pets', false),
    (user_id_param, 'Medical', false),
    (user_id_param, 'Travel', false),
    (user_id_param, 'Business', false),
    (user_id_param, 'School', false),
    (user_id_param, 'Other', false)
  on conflict do nothing;
end;
$$ language plpgsql security definer;
