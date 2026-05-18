import type { Metadata } from "next";
import { ProfileDetailsClient } from "@/components/ProfileDetailsClient";

export const metadata: Metadata = {
  title: "My Account — InvitesMagic",
  description: "View and edit your InvitesMagic profile details.",
};

export default function ProfilePage() {
  return <ProfileDetailsClient />;
}
