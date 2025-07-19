#!/usr/bin/env bun
import { generatePasswordHash } from "../app/lib/password";

const password = process.argv[2];

if (!password) {
  console.log("Usage: bun scripts/hash-password.ts <password>");
  process.exit(1);
}

await generatePasswordHash(password);
