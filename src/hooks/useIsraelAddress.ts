'use client';

import { useState, useEffect, useCallback } from "react";

interface City {
  cityName: string;
  cityCode: string;
}

interface Street {
  streetName: string;
  cityName: string;
}

// Debounce hook - מונע קריאות API מיותרות
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const ITEMS_PER_PAGE = 20;

/**
 * Hook לחיפוש ערים בישראל
 * 🚀 טוען בצורה מדורגת (lazy loading) - 20 פריטים בכל פעם
 */
export function useCitySearch(storeSlug: string) {
  const [query, setQuery] = useState("");
  const [allCities, setAllCities] = useState<City[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  const debouncedQuery = useDebounce(query, 150);

  // טעינת כל הערים פעם אחת (ברקע)
  const loadAllCities = useCallback(async () => {
    if (loaded || loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/storefront/${storeSlug}/cities?all=true`);
      if (response.ok) {
        const data = await response.json();
        setAllCities(data.cities || []);
        // מציג רק את ה-20 הראשונים בהתחלה
        setCities((data.cities || []).slice(0, ITEMS_PER_PAGE));
        setLoaded(true);
        setDisplayCount(ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error("Error loading cities:", error);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, loaded, loading]);

  // טעינת עוד פריטים (lazy loading)
  const loadMore = useCallback(() => {
    if (loading || !loaded) return;
    
    const searchTerm = debouncedQuery?.toLowerCase().trim();
    const filtered = searchTerm 
      ? allCities.filter(city => city.cityName.includes(searchTerm))
      : allCities;
    
    const newCount = Math.min(displayCount + ITEMS_PER_PAGE, filtered.length);
    setDisplayCount(newCount);
    setCities(filtered.slice(0, newCount));
  }, [allCities, displayCount, debouncedQuery, loaded, loading]);

  // סינון מקומי לפי ההקלדה
  useEffect(() => {
    if (!loaded) return;
    
    setDisplayCount(ITEMS_PER_PAGE); // Reset pagination on new search
    
    if (!debouncedQuery) {
      setCities(allCities.slice(0, ITEMS_PER_PAGE));
      return;
    }

    const searchTerm = debouncedQuery.toLowerCase().trim();
    const filtered = allCities
      .filter(city => city.cityName.includes(searchTerm))
      .slice(0, ITEMS_PER_PAGE);
    setCities(filtered);
  }, [debouncedQuery, allCities, loaded]);

  // חישוב האם יש עוד פריטים לטעון
  const hasMore = loaded && (() => {
    const searchTerm = debouncedQuery?.toLowerCase().trim();
    const total = searchTerm 
      ? allCities.filter(city => city.cityName.includes(searchTerm)).length
      : allCities.length;
    return displayCount < total;
  })();

  return {
    query,
    setQuery,
    cities,
    loading,
    loadAllCities,
    loadMore,
    hasMore,
  };
}

/**
 * Hook לחיפוש רחובות בישראל
 * 🚀 טוען בצורה מדורגת (lazy loading) - 20 פריטים בכל פעם
 */
export function useStreetSearch(storeSlug: string, cityName: string) {
  const [query, setQuery] = useState("");
  const [allStreets, setAllStreets] = useState<Street[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedCity, setLoadedCity] = useState("");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  const debouncedQuery = useDebounce(query, 150);

  // טעינת כל הרחובות של העיר פעם אחת (ברקע)
  const loadAllStreets = useCallback(async () => {
    if (!cityName || loadedCity === cityName || loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/storefront/${storeSlug}/streets?all=true&city=${encodeURIComponent(cityName)}`
      );
      if (response.ok) {
        const data = await response.json();
        setAllStreets(data.streets || []);
        // מציג רק את ה-20 הראשונים בהתחלה
        setStreets((data.streets || []).slice(0, ITEMS_PER_PAGE));
        setLoadedCity(cityName);
        setDisplayCount(ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error("Error loading streets:", error);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, cityName, loadedCity, loading]);

  // טעינת עוד פריטים (lazy loading)
  const loadMore = useCallback(() => {
    if (loading || loadedCity !== cityName) return;
    
    const searchTerm = debouncedQuery?.toLowerCase().trim();
    const filtered = searchTerm 
      ? allStreets.filter(street => street.streetName.includes(searchTerm))
      : allStreets;
    
    const newCount = Math.min(displayCount + ITEMS_PER_PAGE, filtered.length);
    setDisplayCount(newCount);
    setStreets(filtered.slice(0, newCount));
  }, [allStreets, displayCount, debouncedQuery, cityName, loadedCity, loading]);

  // סינון מקומי לפי ההקלדה
  useEffect(() => {
    if (loadedCity !== cityName) return;
    
    setDisplayCount(ITEMS_PER_PAGE); // Reset pagination on new search
    
    if (!debouncedQuery) {
      setStreets(allStreets.slice(0, ITEMS_PER_PAGE));
      return;
    }

    const searchTerm = debouncedQuery.toLowerCase().trim();
    const filtered = allStreets
      .filter(street => street.streetName.includes(searchTerm))
      .slice(0, ITEMS_PER_PAGE);
    setStreets(filtered);
  }, [debouncedQuery, allStreets, cityName, loadedCity]);

  // Reset when city changes
  useEffect(() => {
    setStreets([]);
    setAllStreets([]);
    setQuery("");
    setLoadedCity("");
    setDisplayCount(ITEMS_PER_PAGE);
  }, [cityName]);

  // חישוב האם יש עוד פריטים לטעון
  const hasMore = loadedCity === cityName && (() => {
    const searchTerm = debouncedQuery?.toLowerCase().trim();
    const total = searchTerm 
      ? allStreets.filter(street => street.streetName.includes(searchTerm)).length
      : allStreets.length;
    return displayCount < total;
  })();

  return {
    query,
    setQuery,
    streets,
    loading,
    loadAllStreets,
    loadMore,
    hasMore,
  };
}

