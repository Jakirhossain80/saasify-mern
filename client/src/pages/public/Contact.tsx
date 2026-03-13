// FILE: client/src/pages/public/Contact.tsx
import { useState } from "react";
import { Mail, MessageSquare, Send, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // MVP placeholder (no backend impact)
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    toast.success("Message sent (demo). We’ll add real sending later.");
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="mx-auto max-w-4xl px-4 pt-16 pb-10 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:border-blue-600/30 dark:bg-blue-600/10 dark:text-blue-300">
          <ShieldCheck className="h-4 w-4" />
          Contact
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
          Get in touch
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
          Have questions about multi-tenant setup, RBAC, or the Projects module? Send a message. This form is a demo
          placeholder for now (no backend).
        </p>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Contact form */}
          <section className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-10">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-600/10">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Message</h2>
              </div>

              <form onSubmit={onSubmit} className="mt-8 space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="contact-name">
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-blue-600/20"
                      placeholder="John Doe"
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="contact-email">
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-blue-600/20"
                      placeholder="john@company.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="contact-message">
                    How can we help?
                  </label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[140px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-blue-600/20"
                    placeholder="Tell us what you need..."
                  />
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 active:scale-[0.99] dark:focus:ring-blue-600/20 md:w-auto"
                  >
                    Send message <Send className="h-4 w-4" />
                  </button>

                  
                </div>

              
              </form>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6 lg:col-span-5">
            {/* Email card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
                    <Mail className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Email</h3>
                </div>

              

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <code className="select-all text-lg font-medium text-blue-700 dark:text-blue-300">support@saasify.dev</code>
                </div>

              
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quick links</h3>

              <div className="mt-6 grid gap-2 text-sm">
                <Link
                  to="/docs"
                  className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-slate-700 transition-all hover:border-slate-100 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:text-slate-200 dark:hover:border-slate-800 dark:hover:bg-slate-950 dark:hover:text-blue-300 dark:focus:ring-blue-600/20"
                >
                  <span className="font-medium">Docs</span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  to="/security"
                  className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-slate-700 transition-all hover:border-slate-100 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:text-slate-200 dark:hover:border-slate-800 dark:hover:bg-slate-950 dark:hover:text-blue-300 dark:focus:ring-blue-600/20"
                >
                  <span className="font-medium">Security</span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  to="/pricing"
                  className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-slate-700 transition-all hover:border-slate-100 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:text-slate-200 dark:hover:border-slate-800 dark:hover:bg-slate-950 dark:hover:text-blue-300 dark:focus:ring-blue-600/20"
                >
                  <span className="font-medium">Pricing</span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  to="/"
                  className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-slate-700 transition-all hover:border-slate-100 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:text-slate-200 dark:hover:border-slate-800 dark:hover:bg-slate-950 dark:hover:text-blue-300 dark:focus:ring-blue-600/20"
                >
                  <span className="font-medium">Back to home</span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 pb-12 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Looking for something else? Visit our{" "}
          <span className="font-medium text-blue-700 hover:underline hover:underline-offset-4 dark:text-blue-300">
            Help Center
          </span>{" "}
          or check out our{" "}
          <span className="font-medium text-blue-700 hover:underline hover:underline-offset-4 dark:text-blue-300">
            Community Forum
          </span>
          .
        </p>
      </footer>
    </div>
  );
}