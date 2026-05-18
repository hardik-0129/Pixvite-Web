import Image from "next/image";
import Link from "next/link";

const statCardClass =
  "w-[calc(50%-0.5rem)] max-w-[calc(50%-0.5rem)] shrink-0 sm:w-[220px] sm:max-w-none rounded-2xl border border-pink-100 bg-white/70 px-4 py-6 text-center shadow-[0_10px_40px_rgba(255,91,91,0.15)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_20px_60px_rgba(255,91,91,0.25)] sm:px-6 sm:py-10";

const categoryPillClass =
  "group flex items-center gap-3 rounded-full border border-pink-100 bg-white px-5 py-2.5 font-medium text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-pink-50 hover:text-[#e85025] hover:shadow-md";

const featureCardClass =
  "flex w-full flex-col gap-3 rounded-2xl border border-[#ffe0da] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)] md:p-7";

const iconWrapClass =
  "mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#feede3] text-[#e85025]";

function IconHeart({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
    </svg>
  );
}

function IconGem({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10.5 3 8 9l4 13 4-13-2.5-6" />
      <path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" />
      <path d="M2 9h20" />
    </svg>
  );
}

function IconCake({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
      <path d="M2 21h20" />
      <path d="M7 8v3M12 8v3M17 8v3" />
      <path d="M7 4h.01M12 4h.01M17 4h.01" />
    </svg>
  );
}

function IconBaby({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
      <path d="M15 12h.01" />
      <path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
      <path d="M9 12h.01" />
    </svg>
  );
}

function IconSparkles({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </svg>
  );
}

function IconGift({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

function IconRibbon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 11.22C11 9.997 10 9 10 8a2 2 0 0 1 4 0c0 1-.998 2.002-2.01 3.22" />
      <path d="m12 18 2.57-3.5M6.243 9.016a7 7 0 0 1 11.507-.009M9.35 14.53 12 11.22" />
      <path d="M9.35 14.53C7.728 12.246 6 10.221 6 7a6 5 0 0 1 12 0c-.005 3.22-1.778 5.235-3.43 7.5l3.557 4.527a1 1 0 0 1-.203 1.43l-1.894 1.36a1 1 0 0 1-1.384-.215L12 18l-2.679 3.593a1 1 0 0 1-1.39.213l-1.865-1.353a1 1 0 0 1-.203-1.422z" />
    </svg>
  );
}

function IconLamp({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 12v6" />
      <path d="M4.077 10.615A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23Z" />
      <path d="M8 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function IconScissors({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12M20 4 8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </svg>
  );
}

