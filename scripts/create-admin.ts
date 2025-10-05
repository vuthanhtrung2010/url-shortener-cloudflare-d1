#!/usr/bin/env bun

/**
 * Script to create an admin user
 * Usage: bun run scripts/create-admin.ts
 */

import { hashPassword } from "../app/lib/password";

async function main() {
  console.log("=== Admin User Password Hash Generator ===\n");
  
  // Prompt for password
  const password = prompt("Enter admin password (min 8 characters):");
  
  if (!password || password.length < 8) {
    console.error("❌ Password must be at least 8 characters long");
    process.exit(1);
  }

  console.log("\n⏳ Hashing password...");
  
  const hashedPassword = await hashPassword(password);
  
  console.log("\n✅ Password hashed successfully!\n");
  console.log("================================================");
  console.log("Copy this hash to use for manual database insertion:");
  console.log("================================================\n");
  console.log(hashedPassword);
  console.log("\n================================================");
  console.log("\nTo manually create an admin user in D1:");
  console.log("wrangler d1 execute DB --local --command=\"INSERT INTO users (username, password, isAdmin, createdAt) VALUES ('admin', '" + hashedPassword + "', 1, " + Date.now() + ");\"");
  console.log("\nOr visit /register to create the first user (automatically gets admin)");
  console.log("================================================\n");
}

main().catch(console.error);
