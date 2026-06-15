import Link from "next/link";
import Footer from "@/components/layout/footer";

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I list my freelance services?",
      answer: "Go to your Dashboard, click on 'Services', and select 'Create Service'. Fill in your title, description, pricing in INR, delivery days, and category. Once published, your service will appear in the public services directory for startups to order.",
    },
    {
      question: "How do teams and projects connect?",
      answer: "You can create a project to showcase your portfolio, and you can create a team to group student builders. From your team page, you can link projects directly to your team so startups can see your joint proof of work.",
    },
    {
      question: "How does skills verification work?",
      answer: "Skills can be added to your profile. Verified skills are endorsed by community leaders or proven through successful completion of services/projects linked to that skill on StudentNet.",
    },
    {
      question: "How do I apply to roles listed by startups?",
      answer: "Startups list active role openings. If you meet the qualifications, click the 'Apply' button on the role card, select which project from your portfolio you want to highlight, write a brief pitch, and submit your application directly to the startup founder.",
    },
    {
      question: "Is StudentNet free for students?",
      answer: "Yes, StudentNet is completely free for students to build portfolios, network with teammates, showcase projects, and apply to startup openings. We want to empower every student builder in India to find opportunities.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 px-6 lg:px-8 border-b border-border bg-surface-sunken">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl font-heading mb-4">
            Help Center
          </h1>
          <p className="text-base text-muted max-w-xl mx-auto">
            Find answers to frequently asked questions about portfolios, communities, startups, services, and security.
          </p>
        </div>
      </section>

      {/* FAQ Grid */}
      <section className="py-16 px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold font-heading mb-10 text-ink">
          Frequently Asked Questions
        </h2>

        <div className="space-y-8">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-border pb-6 last:border-b-0">
              <h3 className="text-base font-bold text-ink mb-2">
                {faq.question}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Direct support CTA */}
      <section className="py-12 px-6 text-center border-t border-border bg-surface-sunken">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-bold font-heading mb-2">Still need help?</h3>
          <p className="text-sm text-muted mb-6">
            If you didn&apos;t find the answers you were looking for, reach out directly to our support team.
          </p>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent-green px-5 text-sm font-semibold text-accent-green-foreground transition-colors hover:bg-accent-green/90"
          >
            Contact Support
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
