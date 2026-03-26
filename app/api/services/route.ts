import { NextRequest, NextResponse } from "next/server";
import { getActiveServices, getAllServices, createService } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";

  if (all) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(getAllServices());
  }

  return NextResponse.json(getActiveServices());
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const service = createService({
    category: body.category ?? "manicure",
    french_name: body.french_name ?? "",
    english_name: body.english_name ?? "",
    price_type: body.price_type ?? "fixed",
    price: body.price ?? null,
    duration_minutes: body.duration_minutes ?? 60,
    duration_label: body.duration_label ?? "1 h",
    description_fr: body.description_fr ?? "",
    description_en: body.description_en ?? "",
    active: body.active ?? 1,
    sort_order: body.sort_order ?? 0,
  });
  return NextResponse.json(service, { status: 201 });
}
