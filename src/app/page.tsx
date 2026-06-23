import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ProfileCard, { ProfileCardData } from "@/components/discover/profile-card";
import ProjectCard from "@/components/profile/project-card";
import ServiceCard from "@/components/services/service-card";
import ServiceSearchBar from "@/components/home/service-search-bar";
import Footer from "@/components/layout/footer";
import {
  ArrowRight,
  Code,
  Smartphone,
  Brain,
  Video,
  FileText,
  Palette,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase
} from "lucide-react";
import {
  getCommunityRelevanceScore,
  getProjectRelevanceScore,
  getStartupRelevanceScore
} from "@/lib/recommendations";
import JoinCommunityButton, { CommunityMemberCount } from "@/components/communities/join-community-button";

const HOME_CATEGORIES = [
  { name: "Web Development", icon: Code, color: "bg-emerald-500/10 text-emerald-600" },
  { name: "App Design", icon: Smartphone, color: "bg-blue-500/10 text-blue-600" },
  { name: "AI/ML", icon: Brain, color: "bg-purple-500/10 text-purple-600" },
  { name: "Video Editing", icon: Video, color: "bg-rose-500/10 text-rose-600" },
  { name: "Content Writing", icon: FileText, color: "bg-amber-500/10 text-amber-600" },
  { name: "UI/UX Design", icon: Palette, color: "bg-teal-500/10 text-teal-600" },
];

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUserProfile: {
    id: string;
    college: string | null;
    branch: string | null;
    skills: string[];
    profile_skills: {
      skills: {
        name: string;
        category?: string | null;
      } | null;
    }[];
  } | null = null;

  if (user) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select(`
        id,
        college,
        branch,
        profile_skills (
          skills (
            name,
            category
          )
        )
      `)
      .eq("id", user.id)
      .maybeSingle();

    if (userProfile) {
      const skillsParsed = (((userProfile.profile_skills as unknown as {
        skills: { name: string; category?: string | null } | { name: string; category?: string | null }[] | null;
      }[]) || [])).map((ps) => {
        const s = Array.isArray(ps.skills) ? ps.skills[0] : ps.skills;
        return {
          name: s?.name || "",
          category: s?.category || null
        };
      }).filter((s) => s.name);

      currentUserProfile = {
        id: userProfile.id,
        college: userProfile.college,
        branch: userProfile.branch,
        skills: skillsParsed.map((s) => s.name),
        profile_skills: skillsParsed.map((s) => ({
          skills: { name: s.name, category: s.category }
        }))
      };
    }
  }

  // 1. Fetch featured builders (role = 'student')
  const { data: dbProfiles } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      college,
      branch,
      graduation_year,
      company,
      profession,
      role,
      bio,
      profile_skills (
        verified,
        skills (
          id,
          name,
          category
        )
      ),
      services (
        id,
        is_active,
        price_inr
      ),
      startups (
        id
      ),
      reviews:reviews!reviewee_id (
        overall
      )
    `)
    .eq("role", "student")
    .limit(20);

  interface BuilderCandidate {
    id: string;
    college: string | null;
    branch: string | null;
    profile_skills?: {
      skills?: { name: string } | { name: string }[] | null;
    }[] | null;
  }

  // Scoring function
  const getBuilderRecommendationScore = (builder: BuilderCandidate) => {
    if (!currentUserProfile) return 0;
    if (builder.id === currentUserProfile.id) return -100;

    let score = 0;
    if (currentUserProfile.college && builder.college && currentUserProfile.college.toLowerCase() === builder.college.toLowerCase()) {
      score += 5;
    }
    if (currentUserProfile.branch && builder.branch && currentUserProfile.branch.toLowerCase() === builder.branch.toLowerCase()) {
      score += 3;
    }

    const builderSkills = ((builder.profile_skills || []) as unknown as {
      skills?: { name: string } | { name: string }[] | null;
    }[]).map((ps) => {
      const s = Array.isArray(ps.skills) ? ps.skills[0] : ps.skills;
      return s?.name || "";
    }).filter(Boolean);

    const matchedSkillsCount = builderSkills.filter((s: string) => 
      currentUserProfile?.skills.some((us: string) => us.toLowerCase() === s.toLowerCase())
    ).length;

    score += matchedSkillsCount * 2;

    // Stable hash tiebreaker based on builder.id
    let hash = 0;
    for (let i = 0; i < builder.id.length; i++) {
      hash = builder.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const tiebreaker = (Math.abs(hash) % 100) / 1000;

    return score + tiebreaker;
  };

  const candidateBuilders = ((dbProfiles as unknown as (ProfileCardData & BuilderCandidate)[]) ?? []).map((p) => {
    const activeServices = (p.services ?? []).filter((s) => s.is_active);
    const min_service_price = activeServices.length > 0
      ? Math.min(...activeServices.map((s) => s.price_inr ?? 0))
      : null;
    const score = getBuilderRecommendationScore(p);
    return {
      ...p,
      min_service_price,
      score,
    };
  });

  // Sort by recommendation score (descending) and select top 4
  const featuredBuilders = candidateBuilders
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // 2. Fetch featured projects
  const { data: dbProjects } = await supabase
    .from("projects")
    .select(`
      id,
      title,
      description,
      tech_stack,
      cover_image_url,
      project_images,
      video_url,
      demo_url,
      github_url,
      owner_id,
      owner:profiles!owner_id (
        username,
        full_name,
        avatar_url,
        college,
        branch
      )
    `);

  interface RawProjectOwner {
    username: string;
    full_name: string;
    avatar_url: string | null;
    college: string | null;
    branch: string | null;
  }

  interface RawProject {
    id: string;
    title: string;
    description: string | null;
    tech_stack: string[] | null;
    cover_image_url: string | null;
    project_images: string[] | null;
    video_url: string | null;
    demo_url: string | null;
    github_url: string | null;
    owner_id: string;
    owner: RawProjectOwner | null;
  }

  const mappedProjects = ((dbProjects as unknown as RawProject[]) || []).map((project) => {
    const techStack = project.tech_stack || [];
    const ownerData = project.owner ? {
      username: project.owner.username,
      full_name: project.owner.full_name,
      avatar_url: project.owner.avatar_url,
      college: project.owner.college,
    } : null;

    const projectForRelevance = {
      id: project.id,
      owner_id: project.owner_id,
      tech_stack: techStack,
      owner: project.owner ? {
        branch: project.owner.branch,
        college: project.owner.college
      } : null
    };

    const score = getProjectRelevanceScore(currentUserProfile, projectForRelevance);

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      techStack,
      coverImageUrl: project.cover_image_url,
      projectImages: project.project_images,
      videoUrl: project.video_url,
      demoUrl: project.demo_url,
      githubUrl: project.github_url,
      score,
      owner: ownerData,
    };
  });

  const featuredProjects = mappedProjects
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // 2b. Fetch communities
  const { data: dbCommunities } = await supabase
    .from("communities")
    .select(`
      id,
      name,
      description,
      slug,
      cover_image_url,
      community_members (
        profile_id
      )
    `);

  interface DbCommunityMember {
    profile_id: string;
  }

  interface DbCommunity {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    cover_image_url: string | null;
    community_members: DbCommunityMember[] | null;
  }

  const recommendedCommunities = ((dbCommunities as unknown as DbCommunity[]) ?? []).map((c) => {
    const score = getCommunityRelevanceScore(currentUserProfile, {
      id: c.id,
      name: c.name,
      description: c.description
    });

    const membersCount = c.community_members?.length ?? 0;
    const isJoined = currentUserProfile 
      ? (c.community_members ?? []).some((m) => m.profile_id === currentUserProfile?.id)
      : false;

    return {
      id: c.id,
      name: c.name,
      description: c.description,
      slug: c.slug,
      cover_image_url: c.cover_image_url,
      membersCount,
      isJoined,
      score
    };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);

  // 2c. Fetch startups
  const { data: dbStartups } = await supabase
    .from("startups")
    .select(`
      id,
      slug,
      name,
      idea,
      industry,
      stage,
      logo_url,
      startup_roles (
        id,
        title,
        skills_required,
        commitment,
        equity_offered
      )
    `);

  interface DbStartupRole {
    id: string;
    title: string;
    skills_required: string[];
    commitment: string;
    equity_offered: string | null;
  }

  interface DbStartup {
    id: string;
    slug: string;
    name: string;
    idea: string;
    industry: string;
    stage: string;
    logo_url: string | null;
    startup_roles: DbStartupRole[] | null;
  }

  const recommendedStartups = ((dbStartups as unknown as DbStartup[]) ?? []).map((s) => {
    const score = getStartupRelevanceScore(currentUserProfile, {
      id: s.id,
      industry: s.industry,
      startup_roles: s.startup_roles
    });

    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      idea: s.idea,
      industry: s.industry,
      stage: s.stage,
      logo_url: s.logo_url,
      roles: s.startup_roles || [],
      score
    };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);

  // 3. Fetch active service counts by category
  const { data: categoryCounts } = await supabase
    .from("services")
    .select("category")
    .eq("is_active", true);

  const counts: Record<string, number> = {};
  (categoryCounts ?? []).forEach((s) => {
    counts[s.category] = (counts[s.category] || 0) + 1;
  });

  // 4. Fetch and compute Featured Services (weighted by reviews & rating)
  const { data: rawFeaturedServices } = await supabase
    .from("services")
    .select(`
      id,
      title,
      description,
      category,
      price_inr,
      delivery_days,
      created_at,
      is_active,
      owner:profiles!owner_id (
        id,
        username,
        full_name,
        avatar_url,
        college,
        reviews:reviews!reviewee_id(overall)
      )
    `)
    .eq("is_active", true);

  interface RawServiceOwner {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    college: string | null;
    reviews: { overall: number }[] | null;
  }

  interface RawService {
    id: string;
    title: string;
    description: string | null;
    category: string;
    price_inr: number;
    delivery_days: number;
    created_at: string;
    is_active: boolean;
    owner: RawServiceOwner | null;
  }

  const featuredServices = ((rawFeaturedServices as unknown as RawService[]) ?? []).map((s) => {
    const ratings = (s.owner?.reviews ?? []).map((r) => Number(r.overall));
    const avg_rating = ratings.length > 0
      ? ratings.reduce((sum: number, val: number) => sum + val, 0) / ratings.length
      : null;
    const score = ratings.length * (avg_rating ?? 0);
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      price_inr: s.price_inr,
      delivery_days: s.delivery_days,
      created_at: s.created_at,
      score,
      owner: {
        id: s.owner?.id ?? "",
        username: s.owner?.username ?? "",
        full_name: s.owner?.full_name ?? "",
        avatar_url: s.owner?.avatar_url ?? null,
        college: s.owner?.college ?? null,
        avg_rating,
        review_count: ratings.length,
      }
    };
  })
  .sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })
  .slice(0, 8);

  // 5. Fetch and compute Trending Services (sorted by recent/overall order counts)
  const { data: rawTrendingServices } = await supabase
    .from("services")
    .select(`
      id,
      title,
      description,
      category,
      price_inr,
      delivery_days,
      created_at,
      is_active,
      owner:profiles!owner_id (
        id,
        username,
        full_name,
        avatar_url,
        college,
        reviews:reviews!reviewee_id(overall)
      ),
      orders (
        id,
        created_at
      )
    `)
    .eq("is_active", true);

  interface RawOrder {
    id: string;
    created_at: string;
  }

  interface RawTrendingService {
    id: string;
    title: string;
    description: string | null;
    category: string;
    price_inr: number;
    delivery_days: number;
    created_at: string;
    is_active: boolean;
    owner: RawServiceOwner | null;
    orders: RawOrder[] | null;
  }

  const trendingServices = ((rawTrendingServices as unknown as RawTrendingService[]) ?? []).map((s) => {
    const ratings = (s.owner?.reviews ?? []).map((r) => Number(r.overall));
    const avg_rating = ratings.length > 0
      ? ratings.reduce((sum: number, val: number) => sum + val, 0) / ratings.length
      : null;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = (s.orders ?? []).filter((o) => new Date(o.created_at) >= sevenDaysAgo).length;
    const totalOrders = (s.orders ?? []).length;
    
    const trendScore = recentOrders * 3 + totalOrders;
    
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      price_inr: s.price_inr,
      delivery_days: s.delivery_days,
      trendScore,
      owner: {
        id: s.owner?.id ?? "",
        username: s.owner?.username ?? "",
        full_name: s.owner?.full_name ?? "",
        avatar_url: s.owner?.avatar_url ?? null,
        college: s.owner?.college ?? null,
        avg_rating,
        review_count: ratings.length,
      }
    };
  })
  .sort((a, b) => b.trendScore - a.trendScore)
  .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pt-32 pb-20 lg:grid-cols-2 lg:pt-40 items-center">
        <div className="flex flex-col gap-6">
          <h1 className="font-heading text-5xl font-extrabold tracking-tight text-ink sm:text-6xl md:text-7xl leading-[1.05]">
            Where students build careers before graduation.
          </h1>
          <p className="text-lg text-muted max-w-xl leading-relaxed">
            The elite network for India&apos;s next generation of builders. Showcase your projects,
            connect with startups, and launch your career.
          </p>
          
          {/* Services Search Bar */}
          <div className="mt-2">
            <ServiceSearchBar />
          </div>
        </div>

        <div className="relative">
          <div className="bg-[#FDFBF7] p-6 rounded-[28px] shadow-card border border-border/30">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px]">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpFmiBQUPIPCbZ3UkVS3V3jxhFPXH5Yh6P6iXBAcECpenYzd6LSzOIj5Qa22HUY3RlO4X1oFf8x4ZE6J1a1I-lni22FNpzdUq6wOXjvdtkEs-heytybfogNExcthfRO4olN1NuSIsmd40i7ybr_P1X81RX3Ce4zxYUa_wM8UXv3lJAwRCWVwemYU9qcbZge9lBczAlFDJq-c1df8GIwdWEAFsLSgfYuERd0xkO9MITLVDP1XNvPQjgofCPUmlku4WEIwWKZza9y3E"
                alt="Young Indian students collaborating in a modern campus setting"
                fill
                priority
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Landing Tiles Section */}
      <section className="mx-auto w-full max-w-6xl px-6 mb-24">
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold text-ink">
            Browse services by category
          </h2>
          <p className="text-sm text-muted mt-1">
            Explore quality offerings delivered by top student professionals.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {HOME_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const activeCount = counts[cat.name] || 0;
            return (
              <Link
                key={cat.name}
                href={`/services?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center text-center p-5 bg-surface hover:bg-surface-sunken border border-border/40 hover:-translate-y-1 transition-all duration-300 rounded-2xl group shadow-sm hover:shadow-card-hover"
              >
                <div className={`p-4 rounded-full ${cat.color} mb-4 transition-transform group-hover:scale-110`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-sm font-bold text-ink leading-tight group-hover:text-accent-green transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-muted font-medium mt-1">
                  {activeCount} {activeCount === 1 ? "service" : "services"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Services & Trending Sidebar Area */}
      <section className="mx-auto w-full max-w-6xl px-6 mb-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Featured Services (2 cols span) */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-ink flex items-center gap-2">
                <Sparkles className="w-5.5 h-5.5 text-accent-gold fill-accent-gold" />
                Featured services
              </h2>
              <p className="text-sm text-muted mt-1">
                Highest-rated freelance services and gigs this week.
              </p>
            </div>
            <Link
              href="/students?mode=services"
              className="text-sm font-semibold text-accent-green hover:underline flex items-center gap-1 transition-all shrink-0"
            >
              <span>Explore all</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredServices.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border/40 p-12 text-center text-muted">
              No services found. Get started by listing your service.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} currentUserId={user?.id} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Trending Sidebar */}
        <div className="lg:col-span-1">
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold text-ink flex items-center gap-2">
              <TrendingUp className="w-5.5 h-5.5 text-accent-green" />
              Trending Gigs
            </h2>
            <p className="text-sm text-muted mt-1">
              Gigs with the highest order volume recently.
            </p>
          </div>

          {trendingServices.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border/40 p-12 text-center text-muted">
              No trending gigs this week.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {trendingServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  variant="compact"
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Builders Section */}
      <section className="mx-auto w-full max-w-6xl px-6 mb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-ink">
              Featured builders
            </h2>
            <p className="text-sm text-muted mt-1">
              Top student talent and active contributors in the community.
            </p>
          </div>
          <Link
            href="/students"
            className="text-sm font-semibold text-accent-green hover:underline flex items-center gap-1 transition-all shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBuilders.map((builder) => (
            <ProfileCard key={builder.username} profile={builder} />
          ))}
        </div>
      </section>

      {/* Recommended Communities Section */}
      {recommendedCommunities.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 mb-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-ink flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-accent-green" />
                Recommended communities
              </h2>
              <p className="text-sm text-muted mt-1">
                Colleges, clubs, and interest groups matched with your profile.
              </p>
            </div>
            <Link
              href="/communities"
              className="text-sm font-semibold text-accent-green hover:underline flex items-center gap-1 transition-all shrink-0"
            >
              <span>Explore all</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedCommunities.map((community) => (
              <div
                key={community.id}
                className="bg-surface rounded-2xl border border-border/40 p-6 flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 relative overflow-hidden"
              >
                {/* Visual Cover/Color header inside the card */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-accent-green/60 to-ink/40" />
                
                <div className="pt-2">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-heading text-lg font-bold text-ink hover:text-accent-green transition-colors truncate">
                      <Link href={`/communities/${community.slug}`}>
                        {community.name}
                      </Link>
                    </h3>
                  </div>
                  <p className="text-sm text-muted line-clamp-2 mb-6 min-h-[40px]">
                    {community.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 mt-auto pt-4 border-t border-border/10">
                  <span className="text-xs text-muted font-medium flex items-center gap-1.5 shrink-0">
                    <CommunityMemberCount initialCount={community.membersCount} communityId={community.id} />
                  </span>
                  
                  <div className="shrink-0 relative z-10">
                    <JoinCommunityButton
                      communityId={community.id}
                      initialIsJoined={community.isJoined}
                      communityName={community.name}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Startups Section */}
      {recommendedStartups.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 mb-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-ink flex items-center gap-2">
                <Briefcase className="w-5.5 h-5.5 text-accent-gold" />
                Recommended startups & roles
              </h2>
              <p className="text-sm text-muted mt-1">
                Exciting student-led ventures looking for co-founders and team members.
              </p>
            </div>
            <Link
              href="/startups"
              className="text-sm font-semibold text-accent-green hover:underline flex items-center gap-1 transition-all shrink-0"
            >
              <span>Explore all</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedStartups.map((startup) => (
              <div
                key={startup.id}
                className="bg-surface rounded-2xl border border-border/40 p-6 flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {startup.logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={startup.logo_url}
                        alt={startup.name}
                        className="w-12 h-12 rounded-xl object-cover border border-border/40 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold/20 to-accent-green/20 flex items-center justify-center font-heading font-bold text-lg text-ink">
                        {startup.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-heading text-base font-bold text-ink hover:text-accent-green transition-colors truncate">
                        <Link href={`/startups/${startup.slug}`}>
                          {startup.name}
                        </Link>
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                        {startup.stage}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted line-clamp-2 mb-4">
                    {startup.idea}
                  </p>

                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
                      Industry
                    </span>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-sunken border border-border/20 text-ink">
                      {startup.industry}
                    </span>
                  </div>
                </div>

                {/* Open roles inside the card */}
                <div className="pt-4 border-t border-border/10 mt-auto">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
                    Open Roles ({startup.roles.length})
                  </span>
                  {startup.roles.length === 0 ? (
                    <p className="text-xs text-muted italic">No open roles currently.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {startup.roles.slice(0, 3).map((role) => (
                        <Link
                          key={role.id}
                          href={`/startups/${startup.slug}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-green/5 hover:bg-accent-green/10 border border-accent-green/15 text-accent-green transition-all animate-fade-in"
                        >
                          <span>{role.title}</span>
                          {role.equity_offered && (
                            <span className="text-[10px] opacity-75 font-semibold">
                              ({role.equity_offered})
                            </span>
                          )}
                        </Link>
                      ))}
                      {startup.roles.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold bg-surface-sunken text-muted">
                          +{startup.roles.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 mb-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-ink">
                Featured projects
              </h2>
              <p className="text-sm text-muted mt-1">
                Innovative products and startups created by students.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-sm font-semibold text-accent-green hover:underline flex items-center gap-1 transition-all shrink-0"
            >
              <span>Explore all</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProjects.map((project, idx) => (
              <div
                key={project.id}
                className={`${
                  idx >= 2 ? "hidden sm:block" : ""
                } ${
                  idx >= 3 ? "sm:hidden xl:block" : ""
                }`}
              >
                <ProjectCard {...project} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
