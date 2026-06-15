-- Create security definer function to check conversation participation
create or replace function public.is_conversation_participant(conv_id uuid, prof_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = conv_id
      and profile_id = prof_id
  );
$$ language sql security definer;

-- Drop existing policies
drop policy if exists "Users can view conversations they are part of" on conversations;
drop policy if exists "Users can view participants of their conversations" on conversation_participants;
drop policy if exists "Users can view messages in their conversations" on messages;
drop policy if exists "Users can insert messages in their conversations" on messages;
drop policy if exists "Users can update messages in their conversations" on messages;

-- Re-create conversations policies using the security definer function
create policy "Users can view conversations they are part of"
  on conversations for select
  using (
    public.is_conversation_participant(id, auth.uid())
  );

-- Re-create conversation_participants policies using the security definer function
create policy "Users can view participants of their conversations"
  on conversation_participants for select
  using (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

-- Re-create messages policies using the security definer function
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

create policy "Users can insert messages in their conversations"
  on messages for insert
  with check (
    sender_id = auth.uid() and
    public.is_conversation_participant(conversation_id, auth.uid())
  );

create policy "Users can update messages in their conversations"
  on messages for update
  using (
    public.is_conversation_participant(conversation_id, auth.uid())
  );
