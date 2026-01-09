import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/israel-cities-cache";

// GET - חיפוש ערים בישראל
// 🚀 מהיר מאוד - חיפוש בזיכרון, ללא DB
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

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

