import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Google Places API - Get place details including reviews
 * 
 * Fetches detailed information about a place including reviews.
 */

const PLACES_API_URL = 'https://places.googleapis.com/v1/places';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json({ error: 'Missing placeId parameter' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    // Fetch place details with reviews - don't specify language to get original text
    const response = await fetch(`${PLACES_API_URL}/${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,reviews.name,reviews.rating,reviews.text,reviews.originalText,reviews.authorAttribution,reviews.relativePublishTimeDescription,reviews.publishTime,photos,websiteUri,nationalPhoneNumber,googleMapsUri',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Place details failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch place details: ${response.status}` },
        { status: response.status }
      );
    }

    const place = await response.json();
    
    // Transform reviews - prefer originalText over translated text
    const reviews = (place.reviews || []).map((review: {
      name?: string;
      authorAttribution?: { displayName: string; photoUri?: string; uri?: string };
      rating?: number;
      text?: { text: string };
      originalText?: { text: string };
      relativePublishTimeDescription?: string;
      publishTime?: string;
    }, index: number) => {
      // Use original text if available, otherwise use translated text
      const reviewText = review.originalText?.text || review.text?.text || '';
      
      return {
        id: review.name || `review-${index}`,
        authorName: review.authorAttribution?.displayName || 'משתמש אנונימי',
        authorPhoto: review.authorAttribution?.photoUri || null,
        profileUrl: review.authorAttribution?.uri || null,
        rating: review.rating || 5,
        text: reviewText,
        relativeTime: review.relativePublishTimeDescription || '',
        publishTime: review.publishTime || null,
      };
    });

    // Get photo URL if available
    let photoUrl = null;
    if (place.photos && place.photos.length > 0) {
      const photoName = place.photos[0].name;
      photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${apiKey}`;
    }

    const result = {
      placeId: place.id,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      rating: place.rating || 0,
      totalReviews: place.userRatingCount || 0,
      reviews,
      photoUrl,
      website: place.websiteUri || null,
      phone: place.nationalPhoneNumber || null,
      googleMapsUrl: place.googleMapsUri || null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Place details error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

