import Footer from "@/components/layout/footer";

export default function ContactPage() {
  const supportEmail = "ravindratomar300@gmail.com";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 px-6 lg:px-8 border-b border-border bg-surface-sunken">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl font-heading mb-4">
            Contact Us
          </h1>
          <p className="text-base text-muted max-w-xl mx-auto">
            Have a question, feedback, or suggestion? Get in touch with our team.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="bg-surface border border-border p-10 rounded-xl shadow-pop text-center space-y-8">
          <div className="w-16 h-16 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold font-heading text-ink">Get in Touch</h2>
            <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
              We respond to all email inquiries within 24 hours. Click below to start an email thread with us.
            </p>
          </div>

          <div className="flex flex-col gap-6 items-center justify-center text-sm">
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex h-11 items-center justify-center rounded-md bg-accent-green px-8 text-sm font-semibold text-accent-green-foreground shadow transition-colors hover:bg-accent-green/90"
            >
              Email Support
            </a>
            
            <div className="border-t border-border pt-6 w-full max-w-xs space-y-2 text-xs">
              <p className="text-muted">
                <span className="font-bold text-ink uppercase tracking-wider block mb-1">Official Email</span>
                <a href={`mailto:${supportEmail}`} className="hover:underline text-accent-green">{supportEmail}</a>
              </p>
              <p className="text-muted">
                <span className="font-bold text-ink uppercase tracking-wider block mb-1">Office Location</span>
                Remote, India
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
