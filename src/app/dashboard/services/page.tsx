import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ServiceCard, { ServiceCardProps } from "@/components/services/service-card";
import OrderRow from "@/components/services/order-row";
import { Plus, ShoppingBag } from "lucide-react";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ServicesDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  const { tab = "services", error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  // Fetch all user's services
  const { data: myServices } = await supabase
    .from("services")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: profileReviews } = await supabase
    .from("reviews")
    .select("overall")
    .eq("reviewee_id", user.id);

  const ratings = profileReviews?.map((r) => Number(r.overall)) || [];
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, val) => sum + val, 0) / ratings.length
    : null;

  const serviceOwnerData = {
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    college: profile.college,
    avg_rating: avgRating,
    review_count: ratings.length,
  };

  const servicesWithOwner = (myServices ?? []).map((s) => ({
    ...s,
    owner: serviceOwnerData,
  }));

  // Fetch orders as seller (disambiguating using buyer_id relationship name)
  const { data: ordersAsSeller } = await supabase
    .from("orders")
    .select(`
      *,
      services (title, category),
      buyer:profiles!buyer_id (full_name, username)
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch orders as buyer (disambiguating using seller_id relationship name)
  const { data: ordersAsBuyer } = await supabase
    .from("orders")
    .select(`
      *,
      services (title, category),
      seller:profiles!seller_id (full_name, username)
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-20">
      {/* Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-ink">
            Freelance Hub
          </h1>
          <p className="text-muted mt-2 text-sm">
            Manage your services, client orders, and custom purchases in one place.
          </p>
        </div>
        <Link
          href="/dashboard/services/new"
          className="w-fit rounded-full bg-ink px-6 py-3 font-semibold text-sm text-white hover:opacity-90 flex items-center gap-2 shadow-sm transition-all duration-200"
        >
          <Plus size={16} /> New service
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mt-8 border-b border-border/50 pb-4 flex-wrap">
        <Link
          href="/dashboard/services?tab=services"
          className={`font-label-md text-sm px-5 py-2.5 rounded-full transition-all ${
            tab === "services"
              ? "bg-ink text-white"
              : "bg-surface border border-border text-ink hover:bg-surface-sunken"
          }`}
        >
          My services
        </Link>
        <Link
          href="/dashboard/services?tab=seller"
          className={`font-label-md text-sm px-5 py-2.5 rounded-full transition-all ${
            tab === "seller"
              ? "bg-ink text-white"
              : "bg-surface border border-border text-ink hover:bg-surface-sunken"
          }`}
        >
          Orders as seller
        </Link>
        <Link
          href="/dashboard/services?tab=buyer"
          className={`font-label-md text-sm px-5 py-2.5 rounded-full transition-all ${
            tab === "buyer"
              ? "bg-ink text-white"
              : "bg-surface border border-border text-ink hover:bg-surface-sunken"
          }`}
        >
          Orders as buyer
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-danger/10 text-danger px-4 py-3 text-sm font-semibold">
          {decodeURIComponent(error)}
        </p>
      )}

      {/* Content Rendering based on Tab */}
      <div className="mt-8">
        {tab === "services" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-ink mb-6">
              Active Offerings
            </h2>
            {servicesWithOwner && servicesWithOwner.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {servicesWithOwner.map((service: ServiceCardProps["service"]) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isOwner={true}
                    currentUserId={user.id}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-border/40 rounded-xl max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center text-muted mb-4 border border-border/50">
                  <ShoppingBag size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink">No Freelance Services Offered</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  Offer services like web development, graphic design, content writing, or tutoring to college students and startups on StudentNet.
                </p>
                <Link
                  href="/dashboard/services/new"
                  className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Create Your First Service
                </Link>
              </div>
            )}
          </div>
        )}

        {tab === "seller" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-ink mb-6">
              Client Orders
            </h2>
            {ordersAsSeller && ordersAsSeller.length > 0 ? (
              <div className="flex flex-col gap-4">
                {ordersAsSeller.map((order: Order & {
                  services?: { title: string; category: string } | null;
                  buyer?: { full_name: string; username: string } | null;
                }) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    role="seller"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted">
                No orders received yet. Make sure your services are active so clients can order!
              </div>
            )}
          </div>
        )}

        {tab === "buyer" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-ink mb-6">
              Purchases
            </h2>
            {ordersAsBuyer && ordersAsBuyer.length > 0 ? (
              <div className="flex flex-col gap-4">
                {ordersAsBuyer.map((order: Order & {
                  services?: { title: string; category: string } | null;
                  seller?: { full_name: string; username: string } | null;
                }) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    role="buyer"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted">
                You haven&apos;t purchased any freelance services yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
