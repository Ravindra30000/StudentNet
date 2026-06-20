import Link from "next/link";
import { Star, CheckCircle } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  founder: "Startup Founder",
  community_leader: "Community Leader",
  client: "Client",
};

export interface ProfileCardData {
  id: string;
  username: string;
  full_name: string;
  college: string | null;
  branch: string | null;
  graduation_year: number | null;
  company?: string | null;
  profession?: string | null;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  profile_skills: {
    verified: boolean;
    skills: {
      id: string | number;
      name: string;
      category: string | null;
    } | null;
  }[];
  services?: { id: string; is_active: boolean; price_inr?: number }[];
  startups?: { id: string }[];
  reviews?: { overall: number }[];
  min_service_price?: number | null;
}

interface ProfileCardProps {
  profile: ProfileCardData;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const isVerified = profile.profile_skills.some((ps) => ps.verified);
  
  const charSum = profile.full_name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Get real reviews and calculate rating
  const ratings = profile.reviews?.map((r) => Number(r.overall)) || [];
  const rating = ratings.length > 0
    ? (ratings.reduce((sum, val) => sum + val, 0) / ratings.length).toFixed(1)
    : null;

  // Get real availability status (active freelance service or active startup founder)
  const isAvailable = (profile.services?.some((s) => s.is_active) || (profile.startups && profile.startups.length > 0)) ?? false;

  // Filter out any skills that are null
  const validSkills = profile.profile_skills.filter((ps) => ps.skills !== null) as {
    verified: boolean;
    skills: {
      id: string | number;
      name: string;
      category: string | null;
    };
  }[];

  // Deterministic background gradient for initials avatar fallback
  const gradients = [
    "from-emerald-400 to-teal-600",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-red-600",
    "from-sky-400 to-blue-600",
    "from-violet-400 to-purple-600",
  ];
  const gradient = gradients[charSum % gradients.length];
  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/u/${profile.username}`}
      className="group bg-surface rounded-[28px] p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[300px] border border-border/20 relative"
    >
      <div>
        {/* Role Badge */}
        <div className="absolute top-6 right-6 font-heading text-[10px] tracking-wider font-extrabold text-accent-green uppercase bg-accent-green/5 px-2.5 py-1 rounded-full">
          {ROLE_LABELS[profile.role] ?? profile.role}
        </div>

        {/* Profile Avatar & Verification Badge */}
        <div className="relative w-14 h-14 mb-4">
          {profile.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.avatar_url}
              alt={`${profile.full_name} profile picture`}
              className="w-full h-full rounded-full object-cover border border-border/40"
            />
          ) : (
            <div className={`w-full h-full rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-heading font-extrabold text-lg`}>
              {initials}
            </div>
          )}
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5 shadow-sm">
              <CheckCircle className="text-success w-[18px] h-[18px] fill-success/10" />
            </div>
          )}
        </div>

        {/* Name and Basic Info */}
        <h3 className="font-heading text-xl font-bold text-ink mb-1 group-hover:text-accent-green transition-colors">
          {profile.full_name}
        </h3>
        <p className="text-xs text-muted font-medium mb-3">
          {profile.profession && profile.company
            ? `${profile.profession} at ${profile.company}`
            : profile.profession || profile.company
            ? profile.profession || profile.company
            : [profile.branch, profile.college].filter(Boolean).join(" · ")}
        </p>

        {/* Short Bio snippet */}
        {profile.bio && (
          <p className="text-sm text-ink/80 line-clamp-2 mb-6">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Footer Meta Row */}
      <div className="flex flex-col gap-4">
        {/* Skill Chips */}
        {validSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {validSkills.slice(0, 3).map(({ skills, verified }) => (
              <span
                key={skills.id}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                  verified
                    ? "bg-accent-green/5 border-accent-green/20 text-accent-green"
                    : "bg-surface-sunken border-border text-muted"
                }`}
              >
                {skills.name}
                {verified && <span className="w-1 h-1 rounded-full bg-accent-green" />}
              </span>
            ))}
            {validSkills.length > 3 && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-surface-sunken border border-border text-muted">
                +{validSkills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Rating and Availability */}
        {(rating !== null || isAvailable || (profile.min_service_price !== undefined && profile.min_service_price !== null)) && (
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              {rating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="text-accent-gold w-4 h-4 fill-accent-gold" />
                  <span className="font-heading text-sm font-bold text-ink">{rating} ({ratings.length})</span>
                </div>
              )}
              {profile.min_service_price !== undefined && profile.min_service_price !== null && (
                <div className="text-[11px] font-bold text-accent-green bg-accent-green/5 px-2 py-0.5 rounded-md border border-accent-green/10">
                  From ₹{profile.min_service_price.toLocaleString()}
                </div>
              )}
            </div>
            {isAvailable && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span className="text-xs text-muted font-semibold">Available</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
