import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { isURL } from "validator";
import * as schema from "../../database/schema";
import { hashPassword, verifyPassword } from "./password";

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
  userId?: number
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
          userId: userId || null,
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

// ==================== User Management Functions ====================

/**
 * Create a new user account
 * First user created will be admin
 */
export async function createUser(
  db: DrizzleD1Database<typeof schema>,
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; message: string; isFirstUser?: boolean }> {
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.username, username)
    });

    if (existingUser) {
      return { success: false, message: "Username already exists" };
    }

    // Check if email already exists
    const existingEmail = await db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });

    if (existingEmail) {
      return { success: false, message: "Email already exists" };
    }

    // Check if this is the first user
    const allUsers = await db.query.users.findMany();
    const isFirstUser = allUsers.length === 0;

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    await db.insert(schema.users).values({
      username,
      email,
      password: hashedPassword,
      isAdmin: isFirstUser, // First user is admin
    }).returning();

    console.log(`User created: ${username}${isFirstUser ? ' (ADMIN)' : ''}`);
    
    return { 
      success: true, 
      message: isFirstUser 
        ? "Account created successfully! You are the first user and have been granted admin privileges." 
        : "Account created successfully!",
      isFirstUser
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: "Failed to create user" };
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(
  db: DrizzleD1Database<typeof schema>,
  username: string
) {
  try {
    return await db.query.users.findFirst({
      where: eq(schema.users.username, username)
    });
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  db: DrizzleD1Database<typeof schema>,
  email: string
) {
  try {
    return await db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

/**
 * Verify user credentials using email
 */
export async function verifyUser(
  db: DrizzleD1Database<typeof schema>,
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; message?: string }> {
  try {
    const user = await getUserByEmail(db, email);
    
    if (!user) {
      return { success: false, message: "Invalid email or password" };
    }

    const isValidPassword = await verifyPassword(user.password, password);
    
    if (!isValidPassword) {
      return { success: false, message: "Invalid email or password" };
    }

    // Don't return password hash
    const { password: _, ...userWithoutPassword } = user;
    
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error("Error verifying user:", error);
    return { success: false, message: "Authentication failed" };
  }
}

/**
 * Get all links created by a user
 */
export async function getUserLinks(
  db: DrizzleD1Database<typeof schema>,
  userId: number
) {
  try {
    return await db.query.links.findMany({
      where: eq(schema.links.userId, userId),
      orderBy: (links, { desc }) => [desc(links.createdAt)]
    });
  } catch (error) {
    console.error("Error getting user links:", error);
    return [];
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(
  db: DrizzleD1Database<typeof schema>
) {
  try {
    const users = await db.query.users.findMany({
      orderBy: (users, { asc }) => [asc(users.createdAt)]
    });
    
    // Remove password hashes
    return users.map(({ password, ...user }) => user);
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

/**
 * Generate a secure random password
 */
function generateRandomPassword(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a user by admin (can set isAdmin flag, optional random password)
 */
export async function createUserByAdmin(
  db: DrizzleD1Database<typeof schema>,
  username: string,
  email: string,
  password: string | null,
  isAdmin: boolean = false
): Promise<{ success: boolean; message: string; generatedPassword?: string }> {
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.username, username)
    });

    if (existingUser) {
      return { success: false, message: "Username already exists" };
    }

    // Check if email already exists
    const existingEmail = await db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });

    if (existingEmail) {
      return { success: false, message: "Email already exists" };
    }

    // Generate random password if not provided
    const actualPassword = password || generateRandomPassword();
    const hashedPassword = await hashPassword(actualPassword);

    // Create user
    await db.insert(schema.users).values({
      username,
      email,
      password: hashedPassword,
      isAdmin,
    }).returning();

    console.log(`User created by admin: ${username}${isAdmin ? ' (ADMIN)' : ''}`);
    
    return { 
      success: true, 
      message: "User created successfully!",
      generatedPassword: password ? undefined : actualPassword
    };
  } catch (error) {
    console.error("Error creating user by admin:", error);
    return { success: false, message: "Failed to create user" };
  }
}

/**
 * Update user information (admin only)
 */
export async function updateUser(
  db: DrizzleD1Database<typeof schema>,
  userId: number,
  updates: {
    username?: string;
    email?: string;
    password?: string;
    isAdmin?: boolean;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Check for username conflicts if updating username
    if (updates.username && updates.username !== user.username) {
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.username, updates.username)
      });
      if (existingUser) {
        return { success: false, message: "Username already exists" };
      }
    }

    // Check for email conflicts if updating email
    if (updates.email && updates.email !== user.email) {
      const existingEmail = await db.query.users.findFirst({
        where: eq(schema.users.email, updates.email)
      });
      if (existingEmail) {
        return { success: false, message: "Email already exists" };
      }
    }

    // Prepare update object
    const updateData: any = {};
    if (updates.username) updateData.username = updates.username;
    if (updates.email) updateData.email = updates.email;
    if (updates.password) {
      updateData.password = await hashPassword(updates.password);
      updateData.passwordChangedAt = new Date(); // Track password change time
    }
    if (updates.isAdmin !== undefined) updateData.isAdmin = updates.isAdmin;

    // Update user
    await db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId));

    console.log(`User updated: ${userId}${updates.password ? ' (password changed)' : ''}`);
    
    return { success: true, message: "User updated successfully!" };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, message: "Failed to update user" };
  }
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(
  db: DrizzleD1Database<typeof schema>,
  userId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Delete user
    await db.delete(schema.users)
      .where(eq(schema.users.id, userId));

    console.log(`User deleted: ${userId}`);
    
    return { success: true, message: "User deleted successfully!" };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, message: "Failed to delete user" };
  }
}
