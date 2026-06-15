-- Create startups table
CREATE TABLE IF NOT EXISTS startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  founder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  idea TEXT NOT NULL,
  industry TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Idea', 'MVP', 'Funded')),
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create startup_roles table
CREATE TABLE IF NOT EXISTS startup_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  skills_required TEXT[] NOT NULL DEFAULT '{}',
  commitment TEXT NOT NULL CHECK (commitment IN ('Full-time', 'Part-time')),
  equity_offered TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create startup_applications table
CREATE TABLE IF NOT EXISTS startup_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES startup_roles(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, applicant_id)
);

-- Enable RLS
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_applications ENABLE ROW LEVEL SECURITY;

-- startups policies
CREATE POLICY "startups readable by everyone" ON startups
  FOR SELECT USING (true);

CREATE POLICY "startups writeable by founder" ON startups
  FOR ALL USING (auth.uid() = founder_id) WITH CHECK (auth.uid() = founder_id);

-- startup_roles policies
CREATE POLICY "startup_roles readable by everyone" ON startup_roles
  FOR SELECT USING (true);

CREATE POLICY "startup_roles writeable by founder" ON startup_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM startups
      WHERE startups.id = startup_roles.startup_id AND startups.founder_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM startups
      WHERE startups.id = startup_roles.startup_id AND startups.founder_id = auth.uid()
    )
  );

-- startup_applications policies
CREATE POLICY "startup_applications readable by applicant and founder" ON startup_applications
  FOR SELECT USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM startup_roles
      JOIN startups ON startups.id = startup_roles.startup_id
      WHERE startup_roles.id = startup_applications.role_id AND startups.founder_id = auth.uid()
    )
  );

CREATE POLICY "startup_applications insertable by applicant" ON startup_applications
  FOR INSERT WITH CHECK (
    auth.uid() = applicant_id AND
    NOT EXISTS (
      -- Don't allow founders to apply to their own startups
      SELECT 1 FROM startup_roles
      JOIN startups ON startups.id = startup_roles.startup_id
      WHERE startup_roles.id = startup_applications.role_id AND startups.founder_id = auth.uid()
    )
  );

-- Add delete policy for startup applications (applicants can cancel applications)
CREATE POLICY "startup_applications deletable by applicant" ON startup_applications
  FOR DELETE USING (auth.uid() = applicant_id);

CREATE POLICY "startup_applications updateable by founder" ON startup_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM startup_roles
      JOIN startups ON startups.id = startup_roles.startup_id
      WHERE startup_roles.id = startup_applications.role_id AND startups.founder_id = auth.uid()
    )
  );
