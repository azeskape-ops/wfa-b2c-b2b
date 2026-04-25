import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

/**
 * Schema: schedule_slots — id, date, time, is_available, client_id.
 * Free slot = is_available = true AND client_id IS NULL.
 */
const SCHEDULE_TABLE = "schedule_slots";
const DATE_COLUMN = "date";
const TIME_COLUMN = "time";
const IS_AVAILABLE_COLUMN = "is_available";
const CLIENT_ID_COLUMN = "client_id";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedDate = searchParams.get("date");

  console.log("=== SLOT FETCH START ===");
  console.log("1. RAW DATE RECEIVED FROM FRONTEND:", requestedDate);

  if (!requestedDate || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    return NextResponse.json({ status: "error", message: "Valid date (YYYY-MM-DD) required" }, { status: 400 });
  }

  const [y, mo, da] = requestedDate.split("-").map(Number);
  const check = new Date(y, mo - 1, da);
  if (
    check.getFullYear() !== y ||
    check.getMonth() !== mo - 1 ||
    check.getDate() !== da
  ) {
    return NextResponse.json({ status: "error", message: "Invalid calendar date" }, { status: 400 });
  }
  const date = `${String(y)}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`;

  const supabase = getSupabase();

  const { data, error } = await supabase.from("schedule_slots").select("*");
  console.log("2. DB SLOTS FOUND:", data?.length || 0, "| ERROR:", error);

  const { data: rows, error: filterError } = await supabase
    .from(SCHEDULE_TABLE)
    .select(
      `id, ${DATE_COLUMN}, ${TIME_COLUMN}, ${IS_AVAILABLE_COLUMN}, ${CLIENT_ID_COLUMN}`
    )
    .eq(DATE_COLUMN, date)
    .eq(IS_AVAILABLE_COLUMN, true)
    .is(CLIENT_ID_COLUMN, null)
    .order(TIME_COLUMN, { ascending: true });

  if (filterError) {
    console.error("[get-slots] filtered query", filterError);
    return NextResponse.json({ status: "error", message: filterError.message }, { status: 500 });
  }

  const slots = (Array.isArray(rows) ? rows : []).map((r) => ({
    time: r[TIME_COLUMN as keyof typeof r] as string,
    id: r.id,
  }));

  return NextResponse.json({ status: "ok", slots });
}
