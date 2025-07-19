import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { isURL } from "validator";
import * as schema from "../../database/schema";

// Cache for storing frequently accessed data
export const cache = new Map<string, any>();

// Helper function to find a unique link
async function findUniqueLink(db: DrizzleD1Database<typeof schema>, alias: string) {
  if (cache.has(alias)) {
    console.log("Cache hit!");
    return cache.get(alias);
  } else {
    const result = await db.query.links.findFirst({
      where: eq(schema.links.alias, alias)
    });
    cache.set(alias, result);
    console.log("Cache miss!");
    return result;
  }
}

export async function getURL(db: DrizzleD1Database<typeof schema>, alias: string): Promise<string | null> {
  try {
    const result = await findUniqueLink(db, alias);

    if (!result) {
      console.log(`No record found for alias: ${alias}`);
      return null;
    }

    await db.update(schema.links)
      .set({ hits: result.hits + 1 })
      .where(eq(schema.links.alias, alias));

    // Update cache with new hit count
    cache.set(alias, { ...result, hits: result.hits + 1 });

    return result.link;
  } catch (error) {
    console.error("Error getting URL:", error);
    throw new Error("Failed to get URL.");
  }
}

export async function createRedirect(
  db: DrizzleD1Database<typeof schema>,
  url: string,
  aliases: string[],
): Promise<number> {
  try {
    console.log(`Requested creating ${url} with aliases ${aliases.join(", ")}.`);

    for (const alias of aliases) {
      const data = await findUniqueLink(db, alias);
      if (data) {
        console.log("Some aliases already exist.");
        return 1;
      }
    }

    if (!isURL(url)) {
      console.log("Invalid URL.", url);
      return 2;
    }

    for (const alias of aliases) {
      try {
        const result = await db.insert(schema.links).values({
          link: url,
          alias,
          hits: 0,
        }).returning();
        
        if (result[0]) {
          cache.set(alias, result[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }

    console.log(`Created: ${url} with aliases ${aliases.join(", ")}.`);
    return 0;
  } catch (error) {
    console.error("Error creating redirect:", error);
    throw new Error("Failed to create redirect.");
  }
}

export async function updateRedirect(
  db: DrizzleD1Database<typeof schema>,
  url: string,
  aliases: string[]
) {
  try {
    console.log(`Requested updating ${url} with aliases ${aliases.join(", ")}.`);

    for (const alias of aliases) {
      const data = await findUniqueLink(db, alias);
      if (!data) {
        console.log(`Cannot find existing aliases from ${aliases.join(", ")}`);
        return;
      }
    }

    if (!isURL(url)) {
      console.log("Invalid URL.");
      return;
    }

    for (const alias of aliases) {
      try {
        const result = await db.update(schema.links)
          .set({ link: url })
          .where(eq(schema.links.alias, alias))
          .returning();
          
        if (result[0]) {
          cache.set(alias, result[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }

    console.log(`Updated: ${aliases.join(", ")} with URL ${url}.`);
  } catch (error) {
    console.error("Error updating redirect:", error);
    throw new Error("Failed to update redirect.");
  }
}

export async function deleteRedirect(
  db: DrizzleD1Database<typeof schema>,
  aliases: string[]
) {
  try {
    console.log(`Requested deleting all URLs with aliases: ${aliases.join(", ")}.`);

    let count = 0;
    for (const alias of aliases) {
      const data = await findUniqueLink(db, alias);
      if (!data) continue;

      await db.delete(schema.links)
        .where(eq(schema.links.alias, alias));
      cache.delete(alias);
      count++;
    }

    if (count === 0) {
      console.log(`Cannot find existing URLs from ${aliases.join(", ")}.`);
      return;
    }

    console.log(`Deleted ${count} URLs with aliases: ${aliases.join(", ")}.`);
  } catch (error) {
    console.error("Error deleting redirect:", error);
    throw new Error("Failed to delete redirect.");
  }
}

export async function getData(
  db: DrizzleD1Database<typeof schema>,
  alias: string
) {
  try {
    return await findUniqueLink(db, alias);
  } catch (error) {
    console.error("Error getting data:", error);
    throw new Error("Failed to get data.");
  }
}

export async function GenerateRandomAlias(
  db: DrizzleD1Database<typeof schema>
): Promise<string> {
  // Generate random hex string using crypto API available in Cloudflare Workers
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const randomAlias = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 8);
  
  const data = await findUniqueLink(db, randomAlias);
  if (data) {
    return GenerateRandomAlias(db);
  }
  return randomAlias;
}
