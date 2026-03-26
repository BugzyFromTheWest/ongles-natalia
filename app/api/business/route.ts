import { NextRequest, NextResponse } from "next/server";
import { getBusinessInfo, updateBusinessInfo } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  return NextResponse.json(getBusinessInfo());
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updated = updateBusinessInfo(body);
  return NextResponse.json(updated);
}
