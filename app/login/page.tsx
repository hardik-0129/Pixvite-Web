import type { Metadata } from "next";
import { LoginSignupClient } from "@/components/LoginSignupClient";

export const metadata: Metadata = {
  title: "Login — Pixvite",
  description: "Log in or create a Pixvite account to manage your video invitations.",
};

export default function LoginPage() {
  return <LoginSignupClient />;
}
