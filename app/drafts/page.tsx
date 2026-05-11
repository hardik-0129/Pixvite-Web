import type { Metadata } from "next";
import { MyDraftsClient } from "@/components/MyDraftsClient";

export const metadata: Metadata = {
  title: "My Drafts — Pixvite",
  description: "Continue editing saved template drafts.",
};

export default function DraftsPage() {
  return <MyDraftsClient />;
}
