import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";
import { startConversation } from "@/app/dashboard/messages/actions";

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
      id?: string;
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
  currentUserId?: string | null;
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

export default function ServiceCard({
  service,
  variant = "grid",
  searchTerm,
  currentUserId
}: ServiceCardProps) {
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
      <div className="h-[60px] flex items-center justify-between gap-3 bg-surface p-2 rounded-xl border border-border/30 hover:bg-surface-sunken hover:shadow-sm transition-all duration-200 group/compact relative">
        {/* Content Link */}
        <Link href={`/services/${service.id}`} className="flex-1 min-w-0 flex items-center gap-3">
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
              <h4 className="font-heading text-xs font-bold text-ink truncate group-hover/compact:text-accent-green transition-colors">
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
        </Link>

        {/* Message Button on the right */}
        {service.owner.id && currentUserId !== service.owner.id && (
          <form
            action={async () => {
              "use server";
              await startConversation(service.owner.id!);
            }}
            className="shrink-0 pl-1 relative z-10"
          >
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full p-2 text-muted hover:text-white hover:bg-accent-green hover:shadow-sm border border-border/30 hover:border-accent-green transition-all duration-200 cursor-pointer bg-surface"
              title={`Message ${service.owner.full_name}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div
      className="group bg-surface rounded-[20px] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden border border-border/20 relative"
    >
      {/* Cover Image/Gradient Area - wrapped in Link to detail page */}
      <Link href={`/services/${service.id}`} className="block relative z-0 aspect-[16/9] w-full overflow-hidden bg-surface-sunken">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses} flex flex-col items-center justify-center p-4`}>
          {/* Gorgeous geometric dot pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-70" />
          
          <span className="text-[10px] tracking-[0.25em] uppercase font-black text-white/60 mb-2 z-10 text-center px-4 truncate max-w-full drop-shadow-sm">
            {service.category}
          </span>
          <span className="font-heading font-black text-white/40 text-7xl tracking-widest select-none z-10 drop-shadow-md">
            {initials}
          </span>
        </div>
        
        {/* Delivery Days Badge (Top Right) */}
        <span className="absolute top-4 right-4 bg-ink text-white font-sans text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm max-w-[80%] truncate z-10">
          {service.delivery_days}d delivery {service.delivery_label ? `(${service.delivery_label})` : ""}
        </span>
      </Link>

      {/* Seller Header Row (Avatar overlap) */}
      <div className="px-6 relative z-10 flex items-start justify-between gap-3">
        <Link href={`/u/${service.owner.username}`} className="flex items-start gap-3 min-w-0 group/owner -mt-5">
          <div className="shrink-0">
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
            <p className="font-sans text-sm font-bold text-ink truncate group-hover/owner:text-accent-green transition-colors">
              {service.owner.full_name}
            </p>
            <p className="font-sans text-[11px] text-muted truncate">
              {service.owner.college || "StudentNet Builder"}
            </p>
          </div>
        </Link>

        {/* Message Button on the right of the header row */}
        {service.owner.id && currentUserId !== service.owner.id && (
          <form
            action={async () => {
              "use server";
              await startConversation(service.owner.id!);
            }}
            className="pt-1.5 shrink-0"
          >
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full p-2 text-muted hover:text-white hover:bg-accent-green hover:shadow-sm border border-border/30 hover:border-accent-green transition-all duration-200 cursor-pointer bg-surface"
              title={`Message ${service.owner.full_name}`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Content Area */}
      <div className="px-6 pt-4 pb-6 flex-1 flex flex-col justify-between">
        <Link href={`/services/${service.id}`} className="block space-y-2 flex-1">
          <h3 className="font-heading text-base font-bold text-ink leading-snug line-clamp-2 group-hover:text-accent-green transition-colors">
            <HighlightMatch text={service.title} term={searchTerm} />
          </h3>
          
          {/* Category Chip */}
          <span className="inline-block bg-surface-sunken text-muted text-xs font-semibold px-3 py-1 rounded-full border border-border/30">
            {service.category}
          </span>
        </Link>

        {/* Footer Rating/Pricing Row */}
        <Link href={`/services/${service.id}`} className="block mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
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
        </Link>
      </div>
    </div>
  );
}
