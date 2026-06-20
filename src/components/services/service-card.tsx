import Link from "next/link";
import { Star } from "lucide-react";

export interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description?: string | null;
    category: string;
    price_inr: number;
    delivery_days: number;
    delivery_label?: string | null;
    owner: {
      username: string;
      full_name: string;
      avatar_url: string | null;
      college: string | null;
      avg_rating: number | null;
      review_count: number;
    };
  };
  variant?: "grid" | "compact";
  isOwner?: boolean;
  searchTerm?: string;
}

function HighlightMatch({ text, term }: { text: string; term?: string }) {
  if (!term || !term.trim()) return <>{text}</>;
  
  // Clean up special characters from term for regex safety
  const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(${escapedTerm})`, "gi");
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-[#F5B83D]/30 text-inherit font-inherit">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function ServiceCard({ service, variant = "grid", searchTerm }: ServiceCardProps) {
  // Deterministic gradient classes based on category initials
  const initials = service.category
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "from-accent-green to-ink",
    "from-ink to-muted",
    "from-accent-green to-muted",
    "from-muted to-accent-green",
  ];
  const charCodeSum = service.category
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradientClasses = colors[Math.abs(charCodeSum) % colors.length];

  const sellerInitials = service.owner.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarGradient = colors[Math.abs(service.owner.full_name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length];

  if (variant === "compact") {
    return (
      <Link href={`/services/${service.id}`} className="block group">
        <div className="h-[60px] flex items-center gap-3 bg-surface p-2 rounded-xl border border-border/30 hover:bg-surface-sunken hover:shadow-sm transition-all duration-200">
          {/* Avatar Left */}
          {service.owner.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={service.owner.avatar_url}
              alt={service.owner.full_name}
              className="w-10 h-10 rounded-full object-cover border border-border/50 shrink-0"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
              {sellerInitials}
            </div>
          )}
          
          {/* Content Right */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-heading text-xs font-bold text-ink truncate group-hover:text-accent-green transition-colors">
                <HighlightMatch text={service.title} term={searchTerm} />
              </h4>
              {service.owner.avg_rating ? (
                <div className="flex items-center gap-0.5 text-accent-gold shrink-0">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-[11px] font-bold">{Number(service.owner.avg_rating).toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-[10px] bg-surface-sunken text-muted px-1.5 py-0.5 rounded-full shrink-0 font-medium">New</span>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted truncate">
                {service.category}
              </span>
              <span className="text-xs font-bold text-ink shrink-0">
                From ₹{service.price_inr.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/services/${service.id}`}
      className="group bg-surface rounded-[20px] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden border border-border/20 relative"
    >
      {/* Cover Image/Gradient Area */}
      <div className="relative z-0 aspect-[16/9] w-full overflow-hidden bg-surface-sunken">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses} flex items-center justify-center`}>
          <span className="font-heading font-extrabold text-white/20 text-5xl tracking-wider select-none">
            {initials}
          </span>
        </div>
        
        {/* Delivery Days Badge (Top Right) */}
        <span className="absolute top-4 right-4 bg-ink text-white font-sans text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm max-w-[80%] truncate">
          {service.delivery_days}d delivery {service.delivery_label ? `(${service.delivery_label})` : ""}
        </span>
      </div>

      {/* Seller Header Row (Avatar overlap) */}
      <div className="px-6 relative z-10 flex items-start gap-3">
        <div className="-mt-5 shrink-0">
          {service.owner.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={service.owner.avatar_url}
              alt={service.owner.full_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-surface shadow-sm"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} border-2 border-surface flex items-center justify-center text-white font-heading font-bold text-xs shadow-sm`}>
              {sellerInitials}
            </div>
          )}
        </div>
        <div className="min-w-0 pt-1">
          <p className="font-sans text-sm font-bold text-ink truncate">
            {service.owner.full_name}
          </p>
          <p className="font-sans text-[11px] text-muted truncate">
            {service.owner.college || "StudentNet Builder"}
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 pt-4 pb-6 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <h3 className="font-heading text-base font-bold text-ink leading-snug line-clamp-2 group-hover:text-accent-green transition-colors">
            <HighlightMatch text={service.title} term={searchTerm} />
          </h3>
          
          {/* Category Chip */}
          <span className="inline-block bg-surface-sunken text-muted text-xs font-semibold px-3 py-1 rounded-full border border-border/30">
            {service.category}
          </span>
        </div>

        {/* Footer Rating/Pricing Row */}
        <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted font-medium uppercase tracking-wider">Starting at</span>
            <span className="font-heading text-base font-extrabold text-ink">
              ₹{service.price_inr.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center">
            {service.owner.avg_rating ? (
              <div className="flex items-center gap-1">
                <Star className="text-accent-gold w-4 h-4 fill-accent-gold" />
                <span className="font-heading text-sm font-bold text-ink">
                  {Number(service.owner.avg_rating).toFixed(1)}
                </span>
                <span className="text-xs text-muted font-normal">
                  ({service.owner.review_count})
                </span>
              </div>
            ) : (
              <span className="text-[11px] bg-accent-green/10 text-accent-green font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                New
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
