export type FormField = {
  name: string;
  label: string;
  defaultValue: string;
};

/** Short CC0 sample used so every template editor can play a real preview clip. */
export const DEFAULT_TEMPLATE_PREVIEW_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

/**
 * Maps a form field to live text drawn on top of the preview video (WYSIWYG-style).
 * Positions are percentages of the video frame (9:16). Tune per template / export.
 */
export type PreviewVideoTextOverlay = {
  field: string;
  topPct: number;
  leftPct: number;
  align?: "left" | "center" | "right";
  widthPct?: number;
  fontSizeRem?: number;
  color?: string;
  fontWeight?: string | number;
  lineHeight?: number;
  textShadow?: string;
};

export type Template = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  functions: number;
  duration: string;
  durationSeconds: number;
  price: number;
  originalPrice: number;
  thumbnail: string;
  formFields: FormField[];
  /** MP4/WebM URL for the editor preview (HTML5 video). Defaults in `buildOne` if omitted. */
  previewVideoUrl?: string;
  /** When set with `previewVideoUrl`, form values for these fields render on the video. */
  previewVideoTextOverlays?: PreviewVideoTextOverlay[];
  /** Public URL to Lottie JSON (Bodymovin) for the editor preview, e.g. `/lottie/name.json` */
  lottiePreviewUrl?: string;
};

const weddingTitles = [
  "Wedding Invitation",
  "Save The Date",
  "Engagement Invite",
  "Royal Wedding",
  "Floral Wedding",
];
const weddingSubs = ["Wedding Invitation", "Save The Date", "Engagement"];
const categories = ["Wedding", "Engagement", "Birthday", "Anniversary", "Baby", "House Warming"];

/** Collection sidebar — accordion groups (Engagement is top-level, not a Wedding sub). */
export const TEMPLATE_SIDEBAR_CATEGORIES: { name: string; subs: string[] }[] = [
  { name: "Wedding", subs: ["Wedding Invitation", "Save The Date"] },
  { name: "Engagement", subs: [] },
  { name: "Birthday", subs: ["Birthday Invitation"] },
  { name: "Baby", subs: [] },
  { name: "Anniversary", subs: [] },
  { name: "House Warming", subs: [] },
  { name: "Religious", subs: [] },
];

