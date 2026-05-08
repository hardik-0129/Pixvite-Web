import Link from "next/link";
import { sectionHeading } from "@/lib/sectionHeading";
import {
  BabyCategoryArt,
  BirthdayCategoryArt,
  EngagementCategoryArt,
  WeddingCategoryArt,
} from "@/components/invitation-category-art";

const tiles = [
  {
    label: "Wedding",
    href: "/wedding",
    bg: "linear-gradient(180deg, #fffdf8 0%, #f8f0e8 100%)",
    Art: WeddingCategoryArt,
  },
  {
    label: "Birthday",
    href: "/templates?category=Birthday",
    bg: "linear-gradient(180deg, #fffefb 0%, #fff3e0 100%)",
    Art: BirthdayCategoryArt,
  },
  {
    label: "Baby",
    href: "/templates?category=Baby",
    bg: "linear-gradient(180deg, #fafdff 0%, #e3f2fd 100%)",
    Art: BabyCategoryArt,
  },
  {
    label: "Engagement",
    href: "/templates?category=Engagement",
    bg: "linear-gradient(180deg, #fffafc 0%, #fce4ec 100%)",
    Art: EngagementCategoryArt,
  },
] as const;

export function InvitationCategories() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-6">
        <h2 className={`text-center leading-tight tracking-tight ${sectionHeading}`}>
          <span className="text-[var(--text-primary)]">Popular </span>
          <span className="text-[var(--brand-primary)]">Invitation Categories</span>
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {tiles.map(({ label, href, bg, Art }) => (
            <Link
              key={label}
              href={href}
              className="group relative flex aspect-square max-w-[280px] flex-col overflow-hidden rounded-[22px] shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] sm:max-w-none"
              style={{ background: bg }}
            >
              <div className="flex min-h-0 flex-1 items-center justify-center p-4 pt-6 sm:p-5">
                <Art className="h-full w-full max-h-[min(200px,42vw)] object-contain transition duration-200 group-hover:scale-[1.04]" />
              </div>
              <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center px-3 sm:bottom-5">
                <span className="rounded-full bg-[#1a1a1a] px-5 py-2 font-heading text-xs font-semibold text-white shadow-md sm:text-sm sm:px-6 sm:py-2.5">
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
