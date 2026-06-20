export type Role = "student" | "founder" | "community_leader" | "client";

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  college: string | null;
  branch: string | null;
  graduation_year: number | null;
  bio: string | null;
  role: Role;
  company: string | null;
  profession: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string | null;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  demo_url: string | null;
  github_url: string | null;
  cover_image_url: string | null;
  project_images?: string[] | null;
  video_url?: string | null;
  team_id?: string | null;
  created_at: string;
}

export interface ProfileWithSkills extends Profile {
  skills: Skill[];
}

export interface Service {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: string;
  price_inr: number;
  delivery_days: number;
  delivery_label?: string | null;
  is_active: boolean;
  created_at: string;
  profiles?: Profile;
}

export type OrderStatus = "requested" | "accepted" | "in_progress" | "delivered" | "completed" | "cancelled" | "disputed";

export interface Order {
  id: string;
  service_id: string;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus;
  price_inr: number;
  created_at: string;
  updated_at: string;
  services?: Service;
  buyer?: Profile;
  seller?: Profile;
}

export interface Review {
  id: string;
  order_id: string | null;
  reviewer_id: string;
  reviewee_id: string;
  communication: number;
  delivery: number;
  technical_skill: number;
  professionalism: number;
  overall: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
}

export interface Startup {
  id: string;
  slug: string;
  founder_id: string;
  name: string;
  idea: string;
  industry: string;
  stage: 'Idea' | 'MVP' | 'Funded';
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  founder?: Profile;
}

export interface StartupRole {
  id: string;
  startup_id: string;
  title: string;
  skills_required: string[];
  commitment: 'Full-time' | 'Part-time';
  equity_offered: string | null;
  created_at: string;
}

export interface StartupApplication {
  id: string;
  role_id: string;
  applicant_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  role?: StartupRole;
  applicant?: Profile;
}

export interface Team {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  profile_id: string;
  role: string;
  joined_at: string;
  profile?: Profile;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  leader_id: string;
  created_at: string;
  leader?: Profile;
  _count?: {
    community_members: number;
  };
}

export interface CommunityMember {
  community_id: string;
  profile_id: string;
  role: 'leader' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface CommunityPost {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile;
}

export interface Event {
  id: string;
  slug: string;
  community_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  is_online: boolean;
  created_at: string;
  community?: Community;
}

export interface EventRegistration {
  event_id: string;
  profile_id: string;
  registered_at: string;
  profile?: Profile;
}