function thumbnailFor(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/711`;
}

function defaultFormFields(category: string): FormField[] {
  if (category === "Anniversary") {
    return [
      { name: "anniversaryYear", label: "Anniversary-Year", defaultValue: "20th" },
      { name: "anniversaryLabel", label: "Anniversary-Label", defaultValue: "Anniversary" },
      { name: "celebrationLabel", label: "Celebration-Label", defaultValue: "Celebration" },
      { name: "coupleName", label: "Couple-Name", defaultValue: "Jasmine & Diljit Singh" },
      { name: "introLine", label: "Intro-Line", defaultValue: "" },
    ];
  }
  return [
    { name: "groomName", label: "Groom Name", defaultValue: "Rohan" },
    { name: "brideName", label: "Bride Name", defaultValue: "Priya" },
    { name: "weddingDate", label: "Wedding Date", defaultValue: "12 December 2026" },
    { name: "venue", label: "Venue", defaultValue: "Grand Palace, Mumbai" },
    { name: "introLine", label: "Intro Line", defaultValue: "" },
  ];
}

function buildOne(index: number): Template {
  const id = `IM${100 + index}`;
  const cat = categories[index % categories.length];
  const title =
    cat === "Wedding"
      ? weddingTitles[index % weddingTitles.length]
      : `${cat} Invitation`;
  const durationSeconds = index % 3 === 0 ? 50 : index % 3 === 1 ? 32 : 24;
  const price = index % 4 === 0 ? 279 : 549;
  const original = price === 279 ? 800 : 1100;

  return {
    id,
    title,
    category: cat,
    subcategory: cat === "Wedding" ? weddingSubs[index % weddingSubs.length] : title,
    functions: (index % 4) + 2,
    duration: `${durationSeconds} sec`,
    durationSeconds,
    price,
    originalPrice: original,
    thumbnail: thumbnailFor(`pixvite-${id}`),
    previewVideoUrl: DEFAULT_TEMPLATE_PREVIEW_VIDEO,
    formFields: defaultFormFields(cat),
  };
}

const base = Array.from({ length: 63 }, (_, i) => buildOne(i));

/** Homepage / marketing grid — IM185–IM188 */
base[34] = {
  id: "IM185",
  title: "Wedding Invitation",
  category: "Wedding",
  subcategory: "Wedding Invitation",
  functions: 3,
  duration: "32 sec",
  durationSeconds: 32,
  price: 549,
  originalPrice: 1100,
  thumbnail: thumbnailFor("pixvite-IM185"),
  previewVideoUrl: DEFAULT_TEMPLATE_PREVIEW_VIDEO,
  formFields: defaultFormFields("Wedding"),
};
base[35] = {
  id: "IM186",
  title: "Baby Shower Invitation",
  category: "Baby",
  subcategory: "Baby Shower Invitation",
  functions: 2,
  duration: "23 sec",
  durationSeconds: 23,
  price: 349,
  originalPrice: 700,
  thumbnail: thumbnailFor("pixvite-IM186"),
  previewVideoUrl: DEFAULT_TEMPLATE_PREVIEW_VIDEO,
  formFields: defaultFormFields("Birthday"),
};
base[36] = {
  id: "IM187",
  title: "Anniversary Invitation",
  category: "Anniversary",
  subcategory: "Anniversary Invitation",
  functions: 2,
  duration: "21 sec",
  durationSeconds: 21,
  price: 349,
  originalPrice: 700,
  thumbnail: thumbnailFor("pixvite-IM187"),
  previewVideoUrl: DEFAULT_TEMPLATE_PREVIEW_VIDEO,
  formFields: defaultFormFields("Anniversary"),
};
base[37] = {
  id: "IM188",
  title: "Anniversary Invitation",
  category: "Anniversary",
  subcategory: "Anniversary Invitation",
  functions: 2,
  duration: "25 sec",
  durationSeconds: 25,
  price: 349,
  originalPrice: 700,
  thumbnail: thumbnailFor("pixvite-IM188"),
  previewVideoUrl: DEFAULT_TEMPLATE_PREVIEW_VIDEO,
  formFields: defaultFormFields("Anniversary"),
};

/** Engagement 20 — uses `public/videos/engagement-20.mp4` + live text overlays from form rows. */
const engagement20Invitation: Template = {
  id: "IM189",
  title: "Engagement Invitation",
  category: "Engagement",
  subcategory: "Engagement Invitation",
  functions: 3,
  duration: "30 sec",
  durationSeconds: 30,
  price: 549,
  originalPrice: 1100,
  thumbnail: thumbnailFor("pixvite-IM189-engagement"),
  previewVideoUrl: "/videos/engagement-20.mp4",
  previewVideoTextOverlays: [
    {
      field: "introGreeting",
      topPct: 10,
      leftPct: 50,
      align: "center",
      widthPct: 88,
      fontSizeRem: 0.65,
      color: "#fffef5",
      fontWeight: 600,
      lineHeight: 1.3,
      textShadow: "0 1px 3px rgba(0,0,0,0.9)",
    },
    {
      field: "eventTitle",
      topPct: 20,
      leftPct: 50,
      align: "center",
      widthPct: 86,
      fontSizeRem: 1.15,
      color: "#ffffff",
      fontWeight: 700,
      lineHeight: 1.2,
      textShadow: "0 2px 8px rgba(0,0,0,0.85)",
    },
    {
      field: "eventSubtitle",
      topPct: 36,
      leftPct: 50,
      align: "center",
      widthPct: 84,
      fontSizeRem: 0.68,
      color: "#f2ebe0",
      fontWeight: 500,
      lineHeight: 1.35,
      textShadow: "0 1px 4px rgba(0,0,0,0.9)",
    },
    {
      field: "eventDate",
      topPct: 54,
      leftPct: 50,
      align: "center",
      widthPct: 90,
      fontSizeRem: 0.85,
      color: "#ffffff",
      fontWeight: 600,
      lineHeight: 1.25,
      textShadow: "0 1px 4px rgba(0,0,0,0.9)",
    },
    {
      field: "eventTime",
      topPct: 60,
      leftPct: 50,
      align: "center",
      widthPct: 90,
      fontSizeRem: 0.72,
      color: "#eeeeee",
      fontWeight: 500,
      lineHeight: 1.2,
      textShadow: "0 1px 3px rgba(0,0,0,0.85)",
    },
    {
      field: "venueAddress",
      topPct: 68,
      leftPct: 50,
      align: "center",
      widthPct: 88,
      fontSizeRem: 0.65,
      color: "#e8e0d8",
      fontWeight: 500,
      lineHeight: 1.35,
      textShadow: "0 1px 4px rgba(0,0,0,0.9)",
    },
    {
      field: "hostNote",
      topPct: 80,
      leftPct: 50,
      align: "center",
      widthPct: 90,
      fontSizeRem: 0.62,
      color: "#ddd5cc",
      fontWeight: 500,
      lineHeight: 1.3,
      textShadow: "0 1px 3px rgba(0,0,0,0.85)",
    },
  ],
  formFields: [
    { name: "couplePhoto", label: "Couple-Photo-(9:16)", defaultValue: "" },
    { name: "introGreeting", label: "Intro-Greeting", defaultValue: "|| With joyful hearts ||" },
    { name: "eventTitle", label: "Event-Title-(2-lines)", defaultValue: "Engagement\nCelebration" },
    { name: "eventSubtitle", label: "Event-Subtitle-(3-lines-max)", defaultValue: "Join us as we begin\nour journey together\nwith your blessings" },
    { name: "eventDate", label: "Event-Date", defaultValue: "20 June 2026" },
    { name: "eventTime", label: "Event-Time", defaultValue: "6:00 PM onwards" },
    { name: "venueAddress", label: "Venue-Address-(2-lines-max)", defaultValue: "Grand Ballroom,\nMarine Drive, Mumbai" },
    { name: "hostNote", label: "Host-Family-Name", defaultValue: "With love, the Kapoor & Sharma families" },
  ],
};

export const templates: Template[] = [...base, engagement20Invitation];

export function getTemplateById(rawId: string): Template | undefined {
  return templates.find((t) => t.id === rawId);
}

export function filterTemplates(
  list: Template[],
  opts: {
    category?: string | null;
    subcategory?: string | null;
    search?: string;
    priceMin?: number | null;
    priceMax?: number | null;
    durationMin?: number | null;
    durationMax?: number | null;
  }
) {
  return list.filter((t) => {
    if (opts.category && t.category !== opts.category) return false;
    if (opts.subcategory && t.subcategory !== opts.subcategory) return false;
    if (opts.search) {
      const q = opts.search.toLowerCase();
      const hay = `${t.id} ${t.title} ${t.category} ${t.subcategory}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (opts.priceMin != null && t.price < opts.priceMin) return false;
    if (opts.priceMax != null && t.price > opts.priceMax) return false;
    if (opts.durationMin != null && t.durationSeconds < opts.durationMin) return false;
    if (opts.durationMax != null && t.durationSeconds > opts.durationMax) return false;
    return true;
  });
}
