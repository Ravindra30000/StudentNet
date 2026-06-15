-- Student Talent Network - MVP schema
-- Run this in the Supabase SQL editor.

-- ─────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  avatar_url text,
  college text,
  branch text,
  graduation_year smallint,
  bio text,
  role text not null default 'student'
    check (role in ('student', 'founder', 'community_leader', 'client')),
  github_url text,
  linkedin_url text,
  portfolio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on profiles (username);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────
-- Skills (master list) + profile_skills (join table)
-- ─────────────────────────────────────────────
create table if not exists skills (
  id bigint generated always as identity primary key,
  name text unique not null,
  category text
);

alter table skills enable row level security;

create policy "Skills are viewable by everyone"
  on skills for select
  using (true);

create table if not exists profile_skills (
  profile_id uuid not null references profiles(id) on delete cascade,
  skill_id bigint not null references skills(id) on delete cascade,
  verified boolean not null default false,
  verified_by text check (verified_by in ('college', 'community', 'mentor', 'project')),
  primary key (profile_id, skill_id)
);

alter table profile_skills enable row level security;

create policy "Profile skills are viewable by everyone"
  on profile_skills for select
  using (true);

create policy "Users can manage their own skills"
  on profile_skills for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ─────────────────────────────────────────────
-- Projects (portfolio showcase)
-- ─────────────────────────────────────────────
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  tech_stack text[] not null default '{}',
  demo_url text,
  github_url text,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on projects (owner_id);

alter table projects enable row level security;

create policy "Projects are viewable by everyone"
  on projects for select
  using (true);

create policy "Users can manage their own projects"
  on projects for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─────────────────────────────────────────────
-- updated_at trigger for profiles
-- ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────
-- Seed: common skills
-- ─────────────────────────────────────────────
insert into skills (name, category) values
  ('React', 'Web Development'),
  ('Next.js', 'Web Development'),
  ('Node.js', 'Web Development'),
  ('TypeScript', 'Web Development'),
  ('JavaScript', 'Web Development'),
  ('Python', 'AI/ML'),
  ('Machine Learning', 'AI/ML'),
  ('Deep Learning', 'AI/ML'),
  ('Flutter', 'App Development'),
  ('React Native', 'App Development'),
  ('Android (Kotlin)', 'App Development'),
  ('iOS (Swift)', 'App Development'),
  ('UI/UX Design', 'Design'),
  ('Graphic Design', 'Design'),
  ('Figma', 'Design'),
  ('Video Editing', 'Content'),
  ('Content Writing', 'Content'),
  ('Digital Marketing', 'Marketing'),
  ('SEO', 'Marketing'),
  ('Sales', 'Business'),
  ('Business Strategy', 'Business'),
  ('Data Analysis', 'AI/ML'),
  ('DevOps', 'Web Development'),
  ('Blockchain', 'Web Development')
on conflict (name) do nothing;
