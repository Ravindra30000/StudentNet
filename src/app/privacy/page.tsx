import Footer from "@/components/layout/footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <section className="py-20 px-6 lg:px-8 border-b border-border">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink font-heading mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted">
            Last Updated: June 15, 2026
          </p>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="prose prose-neutral text-muted text-sm leading-relaxed space-y-8">
          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">1. Introduction</h2>
            <p>
              StudentNet (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy describes how we collect, use, store, and disclose your information when you use our website, student talent directory, messaging systems, portfolio features, and other services.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">2. Information We Collect</h2>
            <p className="mb-2">
              We collect information you provide directly to us when you create an account, complete your profile, post projects, publish freelance services, join communities, or interact with other users. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Info:</strong> Email address, username, password, role (student/founder), and timestamps.</li>
              <li><strong>Profile Info:</strong> Full name, bio, education, branch of study, graduation year, skills list, company/profession, profile avatar, and project cover files.</li>
              <li><strong>Portfolio Materials:</strong> Project titles, descriptions, technology tags, live demo links, repository URLs, and showcase media.</li>
              <li><strong>Communication Data:</strong> Chat logs, message text, timestamps, read indicators, and community conversation records.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">3. How We Use Your Information</h2>
            <p className="mb-2">
              We utilize collected data to maintain, optimize, and secure StudentNet, including to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Establish profiles and match student builders with teams and founders.</li>
              <li>Facilitate messaging pipelines and application submissions.</li>
              <li>Deliver security patches, verification codes, and client updates.</li>
              <li>Protect against unauthorized database injections, fraud, and terms violations.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">4. Data Sharing & Third Parties</h2>
            <p>
              StudentNet does not sell or lease your personal data. Publicly shared items (such as profile details, portfolios, and active services) are searchable by any visitor to the StudentNet platform. Authenticated data stays stored in our secure database instances managed by Supabase.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">5. Security Measures</h2>
            <p>
              We implement industry-standard database row-level security (RLS) and encrypted communication channels (SSL/TLS). However, no method of transmission or digital storage is 100% secure, and we cannot guarantee complete network invulnerability.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">6. Your Rights</h2>
            <p>
              You may modify your profile information or delete your account at any time through your dashboard settings. Deleting your account will remove your user profile, projects, services, and associated relational rows from our active database.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
