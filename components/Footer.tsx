import Link from "next/link";

function FooterBrandLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 font-heading">
      <span
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-sm"
        style={{
          background: "#e85025",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="text-white">
          <path
            d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M4 8l8 5 8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] leading-none shadow-sm">
          <span className="text-[#ff4757]" aria-hidden>
            ♥
          </span>
        </span>
      </span>
      <span className="text-xl font-bold tracking-tight">
        <span style={{ color: "var(--brand-primary)" }}>Invites</span>
        <span className="text-[var(--text-primary)]">Magic</span>
      </span>
    </Link>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.2 3.5 12 3.5 12 3.5s-7.2 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c2.2.6 9.4.6 9.4.6s7.2 0 9.4-.6a3 3 0 0 0 2.1-2.1 31.5 31.5 0 0 0 .5-5.8 31.5 31.5 0 0 0-.5-5.8ZM9.8 15.3V8.7L15.6 12l-5.8 3.3Z" />
    </svg>
  );
}

const templateLinks = [
  { label: "Wedding Templates", href: "/wedding" },
  { label: "Engagement Templates", href: "/templates?category=Engagement" },
  { label: "Birthday Templates", href: "/templates?category=Birthday" },
  { label: "Baby Templates", href: "/templates?category=Baby" },
  { label: "Anniversary Templates", href: "/templates?category=Anniversary" },
  { label: "House Warming Templates", href: "/templates?category=House Warming" },
] as const;

const linkMuted = "text-[#666666] transition hover:text-[var(--text-primary)]";
const heading = "font-heading text-[15px] font-bold text-[var(--text-primary)]";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#f0f0f0] bg-white text-[var(--text-primary)]">
      <div className="mx-auto max-w-[1400px] px-4 py-14 lg:px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div>
            <FooterBrandLogo />
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-[#666666]">
              Introducing InvitesMagic — the easiest way to create beautiful video invitations &amp; greetings instantly.
              Whether it&apos;s weddings, birthdays, anniversaries, or any celebration, we help you make it memorable.
            </p>
          </div>

          <div>
            <h3 className={heading}>Quick Links</h3>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              <li>
                <Link href="/" className={linkMuted}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about-us" className={linkMuted}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkMuted}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={heading}>Video Templates</h3>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {templateLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className={linkMuted}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={heading}>Contact Us</h3>
            <p className="mt-3 text-[14px] text-[#888888]">Have questions?</p>
            <Link
              href="/contact"
              className="mt-4 flex w-full items-center justify-center rounded-full px-5 py-3 text-center text-[14px] font-semibold text-white shadow-sm transition hover:brightness-[1.03]"
              style={{
                background: "#e85025",
              }}
            >
              Customer Support
            </Link>
            <Link
              href="/contact"
              className="mt-3 flex w-full items-center justify-center rounded-full border border-[#e0e0e0] bg-white px-5 py-3 text-center text-[14px] font-semibold text-[#444444] transition hover:bg-[#fafafa]"
            >
              Contact Admin
            </Link>

            <h3 className={`${heading} mt-8`}>Follow Us</h3>
            <div className="mt-4 flex gap-3">
              <a
                href="https://instagram.com/pixvite"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-sm transition hover:opacity-90"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-sm transition hover:opacity-90"
                aria-label="YouTube"
              >
                <YouTubeIcon />
              </a>
            </div>
          </div>
        </div>

        <hr className="my-12 border-[#e8e8e8]" />

        <div className="flex flex-col gap-4 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#999999]">© 2026 InvitesMagic. All rights reserved.</p>
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[var(--brand-primary)]">
            <Link href="/contact" className="transition hover:underline">
              Privacy Policy
            </Link>
            <span className="text-[#cccccc]" aria-hidden>
              |
            </span>
            <Link href="/contact" className="transition hover:underline">
              Terms of Use
            </Link>
            <span className="text-[#cccccc]" aria-hidden>
              |
            </span>
            <Link href="/contact" className="transition hover:underline">
              Refund &amp; Cancellation Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
