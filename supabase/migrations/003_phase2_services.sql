-- Create services table
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  price_inr integer not null,
  delivery_days smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Create orders table
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('requested', 'accepted', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed')),
  price_inr integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create reviews table
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,
  communication smallint not null check (communication >= 1 and communication <= 5),
  delivery smallint not null check (delivery >= 1 and delivery <= 5),
  technical_skill smallint not null check (technical_skill >= 1 and technical_skill <= 5),
  professionalism smallint not null check (professionalism >= 1 and professionalism <= 5),
  overall numeric(2,1) not null,
  comment text,
  created_at timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists services_owner_id_idx on services (owner_id);
create index if not exists services_category_idx on services (category);
create index if not exists orders_service_id_idx on orders (service_id);
create index if not exists orders_buyer_id_idx on orders (buyer_id);
create index if not exists orders_seller_id_idx on orders (seller_id);
create index if not exists reviews_order_id_idx on reviews (order_id);
create index if not exists reviews_reviewer_id_idx on reviews (reviewer_id);
create index if not exists reviews_reviewee_id_idx on reviews (reviewee_id);

-- Enable RLS
alter table services enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;

-- Services policies
create policy "Services are readable by everyone"
  on services for select
  using (is_active = true or owner_id = auth.uid());

create policy "Users can insert services"
  on services for insert
  with check (auth.uid() = owner_id);

create policy "Users can update their own services"
  on services for update
  using (auth.uid() = owner_id);

create policy "Users can delete their own services"
  on services for delete
  using (auth.uid() = owner_id);

-- Orders policies
create policy "Users can view their own orders (buyer or seller)"
  on orders for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Users can create orders as buyer"
  on orders for insert
  with check (buyer_id = auth.uid() and buyer_id <> seller_id);

create policy "Users can update their own orders (buyer or seller)"
  on orders for update
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Reviews policies
create policy "Reviews are readable by everyone"
  on reviews for select
  using (true);

create policy "Users can insert reviews where they are reviewer"
  on reviews for insert
  with check (reviewer_id = auth.uid());

-- updated_at trigger for orders
drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();
