/**
 * Cloudinary Signature API Route
 * 
 * Generates signed upload parameters for secure client-side uploads.
 * Use this when you need more control over uploads than unsigned presets allow.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folder, publicId, tags } = body;

    if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY) {
      return NextResponse.json(
        { error: 'Cloudinary credentials not configured' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);

    // Build the parameters to sign
    const params: Record<string, string | number> = {
      timestamp,
    };

    if (folder) params.folder = folder;
    if (publicId) params.public_id = publicId;
    if (tags) params.tags = tags;

    // Create signature string (alphabetically sorted params)
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(sortedParams + CLOUDINARY_API_SECRET)
      .digest('hex');

    return NextResponse.json({
      signature,
      timestamp,
      api_key: CLOUDINARY_API_KEY,
      ...params,
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}


