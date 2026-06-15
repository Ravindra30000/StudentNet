import Link from "next/link";
import Footer from "@/components/layout/footer";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 lg:px-8 border-b border-border">
        <div className="absolute inset-0 bg-radial-gradient from-accent-green/5 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-6xl font-heading mb-6">
            Empowering the Next Generation of <span className="text-accent-green">Talent</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            StudentNet is India&apos;s premier student talent network. We bridge the gap between classroom theory and real-world execution by giving students the tools to build portfolios, showcase projects, and collaborate with founders.
          </p>
        </div>
      </section>

      {/* Core Values / Mission Section */}
      <section className="py-20 px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface p-8 rounded-lg shadow-card hover:shadow-card-hover transition-shadow border border-border">
            <div className="w-12 h-12 bg-accent-green/10 rounded-md flex items-center justify-center text-accent-green font-bold text-lg mb-6">
              01
            </div>
            <h3 className="text-lg font-bold font-heading mb-3">Portfolio First</h3>
            <p className="text-sm text-muted leading-relaxed">
              We believe a working demo is worth a thousand resumes. StudentNet highlights real, verified projects, skills, and code repositories.
            </p>
          </div>

          <div className="bg-surface p-8 rounded-lg shadow-card hover:shadow-card-hover transition-shadow border border-border">
            <div className="w-12 h-12 bg-accent-green/10 rounded-md flex items-center justify-center text-accent-green font-bold text-lg mb-6">
              02
            </div>
            <h3 className="text-lg font-bold font-heading mb-3">Community Led</h3>
            <p className="text-sm text-muted leading-relaxed">
              Student talent thrives in communities. We host developer circles, startup incubators, and university chapters to foster growth.
            </p>
          </div>

          <div className="bg-surface p-8 rounded-lg shadow-card hover:shadow-card-hover transition-shadow border border-border">
            <div className="w-12 h-12 bg-accent-green/10 rounded-md flex items-center justify-center text-accent-green font-bold text-lg mb-6">
              03
            </div>
            <h3 className="text-lg font-bold font-heading mb-3">Real Opportunities</h3>
            <p className="text-sm text-muted leading-relaxed">
              Earn before graduation. We connect builders directly to vetted startups for high-impact internships, contract gigs, and full-time roles.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story / Who We Are */}
      <section className="bg-surface-sunken py-20 px-6 lg:px-8 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight font-heading mb-8 text-center">
            Built by Students, for Students
          </h2>
          <div className="prose prose-neutral mx-auto text-muted text-base leading-relaxed space-y-6">
            <p>
              StudentNet was born out of a simple frustration: university students have immense creative and technical potential, yet standard professional platforms cater mostly to mid-career professionals. High-quality student builders get lost in generic resume databases.
            </p>
            <p>
              Our mission is to create a digital workspace that highlights projects, tracks skill growth transparently, and builds proof of work. Whether you are looking for a co-founder for a hackathon team, listing a freelance service, or seeking your first startup role, StudentNet is your home.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto bg-surface border border-border p-10 rounded-xl shadow-pop">
          <h3 className="text-2xl font-bold font-heading mb-4">Ready to show your proof of work?</h3>
          <p className="text-muted mb-8 text-sm">
            Join thousands of student builders showcasing their talents and connecting with leading startups.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-md bg-accent-green px-6 text-sm font-semibold text-accent-green-foreground shadow transition-colors hover:bg-accent-green/90"
            >
              Get Started
            </Link>
            <Link
              href="/services"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
