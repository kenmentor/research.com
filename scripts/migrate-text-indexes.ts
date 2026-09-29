import { connectDB } from "../lib/db";

/** One-off: drop pre-weight text indexes so the renamed weighted ones build. */
async function main() {
  const mongoose = await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("No db handle");
  for (const [coll, name] of [
    ["publications", "publication_text"],
    ["profiles", "profile_text"],
  ] as const) {
    try {
      await db.collection(coll).dropIndex(name);
      console.log(`dropped ${coll}.${name}`);
    } catch (e) {
      console.log(`skip ${coll}.${name}: ${(e as Error).message.split("\n")[0]}`);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});
