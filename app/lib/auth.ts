/**
 * Authentication utilities for JWT token handling
 * Uses jose library which works in Cloudflare Workers
 * React Router provides encrypted session cookies
 */

import { SignJWT, jwtVerify } from 'jose';
import { createCookie } from 'react-router';

// Get JWT secret from environment with fallback
function getJWTSecret(): string {
  // Try multiple ways to get the secret since Vite can be tricky
  const secret = 
    (typeof process !== 'undefined' ? process.env?.JWT_SECRET : undefined) ||
    (typeof import.meta !== 'undefined' ? import.meta.env?.JWT_SECRET : undefined) ||
    'abcd12345';
  
  return secret;
}

// Convert string secret to Uint8Array for jose
function getSecretKey(): Uint8Array {
  const secret = getJWTSecret();
  return new TextEncoder().encode(secret);
}

export interface JWTPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = getSecretKey();
  
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(secret);
  
  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      isAdmin: payload.isAdmin as boolean,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Create an encrypted session cookie
 * React Router provides encryption out of the box
 */
export const sessionCookie = createCookie('session', {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secrets: [getJWTSecret()], // React Router will encrypt with this
});

/**
 * Get user from session cookie
 */
export async function getUserFromSession(request: Request): Promise<JWTPayload | null> {
  try {
    const cookieHeader = request.headers.get('Cookie');
    const session = await sessionCookie.parse(cookieHeader);
    
    if (!session?.token) {
      return null;
    }
    
    return await verifyToken(session.token);
  } catch (error) {
    console.error('Failed to get user from session:', error);
    return null;
  }
}

/**
 * Create session cookie header with JWT token
 */
export async function createSession(payload: JWTPayload): Promise<string> {
  const token = await generateToken(payload);
  return await sessionCookie.serialize({ token });
}

/**
 * Destroy session cookie
 */
export async function destroySession(request: Request): Promise<string> {
  const cookieHeader = request.headers.get('Cookie');
  const session = await sessionCookie.parse(cookieHeader);
  
  return await sessionCookie.serialize(session, {
    maxAge: 0,
  });
}

/**
 * Require authentication middleware
 * Returns user or throws redirect to login
 */
export async function requireAuth(request: Request): Promise<JWTPayload> {
  const user = await getUserFromSession(request);
  
  if (!user) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }
  
  return user;
}

/**
 * Require admin authentication
 */
export async function requireAdmin(request: Request): Promise<JWTPayload> {
  const user = await requireAuth(request);
  
  if (!user.isAdmin) {
    throw new Response('Forbidden: Admin access required', { status: 403 });
  }
  
  return user;
}
