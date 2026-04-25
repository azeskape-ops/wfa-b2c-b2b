import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

const SCHEDULE_TABLE = "schedule_slots";
const DATE_COLUMN = "date";
const IS_AVAILABLE_COLUMN = "is_available";
const CLIENT_ID_COLUMN = "client_id";

function serverTodayYYYYMMDD(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

/** GET — sorted unique YYYY-MM-DD values with at least one free slot (today onward). */
export async function GET() {
  try {
    const today = serverTodayYYYYMMDD();
    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from(SCHEDULE_TABLE)
      .select(DATE_COLUMN)
      .eq(IS_AVAILABLE_COLUMN, true)
      .is(CLIENT_ID_COLUMN, null)
      .gte(DATE_COLUMN, today);

    if (error) {
      console.error("[get-available-dates]", error);
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    const seen = new Set<string>();
    const dates: string[] = [];
    for (const row of Array.isArray(rows) ? rows : []) {
      const d = row?.[DATE_COLUMN as keyof typeof row];
      if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
      if (seen.has(d)) continue;
      seen.add(d);
      dates.push(d);
    }
    dates.sort();

    return NextResponse.json({ status: "ok", dates });
  } catch (e) {
    console.error("[get-available-dates]", e);
    return NextResponse.json({ status: "error", message: "Server error" }, { status: 500 });
  }
}
