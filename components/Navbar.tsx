"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const touch = {
  touchAction: "manipulation" as const,
  WebkitTapHighlightColor: "transparent" as const,
};

function ChevronDown({ className = "h-4 w-4", flipped }: { className?: string; flipped?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} shrink-0 transition-transform duration-200 ${flipped ? "-rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon({ className = "h-5 w-5 text-gray-700" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function MenuIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
    </svg>
  );
}

function DropdownLink({
  href,
  className = "",
  children,
  onNavigate,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`block touch-manipulation rounded-lg px-4 py-2.5 text-sm hover:bg-gray-100 ${className}`}
      style={touch}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}

function NavDropdown({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="group relative" style={touch}>
      <button
        type="button"
        className="flex items-center gap-1 px-4 py-2 font-medium"
        style={touch}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown />
      </button>
      <div className="invisible absolute left-0 top-full z-[2000] mt-1 w-56 rounded-md border border-gray-200 bg-[var(--card-bg)] p-1 opacity-0 shadow-lg transition-all group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
        {children}
      </div>
    </div>
  );
}

type MobileLink = { href: string; label: string };

type MobileSection = { id: string; title: string; links: MobileLink[] };

const popularSearchTerms = ["Wedding", "Engagement", "Birthday", "Baby"] as const;

const mobileMenuSections: MobileSection[] = [
  {
    id: "wedding",
    title: "Wedding",
    links: [
      { href: "/category?category=Wedding", label: "All" },
      { href: "/category?category=Wedding&subcategory=Wedding%20Invitation", label: "Wedding Invitation" },
      { href: "/category?category=Wedding&subcategory=Save%20The%20Date", label: "Save The Date" },
    ],
  },
  {
    id: "engagement",
    title: "Engagement",
    links: [
      { href: "/category?category=Engagement", label: "All" },
      { href: "/category?category=Engagement&subcategory=Engagement%20Invitation", label: "Engagement Invitation" },
    ],
  },
  {
    id: "birthday",
    title: "Birthday",
    links: [
      { href: "/category?category=Birthday", label: "All" },
      { href: "/category?category=Birthday&subcategory=Birthday%20Invitation", label: "Birthday Invitation" },
    ],
  },
  {
    id: "baby",
    title: "Baby",
    links: [{ href: "/category?category=Baby", label: "All" }],
  },
  {
    id: "anniversary",
    title: "Anniversary",
    links: [{ href: "/category?category=Anniversary", label: "All" }],
  },
  {
    id: "house",
    title: "House Warming",
    links: [{ href: "/category?category=House%20Warming", label: "All" }],
  },
  {
    id: "religious",
    title: "Religious",
    links: [{ href: "/category?category=Religious", label: "All" }],
  },
];

