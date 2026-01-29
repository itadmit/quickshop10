import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Google Places API - Search for businesses
 * 
 * Uses the Places API (New) to search for businesses by name/address.
 * Returns matching places with their Place IDs.
 */

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    // Search for places using the new Places API
    const response = await fetch(PLACES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'he',
        regionCode: 'IL',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Places search failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to search places: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform the response
    const places = (data.places || []).map((place: {
      id: string;
      displayName?: { text: string };
      formattedAddress?: string;
      rating?: number;
      userRatingCount?: number;
      photos?: Array<{ name: string }>;
    }) => ({
      placeId: place.id,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      rating: place.rating || 0,
      totalReviews: place.userRatingCount || 0,
      photoReference: place.photos?.[0]?.name || null,
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Places search error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

