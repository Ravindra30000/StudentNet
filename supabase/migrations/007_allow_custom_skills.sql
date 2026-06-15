-- Allow authenticated users to insert custom skills
create policy "Authenticated users can insert skills"
  on public.skills
  for insert
  to authenticated
  with check (true);
