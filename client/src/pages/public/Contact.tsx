// FILE: client/src/pages/public/Contact.tsx
import { useState } from "react";
import { Mail, MessageSquare, Send, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-slate-700">
            <ShieldCheck className="h-4 w-4" />
            Contact
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Get in touch
          </h1>

          <p className="text-slate-600 leading-relaxed">
            Have questions about multi-tenant setup, RBAC, or the Projects module?
            Send a message. This form is a demo placeholder for now (no backend).
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Contact form */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <div className="font-semibold">Message</div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Tell us what you need..."
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-800"
              >
                Send message <Send className="h-4 w-4" />
              </button>

              <div className="text-xs text-slate-500">
                Demo note: this doesn’t send emails yet — we’ll wire it later.
              </div>
            </form>
          </div>

          {/* Contact info + links */}
          <div className="space-y-6">
            <div className="rounded-2xl border bg-slate-50 p-6">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <div className="font-semibold">Email</div>
              </div>

              <p className="mt-3 text-sm text-slate-600">
                Add your support email here later. For now you can keep a placeholder:
              </p>

              <div className="mt-4 rounded-lg border bg-white px-3 py-2 text-sm">
                support@saasify.dev
              </div>

              <p className="mt-3 text-xs text-slate-500">
                You can later replace this with a real address and connect the form to backend/email.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="font-semibold">Quick links</div>

              <div className="mt-4 grid gap-2 text-sm">
                <Link to="/docs" className="rounded-lg border px-3 py-2 hover:bg-slate-50">
                  Docs
                </Link>
                <Link to="/security" className="rounded-lg border px-3 py-2 hover:bg-slate-50">
                  Security
                </Link>
                <Link to="/pricing" className="rounded-lg border px-3 py-2 hover:bg-slate-50">
                  Pricing
                </Link>
                <Link to="/" className="rounded-lg border px-3 py-2 hover:bg-slate-50">
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer mini */}
        <div className="mt-12 text-xs text-slate-500">
          Tip: Later you can connect this form to a backend endpoint or email provider (Resend/SendGrid),
          without changing the UI.
        </div>
      </div>
    </div>
  );
}
