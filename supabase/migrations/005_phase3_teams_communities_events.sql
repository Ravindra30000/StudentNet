-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'Member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, profile_id)
);

-- Alter projects table to support team link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='projects' AND column_name='team_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, profile_id)
);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, profile_id)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 1. Teams policies
CREATE POLICY "teams readable by everyone" ON teams
  FOR SELECT USING (true);

CREATE POLICY "teams writeable by creator" ON teams
  FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- 2. Team members policies
CREATE POLICY "team_members readable by everyone" ON team_members
  FOR SELECT USING (true);

CREATE POLICY "team_members writeable by team creator" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()
    )
  );

-- 3. Communities policies
CREATE POLICY "communities readable by everyone" ON communities
  FOR SELECT USING (true);

CREATE POLICY "communities writeable by leader" ON communities
  FOR ALL USING (auth.uid() = leader_id) WITH CHECK (auth.uid() = leader_id);

-- 4. Community members policies
CREATE POLICY "community_members readable by everyone" ON community_members
  FOR SELECT USING (true);

CREATE POLICY "community_members writeable by leader" ON community_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id AND communities.leader_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id AND communities.leader_id = auth.uid()
    )
  );

CREATE POLICY "community_members joinable by self" ON community_members
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "community_members leavable by self" ON community_members
  FOR DELETE USING (auth.uid() = profile_id);

-- 5. Community posts policies
CREATE POLICY "community_posts readable by everyone" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "community_posts insertable by members" ON community_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_posts.community_id AND community_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "community_posts writeable by author" ON community_posts
  FOR ALL USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- 6. Events policies
CREATE POLICY "events readable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "events writeable by leader of parent community" ON events
  FOR ALL USING (
    community_id IS NULL OR
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = events.community_id AND communities.leader_id = auth.uid()
    )
  ) WITH CHECK (
    community_id IS NULL OR
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = events.community_id AND communities.leader_id = auth.uid()
    )
  );

-- 7. Event registrations policies
CREATE POLICY "event_registrations readable by everyone" ON event_registrations
  FOR SELECT USING (true);

CREATE POLICY "event_registrations insertable by self" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "event_registrations deletable by self" ON event_registrations
  FOR DELETE USING (auth.uid() = profile_id);
