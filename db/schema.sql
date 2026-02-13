-- PostgreSQL schema for production migration
create table app_user (
  id text primary key,
  email text unique not null,
  full_name text not null,
  locale text not null default 'en-KW',
  loyalty_points integer not null default 0,
  wallet_fils integer not null default 0,
  created_at timestamptz not null default now()
);

create type order_mode as enum ('pickup', 'delivery');
create type order_status as enum ('preparing', 'ready', 'completed', 'cancelled');

create table app_order (
  id text primary key,
  external_ref text unique not null,
  user_id text not null references app_user(id),
  mode order_mode not null,
  status order_status not null default 'preparing',
  subtotal_fils integer not null,
  tax_fils integer not null,
  total_fils integer not null,
  points_earned integer not null default 0,
  points_redeemed integer not null default 0,
  created_at timestamptz not null default now()
);

create table app_order_item (
  id text primary key,
  order_id text not null references app_order(id),
  name_en text not null,
  name_ar text not null,
  quantity integer not null,
  unit_fils integer not null,
  custom_notes text
);
