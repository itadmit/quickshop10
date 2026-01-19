/**
 * QStash Signature Verification
 * 
 * מוודא שרק QStash יכול לקרוא ל-cron endpoints שלנו.
 * האימות מהיר מאוד (כמה מילישניות) ולא פוגע בביצועים.
 */

import { Receiver } from '@upstash/qstash';
import { NextRequest, NextResponse } from 'next/server';

// Initialize receiver with signing keys
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

/**
 * Verify QStash signature - fast O(1) operation
 * Returns null if valid, or NextResponse with error if invalid
 */
export async function verifyQStashSignature(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip verification in development (for testing)
  if (process.env.NODE_ENV === 'development') {
    console.log('[QStash] Skipping verification in development mode');
    return null;
  }

  // Get signature from header
  const signature = request.headers.get('upstash-signature');
  
  if (!signature) {
    console.error('[QStash] Missing signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 401 }
    );
  }

  try {
    // Get body for verification (empty string for GET/no-body requests)
    const body = await request.text();
    
    // Verify signature - this is a fast crypto operation
    const isValid = await receiver.verify({
      signature,
      body,
      url: request.url,
    });

    if (!isValid) {
      console.error('[QStash] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    return null; // Valid - continue processing
  } catch (error) {
    console.error('[QStash] Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 401 }
    );
  }
}

/**
 * Higher-order function to wrap cron handlers with QStash verification
 * Use this for cleaner code:
 * 
 * export const GET = withQStashVerification(async (request) => {
 *   // Your cron logic here
 *   return NextResponse.json({ success: true });
 * });
 */
export function withQStashVerification(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const error = await verifyQStashSignature(request);
    if (error) return error;
    return handler(request);
  };
}



