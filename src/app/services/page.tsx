import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ServiceCard from "@/components/services/service-card";
import ServicesFiltersToolbar from "@/components/services/services-filters-toolbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Freelance Services — StudentNet",
  description: "Browse student freelance services, design gigs, app development, and technical offerings.",
};

const BROWSE_CATEGORIES = [
  "Web Development",
  "App Design",
  "AI/ML",
  "Video Editing",
  "Content Writing",
  "UI/UX Design",
  "Digital Marketing",
  "Blockchain",
];

interface ServicesPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    seller?: string;
    sort?: string;
    min_price?: string;
    max_price?: string;
    delivery?: string;
    min_rating?: string;
    page?: string;
  }>;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const {
    q,
    category,
    seller,
    sort = "relevant",
    min_price,
    max_price,
    delivery,
    min_rating,
    page = "1",
  } = await searchParams;

  const supabase = await createClient();

  // 1. Fetch active service counts by category
  const { data: categoryCounts } = await supabase
    .from("services")
    .select("category")
    .eq("is_active", true);

  const counts: Record<string, number> = {};
  let allActiveCount = 0;
  (categoryCounts ?? []).forEach((s) => {
    counts[s.category] = (counts[s.category] || 0) + 1;
    allActiveCount++;
  });

  // 2. Fetch matched services
  const selectString = `
    id,
    title,
    description,
    category,
    price_inr,
    delivery_days,
    created_at,
    is_active,
    owner:profiles!owner_id${seller ? "!inner" : ""} (
      username,
      full_name,
      avatar_url,
      college,
      reviews:reviews!reviewee_id(overall)
    )
  `;

  let queryBuilder = supabase
    .from("services")
    .select(selectString)
    .eq("is_active", true);

  if (category) {
    queryBuilder = queryBuilder.eq("category", category);
  }

  if (seller) {
    queryBuilder = queryBuilder.eq("owner.username", seller);
  }

  if (q) {
    const isAlphanumeric = /[a-zA-Z0-9]/.test(q);
    if (isAlphanumeric) {
      queryBuilder = queryBuilder.textSearch("search_vector", q, {
        config: "english",
        type: "websearch"
      });
    } else {
      queryBuilder = queryBuilder.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }
  }

  if (min_price) {
    queryBuilder = queryBuilder.gte("price_inr", Number(min_price));
  }

  if (max_price) {
    queryBuilder = queryBuilder.lte("price_inr", Number(max_price));
  }

  if (delivery && delivery !== "any") {
    queryBuilder = queryBuilder.lte("delivery_days", Number(delivery));
  }

  const { data: rawServices } = await queryBuilder;

  interface RawServiceOwner {
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

  // 3. Map reviews & rating data
  const mappedServices = ((rawServices as unknown as RawService[]) ?? []).map((s) => {
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
        username: s.owner?.username ?? "",
        full_name: s.owner?.full_name ?? "",
        avatar_url: s.owner?.avatar_url ?? null,
        college: s.owner?.college ?? null,
        avg_rating,
        review_count: ratings.length,
      }
    };
  });

  // Apply min_rating filter in JS since rating is derived
  let services = mappedServices;
  if (min_rating) {
    const minRatingVal = Number(min_rating);
    services = mappedServices.filter((s) => (s.owner.avg_rating ?? 0) >= minRatingVal);
  }

  // 4. Sort Services
  if (sort === "newest") {
    services.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === "price_asc") {
    services.sort((a, b) => a.price_inr - b.price_inr);
  } else if (sort === "price_desc") {
    services.sort((a, b) => b.price_inr - a.price_inr);
  } else if (sort === "top_rated") {
    services.sort((a, b) => (b.owner.avg_rating ?? 0) - (a.owner.avg_rating ?? 0));
  } else {
    // Default/Most Relevant sorting (score desc, fallback created_at desc)
    services.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  // 5. Pagination calculation
  const pageNum = Number(page) || 1;
  const limit = 9;
  const totalResults = services.length;
  const totalPages = Math.ceil(totalResults / limit);
  const paginatedServices = services.slice((pageNum - 1) * limit, pageNum * limit);

  // Helper to build URLs preserving current filter states
  const getFilterUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (seller) params.set("seller", seller);
    if (sort && sort !== "relevant") params.set("sort", sort);
    if (min_price) params.set("min_price", min_price);
    if (max_price) params.set("max_price", max_price);
    if (delivery) params.set("delivery", delivery);
    if (min_rating) params.set("min_rating", min_rating);
    
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });

    const queryStr = params.toString();
    return queryStr ? `/services?${queryStr}` : "/services";
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="font-heading text-display-2 text-ink tracking-tight font-extrabold">
          Freelance Gigs & Gigs
        </h1>
        <p className="text-body-lg text-muted mt-2">
          Find student developers, editors, writers, and designers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sticky Left Rail Categories Sidebar */}
        <aside className="lg:col-span-1 lg:sticky lg:top-28 space-y-4">
          <div className="bg-surface rounded-2xl border border-border/40 p-5 shadow-sm">
            <h3 className="font-heading text-xs font-bold text-ink uppercase tracking-wider mb-4">
              Categories
            </h3>
            
            <nav className="flex flex-col gap-1">
              <Link
                href={getFilterUrl({ category: null })}
                className={`flex justify-between items-center px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  !category
                    ? "bg-ink text-white"
                    : "text-muted hover:text-ink hover:bg-surface-sunken"
                }`}
              >
                <span>All Categories</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${!category ? "bg-white/10 text-white" : "bg-surface-sunken text-muted"}`}>
                  {allActiveCount}
                </span>
              </Link>

              {BROWSE_CATEGORIES.map((cat) => {
                const isActive = category === cat;
                const count = counts[cat] || 0;
                return (
                  <Link
                    key={cat}
                    href={getFilterUrl({ category: cat })}
                    className={`flex justify-between items-center px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-ink text-white"
                        : "text-muted hover:text-ink hover:bg-surface-sunken"
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-white/10 text-white" : "bg-surface-sunken text-muted"}`}>
                      {count}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Columns: Filtering & Service Grid */}
        <div className="lg:col-span-3 space-y-6">
          <ServicesFiltersToolbar />

          {/* Results Info */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-semibold">
              {totalResults} {totalResults === 1 ? "result" : "results"} found
              {seller && ` by @${seller}`}
            </span>
          </div>

          {/* Services Grid */}
          {paginatedServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-surface rounded-2xl border border-border/40 p-8 shadow-sm">
              <p className="font-sans text-base text-muted mb-3">
                No services match your filters.
              </p>
              <p className="text-xs text-muted/80 max-w-xs">
                Try clearing search filters or selecting another category on the left side.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedServices.map((service) => (
                <ServiceCard key={service.id} service={service} searchTerm={q} />
              ))}
            </div>
          )}

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-8">
              {pageNum > 1 && (
                <Link
                  href={getFilterUrl({ page: (pageNum - 1).toString() })}
                  className="px-4.5 py-2 rounded-full border border-border bg-surface text-xs font-semibold hover:bg-surface-sunken text-ink transition-colors"
                >
                  Previous
                </Link>
              )}
              
              <span className="text-xs text-muted font-bold px-4">
                Page {pageNum} of {totalPages}
              </span>

              {pageNum < totalPages && (
                <Link
                  href={getFilterUrl({ page: (pageNum + 1).toString() })}
                  className="px-4.5 py-2 rounded-full border border-border bg-surface text-xs font-semibold hover:bg-surface-sunken text-ink transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
