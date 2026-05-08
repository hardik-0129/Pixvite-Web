import { getDb } from "@/lib/mongodb";
import type { SidebarCategory, Template } from "@/lib/templates";
import { isFormFieldEnabled } from "@/lib/templates";

type TemplateDoc = {
  templateId: string;
  title: string;
  category: string;
  subcategory: string;
  status?: "active" | "draft";
  functions: number;
  duration: string;
  durationSeconds: number;
  price: number;
  originalPrice: number;
  thumbnail: string;
  formFields: Template["formFields"];
  previewVideoUrl?: string;
  previewAudioUrl?: string;
  previewFontUrls?: string[];
  lottiePreviewUrl?: string;
  createdAt?: string;
};

type CategoryDoc = {
  name: string;
  subs: string[];
  sortOrder: number;
};

const TEMPLATES_COLLECTION = "templates";
const CATEGORIES_COLLECTION = "categories";
const BACKEND_PREFIX =
  (process.env.BACKEND_PREFIX || process.env.NEXT_PUBLIC_BACKEND_PREFIX || "").trim().replace(/\/+$/, "");

function withBackendPrefix(url?: string) {
  if (!url) return url;
  const value = url.trim();
  if (!value) return value;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (!BACKEND_PREFIX) return value;
  if (value.startsWith("/")) return `${BACKEND_PREFIX}${value}`;
  return `${BACKEND_PREFIX}/${value}`;
}

function buildAutoOverlays(fields: Template["formFields"]): Template["previewVideoTextOverlays"] {
  const textFields = fields.filter((f) => (f.type ?? "text") !== "image" && isFormFieldEnabled(f)).slice(0, 6);
  return textFields.map((f, idx) => ({
    field: f.name,
    topPct: 14 + idx * 11,
    leftPct: 50,
    align: "center",
    widthPct: 86,
    fontSizeRem: idx === 0 ? 1 : 0.75,
    color: "#ffffff",
    fontWeight: idx === 0 ? 700 : 500,
    lineHeight: 1.25,
    textShadow: "0 1px 3px rgba(0,0,0,0.85)",
  }));
}

function mapDoc(doc: TemplateDoc): Template {
  const formFields = Array.isArray(doc.formFields) ? doc.formFields : [];
  return {
    id: doc.templateId,
    title: doc.title,
    category: doc.category,
    subcategory: doc.subcategory,
    status: doc.status ?? "active",
    functions: Number.isFinite(doc.functions) ? doc.functions : formFields.length,
    duration: doc.duration || `${doc.durationSeconds ?? 30} sec`,
    durationSeconds: Number.isFinite(doc.durationSeconds) ? doc.durationSeconds : 30,
    price: Number.isFinite(doc.price) ? doc.price : 0,
    originalPrice: Number.isFinite(doc.originalPrice) ? doc.originalPrice : Number.isFinite(doc.price) ? doc.price : 0,
    thumbnail: withBackendPrefix(doc.thumbnail) || "https://picsum.photos/seed/pixvite-template/400/711",
    formFields,
    previewVideoUrl: withBackendPrefix(doc.previewVideoUrl),
    previewAudioUrl: withBackendPrefix(doc.previewAudioUrl),
    previewFontUrls: Array.isArray(doc.previewFontUrls) ? doc.previewFontUrls.map((url) => withBackendPrefix(url) || url) : [],
    lottiePreviewUrl: withBackendPrefix(doc.lottiePreviewUrl),
    previewVideoTextOverlays: buildAutoOverlays(formFields),
  };
}

export async function listTemplates(): Promise<Template[]> {
  const db = await getDb();
  const docs = (await db
    .collection<TemplateDoc>(TEMPLATES_COLLECTION)
    .find({ status: { $ne: "draft" } })
    .sort({ createdAt: -1 })
    .toArray()) as TemplateDoc[];
  return docs.map(mapDoc);
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const db = await getDb();
  const doc = (await db.collection<TemplateDoc>(TEMPLATES_COLLECTION).findOne({ templateId: id })) as TemplateDoc | null;
  if (!doc) return null;
  return mapDoc(doc);
}

export async function listSidebarCategories(): Promise<SidebarCategory[]> {
  const db = await getDb();
  const docs = (await db
    .collection<CategoryDoc>(CATEGORIES_COLLECTION)
    .find({})
    .sort({ sortOrder: 1, name: 1 })
    .toArray()) as CategoryDoc[];

  return docs.map((d) => ({
    name: d.name,
    subs: Array.isArray(d.subs) ? d.subs : [],
  }));
}
