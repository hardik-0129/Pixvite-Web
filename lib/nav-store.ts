import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const NAV_COLLECTION = "nav_config";

export type NavChild = {
  id: string;
  label: string;
  href: string;
  sortOrder: number;
};

export type NavItemDoc = {
  _id?: string;
  label: string;
  type: "dropdown" | "link";
  href?: string;
  highlightColor?: string;
  icon?: string;
  children?: NavChild[];
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
};

// Default nav seeded when DB is empty
const DEFAULT_NAV_ITEMS: Omit<NavItemDoc, "_id" | "createdAt">[] = [
  {
    label: "Wedding",
    type: "dropdown",
    sortOrder: 1,
    isVisible: true,
    children: [
      { id: "w-all", label: "All", href: "/category?category=Wedding", sortOrder: 1 },
      { id: "w-wi", label: "Wedding Invitation", href: "/category?category=Wedding&subcategory=Wedding%20Invitation", sortOrder: 2 },
      { id: "w-std", label: "Save The Date", href: "/category?category=Wedding&subcategory=Save%20The%20Date", sortOrder: 3 },
    ],
  },
  {
    label: "Engagement",
    type: "dropdown",
    sortOrder: 2,
    isVisible: true,
    children: [
      { id: "e-all", label: "All", href: "/category?category=Engagement", sortOrder: 1 },
      { id: "e-ei", label: "Engagement Invitation", href: "/category?category=Engagement&subcategory=Engagement%20Invitation", sortOrder: 2 },
    ],
  },
  {
    label: "Birthday",
    type: "dropdown",
    sortOrder: 3,
    isVisible: true,
    children: [
      { id: "b-all", label: "All", href: "/category?category=Birthday", sortOrder: 1 },
      { id: "b-bi", label: "Birthday Invitation", href: "/category?category=Birthday&subcategory=Birthday%20Invitation", sortOrder: 2 },
    ],
  },
  {
    label: "More",
    type: "dropdown",
    sortOrder: 4,
    isVisible: true,
    children: [
      { id: "m-baby", label: "Baby", href: "/category?category=Baby", sortOrder: 1 },
      { id: "m-ann", label: "Anniversary", href: "/category?category=Anniversary", sortOrder: 2 },
      { id: "m-hw", label: "House Warming", href: "/category?category=House%20Warming", sortOrder: 3 },
      { id: "m-rel", label: "Religious", href: "/category?category=Religious", sortOrder: 4 },
    ],
  },
  {
    label: "Festival Bundles",
    type: "link",
    href: "/festival-bundles",
    icon: "🎉",
    highlightColor: "#e85025",
    sortOrder: 5,
    isVisible: true,
  },
  {
    label: "About",
    type: "link",
    href: "/about-us",
    sortOrder: 6,
    isVisible: true,
  },
  {
    label: "Contact",
    type: "link",
    href: "/contact",
    sortOrder: 7,
    isVisible: true,
  },
];

export async function listNavItems(): Promise<NavItemDoc[]> {
  const db = await getDb();
  const col = db.collection<NavItemDoc & { _id?: ObjectId }>(NAV_COLLECTION);
  const count = await col.countDocuments();

  // Seed defaults on first run
  if (count === 0) {
    const now = new Date().toISOString();
    await col.insertMany(
      DEFAULT_NAV_ITEMS.map((item) => ({ ...item, createdAt: now }))
    );
  }

  const docs = await col.find({}).sort({ sortOrder: 1, createdAt: 1 }).toArray();
  return docs.map(({ _id, ...rest }) => ({ ...rest, _id: _id?.toString() }));
}

export async function createNavItem(
  item: Omit<NavItemDoc, "_id" | "createdAt">
): Promise<NavItemDoc> {
  const db = await getDb();
  const doc = { ...item, createdAt: new Date().toISOString() };
  const result = await db
    .collection<NavItemDoc & { _id?: ObjectId }>(NAV_COLLECTION)
    .insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function updateNavItem(
  id: string,
  update: Partial<Omit<NavItemDoc, "_id" | "createdAt">>
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection(NAV_COLLECTION)
    .updateOne({ _id: new ObjectId(id) }, { $set: update });
  return result.matchedCount > 0;
}

export async function deleteNavItem(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection(NAV_COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
