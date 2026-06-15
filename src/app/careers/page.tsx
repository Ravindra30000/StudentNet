import Link from "next/link";
import Footer from "@/components/layout/footer";

export default function CareersPage() {
  const jobs = [
    {
      title: "Founding Fullstack Engineer",
      team: "Engineering",
      location: "Bengaluru, IN (Hybrid)",
      type: "Full-time",
      description: "Help build and scale the Next.js and Supabase architecture supporting hundreds of thousands of users.",
    },
    {
      title: "Community Growth Lead",
      team: "Operations",
      location: "Remote",
      type: "Full-time / Part-time",
      description: "Manage university relationships, student chapters, and coordinate hackathons across top engineering campuses.",
    },
    {
      title: "Developer Advocate Internship",
      team: "Developer Relations",
      location: "Remote",
      type: "Internship (6 Months)",
      description: "Create educational content, highlight featured builders, and build community relationships on GitHub and Discord.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-6 lg:px-8 border-b border-border">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-6xl font-heading mb-6">
            Join the <span className="text-accent-green">Movement</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            We are a fast-moving, mission-driven team building the future infrastructure for student developers, designers, and creators in India. 
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <h2 className="text-3xl font-extrabold tracking-tight font-heading mb-12 text-center text-ink">
          Why work with us?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface p-8 rounded-lg border border-border">
            <h3 className="text-lg font-bold font-heading mb-3">High Ownership</h3>
            <p className="text-sm text-muted leading-relaxed">
              We operate with low bureaucracy and high trust. You will own entire products, features, and campaigns from ideation to launch.
            </p>
          </div>
          <div className="bg-surface p-8 rounded-lg border border-border">
            <h3 className="text-lg font-bold font-heading mb-3">Flexible & Remote</h3>
            <p className="text-sm text-muted leading-relaxed">
              Work from anywhere, when you are most productive. We focus entirely on outputs, not hours logged.
            </p>
          </div>
          <div className="bg-surface p-8 rounded-lg border border-border">
            <h3 className="text-lg font-bold font-heading mb-3">Impact Student Lives</h3>
            <p className="text-sm text-muted leading-relaxed">
              Every feature you ship helps a student builder land their first project, connect with co-founders, or earn their first freelance paycheck.
            </p>
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section className="bg-surface-sunken py-20 px-6 lg:px-8 border-t border-b border-border">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-3xl font-extrabold tracking-tight font-heading mb-4 text-center">
            Open Roles
          </h2>
          <p className="text-muted text-center mb-12 text-sm max-w-md mx-auto">
            Find a position that fits your talent. We review every single application with extreme care.
          </p>

          <div className="space-y-6">
            {jobs.map((job, idx) => (
              <div
                key={idx}
                className="bg-surface p-6 rounded-lg shadow-card hover:shadow-card-hover transition-shadow border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-green/10 text-accent-green">
                      {job.team}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted/10 text-muted">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-1">{job.title}</h3>
                  <p className="text-xs text-muted mb-3">{job.location}</p>
                  <p className="text-sm text-muted max-w-xl leading-relaxed">{job.description}</p>
                </div>
                <Link
                  href="/contact?subject=Careers"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-accent-green px-4 text-xs font-semibold text-accent-green-foreground transition-colors hover:bg-accent-green/90 shrink-0"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
