import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not set.");
}

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalForMongo.mongoClientPromise ??
  new MongoClient(uri)
    .connect()
    .then((client) => client);

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}
