import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/app/dashboard/services/actions";
import { startConversation } from "@/app/dashboard/messages/actions";
import { Star, Clock, CheckCircle, ShoppingBag, ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch service with owner profile
  const { data: service, error } = await supabase
    .from("services")
    .select(`
      *,
      profiles (
        id,
        username,
        full_name,
        avatar_url,
        college,
        branch,
        graduation_year,
        bio
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !service) {
    notFound();
  }

  const owner = Array.isArray(service.profiles) ? service.profiles[0] : service.profiles;
  const isOwner = user?.id === service.owner_id;

  // Server actions wrapper
  const handleOrder = async () => {
    "use server";
    if (!user) redirect("/login");
    await createOrder(service.id); // price and seller fetched from DB inside the action
  };

  const handleMessage = async () => {
    "use server";
    if (!user) redirect("/login");
    await startConversation(service.owner_id);
  };

  // Mock reviews for styling reference matching code.html reviews list
  const mockReviews = [
    {
      id: "1",
      reviewer_name: "Sarah Jenkins",
      reviewer_avatar: null,
      rating: 5,
      time: "1 week ago",
      comment: "Absolutely phenomenal work! The implementation was clean, fast, and exactly what we needed to scale our dashboard. Great communication throughout."
    },
    {
      id: "2",
      reviewer_name: "Michael Chang",
      reviewer_avatar: null,
      rating: 4.8,
      time: "3 weeks ago",
      comment: "Solid implementation and very structured code. Easy to collaborate with and delivered everything requested. Recommended!"
    }
  ];

  return (
    <div className="bg-background min-h-screen pt-12 pb-32 lg:pb-12">
      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* Back Link */}
        <div className="col-span-full">
          <Link href="/students" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft size={16} /> Back to Talent Marketplace
          </Link>
        </div>

        {/* Left Column (Details) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="font-heading text-xs font-bold text-accent-green uppercase tracking-wider bg-accent-green/10 px-3 py-1 rounded-full w-fit">
              {service.category}
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-ink leading-tight">
              {service.title}
            </h1>
            <div className="flex items-center gap-3">
              {owner?.avatar_url ? (
                <Image
                  src={owner.avatar_url}
                  alt={owner.full_name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent-green text-white font-bold flex items-center justify-center text-xs">
                  {owner?.full_name?.substring(0, 2).toUpperCase() || "US"}
                </div>
              )}
              <Link href={`/u/${owner?.username}`} className="font-sans text-sm font-semibold text-ink hover:underline">
                {owner?.full_name}
              </Link>
              <span className="text-border/40">•</span>
              <span className="font-sans text-xs text-muted flex items-center gap-1">
                <Star size={14} className="text-accent-gold fill-accent-gold" />
                4.9 (32 reviews)
              </span>
            </div>
          </div>

          {/* Cover Placeholder / Dynamic Gradient */}
          <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-accent-green to-accent-gold/20 flex flex-col items-center justify-center p-8 text-center text-white border border-border/40 shadow-card">
            <ShoppingBag size={48} className="mb-4 text-white/80" />
            <h3 className="font-heading text-xl font-bold">{service.title}</h3>
            <p className="text-white/70 text-sm mt-2 max-w-md">Professional Freelance Service by {owner?.full_name}</p>
          </div>

          {/* About Section */}
          <section className="flex flex-col gap-4 bg-surface rounded-xl p-6 md:p-8 shadow-card border border-border/20">
            <h2 className="font-heading text-xl font-bold text-ink">About this service</h2>
            <div className="font-sans text-base text-ink/80 leading-relaxed whitespace-pre-wrap">
              {service.description || "No description provided."}
            </div>
          </section>

          {/* What's Included */}
          <section className="flex flex-col gap-4 bg-surface rounded-xl p-6 md:p-8 shadow-card border border-border/20">
            <h2 className="font-heading text-xl font-bold text-ink">What&apos;s included</h2>
            <ul className="flex flex-col gap-3 font-sans text-sm text-ink/80">
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-accent-green shrink-0 mt-0.5" />
                <span>Professional delivery with source files.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-accent-green shrink-0 mt-0.5" />
                <span>Clean, modular implementation conforming to standards.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-accent-green shrink-0 mt-0.5" />
                <span>Basic optimization and quality checks included.</span>
              </li>
            </ul>
          </section>

          {/* Reviews Section */}
          <section className="flex flex-col gap-6">
            <h2 className="font-heading text-xl font-bold text-ink">Reviews</h2>
            <div className="flex flex-col gap-4 bg-surface-sunken p-6 rounded-2xl border border-border">
              {mockReviews.map((rev) => (
                <div key={rev.id} className="bg-surface p-6 rounded-xl shadow-card flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-green/10 text-accent-green font-bold flex items-center justify-center text-sm">
                      {rev.reviewer_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-sans text-sm font-bold text-ink">{rev.reviewer_name}</div>
                      <div className="font-sans text-xs text-muted flex items-center gap-1 mt-0.5">
                        <Star size={12} className="text-accent-gold fill-accent-gold" />
                        <span>{rev.rating} • {rev.time}</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-sans text-sm text-ink/80 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (Sticky Purchase Sidebar) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="sticky top-24 flex flex-col gap-6">
            
            {/* Price & Checkout Card */}
            <div className="hidden lg:flex bg-surface rounded-2xl p-6 shadow-card flex-col gap-6 border border-border">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs text-muted uppercase tracking-wider font-semibold">Pricing</span>
                  <div className="font-heading text-3xl font-extrabold text-ink mt-1">
                    ₹{service.price_inr.toLocaleString()}
                  </div>
                </div>
                <div className="font-sans text-xs text-muted mb-1 flex items-center gap-1">
                  <Clock size={14} /> Delivery in {service.delivery_days} days {service.delivery_label ? `(${service.delivery_label})` : ""}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {isOwner ? (
                  <Link
                    href={`/dashboard/services/${service.id}/edit`}
                    className="w-full rounded-full bg-ink py-3 font-semibold text-sm text-white hover:opacity-90 transition-opacity text-center cursor-pointer"
                  >
                    Edit Service
                  </Link>
                ) : (
                  <>
                    <form action={handleOrder}>
                      <SubmitButton
                        loadingText="Ordering..."
                        variant="gold"
                        className="w-full text-sm py-3 font-bold"
                      >
                        Order Now
                      </SubmitButton>
                    </form>
                    <form action={handleMessage}>
                      <SubmitButton
                        loadingText="Opening Chat..."
                        variant="secondary"
                        className="w-full text-sm py-3 font-semibold"
                      >
                        Message Seller
                      </SubmitButton>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="bg-surface rounded-2xl p-6 shadow-card flex flex-col items-center gap-4 border border-border text-center">
              {owner?.avatar_url ? (
                <Image
                  src={owner.avatar_url}
                  alt={owner.full_name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent-green text-white font-bold flex items-center justify-center text-xl">
                  {owner?.full_name?.substring(0, 2).toUpperCase() || "US"}
                </div>
              )}
              <div>
                <div className="font-heading text-base font-bold text-ink">{owner?.full_name}</div>
                <div className="font-sans text-xs text-muted mt-1">
                  {owner?.college || "College Student"}
                  {owner?.branch && ` • ${owner.branch}`}
                </div>
              </div>
              <p className="font-sans text-xs text-muted line-clamp-2 px-2">
                {owner?.bio || "StudentNet talent partner offering professional services."}
              </p>
              <Link
                href={`/u/${owner?.username}`}
                className="w-full rounded-full border border-border bg-surface text-ink hover:bg-surface-sunken font-semibold text-xs py-2.5 transition-colors"
              >
                View Profile
              </Link>
            </div>

          </div>
        </div>

      </main>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-6 py-4 flex items-center justify-between shadow-[0_-4px_16px_rgba(22,56,50,0.08)]">
        <div>
          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Price</span>
          <div className="font-heading text-xl font-bold text-ink">
            ₹{service.price_inr.toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {isOwner ? (
            <Link
              href={`/dashboard/services/${service.id}/edit`}
              className="rounded-full bg-ink px-6 py-2.5 font-semibold text-xs text-white hover:opacity-90 transition-opacity text-center cursor-pointer"
            >
              Edit Service
            </Link>
          ) : (
            <>
              <form action={handleMessage}>
                <SubmitButton
                  loadingText="Chat..."
                  variant="secondary"
                  size="sm"
                  className="px-4 py-2 font-semibold text-xs"
                >
                  Message
                </SubmitButton>
              </form>
              <form action={handleOrder}>
                <SubmitButton
                  loadingText="Ordering..."
                  variant="gold"
                  size="sm"
                  className="px-4 py-2 font-bold text-xs"
                >
                  Order Now
                </SubmitButton>
              </form>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
