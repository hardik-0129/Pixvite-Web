import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { AboutUsContent } from "@/components/AboutUsContent";

const playfairAbout = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair-about",
  display: "swap",
});

export const metadata: Metadata = {
  title: "About Us — InvitesMagic",
  description:
    "Learn how InvitesMagic helps you create premium, share-ready video invitations for weddings, birthdays, engagements, and more.",
};

export default function AboutUsPage() {
  return (
    <div className={playfairAbout.variable}>
      <AboutUsContent />
    </div>
  );
}
