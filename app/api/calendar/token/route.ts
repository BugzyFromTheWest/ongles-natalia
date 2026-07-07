import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = getSettings();
  if (!settings.calendar_token) {
    const newToken = crypto.randomUUID().replace(/-/g, "");
    updateSettings({ calendar_token: newToken });
    settings = getSettings();
  }

  return NextResponse.json({ token: settings.calendar_token });
}
