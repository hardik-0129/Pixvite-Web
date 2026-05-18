import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InvitesMagic — Video Invitations",
  description: "Instant video invitations for weddings, birthdays, engagements & more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="flex min-h-full flex-col overflow-x-clip overflow-y-visible antialiased">
        <header className="sticky top-0 z-[1000] overflow-x-clip overflow-y-visible">
          <AnnouncementBar />
          <Navbar />
        </header>
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="top-center"
          offset={46}
          toastOptions={{
            style: {
              background: "#363636",
              color: "#fff",
              border: "none",
            },
          }}
        />
      </body>
    </html>
  );
}
