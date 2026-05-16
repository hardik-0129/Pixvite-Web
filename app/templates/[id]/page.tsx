export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { TemplateDetailForm } from "@/components/TemplateDetailForm";
import { getTemplateById } from "@/lib/template-store";

type Props = { params: Promise<{ id: string }> };

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params;
  const template = await getTemplateById(id);
  if (!template) notFound();

  return <TemplateDetailForm key={template.id} template={template} />;
}
