import Footer from "@/components/layout/footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <section className="py-20 px-6 lg:px-8 border-b border-border">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink font-heading mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-muted">
            Effective Date: June 15, 2026
          </p>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="prose prose-neutral text-muted text-sm leading-relaxed space-y-8">
          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">1. Acceptance of Terms</h2>
            <p>
              By accessing or using StudentNet, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must not use or register on our platform.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">2. User Accounts & Registration</h2>
            <p>
              To access certain features of StudentNet (such as publishing freelance services, listing projects, messaging builders, or applying to roles), you must register for an account. You agree to provide accurate information and are solely responsible for maintaining the confidentiality of your credentials and account actions.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">3. Code of Conduct</h2>
            <p className="mb-2">
              StudentNet is built for student portfolios and verified freelancing. Users must not:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Submit plagiarized projects or list services they cannot execute.</li>
              <li>Attempt to scrape profiles, harvest user emails, or execute denial of service attacks.</li>
              <li>Inject cross-site scripting (XSS) payloads or use SQL bypasses.</li>
              <li>Harass, spam, or abuse other users in chat messages or community posts.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">4. Intellectual Property</h2>
            <p>
              You retain full ownership of the intellectual property (source code, media assets, design mocks) you upload or link to on your StudentNet portfolio. By posting content to public pages, you grant us a worldwide, non-exclusive license to display, host, and highlight your work in platform indexes and promotional materials.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">5. Services & Client Agreements</h2>
            <p>
              StudentNet provides a showcase directory for student freelance services. Any agreements, milestones, and transactions made between student providers and startup buyers are solely the responsibility of the participating parties. We do not act as an escrow agent or legal mediator for service delivery disputes.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-ink mb-3 font-heading">6. Limitation of Liability</h2>
            <p>
              StudentNet is provided &quot;as is&quot; without warranties of any kind. We are not liable for database downtime, loss of portfolio records, project execution failures, or disputes arising from user collaborations.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