function IconCircleDot({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function IconLanguages({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1" />
      <path d="m22 22-5-10-5 10M14 18h6" />
    </svg>
  );
}

function IconLayout({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <rect width="18" height="7" x="3" y="3" rx="1" />
      <rect width="9" height="7" x="3" y="14" rx="1" />
      <rect width="5" height="7" x="16" y="14" rx="1" />
    </svg>
  );
}

function IconEye({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconCreditCard({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function IconBadgeDollar({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 18V6" />
    </svg>
  );
}

function IconDownload({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <path d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5" />
    </svg>
  );
}

function IconShare({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49" />
    </svg>
  );
}

function IconHeadphones({ className = "h-[22px] w-[22px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

const categories = [
  { href: "/category?category=Wedding", label: "Wedding Invitation Video", Icon: IconHeart },
  { href: "/category?category=Engagement", label: "Engagement Invitation Video", Icon: IconGem },
  { href: "/category?category=Birthday", label: "Birthday Invitation Video", Icon: IconCake },
  { href: "/category?category=Baby", label: "Baby Shower Invitation Video", Icon: IconBaby },
  { href: "/category?category=Baby", label: "Naming Invitation Video", Icon: IconSparkles },
  { href: "/category?category=Anniversary", label: "Anniversary Invitation Video", Icon: IconGift },
  { href: "/category?category=House%20Warming", label: "Inauguration Invitation Video", Icon: IconRibbon },
  { href: "/category?category=Religious", label: "Puja Invitation Video", Icon: IconLamp },
  { href: "/category?category=Baby", label: "Mundan Invitation Video", Icon: IconScissors },
  { href: "/category?category=Wedding", label: "Thread Invitation Video", Icon: IconCircleDot },
] as const;

const whyFeatures = [
  {
    title: "Multi-Language Support",
    body: "Easily make video invitations in any language.",
    Icon: IconLanguages,
  },
  {
    title: "Multiple Templates",
    body: "Choose from various templates when making invitation videos.",
    Icon: IconLayout,
  },
  {
    title: "Real-Time Preview",
    body: "Preview your online invitation video before finalizing.",
    Icon: IconEye,
  },
  {
    title: "Edit First, Pay Later",
    body: "Create a video invite and pay only when you're satisfied.",
    Icon: IconCreditCard,
  },
  {
    title: "Cost-Effective Pricing",
    body: "Affordable pricing for high-quality video invitations.",
    Icon: IconBadgeDollar,
  },
  {
    title: "HD Download",
    body: "Download your HD video invitation for top-quality sharing.",
    Icon: IconDownload,
  },
  {
    title: "Quick Share",
    body: "Instantly share your WhatsApp invite video or digital invite video.",
    Icon: IconShare,
  },
  {
    title: "24/7 Support",
    body: "Get assistance anytime while creating your video invitation.",
    Icon: IconHeadphones,
  },
] as const;

const heroImageSrc = "https://picsum.photos/seed/pixvite-about-hero/1200/900";
const visionImageSrc = "https://picsum.photos/seed/pixvite-about-vision/1200/900";

export function AboutUsContent() {
  return (
    <>
      <div
        className="min-h-screen font-body"
        style={{
          background: "#feede3",
        }}
      >
        <div className="relative overflow-hidden pb-5 pt-5 sm:pb-10 sm:pt-10">
          <div className="relative z-[5] mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="font-about-display text-3xl font-semibold leading-tight text-[#2b1e1e] sm:text-5xl md:text-6xl">
              Welcome to Our World of <br />
              <span className="text-about-linear">Invitation Videos!</span>
            </h1>
            <p className="mx-auto mt-5 max-w-4xl text-[1.1rem] leading-9 text-gray-600 sm:mt-6 sm:text-lg sm:leading-relaxed">
              InvitesMagic was created with one simple purpose: to make invitation videos that feel premium, personal, and easy to
              share. We started with the belief that announcing your special day shouldn&apos;t require editing skills or expensive
              studios. With the right design, music, and motion—anyone can send a video invite that truly feels special.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4 sm:mt-14 sm:gap-6">
              <div className={statCardClass}>
                <p className="font-about-display text-3xl font-semibold text-gradient-rose-about sm:text-4xl lg:text-5xl">10K+</p>
                <p className="mt-3 text-sm font-medium text-gray-700 sm:mt-4 sm:text-lg">Happy Users</p>
              </div>
              <div className={statCardClass}>
                <p className="font-about-display text-3xl font-semibold text-gradient-rose-about sm:text-4xl lg:text-5xl">500+</p>
                <p className="mt-3 text-sm font-medium text-gray-700 sm:mt-4 sm:text-lg">Templates</p>
              </div>
              <div className={statCardClass}>
                <p className="font-about-display text-3xl font-semibold text-gradient-rose-about sm:text-4xl lg:text-5xl">50K+</p>
                <p className="mt-3 text-sm font-medium text-gray-700 sm:mt-4 sm:text-lg">Invitations Sent</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 px-5 py-8 sm:py-12 xl:px-[7%]">
            <div className="flex w-full max-w-7xl flex-col items-center gap-5 lg:flex-row-reverse">
              <div className="order-2 flex w-full flex-col items-center justify-center py-8 pb-0 max-lg:order-2 lg:w-1/2 lg:py-0">
                <div className="flex w-[90%] max-w-xl flex-col gap-5 max-lg:w-[80%] max-sm:w-full">
                  <div className="space-y-6">
                    <h2 className="font-about-display text-2xl font-semibold text-[#2b1e1e] max-xs:text-2xl sm:text-4xl md:text-5xl">
                      What is <span className="text-about-linear">InvitesMagic?</span>
                    </h2>
                    <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                      InvitesMagic is an online invitation video platform that helps you create modern, share-ready video invites for
                      all kinds of events. You can choose a style, add your details (names, date, time, venue, RSVP), and get a polished
                      invitation video that&apos;s perfect for WhatsApp, Instagram, and email.
                    </p>
                    <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                      Unlike general design tools, InvitesMagic focuses on one thing only: creating high-quality invitation videos that
                      look premium, feel personal, and are easy to share.
                    </p>
                  </div>
                </div>
              </div>
              <div className="order-1 flex w-full justify-center max-lg:w-full lg:w-1/2">
                <div className="w-full max-w-[650px]">
                  <div className="relative h-[min(450px,70vw)] w-full overflow-hidden rounded-[30px] sm:h-[450px]">
                    <Image
                      src={heroImageSrc}
                      alt="Team working on invitation videos"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-16 sm:py-20" style={{ backgroundColor: "#feede3" }}>
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-about-display mb-4 text-4xl font-semibold text-[#2b1e1e] md:text-5xl">
              Design <span className="text-about-linear">Everything</span> You Need
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-gray-600">
              From intimate gatherings to grand celebrations, create designs for every occasion.
            </p>
            <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4">
              {categories.map(({ href, label, Icon }) => (
                <Link key={label} href={href} className={categoryPillClass}>
                  <Icon />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-5 py-8 sm:py-12 xl:px-[7%]">
            <div className="flex w-full max-w-7xl flex-col items-center gap-5 lg:flex-row">
              <div className="order-2 flex w-full flex-col items-center justify-center py-8 pb-0 lg:order-1 lg:w-1/2 lg:py-0">
                <div className="flex w-[90%] max-w-xl flex-col gap-5 max-lg:w-[80%] max-sm:w-full">
                  <div className="space-y-6">
                    <h2 className="font-about-display text-2xl font-semibold text-[#2b1e1e] max-xs:text-2xl sm:text-4xl md:text-5xl">
                      Our Mission <span className="text-about-linear">&amp; Vision</span>
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-base font-semibold text-[#3e2c2c] sm:text-lg">Our Mission</p>
                        <p className="text-sm leading-relaxed text-[#6b4f4f] sm:text-base">
                          To deliver modern invitation videos that are effortless to order, beautifully designed, and instantly
                          shareable—without any editing skills. We keep it simple: fast delivery, smooth communication, and a premium
                          final video every time.
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-base font-semibold text-[#3e2c2c] sm:text-lg">Our Vision</p>
                        <p className="text-sm leading-relaxed text-[#6b4f4f] sm:text-base">
                          To be the most trusted name for invitation videos—known for clean design, refined motion, and a seamless
                          experience built for WhatsApp and social sharing.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <div className="w-1/2 rounded-2xl border border-pink-200 bg-[#feede3] px-4 py-4 shadow-sm">
                        <p className="text-center font-about-display text-2xl font-bold md:text-4xl" style={{ color: "#e85025" }}>100%</p>
                        <p className="text-center text-sm text-[#6b4f4f] md:text-lg">Customer Focused</p>
                      </div>
                      <div className="w-1/2 rounded-2xl border border-pink-200 bg-[#feede3] px-4 py-4 shadow-sm">
                        <p className="text-center font-about-display text-2xl font-bold md:text-4xl" style={{ color: "#e85025" }}>24/7</p>
                        <p className="text-center text-sm text-[#6b4f4f] md:text-lg">Support Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 flex w-full justify-center max-lg:w-full lg:order-2 lg:w-1/2">
                <div className="w-full max-w-[650px]">
                  <div className="relative h-[min(450px,70vw)] w-full overflow-hidden rounded-[30px] sm:h-[450px]">
                    <Image
                      src={visionImageSrc}
                      alt="InvitesMagic on laptop and tablet"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#fdf7f5]">
          <div
            className="px-4 py-6 sm:px-6 lg:px-8"
            style={{
              background: "#feede3",
            }}
          >
            <div className="mx-auto max-w-6xl pb-10 pt-4">
              <h2 className="text-center font-about-display text-[26px] font-black text-[#1A1A1A] md:text-[40px] lg:text-[44px]">
                Why Choose
                <span className="ml-2 text-about-linear">InvitesMagic?</span>
              </h2>
              <p className="mx-auto mb-6 mt-2 max-w-[600px] px-2 text-center text-sm leading-relaxed text-[#6B7280] md:text-base">
                Start making invitation videos today with InvitesMagic!
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
                {whyFeatures.map(({ title, body, Icon }) => (
                  <div key={title} className={featureCardClass}>
                    <div className={iconWrapClass}>
                      <Icon />
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#111827] md:text-[17px]">{title}</h3>
                    <p className="text-[13px] leading-snug text-[#6b7280] md:text-[14px]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white px-4 py-14 sm:py-16">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-[#e85025] px-6 py-14 text-center shadow-xl sm:px-12 sm:py-16">
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5" />
            <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5" />
            <div className="relative flex flex-col items-center gap-6">
              <p className="font-about-display text-3xl font-bold text-white sm:text-5xl">
                Make Beautiful Video Invitations in Minutes
              </p>
              <p className="mx-auto max-w-lg text-base text-white/80 sm:text-[17px]">
                Choose a video template, customize your details, and download or share instantly—no design skills needed.
              </p>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-3.5 text-sm font-semibold text-[#e85025] shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Create Your Invitation →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
