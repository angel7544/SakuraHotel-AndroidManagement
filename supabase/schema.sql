-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Hotels Table
create table if not exists hotels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text,
  description text,
  image_url text,
  status text default 'Active' check (status in ('Active', 'Maintenance', 'Closed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table hotels add column if not exists description text;

-- Rooms Table
create table if not exists rooms (
  id uuid default uuid_generate_v4() primary key,
  hotel_id uuid references hotels(id) on delete cascade,
  room_number text not null,
  type text not null, -- e.g., 'Deluxe King', 'Standard'
  price numeric not null,
  status text default 'Available' check (status in ('Available', 'Occupied', 'Reserved', 'Blocked', 'Maintenance')),
  description text,
  image_url text,
  capacity int,
  bed_type text,
  bed_count int,
  amenities text[],
  view_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(hotel_id, room_number)
);

-- Services Table (Food, Travel, etc.)
create table if not exists services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('lodging', 'fooding', 'travel', 'sightseeing', 'party', 'other')),
  description text,
  price numeric,
  image_url text,
  status text default 'Active' check (status in ('Active', 'Disabled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Packages Table
create table if not exists packages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  items text[], -- Array of strings describing included items
  image_url text,
  number_of_days int default 1,
  number_of_nights int default 1,
  room_capacity int default 2,
  is_corporate boolean default false,
  is_wedding boolean default false,
  is_featured boolean default false,
  bed_count int default 1,
  status text default 'Active' check (status in ('Active', 'Disabled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reservations Table
create table if not exists reservations (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  hotel_id uuid references hotels(id),
  room_id uuid references rooms(id),
  check_in date not null,
  check_out date not null,
  status text default 'Pending' check (status in ('Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled')),
  total_amount numeric,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Staff Table
create table if not exists staff (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id), -- Link to Supabase Auth User
  hotel_id uuid references hotels(id),
  name text not null,
  role text not null check (role in ('Manager', 'Receptionist', 'Housekeeping', 'Other')),
  phone text,
  email text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Invoices Table (Metadata only)
create table if not exists invoices (
  id uuid default uuid_generate_v4() primary key,
  reservation_id uuid references reservations(id),
  invoice_number text unique not null,
  amount numeric not null,
  status text default 'Unpaid' check (status in ('Unpaid', 'Paid', 'Cancelled')),
  generated_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quotations/Inquiries Table
create table if not exists quotations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  dates text,
  message text,
  status text default 'New' check (status in ('New', 'Contacted', 'Converted', 'Closed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies
-- (Basic setup: Enable RLS, allow read for public for Catalog items, restricted write)

alter table hotels enable row level security;
alter table rooms enable row level security;
alter table services enable row level security;
alter table packages enable row level security;
alter table reservations enable row level security;
alter table staff enable row level security;
alter table invoices enable row level security;
alter table quotations enable row level security;

-- Public Read Access for Catalog
create policy "Public can view active hotels" on hotels for select using (status = 'Active');
create policy "Public can view active rooms" on rooms for select using (status = 'Available'); -- Or all for catalog purposes? Maybe all.
create policy "Public can view active services" on services for select using (status = 'Active');
create policy "Public can view active packages" on packages for select using (status = 'Active');

-- Admin/Staff Full Access (Assuming they have specific roles in auth.users or app_metadata)
-- For simplicity in this SQL, we'll allow authenticated users with specific emails or metadata to do everything.
-- In production, you'd use: (auth.jwt() -> 'app_metadata' ->> 'roles')::text[] ?| array['owner', 'staff']

-- For now, allowing all authenticated users (Owner/Staff) to view/edit everything
create policy "Staff can do everything on hotels" on hotels for all using (auth.role() = 'authenticated');
create policy "Staff can do everything on rooms" on rooms for all using (auth.role() = 'authenticated');
create policy "Staff can do everything on services" on services for all using (auth.role() = 'authenticated');
create policy "Staff can do everything on packages" on packages for all using (auth.role() = 'authenticated');
create policy "Staff can do everything on reservations" on reservations for all using (auth.role() = 'authenticated');
create policy "Staff can do everything on staff" on staff for all using (auth.role() = 'authenticated');
create policy "Staff can do everything on invoices" on invoices for all using (auth.role() = 'authenticated');
create policy "Staff can do everything on quotations" on quotations for all using (auth.role() = 'authenticated');

-- Public can insert Quotations (Inquiries)
create policy "Public can create quotations" on quotations for insert with check (true);
-- Settings Table (Singleton)
create table if not exists settings (
  id text primary key default 'default',
  site_name text,
  contact_email text,
  contact_phone text,
  address text,
  currency text check (currency in ('USD','EUR','JPY','GBP','INR')),
  logo_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table settings enable row level security;
create policy "Public can read settings" on settings for select using (true);
create policy "Staff can update settings" on settings for update using (auth.role() = 'authenticated');
create policy "Staff can insert settings" on settings for insert with check (auth.role() = 'authenticated');
