import { notFound } from "next/navigation";
import { TemplateDetailForm } from "@/components/TemplateDetailForm";
import { getTemplateById } from "@/lib/templates";

type Props = { params: Promise<{ id: string }> };

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params;
  const template = getTemplateById(id);
  if (!template) notFound();

  return <TemplateDetailForm template={template} />;
}