export function Logo() {
  return (
    <Link
      href="/"
      className="flex min-w-0 max-w-full touch-manipulation cursor-pointer items-center gap-1.5 sm:gap-2"
      style={touch}
      aria-label="Go to home page"
    >
      <Image src="/logo/logo.svg" alt="" width={40} height={40} className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" sizes="40px" priority />
      <span
        className="min-w-0 truncate text-lg font-bold leading-tight sm:text-2xl"
        style={{ fontFamily: "var(--font-header)" }}
      >
        <span style={{ color: "var(--brand-end)" }}>Pix</span>
        <span style={{ color: "var(--foreground)" }}>vite</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    setOpenSection(null);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  const openSearch = useCallback(() => {
    setMobileOpen(false);
    setOpenSection(null);
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    function syncAuthFromLocalStorage() {
      const token = localStorage.getItem("pixvite_token");
      setIsAuthenticated(Boolean(token));
    }

    syncAuthFromLocalStorage();
    setMounted(true);
    window.addEventListener("storage", syncAuthFromLocalStorage);
    window.addEventListener("pixvite-auth-change", syncAuthFromLocalStorage);

    return () => {
      window.removeEventListener("storage", syncAuthFromLocalStorage);
      window.removeEventListener("pixvite-auth-change", syncAuthFromLocalStorage);
    };
  }, []);

  useEffect(() => {
    const locked = mobileOpen || searchOpen;
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setOpenSection(null);
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    if (!searchOpen || !mounted) return;
    const el = document.getElementById("navbar-search-input");
    queueMicrotask(() => el?.focus());
  }, [searchOpen, mounted]);

  function submitSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    const q = searchQuery.trim();
    closeSearch();
    router.push(q ? `/templates?q=${encodeURIComponent(q)}` : "/templates");
  }

  function goPopular(term: string) {
    closeSearch();
    router.push(`/templates?q=${encodeURIComponent(term)}`);
  }

  function toggleSection(id: string) {
    setOpenSection((cur) => (cur === id ? null : id));
  }

  function handleLogout() {
    localStorage.removeItem("pixvite_token");
    setIsAuthenticated(false);
    closeMobile();
    router.push("/login");
    router.refresh();
  }

  const mobileDrawer =
    mounted && mobileOpen ? (
      <div className="fixed inset-0 z-[5000] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-nav-title">
        <button
          type="button"
          className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          aria-label="Close menu"
          onClick={closeMobile}
        />
        <div
          id="mobile-nav-drawer"
          className="absolute right-0 top-0 flex h-[100dvh] w-[min(100%,340px)] flex-col rounded-tl-2xl bg-white shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4">
            <p id="mobile-nav-title" className="font-heading text-lg font-bold text-[var(--foreground)]">
              Menu
            </p>
            <button
              type="button"
              onClick={closeMobile}
              className="flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-gray-600 transition hover:bg-gray-100"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 pb-6 pt-2">
            {mobileMenuSections.map((section) => {
              const open = openSection === section.id;
              return (
                <div key={section.id} className="border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    className="flex w-full touch-manipulation items-center justify-between gap-2 px-3 py-3.5 text-left"
                    style={touch}
                    aria-expanded={open}
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className="font-heading text-base font-semibold text-[var(--foreground)]">{section.title}</span>
                    <ChevronDown className="h-5 w-5 text-gray-500" flipped={open} />
                  </button>
                  {open && (
                    <div className="border-t border-gray-50 bg-gray-50/60 px-2 py-2">
                      {section.links.map((link) => (
                        <DropdownLink key={link.href} href={link.href} onNavigate={closeMobile} className="text-[var(--foreground)]">
                          {link.label}
                        </DropdownLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-4 flex flex-col gap-3 px-2">
              <Link
                href="/festival-bundles"
                className="rounded-full py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                style={{ background: "#e85025" }}
                onClick={closeMobile}
              >
                🎉 Festival Bundles
              </Link>
              <Link
                href="/about-us"
                className="py-2 text-center text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--foreground)]"
                onClick={closeMobile}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="py-2 text-center text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--foreground)]"
                onClick={closeMobile}
              >
                Contact
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/drafts"
                    className="py-2 text-center text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--foreground)]"
                    onClick={closeMobile}
                  >
                    My Drafts
                  </Link>
                  <Link
                    href="/profile"
                    className="rounded-full py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                    style={{ background: "#e85025", ...touch }}
                    onClick={closeMobile}
                  >
                    My Account
                  </Link>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border)] bg-white py-3.5 text-center text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                    style={touch}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                  style={{ background: "#e85025", ...touch }}
                  onClick={closeMobile}
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    ) : null;

  const searchModal =
    mounted && searchOpen ? (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[1001]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          aria-label="Close search"
          onClick={closeSearch}
        />
        <div
          id="navbar-search-popover"
          role="dialog"
          aria-modal="true"
          aria-labelledby="navbar-search-title"
          className="fixed left-1/2 top-24 z-[1002] w-full max-w-3xl -translate-x-1/2 px-4 sm:top-28 sm:px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-lg bg-[var(--card-bg)] p-5 shadow-xl sm:p-6 lg:p-8">
            <form
              className="mb-5 flex flex-col items-stretch gap-4 sm:mb-6 sm:flex-row sm:items-center sm:gap-4"
              onSubmit={submitSearch}
            >
              <div className="relative flex-1">
                <input
                  id="navbar-search-input"
                  placeholder="Search for templates"
                  type="search"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border-2 bg-[var(--input)] px-4 py-3 pr-12 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand-end)] focus:ring-2 focus:ring-[var(--brand-end)]/25"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                />
                <SearchIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
              </div>
              <button
                type="button"
                className="whitespace-nowrap text-right text-base font-medium transition-colors hover:opacity-80 sm:text-left sm:px-0 sm:py-0"
                style={{ color: "var(--foreground)", ...touch }}
                onClick={closeSearch}
              >
                Cancel
              </button>
            </form>
            <div className="mt-2 sm:mt-0">
              <h3 id="navbar-search-title" className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg" style={{ color: "var(--foreground)" }}>
                Popular searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearchTerms.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: "var(--muted)", color: "var(--foreground)" }}
                    onClick={() => goPopular(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    ) : null;

  return (
    <nav
      className="w-full overflow-x-clip overflow-y-visible border-b border-gray-200 bg-[var(--card-bg)] shadow-sm backdrop-blur-xl"
      style={{ touchAction: "manipulation" }}
    >
      <div className="mx-auto max-w-[1400px] overflow-x-clip overflow-y-visible px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-20 w-full min-h-0 min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center">
            <Logo />
          </div>

          <div className="hidden items-center gap-2 overflow-visible sm:gap-3 md:gap-4 lg:flex">
            <div className="flex items-center gap-1">
              <NavDropdown label="Wedding">
                <DropdownLink href="/category?category=Wedding" className="font-medium">
                  All
                </DropdownLink>
                <DropdownLink href="/category?category=Wedding&subcategory=Wedding%20Invitation">Wedding Invitation</DropdownLink>
                <DropdownLink href="/category?category=Wedding&subcategory=Save%20The%20Date">Save The Date</DropdownLink>
              </NavDropdown>

              <NavDropdown label="Engagement">
                <DropdownLink href="/category?category=Engagement" className="font-medium">
                  All
                </DropdownLink>
                <DropdownLink href="/category?category=Engagement&subcategory=Engagement%20Invitation">Engagement Invitation</DropdownLink>
              </NavDropdown>

              <NavDropdown label="Birthday">
                <DropdownLink href="/category?category=Birthday" className="font-medium">
                  All
                </DropdownLink>
                <DropdownLink href="/category?category=Birthday&subcategory=Birthday%20Invitation">Birthday Invitation</DropdownLink>
              </NavDropdown>

              <NavDropdown label="More">
                <DropdownLink href="/category?category=Baby">Baby</DropdownLink>
                <DropdownLink href="/category?category=Anniversary">Anniversary</DropdownLink>
                <DropdownLink href="/category?category=House%20Warming">House Warming</DropdownLink>
                <DropdownLink href="/category?category=Religious">Religious</DropdownLink>
              </NavDropdown>

              <Link
                href="/festival-bundles"
                className="ml-1 inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "#e85025", ...touch }}
              >
                🎉 Festival Bundles
              </Link>

              <Link
                href="/about-us"
                className="touch-manipulation cursor-pointer px-4 py-2 font-medium"
                style={{ color: "var(--foreground)", ...touch }}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="touch-manipulation cursor-pointer px-4 py-2 font-medium"
                style={{ color: "var(--foreground)", ...touch }}
              >
                Contact
              </Link>
            </div>

            <button
              type="button"
              className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center rounded-full border transition-colors hover:bg-gray-100 sm:h-10 sm:w-10"
              style={touch}
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls="navbar-search-popover"
              onClick={openSearch}
            >
              <SearchIcon />
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 overflow-visible sm:gap-2">
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full border border-gray-200 bg-white/90 transition-colors hover:bg-gray-100 sm:h-10 sm:w-10 lg:hidden"
              style={touch}
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls="navbar-search-popover"
              onClick={openSearch}
            >
              <SearchIcon className="h-[18px] w-[18px] text-gray-700 sm:h-5 sm:w-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-4 sm:flex">
                {mounted && (isAuthenticated ? (
                  <>
                    <Link
                      href="/drafts"
                      className="touch-manipulation cursor-pointer px-3 py-2 text-sm font-medium text-[var(--foreground)] underline-offset-4 transition hover:text-rose-600 hover:underline"
                      style={touch}
                    >
                      My Drafts
                    </Link>
                    <Link
                      href="/profile"
                      className="rounded-full px-6 py-2 font-medium text-white"
                      style={{ background: "#e85025" }}
                    >
                      My Account
                    </Link>
                    <button
                      type="button"
                      className="rounded-full border border-[var(--border)] bg-white px-6 py-2 font-medium text-[var(--foreground)]"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full px-6 py-2 font-medium text-white"
                    style={{ background: "#e85025" }}
                  >
                    Login
                  </Link>
                ))}
              </div>

              <button
                type="button"
                className="inline-flex h-9 shrink-0 touch-manipulation items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-2.5 py-1.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-gray-100 sm:h-10 sm:px-3 lg:hidden"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-drawer"
                onClick={() => {
                  setSearchOpen(false);
                  setMobileOpen(true);
                }}
              >
                <MenuIcon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
                <span className="font-heading text-xs leading-none sm:text-sm">Menu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {mounted && mobileOpen ? createPortal(mobileDrawer!, document.body) : null}
      {mounted && searchOpen ? createPortal(searchModal!, document.body) : null}
    </nav>
  );
}
