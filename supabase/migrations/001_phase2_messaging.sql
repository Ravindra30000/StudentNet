-- Create conversations table
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Create conversation participants table
create table if not exists conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  primary key (conversation_id, profile_id)
);

-- Create messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- Indexes for performance
create index if not exists conversation_participants_profile_id_idx on conversation_participants (profile_id);
create index if not exists messages_conversation_id_idx on messages (conversation_id);
create index if not exists messages_created_at_idx on messages (created_at);

-- Enable RLS
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

-- Drop existing policies if they exist (safe re-run)
drop policy if exists "Users can view conversations they are part of" on conversations;
drop policy if exists "Users can insert conversations" on conversations;
drop policy if exists "Users can view participants of their conversations" on conversation_participants;
drop policy if exists "Users can add participants to conversations" on conversation_participants;
drop policy if exists "Users can view messages in their conversations" on messages;
drop policy if exists "Users can insert messages in their conversations" on messages;
drop policy if exists "Users can update messages in their conversations" on messages;

-- conversations policies
create policy "Users can view conversations they are part of"
  on conversations for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = conversations.id
      and profile_id = auth.uid()
    )
  );

create policy "Users can insert conversations"
  on conversations for insert
  with check (auth.uid() is not null);

-- conversation_participants policies
create policy "Users can view participants of their conversations"
  on conversation_participants for select
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.profile_id = auth.uid()
    )
  );

create policy "Users can add participants to conversations"
  on conversation_participants for insert
  with check (auth.uid() is not null);

-- messages policies
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id
      and profile_id = auth.uid()
    )
  );

create policy "Users can insert messages in their conversations"
  on messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id
      and profile_id = auth.uid()
    )
  );

create policy "Users can update messages in their conversations"
  on messages for update
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id
      and profile_id = auth.uid()
    )
  );

-- Enable Realtime for messages table
alter table messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end;
$$;
