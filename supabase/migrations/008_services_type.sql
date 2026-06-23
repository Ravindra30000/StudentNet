-- Add type column to services
alter table services add column if not exists type text not null default 'offered' check (type in ('offered', 'sought'));

-- Update orders RLS to allow students to initiate orders/proposals on sought services
drop policy if exists "Users can create orders as buyer" on orders;

create policy "Users can create orders (as buyer or seller)"
  on orders for insert
  with check ((buyer_id = auth.uid() or seller_id = auth.uid()) and buyer_id <> seller_id);
