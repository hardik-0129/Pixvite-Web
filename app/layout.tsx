import type { Metadata } from "next";
import { Cormorant_Garamond, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
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
    <html lang="en" className={`${poppins.variable} ${cormorantGaramond.variable} h-full`}>
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
