/**
 * Web Crypto API based password hashing for Cloudflare Workers
 * Using PBKDF2 with SHA-256 - secure and supported natively
 */

const SALT_LENGTH = 32;
const ITERATIONS = 100000; // OWASP recommended minimum
const KEY_LENGTH = 32; // 256 bits

/**
 * Hash a password using PBKDF2-SHA256
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  // Convert password to ArrayBuffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH * 8 // bits
  );
  
  // Combine salt + hash and encode as base64
  const combined = new Uint8Array(SALT_LENGTH + KEY_LENGTH);
  combined.set(salt, 0);
  combined.set(new Uint8Array(derivedKey), SALT_LENGTH);
  
  // Convert to base64
  const base64 = btoa(String.fromCharCode(...combined));
  return `pbkdf2:${ITERATIONS}:${base64}`;
}

/**
 * Verify a password against a PBKDF2 hash
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    // Parse the hash format
    const parts = hash.split(':');
    if (parts.length !== 3 || parts[0] !== 'pbkdf2') {
      return false;
    }
    
    const iterations = parseInt(parts[1]);
    const combined = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
    
    if (combined.length !== SALT_LENGTH + KEY_LENGTH) {
      return false;
    }
    
    // Extract salt and stored hash
    const salt = combined.slice(0, SALT_LENGTH);
    const storedHash = combined.slice(SALT_LENGTH);
    
    // Convert password to ArrayBuffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    // Derive key with same parameters
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      KEY_LENGTH * 8 // bits
    );
    
    const computedHash = new Uint8Array(derivedKey);
    
    // Timing-safe comparison
    return timingSafeEqual(storedHash, computedHash);
  } catch (error) {
    console.error("Password verification failed:", error);
    return false;
  }
}

/**
 * Timing-safe comparison to prevent timing attacks
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
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
