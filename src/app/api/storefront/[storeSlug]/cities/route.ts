import { NextRequest, NextResponse } from "next/server";
import { searchCities, getAllCities } from "@/lib/israel-cities-cache";

// GET - חיפוש ערים בישראל או קבלת כל הערים
// 🚀 מהיר מאוד - חיפוש בזיכרון, ללא DB
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const all = searchParams.get("all") === "true";

    // אם מבקשים את כל הערים
    if (all) {
      const cities = getAllCities();
      return NextResponse.json({ cities });
    }

    // חיפוש רגיל - מינימום 2 תווים
    if (!query || query.length < 2) {
      return NextResponse.json({ cities: [] });
    }

    const cities = searchCities(query);

    return NextResponse.json({ 
      cities,
    });
  } catch (error) {
    console.error("Error searching cities:", error);
    
    return NextResponse.json({ 
      cities: [],
      error: "Search temporarily unavailable" 
    });
  }
}

