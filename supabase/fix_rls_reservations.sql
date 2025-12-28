-- Enable RLS for reservations table (if not already enabled)
alter table reservations enable row level security;

-- Policy to allow anonymous users (anyone) to insert new reservations
create policy "Allow public to create reservations"
on reservations for insert
to anon
with check (true);

-- Policy to allow authenticated staff/admins to view all reservations
create policy "Allow staff to view all reservations"
on reservations for select
to authenticated
using (true);

-- Policy to allow authenticated staff/admins to update reservations
create policy "Allow staff to update reservations"
on reservations for update
to authenticated
using (true);

-- Policy to allow authenticated staff/admins to delete reservations
create policy "Allow staff to delete reservations"
on reservations for delete
to authenticated
using (true);
