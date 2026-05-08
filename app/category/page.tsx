import { redirect } from "next/navigation";

type Search = { category?: string; subcategory?: string };

export default async function CategoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const p = await searchParams;
  const qs = new URLSearchParams();
  if (p.category) qs.set("category", p.category);
  if (p.subcategory) qs.set("subcategory", p.subcategory);
  const tail = qs.toString();
  redirect(tail ? `/templates?${tail}` : "/templates");
}
