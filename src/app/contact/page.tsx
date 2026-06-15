"use client";

import { useState } from "react";
import Footer from "@/components/layout/footer";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Support");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setLoading(true);
    // Simulate API request send
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 px-6 lg:px-8 border-b border-border bg-surface-sunken">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl font-heading mb-4">
            Contact Us
          </h1>
          <p className="text-base text-muted max-w-xl mx-auto">
            Have a question, feedback, or business proposal? Drop us a message and our team will get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-6 lg:px-8 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-5 gap-12">
        {/* Info Grid */}
        <div className="md:col-span-2 space-y-8 text-sm">
          <div>
            <h3 className="font-bold text-ink mb-2">Our Office</h3>
            <p className="text-muted leading-relaxed">
              StudentNet Technologies Pvt Ltd<br />
              Indiranagar, 80 Feet Road<br />
              Bengaluru, Karnataka 560038
            </p>
          </div>

          <div>
            <h3 className="font-bold text-ink mb-2">Email Support</h3>
            <p className="text-muted leading-relaxed">
              General: <a href="mailto:hello@studentnet.in" className="text-accent-green hover:underline">hello@studentnet.in</a><br />
              Support: <a href="mailto:support@studentnet.in" className="text-accent-green hover:underline">support@studentnet.in</a>
            </p>
          </div>

          <div>
            <h3 className="font-bold text-ink mb-2">Office Hours</h3>
            <p className="text-muted leading-relaxed">
              Monday – Friday<br />
              10:00 AM – 6:00 PM (IST)
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-3 bg-surface p-8 rounded-lg border border-border shadow-card">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
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
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold font-heading text-ink mb-2">Message Sent!</h3>
              <p className="text-sm text-muted mb-6">
                Thank you for reaching out, {name}. We have received your message and will review it immediately.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setName("");
                  setEmail("");
                  setMessage("");
                }}
                className="text-sm font-semibold text-accent-green hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aarav@gmail.com"
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green"
                >
                  <option>General Support</option>
                  <option>Careers Application</option>
                  <option>Partnership/Sponsorship</option>
                  <option>Report Abuse / Bug</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">
                  Your Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or suggestion..."
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 inline-flex items-center justify-center rounded-md bg-accent-green text-sm font-semibold text-accent-green-foreground shadow transition-colors hover:bg-accent-green/90 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
