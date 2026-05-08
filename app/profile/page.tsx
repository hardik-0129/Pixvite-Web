import type { Metadata } from "next";
import { ProfileDetailsClient } from "@/components/ProfileDetailsClient";

export const metadata: Metadata = {
  title: "My Account — Pixvite",
  description: "View and edit your Pixvite profile details.",
};

export default function ProfilePage() {
  return <ProfileDetailsClient />;
}
