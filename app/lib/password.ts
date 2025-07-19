/**
 * Bcrypt-based password hashing for Cloudflare Workers
 * Using bcryptjs - pure JavaScript implementation that works in Workers
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // Good balance of security and performance

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error("Password hashing failed:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error("Password verification failed:", error);
    return false;
  }
}

/**
 * Generate a hash for a given password (utility for setup)
 * Usage: console.log(await generatePasswordHash("your-password"))
 */
export async function generatePasswordHash(password: string): Promise<void> {
  const hash = await hashPassword(password);
  console.log("Password hash for wrangler.jsonc:");
  console.log(hash);
}
