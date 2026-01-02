-- Create table for storing push tokens
create table if not exists push_tokens (
  id uuid default uuid_generate_v4() primary key,
  token text not null unique,
  platform text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table push_tokens enable row level security;

-- Allow anyone to insert their token
create policy "Enable insert for everyone" on push_tokens 
  for insert with check (true);

-- Allow authenticated users (staff) to read tokens
create policy "Enable read for authenticated users" on push_tokens 
  for select using (auth.role() = 'authenticated');
