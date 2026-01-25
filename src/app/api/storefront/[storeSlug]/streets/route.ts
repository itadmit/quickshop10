import { NextRequest, NextResponse } from "next/server";
import { searchStreets, getAllStreets } from "@/lib/israel-cities-cache";

// GET - חיפוש רחובות לפי עיר או קבלת כל הרחובות
// 🚀 מהיר מאוד - חיפוש בזיכרון, ללא DB
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const city = searchParams.get("city") || "";
    const all = searchParams.get("all") === "true";

    if (!city) {
      return NextResponse.json({ streets: [] });
    }

    // אם מבקשים את כל הרחובות של העיר
    if (all) {
      const streets = getAllStreets(city);
      return NextResponse.json({ streets });
    }

    // חיפוש רגיל - מינימום 2 תווים
    if (!query || query.length < 2) {
      return NextResponse.json({ streets: [] });
    }

    const streets = searchStreets(city, query);

    return NextResponse.json({ 
      streets,
    });
  } catch (error) {
    console.error("Error searching streets:", error);
    
    return NextResponse.json({ 
      streets: [],
      error: "Search temporarily unavailable" 
    });
  }
}

