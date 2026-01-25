// ניהול חיפוש ערים ורחובות מקבצים סטטיים
// 🚀 מהיר מאוד - טעינה חד-פעמית וחיפוש בזיכרון
import { readFileSync } from 'fs';
import { join } from 'path';

interface CityData {
  cityName: string;
  cityCode: string;
}

interface StreetData {
  streetName: string;
  cityName: string;
}

// נתוני הערים והרחובות - ייטענו פעם אחת לזיכרון (singleton)
let citiesData: Array<{ name: string; nameEn: string; code: string }> | null = null;
let streetsData: Record<string, string[]> | null = null;

/**
 * טעינת נתוני ערים מהקובץ הסטטי
 */
function loadCitiesData(): void {
  if (citiesData) return; // כבר נטען
  
  try {
    const filePath = join(process.cwd(), 'public', 'data', 'israel-cities.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    citiesData = JSON.parse(fileContent);
  } catch (error) {
    citiesData = [];
    console.error("❌ Error loading cities data:", error);
  }
}

/**
 * טעינת נתוני רחובות מהקובץ הסטטי
 */
function loadStreetsData(): void {
  if (streetsData) return; // כבר נטען
  
  try {
    const filePath = join(process.cwd(), 'public', 'data', 'israel-streets.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    streetsData = JSON.parse(fileContent);
  } catch (error) {
    streetsData = {};
    console.error("❌ Error loading streets data:", error);
  }
}

/**
 * חיפוש ערים מהקובץ הסטטי - מהיר מאוד!
 */
export function searchCities(query: string): CityData[] {
  if (!query || query.length < 2) {
    return [];
  }

  // טעינת הנתונים אם עדיין לא נטענו
  loadCitiesData();

  if (!citiesData || citiesData.length === 0) {
    return [];
  }

  // חיפוש בנתונים
  const searchTerm = query.toLowerCase().trim();
  const results = citiesData
    .filter((city) => city.name.includes(searchTerm))
    .slice(0, 20) // מגבילים ל-20 תוצאות
    .map((city) => ({
      cityName: city.name,
      cityCode: city.code,
    }));

  return results;
}

/**
 * חיפוש רחובות מהקובץ הסטטי - מהיר מאוד!
 */
export function searchStreets(
  cityName: string,
  query: string
): StreetData[] {
  if (!cityName || !query || query.length < 2) {
    return [];
  }

  // טעינת הנתונים אם עדיין לא נטענו
  loadStreetsData();

  if (!streetsData) {
    return [];
  }

  // קבלת רשימת הרחובות של העיר
  const cityStreets = streetsData[cityName];
  
  if (!cityStreets || cityStreets.length === 0) {
    return [];
  }

  // חיפוש בנתונים
  const searchTerm = query.toLowerCase().trim();
  const results = cityStreets
    .filter((street) => street.includes(searchTerm))
    .slice(0, 20) // מגבילים ל-20 תוצאות
    .map((street) => ({
      streetName: street,
      cityName: cityName,
    }));

  return results;
}

/**
 * קבלת כל הרחובות של עיר
 */
export function getCityStreets(cityName: string): string[] {
  loadStreetsData();
  
  if (!streetsData) {
    return [];
  }

  return streetsData[cityName] || [];
}

/**
 * קבלת כל הערים (ממוינות לפי א-ב)
 */
export function getAllCities(): CityData[] {
  loadCitiesData();
  
  if (!citiesData || citiesData.length === 0) {
    return [];
  }

  return citiesData
    .map((city) => ({
      cityName: city.name,
      cityCode: city.code,
    }))
    .sort((a, b) => a.cityName.localeCompare(b.cityName, 'he'));
}

/**
 * קבלת כל הרחובות של עיר (ממוינים לפי א-ב)
 */
export function getAllStreets(cityName: string): StreetData[] {
  loadStreetsData();
  
  if (!streetsData || !cityName) {
    return [];
  }

  const cityStreets = streetsData[cityName];
  
  if (!cityStreets || cityStreets.length === 0) {
    return [];
  }

  return cityStreets
    .map((street) => ({
      streetName: street,
      cityName: cityName,
    }))
    .sort((a, b) => a.streetName.localeCompare(b.streetName, 'he'));
}

