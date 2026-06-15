import Footer from "@/components/layout/footer";

export default function CareersPage() {
  const supportEmail = "ravindratomar300@gmail.com";

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

      {/* Open Applications Section */}
      <section className="bg-surface-sunken py-20 px-6 lg:px-8 border-t border-b border-border text-center">
        <div className="max-w-2xl mx-auto w-full space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight font-heading text-ink">
            Open Applications
          </h2>
          <p className="text-muted text-sm leading-relaxed max-w-md mx-auto">
            We are not actively hiring for any open roles at this moment, but we are always looking for passionate, self-driven builders to join our circle.
          </p>
          <div className="bg-surface p-8 rounded-lg border border-border max-w-lg mx-auto space-y-4">
            <p className="text-sm text-muted">
              If you want to contribute to engineering, design, developer relations, or community management, send us your portfolio and tell us how you want to build StudentNet together.
            </p>
            <a
              href={`mailto:${supportEmail}?subject=Open%20Application%20-%20StudentNet`}
              className="inline-flex h-10 items-center justify-center rounded-md bg-accent-green px-6 text-sm font-semibold text-accent-green-foreground transition-colors hover:bg-accent-green/90"
            >
              Send Open Application
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
