'use client';

import { useState, useEffect } from "react";

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

/**
 * Hook לחיפוש ערים בישראל
 * 🚀 כולל debounce למניעת קריאות מיותרות
 */
export function useCitySearch(storeSlug: string) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300); // המתנה של 300ms

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setCities([]);
      return;
    }

    const controller = new AbortController();
    
    const searchCities = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/storefront/${storeSlug}/cities?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        );
        
        if (response.ok) {
          const data = await response.json();
          setCities(data.cities || []);
        } else {
          setCities([]);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error searching cities:", error);
          setCities([]);
        }
      } finally {
        setLoading(false);
      }
    };

    searchCities();
    
    return () => controller.abort();
  }, [debouncedQuery, storeSlug]);

  return {
    query,
    setQuery,
    cities,
    loading,
  };
}

/**
 * Hook לחיפוש רחובות בישראל
 * 🚀 כולל debounce + תלוי בעיר שנבחרה
 */
export function useStreetSearch(storeSlug: string, cityName: string) {
  const [query, setQuery] = useState("");
  const [streets, setStreets] = useState<Street[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || !cityName) {
      setStreets([]);
      return;
    }

    const controller = new AbortController();

    const searchStreets = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/storefront/${storeSlug}/streets?q=${encodeURIComponent(debouncedQuery)}&city=${encodeURIComponent(cityName)}`,
          { signal: controller.signal }
        );
        
        if (response.ok) {
          const data = await response.json();
          setStreets(data.streets || []);
        } else {
          setStreets([]);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error searching streets:", error);
          setStreets([]);
        }
      } finally {
        setLoading(false);
      }
    };

    searchStreets();
    
    return () => controller.abort();
  }, [debouncedQuery, cityName, storeSlug]);

  // Reset streets when city changes
  useEffect(() => {
    setStreets([]);
    setQuery("");
  }, [cityName]);

  return {
    query,
    setQuery,
    streets,
    loading,
  };
}

