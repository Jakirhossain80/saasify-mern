// FILE: client/src/components/Footer.tsx
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                ▦
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">SaaSify</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Public
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Modern multi-tenant SaaS foundation</p>
              </div>
            </div>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              The flexible MERN foundation for building modern SaaS products — focused on clarity, security, and developer
              experience.
            </p>

            {/* Social (no external libs) */}
            <div className="mt-6 flex items-center gap-2">
              <a
                href="#"
                aria-label="Twitter"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M19.944 7.926c.013.19.013.379.013.569 0 5.798-4.414 12.48-12.48 12.48-2.476 0-4.78-.721-6.717-1.963.354.04.695.053 1.062.053 2.04 0 3.924-.695 5.425-1.87a4.4 4.4 0 0 1-4.108-3.05c.27.04.54.066.823.066.393 0 .787-.053 1.154-.15A4.395 4.395 0 0 1 1.59 9.82v-.053c.58.324 1.245.528 1.95.553A4.392 4.392 0 0 1 2.18 4.93a12.48 12.48 0 0 0 9.06 4.598 4.956 4.956 0 0 1-.108-1.007 4.39 4.39 0 0 1 7.59-3.004 8.62 8.62 0 0 0 2.787-1.062 4.36 4.36 0 0 1-1.93 2.424 8.8 8.8 0 0 0 2.532-.682 9.4 9.4 0 0 1-2.167 2.23z" />
                </svg>
              </a>

              <a
                href="#"
                aria-label="GitHub"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.59 2 12.253c0 4.53 2.865 8.375 6.839 9.732.5.096.682-.22.682-.49 0-.24-.009-.876-.014-1.72-2.782.62-3.369-1.37-3.369-1.37-.455-1.18-1.11-1.494-1.11-1.494-.907-.643.069-.63.069-.63 1.003.072 1.531 1.055 1.531 1.055.892 1.562 2.341 1.11 2.91.848.092-.665.35-1.11.636-1.366-2.22-.262-4.555-1.139-4.555-5.065 0-1.118.39-2.034 1.03-2.752-.103-.262-.447-1.317.098-2.745 0 0 .84-.276 2.75 1.052A9.2 9.2 0 0 1 12 7.07c.85.004 1.705.118 2.504.345 1.909-1.328 2.747-1.052 2.747-1.052.547 1.428.203 2.483.1 2.745.64.718 1.028 1.634 1.028 2.752 0 3.936-2.338 4.8-4.566 5.056.359.315.678.936.678 1.887 0 1.362-.012 2.46-.012 2.796 0 .272.18.59.688.489C19.138 20.624 22 16.78 22 12.253 22 6.59 17.523 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>

              <a
                href="#"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452H17.2v-5.569c0-1.328-.026-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.064V9h3.112v1.561h.044c.433-.82 1.492-1.683 3.07-1.683 3.285 0 3.89 2.164 3.89 4.977v6.597zM5.337 7.433a1.807 1.807 0 1 1 0-3.614 1.807 1.807 0 0 1 0 3.614zM6.956 20.452H3.717V9h3.239v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.727v20.545C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.273V1.727C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Company</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Careers
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Product</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Docs
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Resources</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Status
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Security
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Legal</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Support */}
            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Need help?</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Reach our support team at{" "}
                    <a
                      href="mailto:support@saasify.dev"
                      className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      support@saasify.dev
                    </a>
                  </p>
                </div>
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">© {year} SaaSify-MERN. All rights reserved.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Designed with precision for modern builders.</p>
        </div>
      </div>
    </footer>
  );
}