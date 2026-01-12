/**
 * Server-side reCAPTCHA verification
 */

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify reCAPTCHA token on the server
 * @param token - The token from client-side reCAPTCHA
 * @param expectedAction - The expected action name
 * @param minScore - Minimum acceptable score (0.0 - 1.0), default 0.5
 * @returns boolean indicating if verification passed
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction: string,
  minScore: number = 0.5
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('reCAPTCHA secret key not configured');
    return { success: true }; // Allow in development
  }

  if (!token) {
    return { success: false, error: 'Missing reCAPTCHA token' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data: RecaptchaVerifyResponse = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: `reCAPTCHA verification failed: ${data['error-codes']?.join(', ')}`,
      };
    }

    // Check action matches
    if (data.action !== expectedAction) {
      return {
        success: false,
        error: `Action mismatch: expected ${expectedAction}, got ${data.action}`,
      };
    }

    // Check score threshold
    if (data.score !== undefined && data.score < minScore) {
      return {
        success: false,
        score: data.score,
        error: `Score too low: ${data.score} (minimum: ${minScore})`,
      };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'Verification request failed' };
  }
}

/**
 * Rate limiting helper - simple in-memory store
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired records
  if (record && now > record.resetAt) {
    rateLimitStore.delete(identifier);
  }

  const current = rateLimitStore.get(identifier) || { count: 0, resetAt: now + windowMs };

  if (current.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }

  current.count++;
  rateLimitStore.set(identifier, current);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - current.count,
  };
}

