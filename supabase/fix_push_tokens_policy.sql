-- Enable UPDATE for everyone on push_tokens table
-- This is necessary because we use upsert(), which requires UPDATE permissions if the row exists.
create policy "Enable update for everyone" on push_tokens 
  for update using (true) with check (true);
