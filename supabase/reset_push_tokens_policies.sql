-- Ensure complete access for anonymous/authenticated users to push_tokens
-- Drop existing policies to avoid conflicts
drop policy if exists "Enable insert for everyone" on push_tokens;
drop policy if exists "Enable read for authenticated users" on push_tokens;
drop policy if exists "Enable update for everyone" on push_tokens;

-- Re-create policies with full permissions for the app's needs
create policy "Enable insert for everyone" on push_tokens 
  for insert with check (true);

create policy "Enable select for everyone" on push_tokens 
  for select using (true);

create policy "Enable update for everyone" on push_tokens 
  for update using (true) with check (true);

-- Optional: Allow delete if needed
create policy "Enable delete for everyone" on push_tokens 
  for delete using (true);
