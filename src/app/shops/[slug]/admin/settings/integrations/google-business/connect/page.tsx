'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Search, MapPin, Star, Building2, Loader2, Check, X } from 'lucide-react';

interface Place {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
  photoReference: string | null;
}

interface Review {
  id: string;
  authorName: string;
  authorPhoto: string | null;
  profileUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
  reviews: Review[];
  photoUrl: string | null;
  website: string | null;
  phone: string | null;
  googleMapsUrl: string | null;
}

export default function GoogleBusinessConnectPage() {
  const params = useParams();
  const storeSlug = params?.slug as string;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  // Debounced search
  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/google-places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'חיפוש נכשל');
      }

      const data = await response.json();
      setSearchResults(data.places || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בחיפוש');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchPlaces(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPlaces]);

  // Load place details
  const loadPlaceDetails = async (placeId: string) => {
    setIsLoadingDetails(true);
    setError(null);

    try {
      const response = await fetch(`/api/google-places/details?placeId=${placeId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'טעינת פרטים נכשלה');
      }

      const data = await response.json();
      setSelectedPlace(data);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת פרטים');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Connect the selected place
  const connectPlace = async () => {
    if (!selectedPlace) return;

    setIsConnecting(true);

    try {
      // Send message to parent window with the place data
      if (window.opener) {
        window.opener.postMessage({
          type: 'google-business-connected',
          success: true,
          accountId: selectedPlace.placeId,
          businessName: selectedPlace.name,
          averageRating: selectedPlace.rating,
          totalReviews: selectedPlace.totalReviews,
          reviews: selectedPlace.reviews.slice(0, 10),
          googlePlaceUrl: selectedPlace.googleMapsUrl,
          businessImage: selectedPlace.photoUrl,
        }, '*');
      }

      setConnected(true);

      // Close after delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (err) {
      setError('שגיאה בחיבור העסק');
    } finally {
      setIsConnecting(false);
    }
  };

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  // Success state
  if (connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">החיבור הצליח!</h2>
          <p className="text-gray-600">{selectedPlace?.name} חובר בהצלחה</p>
          <p className="text-sm text-gray-500 mt-4">החלון ייסגר אוטומטית...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">חיבור Google Business</h1>
          <p className="text-gray-600">חפש את העסק שלך והתחבר כדי להציג ביקורות</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש את שם העסק שלך..."
              className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              disabled={!!selectedPlace}
            />
            {isSearching && (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && !selectedPlace && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500 mb-2">נמצאו {searchResults.length} תוצאות:</p>
              {searchResults.map((place) => (
                <button
                  key={place.placeId}
                  onClick={() => loadPlaceDetails(place.placeId)}
                  disabled={isLoadingDetails}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-right disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{place.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{place.address}</span>
                      </div>
                      {place.rating > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {renderStars(place.rating)}
                          <span className="text-sm text-gray-600">
                            {place.rating.toFixed(1)} ({place.totalReviews} ביקורות)
                          </span>
                        </div>
                      )}
                    </div>
                    {isLoadingDetails && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Place Details */}
        {selectedPlace && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                {selectedPlace.photoUrl && (
                  <img
                    src={selectedPlace.photoUrl}
                    alt={selectedPlace.name}
                    className="w-20 h-20 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPlace.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">{selectedPlace.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(selectedPlace.rating)}
                    <span className="text-sm text-gray-600">
                      {selectedPlace.rating.toFixed(1)} ({selectedPlace.totalReviews} ביקורות)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Reviews Preview */}
            {selectedPlace.reviews.length > 0 && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">ביקורות אחרונות:</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedPlace.reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {review.authorPhoto && (
                          <img
                            src={review.authorPhoto}
                            alt={review.authorName}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{review.authorName}</p>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                            <span className="text-xs text-gray-500">{review.relativeTime}</span>
                          </div>
                        </div>
                      </div>
                      {review.text && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-3">{review.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connect Button */}
            <button
              onClick={connectPlace}
              disabled={isConnecting}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  מחבר...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  חבר עסק זה
                </>
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        {!selectedPlace && searchResults.length === 0 && !isSearching && (
          <div className="bg-white/50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">
              💡 הקלד את שם העסק שלך כפי שהוא מופיע בגוגל מפות
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
