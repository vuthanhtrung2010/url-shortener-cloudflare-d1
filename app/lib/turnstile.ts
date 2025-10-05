/**
 * Cloudflare Turnstile verification for Cloudflare Workers
 */

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify Cloudflare Turnstile token
 */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string
): Promise<boolean> {
  // Check if Turnstile is configured
  const secretKey = 
    (typeof process !== 'undefined' ? process.env?.TURNSTILE_SECRET_KEY : undefined) ||
    (typeof import.meta !== 'undefined' ? import.meta.env?.TURNSTILE_SECRET_KEY : undefined);
  
  // If no secret key is configured, skip verification
  if (!secretKey) {
    console.log('Turnstile secret key not configured, skipping verification');
    return true;
  }

  if (!token) {
    console.log('No Turnstile token provided');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data: TurnstileResponse = await response.json();
    
    if (!data.success) {
      console.error('Turnstile verification failed:', data['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

/**
 * Check if Turnstile is enabled
 */
export function isTurnstileEnabled(): boolean {
  const siteKey = 
    (typeof process !== 'undefined' ? process.env?.VITE_REACT_TURNSTILE_SITE_KEY : undefined) ||
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_REACT_TURNSTILE_SITE_KEY : undefined);
  
  return !!siteKey;
}

/**
 * Get Turnstile site key
 */
export function getTurnstileSiteKey(): string | undefined {
  return (
    (typeof process !== 'undefined' ? process.env?.VITE_REACT_TURNSTILE_SITE_KEY : undefined) ||
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_REACT_TURNSTILE_SITE_KEY : undefined)
  );
}
